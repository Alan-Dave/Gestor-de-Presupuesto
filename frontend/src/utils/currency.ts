/**
 * Currency formatting utilities.
 */
import type { Currency } from '../types';

const CURRENCIES_CACHE: Record<string, Currency> = {};

export function setCurrencyCache(currencies: Currency[]) {
  currencies.forEach(c => { CURRENCIES_CACHE[c.code] = c; });
}

export function formatCurrency(
  amount: number,
  currencyCode: string = 'USD',
  locale?: string
): string {
  const currency = CURRENCIES_CACHE[currencyCode];
  const decimals = currency?.decimals ?? 2;
  const loc = locale || currency?.locale || 'en-US';

  try {
    return new Intl.NumberFormat(loc, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  } catch {
    // Fallback if Intl doesn't know the currency
    const symbol = currency?.symbol || '$';
    const formatted = Math.abs(amount).toLocaleString(loc, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return amount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
  }
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function getCategoryLabel(category: string | null): string {
  const labels: Record<string, string> = {
    FIXED: 'Gasto Fijo',
    PERSONAL: 'Gasto Personal',
    SAVINGS: 'Ahorro',
    TRANSFER: 'Transferencia',
    DEPOSIT: 'Depósito',
  };
  return category ? labels[category] || category : 'Sin clasificar';
}

export function getCategoryColor(category: string | null): string {
  const colors: Record<string, string> = {
    FIXED: 'var(--color-fixed)',
    PERSONAL: 'var(--color-personal)',
    SAVINGS: 'var(--color-savings)',
    TRANSFER: 'var(--color-transfer)',
    DEPOSIT: '#06b6d4',
  };
  return category ? colors[category] || 'var(--text-tertiary)' : 'var(--color-pending)';
}

export function getAccountTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    checking: 'Cuenta Corriente',
    vista: 'Cuenta Vista',
    rut: 'Cuenta RUT',
    savings: 'Cuenta de Ahorro',
    wallet: 'Billetera Digital',
    credit: 'Tarjeta de Crédito',
  };
  return labels[type] || type;
}

export const ACCOUNT_ICONS: Record<string, string> = {
  wallet: '💳',
  building: '🏦',
  banknotes: '💵',
  piggy: '🐷',
  credit: '💳',
};

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
