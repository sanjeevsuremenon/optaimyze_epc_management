const fs = require('fs');

const filePath = 'd:\\jalmmportal_redesigned\\pages\\vendor-dashboard\\index.js';
let content = fs.readFileSync(filePath, 'utf8');

// Theming replacements
const replacements = [
  { regex: /bg-slate-900\/5/g, replacement: 'bg-slate-950' },
  { regex: /bg-white\/80/g, replacement: 'bg-slate-900/80' },
  { regex: /bg-white\/90/g, replacement: 'bg-slate-900/90' },
  { regex: /bg-white\/95/g, replacement: 'bg-slate-900/95' },
  { regex: /bg-white/g, replacement: 'bg-slate-900' },
  { regex: /text-slate-900/g, replacement: 'text-white' },
  { regex: /text-gray-900/g, replacement: 'text-white' },
  { regex: /text-slate-800/g, replacement: 'text-slate-200' },
  { regex: /text-gray-700/g, replacement: 'text-slate-300' },
  { regex: /text-slate-700/g, replacement: 'text-slate-300' },
  { regex: /text-slate-600/g, replacement: 'text-slate-400' },
  { regex: /text-gray-600/g, replacement: 'text-slate-400' },
  { regex: /text-slate-500/g, replacement: 'text-slate-400' },
  { regex: /text-gray-500/g, replacement: 'text-slate-400' },
  { regex: /border-slate-100/g, replacement: 'border-slate-800' },
  { regex: /border-slate-200/g, replacement: 'border-slate-700' },
  { regex: /border-slate-300/g, replacement: 'border-slate-600' },
  { regex: /border-white\/70/g, replacement: 'border-slate-800' },
  { regex: /bg-blue-50\/70/g, replacement: 'bg-cyan-900/30' },
  { regex: /bg-blue-100/g, replacement: 'bg-cyan-900/50' },
  { regex: /text-blue-800/g, replacement: 'text-cyan-400' },
  { regex: /bg-blue-600/g, replacement: 'bg-cyan-600' },
  { regex: /hover:bg-blue-500/g, replacement: 'hover:bg-cyan-500' },
  { regex: /border-blue-200/g, replacement: 'border-cyan-800' },
  { regex: /border-blue-500/g, replacement: 'border-cyan-500' },
  { regex: /border-blue-600/g, replacement: 'border-cyan-600' },
  { regex: /ring-blue-500/g, replacement: 'ring-cyan-500' },
  { regex: /from-blue-50\/90/g, replacement: 'from-slate-900' },
  { regex: /to-violet-50\/80/g, replacement: 'to-slate-800' },
  { regex: /border-blue-100\/80/g, replacement: 'border-cyan-900/50' },
  { regex: /from-blue-700/g, replacement: 'from-cyan-400' },
  { regex: /to-violet-700/g, replacement: 'to-cyan-600' },
  { regex: /text-blue-600/g, replacement: 'text-cyan-400' },
  { regex: /text-blue-700/g, replacement: 'text-cyan-400' },
  { regex: /text-blue-900/g, replacement: 'text-white' },
  { regex: /from-blue-50/g, replacement: 'from-cyan-950/40' },
  { regex: /to-blue-100\/90/g, replacement: 'to-cyan-900/20' },
  { regex: /from-green-50/g, replacement: 'from-emerald-950/40' },
  { regex: /to-emerald-100\/90/g, replacement: 'to-emerald-900/20' },
  { regex: /text-green-600/g, replacement: 'text-emerald-400' },
  { regex: /text-green-900/g, replacement: 'text-emerald-100' },
  { regex: /bg-emerald-600/g, replacement: 'bg-emerald-600' },
  { regex: /bg-emerald-100\/80/g, replacement: 'bg-emerald-900/40' },
  { regex: /text-emerald-700/g, replacement: 'text-emerald-400' },
  { regex: /bg-violet-100\/80/g, replacement: 'bg-violet-900/40' },
  { regex: /text-violet-700/g, replacement: 'text-violet-400' },
  { regex: /bg-slate-50\/80/g, replacement: 'bg-slate-800/50' },
  { regex: /hover:bg-slate-50/g, replacement: 'hover:bg-slate-800' },
  // specific tweaks
  { regex: /rgba\(15,23,42,0\.18\)/g, replacement: 'rgba(0,0,0,0.4)' },
  { regex: /rgba\(15,23,42,0\.35\)/g, replacement: 'rgba(0,0,0,0.6)' },
  { regex: /rgba\(37,99,235,0\.12\)/g, replacement: 'rgba(6,182,212,0.1)' },
  { regex: /rgba\(37,99,235,0\.18\)/g, replacement: 'rgba(6,182,212,0.2)' },
  { regex: /rgba\(37,99,235,0\.32\)/g, replacement: 'rgba(6,182,212,0.15)' },
  { regex: /rgba\(37,99,235,0\.48\)/g, replacement: 'rgba(6,182,212,0.25)' },
  { regex: /rgba\(37,99,235,0\.45\)/g, replacement: 'rgba(6,182,212,0.3)' },
  { regex: /rgba\(37,99,235,0\.6\)/g, replacement: 'rgba(6,182,212,0.4)' },
  { regex: /rgba\(22,163,74,0\.3\)/g, replacement: 'rgba(16,185,129,0.15)' },
  { regex: /rgba\(22,163,74,0\.46\)/g, replacement: 'rgba(16,185,129,0.25)' },
  { regex: /rgba\(16,185,129,0\.45\)/g, replacement: 'rgba(16,185,129,0.3)' },
  { regex: /rgba\(255,255,255,0\.65\)/g, replacement: 'rgba(255,255,255,0.05)' },
  { regex: /rgba\(255,255,255,0\.9\)/g, replacement: 'rgba(255,255,255,0.1)' },
  { regex: /rgba\(59,130,246,0\.06\)/g, replacement: 'rgba(0,0,0,0.2)' }
];

let newContent = content;
replacements.forEach(r => {
  newContent = newContent.replace(r.regex, r.replacement);
});

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Vendor Dashboard themed successfully!');
