import { describe, expect, it } from "vitest";
import { entryScriptOf } from "./appUpdate";

describe("entryScriptOf", () => {
  it("acha o bundle com hash que o index.html publicado carrega", () => {
    const html = `<!doctype html><html><head>
      <script type="module" crossorigin src="/assets/index-Bx9k2.js"></script>
      <link rel="stylesheet" href="/assets/index-Cq1.css"></head><body></body></html>`;
    expect(entryScriptOf(html)).toBe("/assets/index-Bx9k2.js");
  });

  it("aceita atributos em outra ordem e aspas simples", () => {
    expect(entryScriptOf(`<script src='/assets/index-a1.js' type='module'></script>`)).toBe("/assets/index-a1.js");
  });

  it("sem script de módulo, não inventa versão", () => {
    expect(entryScriptOf("<html><body>oi</body></html>")).toBeNull();
  });
});
