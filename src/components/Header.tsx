import React from 'react';
import { MapPin, RefreshCw, Smartphone, Monitor, ChevronDown, User, Sparkles } from 'lucide-react';
import { ChildProfile, ChildAgeCalculation } from '../types/child';

interface HeaderProps {
  locationName: string;
  activeChild: ChildProfile;
  ageCalculation: ChildAgeCalculation;
  temperatureUnit: 'C' | 'F';
  isPhoneFrame: boolean;
  isLoadingWeather: boolean;
  onOpenLocationSearch: () => void;
  onOpenChildModal: () => void;
  onToggleUnit: () => void;
  onToggleFrame: () => void;
  onRefreshWeather: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  locationName,
  activeChild,
  ageCalculation,
  temperatureUnit,
  isPhoneFrame,
  isLoadingWeather,
  onOpenLocationSearch,
  onOpenChildModal,
  onToggleUnit,
  onToggleFrame,
  onRefreshWeather,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5 transition-colors shadow-2xs" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 10px)' }}>
      <div className="max-w-2xl mx-auto space-y-2">
        {/* Tier 1: Child Profile on Left, Controls on Right */}
        <div className="flex items-center justify-between gap-3">
          {/* Child Identity Button */}
          <button
            onClick={onOpenChildModal}
            className="flex items-center gap-2.5 py-1 px-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors text-left group min-w-0 flex-1"
            title="Switch child profile or edit date of birth"
          >
            <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm border border-sky-200 group-hover:scale-105 transition-transform shrink-0">
              {activeChild.name ? activeChild.name[0].toUpperCase() : 'C'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900 truncate">
                  {activeChild.name || 'Child'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
              </div>
              <p className="text-[11px] text-slate-500 truncate font-medium">
                {ageCalculation.formattedAge} · {ageCalculation.categoryLabel}
              </p>
            </div>
          </button>

          {/* Controls: Unit, Refresh, Frame Preview */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Unit Toggle (°C / °F) */}
            <button
              onClick={onToggleUnit}
              className="px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors min-h-[32px] flex items-center"
              title="Toggle Celsius / Fahrenheit"
            >
              °{temperatureUnit}
            </button>

            {/* Refresh Weather */}
            <button
              onClick={onRefreshWeather}
              disabled={isLoadingWeather}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 border border-slate-200"
              title="Refresh weather data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWeather ? 'animate-spin text-sky-600' : ''}`} />
            </button>

            {/* Desktop frame preview toggle */}
            <button
              onClick={onToggleFrame}
              className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200"
              title={isPhoneFrame ? 'Switch to Full Screen View' : 'Switch to Android Phone Preview'}
            >
              {isPhoneFrame ? <Monitor className="w-4 h-4 text-slate-700" /> : <Smartphone className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </div>

        {/* Tier 2: Dedicated Full-Width Location Bar (Never overlaps child name) */}
        <button
          onClick={onOpenLocationSearch}
          className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100/90 hover:bg-slate-200/90 rounded-xl transition-colors border border-slate-200/70 group"
          title="Change weather location or use GPS"
        >
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-slate-800 truncate">{locationName}</span>
          </div>
          <span className="text-[10px] text-sky-700 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200/80 shrink-0 shadow-2xs">
            Change Location
          </span>
        </button>
      </div>
    </header>
  );
};
