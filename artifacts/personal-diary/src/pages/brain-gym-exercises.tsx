import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Eye, Palette, Play, RotateCcw, TimerReset, Zap } from 'lucide-react';
import type { AppLanguage } from '@/lib/i18n';
import { localDateKey } from '@/lib/date-utils';
import {
  anagramsFor,
  BRAIN_GYM_DIFFICULTIES,
  challengeSeed,
  difficultyLabels,
  mathFor,
  matrixSeconds,
  patternCellFor,
  patternFor,
  seededInt,
  sequenceFor,
  stroopFor,
  type BrainGymDifficulty,
} from '@/lib/brain-gym-challenges';

type ExerciseCopy = {
  chooseDifficulty: string;
  easyHint: string;
  mediumHint: string;
  hardHint: string;
  patternTitle: string;
  patternIntro: string;
  patternShow: string;
  patternTap: string;
  patternResult: string;
  stroopTitle: string;
  stroopIntro: string;
  stroopPrompt: string;
  stroopResult: string;
  sequenceTitle: string;
  sequenceIntro: string;
  forward: string;
  reverse: string;
  playSequence: string;
  sequenceInput: string;
  sequenceResult: string;
  mathTitle: string;
  mathIntro: string;
  mathPrompt: string;
  mathResult: string;
  anagramTitle: string;
  anagramIntro: string;
  anagramPrompt: string;
  anagramResult: string;
  start: string;
  submit: string;
  next: string;
  reset: string;
  seconds: string;
  of: string;
  complete: string;
  timeUp: string;
  colorNames: Record<string, string>;
};

const exerciseCopy: Record<AppLanguage, ExerciseCopy> = {
  uz: {
    chooseDifficulty: 'Qiyinchilik', easyHint: 'Yengil boshlang', mediumHint: 'Odatdagi ritm', hardHint: 'Ko‘proq diqqat',
    patternTitle: 'Rangli naqsh xotirasi', patternIntro: 'Naqshni bir necha soniya kuzating, keyin yashirilgan nishonlarni bosing.', patternShow: 'Naqshni eslab qoling', patternTap: 'Eslagan kataklarni tanlang', patternResult: 'Mos kataklar',
    stroopTitle: 'Stroop tezlik raundi', stroopIntro: 'So‘zga emas, uning siyoh rangiga qarang. Har band uchun aniq 2 soniya bor.', stroopPrompt: 'Siyoh rangi qaysi?', stroopResult: 'To‘g‘ri tanlov',
    sequenceTitle: 'Progressiv ketma-ketlik', sequenceIntro: 'Raqamlar ijrosini ko‘ring, yo‘nalishni tanlang va 3 raund davomida uzayib boradigan ketma-ketlikni kiriting.', forward: 'Oldinga', reverse: 'Teskari', playSequence: 'Ijroni boshlash', sequenceInput: 'Ketma-ketlikni kiriting', sequenceResult: 'To‘g‘ri raundlar',
    mathTitle: 'Aqliy tez hisob', mathIntro: 'Standart amallar tartibida xavfsiz butun sonli ifodalarni yeching. Har bir bandga 10 soniya.', mathPrompt: 'Javobingiz', mathResult: 'To‘g‘ri javoblar',
    anagramTitle: 'So‘z anagrammalari', anagramIntro: 'Harflarni joyiga qo‘yib, yashirilgan so‘zni toping. Har bandga 15 soniya.', anagramPrompt: 'So‘zni yozing', anagramResult: 'Topilgan so‘zlar',
    start: 'Boshlash', submit: 'Tekshirish', next: 'Keyingi', reset: 'Qayta boshlash', seconds: 'soniya', of: 'dan', complete: 'Bajarildi', timeUp: 'Vaqt tugadi',
    colorNames: { red: 'qizil', blue: 'ko‘k', green: 'yashil', yellow: 'sariq' },
  },
  en: {
    chooseDifficulty: 'Difficulty', easyHint: 'A gentle start', mediumHint: 'Usual rhythm', hardHint: 'More attention',
    patternTitle: 'Visual pattern memory', patternIntro: 'Study the pattern for a few seconds, then tap the cells you remember.', patternShow: 'Remember the pattern', patternTap: 'Select remembered cells', patternResult: 'Matching cells',
    stroopTitle: 'Stroop speed round', stroopIntro: 'Look at the ink, not the word. You have exactly 2 seconds for each item.', stroopPrompt: 'Which ink color?', stroopResult: 'Correct choices',
    sequenceTitle: 'Progressive sequence recall', sequenceIntro: 'Watch the number playback, choose a direction, and recall the growing sequence over three rounds.', forward: 'Forward', reverse: 'Reverse', playSequence: 'Play sequence', sequenceInput: 'Enter the sequence', sequenceResult: 'Correct rounds',
    mathTitle: 'Mental speed math', mathIntro: 'Solve safe integer expressions using standard order of operations. You have 10 seconds per item.', mathPrompt: 'Your answer', mathResult: 'Correct answers',
    anagramTitle: 'Localized anagrams', anagramIntro: 'Put the letters back together to find the hidden word. You have 15 seconds per item.', anagramPrompt: 'Type the word', anagramResult: 'Words found',
    start: 'Begin', submit: 'Check', next: 'Next', reset: 'Start over', seconds: 'sec', of: 'of', complete: 'Complete', timeUp: 'Time is up',
    colorNames: { red: 'red', blue: 'blue', green: 'green', yellow: 'yellow' },
  },
  ru: {
    chooseDifficulty: 'Сложность', easyHint: 'Мягкое начало', mediumHint: 'Обычный ритм', hardHint: 'Больше внимания',
    patternTitle: 'Зрительная память', patternIntro: 'Несколько секунд изучайте узор, затем нажмите на запомнившиеся клетки.', patternShow: 'Запомните узор', patternTap: 'Выберите клетки', patternResult: 'Совпавшие клетки',
    stroopTitle: 'Скоростной раунд Струпа', stroopIntro: 'Смотрите на цвет чернил, а не на слово. На каждый пункт ровно 2 секунды.', stroopPrompt: 'Какой цвет чернил?', stroopResult: 'Правильные ответы',
    sequenceTitle: 'Прогрессивная последовательность', sequenceIntro: 'Посмотрите последовательность, выберите направление и воспроизведите растущий ряд в трёх раундах.', forward: 'Прямой', reverse: 'Обратный', playSequence: 'Показать ряд', sequenceInput: 'Введите ряд', sequenceResult: 'Верные раунды',
    mathTitle: 'Быстрый счёт', mathIntro: 'Решайте безопасные целые выражения по обычному порядку действий. На пункт — 10 секунд.', mathPrompt: 'Ваш ответ', mathResult: 'Верные ответы',
    anagramTitle: 'Анаграммы', anagramIntro: 'Соберите буквы в слово. На каждый пункт — 15 секунд.', anagramPrompt: 'Введите слово', anagramResult: 'Найденные слова',
    start: 'Начать', submit: 'Проверить', next: 'Далее', reset: 'Заново', seconds: 'сек.', of: 'из', complete: 'Готово', timeUp: 'Время вышло',
    colorNames: { red: 'красный', blue: 'синий', green: 'зелёный', yellow: 'жёлтый' },
  },
  ko: {
    chooseDifficulty: '난이도', easyHint: '부드러운 시작', mediumHint: '일반 리듬', hardHint: '더 높은 집중',
    patternTitle: '시각 패턴 기억', patternIntro: '몇 초 동안 패턴을 보고 기억한 칸을 눌러 보세요.', patternShow: '패턴을 기억하세요', patternTap: '기억한 칸을 선택하세요', patternResult: '일치한 칸',
    stroopTitle: '스트룹 속도 라운드', stroopIntro: '단어가 아니라 잉크 색을 보세요. 각 항목에 정확히 2초가 주어집니다.', stroopPrompt: '잉크 색은 무엇인가요?', stroopResult: '맞힌 선택',
    sequenceTitle: '점진적 순서 회상', sequenceIntro: '숫자 재생을 보고 방향을 고른 뒤 세 라운드 동안 점점 길어지는 순서를 기억해 입력하세요.', forward: '정방향', reverse: '역방향', playSequence: '순서 재생', sequenceInput: '순서를 입력하세요', sequenceResult: '맞힌 라운드',
    mathTitle: '빠른 암산', mathIntro: '표준 연산 순서로 안전한 정수식을 풀어 보세요. 항목마다 10초입니다.', mathPrompt: '내 답', mathResult: '맞힌 답',
    anagramTitle: '단어 애너그램', anagramIntro: '흩어진 글자를 모아 단어를 찾으세요. 항목마다 15초입니다.', anagramPrompt: '단어를 입력하세요', anagramResult: '찾은 단어',
    start: '시작', submit: '확인', next: '다음', reset: '다시 시작', seconds: '초', of: '/', complete: '완료', timeUp: '시간이 끝났습니다',
    colorNames: { red: '빨강', blue: '파랑', green: '초록', yellow: '노랑' },
  },
};

export function DifficultySelector({ language, value, onChange, disabled = false, testIdPrefix = 'exercise' }: { language: AppLanguage; value: BrainGymDifficulty; onChange: (value: BrainGymDifficulty) => void; disabled?: boolean; testIdPrefix?: string }) {
  const c = exerciseCopy[language];
  const hints = { easy: c.easyHint, medium: c.mediumHint, hard: c.hardHint };
  return <div className="mt-4" data-testid={`control-${testIdPrefix}-difficulty`}><p className="mb-2 text-[10px] font-semibold uppercase tracking-[.12em] text-muted-foreground">{c.chooseDifficulty}</p><div className="grid grid-cols-3 gap-1.5 rounded-xl border border-border bg-card/60 p-1" role="group" aria-label={c.chooseDifficulty}>{BRAIN_GYM_DIFFICULTIES.map((item) => <button key={item} type="button" disabled={disabled} onClick={() => onChange(item)} aria-pressed={value === item} title={hints[item]} className={`min-h-10 rounded-lg px-2 text-[11px] font-semibold transition-colors disabled:opacity-45 ${value === item ? 'bg-[#30243f] text-[#fffaf0]' : 'text-muted-foreground hover:bg-muted'}`} data-testid={`button-${testIdPrefix}-difficulty-${item}`}>{difficultyLabels[language][item]}</button>)}</div></div>;
}

type CompletionProps = { language: AppLanguage; disabled: boolean; onComplete: (score: number, possible: number, difficulty: BrainGymDifficulty) => void };
const dateKey = () => localDateKey(new Date());
const patternMarkGlyphs: Record<string, string> = {
  circle: '●',
  square: '■',
  diamond: '◆',
  bar: '▬',
  plus: '+',
  cross: '×',
  ring: '○',
  hexagon: '⬡',
  star: '✦',
};

export function PatternMemory({ language, disabled, onComplete }: CompletionProps) {
  const c = exerciseCopy[language]; const [difficulty, setDifficulty] = useState<BrainGymDifficulty>('medium'); const [phase, setPhase] = useState<'idle' | 'showing' | 'input' | 'result'>('idle'); const [selected, setSelected] = useState<number[]>([]); const [score, setScore] = useState(0); const [targets, setTargets] = useState<number[]>([]); const [size, setSize] = useState<4 | 5>(4); const finished = useRef(false);
  useEffect(() => { if (phase !== 'showing') return undefined; const timer = window.setTimeout(() => setPhase('input'), matrixSeconds(difficulty) * 1000); return () => window.clearTimeout(timer); }, [phase, difficulty]);
  const start = () => { const next = patternFor(dateKey(), difficulty); setTargets(next.targets); setSize(next.size); setSelected([]); setScore(0); finished.current = false; setPhase('showing'); };
  const toggle = (index: number) => { if (phase !== 'input' || disabled) return; setSelected((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]); };
  const finish = () => { if (phase !== 'input' || finished.current) return; finished.current = true; const nextScore = selected.filter((item) => targets.includes(item)).length - selected.filter((item) => !targets.includes(item)).length; const safeScore = Math.max(0, nextScore); setScore(safeScore); setPhase('result'); onComplete(safeScore, targets.length, difficulty); };
  return <div className="mt-6 rounded-[22px] border border-[#d8d8e8] bg-[#f0f0f6] p-4 sm:p-5" data-testid="exercise-visual-pattern"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#6d6688]">04 / {c.patternTitle}</p><h3 className="mt-1 font-serif text-[24px]">{c.patternTitle}</h3></div><Palette size={18} className="text-[#6d6688]" /></div><p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{phase === 'showing' ? c.patternShow : phase === 'input' ? c.patternTap : c.patternIntro}</p><DifficultySelector testIdPrefix="visual-pattern" language={language} value={difficulty} onChange={setDifficulty} disabled={phase !== 'idle' || disabled} /><div className="mx-auto mt-5 grid max-w-[300px] gap-1.5" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }} data-testid="grid-visual-pattern">{Array.from({ length: size * size }, (_, index) => { const targetOrder = targets.indexOf(index); const visible = targetOrder >= 0 && (phase === 'showing' || phase === 'result'); const visual = targetOrder >= 0 ? patternCellFor(dateKey(), difficulty, targetOrder) : null; const picked = selected.includes(index); const correct = targetOrder >= 0; return <button key={index} type="button" onClick={() => toggle(index)} disabled={phase !== 'input' || disabled} aria-label={`${c.patternTap} ${index + 1}`} aria-pressed={picked} style={visible && visual ? { backgroundColor: visual.color, borderColor: visual.color } : undefined} className={`grid aspect-square place-items-center rounded-lg border text-[20px] font-semibold transition-colors disabled:cursor-default ${visible ? 'text-[#30243f]' : phase === 'result' && picked && !correct ? 'border-[#c98e76] bg-[#f0d2c9]' : picked ? 'border-[#6d6688] bg-[#d5cee1]' : 'border-[#d3d0db] bg-card'}`} data-testid={`cell-visual-pattern-${index}`}>{visible && visual ? <span aria-hidden="true">{patternMarkGlyphs[visual.mark]}</span> : null}</button>; })}</div>{phase === 'idle' && <button type="button" disabled={disabled} onClick={start} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#30243f] px-4 text-[13px] font-semibold text-[#fffaf0] disabled:opacity-45" data-testid="button-start-visual-pattern"><Eye size={16} />{c.start}</button>}{phase === 'showing' && <p className="mt-4 text-center font-mono text-[11px] text-[#6d6688]" role="status" data-testid="status-pattern-countdown">{matrixSeconds(difficulty)} {c.seconds}</p>}{phase === 'input' && <button type="button" disabled={disabled || selected.length === 0} onClick={finish} className="mt-5 inline-flex min-h-11 rounded-xl bg-[#47796c] px-4 text-[13px] font-semibold text-[#fffaf0] disabled:opacity-45" data-testid="button-submit-visual-pattern">{c.submit}</button>}{phase === 'result' && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card p-3.5" role="status" data-testid="status-pattern-result"><span className="text-[13px] font-semibold">{c.patternResult}: <strong className="font-serif text-[24px]">{score}</strong> {c.of} {targets.length}</span><button type="button" disabled={disabled} onClick={() => setPhase('idle')} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-3 text-[12px] font-semibold disabled:opacity-45" data-testid="button-reset-visual-pattern"><RotateCcw size={14} />{c.reset}</button></div>}</div>;
}

const inkStyles: Record<string, string> = { red: '#ae5b52', blue: '#5f7896', green: '#5f9271', yellow: '#b88a36' };

export function StroopRound({ language, disabled, onComplete }: CompletionProps) {
  const c = exerciseCopy[language];
  const [difficulty, setDifficulty] = useState<BrainGymDifficulty>('medium');
  const [items, setItems] = useState(() => stroopFor(dateKey(), 'medium'));
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [remaining, setRemaining] = useState(2);
  const [phase, setPhase] = useState<'idle' | 'active' | 'result'>('idle');
  const ended = useRef(false);
  const handledIndex = useRef(-1);

  const finish = (finalScore: number) => {
    if (ended.current) return;
    ended.current = true;
    setScore(finalScore);
    setPhase('result');
    onComplete(finalScore, items.length, difficulty);
  };

  useEffect(() => {
    if (phase !== 'active') return undefined;
    const deadline = Date.now() + 2000;
    setRemaining(2);
    const countdown = window.setInterval(() => {
      setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    }, 100);
    const timer = window.setTimeout(() => {
      if (handledIndex.current === index) return;
      handledIndex.current = index;
      if (index + 1 >= items.length) finish(score);
      else setIndex((value) => value + 1);
    }, 2000);
    return () => {
      window.clearInterval(countdown);
      window.clearTimeout(timer);
    };
  }, [phase, index, items.length, score]);

  const start = () => {
    setItems(stroopFor(dateKey(), difficulty));
    setIndex(0);
    setScore(0);
    handledIndex.current = -1;
    ended.current = false;
    setPhase('active');
  };
  const choose = (color: string) => {
    if (phase !== 'active' || ended.current || handledIndex.current === index) return;
    handledIndex.current = index;
    const next = score + (items[index].ink === color ? 1 : 0);
    if (index + 1 >= items.length) finish(next);
    else {
      setScore(next);
      setIndex((value) => value + 1);
    }
  };
  const current = items[index];

  return <div className="mt-6 rounded-[22px] border border-[#d8e4dd] bg-[#edf5f0] p-4 sm:p-5" data-testid="exercise-stroop">
    <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#47796c]">05 / {c.stroopTitle}</p><h3 className="mt-1 font-serif text-[24px]">{c.stroopTitle}</h3></div><Zap size={18} className="text-[#47796c]" /></div>
    <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{c.stroopIntro}</p>
    <DifficultySelector language={language} value={difficulty} onChange={setDifficulty} disabled={phase !== 'idle' || disabled} />
    {phase === 'active' && current && <div className="mt-5 text-center">
      <p className="font-mono text-[10px] text-muted-foreground">{index + 1} / {items.length}</p>
      <p className="mt-1 font-mono text-[11px] text-[#47796c]" role="timer" aria-label={`${remaining} ${c.seconds}`} data-testid="status-stroop-countdown">{remaining} {c.seconds}</p>
      <p className="mt-4 font-serif text-[42px] leading-none" style={{ color: inkStyles[current.ink] }} data-testid="text-stroop-word">{c.colorNames[current.word]}</p>
      <p className="mt-3 text-[12px] font-semibold">{c.stroopPrompt}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{Object.keys(inkStyles).map((color) => <button key={color} type="button" disabled={disabled} onClick={() => choose(color)} aria-label={c.colorNames[color]} className="min-h-11 rounded-xl border border-border bg-card px-2 text-[12px] font-semibold capitalize hover:bg-muted disabled:opacity-45" data-testid={`button-stroop-${color}`}>{c.colorNames[color]}</button>)}</div>
    </div>}
    {phase === 'idle' && <button type="button" disabled={disabled} onClick={start} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#47796c] px-4 text-[13px] font-semibold text-[#fffaf0] disabled:opacity-45" data-testid="button-start-stroop"><Play size={15} />{c.start}</button>}
    {phase === 'result' && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card p-3.5" role="status" data-testid="status-stroop-result"><span className="text-[13px] font-semibold">{c.stroopResult}: <strong className="font-serif text-[24px]">{score}</strong> {c.of} {items.length}</span><button type="button" disabled={disabled} onClick={() => setPhase('idle')} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-3 text-[12px] font-semibold disabled:opacity-45" data-testid="button-reset-stroop"><RotateCcw size={14} />{c.reset}</button></div>}
  </div>;
}

export function SequenceRecall({ language, disabled, onComplete }: CompletionProps) {
  const c = exerciseCopy[language];
  const [difficulty, setDifficulty] = useState<BrainGymDifficulty>('medium');
  const [direction, setDirection] = useState<'forward' | 'reverse'>('forward');
  const [phase, setPhase] = useState<'idle' | 'playing' | 'input' | 'result'>('idle');
  const [rounds, setRounds] = useState<number[][]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [playIndex, setPlayIndex] = useState(-1);
  const [answer, setAnswer] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const ended = useRef(false);
  const sequence = rounds[roundIndex] ?? [];

  const start = () => {
    setRounds(sequenceFor(dateKey(), difficulty));
    setRoundIndex(0);
    setAnswer([]);
    setPlayIndex(0);
    setScore(0);
    ended.current = false;
    setPhase('playing');
  };

  useEffect(() => {
    if (phase !== 'playing') return undefined;
    if (playIndex >= sequence.length) {
      const timer = window.setTimeout(() => setPhase('input'), 450);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setPlayIndex((value) => value + 1), 650);
    return () => window.clearTimeout(timer);
  }, [phase, playIndex, sequence.length]);

  const expected = direction === 'forward' ? sequence : [...sequence].reverse();
  const submit = () => {
    if (phase !== 'input' || ended.current || answer.length !== expected.length) return;
    const correct = answer.every((value, index) => value === expected[index]);
    const nextScore = score + (correct ? 1 : 0);
    if (roundIndex + 1 >= rounds.length) {
      ended.current = true;
      setScore(nextScore);
      setPhase('result');
      onComplete(nextScore, rounds.length, difficulty);
      return;
    }
    setScore(nextScore);
    setRoundIndex((value) => value + 1);
    setAnswer([]);
    setPlayIndex(0);
    setPhase('playing');
  };

  return <div className="mt-6 rounded-[22px] border border-[#eee0c0] bg-[#faf3e3] p-4 sm:p-5" data-testid="exercise-sequence-recall">
    <p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#9a6b23]">06 / {c.sequenceTitle}</p>
    <h3 className="mt-1 font-serif text-[24px]">{c.sequenceTitle}</h3>
    <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{c.sequenceIntro}</p>
    <DifficultySelector language={language} value={difficulty} onChange={setDifficulty} disabled={phase !== 'idle' || disabled} />
    <div className="mt-4 grid grid-cols-2 gap-2" role="group" aria-label={c.sequenceTitle}>
      <button type="button" disabled={phase !== 'idle' || disabled} onClick={() => setDirection('forward')} aria-pressed={direction === 'forward'} className={`min-h-10 rounded-xl border px-3 text-[12px] font-semibold disabled:opacity-45 ${direction === 'forward' ? 'border-[#9a6b23] bg-[#fffaf0]' : 'border-border bg-card'}`} data-testid="button-sequence-forward">{c.forward}</button>
      <button type="button" disabled={phase !== 'idle' || disabled} onClick={() => setDirection('reverse')} aria-pressed={direction === 'reverse'} className={`min-h-10 rounded-xl border px-3 text-[12px] font-semibold disabled:opacity-45 ${direction === 'reverse' ? 'border-[#9a6b23] bg-[#fffaf0]' : 'border-border bg-card'}`} data-testid="button-sequence-reverse">{c.reverse}</button>
    </div>
    {phase === 'playing' && <div className="mt-5">
      <p className="text-center font-mono text-[10px] text-muted-foreground" data-testid="text-sequence-round">{roundIndex + 1} / {rounds.length} · {Math.min(playIndex + 1, sequence.length)} / {sequence.length}</p>
      <div className="mt-3 flex justify-center gap-2" aria-live="polite" data-testid="status-sequence-playback">{sequence.map((tile, index) => <span key={`${index}-${tile}`} className={`grid size-10 place-items-center rounded-xl border font-mono text-[17px] transition-colors ${index === playIndex ? 'border-[#9a6b23] bg-[#e3c77d]' : 'border-border bg-card text-transparent'}`}>{index === playIndex ? tile : '0'}</span>)}</div>
    </div>}
    {phase === 'input' && <div className="mt-5">
      <p className="text-[12px] font-semibold" data-testid="text-sequence-round">{roundIndex + 1} / {rounds.length} · {c.sequenceInput}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">{Array.from({ length: 9 }, (_, index) => index + 1).map((number) => <button key={number} type="button" disabled={disabled} onClick={() => setAnswer((current) => current.length < expected.length ? [...current, number] : current)} className="grid size-10 place-items-center rounded-xl border border-border bg-card font-mono text-[14px] hover:bg-muted disabled:opacity-45" data-testid={`button-sequence-tile-${number}`}>{number}</button>)}</div>
      <p className="mt-3 text-center font-mono text-[12px]" data-testid="text-sequence-answer">{answer.join(' · ') || '—'}</p>
      <button type="button" disabled={disabled || answer.length !== expected.length} onClick={submit} className="mt-3 min-h-11 rounded-xl bg-[#30243f] px-4 text-[13px] font-semibold text-[#fffaf0] disabled:opacity-45" data-testid="button-submit-sequence">{c.submit}</button>
    </div>}
    {phase === 'idle' && <button type="button" disabled={disabled} onClick={start} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#30243f] px-4 text-[13px] font-semibold text-[#fffaf0] disabled:opacity-45" data-testid="button-start-sequence"><Play size={15} />{c.playSequence}</button>}
    {phase === 'result' && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card p-3.5" role="status" data-testid="status-sequence-result"><span className="text-[13px] font-semibold">{c.sequenceResult}: <strong className="font-serif text-[24px]">{score}</strong> {c.of} {rounds.length}</span><button type="button" disabled={disabled} onClick={() => setPhase('idle')} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-3 text-[12px] font-semibold disabled:opacity-45" data-testid="button-reset-sequence"><RotateCcw size={14} />{c.reset}</button></div>}
  </div>;
}

function TimedTextExercise({ type, language, disabled, onComplete }: CompletionProps & { type: 'math' | 'anagram' }) {
  const c = exerciseCopy[language];
  const [difficulty, setDifficulty] = useState<BrainGymDifficulty>('medium');
  const [items, setItems] = useState(() => type === 'math' ? mathFor(dateKey(), 'medium') : anagramsFor(dateKey(), language, 'medium'));
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<'idle' | 'active' | 'result'>('idle');
  const [remaining, setRemaining] = useState(type === 'math' ? 10 : 15);
  const ended = useRef(false);
  const handledIndex = useRef(-1);
  const isMath = type === 'math';
  const title = isMath ? c.mathTitle : c.anagramTitle;
  const intro = isMath ? c.mathIntro : c.anagramIntro;
  const prompt = isMath ? c.mathPrompt : c.anagramPrompt;
  const result = isMath ? c.mathResult : c.anagramResult;
  const limit = isMath ? 10 : 15;

  const finish = (finalScore: number) => {
    if (ended.current) return;
    ended.current = true;
    setScore(finalScore);
    setPhase('result');
    onComplete(finalScore, items.length, difficulty);
  };

  useEffect(() => {
    if (phase !== 'active') return undefined;
    const deadline = Date.now() + limit * 1000;
    setRemaining(limit);
    const countdown = window.setInterval(() => {
      setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    }, 100);
    const timer = window.setTimeout(() => {
      if (handledIndex.current === index) return;
      handledIndex.current = index;
      if (index + 1 >= items.length) finish(score);
      else {
        setIndex((value) => value + 1);
        setInput('');
      }
    }, limit * 1000);
    return () => {
      window.clearInterval(countdown);
      window.clearTimeout(timer);
    };
  }, [phase, index, items.length, score, limit]);

  const start = () => {
    setItems(isMath ? mathFor(dateKey(), difficulty) : anagramsFor(dateKey(), language, difficulty));
    setIndex(0);
    setScore(0);
    setInput('');
    handledIndex.current = -1;
    ended.current = false;
    setPhase('active');
  };
  const submit = () => {
    if (phase !== 'active' || ended.current || handledIndex.current === index) return;
    handledIndex.current = index;
    const item = items[index];
    const correct = isMath
      ? Number(input) === (item as { answer: number }).answer
      : input.normalize('NFC').trim().toLocaleLowerCase(language)
        === (item as { answer: string }).answer.normalize('NFC').toLocaleLowerCase(language);
    const next = score + (correct ? 1 : 0);
    if (index + 1 >= items.length) finish(next);
    else {
      setScore(next);
      setIndex((value) => value + 1);
      setInput('');
    }
  };
  const current = items[index] as { expression?: string; scrambled?: string };

  return <div className={`mt-6 rounded-[22px] border p-4 sm:p-5 ${isMath ? 'border-[#d6e3de] bg-[#edf5f0]' : 'border-[#e3d4e0] bg-[#f5edf5]'}`} data-testid={`exercise-${type === 'math' ? 'speed-math' : 'anagrams'}`}>
    <p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#47796c]">{isMath ? '07' : '08'} / {title}</p>
    <h3 className="mt-1 font-serif text-[24px]">{title}</h3>
    <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{intro}</p>
    <DifficultySelector language={language} value={difficulty} onChange={setDifficulty} disabled={phase !== 'idle' || disabled} />
    {phase === 'active' && <div className="mt-5 text-center">
      <p className="font-mono text-[10px] text-muted-foreground">{index + 1} / {items.length}</p>
      <p className="mt-1 font-mono text-[11px] text-[#47796c]" role="timer" aria-label={`${remaining} ${c.seconds}`} data-testid={`status-${type}-countdown`}>{remaining} {c.seconds}</p>
      <p className="mt-4 font-serif text-[32px] leading-tight" data-testid={`text-${type}-prompt`}>{isMath ? current.expression : current.scrambled}</p>
      <label className="mt-4 block text-left text-[12px] font-semibold" htmlFor={`${type}-answer`}>{prompt}</label>
      <div className="mt-2 flex gap-2">
        <input id={`${type}-answer`} type="text" inputMode={isMath ? 'numeric' : 'text'} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submit(); }} disabled={disabled} aria-label={prompt} className="min-h-11 min-w-0 flex-1 rounded-xl border border-border bg-card px-3 text-[13px] outline-none focus:border-[#47796c] disabled:opacity-45" data-testid={`input-${type}-answer`} />
        <button type="button" disabled={disabled || !input.trim()} onClick={submit} className="min-h-11 rounded-xl bg-[#47796c] px-4 text-[13px] font-semibold text-[#fffaf0] disabled:opacity-45" data-testid={`button-submit-${type}`}>{c.submit}</button>
      </div>
    </div>}
    {phase === 'idle' && <button type="button" disabled={disabled} onClick={start} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#47796c] px-4 text-[13px] font-semibold text-[#fffaf0] disabled:opacity-45" data-testid={`button-start-${type}`}><TimerReset size={15} />{c.start}</button>}
    {phase === 'result' && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card p-3.5" role="status" data-testid={`status-${type}-result`}><span className="text-[13px] font-semibold">{result}: <strong className="font-serif text-[24px]">{score}</strong> {c.of} {items.length}</span><button type="button" disabled={disabled} onClick={() => setPhase('idle')} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-3 text-[12px] font-semibold disabled:opacity-45" data-testid={`button-reset-${type}`}><RotateCcw size={14} />{c.reset}</button></div>}
  </div>;
}

export function SpeedMath(props: CompletionProps) { return <TimedTextExercise {...props} type="math" />; }
export function Anagrams(props: CompletionProps) { return <TimedTextExercise {...props} type="anagram" />; }

export function featuredExerciseTitle(language: AppLanguage, id: string): string {
  const c = exerciseCopy[language];
  const oldTitles: Record<AppLanguage, Record<string, string>> = {
    uz: { 'number-matrix': 'Raqamlar matritsasi', 'word-chain': 'So‘zlar zanjiri', 'spaced-recall': 'Oraliqli qayta chaqirish' },
    en: { 'number-matrix': 'Number memory matrix', 'word-chain': 'Word association chain', 'spaced-recall': 'Spaced recall' },
    ru: { 'number-matrix': 'Матрица чисел', 'word-chain': 'Цепочка слов', 'spaced-recall': 'Интервальное повторение' },
    ko: { 'number-matrix': '숫자 기억 매트릭스', 'word-chain': '단어 연결 고리', 'spaced-recall': '간격 회상' },
  };
  return ({ ...oldTitles[language], 'visual-pattern': c.patternTitle, stroop: c.stroopTitle, 'sequence-recall': c.sequenceTitle, 'speed-math': c.mathTitle, anagrams: c.anagramTitle } as Record<string, string>)[id] ?? c.patternTitle;
}