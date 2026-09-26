import type { AppLanguage } from '@/lib/i18n';

export type BrainGymDifficulty = 'easy' | 'medium' | 'hard';

export const BRAIN_GYM_DIFFICULTIES: BrainGymDifficulty[] = ['easy', 'medium', 'hard'];

export const difficultyLabels: Record<AppLanguage, Record<BrainGymDifficulty, string>> = {
  uz: { easy: 'Oson', medium: 'O‘rtacha', hard: 'Qiyin' },
  en: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
  ru: { easy: 'Легко', medium: 'Средне', hard: 'Сложно' },
  ko: { easy: '쉬움', medium: '보통', hard: '어려움' },
};

export function challengeSeed(date: string, exerciseId: string, difficulty: BrainGymDifficulty): number {
  const source = `${date}|${exerciseId}|${difficulty}`;
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededValue(seed: number, index: number): number {
  let value = (seed + Math.imul(index + 1, 0x45d9f3b)) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x45d9f3b) >>> 0;
  value ^= value >>> 16;
  return (value >>> 0) / 4294967296;
}

export function seededInt(seed: number, index: number, min: number, max: number): number {
  return min + Math.floor(seededValue(seed, index) * (max - min + 1));
}

export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(seededValue(seed, result.length - index) * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function numberMatrixFor(date: string, difficulty: BrainGymDifficulty): number[] {
  const size = difficulty === 'easy' ? 6 : difficulty === 'hard' ? 12 : 9;
  const seed = challengeSeed(date, 'number-matrix', difficulty);
  return Array.from({ length: size }, (_, index) => seededInt(seed, index, 0, 9));
}

export function patternFor(date: string, difficulty: BrainGymDifficulty): { size: 4 | 5; targets: number[] } {
  const size = difficulty === 'hard' ? 5 : 4;
  const count = difficulty === 'easy' ? 4 : difficulty === 'hard' ? 9 : 6;
  const cells = Array.from({ length: size * size }, (_, index) => index);
  return { size, targets: seededShuffle(cells, challengeSeed(date, 'visual-pattern', difficulty)).slice(0, count).sort((a, b) => a - b) };
}

const patternColors = ['#bd6d62', '#be9141', '#779b7c', '#6285a1', '#8c78a4', '#aa718e', '#5e948e', '#a77e65', '#77894e'];
const patternMarks = ['circle', 'square', 'diamond', 'bar', 'plus', 'cross', 'ring', 'hexagon', 'star'] as const;

export type PatternCellVisual = { color: string; mark: (typeof patternMarks)[number] };

export function patternCellFor(date: string, difficulty: BrainGymDifficulty, cellIndex: number): PatternCellVisual {
  const seed = challengeSeed(date, 'visual-pattern', difficulty);
  const colorOffset = seededInt(seed, 0, 0, patternColors.length - 1);
  return {
    color: patternColors[(colorOffset + cellIndex) % patternColors.length],
    mark: patternMarks[cellIndex % patternMarks.length],
  };
}

export type StroopItem = { word: string; ink: string };

export function stroopFor(date: string, difficulty: BrainGymDifficulty): StroopItem[] {
  const count = difficulty === 'easy' ? 4 : difficulty === 'hard' ? 8 : 6;
  const seed = challengeSeed(date, 'stroop', difficulty);
  const colors = ['red', 'blue', 'green', 'yellow'];
  return Array.from({ length: count }, (_, index) => {
    const word = colors[seededInt(seed, index * 2, 0, colors.length - 1)];
    let ink = colors[seededInt(seed, index * 2 + 1, 0, colors.length - 1)];
    if (ink === word) ink = colors[(colors.indexOf(ink) + 1 + (index % 2)) % colors.length];
    return { word, ink };
  });
}

export function sequenceFor(date: string, difficulty: BrainGymDifficulty): number[][] {
  const lengths = difficulty === 'easy' ? [1, 2, 3] : difficulty === 'hard' ? [3, 4, 5] : [2, 3, 4];
  const length = lengths[lengths.length - 1];
  const seed = challengeSeed(date, 'sequence-recall', difficulty);
  const full = Array.from({ length }, (_, index) => seededInt(seed, index, 1, 9));
  return lengths.map((roundLength) => full.slice(0, roundLength));
}

export type MathItem = { expression: string; answer: number };

export function mathFor(date: string, difficulty: BrainGymDifficulty): MathItem[] {
  const count = difficulty === 'easy' ? 2 : difficulty === 'hard' ? 4 : 3;
  const seed = challengeSeed(date, 'speed-math', difficulty);
  return Array.from({ length: count }, (_, index) => {
    const a = seededInt(seed, index * 4, 2, difficulty === 'hard' ? 18 : 12);
    const b = seededInt(seed, index * 4 + 1, 2, 9);
    const c = seededInt(seed, index * 4 + 2, 2, 8);
    const d = seededInt(seed, index * 4 + 3, 1, 7);
    const multiplyFirst = index % 2 === 0;
    return multiplyFirst
      ? { expression: `${a} + ${b} × ${c} − ${d}`, answer: a + b * c - d }
      : { expression: `${a} × ${b} − ${c} + ${d}`, answer: a * b - c + d };
  });
}

const anagramWords: Record<AppLanguage, string[]> = {
  uz: ['xotira', 'qalam', 'bulut', 'daryo', 'kitob', 'kalit', 'oyna', 'sokin'],
  en: ['memory', 'lantern', 'garden', 'window', 'quiet', 'pencil', 'river', 'notebook'],
  ru: ['память', 'фонарь', 'садик', 'окно', 'тихий', 'карандаш', 'река', 'тетрадь'],
  ko: ['기억', '등불', '정원', '창문', '고요', '연필', '강물', '공책'],
};

export function anagramsFor(date: string, language: AppLanguage, difficulty: BrainGymDifficulty): { answer: string; scrambled: string }[] {
  const count = difficulty === 'easy' ? 2 : difficulty === 'hard' ? 4 : 3;
  const words = seededShuffle(anagramWords[language], challengeSeed(date, 'anagrams', difficulty)).slice(0, count);
  const seed = challengeSeed(date, 'anagrams', difficulty);
  return words.map((answer, index) => {
    const chars = [...answer];
    let scrambled = seededShuffle(chars, seed + index + 19).join('');
    if (scrambled === answer && chars.length > 1) scrambled = `${chars[1]}${chars[0]}${chars.slice(2).join('')}`;
    return { answer, scrambled };
  });
}

export function matrixSeconds(difficulty: BrainGymDifficulty): number {
  return difficulty === 'easy' ? 3 : difficulty === 'hard' ? 5 : 4;
}

export function featuredIndexForDate(date: string, itemCount: number): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match || itemCount < 1) return 0;
  const dayNumber = Math.floor(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / 86400000);
  return ((dayNumber % itemCount) + itemCount) % itemCount;
}