"use client";

interface Driver {
  driverId: string;
  firstName: string;
  lastName: string;
  code: string | null;
  teamColor: string | null;
  teamName: string | null;
}

interface DriverSelectorProps {
  drivers: Driver[];
  selectedId: string;
  onChange: (driverId: string) => void;
  label: string;
}

export default function DriverSelector({
  drivers,
  selectedId,
  onChange,
  label,
}: DriverSelectorProps) {
  const selectedDriver = drivers.find((d) => d.driverId === selectedId);
  const teamColor = selectedDriver?.teamColor ?? "#3D3D3D";

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-heading font-semibold uppercase tracking-wider text-f1-white/50">
        {label}
      </label>
      <div className="relative">
        <div
          className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
          style={{ backgroundColor: selectedId ? teamColor : "#3D3D3D" }}
        />
        <select
          value={selectedId}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-f1-dark border border-f1-carbon rounded-lg pl-9 pr-10 py-3 text-f1-white font-medium text-sm cursor-pointer transition-colors duration-200 hover:border-f1-gray focus:border-f1-red focus:outline-none"
        >
          <option value="">Select a driver</option>
          {drivers.map((driver) => (
            <option key={driver.driverId} value={driver.driverId}>
              {driver.firstName} {driver.lastName}
              {driver.teamName ? ` (${driver.teamName})` : ""}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-f1-white/40">
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
