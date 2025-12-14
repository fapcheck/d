import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, LayoutDashboard, ArrowLeft, Clock, Send, UserPlus, Focus, 
  ListTodo, ChevronDown, ChevronRight, FolderOpen, StickyNote, Archive, 
  Copy, Check, CheckCircle2, Trash2, Coffee
} from 'lucide-react';

import { useZenData } from './hooks/useZenData';
import { ClientCard } from './components/ClientCard';
import { FocusView } from './components/FocusView';
import { PRIORITY_CONFIG, EFFORT_CONFIG } from './types';
import type { Priority, Effort, Client } from './types';

function App() {
  const { clients, isLoaded, actions } = useZenData();

  // UI State (только то, что касается отображения)
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'dashboard' | 'focus'>('dashboard');
  const [clientTab, setClientTab] = useState<'active' | 'archive' | 'notes'>('active');
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState({ high: true, normal: true, low: true });
  
  // Form State
  const [newClientName, setNewClientName] = useState('');
  const [newClientPriority, setNewClientPriority] = useState<Priority>('normal');
  const [quickClientId, setQuickClientId] = useState<string>('');
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskPriority, setQuickTaskPriority] = useState<Priority>('normal');
  const [quickTaskEffort, setQuickTaskEffort] = useState<Effort>('quick');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('normal');
  const [newTaskEffort, setNewTaskEffort] = useState<Effort>('quick');

  // Derived
  const selectedClient = clients.find(c => c.id === selectedClientId);
  const activeTasks = selectedClient?.tasks.filter(t => !t.isDone) || [];
  const groupedClients = {
      high: clients.filter(c => c.priority === 'high'),
      normal: clients.filter(c => c.priority === 'normal'),
      low: clients.filter(c => c.priority === 'low')
  };

  // Handlers
  const handleAddClient = () => {
    actions.addClient(newClientName, newClientPriority);
    setNewClientName('');
    setNewClientPriority('normal');
    setIsClientFormOpen(false);
  };

  const handleAddQuickTask = () => {
    if(!quickClientId) return;
    actions.addTask(Number(quickClientId), quickTaskTitle, quickTaskPriority, quickTaskEffort);
    setQuickTaskTitle('');
  };

  const handleAddTaskInternal = () => {
     if(selectedClientId) {
         actions.addTask(selectedClientId, newTaskTitle, newTaskPriority, newTaskEffort);
         setNewTaskTitle('');
     }
  };

  const copyReport = () => {
    if (!selectedClient) return;
    const doneTasks = selectedClient.tasks.filter(t => t.isDone);
    let report = `Отчет для: ${selectedClient.name}\n`;
    doneTasks.forEach(t => report += `— ${t.title}\n`);
    navigator.clipboard.writeText(report);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const ClientSection = ({ type, title, items }: { type: Priority, title: string, items: Client[] }) => {
    if (items.length === 0) return null;
    return (
        <div className="mb-6">
            <button 
              onClick={() => setSectionsOpen(p => ({...p, [type]: !p[type]}))}
              className={`flex items-center gap-2 w-full text-left mb-3 hover:opacity-80 transition-opacity ${PRIORITY_CONFIG[type].color}`}
            >
                {sectionsOpen[type] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                <span className="font-bold text-lg tracking-wide uppercase">{title}</span>
                <span className="text-xs bg-surface px-2 py-0.5 rounded-full border border-white/10 text-white">{items.length}</span>
                <div className="h-px bg-current flex-1 opacity-20 ml-2"></div>
            </button>
            <AnimatePresence>
                {sectionsOpen[type] && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-2">
                          {items.map(client => (
                              <ClientCard 
                                key={client.id} 
                                client={client} 
                                onClick={() => { setSelectedClientId(client.id); setClientTab('active'); }}
                                onRemove={actions.removeClient}
                                onUpdatePriority={actions.updateClientPriority}
                              />
                          ))}
                       </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
  };

  if (!isLoaded) return <div className="min-h-screen bg-bg flex items-center justify-center text-white"><Clock className="animate-spin mr-2"/> Загрузка...</div>;

  return (
    <div className="min-h-screen bg-bg p-8 flex flex-col items-center text-gray-200 font-sans selection:bg-primary selection:text-bg">
      <header className="w-full max-w-5xl flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          {selectedClientId && viewMode === 'dashboard' && (
             <button onClick={() => setSelectedClientId(null)} className="bg-surface hover:bg-white/10 p-2 rounded-xl transition-colors"><ArrowLeft size={24} /></button>
          )}
          <h1 className="text-2xl font-light tracking-wider text-white">Zen<span className="font-bold text-primary">Manager</span></h1>
        </div>
        <div className="flex bg-surface rounded-xl p-1 gap-1 shadow-lg border border-white/5">
            <button onClick={() => { setViewMode('dashboard'); setSelectedClientId(null); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-bold ${viewMode === 'dashboard' ? 'bg-primary text-bg' : 'text-secondary hover:text-white'}`}><LayoutDashboard size={16} /> Дашборд</button>
            <button onClick={() => setViewMode('focus')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-bold ${viewMode === 'focus' ? 'bg-accent text-bg' : 'text-secondary hover:text-white'}`}><Focus size={16} /> Фокус</button>
        </div>
      </header>

      <main className="w-full max-w-5xl relative">
        <AnimatePresence mode="wait">
          {viewMode === 'dashboard' && !selectedClientId && (
            <motion.div key="clients-list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10">
              
              {/* Quick Task Bar */}
              <div className="bg-surface p-1 rounded-2xl shadow-lg border border-white/5 relative overflow-hidden">
                  <div className="bg-bg/50 p-4 rounded-xl flex flex-col md:flex-row gap-3 items-center">
                    <div className="w-full md:w-1/4 relative">
                        <select value={quickClientId} onChange={(e) => setQuickClientId(e.target.value)} className="w-full bg-surface text-white px-4 py-3 rounded-xl focus:outline-none cursor-pointer appearance-none border border-transparent focus:border-primary/50">
                            <option value="" disabled>Кому задача?</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-3.5 pointer-events-none text-secondary" />
                    </div>
                    <input type="text" value={quickTaskTitle} onChange={(e) => setQuickTaskTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddQuickTask()} placeholder="Суть задачи..." className="flex-1 w-full bg-surface text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 placeholder-secondary/50"/>
                    <button onClick={handleAddQuickTask} disabled={!quickClientId || !quickTaskTitle.trim()} className="bg-accent hover:bg-accent/90 text-bg p-3 rounded-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed"><Send size={20} /></button>
                  </div>
              </div>

              {/* Client List */}
              <div>
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-xl font-light text-white">Ваши клиенты</h2>
                    <button onClick={() => setIsClientFormOpen(!isClientFormOpen)} className={`p-2 rounded-full transition-all ${isClientFormOpen ? 'bg-red-500/20 text-red-400 rotate-45' : 'bg-surface hover:bg-white/10 text-secondary hover:text-white'}`}>{isClientFormOpen ? <Plus size={16} /> : <UserPlus size={16} />}</button>
                  </div>
                  <AnimatePresence>
                    {isClientFormOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-8">
                            <div className="bg-surface p-4 rounded-2xl flex flex-col md:flex-row gap-3 border border-white/5 max-w-2xl">
                                <input type="text" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddClient()} placeholder="Имя..." className="flex-1 bg-bg text-white px-4 py-3 rounded-xl outline-none" autoFocus />
                                <button onClick={handleAddClient} className="bg-primary text-bg px-6 rounded-xl font-bold text-sm">Создать</button>
                            </div>
                        </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {clients.length === 0 ? <div className="text-center py-20 text-secondary"><FolderOpen size={48} className="mx-auto mb-4 opacity-20" />База пуста.</div> : (
                    <>
                        <ClientSection type="high" title="Важные" items={groupedClients.high} />
                        <ClientSection type="normal" title="Обычные" items={groupedClients.normal} />
                        <ClientSection type="low" title="Не спеша" items={groupedClients.low} />
                    </>
                  )}
              </div>
            </motion.div>
          )}

          {viewMode === 'dashboard' && selectedClientId && selectedClient && (
            <motion.div key="client-detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="max-w-2xl mx-auto w-full">
              <div className="flex items-center justify-between mb-8">
                 <h2 className="text-3xl font-bold text-white">{selectedClient.name}</h2>
                 <div className={`px-3 py-1 rounded-full border border-white/10 text-sm ${PRIORITY_CONFIG[selectedClient.priority].color}`}>{PRIORITY_CONFIG[selectedClient.priority].label} приоритет</div>
              </div>
              <div className="flex bg-surface p-1 rounded-xl mb-6 shadow-md border border-white/5">
                {['active', 'notes', 'archive'].map(tab => (
                   <button key={tab} onClick={() => setClientTab(tab as any)} className={`flex-1 py-3 rounded-lg text-sm font-bold capitalize transition-all ${clientTab === tab ? 'bg-bg text-white shadow-sm' : 'text-secondary hover:text-white'}`}>{tab}</button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {clientTab === 'active' && (
                  <motion.div key="active-tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                    <div className="bg-surface p-2 rounded-2xl flex gap-2 border border-white/5 shadow-lg mb-6 flex-col md:flex-row">
                        <input type="text" placeholder="Что нужно сделать?" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTaskInternal()} className="flex-1 bg-transparent text-white px-4 py-3 outline-none placeholder-secondary/50 text-lg"/>
                        <button onClick={handleAddTaskInternal} className="bg-primary text-bg p-3 rounded-xl"><Plus size={20} /></button>
                    </div>
                    <div className="space-y-3">
                        {activeTasks.length === 0 ? <div className="text-center py-20 text-secondary/30 text-lg">Задач нет.</div> : activeTasks.map(task => (
                          <motion.div layout key={task.id} className="bg-surface p-5 rounded-2xl flex items-center justify-between group border border-white/5 hover:border-white/10 transition-all hover:translate-x-1">
                            <div className="flex items-center gap-5 flex-1">
                              <button onClick={() => actions.toggleTask(selectedClient.id, task.id)} className="w-7 h-7 rounded-full border-2 border-secondary/50 hover:border-success hover:bg-success/10 transition-all shrink-0" />
                              <div>
                                <div className="text-white text-lg font-medium">{task.title}</div>
                                <div className="flex gap-3 mt-1.5 opacity-60">
                                  <span className={`text-xs ${PRIORITY_CONFIG[task.priority].color}`}>{PRIORITY_CONFIG[task.priority].label}</span>
                                  <span className={`text-xs ${EFFORT_CONFIG[task.effort].color}`}>{EFFORT_CONFIG[task.effort].label}</span>
                                </div>
                              </div>
                            </div>
                            <button onClick={() => actions.deleteTask(selectedClient.id, task.id)} className="text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-4 p-2"><Trash2 size={18} /></button>
                          </motion.div>
                        ))}
                    </div>
                  </motion.div>
                )}
                {clientTab === 'notes' && (
                  <motion.div key="notes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                     <div className="bg-surface p-6 rounded-2xl border border-white/5 shadow-lg">
                        <textarea className="w-full h-[400px] bg-transparent text-white text-lg outline-none resize-none placeholder-secondary/30" placeholder="Заметки..." value={selectedClient.notes} onChange={(e) => actions.updateClientNotes(selectedClient.id, e.target.value)}/>
                    </div>
                  </motion.div>
                )}
                {clientTab === 'archive' && (
                  <motion.div key="archive" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                     <div className="flex justify-end"><button onClick={copyReport} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${copiedId ? 'bg-success text-bg' : 'bg-surface border border-white/5'}`}>{copiedId ? <Check size={16}/> : <Copy size={16}/>} Отчет</button></div>
                     <div className="space-y-2">
                        {selectedClient.tasks.filter(t=>t.isDone).map(task => (
                           <div key={task.id} className="bg-bg/40 p-4 rounded-xl flex items-center gap-4 group hover:bg-bg/60">
                                 <div className="text-success"><CheckCircle2 size={18} /></div>
                                 <div className="flex-1 text-gray-400 line-through">{task.title}</div>
                                 <button onClick={() => actions.toggleTask(selectedClient.id, task.id)} className="text-xs text-secondary hover:text-white opacity-0 group-hover:opacity-100 underline">Вернуть</button>
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