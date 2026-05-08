/* Charts section — large per-chart, brush-style range selector */
const { useState: csUseState, useEffect: csUseEffect, useMemo: csUseMemo, useRef: csUseRef, useCallback: csUseCallback } = React;
const { motion: csMotion } = window.Motion;
const { TOTAL_POINTS: cs_TP, VISIBLE_POINTS: cs_VP, dataToSvgPath: cs_path, getVisibleLabels: cs_lbls, niceYAxis: cs_ny, useChartData: cs_use } = window.SurdisData;

/* Graph paper grid */
function GridLines({ width, height }) {
  const cellW = 40, cellH = height / 10;
  const lines = [];
  for (let y = cellH; y < height; y += cellH) lines.push(<path key={`h${y}`} d={`M0 ${y}H${width}`} stroke="#5a5856" strokeWidth="0.4" opacity="0.45" />);
  for (let x = cellW; x < width; x += cellW) lines.push(<path key={`v${x}`} d={`M${x} 0V${height}`} stroke="#5a5856" strokeWidth="0.4" opacity="0.45" />);
  return <>{lines}</>;
}

/* Tooltip */
function Tooltip({ data, chartHeight }) {
  if (!data) return null;
  const tw = 200;
  const flipX = data.pct > 0.85;
  const leftStyle = flipX ? `calc(${data.pct * 100}% - ${tw + 12}px)` : `calc(${data.pct * 100}% + 12px)`;
  const topPx = Math.max(8, Math.min(chartHeight - 110, data.yPct * chartHeight - 50));
  return (
    <>
      <div className="absolute top-0 bottom-0 pointer-events-none z-10" style={{ left: `${data.pct * 100}%`, width: 1 }}>
        <div className="size-full bg-[#77738c]/70" />
      </div>
      <div className="absolute pointer-events-none z-30" style={{ left: leftStyle, width: tw, top: topPx }}>
        <div className="bg-[#1a1a1a]/95 backdrop-blur-[12px] rounded-[12px] px-[14px] py-[10px] shadow-[0px_8px_24px_rgba(0,0,0,0.5)] border border-white/[0.08]">
          <p className="font-['Inter'] font-normal text-[12px] text-[#8a8a8a] mb-[8px] tracking-[0.04em]">{data.time}</p>
          {data.values.map((v, i) => (
            <div key={i} className="flex items-center justify-between gap-[10px] py-[3px]">
              <div className="flex items-center gap-[8px]">
                <div className="size-[8px] rounded-full shrink-0" style={{ background: v.color, boxShadow: `0 0 6px ${v.color}66` }} />
                <p className="font-['Wix_Madefor_Display'] text-[13px] text-[#c0c0c0]">{v.label}</p>
              </div>
              <p className="font-['Wix_Madefor_Display'] font-medium text-[14px] text-white tabular-nums">{v.value}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* Single chart */
function Chart({ title, series, yUnit, timeLabels, timestamps, period, height = 260 }) {
  const ref = csUseRef(null);
  const [tooltip, setTooltip] = csUseState(null);
  const allVals = series.flatMap(s => s.data);
  const yAxis = csUseMemo(() => cs_ny(allVals, yUnit), [allVals.length, yUnit, allVals[0], allVals[allVals.length - 1]]);
  const W = 1700, H = 240;
  const paths = series.map(s => cs_path(s.data, W, H, yAxis.min, yAxis.max));

  const onMove = csUseCallback((e) => {
    const el = ref.current; if (!el || !series.length) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const idx = Math.round(pct * (series[0].data.length - 1));
    const ts = timestamps[idx]; if (!ts) return;
    const timeStr = period === "30D"
      ? `${ts.getDate().toString().padStart(2, "0")}.${(ts.getMonth() + 1).toString().padStart(2, "0")} ${ts.getHours().toString().padStart(2, "0")}:${ts.getMinutes().toString().padStart(2, "0")}`
      : `${ts.getHours().toString().padStart(2, "0")}:${ts.getMinutes().toString().padStart(2, "0")}:${ts.getSeconds().toString().padStart(2, "0")}`;
    const yPct = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setTooltip({
      pct, yPct, time: timeStr,
      values: series.map(s => ({ label: s.label, value: `${s.data[idx]?.toFixed(yUnit === "rpm" ? 0 : 1)} ${yUnit}`, color: s.stroke })),
    });
  }, [series, timestamps, period, yUnit]);

  return (
    <div className="bg-[#363842] rounded-[24px] shadow-[0_6px_24px_rgba(0,0,0,0.30)] w-full overflow-hidden flex flex-col border border-white/5">
      <div className="flex items-center justify-between px-[28px] pt-[6px] pb-[2px]">
        <p className="font-['Wix_Madefor_Display'] font-medium text-[16px] text-white">{title}</p>
        <div className="flex gap-[16px]">
          {series.map((s, i) => (
            <div key={i} className="flex items-center gap-[6px]">
              <div className="size-[8px] rounded-full" style={{ background: s.stroke }} />
              <p className="font-['Wix_Madefor_Display'] text-[12px] text-[#a09f9d]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="relative w-full" style={{ height, paddingLeft: 56, paddingRight: 18, paddingBottom: 26 }}>
        {/* Y labels */}
        <div className="absolute left-0 top-0" style={{ width: 52, bottom: 26 }}>
          {yAxis.labels.map((l, idx) => (
            <div key={`${l.value}-${idx}`} className="absolute right-[6px] flex items-center gap-[3px]" style={{ top: `${l.pct}%`, transform: "translateY(-50%)" }}>
              <p className="font-['Wix_Madefor_Display'] font-medium text-[#a09f9d] text-[11px] tabular-nums">{l.value}</p>
              <svg width="5" height="1"><path d="M0 0.5H5" stroke="#a09f9d" /></svg>
            </div>
          ))}
        </div>
        {/* axis line */}
        <div className="absolute left-[54px] top-0 w-px bg-[#a09f9d]/40" style={{ bottom: 26 }} />
        {/* drawing area */}
        <div className="absolute top-0 left-[56px] right-[18px] cursor-crosshair" style={{ bottom: 26 }} ref={ref} onMouseMove={onMove} onMouseLeave={() => setTooltip(null)}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox={`0 0 ${W} ${H}`}>
            <GridLines width={W} height={H} />
            {paths.map((d, i) => <path key={i} d={d} stroke={series[i].stroke} strokeWidth="2.4" fill="none" strokeLinejoin="round" strokeLinecap="round" />)}
          </svg>
          <Tooltip data={tooltip} chartHeight={height - 26} />
        </div>
        {/* x axis */}
        <div className="absolute left-[56px] right-[18px] h-px bg-[#a09f9d]/40" style={{ bottom: 26 }} />
        <div className="absolute left-[56px] right-[18px] flex justify-between" style={{ bottom: 4 }}>
          {timeLabels.map((l, i) => (
            <div key={`${l}-${i}`} className="flex flex-col items-center">
              <svg width="1" height="3"><path d="M0.5 0V3" stroke="#a09f9d" /></svg>
              <p className="font-['Inter'] text-[#a09f9d] text-[11px] mt-[2px]">{l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Period buttons + Export */
function ExportIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1V9 M3.5 5.5L7 9L10.5 5.5 M2 12h10" stroke="#2c2d31" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PeriodBar({ active, setActive }) {
  const periods = ["1H", "7H", "24H", "30D"];
  return (
    <div className="flex w-full items-center justify-between px-[12px]">
      <csMotion.button whileTap={{ scale: 0.94 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="bg-[#e8e8ea] flex gap-[8px] h-[34px] items-center justify-center px-[14px] rounded-[17px] cursor-pointer hover:bg-[#cfcfd1] transition-colors">
        <ExportIcon />
        <span className="font-['Wix_Madefor_Display'] text-[13px] text-[#2c2d31] font-bold">Export</span>
      </csMotion.button>
      <div className="flex gap-[6px] items-center bg-[#2a2d40] rounded-[17px] p-[3px]">
        {periods.map((p) => (
          <button key={p} onClick={() => setActive(p)}
            className={`flex h-[28px] items-center justify-center px-[14px] rounded-[14px] cursor-pointer transition-colors duration-200 ${active === p ? "bg-[#e8e8ea] text-[#2c2d31] font-bold" : "text-[#a09f9d] hover:text-white"}`}>
            <span className="font-['DM_Sans'] text-[12px] font-medium">{p}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ===== Brush selector (Grafana-style) ===== */
function BrushSelector({ offset, windowSize, max, onChange, miniData, timestamps }) {
  const total = cs_TP;
  const ref = csUseRef(null);
  const dragRef = csUseRef(null);

  const startTs = timestamps[offset];
  const endTs = timestamps[Math.min(offset + windowSize - 1, timestamps.length - 1)];
  const fmt = (d) => d ? `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}` : "";

  const left = (offset / total) * 100;
  const width = (windowSize / total) * 100;

  const miniW = 1700, miniH = 32;
  let allMin = Infinity, allMax = -Infinity;
  for (const s of miniData) for (const v of s.data) { if (v < allMin) allMin = v; if (v > allMax) allMax = v; }
  const miniPaths = miniData.map(s => cs_path(s.data, miniW, miniH, allMin - (allMax - allMin) * 0.12, allMax + (allMax - allMin) * 0.12));

  const startDrag = (e, mode) => {
    e.preventDefault();
    e.stopPropagation();
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    dragRef.current = { mode, startX: e.clientX, startOffset: offset, rectWidth: rect.width };
    const onMove = (ev) => {
      const d = dragRef.current; if (!d) return;
      const dxPx = ev.clientX - d.startX;
      const dxPct = dxPx / d.rectWidth;
      const dxIdx = Math.round(dxPct * total);
      let newOffset = d.startOffset + dxIdx;
      newOffset = Math.max(0, Math.min(max, newOffset));
      onChange(newOffset);
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const onTrackClick = (e) => {
    const el = ref.current; if (!el || dragRef.current) return;
    const rect = el.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const target = Math.round(pct * total - windowSize / 2);
    onChange(Math.max(0, Math.min(max, target)));
  };

  return (
    <div className="w-full px-[12px]">
      <div className="flex items-center gap-[12px]">
        <p className="font-['Inter'] text-[11px] text-white/60 w-[110px] text-right tabular-nums">{fmt(startTs)}</p>
        <div ref={ref} className="flex-1 relative h-[44px] rounded-[10px] overflow-hidden bg-[#2a2d40] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06),0_1px_4px_rgba(0,0,0,0.30)]"
          onClick={onTrackClick}>
          {/* Mini chart */}
          <svg className="absolute inset-0 block size-full" fill="none" preserveAspectRatio="none" viewBox={`0 0 ${miniW} ${miniH}`}>
            {miniPaths.map((d, i) => <path key={i} d={d} stroke={miniData[i].stroke} strokeWidth="1.3" fill="none" opacity="0.6" />)}
          </svg>
          {/* Dimmed outside */}
          <div className="absolute top-0 bottom-0 left-0 bg-black/40 pointer-events-none" style={{ width: `${left}%` }} />
          <div className="absolute top-0 bottom-0 right-0 bg-black/40 pointer-events-none" style={{ width: `${Math.max(0, 100 - left - width)}%` }} />
          {/* Window */}
          <div
            onPointerDown={(e) => startDrag(e, "move")}
            className="absolute top-0 bottom-0 cursor-grab active:cursor-grabbing"
            style={{ left: `${left}%`, width: `${width}%`, boxShadow: "inset 0 0 0 1.5px #e8e8ea", background: "rgba(232,232,234,0.12)" }}
          >
            {/* Handles */}
            <div className="absolute top-0 bottom-0 left-0 w-[8px] flex items-center justify-center">
              <div className="w-[3px] h-[18px] bg-[#e8e8ea] rounded-full" />
            </div>
            <div className="absolute top-0 bottom-0 right-0 w-[8px] flex items-center justify-center">
              <div className="w-[3px] h-[18px] bg-[#e8e8ea] rounded-full" />
            </div>
          </div>
        </div>
        <p className="font-['Inter'] text-[11px] text-white/60 w-[110px] text-left tabular-nums">{fmt(endTs)}</p>
      </div>
    </div>
  );
}

/* ===== Main charts section ===== */
function ChartsSection() {
  const [period, setPeriod] = csUseState("24H");
  const fullData = cs_use();
  const visiblePts = cs_VP[period];
  const maxOffset = cs_TP - visiblePts;
  const [offset, setOffset] = csUseState(maxOffset);

  csUseEffect(() => { setOffset(cs_TP - cs_VP[period]); }, [period]);
  const off = Math.min(offset, maxOffset);
  const slice = (arr) => arr.slice(off, off + visiblePts);

  const ts = slice(fullData.timestamps);
  const tLabels = cs_lbls(ts, period);

  return (
    <div className="flex flex-col gap-[8px] items-stretch w-full h-full pt-[10px] pb-[8px] px-[16px] rounded-[36px] border border-white/5"
      style={{ backgroundImage: "linear-gradient(-75deg, rgba(42, 45, 64, 0.75) 5%, rgba(255, 255, 255, 0.04) 98%)" }}>
      <PeriodBar active={period} setActive={setPeriod} />
      <div className="flex flex-col gap-[6px]">
        <Chart title="Температура" yUnit="°C" period={period} timestamps={ts} timeLabels={tLabels} height={118}
          series={[
            { data: slice(fullData.temp1), stroke: "#E44E85", label: "Датчик 1" },
            { data: slice(fullData.temp2), stroke: "#FFC53D", label: "Датчик 2" },
            { data: slice(fullData.temp3), stroke: "#368CE2", label: "Датчик 3" },
          ]} />
        <Chart title="Влажность" yUnit="%" period={period} timestamps={ts} timeLabels={tLabels} height={96}
          series={[{ data: slice(fullData.humidity), stroke: "#00C3D0", label: "Влажность" }]} />
        <Chart title="Вентиляторы" yUnit="rpm" period={period} timestamps={ts} timeLabels={tLabels} height={118}
          series={[
            { data: slice(fullData.fan1), stroke: "#FF8D28", label: "Вент. 1" },
            { data: slice(fullData.fan2), stroke: "#E8E8EA", label: "Вент. 2" },
            { data: slice(fullData.fan3), stroke: "#6BCB77", label: "Вент. 3" },
          ]} />
      </div>
      <BrushSelector
        offset={off}
        windowSize={visiblePts}
        max={maxOffset}
        onChange={setOffset}
        timestamps={fullData.timestamps}
        miniData={[
          { data: fullData.temp1, stroke: "#E8E8EA" },
          { data: fullData.humidity, stroke: "#00C3D0" },
          { data: fullData.fan1, stroke: "#FF8D28" },
        ]}
      />
    </div>
  );
}

window.SurdisCharts = { ChartsSection };
