import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  CheckSquare,
  Square,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  Filter,
  Shirt,
  Layers,
  Shield,
  Footprints,
  Sun,
  Umbrella,
  Baby,
  Waves,
} from 'lucide-react';
import { CLOTHING_CATALOG, ALL_CATALOG_ITEMS, ALL_CATALOG_ITEM_IDS } from '../utils/clothingCatalog';
import { CatalogCategory, CatalogItem } from '../types/catalog';
import { ClothingItemVisual } from './icons/ClothingIcons';
import { ClothingImageOrIcon } from './ClothingImageOrIcon';

interface ClothingCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  childName: string;
  avatarColor?: string;
  initialAvailableIds?: string[];
  onSaveAvailableIds: (availableIds: string[]) => void;
}

// Category icons mapping
const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  tops: Shirt,
  baby_clothing: Baby,
  bottoms: Layers,
  mid_layers: Sparkles,
  outerwear: Shield,
  footwear: Footprints,
  headwear: Sun,
  other_accessories: Info,
  water_activities: Waves,
  non_clothing: Umbrella,
};

export const ClothingCatalogModal: React.FC<ClothingCatalogModalProps> = ({
  isOpen,
  onClose,
  childName,
  avatarColor = 'sky',
  initialAvailableIds,
  onSaveAvailableIds,
}) => {
  // Local state of selected IDs
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    return new Set(initialAvailableIds && initialAvailableIds.length > 0 ? initialAvailableIds : ALL_CATALOG_ITEM_IDS);
  });

  // Re-sync when modal opens or initial IDs change
  React.useEffect(() => {
    if (isOpen) {
      setSelectedIds(
        new Set(initialAvailableIds && initialAvailableIds.length > 0 ? initialAvailableIds : ALL_CATALOG_ITEM_IDS)
      );
      setSearchQuery('');
      setSelectedCategoryFilter('all');
    }
  }, [isOpen, initialAvailableIds]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [showSavedToast, setShowSavedToast] = useState(false);

  if (!isOpen) return null;

  // Toggle single item
  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle entire category
  const toggleCategoryItems = (items: CatalogItem[]) => {
    const allSelected = items.every((item) => selectedIds.has(item.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        items.forEach((item) => next.delete(item.id));
      } else {
        items.forEach((item) => next.add(item.id));
      }
      return next;
    });
  };

  // Select all / Deselect all
  const selectAll = () => {
    setSelectedIds(new Set(ALL_CATALOG_ITEM_IDS));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // Reset to default (all selected)
  const resetToDefault = () => {
    setSelectedIds(new Set(ALL_CATALOG_ITEM_IDS));
  };

  // Save changes
  const handleSave = () => {
    onSaveAvailableIds(Array.from(selectedIds));
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
      onClose();
    }, 450);
  };

  // Prepare categories list with non-clothing products grouped into a section
  const allDisplayCategories: {
    id: string;
    label: { en: string; he: string };
    items: CatalogItem[];
  }[] = [
    ...CLOTHING_CATALOG.categories,
    {
      id: 'non_clothing',
      label: {
        en: 'Essentials & Protection Products',
        he: 'מוצרים ותכשירי הגנה חיוניים',
      },
      items: CLOTHING_CATALOG.nonClothingProducts,
    },
  ];

  // Filter categories and items based on search and active category filter
  const filteredCategories = allDisplayCategories
    .filter((cat) => selectedCategoryFilter === 'all' || cat.id === selectedCategoryFilter)
    .map((cat) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return cat;

      const matchedItems = cat.items.filter((item) => {
        const enMatch = item.label.en.toLowerCase().includes(q);
        const heMatch = item.label.he.toLowerCase().includes(q);
        const idMatch = item.id.toLowerCase().includes(q);
        const roleMatch = item.layerRole?.toLowerCase().includes(q);
        return enMatch || heMatch || idMatch || roleMatch;
      });

      return {
        ...cat,
        items: matchedItems,
      };
    })
    .filter((cat) => cat.items.length > 0);

  const totalItemCount = ALL_CATALOG_ITEMS.length;
  const currentSelectedCount = selectedIds.size;
  const percentage = Math.round((currentSelectedCount / totalItemCount) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-modal-title"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-linear-to-r from-sky-50/70 via-indigo-50/30 to-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-xs font-bold text-base">
              <Shirt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="catalog-modal-title" className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Wardrobe Catalog
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  {childName}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Uncheck items {childName} does not own; only checked items will be suggested.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            aria-label="Close catalog modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Counter bar & search */}
        <div className="p-3 sm:px-5 bg-slate-50/90 border-b border-slate-200 space-y-2.5 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                {currentSelectedCount} of {totalItemCount} Selected
              </span>
              <span className="text-xs text-slate-400 font-mono">({percentage}%)</span>
              <div className="w-24 sm:w-32 h-2 rounded-full bg-slate-200 overflow-hidden ml-1">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={selectAll}
                className="px-2.5 py-1 rounded-lg font-medium text-sky-700 bg-sky-100/70 hover:bg-sky-200/70 transition"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={deselectAll}
                className="px-2.5 py-1 rounded-lg font-medium text-slate-600 bg-slate-200/70 hover:bg-slate-300/70 transition"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={resetToDefault}
                className="px-2 py-1 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition flex items-center gap-1"
                title="Reset to all items"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clothes, shoes, rain gear, Hebrew or English names..."
              className="w-full pl-9 pr-8 py-2 bg-white rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills (Horizontal Scroll) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition ${
                selectedCategoryFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
              }`}
            >
              All Categories
            </button>
            {allDisplayCategories.map((cat) => {
              const isSelected = selectedCategoryFilter === cat.id;
              const catItemCount = cat.items.length;
              const catSelectedCount = cat.items.filter((item) => selectedIds.has(item.id)).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium shrink-0 transition flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
                  }`}
                >
                  <span>{cat.label.en}</span>
                  <span
                    className={`text-[10px] px-1 py-0.2 rounded-md ${
                      isSelected ? 'bg-sky-700 text-sky-100' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {catSelectedCount}/{catItemCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Categories & Items Scroll Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <Shirt className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No catalog items match your search</p>
              <p className="text-xs text-slate-400">Try searching with a different keyword or clear the search.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategoryFilter('all');
                }}
                className="mt-2 px-3 py-1.5 text-xs font-semibold text-sky-600 bg-sky-50 rounded-xl hover:bg-sky-100 transition"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredCategories.map((category) => {
              const IconComponent = CATEGORY_ICONS[category.id] || Shirt;
              const categoryItems = category.items;
              const catSelectedCount = categoryItems.filter((item) => selectedIds.has(item.id)).length;
              const isAllCatSelected = categoryItems.length > 0 && catSelectedCount === categoryItems.length;

              return (
                <div
                  key={category.id}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs"
                >
                  {/* Category Header */}
                  <div className="p-3 sm:px-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                            {category.label.en}
                          </h3>
                          <span className="text-xs text-slate-400 font-normal" dir="rtl">
                            {category.label.he}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {catSelectedCount} of {categoryItems.length} available
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleCategoryItems(categoryItems)}
                      className="text-xs font-semibold px-2 py-1 rounded-md text-slate-600 hover:text-sky-700 hover:bg-sky-50 transition"
                    >
                      {isAllCatSelected ? 'Uncheck All' : 'Check All'}
                    </button>
                  </div>

                  {/* Items List */}
                  <div className="divide-y divide-slate-100">
                    {categoryItems.map((item) => {
                      const isSelected = selectedIds.has(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleItem(item.id)}
                          className={`p-3 sm:px-4 flex items-start justify-between gap-3 cursor-pointer transition select-none ${
                            isSelected ? 'bg-white hover:bg-sky-50/30' : 'bg-slate-50/50 hover:bg-slate-100/60 opacity-60'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            {/* Checkbox button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleItem(item.id);
                              }}
                              className={`w-5 h-5 rounded-md border flex items-center justify-center mt-0.5 shrink-0 transition ${
                                isSelected
                                  ? 'bg-sky-600 border-sky-600 text-white shadow-2xs'
                                  : 'bg-white border-slate-300 text-transparent hover:border-slate-400'
                              }`}
                              aria-checked={isSelected}
                              role="checkbox"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>

                            {/* Item Photo / Icon */}
                            <ClothingImageOrIcon
                              id={item.id}
                              name={item.label.en}
                              iconName={item.id}
                              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl transition ${
                                isSelected
                                  ? 'bg-white border-slate-200 shadow-2xs'
                                  : 'bg-slate-100 border-slate-200 grayscale opacity-50'
                              }`}
                              iconClassName="w-6 h-6 sm:w-7 sm:h-7"
                            />

                            {/* Item Details */}
                            <div className="min-w-0">
                              <div className="flex items-baseline gap-2 flex-wrap">
                                <span
                                  className={`text-xs sm:text-sm font-semibold leading-tight ${
                                    isSelected ? 'text-slate-900' : 'text-slate-500 line-through decoration-slate-300'
                                  }`}
                                >
                                  {item.label.en}
                                </span>
                                <span className="text-[11px] text-slate-400 font-normal" dir="rtl">
                                  {item.label.he}
                                </span>
                              </div>

                              {/* Properties badges */}
                              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                {item.layerRole && (
                                  <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                                    {item.layerRole.replace('_', ' ')}
                                  </span>
                                )}
                                {item.properties?.insulation && item.properties.insulation !== 'none' && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60">
                                    {item.properties.insulation} insulation
                                  </span>
                                )}
                                {item.properties?.waterProtection && item.properties.waterProtection !== 'none' && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60">
                                    {item.properties.waterProtection} waterproof
                                  </span>
                                )}
                                {item.properties?.sunProtection && item.properties.sunProtection !== 'none' && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-orange-50 text-orange-700 border border-orange-200/60">
                                    {item.properties.sunProtection} sun protection
                                  </span>
                                )}
                              </div>

                              {item.safetyNotes && item.safetyNotes.length > 0 && (
                                <p className="text-[10px] text-amber-700 mt-1 italic">
                                  ⚠️ {item.safetyNotes[0]}
                                </p>
                              )}
                            </div>
                          </div>

                          <span
                            className={`text-[11px] font-semibold shrink-0 px-2 py-0.5 rounded-full ${
                              isSelected
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}
                          >
                            {isSelected ? 'Owned' : 'Excluded'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-white flex items-center justify-between shrink-0 gap-3">
          <div className="text-xs text-slate-500 hidden sm:block">
            {currentSelectedCount === 0 ? (
              <span className="text-rose-600 font-semibold">⚠️ No clothes selected! Select at least a few items.</span>
            ) : (
              <span>The app will only suggest these {currentSelectedCount} items.</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-initial px-5 py-2 text-xs sm:text-sm font-bold rounded-xl text-white bg-sky-600 hover:bg-sky-500 shadow-sm hover:shadow transition flex items-center justify-center gap-1.5"
            >
              {showSavedToast ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Wardrobe Saved!</span>
                </>
              ) : (
                <>
                  <CheckSquare className="w-4 h-4" />
                  <span>Save Wardrobe ({currentSelectedCount})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
