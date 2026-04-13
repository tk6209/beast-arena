import React from "react";

export default function ChromeNoise() {
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 20% 10%, #00e5ff12 0%, transparent 22%), radial-gradient(circle at 80% 0%, #9c27b018 0%, transparent 26%), radial-gradient(circle at 50% 100%, #00e67610 0%, transparent 24%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.08,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "linear-gradient(to bottom, rgba(255,255,255,.65), rgba(255,255,255,.08))",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(255,255,255,.65), rgba(255,255,255,.08))",
        }}
      />
    </>
  );
}
