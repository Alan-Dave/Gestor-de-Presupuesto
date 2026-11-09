/**
 * Pending page: Inbox-style batch classification of pending transactions.
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { transactionsApi, accountsApi } from '../api/client';
import { formatCurrency, formatDate } from '../utils/currency';
import type { Transaction, Account } from '../types';

export default function Pending() {
  const { user } = useAuth();
  const [pending, setPending] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const currencyCode = user?.currency_code || 'USD';

  useEffect(() => {
    Promise.all([
      transactionsApi.pending(),
      accountsApi.list(),
    ])
      .then(([p, a]) => {
        setPending(p);
        setAccounts(a);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleClassify = async (id: number, category: string) => {
    try {
      await transactionsApi.classify(id, category);
      setPending(prev => prev.filter(tx => tx.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReassign = async (id: number, newAccountId: number) => {
    try {
      const updated = await transactionsApi.reassign(id, newAccountId);
      setPending(prev => prev.map(tx => tx.id === id ? updated : tx));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClassifyAll = async (category: string) => {
    for (const tx of pending) {
      await transactionsApi.classify(tx.id, category);
    }
    setPending([]);
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">📥 Bandeja de Pendientes <span className="section-count">({pending.length})</span></h2>
        {pending.length > 1 && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-sm btn-secondary" onClick={() => handleClassifyAll('PERSONAL')}>
              Clasificar todos como Personal
            </button>
          </div>
        )}
      </div>

      {pending.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <div className="empty-state-text">¡Bandeja vacía!</div>
          <div className="empty-state-sub">Todos los movimientos están clasificados</div>
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
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pending.map(tx => (
                <tr key={tx.id}>
                  <td style={{ fontWeight: 600 }}>{tx.description}</td>
                  <td style={{ color: 'var(--color-expense)', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                    -{formatCurrency(tx.amount, currencyCode)}
                  </td>
                  <td>
                    <select
                      className="form-select"
                      style={{
                        padding: '4px 8px',
                        fontSize: '13px',
                        width: 'auto',
                        minWidth: '130px',
                        borderLeft: `4px solid ${tx.account_color || '#6366f1'}`,
                      }}
                      value={tx.account_id}
                      onChange={e => handleReassign(tx.id, Number(e.target.value))}
                    >
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>{formatDate(tx.transaction_date)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="cat-btn cat-btn-fixed" onClick={() => handleClassify(tx.id, 'FIXED')}>📌 Fijo</button>
                      <button className="cat-btn cat-btn-personal" onClick={() => handleClassify(tx.id, 'PERSONAL')}>🛍️ Personal</button>
                      <button className="cat-btn cat-btn-savings" onClick={() => handleClassify(tx.id, 'SAVINGS')}>🏦 Ahorro</button>
                      <button className="cat-btn cat-btn-transfer" onClick={() => handleClassify(tx.id, 'TRANSFER')}>🔄 Transf.</button>
                      <button className="cat-btn cat-btn-deposit" onClick={() => handleClassify(tx.id, 'DEPOSIT')}>💵 Depósito</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
