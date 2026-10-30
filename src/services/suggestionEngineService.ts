import { ChildProfile, ChildScheduleItem } from '../types/child';
import { WeatherData } from '../types/weather';
import { formatLocalDate } from '../utils/scheduleUtils';
import {
  AiOutfitPlan,
  WeatherByActivity,
  ActivityWeatherUnits,
  HourlyWeatherRecord,
  CachedSuggestionRecord,
  SuggestionEngineRequestPayload,
} from '../types/suggestionEngine';

const CACHE_PREFIX = 'kiddie_suggestion_cache_v4_';

export const STANDARD_WEATHER_UNITS: ActivityWeatherUnits = {
  time: 'iso8601',
  temperature_2m: '°C',
  apparent_temperature: '°C',
  precipitation_probability: '%',
  precipitation: 'mm',
  weather_code: 'wmo code',
  cloud_cover: '%',
  visibility: 'm',
  wind_speed_10m: 'km/h',
  wind_gusts_10m: 'km/h',
  uv_index: '',
  is_day: '',
};

/**
 * Format a hash string deterministically
 */
export function simpleStringHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Computes deterministic cache key for the clothing suggestion.
 * Re-queries ONLY if changes were made to:
 * 1. The day's activities (times, location, types)
 * 2. The child's profile (traits, DOB, temperature tendency, activity level)
 * 3. Their wardrobe (owned clothing item IDs)
 */
export function computeSuggestionCacheKey(
  child: ChildProfile,
  activities: Array<ChildScheduleItem | { title: string; startTime: string; endTime: string; locationType?: string; location?: string }>,
  dateStr: string
): string {
  const profileSnapshot = {
    id: child.id,
    name: child.name,
    dob: child.birthDate,
    location: child.location || '',
    activityLevel: child.activityLevel || 'moderate',
    tempTendency: child.temperatureTendency || 'normal',
    specialTraits: [...(child.specialTraits || [])].sort(),
  };

  const wardrobeSnapshot = [...(child.availableClothingIds || [])].sort();

  const activitiesSnapshot = activities
    .map((act) => ({
      title: act.title,
      start: act.startTime,
      end: act.endTime,
      locType: 'locationType' in act ? act.locationType : '',
      loc: ('location' in act && act.location) ? act.location : (child.location || ''),
    }))
    .sort((a, b) => (a.title + a.start).localeCompare(b.title + b.start));

  const rawKey = JSON.stringify({
    date: dateStr,
    profile: profileSnapshot,
    wardrobe: wardrobeSnapshot,
    activities: activitiesSnapshot,
  });

  return `${child.id}_${simpleStringHash(rawKey)}`;
}

/**
 * Build weather_by_activity following the exact structure:
 * {
 *   "Daycare / Nursery": {
 *       "location": "Rosh HaAyin, Israel",
 *       "start_time": "2026-10-21T07:30:00",
 *       "end_time": "2026-10-21T07:45:00",
 *       "units": { ... },
 *       "weather": [ ... ]
 *   }
 * }
 */
export function buildWeatherByActivity(
  activities: Array<ChildScheduleItem | { title: string; startTime: string; endTime: string; locationType?: string; location?: string }>,
  weatherData: WeatherData,
  dateStr?: string,
  childLocation?: string
): WeatherByActivity {
  const fallbackDateStr = formatLocalDate();
  const firstHourlyDate = weatherData?.hourly?.[0]?.time ? weatherData.hourly[0].time.slice(0, 10) : undefined;
  const todayDate = dateStr || firstHourlyDate || fallbackDateStr;
  const locationName = childLocation || weatherData.locationName || 'Local Area';
  const weatherByActivity: WeatherByActivity = {};

  activities.forEach((act) => {
    const activityName = act.title;
    const startIso = `${todayDate}T${act.startTime}:00`;
    const endIso = `${todayDate}T${act.endTime}:00`;
    const actLocation = ('location' in act && act.location && act.location.trim())
      ? act.location.trim()
      : locationName;

    // Filter hourly weather points for this activity window
    const startHourNum = parseInt(act.startTime.split(':')[0], 10) || 0;
    const endHourNum = parseInt(act.endTime.split(':')[0], 10) || startHourNum + 2;

    const matchedPoints: HourlyWeatherRecord[] = [];

    weatherData.hourly.forEach((p) => {
      const ptDate = p.time.slice(0, 10);
      const ptHour = parseInt(p.time.slice(11, 13), 10);

      // Match today's hours within [startHourNum, endHourNum]
      if ((ptDate === todayDate || !ptDate) && ptHour >= startHourNum && ptHour <= endHourNum) {
        matchedPoints.push({
          time: p.time.length <= 16 ? p.time : p.time.slice(0, 16),
          temperature_2m: p.temperature,
          apparent_temperature: p.apparentTemperature,
          precipitation_probability: p.precipitationProbability,
          precipitation: p.precipitation ?? 0.0,
          weather_code: p.weatherCode,
          cloud_cover: p.cloudCover ?? 0,
          visibility: p.visibility ?? 30000.0,
          wind_speed_10m: p.windSpeed,
          wind_gusts_10m: p.windGusts ?? Number((p.windSpeed * 1.5).toFixed(1)),
          uv_index: p.uvIndex,
          is_day: p.isDay ?? (ptHour >= 6 && ptHour <= 18 ? 1 : 0),
        });
      }
    });

    // If no hourly points matched the exact hour span, synthesize representative records from current/hourly
    if (matchedPoints.length === 0) {
      const spanHours = Math.max(1, endHourNum - startHourNum);
      for (let hOffset = 0; hOffset <= spanHours; hOffset++) {
        const hour = (startHourNum + hOffset) % 24;
        const timeStr = `${todayDate}T${String(hour).padStart(2, '0')}:00`;
        const temp = weatherData.current.temperature + hOffset * 0.5;
        matchedPoints.push({
          time: timeStr,
          temperature_2m: temp,
          apparent_temperature: weatherData.current.apparentTemperature + hOffset * 0.5,
          precipitation_probability: 0,
          precipitation: 0.0,
          weather_code: weatherData.current.weatherCode,
          cloud_cover: 10,
          visibility: 30000.0,
          wind_speed_10m: weatherData.current.windSpeed || 5.0,
          wind_gusts_10m: (weatherData.current.windSpeed || 5.0) * 1.5,
          uv_index: hour >= 9 && hour <= 16 ? (weatherData.current.uvIndex || 2.0) : 0.0,
          is_day: hour >= 6 && hour <= 18 ? 1 : 0,
        });
      }
    }

    weatherByActivity[activityName] = {
      location: actLocation,
      start_time: startIso,
      end_time: endIso,
      units: { ...STANDARD_WEATHER_UNITS },
      weather: matchedPoints,
    };
  });

  return weatherByActivity;
}

/**
 * Non-essential hourly weather properties pruned from LLM prompt:
 * - visibility: Flight navigational metric (e.g. 30000m) with zero relevance to pediatric clothing.
 * - cloud_cover: Fully captured by weather_code (0=clear, 1-2=partly cloudy, 3=overcast).
 * - precipitation: Volume in mm is redundant alongside precipitation_probability (%) and weather_code.
 * - wind_gusts_10m: Peak gust is ~1.5x wind_speed_10m; wind chill is factored into apparent_temperature.
 * - is_day: Redundant with the hour timestamp in the ISO 8601 time string.
 */
export const REDUNDANT_PROMPT_WEATHER_FIELDS = new Set([
  'visibility',
  'cloud_cover',
  'precipitation',
  'wind_gusts_10m',
  'is_day',
]);

/**
 * Essential weather fields necessary for pediatric clothing & outdoor comfort decisions
 */
export const ESSENTIAL_PROMPT_WEATHER_FIELDS = [
  'time',
  'temperature_2m',
  'apparent_temperature',
  'precipitation_probability',
  'weather_code',
  'wind_speed_10m',
  'uv_index',
];

/**
 * Compacts weather_by_activity into minimal, token-optimized field-order/row representation
 * by stripping redundant fields. Reduces weather prompt token footprint by ~50%.
 */
export function compactWeatherForPrompt(weatherByActivity: WeatherByActivity): Record<string, any> {
  const result: Record<string, any> = {};

  Object.entries(weatherByActivity).forEach(([actName, actData]) => {
    const rawWeather = actData.weather || [];
    if (rawWeather.length === 0) {
      result[actName] = actData;
      return;
    }

    // Retain only essential fields in preferred order
    const fieldOrder = ESSENTIAL_PROMPT_WEATHER_FIELDS.filter((f) => f in (rawWeather[0] || {}));
    const rows = rawWeather.map((rec) => fieldOrder.map((f) => (rec as any)[f]));

    const units: Record<string, string> = {};
    if (actData.units) {
      fieldOrder.forEach((f) => {
        if ((actData.units as any)[f] !== undefined) {
          units[f] = (actData.units as any)[f];
        }
      });
    }

    result[actName] = {
      location: actData.location,
      start_time: actData.start_time,
      end_time: actData.end_time,
      units,
      fieldOrder,
      rows,
    };
  });

  return result;
}

/**
 * Builds child info in natural language or dictionary for the suggestion engine
 */
export function buildChildInfoPayload(child: ChildProfile, ageLabel?: string): Record<string, any> {
  const activityLevelMap: Record<string, string> = {
    high_energy: 'High-energy runner',
    moderate: 'Moderate activity',
    calm_lounger: 'Calm lounger / quiet stroller',
  };

  const tempTendencyMap: Record<string, string> = {
    runs_hot: 'Runs hot (sweats easily)',
    normal: 'Normal temperature regulation',
    runs_cold: 'Runs cold (chills easily)',
  };

  return {
    'Child name': child.name,
    'Date of birth (DOB)': child.birthDate,
    'Age': ageLabel || 'Toddler',
    'Primary / Home location': child.location || 'Local Area',
    'Movement and activity level': activityLevelMap[child.activityLevel || 'moderate'] || 'Moderate activity',
    'Body heat tendency': tempTendencyMap[child.temperatureTendency || 'normal'] || 'Normal',
    'Special clothing and sensory preferences': child.specialTraits && child.specialTraits.length > 0
      ? child.specialTraits.map((t) => t.replace(/_/g, ' '))
      : ['None'],
    'Notes': child.notes || '',
  };
}

// In-memory cache fallback for environments without localStorage (Node.js/test runners)
const inMemoryCacheStore: Record<string, string> = {};

function getStorageItem(key: string): string | null {
  if (typeof localStorage !== 'undefined') {
    try {
      return localStorage.getItem(key);
    } catch {
      return inMemoryCacheStore[key] || null;
    }
  }
  return inMemoryCacheStore[key] || null;
}

function setStorageItem(key: string, value: string): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(key, value);
      return;
    } catch {
      inMemoryCacheStore[key] = value;
      return;
    }
  }
  inMemoryCacheStore[key] = value;
}

function removeStorageItem(key: string): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(key);
    } catch {
      delete inMemoryCacheStore[key];
      return;
    }
  }
  delete inMemoryCacheStore[key];
}

/**
 * Retrieves cached suggestion from localStorage (or memory) if valid for current key
 */
export function getCachedSuggestion(childId: string, expectedCacheKey: string): CachedSuggestionRecord | null {
  try {
    const raw = getStorageItem(`${CACHE_PREFIX}${childId}`);
    if (!raw) return null;
    const parsed: CachedSuggestionRecord = JSON.parse(raw);
    if (parsed && parsed.cacheKey === expectedCacheKey && parsed.plan) {
      return parsed;
    }
  } catch (err) {
    console.warn('Error reading suggestion cache:', err);
  }
  return null;
}

/**
 * Saves suggestion into cache
 */
export function saveSuggestionToCache(record: CachedSuggestionRecord): void {
  try {
    setStorageItem(`${CACHE_PREFIX}${record.childId}`, JSON.stringify(record));
  } catch (err) {
    console.warn('Error writing suggestion cache:', err);
  }
}

/**
 * Clears the suggestion cache for a child (or all)
 */
export function clearSuggestionCache(childId?: string): void {
  try {
    if (childId) {
      removeStorageItem(`${CACHE_PREFIX}${childId}`);
    } else {
      if (typeof localStorage !== 'undefined') {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith(CACHE_PREFIX)) {
            localStorage.removeItem(key);
          }
        });
      }
      Object.keys(inMemoryCacheStore).forEach((key) => {
        if (key.startsWith(CACHE_PREFIX)) {
          delete inMemoryCacheStore[key];
        }
      });
    }
  } catch (err) {
    console.warn('Error clearing suggestion cache:', err);
  }
}

/**
 * Main service call: gets clothing suggestion using cache first.
 * Re-queries only when activities, profile, or wardrobe change.
 */
export async function getClothingSuggestion(params: {
  child: ChildProfile;
  activities: Array<ChildScheduleItem | { title: string; startTime: string; endTime: string; locationType?: string; location?: string }>;
  weatherData: WeatherData;
  dateStr?: string;
  ageLabel?: string;
  forceRefresh?: boolean;
}): Promise<{ plan: AiOutfitPlan; isCached: boolean; timestamp: number; cacheKey: string }> {
  const { child, activities, weatherData, dateStr, ageLabel, forceRefresh } = params;
  const fallbackDateStr = formatLocalDate();
  const firstHourlyDate = weatherData?.hourly?.[0]?.time ? weatherData.hourly[0].time.slice(0, 10) : undefined;
  const todayDate = dateStr || firstHourlyDate || fallbackDateStr;

  const cacheKey = computeSuggestionCacheKey(child, activities, todayDate);

  // 1. Check cache first unless forceRefresh is set
  if (!forceRefresh) {
    const cached = getCachedSuggestion(child.id, cacheKey);
    if (cached) {
      return {
        plan: cached.plan,
        isCached: true,
        timestamp: cached.timestamp,
        cacheKey,
      };
    }
  }

  // 2. Prepare payload for suggestion engine (agent.py)
  const defaultLocation = child.location || weatherData.locationName || 'Local Area';
  const weather_by_activity = buildWeatherByActivity(activities, weatherData, todayDate, defaultLocation);
  const child_info = buildChildInfoPayload(child, ageLabel);
  const formattedActivities = activities.map((act) => ({
    type: act.title,
    activity_name: act.title,
    location: ('location' in act && act.location && act.location.trim()) ? act.location.trim() : defaultLocation,
    start_time: `${todayDate}T${act.startTime}:00`,
    end_time: `${todayDate}T${act.endTime}:00`,
  }));

  const payload: SuggestionEngineRequestPayload = {
    weather_by_activity,
    child_info,
    activities: formattedActivities,
    owned_item_ids: child.availableClothingIds || [],
  };

  let generatedPlan: AiOutfitPlan | null = null;

  // 3. Request suggestion via backend API /api/suggestion (which executes agent.py)
  try {
    const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${apiBase}/api/suggestion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.plan && Array.isArray(data.plan.activities)) {
        generatedPlan = data.plan;
      }
    }
  } catch (err) {
    console.warn('Backend /api/suggestion call failed, attempting client-side fallback:', err);
  }

  // 4. Client-side fallback if backend API is not available
  if (!generatedPlan) {
    generatedPlan = await generateClientFallbackPlan(payload, todayDate);
  }

  // 5. Save to cache
  const record: CachedSuggestionRecord = {
    cacheKey,
    childId: child.id,
    dateStr: todayDate,
    plan: generatedPlan,
    timestamp: Date.now(),
    activeActivityKeys: activities.map((a) => a.title),
  };
  saveSuggestionToCache(record);

  return {
    plan: generatedPlan,
    isCached: false,
    timestamp: record.timestamp,
    cacheKey,
  };
}

/**
 * High-reliability client fallback using Pollinations AI or realistic structured synthesis
 */
async function generateClientFallbackPlan(
  payload: SuggestionEngineRequestPayload,
  planDate: string
): Promise<AiOutfitPlan> {
  try {
    const prompt = `You are an expert parenting assistant specializing in child comfort, outdoor safety, and weather-appropriate clothing.
Analyze the provided inputs and generate a structured recommendation plan for the day's activities.

RULES:
1. Per activity, determine what clothes the child should wear initially from wardrobe (kid must be fully clothed), and what clothing items to carry/pack (with timing and conditions).
2. Pack and carry items MUST be strictly relevant to conditions occurring strictly DURING that specific activity's exact time window (between start_time and end_time). Never recommend packing layers for evening cool-down if the activity ends by 17:00, and do not pack items for weather before the activity starts.
3. Items MUST be only from the clothing wardrobe.
4. Separately evaluate insect (mosquito) repellent for each activity: specify whether it is needed, along with appropriate hours and reason.
5. Do NOT suggest packing spare clothes or extra changes of clothes (e.g., spare t-shirt for daycare, backup change); spare clothes are a general facility policy or routine matter, not a day-specific weather need.
6. Assume the weather data is accurate. Output MUST be valid raw JSON matching the schema below. No markdown code blocks or conversational text.

JSON SCHEMA:
{
  "plan_date": "${planDate}",
  "activities": [
    {
      "activity_name": "string",
      "time_window": "string",
      "wear_on_start": [{"item": "string"}],
      "pack_and_carry": [{"item": "string", "appropriate_when": "string"}],
      "mosquito_repellent": {
        "needed": true,
        "hours": "string",
        "reason": "string"
      }
    }
  ]
}

CHILD: ${JSON.stringify(payload.child_info)}
ACTIVITIES: ${JSON.stringify(payload.activities)}
WEATHER: ${JSON.stringify(compactWeatherForPrompt(payload.weather_by_activity || {}))}
WARDROBE: ${JSON.stringify(payload.owned_item_ids || [])}`;

    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        jsonMode: true,
        response_format: { type: 'json_object' },
        max_tokens: 4000,
      }),
    });

    if (res.ok) {
      const text = await res.text();
      let clean = text.trim();
      if (clean.startsWith('```json')) clean = clean.slice(7);
      if (clean.startsWith('```')) clean = clean.slice(3);
      if (clean.endsWith('```')) clean = clean.slice(0, -3);
      const parsed = JSON.parse(clean.trim());
      if (parsed && Array.isArray(parsed.activities)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Pollinations client fallback error:', err);
  }

  // Graceful deterministic synthesis if network is completely offline
  const activities = payload.activities.map((act) => {
    const actName = act.activity_name || act.type || 'Activity';
    const weatherEntry = payload.weather_by_activity[actName];
    const avgTemp = weatherEntry?.weather?.[0]?.temperature_2m ?? 20;
    const isCold = avgTemp < 15;
    const isHot = avgTemp > 24;

    const wear_on_start = isCold
      ? [
          { item: 'thin_long_sleeve_shirt' },
          { item: 'regular_long_trousers' },
          { item: 'fleece_jacket' },
          { item: 'closed_toe_shoes' },
        ]
      : isHot
      ? [
          { item: 'short_sleeve_tshirt' },
          { item: 'shorts' },
          { item: 'breathable_sneakers' },
          { item: 'wide_brim_sun_hat' },
        ]
      : [
          { item: 'short_sleeve_tshirt' },
          { item: 'lightweight_long_trousers' },
          { item: 'breathable_sneakers' },
        ];

    const pack_and_carry = [
      {
        item: isCold ? 'heavy_winter_coat' : 'sweatshirt',
        appropriate_when: 'During the activity if temperature drops',
      },
    ];

    const isOutdoor =
      actName.toLowerCase().includes('park') ||
      actName.toLowerCase().includes('play') ||
      actName.toLowerCase().includes('outdoor');

    return {
      activity_name: actName,
      time_window: `${act.start_time.slice(11, 16)} to ${act.end_time.slice(11, 16)}`,
      wear_on_start,
      pack_and_carry,
      mosquito_repellent: {
        needed: isOutdoor,
        hours: isOutdoor ? `${act.start_time.slice(11, 16)} - ${act.end_time.slice(11, 16)}` : 'None',
        reason: isOutdoor ? 'Outdoor park play near greenery' : 'Indoor activity',
      },
    };
  });

  return {
    plan_date: planDate,
    activities,
  };
}
