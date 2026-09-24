import { useState } from 'react';
import { Bold, CalendarDays, Eye, Italic, List, Quote } from 'lucide-react';
import './_group.css';

export function Current() {
  const [title, setTitle] = useState('Sokin tongdagi fikrlar');
  const [preview, setPreview] = useState(false);

  return <main className="diary-mockup min-h-screen bg-[#f5efe3] p-5 text-[#382f47] sm:p-8">
    <div className="mx-auto max-w-[1080px]">
      <div className="mb-7 flex items-center justify-between text-[11px]">
        <button className="rounded-xl border border-[#d8cdb7] bg-[#fffdf8] px-3.5 py-2.5 font-semibold">← Arxivga qaytish</button>
        <span className="diary-mockup-mono text-[9px] uppercase tracking-[.16em] text-[#8c765c]">Shaxsiy kundalik</span>
      </div>
      <div className="grid gap-9 lg:grid-cols-[1fr_250px]">
        <section className="min-w-0">
          <p className="diary-mockup-mono text-[10px] uppercase tracking-[.18em] text-[#9a6b23]">Yangi sahifa</p>
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-5 w-full border-0 bg-transparent font-serif text-[clamp(3.2rem,7vw,6.5rem)] leading-[.88] tracking-[-.055em] text-[#41365a] outline-none placeholder:text-[#41365a]/20" aria-label="Sarlavha" />
          <div className="mt-8 flex items-center gap-3 border-b border-[#ded5c5] pb-5 text-[11px] text-[#81768c]">
            <CalendarDays size={15} /><span>2026-09-24</span><span className="text-[#c5b9a6]">/</span><span>Mulohazali</span>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-1 border-y border-[#ded5c5] py-2 text-[11px] text-[#81768c]">
            <button className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2"><Bold size={15} /><span className="hidden sm:inline">Qalin</span></button>
            <button className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2"><Italic size={15} /><span className="hidden sm:inline">Qiya</span></button>
            <button className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2"><List size={15} /><span className="hidden sm:inline">Ro‘yxat</span></button>
            <button className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2"><Quote size={15} /><span className="hidden sm:inline">Iqtibos</span></button>
            <button onClick={() => setPreview(!preview)} className="ml-1 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2"><Eye size={15} />{preview ? 'Tahrirlash' : 'Ko‘rish'}</button>
          </div>
          <div className="min-h-[360px] py-7 text-[13px] leading-[1.9] text-[#4c435a]">
            {preview ? <p>Bugun tong sokin va ravshan boshlandi. Bir piyola choy bilan o‘tirib, haftadagi eng muhim fikrlarni yozib oldim.</p> : <div contentEditable suppressContentEditableWarning className="min-h-[300px] outline-none">Bugun tong sokin va ravshan boshlandi. Bir piyola choy bilan o‘tirib, haftadagi eng muhim fikrlarni yozib oldim.</div>}
          </div>
          <div className="rounded-2xl border border-[#d8cdaf] bg-[#fbf6e9] p-4">
            <p className="diary-mockup-mono text-[9px] uppercase tracking-[.16em] text-[#9a6b23]">Ovozli yozish</p>
            <p className="mt-2 text-[11px] text-[#81768c]">Gapiring — so‘zlaringiz matnga aylanadi.</p>
          </div>
        </section>
        <aside className="space-y-4 lg:pt-40">
          <div className="rounded-2xl border border-[#e2d9c9] bg-[#fffdf8] p-5">
            <p className="diary-mockup-mono text-[9px] uppercase tracking-[.16em] text-[#81768c]">Kayfiyat</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]"><span className="rounded-lg bg-[#f8e4dc] px-2 py-2 text-[#a34e3c]">Xursand</span><span className="rounded-lg bg-[#e7e2f2] px-2 py-2 text-[#635288]">Mulohazali</span><span className="rounded-lg bg-[#e2eee7] px-2 py-2 text-[#47796c]">Tinch</span><span className="rounded-lg bg-[#f6ebcb] px-2 py-2 text-[#8c681b]">Umidli</span></div>
          </div>
          <div className="rounded-2xl border border-[#e2d9c9] bg-[#fffdf8] p-5 text-[11px]">
            <p className="diary-mockup-mono text-[9px] uppercase tracking-[.16em] text-[#81768c]">Toifa</p>
            <p className="mt-3 border-b border-[#e2d9c9] pb-2">Shaxsiy</p>
            <button className="mt-5 w-full rounded-xl bg-[#41365a] px-4 py-3 font-semibold text-white">Saqlash</button>
          </div>
        </aside>
      </div>
    </div>
  </main>;
}