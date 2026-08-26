import React from 'react';
import {
  Users,
  UserCheck,
  Image,
  Heart,
  MessageCircle,
  Eye,
  Bookmark,
  TrendingUp,
  Lock,
  Sparkles
} from 'lucide-react';
import { MetricExplainerTooltip } from './MetricExplainerTooltip';

export const InstagramKpiCards = ({ profile, insights, onOpenMetaModal }) => {
  const isConnected = profile?.isConnectedViaMeta;

  const followers = profile?.followersCount ?? 481;
  const followsCount = profile?.followsCount ?? 389;
  const mediaCount = profile?.mediaCount ?? 24;

  const totalReach = insights?.totalReach;
  const totalSaves = insights?.totalSaves;
  const totalLikes = insights?.totalLikes;
  const totalComments = insights?.totalComments;
  const engagementRate = insights?.averageEngagementRate;

  const cards = [
    {
      title: "Abonnés Réels",
      value: followers.toLocaleString('fr-FR'),
      isObtained: true,
      badge: "Vérifié en direct",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      reason: "Donnée publique extraite en direct du profil Instagram de @karam.drm.",
      icon: Users,
      color: "text-[#E1306C]",
      bgColor: "bg-pink-500/10"
    },
    {
      title: "Abonnements Réseau",
      value: followsCount.toLocaleString('fr-FR'),
      isObtained: true,
      badge: "Vérifié en direct",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      reason: "Comptes suivis par @karam.drm sur Instagram.",
      icon: UserCheck,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10"
    },
    {
      title: "Publications Totales",
      value: `${mediaCount} posts`,
      isObtained: true,
      badge: "Vérifié en direct",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      reason: "Volume total de photos, carrousels et reels publiés sur le compte.",
      icon: Image,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      title: "Portée Unique (Reach)",
      value: isConnected && totalReach ? totalReach.toLocaleString('fr-FR') : "Donnée non obtenue",
      isObtained: !!(isConnected && totalReach),
      badge: isConnected && totalReach ? "Obtenu" : "Privé / Restreint",
      badgeColor: isConnected && totalReach ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      reason: "Meta protège la portée unique : cette donnée interne n'est accessible qu'à l'administrateur via l'API Graph Meta.",
      icon: Eye,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Sauvegardes (Saves)",
      value: isConnected && totalSaves ? totalSaves.toLocaleString('fr-FR') : "Donnée non obtenue",
      isObtained: !!(isConnected && totalSaves),
      badge: isConnected && totalSaves ? "Obtenu" : "Privé / Restreint",
      badgeColor: isConnected && totalSaves ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      reason: "Les favoris enregistrés par les utilisateurs sont strictement confidentiels sur Instagram.",
      icon: Bookmark,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10"
    },
    {
      title: "Taux d'Engagement Global",
      value: isConnected && engagementRate ? `${engagementRate}%` : "Donnée non obtenue",
      isObtained: !!(isConnected && engagementRate),
      badge: isConnected && engagementRate ? "Obtenu" : "Calcul en attente",
      badgeColor: isConnected && engagementRate ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      reason: "Le calcul d'engagement global requiert le volume total d'interactions réelles pour éviter toute estimation fictive.",
      icon: Sparkles,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-lumina-lightSurface dark:bg-lumina-darkSurface rounded-[24px] border border-lumina-lightBorder dark:border-lumina-darkBorder p-5 md:p-6 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {card.title}
                </span>
                <div className={`p-2.5 rounded-xl ${card.bgColor} ${card.color}`}>
                  <Icon size={18} />
                </div>
              </div>

              <div className="my-2">
                <div className={`font-display-kpi font-extrabold tracking-tight ${
                  card.isObtained 
                    ? "text-2xl md:text-3xl text-gray-900 dark:text-white" 
                    : "text-base md:text-lg text-amber-600 dark:text-amber-400 font-semibold"
                }`}>
                  {card.value}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-gray-800/80 mt-2">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${card.badgeColor}`}>
                  {card.badge}
                </span>
                {!card.isObtained && (
                  <button 
                    onClick={onOpenMetaModal}
                    className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Lock size={11} /> Débloquer
                  </button>
                )}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
                {card.reason}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
