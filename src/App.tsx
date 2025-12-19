import React, { useMemo, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, LayoutDashboard, ArrowLeft, Clock, UserPlus, Focus,
  FolderOpen, Copy, Check, CheckCircle2, Trash2,
  Settings, Trophy, BarChart3, Pin, PinOff, AlertTriangle, RefreshCw, Calendar
} from 'lucide-react';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { useZenData } from './hooks/useZenData';
import { useAppState } from './hooks/useAppState';
import { SortableTaskItem } from './components/SortableTaskItem';
import { SettingsModal } from './components/SettingsModal';
import { QuickTaskBar } from './components/QuickTaskBar';
import { CommentsModal } from './components/CommentsModal';
import { LevelProgress } from './components/LevelProgress';
import { NotificationToast } from './components/NotificationToast';
import { HistoryPanel } from './components/HistoryPanel';
import { ClientSection } from './components/ClientSection';
import { StatsDashboard } from './components/StatsDashboard';
import { AchievementsModal } from './components/AchievementsModal';
import { WeeklyReview } from './components/WeeklyReview';
import { PRIORITY_CONFIG } from './constants';
import type { Priority, Effort } from './types';

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

type ClientTab = 'active' | 'archive' | 'notes';

function AppContent() {
  const { clients, isLoaded, settings, userProgress, newAchievement, historyIndex, actions, isAmbientPlaying } = useZenData();

  // UI state from custom hook
  const {
    selectedClientId, setSelectedClientId, viewMode, setViewMode, clientTab, setClientTab,
    copiedId, isClientFormOpen, setIsClientFormOpen, isSettingsOpen, setIsSettingsOpen,
    isAchievementsOpen, setIsAchievementsOpen, sectionsOpen, toggleSection, isPinned, togglePin,
    isHistoryOpen, setIsHistoryOpen,
    commentsModal, openComments, closeComments,
    newClientName, setNewClientName, newClientPriority, setNewClientPriority,
    newTaskTitle, setNewTaskTitle, newTaskPriority, setNewTaskPriority, newTaskEffort, setNewTaskEffort,
    resetClientForm, resetTaskForm,
    selectedClient, activeTasks, groupedClients, copyReport
  } = useAppState({ clients });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Drag & Drop State
  const [activeId, setActiveId] = React.useState<number | null>(null);

  const handleDragStart = (event: any) => {
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

  const handleAddComment = (text: string) => {
    if (selectedClientId && commentsModal.taskId) {
      actions.addTaskComment(selectedClientId, commentsModal.taskId, text);
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
    <div className="min-h-screen bg-bg p-6 md:p-10 flex flex-col items-center text-gray-300 font-sans selection:bg-primary/20 selection:text-white">


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
          <h1 className="text-2xl font-light tracking-widest text-white select-none opacity-90">
            Zen<span className="font-semibold text-primary/80">Manager</span>
          </h1>
        </div>
        <div className="flex gap-4">
          <div className="flex glass rounded-xl p-1 gap-1 shadow-zen">
            <button
              onClick={() => { setViewMode('dashboard'); setSelectedClientId(null); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all text-xs font-bold tracking-wide ${viewMode === 'dashboard' ? 'bg-primary/20 text-primary shadow-inner' : 'text-secondary hover:text-white hover:bg-white/5'}`}
            >
              <LayoutDashboard size={14} /> DASHBOARD
            </button>
            <button
              onClick={() => setViewMode('focus')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all text-xs font-bold tracking-wide ${viewMode === 'focus' ? 'bg-green-500/20 text-green-400 shadow-inner' : 'text-secondary hover:text-white hover:bg-white/5'}`}
            >
              <Focus size={14} /> FOCUS
            </button>
          </div>

          <button onClick={() => setIsSettingsOpen(true)} className="glass hover:bg-white/10 text-secondary hover:text-white p-3 rounded-xl transition-colors shadow-sm">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <div className="w-full max-w-5xl mb-8">
        <LevelProgress
          points={userProgress.totalPoints}
          level={userProgress.level}
          className="justify-end"
        />
      </div>

      <main className="w-full max-w-5xl relative">
        <AnimatePresence mode="wait">
          {viewMode === 'dashboard' && !selectedClientId && (
            <motion.div key="clients-list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
              {/* Пакетное добавление через QuickTaskBar */}
              <QuickTaskBar clients={clients} onAddTaskToMany={actions.addTaskToMany} />

              <div>
                <div className="flex items-center gap-4 mb-6 px-2">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-secondary">Your Projects</h2>
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
                          <input type="text" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddClient()} placeholder="Project name..." className="flex-1 bg-black/20 text-white px-4 py-3 rounded-xl outline-none focus:ring-1 focus:ring-primary/50 border border-white/5" autoFocus />
                          <button onClick={handleAddClient} className="bg-primary/80 hover:bg-primary text-white px-6 rounded-xl font-bold text-sm">Create</button>
                        </div>
                        <div className="flex items-center gap-4 px-1">
                          <span className="text-xs text-secondary font-medium uppercase">Priority:</span>
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
                {clients.length === 0 ? <div className="text-center py-24 text-secondary/40"><FolderOpen size={64} className="mx-auto mb-6 opacity-10" strokeWidth={1} /><p className="font-light tracking-wide">No projects yet.</p></div> : (
                  <div className="flex flex-col gap-8">
                    {(['high', 'normal', 'low'] as Priority[]).map(type => (
                      <ClientSection key={type} type={type} title={type === 'high' ? 'High Priority' : type === 'normal' ? 'Normal Priority' : 'Low Priority'} items={groupedClients[type]} isOpen={sectionsOpen[type]} onToggle={() => toggleSection(type)} onSelectClient={(id) => { setSelectedClientId(id); setClientTab('active'); }} onRemoveClient={actions.removeClient} onUpdatePriority={actions.updateClientPriority} />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {viewMode === 'dashboard' && selectedClientId && selectedClient && (
            <motion.div key="client-detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="max-w-3xl mx-auto w-full">
              <div className="flex items-end justify-between mb-8 pb-4 border-b border-white/5">
                <div>
                  <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${PRIORITY_CONFIG[selectedClient.priority].color}`}>{PRIORITY_CONFIG[selectedClient.priority].label}</div>
                  <h2 className="text-4xl font-bold text-white tracking-tight">{selectedClient.name}</h2>
                </div>
              </div>
              <div className="flex glass p-1 rounded-xl mb-8 shadow-sm">
                {(['active', 'notes', 'archive'] as ClientTab[]).map(tab => (
                  <button key={tab} onClick={() => setClientTab(tab)} className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${clientTab === tab ? 'bg-white/10 text-white shadow-inner' : 'text-secondary hover:text-white hover:bg-white/5'}`}>{tab === 'active' ? 'Tasks' : tab === 'notes' ? 'Notes' : 'Archive'}</button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                {clientTab === 'active' && (
                  <motion.div key="active-tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                    <div className="glass p-5 rounded-2xl shadow-zen mb-8 group focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                      <div className="flex gap-4 w-full mb-4">
                        <input type="text" placeholder="New task..." value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTaskInternal()} className="flex-1 bg-transparent text-white text-xl outline-none placeholder-secondary/30 border-none" />
                        <button onClick={handleAddTaskInternal} className="w-10 h-10 flex items-center justify-center bg-primary/10 text-primary rounded-xl hover:bg-primary transition-all"><Plus size={20} /></button>
                      </div>
                    </div>
                    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
                      <SortableContext items={activeTasks} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3 pb-20">
                          {activeTasks.length === 0 ? <div className="text-center py-16 text-secondary/30 border border-dashed border-white/5 rounded-2xl glass"><div className="text-sm font-medium">No active tasks</div></div> : activeTasks.map(task => (
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
                {clientTab === 'notes' && (
                  <motion.div key="notes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}><div className="glass p-6 rounded-2xl shadow-zen relative group"><textarea className="w-full h-[500px] bg-transparent text-gray-300 text-lg leading-relaxed outline-none resize-none placeholder-secondary/20 scrollbar-thin font-light" placeholder="Space for your thoughts..." value={selectedClient.notes} onChange={(e) => actions.updateClientNotes(selectedClient.id, e.target.value)} /><div className="absolute bottom-4 right-4 text-[10px] text-secondary opacity-0 group-hover:opacity-40 transition-opacity uppercase tracking-widest">Saved locally</div></div></motion.div>
                )}
                {clientTab === 'archive' && (
                  <motion.div key="archive" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6"><div className="flex justify-end"><button onClick={copyReport} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg ${copiedId ? 'bg-success/20 text-success border border-success/30' : 'glass hover:bg-white/10 text-secondary'}`}>{copiedId ? <Check size={14} /> : <Copy size={14} />} {copiedId ? 'Copied' : 'Copy Report'}</button></div><div className="space-y-2 pb-10">{selectedClient.tasks.filter(t => t.isDone).length === 0 ? <div className="text-center py-20 text-secondary/30 font-light">Archive is empty</div> : selectedClient.tasks.filter(t => t.isDone).map(task => (<div key={task.id} className="glass p-4 rounded-xl flex items-center gap-4 group hover:bg-white/[0.03] transition-colors border border-transparent hover:border-white/5"><div className="text-success/50"><CheckCircle2 size={18} /></div><div className="flex-1 text-secondary line-through decoration-white/10 text-sm">{task.title}{task.pointsEarned && task.pointsEarned > 0 && (<span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-1 rounded">+{task.pointsEarned} points</span>)}</div><button onClick={() => actions.toggleTask(selectedClient.id, task.id)} className="text-xs text-secondary hover:text-white opacity-0 group-hover:opacity-100 underline transition-opacity">Restore</button><button onClick={() => actions.deleteTask(selectedClient.id, task.id)} className="text-secondary hover:text-error opacity-0 group-hover:opacity-100 transition-opacity ml-4 p-2"><Trash2 size={16} /></button></div>))}</div></motion.div>
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
        {isAchievementsOpen && (
          <AchievementsModal
            isOpen={isAchievementsOpen}
            onClose={() => setIsAchievementsOpen(false)}
            achievements={userProgress.achievements}
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}