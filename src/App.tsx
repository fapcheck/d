import React, { useMemo, Suspense, lazy, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Calendar, Clock, AlertCircle, CheckCircle2, ChevronRight, Settings, Volume2, VolumeX, Menu, X, ArrowUpRight, Zap, Copy, LogOut, RotateCcw, Pin, PinOff, Trophy, Flame, Target, Sparkles, UserCheck, LayoutDashboard, ArrowLeft, UserPlus, Focus, FolderOpen, Check, BarChart3, AlertTriangle, RefreshCw, Save, Pencil } from 'lucide-react';
import { generateDmcaLetter } from './services/aiService';

import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { useZenData } from './hooks/useZenData';
import { useAppState } from './hooks/useAppState';
import type { ClientTab } from './hooks/useAppState';
import { SortableTaskItem } from './components/SortableTaskItem';
import { SettingsModal } from './components/SettingsModal';
import { QuickTaskBar } from './components/QuickTaskBar';
import { CommentsModal } from './components/CommentsModal';

import { NotificationToast } from './components/NotificationToast';
import { HistoryPanel } from './components/HistoryPanel';
import { ClientSection } from './components/ClientSection';
import { StatsDashboard } from './components/StatsDashboard';
import { AchievementsModal } from './components/AchievementsModal';
import { WeeklyReview } from './components/WeeklyReview';
import { PRIORITY_CONFIG } from './constants';
import { StreakFlame } from './components/StreakFlame';
import { SimpleListItem } from './components/SimpleListItem';
import type { Priority, Effort, NoteItem } from './types';

// --- Lazy Loading for Heavy Components ---

const FocusView = lazy(() => import('./components/FocusView').then(module => ({ default: module.FocusView })));

// --- Error Boundary Component ---
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  handleReset = () => {
    if (confirm("Reset application data? This cannot be undone.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-8 text-center">
          <div className="bg-surface border border-error/20 p-8 rounded-3xl max-w-md shadow-2xl">
            <AlertTriangle size={48} className="text-error mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Meditation Broken</h1>
            <p className="text-secondary mb-6 text-sm">
              An unexpected error disturbed the flow.<br />
              <span className="font-mono text-xs opacity-50 mt-2 block">{this.state.error?.message}</span>
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-primary text-bg rounded-xl font-bold hover:bg-white transition-colors flex items-center gap-2"
              >
                <RefreshCw size={16} /> Reload
              </button>
              <button
                onClick={this.handleReset}
                className="px-6 py-2 glass text-error hover:bg-error/10 rounded-xl font-bold transition-colors"
              >
                Reset Data
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const LoadingFallback = () => (
  <div className="w-full h-96 flex items-center justify-center text-secondary">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    >
      <Clock size={32} className="opacity-50" />
    </motion.div>
  </div>
);

function AppContent() {
  const { clients, isLoaded, settings, userProgress, newAchievement, historyIndex, actions, isAmbientPlaying } = useZenData();

  // UI state from custom hook
  const {
    selectedClientId, setSelectedClientId, viewMode, setViewMode, clientTab, setClientTab,
    copiedId, isClientFormOpen, setIsClientFormOpen, isSettingsOpen, setIsSettingsOpen,
    isAchievementsOpen, setIsAchievementsOpen, sectionsOpen, toggleSection, isPinned, togglePin,
    isHistoryOpen, setIsHistoryOpen,
    commentsModal, openComments, closeComments,
    dmcaContent, setDmcaContent, isGenerating, setIsGenerating,
    newClientName, setNewClientName, newClientPriority, setNewClientPriority,
    newTaskTitle, setNewTaskTitle, newTaskPriority, setNewTaskPriority, newTaskEffort, setNewTaskEffort,
    newNoteContent, setNewNoteContent, newAccountContent, setNewAccountContent,
    resetClientForm, resetTaskForm, resetNoteForm, resetAccountForm,
    selectedClient, activeTasks, groupedClients, copyReport
  } = useAppState({ clients });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Drag & Drop State
  const [activeId, setActiveId] = React.useState<number | null>(null);

  // --- Default Sites Initialization ---
  useEffect(() => {
    if (settings.dmcaSites === undefined && (actions as any).updateSettings) {
      const defaultSites = [
        "allmycams", "alphavids", "archivebate", "bestcamtv", "camhubcc",
        "camripscom", "camshow0ws", "camshowdownload", "camshowrecorded",
        "camshowrecordingscom", "camshowsrecordings", "camshowstv", "camvideosme",
        "camwhores", "cb2cam", "chaturflix", "Generic / Other"
      ];
      // Only set if not already present (undefined check handled above)
      (actions as any).updateSettings({ dmcaSites: defaultSites });
    }
  }, [settings.dmcaSites, actions]);

  const [isManagingSites, setIsManagingSites] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [editingSite, setEditingSite] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(Number(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (over && active.id !== over.id && selectedClientId) {
      actions.reorderTasks(selectedClientId, Number(active.id), Number(over.id));
    }
  };

  const handleAddClient = () => {
    const name = newClientName.trim();
    if (!name) return;
    actions.addClient(name, newClientPriority);
    resetClientForm();
  };

  const handleAddTaskInternal = () => {
    if (selectedClientId && newTaskTitle.trim()) {
      actions.addTask(selectedClientId, newTaskTitle.trim(), newTaskPriority, newTaskEffort);
      resetTaskForm();
    }
  };

  const handleAddNote = () => {
    if (selectedClientId && newNoteContent.trim()) {
      actions.addNote(selectedClientId, newNoteContent.trim());
      resetNoteForm();
    }
  };

  const handleAddAccount = () => {
    if (selectedClientId && newAccountContent.trim()) {
      actions.addAccount(selectedClientId, newAccountContent.trim());
      resetAccountForm();
    }
  };



  const activeDragTask = activeId ? selectedClient?.tasks.find(t => t.id === activeId) : null;

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-secondary">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}>
          <Clock size={32} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-bg p-6 md:p-10 flex flex-col items-center text-gray-300 font-sans selection:bg-primary/20 selection:text-white">


      <AnimatePresence>
        {newAchievement && (
          <NotificationToast
            achievement={newAchievement}
            onClose={actions.dismissAchievement}
          />
        )}
      </AnimatePresence>

      <header className="w-full max-w-5xl flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          {selectedClientId && viewMode === 'dashboard' && (
            <button onClick={() => setSelectedClientId(null)} className="glass hover:bg-white/10 p-2.5 rounded-xl transition-colors text-white shadow-sm">
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="text-xl tracking-tight text-white select-none" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', sans-serif" }}>
            <span className="font-medium">Сам Себе</span>
            <span className="font-bold text-primary ml-1.5">DMCA</span>
          </h1>
        </div>
        <div className="flex gap-4">
          <div className="flex glass rounded-xl p-1 gap-1 shadow-zen">
            <button
              onClick={() => { setViewMode('dashboard'); setSelectedClientId(null); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all text-xs font-bold tracking-wide ${viewMode === 'dashboard' ? 'bg-primary/20 text-primary shadow-inner' : 'text-secondary hover:text-white hover:bg-white/5'}`}
            >
              <LayoutDashboard size={14} /> ПРОЕКТЫ
            </button>
            <button
              onClick={() => setViewMode('focus')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all text-xs font-bold tracking-wide ${viewMode === 'focus' ? 'bg-green-500/20 text-green-400 shadow-inner' : 'text-secondary hover:text-white hover:bg-white/5'}`}
            >
              <Focus size={14} /> ФОКУС
            </button>
          </div>

          <StreakFlame streak={userProgress.stats.currentStreak} />

          <button onClick={() => setIsSettingsOpen(true)} className="glass hover:bg-white/10 text-secondary hover:text-white p-3 rounded-xl transition-colors shadow-sm">
            <Settings size={20} />
          </button>
        </div>
      </header>



      <main className="w-full max-w-5xl relative flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {viewMode === 'dashboard' && !selectedClientId && (
            <motion.div key="clients-list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12 h-full overflow-y-auto pr-2">
              {/* Пакетное добавление через QuickTaskBar */}
              <QuickTaskBar clients={clients} onAddTaskToMany={actions.addTaskToMany} />

              <div>
                <div className="flex items-center gap-4 mb-6 px-2">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-secondary">Ваши проекты</h2>
                  <div className="h-px bg-white/5 flex-1"></div>
                  <button onClick={() => setIsClientFormOpen(!isClientFormOpen)} className={`p-2 rounded-full transition-all border border-transparent ${isClientFormOpen ? 'bg-error/10 text-error rotate-45 border-error/20' : 'glass hover:bg-white/10 text-secondary hover:text-white'}`}>
                    {isClientFormOpen ? <Plus size={16} /> : <UserPlus size={16} />}
                  </button>
                </div>
                <AnimatePresence>
                  {isClientFormOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-8">
                      <div className="glass p-5 rounded-2xl flex flex-col gap-4 max-w-2xl mx-auto shadow-zen">
                        <div className="flex gap-3 w-full">
                          <input type="text" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddClient()} placeholder="Название проекта..." className="flex-1 bg-black/20 text-white px-4 py-3 rounded-xl outline-none focus:ring-1 focus:ring-primary/50 border border-white/5" autoFocus />
                          <button onClick={handleAddClient} className="bg-primary/80 hover:bg-primary text-white px-6 rounded-xl font-bold text-sm">Создать</button>
                        </div>
                        <div className="flex items-center gap-4 px-1">
                          <span className="text-xs text-secondary font-medium uppercase">Приоритет:</span>
                          <div className="flex bg-black/20 rounded-lg p-1 gap-1 border border-white/5">
                            {(['high', 'normal', 'low'] as Priority[]).map(p => (
                              <button key={p} onClick={() => setNewClientPriority(p)} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase ${newClientPriority === p ? `${PRIORITY_CONFIG[p].bg} ${PRIORITY_CONFIG[p].color} shadow-sm border border-white/5` : 'text-secondary hover:text-white'}`}>{PRIORITY_CONFIG[p].label}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {clients.length === 0 ? <div className="text-center py-24 text-secondary/40"><FolderOpen size={64} className="mx-auto mb-6 opacity-10" strokeWidth={1} /><p className="font-light tracking-wide">Проектов пока нет.</p></div> : (
                  <div className="flex flex-col gap-8">
                    {(['high', 'normal', 'low'] as Priority[]).map(type => (
                      <ClientSection key={type} type={type} title={type === 'high' ? 'Высокий приоритет' : type === 'normal' ? 'Обычный приоритет' : 'Низкий приоритет'} items={groupedClients[type]} isOpen={sectionsOpen[type]} onToggle={() => toggleSection(type)} onSelectClient={(id) => { setSelectedClientId(id); setClientTab('active'); }} onRemoveClient={actions.removeClient} onUpdatePriority={actions.updateClientPriority} />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {viewMode === 'dashboard' && selectedClientId && selectedClient && (
            <motion.div key="client-detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="max-w-3xl mx-auto w-full h-full flex flex-col">
              <div className="flex items-end justify-between mb-8 pb-4 border-b border-white/5">
                <div>
                  <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${PRIORITY_CONFIG[selectedClient.priority].color}`}>{PRIORITY_CONFIG[selectedClient.priority].label}</div>
                  <h2 className="text-4xl font-bold text-white tracking-tight">{selectedClient.name}</h2>
                </div>
              </div>
              <div className="flex glass p-1 rounded-xl mb-8 shadow-sm">
                {(['active', 'accounts', 'notes', 'archive', 'dmca', 'profile'] as ClientTab[]).map(tab => (
                  <button key={tab} onClick={() => setClientTab(tab)} className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${clientTab === tab ? 'bg-white/10 text-white shadow-inner' : 'text-secondary hover:text-white hover:bg-white/5'}`}>{tab === 'active' ? 'Задачи' : tab === 'accounts' ? 'Аккаунты' : tab === 'notes' ? 'Заметки' : tab === 'archive' ? 'Архив' : tab === 'dmca' ? 'DMCA-GENERATOR' : 'PROFILE'}</button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                {clientTab === 'active' && (
                  <motion.div key="active-tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 flex-1 overflow-y-auto pr-2">
                    <div className="glass p-5 rounded-2xl shadow-zen mb-8 group focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                      <div className="flex gap-4 w-full mb-4">
                        <input type="text" placeholder="Новая задача..." value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTaskInternal()} className="flex-1 bg-transparent text-white text-xl outline-none placeholder-secondary/30 border-none" />
                        <button onClick={handleAddTaskInternal} className="w-10 h-10 flex items-center justify-center bg-primary/10 text-primary rounded-xl hover:bg-primary transition-all"><Plus size={20} /></button>
                      </div>
                    </div>
                    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
                      <SortableContext items={activeTasks} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3 pb-20">
                          {activeTasks.length === 0 ? <div className="text-center py-16 text-secondary/30 border border-dashed border-white/5 rounded-2xl glass"><div className="text-sm font-medium">Нет активных задач</div></div> : activeTasks.map(task => (
                            <SortableTaskItem key={task.id} task={task} onToggle={() => actions.toggleTask(selectedClient.id, task.id)} onDelete={() => actions.deleteTask(selectedClient.id, task.id)} onUpdateTitle={(title) => actions.updateTaskTitle(selectedClient.id, task.id, title)} onUpdatePriority={(priority) => actions.updateTaskPriority(selectedClient.id, task.id, priority)} onUpdateEffort={(effort) => actions.updateTaskEffort(selectedClient.id, task.id, effort)} onUpdateDueDate={(dueDate) => actions.updateTaskDueDate(selectedClient.id, task.id, dueDate)} onAddComment={(text) => actions.addTaskComment(selectedClient.id, task.id, text)} onOpenComments={() => openComments(task.id, task.title)} />
                          ))}
                        </div>
                      </SortableContext>
                      {/* Drag Overlay for Magnetic Effect */}
                      <DragOverlay dropAnimation={{
                        duration: 250,
                        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
                      }}>
                        {activeDragTask ? (
                          <div className="opacity-90 scale-105 rotate-2 cursor-grabbing">
                            <SortableTaskItem
                              task={activeDragTask}
                              onToggle={() => { }}
                              onDelete={() => { }}
                              onUpdateTitle={() => { }}
                              onUpdatePriority={() => { }}
                              onUpdateEffort={() => { }}
                              onUpdateDueDate={() => { }}
                              onAddComment={() => { }}
                              onOpenComments={() => { }}
                            />
                          </div>
                        ) : null}
                      </DragOverlay>
                    </DndContext>
                  </motion.div>
                )}
                {clientTab === 'accounts' && (
                  <motion.div key="accounts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 flex-1 overflow-y-auto pr-2">
                    <div className="glass p-5 rounded-2xl shadow-zen mb-4 group focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                      <div className="flex gap-4 w-full">
                        <input
                          type="text"
                          placeholder="Добавить аккаунт/соцсеть..."
                          value={newAccountContent}
                          onChange={(e) => setNewAccountContent(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddAccount()}
                          className="flex-1 bg-transparent text-white outline-none placeholder-secondary/30 border-none relative text-lg font-light tracking-wide"
                        />
                        <button onClick={handleAddAccount} className="w-10 h-10 flex items-center justify-center bg-primary/10 text-primary rounded-xl hover:bg-primary transition-all"><Plus size={20} /></button>
                      </div>
                    </div>

                    <div className="space-y-3 pb-20">
                      {selectedClient.accounts.length === 0 ? (
                        <div className="text-center py-16 text-secondary/30 border border-dashed border-white/5 rounded-2xl glass">
                          <div className="text-4xl mb-4 opacity-50">👤</div>
                          <div className="text-sm font-medium">Нет аккаунтов</div>
                          <div className="text-xs mt-2 opacity-60">Добавьте логины для быстрого доступа</div>
                        </div>
                      ) : (
                        selectedClient.accounts.map(item => (
                          <SimpleListItem
                            key={item.id}
                            item={item}
                            isAccount={true}
                            onDelete={() => actions.deleteAccount(selectedClient.id, item.id)}
                            onUpdate={(content) => actions.updateAccount(selectedClient.id, item.id, content)}
                          />
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
                {clientTab === 'notes' && (
                  <motion.div key="notes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 flex-1 overflow-y-auto pr-2">
                    <div className="glass p-5 rounded-2xl shadow-zen mb-4 group focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                      <div className="flex gap-4 w-full">
                        <input
                          type="text"
                          placeholder="Добавить заметку..."
                          value={newNoteContent}
                          onChange={(e) => setNewNoteContent(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                          className="flex-1 bg-transparent text-white outline-none placeholder-secondary/30 border-none relative text-lg font-light tracking-wide"
                        />
                        <button onClick={handleAddNote} className="w-10 h-10 flex items-center justify-center bg-primary/10 text-primary rounded-xl hover:bg-primary transition-all"><Plus size={20} /></button>
                      </div>
                    </div>

                    <div className="space-y-3 pb-20">
                      {selectedClient.notes.length === 0 ? (
                        <div className="text-center py-16 text-secondary/30 border border-dashed border-white/5 rounded-2xl glass">
                          <div className="text-sm font-medium">Нет заметок</div>
                        </div>
                      ) : (
                        selectedClient.notes.map(item => (
                          <SimpleListItem
                            key={item.id}
                            item={item}
                            onDelete={() => actions.deleteNote(selectedClient.id, item.id)}
                            onUpdate={(content) => actions.updateNote(selectedClient.id, item.id, content)}
                          />
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
                {clientTab === 'archive' && (
                  <motion.div key="archive" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 flex-1 overflow-y-auto pr-2"><div className="flex justify-end"><button onClick={copyReport} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg ${copiedId ? 'bg-success/20 text-success border border-success/30' : 'glass hover:bg-white/10 text-secondary'}`}>{copiedId ? <Check size={14} /> : <Copy size={14} />} {copiedId ? 'Скопировано' : 'Копировать отчёт'}</button></div><div className="space-y-2 pb-10">{selectedClient.tasks.filter(t => t.isDone).length === 0 ? <div className="text-center py-20 text-secondary/30 font-light">Архив пуст</div> : selectedClient.tasks.filter(t => t.isDone).map(task => (<div key={task.id} className="glass p-4 rounded-xl flex items-center gap-4 group hover:bg-white/[0.03] transition-colors border border-transparent hover:border-white/5"><div className="text-success/50"><CheckCircle2 size={18} /></div><div className="flex-1 text-secondary line-through decoration-white/10 text-sm">{task.title}</div><button onClick={() => actions.toggleTask(selectedClient.id, task.id)} className="text-xs text-secondary hover:text-white opacity-0 group-hover:opacity-100 underline transition-opacity">Восстановить</button><button onClick={() => actions.deleteTask(selectedClient.id, task.id)} className="text-secondary hover:text-error opacity-0 group-hover:opacity-100 transition-opacity ml-4 p-2"><Trash2 size={16} /></button></div>))}</div></motion.div>
                )}
                {clientTab === 'dmca' && (
                  <motion.div
                    key="dmca-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col gap-6 flex-1 overflow-hidden"
                  >
                    {/* Generator Controls (The "Cool Look") */}
                    <div className="glass p-6 rounded-2xl border border-white/5 flex items-center justify-between gap-6 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors duration-500"></div>

                      <div className="flex-1 z-10">
                        <label className="text-secondary/60 text-xs font-bold uppercase tracking-wider mb-2 block">Target Website</label>
                        <div className="flex items-center gap-3 bg-black/20 p-1 rounded-xl border border-white/5 focus-within:border-primary/50 transition-colors">
                          <div className="p-2 bg-white/5 rounded-lg text-white">
                            <LayoutDashboard size={18} />
                          </div>
                          <select
                            id="dmca-site-select"
                            className="bg-transparent border-none text-white text-sm font-medium focus:ring-0 w-full outline-none [&>option]:bg-surface [&>option]:text-white"
                            defaultValue=""
                          >
                            <option value="" disabled>Choose site...</option>
                            {(settings.dmcaSites || []).map(site => (
                              <option key={site} value={site}>{site}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => setIsManagingSites(!isManagingSites)}
                            className="p-2 hover:bg-white/10 rounded-lg text-secondary hover:text-white transition-colors"
                            title="Manage Sites"
                          >
                            <Settings size={14} />
                          </button>
                        </div>

                        <AnimatePresence>
                          {isManagingSites && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 p-4 bg-black/40 rounded-xl border border-white/10 space-y-3">
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={newSiteName}
                                    onChange={(e) => setNewSiteName(e.target.value)}
                                    placeholder="Add new site..."
                                    className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && newSiteName.trim()) {
                                        actions.addDmcaSite(newSiteName.trim());
                                        setNewSiteName('');
                                      }
                                    }}
                                  />
                                  <button
                                    onClick={() => {
                                      if (newSiteName.trim()) {
                                        actions.addDmcaSite(newSiteName.trim());
                                        setNewSiteName('');
                                      }
                                    }}
                                    className="px-3 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-xs font-bold transition-colors"
                                  >
                                    <Plus size={16} />
                                  </button>
                                </div>
                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                                  {(settings.dmcaSites || []).map(site => (
                                    <div key={site} className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded text-xs text-secondary group hover:bg-white/10 transition-colors">
                                      {editingSite === site ? (
                                        <div className="flex items-center gap-1">
                                          <input
                                            autoFocus
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                if (editValue.trim() && editValue !== site) {
                                                  (actions as any).renameDmcaSite(site, editValue.trim());
                                                }
                                                setEditingSite(null);
                                              } else if (e.key === 'Escape') {
                                                setEditingSite(null);
                                              }
                                            }}
                                            onBlur={() => {
                                              if (editValue.trim() && editValue !== site) {
                                                (actions as any).renameDmcaSite(site, editValue.trim());
                                              }
                                              setEditingSite(null);
                                            }}
                                            className="bg-black/40 border border-primary/50 rounded px-1 py-0.5 text-white min-w-[100px] outline-none"
                                          />
                                        </div>
                                      ) : (
                                        <>
                                          <span onClick={() => { setEditingSite(site); setEditValue(site); }} className="cursor-pointer hover:text-white transition-colors">{site}</span>
                                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                              onClick={() => { setEditingSite(site); setEditValue(site); }}
                                              className="text-secondary/50 hover:text-primary transition-colors"
                                            >
                                              <Pencil size={10} />
                                            </button>
                                            <button
                                              onClick={() => confirm(`Delete "${site}"?`) && actions.removeDmcaSite(site)}
                                              className="text-secondary/50 hover:text-error transition-colors"
                                            >
                                              <X size={12} />
                                            </button>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="z-10">
                        <button
                          disabled={isGenerating}
                          onClick={async () => {
                            const siteSelect = document.getElementById('dmca-site-select') as HTMLSelectElement;
                            const site = siteSelect.value || 'Generic Site';

                            if (!settings.groqApiKey) {
                              alert("Please configure your Groq API Key in Settings > AI Integration first.");
                              setIsSettingsOpen(true);
                              return;
                            }

                            setIsGenerating(true);
                            setDmcaContent('Generating with Groq Llama 3...');

                            try {
                              // 1. Try AI Generation
                              let currentText = '';
                              await generateDmcaLetter(selectedClient.name, site, settings.groqApiKey, selectedClient.dmcaProfile, (token) => {
                                currentText += token;
                                setDmcaContent(currentText);
                              });
                              if (actions.sendSystemNotification) actions.sendSystemNotification(`AI generated letter for ${site}`);
                            } catch (error) {
                              console.error("AI Generation failed", error);
                              // 2. Fallback
                              const template = `Date: ${new Date().toLocaleDateString()}

To Whom It May Concern at ${site},

I am writing on behalf of ${selectedClient.name} regarding the unauthorized use of their intellectual property on your platform (${site}).

The original copyrighted work is: [DESCRIPTION OF WORK]
The unauthorized material is located at: [URL]

I have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.

I state, under penalty of perjury, that the information in this notification is accurate and that I am authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.

Sincerely,
[YOUR NAME]`;
                              setDmcaContent(template);
                              alert("Generation failed. Using offline template. Check your API Key.");
                            } finally {
                              setIsGenerating(false);
                            }
                          }}
                          className={`px-8 py-4 ${isGenerating ? 'bg-primary/50 cursor-wait' : 'bg-primary hover:bg-primary/90'} text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-primary/20 flex items-center gap-3 transform ${!isGenerating && 'hover:-translate-y-1 active:scale-95'} whitespace-nowrap`}
                        >
                          <Zap size={20} className={`fill-white ${isGenerating ? 'animate-pulse' : ''}`} />
                          {isGenerating ? 'Generating...' : 'Generate Letter'}
                        </button>
                      </div>
                    </div>

                    {/* Editable Template Area */}
                    <div className="flex-1 glass rounded-2xl border border-white/5 relative group cursor-text flex flex-col min-h-0" onClick={() => document.getElementById('dmca-textarea')?.focus()}>
                      <div className="absolute top-4 right-4 z-20 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(dmcaContent);
                            if (actions.sendSystemNotification) actions.sendSystemNotification('DMCA Notice Copied');
                          }}
                          className="p-2 glass hover:bg-white/10 text-primary rounded-lg transition-colors"
                          title="Copy to Clipboard"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                      <textarea
                        id="dmca-textarea"
                        value={dmcaContent}
                        onChange={(e) => setDmcaContent(e.target.value)}
                        className="w-full h-full bg-transparent border-none outline-none p-8 font-mono text-sm text-secondary/90 leading-relaxed resize-none placeholder-white/20"
                        placeholder="Select a site and click Generate to start..."
                        spellCheck={false}
                      />
                      <div className="absolute bottom-0 right-0 p-8 opacity-5 pointer-events-none">
                        <Zap size={180} />
                      </div>
                    </div>
                  </motion.div>
                )}
                {clientTab === 'profile' && (
                  <motion.div
                    key="profile-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col gap-6 flex-1 overflow-y-auto pr-2"
                  >
                    <div className="glass p-8 rounded-2xl border border-white/5 space-y-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <UserCheck size={20} className="text-primary" />   DMCA Client Profile
                        </h3>
                        <button
                          onClick={() => {
                            if (actions.sendSystemNotification) actions.sendSystemNotification('Profile Saved Successfully');
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                        >
                          <Save size={16} />
                          Save Profile
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-secondary">Name</label>
                          <input
                            type="text"
                            value={selectedClient.dmcaProfile?.legalName || ''}
                            onChange={(e) => actions.updateClientProfile(selectedClient.id, { ...selectedClient.dmcaProfile, legalName: e.target.value } as any)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                            placeholder="e.g. John Doe"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-secondary">Contact Email</label>
                          <input
                            type="text"
                            value={selectedClient.dmcaProfile?.email || ''}
                            onChange={(e) => actions.updateClientProfile(selectedClient.id, { ...selectedClient.dmcaProfile, email: e.target.value } as any)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                            placeholder="e.g. legal@example.com"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-secondary">Phone Number</label>
                          <input
                            type="text"
                            value={selectedClient.dmcaProfile?.phone || ''}
                            onChange={(e) => actions.updateClientProfile(selectedClient.id, { ...selectedClient.dmcaProfile, phone: e.target.value } as any)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                            placeholder="e.g. +1 (555) 123-4567"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-secondary">Physical Address</label>
                          <input
                            type="text"
                            value={selectedClient.dmcaProfile?.address || ''}
                            onChange={(e) => actions.updateClientProfile(selectedClient.id, { ...selectedClient.dmcaProfile, address: e.target.value } as any)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                            placeholder="e.g. 123 Legal Avenue, NY, USA"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-secondary">Original Source / Model Page URL</label>
                        <input
                          type="text"
                          value={selectedClient.dmcaProfile?.contentSourceUrl || ''}
                          onChange={(e) => actions.updateClientProfile(selectedClient.id, { ...selectedClient.dmcaProfile, contentSourceUrl: e.target.value } as any)}
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                          placeholder="e.g. https://example.com/models/my-client-model"
                        />
                        <p className="text-xs text-secondary/40">This link will be included in the letter to specify the original authorized content.</p>
                      </div>

                      <div className="pt-4 border-t border-white/5">
                        <p className="text-xs text-secondary/60 italic">These details will be automatically used by the AI to sign off your DMCA letters.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {viewMode === 'analytics' && (
            <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <StatsDashboard clients={clients} focusSessions={userProgress.focusSessions} />
            </motion.div>
          )}

          {viewMode === 'focus' && (
            <motion.div key="focus-mode" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}>
              <Suspense fallback={<LoadingFallback />}>
                <FocusView clients={clients} onToggleTask={actions.toggleTask} />
              </Suspense>
            </motion.div>
          )}

          {viewMode === 'review' && (
            <motion.div key="review" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <WeeklyReview clients={clients} focusSessions={userProgress.focusSessions} />
            </motion.div>
          )}
        </AnimatePresence>
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onUpdateSettings={actions.updateSettings}
          onNavigate={setViewMode}
          onOpenAchievements={() => setIsAchievementsOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          isPinned={isPinned}
          togglePin={togglePin}
          currentView={viewMode}
          toggleAmbient={actions.toggleAmbient}
          isAmbientPlaying={isAmbientPlaying}
        />
        <HistoryPanel
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          history={actions.getHistory()}
          onUndo={actions.undo}
          onRedo={actions.redo}
          currentIndex={historyIndex}
        />
        <CommentsModal
          isOpen={commentsModal.isOpen}
          onClose={closeComments}
          taskTitle={commentsModal.taskTitle}
          comments={selectedClient?.tasks.find(t => t.id === commentsModal.taskId)?.comments || []}
          onAddComment={(text) => selectedClient && commentsModal.taskId && actions.addTaskComment(selectedClient.id, commentsModal.taskId, text)}
        />
        {
          isAchievementsOpen && (
            <AchievementsModal
              isOpen={isAchievementsOpen}
              onClose={() => setIsAchievementsOpen(false)}
              achievements={userProgress.achievements}
            />
          )
        }
      </main >
    </div >
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}