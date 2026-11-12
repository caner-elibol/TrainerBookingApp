import { Mail } from "lucide-react";
import Alert from "@/components/ui/Alert";
import ButtonLink from "@/components/ui/ButtonLink";

export default function AddEmailBanner() {
  return (
    <Alert
      variant="info"
      title="E-posta ile bildirim al"
      action={
        <ButtonLink href="/complete-profile" variant="outline" size="sm">
          <Mail className="h-4 w-4" />
          E-posta Ekle
        </ButtonLink>
      }
    >
      Randevu ve ödeme bildirimlerini e-postana da almak istersen adresini ekle.
    </Alert>
  );
}
