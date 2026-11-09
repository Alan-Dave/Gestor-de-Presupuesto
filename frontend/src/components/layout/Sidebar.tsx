/**
 * Sidebar navigation component.
 */
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  pendingCount: number;
}

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/pending', label: 'Pendientes', icon: '📥', showBadge: true },
  { path: '/expenses', label: 'Cargos / Gastos', icon: '💸' },
  { path: '/income', label: 'Abonos / Ingresos', icon: '💰' },
  { path: '/installments', label: 'Cuotas y Créditos', icon: '💳' },
  { path: '/budget', label: 'Análisis Presupuesto', icon: '📈' },
  { path: '/accounts', label: 'Cuentas y Saldos', icon: '🏦' },
  { path: '/settings', label: 'Reglas y Ajustes', icon: '⚙️' },
];

export default function Sidebar({ pendingCount }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">💎</div>
        <span className="sidebar-logo-text">FinFlow</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.showBadge && pendingCount > 0 && (
              <span className="nav-badge">{pendingCount}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.username}</div>
            <div className="sidebar-user-email">{user.email}</div>
          </div>
          <button className="sidebar-logout-btn" onClick={logout} title="Cerrar sesión">
            🚪
          </button>
        </div>
      )}
    </aside>
  );
}
