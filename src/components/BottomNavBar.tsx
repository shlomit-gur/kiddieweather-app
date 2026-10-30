import React from 'react';
import { Shirt, CalendarDays, User, BookOpen } from 'lucide-react';

export type MainTab = 'outfit' | 'forecast' | 'child' | 'guide';

interface BottomNavBarProps {
  activeTab: MainTab;
  onChangeTab: (tab: MainTab) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onChangeTab }) => {
  const tabs: { id: MainTab; label: string; icon: React.ElementType }[] = [
    { id: 'outfit', label: 'Dress Child', icon: Shirt },
    { id: 'forecast', label: 'Forecast', icon: CalendarDays },
    { id: 'child', label: 'Kid Profile', icon: User },
    { id: 'guide', label: 'Pediatric Guide', icon: BookOpen },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 transition-colors">
      <div className="max-w-md mx-auto grid grid-cols-4 items-center h-16 px-2">
        {tabs.map((t) => {
          const isSelected = activeTab === t.id;
          const Icon = t.icon;

          return (
            <button
              key={t.id}
              onClick={() => onChangeTab(t.id)}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors relative ${
                isSelected ? 'text-sky-600 font-bold' : 'text-slate-600 hover:text-slate-800 font-medium'
              }`}
            >
              <div
                className={`w-9 h-7 rounded-full flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-sky-100/90' : ''
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
