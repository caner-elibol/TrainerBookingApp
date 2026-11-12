export const MOCK_NAMES = [
  "Ahmet Yılmaz",
  "Deniz Kaya",
  "Selin Arslan",
  "Burak Korkmaz",
  "Melis Şahin",
  "Zeynep Arslan",
  "İlayda Çetin",
  "Emre Demir",
] as const;

export const MOCK_SERVICES = ["Birebir Fitness", "Reformer Pilates", "Mat Pilates", "Online Koçluk"] as const;

export function mockServiceFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return MOCK_SERVICES[hash % MOCK_SERVICES.length];
}
