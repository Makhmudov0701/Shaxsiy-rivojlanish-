import { useMemo, useState } from 'react';
import { useUser } from '@clerk/react';
import { useForm } from 'react-hook-form';
import { BookOpen, Check, Pencil, Plus, Quote, Search, Star, Trash2, X } from 'lucide-react';
import { Form } from '@/components/ui/form';
import { FlashNotice } from '@/components/diary-ui';
import { ModulePageFrame, UserStoragePage } from '@/pages/local-module-pages';
import { useLocalModuleStorage } from '@/lib/local-module-storage';
import { EMPTY_BOOKS, isTrackedBookList, userStorageKey, type BookQuote, type BookStatus, type TrackedBook } from '@/lib/local-life-data';

type BookFormValues = { title: string; author: string; status: BookStatus; takeaways: string };
const emptyBookForm: BookFormValues = { title: '', author: '', status: 'reading', takeaways: '' };
const statusLabels: Record<BookStatus, string> = { reading: 'O‘qiyapman', finished: 'Tugatdim', wishlist: 'O‘qimoqchiman' };
const bookStatusOptions: BookStatus[] = ['reading', 'finished', 'wishlist'];
const statusFilters = ['all', 'reading', 'finished', 'wishlist'] as const;
type StatusFilter = (typeof statusFilters)[number];

function BookTracker({ storageKey }: { storageKey: string }) {
  const store = useLocalModuleStorage(storageKey, EMPTY_BOOKS, isTrackedBookList, 'Kitoblar');
  const form = useForm<BookFormValues>({ defaultValues: emptyBookForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [quoteDrafts, setQuoteDrafts] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2400);
  };
  const visibleBooks = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('uz-UZ');
    return [...store.value]
      .filter((book) => (filter === 'all' || book.status === filter)
        && (!query || `${book.title} ${book.author} ${book.takeaways} ${book.quotes.map((item) => item.text).join(' ')}`.toLocaleLowerCase('uz-UZ').includes(query)))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [filter, search, store.value]);

  const submit = form.handleSubmit((values) => {
    const title = values.title.trim();
    if (!title) {
      setFormError('Kitob nomini kiriting.');
      return;
    }
    const now = new Date().toISOString();
    const current = store.value.find((book) => book.id === editingId);
    const book: TrackedBook = {
      id: current?.id ?? crypto.randomUUID(),
      title,
      author: values.author.trim(),
      status: values.status,
      takeaways: values.takeaways.trim(),
      quotes: current?.quotes ?? [],
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    };
    const next = current ? store.value.map((item) => item.id === current.id ? book : item) : [book, ...store.value];
    if (store.save(next)) {
      setEditingId(null);
      setFormError('');
      form.reset(emptyBookForm);
      showNotice(current ? 'Kitob yangilandi.' : 'Kitob qo‘shildi.');
    }
  });

  const editBook = (book: TrackedBook) => {
    setEditingId(book.id);
    setFormError('');
    form.reset({ title: book.title, author: book.author, status: book.status, takeaways: book.takeaways });
    document.getElementById('book-composer')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const deleteBook = (book: TrackedBook) => {
    if (!window.confirm(`“${book.title}” kitobini javondan o‘chirishni xohlaysizmi?`)) return;
    if (store.save(store.value.filter((item) => item.id !== book.id))) showNotice('Kitob o‘chirildi.');
    if (editingId === book.id) {
      setEditingId(null);
      form.reset(emptyBookForm);
    }
  };

  const updateStatus = (bookId: string, status: BookStatus) => {
    if (store.save(store.value.map((book) => book.id === bookId ? { ...book, status, updatedAt: new Date().toISOString() } : book))) showNotice('Kitob holati yangilandi.');
  };

  const addQuote = (book: TrackedBook) => {
    const text = (quoteDrafts[book.id] ?? '').trim();
    if (!text) return;
    const quote: BookQuote = { id: crypto.randomUUID(), text, favorite: false, createdAt: new Date().toISOString() };
    const next = store.value.map((item) => item.id === book.id ? { ...item, updatedAt: new Date().toISOString(), quotes: [quote, ...item.quotes] } : item);
    if (store.save(next)) {
      setQuoteDrafts((current) => ({ ...current, [book.id]: '' }));
      showNotice('Iqtibos qo‘shildi.');
    }
  };

  const toggleQuote = (bookId: string, quoteId: string) => {
    const saved = store.save(store.value.map((book) => book.id === bookId ? {
      ...book,
      updatedAt: new Date().toISOString(),
      quotes: book.quotes.map((item) => item.id === quoteId ? { ...item, favorite: !item.favorite } : item),
    } : book));
    if (saved) showNotice('Iqtibos yangilandi.');
  };

  const deleteQuote = (bookId: string, quoteId: string) => {
    const saved = store.save(store.value.map((book) => book.id === bookId ? {
      ...book,
      updatedAt: new Date().toISOString(),
      quotes: book.quotes.filter((item) => item.id !== quoteId),
    } : book));
    if (saved) showNotice('Iqtibos o‘chirildi.');
  };

  const counts = useMemo(() => store.value.reduce<Record<BookStatus, number>>((total, book) => {
    total[book.status] += 1;
    return total;
  }, { reading: 0, finished: 0, wishlist: 0 }), [store.value]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(280px,.82fr)_minmax(0,1.18fr)]">
      <section id="book-composer" className="h-fit rounded-[24px] border border-card-border bg-card p-5 shadow-sm sm:p-6" data-testid="book-composer">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e7def0] text-[#5b3f69] dark:bg-[#3b3044] dark:text-[#d8bce2]"><BookOpen size={18} /></span>
          <div><p className="text-[12px] font-semibold text-[#8a5f7a]">O‘qiganlaringizni saqlab boring</p><h2 className="mt-1 font-serif text-[25px] leading-tight">{editingId ? 'Kitobni tahrirlash' : 'Kitob qo‘shish'}</h2></div>
        </div>
        <Form {...form}>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <div><label htmlFor="book-title" className="text-[13px] font-medium">Kitob nomi</label><input id="book-title" {...form.register('title')} maxLength={140} placeholder="Masalan, O‘tkan kunlar" className="mt-2 min-h-12 w-full rounded-xl border border-border bg-background px-3.5 text-[14px] outline-none placeholder:text-muted-foreground/65 focus:border-[#b89c5c]" data-testid="input-book-title" /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label htmlFor="book-author" className="text-[13px] font-medium">Muallif</label><input id="book-author" {...form.register('author')} maxLength={100} placeholder="Muallifini bilsangiz yozing" className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none placeholder:text-muted-foreground/65 focus:border-[#b89c5c]" data-testid="input-book-author" /></div>
              <div><label htmlFor="book-status" className="text-[13px] font-medium">Holati</label><select id="book-status" {...form.register('status')} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-[#b89c5c]" data-testid="select-book-status">{bookStatusOptions.map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}</select></div>
            </div>
            <div><label htmlFor="book-takeaways" className="text-[13px] font-medium">Esda qolgan fikrlar</label><textarea id="book-takeaways" {...form.register('takeaways')} rows={4} maxLength={3000} placeholder="Sizga yoqqan yoki foydali bo‘lgan fikrlarni yozing..." className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-3.5 py-3 text-[13px] leading-relaxed outline-none placeholder:text-muted-foreground/65 focus:border-[#b89c5c]" data-testid="input-book-takeaways" /></div>
            {(formError || store.error) && <p className="text-[13px] text-destructive" role="alert" data-testid="status-book-error">{formError || store.error}</p>}
            <div className="flex gap-2"><button type="submit" disabled={store.status !== 'ready'} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[14px] font-semibold text-primary-foreground disabled:opacity-50" data-testid="button-save-book"><Check size={17} />{editingId ? 'Saqlash' : 'Kitobni qo‘shish'}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setFormError(''); form.reset(emptyBookForm); }} className="grid size-11 place-items-center rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground" aria-label="Tahrirni bekor qilish" data-testid="button-cancel-book-edit"><X size={16} /></button>}</div>
          </form>
        </Form>
        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">{bookStatusOptions.map((status) => <div key={status} className="rounded-xl bg-muted/70 p-2.5"><span className="block font-serif text-[22px]">{counts[status]}</span><span className="text-[9px] text-muted-foreground">{statusLabels[status]}</span></div>)}</div>
        <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground">Kitoblar, xulosalar va iqtiboslar shu brauzerda saqlanadi.</p>
      </section>

      <section className="min-w-0" aria-label="Kitoblar javoni">
        <div className="rounded-[24px] border border-card-border bg-card p-4 shadow-sm sm:p-5">
          <label htmlFor="book-search" className="sr-only">Kitoblardan qidirish</label>
          <div className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-background px-3.5"><Search size={18} className="shrink-0 text-muted-foreground" /><input id="book-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Kitob yoki muallif nomini yozing..." className="min-w-0 flex-1 bg-transparent py-3 text-[13px] outline-none placeholder:text-muted-foreground/65" data-testid="input-book-search" /><span className="text-[12px] text-muted-foreground">{store.value.length}</span></div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" role="tablist" aria-label="Kitoblar holati">{statusFilters.map((value) => <button key={value} type="button" role="tab" aria-selected={filter === value} onClick={() => setFilter(value)} className={`min-h-11 rounded-xl px-3 py-2 text-[13px] font-medium ${filter === value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`} data-testid={`tab-book-${value}`}>{value === 'all' ? 'Barchasi' : statusLabels[value]}</button>)}</div>
        </div>
        {store.status === 'loading' ? <div className="mt-4 h-48 rounded-[22px] skeleton" aria-label="Kitoblar yuklanmoqda" /> : store.status === 'error' ? <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-[12px]" role="alert">{store.error}</div> : visibleBooks.length ? (
          <div className="mt-4 grid gap-4">
            {visibleBooks.map((book) => (
              <article key={book.id} className="rounded-[22px] border border-card-border bg-card p-5 shadow-sm sm:p-6" data-testid={`card-book-${book.id}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1"><p className="font-mono text-[9px] uppercase tracking-[.14em] text-[#8a5f7a]">{book.author || 'Muallif ko‘rsatilmagan'}</p><h3 className="mt-1 break-words font-serif text-[26px] leading-tight">{book.title}</h3>{book.takeaways && <div className="mt-4 rounded-xl bg-[#f7f0df] p-3.5 dark:bg-[#2d281f]"><p className="font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground">Asosiy xulosalar</p><p className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed">{book.takeaways}</p></div>}</div>
                   <div className="flex items-center gap-1.5"><select value={book.status} onChange={(event) => updateStatus(book.id, event.target.value as BookStatus)} aria-label={`${book.title} holati`} className="min-h-11 max-w-[150px] rounded-full border border-[#d8ccb0] bg-background px-3 text-[12px] outline-none focus:border-[#b89c5c]" data-testid={`select-book-status-${book.id}`}>{bookStatusOptions.map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}</select><button type="button" onClick={() => editBook(book)} className="grid size-11 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Kitobni tahrirlash" data-testid={`button-edit-book-${book.id}`}><Pencil size={17} /></button><button type="button" onClick={() => deleteBook(book)} className="grid size-11 place-items-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Kitobni o‘chirish" data-testid={`button-delete-book-${book.id}`}><Trash2 size={17} /></button></div>
                </div>
                <div className="mt-5 border-t border-border/70 pt-4">
                  <div className="flex items-center gap-2"><Quote size={14} className="text-[#9a6b23]" /><p className="font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground">Muhim iqtiboslar</p><span className="font-mono text-[9px] text-muted-foreground">{book.quotes.length}</span></div>
                   {book.quotes.length > 0 && <ul className="mt-3 space-y-2">{book.quotes.map((quote) => <li key={quote.id} className="flex items-start gap-2 rounded-xl bg-background/70 p-3" data-testid={`quote-${quote.id}`}><p className="min-w-0 flex-1 whitespace-pre-wrap py-2 text-[13px] italic leading-relaxed">“{quote.text}”</p><button type="button" onClick={() => toggleQuote(book.id, quote.id)} className={`grid size-11 shrink-0 place-items-center rounded-xl ${quote.favorite ? 'bg-[#f8e9bf] text-[#a66a13]' : 'text-muted-foreground hover:bg-muted'}`} aria-label={quote.favorite ? 'Iqtibosni sevimlilardan olish' : 'Iqtibosni sevimlilarga qo‘shish'} aria-pressed={quote.favorite} data-testid={`button-favorite-quote-${quote.id}`}><Star size={17} fill={quote.favorite ? 'currentColor' : 'none'} /></button><button type="button" onClick={() => deleteQuote(book.id, quote.id)} className="grid size-11 shrink-0 place-items-center rounded-xl text-muted-foreground hover:text-destructive" aria-label="Iqtibosni o‘chirish" data-testid={`button-delete-quote-${quote.id}`}><X size={17} /></button></li>)}</ul>}
                   <div className="mt-3 flex gap-2"><input value={quoteDrafts[book.id] ?? ''} onChange={(event) => setQuoteDrafts((current) => ({ ...current, [book.id]: event.target.value }))} maxLength={800} placeholder="Yodda qolgan jumlani yozing..." className="min-h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] outline-none placeholder:text-muted-foreground/65 focus:border-[#b89c5c]" aria-label="Yangi iqtibos" data-testid={`input-book-quote-${book.id}`} /><button type="button" onClick={() => addQuote(book)} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-[#eee8d5] px-4 py-2.5 text-[13px] font-semibold text-[#756d5e] hover:bg-[#e5d9bc] dark:bg-[#413a2b] dark:text-[#d2c6a9]" data-testid={`button-add-book-quote-${book.id}`}><Plus size={17} />Qo‘shish</button></div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-[22px] border border-dashed border-[#cfc3a5] bg-[#f7f0df] px-5 py-12 text-center dark:border-[#584c37] dark:bg-[#2b271f]"><BookOpen size={22} className="mx-auto text-[#8a5f7a]" /><h2 className="mt-3 font-serif text-[24px]">{store.value.length ? 'Mos kitob topilmadi.' : 'Kitob javoningiz bo‘sh.'}</h2><p className="mx-auto mt-2 max-w-sm text-[11px] leading-relaxed text-muted-foreground">{store.value.length ? 'Qidiruv yoki holat tanlovini o‘zgartiring.' : 'O‘qiyotgan, tugatgan yoki keyin o‘qimoqchi bo‘lgan kitobingizni qo‘shing.'}</p></div>
        )}
        {store.error && store.status === 'ready' && <p className="mt-3 text-[13px] text-destructive" role="alert" data-testid="status-books-storage-error">{store.error}</p>}
      </section>
      {notice && <FlashNotice message={notice} />}
    </div>
  );
}

export function BooksPage() {
  return (
    <UserStoragePage>
      {(userId) => (
        <ModulePageFrame eyebrow="O‘qish kundaligi" title="Kitoblar" description="O‘qiyotgan kitoblaringizni va esda qolgan fikrlarni saqlang." icon={<BookOpen size={22} strokeWidth={1.7} />}>
          <BookTracker key={userId} storageKey={userStorageKey('books', userId)} />
        </ModulePageFrame>
      )}
    </UserStoragePage>
  );
}