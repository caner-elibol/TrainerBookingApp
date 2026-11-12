import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { authedFetch } from "@/lib/backend-client";
import type { PackageDto, TrainerClientSummary } from "@/lib/types";

export interface SearchResultItem {
  id: string;
  label: string;
  caption?: string;
  href: string;
}

export interface SearchResponse {
  clients: SearchResultItem[];
  packages: SearchResultItem[];
}

function normalize(value: string): string {
  return value.toLocaleLowerCase("tr-TR");
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "Trainer") {
    return NextResponse.json({ clients: [], packages: [] } satisfies SearchResponse, { status: user ? 403 : 401 });
  }

  const q = normalize(request.nextUrl.searchParams.get("q")?.trim() ?? "");
  if (q.length < 2) {
    return NextResponse.json({ clients: [], packages: [] } satisfies SearchResponse);
  }

  const [clientsResult, packagesResult] = await Promise.all([
    authedFetch<TrainerClientSummary[]>("/api/trainers/me/clients"),
    authedFetch<PackageDto[]>("/api/packages/mine"),
  ]);

  const clients = (clientsResult.ok ? clientsResult.data : null) ?? [];
  const packages = (packagesResult.ok ? packagesResult.data : null) ?? [];

  const matchedClients: SearchResultItem[] = clients
    .filter((c) => normalize(c.clientName).includes(q))
    .slice(0, 5)
    .map((c) => ({
      id: c.clientId,
      label: c.clientName,
      caption: `${c.remainingSessions} seans kaldı`,
      href: `/clients/${c.clientId}`,
    }));

  const matchedPackages: SearchResultItem[] = packages
    .filter((p) => normalize(p.title).includes(q))
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      label: p.title,
      caption: `₺${p.price.toLocaleString("tr-TR")}`,
      href: "/packages",
    }));

  return NextResponse.json({ clients: matchedClients, packages: matchedPackages } satisfies SearchResponse);
}
