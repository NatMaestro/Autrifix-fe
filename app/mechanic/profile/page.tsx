"use client";

import { Bell, CircleHelp, CircleUserRound, LocateFixed, MapPin, Plus, Star, Trash2, Wrench } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { listServiceCategories } from "@/services/services";
import { uploadAvatar } from "@/services/me";
import { useAuthStore } from "@/store/auth-store";
import {
  createMechanicService,
  deleteMechanicService,
  getMechanicProfile,
  listMechanicServices,
  patchMechanicProfile,
  type MechanicServiceOfferingDto,
} from "@/services/mechanics";

export default function MechanicProfilePage() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const patchUser = useAuthStore((s) => s.patchUser);
  const [creating, setCreating] = useState(false);
  const [editModal, setEditModal] = useState<null | "business_name" | "bio">(null);
  const [editValue, setEditValue] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [showToolsModal, setShowToolsModal] = useState(false);
  const [alertsSettings, setAlertsSettings] = useState({
    new_requests: true,
    chat_messages: true,
    cancellations: true,
    promotions: false,
  });
  const [tools, setTools] = useState<string[]>([]);
  const [toolInput, setToolInput] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationForm, setLocationForm] = useState({
    city: "",
    region: "",
    country: "Ghana",
  });
  const [workshopLocationLabel, setWorkshopLocationLabel] = useState<string>("");
  const [locatingNow, setLocatingNow] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    category: "",
    title: "",
    description: "",
    hourly_rate: "",
  });

  const profileQ = useQuery({
    queryKey: ["mechanic-profile", "page"],
    queryFn: getMechanicProfile,
    staleTime: 10_000,
  });
  const categoriesQ = useQuery({
    queryKey: ["service-categories"],
    queryFn: listServiceCategories,
    staleTime: 60_000,
  });
  const servicesQ = useQuery({
    queryKey: ["mechanic-services"],
    queryFn: listMechanicServices,
    staleTime: 10_000,
  });

  const createServiceMut = useMutation({
    mutationFn: () =>
      createMechanicService({
        category: serviceForm.category,
        title: serviceForm.title.trim() || undefined,
        description: serviceForm.description.trim() || undefined,
        hourly_rate: serviceForm.hourly_rate.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mechanic-services"] });
      setServiceForm({ category: "", title: "", description: "", hourly_rate: "" });
      setCreating(false);
      toast.success("Service created. Matching will use this service.");
    },
    onError: () => toast.error("Could not create service."),
  });

  const deleteServiceMut = useMutation({
    mutationFn: (id: string) => deleteMechanicService(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mechanic-services"] });
      toast.success("Service removed.");
    },
    onError: () => toast.error("Could not remove service."),
  });

  const profilePatchMut = useMutation({
    mutationFn: (body: { business_name?: string; bio?: string; service_radius_km?: number; base_latitude?: number; base_longitude?: number }) =>
      patchMechanicProfile(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mechanic-profile", "page"] });
      qc.invalidateQueries({ queryKey: ["mechanic-profile"] });
      toast.success("Profile updated.");
    },
    onError: () => toast.error("Could not update profile."),
  });

  const profile = profileQ.data;
  const services = servicesQ.data ?? [];
  const serviceCards = useMemo(() => services.filter((s) => s.is_active), [services]);

  function formatRate(item: MechanicServiceOfferingDto) {
    if (!item.hourly_rate) return "Rate not set";
    const amount = Number(item.hourly_rate);
    if (!Number.isFinite(amount)) return `₵${item.hourly_rate}/hr`;
    return `₵${amount.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/hr`;
  }

  function openEditModal(type: "business_name" | "bio") {
    setEditModal(type);
    setEditValue(type === "business_name" ? profile?.business_name || "" : profile?.bio || "");
  }

  function saveEditModal() {
    const next = editValue.trim();
    if (editModal === "business_name") {
      if (!next) {
        toast.error("Business name cannot be empty.");
        return;
      }
      profilePatchMut.mutate({ business_name: next });
    } else if (editModal === "bio") {
      profilePatchMut.mutate({ bio: editValue });
    }
    setEditModal(null);
    setEditValue("");
  }

  function onAvatarSelected(file: File | null) {
    setAvatarFile(file);
    if (!file) {
      setAvatarPreview(null);
      return;
    }
    setAvatarPreview(URL.createObjectURL(file));
  }

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [user?.avatar]);

  useEffect(() => {
    if (!user?.id) return;
    try {
      const raw = window.localStorage.getItem(`mechanic-alerts:${user.id}`);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<typeof alertsSettings>;
        setAlertsSettings((prev) => ({
          ...prev,
          ...parsed,
        }));
      }
      const rawTools = window.localStorage.getItem(`mechanic-tools:${user.id}`);
      if (rawTools) {
        const parsedTools = JSON.parse(rawTools);
        if (Array.isArray(parsedTools)) {
          setTools(parsedTools.filter((item): item is string => typeof item === "string"));
        }
      }
      const rawLocationLabel = window.localStorage.getItem(`mechanic-workshop-label:${user.id}`);
      if (rawLocationLabel) {
        setWorkshopLocationLabel(rawLocationLabel);
      }
    } catch {
      // Ignore corrupted local storage values.
    }
  }, [user?.id]);

  useEffect(() => {
    if (!profile) return;
    if (workshopLocationLabel) return;
    if (typeof profile.base_latitude === "number" && typeof profile.base_longitude === "number") {
      setWorkshopLocationLabel(
        `Lat ${profile.base_latitude.toFixed(5)}, Lng ${profile.base_longitude.toFixed(5)}`,
      );
    }
  }, [profile?.base_latitude, profile?.base_longitude, workshopLocationLabel]);

  function saveAlertsSettings() {
    if (!user?.id) return;
    try {
      window.localStorage.setItem(`mechanic-alerts:${user.id}`, JSON.stringify(alertsSettings));
      toast.success("Alert preferences updated.");
      setShowAlertsModal(false);
    } catch {
      toast.error("Could not save alert preferences.");
    }
  }

  function addTool() {
    const next = toolInput.trim();
    if (!next) return;
    if (tools.some((tool) => tool.toLowerCase() === next.toLowerCase())) {
      toast.error("Tool already added.");
      return;
    }
    setTools((prev) => [...prev, next]);
    setToolInput("");
  }

  function removeTool(value: string) {
    setTools((prev) => prev.filter((item) => item !== value));
  }

  function saveTools() {
    if (!user?.id) return;
    try {
      window.localStorage.setItem(`mechanic-tools:${user.id}`, JSON.stringify(tools));
      toast.success("Tools list updated.");
      setShowToolsModal(false);
    } catch {
      toast.error("Could not save tools list.");
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported on this device.");
      return;
    }
    setLocatingNow(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationForm({
          city: "",
          region: "",
          country: locationForm.country || "Ghana",
        });
        setLocatingNow(false);
        profilePatchMut.mutate(
          {
            base_latitude: pos.coords.latitude,
            base_longitude: pos.coords.longitude,
          },
          {
            onSuccess: () => {
              if (user?.id) {
                const label = "Current GPS location";
                window.localStorage.setItem(`mechanic-workshop-label:${user.id}`, label);
                setWorkshopLocationLabel(label);
              }
              toast.success(
                `Current location saved (${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}).`,
              );
              setShowLocationModal(false);
            },
          },
        );
      },
      () => {
        setLocatingNow(false);
        toast.error("Could not get current location. Check permission and try again.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  }

  async function saveWorkshopLocation() {
    const city = locationForm.city.trim();
    const region = locationForm.region.trim();
    const country = locationForm.country.trim();
    if (!city || !country) {
      toast.error("City/Town and country are required.");
      return;
    }
    const query = [city, region, country].filter(Boolean).join(", ");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
      );
      if (!res.ok) throw new Error("Geocoding failed");
      const data = (await res.json()) as Array<{ lat: string; lon: string; display_name?: string }>;
      const first = data[0];
      const lat = Number(first?.lat);
      const lng = Number(first?.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        toast.error("Could not find this location. Try a more specific place.");
        return;
      }
      profilePatchMut.mutate(
        {
          base_latitude: lat,
          base_longitude: lng,
        },
        {
          onSuccess: () => {
            if (user?.id) {
              const label = [city, region, country].filter(Boolean).join(", ");
              window.localStorage.setItem(`mechanic-workshop-label:${user.id}`, label);
              setWorkshopLocationLabel(label);
            }
              toast.success(`Workshop location saved (${lat.toFixed(5)}, ${lng.toFixed(5)}).`);
            setShowLocationModal(false);
          },
        },
      );
    } catch {
      toast.error("Could not resolve location. Please try again.");
    }
  }

  const locationSummary = workshopLocationLabel || null;
  const locationCoords =
    typeof profile?.base_latitude === "number" && typeof profile?.base_longitude === "number"
      ? `${profile.base_latitude.toFixed(5)}, ${profile.base_longitude.toFixed(5)}`
      : null;

  function applySavedCoordsHint() {
    if (!locationSummary) {
      toast.message("No saved workshop location name yet.");
      return;
    }
    toast.message(`Saved workshop location: ${locationSummary}`);
  }

  return (
    <div className="px-4 py-6">
      <h1 className="font-sora text-5xl text-[#8df6ba]">Mechanic Profile</h1>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_300px]">
        <GlassCard className="border-white/10 bg-[#253247]/90">
          <div className="flex flex-wrap items-start gap-4">
            <div className="relative h-32 w-32 overflow-hidden rounded-3xl bg-gradient-to-br from-[#2b4c58] to-[#1a2a3e]">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Selected profile avatar" className="h-full w-full object-cover" />
              ) : user?.avatar && !avatarLoadFailed ? (
                <img
                  src={user.avatar}
                  alt="Profile avatar"
                  className="h-full w-full object-cover"
                  onError={() => setAvatarLoadFailed(true)}
                />
              ) : (
                <CircleUserRound className="absolute inset-0 m-auto h-14 w-14 text-[#8df6ba]" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-sora text-6xl text-white">{profile?.business_name || "Workshop"}</p>
              <p className="text-white/60">Mechanic account</p>
              <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#1d2b3d] px-3 py-1 text-sm text-white/80">
                <Star className="h-4 w-4 text-[#8df6ba]" />{" "}
                {profile ? `${Number(profile.rating_avg || 0).toFixed(1)} (${profile.rating_count} reviews)` : "—"}
              </p>
              <p className="mt-3 text-white/70">
                {profile?.bio?.trim() || "Add your bio so drivers can understand your workshop specialization."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <label className="cursor-pointer rounded-xl border border-white/10 bg-[#1a2638] px-3 py-2 text-sm font-semibold text-white/80 hover:bg-[#202f46]">
                  Choose avatar
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onAvatarSelected(e.target.files?.[0] ?? null)}
                    disabled={avatarSaving}
                  />
                </label>
                <Button
                  size="sm"
                  disabled={!avatarFile || avatarSaving}
                  onClick={async () => {
                    if (!avatarFile) return;
                    try {
                      setAvatarSaving(true);
                      const updated = await uploadAvatar(avatarFile);
                      patchUser({ avatar: updated.avatar ?? null });
                      setAvatarFile(null);
                      setAvatarPreview(null);
                      toast.success("Avatar updated.");
                    } catch {
                      toast.error("Could not upload avatar.");
                    } finally {
                      setAvatarSaving(false);
                    }
                  }}
                >
                  {avatarSaving ? "Saving..." : "Save avatar"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openEditModal("business_name")}
                >
                  Update business name
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openEditModal("bio")}
                >
                  Update bio
                </Button>
              </div>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="border-white/10 bg-[#253247]/90">
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">Live availability</p>
          <p className="mt-2 inline-flex items-center gap-2 text-3xl font-semibold text-[#8ef7bb]">
            <span className={`h-2 w-2 rounded-full ${profile?.is_available ? "bg-[#00E676]" : "bg-white/35"}`} />{" "}
            {profile?.is_available ? "Accepting Requests" : "Offline"}
          </p>
          <p className="mt-2 text-sm text-white/60">Matching radius: {profile?.service_radius_km ?? 25} km</p>
          <p className="mt-2 inline-flex items-center gap-2 text-xs text-white/65">
            <MapPin className="h-3.5 w-3.5 text-[#8ef7bb]" />
            {locationSummary
              ? `Workshop: ${locationSummary}`
              : "Workshop location not set"}
          </p>
          <p className="mt-1 text-[11px] text-white/50">
            Stored coordinates: {locationCoords ?? "not set"}
          </p>
          <Button
            className="mt-4 w-full"
            variant="ghost"
            onClick={() => {
              const raw = window.prompt("Service radius in km", String(profile?.service_radius_km ?? 25));
              if (!raw) return;
              const parsed = Number(raw);
              if (!Number.isFinite(parsed) || parsed <= 0) {
                toast.error("Enter a valid radius.");
                return;
              }
              profilePatchMut.mutate({ service_radius_km: Math.round(parsed) });
            }}
          >
            Update radius
          </Button>
          <Button className="mt-2 w-full" variant="outline" onClick={() => setShowLocationModal(true)}>
            <MapPin className="h-4 w-4" /> Set workshop location
          </Button>
        </GlassCard>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_300px]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-sora text-4xl text-white">Services offered</h2>
            <Button variant="ghost" size="sm" onClick={() => setCreating((v) => !v)}>
              <Plus className="h-4 w-4" /> Create service
            </Button>
          </div>
          {creating ? (
            <GlassCard className="mb-3 border-white/10 bg-[#253247]/90">
              <p className="text-sm text-white/75">Create a service to improve request matching.</p>
              <div className="mt-3 grid gap-2">
                <select
                  value={serviceForm.category}
                  onChange={(e) => setServiceForm((prev) => ({ ...prev, category: e.target.value }))}
                  className="rounded-xl border border-white/10 bg-[#1a2638] px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="">Select category</option>
                  {(categoriesQ.data ?? []).map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name || cat.slug}
                    </option>
                  ))}
                </select>
                <input
                  value={serviceForm.title}
                  onChange={(e) => setServiceForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Custom title (optional)"
                  className="rounded-xl border border-white/10 bg-[#1a2638] px-3 py-2 text-sm text-white outline-none"
                />
                <textarea
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Description (optional)"
                  rows={2}
                  className="rounded-xl border border-white/10 bg-[#1a2638] px-3 py-2 text-sm text-white outline-none"
                />
                <input
                  value={serviceForm.hourly_rate}
                  onChange={(e) => setServiceForm((prev) => ({ ...prev, hourly_rate: e.target.value }))}
                  placeholder="Hourly rate in cedis (e.g. 95)"
                  className="rounded-xl border border-white/10 bg-[#1a2638] px-3 py-2 text-sm text-white outline-none"
                />
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  disabled={!serviceForm.category || createServiceMut.isPending}
                  onClick={() => createServiceMut.mutate()}
                >
                  Save service
                </Button>
                <Button variant="ghost" onClick={() => setCreating(false)}>
                  Cancel
                </Button>
              </div>
            </GlassCard>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            {serviceCards.map((service) => (
              <GlassCard key={service.id} className="border-white/10 bg-[#253247]/90">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-sora text-4xl text-white">{service.title || service.category_name || "Service"}</p>
                  <span className="rounded-full bg-[#1f5a49] px-2 py-1 text-xs text-[#8ef7bb]">
                    {formatRate(service)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-white/65">{service.description || "No description yet."}</p>
                <div className="mt-3 flex gap-2">
                  <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] uppercase text-white/60">
                    {service.category_slug || service.category_name || "category"}
                  </span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-1 text-[10px] uppercase text-red-200"
                    onClick={() => deleteServiceMut.mutate(service.id)}
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </div>
              </GlassCard>
            ))}
            {!serviceCards.length ? (
              <GlassCard className="border-white/10 bg-[#253247]/90 sm:col-span-2">
                <p className="text-white/70">
                  No services added yet. Add at least one service so the matching algorithm can route requests to you.
                </p>
              </GlassCard>
            ) : null}
          </div>
        </div>
        <div className="space-y-3">
          <GlassCard className="border-white/10 bg-[#253247]/90">
            <p className="font-sora text-4xl text-white">Matching intelligence</p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-[#1d2b3d] px-3 py-2">
                <p className="text-white/80">Active services</p>
                <p className="text-sm text-[#8df6ba]">{serviceCards.length}</p>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#1d2b3d] px-3 py-2">
                <p className="text-white/80">Service categories loaded</p>
                <p className="text-sm text-white/75">{(categoriesQ.data ?? []).length}</p>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#1d2b3d] px-3 py-2">
                <p className="text-white/80">Availability</p>
                <p className="text-sm text-white/75">{profile?.is_available ? "Online" : "Offline"}</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="border-white/10 bg-[#122d4c]/85">
            <p className="inline-flex items-center gap-2 font-semibold text-white">
              <CircleHelp className="h-4 w-4 text-[#9dc6ff]" /> Matching tip
            </p>
            <p className="mt-1 text-sm text-white/65">
              Add precise service categories and descriptions so issue routing can match you more accurately.
            </p>
          </GlassCard>
        </div>
      </div>
      <div className="mt-6 flex gap-2">
        <Button variant="ghost" onClick={() => setShowAlertsModal(true)}>
          <Bell className="h-4 w-4" /> Alerts
        </Button>
        <Button variant="outline" onClick={() => setShowToolsModal(true)}>
          <Wrench className="h-4 w-4" /> Update tools
        </Button>
      </div>

      {showAlertsModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <GlassCard className="w-full max-w-xl border-white/10 bg-[#253247]/95">
            <p className="font-sora text-3xl text-white">Alert preferences</p>
            <p className="mt-1 text-sm text-white/60">Control which updates trigger alerts for your workshop.</p>
            <div className="mt-4 space-y-2">
              {[
                ["new_requests", "New nearby requests"],
                ["chat_messages", "Chat messages"],
                ["cancellations", "Job cancellations"],
                ["promotions", "Offers and promotions"],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-[#1a2638] px-3 py-2"
                >
                  <span className="text-sm text-white/85">{label}</span>
                  <input
                    type="checkbox"
                    checked={alertsSettings[key as keyof typeof alertsSettings]}
                    onChange={(e) =>
                      setAlertsSettings((prev) => ({
                        ...prev,
                        [key]: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-[#00E676]"
                  />
                </label>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowAlertsModal(false)}>
                Cancel
              </Button>
              <Button onClick={saveAlertsSettings}>Save</Button>
            </div>
          </GlassCard>
        </div>
      ) : null}

      {showToolsModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <GlassCard className="w-full max-w-2xl border-white/10 bg-[#253247]/95">
            <p className="font-sora text-3xl text-white">Update tools</p>
            <p className="mt-1 text-sm text-white/60">Keep your tool inventory current for better job readiness.</p>
            <div className="mt-3 flex gap-2">
              <input
                value={toolInput}
                onChange={(e) => setToolInput(e.target.value)}
                placeholder="Add a tool (e.g., OBD scanner)"
                className="w-full rounded-xl border border-white/10 bg-[#1a2638] px-3 py-2 text-sm text-white outline-none"
              />
              <Button type="button" onClick={addTool}>
                Add
              </Button>
            </div>
            <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
              {tools.length ? (
                tools.map((tool) => (
                  <div
                    key={tool}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-[#1a2638] px-3 py-2"
                  >
                    <p className="text-sm text-white/85">{tool}</p>
                    <button
                      type="button"
                      className="text-xs text-red-200 hover:text-red-100"
                      onClick={() => removeTool(tool)}
                    >
                      Remove
                    </button>
                  </div>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-white/10 bg-[#1a2638] px-3 py-4 text-sm text-white/60">
                  No tools added yet.
                </p>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowToolsModal(false)}>
                Cancel
              </Button>
              <Button onClick={saveTools}>Save</Button>
            </div>
          </GlassCard>
        </div>
      ) : null}

      {showLocationModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <GlassCard className="w-full max-w-xl border-white/10 bg-[#253247]/95">
            <p className="font-sora text-3xl text-white">Set workshop location</p>
            <p className="mt-1 text-sm text-white/60">
              Enter city/town, region, and country. The app resolves coordinates automatically.
            </p>
            <div className="mt-3 grid gap-2">
              <input
                value={locationForm.city}
                onChange={(e) => setLocationForm((prev) => ({ ...prev, city: e.target.value }))}
                placeholder="City / Town (e.g. Accra)"
                className="w-full rounded-xl border border-white/10 bg-[#1a2638] px-3 py-2 text-sm text-white outline-none"
              />
              <input
                value={locationForm.region}
                onChange={(e) => setLocationForm((prev) => ({ ...prev, region: e.target.value }))}
                placeholder="Region / State (optional)"
                className="w-full rounded-xl border border-white/10 bg-[#1a2638] px-3 py-2 text-sm text-white outline-none"
              />
              <input
                value={locationForm.country}
                onChange={(e) => setLocationForm((prev) => ({ ...prev, country: e.target.value }))}
                placeholder="Country (e.g. Ghana)"
                className="w-full rounded-xl border border-white/10 bg-[#1a2638] px-3 py-2 text-sm text-white outline-none"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="ghost" onClick={useCurrentLocation} disabled={locatingNow}>
              <LocateFixed className="h-4 w-4" /> {locatingNow ? "Detecting..." : "Use current location"}
              </Button>
              <Button variant="outline" onClick={applySavedCoordsHint}>
                Show saved map point
              </Button>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowLocationModal(false)}>
                Cancel
              </Button>
              <Button onClick={saveWorkshopLocation} disabled={profilePatchMut.isPending}>
                Save location
              </Button>
            </div>
          </GlassCard>
        </div>
      ) : null}

      {editModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <GlassCard className="w-full max-w-xl border-white/10 bg-[#253247]/95">
            <p className="font-sora text-3xl text-white">
              {editModal === "business_name" ? "Update business name" : "Update bio"}
            </p>
            {editModal === "business_name" ? (
              <input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="Business name"
                className="mt-3 w-full rounded-xl border border-white/10 bg-[#1a2638] px-3 py-2 text-sm text-white outline-none"
              />
            ) : (
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={5}
                placeholder="Bio"
                className="mt-3 w-full rounded-xl border border-white/10 bg-[#1a2638] px-3 py-2 text-sm text-white outline-none"
              />
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setEditModal(null);
                  setEditValue("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={saveEditModal} disabled={profilePatchMut.isPending}>
                Save
              </Button>
            </div>
          </GlassCard>
        </div>
      ) : null}
    </div>
  );
}
