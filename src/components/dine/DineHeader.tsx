"use client";

interface DineHeaderProps {
  tableNumber: string;
  onCallWaiter: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  showSearch?: boolean; 
  headerHeight: number; // 💎 Pull prop here
}

export default function DineHeader({
  tableNumber,
  onCallWaiter,
  searchValue,
  onSearchChange,
  onClearSearch,
  showSearch = true, 
  headerHeight,
}: DineHeaderProps) {
  const maxHeight = typeof window !== "undefined" ? window.innerHeight * 0.5 : 380;
  
  // Calculate a proportional mix factor value between 0.00 and 1.00
  const factor = Math.max(0, Math.min(1, (headerHeight - 64) / (maxHeight - 64)));

  return (
    <div 
      className="menu-top" 
      style={{ 
        height: `${headerHeight}px`,
        minHeight: `${headerHeight}px`,
        maxHeight: `${headerHeight}px`
      }}
    >
      {/* Spacer fades down proportionally */}
      <div style={{ height: `${factor * 12}dvh` }} />

      <div className="w-full">
        <header className="app-header">
          <div className="header-left">
            <span className="header-logo">ROOSTER&apos;S DEN</span>
            <span className="header-table">{tableNumber}</span>
          </div>
          <div className="header-right">
            <button className="icon-btn btn-call-waiter-header" onClick={onCallWaiter}>
              <i className="ri-service-line" />
            </button>
          </div>
        </header>

        {showSearch && (
          /* Smoothly transitions opacity, scaling and height parameters with your finger */
          <div 
            style={{
              opacity: factor,
              maxHeight: `${factor * 60}px`,
              transform: `scaleY(${factor})`,
              transformOrigin: "bottom",
              pointerEvents: factor < 0.15 ? "none" : "auto",
              overflow: "hidden"
            }}
          >
            <div className="search-wrap">
              <i className="ri-search-line search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search dishes…"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}