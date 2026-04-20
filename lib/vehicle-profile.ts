export type VehicleDto = {
  id: string;
  label?: string;
  make: string;
  model: string;
  year?: number | null;
  trim?: string;
  color?: string;
  engine?: string;
  license_plate?: string;
  vin?: string;
  tire_size?: string;
  battery_group?: string;
  belt_part_number?: string;
  oil_spec?: string;
  coolant_type?: string;
  notes?: string;
  is_primary?: boolean;
};

/** localStorage key: primary vehicle snapshot for mechanic UI demo until job APIs carry vehicle context */
export const DRIVER_VEHICLE_PACK_STORAGE_KEY = "autrifix-vehicle-pack";

export type VehiclePackSnapshot = {
  updatedAt: string;
  readiness: number;
  vehicle: VehicleDto;
  disclaimer?: string;
};

const WEIGHTS: Record<string, number> = {
  make: 6,
  model: 6,
  year: 5,
  trim: 3,
  color: 2,
  engine: 8,
  license_plate: 6,
  vin: 10,
  tire_size: 7,
  battery_group: 7,
  belt_part_number: 9,
  oil_spec: 4,
  coolant_type: 3,
  notes: 4,
};

export function vehicleReadiness(v: VehicleDto) {
  let earned = 0;
  const missing: string[] = [];

  const val = (k: keyof VehicleDto) => {
    const raw = v[k];
    if (raw === null || raw === undefined) return "";
    return String(raw).trim();
  };

  (Object.keys(WEIGHTS) as (keyof VehicleDto)[]).forEach((key) => {
    const s = val(key);
    if (s) earned += WEIGHTS[String(key)] ?? 0;
    else missing.push(String(key));
  });

  const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
  const score = Math.round((earned / total) * 100);
  return { score, missing };
}

export function missingForIssue(issueTag: string | null, v: VehicleDto) {
  const { missing } = vehicleReadiness(v);
  const want = new Set<string>();

  const add = (keys: string[]) => keys.forEach((k) => want.add(k));

  if (!issueTag) {
    add(["vin", "engine", "tire_size", "battery_group"]);
  } else if (issueTag === "engine") {
    add(["engine", "oil_spec", "coolant_type", "belt_part_number", "vin"]);
  } else if (issueTag === "tire") {
    add(["tire_size", "vin", "license_plate"]);
  } else if (issueTag === "battery") {
    add(["battery_group", "engine", "vin"]);
  } else if (issueTag === "accident") {
    add(["vin", "license_plate", "make", "model", "year"]);
  }

  return Array.from(want).filter((k) => missing.includes(k));
}
