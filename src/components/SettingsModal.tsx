import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Volume2, VolumeX, LayoutDashboard, BarChart3, Calendar,
    Trophy, Clock, Pin, PinOff, Settings, CheckCircle2, ChevronRight
} from 'lucide-react';
import type { AppSettings } from '../types';
import type { ViewMode } from '../hooks/useAppState';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings;
    onUpdateSettings: (settings: AppSettings) => void;
    onNavigate: (mode: ViewMode) => void;
    onOpenAchievements: () => void;
    onOpenHistory: () => void;
    isPinned: boolean;
    togglePin: () => void;
    currentView: ViewMode;
    // NEW: Audio
    toggleAmbient: (enabled: boolean) => void;
    isAmbientPlaying: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    settings,
    onUpdateSettings,
    onNavigate,
    onOpenAchievements,
    onOpenHistory,
    isPinned,
    togglePin,
    currentView,
    toggleAmbient,
    isAmbientPlaying
}) => {
    if (!isOpen) return null;

    const handleNavigate = (mode: ViewMode) => {
        onNavigate(mode);
        onClose();
    };

    const handleAction = (action: () => void) => {
        action();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#161b22] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl relative z-10 overflow-hidden"
            >
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-white/5 bg-white/5">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Settings className="text-primary" size={24} />
                        Меню
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full text-secondary transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-2 space-y-1">
                    {/* Navigation Section */}
                    <div className="p-3">
                        <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 px-2">
                            Навигация
                        </h3>
                        <div className="space-y-1">
                            <button
                                onClick={() => handleNavigate('analytics')}
                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${currentView === 'analytics' ? 'bg-primary/20 text-white' : 'hover:bg-white/5 text-gray-300'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${currentView === 'analytics' ? 'bg-primary/20 text-primary' : 'bg-white/5 text-gray-400'}`}>
                                        <BarChart3 size={18} />
                                    </div>
                                    <span className="font-medium">Аналитика</span>
                                </div>
                                {currentView === 'analytics' && <CheckCircle2 size={16} className="text-primary" />}
                            </button>

                            <button
                                onClick={() => handleNavigate('review')}
                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${currentView === 'review' ? 'bg-purple-500/20 text-white' : 'hover:bg-white/5 text-gray-300'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${currentView === 'review' ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-400'}`}>
                                        <Calendar size={18} />
                                    </div>
                                    <span className="font-medium">Итоги недели</span>
                                </div>
                                {currentView === 'review' && <CheckCircle2 size={16} className="text-purple-400" />}
                            </button>
                        </div>
                    </div>

                    <div className="h-px bg-white/5 mx-4" />

                    {/* Tools Section */}
                    <div className="p-3">
                        <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 px-2">
                            Инструменты
                        </h3>
                        <div className="space-y-1">
                            <button
                                onClick={() => handleAction(onOpenAchievements)}
                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-gray-300 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500 group-hover:bg-yellow-500/20">
                                        <Trophy size={18} />
                                    </div>
                                    <span className="font-medium">Достижения</span>
                                </div>
                                <ChevronRight size={16} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                            </button>

                            <button
                                onClick={() => handleAction(onOpenHistory)}
                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-gray-300 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20">
                                        <Clock size={18} />
                                    </div>
                                    <span className="font-medium">История</span>
                                </div>
                                <ChevronRight size={16} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                            </button>

                            <button
                                onClick={togglePin}
                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-gray-300 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isPinned ? 'bg-primary/20 text-primary' : 'bg-white/5 text-gray-400'}`}>
                                        {isPinned ? <PinOff size={18} /> : <Pin size={18} />}
                                    </div>
                                    <div className="text-left">
                                        <span className="font-medium block">Поверх окон</span>
                                        <span className="text-xs text-secondary opacity-70">
                                            {isPinned ? 'Окно закреплено' : 'Окно не закреплено'}
                                        </span>
                                    </div>
                                </div>
                                <div className={`w-10 h-5 rounded-full relative transition-colors ${isPinned ? 'bg-primary' : 'bg-white/10'}`}>
                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isPinned ? 'left-6' : 'left-1'}`} />
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="h-px bg-white/5 mx-4" />

                    {/* Preferences Section */}
                    <div className="p-3">
                        <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 px-2">
                            Настройки
                        </h3>
                        <div className="space-y-1">
                            <button
                                onClick={() => onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-gray-300 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${settings.soundEnabled ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {settings.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                                    </div>
                                    <div className="text-left">
                                        <span className="font-medium block">Звуки</span>
                                        <span className="text-xs text-secondary opacity-70">
                                            {settings.soundEnabled ? 'Включены' : 'Выключены'}
                                        </span>
                                    </div>
                                </div>
                                <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.soundEnabled ? 'bg-primary' : 'bg-white/10'}`}>
                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${settings.soundEnabled ? 'left-6' : 'left-1'}`} />
                                </div>
                            </button>

                            <button
                                onClick={() => toggleAmbient(!isAmbientPlaying)}
                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-gray-300 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isAmbientPlaying ? 'bg-indigo-500/10 text-indigo-500' : 'bg-white/5 text-gray-400'}`}>
                                        <Volume2 size={18} className={isAmbientPlaying ? 'animate-pulse' : ''} />
                                    </div>
                                    <div className="text-left">
                                        <span className="font-medium block">Фоновый шум</span>
                                        <span className="text-xs text-secondary opacity-70">
                                            {isAmbientPlaying ? 'Коричневый шум ВКЛ' : 'Выкл'}
                                        </span>
                                    </div>
                                </div>
                                <div className={`w-10 h-5 rounded-full relative transition-colors ${isAmbientPlaying ? 'bg-primary' : 'bg-white/10'}`}>
                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isAmbientPlaying ? 'left-6' : 'left-1'}`} />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-white/5 text-center">
                    <p className="text-xs text-secondary opacity-50">
                        Сам Себе DMCA v0.4.0
                    </p>
                </div>
            </motion.div>
        </div>
    );
};
