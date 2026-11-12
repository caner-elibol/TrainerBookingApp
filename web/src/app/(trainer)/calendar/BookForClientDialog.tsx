"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { clientFetch } from "@/lib/client-api";
import { emitAppointmentsChanged } from "@/lib/calendar-events";
import { bookForClient } from "./actions";
import type { AvailableSlot, ClientHistory, TrainerClientSummary, TrainerLocation } from "@/lib/types";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import FormField from "@/components/ui/FormField";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import ButtonLink from "@/components/ui/ButtonLink";

interface SessionInfo {
  user: { id: string } | null;
  accessToken: string | null;
}

export interface PreselectedSlot {
  dateIso: string;
  startTimeUtc: string;
  validLocationIds?: string[];
}

const BOOKING_WINDOW_DAYS = 7;

function toIsoDate(date: Date): string {
  return date.toLocaleDateString("en-CA");
}

export default function BookForClientDialog({
  trigger,
  clients: initialClients,
  initialClientId,
  preselectedSlot,
  defaultOpen = false,
}: {
  trigger: ReactNode;
  clients: TrainerClientSummary[];
  initialClientId?: string;
  preselectedSlot?: PreselectedSlot;
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [clients, setClients] = useState(initialClients);
  const [clientId, setClientId] = useState(initialClientId ?? "");
  const [packages, setPackages] = useState<ClientHistory["packages"]>([]);
  const [userPackageId, setUserPackageId] = useState("");
  const [locations, setLocations] = useState<TrainerLocation[]>([]);
  const [locationsLoaded, setLocationsLoaded] = useState(false);
  const [locationId, setLocationId] = useState("");
  const [date, setDate] = useState(preselectedSlot?.dateIso ?? new Date().toLocaleDateString("en-CA"));
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [startTimeUtc, setStartTimeUtc] = useState(preselectedSlot?.startTimeUtc ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [now] = useState(() => Date.now());

  useEffect(() => {
    if (!open || session) return;
    let cancelled = false;
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setSession(data);
      })
      .catch(() => {
        if (!cancelled) setSession({ user: null, accessToken: null });
      });
    return () => {
      cancelled = true;
    };
  }, [open, session]);

  useEffect(() => {
    if (!open || !session?.accessToken) return;
    let cancelled = false;
    clientFetch("/api/trainers/me/clients", session.accessToken)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: TrainerClientSummary[] | null) => {
        if (data && !cancelled) setClients(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, session]);

  useEffect(() => {
    if (!open || !clientId || !session?.accessToken) return;
    let cancelled = false;
    clientFetch(`/api/trainers/me/clients/${clientId}/history`, session.accessToken)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ClientHistory | null) => {
        if (cancelled) return;
        const active = (data?.packages ?? []).filter((p) => p.isActive && p.remainingSessions > 0);
        setPackages(active);
        setUserPackageId(active.length === 1 ? active[0].userPackageId : "");
      })
      .catch(() => {
        if (!cancelled) setPackages([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, clientId, session]);

  useEffect(() => {
    if (!open || !session?.accessToken) return;
    let cancelled = false;
    clientFetch("/api/trainers/me/locations", session.accessToken)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: TrainerLocation[]) => {
        if (cancelled) return;
        setLocations(data);
        const selectable = preselectedSlot?.validLocationIds
          ? data.filter((l) => preselectedSlot.validLocationIds!.includes(l.id))
          : data;
        setLocationId((prev) => prev || (selectable.length === 1 ? selectable[0].id : ""));
      })
      .catch(() => {
        if (!cancelled) setLocations([]);
      })
      .finally(() => {
        if (!cancelled) setLocationsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, session, preselectedSlot]);

  const selectableLocations = useMemo(
    () => (preselectedSlot?.validLocationIds ? locations.filter((l) => preselectedSlot.validLocationIds!.includes(l.id)) : locations),
    [locations, preselectedSlot],
  );
  const excludedLocationNames = useMemo(
    () => (preselectedSlot?.validLocationIds ? locations.filter((l) => !preselectedSlot.validLocationIds!.includes(l.id)) : []).map((l) => l.name),
    [locations, preselectedSlot],
  );

  useEffect(() => {
    if (!open || preselectedSlot || !locationId || !session?.accessToken || !session.user) return;
    let cancelled = false;
    clientFetch(`/api/trainers/${session.user.id}/availability?locationId=${locationId}&date=${date}`, session.accessToken)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: AvailableSlot[]) => {
        if (!cancelled) setSlots(data);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, date, session, preselectedSlot, locationId]);

  const canSubmit = clientId && userPackageId && locationId && startTimeUtc;

  const selectedClientName = useMemo(() => clients.find((c) => c.clientId === clientId)?.clientName, [clients, clientId]);

  const minDate = useMemo(() => toIsoDate(new Date()), []);
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (BOOKING_WINDOW_DAYS - 1));
    return toIsoDate(d);
  }, []);

  const isWithinCancellationWindow = useMemo(() => {
    if (!startTimeUtc) return false;
    return (new Date(startTimeUtc).getTime() - now) / (1000 * 60 * 60) < 12;
  }, [startTimeUtc, now]);

  function reset() {
    setClientId(initialClientId ?? "");
    setUserPackageId("");
    setLocationId(selectableLocations.length === 1 ? selectableLocations[0].id : "");
    setStartTimeUtc(preselectedSlot?.startTimeUtc ?? "");
    setError(null);
  }

  function handleSubmit() {
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      const result = await bookForClient(clientId, { userPackageId, locationId, startTimeUtc });
      if (!result.success) {
        setError(result.error ?? "Randevu oluşturulamadı.");
        return;
      }
      setOpen(false);
      reset();
      emitAppointmentsChanged();
      router.refresh();
    });
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) reset();
        }}
      >
        <DialogContent>
          <DialogTitle>Danışan İçin Randevu Oluştur</DialogTitle>
          <div className="mt-4 flex flex-col gap-4">
            {locationsLoaded && locations.length === 0 && (
              <Alert
                variant="warning"
                title="Henüz bir konumun yok"
                action={
                  <ButtonLink href="/settings/locations" variant="primary" size="sm">
                    Konum ekle
                  </ButtonLink>
                }
              >
                Uygun saatler konuma göre hesaplanır. En az bir konum eklemeden takvimde boş saat görünmez ve randevu oluşturulamaz.
              </Alert>
            )}
            {!initialClientId && (
              <FormField label="Danışan" htmlFor="book-client">
                <Select
                  id="book-client"
                  value={clientId}
                  onChange={(e) => {
                    setClientId(e.target.value);
                    setPackages([]);
                    setUserPackageId("");
                  }}
                >
                  <option value="">Danışan seç</option>
                  {clients.map((c) => (
                    <option key={c.clientId} value={c.clientId}>
                      {c.clientName}
                    </option>
                  ))}
                </Select>
              </FormField>
            )}
            {initialClientId && selectedClientName && (
              <p className="text-sm text-ink-secondary">
                Danışan: <span className="font-semibold text-foreground">{selectedClientName}</span>
              </p>
            )}

            {clientId && (
              <FormField label="Paket" htmlFor="book-package">
                <Select id="book-package" value={userPackageId} onChange={(e) => setUserPackageId(e.target.value)}>
                  <option value="">Paket seç</option>
                  {packages.map((p) => (
                    <option key={p.userPackageId} value={p.userPackageId}>
                      {p.packageTitle} ({p.remainingSessions} seans kaldı)
                    </option>
                  ))}
                </Select>
                {packages.length === 0 && <p className="text-xs text-ink-secondary">Bu danışanın aktif paketi yok.</p>}
              </FormField>
            )}

            {locations.length > 1 && selectableLocations.length > 1 && (
              <FormField label="Konum" htmlFor="book-location">
                <Select id="book-location" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
                  <option value="">Konum seç</option>
                  {selectableLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </Select>
                {excludedLocationNames.length > 0 && (
                  <p className="text-xs text-warning-600">
                    Bu saatte {excludedLocationNames.join(", ")} konumuna yol süresi yüzünden yetişemezsin.
                  </p>
                )}
              </FormField>
            )}

            {locations.length > 1 && selectableLocations.length === 1 && (
              <p className="text-sm text-ink-secondary">
                Konum: <span className="font-semibold text-foreground">{selectableLocations[0].name}</span>
                {excludedLocationNames.length > 0 && (
                  <span className="mt-1 block text-xs text-warning-600">
                    Bu saatte sadece bu konumda randevu alabilirsin — {excludedLocationNames.join(", ")} konumuna yol süresi yüzünden yetişemezsin.
                  </span>
                )}
              </p>
            )}

            {locations.length > 1 && selectableLocations.length === 0 && (
              <Alert variant="error">Bu saatte hiçbir konumda randevu oluşturulamaz.</Alert>
            )}

            {!preselectedSlot && clientId && (
              <>
                <FormField label="Tarih" htmlFor="book-date">
                  <Input id="book-date" type="date" min={minDate} max={maxDate} value={date} onChange={(e) => setDate(e.target.value)} />
                </FormField>
                <FormField label="Saat" htmlFor="book-slot">
                  <Select id="book-slot" value={startTimeUtc} onChange={(e) => setStartTimeUtc(e.target.value)}>
                    <option value="">Saat seç</option>
                    {slots.map((s) => (
                      <option key={s.startTimeUtc} value={s.startTimeUtc}>
                        {new Date(s.startTimeUtc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </option>
                    ))}
                  </Select>
                  {slots.length === 0 && <p className="text-xs text-ink-secondary">Bu tarihte uygun saat yok.</p>}
                </FormField>
              </>
            )}

            {preselectedSlot && (
              <p className="text-sm text-ink-secondary">
                Randevu zamanı:{" "}
                <span className="font-semibold text-foreground">
                  {new Date(preselectedSlot.startTimeUtc).toLocaleString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </p>
            )}

            {isWithinCancellationWindow && (
              <Alert variant="warning">Bu randevu 12 saatten az kaldığı için ileride iptal edilemeyecek.</Alert>
            )}

            {error && <Alert variant="error">{error}</Alert>}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                İptal
              </Button>
              <Button variant="secondary" disabled={!canSubmit} isLoading={isPending} onClick={handleSubmit}>
                {isPending ? "Oluşturuluyor…" : "Randevu Oluştur"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
