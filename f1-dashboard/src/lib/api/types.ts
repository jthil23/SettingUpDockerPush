// Jolpica (Ergast) API response types

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

export interface JolpicaSessionTime {
  date: string;
  time?: string;
}

export interface JolpicaFastestLap {
  rank: string;
  Time?: {
    time: string;
  };
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
  FastestLap?: JolpicaFastestLap;
}

export interface JolpicaQualifyingResult {
  position: string;
  Driver: JolpicaDriver;
  Constructor: JolpicaConstructor;
  Q1?: string;
  Q2?: string;
  Q3?: string;
}

export interface JolpicaRace {
  season: string;
  round: string;
  raceName: string;
  Circuit: JolpicaCircuit;
  date: string;
  time?: string;
  FirstPractice?: JolpicaSessionTime;
  SecondPractice?: JolpicaSessionTime;
  ThirdPractice?: JolpicaSessionTime;
  Qualifying?: JolpicaSessionTime;
  Sprint?: JolpicaSessionTime;
  Results?: JolpicaResult[];
  QualifyingResults?: JolpicaQualifyingResult[];
}

export interface JolpicaDriverStanding {
  position: string;
  points: string;
  wins: string;
  Driver: JolpicaDriver;
  Constructors: JolpicaConstructor[];
}

export interface JolpicaConstructorStanding {
  position: string;
  points: string;
  wins: string;
  Constructor: JolpicaConstructor;
}

// API response wrapper types

export interface JolpicaResponse<T> {
  MRData: {
    xmlns: string;
    series: string;
    url: string;
    limit: string;
    offset: string;
    total: string;
  } & T;
}

export interface RaceTableData {
  RaceTable: {
    season: string;
    round?: string;
    Races: JolpicaRace[];
  };
}

export interface DriverTableData {
  DriverTable: {
    season: string;
    Drivers: JolpicaDriver[];
  };
}

export interface ConstructorTableData {
  ConstructorTable: {
    season: string;
    Constructors: JolpicaConstructor[];
  };
}

export interface DriverStandingsData {
  StandingsTable: {
    season: string;
    StandingsLists: Array<{
      season: string;
      round: string;
      DriverStandings: JolpicaDriverStanding[];
    }>;
  };
}

export interface ConstructorStandingsData {
  StandingsTable: {
    season: string;
    StandingsLists: Array<{
      season: string;
      round: string;
      ConstructorStandings: JolpicaConstructorStanding[];
    }>;
  };
}

export interface JolpicaPitStop {
  driverId: string;
  lap: string;
  stop: string;
  time: string;
  duration: string;
}

export interface JolpicaLapTiming {
  number: string;
  Timings: Array<{
    driverId: string;
    position: string;
    time: string;
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
