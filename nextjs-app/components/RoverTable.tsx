interface RoverData {
  name: string;
  status: string;
  location: string;
  mission: string;
}

const roverData: RoverData[] = [
  {
    name: "Rover-001",
    status: "Operational",
    location: "Mars - Jezero Crater",
    mission: "Sample Collection",
  },
  {
    name: "Rover-002",
    status: "Operational",
    location: "Mars - Gale Crater",
    mission: "Exploration",
  },
  {
    name: "Rover-003",
    status: "Operational",
    location: "Moon - South Pole",
    mission: "Resource Mapping",
  },
  {
    name: "Rover-004",
    status: "Operational",
    location: "Mars - Elysium Planitia",
    mission: "Atmospheric Analysis",
  },
  {
    name: "Rover-005",
    status: "Operational",
    location: "Mars - Valles Marineris",
    mission: "Geological Survey",
  },
  {
    name: "Rover-006",
    status: "Operational",
    location: "Moon - Mare Tranquillitatis",
    mission: "Surface Analysis",
  },
];

export default function RoverTable() {
  return (
    <div className="w-full border border-[var(--border)] flex flex-col">
      {/* Header Row */}
      <div className="w-full h-[44px] flex items-center border-b border-[var(--border)]">
        <div className="w-[172px] h-full flex items-center px-3">
          <span className="text-[14px] font-primary font-medium text-[var(--muted-foreground)] leading-[1.4285714285714286] w-full">
            Rover Name
          </span>
        </div>
        <div className="w-[173px] h-full flex items-center px-3">
          <span className="text-[14px] font-primary font-medium text-[var(--muted-foreground)] leading-[1.4285714285714286] w-full">
            Status
          </span>
        </div>
        <div className="w-[172px] h-full flex items-center px-3">
          <span className="text-[14px] font-primary font-medium text-[var(--muted-foreground)] leading-[1.4285714285714286] w-full">
            Location
          </span>
        </div>
        <div className="flex-1 h-full flex items-center px-3">
          <span className="text-[14px] font-primary font-medium text-[var(--muted-foreground)] leading-[1.4285714285714286] w-full">
            Mission
          </span>
        </div>
        <div className="w-[98px] h-full flex items-center px-3">
          <span className="text-[14px] font-secondary font-medium text-[var(--muted-foreground)] leading-[1.4285714285714286] w-full">
            Actions
          </span>
        </div>
      </div>

      {/* Data Rows */}
      {roverData.map((rover, index) => (
        <div
          key={index}
          className={`w-full h-[56px] flex items-center ${
            index < roverData.length - 1 ? "border-b border-[var(--border)]" : ""
          }`}
        >
          <div className="w-[172px] h-full flex items-center px-3">
            <span className="text-[14px] font-secondary text-[var(--foreground)] leading-[1.4285714285714286] w-full">
              {rover.name}
            </span>
          </div>
          <div className="w-[173px] h-full flex items-center px-3">
            <div className="flex items-center gap-1 px-3 py-2 rounded-[100px] bg-[var(--color-success)]">
              <span className="text-[14px] font-secondary text-[var(--color-success-foreground)] leading-[1.4285714285714286]">
                {rover.status}
              </span>
            </div>
          </div>
          <div className="w-[172px] h-full flex items-center px-3">
            <span className="text-[14px] font-secondary text-[var(--foreground)] leading-[1.4285714285714286] w-full">
              {rover.location}
            </span>
          </div>
          <div className="flex-1 h-full flex items-center px-3">
            <span className="text-[14px] font-secondary text-[var(--foreground)] leading-[1.4285714285714286] w-full">
              {rover.mission}
            </span>
          </div>
          <div className="w-[98px] h-full flex items-center px-3">
            <span className="text-[14px] font-secondary text-[var(--foreground)] leading-[1.4285714285714286] w-full">
              View
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

