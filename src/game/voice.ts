let vozesCarregadas = false;
let vozesReady: SpeechSynthesisVoice[] = [];

// Pre-load voices
if (typeof window !== "undefined" && window.speechSynthesis) {
  const loadVoices = () => {
    vozesReady = window.speechSynthesis.getVoices();
    vozesCarregadas = vozesReady.length > 0;
  };
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

// Queue: texts added async, spoken on next user gesture or immediately if gesture context is active
let pendingTexts: { texto: string; prio: boolean }[] = [];
let gestureActive = false;

export function falar(texto: string, prio = false) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  if (gestureActive) {
    speakNow(texto, prio);
  } else {
    // Queue it — will be spoken on next interaction
    pendingTexts.push({ texto, prio });
  }
}

function speakNow(texto: string, prio: boolean) {
  if (prio) window.speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(texto);
  u.lang = "pt-BR";
  u.rate = 1.05;
  u.pitch = 1.08;
  u.volume = 1;

  const vozes = window.speechSynthesis.getVoices();
  const ptVoz = vozes.find((v) => v.lang?.startsWith("pt")) || vozes[0];
  if (ptVoz) u.voice = ptVoz;

  window.speechSynthesis.speak(u);
}

/** Call this at the START of a click/tap handler, BEFORE any await */
export function markGesture() {
  gestureActive = true;

  // Flush any pending texts
  const pending = [...pendingTexts];
  pendingTexts = [];
  for (const p of pending) {
    speakNow(p.texto, p.prio);
  }

  // Reset after microtask (gesture context expires after current call stack)
  setTimeout(() => {
    gestureActive = false;
  }, 0);
}

/** 
 * Speak synchronously within a gesture context. 
 * Creates the utterance NOW, fills text later via returned setter.
 */
export function criarFalaGesture(): (texto: string) => void {
  if (typeof window === "undefined" || !window.speechSynthesis) return () => {};
  
  const u = new SpeechSynthesisUtterance("");
  u.lang = "pt-BR";
  u.rate = 1.05;
  u.pitch = 1.08;
  u.volume = 1;

  const vozes = window.speechSynthesis.getVoices();
  const ptVoz = vozes.find((v) => v.lang?.startsWith("pt")) || vozes[0];
  if (ptVoz) u.voice = ptVoz;

  return (texto: string) => {
    u.text = texto;
    window.speechSynthesis.speak(u);
  };
}
