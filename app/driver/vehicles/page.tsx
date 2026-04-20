"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Camera,
  Car,
  ClipboardList,
  Gauge,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import {
  DRIVER_VEHICLE_PACK_STORAGE_KEY,
  vehicleReadiness,
  type VehicleDto,
} from "@/lib/vehicle-profile";
import { createVehicle, deleteVehicle, listVehicles, updateVehicle } from "@/services/vehicles";

function persistVehiclePackForMechanicPreview(vehicles: VehicleDto[]) {
  const primary = vehicles.find((v) => v.is_primary) ?? vehicles[0];
  if (!primary) {
    localStorage.removeItem(DRIVER_VEHICLE_PACK_STORAGE_KEY);
    return;
  }
  const { score } = vehicleReadiness(primary);
  localStorage.setItem(
    DRIVER_VEHICLE_PACK_STORAGE_KEY,
    JSON.stringify({
      updatedAt: new Date().toISOString(),
      readiness: score,
      vehicle: primary,
      disclaimer:
        "Demo preview: mechanic job screen reads this local snapshot until job APIs attach real vehicle context.",
    }),
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-white/45">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#00E676]/45 dark:border-white/10 dark:bg-[#0f1727] dark:text-white dark:placeholder:text-white/30"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-white/45">
      {label}
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#00E676]/45 dark:border-white/10 dark:bg-[#0f1727] dark:text-white dark:placeholder:text-white/30"
      />
    </label>
  );
}

export default function VehiclesPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["vehicles"],
    queryFn: listVehicles,
  });

  const vehicles = data ?? [];

  useEffect(() => {
    if (!vehicles.length) return;
    persistVehiclePackForMechanicPreview(vehicles);
  }, [vehicles]);

  const fleetReadiness = useMemo(() => {
    if (!vehicles.length) return 0;
    const scores = vehicles.map((v) => vehicleReadiness(v).score);
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [vehicles]);

  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const createMut = useMutation({
    mutationFn: createVehicle,
    onSuccess: async () => {
      toast.success("Vehicle added.");
      setAddOpen(false);
      await qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
    onError: () => toast.error("Could not add vehicle."),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<VehicleDto> }) => updateVehicle(id, body),
    onSuccess: async () => {
      toast.success("Vehicle updated.");
      setEditId(null);
      await qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
    onError: () => toast.error("Could not update vehicle."),
  });

  const deleteMut = useMutation({
    mutationFn: deleteVehicle,
    onSuccess: async () => {
      toast.success("Vehicle removed.");
      await qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
    onError: () => toast.error("Could not delete vehicle."),
  });

  return (
    <div className="min-h-dvh px-4 pb-28 pt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-white/45">Fleet intelligence</p>
          <h1 className="font-sora text-4xl font-semibold text-slate-900 dark:text-white sm:text-5xl">Vehicles</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-white/60 sm:text-base">
            Build a deep vehicle profile over time. When you request help, your{" "}
            <span className="text-slate-900 dark:text-white">primary vehicle context</span> helps mechanics bring compatible parts
            first—fewer round trips.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/driver">
            <Button type="button" variant="ghost">
              Back to map
            </Button>
          </Link>
          <Button type="button" onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add vehicle
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <GlassCard className="border-slate-300/60 bg-white/90 dark:border-white/10 dark:bg-[#1b2739]/85 lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#163b34]">
                <Gauge className="h-6 w-6 text-[#8cf4b8]" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Fleet readiness</p>
                <p className="text-xs text-slate-600 dark:text-white/55">
                  Weighted score across identity + high-impact roadside fields (belt, battery, tires, VIN…).
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-sora text-4xl font-semibold text-[#00E676]">
                {isLoading ? "—" : `${fleetReadiness}%`}
              </p>
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-white/40">average</p>
            </div>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#00E676] to-emerald-700 transition-all"
              style={{ width: `${fleetReadiness}%` }}
            />
          </div>
          {fleetReadiness < 70 ? (
            <p className="mt-3 flex items-start gap-2 text-sm text-amber-200/90">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Your fleet profile is still thin for emergencies. Add VIN/engine + belt/battery/tire specs on your
              primary vehicle—this is what prevents “wrong part on arrival”.
            </p>
          ) : (
            <p className="mt-3 text-sm text-slate-600 dark:text-white/60">
              Strong profile. Keep updating after every service so history stays accurate.
            </p>
          )}
        </GlassCard>

        <GlassCard className="border-slate-300/60 bg-white/90 dark:border-white/10 dark:bg-[#1b2739]/85">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <Sparkles className="h-4 w-4 text-[#8ef7bb]" />
            Coming soon
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-white/65">
            <li>Photo + OCR capture for VIN/emission stickers</li>
            <li>Parts catalog hints from VIN/engine (belt routing)</li>
            <li>Maintenance timeline + receipts vault</li>
            <li>Mechanic-visible “parts checklist” per job category</li>
          </ul>
        </GlassCard>
      </div>

      {isError ? (
        <GlassCard className="mt-6 border-red-500/30 bg-red-950/30">
          <p className="text-sm text-red-100">
            Could not load vehicles: {(error as Error)?.message ?? "Unknown error"}
          </p>
          <p className="mt-2 text-xs text-red-100/70">
            If you are not logged in as a driver, open <span className="text-white">/auth/phone</span>.
          </p>
        </GlassCard>
      ) : null}

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <GlassCard className="flex min-h-64 flex-col items-center justify-center border-dashed border-slate-300/70 bg-white/85 text-center dark:border-white/15 dark:bg-[#212d40]/70">
          <span className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#00E676]/15">
            <Plus className="h-7 w-7 text-[#00E676]" />
          </span>
          <p className="font-sora text-2xl font-semibold text-slate-900 dark:text-white">Add vehicle</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-white/55">Start with basics, then deepen the profile anytime.</p>
          <Button className="mt-5" type="button" onClick={() => setAddOpen(true)}>
            Add vehicle
          </Button>
        </GlassCard>

        {vehicles.map((vehicle) => {
          const { score, missing } = vehicleReadiness(vehicle);
          return (
            <GlassCard key={vehicle.id} className="border-slate-300/60 bg-white/90 dark:border-white/10 dark:bg-[#212d40]/85 p-0">
              <div className="h-28 rounded-t-2xl bg-gradient-to-r from-[#1e353a] to-[#1d293c]" />
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {vehicle.is_primary ? (
                      <span className="rounded-full bg-[#1f5a49] px-2 py-1 text-[10px] uppercase tracking-wider text-[#92f5bd]">
                        Primary
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] uppercase tracking-wider text-slate-600 dark:bg-white/10 dark:text-white/55">
                        Secondary
                      </span>
                    )}
                    <p className="mt-2 font-sora text-2xl font-semibold text-slate-900 dark:text-white">
                      {vehicle.year ? `${vehicle.year} ` : ""}
                      {vehicle.make} {vehicle.model}
                    </p>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-white/55">
                      {[vehicle.trim, vehicle.color].filter(Boolean).join(" · ") || "Trim / color not set"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-sora text-3xl font-semibold text-[#00E676]">{score}%</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-white/40">readiness</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-300/70 bg-slate-50 p-3 text-xs text-slate-600 dark:border-white/10 dark:bg-black/25 dark:text-white/65">
                  <p className="font-semibold text-slate-800 dark:text-white/80">Top missing fields</p>
                  <p className="mt-1">
                    {missing.slice(0, 6).join(", ") || "Looks complete for the basics—add belt/VIN if you can."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="!px-2"
                      onClick={() => setEditId(vehicle.id)}
                      aria-label="Edit vehicle"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="!px-2 text-red-200 hover:text-red-100"
                      onClick={() => {
                        if (!window.confirm("Delete this vehicle?")) return;
                        deleteMut.mutate(vehicle.id);
                      }}
                      aria-label="Delete vehicle"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!vehicle.is_primary ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => updateMut.mutate({ id: vehicle.id, body: { is_primary: true } })}
                      >
                        Make primary
                      </Button>
                    ) : null}
                    <Button type="button" size="sm" onClick={() => setEditId(vehicle.id)}>
                      Edit details
                    </Button>
                  </div>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <GlassCard className="border-slate-300/60 bg-white/90 dark:border-white/10 dark:bg-[#1b2739]/85">
          <p className="flex items-center gap-3 font-semibold text-slate-900 dark:text-white">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#163b34]">
              <Car className="h-5 w-5 text-[#8cf4b8]" />
            </span>
            Privacy rule
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-white/65">
            Share only what helps diagnosis first: vehicle make/model/year, issue symptoms, and non-sensitive part specs.
            Avoid posting personal documents, home/work routines, or anything beyond what the mechanic needs to safely
            assist you.
          </p>
        </GlassCard>
        <GlassCard className="border-slate-300/60 bg-white/90 dark:border-white/10 dark:bg-[#1b2739]/85">
          <p className="flex items-center gap-3 font-semibold text-slate-900 dark:text-white">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#163b34]">
              <ClipboardList className="h-5 w-5 text-[#8cf4b8]" />
            </span>
            What to collect first
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-white/65">
            VIN (best), engine identifier, tire size, battery group, belt part number (or belt family), oil spec.
            Everything else is helpful but secondary.
          </p>
        </GlassCard>
      </div>

      {addOpen ? (
        <VehicleModal
          title="Add vehicle"
          loading={createMut.isPending}
          onClose={() => setAddOpen(false)}
          onSave={(body) => createMut.mutate(body)}
        />
      ) : null}

      {editId ? (
        <VehicleModal
          title="Edit vehicle"
          initial={vehicles.find((v) => v.id === editId)}
          loading={updateMut.isPending}
          onClose={() => setEditId(null)}
          onSave={(body) => updateMut.mutate({ id: editId, body })}
        />
      ) : null}
    </div>
  );
}

function VehicleModal({
  title,
  initial,
  loading,
  onClose,
  onSave,
}: {
  title: string;
  initial?: VehicleDto;
  loading: boolean;
  onClose: () => void;
  onSave: (body: Partial<VehicleDto> & Pick<VehicleDto, "make" | "model">) => void;
}) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [make, setMake] = useState(initial?.make ?? "");
  const [model, setModel] = useState(initial?.model ?? "");
  const [year, setYear] = useState(initial?.year ? String(initial.year) : "");
  const [trim, setTrim] = useState(initial?.trim ?? "");
  const [color, setColor] = useState(initial?.color ?? "");
  const [engine, setEngine] = useState(initial?.engine ?? "");
  const [licensePlate, setLicensePlate] = useState(initial?.license_plate ?? "");
  const [vin, setVin] = useState(initial?.vin ?? "");
  const [tireSize, setTireSize] = useState(initial?.tire_size ?? "");
  const [batteryGroup, setBatteryGroup] = useState(initial?.battery_group ?? "");
  const [beltPart, setBeltPart] = useState(initial?.belt_part_number ?? "");
  const [oilSpec, setOilSpec] = useState(initial?.oil_spec ?? "");
  const [coolant, setCoolant] = useState(initial?.coolant_type ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [isPrimary, setIsPrimary] = useState(Boolean(initial?.is_primary));

  function submit() {
    if (!make.trim() || !model.trim()) {
      toast.error("Make and model are required.");
      return;
    }
    const payload: Partial<VehicleDto> & Pick<VehicleDto, "make" | "model"> = {
      label: label.trim() || undefined,
      make: make.trim(),
      model: model.trim(),
      year: year ? Number(year) : undefined,
      trim: trim.trim() || undefined,
      color: color.trim() || undefined,
      engine: engine.trim() || undefined,
      license_plate: licensePlate.trim() || undefined,
      vin: vin.trim() || undefined,
      tire_size: tireSize.trim() || undefined,
      battery_group: batteryGroup.trim() || undefined,
      belt_part_number: beltPart.trim() || undefined,
      oil_spec: oilSpec.trim() || undefined,
      coolant_type: coolant.trim() || undefined,
      notes: notes.trim() || undefined,
      is_primary: isPrimary,
    };
    onSave(payload);
  }

  const preview = vehicleReadiness({
    id: initial?.id ?? "new",
    label,
    make,
    model,
    year: year ? Number(year) : undefined,
    trim,
    color,
    engine,
    license_plate: licensePlate,
    vin,
    tire_size: tireSize,
    battery_group: batteryGroup,
    belt_part_number: beltPart,
    oil_spec: oilSpec,
    coolant_type: coolant,
    notes,
    is_primary: isPrimary,
  });

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 p-3 sm:items-center">
      <GlassCard className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto border-slate-300/70 bg-white/95 dark:border-white/10 dark:bg-[#15243c]/95 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-white/45">{title}</p>
            <p className="mt-1 font-sora text-2xl font-semibold text-slate-900 dark:text-white">Vehicle profile</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-white/60">
              Readiness preview: <span className="text-[#00E676]">{preview.score}%</span>
            </p>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Field label="Nickname (optional)" value={label} onChange={setLabel} placeholder="Daily driver" />
          <label className="flex items-center gap-2 rounded-2xl border border-slate-300/70 bg-white px-3 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-[#0f1727] dark:text-white/80">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="h-4 w-4 accent-[#00E676]"
            />
            Set as primary vehicle
          </label>
          <Field label="Make *" value={make} onChange={setMake} placeholder="Toyota" />
          <Field label="Model *" value={model} onChange={setModel} placeholder="Camry" />
          <NumberField label="Year" value={year} onChange={setYear} placeholder="2019" />
          <Field label="Trim" value={trim} onChange={setTrim} placeholder="LE / XLE / Hybrid…" />
          <Field label="Color" value={color} onChange={setColor} placeholder="Silver" />
          <Field label="Engine" value={engine} onChange={setEngine} placeholder="2.5L / 1.8L hybrid…" />
          <Field label="License plate" value={licensePlate} onChange={setLicensePlate} />
          <Field label="VIN" value={vin} onChange={setVin} placeholder="17 characters" />
        </div>

        <div className="mt-6 rounded-2xl border border-slate-300/70 bg-slate-50 p-4 dark:border-white/10 dark:bg-black/25">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">High-impact roadside specs</p>
          <p className="mt-1 text-xs text-slate-600 dark:text-white/55">
            These are the fields that prevent incompatible parts on arrival (your fan belt story).
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Tire size" value={tireSize} onChange={setTireSize} placeholder="e.g. 225/45R18" />
            <Field label="Battery group" value={batteryGroup} onChange={setBatteryGroup} placeholder="e.g. H7, 24F" />
            <Field
              label="Fan belt part # (or family)"
              value={beltPart}
              onChange={setBeltPart}
              placeholder="If unknown, add in notes"
            />
            <Field label="Engine oil spec" value={oilSpec} onChange={setOilSpec} placeholder="e.g. 0W-20" />
            <Field label="Coolant type" value={coolant} onChange={setCoolant} placeholder="OAT / HOAT…" />
          </div>
        </div>

        <label className="mt-5 block text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-white/45">
          Notes (tow history, quirks, known repairs)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="mt-2 w-full resize-none rounded-2xl border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#00E676]/45 dark:border-white/10 dark:bg-[#0f1727] dark:text-white dark:placeholder:text-white/30"
            placeholder="Example: belt squeal under AC load; last belt change date; preferred brand…"
          />
        </label>

        <div className="mt-5 flex flex-col gap-2 rounded-2xl border border-dashed border-slate-300/70 bg-slate-50 p-4 text-sm text-slate-600 dark:border-white/15 dark:bg-white/5 dark:text-white/60">
          <p className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
            <Camera className="h-4 w-4 text-[#8ef7bb]" />
            Media capture
          </p>
          <p>
            Coming soon: upload photos of the engine bay sticker, belt routing label, and tire placard for OCR-assisted
            autofill.
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={loading}>
            {loading ? "Saving…" : initial ? "Save changes" : "Create vehicle"}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
