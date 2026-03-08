# F1 Dashboard Mega Feature Build — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 12 new features to the F1 Dashboard: Lap Position Chart, Tire Strategy Timeline, Race Control Feed, Weather Widget, Pit Stop Analysis, Qualifying Sectors, Speed Trap/Telemetry, Constructor Battles page, Circuit Maps (SVGs), Team Radio Clips, Season Timeline widget, and Animated Starting Grid.

**Architecture:** New Race Detail page (`/results/[season]/[round]`) becomes the central race story page housing lap chart, tire strategy, pit stops, race control, weather, team radio, and starting grid. New `/battles` page for constructor teammate battles. Enhanced SSE live stream adds race control + weather + speed traps. Dashboard gets a season timeline widget. Schedule cards get embedded circuit SVGs.

**Tech Stack:** Next.js 16 (App Router), React 19, Prisma 7 + MariaDB, Tailwind CSS v4, Recharts, Framer Motion, OpenF1 API, Jolpica/Ergast API, Server-Sent Events.

---

## Task 1: OpenF1 API Client Extensions

**Files:**
- Modify: `src/lib/api/openf1.ts`

Add new interfaces and fetch functions for the 6 untapped OpenF1 endpoints: stints, race_control, weather, car_data (speed traps), team_radio, and laps.

**Step 1: Add new TypeScript interfaces**

Add these interfaces after the existing `OpenF1Driver` interface:

```typescript
export interface OpenF1Stint {
  session_key: number;
  driver_number: number;
  stint_number: number;
  compound: string; // SOFT, MEDIUM, HARD, INTERMEDIATE, WET
  tyre_age_at_start: number;
  lap_start: number;
  lap_end: number;
}

export interface OpenF1RaceControl {
  session_key: number;
  date: string;
  category: string; // Flag, SafetyCar, Drs, Other
  flag?: string; // GREEN, YELLOW, RED, CHEQUERED, etc.
  message: string;
  driver_number?: number;
  lap_number?: number;
  scope?: string; // Track, Sector, Driver
}

export interface OpenF1Weather {
  session_key: number;
  date: string;
  air_temperature: number;
  track_temperature: number;
  humidity: number;
  wind_speed: number;
  wind_direction: number;
  pressure: number;
  rainfall: number;
}

export interface OpenF1CarData {
  session_key: number;
  driver_number: number;
  date: string;
  speed: number;
  rpm: number;
  throttle: number;
  brake: number;
  gear: number;
  drs: number;
}

export interface OpenF1TeamRadio {
  session_key: number;
  driver_number: number;
  date: string;
  recording_url: string;
}

export interface OpenF1Lap {
  session_key: number;
  driver_number: number;
  lap_number: number;
  lap_duration: number | null;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  is_pit_out_lap: boolean;
  st_speed: number | null; // speed trap
  date_start: string;
}
```

**Step 2: Add fetch functions**

Add these functions after the existing `getDriverNumbers` function:

```typescript
export async function getStints(sessionKey: number): Promise<OpenF1Stint[]> {
  try {
    const res = await fetch(`${BASE_URL}/stints?session_key=${sessionKey}`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getRaceControlMessages(sessionKey: number): Promise<OpenF1RaceControl[]> {
  try {
    const res = await fetch(`${BASE_URL}/race_control?session_key=${sessionKey}`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getWeatherData(sessionKey: number): Promise<OpenF1Weather[]> {
  try {
    const res = await fetch(`${BASE_URL}/weather?session_key=${sessionKey}`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getCarData(sessionKey: number, driverNumber: number): Promise<OpenF1CarData[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/car_data?session_key=${sessionKey}&driver_number=${driverNumber}&speed>=0`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getTeamRadio(sessionKey: number): Promise<OpenF1TeamRadio[]> {
  try {
    const res = await fetch(`${BASE_URL}/team_radio?session_key=${sessionKey}`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getLapData(sessionKey: number): Promise<OpenF1Lap[]> {
  try {
    const res = await fetch(`${BASE_URL}/laps?session_key=${sessionKey}`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getSessionByMeeting(year: number, meetingName: string, sessionType: string = "Race"): Promise<OpenF1Session | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/sessions?year=${year}&session_type=${sessionType}&country_name=${encodeURIComponent(meetingName)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const sessions = await res.json();
    if (!Array.isArray(sessions) || sessions.length === 0) return null;
    return sessions[0];
  } catch {
    return null;
  }
}
```

---

## Task 2: Jolpica API Extensions (Pit Stops + Lap Times)

**Files:**
- Modify: `src/lib/api/jolpica.ts`
- Modify: `src/lib/api/types.ts`

**Step 1: Add types in `types.ts`**

Add after the existing interfaces:

```typescript
export interface JolpicaPitStop {
  driverId: string;
  lap: string;
  stop: string;
  time: string; // time of day
  duration: string; // pit stop duration like "23.640"
}

export interface JolpicaLapTiming {
  number: string; // lap number
  Timings: Array<{
    driverId: string;
    position: string;
    time: string; // lap time
  }>;
}

export interface PitStopTableData {
  RaceTable: {
    season: string;
    round: string;
    Races: Array<{
      season: string;
      round: string;
      raceName: string;
      PitStops: JolpicaPitStop[];
    }>;
  };
}

export interface LapTableData {
  RaceTable: {
    season: string;
    round: string;
    Races: Array<{
      season: string;
      round: string;
      raceName: string;
      Laps: JolpicaLapTiming[];
    }>;
  };
}
```

**Step 2: Add fetch functions in `jolpica.ts`**

Add the new imports to the import statement and add these functions:

```typescript
export async function getPitStops(year: number, round: number): Promise<JolpicaPitStop[]> {
  const data = await fetchJolpica<PitStopTableData>(`/${year}/${round}/pitstops.json`);
  return data.MRData.RaceTable.Races[0]?.PitStops ?? [];
}

export async function getLapTimings(year: number, round: number): Promise<JolpicaLapTiming[]> {
  // Jolpica paginates — fetch up to 2000 entries (enough for ~30 laps × 20 drivers)
  const data = await fetchJolpica<LapTableData>(`/${year}/${round}/laps.json?limit=2000`);
  return data.MRData.RaceTable.Races[0]?.Laps ?? [];
}
```

Note: Update the `fetchJolpica` function to handle the case where `?limit=` is already in the path (it currently always appends `?limit=100`). Change the separator logic:

```typescript
async function fetchJolpica<T>(path: string): Promise<JolpicaResponse<T>> {
  const hasLimit = path.includes("limit=");
  const urlSuffix = hasLimit ? "" : `${path.includes("?") ? "&" : "?"}limit=100`;
  const url = `${BASE_URL}${path}${urlSuffix}`;

  const response = await fetch(url, { next: { revalidate: 300 } });

  if (!response.ok) {
    throw new Error(`Jolpica API error: ${response.status} ${response.statusText} for ${url}`);
  }

  return response.json() as Promise<JolpicaResponse<T>>;
}
```

---

## Task 3: Race Detail API Route

**Files:**
- Create: `src/app/api/race-detail/[season]/[round]/route.ts`

This API route fetches all enriched race data from OpenF1 for a specific race, combining lap data, stints, pit stops, race control, weather, team radio, and speed traps. It uses the Jolpica pit stop data as well.

**Step 1: Create the API route**

```typescript
import { prisma } from "@/lib/prisma";
import { getPitStops, getLapTimings } from "@/lib/api/jolpica";
import {
  getSessionByMeeting,
  getLapData,
  getStints,
  getRaceControlMessages,
  getWeatherData,
  getTeamRadio,
  getDriverNumbers,
} from "@/lib/api/openf1";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ season: string; round: string }> }
) {
  const { season, round } = await params;
  const seasonNum = parseInt(season);
  const roundNum = parseInt(round);

  if (isNaN(seasonNum) || isNaN(roundNum)) {
    return Response.json({ error: "Invalid parameters" }, { status: 400 });
  }

  // Get race from DB
  const race = await prisma.race.findUnique({
    where: { season_round: { season: seasonNum, round: roundNum } },
    include: {
      circuit: true,
      results: {
        include: { driver: true, constructor: true },
        orderBy: { position: "asc" },
      },
      qualifyingResults: {
        include: { driver: true, constructor: true },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!race) {
    return Response.json({ error: "Race not found" }, { status: 404 });
  }

  // Fetch Jolpica data (pit stops + lap positions)
  const [pitStops, lapTimings] = await Promise.all([
    getPitStops(seasonNum, roundNum).catch(() => []),
    getLapTimings(seasonNum, roundNum).catch(() => []),
  ]);

  // Try to find the OpenF1 session for this race
  const countryName = race.circuit.country;
  const openF1Session = await getSessionByMeeting(seasonNum, countryName, "Race");

  let openF1Data = {
    laps: [] as Awaited<ReturnType<typeof getLapData>>,
    stints: [] as Awaited<ReturnType<typeof getStints>>,
    raceControl: [] as Awaited<ReturnType<typeof getRaceControlMessages>>,
    weather: [] as Awaited<ReturnType<typeof getWeatherData>>,
    teamRadio: [] as Awaited<ReturnType<typeof getTeamRadio>>,
    drivers: [] as Awaited<ReturnType<typeof getDriverNumbers>>,
  };

  if (openF1Session) {
    const [laps, stints, raceControl, weather, teamRadio, drivers] =
      await Promise.all([
        getLapData(openF1Session.session_key).catch(() => []),
        getStints(openF1Session.session_key).catch(() => []),
        getRaceControlMessages(openF1Session.session_key).catch(() => []),
        getWeatherData(openF1Session.session_key).catch(() => []),
        getTeamRadio(openF1Session.session_key).catch(() => []),
        getDriverNumbers(openF1Session.session_key).catch(() => []),
      ]);

    openF1Data = { laps, stints, raceControl, weather, teamRadio, drivers };
  }

  return Response.json({
    race: {
      id: race.id,
      season: race.season,
      round: race.round,
      raceName: race.raceName,
      date: race.date,
      time: race.time,
      circuit: race.circuit,
    },
    results: race.results,
    qualifying: race.qualifyingResults,
    pitStops,
    lapTimings,
    openF1: openF1Data,
    hasOpenF1Data: !!openF1Session,
  });
}
```

---

## Task 4: Enhanced Live SSE Stream

**Files:**
- Modify: `src/app/api/live/route.ts`
- Modify: `src/lib/api/openf1.ts` (already done in Task 1)

Extend the existing SSE poll loop to also fetch race control messages, weather data, and speed trap info alongside positions and intervals.

**Step 1: Update the SSE route**

Update the poll loop inside `/api/live/route.ts` to fetch additional data streams. Add race control and weather alongside the existing position/interval fetches:

```typescript
import {
  getSessionStatus,
  getLivePositions,
  getLiveIntervals,
  getDriverNumbers,
  getRaceControlMessages,
  getWeatherData,
} from "@/lib/api/openf1";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: unknown) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      }

      try {
        const session = await getSessionStatus();

        if (!session) {
          send({ active: false });
          controller.close();
          return;
        }

        const now = new Date();
        const startDate = session.date_start ? new Date(session.date_start) : null;
        const endDate = session.date_end ? new Date(session.date_end) : null;

        const isLive =
          startDate !== null &&
          startDate <= now &&
          (endDate === null || endDate >= now);

        if (!isLive) {
          send({ active: false });
          controller.close();
          return;
        }

        // Fetch driver info once
        const drivers = await getDriverNumbers(session.session_key);
        const driverMap = new Map(
          drivers.map((d) => [
            d.driver_number,
            {
              number: d.driver_number,
              abbreviation: d.name_acronym,
              fullName: d.full_name,
              teamName: d.team_name,
              teamColour: d.team_colour,
            },
          ])
        );

        // Track last race control message to avoid sending duplicates
        let lastRaceControlDate = "";

        const MAX_ITERATIONS = 60;
        let iteration = 0;

        async function poll() {
          if (iteration >= MAX_ITERATIONS) {
            send({ active: false, reason: "timeout" });
            controller.close();
            return;
          }

          try {
            const [positions, intervals, raceControl, weather] = await Promise.all([
              getLivePositions(session!.session_key),
              getLiveIntervals(session!.session_key),
              getRaceControlMessages(session!.session_key),
              getWeatherData(session!.session_key),
            ]);

            // Get the latest position per driver
            const latestPositions = new Map<number, { position: number; date: string }>();
            for (const p of positions) {
              const existing = latestPositions.get(p.driver_number);
              if (!existing || p.date > existing.date) {
                latestPositions.set(p.driver_number, { position: p.position, date: p.date });
              }
            }

            // Get the latest interval per driver
            const latestIntervals = new Map<number, { gapToLeader: number | null; interval: number | null; date: string }>();
            for (const i of intervals) {
              const existing = latestIntervals.get(i.driver_number);
              if (!existing || i.date > existing.date) {
                latestIntervals.set(i.driver_number, {
                  gapToLeader: i.gap_to_leader,
                  interval: i.interval,
                  date: i.date,
                });
              }
            }

            // Build sorted position list
            const sortedDrivers = Array.from(latestPositions.entries())
              .sort((a, b) => a[1].position - b[1].position)
              .map(([driverNumber, pos]) => {
                const driver = driverMap.get(driverNumber);
                const interval = latestIntervals.get(driverNumber);
                return {
                  position: pos.position,
                  driverNumber,
                  abbreviation: driver?.abbreviation ?? `#${driverNumber}`,
                  fullName: driver?.fullName ?? `Driver ${driverNumber}`,
                  teamName: driver?.teamName ?? "",
                  teamColour: driver?.teamColour ?? null,
                  gapToLeader: interval?.gapToLeader ?? null,
                  interval: interval?.interval ?? null,
                };
              });

            // Get new race control messages since last poll
            const newRaceControl = raceControl
              .filter((rc) => rc.date > lastRaceControlDate)
              .map((rc) => ({
                date: rc.date,
                category: rc.category,
                flag: rc.flag,
                message: rc.message,
                driverNumber: rc.driver_number,
                lapNumber: rc.lap_number,
                scope: rc.scope,
              }));

            if (newRaceControl.length > 0) {
              lastRaceControlDate = newRaceControl[newRaceControl.length - 1].date;
            }

            // Get latest weather reading
            const latestWeather = weather.length > 0 ? weather[weather.length - 1] : null;
            const weatherData = latestWeather ? {
              airTemp: latestWeather.air_temperature,
              trackTemp: latestWeather.track_temperature,
              humidity: latestWeather.humidity,
              windSpeed: latestWeather.wind_speed,
              windDirection: latestWeather.wind_direction,
              rainfall: latestWeather.rainfall,
            } : null;

            send({
              active: true,
              sessionName: session!.session_name || session!.session_type || "Session",
              meetingName: session!.meeting_name,
              positions: sortedDrivers,
              raceControl: newRaceControl,
              weather: weatherData,
            });
          } catch {
            send({ active: true, heartbeat: true });
          }

          iteration++;
          setTimeout(poll, 5000);
        }

        await poll();
      } catch {
        send({ active: false, error: "Server error" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

---

## Task 5: LiveTiming Component — Race Control + Weather

**Files:**
- Modify: `src/components/live/LiveTiming.tsx`

Add race control message feed and weather strip to the live timing component.

**Step 1: Update interfaces**

Add to the existing `LiveData` interface:

```typescript
interface RaceControlMessage {
  date: string;
  category: string;
  flag?: string;
  message: string;
  driverNumber?: number;
  lapNumber?: number;
  scope?: string;
}

interface WeatherInfo {
  airTemp: number;
  trackTemp: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  rainfall: number;
}

interface LiveData {
  active: boolean;
  sessionName?: string;
  meetingName?: string;
  positions?: DriverPosition[];
  raceControl?: RaceControlMessage[];
  weather?: WeatherInfo | null;
  heartbeat?: boolean;
  reason?: string;
  error?: string;
}
```

**Step 2: Add state and rendering**

Add state tracking for accumulated race control messages and render them below the position table:

- `raceControlMessages` state: accumulate messages from each SSE event (keep last 20)
- Weather strip: compact row above the table header showing air/track temp, wind, humidity, rain indicator
- Race control feed: scrollable list below the position table showing recent messages with color-coded category icons (red for flags, yellow for safety car, green for DRS, etc.)

Key UI additions:

**Weather strip** (between header and table header):
```tsx
{data.weather && (
  <div className="flex items-center gap-4 px-4 py-2 border-b border-f1-gray/20 bg-f1-carbon/20 text-[11px] text-f1-white/50">
    <span>Air {data.weather.airTemp}°C</span>
    <span>Track {data.weather.trackTemp}°C</span>
    <span>💧 {data.weather.humidity}%</span>
    <span>Wind {data.weather.windSpeed} km/h</span>
    {data.weather.rainfall > 0 && (
      <span className="text-blue-400 font-semibold">🌧 RAIN</span>
    )}
  </div>
)}
```

**Race control feed** (after position table):
```tsx
{raceControlMessages.length > 0 && (
  <div className="border-t border-f1-gray/30 max-h-32 overflow-y-auto">
    <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-f1-white/40 font-medium sticky top-0 bg-f1-dark">
      Race Control
    </div>
    {raceControlMessages.slice().reverse().map((msg, i) => (
      <div key={i} className="flex items-start gap-2 px-4 py-1.5 text-xs border-b border-f1-gray/10">
        <span className={`shrink-0 w-2 h-2 rounded-full mt-1 ${
          msg.flag === "RED" ? "bg-red-500" :
          msg.flag === "YELLOW" || msg.flag === "DOUBLE YELLOW" ? "bg-yellow-400" :
          msg.category === "SafetyCar" ? "bg-orange-400" :
          msg.category === "Drs" ? "bg-green-400" :
          "bg-f1-white/30"
        }`} />
        <span className="text-f1-white/70 flex-1">{msg.message}</span>
        {msg.lapNumber && (
          <span className="text-f1-white/30 font-mono shrink-0">L{msg.lapNumber}</span>
        )}
      </div>
    ))}
  </div>
)}
```

---

## Task 6: Circuit SVG System

**Files:**
- Create: `src/lib/circuits.ts`
- Create: `src/components/schedule/CircuitMap.tsx`
- Create: `public/circuits/` (directory with SVG files)

**Step 1: Create circuit metadata**

`src/lib/circuits.ts` — Map circuit IDs to SVG paths and track metadata:

```typescript
export interface CircuitInfo {
  svgPath: string;
  length: string; // e.g. "5.412 km"
  turns: number;
  lapRecord: string; // e.g. "1:27.264"
  lapRecordHolder: string;
  lapRecordYear: number;
  drsZones: number;
}

export const circuitData: Record<string, CircuitInfo> = {
  bahrain: {
    svgPath: "/circuits/bahrain.svg",
    length: "5.412 km",
    turns: 15,
    lapRecord: "1:31.447",
    lapRecordHolder: "Pedro de la Rosa",
    lapRecordYear: 2005,
    drsZones: 3,
  },
  jeddah: {
    svgPath: "/circuits/jeddah.svg",
    length: "6.174 km",
    turns: 27,
    lapRecord: "1:30.734",
    lapRecordHolder: "Lewis Hamilton",
    lapRecordYear: 2021,
    drsZones: 3,
  },
  albert_park: {
    svgPath: "/circuits/albert_park.svg",
    length: "5.278 km",
    turns: 14,
    lapRecord: "1:19.813",
    lapRecordHolder: "Charles Leclerc",
    lapRecordYear: 2024,
    drsZones: 4,
  },
  suzuka: {
    svgPath: "/circuits/suzuka.svg",
    length: "5.807 km",
    turns: 18,
    lapRecord: "1:30.983",
    lapRecordHolder: "Lewis Hamilton",
    lapRecordYear: 2019,
    drsZones: 2,
  },
  shanghai: {
    svgPath: "/circuits/shanghai.svg",
    length: "5.451 km",
    turns: 16,
    lapRecord: "1:32.238",
    lapRecordHolder: "Michael Schumacher",
    lapRecordYear: 2004,
    drsZones: 2,
  },
  miami: {
    svgPath: "/circuits/miami.svg",
    length: "5.412 km",
    turns: 19,
    lapRecord: "1:29.708",
    lapRecordHolder: "Max Verstappen",
    lapRecordYear: 2023,
    drsZones: 3,
  },
  imola: {
    svgPath: "/circuits/imola.svg",
    length: "4.909 km",
    turns: 19,
    lapRecord: "1:15.484",
    lapRecordHolder: "Lewis Hamilton",
    lapRecordYear: 2020,
    drsZones: 2,
  },
  monaco: {
    svgPath: "/circuits/monaco.svg",
    length: "3.337 km",
    turns: 19,
    lapRecord: "1:12.909",
    lapRecordHolder: "Lewis Hamilton",
    lapRecordYear: 2021,
    drsZones: 1,
  },
  villeneuve: {
    svgPath: "/circuits/villeneuve.svg",
    length: "4.361 km",
    turns: 14,
    lapRecord: "1:13.078",
    lapRecordHolder: "Valtteri Bottas",
    lapRecordYear: 2019,
    drsZones: 2,
  },
  catalunya: {
    svgPath: "/circuits/catalunya.svg",
    length: "4.675 km",
    turns: 16,
    lapRecord: "1:16.330",
    lapRecordHolder: "Max Verstappen",
    lapRecordYear: 2023,
    drsZones: 2,
  },
  red_bull_ring: {
    svgPath: "/circuits/red_bull_ring.svg",
    length: "4.318 km",
    turns: 10,
    lapRecord: "1:05.619",
    lapRecordHolder: "Carlos Sainz",
    lapRecordYear: 2020,
    drsZones: 3,
  },
  silverstone: {
    svgPath: "/circuits/silverstone.svg",
    length: "5.891 km",
    turns: 18,
    lapRecord: "1:27.097",
    lapRecordHolder: "Max Verstappen",
    lapRecordYear: 2020,
    drsZones: 2,
  },
  hungaroring: {
    svgPath: "/circuits/hungaroring.svg",
    length: "4.381 km",
    turns: 14,
    lapRecord: "1:16.627",
    lapRecordHolder: "Lewis Hamilton",
    lapRecordYear: 2020,
    drsZones: 2,
  },
  spa: {
    svgPath: "/circuits/spa.svg",
    length: "7.004 km",
    turns: 19,
    lapRecord: "1:46.286",
    lapRecordHolder: "Valtteri Bottas",
    lapRecordYear: 2018,
    drsZones: 2,
  },
  zandvoort: {
    svgPath: "/circuits/zandvoort.svg",
    length: "4.259 km",
    turns: 14,
    lapRecord: "1:11.097",
    lapRecordHolder: "Lewis Hamilton",
    lapRecordYear: 2021,
    drsZones: 2,
  },
  monza: {
    svgPath: "/circuits/monza.svg",
    length: "5.793 km",
    turns: 11,
    lapRecord: "1:21.046",
    lapRecordHolder: "Rubens Barrichello",
    lapRecordYear: 2004,
    drsZones: 2,
  },
  baku: {
    svgPath: "/circuits/baku.svg",
    length: "6.003 km",
    turns: 20,
    lapRecord: "1:43.009",
    lapRecordHolder: "Charles Leclerc",
    lapRecordYear: 2019,
    drsZones: 2,
  },
  marina_bay: {
    svgPath: "/circuits/marina_bay.svg",
    length: "4.940 km",
    turns: 19,
    lapRecord: "1:35.867",
    lapRecordHolder: "Lewis Hamilton",
    lapRecordYear: 2023,
    drsZones: 3,
  },
  americas: {
    svgPath: "/circuits/americas.svg",
    length: "5.513 km",
    turns: 20,
    lapRecord: "1:36.169",
    lapRecordHolder: "Charles Leclerc",
    lapRecordYear: 2019,
    drsZones: 2,
  },
  rodriguez: {
    svgPath: "/circuits/rodriguez.svg",
    length: "4.304 km",
    turns: 17,
    lapRecord: "1:17.774",
    lapRecordHolder: "Valtteri Bottas",
    lapRecordYear: 2021,
    drsZones: 3,
  },
  interlagos: {
    svgPath: "/circuits/interlagos.svg",
    length: "4.309 km",
    turns: 15,
    lapRecord: "1:10.540",
    lapRecordHolder: "Valtteri Bottas",
    lapRecordYear: 2018,
    drsZones: 2,
  },
  vegas: {
    svgPath: "/circuits/vegas.svg",
    length: "6.201 km",
    turns: 17,
    lapRecord: "1:35.490",
    lapRecordHolder: "Oscar Piastri",
    lapRecordYear: 2024,
    drsZones: 2,
  },
  losail: {
    svgPath: "/circuits/losail.svg",
    length: "5.419 km",
    turns: 16,
    lapRecord: "1:24.319",
    lapRecordHolder: "Max Verstappen",
    lapRecordYear: 2023,
    drsZones: 2,
  },
  yas_marina: {
    svgPath: "/circuits/yas_marina.svg",
    length: "5.281 km",
    turns: 16,
    lapRecord: "1:26.103",
    lapRecordHolder: "Max Verstappen",
    lapRecordYear: 2021,
    drsZones: 2,
  },
};

export function getCircuitInfo(circuitId: string): CircuitInfo | null {
  return circuitData[circuitId] ?? null;
}
```

**Step 2: Create CircuitMap component**

`src/components/schedule/CircuitMap.tsx`:

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { CircuitInfo } from "@/lib/circuits";
import { Maximize2, Route, CornerDownRight, Gauge, Zap } from "lucide-react";

interface CircuitMapProps {
  circuitId: string;
  circuitInfo: CircuitInfo;
  compact?: boolean;
}

export default function CircuitMap({ circuitId, circuitInfo, compact = false }: CircuitMapProps) {
  const [imgError, setImgError] = useState(false);

  if (imgError) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <Image
          src={circuitInfo.svgPath}
          alt={circuitId}
          width={80}
          height={48}
          className="opacity-40 invert"
          onError={() => setImgError(true)}
        />
        <div className="flex gap-3 text-[10px] text-f1-white/40">
          <span>{circuitInfo.length}</span>
          <span>{circuitInfo.turns} turns</span>
          <span>{circuitInfo.drsZones} DRS</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <Image
            src={circuitInfo.svgPath}
            alt={circuitId}
            width={200}
            height={120}
            className="opacity-50 invert"
            onError={() => setImgError(true)}
          />
        </div>
        <div className="flex-1 grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
          <div className="flex items-center gap-1.5 text-f1-white/60">
            <Route size={12} className="text-f1-red" />
            <span>{circuitInfo.length}</span>
          </div>
          <div className="flex items-center gap-1.5 text-f1-white/60">
            <CornerDownRight size={12} className="text-f1-red" />
            <span>{circuitInfo.turns} turns</span>
          </div>
          <div className="flex items-center gap-1.5 text-f1-white/60">
            <Zap size={12} className="text-f1-cyan" />
            <span>{circuitInfo.drsZones} DRS zones</span>
          </div>
          <div className="flex items-center gap-1.5 text-f1-white/60">
            <Gauge size={12} className="text-purple-400" />
            <span>{circuitInfo.lapRecord}</span>
          </div>
          <div className="col-span-2 text-[10px] text-f1-white/30">
            Record: {circuitInfo.lapRecordHolder} ({circuitInfo.lapRecordYear})
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Create placeholder SVG files**

Create simple placeholder SVGs for the circuits in `public/circuits/`. These should be minimal single-path outlines. For the actual build, we'll include proper SVGs — for now create a script or manually source them. Each SVG should be a white stroke on transparent background, approximately 200x120 viewBox.

Note: You can find open-source F1 circuit SVGs from various community sources. The component uses `invert` CSS filter so white-on-transparent works with the dark theme.

---

## Task 7: Lap Position Chart Component

**Files:**
- Create: `src/components/race-detail/LapPositionChart.tsx`

The signature F1 visualization: X = lap number, Y = position (inverted, P1 at top), one line per driver.

```tsx
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface LapPosition {
  lap: number;
  positions: Record<string, number>; // driverId -> position
}

interface DriverInfo {
  driverId: string;
  code: string;
  color: string;
}

interface LapPositionChartProps {
  data: LapPosition[];
  drivers: DriverInfo[];
  totalLaps: number;
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const sorted = [...payload].sort((a, b) => a.value - b.value);

  return (
    <div className="rounded-lg border border-f1-carbon px-4 py-3 shadow-xl bg-f1-black max-h-80 overflow-y-auto">
      <p className="text-xs text-f1-white/50 font-heading mb-2">Lap {label}</p>
      <div className="flex flex-col gap-0.5">
        {sorted.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-xs">
            <span className="font-mono text-f1-white/40 w-5 text-right">
              P{entry.value}
            </span>
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-f1-white/70">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LapPositionChart({
  data,
  drivers,
  totalLaps,
}: LapPositionChartProps) {
  if (data.length === 0) {
    return (
      <div className="card flex items-center justify-center py-12">
        <p className="text-f1-white/30 text-sm">No lap data available</p>
      </div>
    );
  }

  // Transform: each lap becomes a data point with driver positions
  const chartData = data.map((lap) => ({
    lap: lap.lap,
    ...lap.positions,
  }));

  return (
    <div className="card p-4 overflow-hidden">
      <h3 className="font-heading text-sm font-bold text-f1-white/80 uppercase tracking-wider mb-4">
        Position Changes
      </h3>
      <div className="w-full" style={{ height: Math.max(400, drivers.length * 22) }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" vertical={false} />
            <XAxis
              dataKey="lap"
              stroke="#F0F0F0"
              tick={{ fontSize: 10, fill: "#F0F0F0" }}
              tickLine={false}
              axisLine={{ stroke: "#2D2D2D" }}
              interval={Math.floor(totalLaps / 10)}
              label={{ value: "Lap", position: "insideBottomRight", offset: -5, fontSize: 10, fill: "#F0F0F080" }}
            />
            <YAxis
              reversed
              domain={[1, drivers.length]}
              stroke="#F0F0F0"
              tick={{ fontSize: 10, fill: "#F0F0F0" }}
              tickLine={false}
              axisLine={{ stroke: "#2D2D2D" }}
              width={35}
              label={{ value: "Position", angle: -90, position: "insideLeft", offset: 10, fontSize: 10, fill: "#F0F0F080" }}
              allowDecimals={false}
              tickCount={drivers.length}
            />
            <Tooltip content={<CustomTooltip />} />
            {drivers.map((driver) => (
              <Line
                key={driver.driverId}
                type="linear"
                dataKey={driver.driverId}
                name={driver.code}
                stroke={driver.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-4 px-2">
        {drivers.map((driver) => (
          <div key={driver.driverId} className="flex items-center gap-1.5">
            <span
              className="w-3 h-0.5 rounded-full shrink-0"
              style={{ backgroundColor: driver.color }}
            />
            <span className="text-[10px] text-f1-white/60">{driver.code}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Task 8: Tire Strategy Timeline Component

**Files:**
- Create: `src/components/race-detail/TireStrategy.tsx`

Horizontal stacked bars per driver showing tire compound stints.

```tsx
"use client";

import { motion } from "framer-motion";

interface Stint {
  compound: string;
  lapStart: number;
  lapEnd: number;
  tyreAge: number;
}

interface DriverStints {
  driverNumber: number;
  abbreviation: string;
  teamColor: string;
  stints: Stint[];
}

interface TireStrategyProps {
  drivers: DriverStints[];
  totalLaps: number;
}

const compoundColors: Record<string, { bg: string; text: string; border: string }> = {
  SOFT: { bg: "bg-red-500", text: "text-white", border: "border-red-400" },
  MEDIUM: { bg: "bg-yellow-400", text: "text-black", border: "border-yellow-300" },
  HARD: { bg: "bg-white", text: "text-black", border: "border-gray-300" },
  INTERMEDIATE: { bg: "bg-green-500", text: "text-white", border: "border-green-400" },
  WET: { bg: "bg-blue-500", text: "text-white", border: "border-blue-400" },
  UNKNOWN: { bg: "bg-gray-500", text: "text-white", border: "border-gray-400" },
};

function CompoundLabel({ compound }: { compound: string }) {
  return (
    <span className="text-[9px] font-bold uppercase tracking-wider">
      {compound.charAt(0)}
    </span>
  );
}

export default function TireStrategy({ drivers, totalLaps }: TireStrategyProps) {
  if (drivers.length === 0 || totalLaps === 0) {
    return (
      <div className="card flex items-center justify-center py-12">
        <p className="text-f1-white/30 text-sm">No tire strategy data available</p>
      </div>
    );
  }

  return (
    <div className="card p-4 overflow-hidden">
      <h3 className="font-heading text-sm font-bold text-f1-white/80 uppercase tracking-wider mb-4">
        Tire Strategy
      </h3>

      {/* Legend */}
      <div className="flex items-center gap-3 mb-4">
        {Object.entries(compoundColors).filter(([k]) => k !== "UNKNOWN").map(([compound, colors]) => (
          <div key={compound} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${colors.bg}`} />
            <span className="text-[10px] text-f1-white/50 uppercase">{compound}</span>
          </div>
        ))}
      </div>

      {/* Lap axis */}
      <div className="flex items-center mb-1 pl-14">
        <div className="flex-1 flex justify-between text-[9px] text-f1-white/30 font-mono">
          <span>1</span>
          <span>{Math.floor(totalLaps / 4)}</span>
          <span>{Math.floor(totalLaps / 2)}</span>
          <span>{Math.floor((totalLaps * 3) / 4)}</span>
          <span>{totalLaps}</span>
        </div>
      </div>

      {/* Driver rows */}
      <div className="flex flex-col gap-1">
        {drivers.map((driver, driverIdx) => {
          const colors = driver.teamColor;

          return (
            <div key={driver.driverNumber} className="flex items-center gap-2">
              {/* Driver label */}
              <div className="w-12 flex items-center gap-1.5 shrink-0">
                <div
                  className="w-1 h-4 rounded-full"
                  style={{ backgroundColor: colors }}
                />
                <span className="text-xs font-bold text-f1-white/80 font-mono">
                  {driver.abbreviation}
                </span>
              </div>

              {/* Stint bars */}
              <div className="flex-1 flex h-7 rounded-sm overflow-hidden bg-f1-carbon/30">
                {driver.stints.map((stint, i) => {
                  const widthPct = ((stint.lapEnd - stint.lapStart + 1) / totalLaps) * 100;
                  const compound = stint.compound.toUpperCase();
                  const compColor = compoundColors[compound] ?? compoundColors.UNKNOWN;

                  return (
                    <motion.div
                      key={i}
                      className={`${compColor.bg} flex items-center justify-center border-r border-f1-black/30 relative group`}
                      style={{ width: `${widthPct}%` }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.5, delay: driverIdx * 0.02 + i * 0.1, ease: "easeOut" }}
                    >
                      <CompoundLabel compound={compound} />

                      {/* Tooltip on hover */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-f1-black border border-f1-carbon rounded px-2 py-1 text-[9px] text-f1-white/70 whitespace-nowrap hidden group-hover:block z-10 pointer-events-none">
                        {compound} L{stint.lapStart}-{stint.lapEnd} ({stint.tyreAge} laps old)
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## Task 9: Pit Stop Analysis Component

**Files:**
- Create: `src/components/race-detail/PitStopChart.tsx`

Horizontal bar chart ranking pit stops by duration + overlay markers.

```tsx
"use client";

import { motion } from "framer-motion";

interface PitStop {
  driverId: string;
  driverCode: string;
  teamColor: string;
  lap: number;
  stop: number;
  duration: string;
}

interface PitStopChartProps {
  pitStops: PitStop[];
}

export default function PitStopChart({ pitStops }: PitStopChartProps) {
  if (pitStops.length === 0) {
    return (
      <div className="card flex items-center justify-center py-12">
        <p className="text-f1-white/30 text-sm">No pit stop data available</p>
      </div>
    );
  }

  // Sort by duration (fastest first)
  const sorted = [...pitStops]
    .map((ps) => ({ ...ps, durationNum: parseFloat(ps.duration) || 0 }))
    .filter((ps) => ps.durationNum > 0 && ps.durationNum < 120) // filter outliers
    .sort((a, b) => a.durationNum - b.durationNum);

  const fastest = sorted[0]?.durationNum ?? 20;
  const maxDuration = Math.min(sorted[sorted.length - 1]?.durationNum ?? 40, 60);

  return (
    <div className="card p-4 overflow-hidden">
      <h3 className="font-heading text-sm font-bold text-f1-white/80 uppercase tracking-wider mb-4">
        Pit Stops
      </h3>

      <div className="flex flex-col gap-1.5 max-h-[500px] overflow-y-auto">
        {sorted.map((ps, i) => {
          const widthPct = (ps.durationNum / maxDuration) * 100;
          const isFastest = i === 0;

          return (
            <div key={`${ps.driverId}-${ps.stop}`} className="flex items-center gap-2">
              <div className="w-10 text-right shrink-0">
                <span className="text-[10px] text-f1-white/40 font-mono">L{ps.lap}</span>
              </div>
              <div className="w-10 shrink-0">
                <span className="text-xs font-bold text-f1-white/80 font-mono">
                  {ps.driverCode}
                </span>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <motion.div
                  className="h-5 rounded-r-sm flex items-center justify-end pr-2"
                  style={{
                    backgroundColor: ps.teamColor || "#3D3D3D",
                    width: `${widthPct}%`,
                    minWidth: "40px",
                  }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.4, delay: i * 0.03, ease: "easeOut" }}
                >
                  <span className={`text-[10px] font-mono font-bold ${
                    isFastest ? "text-f1-yellow" : "text-f1-white/90"
                  }`}>
                    {ps.duration}s
                  </span>
                </motion.div>
              </div>
              {isFastest && (
                <span className="text-[9px] text-f1-yellow font-bold uppercase tracking-wider shrink-0">
                  Fastest
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## Task 10: Race Control Timeline Component

**Files:**
- Create: `src/components/race-detail/RaceControlTimeline.tsx`

Vertical scrollable timeline of race control events.

```tsx
"use client";

import { AlertTriangle, Flag, Shield, Zap, Radio, CircleAlert } from "lucide-react";

interface RaceControlEvent {
  date: string;
  category: string;
  flag?: string;
  message: string;
  driverNumber?: number;
  lapNumber?: number;
  scope?: string;
}

interface RaceControlTimelineProps {
  events: RaceControlEvent[];
}

function getCategoryIcon(category: string, flag?: string) {
  if (flag === "RED") return <Flag size={14} className="text-red-500" />;
  if (flag === "YELLOW" || flag === "DOUBLE YELLOW") return <AlertTriangle size={14} className="text-yellow-400" />;
  if (flag === "GREEN") return <Flag size={14} className="text-green-400" />;
  if (flag === "CHEQUERED") return <Flag size={14} className="text-f1-white" />;
  if (category === "SafetyCar") return <Shield size={14} className="text-orange-400" />;
  if (category === "Drs") return <Zap size={14} className="text-green-400" />;
  return <CircleAlert size={14} className="text-f1-white/40" />;
}

function getCategoryColor(category: string, flag?: string): string {
  if (flag === "RED") return "border-red-500/50";
  if (flag === "YELLOW" || flag === "DOUBLE YELLOW") return "border-yellow-400/50";
  if (flag === "GREEN") return "border-green-400/50";
  if (category === "SafetyCar") return "border-orange-400/50";
  if (category === "Drs") return "border-green-400/30";
  return "border-f1-gray/30";
}

export default function RaceControlTimeline({ events }: RaceControlTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="card flex items-center justify-center py-12">
        <p className="text-f1-white/30 text-sm">No race control data available</p>
      </div>
    );
  }

  return (
    <div className="card p-4 overflow-hidden">
      <h3 className="font-heading text-sm font-bold text-f1-white/80 uppercase tracking-wider mb-4">
        Race Control
      </h3>

      <div className="flex flex-col gap-0 max-h-[400px] overflow-y-auto">
        {events.map((event, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 py-2.5 px-3 border-l-2 ${getCategoryColor(event.category, event.flag)} ${
              i < events.length - 1 ? "border-b border-b-f1-gray/10" : ""
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {getCategoryIcon(event.category, event.flag)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-f1-white/80">{event.message}</p>
              <div className="flex items-center gap-2 mt-1">
                {event.lapNumber && (
                  <span className="text-[10px] text-f1-white/40 font-mono">Lap {event.lapNumber}</span>
                )}
                {event.scope && (
                  <span className="text-[10px] text-f1-white/30">{event.scope}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Task 11: Weather Timeline Component

**Files:**
- Create: `src/components/race-detail/WeatherTimeline.tsx`

Compact weather data display for race detail page.

```tsx
"use client";

import { Cloud, Thermometer, Droplets, Wind } from "lucide-react";

interface WeatherReading {
  date: string;
  airTemp: number;
  trackTemp: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  rainfall: number;
}

interface WeatherTimelineProps {
  readings: WeatherReading[];
}

export default function WeatherTimeline({ readings }: WeatherTimelineProps) {
  if (readings.length === 0) {
    return (
      <div className="card flex items-center justify-center py-8">
        <p className="text-f1-white/30 text-sm">No weather data available</p>
      </div>
    );
  }

  // Show summary: start, mid, end of session
  const start = readings[0];
  const mid = readings[Math.floor(readings.length / 2)];
  const end = readings[readings.length - 1];
  const hadRain = readings.some((r) => r.rainfall > 0);

  const maxTrackTemp = Math.max(...readings.map((r) => r.trackTemp));
  const minTrackTemp = Math.min(...readings.map((r) => r.trackTemp));

  return (
    <div className="card p-4">
      <h3 className="font-heading text-sm font-bold text-f1-white/80 uppercase tracking-wider mb-4">
        Weather Conditions
      </h3>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="flex items-center gap-2 bg-f1-carbon/30 rounded-lg px-3 py-2">
          <Thermometer size={16} className="text-orange-400 shrink-0" />
          <div>
            <p className="text-[10px] text-f1-white/40 uppercase">Air</p>
            <p className="text-sm font-mono text-f1-white">{end.airTemp}°C</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-f1-carbon/30 rounded-lg px-3 py-2">
          <Thermometer size={16} className="text-red-400 shrink-0" />
          <div>
            <p className="text-[10px] text-f1-white/40 uppercase">Track</p>
            <p className="text-sm font-mono text-f1-white">{minTrackTemp}–{maxTrackTemp}°C</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-f1-carbon/30 rounded-lg px-3 py-2">
          <Droplets size={16} className="text-blue-400 shrink-0" />
          <div>
            <p className="text-[10px] text-f1-white/40 uppercase">Humidity</p>
            <p className="text-sm font-mono text-f1-white">{end.humidity}%</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-f1-carbon/30 rounded-lg px-3 py-2">
          <Wind size={16} className="text-cyan-400 shrink-0" />
          <div>
            <p className="text-[10px] text-f1-white/40 uppercase">Wind</p>
            <p className="text-sm font-mono text-f1-white">{end.windSpeed} km/h</p>
          </div>
        </div>
      </div>

      {hadRain && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-500/10 border border-blue-500/20">
          <Cloud size={14} className="text-blue-400" />
          <span className="text-xs text-blue-300 font-semibold">Rain detected during session</span>
        </div>
      )}
    </div>
  );
}
```

---

## Task 12: Team Radio Component

**Files:**
- Create: `src/components/race-detail/TeamRadioList.tsx`

Audio player list for team radio clips.

```tsx
"use client";

import { useState, useRef } from "react";
import { Play, Pause, Radio, Volume2 } from "lucide-react";

interface RadioMessage {
  driverNumber: number;
  driverName: string;
  teamColor: string;
  date: string;
  recordingUrl: string;
}

interface TeamRadioListProps {
  messages: RadioMessage[];
}

function RadioItem({ message }: { message: RadioMessage }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  const time = new Date(message.date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 border-b border-f1-gray/10 hover:bg-f1-carbon/20 transition-colors">
      <button
        onClick={togglePlay}
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors"
        style={{
          backgroundColor: playing ? `${message.teamColor}30` : "transparent",
          border: `1px solid ${message.teamColor}50`,
        }}
      >
        {playing ? (
          <Pause size={14} style={{ color: message.teamColor }} />
        ) : (
          <Play size={14} className="ml-0.5" style={{ color: message.teamColor }} />
        )}
      </button>

      <div
        className="w-1 h-6 rounded-full shrink-0"
        style={{ backgroundColor: message.teamColor }}
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-f1-white truncate">
          {message.driverName}
        </p>
      </div>

      <span className="text-[10px] text-f1-white/30 font-mono shrink-0">
        {time}
      </span>

      <audio
        ref={audioRef}
        src={message.recordingUrl}
        onEnded={() => setPlaying(false)}
        preload="none"
      />
    </div>
  );
}

export default function TeamRadioList({ messages }: TeamRadioListProps) {
  if (messages.length === 0) {
    return (
      <div className="card flex items-center justify-center py-12">
        <p className="text-f1-white/30 text-sm">No team radio available</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-f1-gray/30 bg-f1-carbon/20">
        <Radio size={16} className="text-f1-cyan" />
        <h3 className="font-heading text-sm font-bold text-f1-white/80 uppercase tracking-wider">
          Team Radio
        </h3>
        <span className="text-[10px] text-f1-white/30 ml-auto">{messages.length} messages</span>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {messages.map((msg, i) => (
          <RadioItem key={i} message={msg} />
        ))}
      </div>
    </div>
  );
}
```

---

## Task 13: Animated Starting Grid Component

**Files:**
- Create: `src/components/race-detail/StartingGrid.tsx`

Visual 2-wide grid layout mimicking actual F1 starting positions.

```tsx
"use client";

import { motion } from "framer-motion";

interface GridDriver {
  position: number;
  driverCode: string;
  driverName: string;
  constructorName: string;
  teamColor: string;
  q3Time?: string | null;
}

interface StartingGridProps {
  drivers: GridDriver[];
}

export default function StartingGrid({ drivers }: StartingGridProps) {
  if (drivers.length === 0) {
    return (
      <div className="card flex items-center justify-center py-12">
        <p className="text-f1-white/30 text-sm">No qualifying data available</p>
      </div>
    );
  }

  // Group into rows of 2 (odd positions left, even positions right)
  const rows: [GridDriver | null, GridDriver | null][] = [];
  for (let i = 0; i < drivers.length; i += 2) {
    rows.push([drivers[i] ?? null, drivers[i + 1] ?? null]);
  }

  return (
    <div className="card p-4 overflow-hidden">
      <h3 className="font-heading text-sm font-bold text-f1-white/80 uppercase tracking-wider mb-4">
        Starting Grid
      </h3>

      {/* Grid track visual */}
      <div className="relative max-w-md mx-auto">
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-f1-gray/20 -translate-x-1/2" />

        <div className="flex flex-col gap-1">
          {rows.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-2 items-center">
              {/* Left slot (odd position) */}
              {row[0] ? (
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: rowIdx * 0.08 }}
                  className="flex-1 flex items-center gap-2 rounded-lg border border-f1-gray/20 px-3 py-2 bg-f1-carbon/20"
                  style={{ borderLeftColor: row[0].teamColor, borderLeftWidth: 3 }}
                >
                  <span className="font-mono text-sm font-bold text-f1-white/50 w-6 text-center">
                    {row[0].position}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-f1-white truncate">
                      {row[0].driverCode}
                    </p>
                    <p className="text-[10px] text-f1-white/40 truncate">
                      {row[0].constructorName}
                    </p>
                  </div>
                  {row[0].q3Time && (
                    <span className="text-[10px] font-mono text-f1-white/30">
                      {row[0].q3Time}
                    </span>
                  )}
                </motion.div>
              ) : (
                <div className="flex-1" />
              )}

              {/* Right slot (even position, offset forward) */}
              {row[1] ? (
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: rowIdx * 0.08 + 0.04 }}
                  className="flex-1 flex items-center gap-2 rounded-lg border border-f1-gray/20 px-3 py-2 bg-f1-carbon/20 mt-3"
                  style={{ borderLeftColor: row[1].teamColor, borderLeftWidth: 3 }}
                >
                  <span className="font-mono text-sm font-bold text-f1-white/50 w-6 text-center">
                    {row[1].position}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-f1-white truncate">
                      {row[1].driverCode}
                    </p>
                    <p className="text-[10px] text-f1-white/40 truncate">
                      {row[1].constructorName}
                    </p>
                  </div>
                  {row[1].q3Time && (
                    <span className="text-[10px] font-mono text-f1-white/30">
                      {row[1].q3Time}
                    </span>
                  )}
                </motion.div>
              ) : (
                <div className="flex-1" />
              )}
            </div>
          ))}
        </div>

        {/* Start line */}
        <div className="mt-4 h-1 w-full bg-gradient-to-r from-transparent via-f1-white/30 to-transparent rounded-full" />
        <p className="text-center text-[10px] text-f1-white/30 mt-1 uppercase tracking-widest">
          Start / Finish
        </p>
      </div>
    </div>
  );
}
```

---

## Task 14: Speed Trap / Qualifying Sectors Component

**Files:**
- Create: `src/components/race-detail/QualifyingSectors.tsx`

Stacked bar chart showing sector times with purple/green/yellow coloring.

```tsx
"use client";

import { motion } from "framer-motion";

interface DriverSectors {
  driverCode: string;
  teamColor: string;
  position: number;
  s1: number | null;
  s2: number | null;
  s3: number | null;
  totalTime: number | null;
  speedTrap: number | null;
}

interface QualifyingSectorsProps {
  drivers: DriverSectors[];
  bestS1: number;
  bestS2: number;
  bestS3: number;
}

function getSectorColor(time: number | null, best: number): string {
  if (time === null) return "bg-f1-gray/40";
  if (time <= best) return "bg-purple-500"; // overall best
  if (time <= best * 1.003) return "bg-green-500"; // within 0.3%
  return "bg-yellow-400"; // slower
}

export default function QualifyingSectors({ drivers, bestS1, bestS2, bestS3 }: QualifyingSectorsProps) {
  if (drivers.length === 0) {
    return (
      <div className="card flex items-center justify-center py-12">
        <p className="text-f1-white/30 text-sm">No sector data available</p>
      </div>
    );
  }

  const maxTotal = Math.max(...drivers.filter((d) => d.totalTime).map((d) => d.totalTime!));

  return (
    <div className="card p-4 overflow-hidden">
      <h3 className="font-heading text-sm font-bold text-f1-white/80 uppercase tracking-wider mb-2">
        Qualifying Sectors
      </h3>

      {/* Legend */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-purple-500" />
          <span className="text-[10px] text-f1-white/50">Overall Best</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <span className="text-[10px] text-f1-white/50">Personal Best</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-yellow-400" />
          <span className="text-[10px] text-f1-white/50">Slower</span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {drivers.map((driver, i) => {
          const total = driver.totalTime ?? maxTotal;

          return (
            <div key={driver.driverCode} className="flex items-center gap-2">
              <div className="w-6 text-right shrink-0">
                <span className="text-[10px] text-f1-white/40 font-mono">P{driver.position}</span>
              </div>
              <div className="w-10 shrink-0">
                <span className="text-xs font-bold text-f1-white/80 font-mono">{driver.driverCode}</span>
              </div>

              {/* Sector bars */}
              <div className="flex-1 flex h-6 rounded-sm overflow-hidden">
                {[
                  { time: driver.s1, best: bestS1, label: "S1" },
                  { time: driver.s2, best: bestS2, label: "S2" },
                  { time: driver.s3, best: bestS3, label: "S3" },
                ].map((sector) => {
                  const widthPct = sector.time ? (sector.time / total) * 100 : 33;
                  return (
                    <motion.div
                      key={sector.label}
                      className={`${getSectorColor(sector.time, sector.best)} flex items-center justify-center border-r border-f1-black/30`}
                      style={{ width: `${widthPct}%` }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.4, delay: i * 0.03 }}
                    >
                      <span className="text-[8px] font-mono font-bold text-black/70">
                        {sector.time?.toFixed(3) ?? "-"}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Speed trap */}
              {driver.speedTrap && (
                <span className="text-[10px] font-mono text-f1-white/40 w-14 text-right shrink-0">
                  {driver.speedTrap} km/h
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## Task 15: Race Detail Page

**Files:**
- Create: `src/app/results/[season]/[round]/page.tsx`

The main race story page that assembles all the new components.

```tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, Trophy, Flag } from "lucide-react";
import LapPositionChart from "@/components/race-detail/LapPositionChart";
import TireStrategy from "@/components/race-detail/TireStrategy";
import PitStopChart from "@/components/race-detail/PitStopChart";
import RaceControlTimeline from "@/components/race-detail/RaceControlTimeline";
import WeatherTimeline from "@/components/race-detail/WeatherTimeline";
import TeamRadioList from "@/components/race-detail/TeamRadioList";
import StartingGrid from "@/components/race-detail/StartingGrid";
import QualifyingSectors from "@/components/race-detail/QualifyingSectors";
import { getTeamColor } from "@/lib/team-colors";

export default function RaceDetailPage() {
  const params = useParams<{ season: string; round: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/race-detail/${params.season}/${params.round}`);
        if (!res.ok) throw new Error("Failed to load race data");
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.season, params.round]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="card animate-pulse h-32" />
        <div className="card animate-pulse h-96" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card flex items-center justify-center py-16">
        <p className="text-f1-white/50">{error ?? "Race not found"}</p>
      </div>
    );
  }

  const { race, results, qualifying, pitStops, lapTimings, openF1, hasOpenF1Data } = data;

  // ── Build lap position data from Jolpica lap timings ──
  const lapPositionData = lapTimings.map((lap: any) => {
    const positions: Record<string, number> = {};
    for (const timing of lap.Timings) {
      positions[timing.driverId] = parseInt(timing.position);
    }
    return { lap: parseInt(lap.number), positions };
  });

  const driverInfoMap = new Map(
    results.map((r: any) => [
      r.driverId,
      {
        driverId: r.driverId,
        code: r.driver.code ?? r.driver.lastName.substring(0, 3).toUpperCase(),
        color: r.constructor.colorPrimary ?? getTeamColor(r.constructorId),
      },
    ])
  );
  const lapChartDrivers = Array.from(driverInfoMap.values());

  // ── Build tire strategy data from OpenF1 stints ──
  const openF1DriverMap = new Map(
    openF1.drivers.map((d: any) => [d.driver_number, d])
  );

  const stintsByDriver = new Map<number, any[]>();
  for (const stint of openF1.stints) {
    const existing = stintsByDriver.get(stint.driver_number) ?? [];
    existing.push(stint);
    stintsByDriver.set(stint.driver_number, existing);
  }

  const tireDrivers = Array.from(stintsByDriver.entries())
    .map(([driverNumber, stints]) => {
      const driverInfo = openF1DriverMap.get(driverNumber);
      return {
        driverNumber,
        abbreviation: driverInfo?.name_acronym ?? `#${driverNumber}`,
        teamColor: driverInfo?.team_colour ? `#${driverInfo.team_colour}` : "#666",
        stints: stints.map((s: any) => ({
          compound: s.compound ?? "UNKNOWN",
          lapStart: s.lap_start ?? 1,
          lapEnd: s.lap_end ?? s.lap_start ?? 1,
          tyreAge: s.tyre_age_at_start ?? 0,
        })),
      };
    })
    .sort((a, b) => {
      // Sort by finishing position if possible
      const posA = results.findIndex((r: any) => {
        const dInfo = openF1DriverMap.get(a.driverNumber);
        return dInfo && r.driver.code === dInfo.name_acronym;
      });
      const posB = results.findIndex((r: any) => {
        const dInfo = openF1DriverMap.get(b.driverNumber);
        return dInfo && r.driver.code === dInfo.name_acronym;
      });
      return (posA === -1 ? 99 : posA) - (posB === -1 ? 99 : posB);
    });

  const totalLaps = results[0]?.laps ?? 0;

  // ── Build pit stop data ──
  const pitStopData = pitStops.map((ps: any) => {
    const result = results.find((r: any) => r.driverId === ps.driverId);
    return {
      driverId: ps.driverId,
      driverCode: result?.driver?.code ?? ps.driverId.substring(0, 3).toUpperCase(),
      teamColor: result?.constructor?.colorPrimary ?? getTeamColor(result?.constructorId ?? ""),
      lap: parseInt(ps.lap),
      stop: parseInt(ps.stop),
      duration: ps.duration,
    };
  });

  // ── Build race control data ──
  const raceControlEvents = openF1.raceControl.map((rc: any) => ({
    date: rc.date,
    category: rc.category,
    flag: rc.flag,
    message: rc.message,
    driverNumber: rc.driver_number,
    lapNumber: rc.lap_number,
    scope: rc.scope,
  }));

  // ── Build weather data ──
  const weatherReadings = openF1.weather.map((w: any) => ({
    date: w.date,
    airTemp: w.air_temperature,
    trackTemp: w.track_temperature,
    humidity: w.humidity,
    windSpeed: w.wind_speed,
    windDirection: w.wind_direction,
    rainfall: w.rainfall,
  }));

  // ── Build team radio data ──
  const radioMessages = openF1.teamRadio.map((tr: any) => {
    const driverInfo = openF1DriverMap.get(tr.driver_number);
    return {
      driverNumber: tr.driver_number,
      driverName: driverInfo?.full_name ?? driverInfo?.name_acronym ?? `#${tr.driver_number}`,
      teamColor: driverInfo?.team_colour ? `#${driverInfo.team_colour}` : "#666",
      date: tr.date,
      recordingUrl: tr.recording_url,
    };
  });

  // ── Build starting grid data ──
  const gridDrivers = qualifying.map((q: any) => ({
    position: q.position ?? 99,
    driverCode: q.driver.code ?? q.driver.lastName.substring(0, 3).toUpperCase(),
    driverName: `${q.driver.firstName} ${q.driver.lastName}`,
    constructorName: q.constructor.name,
    teamColor: q.constructor.colorPrimary ?? getTeamColor(q.constructorId),
    q3Time: q.q3 ?? q.q2 ?? q.q1 ?? null,
  }));

  // ── Build qualifying sectors data (from OpenF1 laps for qualifying session) ──
  // Note: This uses race session laps; for actual qualifying sectors we'd need
  // the qualifying session key. For now, we show speed trap data from race laps.
  const sectorDrivers = openF1.laps.length > 0
    ? (() => {
        // Get the fastest lap per driver
        const bestLaps = new Map<number, any>();
        for (const lap of openF1.laps) {
          if (!lap.duration_sector_1 || !lap.duration_sector_2 || !lap.duration_sector_3) continue;
          const existing = bestLaps.get(lap.driver_number);
          const total = lap.duration_sector_1 + lap.duration_sector_2 + lap.duration_sector_3;
          if (!existing || total < existing.total) {
            bestLaps.set(lap.driver_number, { ...lap, total });
          }
        }

        const allS1 = Array.from(bestLaps.values()).map((l) => l.duration_sector_1);
        const allS2 = Array.from(bestLaps.values()).map((l) => l.duration_sector_2);
        const allS3 = Array.from(bestLaps.values()).map((l) => l.duration_sector_3);

        const bs1 = Math.min(...allS1);
        const bs2 = Math.min(...allS2);
        const bs3 = Math.min(...allS3);

        const sectorData = Array.from(bestLaps.entries())
          .map(([driverNumber, lap]) => {
            const dInfo = openF1DriverMap.get(driverNumber);
            const result = results.find((r: any) => r.driver.code === dInfo?.name_acronym);
            return {
              driverCode: dInfo?.name_acronym ?? `#${driverNumber}`,
              teamColor: dInfo?.team_colour ? `#${dInfo.team_colour}` : "#666",
              position: result?.position ?? 99,
              s1: lap.duration_sector_1,
              s2: lap.duration_sector_2,
              s3: lap.duration_sector_3,
              totalTime: lap.total,
              speedTrap: lap.st_speed,
            };
          })
          .sort((a, b) => a.totalTime - b.totalTime);

        return { drivers: sectorData, bestS1: bs1, bestS2: bs2, bestS3: bs3 };
      })()
    : null;

  const raceDate = new Date(race.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="card relative overflow-hidden" style={{
        background: "linear-gradient(135deg, #1A1A1A 0%, #0D0D0D 70%, #1A1A1A 100%)",
      }}>
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at bottom right, rgba(225,6,0,0.4), transparent 60%)",
          }}
        />
        <div className="relative z-10">
          <Link
            href="/results"
            className="inline-flex items-center gap-1.5 text-xs text-f1-white/40 hover:text-f1-white transition-colors mb-4"
          >
            <ArrowLeft size={14} />
            Back to Results
          </Link>

          <h1 className="font-heading text-2xl md:text-3xl font-bold text-f1-white mb-2">
            {race.raceName}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-sm text-f1-white/50">
            <span className="flex items-center gap-1">
              <MapPin size={14} className="text-f1-red" />
              {race.circuit.name}
            </span>
            <span className="text-f1-white/20">|</span>
            <span>{race.circuit.country}</span>
            <span className="text-f1-white/20">|</span>
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {raceDate}
            </span>
            <span className="text-f1-white/20">|</span>
            <span className="font-mono">Round {race.round}</span>
          </div>

          {/* Winner banner */}
          {results.length > 0 && results[0].position === 1 && (
            <div className="flex items-center gap-2 mt-4 px-3 py-2 rounded-md bg-f1-carbon/30 border border-f1-yellow/20 w-fit">
              <Trophy size={16} className="text-f1-yellow" />
              <span className="text-sm font-heading font-bold text-f1-yellow">
                {results[0].driver.firstName} {results[0].driver.lastName}
              </span>
              <span className="text-xs text-f1-white/40">— {results[0].constructor.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Starting Grid */}
      {gridDrivers.length > 0 && <StartingGrid drivers={gridDrivers} />}

      {/* Lap Position Chart */}
      {lapPositionData.length > 0 && (
        <LapPositionChart
          data={lapPositionData}
          drivers={lapChartDrivers as any}
          totalLaps={totalLaps}
        />
      )}

      {/* Strategy row: Tires + Pit Stops */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tireDrivers.length > 0 && (
          <TireStrategy drivers={tireDrivers} totalLaps={totalLaps} />
        )}
        {pitStopData.length > 0 && <PitStopChart pitStops={pitStopData} />}
      </div>

      {/* Sectors + Speed Traps */}
      {sectorDrivers && sectorDrivers.drivers.length > 0 && (
        <QualifyingSectors
          drivers={sectorDrivers.drivers}
          bestS1={sectorDrivers.bestS1}
          bestS2={sectorDrivers.bestS2}
          bestS3={sectorDrivers.bestS3}
        />
      )}

      {/* Race Control + Weather row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {raceControlEvents.length > 0 && (
          <RaceControlTimeline events={raceControlEvents} />
        )}
        {weatherReadings.length > 0 && (
          <WeatherTimeline readings={weatherReadings} />
        )}
      </div>

      {/* Team Radio */}
      {radioMessages.length > 0 && <TeamRadioList messages={radioMessages} />}

      {/* Full Results Table */}
      {results.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-f1-gray/30 bg-f1-carbon/20">
            <Flag size={16} className="text-f1-red" />
            <h3 className="font-heading text-sm font-bold text-f1-white/80 uppercase tracking-wider">
              Race Classification
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-f1-white/40 border-b border-f1-gray/20">
                  <th className="text-left px-4 py-2">Pos</th>
                  <th className="text-left px-4 py-2">Driver</th>
                  <th className="text-left px-4 py-2">Team</th>
                  <th className="text-center px-4 py-2">Grid</th>
                  <th className="text-center px-4 py-2">Laps</th>
                  <th className="text-right px-4 py-2">Status</th>
                  <th className="text-right px-4 py-2">Points</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r: any) => (
                  <tr key={r.id} className="border-b border-f1-gray/10 hover:bg-f1-carbon/20">
                    <td className="px-4 py-2 font-mono font-bold text-f1-white">
                      {r.positionText ?? "—"}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-1 h-5 rounded-full"
                          style={{ backgroundColor: r.constructor.colorPrimary ?? "#666" }}
                        />
                        <span className="text-f1-white font-medium">
                          {r.driver.firstName} {r.driver.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-f1-white/50">{r.constructor.name}</td>
                    <td className="px-4 py-2 text-center font-mono text-f1-white/60">{r.grid}</td>
                    <td className="px-4 py-2 text-center font-mono text-f1-white/60">{r.laps}</td>
                    <td className="px-4 py-2 text-right text-f1-white/50">{r.status}</td>
                    <td className="px-4 py-2 text-right font-mono font-bold text-f1-white">
                      {r.points > 0 ? r.points : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Task 16: Constructor Battles Page

**Files:**
- Create: `src/app/battles/page.tsx`
- Create: `src/app/api/battles/route.ts`
- Create: `src/components/battles/BattlesClient.tsx`
- Create: `src/components/battles/TeamBattleCard.tsx`

**Step 1: API route**

`src/app/api/battles/route.ts`:

```typescript
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const currentYear = new Date().getFullYear();

  // Get all constructors with their drivers' results this season
  const constructors = await prisma.constructor.findMany({
    where: {
      results: { some: { race: { season: currentYear } } },
    },
    include: {
      results: {
        where: { race: { season: currentYear } },
        include: { driver: true, race: true },
        orderBy: [{ race: { round: "asc" } }],
      },
      qualifyingResults: {
        where: { race: { season: currentYear } },
        include: { driver: true, race: true },
        orderBy: [{ race: { round: "asc" } }],
      },
    },
  });

  const battles = constructors.map((team) => {
    // Find the two main drivers (most races)
    const driverRaceCounts = new Map<string, number>();
    for (const result of team.results) {
      driverRaceCounts.set(result.driverId, (driverRaceCounts.get(result.driverId) ?? 0) + 1);
    }

    const topDriverIds = Array.from(driverRaceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([id]) => id);

    if (topDriverIds.length < 2) return null;

    const [d1Id, d2Id] = topDriverIds;

    // Get shared races (rounds where both drivers have results)
    const d1Results = team.results.filter((r) => r.driverId === d1Id);
    const d2Results = team.results.filter((r) => r.driverId === d2Id);
    const d1Rounds = new Set(d1Results.map((r) => r.race.round));
    const d2Rounds = new Set(d2Results.map((r) => r.race.round));
    const sharedRounds = new Set([...d1Rounds].filter((r) => d2Rounds.has(r)));

    let d1RaceWins = 0;
    let d2RaceWins = 0;
    let d1Points = 0;
    let d2Points = 0;

    for (const round of sharedRounds) {
      const r1 = d1Results.find((r) => r.race.round === round);
      const r2 = d2Results.find((r) => r.race.round === round);
      if (r1 && r2 && r1.position && r2.position) {
        if (r1.position < r2.position) d1RaceWins++;
        else if (r2.position < r1.position) d2RaceWins++;
      }
      d1Points += r1?.points ?? 0;
      d2Points += r2?.points ?? 0;
    }

    // Qualifying battles
    const d1Quali = team.qualifyingResults.filter((q) => q.driverId === d1Id);
    const d2Quali = team.qualifyingResults.filter((q) => q.driverId === d2Id);
    const d1QualiRounds = new Set(d1Quali.map((q) => q.race.round));
    const d2QualiRounds = new Set(d2Quali.map((q) => q.race.round));
    const sharedQualiRounds = new Set([...d1QualiRounds].filter((r) => d2QualiRounds.has(r)));

    let d1QualiWins = 0;
    let d2QualiWins = 0;

    for (const round of sharedQualiRounds) {
      const q1 = d1Quali.find((q) => q.race.round === round);
      const q2 = d2Quali.find((q) => q.race.round === round);
      if (q1?.position && q2?.position) {
        if (q1.position < q2.position) d1QualiWins++;
        else if (q2.position < q1.position) d2QualiWins++;
      }
    }

    const d1Info = d1Results[0]?.driver;
    const d2Info = d2Results[0]?.driver;

    return {
      constructorId: team.constructorId,
      constructorName: team.name,
      colorPrimary: team.colorPrimary,
      colorSecondary: team.colorSecondary,
      driver1: {
        driverId: d1Id,
        code: d1Info?.code ?? d1Id.substring(0, 3).toUpperCase(),
        name: d1Info ? `${d1Info.firstName} ${d1Info.lastName}` : d1Id,
        raceWins: d1RaceWins,
        qualiWins: d1QualiWins,
        points: d1Points,
      },
      driver2: {
        driverId: d2Id,
        code: d2Info?.code ?? d2Id.substring(0, 3).toUpperCase(),
        name: d2Info ? `${d2Info.firstName} ${d2Info.lastName}` : d2Id,
        raceWins: d2RaceWins,
        qualiWins: d2QualiWins,
        points: d2Points,
      },
      totalRaces: sharedRounds.size,
    };
  }).filter(Boolean);

  return Response.json(battles);
}
```

**Step 2: TeamBattleCard component**

`src/components/battles/TeamBattleCard.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import { Trophy, Target, Zap } from "lucide-react";

interface DriverBattle {
  code: string;
  name: string;
  raceWins: number;
  qualiWins: number;
  points: number;
}

interface TeamBattleCardProps {
  constructorName: string;
  colorPrimary: string;
  colorSecondary: string;
  driver1: DriverBattle;
  driver2: DriverBattle;
  totalRaces: number;
  index: number;
}

function BattleBar({
  label,
  icon,
  v1,
  v2,
  color,
}: {
  label: string;
  icon: React.ReactNode;
  v1: number;
  v2: number;
  color: string;
}) {
  const total = v1 + v2 || 1;
  const pct1 = (v1 / total) * 100;
  const pct2 = (v2 / total) * 100;

  return (
    <div className="flex items-center gap-2">
      <span className={`font-mono text-xs w-6 text-right ${v1 > v2 ? "text-f1-white font-bold" : "text-f1-white/40"}`}>
        {v1}
      </span>
      <div className="flex-1 flex h-4 rounded-sm overflow-hidden bg-f1-carbon/30">
        <motion.div
          className="h-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct1}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        <motion.div
          className="h-full opacity-40"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct2}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <span className={`font-mono text-xs w-6 ${v2 > v1 ? "text-f1-white font-bold" : "text-f1-white/40"}`}>
        {v2}
      </span>
    </div>
  );
}

export default function TeamBattleCard({
  constructorName,
  colorPrimary,
  colorSecondary,
  driver1,
  driver2,
  totalRaces,
  index,
}: TeamBattleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="card overflow-hidden"
    >
      {/* Team color header */}
      <div
        className="h-1.5 w-full"
        style={{ background: `linear-gradient(to right, ${colorPrimary}, ${colorSecondary || colorPrimary})` }}
      />

      <div className="p-4">
        {/* Team name */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-base font-bold text-f1-white">{constructorName}</h3>
          <span className="text-[10px] text-f1-white/30 font-mono">{totalRaces} races</span>
        </div>

        {/* Driver names */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-f1-carbon">
          <span className="text-sm font-bold text-f1-white">{driver1.code}</span>
          <span className="text-[10px] text-f1-white/30 uppercase tracking-widest">VS</span>
          <span className="text-sm font-bold text-f1-white">{driver2.code}</span>
        </div>

        {/* Battle bars */}
        <div className="flex flex-col gap-2">
          <div>
            <p className="text-[10px] text-f1-white/40 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Trophy size={10} /> Race
            </p>
            <BattleBar label="Race" icon={<Trophy size={10} />} v1={driver1.raceWins} v2={driver2.raceWins} color={colorPrimary} />
          </div>
          <div>
            <p className="text-[10px] text-f1-white/40 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Target size={10} /> Qualifying
            </p>
            <BattleBar label="Quali" icon={<Target size={10} />} v1={driver1.qualiWins} v2={driver2.qualiWins} color={colorPrimary} />
          </div>
          <div>
            <p className="text-[10px] text-f1-white/40 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Zap size={10} /> Points
            </p>
            <BattleBar label="Points" icon={<Zap size={10} />} v1={driver1.points} v2={driver2.points} color={colorPrimary} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
```

**Step 3: BattlesClient and page**

`src/components/battles/BattlesClient.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import TeamBattleCard from "./TeamBattleCard";

export default function BattlesClient() {
  const [battles, setBattles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/battles")
      .then((r) => r.json())
      .then((data) => setBattles(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="card animate-pulse h-48" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {battles.map((battle: any, i: number) => (
        <TeamBattleCard
          key={battle.constructorId}
          constructorName={battle.constructorName}
          colorPrimary={battle.colorPrimary ?? "#3D3D3D"}
          colorSecondary={battle.colorSecondary ?? battle.colorPrimary ?? "#3D3D3D"}
          driver1={battle.driver1}
          driver2={battle.driver2}
          totalRaces={battle.totalRaces}
          index={i}
        />
      ))}
    </div>
  );
}
```

`src/app/battles/page.tsx`:

```tsx
import { Swords } from "lucide-react";
import BattlesClient from "@/components/battles/BattlesClient";

export default function BattlesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Swords size={20} className="text-f1-red" />
          <h1 className="font-heading text-2xl font-bold text-f1-white">
            Constructor Battles
          </h1>
        </div>
        <p className="text-sm text-f1-white/40">
          Teammate head-to-head battles across the {new Date().getFullYear()} season
        </p>
      </div>

      <div className="accent-line" />

      <BattlesClient />
    </div>
  );
}
```

---

## Task 17: Season Timeline Dashboard Widget

**Files:**
- Create: `src/components/dashboard/SeasonTimeline.tsx`
- Modify: `src/app/page.tsx` (add the widget)

**Step 1: Create the SeasonTimeline component**

```tsx
import Link from "next/link";
import { TrendingUp } from "lucide-react";

interface TimelineRace {
  round: number;
  raceName: string;
  date: string;
  isPast: boolean;
  isNext: boolean;
  winnerColor: string | null;
  winnerCode: string | null;
}

interface SeasonTimelineProps {
  races: TimelineRace[];
  season: number;
}

export default function SeasonTimeline({ races, season }: SeasonTimelineProps) {
  if (races.length === 0) return null;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={18} className="text-f1-cyan" />
        <h2 className="font-heading text-lg font-semibold text-f1-white">
          {season} Season
        </h2>
        <span className="text-xs text-f1-white/30 ml-auto">
          {races.filter((r) => r.isPast).length} / {races.length} races
        </span>
      </div>

      {/* Timeline strip */}
      <div className="flex gap-1 items-end h-12">
        {races.map((race) => (
          <Link
            key={race.round}
            href={race.isPast ? `/results/${season}/${race.round}` : "/schedule"}
            className="flex-1 group relative"
            title={`R${race.round}: ${race.raceName}`}
          >
            <div
              className={`w-full rounded-t-sm transition-all duration-200 ${
                race.isNext
                  ? "h-10 border-2 border-f1-red animate-pulse-glow"
                  : race.isPast
                    ? "h-8 hover:h-10"
                    : "h-4 opacity-30"
              }`}
              style={{
                backgroundColor: race.isPast
                  ? race.winnerColor ?? "#3D3D3D"
                  : race.isNext
                    ? "#E10600"
                    : "#2D2D2D",
              }}
            />
            {/* Round number on hover */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-f1-black border border-f1-carbon rounded px-1.5 py-0.5 text-[8px] text-f1-white/70 whitespace-nowrap hidden group-hover:block z-10 pointer-events-none">
              R{race.round} {race.winnerCode ?? ""}
            </div>
          </Link>
        ))}
      </div>

      {/* Scale labels */}
      <div className="flex justify-between mt-1 text-[9px] text-f1-white/20 font-mono">
        <span>R1</span>
        <span>R{races.length}</span>
      </div>
    </div>
  );
}
```

**Step 2: Integrate into dashboard page**

Add to `src/app/page.tsx`:

1. Import `SeasonTimeline`
2. Query all races for the current season with their winner info
3. Add the widget between the standings and recent result sections

Query to add:

```typescript
const allRaces = await prisma.race.findMany({
  where: { season: currentYear },
  include: {
    results: {
      where: { position: 1 },
      include: { driver: true, constructor: true },
      take: 1,
    },
  },
  orderBy: { round: "asc" },
});

const timelineData = allRaces.map((race) => {
  const winner = race.results[0];
  return {
    round: race.round,
    raceName: race.raceName,
    date: race.date.toISOString().split("T")[0],
    isPast: race.date < now,
    isNext: nextRace?.id === race.id,
    winnerColor: winner?.constructor?.colorPrimary ?? null,
    winnerCode: winner?.driver?.code ?? null,
  };
});
```

Add to JSX after the standings grid:

```tsx
<SeasonTimeline races={timelineData} season={currentYear} />
```

---

## Task 18: Update Navigation Sidebar

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

Add the new Battles page to the sidebar navigation.

**Step 1: Add nav link**

Add to the `navLinks` array after head-to-head:

```typescript
import { Swords } from "lucide-react";

// In navLinks array, after the head-to-head entry:
{ href: "/battles", label: "Battles", icon: Swords },
```

---

## Task 19: Link Results Page to Race Detail

**Files:**
- Modify: `src/components/results/ResultsClient.tsx` (or wherever race results are rendered)

Add a "View Race Detail" link/button on the results page that navigates to `/results/[season]/[round]` for the currently selected race.

Add a link like:

```tsx
<Link
  href={`/results/${selectedSeason}/${selectedRound}`}
  className="flex items-center gap-1.5 text-xs text-f1-cyan hover:text-f1-cyan/80 transition-colors"
>
  <BarChart3 size={14} />
  Full Race Analysis
</Link>
```

---

## Task 20: Circuit SVG Placeholder Files

**Files:**
- Create: `public/circuits/` directory with placeholder SVGs

Create minimal SVG files for the most common circuits. These are simple single-path track outlines. Each file should be a clean SVG with a white stroke on transparent background.

For the initial build, create at least placeholder SVGs for the current season circuits. These can be replaced with proper track outlines later.

A minimal placeholder SVG:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" fill="none" stroke="white" stroke-width="2">
  <text x="100" y="60" text-anchor="middle" fill="white" font-size="12" stroke="none">Circuit</text>
</svg>
```

---

## Task 21: Integrate Circuit Maps into Schedule

**Files:**
- Modify: `src/components/schedule/RaceCard.tsx`

Add the `CircuitMap` component (compact mode) to the expanded section of each race card, alongside the session times.

Import `getCircuitInfo` and `CircuitMap`, then add within the expanded AnimatePresence block:

```tsx
const circuitInfo = getCircuitInfo(race.circuitId);

// Inside the expanded section, above or alongside SessionTimes:
{circuitInfo && <CircuitMap circuitId={race.circuitId} circuitInfo={circuitInfo} compact />}
```

Note: The `race` prop needs to include `circuitId` — check if the `RaceCardData` interface needs to be updated.

---

## Execution Summary

**Total tasks:** 21
**New files created:** ~18
**Modified files:** ~8
**New API routes:** 2 (`/api/race-detail/[season]/[round]`, `/api/battles`)
**New pages:** 2 (`/results/[season]/[round]`, `/battles`)
**New components:** 12
**External APIs utilized:** OpenF1 (6 new endpoints), Jolpica (2 new endpoints)

**Build order (dependency chain):**
1. Tasks 1-2: API client extensions (no dependencies)
2. Tasks 3-4: API routes (depend on Tasks 1-2)
3. Tasks 6-14: Components (independent of each other, depend on types from Tasks 1-2)
4. Task 15: Race Detail page (depends on Tasks 3, 7-14)
5. Task 16: Constructor Battles page (independent)
6. Task 17: Season Timeline (depends on page.tsx)
7. Tasks 18-21: Integration & navigation (depend on previous tasks)

**After all tasks are complete:** Run `docker compose build && docker compose up -d` to deploy.
