import { lazy, Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { formatContentDeleteConfirmation, getCurrentIntlLocale, useI18n } from '@/lib/i18n';
import { useForm } from 'react-hook-form';
import { BookOpen, Check, FilePlus2, Pencil, Plus, Quote, Search, Star, Trash2, X } from 'lucide-react';
import { Form } from '@/components/ui/form';
import { FlashNotice } from '@/components/diary-ui';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { ModulePageFrame, UserStoragePage } from '@/pages/local-module-pages';
import { useLocalModuleStorage } from '@/lib/local-module-storage';
import { deleteBookPdf, getBookPdf, getPdfPageCount, saveBookPdf, type StoredBookPdf } from '@/lib/book-pdf-storage';
import { EMPTY_BOOKS, isTrackedBookList, userStorageKey, type BookPdfAttachment, type BookQuote, type BookStatus, type TrackedBook } from '@/lib/local-life-data';
import type { AppLanguage } from '@/lib/i18n';

const BookPdfReader = lazy(() => import('./book-pdf-reader'));

type BookFormValues = { title: string; author: string; status: BookStatus; takeaways: string };
const emptyBookForm: BookFormValues = { title: '', author: '', status: 'reading', takeaways: '' };
const statusLabels: Record<BookStatus, string> = { reading: 'O‘qiyapman', finished: 'Tugatdim', wishlist: 'O‘qimoqchiman' };
const bookStatusOptions: BookStatus[] = ['reading', 'finished', 'wishlist'];
const statusFilters = ['all', 'reading', 'finished', 'wishlist', 'favorites'] as const;
type StatusFilter = (typeof statusFilters)[number];

const bookCopy = {
  uz: {
    all: 'Barchasi', favorites: 'Sevimlilar', favoriteAdd: 'Kitobni sevimlilarga qo‘shish', favoriteRemove: 'Kitobni sevimlilardan olish', favoriteSaved: 'Kitob sevimlilari yangilandi.',
    quoteFavoriteAdd: 'Iqtibosni sevimlilarga qo‘shish', quoteFavoriteRemove: 'Iqtibosni sevimlilardan olish', quoteSaved: 'Iqtibos yangilandi.',
    composerSubtitle: 'O‘qiganlaringizni saqlab boring', editing: 'Kitobni tahrirlash', adding: 'Kitob qo‘shish',
    titleRequired: 'Kitob nomini kiriting.', bookAdded: 'Kitob qo‘shildi.', bookUpdated: 'Kitob yangilandi.', bookDeleted: 'Kitob o‘chirildi.',
    save: 'Saqlash', addBook: 'Kitobni qo‘shish', cancelEdit: 'Tahrirni bekor qilish', pdfUploadLabel: 'PDF fayl (ixtiyoriy)',
    choosePdf: 'PDF faylini tanlang', removeSelectedPdf: 'Tanlangan faylni olib tashlash', pdfReplaceHint: 'Biriktirilgan: {name}. Yangi fayl bilan almashtiring.',
    pdfLocalNote: 'PDF fayllar faqat ushbu brauzerda, akkauntingiz uchun alohida saqlanadi; boshqa qurilmalarga sinxronlanmaydi va PDF mazmuni eksportga kiritilmaydi.',
    pdfInvalidType: 'Faqat .pdf formatidagi fayllarni tanlang.', pdfInvalidContent: 'Tanlangan fayl yaroqli PDF emas.',
    pdfSaveError: 'PDF saqlanmadi. Brauzer xotirasini tekshirib, qayta urinib ko‘ring.',
    pdfRollbackError: 'Kitob saqlanmadi va PDF faylini avvalgi holatiga tiklab bo‘lmadi.',
    pdfDeleteError: 'Kitob o‘chirildi, lekin uning PDF fayli brauzer xotirasida qolgan.',
    bookSaveError: 'Kitobni saqlab bo‘lmadi.', readPdf: 'O‘qish', pdfNoProgress: 'PDF biriktirilgan. O‘qishni boshlash uchun oching.',
    pdfProgress: '{page} / {total} sahifa • {percent}%', pdfPageCountPending: 'Sahifalar soni PDF birinchi marta ochilganda aniqlanadi.',
    pdfReaderDescription: 'Biriktirilgan kitob PDF faylini o‘qing va sahifa holatini saqlang.', pdfReaderLoading: 'PDF o‘quvchi yuklanmoqda…', bookSaving: 'Saqlanmoqda…',
  },
  en: {
    all: 'All', favorites: 'Favorites', favoriteAdd: 'Add book to favorites', favoriteRemove: 'Remove book from favorites', favoriteSaved: 'Book favorites updated.',
    quoteFavoriteAdd: 'Add quote to favorites', quoteFavoriteRemove: 'Remove quote from favorites', quoteSaved: 'Quote updated.',
    composerSubtitle: 'Keep track of what you read', editing: 'Edit book', adding: 'Add a book',
    titleRequired: 'Enter a book title.', bookAdded: 'Book added.', bookUpdated: 'Book updated.', bookDeleted: 'Book deleted.',
    save: 'Save', addBook: 'Add book', cancelEdit: 'Cancel editing', pdfUploadLabel: 'PDF file (optional)',
    choosePdf: 'Choose a PDF file', removeSelectedPdf: 'Remove selected file', pdfReplaceHint: 'Attached: {name}. Choose another file to replace it.',
    pdfLocalNote: 'PDF files stay in this browser, separated by account; they do not sync to other devices, and file contents are not included in exports.',
    pdfInvalidType: 'Choose a file with the .pdf extension.', pdfInvalidContent: 'The selected file is not a valid PDF.',
    pdfSaveError: 'The PDF could not be saved. Check browser storage and try again.',
    pdfRollbackError: 'The book was not saved, and its previous PDF could not be restored.',
    pdfDeleteError: 'The book was deleted, but its PDF remains in this browser storage.',
    bookSaveError: 'The book could not be saved.', readPdf: 'Read', pdfNoProgress: 'PDF attached. Open it to start reading.',
    pdfProgress: '{page} / {total} pages • {percent}%', pdfPageCountPending: 'The page count is detected when you first open the PDF.',
    pdfReaderDescription: 'Read the attached book PDF and keep your page progress.', pdfReaderLoading: 'Loading PDF reader…', bookSaving: 'Saving…',
  },
  ru: {
    all: 'Все', favorites: 'Избранное', favoriteAdd: 'Добавить книгу в избранное', favoriteRemove: 'Убрать книгу из избранного', favoriteSaved: 'Избранное книги обновлено.',
    quoteFavoriteAdd: 'Добавить цитату в избранное', quoteFavoriteRemove: 'Убрать цитату из избранного', quoteSaved: 'Цитата обновлена.',
    composerSubtitle: 'Сохраняйте прочитанные книги', editing: 'Редактировать книгу', adding: 'Добавить книгу',
    titleRequired: 'Введите название книги.', bookAdded: 'Книга добавлена.', bookUpdated: 'Книга обновлена.', bookDeleted: 'Книга удалена.',
    save: 'Сохранить', addBook: 'Добавить книгу', cancelEdit: 'Отменить редактирование', pdfUploadLabel: 'Файл PDF (необязательно)',
    choosePdf: 'Выберите файл PDF', removeSelectedPdf: 'Убрать выбранный файл', pdfReplaceHint: 'Прикреплён файл: {name}. Выберите другой, чтобы заменить его.',
    pdfLocalNote: 'PDF хранятся только в этом браузере отдельно для вашей учётной записи; они не синхронизируются, а содержимое файлов не входит в экспорт.',
    pdfInvalidType: 'Выберите файл с расширением .pdf.', pdfInvalidContent: 'Выбранный файл не является корректным PDF.',
    pdfSaveError: 'Не удалось сохранить PDF. Проверьте хранилище браузера и попробуйте снова.',
    pdfRollbackError: 'Книга не сохранена, а восстановить предыдущий PDF не удалось.',
    pdfDeleteError: 'Книга удалена, но её PDF остался в памяти этого браузера.',
    bookSaveError: 'Не удалось сохранить книгу.', readPdf: 'Читать', pdfNoProgress: 'PDF прикреплён. Откройте его, чтобы начать чтение.',
    pdfProgress: '{page} / {total} стр. • {percent}%', pdfPageCountPending: 'Число страниц определится при первом открытии PDF.',
    pdfReaderDescription: 'Читайте прикреплённый PDF и сохраняйте прогресс по страницам.', pdfReaderLoading: 'Загружаем просмотр PDF…', bookSaving: 'Сохраняем…',
  },
  ko: {
    all: '전체', favorites: '즐겨찾기', favoriteAdd: '책을 즐겨찾기에 추가', favoriteRemove: '책을 즐겨찾기에서 제거', favoriteSaved: '책 즐겨찾기가 업데이트되었습니다.',
    quoteFavoriteAdd: '인용문을 즐겨찾기에 추가', quoteFavoriteRemove: '인용문을 즐겨찾기에서 제거', quoteSaved: '인용문이 업데이트되었습니다.',
    composerSubtitle: '읽은 책을 기록하세요', editing: '책 편집', adding: '책 추가',
    titleRequired: '책 제목을 입력하세요.', bookAdded: '책을 추가했습니다.', bookUpdated: '책을 업데이트했습니다.', bookDeleted: '책을 삭제했습니다.',
    save: '저장', addBook: '책 추가', cancelEdit: '편집 취소', pdfUploadLabel: 'PDF 파일 (선택 사항)',
    choosePdf: 'PDF 파일 선택', removeSelectedPdf: '선택한 파일 제거', pdfReplaceHint: '첨부됨: {name}. 다른 파일을 선택하면 교체됩니다.',
    pdfLocalNote: 'PDF 파일은 이 브라우저에 계정별로 저장되며 다른 기기와 동기화되지 않고, 파일 내용은 내보내기에 포함되지 않습니다.',
    pdfInvalidType: '.pdf 확장자 파일만 선택하세요.', pdfInvalidContent: '선택한 파일은 올바른 PDF가 아닙니다.',
    pdfSaveError: 'PDF를 저장하지 못했습니다. 브라우저 저장 공간을 확인한 뒤 다시 시도하세요.',
    pdfRollbackError: '책을 저장하지 못했고 이전 PDF도 복원할 수 없습니다.',
    pdfDeleteError: '책을 삭제했지만 PDF 파일은 이 브라우저 저장 공간에 남아 있습니다.',
    bookSaveError: '책을 저장하지 못했습니다.', readPdf: '읽기', pdfNoProgress: 'PDF가 첨부되었습니다. 열어서 읽기를 시작하세요.',
    pdfProgress: '전체 {total}페이지 중 {page}페이지 • {percent}%', pdfPageCountPending: 'PDF를 처음 열 때 페이지 수가 확인됩니다.',
    pdfReaderDescription: '첨부한 책 PDF를 읽고 페이지 진행 상황을 저장하세요.', pdfReaderLoading: 'PDF 리더를 불러오는 중…', bookSaving: '저장 중…',
  },
} as const satisfies Record<AppLanguage, Record<string, string>>;

type BookPdfCardCopy = Pick<
  (typeof bookCopy)[AppLanguage],
  'readPdf' | 'pdfNoProgress' | 'pdfPageCountPending' | 'pdfProgress'
>;

function BookPdfAttachmentCard({
  book,
  copy,
  onRead,
}: {
  book: TrackedBook;
  copy: BookPdfCardCopy;
  onRead: () => void;
}) {
  const pdf = book.pdf;
  if (!pdf) return null;
  const percent = pdf.totalPages ? Math.round((pdf.lastReadPage / pdf.totalPages) * 100) : 0;
  const progress = pdf.totalPages
    ? copy.pdfProgress
      .replace('{page}', String(pdf.lastReadPage))
      .replace('{total}', String(pdf.totalPages))
      .replace('{percent}', String(percent))
    : '';

  return (
    <div className="mt-4 rounded-2xl border border-[#ded3bb] bg-[#fbf8f0] p-3.5 dark:border-[#584c37] dark:bg-[#2b271f]" data-testid={`panel-book-pdf-${book.id}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e7def0] text-[#5b3f69] dark:bg-[#3b3044] dark:text-[#d8bce2]"><BookOpen size={16} /></span>
        <div className="min-w-0 flex-1">
          <p className="break-all text-[11px] font-semibold" data-testid={`text-book-pdf-name-${book.id}`}>{pdf.fileName}</p>
          {pdf.totalPages ? (
            <>
              <p className="mt-1 text-[10px] text-muted-foreground" data-testid={`text-book-pdf-progress-${book.id}`}>{progress}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e7dece] dark:bg-[#453e32]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label={progress} data-testid={`progress-book-pdf-${book.id}`}>
                <div className="h-full rounded-full bg-[#8a5f7a] transition-[width]" style={{ width: `${percent}%` }} />
              </div>
            </>
          ) : <p className="mt-1 text-[10px] text-muted-foreground">{copy.pdfNoProgress} {copy.pdfPageCountPending}</p>}
        </div>
        <button type="button" onClick={onRead} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-[#30243f] px-3.5 py-2 text-[11px] font-semibold text-[#fffaf0] hover:bg-[#493954]" aria-label={`${copy.readPdf}: ${book.title}`} data-testid={`button-read-book-pdf-${book.id}`}><BookOpen size={15} />{copy.readPdf}</button>
      </div>
    </div>
  );
}

function BookTracker({ storageKey }: { storageKey: string }) {
  const { language } = useI18n();
  const copy = bookCopy[language];
  const store = useLocalModuleStorage(storageKey, EMPTY_BOOKS, isTrackedBookList, 'Kitoblar');
  const form = useForm<BookFormValues>({ defaultValues: emptyBookForm });
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [quoteDrafts, setQuoteDrafts] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [pdfError, setPdfError] = useState('');
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const [isSavingBook, setIsSavingBook] = useState(false);
  const [readingBookId, setReadingBookId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2400);
  };
  const visibleBooks = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(getCurrentIntlLocale());
    return [...store.value]
      .filter((book) => (filter === 'all' || filter === 'favorites'
        ? filter === 'all' || Boolean(book.favorite) || book.quotes.some((quote) => quote.favorite)
        : book.status === filter)
        && (!query || `${book.title} ${book.author} ${book.takeaways} ${book.pdf?.fileName ?? ''} ${book.quotes.map((item) => item.text).join(' ')}`.toLocaleLowerCase(getCurrentIntlLocale()).includes(query)))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [filter, search, store.value]);

  const submit = form.handleSubmit(async (values) => {
    const title = values.title.trim();
    if (!title) {
      setFormError(copy.titleRequired);
      return;
    }
    if (selectedPdf && !selectedPdf.name.toLocaleLowerCase().endsWith('.pdf')) {
      setPdfError(copy.pdfInvalidType);
      return;
    }
    setIsSavingBook(true);
    setFormError('');
    setPdfError('');
    let phase: 'validate' | 'storage' = 'validate';
    let pdfWasReplaced = false;
    let previousPdf: StoredBookPdf | undefined;
    let bookId = '';
    const restorePreviousPdf = async () => {
      try {
        if (previousPdf) await saveBookPdf(storageKey, previousPdf);
        else await deleteBookPdf(storageKey, bookId);
        return true;
      } catch {
        setPdfError(copy.pdfRollbackError);
        return false;
      }
    };
    try {
      const totalPages = selectedPdf ? await getPdfPageCount(selectedPdf) : undefined;
      phase = 'storage';
      const now = new Date().toISOString();
      const current = store.value.find((book) => book.id === editingId);
      bookId = current?.id ?? crypto.randomUUID();
      if (selectedPdf) {
        previousPdf = await getBookPdf(storageKey, bookId);
        await saveBookPdf(storageKey, {
          bookId,
          fileName: selectedPdf.name,
          fileSize: selectedPdf.size,
          lastModified: selectedPdf.lastModified,
          blob: selectedPdf,
        });
        pdfWasReplaced = true;
      }
      const pdf: BookPdfAttachment | undefined = selectedPdf
        ? {
          fileName: selectedPdf.name,
          fileSize: selectedPdf.size,
          lastReadPage: 1,
          totalPages: totalPages!,
          attachedAt: now,
        }
        : current?.pdf;
      const book: TrackedBook = {
        id: bookId,
        title,
        author: values.author.trim(),
        status: values.status,
        takeaways: values.takeaways.trim(),
        quotes: current?.quotes ?? [],
        favorite: current?.favorite,
        pdf,
        createdAt: current?.createdAt ?? now,
        updatedAt: now,
      };
      const next = current ? store.value.map((item) => item.id === current.id ? book : item) : [book, ...store.value];
      if (!store.save(next)) {
        if (pdfWasReplaced) await restorePreviousPdf();
        setFormError(store.error || copy.bookSaveError);
        return;
      }
      setEditingId(null);
      setFormError('');
      setPdfError('');
      setSelectedPdf(null);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
      form.reset(emptyBookForm);
      showNotice(current ? copy.bookUpdated : copy.bookAdded);
    } catch {
      if (pdfWasReplaced && !(await restorePreviousPdf())) {
        setFormError('');
        return;
      }
      if (selectedPdf) setPdfError(phase === 'validate' ? copy.pdfInvalidContent : copy.pdfSaveError);
      else setFormError(copy.bookSaveError);
    } finally {
      setIsSavingBook(false);
    }
  });

  const editBook = (book: TrackedBook) => {
    setEditingId(book.id);
    setFormError('');
    setPdfError('');
    setSelectedPdf(null);
    if (pdfInputRef.current) pdfInputRef.current.value = '';
    form.reset({ title: book.title, author: book.author, status: book.status, takeaways: book.takeaways });
    document.getElementById('book-composer')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const deleteBook = (book: TrackedBook) => {
    if (!window.confirm(formatContentDeleteConfirmation(book.title, 'book'))) return;
    if (store.save(store.value.filter((item) => item.id !== book.id))) {
      showNotice(copy.bookDeleted);
      if (book.pdf) {
        void deleteBookPdf(storageKey, book.id).catch(() => showNotice(copy.pdfDeleteError));
      }
    }
    if (editingId === book.id) {
      setEditingId(null);
      setSelectedPdf(null);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
      form.reset(emptyBookForm);
    }
    if (readingBookId === book.id) setReadingBookId(null);
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
    if (saved) showNotice(copy.quoteSaved);
  };

  const toggleBookFavorite = (bookId: string) => {
    const saved = store.save(store.value.map((book) => book.id === bookId
      ? { ...book, favorite: !book.favorite, updatedAt: new Date().toISOString() }
      : book));
    if (saved) showNotice(copy.favoriteSaved);
  };

  const deleteQuote = (bookId: string, quoteId: string) => {
    const saved = store.save(store.value.map((book) => book.id === bookId ? {
      ...book,
      updatedAt: new Date().toISOString(),
      quotes: book.quotes.filter((item) => item.id !== quoteId),
    } : book));
    if (saved) showNotice('Iqtibos o‘chirildi.');
  };

  const updateReadingProgress = useCallback((bookId: string, page: number, totalPages: number) => {
    const current = store.value.find((book) => book.id === bookId);
    if (!current?.pdf) return false;
    const lastReadPage = Math.min(totalPages, Math.max(1, page));
    return store.save(store.value.map((book) => book.id === bookId && book.pdf
      ? { ...book, pdf: { ...book.pdf, lastReadPage, totalPages } }
      : book));
  }, [store.save, store.value]);

  const counts = useMemo(() => store.value.reduce<Record<BookStatus, number>>((total, book) => {
    total[book.status] += 1;
    return total;
  }, { reading: 0, finished: 0, wishlist: 0 }), [store.value]);
  const editingBook = store.value.find((book) => book.id === editingId);
  const activeReaderBook = store.value.find((book) => book.id === readingBookId && book.pdf);

  return (
    <>
    <div className="grid gap-6 xl:grid-cols-[minmax(280px,.82fr)_minmax(0,1.18fr)]">
      <section id="book-composer" className="h-fit rounded-[24px] border border-card-border bg-card p-5 shadow-sm sm:p-6" data-testid="book-composer">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e7def0] text-[#5b3f69] dark:bg-[#3b3044] dark:text-[#d8bce2]"><BookOpen size={18} /></span>
          <div><p className="text-[12px] font-semibold text-[#8a5f7a]">{copy.composerSubtitle}</p><h2 className="mt-1 font-serif text-[25px] leading-tight">{editingId ? copy.editing : copy.adding}</h2></div>
        </div>
        <Form {...form}>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <div><label htmlFor="book-title" className="text-[13px] font-medium">Kitob nomi</label><input id="book-title" {...form.register('title')} maxLength={140} placeholder="Masalan, O‘tkan kunlar" className="mt-2 min-h-12 w-full rounded-xl border border-border bg-background px-3.5 text-[14px] outline-none placeholder:text-muted-foreground/65 focus:border-[#b89c5c]" data-testid="input-book-title" /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label htmlFor="book-author" className="text-[13px] font-medium">Muallif</label><input id="book-author" {...form.register('author')} maxLength={100} placeholder="Muallifini bilsangiz yozing" className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none placeholder:text-muted-foreground/65 focus:border-[#b89c5c]" data-testid="input-book-author" /></div>
              <div><label htmlFor="book-status" className="text-[13px] font-medium">Holati</label><select id="book-status" {...form.register('status')} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-[#b89c5c]" data-testid="select-book-status">{bookStatusOptions.map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}</select></div>
            </div>
            <div><label htmlFor="book-takeaways" className="text-[13px] font-medium">Esda qolgan fikrlar</label><textarea id="book-takeaways" {...form.register('takeaways')} rows={4} maxLength={3000} placeholder="Sizga yoqqan yoki foydali bo‘lgan fikrlarni yozing..." className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-3.5 py-3 text-[13px] leading-relaxed outline-none placeholder:text-muted-foreground/65 focus:border-[#b89c5c]" data-testid="input-book-takeaways" /></div>
            <div className="rounded-2xl border border-dashed border-[#cfc3a5] bg-[#fbf8f0] p-3.5 dark:border-[#584c37] dark:bg-[#2b271f]">
              <label htmlFor="book-pdf-file" className="inline-flex items-center gap-2 text-[12px] font-semibold"><FilePlus2 size={15} className="text-[#8a5f7a]" />{copy.pdfUploadLabel}</label>
              <input
                ref={pdfInputRef}
                id="book-pdf-file"
                type="file"
                accept=".pdf,application/pdf"
                disabled={isSavingBook}
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0] ?? null;
                  setPdfError('');
                  if (file && !file.name.toLocaleLowerCase().endsWith('.pdf')) {
                    setPdfError(copy.pdfInvalidType);
                    event.currentTarget.value = '';
                    setSelectedPdf(null);
                    return;
                  }
                  setSelectedPdf(file);
                }}
                className="mt-2 block min-h-11 w-full cursor-pointer rounded-xl border border-border bg-background text-[12px] file:mr-3 file:min-h-11 file:cursor-pointer file:border-0 file:bg-muted file:px-3 file:font-medium"
                data-testid="input-book-pdf"
              />
              {selectedPdf && <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-background px-3 py-2 text-[11px]" data-testid="status-selected-book-pdf"><span className="min-w-0 break-all">{selectedPdf.name}</span><button type="button" disabled={isSavingBook} onClick={() => { setSelectedPdf(null); if (pdfInputRef.current) pdfInputRef.current.value = ''; }} className="shrink-0 rounded-lg px-2 py-1 font-semibold text-muted-foreground hover:bg-muted hover:text-foreground" data-testid="button-remove-selected-book-pdf">{copy.removeSelectedPdf}</button></div>}
              {!selectedPdf && editingBook?.pdf && <p className="mt-2 break-words text-[11px] text-muted-foreground">{copy.pdfReplaceHint.replace('{name}', editingBook.pdf.fileName)}</p>}
              <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">{copy.pdfLocalNote}</p>
            </div>
            {pdfError && <p className="text-[13px] text-destructive" role="alert" data-testid="status-book-pdf-error">{pdfError}</p>}
            {(formError || store.error) && <p className="text-[13px] text-destructive" role="alert" data-testid="status-book-error">{formError || store.error}</p>}
            <div className="flex gap-2"><button type="submit" disabled={store.status !== 'ready' || isSavingBook} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[14px] font-semibold text-primary-foreground disabled:opacity-50" data-testid="button-save-book"><Check size={17} />{isSavingBook ? copy.bookSaving : editingId ? copy.save : copy.addBook}</button>{editingId && <button type="button" disabled={isSavingBook} onClick={() => { setEditingId(null); setFormError(''); setPdfError(''); setSelectedPdf(null); if (pdfInputRef.current) pdfInputRef.current.value = ''; form.reset(emptyBookForm); }} className="grid size-11 place-items-center rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground" aria-label={copy.cancelEdit} data-testid="button-cancel-book-edit"><X size={16} /></button>}</div>
          </form>
        </Form>
        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">{bookStatusOptions.map((status) => <div key={status} className="rounded-xl bg-muted/70 p-2.5"><span className="block font-serif text-[22px]">{counts[status]}</span><span className="text-[9px] text-muted-foreground">{statusLabels[status]}</span></div>)}</div>
      </section>

      <section className="min-w-0" aria-label="Kitoblar javoni">
        <div className="rounded-[24px] border border-card-border bg-card p-4 shadow-sm sm:p-5">
          <label htmlFor="book-search" className="sr-only">Kitoblardan qidirish</label>
          <div className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-background px-3.5"><Search size={18} className="shrink-0 text-muted-foreground" /><input id="book-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Kitob yoki muallif nomini yozing..." className="min-w-0 flex-1 bg-transparent py-3 text-[13px] outline-none placeholder:text-muted-foreground/65" data-testid="input-book-search" /><span className="text-[12px] text-muted-foreground">{store.value.length}</span></div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" role="tablist" aria-label="Kitoblar holati">{statusFilters.map((value) => <button key={value} type="button" role="tab" aria-selected={filter === value} onClick={() => setFilter(value)} className={`min-h-11 rounded-xl px-3 py-2 text-[13px] font-medium ${filter === value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`} data-testid={`tab-book-${value}`}>{value === 'all' ? copy.all : value === 'favorites' ? copy.favorites : statusLabels[value]}</button>)}</div>
        </div>
        {store.status === 'loading' ? <div className="mt-4 h-48 rounded-[22px] skeleton" aria-label="Kitoblar yuklanmoqda" /> : store.status === 'error' ? <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-[12px]" role="alert">{store.error}</div> : visibleBooks.length ? (
          <div className="mt-4 grid gap-4">
            {visibleBooks.map((book) => (
              <article key={book.id} className="rounded-[22px] border border-card-border bg-card p-5 shadow-sm sm:p-6" data-testid={`card-book-${book.id}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[9px] uppercase tracking-[.14em] text-[#8a5f7a]">{book.author || 'Muallif ko‘rsatilmagan'}</p>
                    <h3 className="mt-1 break-words font-serif text-[26px] leading-tight">{book.title}</h3>
                    {book.takeaways && <div className="mt-4 rounded-xl bg-[#f7f0df] p-3.5 dark:bg-[#2d281f]"><p className="font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground">Asosiy xulosalar</p><p className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed">{book.takeaways}</p></div>}
                    <BookPdfAttachmentCard book={book} copy={copy} onRead={() => setReadingBookId(book.id)} />
                  </div>
                    <div className="flex items-center gap-1.5"><select value={book.status} onChange={(event) => updateStatus(book.id, event.target.value as BookStatus)} aria-label={`${book.title} holati`} className="min-h-11 max-w-[150px] rounded-full border border-[#d8ccb0] bg-background px-3 text-[12px] outline-none focus:border-[#b89c5c]" data-testid={`select-book-status-${book.id}`}>{bookStatusOptions.map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}</select><button type="button" onClick={() => toggleBookFavorite(book.id)} className={`grid size-11 place-items-center rounded-xl ${book.favorite ? 'bg-[#f8e9bf] text-[#a66a13]' : 'text-muted-foreground hover:bg-muted'}`} aria-label={book.favorite ? copy.favoriteRemove : copy.favoriteAdd} aria-pressed={book.favorite === true} data-testid={`button-favorite-book-${book.id}`}><Star size={17} fill={book.favorite ? 'currentColor' : 'none'} /></button><button type="button" onClick={() => editBook(book)} className="grid size-11 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Kitobni tahrirlash" data-testid={`button-edit-book-${book.id}`}><Pencil size={17} /></button><button type="button" onClick={() => deleteBook(book)} className="grid size-11 place-items-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Kitobni o‘chirish" data-testid={`button-delete-book-${book.id}`}><Trash2 size={17} /></button></div>
                </div>
                <div className="mt-5 border-t border-border/70 pt-4">
                  <div className="flex items-center gap-2"><Quote size={14} className="text-[#9a6b23]" /><p className="font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground">Muhim iqtiboslar</p><span className="font-mono text-[9px] text-muted-foreground">{book.quotes.length}</span></div>
                    {book.quotes.length > 0 && <ul className="mt-3 space-y-2">{book.quotes.map((quote) => <li key={quote.id} className="flex items-start gap-2 rounded-xl bg-background/70 p-3" data-testid={`quote-${quote.id}`}><p className="min-w-0 flex-1 whitespace-pre-wrap py-2 text-[13px] italic leading-relaxed">“{quote.text}”</p><button type="button" onClick={() => toggleQuote(book.id, quote.id)} className={`grid size-11 shrink-0 place-items-center rounded-xl ${quote.favorite ? 'bg-[#f8e9bf] text-[#a66a13]' : 'text-muted-foreground hover:bg-muted'}`} aria-label={quote.favorite ? copy.quoteFavoriteRemove : copy.quoteFavoriteAdd} aria-pressed={quote.favorite} data-testid={`button-favorite-quote-${quote.id}`}><Star size={17} fill={quote.favorite ? 'currentColor' : 'none'} /></button><button type="button" onClick={() => deleteQuote(book.id, quote.id)} className="grid size-11 shrink-0 place-items-center rounded-xl text-muted-foreground hover:text-destructive" aria-label="Iqtibosni o‘chirish" data-testid={`button-delete-quote-${quote.id}`}><X size={17} /></button></li>)}</ul>}
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
    <Dialog open={Boolean(activeReaderBook)} onOpenChange={(open) => { if (!open) setReadingBookId(null); }}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-6xl max-h-[96vh] overflow-hidden border-card-border bg-transparent p-0 [&>button]:hidden" data-testid="dialog-book-pdf-reader">
        {activeReaderBook && (
          <>
            <DialogTitle className="sr-only">{activeReaderBook.title}</DialogTitle>
            <DialogDescription className="sr-only">{copy.pdfReaderDescription}</DialogDescription>
            <Suspense fallback={<div className="flex h-[75vh] items-center justify-center rounded-2xl bg-card text-[13px] text-muted-foreground" role="status" data-testid="status-book-pdf-reader-loading">{copy.pdfReaderLoading}</div>}>
              <BookPdfReader
                key={activeReaderBook.id}
                storageKey={storageKey}
                bookId={activeReaderBook.id}
                bookTitle={activeReaderBook.title}
                fileName={activeReaderBook.pdf?.fileName ?? ''}
                language={language}
                initialPage={activeReaderBook.pdf?.lastReadPage ?? 1}
                onProgressChange={(page, totalPages) => updateReadingProgress(activeReaderBook.id, page, totalPages)}
                onClose={() => setReadingBookId(null)}
              />
            </Suspense>
          </>
        )}
      </DialogContent>
    </Dialog>
    </>
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