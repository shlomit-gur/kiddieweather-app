import React from 'react';
import { ActivityType } from '../types/child';
import { Footprints, Baby, HeartHandshake, Car, Moon } from 'lucide-react';

interface ActivitySelectorProps {
  activeActivity: ActivityType;
  onChangeActivity: (activity: ActivityType) => void;
}

const ACTIVITIES: { id: ActivityType; label: string; icon: React.ElementType; sublabel: string }[] = [
  {
    id: 'outdoor_play',
    label: 'Playground / Active',
    sublabel: 'Active movement warms core',
    icon: Footprints,
  },
  {
    id: 'stroller_walk',
    label: 'Stroller / Pram',
    sublabel: 'Sitting still feels cooler',
    icon: Baby,
  },
  {
    id: 'carrier',
    label: 'Baby Carrier',
    sublabel: 'Chest warmth = +1 layer',
    icon: HeartHandshake,
  },
  {
    id: 'car_seat',
    label: 'Car Seat Travel',
    sublabel: 'Harness safety rules apply',
    icon: Car,
  },
  {
    id: 'nap_sleep',
    label: 'Nap / Sleep',
    sublabel: 'TOG sleep bag guide',
    icon: Moon,
  },
];

export const ActivitySelector: React.FC<ActivitySelectorProps> = ({
  activeActivity,
  onChangeActivity,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Daily Plan / Activity Mode
        </label>
        <span className="text-[11px] text-slate-400">Affects layer count</span>
      </div>

      {/* Horizontal pill scroller */}
      <div className="flex gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
        {ACTIVITIES.map((act) => {
          const isSelected = act.id === activeActivity;
          const Icon = act.icon;

          return (
            <button
              key={act.id}
              onClick={() => onChangeActivity(act.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-all border ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs scale-[1.02]'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-300' : 'text-slate-500'}`} />
              <span>{act.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
