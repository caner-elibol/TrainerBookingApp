export const PHONE_PLACEHOLDER = "5xx xxx xx xx";
export const PHONE_INVALID_MESSAGE = "Geçerli bir GSM numarası gir (5xx xxx xx xx).";

const ALLOWED_PREFIXES = new Set(["", "0", "90", "0090"]);

export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, "");
  if (digits.length < 10) return null;

  const significant = digits.slice(-10);
  const prefix = digits.slice(0, -10);
  if (!ALLOWED_PREFIXES.has(prefix) || !significant.startsWith("5")) return null;
  return significant;
}

export function formatPhone(value: string | null | undefined): string {
  if (!value) return "";
  const n = normalizePhone(value);
  if (!n) return value;
  return groupPhoneDigits(n);
}

export function groupPhoneDigits(digits: string): string {
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 8), digits.slice(8, 10)].filter(Boolean).join(" ");
}

export interface PhoneInputParse {
  digits: string;
  droppedPrefixDigits: number;
  acceptable: boolean;
}

export function parsePhoneInput(raw: string): PhoneInputParse {
  const all = raw.replace(/\D/g, "");
  let digits = all;

  if (digits.startsWith("0090")) digits = digits.slice(4);
  else if (digits.startsWith("90") && digits.length > 10) digits = digits.slice(2);
  digits = digits.replace(/^0+/, "");

  const droppedPrefixDigits = all.length - digits.length;
  return {
    digits: digits.slice(0, 10),
    droppedPrefixDigits,
    acceptable: digits === "" || digits.startsWith("5"),
  };
}

export function isCompletePhone(value: string): boolean {
  return normalizePhone(value) !== null;
}
