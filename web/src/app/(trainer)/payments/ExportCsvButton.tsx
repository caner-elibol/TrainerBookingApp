"use client";

import { Download } from "lucide-react";
import type { TrainerPayment } from "@/lib/types";
import Button from "@/components/ui/Button";

function toCsv(payments: TrainerPayment[]): string {
  const header = ["Danışan", "Paket/Hizmet", "Tutar", "Tarih", "Durum"];
  const rows = payments.map((p) => [p.clientName, p.packageTitle, p.amount, p.createdAtUtc, p.status]);
  return [header, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
}

export default function ExportCsvButton({ payments }: { payments: TrainerPayment[] }) {
  function handleExport() {
    const blob = new Blob([toCsv(payments)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "odeme-gecmisi.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="secondary" onClick={handleExport} disabled={payments.length === 0}>
      <Download className="h-4 w-4" />
      Raporu Dışa Aktar
    </Button>
  );
}
