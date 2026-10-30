import { AgeCategory, ActivityType, ActivityLevel, TemperatureTendency, ChildScheduleItem } from '../types/child';
import {
  ClothingItem,
  ClothingRecommendation,
  PackInBagItem,
  MosquitoAdvice,
  DayTemperatureSwing,
  RecommendedItem,
  OutfitChange,
  WindowAssessment,
  RecommendationWarning,
  RecommendationStatus,
  WARNING_CODES,
} from '../types/clothing';
import { HourlyWeatherPoint, DailyForecast } from '../types/weather';
import { resolveBestAvailableCatalogItem, isCatalogItemAvailable, getCatalogItemById } from '../utils/clothingCatalog';
import { CatalogItem } from '../types/catalog';
import { assertValidRecommendationResult } from '../utils/recommendationValidator';
import { getCombinedScheduleWindow } from '../utils/scheduleUtils';

export interface RecommendationParams {
  apparentTempC: number;
  actualTempC: number;
  weatherCode: number;
  windSpeedKmh: number;
  uvIndex: number;
  humidity?: number;
  ageCategory: AgeCategory;
  ageInMonths: number;
  activity?: ActivityType;
  activityLevel?: ActivityLevel;
  temperatureTendency?: TemperatureTendency;
  specialTraits?: string[];
  activeScheduleItem?: ChildScheduleItem | null;
  activeScheduleItems?: ChildScheduleItem[] | null;
  hourly?: HourlyWeatherPoint[];
  todayDaily?: DailyForecast;
  availableClothingIds?: string[];
}

/**
 * Formats a forecast timing point into friendly day part and 12-hour clock time.
 * Prevents raw ISO strings like "From around 2026-10-16T10:00".
 */
export function formatForecastTiming(point: { time?: string; hourLabel?: string }): string {
  try {
    let hourNum = NaN;
    if (point.time) {
      const match = point.time.match(/T(\d{1,2})/);
      if (match) {
        hourNum = parseInt(match[1], 10);
      } else {
        const d = new Date(point.time);
        hourNum = d.getHours();
      }
    }
    if (isNaN(hourNum) && point.hourLabel) {
      const match = point.hourLabel.match(/T(\d{1,2})/) || point.hourLabel.match(/^(\d{1,2})/);
      if (match) {
        hourNum = parseInt(match[1], 10);
      }
    }
    if (isNaN(hourNum)) {
      hourNum = 12;
    }

    let dayPart = 'daytime';
    if (hourNum >= 5 && hourNum < 9) {
      dayPart = 'early morning';
    } else if (hourNum >= 9 && hourNum < 12) {
      dayPart = 'morning';
    } else if (hourNum >= 12 && hourNum < 14) {
      dayPart = 'midday';
    } else if (hourNum >= 14 && hourNum < 17) {
      dayPart = 'afternoon';
    } else if (hourNum >= 17 && hourNum < 20) {
      dayPart = 'dusk';
    } else if (hourNum >= 20 && hourNum < 23) {
      dayPart = 'evening';
    } else {
      dayPart = 'night';
    }

    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
    const formattedClock = `${displayHour}:00 ${ampm}`;

    if (dayPart === 'dusk' || dayPart === 'midday') {
      return `From around ${dayPart} (${formattedClock})`;
    }
    return `From around ${formattedClock} (${dayPart})`;
  } catch {
    return 'If showers develop later';
  }
}

/**
 * Converts a time string or hour into an ISO 8601 string with timezone.
 */
function toIso8601WithTimezone(timeInput: string, referenceDate?: string): string {
  if (timeInput && timeInput.includes('T')) {
    const d = new Date(timeInput);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  }
  const dateStr = referenceDate || new Date().toISOString().split('T')[0];
  const timeOnly = timeInput.includes(':') ? timeInput : `${timeInput}:00`;
  const paddedTime = timeOnly.length === 5 ? `${timeOnly}:00` : timeOnly;
  const isoStr = `${dateStr}T${paddedTime}Z`;
  const d = new Date(isoStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString();
  }
  return new Date().toISOString();
}

export function generateClothingRecommendation(params: RecommendationParams): ClothingRecommendation {
  const {
    apparentTempC,
    actualTempC,
    weatherCode,
    windSpeedKmh,
    uvIndex,
    humidity,
    ageCategory,
    ageInMonths,
    activity = 'outdoor_play',
    activityLevel,
    temperatureTendency,
    specialTraits = [],
    activeScheduleItem,
    activeScheduleItems,
    hourly,
    todayDaily,
    availableClothingIds,
  } = params;

  // Multi-schedule collection: support planning for one or multiple selected schedules
  const allSchedules: ChildScheduleItem[] =
    activeScheduleItems && activeScheduleItems.length > 0
      ? activeScheduleItems
      : activeScheduleItem
      ? [activeScheduleItem]
      : [];

  const combinedScheduleRange = getCombinedScheduleWindow(allSchedules);

  // Catalog resolution helpers
  const isAllowed = (catalogId: string): boolean => {
    return isCatalogItemAvailable(availableClothingIds, catalogId);
  };

  const getBestCatalogItem = (preferredId: string): CatalogItem | null => {
    return resolveBestAvailableCatalogItem(preferredId, availableClothingIds);
  };

  const isBaby = ageCategory === 'newborn' || ageCategory === 'infant';
  const isToddler = ageCategory === 'toddler';
  const childNoun = isBaby ? (ageCategory === 'newborn' ? 'newborn' : 'baby') : isToddler ? 'toddler' : 'child';

  // Base effective feel temperature
  let effectiveTemp = apparentTempC;

  // Activity adjustments
  if (activity === 'stroller_walk') {
    effectiveTemp -= isBaby ? 2.0 : 1.0;
  } else if (activity === 'carrier') {
    effectiveTemp += 2.0;
  } else if (activity === 'outdoor_play' && !isBaby) {
    effectiveTemp += 2.0;
  }

  // Personal thermoregulation traits from Kid Profile
  if (activityLevel === 'high_energy') {
    effectiveTemp += 1.5;
  } else if (activityLevel === 'calm_lounger') {
    effectiveTemp -= 1.5;
  }

  if (temperatureTendency === 'runs_hot') {
    effectiveTemp += 1.5;
  } else if (temperatureTendency === 'runs_cold') {
    effectiveTemp -= 1.5;
  }

  if (ageCategory === 'newborn') {
    effectiveTemp -= 1.5;
  }

  // Thermal zones
  let thermalZone: ClothingRecommendation['thermalZone'] = 'mild';
  let thermalZoneLabel = 'Mild & Comfortable';

  if (effectiveTemp < 4) {
    thermalZone = 'freezing';
    thermalZoneLabel = 'Freezing / Winter Cold';
  } else if (effectiveTemp < 12) {
    thermalZone = 'cold';
    thermalZoneLabel = 'Chilly & Crisp';
  } else if (effectiveTemp < 18) {
    thermalZone = 'cool';
    thermalZoneLabel = 'Cool / Fresh';
  } else if (effectiveTemp < 23) {
    thermalZone = 'mild';
    thermalZoneLabel = 'Pleasant & Mild';
  } else if (effectiveTemp < 28) {
    thermalZone = 'warm';
    thermalZoneLabel = 'Warm & Sunny';
  } else {
    thermalZone = 'hot';
    thermalZoneLabel = 'Hot / Summer Heat';
  }

  const isRaining = (weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82);
  const isHighWind = windSpeedKmh >= 22;
  const isHighUv = uvIndex >= 3;

  const baseLayer: ClothingItem[] = [];
  const midLayer: ClothingItem[] = [];
  const outerLayer: ClothingItem[] = [];
  const extremities: ClothingItem[] = [];
  const accessoriesAndGear: ClothingItem[] = [];
  const safetyAlerts: string[] = [];
  const pediatricInsights: string[] = [];

  // ==========================================
  // STRUCTURED RESULT COLLECTIONS
  // ==========================================
  const onItems: RecommendedItem[] = [];
  const withItems: RecommendedItem[] = [];
  const changesList: OutfitChange[] = [];
  const windowAssessmentsList: WindowAssessment[] = [];
  const warningsList: RecommendationWarning[] = [];

  const departureWindowId = 'departure';
  const relevantDepartureWindows = ['departure', ...allSchedules.map((s) => s.id)];

  // Weather availability check
  if (actualTempC === undefined || isNaN(actualTempC) || weatherCode === undefined || isNaN(weatherCode)) {
    warningsList.push({
      code: WARNING_CODES.WEATHER_DATA_UNAVAILABLE,
      severity: 'critical',
      message: 'Weather data is unavailable or incomplete. Cannot compute safe clothing recommendations.',
      relatedWindowIds: relevantDepartureWindows,
    });
  }

  // ==========================================
  // 1. BASE LAYER (Catalog-Resolved)
  // ==========================================
  let preferredBaseId = 'short_sleeve_tshirt';
  if (thermalZone === 'freezing') {
    preferredBaseId = isBaby ? 'baby_bodysuit_long_sleeve' : 'thermal_base_layer_top';
  } else if (thermalZone === 'cold' || thermalZone === 'cool') {
    preferredBaseId = isBaby ? 'baby_bodysuit_long_sleeve' : 'thin_long_sleeve_shirt';
  } else if (thermalZone === 'mild') {
    preferredBaseId = isBaby ? 'baby_bodysuit_short_sleeve' : 'short_sleeve_tshirt';
  } else {
    preferredBaseId = isBaby ? 'baby_bodysuit_sleeveless' : 'short_sleeve_tshirt';
  }

  const resolvedBase = getBestCatalogItem(preferredBaseId);
  if (resolvedBase) {
    baseLayer.push({
      id: `base-${resolvedBase.id}`,
      name: resolvedBase.label.en,
      category: 'base',
      description: isBaby
        ? `${resolvedBase.label.en} (${resolvedBase.label.he}) · Soft base keeping the torso covered.`
        : `${resolvedBase.label.en} (${resolvedBase.label.he}) · Base layer allowing comfortable playtime.`,
      iconName: resolvedBase.id,
      priority: 'essential',
    });

    onItems.push({
      clothingItemId: resolvedBase.id,
      quantity: 1,
      reasons: [
        isBaby
          ? `Snug base layer that secures diaper and protects sensitive skin in ${Math.round(effectiveTemp)}°C.`
          : `Breathable base layer suitable for ${thermalZoneLabel.toLowerCase()} conditions.`,
      ],
      relevantWindowIds: relevantDepartureWindows,
    });
  } else {
    warningsList.push({
      code: WARNING_CODES.NO_VALID_BASE_LAYER,
      severity: 'critical',
      message: `No base layer top (e.g. t-shirt or baby bodysuit) is enabled in child's wardrobe.`,
      relatedWindowIds: [departureWindowId],
    });
  }

  // ==========================================
  // 2. MID LAYER (Catalog-Resolved)
  // ==========================================
  let preferredMidTopId: string | null = null;
  if (thermalZone === 'freezing' || thermalZone === 'cold') {
    preferredMidTopId = isBaby ? 'baby_romper' : 'fleece_jacket';
  } else if (thermalZone === 'cool') {
    preferredMidTopId = isBaby ? 'light_cardigan' : 'sweatshirt';
  } else if (thermalZone === 'mild') {
    preferredMidTopId = 'light_cardigan';
  }

  let resolvedMidTop: CatalogItem | null = null;
  if (preferredMidTopId) {
    resolvedMidTop = getBestCatalogItem(preferredMidTopId);
    if (resolvedMidTop) {
      midLayer.push({
        id: `mid-${resolvedMidTop.id}`,
        name: resolvedMidTop.label.en,
        category: 'mid',
        description: `${resolvedMidTop.label.en} (${resolvedMidTop.label.he}) · Middle insulation layer.`,
        iconName: resolvedMidTop.id,
        isOptional: thermalZone === 'mild',
        priority: thermalZone === 'mild' ? 'recommended' : 'essential',
      });

      onItems.push({
        clothingItemId: resolvedMidTop.id,
        quantity: 1,
        reasons: [
          thermalZone === 'mild'
            ? `Light middle layer for morning breeze, easily peelable later.`
            : `Essential thermal mid-layer providing core warmth.`,
        ],
        relevantWindowIds: relevantDepartureWindows,
      });
    } else if (thermalZone === 'freezing' || thermalZone === 'cold') {
      warningsList.push({
        code: WARNING_CODES.MISSING_COLD_MID_LAYER,
        severity: 'warning',
        message: 'Cold weather requires an insulating middle layer (fleece, sweatshirt, or cardigan), but none is available.',
        relatedWindowIds: [departureWindowId],
      });
    }
  }

  // Bottoms (Pants or Shorts)
  let preferredBottomId = 'regular_long_trousers';
  if (thermalZone === 'freezing') {
    preferredBottomId = 'fleece_lined_trousers';
  } else if (thermalZone === 'cold') {
    preferredBottomId = 'sweatpants';
  } else if (thermalZone === 'cool') {
    preferredBottomId = 'regular_long_trousers';
  } else if (thermalZone === 'mild') {
    preferredBottomId = 'lightweight_long_trousers';
  } else {
    preferredBottomId = 'shorts';
  }

  const resolvedBottom = getBestCatalogItem(preferredBottomId);
  if (resolvedBottom) {
    midLayer.push({
      id: `bottom-${resolvedBottom.id}`,
      name: resolvedBottom.label.en,
      category: 'mid',
      description: `${resolvedBottom.label.en} (${resolvedBottom.label.he}) · Bottom wear for outdoor mobility.`,
      iconName: resolvedBottom.id,
      priority: 'essential',
    });

    onItems.push({
      clothingItemId: resolvedBottom.id,
      quantity: 1,
      reasons: [
        thermalZone === 'warm' || thermalZone === 'hot'
          ? `Breathable bottoms preventing leg overheating in warm weather.`
          : `Protective long trousers shielding legs from chill and outdoor scrapes.`,
      ],
      relevantWindowIds: relevantDepartureWindows,
    });
  } else {
    warningsList.push({
      code: WARNING_CODES.NO_VALID_BOTTOMS,
      severity: 'critical',
      message: `No suitable trousers, sweatpants, or shorts are enabled in child's wardrobe.`,
      relatedWindowIds: [departureWindowId],
    });
  }

  // ==========================================
  // 3. OUTER LAYER (Catalog-Resolved)
  // ==========================================
  let preferredOuterId: string | null = null;
  if (thermalZone === 'freezing') {
    preferredOuterId = isBaby ? 'baby_snowsuit' : 'heavy_winter_coat';
  } else if (thermalZone === 'cold') {
    preferredOuterId = isBaby ? 'baby_snowsuit' : 'insulated_jacket';
  } else if (thermalZone === 'cool') {
    preferredOuterId = isRaining ? 'light_rain_jacket' : 'light_windbreaker';
  } else if (isRaining) {
    preferredOuterId = 'light_rain_jacket';
  }

  let resolvedOuter: CatalogItem | null = null;
  if (preferredOuterId) {
    resolvedOuter = getBestCatalogItem(preferredOuterId);
    if (resolvedOuter) {
      outerLayer.push({
        id: `outer-${resolvedOuter.id}`,
        name: resolvedOuter.label.en,
        category: 'outer',
        description: `${resolvedOuter.label.en} (${resolvedOuter.label.he}) · Protection against wind, chill, and outdoor elements.`,
        iconName: resolvedOuter.id,
        priority:
          isHighWind || isRaining || thermalZone === 'freezing' || thermalZone === 'cold'
            ? 'essential'
            : 'recommended',
      });

      onItems.push({
        clothingItemId: resolvedOuter.id,
        quantity: 1,
        reasons: [
          isRaining
            ? 'Waterproof outer layer shielding against morning rain and moisture.'
            : isHighWind
            ? 'Wind-resistant shell preventing body heat loss from gusty winds.'
            : 'Insulated outer coat providing vital defense against low ambient temperatures.',
        ],
        relevantWindowIds: relevantDepartureWindows,
      });
    }
  }

  const isOuterWaterproof =
    Boolean(resolvedOuter && (resolvedOuter.properties?.waterProtection === 'high' || resolvedOuter.properties?.waterProtection === 'medium'));

  if (isRaining && !isOuterWaterproof) {
    warningsList.push({
      code: WARNING_CODES.MISSING_RAIN_GEAR,
      severity: 'warning',
      message: 'Active rain requires a waterproof rain jacket or coat, but none is available.',
      relatedWindowIds: [departureWindowId],
    });
  }

  if (thermalZone === 'freezing' || thermalZone === 'cold') {
    if (!resolvedOuter) {
      warningsList.push({
        code: WARNING_CODES.MISSING_COLD_OUTER_LAYER,
        severity: 'warning',
        message: 'Freezing/cold weather requires an insulated jacket or coat, but none is enabled.',
        relatedWindowIds: [departureWindowId],
      });
    }
  }

  // ==========================================
  // 4. FOOTWEAR & EXTREMITIES (Catalog-Resolved)
  // ==========================================
  let preferredShoeId = 'breathable_sneakers';
  if (thermalZone === 'freezing' || thermalZone === 'cold') {
    preferredShoeId = 'insulated_winter_boots';
  } else if (isRaining) {
    preferredShoeId = 'rain_boots';
  } else if (thermalZone === 'warm' || thermalZone === 'hot') {
    preferredShoeId = 'sandals';
  } else {
    preferredShoeId = 'breathable_sneakers';
  }

  const resolvedShoe = getBestCatalogItem(preferredShoeId);
  if (resolvedShoe) {
    extremities.push({
      id: `shoe-${resolvedShoe.id}`,
      name: resolvedShoe.label.en,
      category: 'extremities',
      description: `${resolvedShoe.label.en} (${resolvedShoe.label.he})`,
      iconName: resolvedShoe.id,
      priority: 'essential',
    });

    onItems.push({
      clothingItemId: resolvedShoe.id,
      quantity: 1,
      reasons: [
        isRaining
          ? 'Waterproof footwear keeping feet dry through wet ground and puddles.'
          : resolvedShoe.id === 'sandals'
          ? 'Breathable footwear allowing airflow during hot conditions.'
          : 'Supportive footwear for comfortable outdoor mobility.',
      ],
      relevantWindowIds: relevantDepartureWindows,
    });
  } else {
    warningsList.push({
      code: WARNING_CODES.NO_VALID_FOOTWEAR,
      severity: 'critical',
      message: 'No suitable footwear (sneakers, sandals, or boots) is enabled in child wardrobe catalog.',
      relatedWindowIds: [departureWindowId],
    });
  }

  // Socks (not needed if wearing sandals)
  let resolvedSocks: CatalogItem | null = null;
  if (resolvedShoe?.id !== 'sandals') {
    const preferredSockId = thermalZone === 'freezing' || thermalZone === 'cold' ? 'thermal_socks' : 'thin_socks';
    resolvedSocks = getBestCatalogItem(preferredSockId);
    if (resolvedSocks) {
      extremities.push({
        id: `sock-${resolvedSocks.id}`,
        name: resolvedSocks.label.en,
        category: 'extremities',
        description: `${resolvedSocks.label.en} (${resolvedSocks.label.he})`,
        iconName: resolvedSocks.id,
        priority: 'essential',
      });

      onItems.push({
        clothingItemId: resolvedSocks.id,
        quantity: 1,
        reasons: ['Cushioning and blister protection inside footwear.'],
        relevantWindowIds: relevantDepartureWindows,
      });
    }
  }

  // Hat / Headwear
  let preferredHatId: string | null = null;
  if (thermalZone === 'freezing' || thermalZone === 'cold') {
    preferredHatId = 'warm_knit_beanie';
  } else if (thermalZone === 'cool' && (isBaby || isHighWind)) {
    preferredHatId = 'lightweight_beanie';
  } else if (isHighUv || thermalZone === 'warm' || thermalZone === 'hot') {
    preferredHatId = 'wide_brim_sun_hat';
  }

  let resolvedHat: CatalogItem | null = null;
  if (preferredHatId) {
    resolvedHat = getBestCatalogItem(preferredHatId);
    if (resolvedHat) {
      extremities.push({
        id: `hat-${resolvedHat.id}`,
        name: resolvedHat.label.en,
        category: 'extremities',
        description: `${resolvedHat.label.en} (${resolvedHat.label.he})`,
        iconName: resolvedHat.id,
        priority: 'essential',
      });

      onItems.push({
        clothingItemId: resolvedHat.id,
        quantity: 1,
        reasons: [
          isHighUv
            ? 'Protects scalp, eyes, and sensitive facial skin from direct UV rays.'
            : 'Prevents cranial heat loss in brisk air.',
        ],
        relevantWindowIds: relevantDepartureWindows,
      });
    }
  }

  // Mittens in freezing / cold
  if (thermalZone === 'freezing' || thermalZone === 'cold') {
    const resolvedMittens = getBestCatalogItem('insulated_mittens');
    if (resolvedMittens) {
      extremities.push({
        id: `mittens-${resolvedMittens.id}`,
        name: resolvedMittens.label.en,
        category: 'extremities',
        description: `${resolvedMittens.label.en} (${resolvedMittens.label.he}) · Keeps hands and fingers protected from cold.`,
        iconName: resolvedMittens.id,
        priority: 'essential',
      });

      onItems.push({
        clothingItemId: resolvedMittens.id,
        quantity: 1,
        reasons: ['Protects fingers and extremities against cold wind and frostbite risk.'],
        relevantWindowIds: relevantDepartureWindows,
      });
    }
  }

  // Sunscreen in ON if high UV at departure
  if (isHighUv && ageInMonths >= 6) {
    if (isAllowed('sunscreen')) {
      extremities.push({
        id: 'ext-sunscreen',
        name: 'Sunscreen SPF 50+',
        category: 'extremities',
        description: 'Apply on face, ears, and exposed neck 15-20 minutes before outdoor play.',
        iconName: 'sunscreen',
        priority: thermalZone === 'hot' || thermalZone === 'warm' ? 'essential' : 'recommended',
      });

      onItems.push({
        clothingItemId: 'sunscreen',
        quantity: 1,
        reasons: [`Apply SPF 50+ mineral protection before departure to shield from UV ${Math.round(uvIndex)}.`],
        relevantWindowIds: relevantDepartureWindows,
      });
    } else {
      safetyAlerts.push(
        `High UV (${Math.round(uvIndex)}): Sunscreen is excluded from wardrobe catalog. Keep child in full shade and wear sun hat/protective clothing.`
      );
      if (!resolvedHat) {
        warningsList.push({
          code: WARNING_CODES.MISSING_SUN_PROTECTION,
          severity: 'warning',
          message: `High UV index (${Math.round(uvIndex)}) requires sun protection, but sunscreen and sun hats are unavailable.`,
          relatedWindowIds: [departureWindowId],
        });
      }
    }
  }

  // Stroller walk gear
  if (activity === 'stroller_walk') {
    if (thermalZone === 'freezing' || thermalZone === 'cold') {
      accessoriesAndGear.push({
        id: 'gear-footmuff',
        name: 'Fleece-Lined Stroller Footmuff / Cozy Cocoon',
        category: 'gear',
        description: 'Because sitting still in a stroller feels cooler, a windproof footmuff prevents chills.',
        iconName: 'Sparkles',
        priority: 'essential',
      });
    } else if (thermalZone === 'cool') {
      accessoriesAndGear.push({
        id: 'gear-stroller-blanket',
        name: 'Cellular Breathable Blanket',
        category: 'gear',
        description: 'Light blanket to drape over legs in breezy stroller rides.',
        iconName: 'Layers',
        priority: 'recommended',
      });
    }
    if (isRaining) {
      accessoriesAndGear.push({
        id: 'gear-raincover',
        name: 'Fitted Stroller Rain & Wind Shield',
        category: 'gear',
        description: 'Clear canopy keeping wind gusts and raindrops completely away.',
        iconName: 'umbrella',
        priority: 'essential',
      });
    }
  }

  if (activity === 'carrier') {
    pediatricInsights.push(
      'Parent Body Heat Factor: Your chest provides approximately 1 full layer of warmth. Avoid over-wrapping their chest and back.'
    );
  }

  // Car seat safety rule
  if (activity === 'car_seat') {
    safetyAlerts.push(
      `Car Seat Safety Rule: NEVER buckle your ${childNoun} into a car seat wearing a puffy winter coat or bulky pramsuit. Fluffy insulation compresses in a crash, leaving several inches of harness slack. Dress in snug thin fleece layers, buckle the harness tightly, and tuck a warm coat or blanket over the buckled straps.`
    );
    if (resolvedOuter && (resolvedOuter.id === 'heavy_winter_coat' || resolvedOuter.id === 'baby_snowsuit')) {
      warningsList.push({
        code: WARNING_CODES.CAR_SEAT_BULKY_JACKET_HAZARD,
        severity: 'warning',
        message: 'Bulky coat poses a crash hazard in car seat harness. Remove coat before buckling child.',
        relatedClothingItemIds: [resolvedOuter.id],
        relatedWindowIds: [departureWindowId],
      });
    }
  }

  // Newborn under-insulated rule
  if (ageCategory === 'newborn' && effectiveTemp < 18 && !resolvedMidTop) {
    warningsList.push({
      code: WARNING_CODES.NEWBORN_UNDER_INSULATED,
      severity: 'warning',
      message: 'Newborns have minimal core heat storage; a second insulating layer is required below 18°C.',
      relatedWindowIds: [departureWindowId],
    });
  }

  // Summary headline
  let summary = '';
  if (thermalZone === 'freezing') {
    summary = isBaby
      ? 'Bundle Up: Heavy Thermal 3-Layer System with Wind Shell & Extremity Warmers'
      : `Winter Chill: Thermal Base Layer, Warm Fleece, Heavy Coat & Snow Boots`;
  } else if (thermalZone === 'cold') {
    summary = isBaby
      ? 'Chilly Weather: Cozy 2-3 Layers with Fleece Insulation & Head Covering'
      : `Crisp Day: Long-Sleeve Shirt, Fleece Sweatshirt, Jacket & Warm Shoes`;
  } else if (thermalZone === 'cool') {
    summary = isBaby
      ? 'Fresh & Cool: Breathable Base with Peelable Cardigan or Light Jacket'
      : `Mild & Fresh: Long T-Shirt, Comfortable Pants & Light Zip-Up Hoodie`;
  } else if (thermalZone === 'mild') {
    summary = isBaby
      ? 'Pleasant Day: Comfortable Cotton Base with Lightweight Pants & Sun Hat'
      : `Pleasant Weather: Cotton T-Shirt, Breathable Pants/Shorts & Sneakers`;
  } else if (thermalZone === 'warm') {
    summary = isBaby
      ? 'Warm & Breezy: Single Breathable Cotton/Muslin Layer with UPF 50+ Sun Protection'
      : `Warm & Sunny: Light T-Shirt, Shorts, Sun Hat & SPF 50+ Sunscreen`;
  } else {
    summary = isBaby
      ? 'Summer Heat: Ultra-light Loose Gauze Romper with Maximum Shade & Hydration'
      : `Hot Summer Day: Breathable Cotton Tank/Tee, Light Shorts, Sun Hat & Plenty of Water`;
  }

  // ==========================================
  // TEMPERATURE SWING & EVENING COOL DOWN
  // ==========================================
  let eveningTemp = actualTempC - 4;
  let minDayTemp = todayDaily ? todayDaily.tempMin : actualTempC - 5;
  let maxDayTemp = todayDaily ? todayDaily.tempMax : actualTempC + 3;
  let eveningPoint: HourlyWeatherPoint | undefined;

  if (hourly && hourly.length > 0) {
    const eveningPoints = hourly.filter((h) => {
      const d = new Date(h.time);
      const hourNum = !isNaN(d.getHours())
        ? d.getHours()
        : parseInt(h.time.split('T')[1]?.split(':')[0] || '12', 10);
      return hourNum >= 17 && hourNum <= 22;
    });

    if (eveningPoints.length > 0) {
      eveningPoint = eveningPoints[0];
      eveningTemp = Math.round(
        eveningPoints.reduce((acc, p) => acc + p.temperature, 0) / eveningPoints.length
      );
    }
  }

  const dropExpected = actualTempC - eveningTemp >= 3 || maxDayTemp - eveningTemp >= 4;
  const dropDegrees = Math.max(0, Math.round(actualTempC - eveningTemp));

  let swingSummary = '';
  if (dropExpected && dropDegrees >= 3) {
    swingSummary = `Day starts warm at ${Math.round(actualTempC)}°C, but drops ${dropDegrees}°C down to ${eveningTemp}°C by evening.`;
  } else if (actualTempC < maxDayTemp - 3) {
    swingSummary = `Warming up throughout the day: starts at ${Math.round(actualTempC)}°C and peaks at ${Math.round(maxDayTemp)}°C midday.`;
  } else {
    swingSummary = `Steady day: temperatures stay between ${Math.round(minDayTemp)}°C and ${Math.round(maxDayTemp)}°C.`;
  }

  const temperatureSwing: DayTemperatureSwing = {
    currentTemp: Math.round(actualTempC),
    minTemp: Math.round(minDayTemp),
    maxTemp: Math.round(maxDayTemp),
    eveningTemp: Math.round(eveningTemp),
    dropExpected,
    dropDegrees,
    swingSummary,
  };

  // ==========================================
  // PACK IN BAG ITEMS & "WITH" COLLECTION
  // ==========================================
  const packInBagItems: PackInBagItem[] = [];
  const onItemIds = new Set(onItems.map((i) => i.clothingItemId));

  // 1. Evening cool down item
  // Only suppress packing an evening layer if there are specific scheduled activities that conclude before evening (endHour <= 17).
  // E.g. If daycare ends by 16:30 or 17:00, evening cooling occurs after child is already home.
  // When no schedules are provided (general day), or when scheduled activities extend into the evening (endHour >= 18), include evening layer.
  const isScheduledBeforeEvening = allSchedules.length > 0 && combinedScheduleRange.endHour <= 17;
  const isEveningActivity = !isScheduledBeforeEvening;
  if (isEveningActivity && (dropExpected || eveningTemp <= 17)) {
    const eveningItem =
      getBestCatalogItem('thin_long_sleeve_shirt') ||
      getBestCatalogItem('sweatshirt') ||
      getBestCatalogItem('light_cardigan');

    if (eveningItem) {
      packInBagItems.push({
        id: `pack-${eveningItem.id}`,
        name: eveningItem.label.en,
        timing: 'For the evening cool-down',
        reason: `Evening temperatures drop to around ${eveningTemp}°C. Slip on when leaving daylight warmth.`,
        iconName: eveningItem.id,
        isCrucial: true,
      });

      // Add to WITH if not already worn in ON
      if (!onItemIds.has(eveningItem.id)) {
        withItems.push({
          clothingItemId: eveningItem.id,
          quantity: 1,
          reasons: [`Warm layer to put on when evening temperature drops to ${eveningTemp}°C.`],
          relevantWindowIds: ['weather-evening-chill'],
        });

        // Actionable transition
        const changeTime = eveningPoint
          ? toIso8601WithTimezone(eveningPoint.time)
          : toIso8601WithTimezone('18:00');

        changesList.push({
          id: `change-evening-${eveningItem.id}`,
          time: changeTime,
          action: 'put_on',
          clothingItemId: eveningItem.id,
          reason: `Temperature cools down to ${eveningTemp}°C around dusk/evening.`,
          activityWindowId: 'weather-evening-chill',
        });
      }
    }
  }

  // 2. Rain / shower expected later
  // Look strictly across scheduled activity hours
  const scheduleStartHour = combinedScheduleRange.startHour;
  const scheduleEndHour = combinedScheduleRange.endHour;

  const scheduleHourlyPoints = (hourly || []).filter((h) => {
    const match = h.time.match(/T(\d{1,2})/);
    const hour = match ? parseInt(match[1], 10) : new Date(h.time).getHours();
    return !isNaN(hour) && hour >= scheduleStartHour && hour <= scheduleEndHour;
  });

  const rainPointInSchedule = scheduleHourlyPoints.find(
    (h) => h.precipitationProbability > 30 || (h.weatherCode >= 51 && h.weatherCode <= 67)
  );

  // If there are scheduled activities, only pack rain gear if rain is expected DURING those activities!
  const laterRainPoint =
    allSchedules.length > 0
      ? rainPointInSchedule
      : (rainPointInSchedule ||
        hourly?.find((h, idx) => idx > 0 && (h.precipitationProbability > 30 || (h.weatherCode >= 51 && h.weatherCode <= 67))));

  if (laterRainPoint && !isRaining) {
    const rainPackItem =
      getBestCatalogItem('light_rain_jacket') ||
      (isAllowed('umbrella') ? getCatalogItemById('umbrella') : null) ||
      (isAllowed('waterproof_puddle_suit') ? getCatalogItemById('waterproof_puddle_suit') : null);

    if (rainPackItem) {
      packInBagItems.push({
        id: `pack-${rainPackItem.id}`,
        name: `Compact packable ${rainPackItem.label.en.toLowerCase()}`,
        timing: formatForecastTiming(laterRainPoint),
        reason: rainPointInSchedule
          ? `Showers expected during scheduled activities (${laterRainPoint.precipitationProbability}% chance of rain).`
          : `Showers expected later today (${laterRainPoint.precipitationProbability}% chance of rain).`,
        iconName: rainPackItem.id,
        isCrucial: true,
      });

      if (!onItemIds.has(rainPackItem.id)) {
        withItems.push({
          clothingItemId: rainPackItem.id,
          quantity: 1,
          reasons: [
            rainPointInSchedule
              ? `Waterproof gear for rain expected during scheduled activities (${laterRainPoint.precipitationProbability}% chance).`
              : `Waterproof gear for predicted precipitation (${laterRainPoint.precipitationProbability}% chance) later today.`,
          ],
          relevantWindowIds: rainPointInSchedule ? ['weather-rain', ...allSchedules.map((s) => s.id)] : ['weather-rain'],
        });

        changesList.push({
          id: `change-rain-${rainPackItem.id}`,
          time: toIso8601WithTimezone(laterRainPoint.time),
          action: 'put_on',
          clothingItemId: rainPackItem.id,
          reason: `Precipitation probability reaches ${laterRainPoint.precipitationProbability}%. Put on rain gear.`,
          activityWindowId: 'weather-rain',
        });
      }
    } else {
      warningsList.push({
        code: WARNING_CODES.MISSING_RAIN_GEAR,
        severity: 'warning',
        message: `Rain is expected (${laterRainPoint.precipitationProbability}%), but no rain jacket or umbrella is enabled in wardrobe.`,
        relatedWindowIds: ['weather-rain'],
      });
    }
  }

  // 3. Car Seat Safety Transition (if applicable)
  const carSeatSchedule = allSchedules.find(
    (s) => s.locationType === 'travel_excursion' || (s as any).activity === 'car_seat'
  );
  if ((activity === 'car_seat' || carSeatSchedule) && resolvedOuter) {
    if (resolvedOuter.id === 'heavy_winter_coat' || resolvedOuter.id === 'baby_snowsuit') {
      const transitionTimeIso = toIso8601WithTimezone(carSeatSchedule?.startTime || '08:30');
      changesList.push({
        id: `change-car-seat-remove-coat`,
        time: transitionTimeIso,
        action: 'remove',
        clothingItemId: resolvedOuter.id,
        reason: 'Car seat safety: remove bulky coat before strapping child into car seat harness.',
        activityWindowId: carSeatSchedule ? carSeatSchedule.id : departureWindowId,
      });
    }
  }

  // 4. Anti-Mosquito Advice & Pack item
  const currentOrPeakTemp = Math.max(actualTempC, maxDayTemp);
  const isMosquitoTemp = currentOrPeakTemp >= 16;
  const isWarmHumid = currentOrPeakTemp >= 19 && (humidity ? humidity >= 50 : true);

  let mosquitoNeeded = false;
  let mosquitoRisk: MosquitoAdvice['riskLevel'] = 'none';
  let mosquitoHeadline = 'No mosquito repellent needed today';
  let mosquitoRule = '';
  let ageSafetyNotice = '';
  let peakHours = 'Dusk & twilight hours (17:30 – 20:30)';
  let environmentalReason = 'Temperatures are too cool (<15°C) for mosquito activity today.';
  const safeProducts: string[] = [];

  if (isMosquitoTemp) {
    mosquitoNeeded = true;
    const canUseChemicalRepellent = isAllowed('insect_repellent');

    if (isWarmHumid) {
      mosquitoRisk = currentOrPeakTemp >= 23 ? 'high' : 'moderate';
      environmentalReason = `Warm conditions (${Math.round(currentOrPeakTemp)}°C) and outdoor moisture create prime conditions for mosquito biting, especially near grass, trees, or water.`;
    } else {
      mosquitoRisk = 'low';
      environmentalReason = `Mild weather (${Math.round(currentOrPeakTemp)}°C) may bring out evening mosquitoes at dusk.`;
    }

    if (ageCategory === 'newborn' || ageInMonths < 2) {
      mosquitoHeadline = 'Physical barrier ONLY — Chemical repellents are unsafe under 2 months';
      mosquitoRule =
        'DO NOT apply chemical sprays (DEET, Picaridin, OLE) to babies under 2 months. Use physical mosquito netting over the stroller and dress baby in breathable, lightweight long-sleeve cotton layers.';
      ageSafetyNotice =
        'AAP & CDC Warning: Infants younger than 2 months cannot metabolize repellent chemicals through their delicate skin. Strictly use physical mesh nets and loose protective clothing.';
      safeProducts.push('Fine breathable stroller mosquito net', 'Loose light-colored long-sleeve cotton clothes');

      packInBagItems.push({
        id: 'pack-mosquito-net',
        name: 'Breathable stroller mosquito netting (Physical barrier)',
        timing: 'Late afternoon / evening outdoor walks',
        reason: 'Safe chemical-free bug barrier for babies under 2 months.',
        iconName: 'Shield',
        isCrucial: true,
      });
    } else if (!canUseChemicalRepellent) {
      mosquitoHeadline = 'Mosquito protection: Repellent excluded — Use physical clothing';
      mosquitoRule =
        'Insect repellent is excluded in child’s catalog. Keep child protected with lightweight long trousers and thin long-sleeved shirts around dusk.';
      ageSafetyNotice =
        'Physical protection: Loose-fitting, light-colored long clothing shields arms and legs naturally without chemical spray.';
      safeProducts.push('Lightweight long trousers', 'Thin long-sleeved shirt');

      warningsList.push({
        code: WARNING_CODES.INSECT_REPELLENT_EXCLUDED,
        severity: 'info',
        message: 'Insect repellent is excluded in child wardrobe; relying on physical coverage clothing for bite protection.',
        relatedClothingItemIds: ['insect_repellent'],
        relatedWindowIds: ['weather-dusk'],
      });
    } else {
      mosquitoHeadline = `Child-safe mosquito repellent recommended (${
        ageInMonths < 12 ? ageInMonths + ' months old' : Math.floor(ageInMonths / 12) + ' years old'
      })`;
      mosquitoRule = `Apply repellent to exposed skin and clothing. Rub onto limbs; never spray near eyes or child's hands.`;
      ageSafetyNotice =
        ageInMonths < 36
          ? 'Pediatric Rule: Do NOT use OLE or PMD on children under 3 years old. Only use child-formulated DEET (≤30%) or Picaridin (20%).'
          : 'Safe for DEET (10%–30%), Picaridin (20%), or Oil of Lemon Eucalyptus (OLE).';
      safeProducts.push('Picaridin / Icaridin 20%', 'Child DEET 10%–30% lotion or spray');

      packInBagItems.push({
        id: 'pack-mosquito-spray',
        name: 'Child-safe mosquito repellent (Picaridin or ≤30% DEET)',
        timing: 'Apply around dusk (17:30 – 20:30)',
        reason: 'Active mosquito biting window in warm conditions. Apply to clothes and limbs (avoid hands & face).',
        iconName: 'insect_repellent',
        isCrucial: true,
      });

      if (isAllowed('insect_repellent') && !onItemIds.has('insect_repellent')) {
        withItems.push({
          clothingItemId: 'insect_repellent',
          quantity: 1,
          reasons: ['Apply before dusk (17:30 – 20:30) to shield against evening mosquito bites.'],
          relevantWindowIds: ['weather-dusk'],
        });
      }
    }
  } else {
    ageSafetyNotice = 'At current temperatures below 15°C, mosquitoes are naturally dormant.';
  }

  const mosquitoAdvice: MosquitoAdvice = {
    needed: mosquitoNeeded,
    riskLevel: mosquitoRisk,
    headline: mosquitoHeadline,
    applicationRule: mosquitoRule,
    ageSafetyNotice,
    peakHours,
    environmentalReason,
    safeProducts,
  };

  // ==========================================
  // WINDOW ASSESSMENTS
  // ==========================================
  // 1. Departure Window Assessment
  const depSuitability: WindowAssessment['suitability'] =
    !resolvedBase || !resolvedBottom || !resolvedShoe
      ? 'unsuitable'
      : (isRaining && !isOuterWaterproof) ||
        ((thermalZone === 'freezing' || thermalZone === 'cold') && !resolvedOuter && !resolvedMidTop) ||
        (isHighUv && !resolvedHat && !isAllowed('sunscreen'))
      ? 'compromised'
      : 'suitable';

  const depReasons: string[] = [];
  if (depSuitability === 'suitable') {
    depReasons.push(
      `Initial outfit fully protects against departure conditions (${Math.round(actualTempC)}°C, ${thermalZoneLabel.toLowerCase()}).`
    );
    if (isRaining) depReasons.push('Waterproof outer layer and boots protect against morning rain.');
    if (isHighUv) depReasons.push('Sun protection shields skin during departure UV levels.');
  } else if (depSuitability === 'compromised') {
    depReasons.push('Outfit is wearable but partially compromised by missing recommended weather layers.');
    if (isRaining && !resolvedOuter) depReasons.push('Rain gear is missing for departure precipitation.');
    if (isHighUv && !resolvedHat && !isAllowed('sunscreen')) depReasons.push('Sun protection is missing under high UV index.');
  } else {
    depReasons.push('Essential wardrobe items (base layer, bottoms, or shoes) are missing.');
  }

  windowAssessmentsList.push({
    activityWindowId: departureWindowId,
    suitability: depSuitability,
    requiredProperties: {
      insulation:
        thermalZone === 'freezing' || thermalZone === 'cold'
          ? 'high'
          : thermalZone === 'cool'
          ? 'medium'
          : 'low',
      breathability: thermalZone === 'warm' || thermalZone === 'hot' ? 'high' : 'medium',
      windResistance: isHighWind ? 'high' : 'none',
      waterProtection: isRaining ? 'high' : 'none',
      sunProtection: isHighUv ? (uvIndex >= 6 ? 'high' : 'medium') : 'none',
      coverage: thermalZone === 'freezing' || thermalZone === 'cold' ? 'full' : 'partial',
    },
    reasons: depReasons,
  });

  // 2. Weather Rain Window Assessment (if rain predicted later)
  if (laterRainPoint) {
    const hasRainGear = withItems.some((i) => i.clothingItemId === 'light_rain_jacket' || i.clothingItemId === 'umbrella');
    const rainSuitability: WindowAssessment['suitability'] = hasRainGear ? 'suitable' : 'compromised';
    const rainReasons: string[] = hasRainGear
      ? [`Packable rain gear is brought in bag and scheduled to be put on at ${formatForecastTiming(laterRainPoint)}.`]
      : [`Precipitation expected (${laterRainPoint.precipitationProbability}%), but no rain protection is available in wardrobe.`];

    windowAssessmentsList.push({
      activityWindowId: 'weather-rain',
      suitability: rainSuitability,
      requiredProperties: {
        waterProtection: laterRainPoint.precipitationProbability >= 60 ? 'high' : 'medium',
        windResistance: isHighWind ? 'high' : 'low',
      },
      reasons: rainReasons,
    });
  }

  // 3. Evening Drop Window Assessment (if drop expected and activity extends into evening)
  if (dropExpected && isEveningActivity) {
    const hasEveningLayer = withItems.some(
      (i) => i.clothingItemId === 'thin_long_sleeve_shirt' || i.clothingItemId === 'sweatshirt' || i.clothingItemId === 'light_cardigan'
    );
    const dropSuitability: WindowAssessment['suitability'] = hasEveningLayer ? 'suitable' : 'compromised';
    const dropReasons: string[] = hasEveningLayer
      ? [`Warm layer packed to maintain thermal comfort as temperature drops to ${eveningTemp}°C.`]
      : [`Temperatures drop ${dropDegrees}°C by evening without an extra warm layer packed.`];

    windowAssessmentsList.push({
      activityWindowId: 'weather-evening-chill',
      suitability: dropSuitability,
      requiredProperties: {
        insulation: eveningTemp <= 14 ? 'high' : 'medium',
        coverage: 'full',
      },
      reasons: dropReasons,
    });
  }

  // 4. Active Schedule Assessments (for all scheduled activity windows)
  for (const sched of allSchedules) {
    if (sched.id === departureWindowId) continue;
    let scheduleSuitability: WindowAssessment['suitability'] = 'suitable';
    const scheduleReasons: string[] = [];

    if (sched.locationType === 'travel_excursion' || activity === 'car_seat') {
      if (resolvedOuter && (resolvedOuter.id === 'heavy_winter_coat' || resolvedOuter.id === 'baby_snowsuit')) {
        scheduleReasons.push('Car seat safety transition included: bulky outerwear must be removed before buckling.');
      } else {
        scheduleReasons.push('Thin snug layers are ideal for safe harness fastening.');
      }
    } else if (sched.locationType === 'beach') {
      if (!resolvedHat && !isAllowed('sunscreen')) {
        scheduleSuitability = 'compromised';
        scheduleReasons.push('High UV exposure at beach with inadequate sun hat / sunscreen.');
      } else {
        scheduleReasons.push('Beach sun and breeze requirements covered.');
      }
    } else if (sched.locationType === 'daycare') {
      scheduleReasons.push(`Clothing plan covers scheduled ${sched.title || 'Daycare'}.`);
    } else {
      scheduleReasons.push(`Clothing plan covers scheduled ${sched.title || sched.locationType}.`);
    }

    windowAssessmentsList.push({
      activityWindowId: sched.id,
      suitability: scheduleSuitability,
      requiredProperties: {
        insulation: thermalZone === 'freezing' || thermalZone === 'cold' ? 'high' : 'medium',
        breathability: 'high',
        sunProtection: isHighUv ? 'high' : 'low',
      },
      reasons: scheduleReasons,
    });
  }

  // Check if any window is compromised or unsuitable
  const hasCompromisedWindow = windowAssessmentsList.some((w) => w.suitability !== 'suitable');
  if (hasCompromisedWindow && !warningsList.some((w) => w.code === WARNING_CODES.INCOMPLETE_WINDOW_COVERAGE)) {
    warningsList.push({
      code: WARNING_CODES.INCOMPLETE_WINDOW_COVERAGE,
      severity: 'warning',
      message: 'One or more activity or forecast windows have compromised clothing coverage.',
      relatedWindowIds: windowAssessmentsList.filter((w) => w.suitability !== 'suitable').map((w) => w.activityWindowId),
    });
  }

  // ==========================================
  // STATUS DETERMINATION
  // ==========================================
  let status: RecommendationStatus = 'success';
  const hasCriticalWarning = warningsList.some((w) => w.severity === 'critical');
  const hasNonCriticalWarning = warningsList.some((w) => w.severity === 'warning');

  if (hasCriticalWarning || !resolvedBase || !resolvedBottom || !resolvedShoe) {
    status = 'no_valid_outfit';
    summary = `Incomplete Outfit: Essential clothing items (base layer, bottoms, or shoes) are missing or disabled.`;
  } else if (hasNonCriticalWarning || hasCompromisedWindow) {
    status = 'partial';
  } else {
    status = 'success';
  }

  // Sleep / Nap TOG rating
  let sleepTogRecommendation: ClothingRecommendation['sleepTogRecommendation'];
  if (isBaby) {
    if (actualTempC >= 24) {
      sleepTogRecommendation = {
        tog: '0.5 TOG',
        description: 'Warm room (>24°C / >75°F)',
        clothing: 'Short-sleeve cotton bodysuit or diaper only + 0.5 TOG lightweight muslin sleep sack.',
      };
    } else if (actualTempC >= 21) {
      sleepTogRecommendation = {
        tog: '1.0 TOG',
        description: 'Standard comfortable room (21-23°C / 70-74°F)',
        clothing: 'Short or long-sleeve cotton bodysuit + 1.0 TOG sleep bag.',
      };
    } else if (actualTempC >= 18) {
      sleepTogRecommendation = {
        tog: '2.5 TOG',
        description: 'Ideal nursery temp (18-20°C / 64-68°F)',
        clothing: 'Long-sleeve cotton bodysuit + footed sleeper + 2.5 TOG sleep bag.',
      };
    } else {
      sleepTogRecommendation = {
        tog: '3.5 TOG',
        description: 'Chilly room (<18°C / <64°F)',
        clothing: 'Thermal long-sleeve bodysuit + fleece pyjamas + 3.5 TOG winter padded sleep bag.',
      };
    }
  } else {
    if (actualTempC >= 24) {
      sleepTogRecommendation = {
        tog: 'Light Summer Sheet',
        description: 'Warm room (>24°C / >75°F)',
        clothing: 'Light short-sleeve pyjamas or tee & shorts with a breathable cotton top sheet.',
      };
    } else if (actualTempC >= 21) {
      sleepTogRecommendation = {
        tog: '4.5 - 7.0 Tog Duvet',
        description: 'Comfortable room (21-23°C / 70-74°F)',
        clothing: 'Cotton pyjamas set + lightweight junior duvet.',
      };
    } else if (actualTempC >= 18) {
      sleepTogRecommendation = {
        tog: '7.0 - 9.0 Tog Duvet',
        description: 'Standard room temp (18-20°C / 64-68°F)',
        clothing: 'Long-sleeve cotton pyjama set + standard child duvet or cozy blanket.',
      };
    } else {
      sleepTogRecommendation = {
        tog: '10.5 Tog Winter Duvet',
        description: 'Chilly room (<18°C / <64°F)',
        clothing: 'Warm flannel or fleece pyjamas + winter duvet.',
      };
    }
  }

  // Hourly transition tips
  let hourlyLayeringTip = 'Steady temperatures expected today. The morning layers will serve well throughout.';
  if (isRaining) {
    hourlyLayeringTip = `Precipitation expected during parts of the day. Keep a rain jacket or puddle suit and dry socks handy for your ${childNoun}.`;
  } else if (thermalZone === 'cool' || thermalZone === 'cold') {
    hourlyLayeringTip = `Mornings are brisk; remove or unzip the outer jacket once the sun peaks around midday.`;
  } else if (thermalZone === 'warm') {
    hourlyLayeringTip = `UV peaks between 11 AM and 3 PM. Transition to shaded areas and reapply sunscreen.`;
  }

  const wearNowLayers = {
    baseLayer,
    midLayer,
    outerLayer,
    extremities,
  };

  // Helper to aggregate withItems across activities and weather windows
  const aggregatedWithMap = new Map<string, RecommendedItem>();
  for (const item of withItems) {
    const existing = aggregatedWithMap.get(item.clothingItemId);
    if (!existing) {
      aggregatedWithMap.set(item.clothingItemId, {
        clothingItemId: item.clothingItemId,
        quantity: item.quantity,
        reasons: [...item.reasons],
        relevantWindowIds: [...item.relevantWindowIds],
      });
    } else {
      existing.quantity = Math.max(existing.quantity, item.quantity);
      for (const r of item.reasons) {
        if (!existing.reasons.includes(r)) existing.reasons.push(r);
      }
      for (const w of item.relevantWindowIds) {
        if (!existing.relevantWindowIds.includes(w)) existing.relevantWindowIds.push(w);
      }
    }
  }
  const finalizedWithItems = Array.from(aggregatedWithMap.values());

  // Helper to aggregate packInBagItems across activities
  const aggregatedPackMap = new Map<string, PackInBagItem>();
  for (const item of packInBagItems) {
    const cleanId = item.id.replace(/^pack-/, '');
    const existing = aggregatedPackMap.get(cleanId);
    if (!existing) {
      aggregatedPackMap.set(cleanId, { ...item });
    } else {
      if (!existing.timing.includes(item.timing)) {
        existing.timing = `${existing.timing} • ${item.timing}`;
      }
      if (!existing.reason.includes(item.reason)) {
        existing.reason = `${existing.reason} • ${item.reason}`;
      }
      existing.isCrucial = existing.isCrucial || item.isCrucial;
    }
  }
  const finalizedPackInBagItems = Array.from(aggregatedPackMap.values());

  const result: ClothingRecommendation = {
    status,
    summary,
    on: onItems,
    with: finalizedWithItems,
    changes: changesList,
    windowAssessments: windowAssessmentsList,
    warnings: warningsList,
    thermalZone,
    thermalZoneLabel,
    targetTemp: Math.round(effectiveTemp),
    wearNowLayers,
    packInBagItems: finalizedPackInBagItems,
    mosquitoAdvice,
    temperatureSwing,
    baseLayer,
    midLayer,
    outerLayer,
    extremities,
    accessoriesAndGear,
    safetyAlerts,
    pediatricInsights,
    sleepTogRecommendation,
    hourlyLayeringTip,
  };

  // Runtime validation before returning output
  assertValidRecommendationResult(result, availableClothingIds);

  return result;
}
