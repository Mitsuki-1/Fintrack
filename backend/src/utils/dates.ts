/**
 * Возвращает начало и конец месяца в формате 'YYYY-MM-DD'.
 * @param month - строка вида 'YYYY-MM'
 * @returns объект с полями from (включительно) и to (исключительно)
 */
export function getMonthRange(month: string): { from: string; to: string } {
  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const mon = parseInt(monthStr, 10);

  const from = `${year}-${String(mon).padStart(2, '0')}-01`;

  // Первый день следующего месяца
  const nextMonth = mon === 12 ? 1 : mon + 1;
  const nextYear = mon === 12 ? year + 1 : year;
  const to = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

  return { from, to };
}

/**
 * Преобразует строку даты из БД или запроса в стандартный ISO-формат.
 * Для простоты оставляем как есть, но можно добавить валидацию.
 */
export function toISODate(dateStr: string): string {
  // Предполагаем, что приходит 'YYYY-MM-DD'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error(`Неверный формат даты: ${dateStr}`);
  }
  return dateStr;
}