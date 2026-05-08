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
          <div className="bg-[#363842] rounded-[18px] shadow-[0px_10px_28px_rgba(0,0,0,0.45)] p-[16px] border border-white/8">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left font-['Wix_Madefor_Display'] font-medium text-[14px] text-[#a09f9d] pb-[8px]">Устройство</th>
                  <th className="text-right font-['Wix_Madefor_Display'] font-medium text-[14px] text-[#a09f9d] pb-[8px]">Состояние</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="border-t border-white/8">
                    <td className="font-['Wix_Madefor_Display'] text-[19px] text-white py-[8px]">{row.device}</td>
                    <td className={`text-right font-['Wix_Madefor_Display'] font-medium text-[19px] py-[8px] ${row.status === "норма" ? "text-[#c2ff33]" : "text-[#cd212a]"}`}>
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
  const headerColor = alarm ? "#cd212a" : "#e8eaf0";

  return (
    <div className="relative">
      <ScMotion.div whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}
        onPointerDown={press.onPointerDown} onPointerUp={press.onPointerUp} onPointerLeave={press.onPointerLeave}
        className="bg-[#363842] h-[155px] overflow-hidden relative rounded-[28px] shadow-[6px_8px_8px_0px_rgba(0,0,0,0.40)] w-[312px] cursor-pointer select-none touch-none border border-white/5">
        {/* Big blob icon (right side) */}
        <IconBig alarm={alarm} />
        {/* Text block */}
        <div className="absolute left-[36px] top-[34px] flex flex-col gap-[14px]">
          <div className="flex gap-[10px] items-center">
            <ScMotion.div
              animate={alarm ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
              transition={alarm ? { duration: 0.5, repeat: Infinity, ease: "linear" } : { duration: 0.3 }}
            >
              <MiniIcon color={headerColor} />
            </ScMotion.div>
            <p className="font-['Wix_Madefor_Display'] font-medium text-[18px]" style={{ color: headerColor }}>{title}</p>
          </div>
          <p className={`font-['Wix_Madefor_Display'] font-bold text-[36px] leading-[32px] pl-[5px] ${alarm ? "text-[#cd212a]" : "text-white"}`}>
            {alarm ? "АВАРИЯ" : value}
          </p>
        </div>
        {/* Inner shadow */}
        <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_-11px_-10px_21px_0px_rgba(0,0,0,0.32)]" />
      </ScMotion.div>
      <StatusTable data={cardTableData[tableKey]} isOpen={isOpen} />
    </div>
  );
}

function StatusCardsGrid({ alarms }) {
  const [openCard, setOpenCard] = scUseState(null);
  return (
    <div className="content-center flex flex-wrap gap-[30px_35px] h-[392px] items-center justify-center pl-[17px] pr-[20px] py-[20px] relative rounded-[38px] w-[724px] border border-white/5" style={{ backgroundImage: "linear-gradient(125deg, rgba(42, 45, 64, 0.7) 3%, rgba(0, 0, 0, 0.5) 92%)" }}>
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

/* Door + Hardware (right tile) */
function DoorAndHardware() {
  return (
    <div className="bg-[#2a2d40] flex flex-col gap-[24px] h-[392px] items-center justify-center px-[30px] py-[20px] rounded-[38px] border border-white/5">
      <div className="h-[127px] overflow-hidden relative rounded-[28px] shadow-[6px_19px_21px_0px_rgba(0,0,0,0.45)] w-[308px]"
        style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\"0 0 308 127\" xmlns=\"http://www.w3.org/2000/svg\" preserveAspectRatio=\"none\"><rect width=\"100%\" height=\"100%\" fill=\"url(%23g)\"/><defs><radialGradient id=\"g\" gradientUnits=\"userSpaceOnUse\" cx=\"0\" cy=\"0\" r=\"10\" gradientTransform=\"matrix(0.4338 -9.2997 18.595 0.49511 108.45 99.961)\"><stop stop-color=\"%23363842\" offset=\"0\"/><stop stop-color=\"%23806a1e\" offset=\"0.4\"/><stop stop-color=\"%23e6bf25\" offset=\"0.75\"/><stop stop-color=\"%23ffd52a\" offset=\"1\"/></radialGradient></defs></svg>')" }}>
        <div className="absolute left-[30px] top-[30px] flex flex-col gap-[8px]">
          <div className="flex gap-[8px] items-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="6" y="3" width="12" height="18" rx="1" stroke="#2c2d31" strokeWidth="1.8" />
              <circle cx="14" cy="13" r="1" fill="#2c2d31" />
            </svg>
            <p className="font-['Wix_Madefor_Display'] font-medium text-[18px] text-[#2c2d31]">ДВЕРЬ</p>
          </div>
          <p className="font-['Wix_Madefor_Display'] font-bold text-[36px] text-[#2c2d31] leading-[32px]">ОТКРЫТО</p>
        </div>
      </div>
      <div className="bg-[#ffd52a] flex flex-col h-[195px] items-center px-[9px] py-[18px] rounded-[28px] w-[308px]">
        <p className="font-['Wix_Madefor_Display'] font-medium text-[18px] text-[#2c2d31]">HARDWARE TEMP</p>
        <div className="mt-[20px] bg-[#2c2d31] rounded-[21px] w-[290px] flex items-center justify-around py-[10px]">
          <div className="text-center">
            <p className="font-['Inter'] font-bold text-[40px] text-white leading-[46px]">38°</p>
            <p className="font-['Wix_Madefor_Display'] text-[12px] text-[#a09f9d]">MAIN BOARD</p>
          </div>
          <div className="text-center">
            <p className="font-['Inter'] font-bold text-[40px] text-white leading-[46px]">42°</p>
            <p className="font-['Wix_Madefor_Display'] text-[12px] text-[#a09f9d]">CPU/CORE</p>
          </div>
        </div>
      </div>
    </div>
  );
}

window.SurdisStatusCards = { StatusCardsGrid, DoorAndHardware };
