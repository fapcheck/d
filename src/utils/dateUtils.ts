/**
 * Утилиты для работы с датами и дедлайнами задач.
 * Предоставляет функции для проверки, форматирования и расчета дат.
 */

/** Проверяет, является ли timestamp сегодняшней датой */
export const isToday = (timestamp?: number): boolean => {
    if (!timestamp) return false;
    const today = new Date();
    const due = new Date(timestamp);
    return today.toDateString() === due.toDateString();
};

/** Проверяет, является ли timestamp завтрашней датой */
export const isTomorrow = (timestamp?: number): boolean => {
    if (!timestamp) return false;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const due = new Date(timestamp);
    return tomorrow.toDateString() === due.toDateString();
};

/** Проверяет, просрочен ли дедлайн (timestamp в прошлом) */
export const isOverdue = (timestamp?: number): boolean => {
    if (!timestamp) return false;
    const now = new Date();
    const due = new Date(timestamp);
    return now.getTime() > due.getTime();
};

/** Проверяет, находится ли дата в пределах следующих 7 дней */
export const isUpcoming = (timestamp?: number): boolean => {
    if (!timestamp) return false;
    const now = new Date();
    const due = new Date(timestamp);
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    return due.getTime() > now.getTime() && due.getTime() <= oneWeekFromNow.getTime();
};

/** Возвращает количество дней до указанной даты (отрицательное если в прошлом) */
export const getDaysUntil = (timestamp?: number): number | null => {
    if (!timestamp) return null;
    const now = new Date();
    const due = new Date(timestamp);
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/** 
 * Форматирует дату для отображения в UI.
 * Возвращает "Сегодня", "Завтра", "Через N дн." и т.д.
 */
export const formatDueDate = (timestamp?: number): string | null => {
    if (!timestamp) return null;
    const due = new Date(timestamp);
    const now = new Date();

    // Reset to start of day for accurate day difference
    const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
    const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const diffDays = Math.round((startOfDue - startOfNow) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'Завтра';
    if (diffDays === -1) return 'Вчера';
    if (diffDays > 1 && diffDays <= 7) return `Через ${diffDays} дн.`;
    if (diffDays < -1) return `${Math.abs(diffDays)} дн. назад`;

    return due.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short'
    });
};

/** Сравнивает две даты (без учета времени) */
export const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.toDateString() === date2.toDateString();
};

/** Возвращает дату с временем 00:00:00 */
export const startOfDay = (date: Date): Date => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
};

/** Форматирует timestamp в строку YYYY-MM-DD */
export const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toISOString().split('T')[0];
};

/** Возвращает массив дат (YYYY-MM-DD) за последние N дней */
export const getDateRange = (days: number): string[] => {
    const dates: string[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }

    return dates;
};

/** Объект DateUtils для обратной совместимости */
export const DateUtils = {
    isToday,
    isTomorrow,
    isOverdue,
    isUpcoming,
    getDaysUntil,
    formatDueDate,
    isSameDay,
    startOfDay,
    formatDate,
    getDateRange,
};
