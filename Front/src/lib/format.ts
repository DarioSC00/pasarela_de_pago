export function formatCurrency(amount: number, currency: string) {
  const currencyCode = currency?.toUpperCase() ?? 'USD';
  const locale =
    currencyCode === 'COP' ? 'es-CO' : currencyCode === 'EUR' ? 'es-ES' : 'en-US';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    currencyDisplay: 'narrowSymbol',
  }).format(amount);
}
