import React from 'react';
import { motion } from 'motion/react';
import { User, Shield, Gavel } from 'lucide-react';

interface RoleSelectionProps {
  onSelectRole: (role: 'plaintiff' | 'defendant' | 'judge') => void;
}

export const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelectRole }) => {
  const roles = [
    {
      id: 'plaintiff',
      title: 'Plaintiff',
      description: 'The party initiating the legal action.',
      icon: <User className="w-12 h-12 text-slate-400" />,
      color: 'border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30',
    },
    {
      id: 'defendant',
      title: 'Defendant',
      description: 'The party responding to the legal action.',
      icon: <Shield className="w-12 h-12 text-slate-400" />,
      color: 'border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30',
    },
    {
      id: 'judge',
      title: 'Judge',
      description: 'The judicial officer presiding over the case.',
      icon: <Gavel className="w-12 h-12 text-indigo-600" />,
      color: 'border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-light text-slate-900 mb-2 tracking-tight">LEGAL REVIEW PLATFORM</h1>
        <p className="text-slate-500 uppercase tracking-widest text-sm">Case Management Protocol</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        {roles.map((role) => (
          <motion.button
            key={role.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectRole(role.id as any)}
            className={`flex flex-col items-center p-8 rounded-xl border-2 transition-all cursor-pointer text-left h-full ${role.color}`}
          >
            <div className="mb-6">{role.icon}</div>
            <h2 className="text-xl font-medium text-slate-900 mb-2">{role.title}</h2>
            <p className="text-slate-500 text-sm leading-relaxed text-center">
              {role.description}
            </p>
            <div className="mt-auto pt-6">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-tighter">Enter Dashboard</span>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="mt-12 text-slate-400 text-xs">
        <p>© 2026 Legal Review Protocol • Low-Fidelity Prototype</p>
      </div>
    </div>
  );
};
