export const teamColors: Record<string, { primary: string; secondary: string }> = {
  "red_bull": { primary: "#3671C6", secondary: "#1B2D5B" },
  "mercedes": { primary: "#27F4D2", secondary: "#00A19C" },
  "ferrari": { primary: "#E8002D", secondary: "#FFEB00" },
  "mclaren": { primary: "#FF8000", secondary: "#47C7FC" },
  "aston_martin": { primary: "#229971", secondary: "#04352D" },
  "alpine": { primary: "#FF87BC", secondary: "#0093CC" },
  "williams": { primary: "#64C4FF", secondary: "#00274D" },
  "rb": { primary: "#6692FF", secondary: "#1B3D7D" },
  "kick_sauber": { primary: "#52E252", secondary: "#1E4D2B" },
  "haas": { primary: "#B6BABD", secondary: "#DA291C" },
  "audi": { primary: "#E5002D", secondary: "#000000" },
  "cadillac": { primary: "#C4A747", secondary: "#1A1A1A" },
  // Aliases for common API naming
  "alphatauri": { primary: "#6692FF", secondary: "#1B3D7D" },
  "alfa": { primary: "#52E252", secondary: "#1E4D2B" },
  "racing_point": { primary: "#FF87BC", secondary: "#0093CC" },
};

export function getTeamColor(constructorId: string): string {
  return teamColors[constructorId]?.primary ?? "#3D3D3D";
}

export function getTeamColors(constructorId: string): { primary: string; secondary: string } {
  return teamColors[constructorId] ?? { primary: "#3D3D3D", secondary: "#2D2D2D" };
}
