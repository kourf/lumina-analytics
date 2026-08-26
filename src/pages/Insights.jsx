import React from 'react';
import { MOCK_DATA } from '../data/mockData';
import { Sparkles, Target, ArrowUpRight, AlertCircle, Zap } from 'lucide-react';

export const Insights = ({ data }) => {
  const insights = data ? data.insights : MOCK_DATA.insights;

  if (!insights) return null;

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-24">
      
      <section className="text-center py-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 mb-4 shadow-sm border border-indigo-200 dark:border-indigo-800">
          <Sparkles size={32} />
        </div>
        <h2 className="text-2xl font-headline-lg font-bold text-gray-900 dark:text-white">Assistant IA</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Ton manager virtuel qui analyse tes réseaux et te conseille.</p>
      </section>

      {/* Score Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-3xl p-6 shadow-lg shadow-indigo-500/20 relative overflow-hidden flex items-center justify-between">
        <div className="relative z-10">
          <p className="text-indigo-100 text-sm font-semibold mb-1 uppercase tracking-wider">Score de performance</p>
          <div className="flex items-baseline gap-1">
            <span className="text-6xl font-display-kpi font-bold tracking-tight">{insights.globalScore}</span>
            <span className="text-2xl font-bold opacity-70">/10</span>
          </div>
        </div>
        <div className="relative z-10 w-24 h-24 rounded-full border-4 border-white/20 flex items-center justify-center bg-white/5 backdrop-blur-sm">
          <Zap size={40} className="text-yellow-300" />
        </div>
        {/* Background glow */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Priority Actions */}
      <section>
        <h3 className="font-bold flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
          <Target className="text-red-500" size={20} />
          Actions Prioritaires
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {insights.priorityActions.map((action, i) => (
            <div key={i} className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-2xl p-4 flex gap-4 shadow-sm">
              <span className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-xs shadow-md">
                {i + 1}
              </span>
              <p className="text-[15px] font-medium text-red-900 dark:text-red-200 leading-relaxed">{action}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="bg-green-50 dark:bg-green-900/20 rounded-3xl p-6 border border-green-100 dark:border-green-900/50">
          <h3 className="font-bold flex items-center gap-2 mb-4 text-green-700 dark:text-green-400">
            <ArrowUpRight size={20} />
            Points Forts
          </h3>
          <ul className="space-y-3">
            {insights.strengths.map((s, i) => (
              <li key={i} className="text-sm text-green-900 dark:text-green-200 flex gap-3 leading-relaxed">
                <span className="text-green-600 dark:text-green-400 font-bold">•</span> {s}
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-gray-50 dark:bg-gray-800/50 rounded-3xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-bold flex items-center gap-2 mb-4 text-gray-700 dark:text-gray-300">
            <AlertCircle size={20} />
            Points à Améliorer
          </h3>
          <ul className="space-y-3">
            {insights.weaknesses.map((w, i) => (
              <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex gap-3 leading-relaxed">
                <span className="text-gray-400 dark:text-gray-500 font-bold">•</span> {w}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Opportunities */}
      <section className="bg-lumina-lightSurface dark:bg-lumina-darkSurface hover:-translate-y-1 hover:shadow-lg hover:shadow-lumina-primary/10 transition-all duration-300 rounded-3xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-lumina-lightBorder dark:border-lumina-darkBorder">
        <h3 className="font-bold flex items-center gap-2 mb-5 text-gray-900 dark:text-white">
          <Sparkles className="text-indigo-600 dark:text-indigo-400" size={20} />
          Opportunités de Croissance
        </h3>
        <ul className="space-y-4">
          {insights.opportunities.map((opp, i) => (
            <li key={i} className="flex gap-4">
              <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-2 flex-shrink-0"></div>
              <p className="text-[15px] text-gray-600 dark:text-gray-300 leading-relaxed">{opp}</p>
            </li>
          ))}
        </ul>
      </section>

    </div>
  );
};

