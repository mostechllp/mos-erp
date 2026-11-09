import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { DEMO_ROLES, getRole } from "./roles";
import { DEMO_MODE, writeSession, getStoredRoleId } from "./demoSession";
import { setDemoSession } from "../store/slices/authSlice";

/**
 * Header dropdown used only in demo mode. Picking a role swaps the logged-in
 * user in Redux (type, permissions, sidebar_modules) so the existing Sidebar,
 * ProtectedRoute and route guard re-render for that role immediately.
 */
const RoleSwitcher = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (!DEMO_MODE) return null;

  const current =
    DEMO_ROLES.find((r) => r.user.role?.name === user?.role?.name) || getRole(getStoredRoleId());

  const choose = (role) => {
    setOpen(false);
    if (role.id === current.id) return;
    const { user: next, token } = writeSession(role.id);
    dispatch(setDemoSession({ user: next, token }));
    // let the auth change settle (route guards may rewrite the URL) before landing on the role home
    setTimeout(() => navigate(role.home, { replace: true }), 0);
    toast.success(`Viewing as ${role.label}`, { id: "role-switch" });
  };

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 h-9 md:h-10 pl-2 pr-3 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:ring-2 hover:ring-green-500 transition-all"
        aria-label="Switch demo role"
        title="Demo: switch role"
      >
        <span
          className="w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-white text-[11px] flex-shrink-0"
          style={{ background: current.color }}
        >
          <i className={`fas ${current.icon}`}></i>
        </span>
        <span className="hidden sm:flex flex-col items-start leading-tight">
          <span className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Demo role</span>
          <span className="text-xs font-semibold text-gray-800 dark:text-gray-100 whitespace-nowrap">{current.label}</span>
        </span>
        <i className={`fas fa-chevron-${open ? "up" : "down"} text-[10px] text-gray-500 dark:text-gray-300`}></i>
      </button>

      {open && (
        <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-16 sm:top-12 sm:w-80 max-w-[calc(100vw-24px)] bg-white dark:bg-gray-800 rounded-2xl shadow-soft-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Switch role</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Sidebar, pages and actions follow the selected role.</p>
          </div>
          <div className="max-h-[60vh] overflow-y-auto py-1">
            {DEMO_ROLES.map((r) => {
              const active = r.id === current.id;
              return (
                <button
                  key={r.id}
                  onClick={() => choose(r)}
                  className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    active ? "bg-green-50 dark:bg-green-900/20" : ""
                  }`}
                >
                  <span
                    className="mt-0.5 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0"
                    style={{ background: r.color }}
                  >
                    <i className={`fas ${r.icon}`}></i>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{r.label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {r.suite}
                      </span>
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 leading-snug">{r.description}</span>
                    <span className="block text-[10px] mt-0.5 text-gray-400">
                      {r.type === "admin" ? "Admin portal" : "Employee portal"} · {r.user.name}
                    </span>
                  </span>
                  {active && <i className="fas fa-check text-green-500 text-xs mt-1"></i>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleSwitcher;
