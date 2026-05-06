/* Mobile-first dashboard — no charts, vertical stacking */
const { useState: mbUseState, useEffect: mbUseEffect } = React;
const { motion: MbMotion, AnimatePresence: MbAnim } = window.Motion;
const { useEventStore: mbUseEventStore, EventRow: MbEventRow } = window.SurdisEventLog;
const { IconSensors: MbIconSensors, IconPower: MbIconPower, IconClimate: MbIconClimate, IconModbus: MbIconModbus, MiniSensors: MbMiniSensors, MiniPower: MbMiniPower, MiniClimate: MbMiniClimate, MiniModbus: MbMiniModbus } = window.SurdisIcons;
const { UsersPage: MbUsersPage } = window.SurdisUsersPage;
const { NetworkPage: MbNetworkPage } = window.SurdisNetworkPage;
const { SystemPage: MbSystemPage } = window.SurdisSystemPage;

function MobileHeader({ activeNav, setActiveNav, activeLang, setActiveLang, navOpen, setNavOpen }) {
  const tabs = ["Dashboard", "Users", "Network", "System"];
  return (
    <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-[12px] border-b border-black/5">
      <div className="flex items-center justify-between px-[16px] py-[12px]">
        <p className="font-['Wix_Madefor_Display'] font-bold text-[20px] text-black tracking-tight">SURDIS</p>
        <div className="flex items-center gap-[8px]">
          <div className="bg-[#363535] flex gap-[2px] p-[3px] rounded-[18px]">
            {["RU", "EN"].map(l => (
              <button key={l} onClick={() => setActiveLang(l)} className="relative h-[26px] px-[10px] rounded-[14px]">
                {activeLang === l && <MbMotion.div layoutId="mlangPill" className="absolute inset-0 bg-[#daff33] rounded-[14px]" transition={{ type: "spring", stiffness: 500, damping: 35 }} />}
                <span className={`relative font-['Wix_Madefor_Display'] text-[11px] ${activeLang === l ? "text-black" : "text-white"}`}>{l}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setNavOpen(o => !o)}
            className="bg-[#363535] size-[36px] rounded-[12px] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              {navOpen
                ? <path d="M4 4l10 10 M14 4l-10 10" stroke="#DAFF33" strokeWidth="1.8" strokeLinecap="round" />
                : <path d="M3 5h12M3 9h12M3 13h12" stroke="#DAFF33" strokeWidth="1.8" strokeLinecap="round" />}
            </svg>
          </button>
        </div>
      </div>
      <MbAnim>
        {navOpen && (
          <MbMotion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden border-t border-black/5">
            <div className="flex flex-col p-[8px] gap-[4px]">
              {tabs.map(t => (
                <button key={t} onClick={() => { setActiveNav(t); setNavOpen(false); }}
                  className={`text-left font-['Wix_Madefor_Display'] text-[15px] px-[14px] py-[12px] rounded-[12px] transition-colors ${activeNav === t ? "bg-[#DAFF33] text-black font-bold" : "text-[#16141f]"}`}>
                  {t}
                </button>
              ))}
              <button className="text-left font-['Wix_Madefor_Display'] text-[15px] px-[14px] py-[12px] rounded-[12px] text-[#16141f] mt-[4px] border-t border-black/5">
                <span className="opacity-70">Logout</span>
              </button>
            </div>
          </MbMotion.div>
        )}
      </MbAnim>
    </div>
  );
}

/* Compact status card — 2-up grid on phones, mini icon as the main mark */
function MobileStatusCard({ title, value, alarm, MiniIcon, accent }) {
  const headerColor = alarm ? "#FF3B3B" : "#16141f";
  return (
    <div className="relative bg-[#f8f8f8] rounded-[20px] shadow-[3px_5px_8px_0px_rgba(0,0,0,0.14)] overflow-hidden p-[16px] flex flex-col justify-between min-h-[120px]">
      <div className="flex items-start justify-between">
        <MbMotion.div
          animate={alarm ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
          transition={alarm ? { duration: 0.5, repeat: Infinity, ease: "linear" } : { duration: 0.3 }}>
          <div className="size-[36px] rounded-full flex items-center justify-center" style={{ background: alarm ? "#FF3B3B22" : `${accent}33` }}>
            <MiniIcon color={alarm ? "#FF3B3B" : accent} />
          </div>
        </MbMotion.div>
      </div>
      <div>
        <p className="font-['Wix_Madefor_Display'] font-medium text-[12px] tracking-wide" style={{ color: headerColor }}>{title}</p>
        <p className={`font-['Wix_Madefor_Display'] font-bold text-[22px] leading-[26px] mt-[2px] ${alarm ? "text-[#FF3B3B]" : "text-black"}`}>
          {alarm ? "АВАРИЯ" : value}
        </p>
      </div>
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_-6px_-6px_16px_0px_rgba(0,0,0,0.10)]" />
    </div>
  );
}

function MobileStatusGrid({ alarms }) {
  return (
    <div className="grid grid-cols-2 gap-[10px]">
      <MobileStatusCard title="ДАТЧИКИ"   value="НОРМА" alarm={alarms.sensors} MiniIcon={MbMiniSensors} accent="#A8E000" />
      <MobileStatusCard title="ПИТАНИЕ"   value="220V"  alarm={alarms.power}   MiniIcon={MbMiniPower}   accent="#C2FF33" />
      <MobileStatusCard title="КЛИМАТИКА" value="НОРМА" alarm={alarms.climate} MiniIcon={MbMiniClimate} accent="#A8E000" />
      <MobileStatusCard title="MODBUS"    value="НОРМА" alarm={alarms.modbus}  MiniIcon={MbMiniModbus}  accent="#C2FF33" />
    </div>
  );
}

function MobileDoorAndHardware() {
  return (
    <div className="bg-[rgba(54,53,53,0.84)] rounded-[24px] p-[16px] flex flex-col gap-[14px]">
      <div className="rounded-[18px] p-[18px] relative overflow-hidden"
        style={{ backgroundImage: "linear-gradient(135deg, #555553 0%, #70804b 35%, #8caa43 60%, #a7d53b 80%, #c2ff33 100%)" }}>
        <div className="flex gap-[8px] items-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="6" y="3" width="12" height="18" rx="1" stroke="white" strokeWidth="1.6" />
            <circle cx="14" cy="13" r="1" fill="white" />
          </svg>
          <p className="font-['Wix_Madefor_Display'] font-medium text-[14px] text-white">ДВЕРЬ</p>
        </div>
        <p className="font-['Wix_Madefor_Display'] font-bold text-[28px] text-white leading-[28px] mt-[8px]">ОТКРЫТО</p>
      </div>
      <div className="bg-[#c2ff33] rounded-[18px] p-[14px]">
        <p className="font-['Wix_Madefor_Display'] font-medium text-[14px] text-[#363535] text-center">HARDWARE TEMP</p>
        <div className="mt-[10px] bg-[#555552] rounded-[14px] flex items-center justify-around py-[10px]">
          <div className="text-center">
            <p className="font-['Inter'] font-bold text-[28px] text-white leading-[32px]">38°</p>
            <p className="font-['Wix_Madefor_Display'] text-[10px] text-[#bcbcbc]">MAIN BOARD</p>
          </div>
          <div className="text-center">
            <p className="font-['Inter'] font-bold text-[28px] text-white leading-[32px]">42°</p>
            <p className="font-['Wix_Madefor_Display'] text-[10px] text-[#bcbcbc]">CPU/CORE</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileEventLog({ events }) {
  return (
    <div className="rounded-[24px] p-[14px] flex flex-col gap-[10px]"
      style={{ backgroundImage: "linear-gradient(-70.6913deg, rgba(101, 135, 136, 0.396) 7.6427%, rgba(59, 59, 59, 0.67) 73.853%)" }}>
      <div className="flex items-center justify-between">
        <div className="bg-[#363535] flex gap-[6px] items-center px-[12px] py-[6px] rounded-[14px]">
          <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
            <path d="M3 4h12M3 9h12M3 14h7" stroke="#DAFF33" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          <p className="font-['Wix_Madefor_Display'] font-bold text-[12px] text-white tracking-wide">ЖУРНАЛ</p>
        </div>
      </div>
      <div className="bg-[#363535] rounded-[16px] p-[12px] max-h-[320px] overflow-auto surdis-thinscroll">
        {events.map(ev => <MbEventRow key={ev.id} ev={ev} />)}
      </div>
    </div>
  );
}

function MobileDashboard() {
  const [activeNav, setActiveNav] = mbUseState("Dashboard");
  const [activeLang, setActiveLang] = mbUseState("RU");
  const [navOpen, setNavOpen] = mbUseState(false);
  const events = mbUseEventStore(200);

  const [alarms, setAlarms] = mbUseState({ sensors: false, power: false, climate: false, modbus: false });
  mbUseEffect(() => {
    const iv = setInterval(() => {
      const keys = ["sensors", "power", "climate", "modbus"];
      const k = keys[Math.floor(Math.random() * keys.length)];
      setAlarms(a => ({ ...a, [k]: !a[k] }));
    }, 30000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="min-h-screen w-full" style={{
      backgroundImage: `
        radial-gradient(at 70% 5%, rgba(255,252,153,0.18), transparent 45%),
        radial-gradient(at 30% 0%, rgba(255,215,215,0.6), transparent 55%),
        #ffffff
      `
    }}>
      <MobileHeader
        activeNav={activeNav} setActiveNav={setActiveNav}
        activeLang={activeLang} setActiveLang={setActiveLang}
        navOpen={navOpen} setNavOpen={setNavOpen} />
      <main className="px-[14px] py-[16px] pb-[32px]">
        {activeNav === "Dashboard" && (
          <div className="flex flex-col gap-[14px]">
            <MobileStatusGrid alarms={alarms} />
            <MobileDoorAndHardware />
            <MobileEventLog events={events.slice(0, 30)} />
          </div>
        )}
        {activeNav === "Users"   && <MbUsersPage />}
        {activeNav === "Network" && <MbNetworkPage />}
        {activeNav === "System"  && <MbSystemPage events={events} />}
      </main>
    </div>
  );
}

window.MobileDashboard = MobileDashboard;
