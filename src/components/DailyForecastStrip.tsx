import React from 'react';
import { DailyForecast } from '../types/weather';
import { ChildScheduleItem } from '../types/child';
import { getWeatherConditionInfo } from '../utils/weatherIcons';
import { isScheduleActiveOnDate, parseLocalDate } from '../utils/scheduleUtils';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Droplets,
  Wind,
  School,
  TreePine,
  Waves,
  Car,
  Home,
} from 'lucide-react';

interface DailyForecastStripProps {
  daily: DailyForecast[];
  temperatureUnit: 'C' | 'F';
  schedules?: ChildScheduleItem[];
  onSelectDay?: (day: 'today' | 'tomorrow') => void;
}

export const DailyForecastStrip: React.FC<DailyForecastStripProps> = ({
  daily,
  temperatureUnit,
  schedules = [],
  onSelectDay,
}) => {
  if (!daily || daily.length === 0) return null;

  const formatTemp = (celsius: number) => {
    if (temperatureUnit === 'F') {
      return `${Math.round((celsius * 9) / 5 + 32)}°`;
    }
    return `${celsius}°`;
  };

  const renderIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case 'Sun':
        return <Sun className={className} />;
      case 'CloudSun':
        return <CloudSun className={className} />;
      case 'Cloud':
        return <Cloud className={className} />;
      case 'CloudFog':
        return <CloudFog className={className} />;
      case 'CloudDrizzle':
        return <CloudDrizzle className={className} />;
      case 'CloudRain':
        return <CloudRain className={className} />;
      case 'CloudSnow':
        return <CloudSnow className={className} />;
      case 'CloudLightning':
        return <CloudLightning className={className} />;
      default:
        return <Sun className={className} />;
    }
  };

  // Pediatric UV classification & styling
  const getUvBadge = (uv: number) => {
    const val = Math.round(uv || 0);
    if (val <= 0) {
      return {
        label: `${val}`,
        category: 'Minimal',
        colorClass: 'text-slate-400 bg-slate-100 border-slate-200/70',
        barColor: 'bg-slate-300',
        barCount: 1,
      };
    }
    if (val <= 2) {
      return {
        label: `${val}`,
        category: 'Low',
        colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        barColor: 'bg-emerald-500',
        barCount: 2,
      };
    }
    if (val <= 5) {
      return {
        label: `${val}`,
        category: 'Moderate',
        colorClass: 'text-amber-700 bg-amber-50 border-amber-200',
        barColor: 'bg-amber-500',
        barCount: 3,
      };
    }
    if (val <= 7) {
      return {
        label: `${val}`,
        category: 'High',
        colorClass: 'text-orange-700 bg-orange-50 border-orange-200',
        barColor: 'bg-orange-500',
        barCount: 4,
      };
    }
    return {
      label: `${val}`,
      category: 'Very High',
      colorClass: 'text-rose-700 bg-rose-50 border-rose-200',
      barColor: 'bg-rose-500',
      barCount: 5,
    };
  };

  // Pediatric wind evaluation (km/h)
  const getWindBadge = (speed: number, gusts?: number) => {
    const rounded = Math.round(speed || 0);
    const gustRounded = gusts ? Math.round(gusts) : 0;
    if (rounded >= 35 || gustRounded >= 50) {
      return {
        text: `${rounded} km/h`,
        category: 'Strong',
        colorClass: 'text-rose-700 bg-rose-50 border-rose-200',
      };
    }
    if (rounded >= 22 || gustRounded >= 35) {
      return {
        text: `${rounded} km/h`,
        category: 'Breezy',
        colorClass: 'text-sky-700 bg-sky-50 border-sky-200',
      };
    }
    return {
      text: `${rounded} km/h`,
      category: 'Gentle',
      colorClass: 'text-slate-600 bg-slate-50 border-slate-200/80',
    };
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          7-Day Wardrobe & Schedule Outlook
        </h3>
        <span className="text-[11px] text-slate-400">Daily forecast, UV, wind & routines</span>
      </div>

      <div className="divide-y divide-slate-100">
        {daily.map((item, idx) => {
          const condition = getWeatherConditionInfo(item.weatherCode);
          // Parse target date for schedule lookup
          const targetDate = parseLocalDate(item.date);
          const activeSchedules = schedules.filter((s) => isScheduleActiveOnDate(s, targetDate));
          const uvBadge = getUvBadge(item.uvIndexMax);
          const windBadge = getWindBadge(item.windSpeedMax || 0, item.windGustsMax);

          return (
            <div key={item.date} className="py-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs gap-1 sm:gap-2 flex-wrap sm:flex-nowrap">
                {/* 1. Day label */}
                <div className="w-24 sm:w-28 font-bold text-slate-800 flex items-center gap-1.5 shrink-0">
                  <span>{idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : item.dayLabel}</span>
                  {(idx === 0 || idx === 1) && onSelectDay && (
                    <button
                      onClick={() => onSelectDay(idx === 0 ? 'today' : 'tomorrow')}
                      className="text-[9px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200 transition"
                      title={`Dress child for ${idx === 0 ? 'Today' : 'Tomorrow'}`}
                    >
                      Plan
                    </button>
                  )}
                </div>

                {/* 2. Weather icon & condition */}
                <div className="flex items-center gap-1.5 flex-1 min-w-[120px] justify-start">
                  {renderIcon(condition.iconName, `w-4 h-4 shrink-0 ${condition.colorClass}`)}
                  <span className="hidden md:inline text-slate-600 font-medium truncate max-w-[110px]">
                    {condition.label}
                  </span>
                  {item.precipitationProbabilityMax > 20 && (
                    <span className="text-[10px] font-semibold text-blue-600 flex items-center gap-0.5 font-mono shrink-0">
                      <Droplets className="w-2.5 h-2.5" />
                      {item.precipitationProbabilityMax}%
                    </span>
                  )}
                </div>

                {/* 3. Max UV (with mini-bar visual) */}
                <div
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold font-mono shrink-0 ${uvBadge.colorClass}`}
                  title={`Max UV Index: ${Math.round(item.uvIndexMax || 0)} (${uvBadge.category})`}
                >
                  <Sun className="w-2.5 h-2.5 shrink-0 text-amber-600" />
                  <span>UV {Math.round(item.uvIndexMax || 0)}</span>
                  {/* Visual 5-segment mini bar chart */}
                  <div className="flex items-end gap-0.5 h-2.5 ml-0.5">
                    {[1, 2, 3, 4, 5].map((barIdx) => (
                      <span
                        key={barIdx}
                        className={`w-0.5 rounded-full transition-all ${
                          barIdx <= uvBadge.barCount ? uvBadge.barColor : 'bg-slate-200'
                        }`}
                        style={{ height: `${barIdx * 20}%` }}
                      />
                    ))}
                  </div>
                </div>

                {/* 4. Wind speed max */}
                <div
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium font-mono shrink-0 ${windBadge.colorClass}`}
                  title={`Max Wind: ${windBadge.text}${
                    item.windGustsMax ? ` (Gusts up to ${Math.round(item.windGustsMax)} km/h)` : ''
                  }`}
                >
                  <Wind className="w-2.5 h-2.5 shrink-0 text-slate-500" />
                  <span>{windBadge.text}</span>
                </div>

                {/* 5. High / Low temps */}
                <div className="flex items-center gap-2 font-mono tabular-nums font-bold shrink-0 ml-auto sm:ml-0">
                  <span className="text-rose-600 font-semibold">{formatTemp(item.tempMax)}</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-sky-600 font-semibold">{formatTemp(item.tempMin)}</span>
                </div>
              </div>

              {/* Planned activities badge on this date */}
              {activeSchedules.length > 0 && (
                <div className="flex items-center gap-1.5 pl-2 sm:pl-28 flex-wrap pt-0.5">
                  {activeSchedules.map((s) => (
                    <span
                      key={s.id}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border ${
                        s.frequency === 'one_time'
                          ? 'bg-amber-50 text-amber-900 border-amber-200'
                          : s.frequency === 'biweekly'
                          ? 'bg-purple-50 text-purple-900 border-purple-200'
                          : 'bg-sky-50 text-sky-900 border-sky-200'
                      }`}
                    >
                      {s.locationType === 'daycare' ? (
                        <School className="w-2.5 h-2.5" />
                      ) : s.locationType === 'park' ? (
                        <TreePine className="w-2.5 h-2.5" />
                      ) : s.locationType === 'beach' ? (
                        <Waves className="w-2.5 h-2.5" />
                      ) : s.locationType === 'home' ? (
                        <Home className="w-2.5 h-2.5" />
                      ) : (
                        <Car className="w-2.5 h-2.5" />
                      )}
                      <span>{s.title}</span>
                      <span className="text-[9px] opacity-75 font-normal">
                        ({s.startTime}–{s.endTime})
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
