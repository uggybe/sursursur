/* Header: Logo + nav pill + lang switch + logout */
const { motion: hdMotion } = window.Motion;
const hdSvgPaths = window.svgPaths;

function Logo() {
  return (
    <div className="flex h-[48px] items-center justify-center w-[205px]">
      <div className="flex-none rotate-90">
        <div className="h-[205px] relative w-[48px]">
          <div className="absolute flex inset-[0_25.68%_0_26.11%] items-center justify-center">
            <div className="-rotate-90 flex-none h-[23.139px] w-[205px]">
              <div className="relative size-full"><div className="absolute inset-[0.88%_0_1.62%_0]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 205 22.5608"><g><path d={hdSvgPaths.p3e626280} fill="black" /><path d={hdSvgPaths.p37094d00} fill="black" /><path d={hdSvgPaths.p2699ee00} fill="black" /><path clipRule="evenodd" d={hdSvgPaths.p3b5f2580} fill="black" fillRule="evenodd" /><path d={hdSvgPaths.p228bd600} fill="black" /><path d={hdSvgPaths.pffcf980} fill="black" /></g></svg></div></div>
            </div>
          </div>
          <div className="absolute flex inset-[31.12%_-0.44%_42.84%_-0.75%] items-center justify-center">
            <div className="flex-none h-[38.523px] rotate-[-72.58deg] skew-x-[-3.13deg] w-[41.763px]">
              <div className="relative size-full"><div className="absolute inset-[-0.65%_0_0_0]"><svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 41.7627 38.7737"><g><g><path d={hdSvgPaths.p1622ab00} fill="black" stroke="black" /><path d={hdSvgPaths.p35fbcd80} fill="black" stroke="black" /><path d={hdSvgPaths.p27967700} fill="black" stroke="black" /><path d={hdSvgPaths.p11134c00} fill="black" stroke="black" /><path d={hdSvgPaths.p107f3f80} fill="black" stroke="black" /></g><ellipse cx="2.58698" cy="2.5515" fill="black" rx="2.58698" ry="2.5515" transform="matrix(0.999959 -0.00905923 -0.0121755 0.999926 18.0789 15.2187)" /></g></svg></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavBar({ active, onChange }) {
  const tabs = ["Dashboard", "Users", "Network", "System"];
  return (
    <div className="backdrop-blur-[10px] bg-[#363535] flex gap-[8px] p-[8px] rounded-[28px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.08)]">
      {tabs.map(tab => (
        <button key={tab} onClick={() => onChange(tab)}
          className="relative flex h-[36px] items-center justify-center px-[16px] rounded-[16px] cursor-pointer">
          {active === tab && (
            <hdMotion.div key="pill" layoutId="navPill" className="absolute inset-0 bg-[#daff33] rounded-[16px]"
              transition={{ type: "spring", stiffness: 500, damping: 35 }} />
          )}
          <span className={`font-['Wix_Madefor_Display'] text-[14px] z-[1] ${active === tab ? "text-black" : "text-white"}`}>{tab}</span>
        </button>
      ))}
    </div>
  );
}

function LangSwitch({ active, onChange }) {
  const langs = ["RU", "EN"];
  return (
    <div className="backdrop-blur-[10px] bg-[#363535] flex gap-[4px] p-[4px] rounded-[28px]">
      {langs.map(lang => (
        <button key={lang} onClick={() => onChange(lang)}
          className="relative flex h-[32px] items-center justify-center px-[12px] rounded-[16px] cursor-pointer">
          {active === lang && (
            <hdMotion.div key="pill" layoutId="langPill" className="absolute inset-0 bg-[#daff33] rounded-[16px]"
              transition={{ type: "spring", stiffness: 500, damping: 35 }} />
          )}
          <span className={`font-['Wix_Madefor_Display'] text-[12px] z-[1] ${active === lang ? "text-black" : "text-white"}`}>{lang}</span>
        </button>
      ))}
    </div>
  );
}

function LogoutBtn() {
  return (
    <hdMotion.button whileTap={{ scale: 0.92 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="bg-[#363535] flex gap-[8px] h-[32px] items-center justify-center px-[14px] rounded-[16px]">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M6 14H4a2 2 0 01-2-2V4a2 2 0 012-2h2 M11 11l3-3-3-3 M14 8H6" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-['DM_Sans'] text-[12px] text-white">Logout</span>
    </hdMotion.button>
  );
}

function Header({ activeNav, setActiveNav, activeLang, setActiveLang }) {
  return (
    <div className="absolute flex h-[88px] items-center justify-between left-0 right-0 top-0 px-[32px] z-10">
      <Logo />
      <NavBar active={activeNav} onChange={setActiveNav} />
      <div className="flex gap-[12px] items-center">
        <LangSwitch active={activeLang} onChange={setActiveLang} />
        <LogoutBtn />
      </div>
    </div>
  );
}

window.SurdisHeader = { Header };
