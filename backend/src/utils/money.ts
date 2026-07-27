/**
 * Переводит минорные единицы (тийины) в основные (сумы).
 */
export function minorToMajor(minor: number): number {
  return minor / 100;
}

/**
 * Переводит основные единицы (сумы) в минорные (тийины).
 */
export function majorToMinor(major: number): number {
  return Math.round(major * 100);
}

/**
 * Форматирует сумму для отображения.
 */
export function formatMoney(minor: number, currency: string = 'UZS'): string {
  return `${minorToMajor(minor).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
}