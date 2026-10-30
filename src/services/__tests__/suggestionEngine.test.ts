import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildWeatherByActivity,
  computeSuggestionCacheKey,
  buildChildInfoPayload,
  getCachedSuggestion,
  saveSuggestionToCache,
  clearSuggestionCache,
  STANDARD_WEATHER_UNITS,
} from '../suggestionEngineService';
import { ChildProfile, ChildScheduleItem } from '../../types/child';
import { WeatherData } from '../../types/weather';
import { AiOutfitPlan } from '../../types/suggestionEngine';
import { calculateChildAge } from '../../utils/dateAndAge';

describe('Suggestion Engine & Caching Service', () => {
  const mockChild: ChildProfile = {
    id: 'child-test-1',
    name: 'Liam',
    birthDate: '2024-02-22',
    avatarColor: 'sky',
    activityLevel: 'high_energy',
    temperatureTendency: 'runs_hot',
    specialTraits: ['sensitive_skin'],
    availableClothingIds: ['short_sleeve_tshirt', 'lightweight_long_trousers', 'breathable_sneakers'],
  };

  const mockSchedule: ChildScheduleItem = {
    id: 'sched-1',
    title: 'Daycare / Nursery',
    startTime: '07:30',
    endTime: '17:00',
    locationType: 'daycare',
    days: [0, 1, 2, 3, 4],
    enabled: true,
  };

  const mockWeatherData: WeatherData = {
    current: {
      temperature: 15.4,
      apparentTemperature: 15.5,
      relativeHumidity: 60,
      precipitation: 0.0,
      weatherCode: 0,
      windSpeed: 5.5,
      isDay: 1,
      uvIndex: 0.0,
      time: '2026-10-21T07:30',
    },
    hourly: [
      {
        time: '2026-10-21T07:00',
        hourLabel: '7 AM',
        temperature: 15.4,
        apparentTemperature: 15.5,
        precipitationProbability: 0,
        precipitation: 0.0,
        weatherCode: 0,
        cloudCover: 0,
        visibility: 29140.0,
        windSpeed: 5.5,
        windGusts: 9.4,
        uvIndex: 0.0,
        isDay: 1,
      },
      {
        time: '2026-10-21T08:00',
        hourLabel: '8 AM',
        temperature: 17.0,
        apparentTemperature: 17.3,
        precipitationProbability: 0,
        precipitation: 0.0,
        weatherCode: 1,
        cloudCover: 8,
        visibility: 33280.0,
        windSpeed: 4.8,
        windGusts: 9.7,
        uvIndex: 0.4,
        isDay: 1,
      },
    ],
    daily: [
      {
        date: '2026-10-21',
        dayLabel: 'Today',
        weatherCode: 0,
        tempMax: 26,
        tempMin: 15,
        precipitationProbabilityMax: 0,
        uvIndexMax: 4.5,
      },
    ],
    locationName: 'Rosh HaAyin, Israel',
    latitude: 32.0954,
    longitude: 34.9544,
    timezone: 'Asia/Jerusalem',
  };

  beforeEach(() => {
    clearSuggestionCache();
  });

  describe('buildWeatherByActivity structure validation', () => {
    it('creates weather_by_activity matching user specified structure and 12 units', () => {
      const weatherByActivity = buildWeatherByActivity(
        [mockSchedule],
        mockWeatherData,
        '2026-10-21'
      );

      expect(weatherByActivity).toHaveProperty('Daycare / Nursery');
      const daycareEntry = weatherByActivity['Daycare / Nursery'];

      expect(daycareEntry.location).toBe('Rosh HaAyin, Israel');
      expect(daycareEntry.start_time).toBe('2026-10-21T07:30:00');
      expect(daycareEntry.end_time).toBe('2026-10-21T17:00:00');

      // Check all 12 unit keys
      expect(daycareEntry.units).toEqual(STANDARD_WEATHER_UNITS);
      expect(daycareEntry.units.time).toBe('iso8601');
      expect(daycareEntry.units.temperature_2m).toBe('°C');
      expect(daycareEntry.units.apparent_temperature).toBe('°C');
      expect(daycareEntry.units.precipitation_probability).toBe('%');
      expect(daycareEntry.units.precipitation).toBe('mm');
      expect(daycareEntry.units.weather_code).toBe('wmo code');
      expect(daycareEntry.units.cloud_cover).toBe('%');
      expect(daycareEntry.units.visibility).toBe('m');
      expect(daycareEntry.units.wind_speed_10m).toBe('km/h');
      expect(daycareEntry.units.wind_gusts_10m).toBe('km/h');

      // Check hourly weather records have all required properties
      expect(daycareEntry.weather.length).toBeGreaterThan(0);
      const firstPoint = daycareEntry.weather[0];
      expect(firstPoint).toHaveProperty('time');
      expect(firstPoint).toHaveProperty('temperature_2m');
      expect(firstPoint).toHaveProperty('apparent_temperature');
      expect(firstPoint).toHaveProperty('precipitation_probability');
      expect(firstPoint).toHaveProperty('precipitation');
      expect(firstPoint).toHaveProperty('weather_code');
      expect(firstPoint).toHaveProperty('cloud_cover');
      expect(firstPoint).toHaveProperty('visibility');
      expect(firstPoint).toHaveProperty('wind_speed_10m');
      expect(firstPoint).toHaveProperty('wind_gusts_10m');
      expect(firstPoint).toHaveProperty('uv_index');
      expect(firstPoint).toHaveProperty('is_day');
    });
  });

  describe('computeSuggestionCacheKey invalidation', () => {
    const baseKey = computeSuggestionCacheKey(mockChild, [mockSchedule], '2026-10-21');

    it('returns identical cache key when inputs are unchanged', () => {
      const secondKey = computeSuggestionCacheKey(mockChild, [mockSchedule], '2026-10-21');
      expect(secondKey).toBe(baseKey);
    });

    it('changes cache key when the day activities change (e.g. activity time modified)', () => {
      const modifiedSchedule = { ...mockSchedule, startTime: '09:00' };
      const newKey = computeSuggestionCacheKey(mockChild, [modifiedSchedule], '2026-10-21');
      expect(newKey).not.toBe(baseKey);
    });

    it('changes cache key when another activity is added to the day', () => {
      const secondSchedule: ChildScheduleItem = {
        id: 'sched-2',
        title: 'Park Play',
        startTime: '17:30',
        endTime: '19:00',
        locationType: 'park',
        days: [0, 1, 2, 3, 4],
        enabled: true,
      };
      const newKey = computeSuggestionCacheKey(mockChild, [mockSchedule, secondSchedule], '2026-10-21');
      expect(newKey).not.toBe(baseKey);
    });

    it('changes cache key when child profile changes (e.g. traits or thermal tendency)', () => {
      const modifiedChild: ChildProfile = {
        ...mockChild,
        temperatureTendency: 'runs_cold',
      };
      const newKey = computeSuggestionCacheKey(modifiedChild, [mockSchedule], '2026-10-21');
      expect(newKey).not.toBe(baseKey);

      const modifiedTraitsChild: ChildProfile = {
        ...mockChild,
        specialTraits: ['sensitive_skin', 'eczema'],
      };
      const traitsKey = computeSuggestionCacheKey(modifiedTraitsChild, [mockSchedule], '2026-10-21');
      expect(traitsKey).not.toBe(baseKey);
    });

    it('changes cache key when wardrobe changes (owned clothing IDs modified)', () => {
      const modifiedWardrobeChild: ChildProfile = {
        ...mockChild,
        availableClothingIds: ['short_sleeve_tshirt', 'sweatpants'],
      };
      const newKey = computeSuggestionCacheKey(modifiedWardrobeChild, [mockSchedule], '2026-10-21');
      expect(newKey).not.toBe(baseKey);
    });

    it('changes cache key when the date changes', () => {
      const newKey = computeSuggestionCacheKey(mockChild, [mockSchedule], '2026-10-22');
      expect(newKey).not.toBe(baseKey);
    });
  });

  describe('Cache storage and retrieval', () => {
    const mockPlan: AiOutfitPlan = {
      plan_date: '2026-10-21',
      activities: [
        {
          activity_name: 'Daycare / Nursery',
          time_window: '07:30-17:00',
          wear_on_start: [{ item: 'short_sleeve_tshirt' }, { item: 'lightweight_long_trousers' }],
          pack_and_carry: [{ item: 'sweatshirt', appropriate_when: 'after 16:00' }],
          accessories: [{ item: 'sunscreen', timing: '07:30 and 12:00' }],
        },
      ],
    };

    it('saves to cache and retrieves when key matches', () => {
      const cacheKey = computeSuggestionCacheKey(mockChild, [mockSchedule], '2026-10-21');

      saveSuggestionToCache({
        cacheKey,
        childId: mockChild.id,
        dateStr: '2026-10-21',
        plan: mockPlan,
        timestamp: Date.now(),
        activeActivityKeys: [mockSchedule.title],
      });

      const cached = getCachedSuggestion(mockChild.id, cacheKey);
      expect(cached).not.toBeNull();
      expect(cached?.plan.activities[0].activity_name).toBe('Daycare / Nursery');
      expect(cached?.plan.activities[0].wear_on_start).toHaveLength(2);
    });

    it('returns null when cache key is mismatched (invalidation on change)', () => {
      const oldCacheKey = computeSuggestionCacheKey(mockChild, [mockSchedule], '2026-10-21');

      saveSuggestionToCache({
        cacheKey: oldCacheKey,
        childId: mockChild.id,
        dateStr: '2026-10-21',
        plan: mockPlan,
        timestamp: Date.now(),
        activeActivityKeys: [mockSchedule.title],
      });

      // Child changes wardrobe
      const newWardrobeChild = { ...mockChild, availableClothingIds: ['rain_boots'] };
      const newKey = computeSuggestionCacheKey(newWardrobeChild, [mockSchedule], '2026-10-21');

      const cached = getCachedSuggestion(mockChild.id, newKey);
      expect(cached).toBeNull();
    });
  });

  describe('buildChildInfoPayload', () => {
    it('formats child profile attributes into descriptive dictionary', () => {
      const payload = buildChildInfoPayload(mockChild, '2 years 8 months');
      expect(payload['Child name']).toBe('Liam');
      expect(payload['Date of birth (DOB)']).toBe('2024-02-22');
      expect(payload['Body heat tendency']).toBe('Runs hot (sweats easily)');
      expect(payload['Movement and activity level']).toBe('High-energy runner');
      expect(payload['Special clothing and sensory preferences']).toContain('sensitive skin');
    });
  });

  describe('populateRecommendationFromAiPlan', () => {
    const multiActivityPlan: AiOutfitPlan = {
      plan_date: '2026-10-21',
      activities: [
        {
          activity_name: 'Daycare / Nursery',
          time_window: '07:30 to 16:30',
          wear_on_start: [
            { item: 'short_sleeve_tshirt' },
            { item: 'lightweight_long_trousers' },
            { item: 'breathable_sneakers' },
          ],
          pack_and_carry: [
            { item: 'sweatshirt', appropriate_when: 'In the late afternoon if breezy' },
            { item: 'light_rain_jacket', appropriate_when: 'In the afternoon if it starts raining' },
          ],
          accessories: [
            { item: 'sunscreen', timing: '08:00 before daycare and reapply at 14:00' },
          ],
        },
        {
          activity_name: 'Park / Outdoor Play',
          time_window: '16:30 to 18:30',
          wear_on_start: [
            { item: 'short_sleeve_tshirt' },
            { item: 'lightweight_long_trousers' },
          ],
          pack_and_carry: [
            { item: 'sweatshirt', appropriate_when: 'When evening temperature drops' },
          ],
          accessories: [
            { item: 'mosquito_repellent_spray', timing: 'Apply at 16:30 before evening park play' },
            { item: 'wide_brim_sun_hat', timing: '16:30 - 17:30' },
          ],
        },
      ],
    };

    const scheduleDaycare: ChildScheduleItem = {
      id: 'sched-daycare',
      title: 'Daycare / Nursery',
      startTime: '07:30',
      endTime: '16:30',
      locationType: 'daycare',
      days: [0, 1, 2, 3, 4],
      enabled: true,
    };

    const schedulePark: ChildScheduleItem = {
      id: 'sched-park',
      title: 'Park / Outdoor Play',
      startTime: '16:30',
      endTime: '18:30',
      locationType: 'park',
      days: [0, 1, 2, 3, 4],
      enabled: true,
    };

    const mockAgeCalc = calculateChildAge('2024-02-22');

    it('populates recommendation based on single selected activity (Daycare)', async () => {
      const { populateRecommendationFromAiPlan } = await import('../populateSuggestionFromEngine');

      const rec = populateRecommendationFromAiPlan({
        plan: multiActivityPlan,
        selectedScheduleIds: ['sched-daycare'],
        activeSchedulesToday: [scheduleDaycare, schedulePark],
        weatherData: mockWeatherData,
        ageCalculation: mockAgeCalc,
        child: mockChild,
      });

      expect(rec.status).toBe('success');
      // Wear on start layers populated from Daycare wear_on_start
      const wearIds = [
        ...rec.wearNowLayers.baseLayer,
        ...rec.wearNowLayers.midLayer,
        ...rec.wearNowLayers.outerLayer,
        ...rec.wearNowLayers.extremities,
      ].map((i) => i.id);

      expect(wearIds).toContain('short_sleeve_tshirt');
      expect(wearIds).toContain('lightweight_long_trousers');
      expect(wearIds).toContain('breathable_sneakers');

      // Pack in bag contains sweatshirt
      const packIds = rec.packInBagItems.map((p) => p.id);
      expect(packIds).toContain('sweatshirt');

      // Mosquito repellent was NOT recommended for Daycare
      expect(rec.mosquitoAdvice.needed).toBe(false);
    });

    it('populates mosquito protection and transition when Park activity is selected', async () => {
      const { populateRecommendationFromAiPlan } = await import('../populateSuggestionFromEngine');

      const rec = populateRecommendationFromAiPlan({
        plan: multiActivityPlan,
        selectedScheduleIds: ['sched-park'],
        activeSchedulesToday: [scheduleDaycare, schedulePark],
        weatherData: mockWeatherData,
        ageCalculation: mockAgeCalc,
        child: mockChild,
      });

      // Park activity specifically recommended mosquito repellent
      expect(rec.mosquitoAdvice.needed).toBe(true);
      expect(rec.mosquitoAdvice.headline).toContain('16:30');
    });

    it('combines multi-activity routines with transitions when both selected', async () => {
      const { populateRecommendationFromAiPlan } = await import('../populateSuggestionFromEngine');

      const rec = populateRecommendationFromAiPlan({
        plan: multiActivityPlan,
        selectedScheduleIds: ['sched-daycare', 'sched-park'],
        activeSchedulesToday: [scheduleDaycare, schedulePark],
        weatherData: mockWeatherData,
        ageCalculation: mockAgeCalc,
        child: mockChild,
      });

      expect(rec.changes.length).toBeGreaterThan(0);
      expect(rec.mosquitoAdvice.needed).toBe(true);

      // Verify things are aggregated without duplicate entries under "with" and "packInBagItems"
      const sunscreenWithItems = rec.with.filter((item) => item.clothingItemId === 'sunscreen');
      expect(sunscreenWithItems.length).toBeLessThanOrEqual(1);

      const sunscreenPackItems = rec.packInBagItems.filter((item) => item.id === 'sunscreen');
      expect(sunscreenPackItems.length).toBeLessThanOrEqual(1);

      // Unique IDs across all with items
      const withIds = rec.with.map((item) => item.clothingItemId);
      expect(new Set(withIds).size).toBe(withIds.length);
    });

    it('aggregates sunscreen and common items cleanly when both activities request sunscreen', async () => {
      const { populateRecommendationFromAiPlan } = await import('../populateSuggestionFromEngine');

      const planWithDuplicateSunscreen: AiOutfitPlan = {
        plan_date: '2026-10-21',
        activities: [
          {
            activity_name: 'Morning Daycare Play',
            time_window: '08:30 to 12:30',
            wear_on_start: [{ item: 'short_sleeve_tshirt' }],
            pack_and_carry: [{ item: 'sunscreen', appropriate_when: 'Apply before morning play' }],
          },
          {
            activity_name: 'Afternoon Park Excursion',
            time_window: '14:00 to 17:00',
            wear_on_start: [{ item: 'short_sleeve_tshirt' }],
            pack_and_carry: [{ item: 'sunscreen', appropriate_when: 'Reapply before afternoon park' }],
          },
        ],
      };

      const sched1: ChildScheduleItem = {
        id: 'sched-1',
        title: 'Morning Daycare Play',
        startTime: '08:30',
        endTime: '12:30',
        locationType: 'daycare',
        days: [0, 1, 2, 3, 4],
        enabled: true,
      };

      const sched2: ChildScheduleItem = {
        id: 'sched-2',
        title: 'Afternoon Park Excursion',
        startTime: '14:00',
        endTime: '17:00',
        locationType: 'park',
        days: [0, 1, 2, 3, 4],
        enabled: true,
      };

      const rec = populateRecommendationFromAiPlan({
        plan: planWithDuplicateSunscreen,
        selectedScheduleIds: ['sched-1', 'sched-2'],
        activeSchedulesToday: [sched1, sched2],
        weatherData: mockWeatherData,
        ageCalculation: mockAgeCalc,
        child: mockChild,
      });

      // Sunscreen MUST appear exactly once under "with"
      const sunscreenWith = rec.with.filter((i) => i.clothingItemId === 'sunscreen');
      expect(sunscreenWith.length).toBe(1);
      expect(sunscreenWith[0].relevantWindowIds).toContain('Morning Daycare Play');
      expect(sunscreenWith[0].relevantWindowIds).toContain('Afternoon Park Excursion');

      // Sunscreen MUST appear exactly once under "packInBagItems"
      const sunscreenPack = rec.packInBagItems.filter((i) => i.id === 'sunscreen');
      expect(sunscreenPack.length).toBe(1);

      // No duplicates anywhere in with
      const withIds = rec.with.map((i) => i.clothingItemId);
      expect(new Set(withIds).size).toBe(withIds.length);
    });

    it('recommends mosquito repellent specifically when mosquito_repellent field is set', async () => {
      const { populateRecommendationFromAiPlan } = await import('../populateSuggestionFromEngine');

      const planWithRepellent: AiOutfitPlan = {
        plan_date: '2026-10-21',
        activities: [
          {
            activity_name: 'Park / Outdoor Play',
            time_window: '17:00 to 19:00',
            wear_on_start: [{ item: 'short_sleeve_tshirt' }],
            pack_and_carry: [],
            mosquito_repellent: {
              needed: true,
              hours: '17:30 - 19:00',
              reason: 'Evening park play near pond with high mosquito activity',
            },
          },
        ],
      };

      const rec = populateRecommendationFromAiPlan({
        plan: planWithRepellent,
        selectedScheduleIds: ['sched-park'],
        activeSchedulesToday: [schedulePark],
        weatherData: mockWeatherData,
        ageCalculation: mockAgeCalc,
        child: mockChild,
      });

      expect(rec.mosquitoAdvice.needed).toBe(true);
      expect(rec.mosquitoAdvice.headline).toContain('17:30 - 19:00');
      expect(rec.mosquitoAdvice.environmentalReason).toContain('Evening park play near pond');
    });

    it('triggers umbrella by deterministic rule when rain is forecast in window +/- 1h', async () => {
      const { populateRecommendationFromAiPlan } = await import('../populateSuggestionFromEngine');

      const weatherWithRain: WeatherData = {
        ...mockWeatherData,
        hourly: [
          ...mockWeatherData.hourly,
          {
            time: '2026-10-21T17:00',
            hourLabel: '5 PM',
            temperature: 16.0,
            apparentTemperature: 15.0,
            precipitationProbability: 70,
            precipitation: 2.5,
            weatherCode: 61, // Rain
            cloudCover: 90,
            visibility: 15000,
            windSpeed: 10,
            windGusts: 18,
            uvIndex: 0.1,
            isDay: 1,
          },
        ],
      };

      const rec = populateRecommendationFromAiPlan({
        plan: multiActivityPlan,
        selectedScheduleIds: ['sched-daycare'],
        activeSchedulesToday: [scheduleDaycare],
        weatherData: weatherWithRain,
        ageCalculation: mockAgeCalc,
        child: mockChild,
      });

      const umbrellaItem = rec.packInBagItems.find((p) => p.id === 'umbrella');
      expect(umbrellaItem).toBeDefined();
      expect(umbrellaItem?.reason).toContain('70%');
    });

    it('does NOT add umbrella if 0% rain in activity window', async () => {
      const { populateRecommendationFromAiPlan } = await import('../populateSuggestionFromEngine');

      const dryWeather: WeatherData = {
        ...mockWeatherData,
        hourly: mockWeatherData.hourly.map((h) => ({
          ...h,
          precipitationProbability: 0,
          precipitation: 0.0,
          weatherCode: 0,
        })),
      };

      const rec = populateRecommendationFromAiPlan({
        plan: multiActivityPlan,
        selectedScheduleIds: ['sched-daycare'],
        activeSchedulesToday: [scheduleDaycare],
        weatherData: dryWeather,
        ageCalculation: mockAgeCalc,
        child: mockChild,
      });

      const umbrellaItem = rec.packInBagItems.find((p) => p.id === 'umbrella');
      expect(umbrellaItem).toBeUndefined();
    });

    it('handles DEFAULT_NO_ACTIVITY_SCHEDULE querying 08:00 to 20:00 window', async () => {
      const { DEFAULT_NO_ACTIVITY_SCHEDULE } = await import('../../utils/scheduleUtils');
      expect(DEFAULT_NO_ACTIVITY_SCHEDULE.startTime).toBe('08:00');
      expect(DEFAULT_NO_ACTIVITY_SCHEDULE.endTime).toBe('20:00');

      const weatherByActivity = buildWeatherByActivity([DEFAULT_NO_ACTIVITY_SCHEDULE], mockWeatherData, '2026-10-21');
      expect(weatherByActivity['General Day']).toBeDefined();
      expect(weatherByActivity['General Day'].start_time).toContain('08:00:00');
      expect(weatherByActivity['General Day'].end_time).toContain('20:00:00');
    });

    it('defaults activity location to child location when not specified on activity', () => {
      const childWithLoc: ChildProfile = {
        ...mockChild,
        location: 'Tel Aviv, Israel',
      };

      const activityWithoutLoc: ChildScheduleItem = {
        ...mockSchedule,
        location: undefined,
      };

      const weatherByActivity = buildWeatherByActivity(
        [activityWithoutLoc],
        mockWeatherData,
        '2026-10-21',
        childWithLoc.location
      );

      expect(weatherByActivity['Daycare / Nursery'].location).toBe('Tel Aviv, Israel');
    });

    it('preserves activity specific custom location when set', () => {
      const childWithLoc: ChildProfile = {
        ...mockChild,
        location: 'Tel Aviv, Israel',
      };

      const beachActivity: ChildScheduleItem = {
        ...mockSchedule,
        id: 'beach-1',
        title: 'Beach Trip',
        location: 'Herzliya Marina Beach',
      };

      const weatherByActivity = buildWeatherByActivity(
        [beachActivity],
        mockWeatherData,
        '2026-10-21',
        childWithLoc.location
      );

      expect(weatherByActivity['Beach Trip'].location).toBe('Herzliya Marina Beach');
    });

    it('changes cache key when activity location changes', () => {
      const key1 = computeSuggestionCacheKey(
        mockChild,
        [{ ...mockSchedule, location: 'Central London' }],
        '2026-10-21'
      );
      const key2 = computeSuggestionCacheKey(
        mockChild,
        [{ ...mockSchedule, location: 'Brighton Beach' }],
        '2026-10-21'
      );

      expect(key1).not.toBe(key2);
    });

    it('changes cache key when child primary location changes', () => {
      const key1 = computeSuggestionCacheKey(
        { ...mockChild, location: 'London, UK' },
        [mockSchedule],
        '2026-10-21'
      );
      const key2 = computeSuggestionCacheKey(
        { ...mockChild, location: 'Manchester, UK' },
        [mockSchedule],
        '2026-10-21'
      );

      expect(key1).not.toBe(key2);
    });

    it('includes child primary location in child info payload', () => {
      const childWithLoc: ChildProfile = {
        ...mockChild,
        location: 'Edinburgh, UK',
      };

      const payload = buildChildInfoPayload(childWithLoc, '3 years old');
      expect(payload['Primary / Home location']).toBe('Edinburgh, UK');
    });

    it('queries and includes full morning weather points for activities that already started earlier in the day', () => {
      // Activity started at 07:30 and runs until 16:30
      const ongoingSchedule: ChildScheduleItem = {
        id: 'ongoing-daycare',
        title: 'Daycare & Playground',
        startTime: '07:30',
        endTime: '16:30',
        locationType: 'daycare',
        days: [0, 1, 2, 3, 4],
        enabled: true,
      };

      // Full day weather data with hours starting at 00:00 midnight
      const fullDayWeather: WeatherData = {
        ...mockWeatherData,
        hourly: Array.from({ length: 24 }).map((_, h) => ({
          time: `2026-10-21T${String(h).padStart(2, '0')}:00`,
          hourLabel: h === 14 ? 'Now' : `${h % 12 || 12} ${h >= 12 ? 'PM' : 'AM'}`,
          temperature: 15 + h * 0.5,
          apparentTemperature: 14 + h * 0.5,
          precipitationProbability: 10,
          precipitation: 0,
          weatherCode: 1,
          uvIndex: h >= 10 && h <= 15 ? 4 : 1,
          windSpeed: 10,
        })),
      };

      const weatherByAct = buildWeatherByActivity(
        [ongoingSchedule],
        fullDayWeather,
        '2026-10-21',
        'London, UK'
      );

      const actWeather = weatherByAct['Daycare & Playground'];
      expect(actWeather).toBeDefined();
      expect(actWeather.weather.length).toBeGreaterThanOrEqual(10); // Hours 7 through 16 = 10 records
      // Early morning points before midday are fully intact
      const morningPoint = actWeather.weather.find((p) => p.time === '2026-10-21T07:00');
      expect(morningPoint).toBeDefined();
      expect(morningPoint?.temperature_2m).toBe(15 + 7 * 0.5);
    });

    it('ensures fallback weather data starts at 00:00 midnight of the current day', async () => {
      const { getFallbackWeatherData } = await import('../weatherService');
      const fallback = getFallbackWeatherData('London, UK');
      expect(fallback.hourly.length).toBe(48);
      // First hour must be 00:00 midnight
      expect(fallback.hourly[0].time).toMatch(/T00:00/);
    });

    it('accurately identifies and matches activity hours for HourlyForecastSlider', async () => {
      const { getHourActivities } = await import('../../components/HourlyForecastSlider');
      const activities = [
        {
          id: 'act-1',
          title: 'Daycare & Nursery',
          startTime: '07:30',
          endTime: '16:30',
        },
        {
          id: 'act-2',
          title: 'Soccer Practice',
          startTime: '17:00',
          endTime: '18:30',
        },
        {
          id: 'default_no_activity',
          title: 'General Day',
          startTime: '08:00',
          endTime: '20:00',
        },
      ];

      // Hour 6 (06:00-07:00): Before Daycare starts at 07:30
      expect(getHourActivities(6, activities)).toHaveLength(0);

      // Hour 7 (07:00-08:00): Overlaps 07:30 start
      const h7 = getHourActivities(7, activities);
      expect(h7).toHaveLength(1);
      expect(h7[0].title).toBe('Daycare & Nursery');

      // Mid-day hours (8 to 15): Fully in Daycare
      expect(getHourActivities(12, activities)[0].title).toBe('Daycare & Nursery');

      // Hour 16 (16:00-17:00): Overlaps until 16:30
      const h16 = getHourActivities(16, activities);
      expect(h16).toHaveLength(1);
      expect(h16[0].title).toBe('Daycare & Nursery');

      // Hour 17 (17:00-18:00): Soccer Practice starts
      const h17 = getHourActivities(17, activities);
      expect(h17).toHaveLength(1);
      expect(h17[0].title).toBe('Soccer Practice');

      // Hour 18 (18:00-19:00): Soccer Practice ends at 18:30
      const h18 = getHourActivities(18, activities);
      expect(h18).toHaveLength(1);
      expect(h18[0].title).toBe('Soccer Practice');

      // Hour 19 (19:00-20:00): No specific activity
      expect(getHourActivities(19, activities)).toHaveLength(0);
    });

    it('compacts weather_by_activity by pruning redundant properties (visibility, cloud_cover, precipitation mm, wind_gusts, is_day)', async () => {
      const { compactWeatherForPrompt } = await import('../suggestionEngineService');
      const weatherByActivity = buildWeatherByActivity(
        [mockSchedule],
        mockWeatherData,
        '2026-10-21'
      );

      const compacted = compactWeatherForPrompt(weatherByActivity);
      const daycareCompacted = compacted['Daycare / Nursery'];

      expect(daycareCompacted).toBeDefined();
      expect(daycareCompacted.fieldOrder).toBeDefined();

      // Ensure essential fields are preserved
      expect(daycareCompacted.fieldOrder).toContain('time');
      expect(daycareCompacted.fieldOrder).toContain('temperature_2m');
      expect(daycareCompacted.fieldOrder).toContain('apparent_temperature');
      expect(daycareCompacted.fieldOrder).toContain('precipitation_probability');
      expect(daycareCompacted.fieldOrder).toContain('weather_code');
      expect(daycareCompacted.fieldOrder).toContain('wind_speed_10m');
      expect(daycareCompacted.fieldOrder).toContain('uv_index');

      // Ensure redundant fields are pruned
      expect(daycareCompacted.fieldOrder).not.toContain('visibility');
      expect(daycareCompacted.fieldOrder).not.toContain('cloud_cover');
      expect(daycareCompacted.fieldOrder).not.toContain('precipitation');
      expect(daycareCompacted.fieldOrder).not.toContain('wind_gusts_10m');
      expect(daycareCompacted.fieldOrder).not.toContain('is_day');

      // Units must also be pruned to only essential fields
      expect(daycareCompacted.units).not.toHaveProperty('visibility');
      expect(daycareCompacted.units).not.toHaveProperty('cloud_cover');
      expect(daycareCompacted.units).not.toHaveProperty('precipitation');
      expect(daycareCompacted.units).not.toHaveProperty('wind_gusts_10m');
      expect(daycareCompacted.units).not.toHaveProperty('is_day');

      // Rows contain values matching the length of fieldOrder
      expect(daycareCompacted.rows[0].length).toBe(daycareCompacted.fieldOrder.length);
      expect(daycareCompacted.rows[0].length).toBe(7); // Down from 12!
    });

    it('includes max UV and max wind speed in daily forecast records', async () => {
      const { getFallbackWeatherData } = await import('../weatherService');
      const fallback = getFallbackWeatherData('London, UK');
      expect(fallback.daily.length).toBe(7);

      fallback.daily.forEach((day) => {
        expect(day).toHaveProperty('uvIndexMax');
        expect(typeof day.uvIndexMax).toBe('number');
        expect(day.uvIndexMax).toBeGreaterThanOrEqual(0);

        expect(day).toHaveProperty('windSpeedMax');
        expect(typeof day.windSpeedMax).toBe('number');
        expect(day.windSpeedMax).toBeGreaterThanOrEqual(0);

        expect(day).toHaveProperty('windGustsMax');
        expect(typeof day.windGustsMax).toBe('number');
        expect(day.windGustsMax).toBeGreaterThanOrEqual(0);
      });
    });

    it('presents distinct time windows when routines are separated, and merges when overlapping/back-to-back', async () => {
      const { getCombinedScheduleWindow, getMergedScheduleIntervals, getScheduleTimeWindowsLabel } =
        await import('../../utils/scheduleUtils');

      // 1. Two separate non-overlapping routines (e.g. Daycare in morning, Swimming in evening)
      const separateSchedules: ChildScheduleItem[] = [
        {
          id: 's1',
          title: 'Daycare',
          startTime: '07:30',
          endTime: '12:00',
          locationType: 'daycare',
          days: [0, 1, 2, 3, 4],
          enabled: true,
        },
        {
          id: 's2',
          title: 'Soccer',
          startTime: '16:00',
          endTime: '18:00',
          locationType: 'park',
          days: [0, 1, 2, 3, 4],
          enabled: true,
        },
      ];

      const separateIntervals = getMergedScheduleIntervals(separateSchedules);
      expect(separateIntervals).toHaveLength(2);
      expect(separateIntervals[0].startTime).toBe('07:30');
      expect(separateIntervals[0].endTime).toBe('12:00');
      expect(separateIntervals[1].startTime).toBe('16:00');
      expect(separateIntervals[1].endTime).toBe('18:00');

      const label = getScheduleTimeWindowsLabel(separateSchedules);
      expect(label).toBe('07:30 – 12:00 • 16:00 – 18:00');

      const combined = getCombinedScheduleWindow(separateSchedules);
      // windowsLabel clearly presents both discrete intervals
      expect(combined.windowsLabel).toBe('07:30 – 12:00 • 16:00 – 18:00');
      expect(combined.intervals).toHaveLength(2);

      // 2. Overlapping or back-to-back routines merge into one
      const backToBackSchedules: ChildScheduleItem[] = [
        {
          id: 's1',
          title: 'Morning Daycare',
          startTime: '08:00',
          endTime: '12:00',
          locationType: 'daycare',
          days: [0, 1, 2, 3, 4],
          enabled: true,
        },
        {
          id: 's2',
          title: 'Afternoon Daycare Extension',
          startTime: '12:00',
          endTime: '16:30',
          locationType: 'daycare',
          days: [0, 1, 2, 3, 4],
          enabled: true,
        },
      ];

      const mergedIntervals = getMergedScheduleIntervals(backToBackSchedules);
      expect(mergedIntervals).toHaveLength(1);
      expect(mergedIntervals[0].startTime).toBe('08:00');
      expect(mergedIntervals[0].endTime).toBe('16:30');

      const mergedCombined = getCombinedScheduleWindow(backToBackSchedules);
      expect(mergedCombined.windowsLabel).toBe('08:00 – 16:30');
    });

    it('orders locations according to the chronological order of their activities and orders duplicates on first appearance', async () => {
      const { getOrderedUniqueLocations } = await import('../../utils/scheduleUtils');

      const multiLocationSchedules: ChildScheduleItem[] = [
        {
          id: 's3',
          title: 'Evening Playdate',
          startTime: '17:30',
          endTime: '19:00',
          locationType: 'home',
          location: 'Grandma’s House',
          days: [0, 1, 2, 3, 4],
          enabled: true,
        },
        {
          id: 's1',
          title: 'Morning Preschool',
          startTime: '08:00',
          endTime: '12:00',
          locationType: 'daycare',
          location: 'Little Stars Preschool',
          days: [0, 1, 2, 3, 4],
          enabled: true,
        },
        {
          id: 's2',
          title: 'Afternoon Playground',
          startTime: '14:00',
          endTime: '16:00',
          locationType: 'park',
          location: 'Sunset Park',
          days: [0, 1, 2, 3, 4],
          enabled: true,
        },
        {
          id: 's4',
          title: 'Night Snack',
          startTime: '19:30',
          endTime: '20:30',
          locationType: 'daycare',
          location: 'Little Stars Preschool', // Duplicate location appearing again at 19:30
          days: [0, 1, 2, 3, 4],
          enabled: true,
        },
      ];

      // Despite s3 being declared first in the raw array, chronological order is:
      // 1. Little Stars Preschool (08:00)
      // 2. Sunset Park (14:00)
      // 3. Grandma’s House (17:30)
      // (The second instance of Little Stars Preschool at 19:30 is ordered on its first appearance at 08:00)
      const ordered = getOrderedUniqueLocations(multiLocationSchedules, 'Home');
      expect(ordered).toEqual([
        'Little Stars Preschool',
        'Sunset Park',
        'Grandma’s House',
      ]);
    });
  });
});






