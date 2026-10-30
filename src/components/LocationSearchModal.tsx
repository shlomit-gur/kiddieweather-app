import React, { useState, useEffect } from 'react';
import { X, Search, Navigation, MapPin, Loader2, Home } from 'lucide-react';
import { LocationSearchResult } from '../types/weather';
import { searchLocations, getCurrentCoordinates, reverseGeocode } from '../services/weatherService';

export interface LocationSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCoordinates: (lat: number, lon: number, name: string) => void;
  onUseCurrentLocation?: () => void;
  isLoadingLocation?: boolean;
  title?: string;
  subtitle?: string;
  defaultLocationName?: string;
  onSelectDefault?: () => void;
  defaultButtonLabel?: string;
}

const POPULAR_CITIES = [
  { name: 'London', country: 'United Kingdom', lat: 51.5074, lon: -0.1278 },
  { name: 'New York', country: 'United States', lat: 40.7128, lon: -74.006 },
  { name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522 },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503 },
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lon: 151.2093 },
  { name: 'Tel Aviv', country: 'Israel', lat: 32.0853, lon: 34.7818 },
  { name: 'Berlin', country: 'Germany', lat: 52.52, lon: 13.405 },
  { name: 'Toronto', country: 'Canada', lat: 43.6532, lon: -79.3832 },
  { name: 'San Francisco', country: 'United States', lat: 37.7749, lon: -122.4194 },
];

export const LocationSearchModal: React.FC<LocationSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectCoordinates,
  onUseCurrentLocation,
  isLoadingLocation = false,
  title = 'Change Location',
  subtitle = 'Weather and hourly forecast source',
  defaultLocationName,
  onSelectDefault,
  defaultButtonLabel,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isInternalGpsLoading, setIsInternalGpsLoading] = useState(false);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchLocations(query);
        setResults(res);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  // Reset query when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  const handleGpsClick = async () => {
    if (onUseCurrentLocation) {
      onUseCurrentLocation();
      onClose();
      return;
    }

    setIsInternalGpsLoading(true);
    try {
      const coords = await getCurrentCoordinates();
      const resolved = await reverseGeocode(coords.lat, coords.lon);
      onSelectCoordinates(coords.lat, coords.lon, resolved || 'Current Location');
      onClose();
    } catch (err) {
      console.warn('Geolocation failed:', err);
    } finally {
      setIsInternalGpsLoading(false);
    }
  };

  if (!isOpen) return null;

  const effectiveLoading = isLoadingLocation || isInternalGpsLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search input & GPS / Default action */}
        <div className="p-4 space-y-2.5">
          {/* Quick Default Location option if applicable */}
          {defaultLocationName && onSelectDefault && (
            <button
              type="button"
              onClick={() => {
                onSelectDefault();
                onClose();
              }}
              className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-amber-50 text-amber-900 hover:bg-amber-100/80 border border-amber-200/80 font-semibold text-xs transition cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Home className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">
                  {defaultButtonLabel || "Use Child's Default"}: <span className="font-bold">{defaultLocationName}</span>
                </span>
              </div>
              <span className="text-[10px] bg-white text-amber-800 font-bold px-2 py-0.5 rounded-md border border-amber-200 shrink-0">
                Default
              </span>
            </button>
          )}

          {/* GPS Auto-detect button */}
          <button
            type="button"
            onClick={handleGpsClick}
            disabled={effectiveLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 font-semibold text-xs transition disabled:opacity-60 cursor-pointer"
          >
            {effectiveLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
            ) : (
              <Navigation className="w-4 h-4 text-sky-600" />
            )}
            <span>Use My Exact Current Location (GPS)</span>
          </button>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (results.length > 0) {
                    const r = results[0];
                    const label = [r.name, r.admin1, r.country].filter(Boolean).join(', ');
                    onSelectCoordinates(r.latitude, r.longitude, label);
                    onClose();
                  }
                }
              }}
              placeholder="Search city, town or postcode (press Enter to select)..."
              className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-transparent transition bg-slate-50/50"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Results or Presets */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 max-h-72">
          {isSearching && (
            <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
              <span>Searching places worldwide...</span>
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-1 mb-1">
                Search Results
              </span>
              {results.map((r) => {
                const label = [r.name, r.admin1, r.country].filter(Boolean).join(', ');
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      onSelectCoordinates(r.latitude, r.longitude, label);
                      onClose();
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 flex items-center gap-2.5 transition text-xs group"
                  >
                    <MapPin className="w-4 h-4 text-slate-400 group-hover:text-sky-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-800 block truncate">{r.name}</span>
                      <span className="text-[11px] text-slate-400 block truncate">
                        {[r.admin1, r.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!isSearching && query.trim().length >= 2 && results.length === 0 && (
            <div className="py-6 text-center text-xs text-slate-500">
              No matching locations found. Try searching for a major nearby city.
            </div>
          )}

          {/* Quick presets when query is empty */}
          {!query && (
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-1 mb-1">
                Popular Cities
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {POPULAR_CITIES.map((city) => (
                  <button
                    key={city.name}
                    onClick={() => {
                      onSelectCoordinates(city.lat, city.lon, `${city.name}, ${city.country}`);
                      onClose();
                    }}
                    className="p-2 rounded-xl border border-slate-200/80 hover:border-sky-300 hover:bg-sky-50/50 text-left transition flex items-center gap-2 text-xs"
                  >
                    <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <div className="truncate">
                      <span className="font-bold text-slate-800 block truncate">{city.name}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{city.country}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
