/**
 * Settings page: Manage categorization rules + create budgets + ingest transactions.
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  rulesApi, budgetsApi, transactionsApi, accountsApi, emailApi
} from '../api/client';
import { getCategoryLabel } from '../utils/currency';
import type { Rule, Account, EmailIntegration } from '../types';

const CATEGORIES = [
  { value: 'FIXED', label: '📌 Gasto Fijo' },
  { value: 'PERSONAL', label: '🛍️ Gasto Personal' },
  { value: 'SAVINGS', label: '🏦 Ahorro' },
];

export default function Settings() {
  const { user } = useAuth();
  const [rules, setRules] = useState<Rule[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Rule form
  const [newKeyword, setNewKeyword] = useState('');
  const [newCategory, setNewCategory] = useState('FIXED');

  // Budget form
  const [budgetCat, setBudgetCat] = useState('FIXED');
  const [monthlyLimit, setMonthlyLimit] = useState(0);
  const [annualLimit, setAnnualLimit] = useState(0);

  // Transaction form
  const [txAccountId, setTxAccountId] = useState<number>(0);
  const [txType, setTxType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [txAmount, setTxAmount] = useState(0);
  const [txDesc, setTxDesc] = useState('');
  const [txDate, setTxDate] = useState('');

  // Transfer form
  const [tfFrom, setTfFrom] = useState<number>(0);
  const [tfTo, setTfTo] = useState<number>(0);
  const [tfAmount, setTfAmount] = useState(0);
  const [tfDesc, setTfDesc] = useState('Transferencia interna');

  // Email Integration form
  const [emailConfig, setEmailConfig] = useState<EmailIntegration | null>(null);
  const [appPassword, setAppPassword] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const [feedback, setFeedback] = useState('');

  const loadData = async () => {
    try {
      const [r, a] = await Promise.all([rulesApi.list(), accountsApi.list()]);
      setRules(r);
      setAccounts(a);
      if (a.length > 0) {
        setTxAccountId(a[0].id);
        setTfFrom(a[0].id);
        if (a.length > 1) setTfTo(a[1].id);
      }
      try {
        const config = await emailApi.getConfig();
        setEmailConfig(config);
      } catch (err) {
        // Not configured yet, ignore
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3000);
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await rulesApi.create({ keyword: newKeyword, category: newCategory });
      setNewKeyword('');
      loadData();
      showFeedback('✅ Regla creada');
    } catch (err: any) {
      showFeedback('❌ ' + err.message);
    }
  };

  const handleDeleteRule = async (id: number) => {
    await rulesApi.delete(id);
    loadData();
    showFeedback('🗑️ Regla eliminada');
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    try {
      await budgetsApi.create({
        category: budgetCat,
        monthly_limit: monthlyLimit,
        annual_limit: annualLimit || undefined,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      });
      showFeedback('✅ Presupuesto guardado');
    } catch (err: any) {
      showFeedback('❌ ' + err.message);
    }
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tx = await transactionsApi.ingest({
        account_id: txAccountId,
        type: txType,
        amount: txAmount,
        description: txDesc,
        transaction_date: txDate || undefined,
      });
      const status = tx.status === 'CLASSIFIED'
        ? `Auto-clasificado como ${getCategoryLabel(tx.category)}`
        : 'Pendiente de clasificación';
      showFeedback(`✅ Movimiento ingresado — ${status}`);
      setTxAmount(0);
      setTxDesc('');
      setTxDate('');
    } catch (err: any) {
      showFeedback('❌ ' + err.message);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await transactionsApi.transfer({
        from_account_id: tfFrom,
        to_account_id: tfTo,
        amount: tfAmount,
        description: tfDesc,
      });
      showFeedback('✅ Transferencia registrada (impacto $0 en presupuesto)');
      setTfAmount(0);
    } catch (err: any) {
      showFeedback('❌ ' + err.message);
    }
  };

  const handleSaveEmailConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const config = await emailApi.saveConfig({ app_password: appPassword });
      setEmailConfig(config);
      setAppPassword('');
      showFeedback('✅ Configuración de correo guardada');
    } catch (err: any) {
      showFeedback('❌ ' + err.message);
    }
  };

  const handleSyncEmails = async () => {
    setIsSyncing(true);
    try {
      const res = await emailApi.sync();
      if (res.success) {
        showFeedback(res.message || '✅ Sincronización exitosa');
      } else {
        showFeedback('⚠️ ' + res.message);
      }
    } catch (err: any) {
      showFeedback('❌ Error al sincronizar: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">⚙️ Reglas y Ajustes</h2>
      </div>

      {feedback && (
        <div className="card" style={{
          marginBottom: '20px',
          padding: '14px 20px',
          background: feedback.startsWith('✅') ? 'var(--color-income-bg)' : feedback.startsWith('❌') ? 'var(--color-expense-bg)' : 'var(--bg-card)',
          borderColor: feedback.startsWith('✅') ? 'rgba(34,197,94,0.3)' : feedback.startsWith('❌') ? 'rgba(239,68,68,0.3)' : 'var(--border-subtle)',
          animation: 'fadeSlideIn 0.3s ease',
        }}>
          {feedback}
        </div>
      )}

      <div className="grid-2">
        {/* Rules Section */}
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>🏷️ Reglas de Auto-Clasificación</h3>

          <form onSubmit={handleAddRule} className="card" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                className="form-input"
                value={newKeyword}
                onChange={e => setNewKeyword(e.target.value)}
                placeholder="Palabra clave (ej: Spotify)"
                required
                style={{ flex: 1 }}
              />
              <select className="form-select" value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{ width: 'auto' }}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <button className="btn btn-primary btn-sm" type="submit">+ Agregar</button>
            </div>
          </form>

          {rules.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px' }}>
              <div className="empty-state-text">Sin reglas configuradas</div>
            </div>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Palabra Clave</th>
                    <th>Categoría</th>
                    <th>Prioridad</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map(rule => (
                    <tr key={rule.id}>
                      <td style={{ fontWeight: 600 }}>{rule.keyword}</td>
                      <td>
                        <span className={`category-badge category-badge-${rule.category.toLowerCase()}`}>
                          {getCategoryLabel(rule.category)}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-tertiary)' }}>{rule.priority}</td>
                      <td>
                        <button className="btn btn-danger btn-sm" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => handleDeleteRule(rule.id)}>
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div>
          {/* Budget Form */}
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>📊 Configurar Presupuesto</h3>
          <form className="card" style={{ marginBottom: '24px' }} onSubmit={handleCreateBudget}>
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select className="form-select" value={budgetCat} onChange={e => setBudgetCat(e.target.value)}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Límite Mensual</label>
              <input className="form-input" type="number" value={monthlyLimit} onChange={e => setMonthlyLimit(Number(e.target.value))} min={0} step="1" required />
            </div>
            <div className="form-group">
              <label className="form-label">Límite Anual (opcional)</label>
              <input className="form-input" type="number" value={annualLimit} onChange={e => setAnnualLimit(Number(e.target.value))} min={0} step="1" />
            </div>
            <button className="btn btn-primary btn-block" type="submit">Guardar Presupuesto</button>
          </form>

          {/* Ingest Transaction */}
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>📝 Ingresar Movimiento</h3>
          <form className="card" style={{ marginBottom: '24px' }} onSubmit={handleIngest}>
            <div className="form-group">
              <label className="form-label">Cuenta</label>
              <select className="form-select" value={txAccountId} onChange={e => setTxAccountId(Number(e.target.value))}>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tipo</label>
              <select className="form-select" value={txType} onChange={e => setTxType(e.target.value as 'INCOME' | 'EXPENSE')}>
                <option value="EXPENSE">Gasto / Cargo</option>
                <option value="INCOME">Ingreso / Abono</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Monto</label>
              <input className="form-input" type="number" value={txAmount} onChange={e => setTxAmount(Number(e.target.value))} min={1} step="1" required />
            </div>
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <input className="form-input" value={txDesc} onChange={e => setTxDesc(e.target.value)} placeholder="Ej: Spotify Premium" required />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha (opcional)</label>
              <input className="form-input" type="date" value={txDate} onChange={e => setTxDate(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-block" type="submit">Ingresar Movimiento</button>
          </form>

          {/* Transfer */}
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>🔄 Transferencia Interna</h3>
          <form className="card" onSubmit={handleTransfer}>
            <div className="form-group">
              <label className="form-label">Cuenta Origen</label>
              <select className="form-select" value={tfFrom} onChange={e => setTfFrom(Number(e.target.value))}>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Cuenta Destino</label>
              <select className="form-select" value={tfTo} onChange={e => setTfTo(Number(e.target.value))}>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Monto</label>
              <input className="form-input" type="number" value={tfAmount} onChange={e => setTfAmount(Number(e.target.value))} min={1} step="1" required />
            </div>
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <input className="form-input" value={tfDesc} onChange={e => setTfDesc(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-block" type="submit">Transferir</button>
          </form>

          {/* Email Integration */}
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>📧 Sincronización Bancaria por Correo</h3>
          <div className="card" style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              La aplicación leerá correos bancarios automáticamente usando tu correo registrado: <strong>{user?.email}</strong>
            </p>
            <form onSubmit={handleSaveEmailConfig}>
              <div className="form-group">
                <label className="form-label">Contraseña de Aplicación (IMAP)</label>
                <input 
                  className="form-input" 
                  type="password" 
                  value={appPassword} 
                  onChange={e => setAppPassword(e.target.value)} 
                  placeholder={emailConfig?.is_active ? "•••••••• (Guardada)" : "Ingresa contraseña de aplicación"} 
                  required={!emailConfig?.is_active} 
                />
                <small style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>Necesaria para conectarse a tu cuenta (ej. Gmail App Password).</small>
              </div>
              <button className="btn btn-primary btn-block" type="submit">Guardar Configuración</button>
            </form>
            
            {emailConfig?.is_active && (
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Última sinc.: {emailConfig.last_sync_at ? new Date(emailConfig.last_sync_at).toLocaleString() : 'Nunca'}
                  </span>
                </div>
                <button 
                  className="btn btn-block" 
                  style={{ background: 'var(--color-savings-bg)', color: 'var(--color-savings)', borderColor: 'var(--color-savings)' }} 
                  onClick={handleSyncEmails}
                  disabled={isSyncing}
                >
                  {isSyncing ? 'Sincronizando...' : '🔄 Sincronizar Ahora'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
