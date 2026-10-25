/**
 * Atualização do app pelo próprio jogador.
 *
 * O service worker (public/sw.js) guarda os arquivos do jogo para abrir rápido, então
 * um celular pode continuar rodando uma versão antiga depois de um deploy. Aqui:
 * - `entryScriptOf` lê qual bundle (/assets/index-<hash>.js) uma página HTML carrega;
 * - `checkForUpdate` compara o bundle publicado agora com o que está rodando;
 * - `forceUpdate` limpa service workers e caches e recarrega da rede.
 */

/** Caminho do script principal com hash que o HTML carrega (null se não achar). */
export function entryScriptOf(html: string): string | null {
  for (const tag of html.match(/<script\b[^>]*>/gi) ?? []) {
    if (!/\btype=["']module["']/i.test(tag)) continue;
    const src = tag.match(/\bsrc=["']([^"']+)["']/i);
    if (src) return src[1];
  }
  return null;
}

function runningEntry(): string | null {
  const el = document.querySelector<HTMLScriptElement>('script[type="module"][src]');
  if (!el) return null;
  try {
    return new URL(el.src, window.location.origin).pathname;
  } catch {
    return el.getAttribute("src");
  }
}

/** true quando o servidor já publica um bundle diferente do que está rodando. */
export async function checkForUpdate(): Promise<boolean> {
  const current = runningEntry();
  if (!current || current.startsWith("/src/")) return false; // dev server: sem bundle com hash
  try {
    const res = await fetch(`/?_v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return false;
    const published = entryScriptOf(await res.text());
    if (!published) return false;
    return new URL(published, window.location.origin).pathname !== current;
  } catch {
    return false; // offline: segue com a versão atual
  }
}

/** Apaga o cache do app e recarrega a página puxando tudo da rede. */
export async function forceUpdate(): Promise<void> {
  try {
    const regs = (await navigator.serviceWorker?.getRegistrations()) ?? [];
    await Promise.all(regs.map((r) => r.unregister()));
  } catch {
    /* sem service worker: nada a desregistrar */
  }
  try {
    const keys = (await window.caches?.keys()) ?? [];
    await Promise.all(keys.map((k) => window.caches.delete(k)));
  } catch {
    /* Cache API indisponível */
  }
  const url = new URL(window.location.href);
  url.searchParams.set("_v", String(Date.now()));
  window.location.replace(url.toString());
}
