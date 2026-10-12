// evals/rta-eval-set.ts
// Eval set for the Ontario tenancy agent.
// Sections verified against the RTA, 2006 text (S.O. 2006, c. 17).
// Before trusting results, spot-check each cited subsection against your
// current e-Laws PDF: the Act is amended over time.
//
// Scoring idea per case:
//   - every `mustCite` section appears in the answer        (citation recall)
//   - no `mustNotCite` section appears                      (wrong-rule check)
//   - every `mustMention` keyword appears (case-insensitive) (content check)
//   - no `mustNotSay` phrase appears                         (hallucination check)
//   - every cited section exists in the retrieved chunks     (grounding check)

export type EvalCase = {
  id: string;
  source: 'today' | 'core' | 'guardrail';
  history?: { role: 'user' | 'assistant'; content: string }[];
  question: string;
  expected: string; // reference answer, plain language
  mustCite: string[]; // e.g. "26(3)"; matched loosely: "s. 26 (3)", "26(3)"
  mustNotCite?: string[];
  mustMention?: string[];
  mustNotSay?: string[];
  notes?: string;
};

export const evalSet: EvalCase[] = [
  // ───────────── Today's cases (real failures and passes) ─────────────
  {
    id: 'today-01-rent-increase-notice',
    source: 'today',
    question: 'How much notice does a landlord need to give for a rent increase?',
    expected:
      'At least 90 days written notice (s. 116(1)). An increase without proper notice is void, and the landlord must give a new notice before taking it (s. 116(4)).',
    mustCite: ['116(1)', '116(4)'],
    mustMention: ['90 days', 'written', 'void'],
    notes: 'Passed on first try. Keep as a regression check.',
  },
  {
    id: 'today-02-entry-general',
    source: 'today',
    question: 'How much notice does my landlord need to enter my unit?',
    expected:
      'Generally at least 24 hours written notice, for reasons listed in s. 27(1). The notice must state the reason, the day, and a time between 8 a.m. and 8 p.m. (s. 27(3)). No written notice is needed in an emergency or if the tenant consents at the time of entry (s. 26(1)).',
    mustCite: ['27(1)', '27(3)', '26(1)'],
    mustMention: ['24 hours', '8 a.m.', '8 p.m.', 'emergency', 'consent'],
    mustNotSay: ['24 hours written notice before entering your rental unit to show it to prospective tenants'],
    notes: 'Failed: claimed 24h notice applies to showing prospective tenants and missed the 8-8 window.',
  },
  {
    id: 'today-03-show-to-new-renters',
    source: 'today',
    question: 'How much notice does my landlord need to show my unit to new renters?',
    expected:
      'No written notice is required if the tenancy is ending (agreement or notice of termination given), entry is between 8 a.m. and 8 p.m., and the landlord informs or makes a reasonable effort to inform the tenant first (s. 26(3)).',
    mustCite: ['26(3)'],
    mustNotCite: ['27(2)'],
    mustMention: ['without written notice', '8 a.m.', '8 p.m.', 'reasonable effort'],
    notes: 'Failed: cited 27(2), which covers potential purchasers, not prospective tenants.',
  },
  {
    id: 'today-04-followup-with-history',
    source: 'today',
    history: [
      { role: 'user', content: 'How much notice does my landlord need to show my unit to new renters?' },
      {
        role: 'assistant',
        content:
          'Your landlord must provide at least 24 hours written notice before entering your rental unit to show it to prospective tenants (RTA s. 27 (2)).',
      },
    ],
    question: 'what if i agreed to terminate the lease ?',
    expected:
      'If you and the landlord agreed to end the tenancy, the landlord may enter without written notice to show the unit to prospective tenants, between 8 a.m. and 8 p.m., after informing or making a reasonable effort to inform you (s. 26(3)). The earlier answer citing s. 27(2) was wrong.',
    mustCite: ['26(3)'],
    mustNotCite: ['27(2)'],
    mustMention: ['8 a.m.', 'reasonable effort'],
    mustNotSay: ["couldn't find"],
    notes:
      'Failed: answered "I couldn\'t find that". Tests query rewriting and that retrieval overrides a wrong earlier answer.',
  },
  {
    id: 'today-05-standalone-rewrite',
    source: 'today',
    question:
      'Can a landlord enter without notice to show the unit to prospective tenants after the tenancy is terminated?',
    expected: 'Yes, under s. 26(3), if all three conditions are met: termination agreed or noticed, 8 a.m. to 8 p.m., and the tenant informed or a reasonable effort made.',
    mustCite: ['26(3)'],
    mustNotCite: ['26(5)'],
    mustMention: ['8 a.m.', 'reasonable effort'],
    notes: 'Passed in a fresh chat, but invented a citation to s. 26(5).',
  },
  {
    id: 'today-06-end-lease-early',
    source: 'today',
    question: 'What are my options if i want to end my lease early in ontario ?',
    expected:
      'Main options: (1) agree with the landlord to end the tenancy, no notice needed (s. 37(3)); (2) assign the lease with the landlord\'s consent (s. 95); if the landlord refuses or does not respond within 7 days, you may give notice to end the tenancy within 30 days (s. 95(4), s. 96); (3) sublet, but you stay responsible to the landlord (s. 97(4)). If the landlord has served a notice for own use or renovation, you can leave earlier with at least 10 days notice (s. 48(3)-(4), s. 50(4)-(5)). Disputes over repairs or harassment go through a Board application, not a unilateral move-out.',
    mustCite: ['37(3)', '95', '97'],
    mustMention: ['agree', 'assign', 'sublet', '7 days', '30 days'],
    mustNotSay: ['without penalty'],
    notes:
      'Failed: missed assignment and subletting entirely; overstated harassment/repairs as grounds to leave. A fear-of-abuse notice also exists in the current Act; add it once you confirm the section in your PDF.',
  },
  {
    id: 'today-07-fake-subsection',
    source: 'today',
    question: 'What does section 26(5) of the Residential Tenancies Act say?',
    expected:
      'Section 26 has only subsections (1) to (3): emergency or consent, housekeeping, and showing to prospective tenants. There is no s. 26(5).',
    mustCite: [],
    mustMention: ['(1)', '(3)'],
    mustNotSay: ['26(5) states', '26 (5) states', 'under s. 26(5)'],
    notes: 'Hallucination trap. The agent invented 26(5) earlier today.',
  },

  // ───────────── Core 20 ─────────────
  {
    id: 'core-01-12-month-rule',
    source: 'core',
    question: 'How often can my landlord raise my rent?',
    expected:
      'Only once every 12 months: at least 12 months since the last increase, or since the tenant first moved in if there has been none (s. 119(1)). 90 days written notice is still required (s. 116(1)).',
    mustCite: ['119(1)'],
    mustMention: ['12 months'],
  },
  {
    id: 'core-02-above-guideline',
    source: 'core',
    question: 'Can my landlord increase my rent by more than the guideline?',
    expected:
      'Not during the tenancy, except with a Board order for an above-guideline increase (s. 126/127) or an agreement under s. 121 or s. 123 (s. 120(1)). An agreed increase under s. 121 is capped at guideline plus 3% and the tenant can cancel in writing within 5 days (s. 121(3)-(4)).',
    mustCite: ['120(1)'],
    mustMention: ['guideline'],
    notes: 'Do not let the agent state a specific guideline percentage unless it is in the knowledge base.',
  },
  {
    id: 'core-03-damage-deposit',
    source: 'core',
    question: 'Can my landlord ask for a damage deposit?',
    expected:
      'No. The only security deposit a landlord may collect is a rent deposit (s. 105(1)), and it cannot exceed one month\'s rent or one rent period, whichever is less (s. 106(2)).',
    mustCite: ['105(1)', '106(2)'],
    mustMention: ['rent deposit'],
  },
  {
    id: 'core-04-deposit-interest',
    source: 'core',
    question: 'Do I get interest on my last month\'s rent deposit?',
    expected:
      'Yes. The landlord must pay interest annually at the rent increase guideline rate (s. 106(6)). If the landlord does not pay it, the tenant may deduct it from a later rent payment (s. 106(9)).',
    mustCite: ['106(6)', '106(9)'],
    mustMention: ['annually', 'guideline'],
  },
  {
    id: 'core-05-deposit-use',
    source: 'core',
    question: 'Can my landlord use my last month\'s rent deposit to pay for damage?',
    expected:
      'The Act requires the rent deposit to be applied to rent for the last rental period before the tenancy ends (s. 106(10)). Damage claims are a separate matter (s. 34, s. 89).',
    mustCite: ['106(10)'],
    mustMention: ['last'],
    notes: 'Keep the answer to what the Act says; do not predict a Board outcome.',
  },
  {
    id: 'core-06-post-dated-cheques',
    source: 'core',
    question: 'My landlord says I must give post-dated cheques or set up automatic payments. Is that allowed?',
    expected:
      'No. Neither the landlord nor the lease can require post-dated cheques or automatic payments for rent (s. 108). The tenant may choose to offer them.',
    mustCite: ['108'],
    mustMention: ['post-dated', 'automatic'],
  },
  {
    id: 'core-07-rent-receipt',
    source: 'core',
    question: 'Does my landlord have to give me a receipt for rent?',
    expected:
      'Yes, free of charge, on request, for rent, a rent deposit, arrears, or any other amount paid (s. 109(1)). A former tenant can request one within 12 months after the tenancy ends (s. 109(2)).',
    mustCite: ['109(1)'],
    mustMention: ['free', 'request'],
  },
  {
    id: 'core-08-wear-and-tear',
    source: 'core',
    question: 'Can my landlord charge me for normal wear and tear when I move out?',
    expected:
      'The tenant is responsible for repairing undue damage caused wilfully or negligently by the tenant, another occupant, or a guest (s. 34). The Act does not make the tenant responsible for ordinary wear and tear; maintaining the unit in good repair is the landlord\'s duty (s. 20(1)).',
    mustCite: ['34', '20(1)'],
    mustMention: ['undue damage', 'wilful', 'negligent'],
    notes: 'The phrase "wear and tear" does not appear in s. 34; this tests whether retrieval finds it by meaning.',
  },
  {
    id: 'core-09-repairs-known-before',
    source: 'core',
    question: 'I knew the unit needed repairs when I moved in. Does my landlord still have to fix them?',
    expected:
      'Yes. The landlord must keep the unit in a good state of repair and fit for habitation (s. 20(1)), even if the tenant knew of the problem before signing (s. 20(2)).',
    mustCite: ['20(1)', '20(2)'],
    mustMention: ['good state of repair'],
  },
  {
    id: 'core-10-vital-services',
    source: 'core',
    question: 'My landlord shut off my heat to pressure me. Is that legal?',
    expected:
      'No. A landlord must not withhold or deliberately interfere with the reasonable supply of a vital service they are obliged to supply (s. 21(1)). Harassment and coercion are also prohibited (s. 23). The tenant can apply to the Board (s. 29(1)).',
    mustCite: ['21(1)'],
    mustMention: ['vital service'],
  },
  {
    id: 'core-11-landlord-changes-locks',
    source: 'core',
    question: 'My landlord changed the locks and didn\'t give me a key. What does the law say?',
    expected:
      'A landlord may not alter the locking system during the tenancy without giving the tenant replacement keys (s. 24). The tenant can apply to the Board (s. 29(1), paragraph 5), which can order the landlord to let the tenant back in if the unit is vacant (s. 31(3)).',
    mustCite: ['24'],
    mustMention: ['replacement keys'],
  },
  {
    id: 'core-12-tenant-changes-locks',
    source: 'core',
    question: 'Can I change the locks on my apartment?',
    expected:
      'Not without the landlord\'s consent (s. 35(1)). If you do, the Board can order you to give the landlord keys or pay the cost of changing the locks (s. 35(3)).',
    mustCite: ['35(1)'],
    mustMention: ['consent'],
  },
  {
    id: 'core-13-lease-expires',
    source: 'core',
    question: 'My one-year lease is ending. Do I have to move out or sign a new lease?',
    expected:
      'Neither. If a fixed-term lease ends without being renewed or terminated, it is deemed renewed as a month-to-month tenancy on the same terms (s. 38(1)).',
    mustCite: ['38(1)'],
    mustMention: ['month'],
    mustNotSay: ['must sign a new lease', 'have to move out'],
  },
  {
    id: 'core-14-monthly-notice',
    source: 'core',
    question: 'I rent month to month. How much notice do I have to give to move out?',
    expected:
      'At least 60 days, with the termination date on the last day of a rental period (s. 44(2), s. 47). Daily or weekly tenancies need 28 days (s. 44(1)).',
    mustCite: ['44(2)'],
    mustMention: ['60 days', 'last day'],
  },
  {
    id: 'core-15-fixed-term-notice',
    source: 'core',
    question: 'I have a fixed-term lease. How do I give notice that I\'m leaving when it ends?',
    expected:
      'Give notice at least 60 days before the expiry date in the lease, effective on that expiry date (s. 44(4), s. 47).',
    mustCite: ['44(4)'],
    mustMention: ['60 days', 'expir'],
  },
  {
    id: 'core-16-landlord-own-use',
    source: 'core',
    question: 'My landlord says they want to move into my unit. How much notice do they need, and can I leave sooner?',
    expected:
      'A landlord may end the tenancy in good faith for their own use, or for a spouse, child, parent, or certain caregivers (s. 48(1)). The termination date must be at least 60 days after notice and fall on the end of a rental period or fixed term (s. 48(2)). The tenant may leave earlier by giving at least 10 days notice (s. 48(3)-(4)).',
    mustCite: ['48(1)', '48(2)', '48(3)'],
    mustMention: ['good faith', '60 days', '10 days'],
    notes: 'Checks that the 10-day rule is tied to receiving a landlord notice, not presented as a general early-exit option.',
  },
  {
    id: 'core-17-renoviction',
    source: 'core',
    question: 'My landlord wants me out to do major renovations. What are my rights?',
    expected:
      'A landlord may give notice for repairs so extensive they need a building permit and vacant possession (s. 50(1)(c)), with at least 120 days notice ending on a period or term end (s. 50(2)). The tenant has a right of first refusal to move back at the same lawful rent if they notify the landlord in writing before moving out (s. 53). In complexes with 5+ units, compensation may apply (s. 54).',
    mustCite: ['50(1)', '50(2)', '53'],
    mustMention: ['120 days', 'first refusal', 'building permit'],
  },
  {
    id: 'core-18-no-pets',
    source: 'core',
    question: 'My lease says no pets. Can my landlord evict me for having a cat?',
    expected:
      'A lease clause prohibiting animals is void (s. 14). The Board can only evict over an animal in limited cases, such as substantial interference, a serious allergic reaction, or an inherently dangerous animal (s. 76(1)).',
    mustCite: ['14'],
    mustMention: ['void'],
    notes: 'Condo declarations can have separate rules; the agent should not overgeneralize beyond the Act.',
  },
  {
    id: 'core-19-lockout-unpaid-rent',
    source: 'core',
    question: 'I\'m behind on rent. Can my landlord lock me out or take my things?',
    expected:
      'No. A landlord cannot recover possession unless the tenant has left or the Board has issued an eviction order (s. 39), and cannot seize a tenant\'s property for unpaid rent without legal process (s. 40). For non-payment, the landlord gives a notice with at least 14 days for monthly tenancies (s. 59(1)), and the notice is void if the tenant pays the arrears before the landlord applies to the Board (s. 59(3)).',
    mustCite: ['39', '40', '59'],
    mustMention: ['eviction order', '14'],
  },
  {
    id: 'core-20-assignment-no-response',
    source: 'core',
    question: 'I asked my landlord to let me assign my lease and they never replied. What can I do?',
    expected:
      'If the landlord does not respond within 7 days of the request, or refuses, you may give a notice of termination within 30 days after the request (s. 95(4)). The termination date must be at least the lesser of the normal notice period and 30 days (s. 96(2)).',
    mustCite: ['95(4)', '96'],
    mustMention: ['7 days', '30 days'],
  },

  // ───────────── Guardrails ─────────────
  {
    id: 'guard-01-predict-outcome',
    source: 'guardrail',
    question: 'My landlord kept my deposit. Will I win if I go to the Landlord and Tenant Board?',
    expected:
      'The agent should not predict an outcome. It can explain the relevant rules (e.g. s. 106) and point to the Landlord and Tenant Board or a legal clinic for advice on the specific case.',
    mustCite: [],
    mustMention: ['Landlord and Tenant Board'],
    mustNotSay: ['you will win', 'you will likely win', 'you will lose'],
  },
  {
    id: 'guard-02-out-of-scope',
    source: 'guardrail',
    question: 'How much notice does a commercial landlord need to give to end a store lease?',
    expected:
      'Out of scope: the RTA covers residential tenancies. The agent should say it cannot answer from its documents rather than guess.',
    mustCite: [],
    mustNotSay: ['60 days', '90 days'],
  },
];
