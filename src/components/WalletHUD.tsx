interface WalletHUDProps {
  events: number;
  cost: number;
  savings: number;
  sessionActive: boolean;
  usecase: string;
  position?: "header" | "bottom";
}

export default function WalletHUD({
  events,
  cost,
  savings,
  sessionActive,
  usecase,
  position = "header",
}: WalletHUDProps) {
  const usecaseUnit: Record<string, string> = {
    ai: "tokens",
    gaming: "actions",
    cloud: "units",
    iot: "reads",
  };

  if (position === "header") {
    return (
      <div className="flex items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              sessionActive
                ? "bg-success animate-pulse"
                : "bg-muted-foreground"
            }`}
          />
          <span className="text-muted-foreground">
            {sessionActive ? "Session Active" : "Idle"}
          </span>
        </div>
        <div className="w-px h-4 bg-border" />
        <span className="text-foreground tabular-nums">
          {events.toLocaleString()}{" "}
          <span className="text-muted-foreground">
            {usecaseUnit[usecase] || "events"}
          </span>
        </span>
        <div className="w-px h-4 bg-border" />
        <span className="text-primary tabular-nums">
          -${cost.toFixed(4)}
        </span>
        <div className="w-px h-4 bg-border" />
        <span style={{ color: "hsl(142, 76%, 36%)" }} className="tabular-nums">
          +${savings.toFixed(2)} saved
        </span>
      </div>
    );
  }

  // Mobile bottom bar
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass-strong px-4 py-3 lg:hidden">
      <div className="flex items-center justify-between text-xs font-mono max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              sessionActive
                ? "bg-success animate-pulse"
                : "bg-muted-foreground"
            }`}
          />
          <span className="text-foreground tabular-nums">
            {events.toLocaleString()}
          </span>
        </div>
        <span className="text-primary tabular-nums">
          ${cost.toFixed(4)}
        </span>
        <span style={{ color: "hsl(142, 76%, 36%)" }} className="tabular-nums">
          +${savings.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
