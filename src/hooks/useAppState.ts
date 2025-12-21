/**
 * Хук для управления UI-состоянием приложения.
 * Извлечено из App.tsx для улучшения поддерживаемости.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import type { Priority, Effort, Client } from '../types';

export type ViewMode = 'dashboard' | 'focus' | 'analytics' | 'review';
export type ClientTab = 'active' | 'accounts' | 'archive' | 'notes' | 'dmca' | 'profile';

interface CommentsModalState {
    isOpen: boolean;
    taskId: number | null;
    taskTitle: string;
}

interface SectionsOpenState {
    high: boolean;
    normal: boolean;
    low: boolean;
}

interface UseAppStateProps {
    clients: Client[];
}

/**
 * Хук для управления UI-состоянием приложения.
 * Включает навигацию, модальные окна, формы и derived state.
 */
export function useAppState({ clients }: UseAppStateProps) {
    // --- Navigation State ---
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
    const [clientTab, setClientTab] = useState<ClientTab>('active');

    // --- UI State ---
    const [copiedId, setCopiedId] = useState(false);
    const [isClientFormOpen, setIsClientFormOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [sectionsOpen, setSectionsOpen] = useState<SectionsOpenState>({ high: true, normal: true, low: true });
    const [isPinned, setIsPinned] = useState(false);

    // --- Modal State ---
    const [commentsModal, setCommentsModal] = useState<CommentsModalState>({
        isOpen: false,
        taskId: null,
        taskTitle: ''
    });

    // --- Form State ---
    const [newClientName, setNewClientName] = useState('');
    const [newClientPriority, setNewClientPriority] = useState<Priority>('normal');
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<Priority>('normal');
    const [newTaskEffort, setNewTaskEffort] = useState<Effort>('quick');

    const [newNoteContent, setNewNoteContent] = useState('');
    const [newAccountContent, setNewAccountContent] = useState('');
    const [dmcaContent, setDmcaContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // --- Derived State ---
    const selectedClient = useMemo(
        () => clients.find(c => c.id === selectedClientId) ?? null,
        [clients, selectedClientId]
    );

    const activeTasks = useMemo(
        () => (selectedClient?.tasks ?? []).filter(t => !t.isDone),
        [selectedClient?.tasks]
    );

    const groupedClients = useMemo(() => ({
        high: clients.filter(c => c.priority === 'high'),
        normal: clients.filter(c => c.priority === 'normal'),
        low: clients.filter(c => c.priority === 'low')
    }), [clients]);

    // --- Keyboard Shortcut Effect ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setViewMode('dashboard');
                setSelectedClientId(null);

                setTimeout(() => {
                    const input = document.querySelector('input[placeholder="Суть задачи..."]') as HTMLInputElement;
                    if (input) {
                        input.focus();
                        input.parentElement?.classList.add('ring-2', 'ring-primary');
                        setTimeout(() => input.parentElement?.classList.remove('ring-2', 'ring-primary'), 500);
                    }
                }, 50);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // --- Actions ---
    const openComments = useCallback((taskId: number, taskTitle: string) => {
        setCommentsModal({ isOpen: true, taskId, taskTitle });
    }, []);

    const closeComments = useCallback(() => {
        setCommentsModal({ isOpen: false, taskId: null, taskTitle: '' });
    }, []);

    const toggleSection = useCallback((type: keyof SectionsOpenState) => {
        setSectionsOpen(prev => ({ ...prev, [type]: !prev[type] }));
    }, []);

    const togglePin = useCallback(async () => {
        try {
            const newValue = !isPinned;
            await getCurrentWindow().setAlwaysOnTop(newValue);
            setIsPinned(newValue);
        } catch {
            // Tauri API may not be available in web mode
        }
    }, [isPinned]);

    const copyReport = useCallback(() => {
        if (!selectedClient) return;
        const doneTasks = selectedClient.tasks.filter(t => t.isDone);
        let report = `Отчет для: ${selectedClient.name}\n`;
        if (doneTasks.length === 0) report += "Нет выполненных задач.";
        else doneTasks.forEach(t => report += `— ${t.title}\n`);

        navigator.clipboard.writeText(report);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
    }, [selectedClient]);

    const resetClientForm = useCallback(() => {
        setNewClientName('');
        setNewClientPriority('normal');
        setIsClientFormOpen(false);
    }, []);

    const resetTaskForm = useCallback(() => {
        setNewTaskTitle('');
        setNewTaskPriority('normal');
        setNewTaskEffort('quick');
    }, []);

    const resetNoteForm = useCallback(() => setNewNoteContent(''), []);
    const resetAccountForm = useCallback(() => setNewAccountContent(''), []);
    const resetDmcaForm = useCallback(() => setDmcaContent(''), []);

    const selectClient = useCallback((id: number) => {
        setSelectedClientId(id);
        setClientTab('active');
        setDmcaContent('');
    }, []);

    const goToDashboard = useCallback(() => {
        setViewMode('dashboard');
        setSelectedClientId(null);
    }, []);

    return {
        // --- Navigation ---
        selectedClientId,
        setSelectedClientId,
        viewMode,
        setViewMode,
        clientTab,
        setClientTab,
        selectClient,
        goToDashboard,

        // --- UI State ---
        copiedId,
        isClientFormOpen,
        setIsClientFormOpen,
        isSettingsOpen,
        setIsSettingsOpen,
        isAchievementsOpen,
        setIsAchievementsOpen,
        sectionsOpen,
        toggleSection,
        isPinned,
        togglePin,
        isHistoryOpen,
        setIsHistoryOpen,

        // --- Modal State ---
        commentsModal,
        openComments,
        closeComments,

        // --- Form State ---
        newClientName,
        setNewClientName,
        newClientPriority,
        setNewClientPriority,
        newTaskTitle,
        setNewTaskTitle,
        newTaskPriority,
        setNewTaskPriority,
        newTaskEffort,
        setNewTaskEffort,
        resetClientForm,
        resetTaskForm,

        // --- Derived State ---
        selectedClient,
        activeTasks,
        groupedClients,
        copyReport,
        newNoteContent,
        setNewNoteContent,
        newAccountContent,
        setNewAccountContent,
        resetNoteForm,
        resetAccountForm,
        dmcaContent,
        setDmcaContent,
        resetDmcaForm,
        isGenerating,
        setIsGenerating,
    };
}
