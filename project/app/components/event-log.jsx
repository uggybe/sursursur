/* Event log + shared event state — terminal style with thin scrollbar */
const { useState: elUseState, useEffect: elUseEffect } = React;
const { motion: ElMotion, AnimatePresence: ElAnim } = window.Motion;

const initialEvents = [
  { id: 1, msg: "System startup completed", source: "SYSTEM", time: "14:32:15", level: "INFO" },
  { id: 2, msg: "MODBUS controllers polled", source: "MODBUS", time: "14:31:02", level: "INFO" },
  { id: 3, msg: "High humidity detected (62%)", source: "CLIMATE", time: "14:15:42", level: "WARN" },
  { id: 4, msg: "Sensor 'smoke-1' offline", source: "SENSORS", time: "14:09:11", level: "ERROR" },
  { id: 5, msg: "Door access granted: admin", source: "AUTH", time: "13:58:30", level: "INFO" },
  { id: 6, msg: "UPS battery 87%", source: "POWER", time: "13:42:00", level: "INFO" },
  { id: 7, msg: "CPU temperature 42°C", source: "HARDWARE", time: "13:30:00", level: "INFO" },
];

const newEventTemplates = [
  { msg: "Temperature threshold exceeded", source: "CLIMATE", level: "WARN" },
  { msg: "Door access granted: operator1", source: "AUTH", level: "INFO" },
  { msg: "Fan speed adjusted to 2400 rpm", source: "CLIMATE", level: "INFO" },
  { msg: "Power fluctuation detected", source: "POWER", level: "ERROR" },
  { msg: "Sensor recalibrated", source: "SENSORS", level: "INFO" },
  { msg: "Network latency spike (130ms)", source: "NETWORK", level: "WARN" },
  { msg: "MODBUS connection restored", source: "MODBUS", level: "INFO" },
  { msg: "Battery backup activated", source: "POWER", level: "ERROR" },
  { msg: "Polling cycle complete", source: "MODBUS", level: "INFO" },
  { msg: "User 'admin' logged in", source: "AUTH", level: "INFO" },
];

/* Global event store so EventLog & System share the stream */
function useEventStore(maxLen = 200) {
  const [events, setEvents] = elUseState(initialEvents);
  elUseEffect(() => {
    const iv = setInterval(() => {
      const t = newEventTemplates[Math.floor(Math.random() * newEventTemplates.length)];
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
      setEvents(prev => [{ id: Date.now() + Math.random(), msg: t.msg, source: t.source, time, level: t.level }, ...prev].slice(0, maxLen));
    }, 5000);
    return () => clearInterval(iv);
  }, [maxLen]);
  return events;
}

const LEVEL_COLOR = { INFO: "#A8E000", WARN: "#FFC53D", ERROR: "#FF3B3B" };

function EventRow({ ev, large }) {
  const c = LEVEL_COLOR[ev.level];
  return (
    <div className="flex gap-[10px] items-baseline font-mono leading-[1.55]" style={{ fontSize: large ? 14 : 13 }}>
      <span className="text-[#9a9a9a] tabular-nums">[{ev.time}]</span>
      <span className="font-bold tabular-nums" style={{ color: c, minWidth: 56, display: "inline-block" }}>{ev.level}</span>
      <span className="text-[#bcbcbc]" style={{ minWidth: 90 }}>{ev.source}</span>
      <span className="text-white">{ev.msg}</span>
    </div>
  );
}

function EventLog({ events }) {
  return (
    <div className="backdrop-blur-[10px] flex flex-col gap-[14px] h-[392px] items-stretch pb-[20px] pt-[14px] px-[20px] rounded-[28px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.08)] w-[712px]"
      style={{ backgroundImage: "linear-gradient(-70.6913deg, rgba(101, 135, 136, 0.396) 7.6427%, rgba(59, 59, 59, 0.67) 73.853%)" }}>
      <div className="flex items-center justify-between">
        <div className="bg-[#363535] flex gap-[8px] items-center px-[14px] py-[8px] rounded-[18px]">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M3 4h12M3 9h12M3 14h7" stroke="#DAFF33" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          <p className="font-['Wix_Madefor_Display'] font-bold text-[16px] text-white tracking-wide">ЖУРНАЛ СОБЫТИЙ</p>
        </div>
        <div className="flex gap-[12px] text-[10px] font-mono">
          <span className="flex items-center gap-[5px]"><span className="size-[8px] rounded-full" style={{ background: LEVEL_COLOR.INFO }}/><span className="text-white/70">INFO</span></span>
          <span className="flex items-center gap-[5px]"><span className="size-[8px] rounded-full" style={{ background: LEVEL_COLOR.WARN }}/><span className="text-white/70">WARN</span></span>
          <span className="flex items-center gap-[5px]"><span className="size-[8px] rounded-full" style={{ background: LEVEL_COLOR.ERROR }}/><span className="text-white/70">ERROR</span></span>
        </div>
      </div>
      <div className="flex-1 bg-[#363535] rounded-[18px] overflow-hidden border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="size-full overflow-auto px-[18px] py-[14px] surdis-thinscroll">
          <ElAnim initial={false}>
            {events.map(ev => (
              <ElMotion.div key={ev.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.18 }}>
                <EventRow ev={ev} />
              </ElMotion.div>
            ))}
          </ElAnim>
        </div>
      </div>
    </div>
  );
}

window.SurdisEventLog = { EventLog, useEventStore, EventRow };
