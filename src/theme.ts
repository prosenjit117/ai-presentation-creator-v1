import { createTheme, type MantineColorsTuple } from "@mantine/core";

// Mix helper: blend hex with white/black to produce a 10-shade ramp
function hexToRgb(hex: string): [number, number, number] {
  const v = hex.replace("#", "");
  const n = parseInt(v, 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}
function rgbToHex(r: number, g: number, b: number): string {
  const c = (x: number) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}
function mix(hex: string, target: [number, number, number], amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (target[0] - r) * amount, g + (target[1] - g) * amount, b + (target[2] - b) * amount);
}
function ramp(base: string): MantineColorsTuple {
  const white: [number, number, number] = [255, 255, 255];
  const black: [number, number, number] = [0, 0, 0];
  return [
    mix(base, white, 0.92),
    mix(base, white, 0.84),
    mix(base, white, 0.7),
    mix(base, white, 0.55),
    mix(base, white, 0.38),
    mix(base, white, 0.2),
    base,
    mix(base, black, 0.15),
    mix(base, black, 0.3),
    mix(base, black, 0.45),
  ] as MantineColorsTuple;
}

// AppDirect brand color ramps (Mantine 7 expects a 10-tuple per color name).
export const appdirectTheme = createTheme({
  primaryColor: "royal",
  primaryShade: 6,
  defaultRadius: "md",
  fontFamily:
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  headings: {
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontWeight: "600",
  },
  colors: {
    navy: ramp("#011B58"),
    royal: ramp("#0629D3"),
    sky: ramp("#ABE7FF"),
    mint: ramp("#CDFDDA"),
    forest: ramp("#014929"),
    coral: ramp("#F2555A"),
    marigold: ramp("#FFA000"),
    purple: ramp("#5326A5"),
  },
});
