/* ─── Haptic Feedback ─── */

export function hapticLight() {
  try { navigator.vibrate?.(15); } catch {}
}

export function hapticMedium() {
  try { navigator.vibrate?.(40); } catch {}
}

export function hapticHeavy() {
  try { navigator.vibrate?.(80); } catch {}
}

export function hapticSuccess() {
  try { navigator.vibrate?.([30, 50, 60]); } catch {}
}

export function hapticError() {
  try { navigator.vibrate?.([50, 30, 50, 30, 80]); } catch {}
}

export function hapticExplosion() {
  try { navigator.vibrate?.([20, 20, 40, 30, 80, 20, 120]); } catch {}
}
