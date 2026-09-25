import { useState } from 'react';
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import './_group.css';

const modes = ['Diqqat vaqti', 'Qisqa tanaffus', 'Uzoq tanaffus'];

export function Current() {
  const [selectedMode, setSelectedMode] = useState(0);
  const [running, setRunning] = useState(false);

  return (
    <main className="diary-mockup flex min-h-screen items-center justify-center bg-[#f2efe5] p-5 text-[#302c35] dark:bg-[#1d211e] dark:text-[#f3eddf]">
      <section className="relative flex min-h-[760px] w-full max-w-[720px] flex-col items-center justify-center px-4 py-8">
        <div className="flex w-full items-center justify-between gap-4 px-1">
          <div>
            <p className="diary-mockup-mono text-[9px] uppercase tracking-[.2em] text-[#9a6b23]">Hozirgi davr</p>
            <p className="mt-1 text-[12px] font-semibold text-[#493c2b] dark:text-[#f1e4c3]">{modes[selectedMode]}</p>
          </div>
          <div className="diary-mockup-mono text-[10px] text-[#8e6d34] dark:text-[#dcc78d]">3 davr yakunlangan</div>
        </div>
        <div className="mt-5 flex flex-col items-center">
          <div className="relative size-[300px] sm:size-[360px]">
            <svg viewBox="0 0 260 260" className="-rotate-90 size-full" aria-hidden="true">
              <circle cx="130" cy="130" r="112" fill="none" stroke="#ddd6c5" strokeWidth="7" />
              <circle cx="130" cy="130" r="112" fill="none" stroke="#9b6543" strokeWidth="7" strokeLinecap="round" strokeDasharray="703.7" strokeDashoffset="112" />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="diary-mockup-mono text-[10px] uppercase tracking-[.18em] text-[#9b6543]">{modes[selectedMode]}</p>
                <p className="diary-mockup-mono mt-2 text-[clamp(2.8rem,8vw,4rem)] leading-none tracking-[-.08em] text-[#493c2b] dark:text-[#f1e4c3]">25:00</p>
                <p className="mt-3 max-w-[180px] truncate text-[11px] text-[#88775b] dark:text-[#cdbf9c]">Kunlik reja yozish</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-1.5" role="tablist" aria-label="Taymer rejimlari">
            {modes.map((mode, index) => (
              <button key={mode} type="button" role="tab" aria-selected={selectedMode === index} onClick={() => setSelectedMode(index)} className={`rounded-full px-3 py-1.5 text-[10px] transition-colors ${selectedMode === index ? 'bg-[#493c2b] text-[#fff8e6]' : 'text-[#89795d] hover:bg-[#eee2c3]'}`}>
                {mode}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => setRunning((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-[#493c2b] px-6 py-3 text-[12px] font-semibold text-[#fff8e6] shadow-sm">
            {running ? <Pause size={15} /> : <Play size={15} />} {running ? 'Pauza' : 'Boshlash'}
          </button>
          <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-[#d8c795] bg-[#fff9e9]/70 px-3.5 py-3 text-[11px] font-semibold text-[#67563a]"><SkipForward size={14} /> O‘tkazish</button>
          <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-[#d8c795] bg-[#fff9e9]/70 px-3.5 py-3 text-[11px] font-semibold text-[#67563a]"><RotateCcw size={14} /> Qayta</button>
        </div>
        <div className="mt-5 flex items-center justify-center gap-2 border-t border-[#e1d4ae] pt-4 text-[10px] text-[#89775a]">
          <span>Hozirgi vazifa</span><span className="rounded-lg border border-[#d8c795] bg-[#fff9e9] px-2 py-1.5 text-[#4e422f]">Kunlik reja yozish</span>
        </div>
      </section>
    </main>
  );
}