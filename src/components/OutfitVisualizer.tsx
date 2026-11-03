import React, { useState } from 'react';
import {
  Check,
  AlertTriangle,
  Info,
  Edit2,
  Briefcase,
  Thermometer,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Shirt,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { ClothingRecommendation, ClothingItem, PackInBagItem } from '../types/clothing';
import { ChildAgeCalculation } from '../types/child';
import { ClothingItemVisual, AntiMosquitoIcon } from './icons/ClothingIcons';
import { ClothingImageOrIcon } from './ClothingImageOrIcon';

interface OutfitVisualizerProps {
  recommendation: ClothingRecommendation;
  ageCalculation: ChildAgeCalculation;
  childName: string;
  temperatureUnit: 'C' | 'F';
  isAiCached?: boolean;
  aiTimestamp?: number;
  isLoading?: boolean;
  onRefresh?: () => void;
  onEditChild?: () => void;
  onOpenCatalog?: () => void;
}

export const OutfitVisualizer: React.FC<OutfitVisualizerProps> = ({
  recommendation,
  ageCalculation,
  childName,
  temperatureUnit,
  isAiCached,
  aiTimestamp,
  isLoading,
  onRefresh,
  onEditChild,
  onOpenCatalog,
}) => {
  // Collapsible anti-mosquito card state (default collapsed for concise view)
  const [isMosquitoExpanded, setIsMosquitoExpanded] = useState(false);

  // Collapsible clothing items state (default collapsed for clean, concise view)
  const [expandedItemIds, setExpandedItemIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedItemIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Checked items state for dressing & packing
  const [checkedItemIds, setCheckedItemIds] = useState<Record<string, boolean>>({});

  // Tooltip / popover info state for ON and WITH section headers
  const [showOnInfo, setShowOnInfo] = useState(false);
  const [showWithInfo, setShowWithInfo] = useState(false);

  const toggleCheck = (id: string) => {
    setCheckedItemIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const formatTemp = (celsius: number) => {
    if (temperatureUnit === 'F') {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${celsius}°C`;
  };

  const wearNowItems: ClothingItem[] = [
    ...recommendation.wearNowLayers.baseLayer,
    ...recommendation.wearNowLayers.midLayer,
    ...recommendation.wearNowLayers.outerLayer,
    ...recommendation.wearNowLayers.extremities,
  ];

  const packItems: PackInBagItem[] = React.useMemo(() => {
    const raw = recommendation.packInBagItems || [];
    const map = new Map<string, PackInBagItem>();
    raw.forEach((item) => {
      const cleanId = item.id.replace(/^pack-/, '');
      const existing = map.get(cleanId);
      if (!existing) {
        map.set(cleanId, { ...item });
      } else {
        const combinedTiming =
          existing.timing === item.timing || existing.timing.includes(item.timing)
            ? existing.timing
            : `${existing.timing} • ${item.timing}`;
        const combinedReason = existing.reason.includes(item.reason)
          ? existing.reason
          : `${existing.reason} • ${item.reason}`;
        map.set(cleanId, {
          ...existing,
          timing: combinedTiming,
          reason: combinedReason,
          isCrucial: existing.isCrucial || item.isCrucial,
        });
      }
    });
    return Array.from(map.values());
  }, [recommendation.packInBagItems]);

  const totalWearCount = wearNowItems.length;
  const readyWearCount = wearNowItems.filter((item) => checkedItemIds[item.id]).length;

  const totalPackCount = packItems.length;
  const readyPackCount = packItems.filter((item) => checkedItemIds[item.id]).length;

  const isBaby = ageCalculation.category === 'newborn' || ageCalculation.category === 'infant';

  const getItemIcon = (name: string, category?: string, iconName?: string) => {
    return (
      <ClothingItemVisual
        name={name}
        category={category}
        iconName={iconName}
        isBaby={isBaby}
        className="w-5 h-5"
      />
    );
  };

  const { mosquitoAdvice, temperatureSwing } = recommendation;

  return (
    <div className="space-y-4">
      {/* 1. SUGGESTION ENGINE HEADER & CACHING STATUS */}
      <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-sky-50/80 to-purple-50/90 border border-indigo-100 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xs sm:text-sm text-slate-900">
                Suggestion Engine Plan
              </span>
              {aiTimestamp && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                    isAiCached
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                  }`}
                >
                  {isAiCached ? '⚡ Cached Plan' : '✨ Fresh Plan'}
                </span>
              )}
              {aiTimestamp && (
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(aiTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 whitespace-normal mt-0.5">
              Automativally re-queried only if activities for the day, kid profile, or wardrobe change
            </p>
          </div>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Force re-query suggestion engine"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 transition shadow-2xs shrink-0 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            <span className="hidden sm:inline">{isLoading ? 'Updating...' : 'Re-query'}</span>
          </button>
        )}
      </div>

      {/* 2. ANTI-MOSQUITO ADVICE CARD (Collapsible: details open only on click) */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isMosquitoExpanded}
        onClick={() => setIsMosquitoExpanded((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsMosquitoExpanded((prev) => !prev);
          }
        }}
        className={`p-3.5 sm:p-4 rounded-2xl border shadow-2xs transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-sky-400 ${
          mosquitoAdvice.needed
            ? mosquitoAdvice.riskLevel === 'high'
              ? 'bg-amber-50/90 border-amber-300 hover:bg-amber-50'
              : 'bg-emerald-50/80 border-emerald-300 hover:bg-emerald-50'
            : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/60'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-100/90 border border-amber-200/80 flex items-center justify-center shrink-0 text-amber-700 shadow-2xs">
              <AntiMosquitoIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs sm:text-sm text-slate-900">
                  Anti-Mosquito Protection
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    mosquitoAdvice.needed
                      ? mosquitoAdvice.riskLevel === 'high'
                        ? 'bg-amber-600 text-white'
                        : 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {mosquitoAdvice.needed ? 'NEEDED TODAY' : 'NOT NEEDED'}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-700 mt-0.5">
                {mosquitoAdvice.headline}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-slate-400 shrink-0">
            <span className="text-[10px] font-medium text-slate-500 hidden sm:inline">
              {isMosquitoExpanded ? 'Hide info' : 'Details'}
            </span>
            {isMosquitoExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-600" />
            )}
          </div>
        </div>

        {/* Expandable details: Environmental reason, peak hours, and pediatric rules */}
        {isMosquitoExpanded && (
          <div
            className="pt-3 mt-2.5 border-t border-slate-200/70 space-y-2.5 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Environmental reason & peak biting hours */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-white/70 border border-slate-200/60">
                <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider mb-0.5">
                  Why today:
                </span>
                <span className="text-slate-600 leading-snug">
                  {mosquitoAdvice.environmentalReason}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/70 border border-slate-200/60">
                <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider mb-0.5">
                  Peak risk hours:
                </span>
                <span className="text-slate-600 font-medium flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{mosquitoAdvice.peakHours}</span>
                </span>
              </div>
            </div>

            {/* Pediatric Application Guidelines */}
            {mosquitoAdvice.needed && (
              <div className="p-3 rounded-xl bg-white/95 border border-slate-200/80 space-y-1.5 text-xs shadow-2xs">
                <span className="font-bold text-slate-900 block text-[11px]">
                  Pediatric Application Instructions:
                </span>
                <p className="text-[11px] text-slate-700 leading-snug">
                  {mosquitoAdvice.applicationRule}
                </p>
                {mosquitoAdvice.ageSafetyNotice && (
                  <p className="text-[10px] text-amber-800 font-semibold pt-0.5">
                    ⚠️ {mosquitoAdvice.ageSafetyNotice}
                  </p>
                )}
                {mosquitoAdvice.safeProducts && mosquitoAdvice.safeProducts.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500">Safe products:</span>
                    {mosquitoAdvice.safeProducts.map((p, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. SECTION 1: WEAR NOW (ON) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-sky-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
              👕
            </span>
            <div className="flex items-center gap-1.5 relative">
              <h3 className="font-bold text-sm text-slate-900 tracking-wide">
                ON
              </h3>
              <div className="relative inline-flex items-center">
                <button
                  type="button"
                  aria-label="Information about ON items"
                  title="Put ON Your Child Right Now&#10;What to wear when leaving the house this morning"
                  onClick={() => setShowOnInfo((prev) => !prev)}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
                {showOnInfo && (
                  <>
                    <div
                      className="fixed inset-0 z-20 cursor-default"
                      onClick={() => setShowOnInfo(false)}
                    />
                    <div className="absolute left-0 top-full mt-1.5 z-30 w-64 p-3 bg-white border border-slate-200 rounded-xl shadow-lg text-left animate-in fade-in zoom-in-95 duration-150">
                      <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                        <span>Put ON Your Child Right Now</span>
                        <button
                          type="button"
                          onClick={() => setShowOnInfo(false)}
                          className="text-slate-400 hover:text-slate-600 text-xs ml-2 p-0.5"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                        What to wear when leaving the house this morning
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <span className="text-xs font-bold text-sky-700 font-mono">
            {readyWearCount}/{totalWearCount} Dressed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {wearNowItems.map((item) => {
            const isChecked = !!checkedItemIds[item.id];
            const isExpanded = !!expandedItemIds[item.id];

            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition-all select-none overflow-hidden ${
                  isChecked
                    ? 'bg-emerald-50/60 border-emerald-300 shadow-2xs'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/40 shadow-2xs'
                }`}
              >
                {/* Collapsed concise row: Checkbox + Clothing Icon + Name + Expand Arrow */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  onClick={() => toggleExpand(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleExpand(item.id);
                    }
                  }}
                  className="p-3 sm:p-3.5 flex items-center justify-between gap-2.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Checkbox button */}
                    <button
                      type="button"
                      title={isChecked ? 'Mark as not dressed' : 'Mark as dressed'}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCheck(item.id);
                      }}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                        isChecked
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    {/* Clothing Image from Catalog (with crisp SVG fallback) */}
                    <ClothingImageOrIcon
                      id={item.id}
                      name={item.name}
                      category={item.category}
                      iconName={item.iconName}
                      isBaby={isBaby}
                      className="w-10 h-10 bg-white border border-slate-200/90 shadow-2xs shrink-0"
                      iconClassName="w-5 h-5"
                    />

                    {/* Item Name */}
                    <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`min-w-0 flex-1 font-bold text-xs sm:text-sm text-slate-900 whitespace-normal ${
                          isChecked ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {item.name}
                      </span>
                      {item.isOptional && (
                        <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.2 rounded-md shrink-0">
                          Optional
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expand / Collapse Chevron */}
                  <div className="flex items-center gap-1 text-slate-400 shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                    )}
                  </div>
                </div>

                {/* Expanded details: Description & Material Hint */}
                {isExpanded && (
                  <div
                    className="px-3.5 pb-3 pt-1 border-t border-slate-100 space-y-1 text-xs text-slate-600 bg-slate-50/50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-[11px] leading-snug text-slate-600 pt-1">
                      {item.description}
                    </p>
                    {item.materialHint && (
                      <p className="text-[10px] font-medium text-sky-700 pt-0.5">
                        <span className="font-semibold text-slate-700">Material: </span>
                        {item.materialHint}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. SECTION 2: HAVE WITH HIM (WITH) */}
      <div className="space-y-3 pt-2 border-t border-slate-200">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
              🎒
            </span>
            <div className="flex items-center gap-1.5 relative">
              <h3 className="font-bold text-sm text-slate-900 tracking-wide">
                WITH
              </h3>
              <div className="relative inline-flex items-center">
                <button
                  type="button"
                  aria-label="Information about WITH items"
                  title="Have With Him, Not On Him (Pack in Bag)&#10;Extra layers & essentials for temperature changes, evening drop, or rain later"
                  onClick={() => setShowWithInfo((prev) => !prev)}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
                {showWithInfo && (
                  <>
                    <div
                      className="fixed inset-0 z-20 cursor-default"
                      onClick={() => setShowWithInfo(false)}
                    />
                    <div className="absolute left-0 top-full mt-1.5 z-30 w-72 p-3 bg-white border border-slate-200 rounded-xl shadow-lg text-left animate-in fade-in zoom-in-95 duration-150">
                      <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                        <span>Have With Him, Not On Him (Pack in Bag)</span>
                        <button
                          type="button"
                          onClick={() => setShowWithInfo(false)}
                          className="text-slate-400 hover:text-slate-600 text-xs ml-2 p-0.5"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                        Extra layers & essentials for temperature changes, evening drop, or rain later
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <span className="text-xs font-bold text-indigo-700 font-mono">
            {readyPackCount}/{totalPackCount} Packed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {packItems.map((item) => {
            const isChecked = !!checkedItemIds[item.id];
            const isExpanded = !!expandedItemIds[item.id];

            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition-all select-none overflow-hidden ${
                  isChecked
                    ? 'bg-emerald-50/60 border-emerald-300 shadow-2xs'
                    : item.isCrucial
                    ? 'bg-indigo-50/40 border-indigo-200 hover:border-indigo-300 shadow-2xs'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                }`}
              >
                {/* Collapsed concise row: Checkbox + Icon + Name + Timing + Expand Arrow */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  onClick={() => toggleExpand(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleExpand(item.id);
                    }
                  }}
                  className="p-3 sm:p-3.5 flex items-center justify-between gap-2.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Checkbox button */}
                    <button
                      type="button"
                      title={isChecked ? 'Mark as unpacked' : 'Mark as packed'}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCheck(item.id);
                      }}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                        isChecked
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 bg-white hover:bg-slate-100 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    {/* Item Image from Catalog (with crisp SVG fallback) */}
                    <ClothingImageOrIcon
                      id={item.id}
                      name={item.name}
                      category="pack"
                      iconName={item.iconName}
                      isBaby={isBaby}
                      className="w-10 h-10 bg-white border border-indigo-100 shadow-2xs shrink-0"
                      iconClassName="w-5 h-5"
                    />

                    {/* Item Name + Timing */}
                    <div className="min-w-0 flex flex-col items-start gap-1">
                      <span
                        className={`min-w-0 flex-1 font-bold text-xs sm:text-sm text-slate-900 whitespace-normal ${
                          isChecked ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {item.name}
                      </span>
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.2 rounded-md border border-indigo-100 shrink-0">
                        {item.timing}
                      </span>
                    </div>
                  </div>

                  {/* Expand / Collapse Chevron */}
                  <div className="flex items-center gap-1 text-slate-400 shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                    )}
                  </div>
                </div>

                {/* Expanded details: Packing Reason */}
                {isExpanded && (
                  <div
                    className="px-3.5 pb-3 pt-1 border-t border-indigo-100/60 space-y-1 text-xs text-slate-600 bg-indigo-50/30"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-[11px] leading-snug text-slate-600 pt-1">
                      <span className="font-semibold text-indigo-900">Why pack: </span>
                      {item.reason}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4.5. DAY TRANSITIONS & OUTFIT CHANGES */}
      {recommendation.changes && recommendation.changes.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                🔄
              </span>
              <h3 className="font-bold text-sm text-slate-900 tracking-wide">
                Day Transitions ({recommendation.changes.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Scheduled transitions</span>
          </div>

          <div className="space-y-2">
            {recommendation.changes.map((change) => {
              const date = new Date(change.time);
              const hourNum = isNaN(date.getHours()) ? 12 : date.getHours();
              const ampm = hourNum >= 12 ? 'PM' : 'AM';
              const displayHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
              const formattedTime = `${displayHour}:00 ${ampm}`;
              const actionLabel =
                change.action === 'put_on' ? 'Put On' : change.action === 'remove' ? 'Remove' : 'Replace';

              return (
                <div
                  key={change.id}
                  className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ClothingImageOrIcon
                      id={change.clothingItemId}
                      name={change.clothingItemId}
                      className="w-10 h-10 bg-slate-50 border border-slate-200 shrink-0"
                      iconClassName="w-5 h-5"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            change.action === 'put_on'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : change.action === 'remove'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          {actionLabel}
                        </span>
                        <span className="font-semibold text-slate-900 capitalize">
                          {change.clothingItemId.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{change.reason}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{formattedTime}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. SAFETY ALERTS */}
      {recommendation.safetyAlerts.map((alert, idx) => (
        <div
          key={`alert-${idx}`}
          className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-2xs"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed font-medium">
            <strong className="font-bold text-amber-950 block mb-0.5">Safety Precaution:</strong>
            {alert}
          </div>
        </div>
      ))}
    </div>
  );
};
