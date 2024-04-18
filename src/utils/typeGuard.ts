export function isPriceRange(obj: unknown): obj is {
  max: number;
  min: number;
} {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'max' in obj &&
    'min' in obj &&
    typeof obj.max === 'number' &&
    typeof obj.min === 'number'
  );
}

export function isSinglePrice(obj: unknown): obj is {
  value: number;
} {
  return typeof obj === 'object' && obj !== null && 'value' in obj && typeof obj.value === 'number';
}

export const priceToString = (value: unknown) =>
  isSinglePrice(value)
    ? `${(value.value / 100).toFixed(2)}`
    : isPriceRange(value)
      ? `${(value.min / 100).toFixed(2)}-${(value.max / 100).toFixed(2)}`
      : '-';
