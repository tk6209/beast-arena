import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const manifest = JSON.parse(readFileSync(resolve("docs/production/CAPYNITE_DELIVERY_MANIFEST.json"), "utf8"));
const expected = { concepts: 96, rigged_characters: 12, arenas: 5, abilities: 24, animation_clips: 144, webgl_release: 1 };
const counts = Object.fromEntries(Object.keys(expected).map(k => [k, 0]));
const ids = new Set();
for (const item of manifest.items) {
  if (ids.has(item.id)) throw new Error("Duplicate: " + item.id);
  ids.add(item.id);
  if (!(item.type in counts)) throw new Error("Unknown type: " + item.type);
  counts[item.type]++;
  if (!["TODO", "IN_REVIEW", "APPROVED"].includes(item.status)) throw new Error("Invalid state: " + item.id);
  if (item.status === "APPROVED") {
    if (!item.artifact || !item.source_sha || !item.review || !item.tests?.length)
      throw new Error("Unproven APPROVED asset: " + item.id);
    if (item.tests.some(t => t.status !== "PASS" || !t.evidence))
      throw new Error("Unproven test: " + item.id);
  }
}
for (const [type, count] of Object.entries(expected)) {
  if (counts[type] !== count) throw new Error(`Wrong count for ${type}: ${counts[type]} vs ${count}`);
}
console.log("Capynite manifest structure GREEN: " + manifest.items.length + " planned items.");
console.log("Assets proven APPROVED: " + manifest.items.filter(i=>i.status==="APPROVED").length + "/" + manifest.items.length);
