import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { WeatherSummaryCard } from './components/WeatherSummaryCard';
import { OutfitVisualizer } from './components/OutfitVisualizer';
import { HourlyForecastSlider } from './components/HourlyForecastSlider';
import { DailyForecastStrip } from './components/DailyForecastStrip';
import { ChildProfileModal } from './components/ChildProfileModal';
import { PediatricGuideModal } from './components/PediatricGuideModal';
import { LocationSearchModal } from './components/LocationSearchModal';
import { BottomNavBar, MainTab } from './components/BottomNavBar';
import { AndroidFrame } from './components/AndroidFrame';
import { KidProfileTab } from './components/KidProfileTab';
import { ClothingCatalogModal } from './components/ClothingCatalogModal';

import { ChildProfile, ActivityType } from './types/child';
import { WeatherData, CurrentWeather } from './types/weather';
import { fetchWeather, getCurrentCoordinates, getFallbackWeatherData, reverseGeocode, searchLocations } from './services/weatherService';
import { calculateChildAge, getDefaultChildProfile } from './utils/dateAndAge';
import { isScheduleActiveOnDate, getScheduleRecurrenceLabel, getCombinedScheduleWindow, getOrderedUniqueLocations, DEFAULT_NO_ACTIVITY_SCHEDULE, formatLocalDate } from './utils/scheduleUtils';
import { BookOpen, AlertCircle, CalendarCheck, Repeat, CheckSquare, Clock, Sparkles, MapPin, CalendarDays } from 'lucide-react';
import { populateRecommendationFromAiPlan } from './services/populateSuggestionFromEngine';
import { generateClothingRecommendation } from './services/clothingRecommender';
import { getClothingSuggestion } from './services/suggestionEngineService';
import { AiOutfitPlan } from './types/suggestionEngine';

const STORAGE_PROFILES_KEY = 'kiddie_weather_profiles_v1';
const STORAGE_ACTIVE_ID_KEY = 'kiddie_weather_active_id_v1';
const STORAGE_UNIT_KEY = 'kiddie_weather_unit_v1';
const STORAGE_COORDS_KEY = 'kiddie_weather_coords_v1';
const STORAGE_HOME_COORDS_KEY = 'kiddie_weather_home_coords_v1';

export default function App() {
  // Profiles state
  const [profiles, setProfiles] = useState<ChildProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROFILES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved profiles', e);
    }
    return [getDefaultChildProfile()];
  });

  const [activeChildId, setActiveChildId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ACTIVE_ID_KEY);
      if (saved) return saved;
    } catch {}
    return profiles[0]?.id || 'default-child-1';
  });

  // Temperature unit
  const [temperatureUnit, setTemperatureUnit] = useState<'C' | 'F'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_UNIT_KEY);
      if (saved === 'C' || saved === 'F') return saved;
    } catch {}
    return 'C';
  });

  // Activity context
  const [activeActivity, setActiveActivity] = useState<ActivityType>('outdoor_play');

  // Selected day for clothing suggestions: 'today' | 'tomorrow'
  const [selectedDay, setSelectedDay] = useState<'today' | 'tomorrow'>('today');

  // Tab navigation
  const [activeTab, setActiveTab] = useState<MainTab>('outfit');

  // Weather state
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Saved location coordinates
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lon: number; name?: string }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_COORDS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { lat: 51.5074, lon: -0.1278, name: 'London, United Kingdom' };
  });

  // Home/default location — only updated when user explicitly changes location via modal
  const [homeCoords, setHomeCoords] = useState<{ lat: number; lon: number; name?: string }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_HOME_COORDS_KEY) || localStorage.getItem(STORAGE_COORDS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { lat: 51.5074, lon: -0.1278, name: 'London, United Kingdom' };
  });

  const isAtActivityLocation =
    Math.abs(currentCoords.lat - homeCoords.lat) > 0.001 ||
    Math.abs(currentCoords.lon - homeCoords.lon) > 0.001;

  // Mobile frame view mode (helpful for desktop testing)
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 900;
    }
    return false;
  });

  // Modals
  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(profiles));
    } catch (e) {
      console.warn('Failed to save profiles to localStorage', e);
    }
  }, [profiles]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ACTIVE_ID_KEY, activeChildId);
    } catch (e) {}
  }, [activeChildId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_UNIT_KEY, temperatureUnit);
    } catch (e) {}
  }, [temperatureUnit]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_COORDS_KEY, JSON.stringify(currentCoords));
    } catch (e) {}
  }, [currentCoords]);

  // Load weather when coordinates change
  const loadWeather = async (lat: number, lon: number, name?: string) => {
    setIsLoadingWeather(true);
    setWeatherError(null);
    try {
      const data = await fetchWeather(lat, lon, name);
      setWeatherData(data);
    } catch (err) {
      console.error('Error fetching weather:', err);
      setWeatherError('Could not connect to weather service. Using cached offline data.');
      setWeatherData(getFallbackWeatherData(name || 'Local Area', lat, lon));
    } finally {
      setIsLoadingWeather(false);
    }
  };

  // Initial load: Attempt GPS, or use saved coordinates
  useEffect(() => {
    const initLocation = async () => {
      // If we don't have custom saved coords, attempt geolocation
      const hasCustomCoords = localStorage.getItem(STORAGE_COORDS_KEY);
      if (!hasCustomCoords && navigator.geolocation) {
        try {
          const coords = await getCurrentCoordinates();
          setCurrentCoords({ lat: coords.lat, lon: coords.lon });
          await loadWeather(coords.lat, coords.lon);
          return;
        } catch {
          // GPS denied or blocked in iframe - seamlessly proceed with default
        }
      }
      loadWeather(currentCoords.lat, currentCoords.lon, currentCoords.name);
    };

    initLocation();
  }, []);

  // GPS trigger handler
  const handleUseCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const coords = await getCurrentCoordinates();
      const resolvedName = await reverseGeocode(coords.lat, coords.lon);
      const newCoords = {
        lat: coords.lat,
        lon: coords.lon,
        name: resolvedName || 'Current Location',
      };
      setCurrentCoords(newCoords);
      try {
        localStorage.setItem(STORAGE_COORDS_KEY, JSON.stringify(newCoords));
      } catch (e) {}
      await loadWeather(coords.lat, coords.lon, newCoords.name);
    } catch (err: any) {
      console.warn('Geolocation failed or blocked:', err);
      setWeatherError('GPS was not permitted or available. You can search any city in the search bar.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Switch location from modal — updates both current and home
  const handleSelectCoordinates = (lat: number, lon: number, name: string) => {
    const newCoords = { lat, lon, name };
    setCurrentCoords(newCoords);
    setHomeCoords(newCoords);
    try {
      localStorage.setItem(STORAGE_COORDS_KEY, JSON.stringify(newCoords));
      localStorage.setItem(STORAGE_HOME_COORDS_KEY, JSON.stringify(newCoords));
    } catch (e) {
      console.warn('Failed to save coordinates to localStorage', e);
    }
    loadWeather(lat, lon, name);
  };

  // Jump to an activity location by name — only updates current, not home
  const handleJumpToActivityLocation = async (locationName: string) => {
    try {
      const results = await searchLocations(locationName);
      if (results.length > 0) {
        const r = results[0];
        const displayName = [r.name, r.admin1, r.country].filter(Boolean).join(', ');
        setCurrentCoords({ lat: r.latitude, lon: r.longitude, name: displayName });
        loadWeather(r.latitude, r.longitude, displayName);
      }
    } catch {
      console.warn('Failed to geocode activity location:', locationName);
    }
  };

  // Restore home location
  const handleRestoreDefault = () => {
    setCurrentCoords(homeCoords);
    loadWeather(homeCoords.lat, homeCoords.lon, homeCoords.name);
  };

  // Active child profile & age calculation
  const activeChild = useMemo(() => {
    return profiles.find((p) => p.id === activeChildId) || profiles[0] || getDefaultChildProfile();
  }, [profiles, activeChildId]);

  const ageCalculation = useMemo(() => {
    return calculateChildAge(activeChild.birthDate);
  }, [activeChild.birthDate]);

  // Profile management handlers
  const handleSaveProfile = (newProfile: ChildProfile) => {
    setProfiles((prev) => {
      const existingIdx = prev.findIndex((p) => p.id === newProfile.id);
      let updated: ChildProfile[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = { ...newProfile };
      } else {
        updated = [...prev, { ...newProfile }];
      }
      try {
        localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save profiles to localStorage', e);
      }
      return updated;
    });
    setActiveChildId(newProfile.id);
    try {
      localStorage.setItem(STORAGE_ACTIVE_ID_KEY, newProfile.id);
    } catch (e) {}
  };

  const handleUpdateActiveChild = (updates: Partial<ChildProfile>) => {
    if (!activeChild) return;
    const updated: ChildProfile = {
      ...activeChild,
      ...updates,
    };
    handleSaveProfile(updated);
  };

  const handleDeleteProfile = (id: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    if (activeChildId === id) {
      const remaining = profiles.filter((p) => p.id !== id);
      if (remaining.length > 0) {
        setActiveChildId(remaining[0].id);
      }
    }
  };

  // Selected day date calculations
  const todayDateObj = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => formatLocalDate(todayDateObj), [todayDateObj]);
  const tomorrowDateObj = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }, []);
  const tomorrowStr = useMemo(() => formatLocalDate(tomorrowDateObj), [tomorrowDateObj]);

  const targetDateObj = selectedDay === 'today' ? todayDateObj : tomorrowDateObj;
  const targetDateStr = selectedDay === 'today' ? todayStr : tomorrowStr;

  const todayFormattedLabel = useMemo(() => {
    return todayDateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }, [todayDateObj]);

  const tomorrowFormattedLabel = useMemo(() => {
    return tomorrowDateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }, [tomorrowDateObj]);

  // Hourly points for the selected day (today vs tomorrow)
  const hourlyForDay = useMemo(() => {
    if (!weatherData?.hourly || weatherData.hourly.length === 0) return [];
    const targetStr = selectedDay === 'today' ? todayStr : tomorrowStr;
    const filtered = weatherData.hourly.filter((p) => p.time.startsWith(targetStr));
    if (filtered.length > 0) return filtered;
    return selectedDay === 'today'
      ? weatherData.hourly.slice(0, 24)
      : weatherData.hourly.slice(24, 48);
  }, [weatherData?.hourly, selectedDay, todayStr, tomorrowStr]);

  // Active weather summary card data for the selected day
  const activeWeatherSummary: CurrentWeather = useMemo(() => {
    if (!weatherData) {
      return {
        temperature: 20,
        apparentTemperature: 20,
        relativeHumidity: 50,
        precipitation: 0,
        weatherCode: 1,
        windSpeed: 10,
        isDay: 1,
        uvIndex: 3,
        time: new Date().toISOString(),
      };
    }

    if (selectedDay === 'today') {
      return weatherData.current;
    }

    // Tomorrow: representative daytime weather
    const tomorrowDaily = weatherData.daily?.[1];
    const middayPoint =
      hourlyForDay.find((p) => {
        const hr = parseInt(p.time.slice(11, 13), 10);
        return hr >= 12 && hr <= 14;
      }) || hourlyForDay[12] || hourlyForDay[0];

    return {
      temperature: tomorrowDaily ? tomorrowDaily.tempMax : (middayPoint?.temperature ?? 20),
      apparentTemperature: middayPoint ? middayPoint.apparentTemperature : (tomorrowDaily?.tempMax ?? 20),
      relativeHumidity: weatherData.current.relativeHumidity || 55,
      precipitation: tomorrowDaily ? (tomorrowDaily.precipitationProbabilityMax > 50 ? 2 : 0) : 0,
      weatherCode: tomorrowDaily ? tomorrowDaily.weatherCode : (middayPoint?.weatherCode ?? 1),
      windSpeed: middayPoint ? middayPoint.windSpeed : (weatherData.current.windSpeed || 10),
      isDay: 1,
      uvIndex: tomorrowDaily ? tomorrowDaily.uvIndexMax : (middayPoint?.uvIndex ?? 3),
      time: tomorrowDaily ? `${tomorrowDaily.date}T12:00:00` : '',
    };
  }, [weatherData, selectedDay, hourlyForDay]);

  const activeDailyForecast = useMemo(() => {
    if (!weatherData?.daily || weatherData.daily.length === 0) return undefined;
    return selectedDay === 'today' ? weatherData.daily[0] : (weatherData.daily[1] || weatherData.daily[0]);
  }, [weatherData?.daily, selectedDay]);

  // Calculate active weather summary point for fallback recommendation
  const targetWeatherPoint = useMemo(() => {
    if (!weatherData) return null;
    return {
      apparentTemp: activeWeatherSummary.apparentTemperature,
      actualTemp: activeWeatherSummary.temperature,
      weatherCode: activeWeatherSummary.weatherCode,
      windSpeed: activeWeatherSummary.windSpeed,
      uvIndex: activeWeatherSummary.uvIndex,
      isCurrent: selectedDay === 'today',
    };
  }, [weatherData, activeWeatherSummary, selectedDay]);

  // Active schedules for selected day using recurrence and date matching
  const activeSchedulesForDay = useMemo(() => {
    return (activeChild.schedules || []).filter((s) => isScheduleActiveOnDate(s, targetDateObj));
  }, [activeChild.schedules, targetDateObj]);

  // Multi-schedule selection: support checking one or more active schedules for the day
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);

  // Keep selected schedules in sync with active schedules for the active day
  useEffect(() => {
    if (activeSchedulesForDay.length === 0) {
      setSelectedScheduleIds([]);
    } else {
      setSelectedScheduleIds((prev) => {
        const stillValid = prev.filter((id) => activeSchedulesForDay.some((s) => s.id === id));
        // Default to checking all active routines if none currently selected
        if (stillValid.length === 0) {
          return activeSchedulesForDay.map((s) => s.id);
        }
        return stillValid;
      });
    }
  }, [activeSchedulesForDay]);

  const selectedSchedules = useMemo(() => {
    if (activeSchedulesForDay.length === 0) {
      return [{
        ...DEFAULT_NO_ACTIVITY_SCHEDULE,
        location: activeChild.location || weatherData?.locationName || currentCoords.name || 'London, UK',
      }];
    }
    const matched = activeSchedulesForDay.filter((s) => selectedScheduleIds.includes(s.id));
    return matched.length > 0 ? matched : [activeSchedulesForDay[0]];
  }, [activeSchedulesForDay, selectedScheduleIds, activeChild.location, weatherData?.locationName, currentCoords.name]);

  // Combined time window across all selected schedules
  const combinedScheduleWindow = useMemo(() => {
    return getCombinedScheduleWindow(selectedSchedules);
  }, [selectedSchedules]);

  // Active activities for the hourly forecast slider (ignoring fallback default_no_activity)
  const activitiesForHourlySlider = useMemo(() => {
    const checked = selectedSchedules.filter((s) => s.id !== 'default_no_activity');
    if (checked.length > 0) return checked;
    return activeSchedulesForDay.filter((s) => s.id !== 'default_no_activity');
  }, [selectedSchedules, activeSchedulesForDay]);

  const handleToggleSchedule = (scheduleId: string) => {
    setSelectedScheduleIds((prev) => {
      if (prev.includes(scheduleId)) {
        // Prevent unchecking the only checked schedule so an active routine is always covered
        if (prev.length <= 1) return prev;
        return prev.filter((id) => id !== scheduleId);
      } else {
        return [...prev, scheduleId];
      }
    });
  };

  const handleSelectDay = (day: 'today' | 'tomorrow') => {
    setSelectedDay(day);
  };

  // Suggestion Engine State (agent.py with prompt_template.md + caching)
  const [aiPlan, setAiPlan] = useState<AiOutfitPlan | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiCached, setIsAiCached] = useState(false);
  const [aiTimestamp, setAiTimestamp] = useState<number | undefined>(undefined);

  // Clothing suggestion populated directly from Suggestion Engine response (instead of naive approach)
  // Displayed based on currently selected activities from the cached plan
  const recommendation = useMemo(() => {
    const defaultScheduleWithLoc = {
      ...DEFAULT_NO_ACTIVITY_SCHEDULE,
      location: activeChild.location || weatherData?.locationName || currentCoords.name || 'London, UK',
    };
    const effectiveSchedules =
      activeSchedulesForDay.length > 0 ? activeSchedulesForDay : [defaultScheduleWithLoc];
    const effectiveSelectedIds =
      activeSchedulesForDay.length > 0 ? selectedScheduleIds : [DEFAULT_NO_ACTIVITY_SCHEDULE.id];

    if (aiPlan) {
      return populateRecommendationFromAiPlan({
        plan: aiPlan,
        selectedScheduleIds: effectiveSelectedIds,
        activeSchedulesToday: effectiveSchedules,
        weatherData,
        ageCalculation,
        child: activeChild,
        temperatureUnit,
      });
    }

    // Fallback while AI plan is initially generating on cold start
    if (!targetWeatherPoint) return null;
    return generateClothingRecommendation({
      apparentTempC: targetWeatherPoint.apparentTemp,
      actualTempC: targetWeatherPoint.actualTemp,
      weatherCode: targetWeatherPoint.weatherCode,
      windSpeedKmh: targetWeatherPoint.windSpeed,
      uvIndex: targetWeatherPoint.uvIndex,
      humidity: weatherData?.current.relativeHumidity,
      ageCategory: ageCalculation.category,
      ageInMonths: ageCalculation.totalMonths,
      activity: activeActivity,
      activityLevel: activeChild.activityLevel,
      temperatureTendency: activeChild.temperatureTendency,
      specialTraits: activeChild.specialTraits,
      activeScheduleItem: selectedSchedules[0] || undefined,
      activeScheduleItems: selectedSchedules,
      hourly: hourlyForDay,
      todayDaily: activeDailyForecast,
      availableClothingIds: activeChild.availableClothingIds,
    });
  }, [
    aiPlan,
    selectedScheduleIds,
    activeSchedulesForDay,
    weatherData,
    ageCalculation,
    activeChild,
    temperatureUnit,
    targetWeatherPoint,
    activeActivity,
    selectedSchedules,
    hourlyForDay,
    activeDailyForecast,
  ]);

  const loadAiSuggestion = React.useCallback(
    (force = false) => {
      if (!weatherData) return;

      const defaultScheduleWithLoc = {
        ...DEFAULT_NO_ACTIVITY_SCHEDULE,
        location: activeChild.location || weatherData?.locationName || currentCoords.name || 'London, UK',
      };
      const activitiesToPlan =
        activeSchedulesForDay.length > 0
          ? activeSchedulesForDay
          : [defaultScheduleWithLoc];

      setIsAiLoading(true);
      getClothingSuggestion({
        child: activeChild,
        activities: activitiesToPlan,
        weatherData,
        dateStr: targetDateStr,
        ageLabel: ageCalculation.formattedAge,
        forceRefresh: force,
      })
        .then((res) => {
          setAiPlan(res.plan);
          setIsAiCached(res.isCached);
          setAiTimestamp(res.timestamp);
          setIsAiLoading(false);
        })
        .catch((err) => {
          console.error('Failed to get AI clothing suggestion:', err);
          setIsAiLoading(false);
        });
    },
    [
      activeChild,
      activeSchedulesForDay,
      weatherData,
      ageCalculation.formattedAge,
      currentCoords.name,
      targetDateStr,
    ]
  );

  // Automatically fetch / retrieve cached suggestion when activities, profile, or wardrobe change
  useEffect(() => {
    loadAiSuggestion(false);
  }, [loadAiSuggestion]);

  const handleToggleUnit = () => {
    setTemperatureUnit((prev) => (prev === 'C' ? 'F' : 'C'));
  };

  const handleToggleFrame = () => {
    setIsPhoneFrame((prev) => !prev);
  };

  const handleRefreshWeather = () => {
    loadWeather(currentCoords.lat, currentCoords.lon, currentCoords.name);
  };

  return (
    <AndroidFrame isPhoneFrame={isPhoneFrame}>
      <div className="flex flex-col min-h-full bg-slate-50 text-slate-800 pb-20">
        {/* Top App Bar Header */}
        <Header
          locationName={weatherData?.locationName || currentCoords.name || 'Current Area'}
          activeChild={activeChild}
          ageCalculation={ageCalculation}
          temperatureUnit={temperatureUnit}
          isPhoneFrame={isPhoneFrame}
          isLoadingWeather={isLoadingWeather}
          onOpenLocationSearch={() => setIsLocationModalOpen(true)}
          onOpenChildModal={() => setIsChildModalOpen(true)}
          onToggleUnit={handleToggleUnit}
          onToggleFrame={handleToggleFrame}
          onRefreshWeather={handleRefreshWeather}
          isAtActivityLocation={isAtActivityLocation}
          onRestoreDefault={handleRestoreDefault}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 max-w-2xl mx-auto w-full space-y-5">
          {/* Weather error banner if any */}
          {weatherError && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{weatherError}</span>
              </div>
              <button
                onClick={handleRefreshWeather}
                className="font-bold underline text-amber-900 ml-2"
              >
                Retry
              </button>
            </div>
          )}

          {/* TAB 1: DRESS CHILD (PRIMARY TAB) */}
          {activeTab === 'outfit' && (
            <div className="space-y-4">
              {/* Day Selector Segmented Control: Today vs Tomorrow */}
              <div className="bg-slate-200/80 p-1 rounded-2xl flex items-center gap-1 shadow-2xs border border-slate-200">
                <button
                  type="button"
                  onClick={() => handleSelectDay('today')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 select-none ${
                    selectedDay === 'today'
                      ? 'bg-white text-indigo-950 shadow-xs border border-indigo-100'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Today</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                      selectedDay === 'today'
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {todayFormattedLabel}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectDay('tomorrow')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 select-none ${
                    selectedDay === 'tomorrow'
                      ? 'bg-white text-indigo-950 shadow-xs border border-indigo-100'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Tomorrow</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                      selectedDay === 'tomorrow'
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {tomorrowFormattedLabel}
                  </span>
                </button>
              </div>

              {/* Weather Hero Card for Selected Day */}
              {weatherData && (
                <WeatherSummaryCard
                  current={activeWeatherSummary}
                  todayForecast={activeDailyForecast}
                  hourly={hourlyForDay}
                  locationName={weatherData.locationName}
                  temperatureUnit={temperatureUnit}
                  onLocationClick={() => setIsLocationModalOpen(true)}
                  dayLabel={selectedDay === 'today' ? "Today's" : "Tomorrow's"}
                  isToday={selectedDay === 'today'}
                />
              )}

              {/* Active Plan / Schedule for Selected Day */}
              {activeSchedulesForDay.length > 0 ? (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-50/90 border border-indigo-200 text-indigo-950 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">
                        {selectedSchedules.length === 1
                          ? selectedSchedules[0].locationType === 'beach'
                            ? '🏖️'
                            : selectedSchedules[0].locationType === 'park'
                            ? '🌲'
                            : selectedSchedules[0].locationType === 'daycare'
                            ? '🎒'
                            : '🚗'
                          : '🗓️'}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm truncate">
                            {selectedSchedules.length === 1
                              ? selectedSchedules[0].title
                              : `${selectedSchedules.length} Routines Combined`}
                          </span>
                          <span className="text-[10px] font-mono font-bold bg-white text-indigo-800 px-1.5 py-0.5 rounded-md border border-indigo-100 shrink-0 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-indigo-600" />
                            {selectedSchedules.length === 1
                              ? `${selectedSchedules[0].startTime} – ${selectedSchedules[0].endTime}`
                              : (combinedScheduleWindow.windowsLabel || `${combinedScheduleWindow.startTime} – ${combinedScheduleWindow.endTime}`)}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-200/80 text-indigo-900 shrink-0">
                            {selectedSchedules.length === 1
                              ? 'Single Activity'
                              : 'Combined Plan'}
                          </span>
                          <span className="flex items-center gap-1 flex-wrap">
                            <MapPin className="w-3 h-3 text-indigo-600 shrink-0" />
                            {getOrderedUniqueLocations(
                              selectedSchedules,
                              activeChild.location?.trim() || weatherData?.locationName || currentCoords.name || 'Local Area'
                            ).map((loc, i) => {
                              const defaultLoc = (activeChild.location?.trim() || weatherData?.locationName || currentCoords.name || 'Local Area').trim();
                              const isNonDefault = loc.toLowerCase() !== defaultLoc.toLowerCase();
                              return isNonDefault ? (
                                <button
                                  key={i}
                                  onClick={() => handleJumpToActivityLocation(loc)}
                                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md border cursor-pointer bg-indigo-100 border-indigo-300 hover:bg-indigo-200 text-indigo-900 transition-colors"
                                  title={`Jump to weather for ${loc}`}
                                >
                                  {loc}
                                </button>
                              ) : (
                                <span key={i} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md border bg-white/80 border-indigo-200/70 text-indigo-800">
                                  {loc}
                                </span>
                              );
                            })}
                          </span>
                        </div>
                        {activeSchedulesForDay.length === 1 && (
                          <p className="text-[11px] text-indigo-700 whitespace-normal mt-0.5">
                            Layers and checklist tailored for this {selectedDay === 'today' ? "today's" : "tomorrow's"} activity
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('child')}
                      className="text-[11px] font-bold text-indigo-800 hover:text-indigo-950 bg-white hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-200 shrink-0 transition shadow-2xs"
                    >
                      Manage
                    </button>
                  </div>

                  {/* Multi-schedule switcher if more than 1 active for the day */}
                  {activeSchedulesForDay.length > 1 && (
                    <div className="pt-2.5 border-t border-indigo-200/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5 text-indigo-700" />
                          Planning for:
                        </span>
                      </div>

                      {/* Activities listed one after the other (vertical stacked list) */}
                      <div className="flex flex-col gap-2 pt-1">
                        {activeSchedulesForDay.map((s) => {
                          const isChecked = selectedScheduleIds.includes(s.id);
                          const locationIcon =
                            s.locationType === 'beach'
                              ? '🏖️'
                              : s.locationType === 'park'
                              ? '🌲'
                              : s.locationType === 'daycare'
                              ? '🎒'
                              : s.locationType === 'travel_excursion'
                              ? '🚗'
                              : '🗓️';

                          return (
                            <label
                              key={s.id}
                              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition select-none ${
                                isChecked
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                  : 'bg-white text-indigo-900 border-indigo-200 hover:bg-indigo-100/60'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleSchedule(s.id)}
                                  className="rounded text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer accent-indigo-500 shrink-0"
                                />
                                <span className="text-base shrink-0">{locationIcon}</span>
                                <div className="min-w-0">
                                  <span className="font-bold block truncate text-xs sm:text-sm">{s.title}</span>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span
                                      className={`text-[10px] capitalize block font-normal ${
                                        isChecked ? 'text-indigo-200' : 'text-indigo-600'
                                      }`}
                                    >
                                      {s.locationType.replace('_', ' ')}
                                    </span>
                                    <span
                                      className={`text-[10px] flex items-center gap-0.5 font-normal ${
                                        isChecked ? 'text-indigo-200' : 'text-indigo-500'
                                      }`}
                                    >
                                      <MapPin className="w-2.5 h-2.5" />
                                      {s.location || activeChild.location || 'Local Area'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                <span
                                  className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${
                                    isChecked
                                      ? 'bg-indigo-700/80 text-indigo-100'
                                      : 'bg-indigo-50 text-indigo-700'
                                  }`}
                                >
                                  {s.startTime}–{s.endTime}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* No activities scheduled for selected day */
                <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 shadow-2xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0">🗓️</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-slate-900">
                          No activities scheduled for {selectedDay === 'today' ? 'today' : 'tomorrow'}
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-white text-amber-900 px-1.5 py-0.5 rounded-md border border-amber-200 shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-700" />
                          08:00 – 20:00 (Default)
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 shrink-0">
                          Full Day Span
                        </span>
                        <span className="text-[10px] text-amber-900 font-semibold bg-white px-2 py-0.5 rounded-md border border-amber-200 shrink-0 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-700" />
                          {activeChild.location || weatherData?.locationName || currentCoords.name || 'London, UK'}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 whitespace-normal mt-0.5">
                        No activities are scheduled for {selectedDay === 'today' ? 'today' : 'tomorrow'}. Outfits and layers are suggested by default for 08:00 – 20:00 based on {selectedDay === 'today' ? "today's" : "tomorrow's"} weather.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('child')}
                    className="text-[11px] font-bold text-amber-900 hover:text-amber-950 bg-white hover:bg-amber-100/70 px-2.5 py-1.5 rounded-lg border border-amber-200 shrink-0 transition shadow-2xs whitespace-nowrap"
                  >
                    + Add Routine
                  </button>
                </div>
              )}

              {/* Hourly layer transition scroller */}
              {hourlyForDay && hourlyForDay.length > 0 && (
                <HourlyForecastSlider
                  hourly={hourlyForDay}
                  temperatureUnit={temperatureUnit}
                  dayLabel={selectedDay === 'today' ? 'Today' : 'Tomorrow'}
                  activities={activitiesForHourlySlider}
                />
              )}

              {/* Clothing Suggestion Visualizer populated from Suggestion Engine */}
              {isAiLoading && !recommendation ? (
                <div className="p-6 rounded-2xl bg-white border border-indigo-100 shadow-2xs flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center animate-spin">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Querying Suggestion Engine...
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Generating personalized outfit plan based on today's activities and weather.
                    </p>
                  </div>
                </div>
              ) : recommendation ? (
                <OutfitVisualizer
                  recommendation={recommendation}
                  ageCalculation={ageCalculation}
                  childName={activeChild.name}
                  temperatureUnit={temperatureUnit}
                  isAiCached={isAiCached}
                  aiTimestamp={aiTimestamp}
                  isLoading={isAiLoading}
                  onRefresh={() => loadAiSuggestion(true)}
                  onEditChild={() => setIsChildModalOpen(true)}
                  onOpenCatalog={() => setIsCatalogModalOpen(true)}
                />
              ) : null}

              {/* Quick Card: Pediatric Guide Teaser */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-sky-600 flex items-center justify-center shadow-2xs border border-sky-100 shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Pediatric Dressing Tips</h3>
                    <p className="text-[11px] text-slate-500">
                      TOG ratings, car seat coat rules, and checking baby's neck temperature
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsGuideModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-white hover:bg-sky-50 rounded-xl border border-sky-200 transition shadow-2xs shrink-0 cursor-pointer"
                >
                  View Guide
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: FORECAST & 7-DAY OUTLOOK */}
          {activeTab === 'forecast' && (
            <div className="space-y-5">
              {weatherData && (
                <WeatherSummaryCard
                  current={selectedDay === 'today' ? weatherData.current : activeWeatherSummary}
                  todayForecast={activeDailyForecast || weatherData.daily[0]}
                  hourly={hourlyForDay}
                  locationName={weatherData.locationName}
                  temperatureUnit={temperatureUnit}
                  onLocationClick={() => setIsLocationModalOpen(true)}
                  dayLabel={selectedDay === 'today' ? "Today's" : "Tomorrow's"}
                  isToday={selectedDay === 'today'}
                />
              )}

              {hourlyForDay && hourlyForDay.length > 0 && (
                <HourlyForecastSlider
                  hourly={hourlyForDay}
                  temperatureUnit={temperatureUnit}
                  dayLabel={selectedDay === 'today' ? 'Today' : 'Tomorrow'}
                  activities={activitiesForHourlySlider}
                />
              )}

              {weatherData?.daily && (
                <DailyForecastStrip
                  daily={weatherData.daily}
                  temperatureUnit={temperatureUnit}
                  schedules={activeChild.schedules}
                  onSelectDay={(day) => {
                    handleSelectDay(day);
                    setActiveTab('outfit');
                  }}
                />
              )}
            </div>
          )}

          {/* TAB 3: KID PROFILE (INFO, THERMOREGULATION & REPEATING SCHEDULES) */}
          {activeTab === 'child' && (
            <KidProfileTab
              child={activeChild}
              ageCalculation={ageCalculation}
              onUpdateChild={handleUpdateActiveChild}
              onSwitchSibling={() => setIsChildModalOpen(true)}
              onGoToOutfits={() => setActiveTab('outfit')}
            />
          )}

          {/* TAB 4: PEDIATRIC GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Pediatric Dressing Guidelines</h2>
                    <p className="text-xs text-slate-500">Essential rules for child thermal safety</p>
                  </div>
                </div>

                {/* Guide Cards */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <h3 className="font-bold text-xs text-slate-900">1. The "N+1" Layer Principle</h3>
                    <p className="text-xs text-slate-600">
                      Dress young babies in 1 more layer than you are comfortably wearing. If you need a light sweater, baby needs a onesie, sweater, plus a light blanket or pramsuit.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-1.5 text-rose-950">
                    <h3 className="font-bold text-xs text-rose-900">2. Car Seat Winter Safety</h3>
                    <p className="text-xs text-rose-900">
                      Never put puffy coats under car seat harnesses. Fluffy insulation compresses in an impact, creating several inches of harness slack. Use thin fleece + blanket over straps.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 space-y-1.5 text-indigo-950">
                    <h3 className="font-bold text-xs text-indigo-900">3. Sleep Bag TOG Ratings</h3>
                    <p className="text-xs text-indigo-900">
                      Use 2.5 TOG for standard 18-20°C (64-68°F) nurseries. Use 1.0 TOG for mild rooms (21-23°C), and 0.5 TOG for hot summer rooms (over 24°C / 75°F).
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1.5 text-emerald-950">
                    <h3 className="font-bold text-xs text-emerald-900">4. The Nape Temperature Test</h3>
                    <p className="text-xs text-emerald-900">
                      Hands and feet are often cool because babies' peripheral blood vessels constrict. Always feel the nape of the neck or chest to accurately gauge core temperature.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsGuideModalOpen(true)}
                  className="w-full py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition shadow-xs"
                >
                  Open Full Interactive Medical Reference
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Fixed Bottom Tab Navigation (Pattern 1) */}
        <BottomNavBar activeTab={activeTab} onChangeTab={setActiveTab} />

        {/* Modals */}
        <ChildProfileModal
          isOpen={isChildModalOpen}
          onClose={() => setIsChildModalOpen(false)}
          profiles={profiles}
          activeChildId={activeChildId}
          onSelectChild={(id) => setActiveChildId(id)}
          onSaveProfile={handleSaveProfile}
          onDeleteProfile={handleDeleteProfile}
        />

        <LocationSearchModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          onSelectCoordinates={handleSelectCoordinates}
          onUseCurrentLocation={handleUseCurrentLocation}
          isLoadingLocation={isLoadingLocation}
        />

        <PediatricGuideModal
          isOpen={isGuideModalOpen}
          onClose={() => setIsGuideModalOpen(false)}
        />

        <ClothingCatalogModal
          isOpen={isCatalogModalOpen}
          onClose={() => setIsCatalogModalOpen(false)}
          childName={activeChild.name}
          avatarColor={activeChild.avatarColor}
          initialAvailableIds={activeChild.availableClothingIds}
          onSaveAvailableIds={(updatedIds) => {
            handleUpdateActiveChild({ availableClothingIds: updatedIds });
          }}
        />
      </div>
    </AndroidFrame>
  );
}
