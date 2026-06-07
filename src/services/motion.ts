let cursorWired = false;
let observer: IntersectionObserver | null = null;
const seen = new WeakSet<Element>();

function reveal(el: Element) {
  el.classList.add("in");
}

export function initMotion() {
  if (typeof window === "undefined") return;

  if (!cursorWired) {
    cursorWired = true;
    const root = document.documentElement;
    window.addEventListener("pointermove", (e) => {
      root.style.setProperty("--mx", e.clientX + "px");
      root.style.setProperty("--my", e.clientY + "px");
    });
  }

  const targets = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    targets.forEach(reveal);
    return;
  }
  if (!observer) {
    observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            reveal(entry.target);
            obs.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
  }
  targets.forEach((el) => {
    if (seen.has(el)) return;
    seen.add(el);
    observer!.observe(el);
  });
}
