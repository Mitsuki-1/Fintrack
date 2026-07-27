export const formatAmount = (minor: number) =>
  (minor / 100).toLocaleString('ru-RU', { minimumFractionDigits: 0 });
