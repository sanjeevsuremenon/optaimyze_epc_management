#!/usr/bin/env node
/**
 * Migrates hardcoded slate/cyan Tailwind classes to semantic app-* tokens.
 * Safe for page shells and shared UI — review gradient/card exceptions manually if needed.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const TARGET_DIRS = [
  path.join(ROOT, "pages"),
  path.join(ROOT, "components"),
];

const REPLACEMENTS = [
  ["min-h-screen bg-slate-950 text-slate-100", "app-page min-h-screen"],
  ["min-h-screen bg-slate-900 text-slate-200", "app-page min-h-screen"],
  ["min-h-screen bg-slate-900 text-slate-100", "app-page min-h-screen"],
  ["min-h-screen bg-slate-950", "app-page min-h-screen"],
  ["min-h-screen bg-slate-900", "app-page min-h-screen"],
  ["flex flex-col bg-slate-900 min-h-screen text-slate-200", "app-page min-h-screen flex flex-col"],
  ["bg-slate-900/80", "bg-app-surface/80"],
  ["bg-slate-900/90", "bg-app-surface/90"],
  ["bg-slate-900/95", "bg-app-surface/95"],
  ["bg-slate-900/60", "bg-app-surface-muted/80"],
  ["bg-slate-900/50", "bg-app-surface-muted"],
  ["bg-slate-900/40", "bg-app-surface-muted"],
  ["bg-slate-900/30", "bg-app-surface-muted"],
  ["bg-slate-950/80", "bg-app-surface-muted"],
  ["bg-slate-950/70", "bg-app-surface-muted"],
  ["bg-slate-800/50", "bg-app-surface-muted"],
  ["bg-slate-800/60", "bg-app-surface-muted"],
  ["bg-slate-800 rounded-lg shadow-xl border border-slate-700", "app-card shadow-md"],
  ["bg-slate-800 border border-slate-700", "app-card"],
  ["bg-slate-800 rounded-xl", "app-card rounded-xl"],
  ["border border-slate-800", "border border-app-border"],
  ["border-b border-slate-800", "border-b border-app-border"],
  ["border-t border-slate-800", "border-t border-app-border"],
  ["border-r border-slate-800", "border-r border-app-border"],
  ["border border-slate-700", "border border-app-border"],
  ["border-b border-slate-700", "border-b border-app-border"],
  ["border-t border-slate-700", "border-t border-app-border"],
  ["divide-slate-700", "divide-app-border"],
  ["divide-slate-800", "divide-app-border"],
  ["text-slate-100", "text-app-text"],
  ["text-slate-200", "text-app-text"],
  ["text-slate-300", "text-app-text-secondary"],
  ["text-slate-400", "text-app-text-muted"],
  ["text-slate-500", "text-app-text-muted"],
  ["text-cyan-300", "text-app-accent"],
  ["text-cyan-400", "text-app-accent"],
  ["hover:text-cyan-300", "hover:text-app-accent"],
  ["hover:text-cyan-400", "hover:text-app-accent"],
  ["bg-cyan-500", "bg-app-accent"],
  ["bg-cyan-600", "bg-app-accent"],
  ["hover:bg-cyan-500", "hover:bg-app-accent-hover"],
  ["hover:bg-cyan-400", "hover:bg-app-accent-hover"],
  ["hover:bg-cyan-600", "hover:bg-app-accent-hover"],
  ["border-cyan-500", "border-app-accent"],
  ["ring-cyan-500", "ring-app-accent"],
  ["focus:ring-cyan-500", "focus:ring-app-accent"],
  ["focus:border-cyan-500", "focus:border-app-accent"],
  ["bg-slate-800", "bg-app-surface"],
  ["bg-slate-900", "bg-app-surface"],
  ["bg-slate-950", "bg-app-bg"],
  ["hover:bg-slate-800", "hover:bg-app-surface-muted"],
  ["hover:bg-slate-700", "hover:bg-app-surface-muted"],
  ["hover:bg-slate-750", "hover:bg-app-surface-muted"],
];

const SKIP_FILES = new Set([
  "ModuleCard.js",
  "theme-script.js",
]);

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

let changed = 0;
for (const dir of TARGET_DIRS) {
  for (const file of walk(dir)) {
    let content = fs.readFileSync(file, "utf8");
    let next = content;
    for (const [from, to] of REPLACEMENTS) {
      next = next.split(from).join(to);
    }
    if (next !== content) {
      fs.writeFileSync(file, next, "utf8");
      changed += 1;
      console.log("updated:", path.relative(ROOT, file));
    }
  }
}

console.log(`Done. ${changed} files updated.`);
