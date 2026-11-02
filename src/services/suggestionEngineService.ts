import { ChildProfile, ChildScheduleItem } from '../types/child';
import { WeatherData } from '../types/weather';
import { formatLocalDate } from '../utils/scheduleUtils';
import { CLOTHING_CATALOG } from '../utils/clothingCatalog';
import {
  AiOutfitPlan,
  WeatherByActivity,
  ActivityWeatherUnits,
  HourlyWeatherRecord,
  CachedSuggestionRecord,
  SuggestionEngineRequestPayload,
} from '../types/suggestionEngine';

const CACHE_PREFIX = 'kiddie_suggestion_cache_v4_';

// ---------------------------------------------------------------------------
// Client-side AI engine (Pollinations AI — no API key, uses device IP)
// ---------------------------------------------------------------------------

const OUTFIT_PROMPT_TEMPLATE = `You are a parenting assistant. Generate a weather-appropriate clothing plan for the child's activities.

### RULES:
1. \`wear_on_start\` MUST include ALL THREE: (a) a top/upper garment, (b) bottoms (trousers/shorts/leggings), (c) footwear. Never omit any group.
2. \`pack_and_carry\` MUST cover only conditions during the activity window (start_time–end_time). Never pack layers for temperature drops after the activity ends, or gear for weather before it starts.
3. All items in \`wear_on_start\` and \`pack_and_carry\` MUST be from the wardrobe.
4. Evaluate mosquito repellent per activity based on outdoor exposure, greenery, water proximity, and timing.
5. Exclude umbrella and sunscreen from \`wear_on_start\` and \`pack_and_carry\`.
6. Do NOT suggest spare or backup changes of clothes.
7. Use each activity's \`location\` to account for local conditions (coastal breeze, indoor climate, park shade, open playground, etc.).
8. Output MUST be valid raw JSON only — no markdown, no explanatory text.

### JSON SCHEMA:
{"plan_date":"YYYY-MM-DD","activities":[{"activity_name":"string","location":"string","time_window":"string","wear_on_start":[{"item":"string"}],"pack_and_carry":[{"item":"string","appropriate_when":"string"}],"mosquito_repellent":{"needed":true,"hours":"string","reason":"string"}}]}

---
<child>{{CHILD_INFO}}</child>

<activities>
{{ACTIVITIES_TO_CONSIDER}}
</activities>

<weather>
Compact JSON per activity (fieldOrder+rows if present). WMO codes: 0–3 clear/cloudy, 45–48 fog, 51–67 rain, 71–77 snow, 80–86 showers, 95–99 thunderstorm.
{{WEATHER_JSON}}
</weather>

<wardrobe>
Compact JSON: \`fieldOrder\` names the fields; \`categories\` maps each category to rows of values in that order (id, role, ins=insulation, br=breathability, wp=waterProtection, wi=windProtection, sp=sunProtection, cov=coverage). Only use items listed here.
{{WARDROBE}}
</wardrobe>`;

function compactCatalogForPrompt(catalog: { categories?: any[] }): Record<string, any> {
  const PROP_KEYS = ['insulation', 'breathability', 'waterProtection', 'windProtection', 'sunProtection', 'coverage'];
  const ABBREV: Record<string, string> = { insulation: 'ins', breathability: 'br', waterProtection: 'wp', windProtection: 'wi', sunProtection: 'sp', coverage: 'cov' };
  const fieldOrder = ['id', 'role', ...PROP_KEYS.map((p) => ABBREV[p])];
  const categories: Record<string, any[][]> = {};
  for (const cat of catalog.categories || []) {
    if (!cat.id) continue;
    const rows = (cat.items || [])
      .filter((item: any) => item.id)
      .map((item: any) => [item.id, item.layerRole ?? null, ...PROP_KEYS.map((p) => item.properties?.[p] ?? null)]);
    if (rows.length) categories[cat.id] = rows;
  }
  return { fieldOrder, categories };
}

function childInfoToString(info: Record<string, any>): string {
  return Object.entries(info)
    .filter(([, v]) => v != null && v !== '' && (!Array.isArray(v) || v.length > 0))
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
    .join('. ') + '.';
}

function extractJsonPlan(text: string): AiOutfitPlan | null {
  let clean = text.trim();
  const fence = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence) clean = fence[1].trim();
  try {
    const data = JSON.parse(clean);
    if (data && Array.isArray(data.activities)) return data as AiOutfitPlan;
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const data = JSON.parse(match[0]);
        if (data && Array.isArray(data.activities)) return data as AiOutfitPlan;
      } catch {}
    }
  }
  return null;
}

async function callPollinationsAI(
  promptText: string,
  onStatusUpdate?: (msg: string) => void,
): Promise<AiOutfitPlan | null> {
  const MAX_ATTEMPTS = 3;
  const TIMEOUT_MS = 90000;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (attempt > 1) {
      onStatusUpdate?.(`Retrying… (attempt ${attempt} of ${MAX_ATTEMPTS})`);
      await new Promise((r) => setTimeout(r, 5000));
    } else {
      const progressTimer = setTimeout(() => onStatusUpdate?.('Engine is processing…'), 12000);
      // Store ref so it can be cleared on fast success (minor cleanup)
      void progressTimer;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(`[AI] attempt ${attempt}: timeout after ${TIMEOUT_MS}ms — aborting`);
      controller.abort();
    }, TIMEOUT_MS);

    try {
      console.log(`[AI] attempt ${attempt}/${MAX_ATTEMPTS}: sending request (prompt=${promptText.length} chars)`);
      const res = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: promptText }],
          model: 'openai-fast',
          jsonMode: true,
          max_tokens: 4096,
        }),
        signal: controller.signal,
      });
      console.log(`[AI] attempt ${attempt}: status=${res.status}`);

      if (res.ok) {
        const text = await res.text();
        clearTimeout(timeoutId);
        console.log(`[AI] attempt ${attempt}: body.length=${text.length}, head=${text.slice(0, 120)}`);
        const plan = extractJsonPlan(text);
        console.log(`[AI] attempt ${attempt}: parse=${plan ? 'OK' : 'FAILED'}`);
        if (plan) return plan;
      } else {
        clearTimeout(timeoutId);
        const errBody = await res.text().catch(() => '');
        console.warn(`[AI] attempt ${attempt}: HTTP ${res.status} — ${errBody.slice(0, 150)}`);
      }
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[AI] attempt ${attempt}: error — ${msg}`);
    }
  }
  console.warn('[AI] all attempts exhausted — returning null');
  return null;
}

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
  onStatusUpdate?: (message: string) => void;
}): Promise<{ plan: AiOutfitPlan; isCached: boolean; timestamp: number; cacheKey: string; engineFailed?: boolean }> {
  const { child, activities, weatherData, dateStr, ageLabel, forceRefresh, onStatusUpdate } = params;
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
        engineFailed: false,
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

  // Build filtered catalog dict from owned IDs so agent.py never needs to read a file
  const ownedIds = new Set(child.availableClothingIds || []);
  const hasWater = formattedActivities.some((a) => {
    const text = (a.activity_name + ' ' + a.location).toLowerCase();
    return ['beach','water','swim','pool','sea','lake','splash'].some((t) => text.includes(t));
  });
  const filteredCategories = CLOTHING_CATALOG.categories
    .filter((cat: any) => hasWater || cat.id !== 'water_activities')
    .map((cat: any) => ({
      ...cat,
      items: cat.items.filter((item: any) => ownedIds.size === 0 || ownedIds.has(item.id)),
    }))
    .filter((cat: any) => cat.items.length > 0);
  const filteredProducts = (CLOTHING_CATALOG.nonClothingProducts || []).filter(
    (p: any) => ownedIds.size === 0 || ownedIds.has(p.id)
  );
  const wardrobe_list = {
    catalogVersion: (CLOTHING_CATALOG as any).catalogVersion ?? 1,
    propertyScales: (CLOTHING_CATALOG as any).propertyScales ?? {},
    categories: filteredCategories,
    nonClothingProducts: filteredProducts,
  };

  const payload: SuggestionEngineRequestPayload = {
    weather_by_activity,
    child_info,
    activities: formattedActivities,
    owned_item_ids: child.availableClothingIds || [],
    wardrobe_list,
  };

  let generatedPlan: AiOutfitPlan | null = null;

  // 3. Call Pollinations AI directly from the device (uses device IP — no server rate limiting)
  try {
    const prompt = OUTFIT_PROMPT_TEMPLATE
      .replace('{{CHILD_INFO}}', childInfoToString(child_info))
      .replace('{{ACTIVITIES_TO_CONSIDER}}', JSON.stringify(formattedActivities, null, 2))
      .replace('{{WEATHER_JSON}}', JSON.stringify(compactWeatherForPrompt(weather_by_activity)))
      .replace('{{WARDROBE}}', JSON.stringify(compactCatalogForPrompt(wardrobe_list)));

    console.log('[AI] prompt built, length=', prompt.length);
    generatedPlan = await callPollinationsAI(prompt, onStatusUpdate);
  } catch (err: unknown) {
    console.error('[AI] unexpected error in suggestion block:', err instanceof Error ? err.message : String(err));
  }

  // 4. Engine failed after all retries — signal failure without overwriting the existing cache
  if (!generatedPlan) {
    return {
      plan: null as unknown as AiOutfitPlan,
      isCached: false,
      timestamp: Date.now(),
      cacheKey,
      engineFailed: true,
    };
  }

  // 5. Save fresh plan to cache
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
    engineFailed: false,
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
