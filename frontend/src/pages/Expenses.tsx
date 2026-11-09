/**
 * Expenses page: View all expenses with category filters.
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { transactionsApi } from '../api/client';
import { formatCurrency, formatDate, getCategoryLabel } from '../utils/currency';
import type { Transaction } from '../types';

const FILTERS = [
  { key: null, label: 'Todos' },
  { key: 'FIXED', label: '📌 Fijos' },
  { key: 'PERSONAL', label: '🛍️ Personales' },
  { key: 'TRANSFER', label: '🔄 Neutros' },
];

export default function Expenses() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const currencyCode = user?.currency_code || 'USD';

  useEffect(() => {
    const params: Record<string, string> = { type: 'EXPENSE' };
    if (filter) params.category = filter;
    transactionsApi.list(params)
      .then(setTransactions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">💸 Cargos / Gastos</h2>
      </div>

      <div className="filter-bar">
        {FILTERS.map(f => (
          <button
            key={f.key || 'all'}
            className={`filter-btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => { setLoading(true); setFilter(f.key); }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {transactions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💸</div>
          <div className="empty-state-text">Sin gastos registrados</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Monto</th>
                <th>Categoría</th>
                <th>Cuenta</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id}>
                  <td style={{ fontWeight: 500 }}>{tx.description}</td>
                  <td style={{ color: 'var(--color-expense)', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                    -{formatCurrency(tx.amount, currencyCode)}
                  </td>
                  <td>
                    <span
                      className={`category-badge category-badge-${(tx.category || 'pending').toLowerCase()}`}
                    >
                      {getCategoryLabel(tx.category)}
                    </span>
                  </td>
                  <td>
                    <span className="pending-card-account">
                      <span className="pending-card-account-dot" style={{ backgroundColor: tx.account_color || '#6366f1' }} />
                      {tx.account_name}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>{formatDate(tx.transaction_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
