import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, LayoutDashboard, ArrowLeft, Clock, Send, UserPlus, Focus, 
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
        <div className="mb-6">
            <button 
              onClick={onToggle}
              className={`flex items-center gap-2 w-full text-left mb-3 hover:opacity-80 transition-opacity ${PRIORITY_CONFIG[type].color}`}
            >
                {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                <span className="font-bold text-lg tracking-wide uppercase">{title}</span>
                <span className="text-xs bg-surface px-2 py-0.5 rounded-full border border-white/10 text-white">{items.length}</span>
                <div className="h-px bg-current flex-1 opacity-20 ml-2"></div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }} 
                        className="overflow-hidden"
                    >
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-2">
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
  
  // UI State
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'dashboard' | 'focus'>('dashboard');
  const [clientTab, setClientTab] = useState<ClientTab>('active');
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState({ high: true, normal: true, low: true });
  
  // Form State
  const [newClientName, setNewClientName] = useState('');
  const [newClientPriority, setNewClientPriority] = useState<Priority>('normal');
  
  // --- Quick Task State ---
  const [quickClientId, setQuickClientId] = useState<string>('');
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskEffort, setQuickTaskEffort] = useState<Effort>('quick');
  
  // --- Detailed Task State ---
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

  const handleAddQuickTask = () => {
    if (!quickClientId || !quickTaskTitle.trim()) return;
    actions.addTask(Number(quickClientId), quickTaskTitle, 'normal', quickTaskEffort);
    setQuickTaskTitle('');
    setQuickTaskEffort('quick');
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
             <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                 <Clock size={32} />
             </motion.div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-bg p-8 flex flex-col items-center text-gray-200 font-sans selection:bg-primary selection:text-bg">
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings}
        onToggleSound={actions.toggleSound}
        onExport={actions.exportData}
      />

      <header className="w-full max-w-5xl flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
           {selectedClientId && viewMode === 'dashboard' && (
             <button onClick={() => setSelectedClientId(null)} className="bg-surface hover:bg-white/10 p-2 rounded-xl transition-colors text-white">
                 <ArrowLeft size={24} />
             </button>
          )}
          <h1 className="text-2xl font-light tracking-wider text-white select-none">Zen<span className="font-bold text-primary">Manager</span></h1>
        </div>
        <div className="flex gap-4">
            <div className="flex bg-surface rounded-xl p-1 gap-1 shadow-lg border border-white/5">
               <button 
                    onClick={() => { setViewMode('dashboard'); setSelectedClientId(null); }} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-bold ${viewMode === 'dashboard' ? 'bg-primary text-bg' : 'text-secondary hover:text-white'}`}
                >
                    <LayoutDashboard size={16} /> Дашборд
                </button>
                <button 
                    onClick={() => setViewMode('focus')} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-bold ${viewMode === 'focus' ? 'bg-accent text-bg' : 'text-secondary hover:text-white'}`}
                >
                    <Focus size={16} /> Фокус
                </button>
            </div>
            <button onClick={() => setIsSettingsOpen(true)} className="bg-surface hover:bg-white/10 text-secondary hover:text-white p-3 rounded-xl border border-white/5 transition-colors">
                <Settings size={20} />
            </button>
        </div>
      </header>

      <main className="w-full max-w-5xl relative">
        <AnimatePresence mode="wait">
          {viewMode === 'dashboard' && !selectedClientId && (
            <motion.div key="clients-list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10">
              
              {/* --- COMPACT QUICK TASK BAR --- */}
              <div className="bg-surface p-4 rounded-2xl shadow-lg border border-white/5 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row gap-3 items-center">
                    <div className="w-full md:w-1/4 relative">
                        <select 
                            value={quickClientId} 
                            onChange={(e) => setQuickClientId(e.target.value)} 
                            className="w-full bg-surface text-white px-4 py-3 rounded-xl focus:outline-none cursor-pointer appearance-none border border-white/5 focus:border-primary/50 transition-colors"
                        >
                            <option value="" disabled>Кому задача?</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-3.5 pointer-events-none text-secondary" />
                    </div>
                    
                    <div className="flex-1 w-full relative flex items-center gap-3">
                        <input 
                            type="text" 
                            value={quickTaskTitle} 
                            onChange={(e) => setQuickTaskTitle(e.target.value)} 
                            onKeyDown={(e) => e.key === 'Enter' && handleAddQuickTask()} 
                            placeholder="Суть задачи..." 
                            className="flex-1 w-full bg-surface text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 placeholder-secondary/50 border border-white/5"
                        />
                        
                        {/* Effort Selector moved here */}
                        <div className="flex bg-bg/30 rounded-xl p-1 gap-1 shrink-0">
                            {(['quick', 'medium', 'long'] as Effort[]).map(e => {
                                const Icon = EFFORT_CONFIG[e].icon;
                                return (
                                    <button
                                        key={e}
                                        onClick={() => setQuickTaskEffort(e)}
                                        className={`p-2 rounded-lg transition-all flex items-center justify-center ${
                                            quickTaskEffort === e 
                                            ? 'bg-white/10 text-white shadow-sm' 
                                            : 'text-secondary hover:text-white hover:bg-white/5'
                                        }`}
                                        title={EFFORT_CONFIG[e].label}
                                    >
                                        <Icon size={18} className={quickTaskEffort === e ? EFFORT_CONFIG[e].color : ''} />
                                    </button>
                                );
                            })}
                        </div>

                        <button 
                            onClick={handleAddQuickTask} 
                            disabled={!quickClientId || !quickTaskTitle.trim()} 
                            className="bg-accent hover:bg-accent/90 text-bg p-3 rounded-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed font-bold shrink-0"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                  </div>
              </div>
              {/* --- END QUICK TASK BAR --- */}

              <div>
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-xl font-light text-white">Ваши клиенты</h2>
                    <button 
                        onClick={() => setIsClientFormOpen(!isClientFormOpen)} 
                        className={`p-2 rounded-full transition-all ${isClientFormOpen ? 'bg-red-500/20 text-red-400 rotate-45' : 'bg-surface hover:bg-white/10 text-secondary hover:text-white'}`}
                    >
                        {isClientFormOpen ? <Plus size={16} /> : <UserPlus size={16} />}
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {isClientFormOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-8">
                            <div className="bg-surface p-4 rounded-2xl flex flex-col gap-3 border border-white/5 max-w-2xl">
                                <div className="flex gap-3 w-full">
                                    <input 
                                        type="text" 
                                        value={newClientName} 
                                        onChange={(e) => setNewClientName(e.target.value)} 
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddClient()} 
                                        placeholder="Имя клиента..." 
                                        className="flex-1 bg-bg text-white px-4 py-3 rounded-xl outline-none focus:ring-1 focus:ring-primary/50" 
                                        autoFocus 
                                    />
                                    <button onClick={handleAddClient} className="bg-primary text-bg px-6 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity">
                                        Создать
                                    </button>
                                </div>
                                
                                <div className="flex items-center gap-3 px-1">
                                    <span className="text-sm text-secondary">Важность:</span>
                                    <div className="flex bg-bg/30 rounded-lg p-1 gap-1">
                                        {(['high', 'normal', 'low'] as Priority[]).map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setNewClientPriority(p)}
                                                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${
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
                    <div className="text-center py-20 text-secondary">
                        <FolderOpen size={48} className="mx-auto mb-4 opacity-20" />
                        <p>База пуста. Создайте первого клиента.</p>
                    </div> 
                  ) : (
                    <>
                        {(['high', 'normal', 'low'] as Priority[]).map(type => (
                            <ClientSection 
                                key={type}
                                type={type} 
                                title={type === 'high' ? 'Важные' : type === 'normal' ? 'Обычные' : 'Не спеша'} 
                                items={groupedClients[type]} 
                                isOpen={sectionsOpen[type]}
                                onToggle={() => setSectionsOpen(p => ({...p, [type]: !p[type]}))}
                                onSelectClient={(id) => { setSelectedClientId(id); setClientTab('active'); }}
                                onRemoveClient={actions.removeClient}
                                onUpdatePriority={actions.updateClientPriority}
                            />
                        ))}
                    </>
                  )}
              </div>
            </motion.div>
          )}

          {viewMode === 'dashboard' && selectedClientId && selectedClient && (
            <motion.div key="client-detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="max-w-2xl mx-auto w-full">
              <div className="flex items-center justify-between mb-8">
                 <h2 className="text-3xl font-bold text-white truncate max-w-[70%]">{selectedClient.name}</h2>
                 <div className={`px-3 py-1 rounded-full border border-white/10 text-sm whitespace-nowrap ${PRIORITY_CONFIG[selectedClient.priority].color}`}>
                    {PRIORITY_CONFIG[selectedClient.priority].label} приоритет
                 </div>
              </div>
              
              <div className="flex bg-surface p-1 rounded-xl mb-6 shadow-md border border-white/5">
                {(['active', 'notes', 'archive'] as ClientTab[]).map(tab => (
                   <button 
                        key={tab} 
                        onClick={() => setClientTab(tab)} 
                        className={`flex-1 py-3 rounded-lg text-sm font-bold capitalize transition-all ${clientTab === tab ? 'bg-bg text-white shadow-sm' : 'text-secondary hover:text-white'}`}
                   >
                        {tab === 'active' ? 'Задачи' : tab === 'notes' ? 'Заметки' : 'Архив'}
                   </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {clientTab === 'active' && (
                  <motion.div key="active-tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                    
                    <div className="bg-surface p-4 rounded-2xl border border-white/5 shadow-lg mb-6 flex flex-col gap-3">
                        <div className="flex gap-2 w-full">
                            <input 
                                type="text" 
                                placeholder="Что нужно сделать?" 
                                value={newTaskTitle} 
                                onChange={(e) => setNewTaskTitle(e.target.value)} 
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTaskInternal()} 
                                className="flex-1 bg-bg/50 text-white px-4 py-3 rounded-xl outline-none placeholder-secondary/50 text-lg border border-transparent focus:border-primary/50 transition-colors"
                            />
                            <button onClick={handleAddTaskInternal} className="bg-primary hover:bg-primary/90 text-bg px-6 rounded-xl font-bold transition-colors">
                                <Plus size={24} />
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-4 px-1">
                            <div className="flex bg-bg/30 rounded-lg p-1 gap-1">
                                {(['high', 'normal', 'low'] as Priority[]).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setNewTaskPriority(p)}
                                        className={`px-3 py-1 rounded-md text-xs font-bold uppercase transition-all ${
                                            newTaskPriority === p 
                                            ? `${PRIORITY_CONFIG[p].bg} ${PRIORITY_CONFIG[p].color} shadow-sm` 
                                            : 'text-secondary hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        {PRIORITY_CONFIG[p].label}
                                    </button>
                                ))}
                            </div>

                            <div className="w-px h-6 bg-white/10"></div>

                            <div className="flex bg-bg/30 rounded-lg p-1 gap-1">
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
                                    <div className="text-center py-20 text-secondary/30 text-lg border-2 border-dashed border-white/5 rounded-2xl">
                                        Задач нет. <br/> Можно отдохнуть.
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
                      <div className="bg-surface p-6 rounded-2xl border border-white/5 shadow-lg relative group">
                        <textarea 
                            className="w-full h-[400px] bg-transparent text-white text-lg outline-none resize-none placeholder-secondary/30 scrollbar-thin" 
                            placeholder="Здесь можно писать заметки, коды доступа, идеи..." 
                            value={selectedClient.notes} 
                            onChange={(e) => actions.updateClientNotes(selectedClient.id, e.target.value)}
                        />
                        <div className="absolute bottom-4 right-4 text-xs text-secondary opacity-0 group-hover:opacity-50 transition-opacity">
                            Автосохранение
                        </div>
                    </div>
                  </motion.div>
                )}

                {clientTab === 'archive' && (
                  <motion.div key="archive" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                     <div className="flex justify-end">
                         <button 
                            onClick={copyReport} 
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${copiedId ? 'bg-success text-bg' : 'bg-surface border border-white/5 hover:bg-white/5'}`}
                         >
                             {copiedId ? <Check size={16}/> : <Copy size={16}/>} 
                             {copiedId ? 'Скопировано!' : 'Копировать отчет'}
                         </button>
                     </div>
                     <div className="space-y-2 pb-10">
                        {selectedClient.tasks.filter(t => t.isDone).length === 0 && (
                            <div className="text-center py-10 text-secondary/30">Архив пуст</div>
                        )}
                        {selectedClient.tasks.filter(t => t.isDone).map(task => (
                           <div key={task.id} className="bg-bg/40 p-4 rounded-xl flex items-center gap-4 group hover:bg-bg/60 transition-colors">
                                 <div className="text-success"><CheckCircle2 size={18} /></div>
                                 <div className="flex-1 text-gray-400 line-through decoration-white/10">{task.title}</div>
                                 <button onClick={() => actions.toggleTask(selectedClient.id, task.id)} className="text-xs text-secondary hover:text-white opacity-0 group-hover:opacity-100 underline transition-opacity">
                                    Вернуть
                                 </button>
                                 <button onClick={() => actions.deleteTask(selectedClient.id, task.id)} className="text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-4 p-2">
                                    <Trash2 size={18} />
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