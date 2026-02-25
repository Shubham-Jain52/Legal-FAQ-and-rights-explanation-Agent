import React, { useState } from 'react';
import { RoleSelection } from './components/RoleSelection';
import { PartyDashboard } from './components/PartyDashboard';
import { JudgeDashboard } from './components/JudgeDashboard';
import { AnimatePresence, motion } from 'motion/react';

type Role = 'plaintiff' | 'defendant' | 'judge' | null;

export default function App() {
  const [currentRole, setCurrentRole] = useState<Role>(null);

  const handleSelectRole = (role: Role) => {
    setCurrentRole(role);
  };

  const handleBack = () => {
    setCurrentRole(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AnimatePresence mode="wait">
        {!currentRole ? (
          <motion.div
            key="selection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <RoleSelection onSelectRole={handleSelectRole} />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full"
          >
            {currentRole === 'judge' ? (
              <JudgeDashboard onBack={handleBack} />
            ) : (
              <PartyDashboard 
                role={currentRole as 'plaintiff' | 'defendant'} 
                onBack={handleBack} 
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
