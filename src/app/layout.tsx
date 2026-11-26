import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Adaptive AI Tutor — 12-Agent Curriculum, Socratic Tutoring & Mastery Platform",
  description:
    "Agentic learning platform with 12 GPT-4o agents for prerequisite DAG curriculum planning, Socratic tutoring, rubric assessment, and Bayesian Knowledge Tracing."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
