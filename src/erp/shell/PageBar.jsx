import { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { buildModules, findByPath } from "./modules";
import { usePins, togglePin } from "./usePins";

const prettify = (s) => s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Breadcrumb + context bar shown above every screen (module › group › page › record). */
const PageBar = () => {
  const { user } = useSelector((s) => s.auth);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { pins } = usePins();
  const modules = useMemo(() => buildModules(user), [user]);
  const base = user?.type !== "admin" ? "/employee" : "/admin";
  const match = findByPath(modules, pathname);

  if (/\/(home|approvals)$/.test(pathname)) return null;
  const crumbs = [{ label: "Home", to: `${base}/home` }];
  if (match) {
    crumbs.push({ label: match.moduleLabel });
    if (match.groupLabel && match.groupLabel !== "Overview") crumbs.push({ label: match.groupLabel });
    const rest = pathname.slice(match.to.length).split("/").filter(Boolean);
    crumbs.push({ label: match.label, to: rest.length ? match.to : undefined });
    if (rest.length) {
      const tail = rest.filter((x) => !/^\d+$/.test(x)).map(prettify).join(" › ");
      crumbs.push({ label: tail || "Details" });
    }
  } else {
    const last = pathname.split("/").filter(Boolean).slice(1).map(prettify).join(" › ");
    if (last) crumbs.push({ label: last });
  }
  const pinned = match && pins.some((p) => p.to === match.to);

  return (
    <div className="flex items-center gap-3 mb-4 text-xs text-gray-500 dark:text-gray-400">
      <button onClick={() => navigate(-1)} className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center" title="Back">
        <i className="fas fa-arrow-left text-[11px]"></i>
      </button>
      <nav className="flex items-center flex-wrap gap-1.5 min-w-0">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <i className="fas fa-chevron-right text-[8px] text-gray-400"></i>}
            {c.to ? <Link to={c.to} className="hover:text-green-600">{c.label}</Link>
              : <span className={i === crumbs.length - 1 ? "font-semibold text-gray-800 dark:text-gray-100" : ""}>{c.label}</span>}
          </span>
        ))}
      </nav>
      {match && (
        <button onClick={() => togglePin({ to: match.to, label: match.label, icon: match.icon, moduleLabel: match.moduleLabel })}
          className={`ml-auto flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${pinned ? "text-amber-500" : ""}`}>
          <i className={`${pinned ? "fas" : "far"} fa-star`}></i><span className="hidden sm:inline">{pinned ? "Pinned" : "Pin"}</span>
        </button>
      )}
    </div>
  );
};

export default PageBar;
