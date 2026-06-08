export const fallbackCurrencyRates: Record<string, number> = {
  COP: 1,
  USD: 4700,
  EUR: 5200,
};

export const supportedCurrencies = ['COP', 'USD', 'EUR'] as const;

export type SupportedCurrency = (typeof supportedCurrencies)[number];

export async function fetchExchangeRates(base = 'USD'): Promise<Record<string, number>> {
  const response = await fetch(
    `https://api.exchangerate.host/latest?base=${base}&symbols=${supportedCurrencies.join(',')}`
  );

  if (!response.ok) {
    throw new Error('No se pudo obtener las tasas de cambio');
  }

  const data = await response.json();
  const rates: Record<string, number> = {
    ...(data.rates ?? {}),
    [base.toUpperCase()]: 1,
  };

  return rates;
}

export function convertAmount(
  amount: number,
  from: string,
  to: string,
  currencyRates: Record<string, number> | null = null
) {
  const source = from.toUpperCase();
  const target = to.toUpperCase();

  if (source === target) {
    return amount;
  }

  let converted = 0;

  if (currencyRates && currencyRates[source] && currencyRates[target]) {
    const amountInUsd = source === 'USD' ? amount : amount / currencyRates[source];
    converted = amountInUsd * currencyRates[target];
  } else {
    const fromRate = fallbackCurrencyRates[source] ?? 1;
    const toRate = fallbackCurrencyRates[target] ?? 1;
    converted = (amount * fromRate) / toRate;
  }

  if (target === 'COP') {
    return Math.round(converted);
  }

  return Math.round(converted * 100) / 100;
}
