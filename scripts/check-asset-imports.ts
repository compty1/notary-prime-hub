#!/usr/bin/env tsx
/**
 * Walks the source tree and verifies every imported asset path
 * (e.g. `from "@/assets/foo.png"`) resolves to a file on disk.
 *
 * Wired into `prebuild` so the production build fails fast if an
 * asset import is broken or stale.
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";

const ROOT = resolve(process.cwd());
const SRC = join(ROOT, "src");

const IMPORT_RE =
  /(?:from|import)\s+["']([^"']+\.(?:png|jpe?g|webp|avif|svg|gif|mp4|webm|m4v|woff2?|ttf|otf|pdf))["']/g;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(entry)) out.push(p);
  }
  return out;
}

function resolveImport(spec: string, fromFile: string): string | null {
  if (spec.startsWith("@/")) return join(SRC, spec.slice(2));
  if (spec.startsWith(".")) return resolve(dirname(fromFile), spec);
  return null; // bare package import — not an asset
}

const broken: { file: string; spec: string; resolved: string }[] = [];
const files = walk(SRC);

for (const file of files) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(IMPORT_RE)) {
    const spec = m[1];
    const r = resolveImport(spec, file);
    if (r && !existsSync(r)) broken.push({ file, spec, resolved: r });
  }
}

if (broken.length) {
  console.error(`\n❌ Broken asset imports (${broken.length}):\n`);
  for (const b of broken) {
    console.error(`  • ${b.file.replace(ROOT + "/", "")}`);
    console.error(`      → ${b.spec}`);
    console.error(`      (resolved: ${b.resolved.replace(ROOT + "/", "")})\n`);
  }
  process.exit(1);
}

console.log(`✓ ${files.length} source files scanned, all asset imports resolve.`);
