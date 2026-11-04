import { ChildAgeCalculation, AgeCategory } from '../types/child';
import { NON_BABY_CATALOG_ITEM_IDS } from './clothingCatalog';

export function calculateChildAge(birthDateStr: string, referenceDate: Date = new Date()): ChildAgeCalculation {
  if (!birthDateStr) {
    return {
      totalDays: 365,
      totalWeeks: 52,
      totalMonths: 12,
      years: 1,
      monthsRemaining: 0,
      daysRemaining: 0,
      formattedAge: '1 year old',
      category: 'toddler',
      categoryLabel: 'Toddler (1-3 yrs)',
    };
  }

  // Parse YYYY-MM-DD reliably in local time
  let birthDate: Date;
  const parts = birthDateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    birthDate = new Date(y, m, d, 0, 0, 0);
  } else {
    birthDate = new Date(birthDateStr);
  }

  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);

  // Time difference in milliseconds
  const diffMs = ref.getTime() - birthDate.getTime();

  // If born today or in the future
  if (diffMs < 0) {
    return {
      totalDays: 0,
      totalWeeks: 0,
      totalMonths: 0,
      years: 0,
      monthsRemaining: 0,
      daysRemaining: 0,
      formattedAge: 'Newborn (0 days)',
      category: 'newborn',
      categoryLabel: 'Newborn (0-3 mo)',
    };
  }

  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const totalWeeks = Math.floor(totalDays / 7);

  // Exact calendar year/month/day calculation
  let years = ref.getFullYear() - birthDate.getFullYear();
  let months = ref.getMonth() - birthDate.getMonth();
  let days = ref.getDate() - birthDate.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(ref.getFullYear(), ref.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalMonths = Math.max(0, years * 12 + months);

  // Format friendly age label
  let formattedAge = '';
  if (totalDays === 0) {
    formattedAge = 'Newborn (Born today)';
  } else if (totalDays <= 21) {
    formattedAge = `${totalDays} ${totalDays === 1 ? 'day' : 'days'} old`;
  } else if (totalMonths < 3) {
    formattedAge = `${totalWeeks} weeks old`;
  } else if (totalMonths < 24) {
    if (months > 0 && days >= 14) {
      formattedAge = `${totalMonths} mo, 2 wks`;
    } else {
      formattedAge = `${totalMonths} months old`;
    }
  } else if (years < 6) {
    if (months > 0) {
      formattedAge = `${years} yrs ${months} mo`;
    } else {
      formattedAge = `${years} years old`;
    }
  } else {
    formattedAge = `${years} years old`;
  }

  // Determine pediatric category
  let category: AgeCategory = 'toddler';
  let categoryLabel = 'Toddler (1-3 yrs)';

  if (totalMonths < 3) {
    category = 'newborn';
    categoryLabel = 'Newborn (0-3 mo)';
  } else if (totalMonths < 12) {
    category = 'infant';
    categoryLabel = 'Infant (3-12 mo)';
  } else if (totalMonths < 36) {
    category = 'toddler';
    categoryLabel = 'Toddler (1-3 yrs)';
  } else if (totalMonths < 60) {
    category = 'preschooler';
    categoryLabel = 'Preschooler (3-5 yrs)';
  } else {
    category = 'school_age';
    categoryLabel = 'School Age (5+ yrs)';
  }

  return {
    totalDays,
    totalWeeks,
    totalMonths,
    years,
    monthsRemaining: months,
    daysRemaining: days,
    formattedAge,
    category,
    categoryLabel,
  };
}

export function getBirthDateForMonthsAgo(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().split('T')[0];
}

export function getBirthDateForDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

export function getDefaultChildProfile(): import('../types/child').ChildProfile {
  return {
    id: 'default-child-1',
    name: 'Johnny Doe',
    birthDate: '2024-02-22',
    avatarColor: 'sky',
    location: 'London, UK',
    activityLevel: 'moderate',
    temperatureTendency: 'normal',
    specialTraits: [],
    schedules: [
      {
        id: 'sched-1',
        title: 'Daycare',
        startTime: '08:00',
        endTime: '16:00',
        days: [0, 1, 2, 3, 4], // Sunday - Thursday
        locationType: 'daycare',
        location: 'London, UK',
        enabled: true,
      },
    ],
    availableClothingIds: NON_BABY_CATALOG_ITEM_IDS,
    notes: '',
  };
}
