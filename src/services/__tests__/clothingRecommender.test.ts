import { describe, it, expect } from 'vitest';
import { generateClothingRecommendation, formatForecastTiming } from '../clothingRecommender';
import { validateRecommendationResult } from '../../utils/recommendationValidator';
import { ALL_CATALOG_ITEMS, ALL_CATALOG_ITEM_IDS, getCatalogItemById } from '../../utils/clothingCatalog';
import { WARNING_CODES } from '../../types/clothing';

describe('Clothing Recommendation Engine & RecommendationResult Schema', () => {
  const baseParams = {
    apparentTempC: 20,
    actualTempC: 20,
    weatherCode: 1, // Clear / Mainly clear
    windSpeedKmh: 10,
    uvIndex: 2,
    ageCategory: 'toddler' as const,
    ageInMonths: 24,
    activity: 'outdoor_play' as const,
    availableClothingIds: ALL_CATALOG_ITEM_IDS,
  };

  describe('1. Status Invariants (success, partial, no_valid_outfit)', () => {
    it('returns status "success" when all relevant windows are suitably covered and wardrobe is complete', () => {
      const rec = generateClothingRecommendation({
        ...baseParams,
        apparentTempC: 21,
        actualTempC: 21,
        weatherCode: 1,
        uvIndex: 2,
      });

      expect(rec.status).toBe('success');
      expect(rec.warnings.filter((w) => w.severity === 'critical' || w.severity === 'warning')).toHaveLength(0);
      expect(rec.windowAssessments.every((w) => w.suitability === 'suitable')).toBe(true);

      const validation = validateRecommendationResult(rec, ALL_CATALOG_ITEM_IDS);
      expect(validation.isValid).toBe(true);
    });

    it('returns status "partial" when a usable outfit exists but some conditions (e.g. rain gear missing) are not fully addressed', () => {
      // Exclude all waterproof items when rain is active
      const availableWithoutRain = ALL_CATALOG_ITEM_IDS.filter(
        (id) =>
          id !== 'light_rain_jacket' &&
          id !== 'umbrella' &&
          id !== 'waterproof_puddle_suit' &&
          id !== 'waterproof_insulated_jacket'
      );

      const rec = generateClothingRecommendation({
        ...baseParams,
        apparentTempC: 15,
        actualTempC: 15,
        weatherCode: 61, // Rain
        availableClothingIds: availableWithoutRain,
      });

      expect(rec.status).toBe('partial');
      expect(rec.warnings.some((w) => w.code === WARNING_CODES.MISSING_RAIN_GEAR)).toBe(true);
      expect(rec.windowAssessments.some((w) => w.suitability === 'compromised')).toBe(true);

      const validation = validateRecommendationResult(rec, availableWithoutRain);
      expect(validation.isValid).toBe(true);
    });

    it('returns status "no_valid_outfit" when no base layer top is available', () => {
      // Exclude all base layer tops
      const noBaseTops = ALL_CATALOG_ITEM_IDS.filter(
        (id) =>
          !id.includes('tshirt') &&
          !id.includes('bodysuit') &&
          !id.includes('shirt') &&
          !id.includes('top') &&
          !id.includes('romper')
      );

      const rec = generateClothingRecommendation({
        ...baseParams,
        availableClothingIds: noBaseTops,
      });

      expect(rec.status).toBe('no_valid_outfit');
      expect(rec.warnings.some((w) => w.code === WARNING_CODES.NO_VALID_BASE_LAYER)).toBe(true);
      expect(rec.warnings.some((w) => w.severity === 'critical')).toBe(true);

      const validation = validateRecommendationResult(rec, noBaseTops);
      expect(validation.isValid).toBe(true);
    });

    it('returns status "no_valid_outfit" when no bottoms are available', () => {
      const noBottoms = ALL_CATALOG_ITEM_IDS.filter(
        (id) => !id.includes('trousers') && !id.includes('pants') && !id.includes('shorts') && !id.includes('leggings')
      );

      const rec = generateClothingRecommendation({
        ...baseParams,
        availableClothingIds: noBottoms,
      });

      expect(rec.status).toBe('no_valid_outfit');
      expect(rec.warnings.some((w) => w.code === WARNING_CODES.NO_VALID_BOTTOMS)).toBe(true);
      expect(rec.warnings.some((w) => w.severity === 'critical')).toBe(true);

      const validation = validateRecommendationResult(rec, noBottoms);
      expect(validation.isValid).toBe(true);
    });

    it('returns status "no_valid_outfit" when weather data is missing/invalid', () => {
      const rec = generateClothingRecommendation({
        ...baseParams,
        actualTempC: NaN,
        weatherCode: NaN,
      });

      expect(rec.status).toBe('no_valid_outfit');
      expect(rec.warnings.some((w) => w.code === WARNING_CODES.WEATHER_DATA_UNAVAILABLE)).toBe(true);
    });
  });

  describe('2. Catalog-Reference Constraints & Invented ID Prevention', () => {
    it('guarantees every clothingItemId in ON, WITH, and CHANGES resolves to an existing catalog item and is enabled by parent', () => {
      const rec = generateClothingRecommendation({
        ...baseParams,
        apparentTempC: 8, // Cold
        actualTempC: 8,
        weatherCode: 61, // Rain
        uvIndex: 4,
        hourly: [
          {
            time: '2026-10-16T10:00:00Z',
            hourLabel: '10:00 AM',
            temperature: 8,
            apparentTemperature: 7,
            precipitationProbability: 80,
            weatherCode: 61,
            uvIndex: 2,
            windSpeed: 15,
          },
        ],
      });

      // Check ON items
      rec.on.forEach((item) => {
        const catalogItem = getCatalogItemById(item.clothingItemId);
        expect(catalogItem).toBeDefined();
        expect(ALL_CATALOG_ITEM_IDS).toContain(item.clothingItemId);
        expect(item.quantity).toBeGreaterThanOrEqual(1);
        expect(item.reasons.length).toBeGreaterThan(0);
      });

      // Check WITH items
      rec.with.forEach((item) => {
        const catalogItem = getCatalogItemById(item.clothingItemId);
        expect(catalogItem).toBeDefined();
        expect(ALL_CATALOG_ITEM_IDS).toContain(item.clothingItemId);
        expect(item.quantity).toBeGreaterThanOrEqual(1);
        expect(item.reasons.length).toBeGreaterThan(0);
      });

      // Check CHANGES items
      rec.changes.forEach((change) => {
        const catalogItem = getCatalogItemById(change.clothingItemId);
        expect(catalogItem).toBeDefined();
        expect(ALL_CATALOG_ITEM_IDS).toContain(change.clothingItemId);
        if (change.action === 'replace') {
          expect(change.replacesClothingItemId).toBeDefined();
          expect(getCatalogItemById(change.replacesClothingItemId!)).toBeDefined();
        }
      });
    });

    it('never suggests an item disabled in availableClothingIds', () => {
      // Disable sweaters, hoodies, and cardigans
      const restricted = ALL_CATALOG_ITEM_IDS.filter(
        (id) => !id.includes('fleece') && !id.includes('sweatshirt') && !id.includes('cardigan')
      );

      const rec = generateClothingRecommendation({
        ...baseParams,
        apparentTempC: 14,
        actualTempC: 14,
        availableClothingIds: restricted,
      });

      rec.on.forEach((item) => {
        expect(restricted).toContain(item.clothingItemId);
      });
      rec.with.forEach((item) => {
        expect(restricted).toContain(item.clothingItemId);
      });
    });
  });

  describe('3. Actionable Transitions (changes)', () => {
    it('schedules an actionable transition when precipitation is forecast later in the day', () => {
      const rec = generateClothingRecommendation({
        ...baseParams,
        apparentTempC: 19,
        actualTempC: 19,
        weatherCode: 0, // Clear in the morning
        hourly: [
          {
            time: '2026-10-16T09:00:00Z',
            hourLabel: '9:00 AM',
            temperature: 19,
            apparentTemperature: 19,
            precipitationProbability: 5,
            weatherCode: 0,
            uvIndex: 2,
            windSpeed: 10,
          },
          {
            time: '2026-10-16T14:00:00Z',
            hourLabel: '2:00 PM',
            temperature: 18,
            apparentTemperature: 18,
            precipitationProbability: 75,
            weatherCode: 61,
            uvIndex: 1,
            windSpeed: 15,
          },
        ],
      });

      const rainChange = rec.changes.find(
        (c) => c.action === 'put_on' && (c.clothingItemId === 'light_rain_jacket' || c.clothingItemId === 'umbrella')
      );

      expect(rainChange).toBeDefined();
      expect(rainChange?.activityWindowId).toBe('weather-rain');
      expect(rainChange?.time).toContain('2026-10-16T14:00:00');
      expect(isNaN(Date.parse(rainChange!.time))).toBe(false);
    });

    it('schedules a transition to remove bulky jacket for car seat activity', () => {
      const rec = generateClothingRecommendation({
        ...baseParams,
        apparentTempC: 2, // Freezing
        actualTempC: 2,
        activity: 'car_seat',
        activeScheduleItem: {
          id: 'schedule-drive-1',
          title: 'Morning Drive',
          startTime: '08:30',
          endTime: '09:15',
          days: [1, 2, 3, 4, 5],
          locationType: 'travel_excursion',
          enabled: true,
        },
      });

      const carSeatChange = rec.changes.find((c) => c.action === 'remove');
      expect(carSeatChange).toBeDefined();
      expect(carSeatChange?.clothingItemId).toBe('heavy_winter_coat');
      expect(carSeatChange?.reason).toContain('car seat');
    });

    it('does not generate redundant changes', () => {
      const rec = generateClothingRecommendation({
        ...baseParams,
        apparentTempC: 22,
        actualTempC: 22,
      });

      const changeIds = rec.changes.map((c) => c.id);
      const uniqueIds = new Set(changeIds);
      expect(uniqueIds.size).toBe(changeIds.length);
    });
  });

  describe('4. Warnings and Assessments', () => {
    it('emits stable warning codes and sets severity', () => {
      const footwearIds = ['breathable_sneakers', 'sandals', 'closed_toe_shoes', 'water_shoes', 'rain_boots', 'insulated_winter_boots'];
      const availableWithoutShoes = ALL_CATALOG_ITEM_IDS.filter((id) => !footwearIds.includes(id));

      const rec = generateClothingRecommendation({
        ...baseParams,
        availableClothingIds: availableWithoutShoes,
      });

      expect(rec.warnings.some((w) => w.code === WARNING_CODES.NO_VALID_FOOTWEAR && w.severity === 'critical')).toBe(true);
    });

    it('assesses window suitability with required properties', () => {
      const rec = generateClothingRecommendation({
        ...baseParams,
        apparentTempC: 6, // Cold
        actualTempC: 6,
      });

      const depAssessment = rec.windowAssessments.find((w) => w.activityWindowId === 'departure');
      expect(depAssessment).toBeDefined();
      expect(depAssessment?.requiredProperties.insulation).toBe('high');
      expect(depAssessment?.requiredProperties.coverage).toBe('full');
      expect(depAssessment?.reasons.length).toBeGreaterThan(0);
    });
  });

  describe('5. formatForecastTiming Helper (Bug #2 prevention)', () => {
    it('formats ISO timestamps into human-readable clock time and day part without raw ISO strings', () => {
      const result1 = formatForecastTiming({ time: '2026-10-16T10:00:00Z' });
      expect(result1).not.toContain('2026-10-16T10:00');
      expect(result1).toContain('10:00 AM');
      expect(result1).toContain('morning');

      const resultDusk = formatForecastTiming({ time: '2026-10-16T18:30:00Z' });
      expect(resultDusk).toContain('dusk');
      expect(resultDusk).toContain('6:00 PM');
    });
  });

  describe('6. Runtime Validator (validateRecommendationResult)', () => {
    it('catches invented clothing item IDs', () => {
      const validRec = generateClothingRecommendation(baseParams);
      const invalidRec = {
        ...validRec,
        on: [
          ...validRec.on,
          {
            clothingItemId: 'invented_fake_item_999',
            quantity: 1,
            reasons: ['Fake item'],
            relevantWindowIds: ['departure'],
          },
        ],
      };

      const result = validateRecommendationResult(invalidRec, ALL_CATALOG_ITEM_IDS);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('not a valid catalog item ID'))).toBe(true);
    });

    it('catches non-ISO datetimes in changes', () => {
      const validRec = generateClothingRecommendation(baseParams);
      const invalidRec = {
        ...validRec,
        changes: [
          {
            id: 'change-1',
            time: 'not-a-datetime',
            action: 'put_on' as const,
            clothingItemId: 'light_rain_jacket',
            reason: 'Invalid time test',
            activityWindowId: 'departure',
          },
        ],
      };

      const result = validateRecommendationResult(invalidRec, ALL_CATALOG_ITEM_IDS);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('not a valid ISO 8601 datetime'))).toBe(true);
    });

    it('enforces status consistency when warnings exist', () => {
      const validRec = generateClothingRecommendation(baseParams);
      const inconsistentRec = {
        ...validRec,
        status: 'success' as const,
        warnings: [
          {
            code: WARNING_CODES.MISSING_RAIN_GEAR,
            severity: 'warning' as const,
            message: 'Inconsistent warning test',
          },
        ],
      };

      const result = validateRecommendationResult(inconsistentRec, ALL_CATALOG_ITEM_IDS);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('Status invariant violated'))).toBe(true);
    });
  });

  describe('7. Scheduled Activity Assessment & Extra Layers', () => {
    it('assesses active daycare schedule without unnecessary spare clothes', () => {
      const rec = generateClothingRecommendation({
        ...baseParams,
        activeScheduleItem: {
          id: 'schedule-daycare-1',
          title: 'Little Sprouts Daycare',
          startTime: '08:30',
          endTime: '16:00',
          days: [1, 2, 3, 4, 5],
          locationType: 'daycare',
          enabled: true,
        },
      });

      const daycareAssessment = rec.windowAssessments.find((w) => w.activityWindowId === 'schedule-daycare-1');
      expect(daycareAssessment).toBeDefined();
      expect(daycareAssessment?.suitability).toBe('suitable');

      // Should not include spare clothes for daycare
      expect(rec.with.some((item) => item.reasons?.some((r) => r.toLowerCase().includes('spare')))).toBe(false);
    });

    it('plans for the entire time window of multiple selected activities', () => {
      const schedule1 = {
        id: 'schedule-morning-daycare',
        title: 'Morning Daycare',
        startTime: '08:30',
        endTime: '12:30',
        days: [1, 2, 3, 4, 5],
        locationType: 'daycare' as const,
        enabled: true,
      };

      const schedule2 = {
        id: 'schedule-afternoon-park',
        title: 'Forest Park Exploration',
        startTime: '13:00',
        endTime: '17:30',
        days: [1, 2, 3, 4, 5],
        locationType: 'park' as const,
        enabled: true,
      };

      // Rain occurs at 15:00 (during the afternoon park window)
      const hourlyWithAfternoonRain = [
        { time: '2026-10-16T08:00', hourLabel: '8 AM', temperature: 16, apparentTemperature: 16, precipitationProbability: 0, weatherCode: 1, windSpeed: 10, uvIndex: 1 },
        { time: '2026-10-16T12:00', hourLabel: '12 PM', temperature: 18, apparentTemperature: 18, precipitationProbability: 10, weatherCode: 2, windSpeed: 10, uvIndex: 3 },
        { time: '2026-10-16T15:00', hourLabel: '3 PM', temperature: 17, apparentTemperature: 16, precipitationProbability: 75, weatherCode: 61, windSpeed: 18, uvIndex: 2 },
        { time: '2026-10-16T18:00', hourLabel: '6 PM', temperature: 14, apparentTemperature: 13, precipitationProbability: 10, weatherCode: 3, windSpeed: 12, uvIndex: 0 },
      ];

      const rec = generateClothingRecommendation({
        ...baseParams,
        activeScheduleItems: [schedule1, schedule2],
        hourly: hourlyWithAfternoonRain,
      });

      // Valid output schema
      const validation = validateRecommendationResult(rec, ALL_CATALOG_ITEM_IDS);
      expect(validation.isValid).toBe(true);

      // Both window assessments are present
      expect(rec.windowAssessments.some((w) => w.activityWindowId === 'schedule-morning-daycare')).toBe(true);
      expect(rec.windowAssessments.some((w) => w.activityWindowId === 'schedule-afternoon-park')).toBe(true);

      // Rain gear packed for rain during the afternoon schedule
      expect(rec.with.some((item) => item.clothingItemId === 'light_rain_jacket')).toBe(true);
      expect(rec.changes.some((c) => c.action === 'put_on' && c.clothingItemId === 'light_rain_jacket')).toBe(true);
    });

    it('handles multiple schedules with travel excursion and car seat transition', () => {
      const scheduleDrive = {
        id: 'schedule-drive-trip',
        title: 'Morning Drive',
        startTime: '09:00',
        endTime: '10:00',
        days: [1, 2, 3, 4, 5],
        locationType: 'travel_excursion' as const,
        enabled: true,
      };

      const schedulePlay = {
        id: 'schedule-outdoor-play',
        title: 'Playground Visit',
        startTime: '10:30',
        endTime: '12:30',
        days: [1, 2, 3, 4, 5],
        locationType: 'park' as const,
        enabled: true,
      };

      const rec = generateClothingRecommendation({
        ...baseParams,
        apparentTempC: -2,
        actualTempC: -2,
        activeScheduleItems: [scheduleDrive, schedulePlay],
      });

      const validation = validateRecommendationResult(rec, ALL_CATALOG_ITEM_IDS);
      expect(validation.isValid).toBe(true);

      // Car seat transition scheduled at trip departure time
      const carSeatChange = rec.changes.find((c) => c.clothingItemId === 'heavy_winter_coat' && c.action === 'remove');
      expect(carSeatChange).toBeDefined();
      expect(carSeatChange?.activityWindowId).toBe('schedule-drive-trip');
    });
  });
});
