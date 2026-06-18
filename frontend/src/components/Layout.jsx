import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";

const LINKS = [
  { to: "/", label: "Dashboard", roles: ["admin", "professor"] },
  { to: "/students", label: "Students", roles: ["admin"] },
  { to: "/professors", label: "Professors", roles: ["admin"] },
  { to: "/schedule", label: "Schedule", roles: ["admin"] },
  { to: "/attendance", label: "Attendance", roles: ["admin", "professor"] },
  { to: "/live", label: "Live", roles: ["admin", "professor"] },
];

export default function Layout() {
  const { role, username, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">Muster</div>
        <nav>
          {LINKS.filter((link) => link.roles.includes(role)).map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === "/"}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user">
            <strong>{username}</strong>
            <span>{role}</span>
          </div>
          <button className="ghost" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
