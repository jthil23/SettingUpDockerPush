import { NextResponse } from "next/server";

export const revalidate = 30;

export async function GET() {
  try {
    const res = await fetch("https://api.openf1.org/v1/sessions?session_key=latest", {
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      return NextResponse.json({ isLive: false, sessionName: null });
    }

    const sessions = await res.json();

    if (!Array.isArray(sessions) || sessions.length === 0) {
      return NextResponse.json({ isLive: false, sessionName: null });
    }

    const latest = sessions[sessions.length - 1];
    const now = new Date();

    // Check if session is currently active
    const startDate = latest.date_start ? new Date(latest.date_start) : null;
    const endDate = latest.date_end ? new Date(latest.date_end) : null;

    const isLive =
      startDate !== null &&
      startDate <= now &&
      (endDate === null || endDate >= now);

    return NextResponse.json({
      isLive,
      sessionName: isLive ? latest.session_name || latest.session_type || "Session" : null,
    });
  } catch {
    return NextResponse.json({ isLive: false, sessionName: null });
  }
}
