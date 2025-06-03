export const generatePastelColor = (): string => {
  const hue = Math.floor(Math.random() * 360);
  // For dark theme, pastel colors should be lighter and less saturated
  // compared to light theme pastels to ensure they pop against dark backgrounds.
  // Let's aim for lightness around 70-80% and saturation around 40-60% for dark theme.
  // These are different from typical "pastel" which are high lightness, low saturation.
  // Material Design uses "Surface Tones" for dark themes. Let's try a different approach to get "pop"
  // Using high saturation and medium lightness can work on dark themes.
  const saturation = Math.floor(Math.random() * 20) + 65; // 65-85%
  const lightness = Math.floor(Math.random() * 15) + 55; // 55-70%

  // Convert HSL to HEX
  const s = saturation / 100;
  const l = lightness / 100;
  const k = (n: number) => (n + hue / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
};
