/**
 * Accounts page: List accounts with live balances + create new accounts.
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { accountsApi } from '../api/client';
import { formatCurrency, getAccountTypeLabel, ACCOUNT_ICONS } from '../utils/currency';
import type { Account, AccountCreateData } from '../types';

const ACCOUNT_COLORS = ['#6366f1', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Cuenta Corriente' },
  { value: 'vista', label: 'Cuenta Vista' },
  { value: 'rut', label: 'Cuenta RUT' },
  { value: 'savings', label: 'Cuenta de Ahorro' },
  { value: 'wallet', label: 'Billetera Digital' },
  { value: 'credit', label: 'Tarjeta de Crédito' },
];

export default function Accounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState<AccountCreateData>({
    name: '', type: 'checking', initial_balance: 0, icon: 'wallet', color: '#6366f1',
  });
  const currencyCode = user?.currency_code || 'USD';

  const loadAccounts = () => {
    accountsApi.list()
      .then(setAccounts)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAccounts(); }, []);

  const handleOpenCreate = () => {
    setEditingAccount(null);
    setFormData({ name: '', type: 'checking', initial_balance: 0, icon: 'wallet', color: '#6366f1' });
    setShowForm(true);
  };

  const handleOpenEdit = (acc: Account) => {
    setEditingAccount(acc);
    setFormData({
      name: acc.name,
      type: acc.type,
      initial_balance: acc.initial_balance,
      icon: acc.icon || 'wallet',
      color: acc.color || '#6366f1',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        await accountsApi.update(editingAccount.id, formData);
      } else {
        await accountsApi.create(formData);
      }
      setShowForm(false);
      setEditingAccount(null);
      setFormData({ name: '', type: 'checking', initial_balance: 0, icon: 'wallet', color: '#6366f1' });
      loadAccounts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta cuenta y todas sus transacciones?')) return;
    try {
      await accountsApi.delete(id);
      loadAccounts();
    } catch (err) {
      console.error(err);
    }
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.current_balance, 0);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">🏦 Cuentas y Saldos</h2>
        <button className="btn btn-primary btn-sm" onClick={handleOpenCreate}>
          + Nueva Cuenta
        </button>
      </div>

      {/* Total Balance Card */}
      <div className="metric-card" style={{ marginBottom: '24px', textAlign: 'center' }}>
        <div className="metric-card-label">Patrimonio Total</div>
        <div className="metric-card-value" style={{
          fontSize: '36px',
          background: 'var(--gradient-primary)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          {formatCurrency(totalBalance, currencyCode)}
        </div>
        <div className="metric-card-sub">{accounts.length} cuentas registradas</div>
      </div>

      {/* Account Cards */}
      <div className="grid-cards">
        {accounts.map(account => (
          <div className="account-card" key={account.id} style={{ ['--acct-color' as any]: account.color }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: account.color || '#6366f1' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>
                  {ACCOUNT_ICONS[account.icon || 'wallet'] || '💳'}
                </div>
                <div className="account-card-name">{account.name}</div>
                <div className="account-card-type">{getAccountTypeLabel(account.type)}</div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                  title="Editar cuenta"
                  onClick={() => handleOpenEdit(account)}
                >
                  ✏️ Editar
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                  title="Eliminar cuenta"
                  onClick={() => handleDelete(account.id)}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="account-card-balance" style={{ color: account.current_balance >= 0 ? 'var(--color-income)' : 'var(--color-expense)' }}>
              {formatCurrency(account.current_balance, currencyCode)}
            </div>
            <div className="account-card-initial">
              Saldo inicial: {formatCurrency(account.initial_balance, currencyCode)}
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input
                  className="form-input"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Mercado Pago"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select
                  className="form-select"
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                >
                  {ACCOUNT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Saldo Inicial</label>
                <input
                  className="form-input"
                  type="number"
                  value={formData.initial_balance}
                  onChange={e => setFormData({ ...formData, initial_balance: Number(e.target.value) })}
                  step="1"
                />
                {editingAccount && (
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '6px', lineHeight: '1.4' }}>
                    💡 Al cambiar el saldo inicial se recalculará tu saldo actual automáticamente sin perder tus movimientos registrados.
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Ícono</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {Object.entries(ACCOUNT_ICONS).map(([key, icon]) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setFormData({ ...formData, icon: key })}
                      style={{
                        padding: '6px 12px',
                        fontSize: '20px',
                        borderRadius: '8px',
                        border: formData.icon === key ? '2px solid var(--text-accent)' : '1px solid rgba(255,255,255,0.1)',
                        background: formData.icon === key ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Color</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {ACCOUNT_COLORS.map(c => (
                    <div
                      key={c}
                      onClick={() => setFormData({ ...formData, color: c })}
                      style={{
                        width: '32px', height: '32px', borderRadius: '50%', background: c, cursor: 'pointer',
                        border: formData.color === c ? '3px solid white' : '3px solid transparent',
                        transition: 'border-color 0.15s',
                      }}
                    />
                  ))}
                </div>
              </div>
              <button className="btn btn-primary btn-block" type="submit">
                {editingAccount ? 'Guardar Cambios' : 'Crear Cuenta'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
