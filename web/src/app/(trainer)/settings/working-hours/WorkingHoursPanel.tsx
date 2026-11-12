"use client";

import { Info } from "lucide-react";
import { useSettingsForm } from "../useSettingsForm";
import SettingsSaveBar from "../SettingsSaveBar";
import WorkingHoursEditor from "@/components/trainer/WorkingHoursEditor";
import type { TrainerSettingsResponse } from "@/lib/types";

export default function WorkingHoursPanel({ initialSettings }: { initialSettings: TrainerSettingsResponse | null }) {
  const form = useSettingsForm(initialSettings, null);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-bold text-foreground">Haftalık Çalışma Saatleri</h2>
        <p className="flex items-center gap-1.5 text-sm text-ink-secondary">
          <Info className="h-3.5 w-3.5" /> Müsait olduğun saatleri belirle. Bu saatlerde danışanlar senden randevu alabilir.
        </p>
      </div>
      <WorkingHoursEditor days={form.days} onChange={form.setDays} />
      <SettingsSaveBar isPending={form.isPending} saved={form.saved} errors={form.errors} onSave={form.handleSaveHours} />
    </div>
  );
}
