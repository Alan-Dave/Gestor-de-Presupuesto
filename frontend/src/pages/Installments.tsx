/**
 * Installments (Cuotas) page: Track purchases in installments,
 * record accumulated paid installments in months or money, and view commitments.
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { installmentsApi, accountsApi } from '../api/client';
import { formatCurrency, formatDate } from '../utils/currency';
import type { Installment, InstallmentCreateData, InstallmentSummary, Account } from '../types';

export default function Installments() {
  const { user } = useAuth();
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [summary, setSummary] = useState<InstallmentSummary | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');

  // Form State
  const [formData, setFormData] = useState<InstallmentCreateData>({
    description: '',
    total_amount: 0,
    installment_amount: 0,
    total_installments: 12,
    paid_installments: 0,
    account_id: null,
    start_date: new Date().toISOString().split('T')[0],
    category: 'PERSONAL',
  });

  // Mode for entering accumulated payments: by installments count (months) or by money
  const [paidMode, setPaidMode] = useState<'months' | 'money'>('months');
  const [paidMoneyInput, setPaidMoneyInput] = useState<number>(0);

  const currencyCode = user?.currency_code || 'USD';

  const loadData = async () => {
    try {
      setLoading(true);
      const [list, sum, accs] = await Promise.all([
        installmentsApi.list(filter === 'ALL' ? undefined : filter),
        installmentsApi.summary(),
        accountsApi.list(),
      ]);
      setInstallments(list);
      setSummary(sum);
      setAccounts(accs);
    } catch (err) {
      console.error('Error loading installments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filter]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      description: '',
      total_amount: 0,
      installment_amount: 0,
      total_installments: 12,
      paid_installments: 0,
      account_id: accounts.length > 0 ? accounts[0].id : null,
      start_date: new Date().toISOString().split('T')[0],
      category: 'PERSONAL',
    });
    setPaidMode('months');
    setPaidMoneyInput(0);
    setShowModal(true);
  };

  const handleOpenEdit = (inst: Installment) => {
    setEditingId(inst.id);
    setFormData({
      description: inst.description,
      total_amount: inst.total_amount,
      installment_amount: inst.installment_amount,
      total_installments: inst.total_installments,
      paid_installments: inst.paid_installments,
      account_id: inst.account_id,
      start_date: inst.start_date,
      category: inst.category,
    });
    setPaidMode('months');
    setPaidMoneyInput(inst.paid_amount);
    setShowModal(true);
  };

  // Auto-calculate installment amount if user types total amount and total installments
  const handleTotalAmountChange = (val: number) => {
    const total = Math.max(0, val);
    const instCount = formData.total_installments || 1;
    setFormData(prev => ({
      ...prev,
      total_amount: total,
      installment_amount: Math.round(total / instCount),
    }));
  };

  const handleTotalInstallmentsChange = (val: number) => {
    const count = Math.max(1, val);
    setFormData(prev => ({
      ...prev,
      total_installments: count,
      installment_amount: prev.total_amount > 0 ? Math.round(prev.total_amount / count) : prev.installment_amount,
    }));
  };

  // Convert money to installments count when using 'money' mode
  const handlePaidMoneyChange = (money: number) => {
    setPaidMoneyInput(money);
    const cuota = formData.installment_amount || (formData.total_amount / (formData.total_installments || 1));
    if (cuota > 0) {
      const calculatedMonths = Math.min(formData.total_installments, Math.round(money / cuota));
      setFormData(prev => ({ ...prev, paid_installments: calculatedMonths }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: InstallmentCreateData = {
        ...formData,
        account_id: formData.account_id ? Number(formData.account_id) : null,
        total_amount: Number(formData.total_amount),
        installment_amount: Number(formData.installment_amount),
        total_installments: Number(formData.total_installments),
        paid_installments: Number(formData.paid_installments),
      };

      if (editingId) {
        await installmentsApi.update(editingId, payload);
      } else {
        await installmentsApi.create(payload);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error('Error saving installment:', err);
    }
  };

  const handlePayNext = async (id: number) => {
    try {
      await installmentsApi.payNext(id);
      loadData();
    } catch (err) {
      console.error('Error paying next installment:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar el seguimiento de esta cuota?')) return;
    try {
      await installmentsApi.delete(id);
      loadData();
    } catch (err) {
      console.error('Error deleting installment:', err);
    }
  };

  return (
    <div>
      {/* Top action header */}
      <div className="section-header">
        <h2 className="section-title">💳 Seguimiento de Cuotas y Créditos</h2>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          + Nueva Compra en Cuotas
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid-metrics" style={{ marginBottom: '28px' }}>
        <div className="metric-card">
          <div className="metric-card-icon" style={{ background: 'var(--color-expense-bg)', color: 'var(--color-expense)' }}>
            📉
          </div>
          <div className="metric-card-label">Deuda Total Activa</div>
          <div className="metric-card-value" style={{ color: 'var(--color-expense)' }}>
            {summary ? formatCurrency(summary.total_active_debt, currencyCode) : '-'}
          </div>
          <div className="metric-card-sub">{summary?.active_count || 0} compras activas</div>
        </div>

        <div className="metric-card">
          <div className="metric-card-icon" style={{ background: 'var(--color-fixed-bg)', color: 'var(--color-fixed)' }}>
            🗓️
          </div>
          <div className="metric-card-label">Compromiso Mensual</div>
          <div className="metric-card-value" style={{ color: 'var(--color-fixed)' }}>
            {summary ? formatCurrency(summary.monthly_commitment, currencyCode) : '-'}
          </div>
          <div className="metric-card-sub">monto a pagar por mes en cuotas</div>
        </div>

        <div className="metric-card">
          <div className="metric-card-icon" style={{ background: 'var(--color-income-bg)', color: 'var(--color-income)' }}>
            ✅
          </div>
          <div className="metric-card-label">Total Ya Pagado</div>
          <div className="metric-card-value" style={{ color: 'var(--color-income)' }}>
            {summary ? formatCurrency(summary.total_paid_debt, currencyCode) : '-'}
          </div>
          <div className="metric-card-sub">{summary?.completed_count || 0} finalizadas</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-bar" style={{ marginBottom: '20px' }}>
        <button
          className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
          onClick={() => setFilter('ALL')}
        >
          Todas
        </button>
        <button
          className={`filter-btn ${filter === 'ACTIVE' ? 'active' : ''}`}
          onClick={() => setFilter('ACTIVE')}
        >
          En Curso ({summary?.active_count || 0})
        </button>
        <button
          className={`filter-btn ${filter === 'COMPLETED' ? 'active' : ''}`}
          onClick={() => setFilter('COMPLETED')}
        >
          Finalizadas ({summary?.completed_count || 0})
        </button>
      </div>

      {/* Installments List */}
      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : installments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💳</div>
          <div className="empty-state-text">No hay cuotas registradas</div>
          <div className="empty-state-sub">Registra tus compras a crédito para saber cuántos meses y dinero te quedan por pagar.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {installments.map(inst => {
            const isFinished = inst.status === 'COMPLETED' || inst.paid_installments >= inst.total_installments;
            return (
              <div key={inst.id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                {isFinished && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'var(--color-income-bg)',
                      color: 'var(--color-income)',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    ✓ Pagado Totalmente
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '24px' }}>🛍️</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{inst.description}</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                      {inst.account_name && (
                        <span className="pending-card-account" style={{ fontSize: '12px' }}>
                          <span
                            className="pending-card-account-dot"
                            style={{ backgroundColor: inst.account_color || '#6366f1' }}
                          />
                          {inst.account_name}
                        </span>
                      )}
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        Inicio: {formatDate(inst.start_date)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Amounts info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '16px 0 8px 0' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                      Cuota Mensual
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-accent)' }}>
                      {formatCurrency(inst.installment_amount, currencyCode)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                      Deuda Restante
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: isFinished ? 'var(--color-income)' : 'var(--color-expense)' }}>
                      {formatCurrency(inst.remaining_amount, currencyCode)}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span>
                      <strong>{inst.paid_installments}</strong> de <strong>{inst.total_installments}</strong> cuotas pagadas
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {inst.progress_pct}%
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${inst.progress_pct}%`,
                        background: isFinished ? 'var(--color-income)' : 'var(--gradient-primary)',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                    <span>Pagado: {formatCurrency(inst.paid_amount, currencyCode)}</span>
                    <span>Total: {formatCurrency(inst.total_amount, currencyCode)}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
                  {!isFinished && (
                    <button
                      className="btn btn-secondary"
                      style={{ flex: 1, fontSize: '12px', padding: '6px 10px' }}
                      onClick={() => handlePayNext(inst.id)}
                      title="Registrar pago de 1 cuota"
                    >
                      ➕ Pagar Cuota ({inst.paid_installments + 1}/{inst.total_installments})
                    </button>
                  )}
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                    onClick={() => handleOpenEdit(inst)}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px', color: 'var(--color-expense)' }}
                    onClick={() => handleDelete(inst.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 600 }}>
              {editingId ? '✏️ Modificar Cuota / Deuda' : '💳 Nueva Compra en Cuotas'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Descripción de la compra o crédito</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. iPhone 15, Pasajes aéreos, Refrigerador"
                  className="form-input"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Monto Total ({currencyCode})</label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="form-input"
                    value={formData.total_amount || ''}
                    onChange={e => handleTotalAmountChange(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Total de Cuotas (Meses)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="form-input"
                    value={formData.total_installments}
                    onChange={e => handleTotalInstallmentsChange(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Monto por Cuota ({currencyCode})</label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="form-input"
                    value={formData.installment_amount || ''}
                    onChange={e => setFormData({ ...formData, installment_amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha de Inicio</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.start_date}
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
              </div>

              {/* Progress Accumulator Section */}
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-medium)',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>
                    Cuotas Pagadas Acumuladas
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className={`filter-btn ${paidMode === 'months' ? 'active' : ''}`}
                      style={{ padding: '3px 8px', fontSize: '11px' }}
                      onClick={() => setPaidMode('months')}
                    >
                      Por Meses / Cuotas
                    </button>
                    <button
                      type="button"
                      className={`filter-btn ${paidMode === 'money' ? 'active' : ''}`}
                      style={{ padding: '3px 8px', fontSize: '11px' }}
                      onClick={() => setPaidMode('money')}
                    >
                      Por Dinero ($)
                    </button>
                  </div>
                </div>

                {paidMode === 'months' ? (
                  <div>
                    <input
                      type="number"
                      min="0"
                      max={formData.total_installments}
                      className="form-input"
                      value={formData.paid_installments}
                      onChange={e => {
                        const val = Math.min(formData.total_installments, Math.max(0, parseInt(e.target.value) || 0));
                        setFormData({ ...formData, paid_installments: val });
                      }}
                    />
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                      Equivale a <strong>{formatCurrency((formData.paid_installments || 0) * (formData.installment_amount || 0), currencyCode)}</strong> pagados.
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="Monto pagado a la fecha"
                      className="form-input"
                      value={paidMoneyInput || ''}
                      onChange={e => handlePaidMoneyChange(parseFloat(e.target.value) || 0)}
                    />
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                      Calculado: <strong>{formData.paid_installments}</strong> de {formData.total_installments} cuotas cubiertas.
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Cuenta / Tarjeta Asociada</label>
                  <select
                    className="form-select"
                    value={formData.account_id || ''}
                    onChange={e => setFormData({ ...formData, account_id: e.target.value ? Number(e.target.value) : null })}
                  >
                    <option value="">(Opcional / Sin asignar)</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Categoría Presupuestaria</label>
                  <select
                    className="form-select"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="PERSONAL">🛍️ Gasto Personal</option>
                    <option value="FIXED">📌 Gasto Fijo</option>
                    <option value="SAVINGS">🏦 Ahorro / Inversión</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Guardar Cambios' : 'Registrar Cuota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
