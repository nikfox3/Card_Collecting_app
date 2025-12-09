interface StatsTileProps {
  title: string;
  value: string;
  change: string;
  isPositive?: boolean;
}

export default function StatsTile({ title, value, change, isPositive = true }: StatsTileProps) {
  return (
    <div className="flex-1 h-[192px] bg-[var(--background)] border border-[var(--border)] flex flex-col">
      {/* Tile Header */}
      <div className="w-full flex flex-col items-start justify-start px-6 py-4 border-b border-[var(--border)]">
        <span className="text-[16px] font-primary text-[var(--muted-foreground)] leading-[1.5] w-full">
          {title}
        </span>
      </div>

      {/* Tile Content */}
      <div className="w-full flex flex-col items-start justify-start px-6 py-6 gap-2">
        <span className="text-[32px] font-primary text-[var(--foreground)] leading-[1.5] w-full">
          {value}
        </span>
        <div className="flex items-center gap-1 px-3 py-2 rounded-[100px] bg-[var(--color-success)]">
          <span className="text-[14px] font-primary text-[var(--color-success-foreground)] leading-[1.5]">
            {change}
          </span>
        </div>
      </div>
    </div>
  );
}

