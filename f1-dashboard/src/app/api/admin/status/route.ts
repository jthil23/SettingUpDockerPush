import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // API health checks only — DB stats are fetched server-side in the page
    const [jolpicaHealth, openF1Health] = await Promise.all([
      checkApi("https://api.jolpi.ca/ergast/f1/current.json", "Jolpica"),
      checkApi("https://api.openf1.org/v1/sessions?session_key=latest", "OpenF1"),
    ]);

    return NextResponse.json({
      apis: {
        jolpica: jolpicaHealth,
        openF1: openF1Health,
      },
    });
  } catch (error) {
    console.error("[API] Status error:", error);
    return NextResponse.json(
      { error: "Failed to fetch status" },
      { status: 500 }
    );
  }
}

async function checkApi(
  url: string,
  name: string
): Promise<{ name: string; status: "online" | "offline"; latencyMs: number }> {
  const start = Date.now();
  try {
    const res = await fetch(url, { cache: "no-store" });
    const latencyMs = Date.now() - start;
    return {
      name,
      status: res.ok ? "online" : "offline",
      latencyMs,
    };
  } catch {
    return {
      name,
      status: "offline",
      latencyMs: Date.now() - start,
    };
  }
}
