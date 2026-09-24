import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Bold, CalendarDays, Check, Eye, ImagePlus, Italic, List, Quote, Save, Upload } from 'lucide-react';
import './_group.css';

const covers = [
  { id: 'dark', name: 'Minimalistik qoramtir gradient', paint: 'linear-gradient(125deg,#171821,#29283a 54%,#48445d)' },
  { id: 'wood', name: 'Iliq yog‘och', paint: 'repeating-linear-gradient(103deg,transparent 0 34px,rgba(255,224,183,.1) 36px,transparent 40px 75px),linear-gradient(125deg,#4d2e23,#86573a 54%,#bd8958)' },
  { id: 'space', name: 'Chuqur koinot', paint: 'radial-gradient(circle at 18% 27%,#fff 0 1px,transparent 1.8px),radial-gradient(circle at 74% 20%,#fff9 0 1px,transparent 1.8px),linear-gradient(130deg,#091326,#172b51 54%,#43386e)' },
  { id: 'sunset', name: 'Oltin shafaq', paint: 'radial-gradient(ellipse at 82% 8%,#ffdf9770,transparent 38%),linear-gradient(128deg,#71352e,#bb6039 48%,#e2a94f)' },
];

export function Refresh() {
  const [title, setTitle] = useState('Sokin tongdagi fikrlar');
  const [selected, setSelected] = useState('dark');
  const [customImage, setCustomImage] = useState('');
  const [urlDraft, setUrlDraft] = useState('');
  const [notice, setNotice] = useState('');
  const titleRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const field = titleRef.current;
    if (!field) return;
    const resize = () => {
      field.style.height = 'auto';
      field.style.height = `${field.scrollHeight}px`;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [title]);

  useEffect(() => () => {
    if (customImage.startsWith('blob:')) URL.revokeObjectURL(customImage);
  }, [customImage]);

  const activeCover = customImage || covers.find((cover) => cover.id === selected)?.paint;
  const useUrl = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const url = new URL(urlDraft);
      if (url.protocol !== 'https:') throw new Error('secure');
      setCustomImage(url.toString());
      setNotice('Rasm havolasi qo‘llandi.');
    } catch {
      setNotice('Havola https:// bilan boshlanishi kerak.');
    }
  };
  const useUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    setCustomImage(URL.createObjectURL(file));
    setNotice('Yuklangan rasm qo‘llandi.');
  };

  return <main className="diary-mockup min-h-screen bg-[#f5efe3] px-4 py-6 text-[#382f47] sm:px-7 sm:py-8">
    <div className="mx-auto max-w-[1120px]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button className="inline-flex items-center gap-2 rounded-xl border border-[#d8cdb7] bg-[#fffdf8] px-3.5 py-2.5 text-[11px] font-semibold"><ArrowLeft size={14} /> Arxivga qaytish</button>
        <span className="diary-mockup-mono text-[9px] uppercase tracking-[.16em] text-[#8c765c]">Yozuv maydoni</span>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="diary-cover overflow-hidden rounded-[24px] border border-[#e2d9c9] bg-[#fffdf8] shadow-[0_18px_48px_rgba(43,34,24,.14)] sm:rounded-[28px]">
          <header className="relative isolate min-h-[238px] overflow-hidden p-5 text-white sm:min-h-[252px] sm:p-7 md:p-9" style={{ background: activeCover }}>
            {customImage && <img src={customImage} alt="" aria-hidden="true" className="absolute inset-0 size-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/20" />
            <div className="relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="diary-mockup-mono text-[10px] uppercase tracking-[.18em] text-white/75">Yangi sahifa</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/12 px-2.5 py-1 text-[10px] text-white"><Check size={13} /> Saqlanmagan</span>
              </div>
              <textarea ref={titleRef} rows={1} value={title} onChange={(event) => setTitle(event.target.value)} className="mt-5 block w-full resize-none overflow-hidden border-0 bg-transparent p-0 font-serif text-[clamp(2.7rem,7vw,5.5rem)] leading-[.94] tracking-[-.055em] text-white outline-none placeholder:text-white/50 focus:ring-0" aria-label="Sarlavha" />
              <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-white/80"><CalendarDays size={15} /><span className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5">2026-09-24</span><span className="text-white/35">/</span><span className="rounded-full bg-white/10 px-3 py-1.5">Mulohazali</span></div>
            </div>
          </header>
          <div className="px-4 pb-5 sm:px-7 md:px-9">
            <div className="mt-6 flex flex-wrap items-center gap-1 border-y border-[#ded5c5] py-2 text-[11px] text-[#81768c]">
              <button className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2"><Bold size={15} /><span className="hidden sm:inline">Qalin</span></button>
              <button className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2"><Italic size={15} /><span className="hidden sm:inline">Qiya</span></button>
              <button className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2"><List size={15} /><span className="hidden sm:inline">Ro‘yxat</span></button>
              <button className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2"><Quote size={15} /><span className="hidden sm:inline">Iqtibos</span></button>
              <button className="ml-1 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2"><Eye size={15} /> Ko‘rish</button>
            </div>
            <div contentEditable suppressContentEditableWarning className="min-h-[290px] py-7 text-[13px] leading-[1.9] text-[#4c435a] outline-none">Bugun tong sokin va ravshan boshlandi. Bir piyola choy bilan o‘tirib, haftadagi eng muhim fikrlarni yozib oldim.</div>
            <div className="rounded-2xl border border-[#d8cdaf] bg-[#fbf6e9] p-4"><p className="diary-mockup-mono text-[9px] uppercase tracking-[.16em] text-[#9a6b23]">Ovozli yozish</p><p className="mt-2 text-[11px] text-[#81768c]">Gapiring — so‘zlaringiz matnga aylanadi.</p></div>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-[#e2d9c9] bg-[#fffdf8] p-5">
            <div className="flex items-center justify-between gap-2"><h2 className="diary-mockup-serif text-[24px]">Muqova</h2><span className="diary-mockup-mono text-[8px] uppercase tracking-[.12em] text-[#81768c]">Sozlamalar</span></div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {covers.map((cover) => <button key={cover.id} type="button" onClick={() => { setSelected(cover.id); setCustomImage(''); setNotice('Muqova uslubi tanlandi.'); }} aria-pressed={selected === cover.id && !customImage} className={`rounded-xl border p-1.5 text-left transition-all ${selected === cover.id && !customImage ? 'border-[#a77f3d] ring-2 ring-[#c5a25f]/25' : 'border-[#e2d9c9] hover:border-[#b89c5c]'}`}>
                <span className="block h-10 rounded-lg" style={{ background: cover.paint }} />
                <span className="mt-1.5 block min-h-[24px] whitespace-normal px-0.5 text-[9px] leading-3 font-semibold">{cover.name}</span>
              </button>)}
            </div>
            <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#e2d9c9] bg-[#faf7f0] px-3 py-2.5 text-[10px] font-semibold"><ImagePlus size={14} /> Rasm yuklash<input type="file" accept="image/*" onChange={useUpload} className="sr-only" /></label>
            <form onSubmit={useUrl} className="mt-3">
              <label htmlFor="mock-cover-url" className="text-[10px] font-semibold">Yoki rasm havolasi</label>
              <input id="mock-cover-url" value={urlDraft} onChange={(event) => setUrlDraft(event.target.value)} placeholder="https://misol.uz/muqova.jpg" className="mt-1.5 h-10 w-full rounded-lg border border-[#e2d9c9] bg-[#faf7f0] px-2.5 text-[9px] outline-none focus:border-[#b89c5c]" />
              <button type="submit" className="mt-2 w-full rounded-lg bg-[#41365a] px-3 py-2.5 text-[10px] font-semibold text-white">Havolani qo‘llash</button>
            </form>
            {notice && <p className="mt-3 text-[9px] leading-relaxed text-[#47796c]" role="status">{notice}</p>}
            <p className="mt-3 text-[9px] leading-relaxed text-[#81768c]">Yuklangan rasm va tanlov ushbu qurilmada saqlanadi.</p>
          </section>
          <section className="rounded-2xl border border-[#e2d9c9] bg-[#fffdf8] p-5">
            <p className="diary-mockup-mono text-[9px] uppercase tracking-[.16em] text-[#81768c]">Kayfiyat</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]"><span className="rounded-lg bg-[#f8e4dc] px-2 py-2 text-[#a34e3c]">Xursand</span><span className="rounded-lg bg-[#e7e2f2] px-2 py-2 text-[#635288]">Mulohazali</span><span className="rounded-lg bg-[#e2eee7] px-2 py-2 text-[#47796c]">Tinch</span><span className="rounded-lg bg-[#f6ebcb] px-2 py-2 text-[#8c681b]">Umidli</span></div>
            <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#41365a] px-4 py-3 text-[11px] font-semibold text-white"><Save size={14} /> Saqlash</button>
          </section>
        </aside>
      </div>
    </div>
  </main>;
}