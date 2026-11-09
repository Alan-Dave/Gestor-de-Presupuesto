/**
 * Dashboard page: KPI metrics + interactive pending transaction cards.
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi, transactionsApi } from '../api/client';
import { formatCurrency, formatDate, getCategoryLabel } from '../utils/currency';
import type { DashboardMetrics, Transaction } from '../types';

interface PendingCardProps {
  tx: Transaction;
  currencyCode: string;
  onClassify: (id: number, category: string) => void;
}

function PendingCard({ tx, currencyCode, onClassify }: PendingCardProps) {
  const [classifying, setClassifying] = useState(false);

  const handleClassify = (category: string) => {
    setClassifying(true);
    setTimeout(() => onClassify(tx.id, category), 350);
  };

  return (
    <div className={`pending-card ${classifying ? 'classifying' : ''}`}>
      <div className="pending-card-header">
        <span className="pending-card-desc">{tx.description}</span>
        <span className="pending-card-amount">
          -{formatCurrency(tx.amount, currencyCode)}
        </span>
      </div>
      <div className="pending-card-meta">
        <span className="pending-card-account">
          <span
            className="pending-card-account-dot"
            style={{ backgroundColor: tx.account_color || '#6366f1' }}
          />
          {tx.account_name || 'Cuenta'}
        </span>
        <span>{formatDate(tx.transaction_date)}</span>
      </div>
      <div className="pending-card-actions">
        <button className="cat-btn cat-btn-fixed" onClick={() => handleClassify('FIXED')}>
          📌 Fijo
        </button>
        <button className="cat-btn cat-btn-personal" onClick={() => handleClassify('PERSONAL')}>
          🛍️ Personal
        </button>
        <button className="cat-btn cat-btn-savings" onClick={() => handleClassify('SAVINGS')}>
          🏦 Ahorro
        </button>
        <button className="cat-btn cat-btn-transfer" onClick={() => handleClassify('TRANSFER')}>
          🔄 Transferencia
        </button>
        <button className="cat-btn cat-btn-deposit" onClick={() => handleClassify('DEPOSIT')}>
          💵 Depósito
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [pending, setPending] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const currencyCode = user?.currency_code || 'USD';

  const loadData = useCallback(async () => {
    try {
      const [m, p] = await Promise.all([
        dashboardApi.metrics(),
        transactionsApi.pending(),
      ]);
      setMetrics(m);
      setPending(p);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleClassify = async (id: number, category: string) => {
    try {
      await transactionsApi.classify(id, category);
      setPending(prev => prev.filter(tx => tx.id !== id));
      // Refresh metrics after classification
      const m = await dashboardApi.metrics();
      setMetrics(m);
    } catch (err) {
      console.error('Error classifying:', err);
    }
  };

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  return (
    <div>
      {/* KPI Metrics */}
      <div className="grid-metrics">
        <div className="metric-card">
          <div className="metric-card-icon" style={{ background: 'var(--gradient-primary-soft)', color: 'var(--text-accent)' }}>
            💰
          </div>
          <div className="metric-card-label">Liquidez Disponible</div>
          <div className="metric-card-value" style={{ color: 'var(--text-accent)' }}>
            {metrics ? formatCurrency(metrics.liquid_balance ?? metrics.total_balance, currencyCode) : '-'}
          </div>
          <div className="metric-card-sub">
            Patrimonio total: {metrics ? formatCurrency(metrics.total_balance, currencyCode) : '-'}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-icon" style={{ background: 'var(--color-income-bg)', color: 'var(--color-income)' }}>
            📈
          </div>
          <div className="metric-card-label">Ingresos del Mes</div>
          <div className="metric-card-value" style={{ color: 'var(--color-income)' }}>
            {metrics ? formatCurrency(metrics.total_income_month, currencyCode) : '-'}
          </div>
          <div className="metric-card-sub">entradas clasificadas</div>
        </div>

        <div className="metric-card">
          <div className="metric-card-icon" style={{ background: 'var(--color-expense-bg)', color: 'var(--color-expense)' }}>
            💸
          </div>
          <div className="metric-card-label">Gastos del Mes</div>
          <div className="metric-card-value" style={{ color: 'var(--color-expense)' }}>
            {metrics ? formatCurrency(metrics.total_expenses_month, currencyCode) : '-'}
          </div>
          <div className="metric-card-sub">
            {metrics && metrics.active_installments_monthly > 0
              ? `+ ${formatCurrency(metrics.active_installments_monthly, currencyCode)}/mes en cuotas`
              : 'gastos reales clasificados'}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-icon" style={{ background: 'var(--color-pending-bg)', color: 'var(--color-pending)' }}>
            📥
          </div>
          <div className="metric-card-label">Pendientes</div>
          <div className="metric-card-value" style={{ color: 'var(--color-pending)' }}>
            {pending.length}
          </div>
          <div className="metric-card-sub">
            {metrics && metrics.pending_amount > 0
              ? `~ ${formatCurrency(metrics.pending_amount, currencyCode)} sin clasificar`
              : 'movimientos al día'}
          </div>
        </div>
      </div>

      {/* Budget Progress */}
      {metrics && metrics.budget_summaries.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div className="section-header">
            <h2 className="section-title">📊 Presupuesto del Mes</h2>
          </div>
          <div className="grid-metrics" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {metrics.budget_summaries.map(b => {
              const pct = Math.min(b.month_progress_pct, 100);
              const barColor = pct < 60 ? 'var(--color-income)' : pct < 85 ? 'var(--color-fixed)' : 'var(--color-expense)';
              return (
                <div className="card" key={b.category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 600 }}>{getCategoryLabel(b.category)}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                      {b.month_progress_pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${pct}%`, background: barColor }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '13px', color: 'var(--text-tertiary)' }}>
                    <span>{formatCurrency(b.spent_this_month, currencyCode)} gastado</span>
                    <span>de {formatCurrency(b.monthly_limit, currencyCode)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending Transactions */}
      <div className="section-header">
        <h2 className="section-title">
          📥 Movimientos Pendientes
          <span className="section-count">({pending.length})</span>
        </h2>
      </div>

      {pending.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <div className="empty-state-text">¡Todo clasificado!</div>
          <div className="empty-state-sub">No hay movimientos pendientes por clasificar</div>
        </div>
      ) : (
        <div className="grid-cards">
          {pending.map(tx => (
            <PendingCard
              key={tx.id}
              tx={tx}
              currencyCode={currencyCode}
              onClassify={handleClassify}
            />
          ))}
        </div>
      )}
    </div>
  );
}
