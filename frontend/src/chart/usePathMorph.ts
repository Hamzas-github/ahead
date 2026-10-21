import { useLayoutEffect, useRef } from "react";
import { interpolatePath } from "d3-interpolate-path";

// Only the brief update transition changes path geometry. Reveal and loading
// animations use composited transforms, opacity and stroke-dashoffset.
export function usePathMorph(target: string, enabled: boolean) {
  const ref = useRef<SVGPathElement>(null);
  const previous = useRef("");
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const from = previous.current;
    previous.current = target;
    if (
      !enabled ||
      !from ||
      !target ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      node.setAttribute("d", target);
      return;
    }
    const interpolate = interpolatePath(from, target);
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 500);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      node.setAttribute("d", interpolate(eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    node.setAttribute("d", from);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, enabled]);
  return ref;
}
