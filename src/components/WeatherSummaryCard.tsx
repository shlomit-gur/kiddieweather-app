import React, { useState, useRef, useEffect } from 'react';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets,
  Thermometer,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  X,
} from 'lucide-react';
import { CurrentWeather, DailyForecast, HourlyWeatherPoint } from '../types/weather';
import { getWeatherConditionInfo } from '../utils/weatherIcons';

type MetricType = 'rain' | 'wind' | 'uv' | 'temp';

interface WeatherSummaryCardProps {
  current: CurrentWeather;
  todayForecast?: DailyForecast;
  hourly?: HourlyWeatherPoint[];
  locationName: string;
  temperatureUnit: 'C' | 'F';
  onLocationClick: () => void;
  dayLabel?: string;
  isToday?: boolean;
}

export const WeatherSummaryCard: React.FC<WeatherSummaryCardProps> = ({
  current,
  todayForecast,
  hourly = [],
  locationName,
  temperatureUnit,
  onLocationClick,
  dayLabel,
  isToday = true,
}) => {
  const condition = getWeatherConditionInfo(current.weatherCode, current.isDay);
  const [activePlot, setActivePlot] = useState<MetricType | null>(null);

  // Temperature unit conversion
  const formatTemp = (celsius: number) => {
    if (temperatureUnit === 'F') {
      return `${Math.round((celsius * 9) / 5 + 32)}°`;
    }
    return `${celsius}°`;
  };

  const formatWind = (kmh: number) => {
    if (temperatureUnit === 'F') {
      return `${Math.round(kmh * 0.621371)} mph`;
    }
    return `${kmh} km/h`;
  };

  const renderWeatherIcon = (iconName: string, className: string) => {
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

  // Day's 24 hours (or available points)
  const dayHours = hourly.slice(0, 24);

  // Min & Max calculations across the day
  const rainProbabilities = dayHours.map((h) => h.precipitationProbability ?? 0);
  const minRain = rainProbabilities.length > 0 ? Math.min(...rainProbabilities) : 0;
  const maxRain =
    todayForecast?.precipitationProbabilityMax !== undefined
      ? todayForecast.precipitationProbabilityMax
      : rainProbabilities.length > 0
      ? Math.max(...rainProbabilities)
      : 0;

  const windSpeeds = dayHours.map((h) => h.windSpeed ?? 0);
  const minWind = windSpeeds.length > 0 ? Math.min(...windSpeeds) : current.windSpeed;
  const maxWind =
    todayForecast?.windSpeedMax !== undefined && todayForecast.windSpeedMax > 0
      ? todayForecast.windSpeedMax
      : windSpeeds.length > 0
      ? Math.max(...windSpeeds)
      : current.windSpeed;

  const uvValues = dayHours.map((h) => h.uvIndex ?? 0);
  const maxUv =
    todayForecast?.uvIndexMax !== undefined
      ? Math.round(todayForecast.uvIndexMax)
      : uvValues.length > 0
      ? Math.round(Math.max(...uvValues))
      : Math.round(current.uvIndex ?? 0);

  // Current clock hour for timeline indicator
  const currentClockHour = new Date().getHours();

  // Scroll container and 'Now' bar refs for centering
  const plotScrollRef = useRef<HTMLDivElement>(null);
  const nowElementRef = useRef<HTMLDivElement>(null);

  // Center 'now' element when activePlot opens
  useEffect(() => {
    if (!activePlot) return;

    // Use requestAnimationFrame so layout is fully computed before scrolling
    const timer = setTimeout(() => {
      const scrollEl = plotScrollRef.current;
      const nowEl = nowElementRef.current;

      if (scrollEl && nowEl) {
        const scrollLeft =
          nowEl.offsetLeft + nowEl.offsetWidth / 2 - scrollEl.clientWidth / 2;
        scrollEl.scrollTo({
          left: Math.max(0, scrollLeft),
          behavior: 'smooth',
        });
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [activePlot]);

  const handleTogglePlot = (metric: MetricType) => {
    setActivePlot((prev) => (prev === metric ? null : metric));
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-br ${condition.bgGradient} border border-slate-200/90 shadow-xs transition-all`}>
      {/* Background ambient blur circle */}
      <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/40 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-4">
        {/* Top: Condition & Location */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                {dayLabel ? `${dayLabel} Weather Outlook` : "Today's Weather Outlook"}
              </span>
              {isToday && (
                <span className="text-[9.5px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-indigo-600 text-white tracking-wider">
                  Live
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
              {condition.label}
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tap any metric below to view its 24-hour timeline plot
            </p>
          </div>

          <div className="p-3 bg-white/80 rounded-2xl shadow-2xs border border-white/60 shrink-0">
            {renderWeatherIcon(condition.iconName, `w-9 h-9 sm:w-11 sm:h-11 ${condition.colorClass}`)}
          </div>
        </div>

        {/* Middle: Big Current Temperature & Daytime Range */}
        <div
          onClick={() => handleTogglePlot('temp')}
          className="group cursor-pointer p-2.5 -mx-2.5 rounded-2xl hover:bg-white/40 transition flex items-center justify-between"
          title="Click to view 24-hour temperature curve"
        >
          <div className="flex items-baseline gap-3.5 flex-wrap">
            <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 font-mono tabular-nums leading-none">
              {formatTemp(current.temperature)}
            </span>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-slate-400" />
                <span>Feels like {formatTemp(current.apparentTemperature)}</span>
              </div>
              {todayForecast && (
                <div className="text-xs text-slate-600 flex items-center gap-2 font-mono tabular-nums bg-white/70 px-2 py-0.5 rounded-md border border-slate-200/60">
                  <span className="flex items-center text-rose-600 font-bold" title="Forecast High">
                    <ArrowUp className="w-3 h-3" /> {formatTemp(todayForecast.tempMax)}
                  </span>
                  <span className="text-slate-300">/</span>
                  <span className="flex items-center text-sky-600 font-bold" title="Forecast Low">
                    <ArrowDown className="w-3 h-3" /> {formatTemp(todayForecast.tempMin)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Metrics Pill Bar: Rain, Wind, UV - all clickable with matching current + arrow min/max style */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/60">
          {/* 1. Rain Risk */}
          <button
            type="button"
            onClick={() => handleTogglePlot('rain')}
            className={`rounded-2xl p-2.5 border text-left transition cursor-pointer flex flex-col justify-between group ${
              activePlot === 'rain'
                ? 'bg-blue-50/95 border-blue-300 ring-2 ring-blue-300/80 shadow-xs'
                : 'bg-white/75 hover:bg-white border-white/80 hover:border-blue-200'
            }`}
            title="Click to view full rain probability plot throughout the day"
          >
            <span className="text-[10.5px] font-bold text-slate-600 flex items-center gap-1">
              <Droplets className="w-3 h-3 text-blue-500" /> Rain Risk
            </span>

            <div className="mt-1">
              <div className="text-base sm:text-lg font-extrabold text-slate-900 font-mono tabular-nums leading-tight">
                {rainProbabilities.length > 0 ? `${rainProbabilities[Math.min(currentClockHour, rainProbabilities.length - 1)]}%` : `${current.precipitation > 0 ? 80 : 0}%`}
              </div>
              <div className="text-[10px] text-slate-600 font-mono tabular-nums flex items-center gap-1 mt-0.5">
                <span className="flex items-center text-rose-600 font-semibold" title="Max Rain Risk">
                  <ArrowUp className="w-2.5 h-2.5" />
                  {maxRain}%
                </span>
                <span className="text-slate-300">/</span>
                <span className="flex items-center text-sky-600 font-semibold" title="Min Rain Risk">
                  <ArrowDown className="w-2.5 h-2.5" />
                  {minRain}%
                </span>
              </div>
            </div>
          </button>

          {/* 2. Wind */}
          <button
            type="button"
            onClick={() => handleTogglePlot('wind')}
            className={`rounded-2xl p-2.5 border text-left transition cursor-pointer flex flex-col justify-between group ${
              activePlot === 'wind'
                ? 'bg-teal-50/95 border-teal-300 ring-2 ring-teal-300/80 shadow-xs'
                : 'bg-white/75 hover:bg-white border-white/80 hover:border-teal-200'
            }`}
            title="Click to view full wind speed plot throughout the day"
          >
            <span className="text-[10.5px] font-bold text-slate-600 flex items-center gap-1">
              <Wind className="w-3 h-3 text-teal-600" /> Wind
            </span>

            <div className="mt-1">
              <div className="text-base sm:text-lg font-extrabold text-slate-900 font-mono tabular-nums leading-tight">
                {formatWind(windSpeeds.length > 0 ? windSpeeds[Math.min(currentClockHour, windSpeeds.length - 1)] : current.windSpeed)}
              </div>
              <div className="text-[10px] text-slate-600 font-mono tabular-nums flex items-center gap-1 mt-0.5">
                <span className="flex items-center text-rose-600 font-semibold" title="Max Wind Speed">
                  <ArrowUp className="w-2.5 h-2.5" />
                  {temperatureUnit === 'F' ? Math.round(maxWind * 0.621371) : maxWind}
                </span>
                <span className="text-slate-300">/</span>
                <span className="flex items-center text-sky-600 font-semibold" title="Min Wind Speed">
                  <ArrowDown className="w-2.5 h-2.5" />
                  {temperatureUnit === 'F' ? Math.round(minWind * 0.621371) : minWind}
                </span>
              </div>
            </div>
          </button>

          {/* 3. UV Index */}
          <button
            type="button"
            onClick={() => handleTogglePlot('uv')}
            className={`rounded-2xl p-2.5 border text-left transition cursor-pointer flex flex-col justify-between group ${
              activePlot === 'uv'
                ? 'bg-amber-50/95 border-amber-300 ring-2 ring-amber-300/80 shadow-xs'
                : 'bg-white/75 hover:bg-white border-white/80 hover:border-amber-200'
            }`}
            title="Click to view full UV curve and peak times throughout the day"
          >
            <span className="text-[10.5px] font-bold text-slate-600 flex items-center gap-1">
              <Sun className="w-3 h-3 text-amber-500" /> UV Index
            </span>

            <div className="mt-1">
              <div className="text-base sm:text-lg font-extrabold text-slate-900 font-mono tabular-nums leading-tight flex items-center gap-1">
                <span>{Math.round(current.uvIndex ?? 0)}</span>
                <span
                  className={`text-[9.5px] font-bold px-1 py-0.2 rounded ${
                    maxUv <= 2
                      ? 'text-emerald-700 bg-emerald-100/70'
                      : maxUv <= 5
                      ? 'text-amber-700 bg-amber-100/70'
                      : maxUv <= 7
                      ? 'text-orange-700 bg-orange-100/70'
                      : 'text-rose-700 bg-rose-100/70'
                  }`}
                >
                  {maxUv <= 2 ? 'Low' : maxUv <= 5 ? 'Mod' : maxUv <= 7 ? 'High' : 'V.High'}
                </span>
              </div>
              <div className="text-[10px] text-slate-600 font-mono tabular-nums flex items-center gap-1 mt-0.5">
                <span className="flex items-center text-rose-600 font-semibold" title="Max UV Index">
                  <ArrowUp className="w-2.5 h-2.5" />
                  {maxUv}
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* EXPANDABLE INTERACTIVE 24-HOUR PLOT */}
        {activePlot && dayHours.length > 0 && (
          <div className="mt-2 p-3 sm:p-4 rounded-2xl bg-white/95 border border-slate-200 shadow-sm transition-all space-y-3 relative">
            <div className="flex items-center justify-between flex-wrap gap-2 pr-7">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  {activePlot === 'rain' && <Droplets className="w-3.5 h-3.5 text-blue-500" />}
                  {activePlot === 'wind' && <Wind className="w-3.5 h-3.5 text-teal-600" />}
                  {activePlot === 'uv' && <Sun className="w-3.5 h-3.5 text-amber-500" />}
                  {activePlot === 'temp' && <Thermometer className="w-3.5 h-3.5 text-rose-500" />}
                  <span>
                    {activePlot === 'rain'
                      ? '24-Hour Rain Probability Plot (%)'
                      : activePlot === 'wind'
                      ? `24-Hour Wind Speed Plot (${temperatureUnit === 'F' ? 'mph' : 'km/h'})`
                      : activePlot === 'uv'
                      ? '24-Hour UV Radiation Curve'
                      : `24-Hour Temperature Profile (${temperatureUnit === 'F' ? '°F' : '°C'})`}
                  </span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {dayLabel || 'Today'}
                </span>
              </div>

              {isToday && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                  <span>Now indicator on plot</span>
                </div>
              )}
            </div>

            {/* Small 'x' close button in top right corner */}
            <button
              type="button"
              onClick={() => setActivePlot(null)}
              className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Close plot"
              aria-label="Close plot"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Plot Visualizer */}
            <div ref={plotScrollRef} className="overflow-x-auto pb-1 pt-2 no-scrollbar">
              <div className="flex items-end gap-1.5 sm:gap-2 min-w-[620px] h-32 px-2 border-b border-slate-200 relative">
                {dayHours.map((p, idx) => {
                  const match = p.time.match(/T(\d{1,2})/);
                  const hourNum = match ? parseInt(match[1], 10) : new Date(p.time).getHours();
                  const isCurrentNow = isToday && hourNum === currentClockHour;

                  let val = 0;
                  let maxVal = 100;
                  let displayVal = '';
                  let barColor = 'bg-blue-400';

                  if (activePlot === 'rain') {
                    val = p.precipitationProbability ?? 0;
                    maxVal = 100;
                    displayVal = `${val}%`;
                    barColor = val > 40 ? 'bg-blue-600' : val > 15 ? 'bg-blue-400' : 'bg-blue-200';
                  } else if (activePlot === 'wind') {
                    val = p.windSpeed ?? 0;
                    maxVal = Math.max(30, maxWind * 1.2);
                    displayVal = `${Math.round(val)}`;
                    barColor = val >= 30 ? 'bg-rose-500' : val >= 20 ? 'bg-amber-500' : 'bg-teal-400';
                  } else if (activePlot === 'uv') {
                    val = p.uvIndex ?? 0;
                    maxVal = Math.max(8, maxUv + 1);
                    displayVal = `${Math.round(val)}`;
                    barColor =
                      val >= 8
                        ? 'bg-rose-500'
                        : val >= 6
                        ? 'bg-orange-500'
                        : val >= 3
                        ? 'bg-amber-400'
                        : val > 0
                        ? 'bg-emerald-400'
                        : 'bg-slate-200';
                  } else if (activePlot === 'temp') {
                    val = p.temperature;
                    const temps = dayHours.map((h) => h.temperature);
                    const minT = Math.min(...temps) - 2;
                    const maxT = Math.max(...temps) + 2;
                    maxVal = Math.max(1, maxT - minT);
                    const normalized = val - minT;
                    val = Math.max(0.5, normalized);
                    displayVal = formatTemp(p.temperature);
                    barColor = 'bg-indigo-400';
                  }

                  const heightPercent = Math.max(8, Math.min(100, Math.round((val / maxVal) * 90)));

                  return (
                    <div
                      key={p.time}
                      ref={isCurrentNow ? nowElementRef : undefined}
                      className={`flex-1 flex flex-col items-center justify-end h-full relative group ${
                        isCurrentNow ? 'z-10' : ''
                      }`}
                    >
                      {/* NOW TIMELINE INDICATOR LINE */}
                      {isCurrentNow && (
                        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                          <span className="text-[8px] font-black uppercase tracking-wider text-white bg-indigo-600 px-1 py-0.2 rounded-full shadow-xs -top-2 relative z-20">
                            Now
                          </span>
                          <div className="w-0.5 flex-1 bg-indigo-500 border-l border-dashed border-indigo-600 opacity-80" />
                        </div>
                      )}

                      {/* Bar value label */}
                      <span
                        className={`text-[9px] font-mono font-bold mb-1 ${
                          isCurrentNow ? 'text-indigo-700 font-extrabold' : 'text-slate-600'
                        }`}
                      >
                        {displayVal}
                      </span>

                      {/* Bar element */}
                      <div
                        className={`w-full max-w-[18px] rounded-t-md transition-all ${barColor} ${
                          isCurrentNow ? 'ring-2 ring-indigo-500 ring-offset-1 shadow-sm' : 'opacity-85 hover:opacity-100'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />

                      {/* Hour label below baseline */}
                      <span
                        className={`text-[8.5px] font-semibold mt-1.5 whitespace-nowrap ${
                          isCurrentNow ? 'text-indigo-700 font-extrabold' : 'text-slate-400'
                        }`}
                      >
                        {p.hourLabel.replace(' ', '')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Plot Caption / Key */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 flex-wrap gap-2 pt-1">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>
                  {activePlot === 'rain'
                    ? 'Precipitation risk peaks at ' + maxRain + '%'
                    : activePlot === 'wind'
                    ? `Peak wind gusts reached up to ${formatWind(maxWind)}`
                    : activePlot === 'uv'
                    ? `Peak solar UV reaches ${maxUv} (sun protection recommended from UV 3+)`
                    : 'Diurnal temperature variation throughout the day'}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
