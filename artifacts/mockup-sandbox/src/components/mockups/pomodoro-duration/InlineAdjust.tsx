import { useState } from 'react';
import { Pause, Play, RotateCcw, Settings2, SkipForward } from 'lucide-react';
import './_group.css';

const presets = [15, 25, 30, 45, 60];

export function InlineAdjust() {
  const [minutes, setMinutes] = useState(30);
  const [draft, setDraft] = useState('30');
  const [editing, setEditing] = useState(false);
  const [running, setRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const applyMinutes = (value: string) => {
    const next = Number(value);
    if (!Number.isInteger(next) || next < 1 || next > 180) {
      setDraft(String(minutes));
      setEditing(false);
      return;
    }
    setMinutes(next);
    setDraft(String(next));
    setEditing(false);
  };

  return (
    <main className="diary-mockup flex min-h-screen items-center justify-center bg-[#f2efe5] p-5 text-[#302c35] dark:bg-[#1d211e] dark:text-[#f3eddf]">
      <section className="relative flex min-h-[760px] w-full max-w-[720px] flex-col items-center justify-center px-4 py-8">
        <div className="flex w-full items-center justify-between gap-4 px-1">
          <div>
            <p className="diary-mockup-mono text-[9px] uppercase tracking-[.2em] text-[#9a6b23]">Hozirgi davr</p>
            <p className="mt-1 text-[12px] font-semibold text-[#493c2b] dark:text-[#f1e4c3]">Diqqat vaqti</p>
          </div>
          <div className="diary-mockup-mono text-[10px] text-[#8e6d34] dark:text-[#dcc78d]">3 davr yakunlangan</div>
        </div>
        <button type="button" onClick={() => setShowSettings((value) => !value)} aria-label="Ilg‘or taymer sozlamalari" title="Ilg‘or sozlamalar" className="absolute right-2 top-2 grid size-9 place-items-center rounded-xl border border-[#d8c795] bg-[#fff9e9]/70 text-[#67563a] transition hover:bg-[#f4e8c9] dark:border-[#665837] dark:bg-[#3a3023] dark:text-[#ead9aa]">
          <Settings2 size={15} />
        </button>
        {showSettings && <div className="absolute right-2 top-12 z-10 rounded-xl border border-[#d8c795] bg-[#fff9e9] px-4 py-3 text-[10px] text-[#67563a] shadow-lg">Bildirishnoma ovozi · Tanaffus davomiyligi</div>}
        <div className="mt-5 flex flex-col items-center">
          <div className="relative size-[300px] sm:size-[360px]">
            <svg viewBox="0 0 260 260" className="-rotate-90 size-full" aria-hidden="true">
              <circle cx="130" cy="130" r="112" fill="none" stroke="#ddd6c5" strokeWidth="7" />
              <circle cx="130" cy="130" r="112" fill="none" stroke="#9b6543" strokeWidth="7" strokeLinecap="round" strokeDasharray="703.7" strokeDashoffset="112" />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="diary-mockup-mono text-[10px] uppercase tracking-[.18em] text-[#9b6543]">Diqqat vaqti</p>
                {editing ? (
                  <label className="mt-2 flex items-center justify-center gap-2">
                    <input autoFocus type="number" min={1} max={180} step={1} value={draft} onChange={(event) => setDraft(event.target.value)} onFocus={(event) => event.currentTarget.select()} onKeyDown={(event) => { if (event.key === 'Enter') applyMinutes(draft); if (event.key === 'Escape') { setDraft(String(minutes)); setEditing(false); } }} onBlur={() => applyMinutes(draft)} aria-label="Taymer davomiyligi daqiqalarda" className="diary-mockup-mono w-24 rounded-lg border border-[#d8c795] bg-[#fff9e9] px-2 py-1 text-center text-3xl text-[#493c2b] outline-none focus:ring-2 focus:ring-[#a56c34]/30" />
                    <span className="text-[10px] text-[#88775b]">daq</span>
                  </label>
                ) : (
                  <button type="button" onClick={() => { setDraft(String(minutes)); setEditing(true); }} title="Davomiylikni o‘zgartirish" aria-label={`Taymer davomiyligini o‘zgartirish, hozir ${minutes} daqiqa`} className="diary-mockup-mono mt-2 rounded-md text-[clamp(2.8rem,8vw,4rem)] leading-none tracking-[-.08em] text-[#493c2b] underline decoration-dotted underline-offset-8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#9b6543] dark:text-[#f1e4c3]">
                    {String(minutes).padStart(2, '0')}:00
                  </button>
                )}
                <p className="mt-3 max-w-[180px] truncate text-[11px] text-[#88775b] dark:text-[#cdbf9c]">Kunlik reja yozish</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Tez davomiylik tanlash">
            {presets.map((preset) => <button key={preset} type="button" onClick={() => { setMinutes(preset); setDraft(String(preset)); setEditing(false); }} aria-pressed={minutes === preset} className={`rounded-full px-3 py-1.5 text-[10px] font-medium transition-colors ${minutes === preset ? 'bg-[#47796c] text-white' : 'bg-[#eee8d9] text-[#67563a] hover:bg-[#e4dac1] dark:bg-[#3b3b32] dark:text-[#d8cda9]'}`}>{preset}m</button>)}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => setRunning((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-[#493c2b] px-6 py-3 text-[12px] font-semibold text-[#fff8e6] shadow-sm">
            {running ? <Pause size={15} /> : <Play size={15} />} {running ? 'Pauza' : 'Boshlash'}
          </button>
          <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-[#d8c795] bg-[#fff9e9]/70 px-3.5 py-3 text-[11px] font-semibold text-[#67563a]"><SkipForward size={14} /> O‘tkazish</button>
          <button type="button" onClick={() => setDraft(String(minutes))} className="inline-flex items-center gap-2 rounded-xl border border-[#d8c795] bg-[#fff9e9]/70 px-3.5 py-3 text-[11px] font-semibold text-[#67563a]"><RotateCcw size={14} /> Qayta</button>
        </div>
        <div className="mt-5 flex items-center justify-center gap-2 border-t border-[#e1d4ae] pt-4 text-[10px] text-[#89775a]">
          <span>Hozirgi vazifa</span><span className="rounded-lg border border-[#d8c795] bg-[#fff9e9] px-2 py-1.5 text-[#4e422f]">Kunlik reja yozish</span>
        </div>
        <p className="mt-3 text-center text-[10px] text-[#876f41]">Tez tanlovlar faqat joriy taymerni o‘zgartiradi.</p>
      </section>
    </main>
  );
}