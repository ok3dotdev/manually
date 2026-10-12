// Structure-aware chunker for Ontario statutes (e-Laws layout), e.g. the
// Residential Tenancies Act, 2006.
//
// One chunk per subsection (or per section when it has no subsections).
// Each chunk's content starts with a citation header such as
//   [RTA s. 26(3)] Part III > Entry without notice > Entry to show rental unit to prospective tenants
// so the embedding carries the topic, and the model sees the real section
// number instead of guessing it.

export type LegalChunk = {
  section: string; // "26", "47.1"
  subsection: string | null; // "3", or null for sections without subsections
  citation: string; // "s. 26(3)"
  heading: string | null; // marginal note, e.g. "Entry to show rental unit to prospective tenants"
  part: string | null; // "Part III"
  content: string; // header line + statute text
};

type Options = {
  docLabel?: string; // short label used in citations, e.g. "RTA"
  maxChars?: number; // split very long subsections at clause boundaries
};

// "26 (1) A landlord..." / "47.1 (1) Despite..."
const SECTION_WITH_SUB = /^(\d+(?:\.\d+)?)\s*\((\d+(?:\.\d+)?)\)\s+(?=[A-Z])/;
// "25 A landlord may enter..." (section with no subsections)
const SECTION_ONLY = /^(\d+(?:\.\d+)?)\s+(?=[A-Z])/;
// "(3) A landlord may..." (next subsection of the current section)
const SUB_ONLY = /^\((\d+(?:\.\d+)?)\)\s+(?=[A-Z])/;
// "PART III" / "PART III RESPONSIBILITIES OF LANDLORDS"
const PART = /^PART\s+([IVXLC]+(?:\.\d+)?)\b\s*(.*)$/;
// "(a) ..." / "1. ..." / "i. ..." clause lines, used for splitting long chunks
const CLAUSE = /^(\([a-z]+(?:\.\d+)?\)|\d+\.|[ivx]+\.)\s/;

const compareSectionNumbers = (a: string, b: string) => {
  const [aMain, aSub = '0'] = a.split('.');
  const [bMain, bSub = '0'] = b.split('.');
  return Number(aMain) - Number(bMain) || Number(aSub) - Number(bSub);
};

// Could this line be a marginal note? Confirmed only if a section or
// subsection starts right after it (see markHeadings).
const isHeadingCandidate = (line: string) =>
  line.length <= 90 &&
  /^[A-Z]/.test(line) &&
  !/[,;:]$/.test(line) &&
  !SECTION_WITH_SUB.test(line) &&
  !SECTION_ONLY.test(line) &&
  !SUB_ONLY.test(line) &&
  !CLAUSE.test(line) &&
  !PART.test(line);

const startsUnit = (line: string) =>
  SECTION_WITH_SUB.test(line) || SECTION_ONLY.test(line) || SUB_ONLY.test(line);

// Walk backwards: a candidate is a heading if the next line starts a unit
// or is itself a confirmed heading (headings can stack).
const markHeadings = (lines: string[]) => {
  const flags = new Array<boolean>(lines.length).fill(false);
  for (let i = lines.length - 2; i >= 0; i--) {
    const next = lines[i + 1];
    flags[i] = isHeadingCandidate(lines[i]) && (startsUnit(next) || flags[i + 1]);
  }
  return flags;
};

// Drop repeated page furniture: "Page 23" and short lines (running headers,
// footers) that repeat many times across the document. A repeated line right
// before a section or subsection is a marginal note ("Same" appears 137 times
// in the RTA), not furniture, so it stays.
const stripPageFurniture = (lines: string[]) => {
  const counts = new Map<string, number>();
  for (const l of lines) if (l.length <= 80) counts.set(l, (counts.get(l) ?? 0) + 1);
  return lines.filter(
    (l, i) =>
      !/^Page \d+( of \d+)?$/i.test(l) &&
      !(l.length <= 80 && (counts.get(l) ?? 0) >= 5 && !startsUnit(lines[i + 1] ?? '')),
  );
};

// Skip the table of contents. TOC entries like "5.1 Other exemption from Act"
// look like section starts, and walking them pushes the section counter to the
// end of the Act, so every real section afterwards fails the forward-only
// check. TOC entries never carry a subsection number, so the body begins at
// the last PART line before the first "NN (N)" line.
const skipToBody = (lines: string[]) => {
  const firstSub = lines.findIndex(l => SECTION_WITH_SUB.test(l));
  if (firstSub <= 0) return lines;
  const partLine = lines.slice(0, firstSub).findLastIndex(l => PART.test(l));
  return partLine >= 0 ? lines.slice(partLine) : lines;
};

// Heuristic: does this text look like an e-Laws statute?
export const looksLikeStatute = (text: string) => {
  const lines = text.split('\n').map(l => l.trim());
  const sectionLines = lines.filter(l => SECTION_WITH_SUB.test(l)).length;
  return sectionLines >= 10 && /\d{4}, c\. \d+/.test(text);
};

export const chunkStatute = (
  text: string,
  { docLabel = 'Act', maxChars = 2000 }: Options = {},
): LegalChunk[] => {
  const lines = stripPageFurniture(
    skipToBody(
      text
        .split('\n')
        .map(l => l.replace(/\s+/g, ' ').trim())
        .filter(l => l.length > 0),
    ),
  );
  const headingFlags = markHeadings(lines);

  const chunks: LegalChunk[] = [];
  let part: string | null = null;
  let section: string | null = null;
  let pendingHeadings: string[] = [];
  let sectionHeading: string | null = null;
  let current: { section: string; subsection: string | null; heading: string | null; lines: string[] } | null =
    null;

  const flush = () => {
    if (!current || current.lines.length === 0) return;
    const citation = current.subsection
      ? `s. ${current.section}(${current.subsection})`
      : `s. ${current.section}`;
    const path = [part, sectionHeading !== current.heading ? sectionHeading : null, current.heading]
      .filter(Boolean)
      .join(' > ');
    const header = `[${docLabel} ${citation}]${path ? ` ${path}` : ''}`;

    for (const body of splitLong(current.lines, maxChars)) {
      chunks.push({
        section: current.section,
        subsection: current.subsection,
        citation,
        heading: current.heading,
        part,
        content: `${header}\n${body}`,
      });
    }
    current = null;
  };

  // e-Laws reuses "Same" / "Same, housekeeping" for follow-on subsections.
  // Resolve those so each chunk's header still names its topic.
  let lastHeading: string | null = null;
  const takeHeading = () => {
    let heading = pendingHeadings.at(-1) ?? null;
    pendingHeadings = [];
    if (heading === 'Same') heading = lastHeading;
    else if (heading?.startsWith('Same, ')) heading = heading.slice('Same, '.length);
    if (heading) lastHeading = heading;
    return heading;
  };

  let expectPartTitle = false;
  for (const [i, line] of lines.entries()) {
    const partMatch = line.match(PART);
    if (partMatch) {
      flush();
      part = `Part ${partMatch[1]}${partMatch[2] ? ` ${titleCase(partMatch[2])}` : ''}`;
      expectPartTitle = !partMatch[2];
      pendingHeadings = [];
      continue;
    }
    // e-Laws puts the part title on its own all-caps line after "PART III".
    if (expectPartTitle && line === line.toUpperCase() && /[A-Z]/.test(line)) {
      part = `${part} ${titleCase(line)}`;
      expectPartTitle = false;
      continue;
    }
    expectPartTitle = false;

    const withSub = line.match(SECTION_WITH_SUB);
    const sectionOnly = !withSub ? line.match(SECTION_ONLY) : null;
    const newSection = withSub?.[1] ?? sectionOnly?.[1];

    // Only accept a new section number if it moves forward; this filters out
    // wrapped lines that happen to start with a number.
    if (newSection && (section === null || compareSectionNumbers(newSection, section) > 0)) {
      flush();
      section = newSection;
      // When two headings stack ("Entry without notice" then
      // "Entry without notice, emergency, consent"), the first is the
      // section's group heading and the last is this subsection's note.
      sectionHeading = pendingHeadings.length > 1 ? pendingHeadings[0] : null;
      const heading = takeHeading();
      sectionHeading = sectionHeading ?? heading;
      current = { section, subsection: withSub?.[2] ?? null, heading, lines: [line] };
      continue;
    }

    const sub = line.match(SUB_ONLY);
    if (sub && section !== null) {
      flush();
      current = { section, subsection: sub[1], heading: takeHeading(), lines: [line] };
      continue;
    }

    if (headingFlags[i]) {
      pendingHeadings.push(line);
      continue;
    }

    current?.lines.push(line);
  }
  flush();
  return chunks;
};

const titleCase = (s: string) =>
  s.toLowerCase().replace(/\b([a-z])/g, (_, c: string) => c.toUpperCase()).replace(/\b(And|Of|The|To|In)\b/g, w => w.toLowerCase());

// Split an oversized subsection at clause boundaries; each piece keeps the
// subsection's opening line so it still reads in context.
const splitLong = (lines: string[], maxChars: number): string[] => {
  const full = lines.join('\n');
  if (full.length <= maxChars) return [full];

  const [lead, ...rest] = lines;
  const pieces: string[] = [];
  let buf: string[] = [];
  let len = lead.length;
  for (const line of rest) {
    if (buf.length > 0 && CLAUSE.test(line) && len + line.length > maxChars) {
      pieces.push([lead, ...buf].join('\n'));
      buf = [];
      len = lead.length;
    }
    buf.push(line);
    len += line.length + 1;
  }
  if (buf.length > 0) pieces.push([lead, ...buf].join('\n'));
  return pieces;
};
