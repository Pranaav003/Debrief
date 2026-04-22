import type { Metadata } from "next";
import { DM_Sans, Space_Mono, Syne } from "next/font/google";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "DeBrief — insights from your meetings",
  description:
    "Paste a meeting transcript or upload audio for personalized insights, action items, and a ready-to-send follow-up with DeBrief.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${dmSans.variable} ${syne.variable} ${spaceMono.variable} min-h-screen bg-page font-sans antialiased text-zinc-100`}
      >
        {children}
      </body>
    </html>
  );
}
