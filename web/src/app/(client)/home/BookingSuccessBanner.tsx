"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Alert from "@/components/ui/Alert";

const VISIBLE_MS = 10_000;

export default function BookingSuccessBanner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("bookedMsg");
  const [visible, setVisible] = useState(!!message);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      setVisible(false);
      router.replace("/home");
    }, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [message, router]);

  if (!message || !visible) return null;

  return (
    <Alert variant="success" title="Randevu Oluşturuldu">
      {message}
    </Alert>
  );
}
