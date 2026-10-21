import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

/** Check real output shape; this does not pretend to compile Unity. */
export function verifyCapyniteWebGL(outputPath) {
  const root = resolve(outputPath);
  const buildPath = join(root, "Build");
  if (!existsSync(join(root, "index.html"))) throw new Error("WebGL index.html absent");
  if (!existsSync(buildPath) || !statSync(buildPath).isDirectory())
    throw new Error("Unity Build directory absent");
  const files = readdirSync(buildPath).filter(name => statSync(join(buildPath, name)).isFile());
  const suffixes = [
    { role: "wasm", pattern: /\.wasm(\.gz|\.br)?$/ },
    { role: "data", pattern: /\.data(\.gz|\.br)?$/ },
    { role: "framework", pattern: /\.framework\.js(\.gz|\.br)?$/ },
    { role: "loader", pattern: /\.loader\.js(\.gz|\.br)?$/ },
  ];
  for (const { role, pattern } of suffixes) {
    const artifact = files.find(f => pattern.test(f));
    if (!artifact) throw new Error("Unity " + role + " artifact absent");
    if (statSync(join(buildPath, artifact)).size === 0) throw new Error("Empty Unity " + role + " artifact");
  }
  const totalBytes = files.reduce((sum, f) => sum + statSync(join(buildPath, f)).size, 0);
  return { root, files, totalBytes, checked: suffixes.map(s => s.role) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const path = process.argv[2];
  if (!path) { console.error("Usage: node scripts/verify-capynite-webgl.mjs /path/to/Builds/CardBattleWebGL"); process.exitCode = 2; }
  else {
    try { console.log(JSON.stringify(verifyCapyniteWebGL(path), null, 2)); }
    catch (error) { console.error(error.message); process.exitCode = 1; }
  }
}
