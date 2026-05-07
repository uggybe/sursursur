/* Network page */
const { useState: nwUseState } = React;
const { motion: NwMotion } = window.Motion;

function Field({ label, value, onChange, suffix, disabled, mono }) {
  return (
    <label className="flex flex-col gap-[8px]">
      <span className="font-['Wix_Madefor_Display'] text-[12px] uppercase tracking-wide text-[#8a92a3]">{label}</span>
      <div className={`relative bg-[#1c2333] border border-white/8 rounded-[14px] ${disabled ? "opacity-60" : ""}`}>
        <input value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
          className={`w-full bg-transparent rounded-[14px] px-[16px] py-[12px] ${mono ? "font-mono" : "font-['Wix_Madefor_Display']"} text-[15px] text-white focus:outline-none focus:ring-2 focus:ring-[#1185e6]`} />
        {suffix && <span className="absolute right-[16px] top-1/2 -translate-y-1/2 font-['Wix_Madefor_Display'] text-[12px] text-[#8a92a3]">{suffix}</span>}
      </div>
    </label>
  );
}

function Toggle({ on, onChange, label }) {
  return (
    <button type="button" onClick={() => onChange(!on)}
      className="flex items-center justify-between w-full bg-[#1c2333] border border-white/8 rounded-[14px] px-[16px] py-[12px]">
      <span className="font-['Wix_Madefor_Display'] font-medium text-[15px] text-white">{label}</span>
      <span className={`relative w-[44px] h-[24px] rounded-full transition-colors ${on ? "bg-[#1185e6]" : "bg-white/10"}`}>
        <NwMotion.span layout transition={{ type: "spring", stiffness: 600, damping: 30 }}
          className={`absolute top-[2px] size-[20px] rounded-full ${on ? "bg-white left-[22px]" : "bg-[#8a92a3] left-[2px]"}`} />
      </span>
    </button>
  );
}

function NetworkPage() {
  const [dhcp, setDhcp] = nwUseState(false);
  const [ip, setIp] = nwUseState("192.168.1.45");
  const [mask, setMask] = nwUseState("255.255.255.0");
  const [port, setPort] = nwUseState("502");
  const [savedAt, setSavedAt] = nwUseState(null);

  const save = () => {
    const t = new Date();
    setSavedAt(`${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}:${t.getSeconds().toString().padStart(2, "0")}`);
  };

  return (
    <div className="flex flex-col gap-[20px] w-full">
      <div>
        <p className="font-['Wix_Madefor_Display'] font-bold text-[24px] md:text-[28px] text-[#1185e6]">Сеть</p>
        <p className="font-['Wix_Madefor_Display'] text-[14px] md:text-[15px] text-[#8a92a3]">Сетевые настройки контроллера и Modbus TCP</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
        {/* Left card: IPv4 */}
        <div className="bg-[#1c2333] rounded-[28px] p-[28px] shadow-[0_8px_28px_rgba(0,0,0,0.30)] border border-white/5">
          <div className="flex items-center justify-between mb-[18px]">
            <p className="font-['Wix_Madefor_Display'] font-bold text-[18px] text-white">IPv4</p>
            <span className="size-[10px] rounded-full bg-[#c2ff33] shadow-[0_0_10px_#c2ff33]" title="Online" />
          </div>
          <div className="flex flex-col gap-[14px]">
            <Toggle on={dhcp} onChange={setDhcp} label="DHCP — автоматически получать настройки" />
            <Field label="IP-адрес"     value={ip}   onChange={setIp}   disabled={dhcp} mono />
            <Field label="Маска подсети" value={mask} onChange={setMask} disabled={dhcp} mono />
          </div>
        </div>

        {/* Right card: Modbus + status */}
        <div className="flex flex-col gap-[20px]">
          <div className="bg-[#1c2333] rounded-[28px] p-[28px] shadow-[0_8px_28px_rgba(0,0,0,0.30)] border border-white/5">
            <p className="font-['Wix_Madefor_Display'] font-bold text-[18px] text-white mb-[18px]">Modbus TCP</p>
            <div className="flex flex-col gap-[14px]">
              <Field label="Порт" value={port} onChange={setPort} mono />
              <div className="bg-[#161b27] text-white rounded-[14px] px-[16px] py-[14px] flex items-center gap-[12px] border border-white/5">
                <span className="size-[8px] rounded-full bg-[#c2ff33] animate-pulse" />
                <span className="font-mono text-[13px]">listening on tcp://{ip}:{port}</span>
              </div>
            </div>
          </div>
          <div className="bg-[#252b3d] text-white rounded-[28px] p-[24px] border border-white/5">
            <p className="font-['Wix_Madefor_Display'] text-[12px] uppercase tracking-wide text-[#8a92a3] mb-[10px]">Текущее состояние</p>
            <div className="grid grid-cols-2 gap-y-[6px] font-mono text-[13px]">
              <span className="text-[#8a92a3]">MAC</span>      <span>00:1A:2B:3C:4D:5E</span>
              <span className="text-[#8a92a3]">Hostname</span> <span>surdis-ctrl-01</span>
              <span className="text-[#8a92a3]">Gateway</span>  <span>192.168.1.1</span>
              <span className="text-[#8a92a3]">Uplink</span>   <span className="text-[#c2ff33]">1 Gbps · full duplex</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-[16px] justify-end">
        {savedAt && <span className="font-['Wix_Madefor_Display'] text-[13px] text-[#8a92a3]">Сохранено в {savedAt}</span>}
        <button onClick={save}
          className="bg-[#1185e6] hover:bg-[#0d6fc0] transition-colors font-['Wix_Madefor_Display'] font-bold text-[15px] text-white px-[28px] py-[14px] rounded-[18px] shadow-[0_6px_18px_rgba(17,133,230,0.40)]">
          Применить
        </button>
      </div>
    </div>
  );
}

window.SurdisNetworkPage = { NetworkPage };
