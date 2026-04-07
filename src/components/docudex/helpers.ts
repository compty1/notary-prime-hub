import { stripHtml } from "@/lib/sanitize";
import type { PageData } from "./types";

export function uid() { return crypto.randomUUID(); }

export function wordCount(html: string): number {
  const text = stripHtml(html).trim();
  return text ? text.split(/\s+/).length : 0;
}

export function charCount(pages: PageData[]): number {
  return pages.reduce((sum, p) => sum + stripHtml(p.html).length, 0);
}

export function readTime(words: number): string {
  const m = Math.ceil(words / 200);
  return m < 1 ? "< 1 min" : `${m} min`;
}

export function readabilityScore(text: string): { score: number; level: string } {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  
  if (words.length === 0 || sentences.length === 0) return { score: 0, level: "N/A" };
  
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  const score = Math.round(206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord);
  
  let level = "Very Difficult";
  if (score >= 90) level = "Very Easy";
  else if (score >= 80) level = "Easy";
  else if (score >= 70) level = "Fairly Easy";
  else if (score >= 60) level = "Standard";
  else if (score >= 50) level = "Fairly Difficult";
  else if (score >= 30) level = "Difficult";
  
  return { score: Math.max(0, Math.min(100, score)), level };
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}
