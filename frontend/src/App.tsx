/**
 * Main App component: routing + layout.
 */
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { currenciesApi, transactionsApi } from './api/client';
import { setCurrencyCache } from './utils/currency';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Sidebar from './components/layout/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Pending from './pages/Pending';
import Expenses from './pages/Expenses';
import Income from './pages/Income';
import BudgetAnalysis from './pages/BudgetAnalysis';
import Accounts from './pages/Accounts';
import Settings from './pages/Settings';
import Installments from './pages/Installments';

/** Page title map */
const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/pending': 'Pendientes',
  '/expenses': 'Cargos / Gastos',
  '/income': 'Abonos / Ingresos',
  '/installments': 'Cuotas y Créditos',
  '/budget': 'Análisis de Presupuesto',
  '/accounts': 'Cuentas y Saldos',
  '/settings': 'Reglas y Ajustes',
};

function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  // Load currencies cache on mount
  useEffect(() => {
    currenciesApi.list().then(setCurrencyCache).catch(console.error);
  }, []);

  // Track pending count
  useEffect(() => {
    if (user) {
      transactionsApi.pending()
        .then(txs => setPendingCount(txs.length))
        .catch(console.error);
    }
  }, [user, location.pathname]);

  const pageTitle = PAGE_TITLES[location.pathname] || 'FinFlow';

  return (
    <div className="app-layout">
      <Sidebar pendingCount={pendingCount} />
      <div className="topbar">
        <h1 className="topbar-title">{pageTitle}</h1>
        <div className="topbar-right">
          <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
            {user?.currency_code}
          </span>
        </div>
      </div>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pending" element={<Pending />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/income" element={<Income />} />
          <Route path="/installments" element={<Installments />} />
          <Route path="/budget" element={<BudgetAnalysis />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
