/** Client-side hint; backend still normalizes. Ghana: leading 0 → +233 */
export function normalizePhoneHint(input: string): string {
  let s = input.replace(/\s|-/g, "");
  if (s.startsWith("0")) {
    s = "+233" + s.slice(1);
  }
  if (s && !s.startsWith("+")) {
    s = `+${s}`;
  }
  return s;
}
