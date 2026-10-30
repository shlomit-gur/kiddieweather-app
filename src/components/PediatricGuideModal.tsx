import React, { useState } from 'react';
import { X, ShieldAlert, Sparkles, AlertTriangle, Moon, Sun, Heart, CheckCircle2 } from 'lucide-react';

interface PediatricGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PediatricGuideModal: React.FC<PediatricGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'layers' | 'carseat' | 'tog' | 'neckcheck' | 'sun' | 'mosquito'>('layers');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Pediatric Dressing & Safety Guide</h2>
              <p className="text-xs text-slate-500">Evidence-based advice from pediatric thermoregulation guidelines</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab buttons */}
        <div className="flex border-b border-slate-100 px-4 bg-slate-50/70 overflow-x-auto no-scrollbar gap-1 pt-2">
          {[
            { id: 'layers', label: 'N+1 Layer Rule' },
            { id: 'carseat', label: 'Car Seat Safety' },
            { id: 'tog', label: 'Sleep TOG Guide' },
            { id: 'neckcheck', label: 'Temperature Check' },
            { id: 'sun', label: 'Sun & UV Protection' },
            { id: 'mosquito', label: '🦟 Mosquito & Bug Safety' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-sky-600 text-sky-600 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-700">
          {activeTab === 'layers' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                The Golden "N+1 Layer" Rule for Babies
              </h3>
              <p>
                Pediatricians recommend that infants under 6 months wear <strong>one more layer</strong> than an adult would comfortably wear in the same environment.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-1">Why babies need +1 layer:</span>
                  <ul className="space-y-1 list-disc list-inside text-slate-600">
                    <li>Larger body surface-to-mass ratio</li>
                    <li>Immature brown fat thermogenesis</li>
                    <li>Cannot shiver effectively to create warmth</li>
                    <li>Cannot peel off a sweater when warm</li>
                  </ul>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                  <span className="font-bold text-amber-950 block mb-1">Beware of Overheating:</span>
                  <p>
                    Overheating is a recognized risk factor for SIDS. Never add multiple heavy blankets in cribs. Layer with breathable natural cotton, bamboo, or lightweight merino wool.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'carseat' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-sm mb-1">Crucial Winter Safety Warning</h3>
                  <p className="text-xs">
                    <strong>Never</strong> buckle a child into a car seat wearing a puffy winter coat, bulky snowsuit, or sleeping bag bunting!
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900">Why puffy coats fail in collisions:</h4>
                <p>
                  Puffer jackets contain air pockets that fluff up the fabric. When you tighten the harness, it feels snug over the fluff. In a sudden crash or emergency stop, the forces instantly compress the coat flat, leaving <strong>2 to 4 inches of dangerous slack</strong> in the harness straps. The child can slip straight out.
                </p>
                <div className="pt-2 border-t border-slate-200">
                  <span className="font-bold text-emerald-800 block mb-1">The Safe Car Seat Routine:</span>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600">
                    <li>Dress child in thin, snug layers (cotton onesie + thin fleece pullover).</li>
                    <li>Buckle harness snugly until you cannot pinch webbing at their collarbone.</li>
                    <li>Drape their winter coat or a warm blanket <em>over</em> the buckled harness.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tog' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Sleep Sack TOG Rating Guide</h3>
              </div>
              <p>
                TOG (Thermal Overall Grade) measures sleeping bag insulation. Match the room temperature to avoid night chills or dangerous overheating:
              </p>

              <div className="space-y-2">
                {[
                  {
                    tog: '0.5 TOG',
                    temp: '24°C - 27°C (75°F - 81°F)',
                    desc: 'Hot weather / summer nap. Short-sleeve bodysuit or diaper only.',
                    badge: 'bg-amber-100 text-amber-800',
                  },
                  {
                    tog: '1.0 TOG',
                    temp: '21°C - 23°C (70°F - 74°F)',
                    desc: 'Mild room. Short or long-sleeve cotton bodysuit + 1.0 TOG sleep bag.',
                    badge: 'bg-emerald-100 text-emerald-800',
                  },
                  {
                    tog: '2.5 TOG',
                    temp: '18°C - 20°C (64°F - 68°F)',
                    desc: 'Ideal pediatric nursery temp. Long-sleeve onesie + footed sleeper + 2.5 TOG bag.',
                    badge: 'bg-sky-100 text-sky-800',
                  },
                  {
                    tog: '3.5 TOG',
                    temp: 'Below 18°C (Below 64°F)',
                    desc: 'Chilly room / drafty winter. Thermal base layer + fleece pyjamas + 3.5 TOG padded bag.',
                    badge: 'bg-indigo-100 text-indigo-800',
                  },
                ].map((row) => (
                  <div key={row.tog} className="p-3 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${row.badge}`}>{row.tog}</span>
                        <span className="font-semibold text-slate-900 text-xs">{row.temp}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{row.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'neckcheck' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                The "Nape of the Neck" Temperature Test
              </h3>
              <p>
                First-time parents often panic because their baby's hands or feet feel chilly. In infants, peripheral blood vessels constrict readily to conserve core heat, meaning <strong>cool hands and feet are completely normal</strong>.
              </p>

              <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 space-y-2 text-sky-950">
                <span className="font-bold block">How to accurately check your baby:</span>
                <p>
                  Slide two fingers down the back of their shirt and touch the <strong>nape of their neck or upper back</strong>:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-700">
                  <li><strong>Warm and dry:</strong> Perfect! Baby is comfortably dressed.</li>
                  <li><strong>Damp, sweaty, or hot:</strong> Overheating. Remove one layer immediately.</li>
                  <li><strong>Cold to the touch:</strong> Chilly. Add a cardigan or cozy footmuff.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'sun' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-500" />
                Sun and UV Protection Rules by Age
              </h3>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200">
                  <span className="font-bold text-amber-950 block mb-0.5">Under 6 Months Old:</span>
                  <p className="text-slate-700">
                    Infant skin is too thin and sensitive for chemical sunscreens. Keep newborns out of direct sunlight entirely. Use lightweight long sleeves, wide-brim UV hats with neck flaps, and clip-on stroller parasols.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200">
                  <span className="font-bold text-emerald-950 block mb-0.5">6 Months and Older:</span>
                  <p className="text-slate-700">
                    Apply broad-spectrum mineral sunscreen (SPF 30 to 50+) with zinc oxide or titanium dioxide 15 minutes before sun exposure. Reapply every 2 hours, especially after water play. Pair with UV-blocking sunglasses.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mosquito' && (
            <div className="space-y-3.5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>🦟</span>
                Pediatric Insect & Mosquito Repellent Guidelines
              </h3>
              <p>
                Protecting young skin from bug bites requires age-appropriate products and precise application techniques recommended by the American Academy of Pediatrics (AAP) and CDC.
              </p>

              <div className="space-y-2.5">
                {/* Under 2 months */}
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1">
                  <span className="font-bold text-xs text-rose-900 block">
                    ⛔ Under 2 Months Old: NO Chemical Repellents
                  </span>
                  <p className="text-slate-700 leading-snug">
                    Infants younger than 2 months cannot metabolize repellent chemicals through their thin, permeable skin. <strong>Do NOT use DEET, Picaridin, or essential oils.</strong>
                  </p>
                  <p className="text-slate-700 font-semibold pt-0.5">
                    Safe protection: Drape a fine breathable mesh mosquito net securely over the stroller or bassinet, and dress baby in lightweight, loose-fitting long-sleeve cotton clothing.
                  </p>
                </div>

                {/* 2 months to 3 years */}
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1">
                  <span className="font-bold text-xs text-amber-900 block">
                    👶 2 Months to 3 Years: Child DEET (≤30%) or Picaridin (20%)
                  </span>
                  <p className="text-slate-700 leading-snug">
                    Use child-formulated DEET (10% to 30%) or Picaridin (also called Icaridin / Saltidin). Higher concentrations do not work better, they just last longer.
                  </p>
                  <p className="text-amber-900 font-semibold text-[11px] pt-0.5">
                    ⚠️ DO NOT use Oil of Lemon Eucalyptus (OLE) or PMD on children under 3 years of age.
                  </p>
                </div>

                {/* 3 years and older */}
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
                  <span className="font-bold text-xs text-emerald-900 block">
                    🧒 3 Years and Older: DEET, Picaridin, or OLE
                  </span>
                  <p className="text-slate-700 leading-snug">
                    Children 3 and older can safely use DEET (10–30%), Picaridin (20%), or Oil of Lemon Eucalyptus (OLE).
                  </p>
                </div>

                {/* Application rules */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-xs text-slate-900 block">
                    Critical Application Rules for Parents:
                  </span>
                  <ul className="space-y-1 text-slate-700 list-disc list-inside">
                    <li>
                      <strong>Never spray directly onto child:</strong> Spray onto adult hands first, then rub gently onto child's exposed skin and clothing.
                    </li>
                    <li>
                      <strong>Never apply to child's hands:</strong> Young children frequently put their hands in their mouths and rub their eyes.
                    </li>
                    <li>
                      <strong>Avoid eyes, mouth, and cuts:</strong> Do not apply around the eyes or mouth, or on irritated skin or eczema patches.
                    </li>
                    <li>
                      <strong>Sunscreen first, repellent second:</strong> If using sunscreen, apply sunscreen 15 minutes before, let it absorb, and then apply insect repellent. Avoid combined sunscreen/repellent products.
                    </li>
                    <li>
                      <strong>Wash off indoors:</strong> When returning inside for the day, wash treated skin with soap and warm water, and wash treated clothing.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
