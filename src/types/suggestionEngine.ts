/**
 * Interfaces for Suggestion Engine (agent.py + prompt_template.md)
 */

export interface WearOnStartItem {
  item: string;
}

export interface PackAndCarryItem {
  item: string;
  appropriate_when: string;
}

export interface AccessoryTimingItem {
  item: string;
  timing: string;
}

export interface MosquitoRepellentRecommendation {
  needed: boolean;
  hours?: string;
  reason?: string;
}

export interface AiOutfitActivity {
  activity_name: string;
  time_window: string;
  wear_on_start: WearOnStartItem[];
  pack_and_carry: PackAndCarryItem[];
  mosquito_repellent?: MosquitoRepellentRecommendation;
  accessories?: AccessoryTimingItem[];
}

export interface AiOutfitPlan {
  plan_date: string;
  activities: AiOutfitActivity[];
}

export interface HourlyWeatherRecord {
  time: string;
  temperature_2m: number;
  apparent_temperature: number;
  precipitation_probability: number;
  precipitation: number;
  weather_code: number;
  cloud_cover: number;
  visibility: number;
  wind_speed_10m: number;
  wind_gusts_10m: number;
  uv_index: number;
  is_day: number;
}

export interface ActivityWeatherUnits {
  time: string;
  temperature_2m: string;
  apparent_temperature: string;
  precipitation_probability: string;
  precipitation: string;
  weather_code: string;
  cloud_cover: string;
  visibility: string;
  wind_speed_10m: string;
  wind_gusts_10m: string;
  uv_index: string;
  is_day: string;
}

export interface ActivityWeatherEntry {
  location: string;
  start_time: string;
  end_time: string;
  units: ActivityWeatherUnits;
  weather: HourlyWeatherRecord[];
}

export type WeatherByActivity = Record<string, ActivityWeatherEntry>;

export interface SuggestionEngineRequestPayload {
  weather_by_activity: WeatherByActivity;
  child_info: Record<string, any> | string;
  activities: Array<{
    type?: string;
    activity_name?: string;
    location: string;
    start_time: string;
    end_time: string;
  }>;
  owned_item_ids?: string[];
  wardrobe_list?: any;
}

export interface CachedSuggestionRecord {
  cacheKey: string;
  childId: string;
  dateStr: string;
  plan: AiOutfitPlan;
  timestamp: number;
  activeActivityKeys: string[];
}
