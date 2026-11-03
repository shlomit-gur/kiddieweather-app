import {
  AiOutfitPlan,
  AiOutfitActivity,
  WearOnStartItem,
  PackAndCarryItem,
  AccessoryTimingItem,
} from '../types/suggestionEngine';
import {
  ClothingRecommendation,
  ClothingItem,
  PackInBagItem,
  MosquitoAdvice,
  OutfitChange,
  WindowAssessment,
  RecommendedItem,
  RecommendationWarning,
} from '../types/clothing';
import { ChildAgeCalculation, ChildProfile, ChildScheduleItem } from '../types/child';
import { WeatherData } from '../types/weather';
import { getCatalogItemById, CLOTHING_CATALOG } from '../utils/clothingCatalog';

/**
 * Normalizes item ID / name for lookup in catalog
 */
function normalizeItemId(raw: string): string {
  if (!raw) return '';
  return raw
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, '_');
}

/**
 * Determines layer category from catalog item or ID
 */
function inferLayerCategory(
  itemId: string,
  catalogItem?: any
): 'base' | 'mid' | 'outer' | 'extremities' | 'gear' {
  if (catalogItem) {
    if (catalogItem.layerRole === 'base') return 'base';
    if (catalogItem.layerRole === 'mid') return 'mid';
    if (catalogItem.layerRole === 'outer') return 'outer';
    if (catalogItem.layerRole === 'footwear') return 'extremities';
  }

  const id = itemId.toLowerCase();
  if (
    id.includes('shoe') ||
    id.includes('boot') ||
    id.includes('sneaker') ||
    id.includes('sandal') ||
    id.includes('sock')
  ) {
    return 'extremities';
  }
  if (
    id.includes('jacket') ||
    id.includes('coat') ||
    id.includes('snowsuit') ||
    id.includes('windbreaker') ||
    id.includes('rain')
  ) {
    return 'outer';
  }
  if (
    id.includes('sweatshirt') ||
    id.includes('fleece') ||
    id.includes('sweater') ||
    id.includes('cardigan') ||
    id.includes('hoodie')
  ) {
    return 'mid';
  }
  if (
    id.includes('hat') ||
    id.includes('cap') ||
    id.includes('sunscreen') ||
    id.includes('repellent') ||
    id.includes('sunglasses') ||
    id.includes('umbrella')
  ) {
    return 'gear';
  }
  return 'base';
}

/**
 * Infer icon name for item
 */
function inferIconName(itemId: string, category: string): string {
  const id = itemId.toLowerCase();
  if (id.includes('shoe') || id.includes('sneaker') || id.includes('boot') || id.includes('sandal') || id.includes('sock')) {
    return 'Footprints';
  }
  if (id.includes('sunscreen') || id.includes('hat') || id.includes('cap') || id.includes('sunglasses')) {
    return 'Sun';
  }
  if (id.includes('umbrella') || id.includes('rain')) {
    return 'Umbrella';
  }
  if (id.includes('repellent') || id.includes('mosquito')) {
    return 'Shield';
  }
  if (id.includes('trouser') || id.includes('pants') || id.includes('shorts') || id.includes('leggings')) {
    return 'Scissors';
  }
  return 'Shirt';
}

/**
 * Human-readable label formatter
 */
function formatItemName(itemId: string, catalogItem?: any): string {
  if (catalogItem?.label?.en) {
    return catalogItem.label.en;
  }
  return itemId
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Generate material or property hint
 */
function getMaterialHint(catalogItem?: any): string | undefined {
  if (!catalogItem?.properties) return undefined;
  const props = catalogItem.properties;
  const parts: string[] = [];
  if (props.insulation && props.insulation !== 'low') parts.push(`${props.insulation} insulation`);
  if (props.breathability && props.breathability === 'high') parts.push('breathable');
  if (props.sunProtection && props.sunProtection === 'high') parts.push('UPF 50+');
  if (props.waterProtection && props.waterProtection !== 'none') parts.push(`${props.waterProtection} water resistance`);
  return parts.length > 0 ? parts.join(', ') : undefined;
}

export interface PopulateSuggestionParams {
  plan: AiOutfitPlan;
  selectedScheduleIds: string[];
  activeSchedulesToday: ChildScheduleItem[];
  weatherData?: WeatherData | null;
  ageCalculation: ChildAgeCalculation;
  child: ChildProfile;
  temperatureUnit?: 'C' | 'F';
}

/**
 * Populates a ClothingRecommendation directly from the Suggestion Engine's response (agent.py).
 * Filters and groups items according to selected activities.
 */
export function populateRecommendationFromAiPlan(params: PopulateSuggestionParams): ClothingRecommendation {
  const { plan, selectedScheduleIds, activeSchedulesToday, weatherData, ageCalculation, child } = params;

  // 1. Identify selected activities
  const selectedSchedules = activeSchedulesToday.filter((s) => selectedScheduleIds.includes(s.id));
  const activeSelectedTitles = (selectedSchedules.length > 0 ? selectedSchedules : activeSchedulesToday).map((s) =>
    s.title.trim().toLowerCase()
  );

  // Match activities in the engine plan
  let matchedPlanActivities = plan.activities.filter((act) => {
    const actName = act.activity_name.trim().toLowerCase();
    return activeSelectedTitles.some(
      (title) => actName.includes(title) || title.includes(actName)
    );
  });

  // If no direct title match, use all plan activities or first activity
  if (matchedPlanActivities.length === 0) {
    matchedPlanActivities = plan.activities.length > 0 ? plan.activities : [];
  }

  // 2. Gather "Wear on Start" (ON) items
  const wearNowBase: ClothingItem[] = [];
  const wearNowMid: ClothingItem[] = [];
  const wearNowOuter: ClothingItem[] = [];
  const wearNowExtremities: ClothingItem[] = [];
  const wearNowAccessories: ClothingItem[] = [];
  const seenWearIds = new Set<string>();

  // Use primary activity wear items (first matched activity starts the day)
  const primaryActivity = matchedPlanActivities[0] || plan.activities[0];
  const wearItems = primaryActivity?.wear_on_start || [];

  wearItems.forEach((w) => {
    const normId = normalizeItemId(w.item);
    if (!normId || seenWearIds.has(normId)) return;
    seenWearIds.add(normId);

    const catalogItem = getCatalogItemById(normId);
    const cat = inferLayerCategory(normId, catalogItem);
    const name = formatItemName(normId, catalogItem);
    const iconName = inferIconName(normId, cat);
    const materialHint = getMaterialHint(catalogItem);

    const itemObj: ClothingItem = {
      id: normId,
      name,
      category: cat,
      description: catalogItem?.properties
        ? `Coverage: ${catalogItem.properties.coverage || 'standard'}, Breathability: ${catalogItem.properties.breathability || 'good'}`
        : 'Essential clothing recommended by Suggestion Engine',
      iconName,
      materialHint,
      priority: 'essential',
    };

    if (cat === 'base') wearNowBase.push(itemObj);
    else if (cat === 'mid') wearNowMid.push(itemObj);
    else if (cat === 'outer') wearNowOuter.push(itemObj);
    else if (cat === 'extremities') wearNowExtremities.push(itemObj);
    else wearNowAccessories.push(itemObj);
  });

  // 3. Gather "Pack and Carry" (WITH) items across all matched activities
  // Intelligent Multi-Activity Aggregator: Groups items by normalized ID so an item (e.g. sunscreen, sweatshirt)
  // never appears multiple times under "with", and aggregates timings, reasons, and relevant activity windows.
  interface AggregatedPackItem {
    id: string;
    name: string;
    cat: string;
    iconName: string;
    isCrucial: boolean;
    activityWindows: Set<string>;
    timings: string[];
    reasons: string[];
  }

  const packItemsMap = new Map<string, AggregatedPackItem>();

  const registerPackItem = (
    rawItemId: string,
    activityName: string,
    rawAppropriateWhen?: string,
    explicitTiming?: string,
    isCrucial: boolean = true
  ) => {
    const normId = normalizeItemId(rawItemId);
    if (!normId) return;
    if (seenWearIds.has(normId)) return; // already in the "on" (wear) list — don't duplicate in "with"

    const catalogItem = getCatalogItemById(normId);
    const name = formatItemName(normId, catalogItem);
    const cat = inferLayerCategory(normId, catalogItem);
    const iconName = inferIconName(normId, cat);

    let timing = explicitTiming || 'For schedule transition';
    if (!explicitTiming) {
      const text = (rawAppropriateWhen || '').toLowerCase();
      if (text.includes('evening')) timing = 'For evening drop';
      else if (text.includes('rain') || text.includes('shower')) timing = 'If rain starts';
      else if (text.includes('drop') || text.includes('chilly') || text.includes('cold')) timing = 'If temps drop';
      else if (text.includes('sun') || text.includes('heat') || text.includes('uv')) timing = 'During outdoor heat/UV';
      else if (activityName) timing = `For ${activityName}`;
    }

    // Only use rawAppropriateWhen as a reason if it's a meaningful phrase (≥15 chars or contains a space)
    const isMeaningfulReason = rawAppropriateWhen && (rawAppropriateWhen.length >= 15 || rawAppropriateWhen.includes(' '));
    const reason = isMeaningfulReason ? rawAppropriateWhen! : (activityName ? `Recommended for ${activityName}` : timing);

    const existing = packItemsMap.get(normId);
    if (!existing) {
      packItemsMap.set(normId, {
        id: normId,
        name,
        cat,
        iconName,
        isCrucial,
        activityWindows: new Set(activityName ? [activityName] : []),
        timings: [timing],
        reasons: [reason],
      });
    } else {
      if (activityName) existing.activityWindows.add(activityName);
      if (isCrucial) existing.isCrucial = true;
      if (explicitTiming) {
        if (!existing.timings.includes(explicitTiming)) {
          existing.timings.unshift(explicitTiming);
        }
      } else if (!existing.timings.some((t) => t.toLowerCase() === timing.toLowerCase())) {
        existing.timings.push(timing);
      }
      if (!existing.reasons.some((r) => r.toLowerCase() === reason.toLowerCase())) {
        existing.reasons.push(reason);
      }
    }
  };

  const targetPlanDate = plan.plan_date || '';

  matchedPlanActivities.forEach((act) => {
    // Parse time window of this activity
    const times = act.time_window.match(/(\d{1,2}):(\d{2})/g);
    let actStartH = 8;
    let actEndH = 17;
    let actStartMinutes = 480;
    let actEndMinutes = 1020;
    if (times && times.length >= 2) {
      const [sh, sm] = times[0].split(':').map(Number);
      const [eh, em] = times[1].split(':').map(Number);
      actStartH = sh;
      actEndH = eh;
      actStartMinutes = sh * 60 + (sm || 0);
      actEndMinutes = eh * 60 + (em || 0);
    }

    (act.pack_and_carry || []).forEach((p) => {
      const timingLower = (p.appropriate_when || '').toLowerCase();

      // Rule 1: If activity ends by 17:00 or earlier, evening cooling (after 18:00, dusk, night) is irrelevant
      const isEveningCooling =
        timingLower.includes('evening') ||
        timingLower.includes('dusk') ||
        timingLower.includes('night') ||
        timingLower.includes('cool-down') ||
        timingLower.includes('cool down') ||
        timingLower.includes('after 18') ||
        timingLower.includes('after 19') ||
        timingLower.includes('after 20') ||
        timingLower.includes('18:00') ||
        timingLower.includes('19:00') ||
        timingLower.includes('20:00');

      if (actEndH <= 17 && isEveningCooling) {
        return; // Discard: child is already home before evening cooling occurs
      }

      // Rule 2: Explicit hour mentioned in timing that is outside this activity window
      const hourMatch = timingLower.match(/(\d{1,2}):(\d{2})/);
      if (hourMatch) {
        const itemH = parseInt(hourMatch[1], 10);
        const itemM = parseInt(hourMatch[2], 10);
        const itemMinutes = itemH * 60 + itemM;
        if (itemMinutes < actStartMinutes - 15 || itemMinutes > actEndMinutes + 15) {
          return; // Discard: mentioned hour is outside this activity window
        }
      }

      // Rule 3: Temperature cooling threshold mentioned (e.g. "gets below 24C", "drops below 20C")
      const belowMatch = timingLower.match(/below\s+(\d{1,2})/);
      if (belowMatch) {
        const threshold = parseInt(belowMatch[1], 10);
        // Check actual temperatures strictly during this activity window
        const tempsInAct = (weatherData?.hourly || [])
          .filter((pt) => {
            if (targetPlanDate && pt.time && !pt.time.startsWith(targetPlanDate)) return false;
            const ptMatch = pt.time.match(/T(\d{1,2}):(\d{2})/);
            if (!ptMatch) return false;
            const ptMinutes = parseInt(ptMatch[1], 10) * 60 + parseInt(ptMatch[2], 10);
            return ptMinutes >= actStartMinutes && ptMinutes <= actEndMinutes;
          })
          .map((pt) => pt.temperature);

        if (tempsInAct.length > 0) {
          const minTempInAct = Math.min(...tempsInAct);
          // If the temperature during the activity never drops below threshold, discard
          if (minTempInAct >= threshold) {
            return;
          }
        }
      }

      registerPackItem(p.item, act.activity_name, p.appropriate_when, undefined, true);
    });
  });

  // 4a. Gather Mosquito Repellent (Evaluated separately and specifically by engine)
  let mosquitoAdvice: MosquitoAdvice = {
    needed: false,
    riskLevel: 'none',
    headline: 'No mosquito repellent needed for today',
    applicationRule: 'Environmental conditions do not indicate mosquito risk.',
    ageSafetyNotice: '',
    peakHours: 'None',
    environmentalReason: 'No insect protection recommended by the Suggestion Engine.',
    safeProducts: [],
  };

  const formatMosquitoHours = (raw: string | undefined): string => {
    if (!raw) return 'During outdoor activity';
    const trimmed = raw.trim();
    const bareHour = trimmed.match(/^(\d{1,2})$/);
    if (bareHour) {
      const h = parseInt(bareHour[1], 10);
      if (h >= 0 && h <= 23) {
        // Cross-reference with activity windows to resolve 12h ambiguity (e.g. "2" → 14 if activity is at 14:00)
        const actSpans = matchedPlanActivities.map((act) => {
          const times = act.time_window.match(/(\d{1,2}):(\d{2})/g);
          if (times && times.length >= 2) {
            const [sh] = times[0].split(':').map(Number);
            const [eh] = times[1].split(':').map(Number);
            return { startH: sh, endH: eh };
          }
          return { startH: 8, endH: 17 };
        });
        const inAnyActivity = (hour: number) =>
          actSpans.some((s) => hour >= s.startH && hour <= s.endH);
        let resolvedH = h;
        if (h < 12 && !inAnyActivity(h) && inAnyActivity(h + 12)) {
          resolvedH = h + 12;
        }
        const period = resolvedH < 12 ? 'AM' : 'PM';
        const display = resolvedH === 0 ? 12 : resolvedH > 12 ? resolvedH - 12 : resolvedH;
        return `${display}:00 ${period}`;
      }
    }
    return trimmed;
  };

  for (const act of matchedPlanActivities) {
    if (act.mosquito_repellent?.needed) {
      const hours = formatMosquitoHours(act.mosquito_repellent.hours);
      const reason = act.mosquito_repellent.reason || `Recommended for ${act.activity_name}`;
      mosquitoAdvice = {
        needed: true,
        riskLevel: 'moderate',
        headline: `Mosquito Repellent: ${hours}`,
        applicationRule: `Apply around ${hours}. Apply over clothing and exposed skin; avoid hands, eyes, and mouth.`,
        ageSafetyNotice: ageCalculation.totalMonths < 2 ? 'Do not use insect repellent on infants under 2 months.' : '',
        peakHours: hours,
        environmentalReason: reason,
        safeProducts: ['Picaridin 20%', 'DEET 10–30%', 'Oil of Lemon Eucalyptus (OLE 30%, 3+ years)'],
      };
      break;
    }
    // Fallback: check legacy act.accessories for insect repellent
    const legacyRep = (act.accessories || []).find((a) => {
      const id = normalizeItemId(a.item);
      return id.includes('repellent') || id.includes('mosquito') || id.includes('insect');
    });
    if (legacyRep) {
      mosquitoAdvice = {
        needed: true,
        riskLevel: 'moderate',
        headline: `Mosquito Repellent: ${legacyRep.timing}`,
        applicationRule: `${legacyRep.timing}. Apply over clothing and exposed skin; avoid hands, eyes, and mouth.`,
        ageSafetyNotice: ageCalculation.totalMonths < 2 ? 'Do not use insect repellent on infants under 2 months.' : '',
        peakHours: legacyRep.timing,
        environmentalReason: `Recommended for ${act.activity_name}.`,
        safeProducts: ['Picaridin 20%', 'DEET 10–30%', 'Oil of Lemon Eucalyptus (OLE 30%, 3+ years)'],
      };
      break;
    }
  }

  // Parse activity time spans with minute resolution
  const activityHourSpans = matchedPlanActivities.map((act) => {
    const times = act.time_window.match(/(\d{1,2}):(\d{2})/g);
    if (times && times.length >= 2) {
      const [sh, sm] = times[0].split(':').map(Number);
      const [eh, em] = times[1].split(':').map(Number);
      return {
        startH: sh,
        startM: sm || 0,
        endH: eh,
        endM: em || 0,
        startMinutes: sh * 60 + (sm || 0),
        endMinutes: eh * 60 + (em || 0),
      };
    }
    return { startH: 8, startM: 0, endH: 17, endM: 0, startMinutes: 480, endMinutes: 1020 };
  });

  // 4b. Umbrella Rule: based strictly on whether rain is forecast DURING scheduled activity hours
  const rainHourlyPoints = (weatherData?.hourly || []).filter((p) => {
    if (targetPlanDate && p.time && !p.time.startsWith(targetPlanDate)) return false;

    const match = p.time.match(/T(\d{1,2}):(\d{2})/);
    if (!match) return false;
    const hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const pointMinutes = hour * 60 + minute;

    // Check if this time point falls within scheduled activity window (+ up to 30 min departure/pickup margin)
    // Never include hours well before the activity begins (e.g., 06:00 when activity starts at 07:30)
    const isDuringActivity = activityHourSpans.some(
      (span) => pointMinutes >= span.startMinutes - 15 && pointMinutes <= span.endMinutes + 30
    );
    if (!isDuringActivity) return false;

    return (
      (p.precipitationProbability !== undefined && p.precipitationProbability >= 20) ||
      (p.precipitation !== undefined && p.precipitation > 0.0) ||
      (p.weatherCode >= 51 && p.weatherCode <= 67) ||
      (p.weatherCode >= 80 && p.weatherCode <= 99)
    );
  });

  if (rainHourlyPoints.length > 0) {
    const earliestRain = rainHourlyPoints[0];
    const latestRain = rainHourlyPoints[rainHourlyPoints.length - 1];
    const earliestH = earliestRain.time.slice(11, 16);
    const latestH = latestRain.time.slice(11, 16);
    const maxProb = Math.max(...rainHourlyPoints.map((p) => p.precipitationProbability || 0));

    const rainTiming =
      earliestH === latestH ? `Rain possible around ${earliestH}` : `Rain possible between ${earliestH} – ${latestH}`;
    const rainReason = `Precipitation risk (${maxProb}%) forecast during activity hours.`;

    registerPackItem(
      'umbrella',
      matchedPlanActivities.map((a) => a.activity_name).join(' & '),
      rainReason,
      rainTiming,
      true
    );
  }

  // 4c. Sunscreen Rule: based on whether the UV forecast for activity time is >= 3 + reapply intervals
  const activityHoursPoints = (weatherData?.hourly || []).filter((p) => {
    if (targetPlanDate && p.time && !p.time.startsWith(targetPlanDate)) return false;
    const hour = parseInt(p.time.slice(11, 13), 10);
    if (isNaN(hour)) return false;
    return activityHourSpans.some((span) => hour >= span.startH && hour <= span.endH);
  });

  const highUvPoints = activityHoursPoints.filter((p) => (p.uvIndex || 0) >= 3);
  if (highUvPoints.length > 0) {
    const maxUv = Math.max(...highUvPoints.map((p) => p.uvIndex || 0));
    const firstSpan = activityHourSpans[0] || { startH: 8, endH: 16 };

    // Calculate application and reapply times within activity window
    const appTimes: string[] = [];
    for (let h = firstSpan.startH; h <= firstSpan.endH; h += 2) {
      const pt = activityHoursPoints.find((p) => parseInt(p.time.slice(11, 13), 10) === h);
      if (!pt || (pt.uvIndex || 0) >= 2.5) {
        appTimes.push(`${String(h).padStart(2, '0')}:00`);
      }
    }

    const timingStr =
      appTimes.length > 1
        ? `Apply before activity at ${appTimes[0]}; reapply at ${appTimes.slice(1).join(', ')}`
        : `Apply around ${appTimes[0] || `${String(firstSpan.startH).padStart(2, '0')}:00`}`;

    const uvReason = `Peak UV index reaches ${maxUv.toFixed(1)} during activity hours. Reapply every 2 hours when outdoors.`;

    const existingSunscreen = packItemsMap.get('sunscreen');
    if (existingSunscreen) {
      // Enrich existing sunscreen item rather than duplicating it
      existingSunscreen.timings = [timingStr];
      if (!existingSunscreen.reasons.some((r) => r.includes(maxUv.toFixed(1)))) {
        existingSunscreen.reasons.unshift(uvReason);
      }
      existingSunscreen.isCrucial = true;
      matchedPlanActivities.forEach((a) => existingSunscreen.activityWindows.add(a.activity_name));
    } else {
      registerPackItem(
        'sunscreen',
        matchedPlanActivities.map((a) => a.activity_name).join(' & '),
        uvReason,
        timingStr,
        true
      );
    }
  }

  // 4d. Other accessories from plan (hats, sunglasses) if present
  matchedPlanActivities.forEach((act) => {
    (act.accessories || []).forEach((acc) => {
      const normId = normalizeItemId(acc.item);
      if (
        !normId ||
        normId.includes('repellent') ||
        normId.includes('mosquito') ||
        normId.includes('insect') ||
        normId === 'umbrella'
      ) {
        return;
      }
      registerPackItem(normId, act.activity_name, acc.timing, acc.timing, true);
    });
  });

  // Convert aggregated pack items map into finalized unique packInBagItems list
  const packInBagItems: PackInBagItem[] = Array.from(packItemsMap.values()).map((item) => {
    let aggregatedTiming = item.timings[0] || 'For schedule transition';
    if (item.timings.length > 1) {
      aggregatedTiming = item.timings.join(' • ');
    } else if (item.activityWindows.size > 1) {
      const activitiesList = Array.from(item.activityWindows).join(' & ');
      aggregatedTiming = `${item.timings[0]} (${activitiesList})`;
    }

    const aggregatedReason = Array.from(new Set(item.reasons)).join(' • ');

    return {
      id: item.id,
      name: item.name,
      timing: aggregatedTiming,
      reason: aggregatedReason,
      iconName: item.iconName,
      isCrucial: item.isCrucial,
    };
  });

  // 5. Build Day Transitions & Outfit Changes if multiple activities
  // Only emit a transition for an item if the child isn't already wearing it and
  // hasn't already been told to put it on for an earlier transition.
  const changes: OutfitChange[] = [];
  const seenChangeIds = new Set<string>(seenWearIds); // pre-seed with what's already worn
  if (matchedPlanActivities.length > 1) {
    for (let i = 1; i < matchedPlanActivities.length; i++) {
      const act = matchedPlanActivities[i];
      const timeMatch = act.time_window.match(/(\d{1,2}:\d{2})/);
      const timeStr = timeMatch ? timeMatch[1] : '16:00';
      const todayDate = plan.plan_date || new Date().toISOString().slice(0, 10);

      (act.pack_and_carry || []).forEach((p, idx) => {
        const normId = normalizeItemId(p.item);
        if (!normId || seenChangeIds.has(normId)) return;
        seenChangeIds.add(normId);
        changes.push({
          id: `change-${act.activity_name}-${idx}`,
          time: `${todayDate}T${timeStr}:00`,
          action: 'put_on',
          clothingItemId: normId,
          reason: `Transition to ${act.activity_name}: ${p.appropriate_when}`,
          activityWindowId: act.activity_name,
        });
      });
    }
  }

  // 6. Window Assessments
  const windowAssessments: WindowAssessment[] = matchedPlanActivities.map((act) => ({
    activityWindowId: act.activity_name,
    suitability: 'suitable',
    requiredProperties: {},
    reasons: [`Fully planned by Suggestion Engine for ${act.time_window}`],
  }));

  // 7. Thermal Zone calculation
  const currentTemp = weatherData?.current.apparentTemperature ?? 20;
  let thermalZone: 'freezing' | 'cold' | 'cool' | 'mild' | 'warm' | 'hot' = 'mild';
  let thermalZoneLabel = 'Mild (Comfortable)';
  if (currentTemp < 0) {
    thermalZone = 'freezing';
    thermalZoneLabel = 'Freezing Cold';
  } else if (currentTemp < 10) {
    thermalZone = 'cold';
    thermalZoneLabel = 'Cold';
  } else if (currentTemp < 18) {
    thermalZone = 'cool';
    thermalZoneLabel = 'Cool';
  } else if (currentTemp < 24) {
    thermalZone = 'mild';
    thermalZoneLabel = 'Mild';
  } else if (currentTemp < 30) {
    thermalZone = 'warm';
    thermalZoneLabel = 'Warm';
  } else {
    thermalZone = 'hot';
    thermalZoneLabel = 'Hot / High Heat';
  }

  // 8. Pediatric insights & Safety alerts
  const safetyAlerts: string[] = [];
  const pediatricInsights: string[] = [
    `Suggestion Engine tailored for ${child.name} (${ageCalculation.formattedAge}).`,
  ];

  if (child.temperatureTendency === 'runs_hot') {
    pediatricInsights.push('Child runs hot: Breathable single-layer base selected to prevent overheating.');
  } else if (child.temperatureTendency === 'runs_cold') {
    pediatricInsights.push('Child runs cold: Insulating layers packed for rapid temperature adjustment.');
  }

  if (child.specialTraits?.includes('sensitive_skin')) {
    pediatricInsights.push('Sensitive skin: Soft, breathable, non-chafing fabrics prioritized.');
  }

  if (currentTemp > 28) {
    safetyAlerts.push('High temperature alert: Keep child hydrated and protect against direct solar exposure.');
  }

  // Deduplicate onItems so no clothing item ID appears twice in on
  const onItemsMap = new Map<string, RecommendedItem>();
  [...wearNowBase, ...wearNowMid, ...wearNowOuter, ...wearNowExtremities].forEach((item) => {
    const existing = onItemsMap.get(item.id);
    if (!existing) {
      onItemsMap.set(item.id, {
        clothingItemId: item.id,
        quantity: 1,
        reasons: [item.description],
        relevantWindowIds: matchedPlanActivities.map((a) => a.activity_name),
      });
    } else {
      if (!existing.reasons.includes(item.description)) {
        existing.reasons.push(item.description);
      }
    }
  });
  const onItems: RecommendedItem[] = Array.from(onItemsMap.values());

  // Build cleanly aggregated withItems matching packItemsMap
  const withItems: RecommendedItem[] = Array.from(packItemsMap.values()).map((item) => {
    const windowIds =
      item.activityWindows.size > 0
        ? Array.from(item.activityWindows)
        : matchedPlanActivities.map((a) => a.activity_name);

    return {
      clothingItemId: item.id,
      quantity: 1,
      reasons: Array.from(new Set(item.reasons)),
      relevantWindowIds: windowIds,
    };
  });

  const activeTitlesStr = matchedPlanActivities.map((a) => a.activity_name).join(', ');

  return {
    status: 'success',
    summary: `Plan from Suggestion Engine for ${matchedPlanActivities.length} routine(s): ${activeTitlesStr}`,
    on: onItems,
    with: withItems,
    changes,
    windowAssessments,
    warnings: [],
    thermalZone,
    thermalZoneLabel,
    targetTemp: Math.round(currentTemp),
    wearNowLayers: {
      baseLayer: wearNowBase,
      midLayer: wearNowMid,
      outerLayer: wearNowOuter,
      extremities: wearNowExtremities,
    },
    packInBagItems,
    mosquitoAdvice,
    baseLayer: wearNowBase,
    midLayer: wearNowMid,
    outerLayer: wearNowOuter,
    extremities: wearNowExtremities,
    accessoriesAndGear: wearNowAccessories,
    safetyAlerts,
    pediatricInsights,
    hourlyLayeringTip: `Suggestion Engine: Wear initial outfit at morning start; carry packed essentials for ${activeTitlesStr}.`,
  };
}
