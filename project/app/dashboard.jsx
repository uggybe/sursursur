/* Main Dashboard shell: routing + alarm orchestration */
const { useState: dbUseState, useEffect: dbUseEffect } = React;
const { motion: DbMotion, AnimatePresence: DbAnim } = window.Motion;
const { Header } = window.SurdisHeader;
const { ChartsSection } = window.SurdisCharts;
const { StatusCardsGrid, DoorAndHardware } = window.SurdisStatusCards;
const { EventLog, useEventStore } = window.SurdisEventLog;
const { UsersPage } = window.SurdisUsersPage;
const { NetworkPage } = window.SurdisNetworkPage;
const { SystemPage } = window.SurdisSystemPage;

function DashboardShell() {
  const [activeNav, setActiveNav] = dbUseState("Dashboard");
  const [activeLang, setActiveLang] = dbUseState("RU");
  const events = useEventStore(200);

  // Random alarms — flips one card on every ~30s
  const [alarms, setAlarms] = dbUseState({ sensors: false, power: false, climate: false, modbus: false });
  dbUseEffect(() => {
    const iv = setInterval(() => {
      const keys = ["sensors", "power", "climate", "modbus"];
      const k = keys[Math.floor(Math.random() * keys.length)];
      setAlarms(a => ({ ...a, [k]: !a[k] }));
    }, 30000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="relative w-[1920px] h-[1080px]" style={{
      backgroundImage: `
        linear-gradient(148deg, rgba(255,255,255,0) 62%, rgba(4,4,4,0.2) 92%),
        linear-gradient(203deg, rgba(255,255,255,0) 41%, rgba(226,255,65,0.2) 78%),
        radial-gradient(at 70% 5%, rgba(255,252,153,0.18), transparent 45%),
        radial-gradient(at 30% 0%, rgba(255,215,215,0.6), transparent 55%),
        #ffffff
      `
    }}>
      <Header activeNav={activeNav} setActiveNav={setActiveNav} activeLang={activeLang} setActiveLang={setActiveLang} />

      <div className="absolute top-[88px] left-0 right-0 bottom-0 px-[32px] py-[16px] overflow-hidden">
        {activeNav === "Dashboard" && (
          <div key="dashboard" className="flex flex-col gap-[16px] h-full">
            <ChartsSection />
            <div className="flex gap-[27px] items-stretch">
              <StatusCardsGrid alarms={alarms} />
              <DoorAndHardware />
              <EventLog events={events.slice(0, 10)} />
            </div>
          </div>
        )}
        {activeNav === "Users"   && <UsersPage />}
        {activeNav === "Network" && <NetworkPage />}
        {activeNav === "System"  && <SystemPage events={events} />}
      </div>
    </div>
  );
}

window.Dashboard = DashboardShell;
