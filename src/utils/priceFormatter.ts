import { CurrencyCode } from '@/zeus';

/**
 * @param price - price to format
 * @param currencyCode - currency code e.g. USD
 */
export function priceFormatter(price: number, code?: CurrencyCode | null | undefined): string {
  const currencyCode = code || CurrencyCode.USD;
  //TODO: more universal solution
  const translations: Partial<Record<CurrencyCode, { country: string }>> = {
    [CurrencyCode.USD]: {
      country: 'en-US',
    },
    [CurrencyCode.EUR]: {
      country: 'de-DE',
    },
    [CurrencyCode.PLN]: {
      country: 'pl-PL',
    },
    [CurrencyCode.CZK]: {
      country: 'cs-CZ',
    },
  };
  const c = translations[currencyCode];
  if (!c) {
    const formatterCode = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currencyDisplay: 'symbol',
      currency: 'USD',
    });
    return formatterCode.format(price / 100);
  }

  const formatterCode = new Intl.NumberFormat(c.country, {
    style: 'currency',
    currencyDisplay: 'symbol',
    currency: currencyCode,
  });
  return formatterCode.format(price / 100);
}

export function seoPriceFormatter(price: number): number {
  const formattedPrice = parseFloat((price / 100).toFixed(2));
  return formattedPrice;
}
