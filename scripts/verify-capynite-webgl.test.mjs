import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { verifyCapyniteWebGL } from "./verify-capynite-webgl.mjs";

function fixture(cb) {
  const root = mkdtempSync(join(tmpdir(), "capynite-webgl-"));
  const build = join(root, "Build");
  mkdirSync(build);
  writeFileSync(join(root, "index.html"), "<html>Unity WebGL</html>");
  const paths = [
    "CardBattle.data.br", "CardBattle.wasm.br", "CardBattle.framework.js.br", "CardBattle.loader.js",
  ];
  for (const name of paths) writeFileSync(join(build, name), Buffer.from("build fixture"));
  try { cb({ root, build, paths }); }
  finally { rmSync(root, { recursive: true, force: true }); }
}

test("accepts structural WebGL outputs including Brotli assets", () => fixture(({ root }) => {
  const result = verifyCapyniteWebGL(root);
  assert.equal(result.checked.length, 4);
  assert.ok(result.totalBytes > 0);
}));

test("fails closed without a wasm asset", () => fixture(({ root, build }) => {
  rmSync(join(build, "CardBattle.wasm.br"));
  assert.throws(() => verifyCapyniteWebGL(root), /wasm artifact absent/);
}));

test("fails on empty bundle data", () => fixture(({ root, build }) => {
  writeFileSync(join(build, "CardBattle.data.br"), "");
  assert.throws(() => verifyCapyniteWebGL(root), /Empty Unity data artifact/);
}));

test("fails when index.html is absent", () => fixture(({ root }) => {
  rmSync(join(root, "index.html"));
  assert.throws(() => verifyCapyniteWebGL(root), /index.html absent/);
}));
