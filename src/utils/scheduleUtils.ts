import { ChildScheduleItem, ScheduleFrequency } from '../types/child';

/**
 * Get date string formatted as YYYY-MM-DD in local time
 */
export function formatLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD into a local Date object (at 00:00:00 local time)
 */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0);
}

/**
 * Get start of week (Sunday 00:00:00) for a given date
 */
export function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 is Sunday
  d.setDate(d.getDate() - day);
  return d;
}

/**
 * Calculate difference in calendar weeks between two dates
 */
export function getDifferenceInCalendarWeeks(dateA: Date, dateB: Date): number {
  const weekStartA = getStartOfWeek(dateA).getTime();
  const weekStartB = getStartOfWeek(dateB).getTime();
  const msInWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.round((weekStartB - weekStartA) / msInWeek);
}

/**
 * Check if a schedule is active on a specific date (default: today)
 */
export function isScheduleActiveOnDate(schedule: ChildScheduleItem, targetDate: Date = new Date()): boolean {
  if (!schedule.enabled) return false;

  const targetDayOfWeek = targetDate.getDay();
  const targetDateStr = formatLocalDate(targetDate);
  const frequency = schedule.frequency || 'weekly';

  // 1. One-time specific date
  if (frequency === 'one_time') {
    if (!schedule.specificDate) return false;
    return schedule.specificDate === targetDateStr;
  }

  // Check if day of week matches
  if (!schedule.days || !schedule.days.includes(targetDayOfWeek)) {
    return false;
  }

  // 2. Standard weekly recurrence
  if (frequency === 'weekly') {
    return true;
  }

  // 3. Bi-weekly recurrence (every other week)
  if (frequency === 'biweekly') {
    // If no startDate provided, default anchor to the start of the week schedule was created
    const anchorDate = schedule.startDate ? parseLocalDate(schedule.startDate) : new Date();
    const diffWeeks = getDifferenceInCalendarWeeks(anchorDate, targetDate);
    // Active if even number of weeks difference from anchor
    return Math.abs(diffWeeks) % 2 === 0;
  }

  return false;
}

/**
 * Check if bi-weekly schedule is active in the current week
 */
export function isBiweeklyActiveThisWeek(schedule: ChildScheduleItem, referenceDate: Date = new Date()): boolean {
  if (!schedule.startDate) return true;
  const anchorDate = parseLocalDate(schedule.startDate);
  const diffWeeks = getDifferenceInCalendarWeeks(anchorDate, referenceDate);
  return Math.abs(diffWeeks) % 2 === 0;
}

/**
 * Get human-friendly label for schedule frequency
 */
export function getScheduleRecurrenceLabel(schedule: ChildScheduleItem, referenceDate: Date = new Date()): {
  badge: string;
  detail: string;
  isActiveThisWeek?: boolean;
} {
  const frequency: ScheduleFrequency = schedule.frequency || 'weekly';

  if (frequency === 'one_time') {
    if (!schedule.specificDate) {
      return { badge: 'One-Time', detail: 'Specific date' };
    }
    const target = parseLocalDate(schedule.specificDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
    const formatted = target.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    let relative = '';
    if (diffDays === 0) relative = 'Today';
    else if (diffDays === 1) relative = 'Tomorrow';
    else if (diffDays === -1) relative = 'Yesterday';
    else if (diffDays > 1) relative = `In ${diffDays} days`;
    else relative = `${Math.abs(diffDays)} days ago`;

    return {
      badge: 'Specific Date',
      detail: `${formatted} (${relative})`,
    };
  }

  if (frequency === 'biweekly') {
    const activeThisWeek = isBiweeklyActiveThisWeek(schedule, referenceDate);
    const daysStr = formatDaysList(schedule.days);

    return {
      badge: 'Every Other Week',
      detail: `${daysStr} · ${activeThisWeek ? 'Active this week' : 'Next week (off this week)'}`,
      isActiveThisWeek: activeThisWeek,
    };
  }

  // Weekly
  return {
    badge: 'Repeats Weekly',
    detail: formatDaysList(schedule.days),
  };
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatDaysList(days: number[]): string {
  if (!days || days.length === 0) return 'No days set';
  if (days.length === 7) return 'Every day';

  const isWeekdays =
    days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d));
  if (isWeekdays) return 'Weekdays (Mon-Fri)';

  const isWeekends =
    days.length === 2 && days.includes(0) && days.includes(6);
  if (isWeekends) return 'Weekends (Sat-Sun)';

  return days
    .slice()
    .sort()
    .map((d) => DAY_NAMES[d])
    .join(', ');
}

/**
 * Returns helper date offsets for quick shortcuts
 */
export function getQuickDateOption(type: 'today' | 'tomorrow' | 'this_saturday' | 'next_saturday' | 'next_sunday'): {
  dateStr: string;
  label: string;
  dayIndex: number;
} {
  const d = new Date();
  d.setHours(0, 0, 0, 0);

  if (type === 'today') {
    return {
      dateStr: formatLocalDate(d),
      label: 'Today',
      dayIndex: d.getDay(),
    };
  }

  if (type === 'tomorrow') {
    d.setDate(d.getDate() + 1);
    return {
      dateStr: formatLocalDate(d),
      label: 'Tomorrow',
      dayIndex: d.getDay(),
    };
  }

  if (type === 'this_saturday') {
    const currentDay = d.getDay();
    const daysUntilSat = (6 - currentDay + 7) % 7 || 7;
    d.setDate(d.getDate() + daysUntilSat);
    return {
      dateStr: formatLocalDate(d),
      label: 'This Saturday',
      dayIndex: 6,
    };
  }

  if (type === 'next_saturday') {
    const currentDay = d.getDay();
    const daysUntilSat = ((6 - currentDay + 7) % 7 || 7) + 7;
    d.setDate(d.getDate() + daysUntilSat);
    return {
      dateStr: formatLocalDate(d),
      label: 'Next Saturday',
      dayIndex: 6,
    };
  }

  // next_sunday
  const currentDay = d.getDay();
  const daysUntilSun = ((7 - currentDay) % 7 || 7) + (currentDay === 0 ? 7 : 0);
  d.setDate(d.getDate() + daysUntilSun);
  return {
    dateStr: formatLocalDate(d),
    label: 'Next Sunday',
    dayIndex: 0,
  };
}

export interface ScheduleInterval {
  startMinutes: number;
  endMinutes: number;
  startTime: string;
  endTime: string;
  startHour: number;
  endHour: number;
}

/**
 * Parses and merges schedule items into discrete intervals.
 * Overlapping or back-to-back routines (e.g. 07:30–12:00 and 12:00–16:00) merge into one window.
 * Non-adjacent routines (e.g. 07:30–12:00 and 16:00–18:00) remain distinct separate windows.
 */
export function getMergedScheduleIntervals(schedules: ChildScheduleItem[]): ScheduleInterval[] {
  if (!schedules || schedules.length === 0) {
    return [
      {
        startMinutes: 8 * 60,
        endMinutes: 16 * 60,
        startTime: '08:00',
        endTime: '16:00',
        startHour: 8,
        endHour: 16,
      },
    ];
  }

  const rawIntervals: { start: number; end: number }[] = schedules.map((s) => {
    const [sh, sm] = (s.startTime || '08:00').split(':').map(Number);
    const [eh, em] = (s.endTime || '16:00').split(':').map(Number);
    const start = (isNaN(sh) ? 8 : sh) * 60 + (isNaN(sm) ? 0 : sm);
    let end = (isNaN(eh) ? 16 : eh) * 60 + (isNaN(em) ? 0 : em);
    if (end <= start) end = Math.min(24 * 60, start + 120);
    return { start, end };
  });

  // Sort by start time ascending
  rawIntervals.sort((a, b) => a.start - b.start);

  // Merge overlapping or back-to-back (up to 15 min buffer) intervals
  const merged: { start: number; end: number }[] = [];
  for (const interval of rawIntervals) {
    if (merged.length === 0) {
      merged.push({ ...interval });
    } else {
      const prev = merged[merged.length - 1];
      // Overlapping or back-to-back (touching or gap <= 15 mins)
      if (interval.start <= prev.end + 15) {
        prev.end = Math.max(prev.end, interval.end);
      } else {
        merged.push({ ...interval });
      }
    }
  }

  const pad = (n: number) => n.toString().padStart(2, '0');

  return merged.map((m) => {
    const sH = Math.floor(m.start / 60);
    const sM = m.start % 60;
    const eH = Math.min(23, Math.floor(m.end / 60));
    const eM = m.end % 60;
    return {
      startMinutes: m.start,
      endMinutes: m.end,
      startTime: `${pad(sH)}:${pad(sM)}`,
      endTime: `${pad(eH)}:${pad(eM)}`,
      startHour: sH,
      endHour: Math.min(23, Math.ceil(m.end / 60)),
    };
  });
}

/**
 * Returns formatted string of schedule time windows.
 * Single window: "07:30 – 16:30"
 * Multiple non-adjacent windows: "07:30 – 12:00 • 16:00 – 18:00"
 */
export function getScheduleTimeWindowsLabel(schedules: ChildScheduleItem[]): string {
  const intervals = getMergedScheduleIntervals(schedules);
  if (intervals.length === 0) return '08:00 – 16:00';
  return intervals.map((int) => `${int.startTime} – ${int.endTime}`).join(' • ');
}

/**
 * Calculates the combined time span for a set of schedules.
 * Provides the overall earliest start, latest end, and the formatted discrete time windows string.
 */
export function getCombinedScheduleWindow(schedules: ChildScheduleItem[]): {
  startTime: string;
  endTime: string;
  startHour: number;
  endHour: number;
  windowsLabel: string;
  intervals: ScheduleInterval[];
} {
  const intervals = getMergedScheduleIntervals(schedules);
  const earliest = intervals[0] || {
    startTime: '08:00',
    endTime: '16:00',
    startHour: 8,
    endHour: 16,
  };
  const latest = intervals[intervals.length - 1] || earliest;

  return {
    startTime: earliest.startTime,
    endTime: latest.endTime,
    startHour: earliest.startHour,
    endHour: latest.endHour,
    windowsLabel: intervals.map((i) => `${i.startTime} – ${i.endTime}`).join(' • '),
    intervals,
  };
}

/**
 * Returns distinct locations ordered strictly by the chronological start time of their respective activities.
 * If a location appears in multiple activities, it is ordered based on its first appearance.
 */
export function getOrderedUniqueLocations(
  schedules: ChildScheduleItem[],
  defaultLocation: string = 'Local Area'
): string[] {
  if (!schedules || schedules.length === 0) {
    return [defaultLocation];
  }

  // Sort activities chronologically by start time
  const sorted = [...schedules].sort((a, b) => {
    const [ah, am] = (a.startTime || '08:00').split(':').map(Number);
    const [bh, bm] = (b.startTime || '08:00').split(':').map(Number);
    const aM = (isNaN(ah) ? 8 : ah) * 60 + (isNaN(am) ? 0 : am);
    const bM = (isNaN(bh) ? 8 : bh) * 60 + (isNaN(bm) ? 0 : bm);
    return aM - bM;
  });

  const orderedLocations: string[] = [];
  const seen = new Set<string>();

  for (const s of sorted) {
    const loc = (s.location?.trim() || defaultLocation.trim() || 'Local Area').trim();
    const normalizedKey = loc.toLowerCase();
    if (!seen.has(normalizedKey)) {
      seen.add(normalizedKey);
      orderedLocations.push(loc);
    }
  }

  return orderedLocations.length > 0 ? orderedLocations : [defaultLocation];
}

/**
 * Default schedule used when no activities are scheduled for the day (08:00 - 20:00)
 */
export const DEFAULT_NO_ACTIVITY_SCHEDULE: ChildScheduleItem = {
  id: 'default-no-activity-schedule',
  title: 'General Day',
  startTime: '08:00',
  endTime: '20:00',
  locationType: 'home',
  location: 'Home / Local Area',
  days: [0, 1, 2, 3, 4, 5, 6],
  enabled: true,
};

