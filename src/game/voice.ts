let vozesCarregadas = false;

export function falar(texto: string, prio = false) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  if (prio) window.speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(texto);
  u.lang = "pt-BR";
  u.rate = 1.05;
  u.pitch = 1.08;
  u.volume = 1;

  if (!vozesCarregadas) {
    window.speechSynthesis.onvoiceschanged = () => {
      vozesCarregadas = true;
    };
    window.speechSynthesis.getVoices();
  }

  const vozes = window.speechSynthesis.getVoices();
  const ptVoz = vozes.find((v) => v.lang?.startsWith("pt")) || vozes[0];
  if (ptVoz) u.voice = ptVoz;

  window.speechSynthesis.speak(u);
}
