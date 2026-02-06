import { useEffect, useRef, useState, useCallback } from "react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import GlobeCounter from "./GlobeCounter";
import WalletHUD from "./WalletHUD";

// --- Types ---
interface MeterState {
  events: number;
  cost: number;
  savings: number;
  sessionActive: boolean;
}

const STAGES = [
  "prize",
  "hero",
  "problem",
  "session",
  "pipeline",
  "yellow",
  "usecases",
  "business",
  "forecast",
  "video",
] as const;

const USECASES = [
  {
    id: "ai",
    label: "AI APIs",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" aria-hidden="true">
        <path
          d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    unit: "tokens",
    rate: 0.0001,
    eventsPerTick: 120,
    desc: "Pay-per-token for LLM inference, embedding generation, and AI model access",
  },
  {
    id: "gaming",
    label: "Gaming",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" aria-hidden="true">
        <path
          d="M6 12h4m-2-2v4m5-2h.01M17 10h.01M8 20H6a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2h-2l-3-3-3 3z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    unit: "actions",
    rate: 0.00005,
    eventsPerTick: 250,
    desc: "Micro-payments for in-game actions, loot drops, and multiplayer events",
  },
  {
    id: "cloud",
    label: "Cloud",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" aria-hidden="true">
        <path
          d="M8 17.5a6 6 0 01-.68-11.96A5.5 5.5 0 0118.39 9 4.5 4.5 0 0118 17.5H8z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    unit: "compute-hrs",
    rate: 0.001,
    eventsPerTick: 30,
    desc: "Granular billing for serverless functions, GPU time, and storage access",
  },
  {
    id: "iot",
    label: "IoT",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" aria-hidden="true">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M8.5 8.5a5 5 0 017 0M6 6a9 9 0 0112 0M15.5 15.5a5 5 0 01-7 0M18 18a9 9 0 01-12 0"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    unit: "readings",
    rate: 0.00001,
    eventsPerTick: 500,
    desc: "Sensor data monetization for smart devices, wearables, and industrial IoT",
  },
];

// --- Requirement Check Icon ---
function CheckIcon({ color = "currentColor" }: { color?: string }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// --- Main Component ---
export default function CinematicOverlay() {
  const [activeStage, setActiveStage] = useState("prize");
  const [activeUsecase, setActiveUsecase] = useState("ai");
  const [meter, setMeter] = useState<MeterState>({
    events: 0,
    cost: 0,
    savings: 0,
    sessionActive: false,
  });
  const [visibleStages, setVisibleStages] = useState<Set<string>>(new Set());
  const meterIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Scroll to stage
  const scrollTo = useCallback((id: string) => {
    document.getElementById(`stage-${id}`)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // IntersectionObserver for stage tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id.replace("stage-", "");
          if (entry.isIntersecting) {
            setActiveStage(id);
            setVisibleStages((prev) => new Set(prev).add(id));
          }
        }
      },
      { threshold: 0.3 }
    );

    const stages = document.querySelectorAll(".stage");
    stages.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Metering simulation
  useEffect(() => {
    const uc = USECASES.find((u) => u.id === activeUsecase);
    if (!uc) return;

    const sessionStages = ["session", "pipeline", "yellow", "usecases"];
    const isSessionStage = sessionStages.includes(activeStage);

    if (isSessionStage) {
      setMeter((prev) => ({ ...prev, sessionActive: true }));

      if (meterIntervalRef.current) clearInterval(meterIntervalRef.current);
      meterIntervalRef.current = setInterval(() => {
        setMeter((prev) => {
          const newEvents = prev.events + uc.eventsPerTick;
          const newCost = prev.cost + uc.eventsPerTick * uc.rate;
          const traditionalCost = uc.eventsPerTick * 0.0472;
          const newSavings = prev.savings + (traditionalCost - uc.eventsPerTick * uc.rate);
          return {
            events: newEvents,
            cost: newCost,
            savings: Math.max(0, newSavings),
            sessionActive: true,
          };
        });
      }, 2500);
    } else {
      setMeter((prev) => ({ ...prev, sessionActive: false }));
      if (meterIntervalRef.current) {
        clearInterval(meterIntervalRef.current);
        meterIntervalRef.current = null;
      }
    }

    return () => {
      if (meterIntervalRef.current) clearInterval(meterIntervalRef.current);
    };
  }, [activeStage, activeUsecase]);

  const isVisible = (stage: string) => visibleStages.has(stage);

  return (
    <div id="cinematic" className="relative pointer-events-auto">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-secondary">
        <div
          id="progress"
          className="h-full bg-primary origin-left"
          style={{ transform: "scaleX(0)", transition: "transform 0.3s" }}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0.5 left-0 right-0 z-40 glass-strong">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="breathing-glow">
              <svg viewBox="0 0 40 40" className="h-8 w-8" aria-hidden="true">
                <circle cx="20" cy="20" r="18" stroke="hsl(48,96%,53%)" strokeWidth="2" fill="none" />
                <circle cx="20" cy="20" r="14" stroke="hsl(48,96%,53%,0.3)" strokeWidth="1" fill="none" />
                <path d="M20 6 L20 14" stroke="hsl(48,96%,53%)" strokeWidth="2" strokeLinecap="round" />
                <path d="M20 20 L28 12" stroke="hsl(48,96%,53%)" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="20" cy="20" r="3" fill="hsl(48,96%,53%)" />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-wide text-foreground">YellowMeter OS</span>
            <span className="hidden md:inline text-xs text-muted-foreground">
              {"// Yellow Network"}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <WalletHUD
              events={meter.events}
              cost={meter.cost}
              savings={meter.savings}
              sessionActive={meter.sessionActive}
              usecase={activeUsecase}
              position="header"
            />
            <ConnectButton showBalance={false} accountStatus="address" chainStatus="icon" />
          </div>
        </div>
      </header>

      {/* Nav dots */}
      <nav
        className="fixed right-4 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col gap-2"
        aria-label="Stage navigation"
      >
        {STAGES.map((id) => (
          <button
            key={id}
            onClick={() => scrollTo(id)}
            className={`h-2.5 w-2.5 rounded-full border transition-all duration-300 ${
              activeStage === id
                ? "bg-primary border-primary scale-125"
                : "bg-primary/10 border-primary/40 hover:bg-primary/30"
            }`}
            aria-label={`Navigate to ${id}`}
          />
        ))}
      </nav>

      {/* Mobile HUD */}
      <WalletHUD
        events={meter.events}
        cost={meter.cost}
        savings={meter.savings}
        sessionActive={meter.sessionActive}
        usecase={activeUsecase}
        position="bottom"
      />

      {/* ===== STAGE 0: PRIZE REQUIREMENTS ===== */}
      <section
        id="stage-prize"
        className="stage relative flex min-h-screen items-center px-4 pt-24 pb-12"
      >
        <div
          className={`mx-auto max-w-5xl transition-all duration-1000 ${
            isVisible("prize") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="flex justify-center mb-6">
            <div className="glass-strong rounded-full px-6 py-2 border border-primary/40">
              <span className="text-sm font-bold text-primary">
                Yellow Network Prize Submission
              </span>
            </div>
          </div>

          <h1 className="text-center text-5xl md:text-7xl lg:text-8xl font-bold mb-4 text-balance">
            <span className="shimmer-text">YellowMeter OS</span>
          </h1>
          <p className="text-center text-lg md:text-xl text-muted-foreground mb-16 max-w-3xl mx-auto text-balance">
            Session-based metering infrastructure for Web3 monetization powered
            by Yellow SDK
          </p>

          {/* Globe Counter */}
          <div className="mb-16">
            <GlobeCounter
              eventsCount={meter.events}
              savings={meter.savings}
              activeSession={meter.sessionActive}
              activeUsecase={activeUsecase}
            />
          </div>

          {/* 4 Requirement Cards */}
          <div className="grid md:grid-cols-2 gap-4 mb-12">
            <RequirementCard
              title="Yellow SDK / Nitrolite"
              description="Integrated off-chain metering engine with openSession(), recordUsage(), closeAndSettle()"
              color="primary"
              tags={["Stage 5", "Code Demo"]}
            />
            <RequirementCard
              title="Off-chain Transaction Logic"
              description="Session-based billing: aggregate 1000s of micro-events off-chain, settle net on-chain"
              color="success"
              tags={["Stage 3-4", "Live Demo"]}
            />
            <RequirementCard
              title="Functional Prototype"
              description="Live HUD simulation: watch metering in real-time across 4 use cases (AI, Gaming, Cloud, IoT)"
              color="primary"
              tags={["Wallet HUD", "Interactive"]}
            />
            <RequirementCard
              title="Demo Video (2-3 min)"
              description="Full integration walkthrough: problem, solution, Yellow SDK, user flow"
              color="success"
              tags={["Stage 9", "Video Embed"]}
            />
          </div>

          <div className="text-center">
            <button
              onClick={() => scrollTo("hero")}
              className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-bold text-lg hover:brightness-110 transition-all"
            >
              Explore the Solution
            </button>
          </div>
        </div>
      </section>

      {/* ===== STAGE 1: HERO ===== */}
      <section
        id="stage-hero"
        className="stage relative flex min-h-screen items-center justify-center px-4"
      >
        <div
          className={`text-center max-w-4xl mx-auto transition-all duration-1000 ${
            isVisible("hero") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Meter icon large */}
          <div className="flex justify-center mb-8">
            <svg viewBox="0 0 40 40" className="h-28 w-28 md:h-36 md:w-36 breathing-glow" aria-hidden="true">
              <circle cx="20" cy="20" r="18" stroke="hsl(48,96%,53%)" strokeWidth="2" fill="none" />
              <circle cx="20" cy="20" r="14" stroke="hsl(48,96%,53%,0.3)" strokeWidth="1" fill="none" />
              <circle cx="20" cy="20" r="10" stroke="hsl(48,96%,53%,0.15)" strokeWidth="0.5" fill="none" />
              <path d="M20 6 L20 14" stroke="hsl(48,96%,53%)" strokeWidth="2" strokeLinecap="round" />
              <path d="M20 20 L28 12" stroke="hsl(48,96%,53%)" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="20" cy="20" r="3" fill="hsl(48,96%,53%)" />
              <path d="M10 30 A14 14 0 0 1 6 20" stroke="hsl(48,96%,53%,0.5)" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M30 30 A14 14 0 0 0 34 20" stroke="hsl(48,96%,53%,0.5)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-balance">
            Every micro-event,{" "}
            <span className="text-primary">metered.</span>
            <br />
            One settlement.
          </h2>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-pretty">
            The operating system for granular Web3 billing. Track thousands of
            events off-chain, settle once on-chain. Powered by Yellow Network.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => scrollTo("problem")}
              className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-bold hover:brightness-110 transition-all"
            >
              See the Problem
            </button>
            <button
              onClick={() => scrollTo("yellow")}
              className="px-8 py-4 glass rounded-lg font-bold text-foreground hover:bg-secondary transition-colors"
            >
              Yellow SDK Integration
            </button>
          </div>
        </div>
      </section>

      {/* ===== STAGE 2: PROBLEM ===== */}
      <section
        id="stage-problem"
        className="stage relative flex min-h-screen items-center px-4 py-24"
      >
        <div
          className={`mx-auto max-w-6xl transition-all duration-1000 ${
            isVisible("problem") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <StageBadge label="The Problem" />
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-balance">
            Web3 Monetization is{" "}
            <span className="text-destructive">Broken</span>
          </h2>
          <p className="text-center text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
            Every micro-interaction on-chain costs gas. At scale, this makes
            granular billing economically impossible.
          </p>

          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Wall SVG */}
            <div className="flex justify-center">
              <div className="glass-strong rounded-xl p-8 border border-destructive/20 shadow-lg shadow-destructive/5">
                <svg viewBox="0 0 320 280" className="w-full max-w-sm" aria-label="Gas barrier illustration showing micro-transactions being blocked by high fees">
                  {/* Barrier wall */}
                  <rect x="140" y="20" width="20" height="240" rx="4" fill="hsl(220,10%,20%)" stroke="hsl(220,10%,35%)" strokeWidth="2" />
                  <text x="150" y="150" textAnchor="middle" fill="hsl(220,10%,70%)" fontSize="11" fontWeight="bold" transform="rotate(-90 150 145)">
                    GAS BARRIER
                  </text>
                  
                  {/* Transactions hitting the barrier */}
                  {[40, 80, 120, 160, 200].map((y, i) => (
                    <g key={y}>
                      {/* Outer glow */}
                      <circle cx="60" cy={y} r="12" fill={`hsl(48,96%,53%,${0.2 + i * 0.08})`} />
                      {/* Main circle */}
                      <circle cx="60" cy={y} r="10" fill={`hsl(48,96%,53%,${0.6 + i * 0.08})`} stroke="hsl(48,96%,53%)" strokeWidth="1" />
                      {/* Transaction line */}
                      <line x1="72" y1={y} x2="130" y2={y} stroke="hsl(48,96%,53%,0.4)" strokeWidth="1.5" strokeDasharray="4 4" />
                      {/* TX label */}
                      <text x="60" y={y + 4} textAnchor="middle" fill="hsl(220,15%,5%)" fontSize="10" fontWeight="800">
                        TX
                      </text>
                      {/* Cost label with better visibility */}
                      <text x="200" y={y + 4} textAnchor="middle" fill="hsl(0,72%,60%)" fontSize="11" fontWeight="800">
                        {"$0.05-$50"}
                      </text>
                    </g>
                  ))}
                  
                  {/* Wasted amount - more prominent */}
                  <text x="260" y="260" textAnchor="middle" fill="hsl(0,72%,60%)" fontSize="15" fontWeight="800">
                    $47.20 wasted
                  </text>
                </svg>
              </div>
            </div>

            {/* Problem cards */}
            <div className="space-y-4">
              {[
                {
                  title: "Wallet Fatigue",
                  desc: "Users sign 50+ transactions per session. 73% abandon at the 3rd popup.",
                },
                {
                  title: "Gas Cost > Value",
                  desc: "A $0.001 API call costs $0.05 in gas. 50x overhead kills unit economics.",
                },
                {
                  title: "No Granular Billing",
                  desc: "Blockchains cannot track per-token, per-second, per-action usage.",
                },
                {
                  title: "Subscription Lock-in",
                  desc: "Users pay flat fees for resources they never use. Zero flexibility.",
                },
              ].map((item) => (
                <div key={item.title} className="glass rounded-lg p-4 flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-destructive" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== STAGE 3: SESSION MODEL ===== */}
      <section
        id="stage-session"
        className="stage relative flex min-h-screen items-center px-4 py-24"
      >
        <div
          className={`mx-auto max-w-6xl transition-all duration-1000 ${
            isVisible("session") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <StageBadge label="The Solution" />
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-balance">
            Session-Based <span className="text-primary">Metering</span>
          </h2>
          <p className="text-center text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
            Group thousands of micro-events into one session. Meter off-chain, settle once on-chain.
          </p>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Session diagram */}
            <div className="glass-strong rounded-xl p-6">
              <h3 className="font-bold text-foreground mb-4 text-center">Session Lifecycle</h3>
              <svg viewBox="0 0 300 200" className="w-full" aria-label="Session lifecycle diagram">
                {/* Container */}
                <rect x="20" y="30" width="260" height="140" rx="12" fill="hsl(220,12%,8%)" stroke="hsl(48,96%,53%,0.3)" strokeWidth="1.5" strokeDasharray="6 4" />
                <text x="150" y="22" textAnchor="middle" fill="hsl(48,96%,53%)" fontSize="10" fontWeight="bold">OFF-CHAIN SESSION</text>

                {/* Micro events flowing in */}
                {[50, 80, 110, 140, 170].map((x, i) => (
                  <g key={x}>
                    <circle cx={x} cy={70 + (i % 2) * 20} r="6" fill={`hsl(48,96%,53%,${0.3 + i * 0.1})`}>
                      <animate attributeName="opacity" values="0.3;0.8;0.3" dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite" />
                    </circle>
                    <text x={x} y={73 + (i % 2) * 20} textAnchor="middle" fill="hsl(220,15%,5%)" fontSize="5" fontWeight="bold">
                      E{i + 1}
                    </text>
                  </g>
                ))}

                {/* Aggregation arrow */}
                <path d="M60 130 L240 130" stroke="hsl(48,96%,53%,0.5)" strokeWidth="1.5" strokeDasharray="4 3" />
                <polygon points="240,127 248,130 240,133" fill="hsl(48,96%,53%,0.5)" />

                {/* Settlement output */}
                <rect x="200" y="145" width="70" height="20" rx="4" fill="hsl(48,96%,53%,0.15)" stroke="hsl(48,96%,53%)" strokeWidth="1" />
                <text x="235" y="158" textAnchor="middle" fill="hsl(48,96%,53%)" fontSize="7" fontWeight="bold">1 TX ON-CHAIN</text>
              </svg>
            </div>

            {/* Use case selector */}
            <div className="space-y-4">
              <h3 className="font-bold text-foreground mb-2">Select Use Case</h3>
              <div className="grid grid-cols-2 gap-3">
                {USECASES.map((uc) => (
                  <button
                    key={uc.id}
                    onClick={() => {
                      setActiveUsecase(uc.id);
                      setMeter({ events: 0, cost: 0, savings: 0, sessionActive: true });
                    }}
                    className={`glass rounded-lg p-4 text-left transition-all ${
                      activeUsecase === uc.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "hover:bg-secondary"
                    }`}
                  >
                    <div className={`mb-2 ${activeUsecase === uc.id ? "text-primary" : "text-muted-foreground"}`}>
                      {uc.icon}
                    </div>
                    <div className="font-bold text-sm text-foreground">{uc.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{uc.unit}</div>
                  </button>
                ))}
              </div>

              <div className="glass-strong rounded-lg p-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  {USECASES.find((u) => u.id === activeUsecase)?.desc}
                </p>
                <div className="flex gap-4 mt-3 text-xs font-mono">
                  <span className="text-foreground">
                    Rate: <span className="text-primary">${USECASES.find((u) => u.id === activeUsecase)?.rate}/unit</span>
                  </span>
                  <span className="text-foreground">
                    Speed: <span className="text-primary">{USECASES.find((u) => u.id === activeUsecase)?.eventsPerTick}/tick</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STAGE 4: PIPELINE ===== */}
      <section
        id="stage-pipeline"
        className="stage relative flex min-h-screen items-center px-4 py-24"
      >
        <div
          className={`mx-auto max-w-6xl transition-all duration-1000 ${
            isVisible("pipeline") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <StageBadge label="Architecture" />
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-balance">
            The <span className="text-primary">Metering Pipeline</span>
          </h2>

          <div className="grid md:grid-cols-4 gap-4">
            {[
              {
                step: "01",
                title: "Session Start",
                desc: "User opens session. Deposit locked in state channel.",
                color: "primary",
              },
              {
                step: "02",
                title: "Meter Events",
                desc: "Record usage off-chain. Each event timestamped and signed.",
                color: "primary",
              },
              {
                step: "03",
                title: "Policy Engine",
                desc: "Apply rate limits, caps, and billing rules in real-time.",
                color: "primary",
              },
              {
                step: "04",
                title: "Settle On-chain",
                desc: "Close session. Single transaction settles entire usage.",
                color: "success",
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className={`glass-strong rounded-xl p-6 border-t-2 transition-all duration-700 ${
                  isVisible("pipeline")
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{
                  transitionDelay: `${i * 150}ms`,
                  borderColor: item.color === "success" ? "hsl(142,76%,36%)" : "hsl(48,96%,53%)",
                }}
              >
                <div
                  className="text-3xl font-bold font-mono mb-3"
                  style={{
                    color: item.color === "success" ? "hsl(142,76%,36%)" : "hsl(48,96%,53%)",
                  }}
                >
                  {item.step}
                </div>
                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Pipeline flow SVG */}
          <div className="mt-8 flex justify-center">
            <svg viewBox="0 0 400 40" className="w-full max-w-2xl" aria-hidden="true">
              <line x1="50" y1="20" x2="350" y2="20" stroke="hsl(48,96%,53%,0.3)" strokeWidth="2" strokeDasharray="6 4" />
              {[50, 150, 250, 350].map((x, i) => (
                <g key={x}>
                  <circle cx={x} cy={20} r="8" fill={i === 3 ? "hsl(142,76%,36%)" : "hsl(48,96%,53%)"} />
                  <text x={x} y={24} textAnchor="middle" fill="hsl(220,15%,5%)" fontSize="8" fontWeight="bold">
                    {i + 1}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </section>

      {/* ===== STAGE 5: YELLOW SDK INTEGRATION ===== */}
      <section
        id="stage-yellow"
        className="stage relative flex min-h-screen items-center px-4 py-24"
      >
        <div
          className={`mx-auto max-w-6xl transition-all duration-1000 ${
            isVisible("yellow") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="flex justify-center mb-6">
            <div className="glass-strong rounded-full px-6 py-3 border-2 border-primary">
              <span className="font-bold text-primary">Yellow SDK / Nitrolite Integration</span>
            </div>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-balance">
            Powered by <span className="text-primary">Yellow Network</span>
          </h2>
          <p className="text-center text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
            High-speed off-chain logic, intelligent batching, and programmable settlement through Yellow SDK
          </p>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Code snippet */}
            <div className="glass-strong rounded-xl p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-muted-foreground">yellowmeter-integration.ts</span>
                <div className="flex gap-2">
                  <span className="text-xs px-2 py-1 bg-primary/10 rounded-md text-primary font-mono">TypeScript</span>
                  <span className="text-xs px-2 py-1 rounded-md font-mono" style={{ background: "hsl(142,76%,36%,0.1)", color: "hsl(142,76%,36%)" }}>Yellow SDK</span>
                </div>
              </div>
              <pre className="text-xs md:text-sm font-mono leading-relaxed overflow-x-auto text-foreground">
                <code>{`// 1. Initialize Yellow SDK
import { YellowSDK } from '@yellow/sdk';

const yellow = new YellowSDK({
  network: 'mainnet',
  apiKey: process.env.YELLOW_API_KEY
});

// 2. Open metering session
const session = await yellow.openSession({
  userId: user.id,
  duration: '30m',
  rateLimit: {
    tokensPerMin: 1000,
    costPerToken: 0.0001
  }
});

// 3. Record usage events (off-chain)
await session.recordUsage({
  tokens: 120,
  eventType: 'api_call',
  metadata: { endpoint: "/generate" }
});

// 4. Close and settle (on-chain batch)
const settlement = await session.closeAndSettle();
// → Single on-chain tx for 1000+ events`}</code>
              </pre>
            </div>

            {/* Benefits */}
            <div className="space-y-4">
              {[
                {
                  icon: (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                  title: "Off-chain Metering",
                  desc: "Record thousands of micro-events without blockchain latency or gas fees",
                },
                {
                  icon: (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                  title: "Intelligent Batching",
                  desc: "Automatic aggregation and compression of usage data for efficient settlement",
                },
                {
                  icon: (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                  title: "Net Settlement",
                  desc: "Single on-chain transaction settles entire session, reducing costs by 99%",
                },
                {
                  icon: (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                  title: "Chain Agnostic",
                  desc: "Works across any EVM chain with Yellow's modular architecture",
                },
              ].map((item) => (
                <div key={item.title} className="glass rounded-lg p-5 flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap gap-2 pt-2">
                {["EVM Compatible", "Nitrolite Engine", "Gasless UX", "Real-time Metering"].map((badge) => (
                  <span
                    key={badge}
                    className="text-xs px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary font-medium"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Performance comparison */}
          <div className="mt-12 glass-strong rounded-xl p-8">
            <h3 className="text-center font-bold text-lg mb-8 text-foreground">Performance Impact</h3>
            <div className="grid md:grid-cols-3 gap-6 items-center">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-destructive mb-2 font-mono">$47.20</div>
                <div className="text-sm text-muted-foreground mb-1">Traditional per-event</div>
                <div className="text-xs text-destructive">(1000 on-chain txs)</div>
              </div>
              <div className="flex items-center justify-center">
                <svg className="w-16 h-16 text-primary" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M13 7l5 5m0 0l-5 5m5-5H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold font-mono" style={{ color: "hsl(142,76%,36%)" }}>$0.05</div>
                <div className="text-sm text-muted-foreground mb-1">With Yellow SDK</div>
                <div className="text-xs" style={{ color: "hsl(142,76%,36%)" }}>(1 batched settlement)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STAGE 6: USE CASES ===== */}
      <section
        id="stage-usecases"
        className="stage relative flex min-h-screen items-center px-4 py-24"
      >
        <div
          className={`mx-auto max-w-6xl transition-all duration-1000 ${
            isVisible("usecases") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <StageBadge label="Use Cases" />
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-balance">
            Four Verticals, <span className="text-primary">One Engine</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {USECASES.map((uc, i) => (
              <div
                key={uc.id}
                className={`glass-strong rounded-xl p-6 transition-all duration-700 ${
                  isVisible("usecases") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    {uc.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground mb-1">{uc.label}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{uc.desc}</p>
                    <div className="flex gap-3 text-xs font-mono">
                      <span className="px-2 py-1 bg-primary/10 rounded text-primary">
                        {uc.unit}
                      </span>
                      <span className="px-2 py-1 bg-secondary rounded text-foreground">
                        ${uc.rate}/unit
                      </span>
                      <span className="px-2 py-1 bg-secondary rounded text-foreground">
                        {uc.eventsPerTick}/tick
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STAGE 7: BUSINESS MODEL ===== */}
      <section
        id="stage-business"
        className="stage relative flex min-h-screen items-center px-4 py-24"
      >
        <div
          className={`mx-auto max-w-6xl transition-all duration-1000 ${
            isVisible("business") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <StageBadge label="Business Model" />
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-balance">
            Sustainable <span className="text-primary">Unit Economics</span>
          </h2>

          {/* Revenue streams */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="glass-strong rounded-xl p-6 border-t-2 border-primary">
              <h3 className="text-lg font-bold text-primary mb-4 text-center">Take Rate Model</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Base rate:</span>
                  <span className="text-foreground font-mono">0.5%</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{"Volume tier (>$1M/mo):"}</span>
                  <span className="text-foreground font-mono">0.3%</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Enterprise:</span>
                  <span className="text-foreground font-mono">0.25%</span>
                </div>
                <div className="pt-3 border-t border-border text-xs text-muted-foreground">
                  Applied to settled volume
                </div>
              </div>
            </div>
            <div className="glass-strong rounded-xl p-6 border-t-2" style={{ borderColor: "hsl(142,76%,36%)" }}>
              <h3 className="text-lg font-bold mb-4 text-center" style={{ color: "hsl(142,76%,36%)" }}>SaaS Tiers</h3>
              <div className="space-y-3 text-sm">
                <div className="glass rounded-lg p-3">
                  <div className="font-bold text-foreground">Starter - $299/mo</div>
                  <div className="text-xs text-muted-foreground">100K events/mo, basic analytics</div>
                </div>
                <div className="glass rounded-lg p-3">
                  <div className="font-bold text-foreground">Pro - $999/mo</div>
                  <div className="text-xs text-muted-foreground">1M events/mo, advanced analytics, SLA</div>
                </div>
                <div className="glass rounded-lg p-3">
                  <div className="font-bold text-foreground">Enterprise - Custom</div>
                  <div className="text-xs text-muted-foreground">Unlimited, white-label, dedicated support</div>
                </div>
              </div>
            </div>

            <div className="glass-strong rounded-xl p-6 border-t-2 border-primary">
              <h3 className="text-lg font-bold text-primary mb-4 text-center">Partner Network</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div>
                  <div className="font-semibold text-foreground mb-1">Integration Partners</div>
                  <div className="text-xs">15-25% revenue share for bringing clients</div>
                </div>
                <div>
                  <div className="font-semibold text-foreground mb-1">Yellow Network</div>
                  <div className="text-xs">Co-marketing, joint GTM, protocol revenue share</div>
                </div>
                <div>
                  <div className="font-semibold text-foreground mb-1">Ecosystem Incentives</div>
                  <div className="text-xs">Token rewards for top integrators</div>
                </div>
              </div>
            </div>
          </div>

          {/* Unit Economics */}
          <div className="glass-strong rounded-xl p-8">
            <h3 className="text-xl font-bold mb-6 text-center text-foreground">Unit Economics Breakdown</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center glass rounded-lg p-4">
                <div className="text-2xl font-bold text-primary mb-1 font-mono">$1,374</div>
                <div className="text-xs text-muted-foreground">Revenue / customer</div>
              </div>
              <div className="text-center glass rounded-lg p-4">
                <div className="text-2xl font-bold text-destructive mb-1 font-mono">-$150</div>
                <div className="text-xs text-muted-foreground">Infrastructure</div>
              </div>
              <div className="text-center glass rounded-lg p-4">
                <div className="text-2xl font-bold text-destructive mb-1 font-mono">-$50</div>
                <div className="text-xs text-muted-foreground">Protocol fees</div>
              </div>
              <div className="text-center glass rounded-lg p-4 ring-1 ring-success/30">
                <div className="text-2xl font-bold mb-1 font-mono" style={{ color: "hsl(142,76%,36%)" }}>$1,174</div>
                <div className="text-xs text-muted-foreground">Gross Margin (85%)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STAGE 8: FORECAST ===== */}
      <section
        id="stage-forecast"
        className="stage relative flex min-h-screen items-center px-4 py-24"
      >
        <div
          className={`mx-auto max-w-5xl transition-all duration-1000 ${
            isVisible("forecast") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <StageBadge label="Growth Projection" />
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-balance">
            Path to <span className="text-primary">$10M ARR</span>
          </h2>

          <div className="glass-strong rounded-xl p-8 mb-8">
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { year: "Y1", clients: "50", arr: "$823K", color: "primary" },
                { year: "Y2", clients: "200", arr: "$3.3M", color: "primary" },
                { year: "Y3", clients: "500", arr: "$8.2M", color: "primary" },
                { year: "Y4", clients: "1000+", arr: "$16.5M", color: "success" },
              ].map((item) => (
                <div key={item.year} className="text-center">
                  <div
                    className="text-3xl font-bold font-mono mb-2"
                    style={{
                      color: item.color === "success" ? "hsl(142,76%,36%)" : "hsl(48,96%,53%)",
                    }}
                  >
                    {item.arr}
                  </div>
                  <div className="text-sm font-bold text-foreground">{item.year}</div>
                  <div className="text-xs text-muted-foreground">{item.clients} clients</div>
                </div>
              ))}
            </div>

            {/* Simple bar chart */}
            <div className="mt-8 flex items-end justify-center gap-4 h-32">
              {[
                { h: "20%", label: "Y1" },
                { h: "40%", label: "Y2" },
                { h: "70%", label: "Y3" },
                { h: "100%", label: "Y4" },
              ].map((bar) => (
                <div key={bar.label} className="flex flex-col items-center gap-2 flex-1 max-w-20">
                  <div
                    className="w-full rounded-t-md transition-all duration-1000"
                    style={{
                      height: isVisible("forecast") ? bar.h : "0%",
                      background: bar.label === "Y4"
                        ? "hsl(142,76%,36%)"
                        : "hsl(48,96%,53%)",
                    }}
                  />
                  <span className="text-xs text-muted-foreground font-mono">{bar.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key assumptions */}
          <div className="glass rounded-xl p-6">
            <h3 className="font-bold text-foreground mb-4">Key Assumptions</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-primary">{">"}</span>
                <span className="text-muted-foreground">Average customer LTV: $16,488</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">{">"}</span>
                <span className="text-muted-foreground">CAC payback: 2.5 months</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">{">"}</span>
                <span className="text-muted-foreground">Net revenue retention: 135%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STAGE 9: VIDEO DEMO ===== */}
      <section
        id="stage-video"
        className="stage relative flex min-h-screen items-center px-4 py-24"
      >
        <div
          className={`mx-auto max-w-5xl transition-all duration-1000 ${
            isVisible("video") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="flex justify-center mb-6">
            <div className="glass-strong rounded-full px-6 py-3 border-2 border-primary">
              <span className="font-bold text-primary">Demo Video (2-3 min)</span>
            </div>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-balance">
            See YellowMeter OS <span className="text-primary">in Action</span>
          </h2>
          <p className="text-center text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
            Full walkthrough: problem statement, Yellow SDK integration, live prototype demo, and business model
          </p>

          {/* Video embed */}
          <div className="relative rounded-xl overflow-hidden glass-strong border-2 border-primary/30 mb-8">
            <div className="aspect-video flex items-center justify-center" style={{ background: "hsl(220,15%,3%)" }}>
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 hover:bg-primary/30 transition-colors cursor-pointer">
                  <svg className="w-8 h-8 text-primary ml-1" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <div className="text-lg text-foreground font-semibold mb-1">Demo Video</div>
                <div className="text-sm text-muted-foreground">
                  Replace with YouTube/Vimeo/Loom embed
                </div>
              </div>
            </div>
          </div>

          {/* Video chapters */}
          <div className="grid md:grid-cols-4 gap-4 mb-12">
            {[
              { time: "0:00-0:45", label: "Problem Statement" },
              { time: "0:45-1:30", label: "Yellow SDK Integration" },
              { time: "1:30-2:15", label: "Live Prototype Demo" },
              { time: "2:15-3:00", label: "Business Model & Impact" },
            ].map((ch) => (
              <div key={ch.time} className="glass rounded-lg p-4 text-center">
                <div className="text-lg font-bold text-primary mb-2 font-mono">{ch.time}</div>
                <div className="text-sm text-muted-foreground">{ch.label}</div>
              </div>
            ))}
          </div>

          {/* Final CTA */}
          <div className="glass-strong rounded-xl p-8 text-center border border-primary/20">
            <h3 className="text-2xl font-bold mb-4 text-foreground text-balance">
              Ready to Transform Web3 Monetization?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              YellowMeter OS + Yellow Network = The future of granular, gasless,
              session-based billing
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-bold text-lg hover:brightness-110 transition-all">
                Request Demo
              </button>
              <button className="px-8 py-4 glass rounded-lg font-bold text-lg text-foreground hover:bg-secondary transition-colors">
                Join Waitlist
              </button>
            </div>
          </div>

          {/* Download links */}
          <div className="mt-8 text-center">
            <div className="text-sm text-muted-foreground mb-4">Resources</div>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { label: "Pitch Deck (PDF)", href: "#" },
                { label: "Technical Docs", href: "#" },
                { label: "GitHub Repo", href: "#" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-5 py-2.5 glass rounded-lg hover:bg-secondary transition-colors text-sm font-semibold text-foreground"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 pb-20 lg:pb-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 40 40" className="h-5 w-5" aria-hidden="true">
              <circle cx="20" cy="20" r="18" stroke="hsl(48,96%,53%)" strokeWidth="2" fill="none" />
              <circle cx="20" cy="20" r="3" fill="hsl(48,96%,53%)" />
              <path d="M20 20 L28 12" stroke="hsl(48,96%,53%)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-foreground font-semibold">YellowMeter OS</span>
          </div>
          <span>Yellow Network Prize Submission 2025</span>
        </div>
      </footer>
    </div>
  );
}

// --- Sub-components ---
function StageBadge({ label }: { label: string }) {
  return (
    <div className="flex justify-center mb-6">
      <div className="glass rounded-full px-5 py-2">
        <span className="text-sm font-semibold text-primary">{label}</span>
      </div>
    </div>
  );
}

function RequirementCard({
  title,
  description,
  color,
  tags,
}: {
  title: string;
  description: string;
  color: "primary" | "success";
  tags: string[];
}) {
  const borderColor = color === "success" ? "hsl(142,76%,36%)" : "hsl(48,96%,53%)";
  const textColor = color === "success" ? "hsl(142,76%,36%)" : "hsl(48,96%,53%)";
  const bgColor = color === "success" ? "hsl(142,76%,36%,0.1)" : "hsl(48,96%,53%,0.1)";

  return (
    <div
      className="glass-strong rounded-lg p-6"
      style={{ borderLeft: `4px solid ${borderColor}` }}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: bgColor, color: textColor }}
        >
          <CheckIcon color={textColor} />
        </div>
        <div>
          <h3 className="text-base font-bold mb-1" style={{ color: textColor }}>
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="mt-2 flex gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 rounded font-mono"
                style={{ background: bgColor, color: textColor }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
