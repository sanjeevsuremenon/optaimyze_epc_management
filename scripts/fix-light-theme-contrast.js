#!/usr/bin/env node
/**
 * Fix light-theme contrast: replace hardcoded light text colors with semantic app-* tokens.
 * Skips lines that are clearly on colored/gradient backgrounds (buttons, cards).
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const TARGET_DIRS = [path.join(ROOT, "pages"), path.join(ROOT, "components")];

const SKIP_FILES = new Set(["ModuleCard.js"]);

const COLORED_BG_PATTERN =
  /gradient|bg-app-accent|bg-cyan|bg-emerald|bg-red-|bg-blue-|bg-green-|bg-indigo|bg-purple|bg-rose-|bg-amber|from-sky|from-blue|from-green|from-emerald|from-cyan|to-blue|to-emerald|text-slate-950|text-black|text-app-accent-text/;

function shouldSkipLine(line) {
  return COLORED_BG_PATTERN.test(line);
}

const LINE_REPLACEMENTS = [
  [/\btext-white\b/g, "text-app-text"],
  [/\btext-slate-100\b/g, "text-app-text"],
  [/\btext-slate-200\b/g, "text-app-text"],
  [/\btext-slate-300\b/g, "text-app-text-secondary"],
  [/\btext-gray-100\b/g, "text-app-text"],
  [/\btext-gray-200\b/g, "text-app-text"],
  [/\btext-gray-300\b/g, "text-app-text-secondary"],
  [/\bplaceholder-slate-600\b/g, "placeholder-app-text-disabled"],
  [/\bplaceholder-slate-500\b/g, "placeholder-app-text-disabled"],
  [/\bplaceholder-slate-400\b/g, "placeholder-app-text-disabled"],
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "api" || entry.name === "node_modules") continue;
      walk(full, files);
    } else if (/\.(js|jsx|tsx)$/.test(entry.name) && !SKIP_FILES.has(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function fixFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  let changed = false;

  const nextLines = lines.map((line) => {
    if (shouldSkipLine(line)) {
      // Still fix text-white on same line as gradient? skip entire line for safety
      // But headings with text-white alone should be fixed
      if (!/\btext-white\b/.test(line) && !/\btext-slate-1/.test(line) && !/\btext-slate-2/.test(line) && !/\btext-slate-3/.test(line)) {
        return line;
      }
      if (COLORED_BG_PATTERN.test(line) && !/\bh[1-6]\b|<h[1-6]|font-bold text-white|font-semibold text-white/.test(line)) {
        return line;
      }
    }

    let next = line;
    for (const [pattern, replacement] of LINE_REPLACEMENTS) {
      const updated = next.replace(pattern, replacement);
      if (updated !== next) next = updated;
    }
    if (next !== line) changed = true;
    return next;
  });

  if (changed) {
    fs.writeFileSync(filePath, nextLines.join("\n"), "utf8");
    return true;
  }
  return false;
}

let count = 0;
for (const dir of TARGET_DIRS) {
  for (const file of walk(dir)) {
    if (fixFile(file)) {
      count += 1;
      console.log("fixed:", path.relative(ROOT, file));
    }
  }
}

console.log(`Contrast fix complete. ${count} files updated.`);
