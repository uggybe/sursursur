import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import svgPaths from "../../imports/svg-1e2dsvauft";

/* ==================== DATA GENERATION ==================== */
type Period = "1H" | "7H" | "24H" | "30D";
const TOTAL_POINTS = 1440; // ~60 days of data so all periods can scroll
const VISIBLE_POINTS: Record<Period, number> = { "1H": 60, "7H": 168, "24H": 288, "30D": 720 };

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
}

function generateFullData(base: number, amplitude: number, noiseLevel: number, seed: number): number[] {
  const rng = seededRandom(seed);
  const data: number[] = [];
  let prev = base;
  for (let i = 0; i < TOTAL_POINTS; i++) {
    const t = i / TOTAL_POINTS;
    const wave = Math.sin(t * Math.PI * 3 + seed * 0.1) * amplitude * 0.4
      + Math.sin(t * Math.PI * 7 + seed * 0.3) * amplitude * 0.25
      + Math.sin(t * Math.PI * 13 + seed * 0.7) * amplitude * 0.1;
    const noise = (rng() - 0.5) * noiseLevel;
    prev = prev * 0.7 + (base + wave + noise) * 0.3;
    data.push(prev);
  }
  return data;
}

function dataToSvgPath(data: number[], width: number, height: number, minVal: number, maxVal: number): string {
  if (data.length < 2) return "";
  const step = width / (data.length - 1);
  const range = maxVal - minVal || 1;
  const pad = height * 0.05;
  const usableH = height - pad * 2;
  const pts = data.map((v, i) => ({ x: i * step, y: pad + usableH - ((v - minVal) / range) * usableH }));
  let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) d += ` L${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
  return d;
}

/* ==================== TIME HELPERS ==================== */
function generateAllTimestamps(): Date[] {
  const now = new Date();
  const totalMs = 60 * 24 * 3600000;
  const step = totalMs / (TOTAL_POINTS - 1);
  const start = new Date(now.getTime() - totalMs);
  return Array.from({ length: TOTAL_POINTS }, (_, i) => new Date(start.getTime() + i * step));
}

function formatTs(d: Date, period: Period): string {
  if (period === "30D") return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}`;
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function getVisibleLabels(timestamps: Date[], period: Period): string[] {
  const n: Record<Period, number> = { "1H": 6, "7H": 7, "24H": 12, "30D": 10 };
  const count = n[period];
  const step = Math.max(1, Math.floor((timestamps.length - 1) / count));
  const labels: string[] = [];
  for (let i = 1; i <= count; i++) {
    const idx = Math.min(i * step, timestamps.length - 1);
    labels.push(formatTs(timestamps[idx], period));
  }
  return labels;
}

/* ==================== NICE Y AXIS ==================== */
function niceNum(val: number, round: boolean): number {
  const exp = Math.floor(Math.log10(Math.abs(val) || 1));
  const frac = val / Math.pow(10, exp);
  let nice: number;
  if (round) {
    if (frac < 1.5) nice = 1; else if (frac < 3) nice = 2; else if (frac < 7) nice = 5; else nice = 10;
  } else {
    if (frac <= 1) nice = 1; else if (frac <= 2) nice = 2; else if (frac <= 5) nice = 5; else nice = 10;
  }
  return nice * Math.pow(10, exp);
}

function niceYAxis(data: number[], unit: string): { min: number; max: number; labels: { value: string; pct: number }[] } {
  let dMin = Infinity, dMax = -Infinity;
  for (const v of data) { if (v < dMin) dMin = v; if (v > dMax) dMax = v; }
  if (dMin === dMax) { dMin -= 5; dMax += 5; }
  const tickSpacing = niceNum((dMax - dMin) / 4, true);
  const min = Math.floor(dMin / tickSpacing) * tickSpacing;
  const max = Math.ceil(dMax / tickSpacing) * tickSpacing;
  const nTicks = Math.round((max - min) / tickSpacing);
  const labels: { value: string; pct: number }[] = [];
  for (let i = 0; i <= nTicks; i++) {
    const val = max - i * tickSpacing;
    const pctPos = (i / nTicks) * 100;
    let formatted: string;
    if (unit === "rpm" || unit === "%") formatted = Math.round(val).toString();
    else formatted = Number.isInteger(val) ? val.toString() : val.toFixed(1);
    labels.push({ value: formatted, pct: pctPos });
  }
  return { min, max, labels };
}

/* ==================== CHART DATA HOOK ==================== */
function useChartData() {
  const [tick, setTick] = useState(0);
  useEffect(() => { const iv = setInterval(() => setTick(t => t + 1), 4000); return () => clearInterval(iv); }, []);

  return useMemo(() => {
    const seed = tick * 7;
    return {
      temp1: generateFullData(32, 8, 4, seed + 1),
      temp2: generateFullData(25, 6, 3, seed + 2),
      temp3: generateFullData(20, 5, 2.5, seed + 3),
      humidity: generateFullData(52, 12, 5, seed + 4),
      fan1: generateFullData(1800, 400, 150, seed + 5),
      fan2: generateFullData(2200, 350, 120, seed + 6),
      fan3: generateFullData(1400, 300, 100, seed + 7),
      timestamps: generateAllTimestamps(),
    };
  }, [tick]);
}

/* ==================== GRID (GRAPH PAPER) ==================== */
function GraphPaperGrid({ width, height }: { width: number; height: number }) {
  const cellW = 40; // SVG units
  const cellH = 19; // SVG units (76/4 = 19)
  const paths: string[] = [];
  // Horizontal lines
  for (let y = cellH; y < height; y += cellH) paths.push(`M0 ${y}H${width}`);
  // Vertical lines
  for (let x = cellW; x < width; x += cellW) paths.push(`M${x} 0V${height}`);
  return <>{paths.map((d, i) => <path key={i} d={d} stroke="#c8c6d2" strokeWidth="0.4" fill="none" opacity="0.5" />)}</>;
}

/* ==================== CHART TOOLTIP ==================== */
interface TooltipInfo { pct: number; yPct: number; time: string; values: { label: string; value: string; color: string }[] }

function ChartTooltip({ data, chartHeight }: { data: TooltipInfo | null; chartHeight: number }) {
  if (!data) return null;
  const tw = 168;
  const flipX = data.pct > 0.85;
  const leftStyle = flipX ? `calc(${data.pct * 100}% - ${tw + 12}px)` : `calc(${data.pct * 100}% + 12px)`;
  // Position tooltip vertically near cursor, clamped inside chart
  const topPx = Math.max(4, Math.min(chartHeight - 80, data.yPct * chartHeight - 40));
  return (
    <>
      {/* Vertical cursor line */}
      <div className="absolute top-0 bottom-0 pointer-events-none z-10" style={{ left: `${data.pct * 100}%`, width: 1 }}>
        <div className="size-full bg-[#77738c]/70" />
      </div>
      {/* Tooltip near cursor */}
      <div className="absolute pointer-events-none z-30" style={{ left: leftStyle, width: tw, top: topPx }}>
        <div className="bg-[#1a1a1a]/93 backdrop-blur-[12px] rounded-[12px] px-[12px] py-[9px] shadow-[0px_6px_24px_rgba(0,0,0,0.45)] border border-white/[0.08]">
          <p className="font-['Inter:Regular',sans-serif] font-normal text-[10px] text-[#8a8a8a] mb-[6px] tracking-[0.04em]">{data.time}</p>
          {data.values.map((v, i) => (
            <div key={i} className="flex items-center justify-between gap-[8px] py-[2px]">
              <div className="flex items-center gap-[6px]">
                <div className="size-[7px] rounded-full shrink-0" style={{ background: v.color, boxShadow: `0 0 5px ${v.color}55` }} />
                <p className="font-['Wix_Madefor_Display:Regular',sans-serif] font-normal text-[11px] text-[#c0c0c0]">{v.label}</p>
              </div>
              <p className="font-['Wix_Madefor_Display:Medium',sans-serif] font-medium text-[12px] text-white tabular-nums">{v.value}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ==================== GENERIC CHART ==================== */
interface ChartSeries { data: number[]; stroke: string; label: string }

function Chart({ title, series, yUnit, timeLabels, shadow, timestamps, period }: {
  title: string; series: ChartSeries[];
  yUnit: string; timeLabels: string[]; shadow: string; timestamps: Date[]; period: Period;
}) {
  const chartAreaRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);

  // Compute Y axis from actual data
  const allVals = series.flatMap(s => s.data);
  const yAxis = useMemo(() => niceYAxis(allVals, yUnit), [allVals.length, yUnit, allVals[0], allVals[allVals.length - 1]]);

  const W = 1600, H = 76;
  const paths = series.map(s => dataToSvgPath(s.data, W, H, yAxis.min, yAxis.max));

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = chartAreaRef.current;
    if (!el || !series.length) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const idx = Math.round(pct * (series[0].data.length - 1));
    const ts = timestamps[idx];
    if (!ts) return;
    const timeStr = period === "30D"
      ? `${ts.getDate().toString().padStart(2, "0")}.${(ts.getMonth() + 1).toString().padStart(2, "0")} ${ts.getHours().toString().padStart(2, "0")}:${ts.getMinutes().toString().padStart(2, "0")}`
      : `${ts.getHours().toString().padStart(2, "0")}:${ts.getMinutes().toString().padStart(2, "0")}:${ts.getSeconds().toString().padStart(2, "0")}`;
    const yPct = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setTooltip({
      pct,
      yPct,
      time: timeStr,
      values: series.map(s => ({ label: s.label, value: `${s.data[idx]?.toFixed(yUnit === "rpm" ? 0 : 1)} ${yUnit}`, color: s.stroke })),
    });
  }, [series, timestamps, period, yUnit]);

  return (
    <div className="backdrop-blur-[10px] bg-white content-stretch flex flex-col gap-[4px] items-center justify-center pb-[6px] relative rounded-[28px] shrink-0 w-full" style={{ boxShadow: shadow }}>
      <div className="content-stretch flex flex-col items-start justify-center pl-[45px] pr-[8px] pt-[12px] relative w-full">
        <p className="font-['Wix_Madefor_Display:Medium',sans-serif] font-medium leading-[normal] relative shrink-0 text-[20px] text-black text-center whitespace-nowrap">{title}</p>
      </div>
      <div className="relative shrink-0 w-full" style={{ height: 90, paddingLeft: 45, paddingRight: 15 }}>
        {/* Y-axis labels - positioned in left margin */}
        <div className="absolute left-0 top-0 bottom-[20px]" style={{ width: 44 }}>
          {yAxis.labels.map((l, idx) => (
            <div key={`${l.value}-${idx}`} className="absolute right-[2px] flex items-center gap-[2px]" style={{ top: `${l.pct}%`, transform: "translateY(-50%)" }}>
              <p className="font-['Wix_Madefor_Display:Medium',sans-serif] font-medium leading-[1] text-[#77738c] text-[9px] text-right whitespace-nowrap">{l.value}</p>
              <svg width="4" height="1" className="shrink-0"><path d="M0 0.5H4" stroke="#77738C" /></svg>
            </div>
          ))}
        </div>
        {/* Vertical axis line */}
        <div className="absolute left-[44px] top-0 bottom-[20px] w-0">
          <div className="absolute inset-[0_-0.5px]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 70"><path d="M0.5 70V0" stroke="#77738C" /></svg></div>
        </div>
        {/* Chart drawing area */}
        <div className="absolute top-0 bottom-[20px] left-[45px] right-[15px] cursor-crosshair" ref={chartAreaRef} onMouseMove={onMove} onMouseLeave={() => setTooltip(null)}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox={`0 0 ${W} ${H}`}>
            <GraphPaperGrid width={W} height={H} />
            {paths.map((d, i) => <path key={i} d={d} stroke={series[i].stroke} strokeWidth="1.8" fill="none" strokeLinejoin="round" />)}
          </svg>
          <ChartTooltip data={tooltip} chartHeight={70} />
        </div>
        {/* X-axis line */}
        <div className="absolute bottom-[20px] left-[45px] right-[15px] h-0">
          <div className="absolute inset-[-0.5px_0]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1600 1"><path d="M0 0.5H1600" stroke="#77738C" /></svg></div>
        </div>
        {/* Time labels */}
        <div className="absolute bottom-0 left-[45px] right-[15px] h-[18px]">
          <div className="flex items-start justify-between relative shrink-0 w-full px-[2px]">
            {timeLabels.map((l, i) => (
              <div key={`${l}-${i}`} className="inline-flex flex-col items-center relative shrink-0">
                <div className="w-0 relative" style={{ height: "3px" }}>
                  <div className="absolute inset-[0_-0.5px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 3"><path d="M0.5 3V0" stroke="#77738C" /></svg>
                  </div>
                </div>
                <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic text-[#77738c] text-[10px] text-center" style={{ marginTop: "2px" }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== EXPORT ICON ==================== */
function ExportIcon() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center overflow-clip relative shrink-0 size-[16px]">
      <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[16px]">
        <div className="absolute bottom-[37.5%] left-1/2 right-1/2 top-[12.5%]"><div className="absolute inset-[-6.25%_-0.5px]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 9"><path d="M0.5 8.5V0.5" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.89" /></svg></div></div>
        <div className="absolute inset-[62.5%_12.5%_12.5%_12.5%]"><div className="absolute inset-[-12.5%_-4.17%]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 5"><path d={svgPaths.p9cbc100} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.89" /></svg></div></div>
        <div className="absolute inset-[41.67%_29.17%_37.5%_29.17%]"><div className="absolute inset-[-15%_-7.5%]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.66667 4.33333"><path d={svgPaths.p37f14980} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.89" /></svg></div></div>
      </div>
    </div>
  );
}

/* ==================== TIME PERIOD BUTTONS ==================== */
function TimePeriodButtons({ active, setActive }: { active: Period; setActive: (p: Period) => void }) {
  const periods: Period[] = ["1H", "7H", "24H", "30D"];
  return (
    <div className="content-start flex flex-wrap items-start relative shrink-0 w-[1730px]">
      <div className="content-stretch flex gap-[25px] items-start relative shrink-0">
        <motion.div whileTap={{ scale: 0.93 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="bg-[#363535] content-stretch flex gap-[8px] h-[32px] items-center justify-center px-[12px] relative rounded-[16px] shrink-0 cursor-pointer">
          <div className="-translate-y-1/2 absolute bg-[rgba(255,255,255,0)] h-[32px] left-0 right-0 rounded-[16px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] top-1/2" />
          <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0">
            <div className="content-stretch flex flex-col items-start pr-[8px] relative shrink-0 size-[16px]"><ExportIcon /></div>
            <div className="flex flex-col font-['Wix_Madefor_Display:Regular',sans-serif] font-normal h-[12px] justify-center leading-[0] relative shrink-0 text-[12px] text-center text-white w-[38px]"><p className="leading-[16px]">Export</p></div>
          </div>
        </motion.div>
        <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
          {periods.map((p) => (
            <button key={p} onClick={() => setActive(p)}
              className={`backdrop-blur-[5px] content-stretch flex h-[32px] items-center justify-center px-[12px] relative rounded-[16px] shrink-0 cursor-pointer transition-colors duration-200 ${active === p ? "bg-[#353434]" : ""}`}
              style={active !== p ? { backgroundImage: "linear-gradient(131.107deg, rgba(240, 244, 246, 0.2) 135.28%, rgb(54, 53, 53) 173.76%)" } : undefined}>
              <div className="absolute bg-[rgba(255,255,255,0)] h-[32px] left-0 right-0 rounded-[16px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] top-0" />
              <div className={`flex flex-col font-['DM_Sans:9pt_Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[12px] text-center whitespace-nowrap ${active === p ? "text-white" : "text-[#16141f]"}`} style={{ fontVariationSettings: "'opsz' 9" }}>
                <p className="leading-[16px]">{p}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ==================== TIME SLIDER ==================== */
function TimeSlider({ value, max, onChange, timestamps, miniData }: {
  value: number; max: number; onChange: (v: number) => void; timestamps: Date[];
  miniData: { data: number[]; stroke: string }[];
}) {
  const startTs = timestamps[value];
  const endTs = timestamps[Math.min(value + VISIBLE_POINTS["30D"] - 1, timestamps.length - 1)];
  const fmt = (d: Date) => `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;

  const miniW = 1600, miniH = 28;
  let allMin = Infinity, allMax = -Infinity;
  for (const s of miniData) for (const v2 of s.data) { if (v2 < allMin) allMin = v2; if (v2 > allMax) allMax = v2; }
  const miniPaths = miniData.map(s => dataToSvgPath(s.data, miniW, miniH, allMin - (allMax - allMin) * 0.1, allMax + (allMax - allMin) * 0.1));

  // Use fixed full-range window indicator (always shows entire dataset range)
  const windowLeft = (value / TOTAL_POINTS) * 100;
  const windowWidth = (VISIBLE_POINTS["30D"] / TOTAL_POINTS) * 100;

  return (
    <div className="flex items-center gap-[10px] w-[1756px]">
      <p className="font-['Inter:Regular',sans-serif] font-normal text-[10px] text-[#bbb] w-[90px] text-right whitespace-nowrap">{startTs ? fmt(startTs) : ""}</p>
      <div className="flex-1 relative h-[32px] rounded-[6px] overflow-hidden bg-white/90 shadow-[0px_2px_8px_rgba(0,0,0,0.12)]">
        {/* Mini chart */}
        <svg className="absolute inset-0 block size-full" fill="none" preserveAspectRatio="none" viewBox={`0 0 ${miniW} ${miniH}`}>
          {miniPaths.map((d, i) => <path key={i} d={d} stroke={miniData[i].stroke} strokeWidth="1.2" fill="none" opacity="0.35" />)}
        </svg>
        {/* Dimmed areas outside window */}
        <div className="absolute top-0 bottom-0 left-0 bg-[#363535]/20 pointer-events-none" style={{ width: `${windowLeft}%` }} />
        <div className="absolute top-0 bottom-0 right-0 bg-[#363535]/20 pointer-events-none" style={{ width: `${Math.max(0, 100 - windowLeft - windowWidth)}%` }} />
        {/* Visible window border */}
        <div className="absolute top-0 bottom-0 border-x-2 border-[#363535]/50 pointer-events-none" style={{
          left: `${windowLeft}%`, width: `${windowWidth}%`,
        }} />
        {/* Range input */}
        <input
          type="range"
          min={0}
          max={Math.max(max, 1)}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute w-full h-full opacity-0 cursor-pointer z-10"
        />
      </div>
      <p className="font-['Inter:Regular',sans-serif] font-normal text-[10px] text-[#bbb] w-[90px] whitespace-nowrap">{endTs ? fmt(endTs) : ""}</p>
    </div>
  );
}

/* ==================== CHARTS SECTION ==================== */
function ChartsSection() {
  const [period, setPeriod] = useState<Period>("24H");
  const fullData = useChartData();

  const visiblePts = VISIBLE_POINTS[period];
  const maxOffset = TOTAL_POINTS - visiblePts;
  const [sliderOffset, setSliderOffset] = useState(maxOffset);

  // Reset slider to end when period changes
  useEffect(() => { setSliderOffset(TOTAL_POINTS - VISIBLE_POINTS[period]); }, [period]);

  const offset = Math.min(sliderOffset, maxOffset);
  const slice = <T,>(arr: T[]) => arr.slice(offset, offset + visiblePts);

  const temp1 = slice(fullData.temp1);
  const temp2 = slice(fullData.temp2);
  const temp3 = slice(fullData.temp3);
  const humidity = slice(fullData.humidity);
  const fan1 = slice(fullData.fan1);
  const fan2 = slice(fullData.fan2);
  const fan3 = slice(fullData.fan3);
  const ts = slice(fullData.timestamps);
  const tLabels = getVisibleLabels(ts, period);

  return (
    <div className="content-stretch flex flex-col gap-[8px] h-[579px] items-center pb-[5px] pt-[12px] relative rounded-[45px] shrink-0 w-full" style={{ backgroundImage: "linear-gradient(-75.6336deg, rgba(0, 0, 0, 0.31) 4.5812%, rgba(84, 146, 169, 0.23) 97.952%)" }}>
      <TimePeriodButtons active={period} setActive={setPeriod} />
      <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0">
        <div className="w-[1756px]">
          <Chart title="Температура" series={[
            { data: temp1, stroke: "#E44E85", label: "Датчик 1" },
            { data: temp2, stroke: "#FFF953", label: "Датчик 2" },
            { data: temp3, stroke: "#368CE2", label: "Датчик 3" },
          ]} yUnit="°C" timeLabels={tLabels} shadow="0px 8px 32px 0px rgba(118,80,81,0.51)" timestamps={ts} period={period} />
        </div>
        <div className="w-[1756px]">
          <Chart title="Влажность" series={[
            { data: humidity, stroke: "#00C3D0", label: "Влажность" },
          ]} yUnit="%" timeLabels={tLabels} shadow="0px 8px 32px 0px rgba(0,0,0,0.29)" timestamps={ts} period={period} />
        </div>
        <div className="w-[1756px]">
          <Chart title="Вентиляторы" series={[
            { data: fan1, stroke: "#FF8D28", label: "Вент. 1" },
            { data: fan2, stroke: "#FFD93D", label: "Вент. 2" },
            { data: fan3, stroke: "#6BCB77", label: "Вент. 3" },
          ]} yUnit="rpm" timeLabels={tLabels} shadow="0px 8px 32px 0px rgba(0,0,0,0.18)" timestamps={ts} period={period} />
        </div>
      </div>
      <TimeSlider value={offset} max={maxOffset} onChange={setSliderOffset} timestamps={fullData.timestamps}
        miniData={[
          { data: fullData.temp1, stroke: "#E44E85" },
          { data: fullData.humidity, stroke: "#00C3D0" },
          { data: fullData.fan1, stroke: "#FF8D28" },
        ]}
      />
    </div>
  );
}

/* ==================== STATUS CARD TABLE DATA ==================== */
const cardTableData: Record<string, Array<{ device: string; status: "норма" | "авария" }>> = {
  sensors: [
    { device: "Датчик температуры 1", status: "норма" },
    { device: "Датчик температуры 2", status: "норма" },
    { device: "Датчик влажности", status: "норма" },
    { device: "Датчик задымлённости", status: "авария" },
  ],
  power: [
    { device: "Основная линия", status: "норма" },
    { device: "ИБП", status: "норма" },
    { device: "Аккумулятор", status: "норма" },
    { device: "Резервная линия", status: "авария" },
  ],
  climate: [
    { device: "Кондиционер 1", status: "норма" },
    { device: "Кондиционер 2", status: "авария" },
    { device: "Вентиляция", status: "норма" },
    { device: "Обогреватель", status: "норма" },
  ],
  modbus: [
    { device: "Контроллер A", status: "норма" },
    { device: "Контроллер B", status: "норма" },
    { device: "Датчик давления", status: "норма" },
    { device: "Расходомер", status: "авария" },
  ],
};

function StatusTable({ data, isOpen }: { data: Array<{ device: string; status: "норма" | "авария" }>; isOpen: boolean }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: 10 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: 10 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="absolute left-0 right-0 bottom-full z-50 mb-[6px] overflow-hidden"
        >
          <div className="bg-white/95 backdrop-blur-[10px] rounded-[16px] shadow-[0px_8px_24px_rgba(0,0,0,0.25)] p-[12px]">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left font-['Wix_Madefor_Display:Medium',sans-serif] font-medium text-[11px] text-[#77738c] pb-[6px]">Устройство</th>
                  <th className="text-right font-['Wix_Madefor_Display:Medium',sans-serif] font-medium text-[11px] text-[#77738c] pb-[6px]">Состояние</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="border-t border-[#e5e5e5]">
                    <td className="font-['Wix_Madefor_Display:Regular',sans-serif] font-normal text-[12px] text-[#16141f] py-[5px]">{row.device}</td>
                    <td className={`text-right font-['Wix_Madefor_Display:Medium',sans-serif] font-medium text-[12px] py-[5px] ${row.status === "норма" ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                      {row.status.toUpperCase()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ==================== PRESS-AND-HOLD HOOK ==================== */
function usePressAndHold(cardKey: string, openCard: string | null, setOpenCard: (v: string | null) => void) {
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHolding = useRef(false);
  const pointerDownTime = useRef(0);

  const onPointerDown = useCallback(() => {
    pointerDownTime.current = Date.now();
    isHolding.current = false;
    holdTimer.current = setTimeout(() => {
      isHolding.current = true;
      setOpenCard(cardKey);
    }, 250);
  }, [cardKey, setOpenCard]);

  const onPointerUp = useCallback(() => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (isHolding.current) {
      setOpenCard(null);
      isHolding.current = false;
    } else {
      const elapsed = Date.now() - pointerDownTime.current;
      if (elapsed < 250) {
        setOpenCard(openCard === cardKey ? null : cardKey);
      }
    }
  }, [cardKey, openCard, setOpenCard]);

  const onPointerLeave = useCallback(() => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (isHolding.current) {
      setOpenCard(null);
      isHolding.current = false;
    }
  }, [setOpenCard]);

  return { onPointerDown, onPointerUp, onPointerLeave };
}

/* ==================== STATUS CARDS ==================== */
function SensorCard({ isOpen, cardKey, openCard, setOpenCard }: { isOpen: boolean; cardKey: string; openCard: string | null; setOpenCard: (v: string | null) => void }) {
  const press = usePressAndHold(cardKey, openCard, setOpenCard);
  return (
    <div className="relative">
      <motion.div whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}
        onPointerDown={press.onPointerDown} onPointerUp={press.onPointerUp} onPointerLeave={press.onPointerLeave}
        className="backdrop-blur-[10px] bg-[#f8f8f8] h-[155px] overflow-clip relative rounded-[28px] shadow-[6px_8px_6.8px_0px_rgba(4,5,3,0.38)] shrink-0 w-[312px] cursor-pointer select-none touch-none">
        <div className="absolute content-stretch flex flex-col gap-[15px] items-start left-[39px] top-[37px] w-[151px]">
          <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
            <div className="content-stretch flex flex-col items-center justify-center relative rounded-[28px] shrink-0">
              <div className="h-[27px] overflow-clip relative shrink-0 w-[26px]">
                <div className="absolute bottom-[41.67%] left-1/2 right-[33.33%] top-[41.67%]"><div className="absolute inset-[-19.44%_-20.19%]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6.08334 6.25"><path d={svgPaths.p14740c00} stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" /></svg></div></div>
                <div className="absolute inset-[16.66%_8.33%_20.83%_8.33%]"><div className="absolute inset-[-5.19%_-4.04%]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 23.4167 18.6257"><path d={svgPaths.p12f4b700} stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" /></svg></div></div>
              </div>
            </div>
            <div className="flex flex-col font-['Wix_Madefor_Display:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[18px] text-black whitespace-nowrap"><p className="leading-[28px]">ДАТЧИКИ</p></div>
          </div>
          <div className="flex flex-col font-['Wix_Madefor_Display:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[36px] text-black whitespace-nowrap pl-[5px]"><p className="leading-[32px]">НОРМА</p></div>
        </div>
        <div className="absolute flex h-[241px] items-center justify-center left-[137px] top-[-38px] w-[250.271px]">
          <div className="flex-none rotate-[32.23deg]"><div className="h-[163.267px] relative w-[192.925px]"><div className="absolute inset-[0_1.25%_4.95%_1.25%]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 188.088 155.183"><g filter="url(#filter_star)"><path d={svgPaths.p609ad00} fill="#CCFF6E" /></g><defs><filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="159.183" id="filter_star" width="188.088" x="0" y="0"><feFlood floodOpacity="0" result="BackgroundImageFix" /><feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" /><feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" /><feOffset dy="4" /><feGaussianBlur stdDeviation="12.85" /><feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" /><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" /><feBlend in2="shape" mode="normal" result="effect1" /></filter></defs></svg></div></div></div>
        </div>
        <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_-11px_-10px_21.8px_0px_rgba(49,49,49,0.27)]" />
      </motion.div>
      <StatusTable data={cardTableData.sensors} isOpen={isOpen} />
    </div>
  );
}

function PowerCard({ isOpen, cardKey, openCard, setOpenCard }: { isOpen: boolean; cardKey: string; openCard: string | null; setOpenCard: (v: string | null) => void }) {
  const press = usePressAndHold(cardKey, openCard, setOpenCard);
  return (
    <div className="relative">
      <motion.div whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}
        onPointerDown={press.onPointerDown} onPointerUp={press.onPointerUp} onPointerLeave={press.onPointerLeave}
        className="backdrop-blur-[10px] bg-[#f8f8f8] h-[155px] overflow-clip relative rounded-[28px] shadow-[6px_8px_6.8px_0px_rgba(0,0,0,0.37)] shrink-0 w-[312px] cursor-pointer select-none touch-none">
        <div className="absolute content-stretch flex flex-col gap-[15px] items-start left-[33px] top-[40px] w-[124px]">
          <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
            <div className="h-[26.674px] relative shrink-0 w-[24.009px]"><div className="absolute inset-[-3.28%_-3.64%]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25.7591 28.4236"><path d={svgPaths.p4b51000} stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" /></svg></div></div>
            <div className="flex flex-col font-['Wix_Madefor_Display:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[18px] text-black whitespace-nowrap"><p className="leading-[28px]">ПИТАНИЕ</p></div>
          </div>
          <div className="flex flex-col font-['Wix_Madefor_Display:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[36px] text-black w-[94px] pl-[5px]"><p className="leading-[32px]">220V</p></div>
        </div>
        <div className="absolute inset-[3.87%_-5.49%_-2.58%_60.58%]"><svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 140.136 153"><g filter="url(#filter_lightning)"><path d={svgPaths.p1ba5a670} fill="#D4F970" /></g><defs><filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="157" id="filter_lightning" width="140.136" x="0" y="0"><feFlood floodOpacity="0" result="BackgroundImageFix" /><feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" /><feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" /><feOffset dy="4" /><feGaussianBlur stdDeviation="12.65" /><feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" /><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" /><feBlend in2="shape" mode="normal" result="effect1" /></filter></defs></svg></div>
        <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_-11px_-10px_21px_0px_rgba(0,0,0,0.25)]" />
      </motion.div>
      <StatusTable data={cardTableData.power} isOpen={isOpen} />
    </div>
  );
}

function ClimateCard({ isOpen, cardKey, openCard, setOpenCard }: { isOpen: boolean; cardKey: string; openCard: string | null; setOpenCard: (v: string | null) => void }) {
  const press = usePressAndHold(cardKey, openCard, setOpenCard);
  return (
    <div className="relative">
      <motion.div whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}
        onPointerDown={press.onPointerDown} onPointerUp={press.onPointerUp} onPointerLeave={press.onPointerLeave}
        className="backdrop-blur-[10px] bg-[#f8f8f8] h-[155px] overflow-clip relative rounded-[28px] shadow-[6px_8px_6.8px_0px_rgba(0,0,0,0.37)] shrink-0 w-[312px] cursor-pointer select-none touch-none">
        <div className="absolute content-stretch flex flex-col gap-[15px] items-start left-[35px] top-[38px] w-[170px]">
          <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
            <div className="overflow-clip relative shrink-0 size-[32px]">
              <div className="absolute inset-[66.67%_33.33%_16.67%_8.33%]"><div className="absolute inset-[-16.41%_-4.69%]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20.4167 7.08333"><path d={svgPaths.p1ed53017} stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" /></svg></div></div>
              <div className="absolute bottom-1/2 left-[8.33%] right-[8.33%] top-[29.17%]"><div className="absolute inset-[-13.13%_-3.28%]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28.4167 8.41667"><path d={svgPaths.p2c627840} stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" /></svg></div></div>
              <div className="absolute inset-[16.67%_45.83%_66.67%_8.33%]"><div className="absolute inset-[-16.41%_-5.97%]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.4167 7.08333"><path d={svgPaths.p3d7fe6e0} stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" /></svg></div></div>
            </div>
            <div className="flex flex-col font-['Wix_Madefor_Display:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[18px] text-black whitespace-nowrap"><p className="leading-[28px]">КЛИМАТИКА</p></div>
          </div>
          <div className="flex flex-col font-['Wix_Madefor_Display:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[36px] text-black w-full pl-[5px]"><p className="leading-[32px]">НОРМА</p></div>
        </div>
        <div className="absolute left-[205px] size-[126px] top-[12px]"><svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 126 126"><g filter="url(#filter_climate)"><path d={svgPaths.p253b7500} fill="#900500" /><path d={svgPaths.p19034800} fill="#900500" /><path d={svgPaths.p12192640} fill="#900500" /><path d={svgPaths.pc326100} fill="#900500" /><path d={svgPaths.pa897580} fill="#900500" /><path d={svgPaths.p2be82480} fill="#900500" /></g><defs><filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="130" id="filter_climate" width="126" x="0" y="0"><feFlood floodOpacity="0" result="BackgroundImageFix" /><feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" /><feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" /><feOffset dy="4" /><feGaussianBlur stdDeviation="5.3" /><feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" /><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" /><feBlend in2="shape" mode="normal" result="effect1" /></filter></defs></svg></div>
        <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_-11px_-10px_21px_0px_rgba(0,0,0,0.25)]" />
      </motion.div>
      <StatusTable data={cardTableData.climate} isOpen={isOpen} />
    </div>
  );
}

function ModbusCard({ isOpen, cardKey, openCard, setOpenCard }: { isOpen: boolean; cardKey: string; openCard: string | null; setOpenCard: (v: string | null) => void }) {
  const press = usePressAndHold(cardKey, openCard, setOpenCard);
  return (
    <div className="relative">
      <motion.div whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}
        onPointerDown={press.onPointerDown} onPointerUp={press.onPointerUp} onPointerLeave={press.onPointerLeave}
        className="backdrop-blur-[10px] bg-[#f8f8f8] h-[155px] overflow-clip relative rounded-[28px] shadow-[6px_8px_6.8px_0px_rgba(0,0,0,0.37)] shrink-0 w-[312px] cursor-pointer select-none touch-none">
        <div className="absolute content-stretch flex flex-col gap-[15px] items-start left-[45px] top-[37px] w-[170px]">
          <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
            <div className="h-[24px] overflow-clip relative shrink-0 w-[27px]">
              <div className="absolute inset-[66.67%_8.33%_8.33%_66.67%]"><div className="absolute inset-[-14.58%_-12.96%]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.5 7.75"><path d={svgPaths.p33b56280} stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" /></svg></div></div>
              <div className="absolute inset-[66.67%_66.67%_8.33%_8.33%]"><div className="absolute inset-[-14.58%_-12.96%]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.5 7.75"><path d={svgPaths.p33b56280} stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" /></svg></div></div>
              <div className="absolute inset-[8.33%_37.5%_66.67%_37.5%]"><div className="absolute inset-[-14.58%_-12.96%]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.5 7.75"><path d={svgPaths.p33b56280} stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" /></svg></div></div>
              <div className="absolute bottom-[33.33%] left-[20.83%] right-[20.83%] top-1/2"><div className="absolute inset-[-21.88%_-5.56%]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.5 5.75"><path d={svgPaths.p3101980} stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" /></svg></div></div>
              <div className="absolute bottom-1/2 left-1/2 right-1/2 top-[33.33%]"><div className="absolute inset-[-21.88%_-0.88px]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.75 5.75"><path d="M0.875 4.875V0.875" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" /></svg></div></div>
            </div>
            <div className="flex flex-col font-['Wix_Madefor_Display:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[18px] text-black whitespace-nowrap"><p className="leading-[28px]">MODBUS</p></div>
          </div>
          <div className="flex flex-col font-['Wix_Madefor_Display:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[36px] text-black w-full pl-[5px]"><p className="leading-[32px]">НОРМА</p></div>
        </div>
        <div className="absolute flex h-[188.77px] items-center justify-center left-[156px] top-[-30.48px] w-[205.088px]">
          <div className="flex-none rotate-[-163.56deg]"><div className="h-[146.469px] relative w-[170.607px]"><svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 170.607 146.469"><g filter="url(#filter_modbus)"><path d={svgPaths.p30ba0200} fill="#D4F970" /></g><defs><filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="150.469" id="filter_modbus" width="170.607" x="0" y="0"><feFlood floodOpacity="0" result="BackgroundImageFix" /><feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" /><feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" /><feOffset dy="4" /><feGaussianBlur stdDeviation="14.3" /><feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" /><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" /><feBlend in2="shape" mode="normal" result="effect1" /></filter></defs></svg></div></div>
        </div>
        <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_-11px_-10px_21px_0px_rgba(0,0,0,0.25)]" />
      </motion.div>
      <StatusTable data={cardTableData.modbus} isOpen={isOpen} />
    </div>
  );
}

function StatusCardsGrid() {
  const [openCard, setOpenCard] = useState<string | null>(null);
  return (
    <div className="content-center flex flex-wrap gap-[30px_35px] h-[392px] items-center justify-center pl-[17px] pr-[20px] py-[20px] relative rounded-[38px] shrink-0 w-[724px]" style={{ backgroundImage: "linear-gradient(125.098deg, rgba(181, 215, 224, 0.43) 3.248%, rgba(0, 0, 0, 0.43) 92.293%)" }}>
      <SensorCard isOpen={openCard === "sensors"} cardKey="sensors" openCard={openCard} setOpenCard={setOpenCard} />
      <PowerCard isOpen={openCard === "power"} cardKey="power" openCard={openCard} setOpenCard={setOpenCard} />
      <ClimateCard isOpen={openCard === "climate"} cardKey="climate" openCard={openCard} setOpenCard={setOpenCard} />
      <ModbusCard isOpen={openCard === "modbus"} cardKey="modbus" openCard={openCard} setOpenCard={setOpenCard} />
    </div>
  );
}

/* ==================== DOOR + HARDWARE ==================== */
function DoorAndHardware() {
  return (
    <div className="bg-[rgba(54,53,53,0.84)] content-stretch flex flex-col gap-[24px] h-[392px] items-center justify-center px-[30px] py-[20px] relative rounded-[38px] shrink-0">
      <div className="backdrop-blur-[10px] h-[127px] overflow-clip relative rounded-[28px] shadow-[6px_19px_21.3px_0px_rgba(0,0,0,0.37)] shrink-0 w-[308px]" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\"0 0 308 127\" xmlns=\"http://www.w3.org/2000/svg\" preserveAspectRatio=\"none\"><rect x=\"0\" y=\"0\" height=\"100%\" width=\"100%\" fill=\"url(%23grad)\" opacity=\"1\"/><defs><radialGradient id=\"grad\" gradientUnits=\"userSpaceOnUse\" cx=\"0\" cy=\"0\" r=\"10\" gradientTransform=\"matrix(0.4338 -9.2997 18.595 0.49511 108.45 99.961)\"><stop stop-color=\"rgba(85,85,83,1)\" offset=\"0\"/><stop stop-color=\"rgba(112,128,75,1)\" offset=\"0.25\"/><stop stop-color=\"rgba(140,170,67,1)\" offset=\"0.5\"/><stop stop-color=\"rgba(167,213,59,1)\" offset=\"0.75\"/><stop stop-color=\"rgba(194,255,51,1)\" offset=\"1\"/></radialGradient></defs></svg>')" }}>
        <div className="absolute content-stretch flex flex-col gap-[8px] items-start left-[30px] top-[30px] w-[247.77px]">
          <div className="content-stretch flex gap-[6px] items-start relative shrink-0">
            <div className="h-[26px] overflow-clip relative shrink-0 w-[28px]">
              <div className="absolute inset-[10.68%_20.83%_9.51%_45.83%]"><div className="absolute inset-[-4.22%_-9.37%_-4.22%_-9.38%]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.0833 22.5028"><path d={svgPaths.p264ba580} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" /></svg></div></div>
              <div className="absolute bottom-[16.67%] left-1/4 right-[54.17%] top-[16.67%]"><div className="absolute inset-[-5.05%_-15%]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.58333 19.0833"><path d={svgPaths.pb31eb00} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" /></svg></div></div>
              <div className="absolute bottom-1/2 left-[58.33%] right-[41.63%] top-1/2"><div className="absolute inset-[-0.88px_-7499.83%]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.76167 1.75"><path d="M0.875 0.875H0.886667" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" /></svg></div></div>
            </div>
            <div className="flex flex-col font-['Wix_Madefor_Display:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[18px] text-white whitespace-nowrap"><p className="leading-[28px]">ДВЕРЬ</p></div>
          </div>
          <div className="flex flex-col font-['Wix_Madefor_Display:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[36px] text-white whitespace-nowrap"><p className="leading-[32px]">ОТКРЫТО</p></div>
        </div>
      </div>
      <div className="backdrop-blur-[10px] bg-[#c2ff33] content-stretch flex flex-col h-[195px] items-center px-[9px] py-[18px] relative rounded-[28px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.08)] shrink-0 w-[308px]">
        <div className="h-[129px] relative shrink-0 w-full">
          <div className="absolute bg-[#555552] blur-[5.65px] h-[134px] left-0 rounded-[21px] top-[35px] w-[290px]" />
          <div className="absolute content-stretch flex flex-col gap-[63px] items-center left-[32px] top-0 w-[226px]">
            <div className="flex flex-col font-['Wix_Madefor_Display:Medium',sans-serif] font-medium h-[16px] justify-center leading-[0] relative shrink-0 text-[#363535] text-[18px] text-center w-[162px]"><p className="leading-[28px]">HARDWARE TEMP</p></div>
            <div className="h-[63px] relative shrink-0 w-full"><div className="flex flex-row items-center justify-center size-full"><div className="content-stretch flex gap-[38px] items-center justify-center relative size-full">
              <div className="content-stretch flex flex-col items-start relative shrink-0">
                <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[40px] text-white whitespace-nowrap"><p className="leading-[48px]">38°</p></div>
                <div className="flex flex-col font-['Wix_Madefor_Display:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#bcbcbc] text-[12px] whitespace-nowrap"><p className="leading-[16px]">MAIN BOARD</p></div>
              </div>
              <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-[71px]">
                <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[40px] text-white whitespace-nowrap"><p className="leading-[48px]">42°</p></div>
                <div className="flex flex-col font-['Wix_Madefor_Display:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#bcbcbc] text-[12px] whitespace-nowrap"><p className="leading-[16px]">CPU/CORE</p></div>
              </div>
            </div></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== EVENT LOG ==================== */
const initialEvents = [
  { id: 1, msg: "System startup completed", time: "14:32:15", type: "info" as const },
  { id: 2, msg: "System startup completed", time: "14:32:15", type: "info" as const },
  { id: 3, msg: "High humidity detected", time: "14:15:42", type: "warning" as const },
  { id: 4, msg: "High humidity detected", time: "14:15:42", type: "error" as const },
];

const newEventTemplates = [
  { msg: "Temperature threshold exceeded", type: "warning" as const },
  { msg: "Door access granted", type: "info" as const },
  { msg: "Fan speed adjusted to 2400 rpm", type: "info" as const },
  { msg: "Power fluctuation detected", type: "error" as const },
  { msg: "Sensor recalibrated", type: "info" as const },
  { msg: "Network latency spike", type: "warning" as const },
  { msg: "MODBUS connection restored", type: "info" as const },
  { msg: "Battery backup activated", type: "error" as const },
];

function EventIcon({ type }: { type: string }) {
  const color = type === "info" ? "#2B36FF" : type === "warning" ? "#FAA938" : "#FF0000";
  if (type === "info") {
    return (
      <div className="content-stretch flex flex-col h-[22px] items-start pt-[2px] relative shrink-0 w-[20px]">
        <div className="overflow-clip relative shrink-0 size-[20px]">
          <div className="absolute inset-[8.33%]"><div className="absolute inset-[-3.75%]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.9167 17.9167"><path d={svgPaths.p27e18380} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" /></svg></div></div>
          <div className="absolute bottom-[33.33%] left-1/2 right-1/2 top-1/2"><div className="absolute inset-[-18.75%_-0.63px]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.25 4.58333"><path d="M0.625 3.95833V0.625" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" /></svg></div></div>
          <div className="absolute bottom-[66.67%] left-1/2 right-[49.96%] top-[33.33%]"><div className="absolute inset-[-0.63px_-0.62px_-0.63px_-0.63px]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.25833 1.25"><path d="M0.625 0.625H0.633334" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" /></svg></div></div>
        </div>
      </div>
    );
  }
  return (
    <div className="content-stretch flex flex-col h-[22px] items-start pt-[2px] relative shrink-0 w-[20px]">
      <div className="overflow-clip relative shrink-0 size-[20px]">
        <div className="absolute inset-[12.44%_8.34%_12.5%_8.26%]"><div className="absolute inset-[-4.16%_-3.75%]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.93 16.2616"><path d={svgPaths.p15c6adc0} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" /></svg></div></div>
        <div className="absolute bottom-[45.83%] left-1/2 right-1/2 top-[37.5%]"><div className="absolute inset-[-18.75%_-0.63px]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.25 4.58333"><path d="M0.625 0.625V3.95833" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" /></svg></div></div>
        <div className="absolute bottom-[29.17%] left-1/2 right-[49.96%] top-[70.83%]"><div className="absolute inset-[-0.63px_-0.62px_-0.63px_-0.63px]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.25833 1.25"><path d="M0.625 0.625H0.633334" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" /></svg></div></div>
      </div>
    </div>
  );
}

function EventLog() {
  const [events, setEvents] = useState(initialEvents);

  useEffect(() => {
    const interval = setInterval(() => {
      const template = newEventTemplates[Math.floor(Math.random() * newEventTemplates.length)];
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
      setEvents((prev) => [{ id: Date.now(), msg: template.msg, time, type: template.type }, ...prev].slice(0, 8));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const styles: Record<string, { bg: string; border: string }> = {
    info: { bg: "bg-[#f0f8ff]", border: "border-[#2b36ff]" },
    warning: { bg: "bg-[#fff8ef]", border: "border-[#ff990b]" },
    error: { bg: "bg-[#ffebeb]", border: "border-[red]" },
  };

  return (
    <div className="backdrop-blur-[10px] content-stretch flex flex-col gap-[15px] h-[392px] items-center pb-[24px] pt-[14px] px-[24px] relative rounded-[28px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.08)] shrink-0 w-[712px]" style={{ backgroundImage: "linear-gradient(-70.6913deg, rgba(101, 135, 136, 0.396) 7.6427%, rgba(59, 59, 59, 0.67) 73.853%)" }}>
      <div className="relative shrink-0 w-full">
        <div className="content-stretch flex items-center relative w-full">
          <div className="bg-[#363535] content-stretch flex gap-[4px] items-center px-[5px] relative rounded-[18px] shrink-0 w-[250px]">
            <div className="content-stretch flex items-start p-[8px] relative rounded-[10px] shrink-0 size-[36px]">
              <div className="overflow-clip relative shrink-0 size-[20px]"><div className="absolute inset-[8.33%]"><div className="absolute inset-[-5%]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.3333 18.3333"><path d={svgPaths.p2220ad80} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" /></svg></div></div></div>
            </div>
            <div className="flex flex-col font-['Wix_Madefor_Display:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[18px] text-white w-[200px]"><p className="leading-[28px]">ЖУРНАЛ СОБЫТИЙ</p></div>
          </div>
        </div>
      </div>
      <div className="bg-white h-[301px] max-h-[400px] relative rounded-[31px] shrink-0 w-full overflow-hidden">
        <div className="flex flex-col items-center justify-start max-h-full overflow-auto size-full py-[12px]">
          <div className="content-stretch flex flex-col gap-[12px] items-center pr-[8px] relative w-full px-[12px]">
            <AnimatePresence initial={false}>
              {events.map((ev) => {
                const s = styles[ev.type];
                return (
                  <motion.div key={ev.id}
                    initial={{ opacity: 0, y: -20, scaleY: 0.8 }}
                    animate={{ opacity: 1, y: 0, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    className={`${s.bg} content-stretch flex gap-[12px] h-[59px] items-center p-[12px] relative rounded-[20px] shrink-0 w-[613px]`}>
                    <div aria-hidden="true" className={`absolute ${s.border} border border-solid inset-0 pointer-events-none rounded-[20px]`} />
                    <EventIcon type={ev.type} />
                    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-h-px min-w-px relative">
                      <div className="flex flex-col font-['Wix_Madefor_Display:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#16141f] text-[14px] w-full"><p className="leading-[20px]">{ev.msg}</p></div>
                      <div className="flex flex-col font-['Wix_Madefor_Display:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#77738c] text-[12px] w-full"><p className="leading-[16px]">{ev.time}</p></div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== HEADER ==================== */
function Logo() {
  return (
    <div className="flex h-[48px] items-center justify-center relative shrink-0 w-[205px]">
      <div className="flex-none rotate-90">
        <div className="h-[205px] relative w-[48px]">
          <div className="absolute flex inset-[0_25.68%_0_26.11%] items-center justify-center">
            <div className="-rotate-90 flex-none h-[23.139px] w-[205px]">
              <div className="relative size-full"><div className="absolute inset-[0.88%_0_1.62%_0]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 205 22.5608"><g><path d={svgPaths.p3e626280} fill="black" /><path d={svgPaths.p37094d00} fill="black" /><path d={svgPaths.p2699ee00} fill="black" /><path clipRule="evenodd" d={svgPaths.p3b5f2580} fill="black" fillRule="evenodd" /><path d={svgPaths.p228bd600} fill="black" /><path d={svgPaths.pffcf980} fill="black" /></g></svg></div></div>
            </div>
          </div>
          <div className="absolute flex inset-[31.12%_-0.44%_42.84%_-0.75%] items-center justify-center">
            <div className="flex-none h-[38.523px] rotate-[-72.58deg] skew-x-[-3.13deg] w-[41.763px]">
              <div className="relative size-full"><div className="absolute inset-[-0.65%_0_0_0]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 41.7627 38.7737"><g><g><path d={svgPaths.p1622ab00} fill="black" stroke="black" /><path d={svgPaths.p35fbcd80} fill="black" stroke="black" /><path d={svgPaths.p27967700} fill="black" stroke="black" /><path d={svgPaths.p11134c00} fill="black" stroke="black" /><path d={svgPaths.p107f3f80} fill="black" stroke="black" /></g><ellipse cx="2.58698" cy="2.5515" fill="black" rx="2.58698" ry="2.5515" transform="matrix(0.999959 -0.00905923 -0.0121755 0.999926 18.0789 15.2187)" /></g></svg></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InteractiveNav({ activeNav, setActiveNav }: { activeNav: string; setActiveNav: (v: string) => void }) {
  const tabs = ["Dashboard", "Users", "Network", "System"];
  return (
    <div className="backdrop-blur-[10px] bg-[#363535] content-stretch flex gap-[8px] items-start p-[8px] relative rounded-[28px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.08)]">
      {tabs.map((tab) => (
        <button key={tab} onClick={() => setActiveNav(tab)}
          className="content-stretch flex h-[36px] items-center justify-center px-[16px] py-[8px] relative rounded-[16px] shrink-0 cursor-pointer">
          {activeNav === tab && (
            <motion.div layoutId="navPill" className="absolute inset-0 bg-[#daff33] rounded-[16px]"
              transition={{ type: "spring", stiffness: 500, damping: 35 }} />
          )}
          <div className="absolute bg-[rgba(255,255,255,0)] h-[36px] left-0 right-0 rounded-[16px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] top-0" />
          <div className={`flex flex-col font-['Wix_Madefor_Display:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[14px] text-center whitespace-nowrap z-[1] ${activeNav === tab ? "text-black" : "text-white"}`}>
            <p className="leading-[20px]">{tab}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

function InteractiveLangSwitch({ activeLang, setActiveLang }: { activeLang: string; setActiveLang: (v: string) => void }) {
  const langs = ["RU", "EN"];
  return (
    <div className="backdrop-blur-[10px] bg-[#363535] content-stretch flex gap-[4px] items-start p-[4px] relative rounded-[28px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.08)]">
      {langs.map((lang) => (
        <button key={lang} onClick={() => setActiveLang(lang)}
          className="content-stretch flex h-[32px] items-center justify-center px-[12px] relative rounded-[16px] shrink-0 cursor-pointer">
          {activeLang === lang && (
            <motion.div layoutId="langPill" className="absolute inset-0 bg-[#daff33] rounded-[16px]"
              transition={{ type: "spring", stiffness: 500, damping: 35 }} />
          )}
          <div className="absolute bg-[rgba(255,255,255,0)] h-[32px] left-0 right-0 rounded-[16px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] top-0" />
          <div className={`flex flex-col font-['Wix_Madefor_Display:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[12px] text-center whitespace-nowrap z-[1] ${activeLang === lang ? "text-black" : "text-white"}`}>
            <p className="leading-[16px]">{lang}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

function LogoutButton() {
  return (
    <motion.div whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="bg-[#363535] content-stretch flex gap-[8px] h-[32px] items-center justify-center px-[12px] relative rounded-[16px] shrink-0 cursor-pointer">
      <div className="-translate-y-1/2 absolute bg-[rgba(255,255,255,0)] h-[32px] left-0 right-0 rounded-[16px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.17),0px_4px_6px_-4px_rgba(0,0,0,0.1)] top-1/2" />
      <div className="content-stretch flex flex-col items-start pr-[8px] relative shrink-0 size-[16px]">
        <div className="content-stretch flex flex-col items-center justify-center overflow-clip relative shrink-0 size-[16px]">
          <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[16px]">
            <div className="absolute inset-[29.17%_12.5%_29.17%_66.67%]"><div className="absolute inset-[-7.5%_-15%]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4.33333 7.66667"><path d={svgPaths.p24890c80} stroke="white" strokeLinecap="round" strokeLinejoin="round" /></svg></div></div>
            <div className="absolute bottom-1/2 left-[37.5%] right-[12.5%] top-1/2"><div className="absolute inset-[-0.5px_-6.25%]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9 1"><path d="M8.5 0.5H0.5" stroke="white" strokeLinecap="round" strokeLinejoin="round" /></svg></div></div>
            <div className="absolute inset-[12.5%_62.5%_12.5%_12.5%]"><div className="absolute inset-[-4.17%_-12.5%]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 13"><path d={svgPaths.p29761480} stroke="white" strokeLinecap="round" strokeLinejoin="round" /></svg></div></div>
          </div>
        </div>
      </div>
      <div className="flex flex-col font-['DM_Sans:9pt_Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[12px] text-center text-white whitespace-nowrap" style={{ fontVariationSettings: "'opsz' 9" }}>
        <p className="leading-[16px]">Logout</p>
      </div>
    </motion.div>
  );
}

/* ==================== MAIN DASHBOARD ==================== */
export default function Dashboard() {
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [activeLang, setActiveLang] = useState("RU");

  return (
    <div className="content-stretch flex flex-col items-start relative w-[1920px] h-[1080px]">
      <div className="content-stretch flex flex-col h-[1080px] items-start relative shrink-0 w-full">
        <div className="h-[1080px] relative shrink-0 w-full" style={{
          backgroundImage: `
            linear-gradient(148.105deg, rgba(255, 255, 255, 0) 62.023%, rgba(4, 4, 4, 0.2) 92.058%),
            linear-gradient(203.01deg, rgba(255, 255, 255, 0) 41.018%, rgba(226, 255, 65, 0.2) 77.605%),
            url('data:image/svg+xml;utf8,<svg viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"><rect x="0" y="0" height="100%" width="100%" fill="url(%23grad)" opacity="0.2"/><defs><radialGradient id="grad" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="10" gradientTransform="matrix(-31.15 104.58 -57.533 -7.7113 1271.5 34.211)"><stop stop-color="rgba(255,252,153,1)" offset="0"/><stop stop-color="rgba(255,253,204,1)" offset="0.5"/><stop stop-color="rgba(255,255,255,1)" offset="1"/></radialGradient></defs></svg>'),
            url('data:image/svg+xml;utf8,<svg viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"><rect x="0" y="0" height="100%" width="100%" fill="url(%23grad)" opacity="1"/><defs><radialGradient id="grad" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="10" gradientTransform="matrix(29.6 130.27 -70.682 7.2269 664 -222.71)"><stop stop-color="rgba(255,215,215,1)" offset="0"/><stop stop-color="rgba(255,255,255,1)" offset="1"/></radialGradient></defs></svg>')
          `
        }}>
          <div className="content-stretch flex flex-col items-start pb-[32px] pt-[80px] px-[32px] relative size-full">
            <div className="content-stretch flex flex-col gap-[9px] h-[1000px] items-start max-w-[1920px] relative shrink-0 w-full">
              <div className="content-stretch flex flex-col h-[579px] items-center relative shrink-0 w-full">
                <ChartsSection />
              </div>
              <div className="content-stretch flex gap-[27px] h-[396px] items-center justify-center relative rounded-[45px] shrink-0 w-[1856px]">
                <div className="content-stretch flex gap-[27px] items-center relative rounded-[38px] shrink-0">
                  <StatusCardsGrid />
                  <DoorAndHardware />
                </div>
                <EventLog />
              </div>
            </div>
          </div>
        </div>
        {/* Header */}
        <div className="absolute content-stretch flex flex-col h-[88px] items-start justify-center left-0 px-[32px] right-0 top-0 z-10">
          <div className="content-stretch flex gap-[493px] items-center justify-center pr-[0.02px] relative w-full">
            <Logo />
            <InteractiveNav activeNav={activeNav} setActiveNav={setActiveNav} />
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0">
              <InteractiveLangSwitch activeLang={activeLang} setActiveLang={setActiveLang} />
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
