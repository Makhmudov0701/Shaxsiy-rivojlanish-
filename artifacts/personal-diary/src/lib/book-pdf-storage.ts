export type StoredBookPdf = {
  bookId: string;
  fileName: string;
  fileSize: number;
  lastModified: number;
  blob: Blob;
};

const STORE_NAME = 'book-pdfs';
const DATABASE_VERSION = 1;

export async function getPdfPageCount(file: File): Promise<number> {
  const [{ GlobalWorkerOptions, getDocument }, worker] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  GlobalWorkerOptions.workerSrc = worker.default;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const loadingTask = getDocument({ data: bytes });
  try {
    const document = await loadingTask.promise;
    if (!Number.isSafeInteger(document.numPages) || document.numPages < 1) {
      throw new Error('invalid-pdf-page-count');
    }
    return document.numPages;
  } finally {
    await loadingTask.destroy();
  }
}

function openPdfDatabase(storageKey: string): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('indexeddb-unavailable'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(`${storageKey}-pdfs`, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'bookId' });
      }
    };
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => database.close();
      resolve(database);
    };
    request.onerror = () => reject(request.error ?? new Error('indexeddb-open-failed'));
    request.onblocked = () => reject(new Error('indexeddb-open-blocked'));
  });
}

function runTransaction<T>(
  storageKey: string,
  mode: IDBTransactionMode,
  makeRequest: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openPdfDatabase(storageKey).then((database) => new Promise<T>((resolve, reject) => {
    let result: T | undefined;
    let hasResult = false;
    const transaction = database.transaction(STORE_NAME, mode);
    const request = makeRequest(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => {
      result = request.result;
      hasResult = true;
    };
    request.onerror = () => reject(request.error ?? new Error('indexeddb-request-failed'));
    transaction.oncomplete = () => {
      if (!hasResult) reject(new Error('indexeddb-request-missing-result'));
      else resolve(result as T);
    };
    transaction.onerror = () => reject(transaction.error ?? new Error('indexeddb-transaction-failed'));
    transaction.onabort = () => reject(transaction.error ?? new Error('indexeddb-transaction-aborted'));
  }).finally(() => database.close()));
}

export function getBookPdf(storageKey: string, bookId: string) {
  return runTransaction<StoredBookPdf | undefined>(
    storageKey,
    'readonly',
    (store) => store.get(bookId),
  );
}

export function saveBookPdf(storageKey: string, pdf: StoredBookPdf) {
  return runTransaction<IDBValidKey>(
    storageKey,
    'readwrite',
    (store) => store.put(pdf),
  );
}

export function deleteBookPdf(storageKey: string, bookId: string) {
  return runTransaction<undefined>(
    storageKey,
    'readwrite',
    (store) => store.delete(bookId),
  );
}