import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({ title, value, growth, prefix = '', suffix = '' }) => {
  const isPositive = growth > 0;

  return (
    <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface rounded-[24px] p-6 shadow-sm border border-lumina-lightBorder dark:border-lumina-darkBorder flex flex-col gap-2 relative overflow-hidden group hover:-translate-y-1 hover:shadow-lg hover:shadow-lumina-primary/10 transition-all duration-300">
      <div className="flex justify-between items-start mb-2 relative z-10">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide uppercase">{title}</h3>
        {growth !== undefined && (
          <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${isPositive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
            {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            <span>{Math.abs(growth)}%</span>
          </div>
        )}
      </div>
      
      <div className="text-[28px] leading-none font-bold text-gray-900 dark:text-white tracking-tight">
        {prefix}{typeof value === 'number' ? value.toLocaleString('fr-FR') : value}{suffix}
      </div>
      
      {/* Decorative gradient */}
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl"></div>
    </div>
  );
};

