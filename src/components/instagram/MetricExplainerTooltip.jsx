import React, { useState, useRef, useEffect } from 'react';
import { Info, HelpCircle, Calculator, Briefcase, BarChart, ChevronRight } from 'lucide-react';

export const MetricExplainerTooltip = ({
  title,
  definition,
  businessUtility,
  formula,
  benchmarks = [],
  align = 'right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef(null);

  // Fermer lors d'un clic en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-flex items-center" ref={tooltipRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => setIsOpen(true)}
        className="p-1 rounded-lg text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-colors focus:outline-none"
        aria-label={`Explication et barème de ${title}`}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          onMouseLeave={() => setIsOpen(false)}
          className={`absolute z-50 bottom-full mb-2 w-80 sm:w-96 rounded-2xl bg-white/95 dark:bg-[#121216]/95 backdrop-blur-xl border border-gray-200 dark:border-lumina-darkBorder p-4 shadow-2xl text-left animate-fade-in ${
            align === 'left' ? 'left-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-pink-500" />
              {title}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
              Guide Dirigeant
            </span>
          </div>

          <div className="mt-3 space-y-3 text-xs leading-relaxed">
            {/* Définition */}
            <div>
              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">📌 Définition</p>
              <p className="text-gray-600 dark:text-gray-400 mt-0.5">{definition}</p>
            </div>

            {/* Utilité Dirigeant / Business */}
            {businessUtility && (
              <div className="p-2.5 rounded-xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 text-blue-900 dark:text-blue-200">
                <p className="text-[11px] font-semibold flex items-center gap-1 text-blue-700 dark:text-blue-300">
                  <Briefcase className="w-3 h-3" /> Utilité Stratégique
                </p>
                <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1">{businessUtility}</p>
              </div>
            )}

            {/* Formule de calcul */}
            {formula && (
              <div className="p-2 rounded-xl bg-gray-100 dark:bg-lumina-darkElevated border border-gray-200/60 dark:border-gray-800">
                <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Calculator className="w-3 h-3 text-pink-500" /> Formule de calcul
                </p>
                <code className="text-[11px] font-mono text-pink-600 dark:text-pink-400 font-semibold block mt-0.5">
                  {formula}
                </code>
              </div>
            )}

            {/* Barème de performance */}
            {benchmarks.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-1.5">
                  <BarChart className="w-3 h-3 text-emerald-500" /> Barème de Performance
                </p>
                <div className="space-y-1">
                  {benchmarks.map((b, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] py-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${b.colorClass || 'bg-gray-400'}`} />
                        <span className="font-medium text-gray-700 dark:text-gray-300">{b.label} :</span>
                      </div>
                      <span className="font-mono text-gray-500 dark:text-gray-400">{b.range}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
