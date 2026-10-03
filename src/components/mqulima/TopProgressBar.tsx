import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

/**
 * High-performance top progress bar that reacts instantly (<16ms)
 * to any pending navigation in TanStack Router.
 */
export function TopProgressBar() {
  const isPending = useRouterState({
    select: (s) => s.status === "pending",
  });

  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timer1: any;
    let timer2: any;
    let timer3: any;

    if (isPending) {
      setVisible(true);
      setProgress(15);

      // Rapidly simulate initial progress
      timer1 = setTimeout(() => {
        setProgress(45);
      }, 60);

      timer2 = setTimeout(() => {
        setProgress(75);
      }, 180);

      timer3 = setTimeout(() => {
        setProgress(88);
      }, 350);
    } else {
      // Complete bar to 100% and fade out
      setProgress(100);
      const hideTimer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 200);

      return () => {
        clearTimeout(hideTimer);
      };
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isPending]);

  if (!visible && progress === 0) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none h-[3px] bg-transparent"
    >
      <div
        className="h-full bg-gradient-to-r from-[#16A34A] via-[#85CC14] to-[#F5A623] shadow-[0_0_12px_rgba(133,204,20,0.85)] transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
          transitionProperty: "width, opacity",
          transitionDuration: progress === 100 ? "150ms" : "200ms",
        }}
      />
    </div>
  );
}
