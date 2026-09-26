import type { MotivationCategory, SectionId } from "@/components/section-motivation-content";
import { getMotivationPoolSize } from "@/components/section-motivation-generator";

const millisecondsPerDay = 24 * 60 * 60 * 1000;
const dailyIndexAnchor = "1970-01-01";
const dailyIndexCache = new Map<string, { day: number; index: number }>();

export function localDateKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calendarDayNumber(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / millisecondsPerDay);
}

function dateKeyFromDayNumber(dayNumber: number) {
  return new Date(dayNumber * millisecondsPerDay).toISOString().slice(0, 10);
}

function stableHash(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 0x01000193);
  }
  return hash >>> 0;
}

function greatestCommonDivisor(left: number, right: number): number {
  return right === 0 ? left : greatestCommonDivisor(right, left % right);
}

function coprimeStride(seed: number, poolSize: number) {
  let candidate = (seed % poolSize) || 1;
  while (greatestCommonDivisor(candidate, poolSize) !== 1) {
    candidate = (candidate % (poolSize - 1)) + 1;
  }
  return candidate;
}

function dailyHashedIndex(scope: string, seedPrefix: string, dateKey: string, poolSize: number) {
  if (!Number.isInteger(poolSize) || poolSize <= 1) return 0;
  const cacheKey = JSON.stringify([scope, poolSize]);
  const targetDay = calendarDayNumber(dateKey);
  const cached = dailyIndexCache.get(cacheKey);
  let day: number;
  let index: number;

  if (cached && cached.day <= targetDay) {
    day = cached.day;
    index = cached.index;
  } else {
    day = calendarDayNumber(dailyIndexAnchor);
    index = stableHash(`${seedPrefix}:${dailyIndexAnchor}`) % poolSize;
    if (targetDay < day) {
      for (let previousDay = day - 1; previousDay >= targetDay; previousDay -= 1) {
        const previousDateKey = dateKeyFromDayNumber(previousDay);
        const candidate = stableHash(`${seedPrefix}:${previousDateKey}`) % poolSize;
        index = candidate === index ? (candidate + poolSize - 1) % poolSize : candidate;
      }
      dailyIndexCache.set(cacheKey, { day: targetDay, index });
      return index;
    }
  }

  // Hash the exact local YYYY-MM-DD seed; resolve collisions so adjacent days never repeat.
  for (let nextDay = day + 1; nextDay <= targetDay; nextDay += 1) {
    const nextDateKey = dateKeyFromDayNumber(nextDay);
    const candidate = stableHash(`${seedPrefix}:${nextDateKey}`) % poolSize;
    index = candidate === index ? (candidate + 1) % poolSize : candidate;
  }

  dailyIndexCache.set(cacheKey, { day: targetDay, index });
  if (dailyIndexCache.size > 128) {
    const oldestScope = dailyIndexCache.keys().next().value;
    if (oldestScope) dailyIndexCache.delete(oldestScope);
  }
  return index;
}

export function dailyMotivationIndex(category: MotivationCategory, userId: string, dateKey: string) {
  const poolSize = getMotivationPoolSize(category);
  const scope = JSON.stringify([userId, category]);
  return dailyHashedIndex(scope, `${userId}:${category}`, dateKey, poolSize);
}

export function dailySectionGuideIndex(sectionId: SectionId, userId: string, dateKey: string, poolSize: number) {
  const scope = JSON.stringify([userId, sectionId, "guide"]);
  return dailyHashedIndex(scope, `${userId}:${sectionId}:guide`, dateKey, poolSize);
}

export function randomMotivationStride(poolSize: number) {
  if (poolSize < 2) return 1;
  for (let attempt = 0; attempt < poolSize; attempt += 1) {
    const candidate = Math.floor(Math.random() * (poolSize - 1)) + 1;
    if (greatestCommonDivisor(candidate, poolSize) === 1) return candidate;
  }
  return 1;
}

export function nextMotivationIndex(currentIndex: number, stride: number, poolSize: number) {
  if (poolSize < 2) return 0;
  const current = ((Math.floor(currentIndex) % poolSize) + poolSize) % poolSize;
  const normalizedStride = ((Math.floor(stride) % poolSize) + poolSize) % poolSize;
  const safeStride = normalizedStride > 0 && greatestCommonDivisor(normalizedStride, poolSize) === 1
    ? normalizedStride
    : 1;
  return (current + safeStride) % poolSize;
}