import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Clock,
  Shirt,
  Briefcase,
  ShieldCheck,
  Check,
  Calendar,
  AlertCircle,
  Sun,
  Umbrella,
} from 'lucide-react';
import { AiOutfitPlan, AiOutfitActivity } from '../types/suggestionEngine';
import { ClothingImageOrIcon } from './ClothingImageOrIcon';
import catalogJson from './clothing-catalog.json';

interface CatalogItemMap {
  [id: string]: {
    id: string;
    label: string;
    category?: string;
    layerRole?: string;
  };
}

// Build quick lookup for catalog item labels
const catalogLookup: CatalogItemMap = {};
catalogJson.categories.forEach((cat) => {
  cat.items.forEach((item) => {
    catalogLookup[item.id] = {
      id: item.id,
      label: item.label.en,
      category: cat.id,
      layerRole: item.layerRole,
    };
  });
});
catalogJson.nonClothingProducts.forEach((prod) => {
  catalogLookup[prod.id] = {
    id: prod.id,
    label: prod.label.en,
    category: 'gear',
  };
});

function formatItemLabel(id: string): string {
  if (catalogLookup[id]?.label) {
    return catalogLookup[id].label;
  }
  return id
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface AiSuggestionSectionProps {
  plan: AiOutfitPlan | null;
  isLoading: boolean;
  isCached: boolean;
  timestamp?: number;
  childName: string;
  selectedScheduleIds: string[];
  activeSchedulesToday: Array<{
    id: string;
    title: string;
    locationType: string;
    startTime: string;
    endTime: string;
  }>;
  onRefresh: () => void;
  onOpenCatalog?: () => void;
}

export const AiSuggestionSection: React.FC<AiSuggestionSectionProps> = ({
  plan,
  isLoading,
  isCached,
  timestamp,
  childName,
  selectedScheduleIds,
  activeSchedulesToday,
  onRefresh,
  onOpenCatalog,
}) => {
  // Checklist state for items
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleCheck = (itemId: string, activityName: string) => {
    const key = `${activityName}:${itemId}`;
    setCheckedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Filter plan activities based on user's currently selected activities
  const selectedSchedules = activeSchedulesToday.filter((s) =>
    selectedScheduleIds.includes(s.id)
  );

  const displayedActivities: AiOutfitActivity[] = React.useMemo(() => {
    if (!plan || !plan.activities || plan.activities.length === 0) return [];

    // If schedules are active, match activities by title or locationType
    if (selectedSchedules.length > 0) {
      const selectedTitles = selectedSchedules.map((s) => s.title.toLowerCase());
      const selectedTypes = selectedSchedules.map((s) => s.locationType.toLowerCase());

      const filtered = plan.activities.filter((act) => {
        const actName = act.activity_name.toLowerCase();
        return (
          selectedTitles.some((t) => actName.includes(t) || t.includes(actName)) ||
          selectedTypes.some((typ) => actName.includes(typ) || typ.includes(actName))
        );
      });

      // If specific match found, return filtered; otherwise return all plan activities
      if (filtered.length > 0) {
        return filtered;
      }
    }

    return plan.activities;
  }, [plan, selectedSchedules]);

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Recently';

  return (
    <div className="space-y-4">
      {/* AI Suggestion Header Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 text-white shadow-md border border-indigo-700/50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-600/60 border border-violet-400/40 flex items-center justify-center text-violet-200 shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Clothing Suggestion Engine
                </h3>
                {isCached ? (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1"
                    title="Retrieved from cache. Re-queries only when activities, profile, or wardrobe change."
                  >
                    <span>⚡ Cached ({formattedTime})</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/30 text-violet-200 border border-violet-400/40">
                    ✨ Fresh
                  </span>
                )}
              </div>
              <p className="text-[11px] text-violet-200/80 mt-0.5 leading-snug">
                Customized for {childName}&apos;s profile, wardrobe &amp; selected activities
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Force re-query suggestion engine"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-xs font-semibold text-white transition disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Cache Transparency Notice */}
        <div className="mt-3 pt-2.5 border-t border-indigo-700/60 flex items-center justify-between text-[11px] text-indigo-200/90">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              {isCached
                ? `Using cached plan from ${formattedTime} (auto-refreshes if activities, profile, or wardrobe change)`
                : 'Generated via Suggestion Engine (agent.py)'}
            </span>
          </div>
          {onOpenCatalog && (
            <button
              type="button"
              onClick={onOpenCatalog}
              className="text-[11px] font-medium text-violet-300 hover:text-white underline underline-offset-2 ml-2 shrink-0"
            >
              Edit Wardrobe
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-slate-200" />
            <div className="h-4 bg-slate-200 rounded w-1/3" />
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-slate-100 rounded w-full" />
            <div className="h-3 bg-slate-100 rounded w-5/6" />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="h-14 bg-slate-100 rounded-xl" />
            <div className="h-14 bg-slate-100 rounded-xl" />
          </div>
          <p className="text-center text-xs text-slate-500 font-medium">
            Generating customized outfit plan via suggestion engine...
          </p>
        </div>
      )}

      {/* Activities Listed ONE AFTER THE OTHER (per user explicit specification) */}
      {!isLoading && displayedActivities.length > 0 && (
        <div className="space-y-4">
          {displayedActivities.map((activity, actIdx) => {
            const actKey = activity.activity_name || `act-${actIdx}`;

            return (
              <div
                key={actKey}
                className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden transition"
              >
                {/* Activity Banner */}
                <div className="bg-slate-50/90 px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                      {activity.activity_name.toLowerCase().includes('daycare') ? '🎒' : '🌲'}
                    </span>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                        {activity.activity_name}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Time window: {activity.time_window}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                    Activity {actIdx + 1} of {displayedActivities.length}
                  </span>
                </div>

                <div className="p-4 space-y-4">
                  {/* 1. Wear on Start (Kid must be fully clothed initially) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-sky-600 text-white flex items-center justify-center text-[10px] font-bold shadow-2xs">
                          👕
                        </span>
                        <h5 className="font-bold text-xs text-slate-900 tracking-wide uppercase">
                          Wear on Start (Initial Outfit)
                        </h5>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500">
                        Put on before leaving
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activity.wear_on_start.map((wItem, idx) => {
                        const checkKey = `${actKey}:${wItem.item}`;
                        const isChecked = !!checkedItems[checkKey];
                        const label = formatItemLabel(wItem.item);

                        return (
                          <div
                            key={`wear-${idx}`}
                            onClick={() => toggleCheck(wItem.item, actKey)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition select-none ${
                              isChecked
                                ? 'bg-emerald-50/70 border-emerald-300'
                                : 'bg-slate-50/70 border-slate-200/90 hover:bg-slate-100/60'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <button
                                type="button"
                                className={`w-5 h-5 rounded-md flex items-center justify-center border transition shrink-0 ${
                                  isChecked
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </button>
                              <ClothingImageOrIcon
                                id={wItem.item}
                                name={label}
                                className="w-8 h-8 bg-white border border-slate-200 rounded-lg shrink-0"
                                iconClassName="w-4 h-4"
                              />
                              <span
                                className={`text-xs font-semibold text-slate-900 truncate ${
                                  isChecked ? 'line-through text-slate-400' : ''
                                }`}
                              >
                                {label}
                              </span>
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-sky-700 bg-sky-100/70 px-1.5 py-0.5 rounded shrink-0">
                              Start
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Pack & Carry (Non-accessory items to carry/pack with timing) */}
                  {activity.pack_and_carry && activity.pack_and_carry.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-2xs">
                            🎒
                          </span>
                          <h5 className="font-bold text-xs text-slate-900 tracking-wide uppercase">
                            Pack &amp; Carry in Bag
                          </h5>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500">
                          Extra layers &amp; changes
                        </span>
                      </div>

                      <div className="space-y-2">
                        {activity.pack_and_carry.map((pItem, idx) => {
                          const checkKey = `${actKey}:${pItem.item}`;
                          const isChecked = !!checkedItems[checkKey];
                          const label = formatItemLabel(pItem.item);

                          return (
                            <div
                              key={`pack-${idx}`}
                              onClick={() => toggleCheck(pItem.item, actKey)}
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition select-none ${
                                isChecked
                                  ? 'bg-emerald-50/70 border-emerald-300'
                                  : 'bg-white border-slate-200 hover:bg-slate-50/60'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <button
                                  type="button"
                                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition shrink-0 ${
                                    isChecked
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-slate-300 bg-slate-50'
                                  }`}
                                >
                                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </button>
                                <ClothingImageOrIcon
                                  id={pItem.item}
                                  name={label}
                                  className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-lg shrink-0"
                                  iconClassName="w-4 h-4"
                                />
                                <div className="min-w-0">
                                  <span
                                    className={`text-xs font-semibold block text-slate-900 truncate ${
                                      isChecked ? 'line-through text-slate-400' : ''
                                    }`}
                                  >
                                    {label}
                                  </span>
                                  <span className="text-[10px] font-medium text-slate-500 block">
                                    When: {pItem.appropriate_when}
                                  </span>
                                </div>
                              </div>

                              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md shrink-0">
                                {pItem.appropriate_when.length > 20
                                  ? pItem.appropriate_when.slice(0, 18) + '...'
                                  : pItem.appropriate_when}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. Accessories & Protection (with specific application/usage times) */}
                  {activity.accessories && activity.accessories.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shadow-2xs">
                            🧴
                          </span>
                          <h5 className="font-bold text-xs text-slate-900 tracking-wide uppercase">
                            Accessories &amp; Protection
                          </h5>
                        </div>
                        <span className="text-[10px] font-semibold text-amber-700">
                          Specific Usage Times
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activity.accessories.map((acc, idx) => {
                          const checkKey = `${actKey}:${acc.item}`;
                          const isChecked = !!checkedItems[checkKey];
                          const label = formatItemLabel(acc.item);

                          return (
                            <div
                              key={`acc-${idx}`}
                              onClick={() => toggleCheck(acc.item, actKey)}
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition select-none ${
                                isChecked
                                  ? 'bg-emerald-50/70 border-emerald-300'
                                  : 'bg-amber-50/40 border-amber-200/80 hover:bg-amber-50/70'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <button
                                  type="button"
                                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition shrink-0 ${
                                    isChecked
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-amber-300 bg-white'
                                  }`}
                                >
                                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </button>
                                <ClothingImageOrIcon
                                  id={acc.item}
                                  name={label}
                                  className="w-8 h-8 bg-white border border-amber-200 rounded-lg shrink-0"
                                  iconClassName="w-4 h-4"
                                />
                                <div className="min-w-0">
                                  <span
                                    className={`text-xs font-semibold block text-slate-900 truncate ${
                                      isChecked ? 'line-through text-slate-400' : ''
                                    }`}
                                  >
                                    {label}
                                  </span>
                                  <span className="text-[10px] text-amber-800 font-medium flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                                    <span>{acc.timing}</span>
                                  </span>
                                </div>
                              </div>

                              <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md shrink-0">
                                {acc.timing}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && displayedActivities.length === 0 && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
          <p className="text-xs font-semibold text-slate-700">
            No activity suggestions found for the current selection
          </p>
          <p className="text-[11px] text-slate-500">
            Click Refresh to query the Suggestion Engine for today&apos;s activities.
          </p>
          <button
            type="button"
            onClick={onRefresh}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition inline-flex items-center gap-1.5 mt-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Generate Suggestion</span>
          </button>
        </div>
      )}
    </div>
  );
};
