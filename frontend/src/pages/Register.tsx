/**
 * Register page with currency/country selector.
 */
import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi, currenciesApi } from '../api/client';
import type { Currency } from '../types';

export default function Register() {
  const { user, login } = useAuth();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('CLP');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    currenciesApi.list().then(setCurrencies).catch(console.error);
  }, []);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.register({
        email,
        username,
        password,
        currency_code: selectedCurrency,
      });
      login(res.access_token, res.user);
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', fontSize: '48px', marginBottom: '16px' }}>💎</div>
        <h1 className="auth-title">Crear Cuenta</h1>
        <p className="auth-subtitle">Configura tu gestor de presupuesto personal</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input
              className="form-input"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Tu nombre"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tu Moneda</label>
            <div style={{ maxHeight: '200px', overflowY: 'auto', borderRadius: 'var(--radius-sm)' }}>
              {currencies.map(c => (
                <div
                  key={c.code}
                  className={`currency-option ${selectedCurrency === c.code ? 'selected' : ''}`}
                  onClick={() => setSelectedCurrency(c.code)}
                >
                  <span className="currency-option-flag">{c.flag}</span>
                  <div>
                    <div className="currency-option-name">{c.country}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      {c.name} ({c.symbol})
                    </div>
                  </div>
                  <span className="currency-option-code">{c.code}</span>
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        <div className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
}
