/**
 * Main data orchestrator hook for ZenManager.
 * Composes domain-specific hooks for better performance and maintainability.
 * 
 * This is now a thin orchestration layer that delegates to:
 * - useClients: Client/Task CRUD
 * - useHistory: Undo/Redo
 * - useFocusSessions: Focus tracking
 * - useGamification: Points, achievements, stats
 * - useSettings: App settings
 * - useAudioEngine: Sound effects
 * - useConfetti: Visual effects
 * - useNotifications: System notifications
 */

import { useEffect, useMemo, useCallback } from 'react';
import { GamificationUtils } from '../utils';
import type { Priority, Effort, Client, Task, Achievement, DmcaProfile } from '../types';

// Domain hooks
import { useClients } from './useClients';
import { useHistory, applyHistoryChange } from './useHistory';
import { useFocusSessions } from './useFocusSessions';
import { useGamification } from './useGamification';
import { useSettings } from './useSettings';
import { useAudioEngine } from './useAudioEngine';
import { useConfetti } from './useConfetti';
import { useNotifications } from './useNotifications';

export function useZenData() {
  // --- Compose Domain Hooks ---
  const {
    clients,
    clientsRef,
    isLoaded,
    setClients,
    addClient: addClientRaw,
    removeClient: removeClientRaw,
    updateClientPriority,
    updateClientProfile,
    addTask: addTaskRaw,
    addTaskToMany,
    updateTaskTitle,
    updateTaskPriority,
    updateTaskEffort,
    updateTaskDueDate,
    addTaskComment,
    toggleTask: toggleTaskRaw,
    deleteTask: deleteTaskRaw,
    reorderTasks,
    addNote,
    deleteNote,
    updateNote,
    addAccount,
    deleteAccount,
    updateAccount,
    exportData,
  } = useClients();

  const {
    settings,
    isSettingsLoaded,
    toggleSound,
    updateSettings,
    addDmcaSite,
    removeDmcaSite,
    renameDmcaSite,
    addDmcaHosting,
    removeDmcaHosting,
    renameDmcaHosting,
  } = useSettings();

  const {
    history,
    historyIndex,
    addToHistory,
    undo: undoRaw,
    redo: redoRaw,
    canUndo,
    canRedo,
    getHistory,
  } = useHistory();

  const { focusSessions, startFocusSession, endFocusSession } = useFocusSessions(isLoaded);

  const { playSuccess, playAchievement, playAmbient, stopAmbient, isAmbientPlaying } = useAudioEngine(settings.soundEnabled);
  const { fireTaskComplete, fireAchievement } = useConfetti();
  const { sendSystemNotification } = useNotifications();

  // Gamification with achievement callback
  const onAchievementUnlocked = useCallback((achievement: Achievement) => {
    playAchievement();
    fireAchievement();
  }, [playAchievement, fireAchievement]);

  const { userProgress, newAchievement, dismissAchievement } = useGamification(
    clients,
    focusSessions,
    isLoaded,
    onAchievementUnlocked
  );

  // NOTE: Default DMCA sites initialization removed.
  // Sites now start empty and persist correctly when user adds/removes them.
  // This avoids race conditions between localStorage load and defaults.

  // --- History-Aware Actions ---
  const addClient = useCallback((name: string, priority: Priority) => {
    const newClient = addClientRaw(name, priority);
    addToHistory('client_add', `Added project "${newClient.name}"`, newClient, newClient.id);
  }, [addClientRaw, addToHistory]);

  const removeClient = useCallback((id: number) => {
    const client = removeClientRaw(id);
    if (client) {
      addToHistory('client_remove', `Removed "${client.name}"`, client, id);
    }
  }, [removeClientRaw, addToHistory]);

  const addTask = useCallback((clientId: number, title: string, priority: Priority, effort: Effort) => {
    const newTask = addTaskRaw(clientId, title, priority, effort);
    if (newTask) {
      addToHistory('task_create', `Created "${newTask.title}"`, newTask, clientId, newTask.id);
    }
  }, [addTaskRaw, addToHistory]);

  const deleteTask = useCallback((cId: number, tId: number) => {
    const task = deleteTaskRaw(cId, tId);
    if (task) {
      addToHistory('task_delete', `Deleted "${task.title}"`, task, cId, tId);
    }
  }, [deleteTaskRaw, addToHistory]);

  const toggleTask = useCallback((cId: number, tId: number) => {
    const result = toggleTaskRaw(cId, tId);
    if (!result) return;

    const { task, willBeDone } = result;
    const completedAtTimestamp = willBeDone ? Date.now() : undefined;

    addToHistory(
      'task_complete',
      `Marked "${task.title}" as ${willBeDone ? 'done' : 'todo'}`,
      { isDone: willBeDone, completedAt: completedAtTimestamp },
      cId,
      task.id
    );

    if (willBeDone) {
      const onTime = !task.dueDate || Date.now() <= task.dueDate;
      const points = GamificationUtils.calculateTaskPoints(task.priority, task.effort, onTime);
      if (points > 0) {
        playSuccess();
        fireTaskComplete({ intensity: points > 15 ? 'celebration' : 'light' });
        sendSystemNotification(task.title);
      }
    }
  }, [toggleTaskRaw, addToHistory, playSuccess, fireTaskComplete, sendSystemNotification]);

  // --- Undo/Redo with State Application ---
  const undo = useCallback(() => {
    const entry = undoRaw();
    if (entry) {
      applyHistoryChange(entry, true, setClients);
    }
  }, [undoRaw, setClients]);

  const redo = useCallback(() => {
    const entry = redoRaw();
    if (entry) {
      applyHistoryChange(entry, false, setClients);
    }
  }, [redoRaw, setClients]);

  // --- Stable Actions Object (split by domain) ---
  const clientActions = useMemo(() => ({
    addClient,
    removeClient,
    updateClientPriority,
    updateClientProfile,
  }), [addClient, removeClient, updateClientPriority, updateClientProfile]);

  const taskActions = useMemo(() => ({
    addTask,
    addTaskToMany,
    updateTaskTitle,
    updateTaskPriority,
    updateTaskEffort,
    updateTaskDueDate,
    addTaskComment,
    toggleTask,
    deleteTask,
    reorderTasks,
  }), [addTask, addTaskToMany, updateTaskTitle, updateTaskPriority, updateTaskEffort, updateTaskDueDate, addTaskComment, toggleTask, deleteTask, reorderTasks]);

  const noteActions = useMemo(() => ({
    addNote,
    deleteNote,
    updateNote,
    addAccount,
    deleteAccount,
    updateAccount,
  }), [addNote, deleteNote, updateNote, addAccount, deleteAccount, updateAccount]);

  const settingsActions = useMemo(() => ({
    toggleSound,
    updateSettings,
    addDmcaSite,
    removeDmcaSite,
    renameDmcaSite,
    addDmcaHosting,
    removeDmcaHosting,
    renameDmcaHosting,
  }), [toggleSound, updateSettings, addDmcaSite, removeDmcaSite, renameDmcaSite, addDmcaHosting, removeDmcaHosting, renameDmcaHosting]);

  const focusActions = useMemo(() => ({
    startFocusSession,
    endFocusSession,
  }), [startFocusSession, endFocusSession]);

  const historyActions = useMemo(() => ({
    undo,
    redo,
    canUndo,
    canRedo,
    getHistory,
  }), [undo, redo, canUndo, canRedo, getHistory]);

  const miscActions = useMemo(() => ({
    exportData,
    sendSystemNotification,
    dismissAchievement,
    toggleAmbient: (enable: boolean) => {
      if (enable) playAmbient();
      else stopAmbient();
    },
  }), [exportData, sendSystemNotification, dismissAchievement, playAmbient, stopAmbient]);

  // Combined actions object for backward compatibility
  const actions = useMemo(() => ({
    ...clientActions,
    ...taskActions,
    ...noteActions,
    ...settingsActions,
    ...focusActions,
    ...historyActions,
    ...miscActions,
    // Legacy aliases
    addTaskToAll: (title: string, priority: Priority, effort: Effort) => {
      const allIds = (clientsRef.current ?? []).map(c => c.id);
      addTaskToMany(allIds, title, priority, effort);
    },
  }), [clientActions, taskActions, noteActions, settingsActions, focusActions, historyActions, miscActions, addTaskToMany, clientsRef]);

  return {
    clients,
    isLoaded,
    settings,
    userProgress,
    newAchievement,
    historyIndex,
    actions,
    isAmbientPlaying,
    // Expose domain-specific action groups for components that want granular access
    clientActions,
    taskActions,
    noteActions,
    settingsActions,
    focusActions,
    historyActions,
  };
}