/* Haptic feedback — vendorizado e enxuto para o CapiRocket Dash. */

export function hapticLight(): void {
  try {
    navigator.vibrate?.(12);
  } catch {
    /* sem suporte — ignora */
  }
}

export function hapticHeavy(): void {
  try {
    navigator.vibrate?.([30, 40, 70]);
  } catch {
    /* sem suporte — ignora */
  }
}
