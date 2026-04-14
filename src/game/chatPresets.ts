/**
 * Quick chat preset messages for battle.
 */

export interface ChatPreset {
  emoji: string;
  text: string;
  key: string;
}

export const CHAT_PRESETS: ChatPreset[] = [
  { emoji: "🍀", text: "Boa sorte!", key: "gl" },
  { emoji: "👏", text: "Boa jogada!", key: "gj" },
  { emoji: "💪", text: "Vamos!", key: "go" },
  { emoji: "😮", text: "Uau!", key: "wow" },
  { emoji: "🤝", text: "GG!", key: "gg" },
  { emoji: "😅", text: "Quase!", key: "close" },
  { emoji: "⚔️", text: "Ataca agora!", key: "atk" },
  { emoji: "🛡️", text: "Defenda!", key: "def" },
  { emoji: "😬", text: "Ops!", key: "ops" },
  { emoji: "😂", text: "Haha!", key: "haha" },
  { emoji: "🔥", text: "Incrível!", key: "fire" },
  { emoji: "🎯", text: "Bem jogado!", key: "wp" },
];

export const CHAT_COOLDOWN_MS = 4000;
