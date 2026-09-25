import type { MotivationCategory } from "@/components/section-motivation-content";
import { getMotivationPoolSize } from "@/components/section-motivation-generator";

const millisecondsPerDay = 24 * 60 * 60 * 1000;

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

export function dailyMotivationIndex(category: MotivationCategory, userId: string, dateKey: string) {
  const poolSize = getMotivationPoolSize(category);
  const userScope = `${userId}:${category}`;
  const startingOffset = stableHash(`${userScope}:start`) % poolSize;
  const stride = coprimeStride(stableHash(`${userScope}:stride`), poolSize);
  const day = ((calendarDayNumber(dateKey) % poolSize) + poolSize) % poolSize;

  // A coprime stride makes this date hash visit every quote before the cycle repeats.
  return (startingOffset + day * stride) % poolSize;
}

export function randomMotivationIndex(currentIndex: number, poolSize: number) {
  if (poolSize < 2) return 0;
  const current = ((currentIndex % poolSize) + poolSize) % poolSize;
  const candidate = Math.floor(Math.random() * (poolSize - 1));
  return candidate >= current ? candidate + 1 : candidate;
}