import React from 'react';
import { Calendar, Users, Gem, UserPlus } from 'lucide-react';

export const TikTokRecentLives = ({ recentLives }) => {
  if (!recentLives || recentLives.length === 0) return null;

  return (
    <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface p-6 lg:p-8 rounded-[24px] border border-lumina-lightBorder dark:border-lumina-darkBorder shadow-sm relative group overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold font-headline-lg text-gray-900 dark:text-white">Dernières Diffusions</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Historique de tes récents lives</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-lumina-lightBorder dark:border-lumina-darkBorder">
              <th className="pb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">Titre & Date</th>
              <th className="pb-3 text-sm font-semibold text-gray-500 dark:text-gray-400 text-right">Durée</th>
              <th className="pb-3 text-sm font-semibold text-gray-500 dark:text-gray-400 text-right">Spectateurs</th>
              <th className="pb-3 text-sm font-semibold text-gray-500 dark:text-gray-400 text-right">Diamants</th>
              <th className="pb-3 text-sm font-semibold text-gray-500 dark:text-gray-400 text-right">Abonnés</th>
            </tr>
          </thead>
          <tbody>
            {recentLives.map((live, index) => (
              <tr 
                key={live.id} 
                className="border-b border-lumina-lightBorder dark:border-lumina-darkBorder last:border-0 hover:bg-gray-50 dark:hover:bg-[#1A1A20] transition-colors"
              >
                <td className="py-4">
                  <div className="font-bold text-gray-900 dark:text-white">{live.title}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Calendar size={12} />
                    {new Date(live.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </div>
                </td>
                <td className="py-4 text-right">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{live.durationMins} min</span>
                </td>
                <td className="py-4 text-right">
                  <div className="flex items-center justify-end gap-1 font-medium text-gray-900 dark:text-white">
                    {live.viewersUnique.toLocaleString('fr-FR')}
                    <Users size={14} className="text-gray-400" />
                  </div>
                </td>
                <td className="py-4 text-right">
                  <div className="flex items-center justify-end gap-1 font-bold text-[#fe0979]">
                    {live.diamonds.toLocaleString('fr-FR')}
                    <Gem size={14} />
                  </div>
                </td>
                <td className="py-4 text-right">
                  <div className="flex items-center justify-end gap-1 font-bold text-emerald-500">
                    +{live.newFollowers}
                    <UserPlus size={14} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
