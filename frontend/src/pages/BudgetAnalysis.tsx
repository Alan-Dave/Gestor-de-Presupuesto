/**
 * Budget Analysis page: Monthly and annual budget progress visualization.
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { budgetsApi } from '../api/client';
import { formatCurrency, getCategoryLabel, MONTH_NAMES } from '../utils/currency';
import type { BudgetSummary } from '../types';

export default function BudgetAnalysis() {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<BudgetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const currencyCode = user?.currency_code || 'USD';

  useEffect(() => {
    setLoading(true);
    budgetsApi.summary(selectedYear, selectedMonth)
      .then(setSummaries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedYear, selectedMonth]);

  const getBarColor = (pct: number) => {
    if (pct < 50) return 'linear-gradient(90deg, #22c55e, #4ade80)';
    if (pct < 75) return 'linear-gradient(90deg, #eab308, #facc15)';
    if (pct < 90) return 'linear-gradient(90deg, #f97316, #fb923c)';
    return 'linear-gradient(90deg, #ef4444, #f87171)';
  };

  const getCategoryIcon = (cat: string) => {
    const icons: Record<string, string> = { FIXED: '📌', PERSONAL: '🛍️', SAVINGS: '🏦' };
    return icons[cat] || '📊';
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">📈 Análisis de Presupuesto</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={i} value={i + 1}>{name}</option>
            ))}
          </select>
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {summaries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-text">Sin presupuestos definidos</div>
          <div className="empty-state-sub">Configura tus presupuestos mensuales desde Reglas y Ajustes</div>
        </div>
      ) : (
        <>
          {/* Monthly View */}
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-secondary)' }}>
            📅 Progreso Mensual — {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
            {summaries.map(b => {
              const pct = Math.min(b.month_progress_pct, 100);
              return (
                <div className="card" key={b.category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '24px' }}>{getCategoryIcon(b.category)}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '16px' }}>{getCategoryLabel(b.category)}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                          {formatCurrency(b.spent_this_month, currencyCode)} de {formatCurrency(b.monthly_limit, currencyCode)}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: '28px',
                      fontWeight: 800,
                      color: pct >= 90 ? 'var(--color-expense)' : pct >= 75 ? 'var(--color-fixed)' : 'var(--color-income)',
                    }}>
                      {b.month_progress_pct.toFixed(0)}%
                    </div>
                  </div>
                  <div className="progress-bar-container" style={{ height: '14px', borderRadius: '7px' }}>
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${pct}%`, background: getBarColor(b.month_progress_pct), borderRadius: '7px' }}
                    />
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '10px',
                    fontSize: '12px',
                    color: 'var(--text-tertiary)',
                  }}>
                    <span>Disponible: {formatCurrency(Math.max(0, b.monthly_limit - b.spent_this_month), currencyCode)}</span>
                    {b.month_progress_pct > 100 && (
                      <span style={{ color: 'var(--color-expense)', fontWeight: 600 }}>
                        ⚠️ Excedido por {formatCurrency(b.spent_this_month - b.monthly_limit, currencyCode)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Annual View */}
          {summaries.some(b => b.annual_limit) && (
            <>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-secondary)' }}>
                📆 Progreso Anual — {selectedYear}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {summaries.filter(b => b.annual_limit).map(b => {
                  const pct = Math.min(b.year_progress_pct || 0, 100);
                  return (
                    <div className="card" key={`annual-${b.category}`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '20px' }}>{getCategoryIcon(b.category)}</span>
                          <span style={{ fontWeight: 600 }}>{getCategoryLabel(b.category)}</span>
                        </div>
                        <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                          {(b.year_progress_pct || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="progress-bar-container">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${pct}%`, background: getBarColor(b.year_progress_pct || 0) }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        <span>{formatCurrency(b.spent_this_year, currencyCode)} gastado</span>
                        <span>de {formatCurrency(b.annual_limit || 0, currencyCode)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
