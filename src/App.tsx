import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, CheckCircle2, LayoutDashboard, ArrowLeft, Clock, Zap, Coffee,
  Send, UserPlus, Focus, Flame, Target, Archive, ListTodo, ChevronDown,
  ChevronRight, FolderOpen, CheckSquare, StickyNote, Copy, Check
} from 'lucide-react';

// --- ИЗМЕНЕНИЯ ДЛЯ TAURI V2 ---
// Используем новые плагины вместо @tauri-apps/api
import { writeTextFile, readTextFile, mkdir, exists, BaseDirectory } from '@tauri-apps/plugin-fs';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

// --- Типы данных ---
type Priority = 'high' | 'normal' | 'low';
type Effort = 'quick' | 'medium' | 'long';

interface Task {
  id: number;
  title: string;
  isDone: boolean;
  priority: Priority;
  effort: Effort;
  createdAt: number;
  completedAt?: number;
}

interface Client {
  id: number;
  name: string;
  priority: Priority;
  notes: string;
  tasks: Task[];
}

// --- Константы ---
const PRIORITY_CONFIG = {
  high: { label: 'Важно', color: 'text-red-400', border: 'border-red-400', bg: 'bg-red-400/10', weight: 3 },
  normal: { label: 'Обычно', color: 'text-blue-400', border: 'border-blue-400', bg: 'bg-blue-400/10', weight: 2 },
  low: { label: 'Не горит', color: 'text-green-400', border: 'border-green-400', bg: 'bg-green-400/10', weight: 1 },
};

const EFFORT_CONFIG = {
  quick: { label: '5 мин', icon: Zap, color: 'text-yellow-400' },
  medium: { label: '30 мин', icon: Clock, color: 'text-orange-400' },
  long: { label: 'Долго', icon: Coffee, color: 'text-purple-400' },
};

const DB_FILENAME = 'zen-db.json';

function App() {
  // --- Состояние ---
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'dashboard' | 'focus'>('dashboard');
  const [clientTab, setClientTab] = useState<'active' | 'archive' | 'notes'>('active');
  const [copiedId, setCopiedId] = useState<boolean>(false);
  
  // UI Состояния
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPriority, setNewClientPriority] = useState<Priority>('normal');
  const [sectionsOpen, setSectionsOpen] = useState({ high: true, normal: true, low: true });
  
  const [quickClientId, setQuickClientId] = useState<string>(''); 
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskPriority, setQuickTaskPriority] = useState<Priority>('normal');
  const [quickTaskEffort, setQuickTaskEffort] = useState<Effort>('quick');

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('normal');
  const [newTaskEffort, setNewTaskEffort] = useState<Effort>('quick');

  // --- ЗВУК И УВЕДОМЛЕНИЯ ---
  const playSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const sendSystemNotification = async (title: string) => {
    let permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === 'granted';
    }
    if (permissionGranted) {
      sendNotification({ title: 'Zen Manager', body: `Готово: ${title} 🎉` });
    }
  };

  // --- СОХРАНЕНИЕ И ЗАГРУЗКА (TAURI V2) ---
  
  useEffect(() => {
    async function loadData() {
      try {
        // В v2 используем mkdir вместо createDir
        const dirExists = await exists('', { baseDir: BaseDirectory.AppLocalData });
        if (!dirExists) {
            await mkdir('', { baseDir: BaseDirectory.AppLocalData, recursive: true });
        }

        const fileExists = await exists(DB_FILENAME, { baseDir: BaseDirectory.AppLocalData });
        
        if (fileExists) {
          const content = await readTextFile(DB_FILENAME, { baseDir: BaseDirectory.AppLocalData });
          const parsed = JSON.parse(content);
          
          const migrated = parsed.map((c: any) => ({
            ...c,
            notes: c.notes || '',
            tasks: Array.isArray(c.tasks) ? c.tasks.map((t: any) => ({
              ...t,
              completedAt: (t.isDone && !t.completedAt) ? Date.now() : t.completedAt
            })) : []
          }));
          setClients(migrated);
        } else {
          // Фолбэк на localStorage
          const localSaved = localStorage.getItem('zenClients_v2');
          if (localSaved) {
             setClients(JSON.parse(localSaved));
          }
        }
      } catch (err) {
        console.error("Ошибка загрузки:", err);
      } finally {
        setIsLoaded(true);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const saveData = async () => {
      try {
        await writeTextFile(DB_FILENAME, JSON.stringify(clients), { baseDir: BaseDirectory.AppLocalData });
      } catch (err) {
        console.error("Ошибка сохранения:", err);
      }
    };
    
    const timeout = setTimeout(saveData, 500);
    return () => clearTimeout(timeout);
  }, [clients, isLoaded]);


  // --- Логика (Без изменений) ---
  const addClient = () => {
    if (!newClientName.trim()) return;
    const newClient: Client = {
      id: Date.now(),
      name: newClientName,
      priority: newClientPriority,
      notes: '',
      tasks: [],
    };
    setClients([...clients, newClient]);
    setNewClientName('');
    setNewClientPriority('normal');
    setIsClientFormOpen(false);
  };

  const removeClient = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm('Удалить клиента и все его задачи?')) {
      setClients(clients.filter(c => c.id !== id));
      if (selectedClientId === id) setSelectedClientId(null);
    }
  };

  const updateClientPriority = (e: React.ChangeEvent<HTMLSelectElement>, clientId: number) => {
    e.stopPropagation();
    const newPriority = e.target.value as Priority;
    setClients(clients.map(c => c.id === clientId ? { ...c, priority: newPriority } : c));
  };

  const updateClientNotes = (notes: string) => {
    if (selectedClientId === null) return;
    setClients(clients.map(c => c.id === selectedClientId ? { ...c, notes } : c));
  };

  const addTaskInternal = () => {
    if (!newTaskTitle.trim() || selectedClientId === null) return;
    const newTask: Task = {
      id: Date.now(),
      title: newTaskTitle,
      isDone: false,
      priority: newTaskPriority,
      effort: newTaskEffort,
      createdAt: Date.now(),
    };
    setClients(clients.map(c => c.id === selectedClientId ? { ...c, tasks: [newTask, ...c.tasks] } : c));
    setNewTaskTitle('');
  };

  const addQuickTask = () => {
    if (!quickTaskTitle.trim() || !quickClientId) return;
    const targetId = Number(quickClientId);
    const newTask: Task = {
      id: Date.now(),
      title: quickTaskTitle,
      isDone: false,
      priority: quickTaskPriority,
      effort: quickTaskEffort,
      createdAt: Date.now(),
    };
    setClients(clients.map(c => c.id === targetId ? { ...c, tasks: [newTask, ...c.tasks] } : c));
    setQuickTaskTitle(''); 
  };

  const toggleTask = (clientId: number, taskId: number) => {
    setClients(clients.map(client => {
      if (client.id !== clientId) return client;
      return {
        ...client,
        tasks: client.tasks.map(t => {
          if (t.id === taskId) {
            const willBeDone = !t.isDone;
            const completionTime = willBeDone ? Date.now() : undefined;
            
            if (willBeDone) {
                playSound();
                sendSystemNotification(t.title);
            }
            
            return { 
                ...t, 
                isDone: willBeDone, 
                completedAt: completionTime 
            };
          }
          return t;
        })
      };
    }));
  };

  const deleteTask = (clientId: number, taskId: number) => {
    setClients(clients.map(c => 
      c.id === clientId ? { ...c, tasks: c.tasks.filter(t => t.id !== taskId) } : c
    ));
  };

  const copyReport = () => {
    const selectedClient = clients.find(c => c.id === selectedClientId);
    if (!selectedClient) return;

    const doneTasks = selectedClient.tasks.filter(t => t.isDone);
    if (doneTasks.length === 0) {
        alert("Нет выполненных задач для отчета");
        return;
    }

    const groups: { [key: string]: Task[] } = {};
    doneTasks.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
    doneTasks.forEach(task => {
      const dateVal = task.completedAt ? task.completedAt : Date.now();
      const date = new Date(dateVal).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(task);
    });

    let report = `Привет! 👋\nВот отчет по работе для: ${selectedClient.name}\n\n`;
    Object.entries(groups).forEach(([date, tasks]) => {
        report += `📅 ${date}:\n`;
        tasks.forEach(t => {
            report += `— ${t.title}\n`;
        });
        report += `\n`;
    });
    report += `Итого выполнено: ${doneTasks.length} ✅`;

    navigator.clipboard.writeText(report);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const getGroupedHistory = (tasks: Task[]) => {
    const doneTasks = tasks.filter(t => t.isDone);
    doneTasks.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
    const groups: { [key: string]: Task[] } = {};
    doneTasks.forEach(task => {
      const dateVal = task.completedAt ? task.completedAt : Date.now();
      const date = new Date(dateVal).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
      
      if (!groups[date]) groups[date] = [];
      groups[date].push(task);
    });
    return groups;
  };

  const getFocusTask = () => {
    let allTasks: { task: Task; client: Client }[] = [];
    clients.forEach(client => {
      client.tasks.forEach(task => {
        if (!task.isDone) {
          allTasks.push({ task, client });
        }
      });
    });
    if (allTasks.length === 0) return null;
    allTasks.sort((a, b) => {
      const clientDiff = PRIORITY_CONFIG[b.client.priority].weight - PRIORITY_CONFIG[a.client.priority].weight;
      if (clientDiff !== 0) return clientDiff;
      const taskDiff = PRIORITY_CONFIG[b.task.priority].weight - PRIORITY_CONFIG[a.task.priority].weight;
      return taskDiff;
    });
    return allTasks[0];
  };

  const toggleSection = (section: keyof typeof sectionsOpen) => {
      setSectionsOpen(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const activeTasks = selectedClient?.tasks.filter(t => !t.isDone) || [];
  const groupedHistory = selectedClient ? getGroupedHistory(selectedClient.tasks) : {};
  const focusItem = getFocusTask();
  const groupedClients = {
      high: clients.filter(c => c.priority === 'high'),
      normal: clients.filter(c => c.priority === 'normal'),
      low: clients.filter(c => c.priority === 'low')
  };

  const ClientSection = ({ type, title, items }: { type: Priority, title: string, items: Client[] }) => {
      const isOpen = sectionsOpen[type];
      if (items.length === 0) return null;

      return (
          <div className="mb-6">
              <button 
                onClick={() => toggleSection(type)}
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
                            {items.map(client => {
                                const activeCount = client.tasks.filter(t => !t.isDone).length;
                                const doneCount = client.tasks.filter(t => t.isDone).length;
                                
                                return (
                                    <motion.div 
                                    key={client.id}
                                    layout
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    onClick={() => { setSelectedClientId(client.id); setClientTab('active'); }}
                                    className={`bg-surface p-6 rounded-2xl cursor-pointer hover:bg-white/5 border-l-4 ${PRIORITY_CONFIG[client.priority].border} transition-all group relative overflow-visible shadow-md hover:shadow-xl hover:-translate-y-1`}
                                    >
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-bold text-white truncate pr-2">{client.name}</h3>
                                        <button onClick={(e) => removeClient(e, client.id)} className="text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                        <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-4 mb-4 text-sm">
                                        <div className="flex items-center gap-1.5 text-secondary">
                                            <ListTodo size={14} />
                                            <span>Осталось: <strong className="text-white">{activeCount}</strong></span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-secondary opacity-60">
                                            <CheckSquare size={14} />
                                            <span>Сделано: <strong>{doneCount}</strong></span>
                                        </div>
                                    </div>
                                    <div className="h-px w-full bg-white/5 mb-3"></div>
                                    <div className="relative group/prio" onClick={(e) => e.stopPropagation()}>
                                        <select 
                                            value={client.priority}
                                            onChange={(e) => updateClientPriority(e, client.id)}
                                            className={`appearance-none w-full pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold uppercase cursor-pointer outline-none bg-bg/50 hover:bg-bg transition-colors ${PRIORITY_CONFIG[client.priority].color}`}
                                        >
                                            <option value="high">🔥 Важно</option>
                                            <option value="normal">🔹 Обычно</option>
                                            <option value="low">☕ Не спеша</option>
                                        </select>
                                        <div className={`absolute right-3 top-2 pointer-events-none ${PRIORITY_CONFIG[client.priority].color}`}>
                                            <ChevronDown size={12} />
                                        </div>
                                    </div>
                                    </motion.div>
                                );
                            })}
                         </div>
                      </motion.div>
                  )}
              </AnimatePresence>
          </div>
      )
  };

  if (!isLoaded) {
      return <div className="min-h-screen bg-bg flex items-center justify-center text-white">Загрузка Zen...</div>
  }

  return (
    <div className="min-h-screen bg-bg p-8 flex flex-col items-center text-gray-200 font-sans selection:bg-primary selection:text-bg">
      <header className="w-full max-w-5xl flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          {selectedClientId && viewMode === 'dashboard' && (
             <button onClick={() => setSelectedClientId(null)} className="bg-surface hover:bg-white/10 p-2 rounded-xl transition-colors">
               <ArrowLeft size={24} />
             </button>
          )}
          <div>
            <h1 className="text-2xl font-light tracking-wider text-white">
              Zen<span className="font-bold text-primary">Manager</span>
            </h1>
          </div>
        </div>
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
      </header>

      <main className="w-full max-w-5xl relative">
        <AnimatePresence mode="wait">
          {viewMode === 'dashboard' && !selectedClientId && (
            <motion.div 
              key="clients-list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              <div className="bg-surface p-1 rounded-2xl shadow-lg border border-white/5 relative overflow-hidden">
                  <div className="bg-bg/50 p-4 rounded-xl flex flex-col md:flex-row gap-3 items-center">
                    <div className="w-full md:w-1/4 relative">
                        <select 
                            value={quickClientId}
                            onChange={(e) => setQuickClientId(e.target.value)}
                            className="w-full bg-surface text-white px-4 py-3 rounded-xl focus:outline-none cursor-pointer appearance-none border border-transparent focus:border-primary/50"
                        >
                            <option value="" disabled>Кому задача?</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-3.5 pointer-events-none text-secondary">
                             <ChevronDown size={16} />
                        </div>
                    </div>
                    <input 
                        type="text" 
                        value={quickTaskTitle}
                        onChange={(e) => setQuickTaskTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addQuickTask()}
                        placeholder="Суть задачи..."
                        className="flex-1 w-full bg-surface text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 placeholder-secondary/50"
                    />
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative">
                            <select 
                                value={quickTaskPriority} 
                                onChange={(e) => setQuickTaskPriority(e.target.value as Priority)}
                                className="bg-surface text-secondary text-sm px-4 py-3 pr-8 rounded-xl outline-none cursor-pointer appearance-none hover:text-white transition-colors"
                            >
                                <option value="high">🔥 Важно</option>
                                <option value="normal">🔹 Обычно</option>
                                <option value="low">☕ Не горит</option>
                            </select>
                        </div>
                        <div className="relative">
                            <select 
                                value={quickTaskEffort} 
                                onChange={(e) => setQuickTaskEffort(e.target.value as Effort)}
                                className="bg-surface text-secondary text-sm px-4 py-3 pr-8 rounded-xl outline-none cursor-pointer appearance-none hover:text-white transition-colors"
                            >
                                <option value="quick">⚡ 5 мин</option>
                                <option value="medium">⏱️ 30 мин</option>
                                <option value="long">🐢 Долго</option>
                            </select>
                        </div>
                        <button 
                            onClick={addQuickTask} 
                            disabled={!quickClientId || !quickTaskTitle.trim()}
                            className="bg-accent hover:bg-accent/90 text-bg p-3 rounded-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                  </div>
              </div>

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
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mb-8"
                        >
                            <div className="bg-surface p-4 rounded-2xl flex flex-col md:flex-row gap-3 border border-white/5 max-w-2xl">
                                <input 
                                    type="text" 
                                    value={newClientName}
                                    onChange={(e) => setNewClientName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addClient()}
                                    placeholder="Имя нового клиента..."
                                    className="flex-1 bg-bg text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <div className="relative">
                                        <select 
                                            value={newClientPriority}
                                            onChange={(e) => setNewClientPriority(e.target.value as Priority)}
                                            className="bg-bg text-white px-4 py-3 pr-8 rounded-xl outline-none cursor-pointer border-r-[8px] border-bg appearance-none"
                                        >
                                            <option value="high">🔥 Важный</option>
                                            <option value="normal">🔹 Обычный</option>
                                            <option value="low">☕ Не спеша</option>
                                        </select>
                                        <div className="absolute right-4 top-4 pointer-events-none text-white/50">
                                            <ChevronDown size={14} />
                                        </div>
                                    </div>
                                    <button onClick={addClient} className="bg-primary hover:bg-primary/90 text-bg px-6 rounded-xl transition-colors font-bold text-sm">
                                        Создать
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                  </AnimatePresence>
                  {clients.length === 0 ? (
                       <div className="text-center py-20 text-secondary">
                           <FolderOpen size={48} className="mx-auto mb-4 opacity-20" />
                           База пуста.
                       </div>
                  ) : (
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
            <motion.div 
              key="client-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-2xl mx-auto w-full" 
            >
              <div className="flex items-center justify-between mb-8">
                 <h2 className="text-3xl font-bold text-white">{selectedClient.name}</h2>
                 <div className={`px-3 py-1 rounded-full border border-white/10 text-sm ${PRIORITY_CONFIG[selectedClient.priority].color}`}>
                    {PRIORITY_CONFIG[selectedClient.priority].label} приоритет
                 </div>
              </div>
              <div className="flex bg-surface p-1 rounded-xl mb-6 shadow-md border border-white/5">
                <button 
                  onClick={() => setClientTab('active')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${clientTab === 'active' ? 'bg-bg text-white shadow-sm' : 'text-secondary hover:text-white'}`}
                >
                  <ListTodo size={18} /> Задачи ({activeTasks.length})
                </button>
                <button 
                  onClick={() => setClientTab('notes')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${clientTab === 'notes' ? 'bg-bg text-white shadow-sm' : 'text-secondary hover:text-white'}`}
                >
                  <StickyNote size={18} /> Заметки
                </button>
                <button 
                  onClick={() => setClientTab('archive')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${clientTab === 'archive' ? 'bg-bg text-white shadow-sm' : 'text-secondary hover:text-white'}`}
                >
                  <Archive size={18} /> Архив
                </button>
              </div>

              <AnimatePresence mode="wait">
                {clientTab === 'active' && (
                  <motion.div 
                    key="active-tasks"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="bg-surface p-2 rounded-2xl flex gap-2 border border-white/5 shadow-lg mb-6 focus-within:ring-2 focus-within:ring-primary/30 transition-all flex-col md:flex-row">
                        <input 
                        type="text"
                        placeholder="Что нужно сделать?"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTaskInternal()}
                        className="flex-1 bg-transparent text-white px-4 py-3 outline-none placeholder-secondary/50 text-lg"
                        />
                        <div className="flex items-center gap-2 pr-2 pl-2 pb-2 md:pl-0 md:pb-0">
                           <div className="relative">
                               <select 
                                value={newTaskPriority}
                                onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
                                className="bg-bg/50 text-secondary text-xs font-bold px-3 py-3 pr-6 rounded-xl outline-none cursor-pointer hover:text-white appearance-none"
                              >
                                <option value="high">🔥</option>
                                <option value="normal">🔹</option>
                                <option value="low">☕</option>
                              </select>
                           </div>
                           <div className="relative">
                               <select 
                                value={newTaskEffort}
                                onChange={(e) => setNewTaskEffort(e.target.value as Effort)}
                                className="bg-bg/50 text-secondary text-xs font-bold px-3 py-3 pr-6 rounded-xl outline-none cursor-pointer hover:text-white appearance-none"
                              >
                                <option value="quick">⚡</option>
                                <option value="medium">⏱️</option>
                                <option value="long">🐢</option>
                              </select>
                           </div>
                          <button onClick={addTaskInternal} className="bg-primary text-bg p-3 rounded-xl hover:opacity-90 transition-opacity">
                              <Plus size={20} strokeWidth={3} />
                          </button>
                        </div>
                    </div>
                    <div className="space-y-3">
                      {activeTasks.length === 0 ? (
                        <div className="text-center py-20 text-secondary/30 text-lg">
                           <Coffee size={48} className="mx-auto mb-4 opacity-50" />
                           Задач нет. Можно отдыхать.
                        </div>
                      ) : (
                        activeTasks.map(task => (
                          <motion.div 
                            layout
                            key={task.id}
                            className="bg-surface p-5 rounded-2xl flex items-center justify-between group border border-white/5 hover:border-white/10 transition-all hover:translate-x-1"
                          >
                            <div className="flex items-center gap-5 flex-1">
                              <button 
                                onClick={() => toggleTask(selectedClient.id, task.id)}
                                className="w-7 h-7 rounded-full border-2 border-secondary/50 hover:border-success hover:bg-success/10 transition-all shrink-0"
                              />
                              <div>
                                <div className="text-white text-lg font-medium">{task.title}</div>
                                <div className="flex gap-3 mt-1.5 opacity-60">
                                  <span className={`text-xs flex items-center gap-1 ${PRIORITY_CONFIG[task.priority].color}`}>
                                    {PRIORITY_CONFIG[task.priority].label}
                                  </span>
                                  <span className="text-xs text-secondary/30">•</span>
                                  <span className={`text-xs flex items-center gap-1 ${EFFORT_CONFIG[task.effort].color}`}>
                                    {EFFORT_CONFIG[task.effort].label}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button onClick={() => deleteTask(selectedClient.id, task.id)} className="text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-4 p-2">
                              <Trash2 size={18} />
                            </button>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}

                {clientTab === 'notes' && (
                  <motion.div 
                    key="notes"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                     <div className="bg-surface p-6 rounded-2xl border border-white/5 shadow-lg">
                        <textarea 
                           className="w-full h-[400px] bg-transparent text-white text-lg outline-none resize-none placeholder-secondary/30"
                           placeholder="Ссылки, контакты, важные заметки..."
                           value={selectedClient.notes}
                           onChange={(e) => updateClientNotes(e.target.value)}
                        />
                     </div>
                  </motion.div>
                )}

                {clientTab === 'archive' && (
                  <motion.div 
                    key="archive-tasks"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                     <div className="flex justify-end mb-4">
                        <button 
                            onClick={copyReport}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${copiedId ? 'bg-success text-bg' : 'bg-surface hover:bg-white/10 text-white border border-white/5'}`}
                        >
                            {copiedId ? <Check size={16} /> : <Copy size={16} />}
                            {copiedId ? 'Скопировано!' : 'Скопировать отчет'}
                        </button>
                     </div>
                     {Object.keys(groupedHistory).length === 0 ? (
                        <div className="text-center py-20 text-secondary/30">История пока пуста</div>
                     ) : (
                       Object.entries(groupedHistory).map(([date, tasks]) => (
                          <div key={date}>
                          <div className="flex items-center gap-3 mb-4">
                             <div className="h-px bg-white/10 flex-1"></div>
                             <div className="text-xs text-secondary uppercase tracking-widest font-bold">
                                {date}
                             </div>
                             <div className="h-px bg-white/10 flex-1"></div>
                          </div>
                          <div className="space-y-2">
                            {tasks.map(task => (
                              <div key={task.id} className="bg-bg/40 p-4 rounded-xl flex items-center gap-4 group hover:bg-bg/60 transition-colors">
                                 <div className="text-success"><CheckCircle2 size={18} /></div>
                                 <div className="flex-1 min-w-0">
                                    <div className="text-gray-400 line-through decoration-gray-600">{task.title}</div>
                                 </div>
                                 <button 
                                  onClick={() => toggleTask(selectedClient.id, task.id)}
                                  className="text-xs text-secondary hover:text-white opacity-0 group-hover:opacity-100 transition-opacity underline"
                                 >
                                   Вернуть
                                 </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                     )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {viewMode === 'focus' && (
            <motion.div 
              key="focus-mode"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col items-center justify-center py-10 w-full max-w-2xl mx-auto"
            >
                {focusItem ? (
                    <div className="w-full text-center">
                        <div className="mb-8 inline-flex items-center gap-2 px-6 py-2 rounded-full bg-accent/10 text-accent text-sm font-bold animate-pulse tracking-widest uppercase">
                            <Target size={18} />
                            Главный приоритет
                        </div>
                        <div className="bg-surface p-10 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Flame size={200} />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-secondary text-xl mb-4">
                                    Клиент: <span className="text-white font-bold">{focusItem.client.name}</span>
                                </h3>
                                <div className="h-px w-20 bg-white/10 mx-auto mb-8"></div>
                                <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
                                    {focusItem.task.title}
                                </h1>
                                <div className="flex justify-center gap-4 mb-10">
                                    <div className={`px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2 ${PRIORITY_CONFIG[focusItem.task.priority].color}`}>
                                        <Flame size={18} />
                                        {PRIORITY_CONFIG[focusItem.task.priority].label}
                                    </div>
                                    <div className={`px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2 ${EFFORT_CONFIG[focusItem.task.effort].color}`}>
                                        {React.createElement(EFFORT_CONFIG[focusItem.task.effort].icon, { size: 18 })}
                                        {EFFORT_CONFIG[focusItem.task.effort].label}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => toggleTask(focusItem.client.id, focusItem.task.id)}
                                    className="w-full py-6 bg-success hover:bg-success/90 text-bg text-xl font-bold rounded-2xl flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-lg shadow-success/20"
                                >
                                    <CheckCircle2 size={32} />
                                </button>
                            </div>
                        </div>
                        <p className="mt-8 text-secondary text-sm">
                            Не переключайся, пока не сделаешь это.<br/> Один шаг за раз.
                        </p>
                    </div>
                ) : (
                    <div className="text-center text-secondary py-20">
                        <div className="mb-4 inline-block p-4 bg-surface rounded-full">
                            <Coffee size={40} className="text-success" />
                        </div>
                        <h2 className="text-2xl text-white font-bold mb-2">Все чисто!</h2>
                        <p>Нет активных задач. Наслаждайся спокойствием.</p>
                    </div>
                )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;