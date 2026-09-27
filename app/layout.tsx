import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NavTabs } from "./nav-tabs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Manually — chat with your appliance manuals",
  description:
    "Upload the manuals that came with your place and ask them questions instead of digging through PDFs.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-zinc-200/70 bg-white/70 backdrop-blur-sm dark:border-zinc-800/70 dark:bg-zinc-900/40">
          <NavTabs />
        </header>
        {children}
      </body>
    </html>
  );
}
