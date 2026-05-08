/* System page: uptime, version, CPU/RAM/Disk, S/N, firmware, full log + export */
const { useState: syUseState, useEffect: syUseEffect, useMemo: syUseMemo } = React;
const { motion: SyMotion } = window.Motion;
const { EventRow: SyEventRow } = window.SurdisEventLog;

const START_TS = Date.now() - (1000 * 60 * 60 * 26 + 1000 * 60 * 14);

function fmtUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${d > 0 ? d + "д " : ""}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function Stat({ label, val, max, unit, color }) {
  const pct = Math.min(100, (val / max) * 100);
  return (
    <div className="bg-[#2a2d40] rounded-[24px] p-[20px] shadow-[0_4px_18px_rgba(0,0,0,0.20)] border border-white/5">
      <div className="flex items-center justify-between mb-[10px]">
        <span className="font-['Wix_Madefor_Display'] text-[12px] uppercase tracking-wide text-[#a09f9d]">{label}</span>
        <span className="font-['Wix_Madefor_Display'] font-bold text-[22px] text-white tabular-nums">{val.toFixed(label === "Disk" ? 1 : 0)}{unit}</span>
      </div>
      <div className="h-[8px] bg-white/8 rounded-full overflow-hidden">
        <SyMotion.div className="h-full rounded-full" style={{ background: color }}
          animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 100, damping: 22 }} />
      </div>
    </div>
  );
}

function SystemPage({ events }) {
  const [now, setNow] = syUseState(Date.now());
  syUseEffect(() => { const iv = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(iv); }, []);

  const [usage, setUsage] = syUseState({ cpu: 23, ram: 41, disk: 38.4 });
  syUseEffect(() => {
    const iv = setInterval(() => {
      setUsage(u => ({
        cpu: Math.max(5, Math.min(95, u.cpu + (Math.random() - 0.5) * 10)),
        ram: Math.max(10, Math.min(90, u.ram + (Math.random() - 0.5) * 4)),
        disk: u.disk,
      }));
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  const [logFilter, setLogFilter] = syUseState("ALL");
  const [logQuery, setLogQuery] = syUseState("");

  const filtered = syUseMemo(() => {
    return (events || []).filter(ev => {
      if (logFilter !== "ALL" && ev.level !== logFilter) return false;
      if (logQuery && !(ev.msg + " " + ev.source).toLowerCase().includes(logQuery.toLowerCase())) return false;
      return true;
    });
  }, [events, logFilter, logQuery]);

  const exportLog = (format) => {
    let blob;
    if (format === "json") {
      blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    } else {
      const csv = ["time,level,source,message", ...filtered.map(e => `${e.time},${e.level},${e.source},"${e.msg.replace(/"/g, '""')}"`)].join("\n");
      blob = new Blob([csv], { type: "text/csv" });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `surdis-events.${format}`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  };

  return (
    <div className="flex flex-col gap-[20px] w-full">
      <div>
        <p className="font-['Wix_Madefor_Display'] font-bold text-[24px] md:text-[28px] text-[#ffd52a]">Система</p>
        <p className="font-['Wix_Madefor_Display'] text-[14px] md:text-[15px] text-[#a09f9d]">Информация о контроллере и расширенный журнал событий</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-[20px]">
        {/* Info card */}
        <div className="bg-[#363842] text-white rounded-[28px] p-[20px] md:p-[28px] border border-white/5">
          <div className="flex items-center justify-between mb-[20px]">
            <p className="font-['Wix_Madefor_Display'] font-bold text-[18px]">Surdis Controller</p>
            <span className="font-mono text-[12px] text-[#c2ff33] flex items-center gap-[6px]"><span className="size-[8px] rounded-full bg-[#c2ff33] animate-pulse" />ONLINE</span>
          </div>
          <div className="grid grid-cols-2 gap-y-[14px] gap-x-[40px]">
            <div>
              <p className="font-['Wix_Madefor_Display'] text-[11px] uppercase text-[#a09f9d] tracking-wide">Время работы</p>
              <p className="font-mono text-[24px] tabular-nums mt-[2px] text-white">{fmtUptime(now - START_TS)}</p>
            </div>
            <div>
              <p className="font-['Wix_Madefor_Display'] text-[11px] uppercase text-[#a09f9d] tracking-wide">Версия ПО</p>
              <p className="font-mono text-[18px] mt-[2px] text-white">v2.4.7-stable</p>
            </div>
            <div>
              <p className="font-['Wix_Madefor_Display'] text-[11px] uppercase text-[#a09f9d] tracking-wide">Модель</p>
              <p className="font-mono text-[18px] mt-[2px] text-white">SRD-CTRL-200</p>
            </div>
            <div>
              <p className="font-['Wix_Madefor_Display'] text-[11px] uppercase text-[#a09f9d] tracking-wide">Серийный №</p>
              <p className="font-mono text-[18px] mt-[2px] text-white">SRD-2024-A019</p>
            </div>
            <div>
              <p className="font-['Wix_Madefor_Display'] text-[11px] uppercase text-[#a09f9d] tracking-wide">Прошивка от</p>
              <p className="font-mono text-[18px] mt-[2px] text-white">12.03.2025</p>
            </div>
            <div className="flex items-end">
              <button className="bg-[#ffd52a] text-[#2c2d31] font-['Wix_Madefor_Display'] font-bold text-[13px] px-[16px] py-[8px] rounded-[12px] hover:bg-[#e6bf25] transition-colors">
                Проверить обновления
              </button>
            </div>
          </div>
        </div>

        {/* Usage stack */}
        <div className="flex flex-col gap-[12px]">
          <Stat label="CPU"  val={usage.cpu}  max={100} unit="%"  color="#ffd52a" />
          <Stat label="RAM"  val={usage.ram}  max={100} unit="%"  color="#c2ff33" />
          <Stat label="Disk" val={usage.disk} max={100} unit="%"  color="#ffd52a" />
        </div>
      </div>

      {/* Extended log */}
      <div className="bg-[#2a2d40] rounded-[28px] p-[20px] shadow-[0_8px_28px_rgba(0,0,0,0.30)] border border-white/5 flex flex-col gap-[14px]">
        <div className="flex flex-wrap items-center gap-[12px] justify-between">
          <p className="font-['Wix_Madefor_Display'] font-bold text-[18px] text-white">Журнал событий ({filtered.length})</p>
          <div className="flex flex-wrap gap-[8px] items-center">
            <input value={logQuery} onChange={e => setLogQuery(e.target.value)} placeholder="Поиск…"
              className="bg-[#363842] border border-white/8 rounded-[12px] px-[14px] py-[8px] font-['Wix_Madefor_Display'] text-[13px] text-white w-[220px] focus:outline-none focus:ring-2 focus:ring-[#ffd52a] placeholder:text-[#7b7b7b]" />
            <div className="flex gap-[4px] bg-[#363842] border border-white/8 rounded-[12px] p-[3px]">
              {["ALL", "INFO", "WARN", "ERROR"].map(l => (
                <button key={l} onClick={() => setLogFilter(l)}
                  className={`px-[12px] py-[6px] rounded-[10px] font-mono text-[12px] transition-colors ${logFilter === l ? "bg-[#ffd52a] text-[#2c2d31]" : "text-[#a09f9d] hover:text-white"}`}>{l}</button>
              ))}
            </div>
            <button onClick={() => exportLog("csv")}  className="bg-[#363842] border border-white/8 text-white rounded-[12px] px-[14px] py-[8px] font-['Wix_Madefor_Display'] text-[13px] font-medium hover:bg-[#3d3f4a]">CSV</button>
            <button onClick={() => exportLog("json")} className="bg-[#363842] border border-white/8 text-white rounded-[12px] px-[14px] py-[8px] font-['Wix_Madefor_Display'] text-[13px] font-medium hover:bg-[#3d3f4a]">JSON</button>
          </div>
        </div>
        <div className="bg-[#222328] rounded-[18px] overflow-hidden border border-white/8 h-[420px]">
          <div className="size-full overflow-auto px-[18px] py-[14px] surdis-thinscroll">
            {filtered.length === 0 ? (
              <p className="font-mono text-[13px] text-[#7b7b7b]">— нет событий —</p>
            ) : filtered.map(ev => <SyEventRow key={ev.id} ev={ev} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

window.SurdisSystemPage = { SystemPage };
