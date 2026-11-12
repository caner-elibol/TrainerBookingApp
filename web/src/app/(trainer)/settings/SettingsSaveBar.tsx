import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";

export default function SettingsSaveBar({
  isPending,
  saved,
  errors,
  onSave,
}: {
  isPending: boolean;
  saved: boolean;
  errors: string[];
  onSave: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-border-default pt-4">
      {errors.length > 0 && (
        <Alert variant="error">
          <ul className="list-inside list-disc">
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </Alert>
      )}
      {saved && !isPending && <Alert variant="success">Ayarların kaydedildi.</Alert>}
      <Button type="button" variant="secondary" isLoading={isPending} onClick={onSave} className="self-end">
        {isPending ? "Kaydediliyor…" : "Kaydet"}
      </Button>
    </div>
  );
}
