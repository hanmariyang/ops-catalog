"use client";

import { useEffect, useState } from "react";

export type ViewportSize = "sm" | "md" | "lg";

/**
 * 클라이언트 viewport size 감지.
 * SSR + 첫 hydration 동안은 'lg' 로 가정 (대부분 사용자가 데스크탑).
 * mount 후 실제 width 측정.
 */
export function useViewportSize(): {
  size: ViewportSize;
  mounted: boolean;
} {
  const [size, setSize] = useState<ViewportSize>("lg");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setSize(w < 640 ? "sm" : w < 1024 ? "md" : "lg");
    };
    update();
    setMounted(true);
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return { size, mounted };
}
