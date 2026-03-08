const BASE_URL = "https://api.openf1.org/v1";

export interface OpenF1Session {
  session_key: number;
  session_name: string;
  session_type: string;
  date_start: string;
  date_end: string;
  meeting_name: string;
  meeting_key: number;
  year: number;
  country_name: string;
  circuit_short_name: string;
}

export interface OpenF1Position {
  session_key: number;
  driver_number: number;
  position: number;
  date: string;
}

export interface OpenF1Interval {
  session_key: number;
  driver_number: number;
  gap_to_leader: number | null;
  interval: number | null;
  date: string;
}

export interface OpenF1Driver {
  session_key: number;
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string | null;
}

export interface OpenF1Stint {
  session_key: number;
  driver_number: number;
  stint_number: number;
  compound: string;
  tyre_age_at_start: number;
  lap_start: number;
  lap_end: number;
}

export interface OpenF1RaceControl {
  session_key: number;
  date: string;
  category: string;
  flag?: string;
  message: string;
  driver_number?: number;
  lap_number?: number;
  scope?: string;
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
  st_speed: number | null;
  date_start: string;
}

export async function getSessionStatus(): Promise<OpenF1Session | null> {
  try {
    const res = await fetch(`${BASE_URL}/sessions?session_key=latest`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const sessions = await res.json();
    if (!Array.isArray(sessions) || sessions.length === 0) return null;
    return sessions[sessions.length - 1] ?? null;
  } catch {
    return null;
  }
}

export async function getLivePositions(
  sessionKey: number
): Promise<OpenF1Position[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/position?session_key=${sessionKey}`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getLiveIntervals(
  sessionKey: number
): Promise<OpenF1Interval[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/intervals?session_key=${sessionKey}`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getDriverNumbers(
  sessionKey: number
): Promise<OpenF1Driver[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/drivers?session_key=${sessionKey}`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getStints(sessionKey: number): Promise<OpenF1Stint[]> {
  try {
    const res = await fetch(`${BASE_URL}/stints?session_key=${sessionKey}`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function getRaceControlMessages(sessionKey: number): Promise<OpenF1RaceControl[]> {
  try {
    const res = await fetch(`${BASE_URL}/race_control?session_key=${sessionKey}`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function getWeatherData(sessionKey: number): Promise<OpenF1Weather[]> {
  try {
    const res = await fetch(`${BASE_URL}/weather?session_key=${sessionKey}`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function getCarData(sessionKey: number, driverNumber: number): Promise<OpenF1CarData[]> {
  try {
    const res = await fetch(`${BASE_URL}/car_data?session_key=${sessionKey}&driver_number=${driverNumber}&speed>=0`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function getTeamRadio(sessionKey: number): Promise<OpenF1TeamRadio[]> {
  try {
    const res = await fetch(`${BASE_URL}/team_radio?session_key=${sessionKey}`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function getLapData(sessionKey: number): Promise<OpenF1Lap[]> {
  try {
    const res = await fetch(`${BASE_URL}/laps?session_key=${sessionKey}`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function getSessionByMeeting(year: number, meetingName: string, sessionType: string = "Race"): Promise<OpenF1Session | null> {
  try {
    const res = await fetch(`${BASE_URL}/sessions?year=${year}&session_type=${sessionType}&country_name=${encodeURIComponent(meetingName)}`, { cache: "no-store" });
    if (!res.ok) return null;
    const sessions = await res.json();
    if (!Array.isArray(sessions) || sessions.length === 0) return null;
    return sessions[0];
  } catch { return null; }
}
