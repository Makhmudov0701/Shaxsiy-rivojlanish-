import { isObject } from '@/lib/local-module-storage';

export type QuickIdea = {
  id: string;
  text: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type GoalHorizon = 'month' | 'half-year' | 'year';

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
  createdAt: string;
  updatedAt: string;
};

export type BookStatus = 'reading' | 'finished' | 'wishlist';

export type BookQuote = {
  id: string;
  text: string;
  favorite: boolean;
  createdAt: string;
};

export type TrackedBook = {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  takeaways: string;
  quotes: BookQuote[];
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

const horizons: GoalHorizon[] = ['month', 'half-year', 'year'];

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
    && Array.isArray(item.quotes)
    && item.quotes.every((quote) =>
      isObject(quote)
      && typeof quote.id === 'string'
      && typeof quote.text === 'string'
      && typeof quote.favorite === 'boolean'
      && isTimestamp(quote.createdAt),
    )
    && isTimestamp(item.createdAt)
    && isTimestamp(item.updatedAt),
  );
}

export function userStorageKey(module: 'ideas' | 'goals' | 'books', userId: string) {
  return `kundalik-${module}-v1-${userId}`;
}