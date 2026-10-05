/** Relative luminance (WCAG) of a `#rrggbb` colour. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Near-black or white — whichever reads better on the accent colour. */
export function readableOn(hex: string): string {
  const onDark = (1.05) / (luminance(hex) + 0.05);
  const onLight = (luminance(hex) + 0.05) / (luminance("#1b1a1a") + 0.05);
  return onLight >= onDark ? "#1b1a1a" : "#ffffff";
}
