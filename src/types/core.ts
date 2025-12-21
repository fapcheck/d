/**
 * Основные типы данных для ZenManager.
 * Содержит базовые типы для задач, клиентов и комментариев.
 */

export type Priority = 'high' | 'normal' | 'low';
export type Effort = 'quick' | 'medium' | 'long';

/** Комментарий к задаче */
export interface Comment {
    id: number;
    text: string;
    createdAt: number;
    author: string;
}

/** Задача (основная единица работы) */
export interface Task {
    id: number;
    title: string;
    isDone: boolean;
    priority: Priority;
    effort: Effort;
    createdAt: number;
    completedAt?: number;
    dueDate?: number;
    comments: Comment[];
    pointsEarned?: number;
    /** Фактически затраченное время в минутах */
    timeSpent?: number;
    /** Предсказанное время в минутах */
    predictedTime?: number;
}

/** Элемент списка (заметка или аккаунт) */
export interface NoteItem {
    id: number;
    content: string;
    createdAt: number;
    isPinned?: boolean;
}

/** Клиент/Проект - группа связанных задач */
export interface Client {
    id: number;
    name: string;
    priority: Priority;
    notes: NoteItem[];
    accounts: NoteItem[]; // Renamed from accounts_notes
    tasks: Task[];
    createdAt: number;
    /** Целевая дата завершения проекта */
    targetCompletionDate?: number;
}

/** Настройки приложения */
export interface AppSettings {
    soundEnabled: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
    soundEnabled: true,
};
