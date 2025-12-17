import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, Timer, Target, TrendingUp } from 'lucide-react';
import type { FocusSession, Client } from '../types';

interface FocusSessionTrackerProps {
  clients: Client[];
  onSessionStart: (session: Omit<FocusSession, 'id' | 'duration'>) => void;
  onSessionEnd: (sessionId: number, wasCompleted: boolean) => void;
  className?: string;
}

export const FocusSessionTracker: React.FC<FocusSessionTrackerProps> = ({
  clients,
  onSessionStart,
  onSessionEnd,
  className = ''
}) => {
  const [isActive, setIsActive] = useState(false);
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!selectedClientId) return;
    
    const session: Omit<FocusSession, 'id' | 'duration'> = {
      clientId: selectedClientId,
      taskId: selectedTaskId || undefined,
      startTime: Date.now(),
      endTime: undefined,
      wasCompleted: false
    };
    
    onSessionStart(session);
    setIsActive(true);
  };

  const handleStop = () => {
    if (!currentSession) return;
    
    const duration = elapsedTime;
    onSessionEnd(currentSession.id, false);
    setIsActive(false);
    setCurrentSession(null);
    setElapsedTime(0);
  };

  const handleComplete = () => {
    if (!currentSession) return;
    
    onSessionEnd(currentSession.id, true);
    setIsActive(false);
    setCurrentSession(null);
    setElapsedTime(0);
  };

  const selectedClient = selectedClientId ? clients.find(c => c.id === selectedClientId) : null;
  const availableTasks = selectedClient?.tasks.filter(t => !t.isDone) || [];

  return (
    <div className={`glass p-6 rounded-2xl border border-white/5 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center">
          <Timer className="text-accent" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Фокус-сессия</h3>
          <p className="text-sm text-secondary">Отслеживайте время в фокусе</p>
        </div>
      </div>

      {!isActive ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Выберите проект
            </label>
            <select
              value={selectedClientId || ''}
              onChange={(e) => {
                setSelectedClientId(e.target.value ? Number(e.target.value) : null);
                setSelectedTaskId(null);
              }}
              className="w-full bg-bg/50 text-white px-4 py-3 rounded-xl border border-white/10 focus:border-primary/50 outline-none"
            >
              <option value="">Выберите проект...</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          {selectedClientId && availableTasks.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Выберите задачу (опционально)
              </label>
              <select
                value={selectedTaskId || ''}
                onChange={(e) => setSelectedTaskId(e.target.value ? Number(e.target.value) : null)}
                className="w-full bg-bg/50 text-white px-4 py-3 rounded-xl border border-white/10 focus:border-primary/50 outline-none"
              >
                <option value="">Свободная сессия</option>
                {availableTasks.map(task => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={!selectedClientId}
            className="w-full bg-accent hover:bg-accent/90 text-white py-4 rounded-xl font-semibold transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Play size={20} />
            Начать фокус-сессию
          </button>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="space-y-2">
            <div className="text-4xl font-mono font-bold text-white">
              {formatTime(elapsedTime)}
            </div>
            <div className="text-secondary">
              {selectedClient?.name}
              {selectedTaskId && ` • ${availableTasks.find(t => t.id === selectedTaskId)?.title}`}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleStop}
              className="flex-1 bg-error/20 hover:bg-error text-error py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              <Square size={18} />
              Остановить
            </button>
            <button
              onClick={handleComplete}
              className="flex-1 bg-success/20 hover:bg-success text-success py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              <Target size={18} />
              Завершить задачу
            </button>
          </div>

          <div className="text-xs text-secondary">
            Сессия активна • Фокус-режим
          </div>
        </motion.div>
      )}

      {/* Полезная статистика */}
      <div className="mt-6 pt-6 border-t border-white/5">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-white">
              {Math.floor(elapsedTime / 60)}
            </div>
            <div className="text-xs text-secondary">минут сегодня</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-white">
              {clients.reduce((acc, client) => acc + client.tasks.filter(t => t.isDone).length, 0)}
            </div>
            <div className="text-xs text-secondary">задач выполнено</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-white">
              {Math.round((elapsedTime / 60) / Math.max(1, clients.reduce((acc, client) => acc + client.tasks.filter(t => t.isDone).length, 0)) * 10) / 10}
            </div>
            <div className="text-xs text-secondary">мин/задача</div>
          </div>
        </div>
      </div>
    </div>
  );
};