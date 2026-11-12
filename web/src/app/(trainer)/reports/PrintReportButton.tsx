"use client";

import { Download } from "lucide-react";
import Button from "@/components/ui/Button";

export default function PrintReportButton() {
  return (
    <Button variant="secondary" onClick={() => window.print()}>
      <Download className="h-4 w-4" />
      PDF Olarak Dışa Aktar
    </Button>
  );
}
