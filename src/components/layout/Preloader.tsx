import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Preloader = () => {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const stages = [
    "/ launching_yellowmeter_os",
    "/ sequence_initiated",
    "/ loading_state_channels"
  ];

  useEffect(() => {
    const duration = 3000; // 3 seconds total
    const interval = 30;
    const increment = 100 / (duration / interval);
    
    const timer = setInterval(() => {
      setProgress(prev => {
        const next = Math.min(prev + increment, 100);
        
        // Update stage based on progress
        if (next >= 33 && stage === 0) setStage(1);
        if (next >= 66 && stage === 1) setStage(2);
        
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => setIsComplete(true), 500);
        }
        
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [stage]);

  if (isComplete) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'linear-gradient(180deg, #050611 0%, #07090f 45%, #050611 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--mono)',
        }}
      >
        {/* TOP TEXT */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            fontSize: '0.75rem',
            letterSpacing: '0.15em',
            color: 'rgba(255, 230, 0, 0.5)',
            textTransform: 'uppercase',
            marginBottom: '40px'
          }}
        >
          YellowMeter OS
        </motion.div>

        {/* PROGRESS BAR */}
        <div style={{
          width: '300px',
          height: '2px',
          background: 'rgba(255, 230, 0, 0.1)',
          position: 'relative',
          marginBottom: '20px'
        }}>
          <motion.div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              background: 'linear-gradient(90deg, rgba(255, 230, 0, 0.6), var(--yellow))',
              boxShadow: '0 0 10px rgba(255, 230, 0, 0.5)',
            }}
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
          />
        </div>

        {/* PERCENTAGE */}
        <motion.div
          style={{
            fontSize: '2.5rem',
            color: '#fff',
            fontWeight: 'bold',
            letterSpacing: '0.05em',
            marginBottom: '30px'
          }}
        >
          {Math.floor(progress)}%
        </motion.div>

        {/* STAGE TEXT */}
        <motion.div
          key={stage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          style={{
            fontSize: '0.9rem',
            color: 'rgba(255, 230, 0, 0.8)',
            letterSpacing: '0.05em',
            textAlign: 'center'
          }}
        >
          {stages[stage]}
        </motion.div>

        {/* BOTTOM DECORATION */}
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            position: 'absolute',
            bottom: '40px',
            fontSize: '0.7rem',
            color: 'rgba(255, 230, 0, 0.4)',
            letterSpacing: '0.2em'
          }}
        >
          _LOADING
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
