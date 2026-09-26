import { useLocalModuleStorage } from '@/lib/local-module-storage';
import { localDateKey } from '@/lib/date-utils';
import { BRAIN_GYM_FACT_IDS } from '@/lib/brain-gym-ids';

export type BrainGymExercise = 'number-matrix' | 'word-chain' | 'spaced-recall';
export type RecallInterval = 1 | 3 | 7;

export type BrainGymCompletion = {
  id: string;
  exercise: BrainGymExercise;
  date: string;
  completedAt: string;
  score: number;
  possible: number;
};

export type BrainGymRecallItem = {
  factId: string;
  firstLearnedOn: string;
  nextReviewOn: string;
  interval: RecallInterval;
};

export type BrainGymProgress = {
  completions: BrainGymCompletion[];
  recallItems: BrainGymRecallItem[];
};

export const EMPTY_BRAIN_GYM_PROGRESS: BrainGymProgress = {
  completions: [],
  recallItems: [],
};

const exerciseIds = new Set<BrainGymExercise>(['number-matrix', 'word-chain', 'spaced-recall']);
const intervals = new Set<RecallInterval>([1, 3, 7]);
const factIds = new Set<string>(BRAIN_GYM_FACT_IDS);
const storagePrefix = 'kundalik-brain-gym-v1-';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function isCompletion(value: unknown): value is BrainGymCompletion {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string'
    && value.id.length > 0
    && typeof value.exercise === 'string'
    && exerciseIds.has(value.exercise as BrainGymExercise)
    && isDateKey(value.date)
    && typeof value.completedAt === 'string'
    && Number.isFinite(Date.parse(value.completedAt))
    && typeof value.score === 'number'
    && Number.isSafeInteger(value.score)
    && typeof value.possible === 'number'
    && Number.isSafeInteger(value.possible)
    && value.possible >= 1
    && value.score >= 0
    && value.score <= value.possible;
}

function isRecallItem(value: unknown): value is BrainGymRecallItem {
  if (!isRecord(value)) return false;
  return typeof value.factId === 'string'
    && factIds.has(value.factId)
    && isDateKey(value.firstLearnedOn)
    && isDateKey(value.nextReviewOn)
    && value.nextReviewOn >= value.firstLearnedOn
    && typeof value.interval === 'number'
    && intervals.has(value.interval as RecallInterval);
}

export function isBrainGymProgress(value: unknown): value is BrainGymProgress {
  if (!isRecord(value) || !Array.isArray(value.completions) || !Array.isArray(value.recallItems)) return false;
  const completionIds = value.completions
    .filter(isCompletion)
    .map((item) => item.id);
  const factIdsInProgress = value.recallItems
    .filter(isRecallItem)
    .map((item) => item.factId);
  return isRecord(value)
    && value.completions.length <= 2000
    && value.completions.every(isCompletion)
    && new Set(completionIds).size === value.completions.length
    && value.recallItems.length <= 500
    && value.recallItems.every(isRecallItem)
    && new Set(factIdsInProgress).size === value.recallItems.length;
}

export function brainGymStorageKey(userId: string): string {
  return `${storagePrefix}${userId}`;
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

export function useBrainGymProgress(userId: string, storageLabel: string) {
  return useLocalModuleStorage(
    brainGymStorageKey(userId),
    EMPTY_BRAIN_GYM_PROGRESS,
    isBrainGymProgress,
    storageLabel,
  );
}