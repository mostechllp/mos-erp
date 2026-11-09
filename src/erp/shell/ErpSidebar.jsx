import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { buildModules, findByPath } from "./modules";
import { usePins, togglePin, trackVisit } from "./usePins";
import { useApprovals } from "./useApprovals";

const W_OPEN = 272;
const W_RAIL = 76;
const initials = (n = "") => n.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase();

/**
 * ERP sidebar: persistent app switcher -> module-scoped, grouped navigation,
 * with Home, Approvals, pinned and recent screens. Replaces the flat icon rail.
 */
const ErpSidebar = ({ isOpen, setIsOpen }) => {
  const { user } = useSelector((s) => s.auth);
  const isEmp = user?.type !== "admin";
  const base = isEmp ? "/employee" : "/admin";
  const location = useLocation();
  const navigate = useNavigate();
  const modules = useMemo(() => buildModules(user), [user]);
  const current = useMemo(() => findByPath(modules, location.pathname), [modules, location.pathname]);
  const { pins, recents } = usePins();
  const { items: inbox } = useApprovals(user);

  const [isMobile, setIsMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("erp-sidebar-collapsed") === "1");
  const [activeId, setActiveId] = useState(null);
  const [switcher, setSwitcher] = useState(false);
  const [closedGroups, setClosedGroups] = useState({});
  const switcherRef = useRef(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Layouts read this variable to offset their content.
  useEffect(() => {
    const w = isMobile ? 0 : collapsed ? W_RAIL : W_OPEN;
    document.documentElement.style.setProperty("--erp-sidebar-w", `${w}px`);
  }, [collapsed, isMobile]);

  useEffect(() => { localStorage.setItem("erp-sidebar-collapsed", collapsed ? "1" : "0"); }, [collapsed]);

  // Follow the URL; remember the page for "Recent".
  useEffect(() => {
    if (current) { setActiveId(current.moduleId); trackVisit({ to: current.to, label: current.label, icon: current.icon, moduleLabel: current.moduleLabel }); }
  }, [current]);
  useEffect(() => { if (modules[0]) setActiveId((id) => id || modules[0].id); }, [modules]);
  useEffect(() => { if (isMobile) setIsOpen(false); }, [location.pathname]); // eslint-disable-line

  useEffect(() => {
    const close = (e) => switcherRef.current && !switcherRef.current.contains(e.target) && setSwitcher(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => { setActiveId(current?.moduleId || null); }, [user?.role?.name]); // eslint-disable-line

  const active = modules.find((m) => m.id === activeId) || modules[0];
  const rail = !isMobile && collapsed;
  const pending = inbox.filter((i) => i.actionable || i.urgent).length;

  const openModule = (m) => {
    setActiveId(m.id); setSwitcher(false);
    navigate(m.items[0].to);
  };
  const groupOpen = (g) => {
    const key = `${active.id}:${g.label}`;
    if (key in closedGroups) return !closedGroups[key];
    return g.items.length <= 6 || g.items.some((i) => i.to === current?.to);
  };

  const linkCls = ({ isActive }) =>
    `group/item relative flex items-center gap-3 rounded-lg text-sm transition-colors ${rail ? "justify-center h-10 w-10 mx-auto" : "px-3 py-2"} ${
      isActive ? "bg-green-500/15 text-green-400 font-semibold" : "text-gray-300 hover:bg-white/5 hover:text-white"
    }`;

  const Item = ({ item }) => {
    const pinned = pins.some((p) => p.to === item.to);
    return (
      <div className="relative">
        <NavLink to={item.to} end={false} className={linkCls} title={rail ? item.label : undefined}>
          {({ isActive }) => (
            <>
              {isActive && !rail && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-green-400" />}
              <i className={`fas ${item.icon} w-4 text-center text-[13px]`}></i>
              {!rail && <span className="flex-1 truncate">{item.label}</span>}
            </>
          )}
        </NavLink>
        {!rail && (
          <button
            onClick={() => togglePin({ to: item.to, label: item.label, icon: item.icon, moduleLabel: item.moduleLabel })}
            className={`absolute right-2 top-1/2 -translate-y-1/2 text-[11px] ${pinned ? "text-amber-400" : "text-gray-500 opacity-0 group-hover/item:opacity-100 hover:text-amber-400"}`}
            title={pinned ? "Unpin" : "Pin to top"}
          >
            <i className={`${pinned ? "fas" : "far"} fa-star`}></i>
          </button>
        )}
      </div>
    );
  };

  const Heading = ({ children }) =>
    rail ? <div className="my-2 mx-3 border-t border-white/10" /> : (
      <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">{children}</p>
    );

  const width = isMobile ? 288 : collapsed ? W_RAIL : W_OPEN;

  return (
    <>
      {isMobile && isOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)} />}
      <aside
        className="fixed top-0 left-0 h-full bg-gray-900 z-50 flex flex-col transition-all duration-300 border-r border-white/5"
        style={{ width, transform: isMobile && !isOpen ? "translateX(-100%)" : "none" }}
      >
        {/* Brand + collapse */}
        <div className={`flex items-center h-[72px] shrink-0 border-b border-white/10 ${rail ? "justify-center" : "px-4 gap-3"}`}>
          <button onClick={() => navigate(`${base}/home`)} className="flex items-center gap-3 min-w-0" title="ERP Home">
            <img src="/erp-logo.svg" alt="MOS ERP" className="w-9 h-9 rounded-lg shrink-0" />
            {!rail && (
              <span className="text-left leading-tight">
                <span className="block text-white font-bold tracking-wide">MOS ERP</span>
                <span className="block text-[10px] text-gray-400">Gulf Horizon Group</span>
              </span>
            )}
          </button>
          {!rail && !isMobile && (
            <button onClick={() => setCollapsed(true)} className="ml-auto text-gray-400 hover:text-white p-1" title="Collapse sidebar">
              <i className="fas fa-angles-left text-xs"></i>
            </button>
          )}
        </div>

        {/* App switcher */}
        <div className={`relative shrink-0 ${rail ? "px-2 py-3" : "px-3 py-3"}`} ref={switcherRef}>
          <button
            onClick={() => (rail ? setCollapsed(false) : setSwitcher((s) => !s))}
            className={`w-full flex items-center gap-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors ${rail ? "justify-center h-11" : "px-3 py-2.5"}`}
            title="Switch app"
          >
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm shrink-0" style={{ background: active?.color }}>
              <i className={`fas ${active?.icon}`}></i>
            </span>
            {!rail && (
              <>
                <span className="flex-1 text-left leading-tight min-w-0">
                  <span className="block text-[10px] uppercase tracking-wide text-gray-400">App</span>
                  <span className="block text-sm font-semibold text-white truncate">{active?.label}</span>
                </span>
                <i className="fas fa-grip text-gray-400 text-xs"></i>
              </>
            )}
          </button>

          {switcher && (
            <div className="absolute left-3 right-3 top-[64px] z-50 bg-gray-800 border border-white/10 rounded-2xl shadow-2xl p-3">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 px-1 pb-2">Your apps</p>
              <div className="grid grid-cols-2 gap-2">
                {modules.map((m) => (
                  <button key={m.id} onClick={() => openModule(m)}
                    className={`flex flex-col items-start gap-2 p-3 rounded-xl text-left transition-colors ${m.id === active?.id ? "bg-white/10 ring-1 ring-green-500/50" : "bg-white/5 hover:bg-white/10"}`}>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm" style={{ background: m.color }}>
                      <i className={`fas ${m.icon}`}></i>
                    </span>
                    <span className="text-xs font-semibold text-white leading-tight">{m.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => { setSwitcher(false); navigate(`${base}/home`); }}
                className="mt-2 w-full text-xs text-green-400 hover:text-green-300 py-2 rounded-lg hover:bg-white/5">
                <i className="fas fa-house mr-2"></i>Open ERP Home
              </button>
            </div>
          )}
        </div>

        {/* Scrollable nav */}
        <nav className={`flex-1 overflow-y-auto pb-4 ${rail ? "px-2" : "px-3"} [scrollbar-width:thin]`}>
          <div className="space-y-0.5">
            <NavLink to={`${base}/home`} className={linkCls} title={rail ? "Home" : undefined}>
              <i className="fas fa-house w-4 text-center text-[13px]"></i>{!rail && <span className="flex-1">Home</span>}
            </NavLink>
            <NavLink to={`${base}/approvals`} className={linkCls} title={rail ? "Approvals & Inbox" : undefined}>
              <i className="fas fa-inbox w-4 text-center text-[13px]"></i>
              {!rail && <span className="flex-1">Approvals & Inbox</span>}
              {pending > 0 && (
                <span className={`text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center ${rail ? "absolute -top-1 -right-1" : ""}`}>{pending}</span>
              )}
            </NavLink>
          </div>

          {pins.length > 0 && (
            <>
              <Heading>Pinned</Heading>
              <div className="space-y-0.5">{pins.map((p) => <Item key={p.to} item={{ ...p }} />)}</div>
            </>
          )}

          {active?.groups.map((g) => {
            const open = rail || groupOpen(g);
            return (
              <div key={g.label}>
                {rail ? <Heading>{g.label}</Heading> : (
                  <button onClick={() => setClosedGroups((c) => ({ ...c, [`${active.id}:${g.label}`]: open }))}
                    className="w-full flex items-center justify-between px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-gray-300">
                    {g.label}<i className={`fas fa-chevron-${open ? "down" : "right"} text-[8px]`}></i>
                  </button>
                )}
                {open && <div className="space-y-0.5">{g.items.map((i) => <Item key={i.slug} item={i} />)}</div>}
              </div>
            );
          })}

          {!rail && recents.length > 0 && (
            <>
              <Heading>Recent</Heading>
              <div className="space-y-0.5">
                {recents.slice(0, 4).map((r) => (
                  <NavLink key={r.to} to={r.to} className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5">
                    <i className="fas fa-clock-rotate-left w-4 text-center text-[11px]"></i>
                    <span className="truncate flex-1">{r.label}</span>
                    <span className="text-[9px] text-gray-600">{r.moduleLabel}</span>
                  </NavLink>
                ))}
              </div>
            </>
          )}
        </nav>

        {/* User card */}
        <div className={`shrink-0 border-t border-white/10 ${rail ? "p-2" : "p-3"}`}>
          {rail ? (
            <button onClick={() => setCollapsed(false)} className="w-full flex justify-center text-gray-400 hover:text-white py-2" title="Expand sidebar">
              <i className="fas fa-angles-right text-xs"></i>
            </button>
          ) : (
            <div className="flex items-center gap-3 px-2 py-1">
              <span className="w-9 h-9 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">{initials(user?.name || user?.username)}</span>
              <span className="leading-tight min-w-0">
                <span className="block text-sm text-white font-medium truncate">{user?.name || user?.username}</span>
                <span className="block text-[11px] text-gray-400 truncate">{user?.role?.name || user?.type}</span>
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default ErpSidebar;
