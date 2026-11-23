/**
 * Person and meeting lights: every person and meeting gets one soft color,
 * picked from a hash of a stable key, so it never changes between visits.
 */
export const LIGHTS = [
  { name: "amber", hex: "#E8A25B", rgb: "232 162 91" },
  { name: "coral", hex: "#E57A6A", rgb: "229 122 106" },
  { name: "rose", hex: "#D27CA6", rgb: "210 124 166" },
  { name: "iris", hex: "#8D86E6", rgb: "141 134 230" },
  { name: "azure", hex: "#5C9EE8", rgb: "92 158 232" },
  { name: "teal", hex: "#4DB6A6", rgb: "77 182 166" },
  { name: "moss", hex: "#93B66C", rgb: "147 182 108" },
  { name: "sand", hex: "#CDB27C", rgb: "205 178 124" },
] as const;

export type Light = (typeof LIGHTS)[number];

function hash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function lightFor(key: string | undefined | null): Light {
  return LIGHTS[hash(key || "visualvibe") % LIGHTS.length];
}

/** CSS for a soft glow of a light, e.g. on a camera-off tile. */
export function glowBackground(light: Light, strength = 0.28, base = "#17181B") {
  return `radial-gradient(circle at 50% 44%, rgb(${light.rgb} / ${strength}), rgb(${light.rgb} / 0) 62%), ${base}`;
}

/** A lit sphere used as a meeting's identity mark. */
export function orbBackground(light: Light) {
  return `radial-gradient(circle at 38% 34%, color-mix(in srgb, ${light.hex} 35%, white) 0%, ${light.hex} 52%, color-mix(in srgb, ${light.hex} 60%, black) 100%)`;
}
