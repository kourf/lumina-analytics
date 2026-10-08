import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Delete, ShieldCheck } from 'lucide-react';

const CORRECT_PIN = "1105";
const PIN_LENGTH = 4;

export const PinScreen = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  // Phase de succès avant disparition (pour afficher le message de bienvenue)
  const [showWelcome, setShowWelcome] = useState(false);

  // Vérifier la présence d'une session déverrouillée au montage
  useEffect(() => {
    const unlocked = sessionStorage.getItem('isUnlocked') === 'true';
    if (unlocked && onUnlock) {
      onUnlock();
    }
  }, [onUnlock]);

  const handleInputDigit = useCallback((digit) => {
    if (isSuccess || showWelcome) return;

    setPin((prev) => {
      if (prev.length >= PIN_LENGTH) return prev;
      const nextPin = prev + digit;

      if (nextPin.length === PIN_LENGTH) {
        if (nextPin === CORRECT_PIN) {
          setIsError(false);
          setIsSuccess(true);
          setShowWelcome(true);
          
          // Mémoriser la session locale (onglet)
          sessionStorage.setItem('isUnlocked', 'true');
          
          // Laisser le message de bienvenue s'afficher 2 secondes avant de révéler l'app
          setTimeout(() => {
            setShowWelcome(false);
            if (onUnlock) onUnlock();
          }, 2000);
        } else {
          setIsError(true);
          // Secousse et reset
          setTimeout(() => {
            setPin('');
            setIsError(false);
          }, 600);
        }
      }
      return nextPin;
    });
  }, [isSuccess, showWelcome, onUnlock]);

  const handleDelete = useCallback(() => {
    if (isSuccess || showWelcome) return;
    setIsError(false);
    setPin((prev) => prev.slice(0, -1));
  }, [isSuccess, showWelcome]);

  const handleClear = useCallback(() => {
    if (isSuccess || showWelcome) return;
    setIsError(false);
    setPin('');
  }, [isSuccess, showWelcome]);

  // Support clavier (numérique, suppr, echap)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isSuccess || showWelcome) return;

      if (/^[0-9]$/.test(e.key)) {
        handleInputDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSuccess, showWelcome, handleInputDigit, handleDelete, handleClear]);

  // Animations Framer Motion
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { type: 'spring', damping: 25, stiffness: 260 } 
    },
    exit: { 
      opacity: 0, 
      scale: 0.85, 
      filter: 'grayscale(100%) blur(15px)',
      transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] } 
    }
  };

  const shakeVariants = {
    idle: { x: 0 },
    shake: { 
      x: [-10, 10, -10, 10, -5, 5, 0], 
      transition: { duration: 0.4 } 
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="pin-screen-overlay"
        initial={{ opacity: 0, filter: 'grayscale(0%)' }}
        animate={{ opacity: 1, filter: showWelcome ? 'grayscale(100%)' : 'grayscale(0%)' }}
        exit={{ opacity: 0, transition: { duration: 0.5, delay: 0.2 } }}
        transition={{ duration: 0.8 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl overflow-hidden"
      >
        {/* Rideau 1 : Voile de transition rapide (Circular Reveal) */}
        <motion.div
          initial={{ clipPath: 'circle(0% at 50% 60%)' }}
          animate={{ clipPath: showWelcome ? 'circle(150% at 50% 60%)' : 'circle(0% at 50% 60%)' }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          className="absolute inset-0 z-[14] bg-lumina-primary/10 backdrop-blur-lg"
        />

        {/* Rideau 2 : Le Papier Mat Sombre (Circular Reveal type NXTPAPER) */}
        <motion.div
          initial={{ clipPath: 'circle(0% at 50% 60%)' }}
          animate={{ clipPath: showWelcome ? 'circle(150% at 50% 60%)' : 'circle(0% at 50% 60%)' }}
          transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1], delay: 0.1 }}
          className="absolute inset-0 z-[15] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a1a1e] via-[#09090b] to-[#000000]"
        />

        <AnimatePresence mode="wait">
          {!showWelcome ? (
            <motion.div
              key="pin-keypad"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-[340px] px-6 relative z-10"
            >
              <div className="flex flex-col items-center">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="w-16 h-16 rounded-2xl bg-lumina-primary/10 border border-lumina-primary/20 flex items-center justify-center text-lumina-primary mb-6 shadow-inner"
                >
                  <Lock className="w-7 h-7" strokeWidth={2.5} />
                </motion.div>

                <h2 className="text-xl font-bold text-gray-100 tracking-tight mb-2">
                  Accès Protégé
                </h2>
                <p className="text-sm text-gray-400 mb-8 text-center">
                  Veuillez entrer le code confidentiel
                </p>

                {/* Indicateurs de PIN */}
                <motion.div 
                  variants={shakeVariants}
                  animate={isError ? "shake" : "idle"}
                  className="flex items-center justify-center gap-4 mb-10"
                >
                  {[0, 1, 2, 3].map((index) => {
                    const isFilled = index < pin.length;
                    return (
                      <motion.div
                        key={index}
                        initial={false}
                        animate={{
                          scale: isFilled ? 1.2 : 1,
                          backgroundColor: isError 
                            ? '#ef4444' // red-500
                            : isFilled 
                              ? '#2563eb' // blue-600
                              : 'rgba(255, 255, 255, 0.1)',
                          boxShadow: isFilled && !isError ? '0 0 12px rgba(37,99,235,0.5)' : 'none'
                        }}
                        className={`w-3.5 h-3.5 rounded-full border ${isError ? 'border-red-500' : isFilled ? 'border-blue-500' : 'border-white/20'}`}
                      />
                    );
                  })}
                </motion.div>

                {/* Pavé Numérique */}
                <div className="grid grid-cols-3 gap-4 sm:gap-5 w-full">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <motion.button
                      key={digit}
                      type="button"
                      whileHover={{ scale: 1.08, backgroundColor: 'rgba(255,255,255,0.1)' }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleInputDigit(digit)}
                      className="w-16 h-16 mx-auto rounded-full bg-white/5 border border-white/10 text-xl font-medium text-gray-200 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-lumina-primary/50"
                    >
                      {digit}
                    </motion.button>
                  ))}
                  
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleClear}
                    disabled={pin.length === 0}
                    className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-sm font-semibold text-gray-500 hover:text-gray-300 disabled:opacity-30 transition-colors focus:outline-none"
                  >
                    C
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.08, backgroundColor: 'rgba(255,255,255,0.1)' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleInputDigit('0')}
                    className="w-16 h-16 mx-auto rounded-full bg-white/5 border border-white/10 text-xl font-medium text-gray-200 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-lumina-primary/50"
                  >
                    0
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleDelete}
                    disabled={pin.length === 0}
                    className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-gray-500 hover:text-gray-300 disabled:opacity-30 transition-colors focus:outline-none"
                  >
                    <Delete className="w-5 h-5" />
                  </motion.button>
                </div>
                
                <div className="mt-8 flex items-center gap-1.5 text-[11px] text-gray-500">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Protégé par session locale</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success-message"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-center justify-center text-center px-6 relative z-20"
            >
              {/* Cercle Esquisse avec Ripple */}
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 1.2, delay: 0.4, bounce: 0.4 }}
                className="w-24 h-24 rounded-full border border-gray-600 flex items-center justify-center text-gray-300 mb-8 bg-transparent shadow-[0_0_80px_rgba(255,255,255,0.03)]"
              >
                <motion.div
                  initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Unlock className="w-10 h-10" strokeWidth={1} />
                </motion.div>
              </motion.div>

              {/* Titre avec effet d'apparition Blur, Glow et Tracking */}
              <motion.h1 
                initial={{ opacity: 0, y: 30, filter: 'blur(12px)', scale: 0.9, letterSpacing: '-0.05em' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1, letterSpacing: '0em' }}
                transition={{ duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-transparent"
                style={{ 
                  WebkitTextStroke: '1.2px #b4b4b8',
                  textShadow: '0px 10px 40px rgba(255,255,255,0.05)'
                }}
              >
                BIENVENUE DANS VOTRE ESPACE
              </motion.h1>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default PinScreen;
