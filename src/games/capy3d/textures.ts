import * as THREE from "three";

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat = true): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

/** Sky gradient used as scene background. */
export function skyTexture(top: string, mid: string, horizon: string): THREE.CanvasTexture {
  return canvasTex(
    4,
    256,
    (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, top);
      gr.addColorStop(0.6, mid);
      gr.addColorStop(1, horizon);
      g.fillStyle = gr;
      g.fillRect(0, 0, 4, 256);
    },
    false,
  );
}

/** One track tile: gravel bed + wooden sleepers (rails are real geometry). */
export function trackTexture(): THREE.CanvasTexture {
  return canvasTex(256, 256, (g) => {
    g.fillStyle = "#8a7d72";
    g.fillRect(0, 0, 256, 256);
    let seed = 3;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 1800; i++) {
      const v = 95 + rnd() * 70;
      g.fillStyle = `rgb(${v + 10},${v},${v - 8})`;
      g.fillRect(rnd() * 256, rnd() * 256, 2 + rnd() * 3, 2 + rnd() * 3);
    }
    for (let y = 0; y < 256; y += 64) {
      g.fillStyle = "#5a3b25";
      g.fillRect(14, y + 18, 228, 26);
      g.fillStyle = "#74502f";
      g.fillRect(14, y + 18, 228, 7);
      g.fillStyle = "rgba(0,0,0,0.25)";
      g.fillRect(14, y + 44, 228, 5);
    }
  });
}

export function sidewalkTexture(): THREE.CanvasTexture {
  return canvasTex(128, 128, (g) => {
    g.fillStyle = "#d9cbb8";
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = "#b9a892";
    g.lineWidth = 3;
    for (let i = 0; i <= 128; i += 64) {
      g.beginPath();
      g.moveTo(0, i);
      g.lineTo(128, i);
      g.moveTo(i, 0);
      g.lineTo(i, 128);
      g.stroke();
    }
  });
}

/** Building facade: wall color + window grid; tiles once per 3 m x 3 m. */
export function facadeTexture(wall: string, trim: string, lit: string): THREE.CanvasTexture {
  return canvasTex(128, 128, (g) => {
    g.fillStyle = wall;
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = trim;
    g.fillRect(0, 118, 128, 10);
    for (const [x, y] of [
      [18, 22],
      [72, 22],
      [18, 70],
      [72, 70],
    ]) {
      g.fillStyle = "rgba(0,0,0,0.25)";
      g.fillRect(x - 3, y - 3, 44, 40);
      const gr = g.createLinearGradient(x, y, x + 38, y + 34);
      gr.addColorStop(0, lit);
      gr.addColorStop(1, "#2c4c6e");
      g.fillStyle = gr;
      g.fillRect(x, y, 38, 34);
      g.fillStyle = "rgba(255,255,255,0.55)";
      g.fillRect(x + 4, y + 4, 8, 22);
      g.fillStyle = trim;
      g.fillRect(x - 3, y + 34, 44, 5);
    }
  });
}

export function stripeTexture(a: string, b: string, n = 6): THREE.CanvasTexture {
  return canvasTex(128, 32, (g) => {
    g.fillStyle = a;
    g.fillRect(0, 0, 128, 32);
    g.fillStyle = b;
    const w = 128 / n;
    for (let i = -1; i < n + 1; i++) {
      g.beginPath();
      g.moveTo(i * w, 32);
      g.lineTo(i * w + w / 2, 0);
      g.lineTo(i * w + w, 0);
      g.lineTo(i * w + w / 2, 32);
      g.closePath();
      g.fill();
    }
  });
}

/** Train side: body color, white stripe, window band. Tiles every 3.5 m. */
export function trainSideTexture(body: string, stripe: string): THREE.CanvasTexture {
  return canvasTex(256, 128, (g) => {
    g.fillStyle = body;
    g.fillRect(0, 0, 256, 128);
    g.fillStyle = stripe;
    g.fillRect(0, 84, 256, 12);
    for (let x = 14; x < 256; x += 82) {
      g.fillStyle = "#1f2b3d";
      g.fillRect(x, 22, 60, 44);
      g.fillStyle = "rgba(160,220,255,0.55)";
      g.fillRect(x + 4, 26, 18, 36);
    }
    g.fillStyle = "rgba(0,0,0,0.25)";
    g.fillRect(0, 120, 256, 8);
  });
}

export function glowTexture(): THREE.CanvasTexture {
  return canvasTex(
    64,
    64,
    (g) => {
      const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      r.addColorStop(0, "rgba(255,255,255,1)");
      r.addColorStop(0.35, "rgba(255,255,255,0.5)");
      r.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = r;
      g.fillRect(0, 0, 64, 64);
    },
    false,
  );
}

export function starTexture(): THREE.CanvasTexture {
  return canvasTex(
    64,
    64,
    (g) => {
      g.translate(32, 32);
      g.fillStyle = "white";
      g.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 11 : 30;
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      g.closePath();
      g.fill();
    },
    false,
  );
}
