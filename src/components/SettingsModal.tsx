import React from 'react';
import { motion } from 'framer-motion';
import { X, Volume2, VolumeX, Download, Github, RotateCcw } from 'lucide-react';
import type { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onToggleSound: () => void;
  onExport: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onToggleSound, onExport }) => {
  if (!isOpen) return null;

  const handleReset = () => {
    if (confirm('Сбросить все данные? Это действие нельзя отменить.')) {
      localStorage.removeItem('zen_backup_web');
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-surface border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl relative z-10"
      >
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Настройки</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-secondary transition-colors"><X size={20}/></button>
        </div>

        <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-bg/50 rounded-2xl">
                <div className="flex items-center gap-3 text-white">
                    {settings.soundEnabled ? <Volume2 className="text-primary"/> : <VolumeX className="text-secondary"/>}
                    <span className="font-medium">Звуковые эффекты</span>
                </div>
                <button 
                    onClick={onToggleSound}
                    className={`w-12 h-6 rounded-full relative transition-colors ${settings.soundEnabled ? 'bg-primary' : 'bg-white/10'}`}
                >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.soundEnabled ? 'left-7' : 'left-1'}`} />
                </button>
            </div>

            <button 
                onClick={onExport}
                className="w-full flex items-center justify-between p-4 bg-bg/50 rounded-2xl hover:bg-bg transition-colors group text-left"
            >
                <div className="flex items-center gap-3 text-white">
                    <Download className="text-success group-hover:scale-110 transition-transform"/>
                    <div>
                        <div className="font-medium">Экспорт данных</div>
                        <div className="text-xs text-secondary">Сохранить резервную копию JSON</div>
                    </div>
                </div>
            </button>

            <button 
                onClick={handleReset}
                className="w-full flex items-center justify-between p-4 bg-bg/50 rounded-2xl hover:bg-bg transition-colors group text-left border border-white/5"
            >
                <div className="flex items-center gap-3 text-white">
                    <RotateCcw className="text-warning" />
                    <div>
                        <div className="font-medium">Сбросить данные</div>
                        <div className="text-xs text-secondary">Очистить всё и перезапустить</div>
                    </div>
                </div>
            </button>
        </div>

        <div className="mt-8 text-center">
            <p className="text-xs text-secondary/40 flex justify-center items-center gap-1">
                Zen Manager v1.0.0 <Github size={10} />
            </p>
        </div>
      </motion.div>
    </div>
  );
};