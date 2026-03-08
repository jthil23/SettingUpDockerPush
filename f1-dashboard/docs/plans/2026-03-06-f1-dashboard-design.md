# F1 Dashboard — Design Document

## Overview

A Dockerized F1 dashboard website for Unraid, providing race schedules, live standings, historical results, driver/team profiles, head-to-head comparisons, and a prediction tracker. Dark racing aesthetic with neon accents.

## Architecture

**Approach: Monolith Container**

Single Docker container running Next.js 15 (App Router) with API routes as the backend. A node-cron scheduler syncs F1 data from external APIs into a MySQL database on the same Unraid server. The frontend reads primarily from MySQL via Prisma ORM.

## Data Sources

- **Jolpica API** (Ergast successor): Standings, race results, schedule, driver/team data, historical records. Free, no API key.
- **OpenF1 API**: Live session timing, telemetry, radio during active sessions. Streamed directly to clients via SSE — not persisted in MySQL.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) + TypeScript |
| ORM | Prisma (MySQL connector) |
| Styling | Tailwind CSS + Framer Motion |
| Charts | Recharts |
| Data sync | node-cron |
| Live data | Server-Sent Events (OpenF1 to client) |
| Icons | Lucide React |
| Container | Docker (multi-stage build) |

## Database

**Schema name**: `JT-F1` (MySQL on Unraid)

### Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| seasons | Season metadata | year, wikipedia_url |
| circuits | Track info | circuit_id, name, location, country, lat, lng, image_url |
| drivers | Driver profiles | driver_id, code, number, first_name, last_name, dob, nationality, image_url |
| constructors | Team profiles | constructor_id, name, nationality, color_primary, color_secondary, logo_url |
| races | Race weekends | race_id, season, round, circuit_id, race_name, date, time, fp1/fp2/fp3/quali/sprint dates |
| results | Race results | result_id, race_id, driver_id, constructor_id, grid, position, points, status, fastest_lap_time |
| qualifying_results | Quali results | race_id, driver_id, constructor_id, q1/q2/q3 times |
| driver_standings | Championship standings | race_id, driver_id, points, position, wins |
| constructor_standings | Team standings | race_id, constructor_id, points, position, wins |
| predictions | User predictions | prediction_id, race_id, predicted_winner, predicted_podium (JSON), created_at, actual_result, score |
| sync_log | Data sync tracking | sync_id, entity, last_synced, status, records_updated |

## Data Sync Strategy

- **Initial sync**: On first run, pull all historical data for current + past seasons from Jolpica
- **Race weekends**: Sync every 15 minutes
- **Off-weekends**: Sync every hour
- **Live sessions**: Direct OpenF1 API streaming to client via SSE (not stored)
- **sync_log** table tracks last sync time per entity to avoid redundant pulls

## Pages

### Global Layout
- Collapsible sidebar navigation with F1 logo, nav links with icons
- Top bar with next-race countdown timer (always visible), season selector
- Dark carbon-fiber texture background

### Color Palette
- Deep blacks: #0D0D0D, #1A1A1A
- Carbon gray: #2D2D2D
- F1 red (primary accent): #E10600
- Neon cyan (secondary): #00D2BE
- Electric yellow (secondary): #FFF500

### 1. Dashboard (Home)
- Hero countdown to next race with circuit map/illustration
- Mini driver standings (top 10) + constructor standings
- Recent race result card
- Live session indicator (glowing dot when active, OpenF1 live timing)

### 2. Schedule
- Visual timeline/card grid of all race weekends
- Each card: circuit name, country flag, date range, session times in user timezone
- Past races show winner, upcoming show countdown
- Expandable: full session schedule + circuit details

### 3. Standings
- Toggle between drivers and constructors
- Animated bar chart showing points progression through season
- Table: position, driver/team, points, wins, podiums
- Click driver to navigate to their profile

### 4. Results
- Race selector dropdown (current season)
- Tabs: Race Result, Qualifying, Sprint (if applicable)
- Table: grid position, finish position, gap, fastest lap, pit stops
- Position change indicators (green up, red down arrows)

### 5. Drivers & Teams
- Grid of driver cards with photos, team colors, numbers
- Driver profile: career stats, season results, team history
- Team pages: current drivers, livery colors, season performance

### 6. Head-to-Head
- Two driver selector dropdowns
- Side-by-side stat comparison: wins, poles, podiums, points, DNFs
- Season-by-season comparison charts
- Visual radar chart for key metrics

### 7. Predictions
- Pre-race: pick winner, podium, fastest lap
- Post-race: auto-scored against actual results
- Season accuracy tracking: accuracy %, best/worst predictions

## Docker Setup

- Single `Dockerfile` with multi-stage build (deps → build → production)
- `docker-compose.yml` for local dev (includes MySQL for testing)
- Production: single container connects to Unraid MySQL via environment variables
- Environment variables: `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`
- Configurable port via `PORT` env var (default 3000)
