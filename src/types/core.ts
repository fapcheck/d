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

/** Профиль для DMCA запросов */
export interface DmcaProfile {
    legalName: string;
    address: string;
    email: string;
    phone: string;
    contentSourceUrl?: string;
}

/** Клиент/Проект - группа связанных задач */
export interface Client {
    id: number;
    name: string;
    priority: Priority;
    notes: NoteItem[];
    accounts: NoteItem[];
    dmcaProfile?: DmcaProfile;
    tasks: Task[];
    createdAt: number;
    /** Целевая дата завершения проекта */
    targetCompletionDate?: number;
}

/** Настройки приложения */
export interface AppSettings {
    soundEnabled: boolean;
    groqApiKey?: string;
    dmcaSites?: string[];
    dmcaHostings?: string[];
}

export const DEFAULT_SETTINGS: AppSettings = {
    soundEnabled: true,
};
