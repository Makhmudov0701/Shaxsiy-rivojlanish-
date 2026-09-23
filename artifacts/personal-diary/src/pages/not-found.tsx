import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex gap-2">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <h1 className="text-2xl font-bold text-foreground">404 — Sahifa topilmadi</h1>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Siz izlayotgan sahifa mavjud emas yoki ko‘chirilgan.</p>
      </div>
    </div>
  );
}