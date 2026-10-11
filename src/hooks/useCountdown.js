import { useEffect, useState } from "react";

export function useCountdown(targetMs) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, targetMs - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { diff, days, hours, minutes, seconds };
}

const DEFAULT_IN_VIEW_OPTIONS = { threshold: 0.15 };

export function useInView(options = DEFAULT_IN_VIEW_OPTIONS) {
  const [ref, setRef] = useState(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setInView(true)),
      options
    );
    obs.observe(ref);
    return () => obs.disconnect();
  }, [ref, options]);
  return [setRef, inView];
}
