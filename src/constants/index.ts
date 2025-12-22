/**
 * Константы приложения ZenManager.
 * Уровни, достижения, конфигурации приоритетов и сложности.
 */

import { Zap, Clock, Coffee, Trophy, Star, Target, Calendar, CheckCircle, Heart, Activity, AlertTriangle, Brain } from 'lucide-react';
import type { LevelInfo, Achievement } from '../types/gamification';

/** Определения уровней пользователя */
export const LEVELS: LevelInfo[] = [
    { level: 1, name: 'Новичок', minPoints: 0, color: 'text-gray-400' },
    { level: 2, name: 'Ученик', minPoints: 100, color: 'text-blue-400' },
    { level: 3, name: 'Практик', minPoints: 300, color: 'text-green-400' },
    { level: 4, name: 'Мастер', minPoints: 600, color: 'text-yellow-400' },
    { level: 5, name: 'Легенда', minPoints: 1000, color: 'text-purple-400' },
    { level: 6, name: 'Гуру', minPoints: 1500, color: 'text-pink-400' },
];

/** Доступные достижения */
export const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'first_task',
        name: 'Первая кровь',
        description: 'Выполните первую задачу',
        icon: CheckCircle,
        progress: 0,
        target: 1,
        category: 'tasks'
    },
    {
        id: 'task_master_10',
        name: 'Мастер задач',
        description: 'Выполните 10 задач',
        icon: Target,
        progress: 0,
        target: 10,
        category: 'tasks'
    },
    {
        id: 'task_master_50',
        name: 'Легенда задач',
        description: 'Выполните 50 задач',
        icon: Trophy,
        progress: 0,
        target: 50,
        category: 'tasks'
    },
    {
        id: 'task_master_100',
        name: 'Повелитель задач',
        description: 'Выполните 100 задач',
        icon: Star,
        progress: 0,
        target: 100,
        category: 'tasks'
    },
    {
        id: 'streak_3',
        name: 'Начало пути',
        description: '3 дня подряд без прокрастинации',
        icon: Calendar,
        progress: 0,
        target: 3,
        category: 'streak'
    },
    {
        id: 'streak_7',
        name: 'Неделя силы',
        description: '7 дней подряд',
        icon: Calendar,
        progress: 0,
        target: 7,
        category: 'streak'
    },
    {
        id: 'streak_30',
        name: 'Месяц мастера',
        description: '30 дней подряд',
        icon: Calendar,
        progress: 0,
        target: 30,
        category: 'streak'
    },
    {
        id: 'focus_60',
        name: 'Фокус-час',
        description: 'Наработайте 60 минут в фокусе',
        icon: Clock,
        progress: 0,
        target: 60,
        category: 'time'
    },
    {
        id: 'focus_300',
        name: 'Мастер фокуса',
        description: 'Наработайте 5 часов в фокусе',
        icon: Clock,
        progress: 0,
        target: 300,
        category: 'time'
    },
    {
        id: 'perfect_week',
        name: 'Идеальная неделя',
        description: 'Неделя без просроченных задач',
        icon: Star,
        progress: 0,
        target: 7,
        category: 'special'
    }
];

/** Конфигурация приоритетов */
export const PRIORITY_CONFIG = {
    high: {
        label: 'Высокий',
        icon: '🔥',
        color: 'text-error',
        indicator: 'bg-error',
        border: 'border-error',
        bg: 'bg-error/20',
        weight: 3,
        points: 30
    },
    normal: {
        label: 'Обычный',
        icon: '🔹',
        color: 'text-primary',
        indicator: 'bg-primary',
        border: 'border-primary',
        bg: 'bg-primary/20',
        weight: 2,
        points: 20
    },
    low: {
        label: 'Низкий',
        icon: '☕',
        color: 'text-success',
        indicator: 'bg-success',
        border: 'border-success',
        bg: 'bg-success/20',
        weight: 1,
        points: 10
    },
} as const;

/** Конфигурация сложности задач */
export const EFFORT_CONFIG = {
    quick: { label: '5 мин', icon: Zap, color: 'text-warning' },
    medium: { label: '30 мин', icon: Clock, color: 'text-primary' },
    long: { label: 'Долго', icon: Coffee, color: 'text-accent' },
} as const;

/** Имя файла базы данных */
export const DB_FILENAME = 'zen-db.json';

/** Storage keys for localStorage */
export const STORAGE_KEYS = {
    SETTINGS: 'zen_settings',
    SESSIONS: 'zen_sessions',
    BACKUP_WEB: 'zen_backup_web'
} as const;

/** Цвета для графиков */
export const CHART_COLORS = {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    gray: '#6b7280'
} as const;

/** Конфигурация аналитики */
export const ANALYTICS_CONFIG = {
    dateRange: {
        week: 7,
        month: 30,
        quarter: 90
    },
    focusSession: {
        minDuration: 5 * 60,
        maxDuration: 8 * 60 * 60
    }
} as const;

/** Уровни здоровья продуктивности */
export const HEALTH_LEVELS = {
    excellent: {
        min: 80,
        color: 'text-green-400',
        bg: 'bg-green-400/20',
        icon: Heart,
        description: 'Отличное состояние'
    },
    good: {
        min: 60,
        color: 'text-blue-400',
        bg: 'bg-blue-400/20',
        icon: Activity,
        description: 'Хорошее состояние'
    },
    warning: {
        min: 40,
        color: 'text-yellow-400',
        bg: 'bg-yellow-400/20',
        icon: AlertTriangle,
        description: 'Требует внимания'
    },
    critical: {
        min: 0,
        color: 'text-red-400',
        bg: 'bg-red-400/20',
        icon: Brain,
        description: 'Критическое состояние'
    },
} as const;

/** Example DMCA letter for hosting provider complaints */
export const EXAMPLE_DMCA_HOSTING_LETTER = `Subject: URGENT: DMCA Takedown Notice - Copyright Infringement - [Domain Name]

To the Legal & Abuse Department at [Name of Hosting Company],

RE: Copyright Infringement on [Domain Name] / IP: [Insert IP Address]

I am writing to formally notify you that your network is being used to host and distribute unauthorized copies of copyrighted material. This notice is submitted in compliance with the Digital Millennium Copyright Act (DMCA), 17 U.S.C. § 512.

**INFRINGING CONTENT:**
The following URLs are hosted on your servers and must be removed immediately:

1. https://www.youtube.com/watch?v=KsZ6tROaVOQ
2. https://www.youtube.com/watch?v=-s7TCuCpB5c
3. https://www.collinsdictionary.com/us/dictionary/english/three

**DEADLINE AND CONSEQUENCES:**
I am providing you with a strict window of **48 hours** to remove or disable access to this material.

Please be advised that your company's "Safe Harbor" protection is contingent upon expeditious removal of infringing content. If you fail to act within this 48-hour period, I will immediately proceed with the following escalation protocols without further notice:

1. **UPSTREAM NETWORK NOTIFICATION:**
   I will file formal complaints with your Upstream Providers (Tier 1/Tier 2 networks). I will submit evidence that your subnet is being used to harbor illegal content, requesting that they null-route your IP addresses to mitigate their own liability.

2. **PAYMENT PROCESSOR AUDIT (Visa/Mastercard/PayPal):**
   I will report your hosting service to the Compliance & Risk departments of your payment processors. I will provide evidence that your merchant accounts are facilitating the monetization of intellectual property theft. This action is aimed at suspending your ability to process credit card payments (TMF/MATCH listing).

**LEGAL DECLARATIONS:**
1. I have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.
2. The information in this notification is accurate.
3. Under penalty of perjury, I am authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.

Confirm receipt of this notice and the removal of the content immediately.

Sincerely,

[Your Full Legal Name]
[Your Title/Position]
[Your Phone Number]
`;
