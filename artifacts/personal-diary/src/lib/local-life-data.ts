import { isObject } from '@/lib/local-module-storage';

export type QuickIdea = {
  id: string;
  text: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type GoalHorizon = 'week' | 'month' | 'half-year' | 'year' | 'free';
export type GoalCategory = 'education' | 'fitness' | 'project' | 'personal';
export type GoalMetric = 'milestones' | 'quantity' | 'time' | 'percentage';

export type GoalTask = {
  id: string;
  text: string;
  done: boolean;
};

export type PersonalGoal = {
  id: string;
  title: string;
  description: string;
  horizon: GoalHorizon;
  targetDate: string;
  tasks: GoalTask[];
  category?: GoalCategory;
  motivation?: string;
  metric?: GoalMetric;
  metricTarget?: number;
  metricCurrent?: number;
  metricUnit?: string;
  createdAt: string;
  updatedAt: string;
};

export type BookStatus = 'reading' | 'finished' | 'wishlist';

export type BookQuote = {
  id: string;
  text: string;
  favorite?: boolean;
  createdAt: string;
};

export type TrackedBook = {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  takeaways: string;
  quotes: BookQuote[];
  /** Optional for backwards-compatible localStorage records. */
  favorite?: boolean;
  createdAt: string;
  updatedAt: string;
};

export const EMPTY_IDEAS: QuickIdea[] = [];
export const EMPTY_GOALS: PersonalGoal[] = [];
export const EMPTY_BOOKS: TrackedBook[] = [];

function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

export function isQuickIdeaList(value: unknown): value is QuickIdea[] {
  return Array.isArray(value) && value.every((item) =>
    isObject(item)
    && typeof item.id === 'string'
    && typeof item.text === 'string'
    && Array.isArray(item.tags)
    && item.tags.every((tag) => typeof tag === 'string')
    && isTimestamp(item.createdAt)
    && isTimestamp(item.updatedAt),
  );
}

const horizons: GoalHorizon[] = ['week', 'month', 'half-year', 'year', 'free'];
const goalCategories: GoalCategory[] = ['education', 'fitness', 'project', 'personal'];
const goalMetrics: GoalMetric[] = ['milestones', 'quantity', 'time', 'percentage'];

export function isPersonalGoalList(value: unknown): value is PersonalGoal[] {
  return Array.isArray(value) && value.every((item) =>
    isObject(item)
    && typeof item.id === 'string'
    && typeof item.title === 'string'
    && typeof item.description === 'string'
    && horizons.includes(item.horizon as GoalHorizon)
    && typeof item.targetDate === 'string'
    && (!item.targetDate || isCalendarDate(item.targetDate))
    && Array.isArray(item.tasks)
    && item.tasks.every((task) =>
      isObject(task)
      && typeof task.id === 'string'
      && typeof task.text === 'string'
      && typeof task.done === 'boolean',
    )
    && (item.category === undefined || goalCategories.includes(item.category as GoalCategory))
    && (item.motivation === undefined || typeof item.motivation === 'string')
    && (item.metric === undefined || goalMetrics.includes(item.metric as GoalMetric))
    && (item.metricTarget === undefined || (typeof item.metricTarget === 'number' && Number.isFinite(item.metricTarget) && item.metricTarget > 0))
    && (item.metricCurrent === undefined || (typeof item.metricCurrent === 'number' && Number.isFinite(item.metricCurrent) && item.metricCurrent >= 0))
    && (item.metric !== 'time' || item.metricTarget === undefined || Number.isInteger(item.metricTarget))
    && (item.metric !== 'time' || item.metricCurrent === undefined || Number.isInteger(item.metricCurrent))
    && (item.metricUnit === undefined || typeof item.metricUnit === 'string')
    && isTimestamp(item.createdAt)
    && isTimestamp(item.updatedAt),
  );
}

const bookStatuses: BookStatus[] = ['reading', 'finished', 'wishlist'];

export function isTrackedBookList(value: unknown): value is TrackedBook[] {
  return Array.isArray(value) && value.every((item) =>
    isObject(item)
    && typeof item.id === 'string'
    && typeof item.title === 'string'
    && typeof item.author === 'string'
    && bookStatuses.includes(item.status as BookStatus)
    && typeof item.takeaways === 'string'
    && (item.favorite === undefined || typeof item.favorite === 'boolean')
    && Array.isArray(item.quotes)
    && item.quotes.every((quote) =>
      isObject(quote)
      && typeof quote.id === 'string'
      && typeof quote.text === 'string'
       && (quote.favorite === undefined || typeof quote.favorite === 'boolean')
      && isTimestamp(quote.createdAt),
    )
    && isTimestamp(item.createdAt)
    && isTimestamp(item.updatedAt),
  );
}

export function userStorageKey(module: 'ideas' | 'goals' | 'books', userId: string) {
  return `kundalik-${module}-v1-${userId}`;
}