import React, { useState, useEffect } from 'react';
import { X, Calendar, Plus, Trash2, Check, Sparkles, User, Users, CheckCircle2, Shirt, CheckSquare, MapPin } from 'lucide-react';
import { ChildProfile, ChildAgeCalculation } from '../types/child';
import { calculateChildAge, getBirthDateForMonthsAgo, getBirthDateForDaysAgo } from '../utils/dateAndAge';
import { ClothingCatalogModal } from './ClothingCatalogModal';
import { ClothingImageOrIcon } from './ClothingImageOrIcon';
import { LocationSearchModal } from './LocationSearchModal';
import { getChildAvailableClothingIds } from '../utils/clothingCatalog';

interface ChildProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: ChildProfile[];
  activeChildId: string;
  onSelectChild: (id: string) => void;
  onSaveProfile: (profile: ChildProfile) => void;
  onDeleteProfile: (id: string) => void;
}

const AVATAR_COLORS = [
  { id: 'sky', bg: 'bg-sky-500', label: 'Sky Blue' },
  { id: 'emerald', bg: 'bg-emerald-500', label: 'Emerald' },
  { id: 'violet', bg: 'bg-purple-500', label: 'Violet' },
  { id: 'amber', bg: 'bg-amber-500', label: 'Amber' },
  { id: 'rose', bg: 'bg-rose-500', label: 'Rose' },
];


export const ChildProfileModal: React.FC<ChildProfileModalProps> = ({
  isOpen,
  onClose,
  profiles,
  activeChildId,
  onSelectChild,
  onSaveProfile,
  onDeleteProfile,
}) => {
  // Find current active child
  const currentChild = profiles.find((p) => p.id === activeChildId) || profiles[0];

  const [activeTab, setActiveTab] = useState<'edit' | 'list'>('edit');
  const [targetId, setTargetId] = useState<string>(currentChild?.id || 'default-child-1');
  const [formName, setFormName] = useState<string>(currentChild?.name || 'My Child');
  const [formBirthDate, setFormBirthDate] = useState<string>(currentChild?.birthDate || getBirthDateForMonthsAgo(10));
  const [formLocation, setFormLocation] = useState<string>(currentChild?.location || 'London, UK');
  const [formLocationCoords, setFormLocationCoords] = useState<{ lat: number; lon: number; name: string } | undefined>(
    currentChild?.locationCoords
  );
  const [formColor, setFormColor] = useState<string>(currentChild?.avatarColor || 'sky');
  const [formNotes, setFormNotes] = useState<string>(currentChild?.notes || '');
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isLocModalOpen, setIsLocModalOpen] = useState(false);

  // Sync form when modal opens or activeChild changes
  useEffect(() => {
    if (isOpen && currentChild) {
      setTargetId(currentChild.id);
      setFormName(currentChild.name);
      setFormBirthDate(currentChild.birthDate);
      setFormLocation(currentChild.location || 'London, UK');
      setFormLocationCoords(currentChild.locationCoords);
      setFormColor(currentChild.avatarColor || 'sky');
      setFormNotes(currentChild.notes || '');
      setActiveTab('edit');
    }
  }, [isOpen, activeChildId, currentChild]);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  // Live preview of deduced age
  const previewAge: ChildAgeCalculation = calculateChildAge(formBirthDate);

  const handleStartAddChild = () => {
    const newId = `child-${Date.now()}`;
    setTargetId(newId);
    setFormName('Baby');
    setFormBirthDate(getBirthDateForMonthsAgo(3));
    setFormLocation('London, UK');
    setFormColor('emerald');
    setFormNotes('');
    setActiveTab('edit');
  };

  const handleSelectToEdit = (profile: ChildProfile) => {
    setTargetId(profile.id);
    setFormName(profile.name);
    setFormBirthDate(profile.birthDate);
    setFormLocation(profile.location || 'London, UK');
    setFormColor(profile.avatarColor || 'sky');
    setFormNotes(profile.notes || '');
    onSelectChild(profile.id);
    setActiveTab('edit');
  };

  const handleSaveAndApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formBirthDate) return;

    const trimmedName = formName.trim() || 'My Child';
    const existing = profiles.find((p) => p.id === targetId);

    const updatedProfile: ChildProfile = {
      ...existing,
      id: targetId,
      name: trimmedName,
      birthDate: formBirthDate,
      location: formLocation.trim() || 'London, UK',
      avatarColor: formColor,
      notes: formNotes,
    };

    onSaveProfile(updatedProfile);
    onSelectChild(targetId);

    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
      onClose();
    }, 300);
  };

  const handleClose = () => {
    // Automatically persist any modifications to profile before closing
    if (activeTab === 'edit' && formBirthDate) {
      const trimmedName = formName.trim() || 'My Child';
      const existing = profiles.find((p) => p.id === targetId);

      const updatedProfile: ChildProfile = {
        ...existing,
        id: targetId,
        name: trimmedName,
        birthDate: formBirthDate,
        location: formLocation.trim() || 'London, UK',
        avatarColor: formColor,
        notes: formNotes,
      };

      onSaveProfile(updatedProfile);
      onSelectChild(targetId);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header with Navigation Tabs */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'edit'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5 text-sky-600" />
              <span>Edit Child Details</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'edit' && formBirthDate) {
                  const trimmedName = formName.trim() || 'My Child';
                  const existing = profiles.find((p) => p.id === targetId);
                  onSaveProfile({
                    ...existing,
                    id: targetId,
                    name: trimmedName,
                    birthDate: formBirthDate,
                    avatarColor: formColor,
                    notes: formNotes,
                  });
                }
                setActiveTab('list');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Children ({profiles.length})</span>
            </button>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Save and close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* TAB 1: DIRECT EDITING FORM */}
          {activeTab === 'edit' && (
            <form onSubmit={handleSaveAndApply} className="space-y-4">
              {/* Child's Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Child's Name / Nickname
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Maya, Liam, Baby"
                  className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  required
                />
              </div>

              {/* Date of Birth Picker */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sky-600" />
                    <span>Date of Birth (DOB)</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Auto-deduces age</span>
                </div>
                <input
                  type="date"
                  max={todayStr}
                  value={formBirthDate}
                  onChange={(e) => setFormBirthDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-bold text-slate-900 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-transparent transition bg-white"
                  required
                />
              </div>

              {/* Primary Location */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-600" />
                    <span>Primary City / Location</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Default for activities</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLocModalOpen(true)}
                  className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/70 hover:bg-slate-100 transition group text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-4 h-4 text-sky-600 shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-semibold text-slate-900 truncate">
                      {formLocation || 'Select Location'}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-sky-700 group-hover:underline px-2.5 py-1 rounded-lg bg-white border border-slate-200 shrink-0 shadow-2xs">
                    Change
                  </span>
                </button>
              </div>

              {/* Deduced Age Preview Box */}
              <div className="p-3.5 bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-200 rounded-2xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Deduced Age & Stage:</span>
                  <span className="text-xs font-bold text-sky-700 bg-white px-2.5 py-0.5 rounded-full border border-sky-200 shadow-2xs">
                    {previewAge.categoryLabel}
                  </span>
                </div>
                <p className="text-lg font-extrabold text-slate-900">
                  {previewAge.formattedAge}
                </p>

                <div className="pt-2 border-t border-sky-200/60 text-[11px] text-slate-700 flex items-start gap-1.5 leading-snug">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    {previewAge.category === 'newborn'
                      ? 'Newborn stage (0-3 mo): Requires the "N+1 layer" pediatric rule due to immature heat retention.'
                      : previewAge.category === 'infant'
                      ? 'Infant stage (3-12 mo): Needs breathable base layers and quick diaper snap access.'
                      : previewAge.category === 'toddler'
                      ? 'Toddler stage (1-3 yr): High physical bursts; peelable zip layers prevent sudden sweating.'
                      : 'Preschool & Older: Durable weather gear and playground puddle protection.'}
                  </span>
                </div>
              </div>

              {/* Avatar Color */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Avatar Color</label>
                <div className="flex items-center gap-2.5">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setFormColor(c.id)}
                      className={`w-9 h-9 rounded-full ${c.bg} flex items-center justify-center transition-transform ${
                        formColor === c.id ? 'ring-3 ring-offset-2 ring-slate-900 scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                    >
                      {formColor === c.id && <Check className="w-4 h-4 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wardrobe Catalog Button */}
              <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Shirt className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block leading-tight">Wardrobe & Clothes Catalog</span>
                      <span className="text-[11px] text-slate-500">Uncheck items {formName} does not own</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCatalogModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-sky-700 bg-white hover:bg-sky-100/80 border border-sky-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Customize</span>
                  </button>
                </div>
                {/* Visual samples from catalog */}
                <div className="flex items-center gap-2 pt-1 border-t border-sky-100/80">
                  <span className="text-[10px] font-semibold text-slate-500">Catalog preview:</span>
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                    {['short_sleeve_tshirt', 'regular_long_trousers', 'breathable_sneakers', 'light_rain_jacket', 'baseball_cap'].map((previewId) => (
                      <ClothingImageOrIcon
                        key={`preview-${previewId}`}
                        id={previewId}
                        iconName={previewId}
                        className="w-7 h-7 bg-white border border-slate-200 shadow-2xs shrink-0"
                        iconClassName="w-4 h-4"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white bg-sky-600 hover:bg-sky-700 transition shadow-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save & Update Clothing Advice</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: PROFILES LIST & ADD SIBLING */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Select Active Child
                </span>
                <button
                  onClick={handleStartAddChild}
                  className="flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Sibling</span>
                </button>
              </div>

              <div className="space-y-2">
                {profiles.map((p) => {
                  const age = calculateChildAge(p.birthDate);
                  const isSelected = p.id === activeChildId;

                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        onSelectChild(p.id);
                        handleSelectToEdit(p);
                      }}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50/70 shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base text-white shrink-0 ${
                            p.avatarColor === 'emerald'
                              ? 'bg-emerald-500'
                              : p.avatarColor === 'violet'
                              ? 'bg-purple-500'
                              : p.avatarColor === 'amber'
                              ? 'bg-amber-500'
                              : p.avatarColor === 'rose'
                              ? 'bg-rose-500'
                              : 'bg-sky-500'
                          }`}
                        >
                          {p.name ? p.name[0].toUpperCase() : 'C'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm truncate">{p.name}</span>
                            {isSelected && (
                              <span className="text-[10px] bg-sky-600 text-white font-bold px-2 py-0.5 rounded-full">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-slate-700 mt-0.5">{age.formattedAge}</p>
                          <p className="text-[11px] text-slate-400">
                            DOB: {p.birthDate} · {age.categoryLabel}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectToEdit(p);
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-sky-700 bg-sky-100 hover:bg-sky-200 rounded-lg transition"
                        >
                          Edit
                        </button>
                        {profiles.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Remove profile for ${p.name}?`)) {
                                onDeleteProfile(p.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete profile"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] font-semibold">
            {showSavedToast ? (
              <span className="text-emerald-700 flex items-center gap-1 font-bold">
                ✓ Saved to child profile!
              </span>
            ) : (
              <span className="text-slate-500">
                All changes automatically saved to device
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => handleSaveAndApply()}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save & Apply</span>
          </button>
        </div>
      </div>

      {/* Wardrobe Catalog Modal */}
      <ClothingCatalogModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        childName={formName}
        avatarColor={formColor}
        initialAvailableIds={profiles.find((p) => p.id === targetId)?.availableClothingIds}
        onSaveAvailableIds={(updatedIds) => {
          const existing = profiles.find((p) => p.id === targetId);
          if (existing) {
            onSaveProfile({
              ...existing,
              availableClothingIds: updatedIds,
            });
          }
        }}
      />

      {/* Child Location Search Modal */}
      <LocationSearchModal
        isOpen={isLocModalOpen}
        onClose={() => setIsLocModalOpen(false)}
        title={`Set ${formName || 'Child'}'s Default Location`}
        subtitle="Activities will inherit this location unless individually customized"
        onSelectCoordinates={(_lat, _lon, name) => {
          setFormLocation(name);
        }}
      />
    </div>
  );
};
