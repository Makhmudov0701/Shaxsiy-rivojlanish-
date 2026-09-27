import { useEffect, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
} from 'lucide-react';
import { getBookPdf, type StoredBookPdf } from '@/lib/book-pdf-storage';
import type { AppLanguage } from '@/lib/i18n';
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy, type RenderTask } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

type ReaderCopy = {
  reader: string;
  loadingFile: string;
  loadingDocument: string;
  rendering: string;
  missingFile: string;
  readError: string;
  page: string;
  pageOf: string;
  goToPage: string;
  previous: string;
  next: string;
  zoomOut: string;
  zoomIn: string;
  zoom: string;
  fullscreen: string;
  exitFullscreen: string;
  download: string;
  openExternal: string;
  progress: string;
  progressSaveError: string;
  close: string;
};

const READER_COPY: Record<AppLanguage, ReaderCopy> = {
  uz: {
    reader: 'PDF o‘quvchi',
    loadingFile: 'PDF fayl ochilmoqda…',
    loadingDocument: 'Sahifalar yuklanmoqda…',
    rendering: 'Sahifa tayyorlanmoqda…',
    missingFile: 'PDF fayli bu brauzer xotirasida topilmadi. Kitobni tahrirlab, faylni qayta biriktiring.',
    readError: 'PDF ochilmadi. Faylni tashqi o‘quvchida ochish yoki yuklab olishga urinib ko‘ring.',
    page: 'Sahifa',
    pageOf: 'dan',
    goToPage: 'Sahifaga o‘tish',
    previous: 'Oldingi sahifa',
    next: 'Keyingi sahifa',
    zoomOut: 'Kichraytirish',
    zoomIn: 'Kattalashtirish',
    zoom: 'Masshtab',
    fullscreen: 'To‘liq ekran',
    exitFullscreen: 'To‘liq ekrandan chiqish',
    download: 'PDF yuklab olish',
    openExternal: 'Tashqi o‘quvchida ochish',
    progress: '{page} / {total} sahifa • {percent}%',
    progressSaveError: 'O‘qish holatini saqlab bo‘lmadi.',
    close: 'O‘quvchini yopish',
  },
  en: {
    reader: 'PDF reader',
    loadingFile: 'Opening PDF file…',
    loadingDocument: 'Loading pages…',
    rendering: 'Preparing page…',
    missingFile: 'The PDF is not available in this browser storage. Edit the book and attach the file again.',
    readError: 'The PDF could not be rendered. Try opening it externally or downloading it.',
    page: 'Page',
    pageOf: 'of',
    goToPage: 'Go to page',
    previous: 'Previous page',
    next: 'Next page',
    zoomOut: 'Zoom out',
    zoomIn: 'Zoom in',
    zoom: 'Zoom',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit fullscreen',
    download: 'Download PDF',
    openExternal: 'Open in external reader',
    progress: '{page} / {total} pages • {percent}%',
    progressSaveError: 'Reading progress could not be saved.',
    close: 'Close reader',
  },
  ru: {
    reader: 'Просмотр PDF',
    loadingFile: 'Открываем PDF…',
    loadingDocument: 'Загружаем страницы…',
    rendering: 'Подготавливаем страницу…',
    missingFile: 'PDF не найден в памяти этого браузера. Отредактируйте книгу и прикрепите файл снова.',
    readError: 'Не удалось отобразить PDF. Попробуйте открыть его во внешней программе или скачать.',
    page: 'Страница',
    pageOf: 'из',
    goToPage: 'Перейти к странице',
    previous: 'Предыдущая страница',
    next: 'Следующая страница',
    zoomOut: 'Уменьшить',
    zoomIn: 'Увеличить',
    zoom: 'Масштаб',
    fullscreen: 'Полный экран',
    exitFullscreen: 'Выйти из полноэкранного режима',
    download: 'Скачать PDF',
    openExternal: 'Открыть во внешней программе',
    progress: '{page} / {total} стр. • {percent}%',
    progressSaveError: 'Не удалось сохранить прогресс чтения.',
    close: 'Закрыть просмотр',
  },
  ko: {
    reader: 'PDF 리더',
    loadingFile: 'PDF 파일을 여는 중…',
    loadingDocument: '페이지를 불러오는 중…',
    rendering: '페이지를 준비하는 중…',
    missingFile: '이 브라우저 저장 공간에서 PDF를 찾을 수 없습니다. 책을 편집해 파일을 다시 첨부하세요.',
    readError: 'PDF를 표시할 수 없습니다. 외부 리더에서 열거나 다운로드해 보세요.',
    page: '페이지',
    pageOf: '/',
    goToPage: '페이지로 이동',
    previous: '이전 페이지',
    next: '다음 페이지',
    zoomOut: '축소',
    zoomIn: '확대',
    zoom: '배율',
    fullscreen: '전체 화면',
    exitFullscreen: '전체 화면 종료',
    download: 'PDF 다운로드',
    openExternal: '외부 리더에서 열기',
    progress: '{total}페이지 중 {page}페이지 • {percent}%',
    progressSaveError: '읽기 진행 상황을 저장하지 못했습니다.',
    close: '리더 닫기',
  },
};

type BookPdfReaderProps = {
  storageKey: string;
  bookId: string;
  bookTitle: string;
  fileName: string;
  language: AppLanguage;
  initialPage: number;
  onProgressChange: (page: number, totalPages: number) => boolean;
  onClose: () => void;
};

export default function BookPdfReader({
  storageKey,
  bookId,
  bookTitle,
  fileName,
  language,
  initialPage,
  onProgressChange,
  onClose,
}: BookPdfReaderProps) {
  const copy = READER_COPY[language];
  const [pdfRecord, setPdfRecord] = useState<StoredBookPdf | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [fileState, setFileState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [pageError, setPageError] = useState('');
  const [currentPage, setCurrentPage] = useState(Math.max(1, initialPage));
  const [pageDraft, setPageDraft] = useState(String(Math.max(1, initialPage)));
  const [totalPages, setTotalPages] = useState(0);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [rendering, setRendering] = useState(false);
  const [progressError, setProgressError] = useState(false);
  const [cssFullscreen, setCssFullscreen] = useState(false);
  const [availableWidth, setAvailableWidth] = useState(0);
  const readerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocumentRef = useRef<PDFDocumentProxy | null>(null);
  const initialPageRef = useRef(initialPage);
  const onProgressChangeRef = useRef(onProgressChange);
  const copyRef = useRef(copy);

  useEffect(() => {
    onProgressChangeRef.current = onProgressChange;
  }, [onProgressChange]);

  useEffect(() => {
    copyRef.current = copy;
  }, [copy]);
  useEffect(() => {
    let active = true;
    let createdUrl = '';
    setFileState('loading');
    getBookPdf(storageKey, bookId)
      .then((record) => {
        if (!active) return;
        if (!record) {
          setFileState('missing');
          return;
        }
        createdUrl = URL.createObjectURL(record.blob);
        setPdfRecord(record);
        setFileUrl(createdUrl);
        setFileState('ready');
      })
      .catch(() => {
        if (active) setFileState('error');
      });
    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [bookId, storageKey]);

  useEffect(() => {
    if (!pdfRecord) return undefined;
    let cancelled = false;
    let loadingTask: ReturnType<typeof getDocument> | null = null;
    pdfDocumentRef.current = null;
    setDocumentLoading(true);
    setPageError('');
    const loadPdf = async () => {
      try {
        const arrayBuffer = await pdfRecord.blob.arrayBuffer();
        if (cancelled) return;
        const bytes = new Uint8Array(arrayBuffer);
        loadingTask = getDocument({ data: bytes });
        const document = await loadingTask.promise;
        if (cancelled) {
          void document.destroy();
          return;
        }
        pdfDocumentRef.current = document;
        setPdfDocument(document);
        setTotalPages(document.numPages);
        const page = Math.min(document.numPages, Math.max(1, initialPageRef.current));
        setCurrentPage(page);
        setPageDraft(String(page));
        if (!onProgressChangeRef.current(page, document.numPages)) setProgressError(true);
        else setProgressError(false);
      } catch {
        if (!cancelled) setPageError(copyRef.current.readError);
      } finally {
        if (!cancelled) setDocumentLoading(false);
      }
    };
    void loadPdf();
    return () => {
      cancelled = true;
      if (loadingTask) {
        void loadingTask.destroy();
      } else if (pdfDocumentRef.current) {
        void pdfDocumentRef.current.destroy();
      }
      pdfDocumentRef.current = null;
    };
  }, [pdfRecord]);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setAvailableWidth(entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = readerRef.current;
    if (!node) return undefined;
    const syncFullscreen = () => {
      setCssFullscreen(document.fullscreenElement === node);
    };
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, []);

  useEffect(() => {
    if (!pdfDocument || !canvasRef.current) return undefined;
    let cancelled = false;
    let renderTask: RenderTask | null = null;
    setRendering(true);
    setPageError('');
    const renderPage = async () => {
      try {
        const page = await pdfDocument.getPage(currentPage);
        if (cancelled || !canvasRef.current) return;
        const baseViewport = page.getViewport({ scale: 1 });
        const fit = Math.min(1, Math.max(0.2, ((availableWidth || 720) - 28) / baseViewport.width));
        const viewport = page.getViewport({ scale: fit * (zoomPercent / 100) });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('canvas-context-unavailable');
        const pixelRatio = Math.max(1, window.devicePixelRatio || 1);
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        renderTask = page.render({
          canvasContext: context,
          viewport,
          transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
        });
        await renderTask.promise;
      } catch (error) {
        if (cancelled || (error instanceof Error && error.name === 'RenderingCancelledException')) return;
        setPageError(copy.readError);
      } finally {
        if (!cancelled) setRendering(false);
      }
    };
    void renderPage();
    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [availableWidth, copy.readError, currentPage, pdfDocument, zoomPercent]);

  const saveProgress = (page: number, pageTotal: number) => {
    const saved = onProgressChange(page, pageTotal);
    setProgressError(!saved);
    return saved;
  };

  const goToPage = (requestedPage: number) => {
    if (!totalPages || !Number.isFinite(requestedPage)) {
      setPageDraft(String(currentPage));
      return;
    }
    const page = Math.min(totalPages, Math.max(1, Math.round(requestedPage)));
    setCurrentPage(page);
    setPageDraft(String(page));
    saveProgress(page, totalPages);
  };

  const changeZoom = (amount: number) => {
    setZoomPercent((current) => Math.min(250, Math.max(50, current + amount)));
  };

  const toggleFullscreen = async () => {
    const node = readerRef.current;
    if (!node) return;
    if (document.fullscreenElement === node) {
      try {
        await document.exitFullscreen();
      } catch {
        setCssFullscreen(false);
      }
      return;
    }
    try {
      if (!node.requestFullscreen) throw new Error('fullscreen-unavailable');
      await node.requestFullscreen();
    } catch {
      setCssFullscreen((current) => !current);
    }
  };

  const progressText = totalPages
    ? copy.progress
      .replace('{page}', String(currentPage))
      .replace('{total}', String(totalPages))
      .replace('{percent}', String(Math.round((currentPage / totalPages) * 100)))
    : '';

  return (
    <div
      ref={readerRef}
      className={`flex h-[88vh] max-h-[880px] min-h-[320px] flex-col bg-[#faf7f0] text-[#30243f] dark:bg-[#211e24] dark:text-foreground ${cssFullscreen ? 'fixed inset-0 z-[60] h-screen max-h-none rounded-none' : ''}`}
      data-testid={`dialog-pdf-reader-${bookId}`}
    >
      <header className="flex flex-col gap-3 border-b border-[#e2dac8] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-border">
        <div className="min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-[.14em] text-[#8a5f7a]">{copy.reader}</p>
          <h2 className="mt-1 truncate font-serif text-[22px] font-normal leading-tight sm:text-[26px]">{bookTitle}</h2>
          <p className="mt-1 truncate text-[11px] text-muted-foreground">{pdfRecord?.fileName ?? fileName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {fileUrl && (
            <>
              <a
                href={fileUrl}
                download={pdfRecord?.fileName ?? fileName}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-[11px] font-semibold hover:bg-muted"
                data-testid={`button-download-book-pdf-${bookId}`}
              >
                <ArrowDownToLine size={15} />{copy.download}
              </a>
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#30243f] px-3 py-2 text-[11px] font-semibold text-[#fffaf0] hover:bg-[#493954]"
                data-testid={`link-open-book-pdf-${bookId}`}
              >
                <ExternalLink size={15} />{copy.openExternal}
              </a>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b border-[#e2dac8] px-3 py-2.5 sm:px-5 dark:border-border">
        <button
          type="button"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1 || !totalPages}
          aria-label={copy.previous}
          className="grid size-10 place-items-center rounded-xl border border-border bg-background hover:bg-muted disabled:opacity-40"
          data-testid={`button-pdf-previous-${bookId}`}
        ><ChevronLeft size={18} /></button>
        <label className="sr-only" htmlFor={`pdf-page-${bookId}`}>{copy.goToPage}</label>
        <input
          id={`pdf-page-${bookId}`}
          type="number"
          min={1}
          max={totalPages || undefined}
          value={pageDraft}
          onChange={(event) => setPageDraft(event.target.value)}
          onBlur={() => goToPage(Number(pageDraft))}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
          aria-label={copy.goToPage}
          disabled={!totalPages}
          className="h-10 w-[68px] rounded-xl border border-border bg-background px-2 text-center text-[12px] outline-none focus:border-[#b89c5c] disabled:opacity-50"
          data-testid={`input-pdf-page-${bookId}`}
        />
        <span className="text-[11px] text-muted-foreground">{copy.pageOf} {totalPages || '—'}</span>
        <button
          type="button"
          onClick={() => goToPage(currentPage + 1)}
          disabled={!totalPages || currentPage >= totalPages}
          aria-label={copy.next}
          className="grid size-10 place-items-center rounded-xl border border-border bg-background hover:bg-muted disabled:opacity-40"
          data-testid={`button-pdf-next-${bookId}`}
        ><ChevronRight size={18} /></button>

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => changeZoom(-10)}
            disabled={zoomPercent <= 50}
            aria-label={copy.zoomOut}
            className="grid size-10 place-items-center rounded-xl border border-border bg-background hover:bg-muted disabled:opacity-40"
            data-testid={`button-pdf-zoom-out-${bookId}`}
          ><Minus size={16} /></button>
          <span className="min-w-[52px] text-center font-mono text-[10px]" aria-label={copy.zoom} data-testid={`text-pdf-zoom-${bookId}`}>{zoomPercent}%</span>
          <button
            type="button"
            onClick={() => changeZoom(10)}
            disabled={zoomPercent >= 250}
            aria-label={copy.zoomIn}
            className="grid size-10 place-items-center rounded-xl border border-border bg-background hover:bg-muted disabled:opacity-40"
            data-testid={`button-pdf-zoom-in-${bookId}`}
          ><Plus size={16} /></button>
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            aria-label={cssFullscreen ? copy.exitFullscreen : copy.fullscreen}
            className="grid size-10 place-items-center rounded-xl border border-border bg-background hover:bg-muted"
            data-testid={`button-pdf-fullscreen-${bookId}`}
          >{cssFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            className="grid size-10 place-items-center rounded-xl border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            data-testid={`button-close-pdf-reader-${bookId}`}
          >×</button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {totalPages > 0 && (
          <div className="flex min-h-8 items-center justify-between gap-2 px-4 text-[10px] text-muted-foreground sm:px-6" data-testid={`text-pdf-reading-progress-${bookId}`}>
            <span>{progressText}</span>
            {progressError && <span role="alert" className="text-destructive">{copy.progressSaveError}</span>}
          </div>
        )}
        {pageError && (
          <div className="mx-4 my-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-[12px] text-destructive" role="alert" data-testid={`status-pdf-reader-error-${bookId}`}>
            {pageError}
          </div>
        )}
        {(fileState === 'loading' || documentLoading) && (
          <div className="flex flex-1 items-center justify-center text-[13px] text-muted-foreground" role="status" data-testid={`status-pdf-reader-loading-${bookId}`}>
            {fileState === 'loading' ? copy.loadingFile : copy.loadingDocument}
          </div>
        )}
        {(fileState === 'missing' || fileState === 'error') && (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="max-w-md rounded-2xl border border-[#ded3bb] bg-card p-5 text-center">
              <p className="text-[13px] leading-relaxed" role="alert" data-testid={`status-pdf-reader-missing-${bookId}`}>{copy.missingFile}</p>
              <button type="button" onClick={onClose} className="mt-4 min-h-11 rounded-xl bg-[#30243f] px-4 text-[12px] font-semibold text-[#fffaf0]" data-testid={`button-close-missing-pdf-${bookId}`}>{copy.close}</button>
            </div>
          </div>
        )}
        <div
          ref={viewportRef}
          className="relative flex min-h-0 flex-1 items-start justify-center overflow-auto bg-[#ebe5d9] p-3 sm:p-6 dark:bg-[#302c31]"
          data-testid={`viewport-pdf-reader-${bookId}`}
        >
          {pdfDocument && !pageError && <canvas ref={canvasRef} aria-label={`${copy.page} ${currentPage} ${copy.pageOf} ${totalPages}`} className="block bg-white shadow-md" data-testid={`canvas-pdf-page-${bookId}`} />}
          {rendering && pdfDocument && (
            <span className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-card/90 px-3 py-1.5 text-[10px] text-muted-foreground shadow" role="status" data-testid={`status-pdf-rendering-${bookId}`}>{copy.rendering}</span>
          )}
        </div>
      </div>
    </div>
  );
}