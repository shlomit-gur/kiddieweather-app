export type AgeCategory =
  | 'newborn'     // 0 - 3 months
  | 'infant'      // 3 - 12 months
  | 'toddler'     // 1 - 3 years (12 - 36 months)
  | 'preschooler' // 3 - 5 years (36 - 60 months)
  | 'school_age'; // 5+ years

export interface ChildAgeCalculation {
  totalDays: number;
  totalWeeks: number;
  totalMonths: number;
  years: number;
  monthsRemaining: number;
  daysRemaining: number;
  formattedAge: string;
  category: AgeCategory;
  categoryLabel: string;
}

export type ActivityType =
  | 'outdoor_play'   // Active running / playground (heats up fast)
  | 'stroller_walk'  // Sitting still in pram/stroller (cooler, needs footmuff/blanket)
  | 'carrier'        // Babywearing: chest-to-chest with parent (parent body warmth adds 1 layer)
  | 'car_seat'       // Automobile travel (CRITICAL: no bulky jackets under harness)
  | 'nap_sleep';     // Daytime outdoor or indoor nap (TOG ratings apply)

export type ScheduleFrequency = 'weekly' | 'biweekly' | 'one_time';

export interface ChildScheduleItem {
  id: string;
  title: string;
  startTime: string; // "08:30"
  endTime: string;   // "16:00"
  frequency?: ScheduleFrequency; // 'weekly' (default), 'biweekly', or 'one_time'
  specificDate?: string; // YYYY-MM-DD for one_time activities
  startDate?: string;    // YYYY-MM-DD anchor week for biweekly recurrence
  days: number[];    // 0=Sun, 1=Mon, ..., 6=Sat
  locationType: 'daycare' | 'park' | 'beach' | 'travel_excursion' | 'home';
  location?: string; // Location / venue name (defaults to child's location)
  locationCoords?: { lat: number; lon: number; name: string };
  enabled: boolean;
}

export type ActivityLevel = 'high_energy' | 'moderate' | 'calm_lounger';
export type TemperatureTendency = 'runs_hot' | 'normal' | 'runs_cold';

export interface ChildProfile {
  id: string;
  name: string;
  birthDate: string; // YYYY-MM-DD
  avatarColor: string; // e.g., 'sky', 'emerald', 'violet', 'amber', 'rose'
  location?: string; // Primary home/city location for the child (default for activities)
  locationCoords?: { lat: number; lon: number; name: string };
  activityLevel?: ActivityLevel;
  temperatureTendency?: TemperatureTendency;
  specialTraits?: string[]; // e.g. 'sensitive_skin', 'refuses_hats', 'sweaty_head'
  schedules?: ChildScheduleItem[];
  notes?: string;
  availableClothingIds?: string[]; // Item IDs from clothing-catalog.json that the child owns
}

