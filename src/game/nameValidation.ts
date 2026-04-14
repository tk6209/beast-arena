/**
 * Display name validation utilities.
 */

const BLOCKED_WORDS = [
  "porra", "caralho", "merda", "puta", "viado", "buceta", "foda",
  "cuzao", "cuzão", "arrombado", "vagabundo", "idiota", "otario",
  "otário", "babaca", "imbecil", "retardado", "lixo", "nojento",
  "fdp", "pqp", "vsf", "tnc", "krl", "crl",
];

export interface NameValidationResult {
  valid: boolean;
  error?: string;
}

export function validateDisplayName(name: string): NameValidationResult {
  const trimmed = name.trim();

  if (trimmed.length < 3) {
    return { valid: false, error: "Nome deve ter pelo menos 3 caracteres." };
  }
  if (trimmed.length > 20) {
    return { valid: false, error: "Nome deve ter no máximo 20 caracteres." };
  }

  // Only allow letters, numbers, spaces, underscores, hyphens
  if (!/^[a-zA-ZÀ-ÿ0-9 _-]+$/.test(trimmed)) {
    return { valid: false, error: "Nome contém caracteres inválidos." };
  }

  // Check for consecutive spaces
  if (/\s{2,}/.test(trimmed)) {
    return { valid: false, error: "Nome não pode ter espaços consecutivos." };
  }

  // Check offensive words
  const lower = trimmed.toLowerCase();
  for (const word of BLOCKED_WORDS) {
    if (lower.includes(word)) {
      return { valid: false, error: "Nome contém linguagem inadequada." };
    }
  }

  return { valid: true };
}

export function normalizeDisplayName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Check if cooldown has passed (7 days) */
export function canChangeName(lastChanged: string | null): boolean {
  if (!lastChanged) return true;
  const diff = Date.now() - new Date(lastChanged).getTime();
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  return diff >= SEVEN_DAYS;
}

export function daysUntilNameChange(lastChanged: string | null): number {
  if (!lastChanged) return 0;
  const diff = Date.now() - new Date(lastChanged).getTime();
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  const remaining = SEVEN_DAYS - diff;
  return remaining <= 0 ? 0 : Math.ceil(remaining / (24 * 60 * 60 * 1000));
}
