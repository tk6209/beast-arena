import React, { useEffect, useRef, useState } from "react";

interface ScreenTransitionProps {
  children: React.ReactNode;
  screenKey: string; // change this to trigger transition
  type?: "fade" | "slideUp" | "slideLeft" | "zoom" | "battle";
}

const TRANSITION_STYLES: Record<string, { enter: string; exit: string }> = {
  fade: {
    enter: "opacity:0",
    exit: "opacity:0",
  },
  slideUp: {
    enter: "opacity:0;transform:translateY(32px)",
    exit: "opacity:0;transform:translateY(-16px)",
  },
  slideLeft: {
    enter: "opacity:0;transform:translateX(40px)",
    exit: "opacity:0;transform:translateX(-40px)",
  },
  zoom: {
    enter: "opacity:0;transform:scale(0.92)",
    exit: "opacity:0;transform:scale(1.06)",
  },
  battle: {
    enter: "opacity:0;transform:scale(1.08)",
    exit: "opacity:0;transform:scale(0.92)",
  },
};

export default function ScreenTransition({
  children,
  screenKey,
  type = "slideUp",
}: ScreenTransitionProps) {
  const [phase, setPhase] = useState<"enter" | "visible" | "exit">("enter");
  const prevKey = useRef(screenKey);

  useEffect(() => {
    if (screenKey === prevKey.current) {
      // First mount
      setPhase("enter");
      const t = requestAnimationFrame(() => {
        requestAnimationFrame(() => setPhase("visible"));
      });
      return () => cancelAnimationFrame(t);
    }

    // Key changed — exit then enter
    setPhase("exit");
    const exitTimer = setTimeout(() => {
      prevKey.current = screenKey;
      setPhase("enter");
      const enterTimer = requestAnimationFrame(() => {
        requestAnimationFrame(() => setPhase("visible"));
      });
      return () => cancelAnimationFrame(enterTimer);
    }, 200);

    return () => clearTimeout(exitTimer);
  }, [screenKey]);

  const style = TRANSITION_STYLES[type] || TRANSITION_STYLES.slideUp;

  const inlineStyle: React.CSSProperties = {
    transition: "opacity 0.22s ease, transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
    willChange: "opacity, transform",
    ...(phase === "enter"
      ? Object.fromEntries(
          style.enter.split(";").map((s) => {
            const [k, v] = s.split(":");
            return [k.trim(), v?.trim()];
          })
        )
      : phase === "exit"
      ? Object.fromEntries(
          style.exit.split(";").map((s) => {
            const [k, v] = s.split(":");
            return [k.trim(), v?.trim()];
          })
        )
      : { opacity: 1, transform: "none" }),
  };

  return <div style={inlineStyle}>{children}</div>;
}
