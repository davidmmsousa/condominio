import { addMonths, endOfMonth } from "date-fns";

export function correnteDueDateForMonth(referenceMonth: Date) {
  // Default policy (decided): quota corrente vence dia 8.
  const y = referenceMonth.getFullYear();
  const m = referenceMonth.getMonth(); // 0-based
  const d = 8;
  const last = endOfMonth(new Date(y, m, 1)).getDate();
  return new Date(y, m, Math.min(d, last));
}

export function extraordinariaDefaultDueDate(launchedAt: Date) {
  // Default policy (decided): dia 1 do mês seguinte ao lançamento.
  const next = addMonths(new Date(launchedAt.getFullYear(), launchedAt.getMonth(), 1), 1);
  return next; // day 1
}

