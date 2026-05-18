#!/usr/bin/env node
/**
 * One-off: emit .webp + .avif siblings for every hero-*.png that
 * doesn't already have them. Lets all heroes flow through <Picture>.
 */
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const DIR = "src/assets";
const targets = readdirSync(DIR).filter((f) => /^hero-.*\.png$/.test(f));

let made = 0;
for (const f of targets) {
  const base = join(DIR, f.replace(/\.png$/, ""));
  const png = join(DIR, f);
  const tasks = [];
  if (!existsSync(`${base}.webp`)) {
    tasks.push(sharp(png).webp({ quality: 82 }).toFile(`${base}.webp`).then(() => made++));
  }
  if (!existsSync(`${base}.avif`)) {
    tasks.push(sharp(png).avif({ quality: 60 }).toFile(`${base}.avif`).then(() => made++));
  }
  await Promise.all(tasks);
}
console.log(`✓ generated ${made} variants across ${targets.length} hero PNGs.`);
