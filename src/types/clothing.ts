export type LayerCategory = 'base' | 'mid' | 'outer' | 'extremities' | 'gear';

export interface ClothingItem {
  id: string;
  name: string;
  category: LayerCategory;
  description: string;
  iconName: string; // Lucide icon reference
  materialHint?: string;
  isOptional?: boolean;
  priority: 'essential' | 'recommended' | 'situational';
}

export interface PackInBagItem {
  id: string;
  name: string;
  timing: string; // e.g. "For the evening", "Midday heat", "If showers hit"
  reason: string; // e.g. "Temperatures drop from 22°C to 15°C after 17:00"
  iconName: string;
  isCrucial: boolean;
}

export interface MosquitoAdvice {
  needed: boolean;
  riskLevel: 'none' | 'low' | 'moderate' | 'high';
  headline: string;
  applicationRule: string;
  ageSafetyNotice: string;
  peakHours: string;
  environmentalReason: string;
  safeProducts: string[];
}

export interface DayTemperatureSwing {
  currentTemp: number;
  minTemp: number;
  maxTemp: number;
  eveningTemp: number; // temp around 18:00 - 20:00
  dropExpected: boolean;
  dropDegrees: number;
  swingSummary: string;
}

export type RecommendationStatus = 'success' | 'partial' | 'no_valid_outfit';

export interface RecommendedItem {
  clothingItemId: string;
  quantity: number;
  reasons: string[];
  relevantWindowIds: string[];
}

export interface OutfitChange {
  id: string;
  time: string; // ISO 8601 datetime with timezone
  action: 'put_on' | 'remove' | 'replace';
  clothingItemId: string;
  replacesClothingItemId?: string;
  reason: string;
  activityWindowId: string;
}

export interface WindowAssessment {
  activityWindowId: string;
  suitability: 'suitable' | 'compromised' | 'unsuitable';
  requiredProperties: {
    insulation?: 'low' | 'medium' | 'high';
    breathability?: 'low' | 'medium' | 'high';
    windResistance?: 'none' | 'low' | 'medium' | 'high';
    waterProtection?: 'none' | 'low' | 'medium' | 'high';
    sunProtection?: 'none' | 'low' | 'medium' | 'high';
    coverage?: 'minimal' | 'partial' | 'full';
  };
  reasons: string[];
}

export type WarningSeverity = 'info' | 'warning' | 'critical';

export interface RecommendationWarning {
  code: string;
  severity: WarningSeverity;
  message: string;
  relatedWindowIds?: string[];
  relatedClothingItemIds?: string[];
}

export const WARNING_CODES = {
  NO_VALID_BASE_LAYER: 'NO_VALID_BASE_LAYER',
  NO_VALID_BOTTOMS: 'NO_VALID_BOTTOMS',
  NO_VALID_FOOTWEAR: 'NO_VALID_FOOTWEAR',
  MISSING_RAIN_GEAR: 'MISSING_RAIN_GEAR',
  MISSING_COLD_MID_LAYER: 'MISSING_COLD_MID_LAYER',
  MISSING_COLD_OUTER_LAYER: 'MISSING_COLD_OUTER_LAYER',
  MISSING_SUN_PROTECTION: 'MISSING_SUN_PROTECTION',
  INSECT_REPELLENT_EXCLUDED: 'INSECT_REPELLENT_EXCLUDED',
  CAR_SEAT_BULKY_JACKET_HAZARD: 'CAR_SEAT_BULKY_JACKET_HAZARD',
  NEWBORN_UNDER_INSULATED: 'NEWBORN_UNDER_INSULATED',
  WEATHER_DATA_UNAVAILABLE: 'WEATHER_DATA_UNAVAILABLE',
  INCOMPLETE_WINDOW_COVERAGE: 'INCOMPLETE_WINDOW_COVERAGE',
} as const;

export type WarningCode = (typeof WARNING_CODES)[keyof typeof WARNING_CODES];

export interface RecommendationResult {
  status: RecommendationStatus;
  summary: string;
  on: RecommendedItem[];
  with: RecommendedItem[];
  changes: OutfitChange[];
  windowAssessments: WindowAssessment[];
  warnings: RecommendationWarning[];
}

export interface ClothingRecommendation extends RecommendationResult {
  thermalZone: 'freezing' | 'cold' | 'cool' | 'mild' | 'warm' | 'hot';
  thermalZoneLabel: string;
  targetTemp: number; // Effective feel temperature used
  wearNowLayers: {
    baseLayer: ClothingItem[];
    midLayer: ClothingItem[];
    outerLayer: ClothingItem[];
    extremities: ClothingItem[];
  };
  packInBagItems: PackInBagItem[]; // Items to have WITH him, but NOT ON him!
  mosquitoAdvice: MosquitoAdvice;
  temperatureSwing?: DayTemperatureSwing;
  baseLayer: ClothingItem[];
  midLayer: ClothingItem[];
  outerLayer: ClothingItem[];
  extremities: ClothingItem[];
  accessoriesAndGear: ClothingItem[];
  safetyAlerts: string[];
  pediatricInsights: string[];
  sleepTogRecommendation?: {
    tog: string;
    description: string;
    clothing: string;
  };
  hourlyLayeringTip: string;
}
