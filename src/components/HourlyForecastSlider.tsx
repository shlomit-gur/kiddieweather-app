import React from 'react';
import { HourlyWeatherPoint } from '../types/weather';
import { getWeatherConditionInfo } from '../utils/weatherIcons';
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
} from 'lucide-react';

export interface ActivityTimeSlot {
  id?: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  locationType?: string;
}

interface HourlyForecastSliderProps {
  hourly: HourlyWeatherPoint[];
  temperatureUnit: 'C' | 'F';
  dayLabel?: string;
  activities?: ActivityTimeSlot[] | null;
}

/**
 * Identify activities taking place during a specific hour interval [hourNum:00 to (hourNum+1):00]
 */
export function getHourActivities(
  hourNum: number,
  activities?: ActivityTimeSlot[] | null
): ActivityTimeSlot[] {
  if (!activities || activities.length === 0) return [];

  const hourStartMinutes = hourNum * 60;
  const hourEndMinutes = (hourNum + 1) * 60;

  return activities.filter((act) => {
    if (!act.startTime || !act.endTime) return false;
    if (act.id === 'default_no_activity') return false;

    const [sh, sm] = act.startTime.split(':').map(Number);
    const [eh, em] = act.endTime.split(':').map(Number);
    if (isNaN(sh)) return false;

    const actStartMinutes = sh * 60 + (sm || 0);
    let actEndMinutes = (isNaN(eh) ? sh + 2 : eh) * 60 + (em || 0);

    // Guard for end times before or equal to start time
    if (actEndMinutes <= actStartMinutes) {
      actEndMinutes = Math.min(24 * 60, actStartMinutes + 120);
    }

    // Overlap condition between [hourStartMinutes, hourEndMinutes] and [actStartMinutes, actEndMinutes]
    return hourStartMinutes < actEndMinutes && hourEndMinutes > actStartMinutes;
  });
}

export const HourlyForecastSlider: React.FC<HourlyForecastSliderProps> = ({
  hourly,
  temperatureUnit,
  dayLabel,
  activities,
}) => {
  if (!hourly || hourly.length === 0) return null;

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

  // Pediatric-accurate layer note helper
  const getHourlyLayerBadge = (tempC: number, rainProb: number) => {
    if (rainProb >= 50) return { label: 'Rain Gear', color: 'text-blue-600 bg-blue-50' };
    if (tempC < 10) return { label: 'Warm Coat', color: 'text-indigo-600 bg-indigo-50' };
    if (tempC < 16) return { label: 'Fleece / Jacket', color: 'text-sky-700 bg-sky-50' };
    if (tempC < 22) return { label: 'Long Sleeves', color: 'text-emerald-700 bg-emerald-50' };
    return { label: 'Single Layer', color: 'text-amber-700 bg-amber-50' };
  };

  // UV index styling and category
  const getUvInfo = (uvIndex: number) => {
    const rounded = Math.round(uvIndex ?? 0);
    if (rounded <= 0) {
      return {
        label: `${rounded}`,
        category: 'Minimal',
        colorClass: 'text-slate-400 bg-slate-100/90 border-slate-200/70',
      };
    }
    if (rounded <= 2) {
      return {
        label: `${rounded}`,
        category: 'Low',
        colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      };
    }
    if (rounded <= 5) {
      return {
        label: `${rounded}`,
        category: 'Moderate',
        colorClass: 'text-amber-700 bg-amber-50 border-amber-200',
      };
    }
    if (rounded <= 7) {
      return {
        label: `${rounded}`,
        category: 'High',
        colorClass: 'text-orange-700 bg-orange-50 border-orange-200',
      };
    }
    return {
      label: `${rounded}`,
      category: 'Very High',
      colorClass: 'text-rose-700 bg-rose-50 border-rose-200',
    };
  };

  const maxUv = Math.max(...hourly.map((p) => p.uvIndex ?? 0));
  const peakPoint = hourly.find((p) => Math.round(p.uvIndex ?? 0) === Math.round(maxUv));
  const currentHourNum = new Date().getHours();

  // Check if any of the displayed 24 hours has an activity
  const hasAnyActivities = hourly.slice(0, 24).some((p) => {
    const match = p.time.match(/T(\d{1,2})/);
    const h = match ? parseInt(match[1], 10) : new Date(p.time).getHours();
    return getHourActivities(h, activities).length > 0;
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {dayLabel ? `${dayLabel} Forecast & UV` : '24-Hour Forecast & UV'}
          </label>
          {maxUv > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
              <Sun className="w-2.5 h-2.5 text-amber-600" />
              Peak UV: {Math.round(maxUv)}
              {peakPoint ? ` @ ${peakPoint.hourLabel}` : ''}
            </span>
          )}
        </div>
        {hasAnyActivities && (
          <div className="flex items-center gap-1.5 text-[11px] text-sky-700 font-semibold bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200/80 shrink-0">
            <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
            <span>Activity hours</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
        {hourly.slice(0, 24).map((point) => {
          const condition = getWeatherConditionInfo(point.weatherCode);
          const badge = getHourlyLayerBadge(point.temperature, point.precipitationProbability);
          const uvInfo = getUvInfo(point.uvIndex);

          // Check if this point is the current clock hour
          const match = point.time.match(/T(\d{1,2})/);
          const hourNum = match ? parseInt(match[1], 10) : new Date(point.time).getHours();
          const isCurrentNow = (!dayLabel || dayLabel === 'Today') && hourNum === currentHourNum;

          // Check if any activity takes place during this hour
          const hourActivities = getHourActivities(hourNum, activities);
          const hasActivity = hourActivities.length > 0;
          const activityLabel = hourActivities.map((a) => a.title).join(' / ');
          const activityTooltip = hourActivities
            .map((a) => `${a.title} (${a.startTime}–${a.endTime})`)
            .join(', ');

          // Card color: slightly different shade of blue for activity hours
          let cardStyleClasses = 'bg-white text-slate-800 border-slate-200/90';
          if (hasActivity && isCurrentNow) {
            cardStyleClasses = 'bg-sky-100/90 text-slate-900 border-sky-400 ring-2 ring-sky-300 shadow-2xs';
          } else if (hasActivity) {
            cardStyleClasses = 'bg-sky-50/90 text-slate-900 border-sky-300/90 shadow-2xs';
          } else if (isCurrentNow) {
            cardStyleClasses = 'bg-indigo-50/70 text-slate-800 border-indigo-200/90 ring-1 ring-indigo-300';
          }

          return (
            <div
              key={point.time}
              className={`p-2.5 rounded-2xl flex flex-col items-center justify-between min-w-[84px] max-w-[96px] border text-center shrink-0 relative transition-all ${cardStyleClasses}`}
            >
              {/* NOW indicator */}
              {isCurrentNow && (
                <span
                  className={`absolute -top-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full text-[8px] font-extrabold uppercase tracking-wider shadow-2xs ${
                    hasActivity ? 'bg-sky-700 text-white' : 'bg-indigo-600 text-white'
                  }`}
                >
                  Now
                </span>
              )}

              {/* Hour time */}
              <span className="text-xs font-bold text-slate-500">
                {point.hourLabel}
              </span>

              {/* Weather icon */}
              <div className="my-1">
                {renderIcon(
                  condition.iconName,
                  `w-5 h-5 ${condition.colorClass}`
                )}
              </div>

              {/* Temperature */}
              <span className="text-base font-extrabold font-mono tabular-nums leading-none mb-1">
                {formatTemp(point.temperature)}
              </span>

              {/* UV index pill */}
              <div
                className={`flex items-center justify-center gap-1 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md border mb-1 ${uvInfo.colorClass}`}
                title={`UV Index: ${Math.round(point.uvIndex ?? 0)} (${uvInfo.category})`}
              >
                <Sun className="w-2.5 h-2.5 shrink-0" />
                <span>UV {Math.round(point.uvIndex ?? 0)}</span>
              </div>

              {/* Rain prob if noteworthy */}
              {point.precipitationProbability > 15 ? (
                <div className="flex items-center justify-center gap-0.5 text-[10px] font-semibold text-blue-600 mb-1">
                  <Droplets className="w-2.5 h-2.5" />
                  <span>{point.precipitationProbability}%</span>
                </div>
              ) : (
                <div className="h-4" />
              )}

              {/* Layer tag */}
              <span
                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md truncate max-w-full ${badge.color}`}
              >
                {badge.label}
              </span>

              {/* Bottom: Activity name */}
              {hasActivity ? (
                <div
                  className="mt-2 pt-1 border-t border-sky-200/90 w-full text-center"
                  title={`Activity: ${activityTooltip}`}
                >
                  <span className="text-[9.5px] font-bold text-sky-800 truncate block px-0.5 leading-tight tracking-tight">
                    {activityLabel}
                  </span>
                </div>
              ) : (
                <div className="mt-2 pt-1 border-t border-transparent w-full text-center select-none opacity-0">
                  <span className="text-[9.5px] block leading-tight tracking-tight">-</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
