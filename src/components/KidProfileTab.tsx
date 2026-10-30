import React, { useState } from 'react';
import {
  Calendar,
  Sparkles,
  Flame,
  Snowflake,
  Zap,
  Coffee,
  Clock,
  Plus,
  Trash2,
  Check,
  Baby,
  Users,
  School,
  TreePine,
  Waves,
  Car,
  Home,
  Repeat,
  CalendarCheck,
  CalendarDays,
  Info,
  CheckCircle2,
  Edit2,
  Shirt,
  CheckSquare,
  MapPin,
  RotateCcw,
} from 'lucide-react';
import { ClothingCatalogModal } from './ClothingCatalogModal';
import { ClothingImageOrIcon } from './ClothingImageOrIcon';
import { LocationSearchModal } from './LocationSearchModal';
import { ALL_CATALOG_ITEMS, CLOTHING_CATALOG, getChildAvailableClothingIds } from '../utils/clothingCatalog';

import {
  ChildProfile,
  ChildAgeCalculation,
  ActivityLevel,
  TemperatureTendency,
  ChildScheduleItem,
  ScheduleFrequency,
} from '../types/child';
import {
  formatLocalDate,
  parseLocalDate,
  isScheduleActiveOnDate,
  getScheduleRecurrenceLabel,
  getQuickDateOption,
  formatDaysList,
  getStartOfWeek,
} from '../utils/scheduleUtils';

interface KidProfileTabProps {
  child: ChildProfile;
  ageCalculation: ChildAgeCalculation;
  onUpdateChild: (updates: Partial<ChildProfile>) => void;
  onSwitchSibling: () => void;
  onGoToOutfits: () => void;
}

const AVATAR_COLORS = [
  { id: 'sky', bg: 'bg-sky-500' },
  { id: 'emerald', bg: 'bg-emerald-500' },
  { id: 'violet', bg: 'bg-purple-500' },
  { id: 'amber', bg: 'bg-amber-500' },
  { id: 'rose', bg: 'bg-rose-500' },
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const KidProfileTab: React.FC<KidProfileTabProps> = ({
  child,
  ageCalculation,
  onUpdateChild,
  onSwitchSibling,
  onGoToOutfits,
}) => {
  // Schedule Form State
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  const [frequency, setFrequency] = useState<ScheduleFrequency>('weekly');
  const [title, setTitle] = useState('Daycare / Kindergarten');
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('16:00');
  const [location, setLocation] = useState(child.location || 'London, UK');
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lon: number; name: string } | undefined>(
    child.locationCoords
  );
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [locationType, setLocationType] = useState<ChildScheduleItem['locationType']>('daycare');
  const [specificDate, setSpecificDate] = useState<string>(() => formatLocalDate());
  // Bi-weekly cycle setting: 'current_week' (starts/active this week) or 'next_week' (starts/active next week)
  const [biweeklyStartCycle, setBiweeklyStartCycle] = useState<'current_week' | 'next_week'>('current_week');

  // Location selector modals
  const [isChildLocModalOpen, setIsChildLocModalOpen] = useState(false);
  const [isActivityLocModalOpen, setIsActivityLocModalOpen] = useState(false);

  // Filter for schedule list
  const [scheduleFilter, setScheduleFilter] = useState<'all' | 'today' | 'recurring' | 'one_time'>('all');

  // Wardrobe Catalog Modal State
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const availableClothingIds = getChildAvailableClothingIds(child);
  const totalCatalogCount = ALL_CATALOG_ITEMS.length;
  const availableCount = availableClothingIds.length;
  const catalogPercentage = Math.round((availableCount / totalCatalogCount) * 100);

  const todayDate = new Date();
  const todayDateStr = formatLocalDate(todayDate);

  // Toggle day in schedule form
  const toggleDay = (dayIndex: number) => {
    setDays((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex].sort()
    );
  };

  // Quick day selectors
  const setQuickDays = (type: 'weekdays' | 'weekends' | 'all') => {
    if (type === 'weekdays') setDays([1, 2, 3, 4, 5]);
    else if (type === 'weekends') setDays([0, 6]);
    else setDays([0, 1, 2, 3, 4, 5, 6]);
  };

  // Select quick one-time date option
  const handleSelectQuickDate = (type: 'today' | 'tomorrow' | 'this_saturday' | 'next_saturday' | 'next_sunday') => {
    const opt = getQuickDateOption(type);
    setSpecificDate(opt.dateStr);
    setDays([opt.dayIndex]);
  };

  const handleOpenAddForm = () => {
    setEditingScheduleId(null);
    setFrequency('weekly');
    setTitle('Daycare / Kindergarten');
    setStartTime('08:30');
    setEndTime('16:00');
    setLocation(child.location || 'London, UK');
    setLocationCoords(child.locationCoords);
    setDays([1, 2, 3, 4, 5]);
    setLocationType('daycare');
    setSpecificDate(formatLocalDate());
    setBiweeklyStartCycle('current_week');
    setIsAddingSchedule(true);
  };

  const handleEditSchedule = (item: ChildScheduleItem) => {
    setEditingScheduleId(item.id);
    setFrequency(item.frequency || 'weekly');
    setTitle(item.title);
    setStartTime(item.startTime);
    setEndTime(item.endTime);
    setLocation(item.location || child.location || 'London, UK');
    setLocationCoords(item.locationCoords || (item.location === child.location ? child.locationCoords : undefined));
    setDays(item.days || []);
    setLocationType(item.locationType);
    setSpecificDate(item.specificDate || formatLocalDate());

    if (item.startDate) {
      // Determine if startDate anchor week matches current week
      const anchor = parseLocalDate(item.startDate);
      const isCurrentWeek = Math.abs(
        Math.round((getStartOfWeek(todayDate).getTime() - getStartOfWeek(anchor).getTime()) / (7 * 86400000))
      ) % 2 === 0;
      setBiweeklyStartCycle(isCurrentWeek ? 'current_week' : 'next_week');
    } else {
      setBiweeklyStartCycle('current_week');
    }

    setIsAddingSchedule(true);
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();

    let computedStartDate: string | undefined = undefined;
    if (frequency === 'biweekly') {
      const anchor = getStartOfWeek(todayDate);
      if (biweeklyStartCycle === 'next_week') {
        anchor.setDate(anchor.getDate() + 7);
      }
      computedStartDate = formatLocalDate(anchor);
    }

    // For one_time, ensure days array reflects the specific date's day of week
    let finalDays = days;
    if (frequency === 'one_time') {
      const parsedDate = parseLocalDate(specificDate);
      finalDays = [parsedDate.getDay()];
    }

    const scheduleData: ChildScheduleItem = {
      id: editingScheduleId || `sched-${Date.now()}`,
      title: title.trim() || 'Activity',
      startTime,
      endTime,
      frequency,
      days: finalDays,
      locationType,
      location: location.trim() || child.location || 'London, UK',
      locationCoords: locationCoords,
      enabled: true,
      specificDate: frequency === 'one_time' ? specificDate : undefined,
      startDate: frequency === 'biweekly' ? computedStartDate : undefined,
    };

    const currentSchedules = child.schedules || [];
    let updated: ChildScheduleItem[];

    if (editingScheduleId) {
      updated = currentSchedules.map((s) => (s.id === editingScheduleId ? scheduleData : s));
    } else {
      updated = [...currentSchedules, scheduleData];
    }

    onUpdateChild({ schedules: updated });
    setIsAddingSchedule(false);
    setEditingScheduleId(null);
  };

  const handleToggleSchedule = (id: string) => {
    const updated = (child.schedules || []).map((s) =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    );
    onUpdateChild({ schedules: updated });
  };

  const handleDeleteSchedule = (id: string) => {
    const updated = (child.schedules || []).filter((s) => s.id !== id);
    onUpdateChild({ schedules: updated });
  };

  const handleToggleSpecialTrait = (trait: string) => {
    const current = child.specialTraits || [];
    const updated = current.includes(trait)
      ? current.filter((t) => t !== trait)
      : [...current, trait];
    onUpdateChild({ specialTraits: updated });
  };

  const schedules = child.schedules || [];

  // Filtered schedules for view
  const filteredSchedules = schedules.filter((s) => {
    if (scheduleFilter === 'today') {
      return isScheduleActiveOnDate(s, todayDate);
    }
    if (scheduleFilter === 'recurring') {
      return (s.frequency || 'weekly') === 'weekly' || s.frequency === 'biweekly';
    }
    if (scheduleFilter === 'one_time') {
      return s.frequency === 'one_time';
    }
    return true;
  });

  return (
    <div className="space-y-5 pb-6">
      {/* SECTION 1: BASIC KID INFO */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Kid Information</h2>
            <p className="text-xs text-slate-500">Name & Date of Birth (DOB)</p>
          </div>
          <button
            onClick={onSwitchSibling}
            className="flex items-center gap-1.5 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl border border-sky-200 transition"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Switch / Add Sibling</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Name Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Kid's Name</label>
            <input
              type="text"
              value={child.name}
              onChange={(e) => onUpdateChild({ name: e.target.value })}
              placeholder="e.g. Maya, Liam"
              className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-slate-50/50"
            />
          </div>

          {/* Date of Birth Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                <span>Date of Birth (DOB)</span>
              </span>
              <span className="text-[11px] text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                {ageCalculation.formattedAge}
              </span>
            </label>
            <input
              type="date"
              value={child.birthDate}
              onChange={(e) => {
                if (e.target.value) {
                  onUpdateChild({ birthDate: e.target.value });
                }
              }}
              className="w-full px-3.5 py-2.5 text-sm font-bold text-slate-900 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
            />
          </div>

          {/* Child's Primary / Home Location */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                <span>Primary Location</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Default for routines</span>
            </div>
            <button
              type="button"
              onClick={() => setIsChildLocModalOpen(true)}
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 transition group text-left cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-sky-600 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-slate-900 truncate">
                  {child.location || 'London, UK'}
                </span>
              </div>
              <span className="text-xs font-bold text-sky-700 group-hover:underline px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 shrink-0 shadow-2xs">
                Change
              </span>
            </button>
          </div>
        </div>

        {/* Deduced Age Summary Banner */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-sky-500 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
              {child.name ? child.name[0].toUpperCase() : 'K'}
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900">{child.name}</span>
              <p className="text-xs text-slate-500">
                {ageCalculation.formattedAge} ·{' '}
                <span className="font-semibold text-sky-700">{ageCalculation.categoryLabel}</span>
              </p>
            </div>
          </div>

          {/* Color picker */}
          <div className="flex items-center gap-1.5">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onUpdateChild({ avatarColor: c.id })}
                className={`w-6 h-6 rounded-full ${c.bg} flex items-center justify-center transition-transform ${
                  child.avatarColor === c.id
                    ? 'ring-2 ring-offset-2 ring-slate-800 scale-110'
                    : 'opacity-70 hover:opacity-100'
                }`}
                title={`Select ${c.id} color`}
              >
                {child.avatarColor === c.id && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION: WARDROBE & CLOTHING CATALOG */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Shirt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  Wardrobe & Clothing Catalog
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  {availableCount}/{totalCatalogCount}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Uncheck items {child.name} does not own. The app will only suggest checked clothes and gear.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCatalogModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-xs transition shrink-0 cursor-pointer"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Customize Wardrobe ({availableCount})</span>
          </button>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
            <span>Available Wardrobe Items</span>
            <span className="font-bold text-slate-800">{catalogPercentage}% of catalog ({availableCount}/{totalCatalogCount})</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
            <div
              className="h-full bg-linear-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${catalogPercentage}%` }}
            />
          </div>
        </div>

        {/* Category breakdown pills preview */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {CLOTHING_CATALOG.categories.map((cat) => {
            const catItemCount = cat.items.length;
            const catOwnedCount = cat.items.filter((item) => availableClothingIds.includes(item.id)).length;
            return (
              <span
                key={cat.id}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                  catOwnedCount > 0
                    ? 'bg-slate-50 border-slate-200 text-slate-700'
                    : 'bg-rose-50 border-rose-200 text-rose-600'
                }`}
              >
                <span>{cat.label.en}:</span>
                <span className="font-bold">{catOwnedCount}/{catItemCount}</span>
              </span>
            );
          })}
          {(() => {
            const prodCount = CLOTHING_CATALOG.nonClothingProducts.length;
            const prodOwned = CLOTHING_CATALOG.nonClothingProducts.filter((item) =>
              availableClothingIds.includes(item.id)
            ).length;
            return (
              <span
                className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                  prodOwned > 0
                    ? 'bg-slate-50 border-slate-200 text-slate-700'
                    : 'bg-rose-50 border-rose-200 text-rose-600'
                }`}
              >
                <span>Essentials:</span>
                <span className="font-bold">{prodOwned}/{prodCount}</span>
              </span>
            );
          })()}
        </div>

        {/* Visual Item Preview Gallery */}
        <div className="pt-2.5 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
            <span>Wardrobe Visual Preview</span>
            <button
              type="button"
              onClick={() => setIsCatalogModalOpen(true)}
              className="text-xs text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1 cursor-pointer transition"
            >
              <span>View / Edit items</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
          <div className="flex items-stretch gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
            {ALL_CATALOG_ITEMS.slice(0, 16).map((item) => {
              const isOwned = availableClothingIds.includes(item.id);
              return (
                <div
                  key={`wardrobe-thumb-${item.id}`}
                  onClick={() => setIsCatalogModalOpen(true)}
                  className={`flex flex-col items-center justify-between min-w-[66px] max-w-[76px] p-1.5 rounded-xl border transition cursor-pointer text-center group select-none shrink-0 ${
                    isOwned
                      ? 'bg-white border-slate-200/90 hover:border-sky-300 shadow-2xs'
                      : 'bg-slate-50 border-dashed border-slate-200 opacity-40 grayscale'
                  }`}
                  title={`${item.label.en} (${isOwned ? 'In wardrobe' : 'Unchecked'})`}
                >
                  <ClothingImageOrIcon
                    id={item.id}
                    name={item.label.en}
                    iconName={item.id}
                    className="w-10 h-10 bg-white border border-slate-100 shadow-2xs group-hover:scale-105 transition-transform"
                    iconClassName="w-5 h-5"
                  />
                  <span className="text-[9px] font-bold text-slate-700 leading-tight line-clamp-1 w-full mt-1">
                    {item.label.en}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 2: THERMOREGULATION PROFILE */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Thermoregulation Profile</span>
          </h2>
          <p className="text-xs text-slate-500">
            Customize according to your child's movement style, sweat tendency, and sensitivities
          </p>
        </div>

        {/* 1. Activity Level (Runner vs Lounger) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Movement & Activity Style
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              {
                id: 'high_energy' as ActivityLevel,
                title: 'High-Energy Runner',
                desc: 'Constantly running, climbing, jumping. Generates rapid metabolic heat.',
                icon: Zap,
                color: 'text-amber-600',
              },
              {
                id: 'moderate' as ActivityLevel,
                title: 'Moderate / Balanced',
                desc: 'Standard active play with pauses to sit and explore.',
                icon: Baby,
                color: 'text-sky-600',
              },
              {
                id: 'calm_lounger' as ActivityLevel,
                title: 'Calm / Stroller Lounger',
                desc: 'Couch potato mode or enjoys riding quietly. Cools down faster.',
                icon: Coffee,
                color: 'text-indigo-600',
              },
            ].map((opt) => {
              const isSelected = (child.activityLevel || 'moderate') === opt.id;
              const Icon = opt.icon;

              return (
                <div
                  key={opt.id}
                  onClick={() => onUpdateChild({ activityLevel: opt.id })}
                  className={`p-3 rounded-xl border cursor-pointer transition select-none flex flex-col justify-between ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/70 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className={`w-4 h-4 ${opt.color}`} />
                    <span className="font-bold text-xs text-slate-900">{opt.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">{opt.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Temperature Tendency (Runs Hot vs Cold) */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Body Heat Tendency
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              {
                id: 'runs_hot' as TemperatureTendency,
                title: 'Runs Hot (Sweats easily)',
                desc: 'Flushed cheeks, sweaty nape, kicks off blankets. Needs breathable layers.',
                icon: Flame,
                color: 'text-rose-500',
              },
              {
                id: 'normal' as TemperatureTendency,
                title: 'Normal Temperature',
                desc: 'Comfortable with standard pediatric layer guidelines.',
                icon: Sparkles,
                color: 'text-amber-500',
              },
              {
                id: 'runs_cold' as TemperatureTendency,
                title: 'Runs Cold (Chilly easily)',
                desc: 'Prone to shivering or cold limbs. Appreciates an extra cozy fleece.',
                icon: Snowflake,
                color: 'text-blue-500',
              },
            ].map((opt) => {
              const isSelected = (child.temperatureTendency || 'normal') === opt.id;
              const Icon = opt.icon;

              return (
                <div
                  key={opt.id}
                  onClick={() => onUpdateChild({ temperatureTendency: opt.id })}
                  className={`p-3 rounded-xl border cursor-pointer transition select-none flex flex-col justify-between ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/70 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className={`w-4 h-4 ${opt.color}`} />
                    <span className="font-bold text-xs text-slate-900">{opt.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">{opt.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Special Sensitivities Checkboxes */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Special Clothing & Sensory Preferences
          </label>
          <div className="space-y-2">
            {[
              {
                id: 'sensitive_skin',
                label: 'Sensitive Skin / Eczema Prone',
                desc: 'Strict 100% organic cotton/bamboo; exclude scratchy wool or rough tags.',
              },
              {
                id: 'refuses_hats',
                label: 'Refuses to wear hats / beanies',
                desc: 'Pulls off separate beanies; suggests built-in hoods or snap collars instead.',
              },
              {
                id: 'heat_rash_prone',
                label: 'Prone to heat rash in warm weather',
                desc: 'Recommends loose-fitting gauze/muslin to keep skin dry and aired.',
              },
            ].map((trait) => {
              const isChecked = (child.specialTraits || []).includes(trait.id);

              return (
                <div
                  key={trait.id}
                  onClick={() => handleToggleSpecialTrait(trait.id)}
                  className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition select-none ${
                    isChecked
                      ? 'bg-sky-50/60 border-sky-300'
                      : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center border transition ${
                      isChecked
                        ? 'bg-sky-600 border-sky-600 text-white'
                        : 'border-slate-300 bg-white text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-slate-900 block">{trait.label}</span>
                    <span className="text-[11px] text-slate-500 leading-snug">{trait.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 3: REPEATING SCHEDULES & ONE-TIME EVENTS */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600" />
              <span>Activities & Schedules</span>
            </h2>
            <p className="text-xs text-slate-500">
              Weekly routines, alternating bi-weekly plans, and single-day events
            </p>
          </div>
          {!isAddingSchedule && (
            <button
              onClick={handleOpenAddForm}
              className="flex items-center gap-1.5 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl border border-sky-200 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Activity</span>
            </button>
          )}
        </div>

        {/* Schedule Filter Pills */}
        {schedules.length > 0 && !isAddingSchedule && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'all', label: `All (${schedules.length})` },
              {
                id: 'today',
                label: `Active Today (${schedules.filter((s) => isScheduleActiveOnDate(s, todayDate)).length})`,
              },
              {
                id: 'one_time',
                label: `Specific Days (${schedules.filter((s) => s.frequency === 'one_time').length})`,
              },
              {
                id: 'recurring',
                label: `Repeating (${schedules.filter((s) => (s.frequency || 'weekly') !== 'one_time').length})`,
              },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setScheduleFilter(f.id as any)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition whitespace-nowrap ${
                  scheduleFilter === f.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Schedule List */}
        {!isAddingSchedule && (
          <div className="space-y-2.5">
            {filteredSchedules.map((item) => {
              const isActiveToday = isScheduleActiveOnDate(item, todayDate);
              const recurrenceInfo = getScheduleRecurrenceLabel(item, todayDate);

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    item.enabled
                      ? isActiveToday
                        ? 'border-sky-400 bg-sky-50/50 shadow-xs ring-1 ring-sky-300'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                      : 'border-slate-200 bg-slate-50/70 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isActiveToday ? 'bg-sky-500 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.locationType === 'daycare' ? (
                          <School className="w-5 h-5" />
                        ) : item.locationType === 'park' ? (
                          <TreePine className="w-5 h-5" />
                        ) : item.locationType === 'beach' ? (
                          <Waves className="w-5 h-5" />
                        ) : item.locationType === 'home' ? (
                          <Home className="w-5 h-5" />
                        ) : (
                          <Car className="w-5 h-5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {item.title}
                          </span>
                          {isActiveToday && item.enabled && (
                            <span className="text-[10px] font-bold bg-sky-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                              <span>Active Today</span>
                            </span>
                          )}
                        </div>

                        {/* Time & Recurrence Details */}
                        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 mt-0.5">
                          <span className="font-mono font-bold tabular-nums text-slate-800">
                            {item.startTime} – {item.endTime}
                          </span>
                          <span>·</span>
                          <span className="text-[11px] font-semibold text-slate-600">
                            {item.locationType === 'daycare'
                              ? 'Daycare'
                              : item.locationType === 'park'
                              ? 'Park / Playground'
                              : item.locationType === 'beach'
                              ? 'Beach / Water'
                              : item.locationType === 'home'
                              ? 'Home'
                              : 'Road Trip / Travel'}
                          </span>
                          <span>·</span>
                          <span className="text-[11px] text-sky-700 font-medium flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-sky-500" />
                            {item.location || child.location || 'Local Area'}
                          </span>
                        </div>

                        {/* Recurrence Badge */}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                              item.frequency === 'one_time'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : item.frequency === 'biweekly'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {item.frequency === 'one_time' ? (
                              <CalendarCheck className="w-3 h-3 text-amber-600" />
                            ) : item.frequency === 'biweekly' ? (
                              <Repeat className="w-3 h-3 text-purple-600" />
                            ) : (
                              <CalendarDays className="w-3 h-3 text-slate-600" />
                            )}
                            <span>{recurrenceInfo.badge}</span>
                          </span>

                          <span className="text-[11px] text-slate-500 font-medium">
                            {recurrenceInfo.detail}
                          </span>
                        </div>

                        {/* Day indicator pills if recurring */}
                        {item.frequency !== 'one_time' && (
                          <div className="flex items-center gap-1 mt-1.5">
                            {DAY_NAMES.map((d, idx) => {
                              const active = item.days?.includes(idx);
                              const isToday = idx === todayDate.getDay();
                              return (
                                <span
                                  key={d}
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                    active
                                      ? isToday && isActiveToday
                                        ? 'bg-sky-600 text-white'
                                        : 'bg-slate-800 text-white'
                                      : 'bg-slate-100 text-slate-400'
                                  }`}
                                >
                                  {d}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions: Toggle, Edit, Delete */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleSchedule(item.id)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                          item.enabled
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {item.enabled ? 'On' : 'Paused'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEditSchedule(item)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
                        title="Edit activity"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSchedule(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Delete activity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredSchedules.length === 0 && (
              <div className="p-6 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
                <CalendarDays className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">
                  {scheduleFilter === 'today'
                    ? 'No activities scheduled for today.'
                    : 'No activities found in this view.'}
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddForm}
                  className="text-xs font-bold text-sky-600 hover:underline inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add a repeating or single-day plan</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ADD / EDIT SCHEDULE FORM */}
        {isAddingSchedule && (
          <form
            onSubmit={handleSaveSchedule}
            className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-300 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-sky-600" />
                <span className="text-sm font-bold text-slate-900">
                  {editingScheduleId ? 'Edit Activity / Plan' : 'Add Activity / Plan'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingSchedule(false)}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Cancel
              </button>
            </div>

            {/* Quick Templates */}
            {!editingScheduleId && (
              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                  Quick Activity Templates:
                </span>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {[
                    {
                      title: 'Daycare / Nursery',
                      type: 'daycare',
                      freq: 'weekly' as ScheduleFrequency,
                      days: [1, 2, 3, 4, 5],
                      start: '08:30',
                      end: '16:00',
                    },
                    {
                      title: 'Weekend Park Outing',
                      type: 'park',
                      freq: 'weekly' as ScheduleFrequency,
                      days: [0, 6],
                      start: '10:00',
                      end: '13:00',
                    },
                    {
                      title: 'Bi-weekly Family Visit',
                      type: 'travel_excursion',
                      freq: 'biweekly' as ScheduleFrequency,
                      days: [6],
                      start: '10:00',
                      end: '18:00',
                    },
                    {
                      title: 'Beach Trip (This Saturday)',
                      type: 'beach',
                      freq: 'one_time' as ScheduleFrequency,
                      days: [6],
                      dateOffset: 'this_saturday',
                      start: '11:00',
                      end: '16:00',
                    },
                    {
                      title: 'Pediatric Checkup',
                      type: 'travel_excursion',
                      freq: 'one_time' as ScheduleFrequency,
                      days: [todayDate.getDay()],
                      dateOffset: 'tomorrow',
                      start: '09:30',
                      end: '11:00',
                    },
                  ].map((tpl) => (
                    <button
                      key={tpl.title}
                      type="button"
                      onClick={() => {
                        setTitle(tpl.title);
                        setLocationType(tpl.type as any);
                        setFrequency(tpl.freq);
                        setDays(tpl.days);
                        setStartTime(tpl.start);
                        setEndTime(tpl.end);
                        if (tpl.dateOffset) {
                          handleSelectQuickDate(tpl.dateOffset as any);
                        }
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-200 rounded-lg hover:border-sky-400 hover:text-sky-700 whitespace-nowrap shrink-0 transition shadow-2xs"
                    >
                      {tpl.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* FREQUENCY / RECURRENCE SELECTOR (The key feature requested!) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                How often does this activity occur?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  {
                    id: 'weekly' as ScheduleFrequency,
                    label: 'Every Week',
                    desc: 'Regular recurring routine (e.g. daycare)',
                    icon: CalendarDays,
                  },
                  {
                    id: 'biweekly' as ScheduleFrequency,
                    label: 'Every Other Week',
                    desc: 'Repeats every 2 weeks (alternating)',
                    icon: Repeat,
                  },
                  {
                    id: 'one_time' as ScheduleFrequency,
                    label: 'On a Specific Day',
                    desc: 'Single date (e.g. Saturday beach trip)',
                    icon: CalendarCheck,
                  },
                ].map((f) => {
                  const isSelected = frequency === f.id;
                  const Icon = f.icon;
                  return (
                    <div
                      key={f.id}
                      onClick={() => setFrequency(f.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition select-none flex flex-col justify-between ${
                        isSelected
                          ? 'border-sky-600 bg-sky-50 shadow-2xs ring-1 ring-sky-500'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon
                          className={`w-4 h-4 ${isSelected ? 'text-sky-600' : 'text-slate-500'}`}
                        />
                        <span className="font-bold text-xs text-slate-900">{f.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">{f.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CONDITIONAL CONTROLS BASED ON FREQUENCY */}

            {/* 1. ONE-TIME SPECIFIC DAY PICKER */}
            {frequency === 'one_time' && (
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-700" />
                    <span>Select Activity Date</span>
                  </label>
                  <span className="text-[11px] font-semibold text-amber-800">
                    {parseLocalDate(specificDate).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <input
                  type="date"
                  value={specificDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSpecificDate(e.target.value);
                      const d = parseLocalDate(e.target.value);
                      setDays([d.getDay()]);
                    }
                  }}
                  className="w-full px-3 py-2 text-sm font-bold text-slate-900 rounded-xl border border-amber-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  required
                />

                {/* Quick date chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] font-bold text-amber-800">Quick pick:</span>
                  {(['today', 'tomorrow', 'this_saturday', 'next_saturday', 'next_sunday'] as const).map(
                    (key) => {
                      const opt = getQuickDateOption(key);
                      const isSelected = specificDate === opt.dateStr;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleSelectQuickDate(key)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition ${
                            isSelected
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-white text-amber-900 border-amber-200 hover:border-amber-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {/* 2. BI-WEEKLY (EVERY OTHER WEEK) SETTINGS */}
            {frequency === 'biweekly' && (
              <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-950">
                  <Repeat className="w-3.5 h-3.5 text-purple-700" />
                  <span>Alternating Week Cycle</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => setBiweeklyStartCycle('current_week')}
                    className={`p-2.5 rounded-xl border cursor-pointer transition text-center ${
                      biweeklyStartCycle === 'current_week'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-purple-200 hover:border-purple-300'
                    }`}
                  >
                    <span className="block text-xs font-bold">Active This Week</span>
                    <span className="text-[10px] opacity-90 block mt-0.5">
                      On this week, off next week
                    </span>
                  </div>

                  <div
                    onClick={() => setBiweeklyStartCycle('next_week')}
                    className={`p-2.5 rounded-xl border cursor-pointer transition text-center ${
                      biweeklyStartCycle === 'next_week'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-purple-200 hover:border-purple-300'
                    }`}
                  >
                    <span className="block text-xs font-bold">Starts Next Week</span>
                    <span className="text-[10px] opacity-90 block mt-0.5">
                      Off this week, active next week
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-purple-800 leading-snug">
                  {biweeklyStartCycle === 'current_week'
                    ? '✨ This activity will trigger during the current 7-day week, skip next week, and repeat in two weeks.'
                    : '⏳ Off for this current week. Will automatically activate next week and repeat every 2 weeks.'}
                </p>
              </div>
            )}

            {/* 3. DAYS OF WEEK (For Weekly & Bi-weekly) */}
            {frequency !== 'one_time' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    {frequency === 'biweekly' ? 'Days of the week (every 2 weeks)' : 'Days of the week'}
                  </label>
                  <div className="flex items-center gap-1.5 text-[10px] text-sky-700 font-bold">
                    <button
                      type="button"
                      onClick={() => setQuickDays('weekdays')}
                      className="hover:underline"
                    >
                      Weekdays
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => setQuickDays('weekends')}
                      className="hover:underline"
                    >
                      Weekends
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => setQuickDays('all')}
                      className="hover:underline"
                    >
                      All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {DAY_NAMES.map((name, idx) => {
                    const isSelected = days.includes(idx);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => toggleDay(idx)}
                        className={`py-2 text-xs font-bold rounded-lg border transition ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Activity Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Activity Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Daycare, Swim Lesson, Beach Trip, Family Visit"
                className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            {/* Specific Activity Location */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                  Activity Location
                </label>
                <div className="flex items-center gap-1.5">
                  {location && location !== (child.location || 'London, UK') ? (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md border border-amber-200">
                      Custom Venue
                    </span>
                  ) : (
                    <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-md border border-sky-200">
                      Child's Default
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsActivityLocModalOpen(true)}
                  className="flex-1 flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 transition group text-left cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-slate-900 truncate">
                      {location || child.location || 'London, UK'}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-sky-700 group-hover:underline px-2 py-0.5 rounded-md bg-sky-50 border border-sky-200 shrink-0 shadow-2xs">
                    Change
                  </span>
                </button>

                {location && location !== (child.location || 'London, UK') && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocation(child.location || 'London, UK');
                      setLocationCoords(child.locationCoords);
                    }}
                    title="Reset to child's primary location"
                    className="flex items-center gap-1 px-2.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline text-[11px]">Reset</span>
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                The suggestion engine uses this location to tailor clothing layers and weather protection for this venue.
              </p>
            </div>

            {/* Location Type Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Environment / Destination Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {[
                  { id: 'daycare', label: 'Daycare / School', icon: School },
                  { id: 'park', label: 'Park / Playground', icon: TreePine },
                  { id: 'beach', label: 'Beach / Water', icon: Waves },
                  { id: 'travel_excursion', label: 'Travel / Road Trip', icon: Car },
                  { id: 'home', label: 'Home / Quiet Play', icon: Home },
                ].map((loc) => {
                  const isSelected = locationType === loc.id;
                  const Icon = loc.icon;
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => setLocationType(loc.id as any)}
                      className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? 'border-sky-600 bg-sky-50 text-sky-900 font-bold'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px] leading-tight">{loc.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time inputs */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>

            {/* Form actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setIsAddingSchedule(false);
                  setEditingScheduleId(null);
                }}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{editingScheduleId ? 'Update Activity' : 'Save Activity'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* CTA: GO TO OUTFITS */}
      <button
        onClick={onGoToOutfits}
        className="w-full py-3.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-2xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
      >
        <Baby className="w-4 h-4 text-sky-400" />
        <span>View Tailored Outfits for {child.name}</span>
      </button>

      {/* Wardrobe Clothing Catalog Modal */}
      <ClothingCatalogModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        childName={child.name}
        avatarColor={child.avatarColor}
        initialAvailableIds={child.availableClothingIds}
        onSaveAvailableIds={(updatedIds) => {
          onUpdateChild({ availableClothingIds: updatedIds });
        }}
      />

      {/* Child Primary Location Search Modal */}
      <LocationSearchModal
        isOpen={isChildLocModalOpen}
        onClose={() => setIsChildLocModalOpen(false)}
        title={`Set ${child.name}'s Primary Location`}
        subtitle="Activities will inherit this location unless individually customized"
        onSelectCoordinates={(lat, lon, name) => {
          onUpdateChild({
            location: name,
            locationCoords: { lat, lon, name },
          });
        }}
      />

      {/* Activity Venue Location Search Modal */}
      <LocationSearchModal
        isOpen={isActivityLocModalOpen}
        onClose={() => setIsActivityLocModalOpen(false)}
        title="Select Activity Venue Location"
        subtitle="Choose where this activity takes place for accurate weather recommendations"
        defaultLocationName={child.location || 'London, UK'}
        onSelectDefault={() => {
          setLocation(child.location || 'London, UK');
          setLocationCoords(child.locationCoords);
        }}
        defaultButtonLabel={`Use ${child.name}'s Primary Location`}
        onSelectCoordinates={(lat, lon, name) => {
          setLocation(name);
          setLocationCoords({ lat, lon, name });
        }}
      />
    </div>
  );
};
