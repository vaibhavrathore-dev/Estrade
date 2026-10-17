import { House, CalendarDays, UsersRound, Building2, Images, Award, Settings2, ArrowUpRight } from "lucide-react";
import LogoutButton from "./LogoutButton";

const navigation = [
  { name: "Overview", icon: House },
  { name: "Events", icon: CalendarDays },
  { name: "My Registrations", icon: CalendarDays },
  { name: "My Assignments", icon: UsersRound },
  { name: "Committees", icon: Building2 },
  { name: "Coordinators", icon: UsersRound },
  { name: "Registrations", icon: UsersRound },
  { name: "QR Attendance", icon: CalendarDays },
  { name: "Participation Approval", icon: UsersRound },
  { name: "Certificate Studio", icon: Award },
  { name: "Media", icon: Images },
  { name: "Certificates", icon: Award },
  { name: "Settings", icon: Settings2 },
];

export default function Sidebar({ activePage = "Overview", onNavigate, role = "Campus", previewMode = false, canManage = false }) {
  const visible = navigation.filter(item => (canManage || !["Media", "Coordinators", "Registrations", "QR Attendance", "Participation Approval", "Certificate Studio"].includes(item.name)) && (role === "student" || item.name !== "My Registrations"));
  return (
    <aside className="dashboard-sidebar" aria-label="Workspace navigation">
      <div className="sidebar-brand">
        <span className="estrade-sidebar-kicker">THE EVENT STUDIO</span>
        <h1>estrade<span>.</span></h1>
        <p>{role || "Campus"} workspace</p>
      </div>
      <div className="estrade-sidebar-divider">WORKSPACE</div>
      <nav className="sidebar-navigation" aria-label="Dashboard pages">
        {visible.map(({ name, icon: Icon }) => (
          <button
            key={name}
            type="button"
            title={name}
            className={`sidebar-link ${activePage === name ? "selected" : ""}`}
            aria-current={activePage === name ? "page" : undefined}
            onClick={() => onNavigate?.(name)}
          >
            <Icon size={19} strokeWidth={1.65} aria-hidden="true" />
            <span>{name}</span>
            {activePage === name && <ArrowUpRight size={14} className="estrade-nav-arrow" aria-hidden="true" />}
          </button>
        ))}
      </nav>
      <label className="mobile-workspace-select">Go to workspace section<select value={activePage} onChange={e => onNavigate?.(e.target.value)}>{visible.map(item => <option key={item.name}>{item.name}</option>)}</select></label>
      <div className="estrade-sidebar-spacer" />
      <div className="estrade-sidebar-footnote">Beautiful events.<br/>Better organized.</div>
      {previewMode ? <div className="estrade-preview-sidebar-foot">DESIGN PREVIEW · SAMPLE DATA</div> : <div className="sidebar-logout"><LogoutButton /></div>}
      <div className="sidebar-bottom">Behind every great event.</div>
    </aside>
  );
}
