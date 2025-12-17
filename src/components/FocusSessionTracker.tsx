import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square } from 'lucide-react';
import { FocusSession } from '../types';

interface FocusSessionTrackerProps {
  currentClient: { id: string; name: string };
  activeTask?: { id: string; title: string };
  onSessionUpdate: (session: FocusSession) => void;
}

export const FocusSessionTracker: React.FC<FocusSessionTrackerProps> = ({
  currentClient,
  activeTask,
  onSessionUpdate,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
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

  const startSession = () => {
    setIsActive(true);
    setElapsedTime(0);
  };

  const pauseSession = () => {
    setIsActive(false);
  };

  const stopSession = () => {
    setIsActive(false);
    
    const session: Omit<FocusSession, 'id' | 'duration'> = {
      clientId: currentClient.id,
      taskId: activeTask?.id ?? undefined,
      startTime: Date.now() - elapsedTime * 1000,
      endTime: Date.now(),
      wasCompleted: elapsedTime >= 25 * 60 // 25 минут
    };

    onSessionUpdate({
      ...session,
      id: Date.now().toString(),
      duration: elapsedTime
    });

    setElapsedTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Фокус сессия</h3>
        <div className="text-sm text-gray-600">
          {currentClient.name}
          {activeTask && ` • ${activeTask.title}`}
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="text-4xl font-mono font-bold text-gray-900 mb-2">
          {formatTime(elapsedTime)}
        </div>
        <div className="text-sm text-gray-500">
          {activeTask ? `Задача: ${activeTask.title}` : 'Без задачи'}
        </div>
      </div>

      <div className="flex justify-center space-x-3">
        {!isActive ? (
          <button
            onClick={startSession}
            disabled={!currentClient.id}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Play className="w-4 h-4 mr-2" />
            Начать
          </button>
        ) : (
          <button
            onClick={pauseSession}
            className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
          >
            <Pause className="w-4 h-4 mr-2" />
            Пауза
          </button>
        )}

        <button
          onClick={stopSession}
          disabled={!isActive && elapsedTime === 0}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <Square className="w-4 h-4 mr-2" />
          Стоп
        </button>
      </div>

      {isActive && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-sm text-blue-700">Сессия активна</span>
          </div>
        </div>
      )}
    </div>
  );
};