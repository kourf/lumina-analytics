import React, { useState, useEffect } from 'react';
import { X, Save, ShieldCheck, Check, AlertCircle } from 'lucide-react';

export const LinkedInEditModal = ({ isOpen, onClose, initialData, onSave }) => {
  const [formData, setFormData] = useState({
    name: "Karamokho DRAMÉ",
    headline: "Fondateur & Lead Designer chez Karam Agency | Webflow, Branding & Stratégie Digitale B2B",
    followersCount: 842,
    connectionsCount: "500+",
    location: "Paris, France",
    profileUrl: "https://www.linkedin.com/in/drmkaramokho",
    totalImpressions: 4620,
    profileViews: 148,
    totalReactions: 342,
    averageEngagementRate: 7.4
  });

  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.profile?.name || "Karamokho DRAMÉ",
        headline: initialData.profile?.headline || "Fondateur & Lead Designer chez Karam Agency | Webflow, Branding & Stratégie Digitale B2B",
        followersCount: initialData.profile?.followersCount || 842,
        connectionsCount: initialData.profile?.connectionsCount || "500+",
        location: initialData.profile?.location || "Paris, France",
        profileUrl: initialData.profile?.profileUrl || "https://www.linkedin.com/in/drmkaramokho",
        totalImpressions: initialData.insights?.totalImpressions || 4620,
        profileViews: initialData.insights?.profileViews || 148,
        totalReactions: initialData.insights?.totalReactions || 342,
        averageEngagementRate: initialData.insights?.averageEngagementRate || 7.4
      });
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        profile: {
          name: formData.name,
          headline: formData.headline,
          followersCount: Number(formData.followersCount) || 842,
          connectionsCount: formData.connectionsCount,
          location: formData.location,
          profileUrl: formData.profileUrl,
          profilePictureUrl: initialData?.profile?.profilePictureUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"
        },
        insights: {
          totalImpressions: Number(formData.totalImpressions) || 4620,
          profileViews: Number(formData.profileViews) || 148,
          totalReactions: Number(formData.totalReactions) || 342,
          averageEngagementRate: Number(formData.averageEngagementRate) || 7.4,
          lastSyncedAt: new Date().toISOString()
        }
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error("Erreur enregistrement LinkedIn:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#121218] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-[#0A66C2]">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Édition des Données LinkedIn Réelles
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Synchronisation directe et persistée pour @drmkaramokho
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Titre / Headline Professionnelle
            </label>
            <input
              type="text"
              value={formData.headline}
              onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0A66C2]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Abonnés Réels
              </label>
              <input
                type="number"
                value={formData.followersCount}
                onChange={(e) => setFormData({ ...formData, followersCount: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0A66C2]"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Relations (Réseau)
              </label>
              <input
                type="text"
                value={formData.connectionsCount}
                onChange={(e) => setFormData({ ...formData, connectionsCount: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0A66C2]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Impressions (7j)
              </label>
              <input
                type="number"
                value={formData.totalImpressions}
                onChange={(e) => setFormData({ ...formData, totalImpressions: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0A66C2]"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Vues Profil (7j)
              </label>
              <input
                type="number"
                value={formData.profileViews}
                onChange={(e) => setFormData({ ...formData, profileViews: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0A66C2]"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Engagement (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.averageEngagementRate}
                onChange={(e) => setFormData({ ...formData, averageEngagementRate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0A66C2]"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-[#0A66C2] hover:bg-[#084e96] text-white font-bold transition-all shadow-md flex items-center gap-2"
            >
              {success ? (
                <>
                  <Check size={16} /> Enregistré !
                </>
              ) : (
                <>
                  <Save size={16} /> Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
