import { ChildScheduleItem } from '../types/child';

const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function isScheduleActiveOnDate(schedule: ChildScheduleItem, targetDate: Date = new Date()): boolean {
  if (!schedule.enabled) return false;

  const freq = schedule.frequency || 'weekly';

  // Normalize target date to local midnight
  const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const targetDateStr = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
  const targetDayOfWeek = target.getDay();

  // 1. One-time activity on a specific date
  if (freq === 'one_time') {
    return schedule.specificDate === targetDateStr;
  }

  // 2. Day-of-week match
  const matchesDay = (schedule.days || []).includes(targetDayOfWeek);
  if (!matchesDay) return false;

  // If weekly, matching day is sufficient
  if (freq === 'weekly') {
    return true;
  }

  // 3. Bi-weekly (Every other week)
  if (freq === 'biweekly') {
    // Anchor date: defaults to startDate or Jan 4, 2026 (a Sunday)
    let anchor: Date;
    if (schedule.startDate) {
      const parts = schedule.startDate.split('-');
      anchor = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      anchor = new Date(2026, 0, 4); // Sunday reference
    }

    // Align anchor to the Sunday of that anchor week
    const anchorSunday = new Date(anchor);
    anchorSunday.setDate(anchor.getDate() - anchor.getDay());

    // Align target to the Sunday of the target week
    const targetSunday = new Date(target);
    targetSunday.setDate(target.getDate() - target.getDay());

    const diffDays = Math.round((targetSunday.getTime() - anchorSunday.getTime()) / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);

    // Active every 2 weeks (even week offset from anchor)
    return Math.abs(diffWeeks) % 2 === 0;
  }

  return false;
}

export function getScheduleRecurrenceLabel(schedule: ChildScheduleItem): string {
  const freq = schedule.frequency || 'weekly';

  if (freq === 'one_time') {
    if (!schedule.specificDate) return 'Specific date';
    const parts = schedule.specificDate.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return `One-time: ${d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}`;
    }
    return `One-time: ${schedule.specificDate}`;
  }

  const days = schedule.days || [];
  let daysStr = '';
  if (days.length === 7) {
    daysStr = 'Every day';
  } else if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) {
    daysStr = 'Mon–Fri (Weekdays)';
  } else if (days.length === 2 && [0, 6].every((d) => days.includes(d))) {
    daysStr = 'Weekends';
  } else {
    daysStr = days.map((d) => DAY_NAMES_SHORT[d]).join(', ');
  }

  if (freq === 'biweekly') {
    return `Every other week (${daysStr})`;
  }

  return `Weekly (${daysStr})`;
}
