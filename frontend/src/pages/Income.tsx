/**
 * Income page: View all income/credit transactions.
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { transactionsApi } from '../api/client';
import { formatCurrency, formatDate } from '../utils/currency';
import type { Transaction } from '../types';

export default function Income() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const currencyCode = user?.currency_code || 'USD';

  useEffect(() => {
    transactionsApi.list({ type: 'INCOME' })
      .then(setTransactions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">💰 Abonos / Ingresos</h2>
      </div>

      {transactions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💰</div>
          <div className="empty-state-text">Sin ingresos registrados</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Monto</th>
                <th>Cuenta</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id}>
                  <td style={{ fontWeight: 500 }}>{tx.description}</td>
                  <td style={{ color: 'var(--color-income)', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                    +{formatCurrency(tx.amount, currencyCode)}
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
