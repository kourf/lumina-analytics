import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Quote, TrendingUp, Sparkles, Rocket } from 'lucide-react';
import inspirations from '../data/inspirations.json';

export const DailyInspiration = () => {
  // Sélection automatique et mathématique de la citation basée sur le jour de l'année
  const dailyQuote = useMemo(() => {
    if (!inspirations || inspirations.length === 0) return null;
    
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 0);
    // Calcul du nombre de jours écoulés depuis le début de l'année
    const diff = (today.getTime() - startOfYear.getTime()) + ((startOfYear.getTimezoneOffset() - today.getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    // Module par rapport au nombre d'inspirations dans le tableau
    const quoteIndex = dayOfYear % inspirations.length;
    return inspirations[quoteIndex];
  }, []);

  if (!dailyQuote) return null;

  // Variantes d'animation pour Framer Motion
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <motion.section 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-4xl mx-auto my-8 p-6 sm:p-8 rounded-3xl glass-panel relative overflow-hidden"
    >
      {/* Effet de lueur en arrière-plan (Tech Luxury / Glassmorphism) */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-lumina-primary/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />

      <header className="flex items-center gap-3 mb-8 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-lumina-primary/15 flex items-center justify-center border border-lumina-primary/20">
          <Quote className="w-5 h-5 text-lumina-primary" />
        </div>
        <h2 className="text-xl sm:text-2xl font-headline-md text-gray-100 tracking-tight">
          L'Inspiration du Jour
        </h2>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        
        {/* Colonne 1 : Foi & Sagesse */}
        <motion.article 
          variants={itemVariants}
          className="flex flex-col p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 hover:bg-white/[0.07] transition-colors group"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400/90">
              Sagesse
            </h3>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed italic font-body flex-grow">
            {dailyQuote.faith}
          </p>
        </motion.article>

        {/* Colonne 2 : Fait Business */}
        <motion.article 
          variants={itemVariants}
          className="flex flex-col p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/30 hover:bg-white/[0.07] transition-colors group"
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400/90">
              Histoire Business
            </h3>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed font-body flex-grow">
            {dailyQuote.businessFact}
          </p>
        </motion.article>

        {/* Colonne 3 : Action du jour */}
        <motion.article 
          variants={itemVariants}
          className="flex flex-col p-5 rounded-2xl bg-lumina-primary/5 border border-lumina-primary/20 hover:border-lumina-primary/40 hover:bg-lumina-primary/10 transition-colors group"
        >
          <div className="flex items-center gap-2 mb-3">
            <Rocket className="w-4 h-4 text-lumina-primary" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-lumina-primary/90">
              Passage à l'action
            </h3>
          </div>
          <p className="text-sm text-gray-100 font-medium leading-relaxed font-body flex-grow">
            {dailyQuote.action}
          </p>
        </motion.article>

      </div>
    </motion.section>
  );
};

export default DailyInspiration;
