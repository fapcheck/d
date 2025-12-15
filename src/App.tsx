import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, LayoutDashboard, ArrowLeft, Clock, UserPlus, Focus, 
  ChevronDown, ChevronRight, FolderOpen, Copy, Check, CheckCircle2, Trash2, Settings
} from 'lucide-react';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { useZenData } from './hooks/useZenData';
import { ClientCard } from './components/ClientCard';
import { FocusView } from './components/FocusView';
import { SortableTaskItem } from './components/SortableTaskItem';
import { SettingsModal } from './components/SettingsModal';
import { QuickTaskBar } from './components/QuickTaskBar';

import { PRIORITY_CONFIG, EFFORT_CONFIG } from './types';
import type { Priority, Effort, Client } from './types';

// --- Types ---
type ClientTab = 'active' | 'archive' | 'notes';

// --- Sub-components ---

interface ClientSectionProps {
    type: Priority;
    title: string;
    items: Client[];
    isOpen: boolean;
    onToggle: () => void;
    onSelectClient: (id: number) => void;
    onRemoveClient: (id: number) => void;
    onUpdatePriority: (id: number, priority: Priority) => void;
}

const ClientSection: React.FC<ClientSectionProps> = ({ 
    type, title, items, isOpen, onToggle, 
    onSelectClient, onRemoveClient, onUpdatePriority 
}) => {
    if (items.length === 0) return null;
    return (
        // ИСПРАВЛЕНИЕ: Убрал margin-bottom (mb-8), теперь отступы контролирует родительский flex gap
        <div className="w-full">
            <button 
              onClick={onToggle}
              className={`flex items-center gap-3 w-full text-left mb-4 group ${PRIORITY_CONFIG[type].color}`}
            >
                <div className="p-1 rounded-md bg-white/5 group-hover:bg-white/10 transition-colors">
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
                <span className="font-bold text-sm tracking-widest uppercase opacity-80">{title}</span>
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-gray-400 border border-white/5">{items.length}</span>
                <div className="h-px bg-current flex-1 opacity-10 ml-2"></div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }} 
                        className="overflow-hidden"
                    >
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-2">
                           {items.map(client => (
                              <ClientCard 
                                key={client.id} 
                                client={client} 
                                onClick={() => onSelectClient(client.id)}
                                onRemove={onRemoveClient}
                                onUpdatePriority={onUpdatePriority}
                              />
                           ))}
                       </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Main Component ---

function App() {
  const { clients, isLoaded, settings, actions } = useZenData();
  
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'dashboard' | 'focus'>('dashboard');
  const [clientTab, setClientTab] = useState<ClientTab>('active');
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState({ high: true, normal: true, low: true });
  
  const [newClientName, setNewClientName] = useState('');
  const [newClientPriority, setNewClientPriority] = useState<Priority>('normal');
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('normal');
  const [newTaskEffort, setNewTaskEffort] = useState<Effort>('quick');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && selectedClientId) {
      actions.reorderTasks(selectedClientId, Number(active.id), Number(over.id));
    }
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const activeTasks = selectedClient?.tasks.filter(t => !t.isDone) || [];

  const groupedClients = {
      high: clients.filter(c => c.priority === 'high'),
      normal: clients.filter(c => c.priority === 'normal'),
      low: clients.filter(c => c.priority === 'low')
  };

  const handleAddClient = () => {
    if (!newClientName.trim()) return;
    actions.addClient(newClientName, newClientPriority);
    setNewClientName('');
    setNewClientPriority('normal');
    setIsClientFormOpen(false);
  };

  const handleAddTaskInternal = () => {
     if (selectedClientId && newTaskTitle.trim()) {
         actions.addTask(selectedClientId, newTaskTitle, newTaskPriority, newTaskEffort);
         setNewTaskTitle('');
         setNewTaskPriority('normal');
         setNewTaskEffort('quick');
     }
  };

  const copyReport = () => {
    if (!selectedClient) return;
    const doneTasks = selectedClient.tasks.filter(t => t.isDone);
    let report = `Отчет для: ${selectedClient.name}\n`;
    if (doneTasks.length === 0) report += "Нет выполненных задач.";
    else doneTasks.forEach(t => report += `— ${t.title}\n`);
    
    navigator.clipboard.writeText(report);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

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
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings}
        onToggleSound={actions.toggleSound}
        onExport={actions.exportData}
      />

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
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all text-xs font-bold tracking-wide ${viewMode === 'focus' ? 'bg-accent/20 text-accent shadow-inner' : 'text-secondary hover:text-white hover:bg-white/5'}`}
                >
                    <Focus size={14} /> FOCUS
                </button>
            </div>
            <button onClick={() => setIsSettingsOpen(true)} className="glass hover:bg-white/10 text-secondary hover:text-white p-3 rounded-xl transition-colors shadow-sm">
                <Settings size={20} />
            </button>
        </div>
      </header>

      <main className="w-full max-w-5xl relative">
        <AnimatePresence mode="wait">
          {viewMode === 'dashboard' && !selectedClientId && (
            <motion.div key="clients-list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
              
              <QuickTaskBar clients={clients} onAddTask={actions.addTask} />

              <div>
                  <div className="flex items-center gap-4 mb-6 px-2">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-secondary">Ваши клиенты</h2>
                    <div className="h-px bg-white/5 flex-1"></div>
                    <button 
                        onClick={() => setIsClientFormOpen(!isClientFormOpen)} 
                        className={`p-2 rounded-full transition-all border border-transparent ${isClientFormOpen ? 'bg-error/10 text-error rotate-45 border-error/20' : 'glass hover:bg-white/10 text-secondary hover:text-white'}`}
                    >
                        {isClientFormOpen ? <Plus size={16} /> : <UserPlus size={16} />}
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {isClientFormOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-8">
                            <div className="glass p-5 rounded-2xl flex flex-col gap-4 max-w-2xl mx-auto shadow-zen">
                                <div className="flex gap-3 w-full">
                                    <input 
                                        type="text" 
                                        value={newClientName} 
                                        onChange={(e) => setNewClientName(e.target.value)} 
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddClient()} 
                                        placeholder="Название проекта или имя..." 
                                        className="flex-1 bg-black/20 text-white px-4 py-3 rounded-xl outline-none focus:ring-1 focus:ring-primary/50 border border-white/5 placeholder-secondary/40" 
                                        autoFocus 
                                    />
                                    <button onClick={handleAddClient} className="bg-primary/80 hover:bg-primary text-white px-6 rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary/20">
                                        Создать
                                    </button>
                                </div>
                                
                                <div className="flex items-center gap-4 px-1">
                                    <span className="text-xs text-secondary font-medium uppercase tracking-wide">Приоритет:</span>
                                    <div className="flex bg-black/20 rounded-lg p-1 gap-1 border border-white/5">
                                        {(['high', 'normal', 'low'] as Priority[]).map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setNewClientPriority(p)}
                                                className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all tracking-wider ${
                                                    newClientPriority === p 
                                                    ? `${PRIORITY_CONFIG[p].bg} ${PRIORITY_CONFIG[p].color} shadow-sm border border-white/5` 
                                                    : 'text-secondary hover:text-white hover:bg-white/5'
                                                }`}
                                            >
                                                {PRIORITY_CONFIG[p].label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {clients.length === 0 ? (
                    <div className="text-center py-24 text-secondary/40">
                        <FolderOpen size={64} className="mx-auto mb-6 opacity-10" strokeWidth={1} />
                        <p className="font-light tracking-wide">Пространство пусто. Создайте первый проект.</p>
                    </div> 
                  ) : (
                    // ИСПРАВЛЕНИЕ: Используем flex flex-col gap-8 для идеальных отступов между категориями
                    <div className="flex flex-col gap-8">
                        {(['high', 'normal', 'low'] as Priority[]).map(type => (
                            <ClientSection 
                                key={type}
                                type={type} 
                                title={type === 'high' ? 'Высокий приоритет' : type === 'normal' ? 'Обычный приоритет' : 'Низкий приоритет'} 
                                items={groupedClients[type]} 
                                isOpen={sectionsOpen[type]}
                                onToggle={() => setSectionsOpen(p => ({...p, [type]: !p[type]}))}
                                onSelectClient={(id) => { setSelectedClientId(id); setClientTab('active'); }}
                                onRemoveClient={actions.removeClient}
                                onUpdatePriority={actions.updateClientPriority}
                            />
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
                    <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${PRIORITY_CONFIG[selectedClient.priority].color}`}>
                        {PRIORITY_CONFIG[selectedClient.priority].label}
                    </div>
                    <h2 className="text-4xl font-bold text-white tracking-tight">{selectedClient.name}</h2>
                 </div>
               </div>
              
              <div className="flex glass p-1 rounded-xl mb-8 shadow-sm">
                {(['active', 'notes', 'archive'] as ClientTab[]).map(tab => (
                   <button 
                        key={tab} 
                        onClick={() => setClientTab(tab)} 
                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${clientTab === tab ? 'bg-white/10 text-white shadow-inner' : 'text-secondary hover:text-white hover:bg-white/5'}`}
                   >
                        {tab === 'active' ? 'Задачи' : tab === 'notes' ? 'Заметки' : 'Архив'}
                   </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {clientTab === 'active' && (
                  <motion.div key="active-tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                    
                    <div className="glass p-5 rounded-2xl shadow-zen mb-8 group focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                        <div className="flex gap-4 w-full mb-4">
                            <input 
                                type="text" 
                                placeholder="Новая задача..." 
                                value={newTaskTitle} 
                                onChange={(e) => setNewTaskTitle(e.target.value)} 
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTaskInternal()} 
                                className="flex-1 bg-transparent text-white text-xl outline-none placeholder-secondary/30 border-none"
                            />
                            <button 
                                onClick={handleAddTaskInternal} 
                                className="w-10 h-10 flex items-center justify-center bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-bg transition-all"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-6 border-t border-white/5 pt-4">
                            <div className="flex gap-2 items-center">
                                <span className="text-[10px] text-secondary font-bold uppercase mr-1">Важность</span>
                                {(['high', 'normal', 'low'] as Priority[]).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setNewTaskPriority(p)}
                                        className={`w-4 h-4 rounded-full transition-all flex items-center justify-center ${
                                            newTaskPriority === p 
                                            ? `ring-2 ring-white ring-opacity-50 scale-110 ${PRIORITY_CONFIG[p].bg.replace('/20', '')}` 
                                            : 'bg-surface hover:bg-white/20 border border-white/10'
                                        }`}
                                        title={PRIORITY_CONFIG[p].label}
                                    />
                                ))}
                            </div>

                            <div className="w-px h-4 bg-white/10"></div>

                            <div className="flex bg-white/5 rounded-lg p-0.5 gap-0.5">
                                {(['quick', 'medium', 'long'] as Effort[]).map(e => {
                                    const Icon = EFFORT_CONFIG[e].icon;
                                    return (
                                        <button
                                            key={e}
                                            onClick={() => setNewTaskEffort(e)}
                                            className={`p-1.5 rounded-md transition-all flex items-center gap-1 ${
                                                newTaskEffort === e 
                                                ? 'bg-white/10 text-white shadow-sm' 
                                                : 'text-secondary hover:text-white hover:bg-white/5'
                                            }`}
                                            title={EFFORT_CONFIG[e].label}
                                        >
                                            <Icon size={14} className={newTaskEffort === e ? EFFORT_CONFIG[e].color : ''} />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
                       <SortableContext items={activeTasks} strategy={verticalListSortingStrategy}>
                           <div className="space-y-3 pb-20">
                                {activeTasks.length === 0 ? (
                                    <div className="text-center py-16 text-secondary/30 border border-dashed border-white/5 rounded-2xl glass">
                                        <div className="text-sm font-medium">Нет активных задач</div>
                                        <div className="text-xs mt-1">Отличное время для кофе</div>
                                    </div> 
                                ) : (
                                    activeTasks.map(task => (
                                      <SortableTaskItem 
                                            key={task.id} 
                                            task={task} 
                                            onToggle={() => actions.toggleTask(selectedClient.id, task.id)}
                                            onDelete={() => actions.deleteTask(selectedClient.id, task.id)}
                                            onUpdateTitle={(title) => actions.updateTaskTitle(selectedClient.id, task.id, title)}
                                            onUpdatePriority={(priority) => actions.updateTaskPriority(selectedClient.id, task.id, priority)}
                                            onUpdateEffort={(effort) => actions.updateTaskEffort(selectedClient.id, task.id, effort)}
                                      />
                                    ))
                                )}
                           </div>
                        </SortableContext>
                    </DndContext>
                  </motion.div>
                )}

                {clientTab === 'notes' && (
                  <motion.div key="notes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <div className="glass p-6 rounded-2xl shadow-zen relative group">
                        <textarea 
                            className="w-full h-[500px] bg-transparent text-gray-300 text-lg leading-relaxed outline-none resize-none placeholder-secondary/20 scrollbar-thin font-light" 
                            placeholder="Пространство для мыслей..." 
                            value={selectedClient.notes} 
                            onChange={(e) => actions.updateClientNotes(selectedClient.id, e.target.value)}
                        />
                        <div className="absolute bottom-4 right-4 text-[10px] text-secondary opacity-0 group-hover:opacity-40 transition-opacity uppercase tracking-widest">
                            Saved locally
                        </div>
                    </div>
                  </motion.div>
                )}

                {clientTab === 'archive' && (
                  <motion.div key="archive" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                     <div className="flex justify-end">
                         <button 
                            onClick={copyReport} 
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg ${copiedId ? 'bg-success/20 text-success border border-success/30' : 'glass hover:bg-white/10 text-secondary'}`}
                         >
                             {copiedId ? <Check size={14}/> : <Copy size={14}/>} 
                             {copiedId ? 'Скопировано' : 'Копировать отчет'}
                         </button>
                     </div>
                     <div className="space-y-2 pb-10">
                        {selectedClient.tasks.filter(t => t.isDone).length === 0 && (
                            <div className="text-center py-20 text-secondary/30 font-light">Архив пуст</div>
                        )}
                        {selectedClient.tasks.filter(t => t.isDone).map(task => (
                             <div key={task.id} className="glass p-4 rounded-xl flex items-center gap-4 group hover:bg-white/[0.03] transition-colors border border-transparent hover:border-white/5">
                                 <div className="text-success/50"><CheckCircle2 size={18} /></div>
                                 <div className="flex-1 text-secondary line-through decoration-white/10 text-sm">{task.title}</div>
                                 <button onClick={() => actions.toggleTask(selectedClient.id, task.id)} className="text-xs text-secondary hover:text-white opacity-0 group-hover:opacity-100 underline transition-opacity">
                                    Вернуть
                                 </button>
                                 <button onClick={() => actions.deleteTask(selectedClient.id, task.id)} className="text-secondary hover:text-error opacity-0 group-hover:opacity-100 transition-opacity ml-4 p-2">
                                    <Trash2 size={16} />
                                 </button>
                           </div>
                         ))}
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {viewMode === 'focus' && <FocusView clients={clients} onToggleTask={actions.toggleTask} />}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;