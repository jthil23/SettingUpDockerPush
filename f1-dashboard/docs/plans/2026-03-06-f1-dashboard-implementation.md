# F1 Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Dockerized F1 dashboard with race schedules, standings, results, driver profiles, head-to-head comparisons, and predictions — all powered by MySQL and external F1 APIs.

**Architecture:** Single Next.js 15 monolith container with Prisma ORM connecting to MySQL on Unraid. node-cron syncs data from Jolpica API into MySQL. OpenF1 streams live session data via SSE.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Prisma, Tailwind CSS, Framer Motion, Recharts, Lucide React, node-cron, Docker

---

## Phase 1: Project Scaffolding & Database

### Task 1: Initialize Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`

**Step 1: Scaffold Next.js with TypeScript and Tailwind**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

**Step 2: Install additional dependencies**

Run:
```bash
npm install prisma @prisma/client node-cron framer-motion recharts lucide-react
npm install -D @types/node-cron
```

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 project with dependencies"
```

---

### Task 2: Configure Tailwind theme with F1 design tokens

**Files:**
- Modify: `tailwind.config.ts`
- Create: `src/app/globals.css` (modify existing)

**Step 1: Update Tailwind config with F1 color palette and fonts**

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        f1: {
          black: "#0D0D0D",
          dark: "#1A1A1A",
          carbon: "#2D2D2D",
          gray: "#3D3D3D",
          red: "#E10600",
          cyan: "#00D2BE",
          yellow: "#FFF500",
          white: "#F0F0F0",
        },
      },
      backgroundImage: {
        "carbon-fiber":
          "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "slide-in": "slide-in 0.3s ease-out",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 5px rgba(225,6,0,0.5)" },
          "50%": { boxShadow: "0 0 20px rgba(225,6,0,0.8)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-10px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
```

**Step 2: Update globals.css with base dark styles**

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-f1-black text-f1-white antialiased;
  }

  ::-webkit-scrollbar {
    @apply w-2;
  }
  ::-webkit-scrollbar-track {
    @apply bg-f1-dark;
  }
  ::-webkit-scrollbar-thumb {
    @apply bg-f1-carbon rounded-full;
  }
}

@layer components {
  .card {
    @apply bg-f1-dark border border-f1-carbon rounded-xl p-4 backdrop-blur-sm;
  }
  .card-hover {
    @apply card hover:border-f1-red/50 transition-all duration-300;
  }
  .accent-line {
    @apply h-1 w-full bg-gradient-to-r from-f1-red via-f1-cyan to-f1-yellow;
  }
  .glow-red {
    @apply shadow-[0_0_15px_rgba(225,6,0,0.3)];
  }
  .glow-cyan {
    @apply shadow-[0_0_15px_rgba(0,210,190,0.3)];
  }
}
```

**Step 3: Commit**

```bash
git add tailwind.config.ts src/app/globals.css
git commit -m "style: configure Tailwind with F1 dark racing theme"
```

---

### Task 3: Prisma schema and database setup

**Files:**
- Create: `prisma/schema.prisma`
- Create: `.env` (local), `.env.example`

**Step 1: Initialize Prisma**

Run:
```bash
npx prisma init --datasource-provider mysql
```

**Step 2: Write the full Prisma schema**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model Season {
  year         Int    @id
  wikipediaUrl String @map("wikipedia_url") @db.VarChar(500)

  races Races[]

  @@map("seasons")
}

model Circuit {
  circuitId String @id @map("circuit_id") @db.VarChar(100)
  name      String @db.VarChar(200)
  location  String @db.VarChar(200)
  country   String @db.VarChar(100)
  lat       Float
  lng       Float
  imageUrl  String? @map("image_url") @db.VarChar(500)

  races Races[]

  @@map("circuits")
}

model Driver {
  driverId    String  @id @map("driver_id") @db.VarChar(100)
  code        String? @db.VarChar(10)
  number      Int?
  firstName   String  @map("first_name") @db.VarChar(100)
  lastName    String  @map("last_name") @db.VarChar(100)
  dob         DateTime? @db.Date
  nationality String  @db.VarChar(100)
  imageUrl    String? @map("image_url") @db.VarChar(500)

  results            Result[]
  qualifyingResults  QualifyingResult[]
  driverStandings    DriverStanding[]
  predictions        Prediction[]

  @@map("drivers")
}

model Constructor {
  constructorId String @id @map("constructor_id") @db.VarChar(100)
  name          String @db.VarChar(200)
  nationality   String @db.VarChar(100)
  colorPrimary  String? @map("color_primary") @db.VarChar(7)
  colorSecondary String? @map("color_secondary") @db.VarChar(7)
  logoUrl       String? @map("logo_url") @db.VarChar(500)

  results              Result[]
  qualifyingResults    QualifyingResult[]
  constructorStandings ConstructorStanding[]

  @@map("constructors")
}

model Races {
  id        Int      @id @default(autoincrement()) @map("race_id")
  season    Int
  round     Int
  circuitId String   @map("circuit_id") @db.VarChar(100)
  raceName  String   @map("race_name") @db.VarChar(200)
  date      DateTime @db.Date
  time      String?  @db.VarChar(20)
  fp1Date   DateTime? @map("fp1_date")
  fp1Time   String?   @map("fp1_time") @db.VarChar(20)
  fp2Date   DateTime? @map("fp2_date")
  fp2Time   String?   @map("fp2_time") @db.VarChar(20)
  fp3Date   DateTime? @map("fp3_date")
  fp3Time   String?   @map("fp3_time") @db.VarChar(20)
  qualiDate DateTime? @map("quali_date")
  qualiTime String?   @map("quali_time") @db.VarChar(20)
  sprintDate DateTime? @map("sprint_date")
  sprintTime String?   @map("sprint_time") @db.VarChar(20)

  seasonRef Season  @relation(fields: [season], references: [year])
  circuit   Circuit @relation(fields: [circuitId], references: [circuitId])

  results              Result[]
  qualifyingResults    QualifyingResult[]
  driverStandings      DriverStanding[]
  constructorStandings ConstructorStanding[]
  predictions          Prediction[]

  @@unique([season, round])
  @@map("races")
}

model Result {
  id             Int     @id @default(autoincrement()) @map("result_id")
  raceId         Int     @map("race_id")
  driverId       String  @map("driver_id") @db.VarChar(100)
  constructorId  String  @map("constructor_id") @db.VarChar(100)
  grid           Int?
  position       Int?
  positionText   String? @map("position_text") @db.VarChar(10)
  points         Float   @default(0)
  laps           Int?
  status         String? @db.VarChar(100)
  fastestLapTime String? @map("fastest_lap_time") @db.VarChar(20)
  fastestLapRank Int?    @map("fastest_lap_rank")

  race        Races       @relation(fields: [raceId], references: [id])
  driver      Driver      @relation(fields: [driverId], references: [driverId])
  constructor Constructor @relation(fields: [constructorId], references: [constructorId])

  @@unique([raceId, driverId])
  @@map("results")
}

model QualifyingResult {
  id            Int     @id @default(autoincrement())
  raceId        Int     @map("race_id")
  driverId      String  @map("driver_id") @db.VarChar(100)
  constructorId String  @map("constructor_id") @db.VarChar(100)
  position      Int?
  q1            String? @db.VarChar(20)
  q2            String? @db.VarChar(20)
  q3            String? @db.VarChar(20)

  race        Races       @relation(fields: [raceId], references: [id])
  driver      Driver      @relation(fields: [driverId], references: [driverId])
  constructor Constructor @relation(fields: [constructorId], references: [constructorId])

  @@unique([raceId, driverId])
  @@map("qualifying_results")
}

model DriverStanding {
  id       Int    @id @default(autoincrement())
  raceId   Int    @map("race_id")
  driverId String @map("driver_id") @db.VarChar(100)
  points   Float  @default(0)
  position Int
  wins     Int    @default(0)

  race   Races  @relation(fields: [raceId], references: [id])
  driver Driver @relation(fields: [driverId], references: [driverId])

  @@unique([raceId, driverId])
  @@map("driver_standings")
}

model ConstructorStanding {
  id            Int    @id @default(autoincrement())
  raceId        Int    @map("race_id")
  constructorId String @map("constructor_id") @db.VarChar(100)
  points        Float  @default(0)
  position      Int
  wins          Int    @default(0)

  race        Races       @relation(fields: [raceId], references: [id])
  constructor Constructor @relation(fields: [constructorId], references: [constructorId])

  @@unique([raceId, constructorId])
  @@map("constructor_standings")
}

model Prediction {
  id              Int      @id @default(autoincrement()) @map("prediction_id")
  raceId          Int      @map("race_id")
  predictedWinner String   @map("predicted_winner") @db.VarChar(100)
  predictedPodium Json     @map("predicted_podium")
  predictedFastestLap String? @map("predicted_fastest_lap") @db.VarChar(100)
  createdAt       DateTime @default(now()) @map("created_at")
  actualWinner    String?  @map("actual_winner") @db.VarChar(100)
  actualPodium    Json?    @map("actual_podium")
  score           Int?

  race   Races  @relation(fields: [raceId], references: [id])
  winner Driver @relation(fields: [predictedWinner], references: [driverId])

  @@unique([raceId])
  @@map("predictions")
}

model SyncLog {
  id             Int      @id @default(autoincrement()) @map("sync_id")
  entity         String   @db.VarChar(100)
  lastSynced     DateTime @default(now()) @map("last_synced")
  status         String   @db.VarChar(50)
  recordsUpdated Int      @default(0) @map("records_updated")

  @@map("sync_log")
}
```

**Step 3: Create .env.example and .env**

```bash
# .env.example
DATABASE_URL="mysql://user:password@localhost:3306/JT-F1"
```

Copy to `.env` and fill in real MySQL credentials.

**Step 4: Create .gitignore additions**

Ensure `.env` is in `.gitignore` (Next.js scaffold should already include it).

**Step 5: Run Prisma migration**

Run:
```bash
npx prisma migrate dev --name init
```

**Step 6: Create Prisma client singleton**

Create `src/lib/prisma.ts`:
```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Step 7: Commit**

```bash
git add prisma/ src/lib/prisma.ts .env.example .gitignore
git commit -m "feat: add Prisma schema with full F1 data model"
```

---

## Phase 2: Data Sync Service

### Task 4: Jolpica API client

**Files:**
- Create: `src/lib/api/jolpica.ts`
- Create: `src/lib/api/types.ts`

**Step 1: Create API response types**

```ts
// src/lib/api/types.ts
export interface JolpicaDriver {
  driverId: string;
  code?: string;
  permanentNumber?: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  nationality: string;
  url: string;
}

export interface JolpicaConstructor {
  constructorId: string;
  name: string;
  nationality: string;
  url: string;
}

export interface JolpicaCircuit {
  circuitId: string;
  circuitName: string;
  Location: {
    lat: string;
    long: string;
    locality: string;
    country: string;
  };
  url: string;
}

export interface JolpicaRace {
  season: string;
  round: string;
  raceName: string;
  Circuit: JolpicaCircuit;
  date: string;
  time?: string;
  FirstPractice?: { date: string; time: string };
  SecondPractice?: { date: string; time: string };
  ThirdPractice?: { date: string; time: string };
  Qualifying?: { date: string; time: string };
  Sprint?: { date: string; time: string };
  Results?: JolpicaResult[];
  QualifyingResults?: JolpicaQualifyingResult[];
}

export interface JolpicaResult {
  number: string;
  position: string;
  positionText: string;
  points: string;
  Driver: JolpicaDriver;
  Constructor: JolpicaConstructor;
  grid: string;
  laps: string;
  status: string;
  FastestLap?: {
    rank: string;
    Time?: { time: string };
  };
}

export interface JolpicaQualifyingResult {
  position: string;
  Driver: JolpicaDriver;
  Constructor: JolpicaConstructor;
  Q1?: string;
  Q2?: string;
  Q3?: string;
}

export interface JolpicaStanding {
  position: string;
  points: string;
  wins: string;
  Driver?: JolpicaDriver;
  Constructor?: JolpicaConstructor;
  Constructors?: JolpicaConstructor[];
}
```

**Step 2: Create Jolpica API client**

```ts
// src/lib/api/jolpica.ts
import type {
  JolpicaRace,
  JolpicaStanding,
  JolpicaDriver,
  JolpicaConstructor,
} from "./types";

const BASE_URL = "https://api.jolpi.ca/ergast/f1";

async function fetchJolpica<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}.json`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Jolpica API error: ${res.status} ${path}`);
  const data = await res.json();
  return data.MRData;
}

export async function getSeasonRaces(year: number): Promise<JolpicaRace[]> {
  const data = await fetchJolpica<any>(`/${year}`);
  return data.RaceTable.Races;
}

export async function getRaceResults(
  year: number,
  round: number
): Promise<JolpicaRace> {
  const data = await fetchJolpica<any>(`/${year}/${round}/results`);
  return data.RaceTable.Races[0];
}

export async function getQualifyingResults(
  year: number,
  round: number
): Promise<JolpicaRace> {
  const data = await fetchJolpica<any>(`/${year}/${round}/qualifying`);
  return data.RaceTable.Races[0];
}

export async function getDriverStandings(
  year: number,
  round?: number
): Promise<JolpicaStanding[]> {
  const path = round
    ? `/${year}/${round}/driverStandings`
    : `/${year}/driverStandings`;
  const data = await fetchJolpica<any>(path);
  return data.StandingsTable.StandingsLists[0]?.DriverStandings ?? [];
}

export async function getConstructorStandings(
  year: number,
  round?: number
): Promise<JolpicaStanding[]> {
  const path = round
    ? `/${year}/${round}/constructorStandings`
    : `/${year}/constructorStandings`;
  const data = await fetchJolpica<any>(path);
  return data.StandingsTable.StandingsLists[0]?.ConstructorStandings ?? [];
}

export async function getAllDrivers(year: number): Promise<JolpicaDriver[]> {
  const data = await fetchJolpica<any>(`/${year}/drivers`);
  return data.DriverTable.Drivers;
}

export async function getAllConstructors(
  year: number
): Promise<JolpicaConstructor[]> {
  const data = await fetchJolpica<any>(`/${year}/constructors`);
  return data.ConstructorTable.Constructors;
}
```

**Step 3: Commit**

```bash
git add src/lib/api/
git commit -m "feat: add Jolpica F1 API client and response types"
```

---

### Task 5: Data sync service

**Files:**
- Create: `src/lib/sync/sync-service.ts`
- Create: `src/lib/sync/sync-scheduler.ts`

**Step 1: Create sync service with upsert logic**

```ts
// src/lib/sync/sync-service.ts
import { prisma } from "@/lib/prisma";
import * as jolpica from "@/lib/api/jolpica";

export async function syncSeason(year: number) {
  const races = await jolpica.getSeasonRaces(year);
  if (!races.length) return;

  // Upsert season
  await prisma.season.upsert({
    where: { year },
    update: {},
    create: { year, wikipediaUrl: "" },
  });

  // Upsert circuits
  for (const race of races) {
    const c = race.Circuit;
    await prisma.circuit.upsert({
      where: { circuitId: c.circuitId },
      update: { name: c.circuitName, location: c.Location.locality, country: c.Location.country },
      create: {
        circuitId: c.circuitId,
        name: c.circuitName,
        location: c.Location.locality,
        country: c.Location.country,
        lat: parseFloat(c.Location.lat),
        lng: parseFloat(c.Location.long),
      },
    });
  }

  // Upsert races
  for (const race of races) {
    await prisma.races.upsert({
      where: { season_round: { season: year, round: parseInt(race.round) } },
      update: {
        raceName: race.raceName,
        date: new Date(race.date),
        time: race.time ?? null,
        fp1Date: race.FirstPractice ? new Date(race.FirstPractice.date) : null,
        fp1Time: race.FirstPractice?.time ?? null,
        fp2Date: race.SecondPractice ? new Date(race.SecondPractice.date) : null,
        fp2Time: race.SecondPractice?.time ?? null,
        fp3Date: race.ThirdPractice ? new Date(race.ThirdPractice.date) : null,
        fp3Time: race.ThirdPractice?.time ?? null,
        qualiDate: race.Qualifying ? new Date(race.Qualifying.date) : null,
        qualiTime: race.Qualifying?.time ?? null,
        sprintDate: race.Sprint ? new Date(race.Sprint.date) : null,
        sprintTime: race.Sprint?.time ?? null,
      },
      create: {
        season: year,
        round: parseInt(race.round),
        circuitId: race.Circuit.circuitId,
        raceName: race.raceName,
        date: new Date(race.date),
        time: race.time ?? null,
        fp1Date: race.FirstPractice ? new Date(race.FirstPractice.date) : null,
        fp1Time: race.FirstPractice?.time ?? null,
        fp2Date: race.SecondPractice ? new Date(race.SecondPractice.date) : null,
        fp2Time: race.SecondPractice?.time ?? null,
        fp3Date: race.ThirdPractice ? new Date(race.ThirdPractice.date) : null,
        fp3Time: race.ThirdPractice?.time ?? null,
        qualiDate: race.Qualifying ? new Date(race.Qualifying.date) : null,
        qualiTime: race.Qualifying?.time ?? null,
        sprintDate: race.Sprint ? new Date(race.Sprint.date) : null,
        sprintTime: race.Sprint?.time ?? null,
      },
    });
  }

  await logSync("seasons+races", races.length);
}

export async function syncDriversAndConstructors(year: number) {
  const [drivers, constructors] = await Promise.all([
    jolpica.getAllDrivers(year),
    jolpica.getAllConstructors(year),
  ]);

  for (const d of drivers) {
    await prisma.driver.upsert({
      where: { driverId: d.driverId },
      update: { code: d.code, firstName: d.givenName, lastName: d.familyName, nationality: d.nationality },
      create: {
        driverId: d.driverId,
        code: d.code ?? null,
        number: d.permanentNumber ? parseInt(d.permanentNumber) : null,
        firstName: d.givenName,
        lastName: d.familyName,
        dob: d.dateOfBirth ? new Date(d.dateOfBirth) : null,
        nationality: d.nationality,
      },
    });
  }

  for (const c of constructors) {
    await prisma.constructor.upsert({
      where: { constructorId: c.constructorId },
      update: { name: c.name, nationality: c.nationality },
      create: { constructorId: c.constructorId, name: c.name, nationality: c.nationality },
    });
  }

  await logSync("drivers+constructors", drivers.length + constructors.length);
}

export async function syncRaceResults(year: number, round: number) {
  const raceData = await jolpica.getRaceResults(year, round);
  if (!raceData?.Results) return;

  const race = await prisma.races.findUnique({
    where: { season_round: { season: year, round } },
  });
  if (!race) return;

  for (const r of raceData.Results) {
    await prisma.result.upsert({
      where: { raceId_driverId: { raceId: race.id, driverId: r.Driver.driverId } },
      update: {
        constructorId: r.Constructor.constructorId,
        grid: parseInt(r.grid),
        position: r.position !== "R" ? parseInt(r.position) : null,
        positionText: r.positionText,
        points: parseFloat(r.points),
        laps: parseInt(r.laps),
        status: r.status,
        fastestLapTime: r.FastestLap?.Time?.time ?? null,
        fastestLapRank: r.FastestLap ? parseInt(r.FastestLap.rank) : null,
      },
      create: {
        raceId: race.id,
        driverId: r.Driver.driverId,
        constructorId: r.Constructor.constructorId,
        grid: parseInt(r.grid),
        position: r.position !== "R" ? parseInt(r.position) : null,
        positionText: r.positionText,
        points: parseFloat(r.points),
        laps: parseInt(r.laps),
        status: r.status,
        fastestLapTime: r.FastestLap?.Time?.time ?? null,
        fastestLapRank: r.FastestLap ? parseInt(r.FastestLap.rank) : null,
      },
    });
  }

  await logSync(`results-${year}-R${round}`, raceData.Results.length);
}

export async function syncQualifyingResults(year: number, round: number) {
  const raceData = await jolpica.getQualifyingResults(year, round);
  if (!raceData?.QualifyingResults) return;

  const race = await prisma.races.findUnique({
    where: { season_round: { season: year, round } },
  });
  if (!race) return;

  for (const q of raceData.QualifyingResults) {
    await prisma.qualifyingResult.upsert({
      where: { raceId_driverId: { raceId: race.id, driverId: q.Driver.driverId } },
      update: {
        constructorId: q.Constructor.constructorId,
        position: parseInt(q.position),
        q1: q.Q1 ?? null,
        q2: q.Q2 ?? null,
        q3: q.Q3 ?? null,
      },
      create: {
        raceId: race.id,
        driverId: q.Driver.driverId,
        constructorId: q.Constructor.constructorId,
        position: parseInt(q.position),
        q1: q.Q1 ?? null,
        q2: q.Q2 ?? null,
        q3: q.Q3 ?? null,
      },
    });
  }

  await logSync(`qualifying-${year}-R${round}`, raceData.QualifyingResults.length);
}

export async function syncStandings(year: number) {
  const [driverStandings, constructorStandings] = await Promise.all([
    jolpica.getDriverStandings(year),
    jolpica.getConstructorStandings(year),
  ]);

  // Get the latest race for this season
  const latestRace = await prisma.races.findFirst({
    where: { season: year, results: { some: {} } },
    orderBy: { round: "desc" },
  });
  if (!latestRace) return;

  for (const s of driverStandings) {
    if (!s.Driver) continue;
    await prisma.driverStanding.upsert({
      where: { raceId_driverId: { raceId: latestRace.id, driverId: s.Driver.driverId } },
      update: { points: parseFloat(s.points), position: parseInt(s.position), wins: parseInt(s.wins) },
      create: {
        raceId: latestRace.id,
        driverId: s.Driver.driverId,
        points: parseFloat(s.points),
        position: parseInt(s.position),
        wins: parseInt(s.wins),
      },
    });
  }

  for (const s of constructorStandings) {
    if (!s.Constructor) continue;
    await prisma.constructorStanding.upsert({
      where: { raceId_constructorId: { raceId: latestRace.id, constructorId: s.Constructor.constructorId } },
      update: { points: parseFloat(s.points), position: parseInt(s.position), wins: parseInt(s.wins) },
      create: {
        raceId: latestRace.id,
        constructorId: s.Constructor.constructorId,
        points: parseFloat(s.points),
        position: parseInt(s.position),
        wins: parseInt(s.wins),
      },
    });
  }

  await logSync("standings", driverStandings.length + constructorStandings.length);
}

export async function syncAll(year: number) {
  console.log(`[Sync] Starting full sync for ${year}...`);
  await syncSeason(year);
  await syncDriversAndConstructors(year);

  const races = await prisma.races.findMany({
    where: { season: year },
    orderBy: { round: "asc" },
  });

  for (const race of races) {
    if (new Date(race.date) < new Date()) {
      await syncRaceResults(year, race.round);
      await syncQualifyingResults(year, race.round);
    }
  }

  await syncStandings(year);
  console.log(`[Sync] Full sync for ${year} complete.`);
}

async function logSync(entity: string, recordsUpdated: number) {
  await prisma.syncLog.create({
    data: { entity, status: "success", recordsUpdated },
  });
}
```

**Step 2: Create sync scheduler**

```ts
// src/lib/sync/sync-scheduler.ts
import cron from "node-cron";
import { syncAll, syncStandings, syncRaceResults, syncQualifyingResults } from "./sync-service";
import { prisma } from "@/lib/prisma";

let isInitialized = false;

export function startSyncScheduler() {
  if (isInitialized) return;
  isInitialized = true;

  const currentYear = new Date().getFullYear();

  // Initial sync on startup
  syncAll(currentYear).catch((err) =>
    console.error("[Sync] Initial sync failed:", err)
  );

  // Every hour: sync standings and check for new results
  cron.schedule("0 * * * *", async () => {
    console.log("[Sync] Hourly sync starting...");
    try {
      await syncStandings(currentYear);

      // Find the next upcoming race
      const nextRace = await prisma.races.findFirst({
        where: { season: currentYear, date: { gte: new Date() } },
        orderBy: { round: "asc" },
      });

      // Find most recent past race without results
      const unsecoredRace = await prisma.races.findFirst({
        where: {
          season: currentYear,
          date: { lt: new Date() },
          results: { none: {} },
        },
        orderBy: { round: "desc" },
      });

      if (unsecoredRace) {
        await syncRaceResults(currentYear, unsecoredRace.round);
        await syncQualifyingResults(currentYear, unsecoredRace.round);
      }

      console.log("[Sync] Hourly sync complete.");
    } catch (err) {
      console.error("[Sync] Hourly sync failed:", err);
    }
  });

  // Every 15 minutes on race weekends (Fri-Sun)
  cron.schedule("*/15 * * * 5,6,0", async () => {
    console.log("[Sync] Race weekend sync...");
    try {
      const latestRace = await prisma.races.findFirst({
        where: {
          season: currentYear,
          date: { lt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
          date: { gt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { round: "desc" },
      });

      if (latestRace) {
        await syncRaceResults(currentYear, latestRace.round);
        await syncQualifyingResults(currentYear, latestRace.round);
        await syncStandings(currentYear);
      }
    } catch (err) {
      console.error("[Sync] Race weekend sync failed:", err);
    }
  });

  console.log("[Sync] Scheduler started.");
}
```

**Step 3: Commit**

```bash
git add src/lib/sync/
git commit -m "feat: add data sync service and cron scheduler for Jolpica API"
```

---

### Task 6: Sync initialization via instrumentation

**Files:**
- Create: `src/instrumentation.ts`

**Step 1: Create Next.js instrumentation file to start sync on server boot**

```ts
// src/instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startSyncScheduler } = await import("@/lib/sync/sync-scheduler");
    startSyncScheduler();
  }
}
```

**Step 2: Enable instrumentation in next.config.ts**

Add `experimental: { instrumentationHook: true }` to next.config.ts (if not already default in Next.js 15).

**Step 3: Commit**

```bash
git add src/instrumentation.ts next.config.ts
git commit -m "feat: start sync scheduler on server boot via instrumentation"
```

---

## Phase 3: Global Layout & Navigation

### Task 7: Layout shell with sidebar and top bar

**Files:**
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/TopBar.tsx`
- Create: `src/components/layout/CountdownTimer.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Build the sidebar component**

Collapsible sidebar with F1 logo, navigation links using Lucide icons. Links: Dashboard, Schedule, Standings, Results, Drivers & Teams, Head-to-Head, Predictions. Active state highlighted with F1 red. Carbon-fiber texture background. Collapse button at bottom.

**Step 2: Build the top bar component**

Top bar with: season selector dropdown (2020-current), CountdownTimer to next race, and a subtle accent-line gradient at the top.

**Step 3: Build countdown timer component**

Displays days/hours/minutes/seconds until next race. Uses `useEffect` with `setInterval`. Fetches next race from `/api/next-race`. Pulsing glow effect when race is within 24 hours.

**Step 4: Create API route for next race**

Create `src/app/api/next-race/route.ts` — queries MySQL for the next upcoming race and returns JSON with race name, circuit, date/time.

**Step 5: Wire up layout.tsx**

Import Inter + JetBrains Mono from `next/font/google`. Wrap children in sidebar + topbar layout grid.

**Step 6: Commit**

```bash
git add src/components/layout/ src/app/layout.tsx src/app/api/next-race/
git commit -m "feat: add global layout with sidebar navigation and countdown timer"
```

---

## Phase 4: Dashboard Page

### Task 8: Dashboard home page

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/components/dashboard/HeroCountdown.tsx`
- Create: `src/components/dashboard/MiniStandings.tsx`
- Create: `src/components/dashboard/RecentResult.tsx`
- Create: `src/components/dashboard/LiveIndicator.tsx`

**Step 1: Build HeroCountdown**

Large countdown display with circuit name, country flag, and date. Background with subtle circuit layout SVG or gradient. Framer Motion entrance animation.

**Step 2: Build MiniStandings**

Two side-by-side cards: top 10 drivers, top 10 constructors. Each row: position, name/team color dot, points. Fetched server-side from Prisma.

**Step 3: Build RecentResult**

Card showing most recent race: winner, podium (1-2-3), fastest lap. Team color accents.

**Step 4: Build LiveIndicator**

Small pulsing green/red dot in the corner. When an F1 session is active (check OpenF1 API), shows "LIVE" with session name. Otherwise hidden.

**Step 5: Compose dashboard page**

Server component that queries Prisma for standings, next race, recent result. Renders all dashboard components.

**Step 6: Commit**

```bash
git add src/app/page.tsx src/components/dashboard/
git commit -m "feat: add dashboard page with countdown, standings, and recent result"
```

---

## Phase 5: Schedule Page

### Task 9: Season schedule page

**Files:**
- Create: `src/app/schedule/page.tsx`
- Create: `src/components/schedule/RaceCard.tsx`
- Create: `src/components/schedule/SessionTimes.tsx`

**Step 1: Build RaceCard**

Card for each race weekend: circuit name, country flag emoji, date range, city/country. Past races show checkered flag + winner name. Upcoming races show mini countdown. Current/next race highlighted with red glow border. Click to expand with Framer Motion `AnimatePresence`.

**Step 2: Build SessionTimes**

Expandable section showing FP1, FP2, FP3, Qualifying, Sprint (if applicable), Race times. All times converted to user's local timezone via `Intl.DateTimeFormat`.

**Step 3: Compose schedule page**

Server component querying all races for selected season. Grid layout of RaceCards. Visual "now" indicator between past and future races.

**Step 4: Commit**

```bash
git add src/app/schedule/ src/components/schedule/
git commit -m "feat: add season schedule page with expandable race cards"
```

---

## Phase 6: Standings Page

### Task 10: Championship standings page

**Files:**
- Create: `src/app/standings/page.tsx`
- Create: `src/components/standings/StandingsTable.tsx`
- Create: `src/components/standings/PointsChart.tsx`
- Create: `src/components/standings/ToggleTabs.tsx`

**Step 1: Build ToggleTabs**

Animated tab switcher: "Drivers" | "Constructors". Sliding underline indicator with F1 red.

**Step 2: Build StandingsTable**

Table with columns: Pos, Driver/Team (with team color bar), Points, Wins, Podiums. Rows animate in with Framer Motion stagger. Click a driver row to navigate to `/drivers/[driverId]`.

**Step 3: Build PointsChart**

Recharts `AreaChart` or `LineChart` showing points accumulation across rounds. One line per driver/constructor (top 10). Team-colored lines. Tooltip showing round details.

**Step 4: Compose standings page**

Server component. Fetch driver standings and constructor standings. Client-side toggle between the two views.

**Step 5: Commit**

```bash
git add src/app/standings/ src/components/standings/
git commit -m "feat: add standings page with table and points progression chart"
```

---

## Phase 7: Results Page

### Task 11: Race results page

**Files:**
- Create: `src/app/results/page.tsx`
- Create: `src/components/results/RaceSelector.tsx`
- Create: `src/components/results/ResultsTable.tsx`
- Create: `src/components/results/QualifyingTable.tsx`

**Step 1: Build RaceSelector**

Dropdown to select race from current season. Shows race name + country flag. Defaults to most recent completed race.

**Step 2: Build ResultsTable**

Table: Pos, Grid, Driver, Constructor, Laps, Status, Points, Fastest Lap. Position change column with green/red arrows (grid → finish). Fastest lap highlighted in purple. DNFs in red text.

**Step 3: Build QualifyingTable**

Table: Pos, Driver, Constructor, Q1, Q2, Q3. Best times highlighted. Knocked-out drivers dimmed per session.

**Step 4: Build tab switcher for Race/Qualifying/Sprint**

Reuse ToggleTabs component with three options.

**Step 5: Compose results page**

Client component with race selector state. Fetches results via API route when race changes.

**Step 6: Create API routes**

- `src/app/api/results/[season]/[round]/route.ts` — returns race results
- `src/app/api/qualifying/[season]/[round]/route.ts` — returns qualifying results

**Step 7: Commit**

```bash
git add src/app/results/ src/components/results/ src/app/api/results/ src/app/api/qualifying/
git commit -m "feat: add race results page with qualifying and position changes"
```

---

## Phase 8: Drivers & Teams Pages

### Task 12: Driver and team profile pages

**Files:**
- Create: `src/app/drivers/page.tsx`
- Create: `src/app/drivers/[driverId]/page.tsx`
- Create: `src/app/teams/[constructorId]/page.tsx`
- Create: `src/components/drivers/DriverCard.tsx`
- Create: `src/components/drivers/DriverProfile.tsx`
- Create: `src/components/teams/TeamProfile.tsx`

**Step 1: Build DriverCard**

Card with driver number (in team color), name, team name, nationality flag, points. Hover: scale up slightly with glow. Links to driver profile page.

**Step 2: Build drivers listing page**

Grid of DriverCards. Server component fetching all drivers for current season with their latest standings.

**Step 3: Build DriverProfile**

Profile page with: name, number, team, nationality, DOB. Stats section: career wins, poles, podiums, points (aggregated from results). Season results table. Link to team page.

**Step 4: Build TeamProfile**

Team page: name, nationality, team colors displayed as gradient banner. Current drivers listed. Season results. Constructor standings position + points.

**Step 5: Commit**

```bash
git add src/app/drivers/ src/app/teams/ src/components/drivers/ src/components/teams/
git commit -m "feat: add driver and team profile pages"
```

---

## Phase 9: Head-to-Head Page

### Task 13: Head-to-head comparison

**Files:**
- Create: `src/app/head-to-head/page.tsx`
- Create: `src/components/h2h/DriverSelector.tsx`
- Create: `src/components/h2h/ComparisonStats.tsx`
- Create: `src/components/h2h/RadarChart.tsx`
- Create: `src/app/api/h2h/route.ts`

**Step 1: Build DriverSelector**

Two searchable dropdown selectors. Each shows driver name + team color. Selected drivers displayed with their numbers.

**Step 2: Build ComparisonStats**

Side-by-side stat bars: Wins, Podiums, Poles, Points, DNFs. Each stat is a horizontal bar chart where the two values are shown proportionally. Winner of each stat highlighted.

**Step 3: Build RadarChart**

Recharts `RadarChart` overlaying both drivers on: Wins, Podiums, Points, Consistency (finishes/starts), Qualifying (avg position), Race Pace (avg finish vs grid).

**Step 4: Build API route**

`/api/h2h?driver1=xxx&driver2=yyy` — returns aggregated comparison data from results table.

**Step 5: Compose page**

Client component. Two selectors at top, stats and charts below. Animated transitions when drivers change.

**Step 6: Commit**

```bash
git add src/app/head-to-head/ src/components/h2h/ src/app/api/h2h/
git commit -m "feat: add head-to-head driver comparison page"
```

---

## Phase 10: Predictions Page

### Task 14: Race predictions tracker

**Files:**
- Create: `src/app/predictions/page.tsx`
- Create: `src/components/predictions/PredictionForm.tsx`
- Create: `src/components/predictions/PredictionResults.tsx`
- Create: `src/components/predictions/AccuracyStats.tsx`
- Create: `src/app/api/predictions/route.ts`

**Step 1: Build PredictionForm**

For next upcoming race (no existing prediction): Select predicted winner, predicted P2, P3 (podium), predicted fastest lap. Driver dropdowns with team colors. Submit button with confirmation.

**Step 2: Build PredictionResults**

For past races with predictions: Show predicted vs actual side by side. Green checkmarks for correct, red X for wrong. Points scored for each prediction. Scoring: 25 pts correct winner, 10 pts each correct podium, 5 pts correct fastest lap.

**Step 3: Build AccuracyStats**

Season summary: total score, accuracy %, best prediction, worst prediction. Small chart of prediction scores over the season.

**Step 4: Build API route**

- `GET /api/predictions` — list all predictions for current season
- `POST /api/predictions` — create prediction for a race
- Auto-scoring: when race results exist and prediction isn't scored yet, compute and save score

**Step 5: Compose page**

Upcoming race prediction form at top. Below: history of past predictions with scores. Season stats at bottom.

**Step 6: Commit**

```bash
git add src/app/predictions/ src/components/predictions/ src/app/api/predictions/
git commit -m "feat: add race predictions tracker with scoring"
```

---

## Phase 11: OpenF1 Live Data

### Task 15: Live session data via SSE

**Files:**
- Create: `src/lib/api/openf1.ts`
- Create: `src/app/api/live/route.ts`
- Create: `src/components/live/LiveTiming.tsx`

**Step 1: Create OpenF1 client**

```ts
// src/lib/api/openf1.ts
const BASE_URL = "https://api.openf1.org/v1";

export async function getSessionStatus() {
  const res = await fetch(`${BASE_URL}/sessions?session_key=latest`);
  if (!res.ok) return null;
  const sessions = await res.json();
  return sessions[0] ?? null;
}

export async function getLivePositions(sessionKey: number) {
  const res = await fetch(`${BASE_URL}/position?session_key=${sessionKey}`);
  if (!res.ok) return [];
  return res.json();
}

export async function getLiveIntervals(sessionKey: number) {
  const res = await fetch(`${BASE_URL}/intervals?session_key=${sessionKey}`);
  if (!res.ok) return [];
  return res.json();
}
```

**Step 2: Create SSE API route**

`/api/live` — Server-Sent Events endpoint. Polls OpenF1 every 5 seconds during active sessions and streams position/interval data to connected clients.

**Step 3: Build LiveTiming component**

Client component that connects to SSE. Shows live position table with driver, position, interval, gap to leader. Updates in real-time with animated position changes.

**Step 4: Integrate into Dashboard**

Show LiveTiming on dashboard when a session is active. LiveIndicator component toggles visibility.

**Step 5: Commit**

```bash
git add src/lib/api/openf1.ts src/app/api/live/ src/components/live/
git commit -m "feat: add OpenF1 live timing via Server-Sent Events"
```

---

## Phase 12: Docker & Deployment

### Task 16: Docker setup

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `.dockerignore`

**Step 1: Create .dockerignore**

```
node_modules
.next
.git
.env
*.md
docs/
```

**Step 2: Create multi-stage Dockerfile**

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

**Step 3: Create docker-compose.yml for local dev**

```yaml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "${PORT:-3000}:3000"
    environment:
      - DATABASE_URL=mysql://f1user:f1pass@db:3306/JT-F1
    depends_on:
      db:
        condition: service_healthy

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: JT-F1
      MYSQL_USER: f1user
      MYSQL_PASSWORD: f1pass
    ports:
      - "3307:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  mysql_data:
```

**Step 4: Update next.config.ts for standalone output**

Add `output: "standalone"` to Next.js config.

**Step 5: Commit**

```bash
git add Dockerfile docker-compose.yml .dockerignore next.config.ts
git commit -m "feat: add Docker setup with multi-stage build for Unraid deployment"
```

---

## Phase 13: Polish & Final Touches

### Task 17: Team color mapping

**Files:**
- Create: `src/lib/team-colors.ts`

Map constructor IDs to their 2026 team colors (primary + secondary). Used throughout the UI for color-coded elements. Update constructors in DB with these colors on sync.

---

### Task 18: Responsive design pass

Review all pages for mobile/tablet responsiveness. Sidebar collapses to hamburger menu on mobile. Tables become scrollable or card-based on small screens.

---

### Task 19: Loading states and error boundaries

Add skeleton loaders (animated placeholder cards) for all data-fetching components. Add error boundaries with retry buttons. Use Suspense boundaries in layout.

---

### Task 20: Final testing and build verification

Run `npm run build` and verify no TypeScript or build errors. Test Docker build locally with `docker-compose up`. Verify all pages render and data syncs successfully.

```bash
git add -A
git commit -m "feat: polish UI, add loading states, and verify build"
```
