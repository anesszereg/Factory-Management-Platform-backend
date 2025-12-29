import { addMonths, addDays } from 'date-fns';

export function getEmployeeSalaryCycle(hireDate: Date, referenceDate: Date = new Date()) {
  const hireDayOfMonth = hireDate.getDate();
  
  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth();
  const refDay = referenceDate.getDate();
  
  let cycleStartDate: Date;
  
  if (refDay < hireDayOfMonth) {
    cycleStartDate = new Date(refYear, refMonth - 1, hireDayOfMonth, 0, 0, 0, 0);
  } else {
    cycleStartDate = new Date(refYear, refMonth, hireDayOfMonth, 0, 0, 0, 0);
  }
  
  const nextCycleStart = addMonths(cycleStartDate, 1);
  const cycleEndDate = addDays(nextCycleStart, -1);
  cycleEndDate.setHours(23, 59, 59, 999);
  
  return {
    start: cycleStartDate,
    end: cycleEndDate
  };
}

export function getEmployeeSalaryCycleForMonth(hireDate: Date, targetMonth: Date) {
  return getEmployeeSalaryCycle(hireDate, targetMonth);
}
