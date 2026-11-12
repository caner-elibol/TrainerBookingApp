"use client";

import { useState, useTransition } from "react";
import { Check, Copy } from "lucide-react";
import { updateCalendarSlug } from "./actions";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ShareableLink({ origin, slug }: { origin: string; slug: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(slug);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const link = `${origin}/pt/${slug}`;

  function handleCopy() {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateCalendarSlug(value);
      if (!result.success) {
        setError(result.error ?? "Bir şeyler ters gitti.");
        return;
      }
      setEditing(false);
    });
  }

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-foreground">Herkese Açık Takvim</p>
      <p className="mb-3 text-xs text-ink-secondary">Bu bağlantıyı paylaşarak danışanların doğrudan senden randevu almasını sağlayabilirsin.</p>
      {!editing ? (
        <div className="flex flex-col gap-2">
          <code className="truncate rounded-lg bg-subtle px-3 py-2 text-xs text-ink">{link}</code>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} aria-label="Bağlantıyı kopyala" className="flex-1">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Kopyalandı!" : "Kopyala"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="flex-1">
              Düzenle
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <FormField label="Takvim adresi" htmlFor="calendar-slug" error={error}>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-xs text-ink-secondary">{origin}/pt/</span>
              <Input
                id="calendar-slug"
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? "calendar-slug-error" : undefined}
              />
            </div>
          </FormField>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditing(false);
                setValue(slug);
                setError(null);
              }}
            >
              İptal
            </Button>
            <Button variant="secondary" size="sm" onClick={handleSave} isLoading={isPending}>
              {isPending ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
