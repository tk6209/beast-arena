import React from "react";

interface QRCodeProps {
  valor: string;
  tam?: number;
}

export default function QRCode({ valor, tam = 160 }: QRCodeProps) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${tam}x${tam}&data=${encodeURIComponent(valor)}&bgcolor=050d1a&color=00e5ff&qzone=1`;

  return (
    <img
      src={url}
      alt="QR"
      style={{
        width: tam,
        height: tam,
        borderRadius: 12,
        border: "2px solid #00e5ff",
        display: "block",
        boxShadow: "0 0 24px rgba(0,229,255,.18)",
      }}
    />
  );
}
