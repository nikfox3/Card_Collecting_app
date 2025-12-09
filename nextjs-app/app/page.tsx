import Sidebar from "@/components/Sidebar";
import StatsTile from "@/components/StatsTile";
import RoverTable from "@/components/RoverTable";

export default function Home() {
  return (
    <div className="w-full h-full bg-[var(--background)] flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Content Area */}
      <div className="flex-1 h-full flex flex-col gap-6 p-6 overflow-auto">
        {/* Stats Section */}
        <div className="w-full flex gap-6">
          <StatsTile title="Active Rovers" value="24" change="+12%" isPositive={true} />
          <StatsTile title="Total Missions" value="156" change="+8%" isPositive={true} />
          <StatsTile title="Success Rate" value="94.2%" change="+2.1%" isPositive={true} />
          <StatsTile title="Avg Distance (km)" value="1,247" change="-5%" isPositive={false} />
        </div>

        {/* Table Section */}
        <RoverTable />
      </div>
    </div>
  );
}
