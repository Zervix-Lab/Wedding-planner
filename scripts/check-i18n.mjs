// Verifies that en.json and si.json have exactly the same keys, and that every t("key") used in the code exists.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const en = JSON.parse(readFileSync("locales/en.json", "utf8"));
const si = JSON.parse(readFileSync("locales/si.json", "utf8"));
let problems = 0;

for (const k of Object.keys(en)) if (!(k in si)) (console.log(`missing in si.json: ${k}`), problems++);
for (const k of Object.keys(si)) if (!(k in en)) (console.log(`missing in en.json: ${k}`), problems++);

// {placeholders} must match between languages
for (const k of Object.keys(en)) {
  if (!(k in si)) continue;
  const a = (en[k].match(/\{\w+\}/g) ?? []).sort().join();
  const b = (si[k].match(/\{\w+\}/g) ?? []).sort().join();
  if (a !== b) (console.log(`placeholder mismatch in ${k}: en[${a}] si[${b}]`), problems++);
}

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(f)) out.push(p);
  }
  return out;
}

const used = new Set();
for (const file of walk("src")) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(/\bt\(\s*["'`]([\w.]+)["'`]/g)) used.add(m[1]);
  for (const m of src.matchAll(/(?:toast\.(?:success|error)|fail)\(\s*["']([\w.]+)["']/g)) used.add(m[1]);
  for (const m of src.matchAll(/["'](err\.\w+)["']/g)) used.add(m[1]);
}
for (const k of used) if (!(k in en)) (console.log(`used in code but not defined: ${k}`), problems++);

console.log(problems ? `\n${problems} problem(s)` : `i18n OK: ${Object.keys(en).length} keys in both languages`);
process.exit(problems ? 1 : 0);
