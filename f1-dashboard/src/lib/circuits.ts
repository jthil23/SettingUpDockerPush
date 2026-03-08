export interface CircuitInfo {
  svgPath: string;
  length: string;
  turns: number;
  lapRecord: string;
  lapRecordHolder: string;
  lapRecordYear: number;
  drsZones: number;
}

export const circuitData: Record<string, CircuitInfo> = {
  bahrain: { svgPath: "/circuits/bahrain.svg", length: "5.412 km", turns: 15, lapRecord: "1:31.447", lapRecordHolder: "Pedro de la Rosa", lapRecordYear: 2005, drsZones: 3 },
  jeddah: { svgPath: "/circuits/jeddah.svg", length: "6.174 km", turns: 27, lapRecord: "1:30.734", lapRecordHolder: "Lewis Hamilton", lapRecordYear: 2021, drsZones: 3 },
  albert_park: { svgPath: "/circuits/albert_park.svg", length: "5.278 km", turns: 14, lapRecord: "1:19.813", lapRecordHolder: "Charles Leclerc", lapRecordYear: 2024, drsZones: 4 },
  suzuka: { svgPath: "/circuits/suzuka.svg", length: "5.807 km", turns: 18, lapRecord: "1:30.983", lapRecordHolder: "Lewis Hamilton", lapRecordYear: 2019, drsZones: 2 },
  shanghai: { svgPath: "/circuits/shanghai.svg", length: "5.451 km", turns: 16, lapRecord: "1:32.238", lapRecordHolder: "Michael Schumacher", lapRecordYear: 2004, drsZones: 2 },
  miami: { svgPath: "/circuits/miami.svg", length: "5.412 km", turns: 19, lapRecord: "1:29.708", lapRecordHolder: "Max Verstappen", lapRecordYear: 2023, drsZones: 3 },
  imola: { svgPath: "/circuits/imola.svg", length: "4.909 km", turns: 19, lapRecord: "1:15.484", lapRecordHolder: "Lewis Hamilton", lapRecordYear: 2020, drsZones: 2 },
  monaco: { svgPath: "/circuits/monaco.svg", length: "3.337 km", turns: 19, lapRecord: "1:12.909", lapRecordHolder: "Lewis Hamilton", lapRecordYear: 2021, drsZones: 1 },
  villeneuve: { svgPath: "/circuits/villeneuve.svg", length: "4.361 km", turns: 14, lapRecord: "1:13.078", lapRecordHolder: "Valtteri Bottas", lapRecordYear: 2019, drsZones: 2 },
  catalunya: { svgPath: "/circuits/catalunya.svg", length: "4.675 km", turns: 16, lapRecord: "1:16.330", lapRecordHolder: "Max Verstappen", lapRecordYear: 2023, drsZones: 2 },
  red_bull_ring: { svgPath: "/circuits/red_bull_ring.svg", length: "4.318 km", turns: 10, lapRecord: "1:05.619", lapRecordHolder: "Carlos Sainz", lapRecordYear: 2020, drsZones: 3 },
  silverstone: { svgPath: "/circuits/silverstone.svg", length: "5.891 km", turns: 18, lapRecord: "1:27.097", lapRecordHolder: "Max Verstappen", lapRecordYear: 2020, drsZones: 2 },
  hungaroring: { svgPath: "/circuits/hungaroring.svg", length: "4.381 km", turns: 14, lapRecord: "1:16.627", lapRecordHolder: "Lewis Hamilton", lapRecordYear: 2020, drsZones: 2 },
  spa: { svgPath: "/circuits/spa.svg", length: "7.004 km", turns: 19, lapRecord: "1:46.286", lapRecordHolder: "Valtteri Bottas", lapRecordYear: 2018, drsZones: 2 },
  zandvoort: { svgPath: "/circuits/zandvoort.svg", length: "4.259 km", turns: 14, lapRecord: "1:11.097", lapRecordHolder: "Lewis Hamilton", lapRecordYear: 2021, drsZones: 2 },
  monza: { svgPath: "/circuits/monza.svg", length: "5.793 km", turns: 11, lapRecord: "1:21.046", lapRecordHolder: "Rubens Barrichello", lapRecordYear: 2004, drsZones: 2 },
  baku: { svgPath: "/circuits/baku.svg", length: "6.003 km", turns: 20, lapRecord: "1:43.009", lapRecordHolder: "Charles Leclerc", lapRecordYear: 2019, drsZones: 2 },
  marina_bay: { svgPath: "/circuits/marina_bay.svg", length: "4.940 km", turns: 19, lapRecord: "1:35.867", lapRecordHolder: "Lewis Hamilton", lapRecordYear: 2023, drsZones: 3 },
  americas: { svgPath: "/circuits/americas.svg", length: "5.513 km", turns: 20, lapRecord: "1:36.169", lapRecordHolder: "Charles Leclerc", lapRecordYear: 2019, drsZones: 2 },
  rodriguez: { svgPath: "/circuits/rodriguez.svg", length: "4.304 km", turns: 17, lapRecord: "1:17.774", lapRecordHolder: "Valtteri Bottas", lapRecordYear: 2021, drsZones: 3 },
  interlagos: { svgPath: "/circuits/interlagos.svg", length: "4.309 km", turns: 15, lapRecord: "1:10.540", lapRecordHolder: "Valtteri Bottas", lapRecordYear: 2018, drsZones: 2 },
  vegas: { svgPath: "/circuits/vegas.svg", length: "6.201 km", turns: 17, lapRecord: "1:35.490", lapRecordHolder: "Oscar Piastri", lapRecordYear: 2024, drsZones: 2 },
  losail: { svgPath: "/circuits/losail.svg", length: "5.419 km", turns: 16, lapRecord: "1:24.319", lapRecordHolder: "Max Verstappen", lapRecordYear: 2023, drsZones: 2 },
  yas_marina: { svgPath: "/circuits/yas_marina.svg", length: "5.281 km", turns: 16, lapRecord: "1:26.103", lapRecordHolder: "Max Verstappen", lapRecordYear: 2021, drsZones: 2 },
};

export function getCircuitInfo(circuitId: string): CircuitInfo | null {
  return circuitData[circuitId] ?? null;
}
