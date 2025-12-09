export default function Sidebar() {
  return (
    <div className="w-[280px] h-full bg-[var(--sidebar)] flex flex-col border-r border-[var(--sidebar-border)]">
      {/* Sidebar Header */}
      <div className="h-[88px] flex items-center justify-start px-8 py-6 border-b border-[var(--sidebar-border)]">
        <div className="flex items-center gap-2">
          {/* Lunaris Logo SVG */}
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path
              d="M16 0C7.163 0 0 7.163 0 16s7.163 16 16 16 16-7.163 16-16S24.837 0 16 0zm0 29.091C8.77 29.091 2.909 23.23 2.909 16S8.77 2.909 16 2.909 29.091 8.77 29.091 16 23.23 29.091 16 29.091zm7.273-13.091c0 4.012-3.261 7.273-7.273 7.273s-7.273-3.261-7.273-7.273S11.988 8.727 16 8.727s7.273 3.261 7.273 7.273z"
              fill="var(--primary)"
            />
          </svg>
          <span className="text-[18px] font-primary font-bold text-[var(--primary)] leading-none">
            LUNARIS
          </span>
        </div>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 flex flex-col gap-6 px-4 py-0">
        {/* Operations Section */}
        <div className="flex flex-col w-full">
          <div className="h-12 flex items-center justify-center px-4">
            <span className="text-[14px] font-primary text-[var(--sidebar-foreground)] w-full">
              Operations
            </span>
          </div>
          <div className="flex flex-col w-full">
            <div className="flex items-center gap-4 px-4 py-3 rounded-full bg-[var(--sidebar-accent)] w-full">
              <span className="material-symbols text-[24px] text-[var(--sidebar-accent-foreground)]" style={{ fontWeight: 100 }}>
                dashboard
              </span>
              <span className="text-[16px] font-secondary text-[var(--sidebar-accent-foreground)] flex-1">
                Dashboard
              </span>
            </div>
            <div className="flex items-center gap-4 px-4 py-3 rounded-full w-full">
              <span className="material-symbols text-[24px] text-[var(--sidebar-foreground)]" style={{ fontWeight: 100 }}>
                satellite_alt
              </span>
              <span className="text-[16px] font-secondary text-[var(--sidebar-foreground)] flex-1">
                Missions
              </span>
            </div>
            <div className="flex items-center gap-4 px-4 py-3 rounded-full w-full">
              <span className="material-symbols text-[24px] text-[var(--sidebar-foreground)]" style={{ fontWeight: 100 }}>
                signal_cellular_alt
              </span>
              <span className="text-[16px] font-secondary text-[var(--sidebar-foreground)] flex-1">
                Fleet status
              </span>
            </div>
          </div>
        </div>

        {/* Management Section */}
        <div className="flex flex-col w-full">
          <div className="h-12 flex items-center justify-center px-4">
            <span className="text-[14px] font-primary text-[var(--sidebar-foreground)] w-full">
              Management
            </span>
          </div>
          <div className="flex flex-col w-full">
            <div className="flex items-center gap-4 px-4 py-3 rounded-full w-full">
              <span className="material-symbols text-[24px] text-[var(--sidebar-foreground)]" style={{ fontWeight: 100 }}>
                calendar_today
              </span>
              <span className="text-[16px] font-secondary text-[var(--sidebar-foreground)] flex-1">
                Rentals
              </span>
            </div>
            <div className="flex items-center gap-4 px-4 py-3 rounded-full w-full">
              <span className="material-symbols text-[24px] text-[var(--sidebar-foreground)]" style={{ fontWeight: 100 }}>
                receipt
              </span>
              <span className="text-[16px] font-secondary text-[var(--sidebar-foreground)] flex-1">
                Billing
              </span>
            </div>
            <div className="flex items-center gap-4 px-4 py-3 rounded-full w-full">
              <span className="material-symbols text-[24px] text-[var(--sidebar-foreground)]" style={{ fontWeight: 100 }}>
                settings
              </span>
              <span className="text-[16px] font-secondary text-[var(--sidebar-foreground)] flex-1">
                Settings
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Account */}
      <div className="flex items-center gap-2 px-8 py-6 w-full">
        <div className="flex flex-col gap-1 flex-1">
          <span className="text-[16px] font-secondary text-[var(--sidebar-foreground)] w-full">
            Joe Doe
          </span>
          <span className="text-[16px] font-secondary text-[var(--sidebar-foreground)] w-full">
            joe@acmecorp.com
          </span>
        </div>
        <div className="rounded-full p-1 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M14.6667 5.33333L8 12L1.33333 5.33333"
              stroke="var(--sidebar-foreground)"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

