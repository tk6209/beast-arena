import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const index = readFileSync("src/pages/Index.tsx", "utf8");
const auth = readFileSync("src/components/game/screens/TelaAuth.tsx", "utf8");
describe("landing-only authentication entry contract", () => {
  it("guest account prompt returns to the landing rather than directly opening auth", () => {
    expect(index).toContain('onCriarConta={() => { setShowAccountPrompt(false); resetAll(); setTela("home"); }}');
  });
  it("OAuth and signup redirects use the actual current route, not a hardcoded path", () => {
    expect(auth).toContain('redirect_uri: window.location.href.split("?")[0].split("#")[0]');
    expect(auth).toContain('emailRedirectTo: window.location.href.split("?")[0].split("#")[0]');
    expect(auth).not.toContain('window.location.origin}/beast-arena');
  });
});
