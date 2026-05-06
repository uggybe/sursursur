/* Status cards — sensors / power / climate / modbus */
const { useState: scUseState, useEffect: scUseEffect, useRef: scUseRef, useCallback: scUseCallback } = React;
const { motion: ScMotion, AnimatePresence: ScAnim } = window.Motion;
const { IconSensors, IconPower, IconClimate, IconModbus, MiniSensors, MiniPower, MiniClimate, MiniModbus } = window.SurdisIcons;

/* Demo device tables */
const cardTableData = {
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

/* Hold-only popup, light + perf-tuned (no per-frame motion onUpdate) */
function usePressHold(cardKey, openCard, setOpenCard) {
  const timer = scUseRef(null);
  const isHolding = scUseRef(false);

  const onPointerDown = scUseCallback(() => {
    isHolding.current = false;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      isHolding.current = true;
      setOpenCard(cardKey);
    }, 280);
  }, [cardKey, setOpenCard]);
  const onPointerUp = scUseCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (isHolding.current) { setOpenCard(null); isHolding.current = false; }
  }, [setOpenCard]);
  const onPointerLeave = scUseCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (isHolding.current) { setOpenCard(null); isHolding.current = false; }
  }, [setOpenCard]);
  return { onPointerDown, onPointerUp, onPointerLeave };
}

/* Popup table */
function StatusTable({ data, isOpen }) {
  return (
    <ScAnim>
      {isOpen && (
        <ScMotion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-0 right-0 bottom-full z-50 mb-[8px]"
          style={{ willChange: "transform, opacity" }}
        >
          <div className="bg-white/97 backdrop-blur-[10px] rounded-[18px] shadow-[0px_10px_28px_rgba(0,0,0,0.28)] p-[16px] border border-black/5">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left font-['Wix_Madefor_Display'] font-medium text-[14px] text-[#77738c] pb-[8px]">Устройство</th>
                  <th className="text-right font-['Wix_Madefor_Display'] font-medium text-[14px] text-[#77738c] pb-[8px]">Состояние</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="border-t border-[#e5e5e5]">
                    <td className="font-['Wix_Madefor_Display'] text-[19px] text-[#16141f] py-[8px]">{row.device}</td>
                    <td className={`text-right font-['Wix_Madefor_Display'] font-medium text-[19px] py-[8px] ${row.status === "норма" ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                      {row.status.toUpperCase()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScMotion.div>
      )}
    </ScAnim>
  );
}

/* Generic card frame */
function StatusCard({ id, title, value, alarm, openCard, setOpenCard, IconBig, MiniIcon, tableKey }) {
  const press = usePressHold(id, openCard, setOpenCard);
  const isOpen = openCard === id;
  const headerColor = alarm ? "#FF3B3B" : "#16141f";

  return (
    <div className="relative">
      <ScMotion.div whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}
        onPointerDown={press.onPointerDown} onPointerUp={press.onPointerUp} onPointerLeave={press.onPointerLeave}
        className="backdrop-blur-[10px] bg-[#f8f8f8] h-[155px] overflow-hidden relative rounded-[28px] shadow-[6px_8px_8px_0px_rgba(0,0,0,0.32)] w-[312px] cursor-pointer select-none touch-none">
        {/* Big blob icon (right side) */}
        <IconBig alarm={alarm} />
        {/* Text block */}
        <div className="absolute left-[36px] top-[34px] flex flex-col gap-[14px]">
          <div className="flex gap-[10px] items-center">
            <ScMotion.div
              animate={alarm ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
              transition={alarm ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0.3 }}
            >
              <MiniIcon color={headerColor} />
            </ScMotion.div>
            <p className="font-['Wix_Madefor_Display'] font-medium text-[18px]" style={{ color: headerColor }}>{title}</p>
          </div>
          <p className={`font-['Wix_Madefor_Display'] font-bold text-[36px] leading-[32px] pl-[5px] ${alarm ? "text-[#FF3B3B]" : "text-black"}`}>
            {alarm ? "АВАРИЯ" : value}
          </p>
        </div>
        {/* Inner shadow */}
        <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_-11px_-10px_21px_0px_rgba(0,0,0,0.18)]" />
      </ScMotion.div>
      <StatusTable data={cardTableData[tableKey]} isOpen={isOpen} />
    </div>
  );
}

function StatusCardsGrid({ alarms }) {
  const [openCard, setOpenCard] = scUseState(null);
  return (
    <div className="content-center flex flex-wrap gap-[30px_35px] h-[392px] items-center justify-center pl-[17px] pr-[20px] py-[20px] relative rounded-[38px] w-[724px]" style={{ backgroundImage: "linear-gradient(125.098deg, rgba(181, 215, 224, 0.43) 3.248%, rgba(0, 0, 0, 0.43) 92.293%)" }}>
      <StatusCard id="sensors" title="ДАТЧИКИ" value="НОРМА" alarm={alarms.sensors}
        openCard={openCard} setOpenCard={setOpenCard}
        IconBig={IconSensors} MiniIcon={MiniSensors} tableKey="sensors" />
      <StatusCard id="power" title="ПИТАНИЕ" value="220V" alarm={alarms.power}
        openCard={openCard} setOpenCard={setOpenCard}
        IconBig={IconPower} MiniIcon={MiniPower} tableKey="power" />
      <StatusCard id="climate" title="КЛИМАТИКА" value="НОРМА" alarm={alarms.climate}
        openCard={openCard} setOpenCard={setOpenCard}
        IconBig={IconClimate} MiniIcon={MiniClimate} tableKey="climate" />
      <StatusCard id="modbus" title="MODBUS" value="НОРМА" alarm={alarms.modbus}
        openCard={openCard} setOpenCard={setOpenCard}
        IconBig={IconModbus} MiniIcon={MiniModbus} tableKey="modbus" />
    </div>
  );
}

/* Door + Hardware (right tile, unchanged structure) */
function DoorAndHardware() {
  return (
    <div className="bg-[rgba(54,53,53,0.84)] flex flex-col gap-[24px] h-[392px] items-center justify-center px-[30px] py-[20px] rounded-[38px]">
      <div className="backdrop-blur-[10px] h-[127px] overflow-hidden relative rounded-[28px] shadow-[6px_19px_21.3px_0px_rgba(0,0,0,0.37)] w-[308px]"
        style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\"0 0 308 127\" xmlns=\"http://www.w3.org/2000/svg\" preserveAspectRatio=\"none\"><rect width=\"100%\" height=\"100%\" fill=\"url(%23g)\"/><defs><radialGradient id=\"g\" gradientUnits=\"userSpaceOnUse\" cx=\"0\" cy=\"0\" r=\"10\" gradientTransform=\"matrix(0.4338 -9.2997 18.595 0.49511 108.45 99.961)\"><stop stop-color=\"%23555553\" offset=\"0\"/><stop stop-color=\"%2370804b\" offset=\"0.25\"/><stop stop-color=\"%238caa43\" offset=\"0.5\"/><stop stop-color=\"%23a7d53b\" offset=\"0.75\"/><stop stop-color=\"%23c2ff33\" offset=\"1\"/></radialGradient></defs></svg>')" }}>
        <div className="absolute left-[30px] top-[30px] flex flex-col gap-[8px]">
          <div className="flex gap-[8px] items-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="6" y="3" width="12" height="18" rx="1" stroke="white" strokeWidth="1.6" />
              <circle cx="14" cy="13" r="1" fill="white" />
            </svg>
            <p className="font-['Wix_Madefor_Display'] font-medium text-[18px] text-white">ДВЕРЬ</p>
          </div>
          <p className="font-['Wix_Madefor_Display'] font-bold text-[36px] text-white leading-[32px]">ОТКРЫТО</p>
        </div>
      </div>
      <div className="backdrop-blur-[10px] bg-[#c2ff33] flex flex-col h-[195px] items-center px-[9px] py-[18px] rounded-[28px] w-[308px]">
        <p className="font-['Wix_Madefor_Display'] font-medium text-[18px] text-[#363535]">HARDWARE TEMP</p>
        <div className="mt-[20px] bg-[#555552] rounded-[21px] w-[290px] flex items-center justify-around py-[10px]">
          <div className="text-center">
            <p className="font-['Inter'] font-bold text-[40px] text-white leading-[46px]">38°</p>
            <p className="font-['Wix_Madefor_Display'] text-[12px] text-[#bcbcbc]">MAIN BOARD</p>
          </div>
          <div className="text-center">
            <p className="font-['Inter'] font-bold text-[40px] text-white leading-[46px]">42°</p>
            <p className="font-['Wix_Madefor_Display'] text-[12px] text-[#bcbcbc]">CPU/CORE</p>
          </div>
        </div>
      </div>
    </div>
  );
}

window.SurdisStatusCards = { StatusCardsGrid, DoorAndHardware };
