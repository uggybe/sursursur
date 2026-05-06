/* Users page */
const { useState: usUseState } = React;
const { motion: UsMotion, AnimatePresence: UsAnim } = window.Motion;

const initialUsers = [
  { id: 1, login: "admin",     name: "Сергей Иванов",      role: "Admin",    last: "сегодня, 09:14" },
  { id: 2, login: "operator1", name: "Анна Петрова",       role: "Operator", last: "вчера, 17:22" },
  { id: 3, login: "viewer",    name: "Дмитрий Кузнецов",   role: "Operator", last: "3 дня назад" },
  { id: 4, login: "service",   name: "Service Account",    role: "Service",  last: "—" },
];

const ROLES = ["Service", "Admin", "Operator"];
const ROLE_COLOR = {
  Service:  "#8DA0FF",
  Admin:    "#DAFF33",
  Operator: "#A8E000",
};

function UsersPage() {
  const [users, setUsers] = usUseState(initialUsers);
  const [open, setOpen] = usUseState(false);
  const [form, setForm] = usUseState({ login: "", password: "", name: "", role: "Operator" });

  const submit = (e) => {
    e.preventDefault();
    if (!form.login.trim() || !form.password.trim() || !form.name.trim()) return;
    setUsers(prev => [...prev, { id: Date.now(), login: form.login, name: form.name, role: form.role, last: "только что" }]);
    setForm({ login: "", password: "", name: "", role: "Operator" });
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-[20px] w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-[14px]">
        <div>
          <p className="font-['Wix_Madefor_Display'] font-bold text-[24px] md:text-[28px] text-black">Пользователи</p>
          <p className="font-['Wix_Madefor_Display'] text-[14px] md:text-[15px] text-[#16141f]/60">Управление учётными записями системы</p>
        </div>
        <UsMotion.button whileTap={{ scale: 0.96 }}
          onClick={() => setOpen(true)}
          className="bg-[#363535] hover:bg-[#1f1f1f] transition-colors text-white font-['Wix_Madefor_Display'] font-medium text-[14px] md:text-[15px] px-[18px] md:px-[20px] py-[10px] md:py-[12px] rounded-[16px] md:rounded-[18px] flex items-center gap-[10px] shadow-[0_6px_20px_rgba(0,0,0,0.18)] w-fit">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="#DAFF33" strokeWidth="2" strokeLinecap="round" /></svg>
          Добавить пользователя
        </UsMotion.button>
      </div>

      <div className="bg-white/95 backdrop-blur-[10px] rounded-[28px] overflow-hidden shadow-[0_8px_28px_rgba(0,0,0,0.10)]">
        <div className="hidden md:grid grid-cols-[2fr_3fr_1.4fr_1.4fr_60px] px-[28px] py-[16px] bg-[#16141f]/[0.03] border-b border-[#16141f]/8">
          <span className="font-['Wix_Madefor_Display'] font-medium text-[13px] text-[#77738c] uppercase tracking-wide">Логин</span>
          <span className="font-['Wix_Madefor_Display'] font-medium text-[13px] text-[#77738c] uppercase tracking-wide">Имя</span>
          <span className="font-['Wix_Madefor_Display'] font-medium text-[13px] text-[#77738c] uppercase tracking-wide">Роль</span>
          <span className="font-['Wix_Madefor_Display'] font-medium text-[13px] text-[#77738c] uppercase tracking-wide">Последний вход</span>
          <span></span>
        </div>
        <div className="max-h-[520px] overflow-auto surdis-thinscroll">
          {users.map(u => (
            <div key={u.id} className="grid grid-cols-[1fr_auto] md:grid-cols-[2fr_3fr_1.4fr_1.4fr_60px] gap-y-[6px] gap-x-[12px] items-center px-[16px] md:px-[28px] py-[14px] md:py-[16px] border-b border-[#16141f]/[0.06] hover:bg-[#DAFF33]/8 transition-colors">
              <div className="flex items-center gap-[12px]">
                <div className="size-[34px] rounded-full bg-[#363535] text-white flex items-center justify-center font-['Wix_Madefor_Display'] font-bold text-[13px]">{u.login.slice(0, 2).toUpperCase()}</div>
                <div className="flex flex-col md:flex-row md:items-center md:gap-[12px] min-w-0">
                  <span className="font-mono text-[14px] text-black truncate">{u.login}</span>
                  <span className="md:hidden font-['Wix_Madefor_Display'] text-[13px] text-[#77738c] truncate">{u.name}</span>
                </div>
              </div>
              <span className="hidden md:inline font-['Wix_Madefor_Display'] text-[15px] text-black">{u.name}</span>
              <span className="hidden md:inline-flex font-['Wix_Madefor_Display'] font-medium text-[13px] px-[10px] py-[4px] rounded-full items-center gap-[6px] w-fit"
                style={{ background: `${ROLE_COLOR[u.role]}26`, color: "#16141f" }}>
                <span className="size-[8px] rounded-full" style={{ background: ROLE_COLOR[u.role] }} />
                {u.role}
              </span>
              <span className="hidden md:inline font-['Wix_Madefor_Display'] text-[13px] text-[#77738c]">{u.last}</span>
              <div className="flex items-center gap-[10px] justify-end">
                <span className="md:hidden font-['Wix_Madefor_Display'] font-medium text-[12px] px-[10px] py-[3px] rounded-full inline-flex items-center gap-[6px]"
                  style={{ background: `${ROLE_COLOR[u.role]}26`, color: "#16141f" }}>
                  <span className="size-[7px] rounded-full" style={{ background: ROLE_COLOR[u.role] }} />
                  {u.role}
                </span>
                <button className="text-[#77738c] hover:text-[#FF3B3B] transition-colors" onClick={() => setUsers(p => p.filter(x => x.id !== u.id))}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 5h12M7 5V3h4v2M5 5l1 10h6l1-10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <UsAnim>
        {open && (
          <UsMotion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[3px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}>
            <UsMotion.form onSubmit={submit} onClick={(e) => e.stopPropagation()}
              initial={{ y: 16, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 16, opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-white rounded-[24px] p-[20px] md:p-[28px] w-[calc(100vw-32px)] max-w-[460px] shadow-[0_24px_64px_rgba(0,0,0,0.4)]">
              <p className="font-['Wix_Madefor_Display'] font-bold text-[22px] text-black mb-[18px]">Новый пользователь</p>
              <div className="flex flex-col gap-[14px]">
                {[
                  { k: "login", l: "Логин", t: "text" },
                  { k: "password", l: "Пароль", t: "password" },
                  { k: "name", l: "Имя", t: "text" },
                ].map(f => (
                  <label key={f.k} className="flex flex-col gap-[6px]">
                    <span className="font-['Wix_Madefor_Display'] text-[12px] uppercase tracking-wide text-[#77738c]">{f.l}</span>
                    <input type={f.t} value={form[f.k]} onChange={e => setForm({ ...form, [f.k]: e.target.value })}
                      className="bg-[#f5f5f7] rounded-[14px] px-[16px] py-[12px] font-['Wix_Madefor_Display'] text-[15px] text-black focus:outline-none focus:ring-2 focus:ring-[#DAFF33]" />
                  </label>
                ))}
                <label className="flex flex-col gap-[8px]">
                  <span className="font-['Wix_Madefor_Display'] text-[12px] uppercase tracking-wide text-[#77738c]">Роль</span>
                  <div className="flex gap-[8px]">
                    {ROLES.map(r => (
                      <button type="button" key={r} onClick={() => setForm({ ...form, role: r })}
                        className={`flex-1 py-[10px] rounded-[12px] font-['Wix_Madefor_Display'] font-medium text-[14px] transition-colors ${form.role === r ? "bg-[#363535] text-white" : "bg-[#f5f5f7] text-[#16141f]"}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </label>
              </div>
              <div className="flex gap-[10px] mt-[22px] justify-end">
                <button type="button" onClick={() => setOpen(false)} className="px-[18px] py-[10px] rounded-[14px] font-['Wix_Madefor_Display'] text-[14px] text-[#77738c] hover:bg-[#f5f5f7]">Отмена</button>
                <button type="submit" className="bg-[#DAFF33] hover:bg-[#c2ff33] transition-colors px-[20px] py-[10px] rounded-[14px] font-['Wix_Madefor_Display'] font-bold text-[14px] text-black">Создать</button>
              </div>
            </UsMotion.form>
          </UsMotion.div>
        )}
      </UsAnim>
    </div>
  );
}

window.SurdisUsersPage = { UsersPage };
