import {
  House,
  CalendarDays,
  Users,
  SquareCheck,
  Image,
  Settings
} from "lucide-react";

function Sidebar({ activePage = "Overview", onNavigate }) {

  const menuItems = [
    { name: "Overview", icon: House },
    { name: "Events", icon: CalendarDays },
    { name: "Coordinators", icon: Users },
    { name: "Tasks", icon: SquareCheck },
    { name: "Media", icon: Image },
    { name: "Settings", icon: Settings }
  ];

  return (
    <aside className="dashboard-sidebar">

      {/* Estrade Logo */}

      <div className="sidebar-brand">
        <h1>estrade</h1>
        <p>Faculty workspace</p>
      </div>

      {/* Navigation Menu */}

      <nav className="sidebar-navigation">

        {menuItems.map((item) => {

          const Icon = item.icon;

          return (
            <button
              key={item.name}
              type="button"
              className={`sidebar-link ${
                activePage === item.name ? "selected" : ""
              }`}
              onClick={() => onNavigate?.(item.name)}
            >
              <Icon size={20} strokeWidth={1.6} />

              <span>{item.name}</span>
            </button>
          );

        })}

      </nav>

      {/* Sidebar Footer */}

      <div className="sidebar-bottom">
        Behind every great event.
      </div>

    </aside>
  );
}

export default Sidebar;