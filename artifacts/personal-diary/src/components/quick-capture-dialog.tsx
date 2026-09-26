import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Hash, PenLine } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type QuickCaptureCopy = {
  title: string;
  description: string;
  textLabel: string;
  textPlaceholder: string;
  tagsLabel: string;
  tagsPlaceholder: string;
  save: string;
  cancel: string;
  requiredText: string;
  saveError: string;
};

export type QuickCaptureDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: { text: string; tags: string[] }) => void | boolean;
  copy: QuickCaptureCopy;
};

const initialDraft = { text: '', tags: '' };

function normalizeText(value: string) {
  return value.replace(/\r\n?/g, '\n').trim();
}

function normalizeTags(value: string) {
  const seen = new Set<string>();

  return value
    .split(/[,\n]/)
    .map((tag) => tag.trim().replace(/^#+/, '').replace(/\s+/g, ' '))
    .filter((tag) => {
      const key = tag.toLocaleLowerCase();
      if (!tag || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

function submitWithShortcut(event: KeyboardEvent<HTMLTextAreaElement>, submit: () => void) {
  if (event.key !== 'Enter' || (!event.metaKey && !event.ctrlKey)) return;
  event.preventDefault();
  submit();
}

export function QuickCaptureDialog({
  open,
  onOpenChange,
  onSubmit,
  copy,
}: QuickCaptureDialogProps) {
  const [draft, setDraft] = useState(initialDraft);
  const [showError, setShowError] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(initialDraft);
    setShowError(false);
    setSubmitError('');
    const frame = window.requestAnimationFrame(() => textRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const submit = () => {
    const text = normalizeText(draft.text);
    if (!text) {
      setShowError(true);
      textRef.current?.focus();
      return;
    }

    const accepted = onSubmit({ text, tags: normalizeTags(draft.tags) });
    if (accepted === false) {
      setSubmitError(copy.saveError);
      return;
    }
    setSubmitError('');
    onOpenChange(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  const handleTextKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    submitWithShortcut(event, submit);
  };

  const handleDraftTextChange = (value: string) => {
    setDraft((current) => ({ ...current, text: value }));
    if (showError && normalizeText(value)) setShowError(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[calc(100%-1rem)] max-w-[30rem] gap-0 overflow-y-auto rounded-[28px] border-[#e6dbc7] bg-[#fbf7ef] p-0 text-[#30243f] shadow-[0_24px_80px_rgba(48,36,63,0.2)] sm:w-[calc(100%-3rem)] sm:max-w-[30rem]"
        data-testid="dialog-quick-capture"
      >
        <div className="relative overflow-hidden border-b border-[#eadfcd] px-5 pb-5 pt-6 sm:px-7 sm:pb-6 sm:pt-7">
          <div className="pointer-events-none absolute -right-12 -top-16 size-44 rounded-full border-[18px] border-[#eadfcd]/70" />
          <div className="pointer-events-none absolute -bottom-16 right-16 size-24 rounded-full border-[10px] border-[#dcebe4]/80" />
          <DialogHeader className="relative text-left">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-[#f1e2b9] text-[#8f601a] shadow-sm" data-testid="icon-quick-capture">
                <PenLine size={19} strokeWidth={1.8} />
              </span>
            </div>
            <DialogTitle className="font-serif text-[31px] font-normal leading-[1.02] tracking-[-0.04em] text-[#30243f] sm:text-[35px]" data-testid="text-quick-capture-title">
              {copy.title}
            </DialogTitle>
            <DialogDescription className="mt-2 max-w-[38ch] text-[13px] leading-[1.6] text-[#756d5e]" data-testid="text-quick-capture-description">
              {copy.description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-7 sm:pb-7 sm:pt-6" data-testid="form-quick-capture">
          <div>
            <label htmlFor="quick-capture-text" className="flex items-center justify-between gap-3 text-[11px] font-semibold text-[#4d4355]">
              <span>{copy.textLabel}</span>
              <span className="font-mono text-[9px] font-normal text-[#a59a8a]">⌘↵</span>
            </label>
            <textarea
              ref={textRef}
              id="quick-capture-text"
              value={draft.text}
              onChange={(event) => handleDraftTextChange(event.target.value)}
              onKeyDown={handleTextKeyDown}
              placeholder={copy.textPlaceholder}
              aria-invalid={showError}
              aria-describedby={showError ? 'quick-capture-required' : undefined}
              rows={6}
              maxLength={3000}
              className="mt-2 min-h-[150px] w-full resize-y rounded-2xl border border-[#ddd0bb] bg-[#fffdf8] px-4 py-3.5 text-[14px] leading-[1.65] text-[#30243f] outline-none transition-[border-color,box-shadow] placeholder:text-[#a99f90] focus:border-[#b89c5c] focus:ring-4 focus:ring-[#d9bf79]/20"
              data-testid="input-quick-capture-text"
            />
            {showError && (
              <p id="quick-capture-required" className="mt-2 text-[11px] font-medium text-[#a24e3b]" role="alert" data-testid="status-quick-capture-error">
                {copy.requiredText}
              </p>
            )}
            {submitError && (
              <p className="mt-2 text-[11px] font-medium text-[#a24e3b]" role="alert" data-testid="status-quick-capture-save-error">
                {submitError}
              </p>
            )}
          </div>

          <div className="mt-5">
            <label htmlFor="quick-capture-tags" className="flex items-center gap-2 text-[11px] font-semibold text-[#4d4355]">
              <Hash size={13} strokeWidth={2} className="text-[#9a6b23]" aria-hidden="true" />
              {copy.tagsLabel}
            </label>
            <textarea
              id="quick-capture-tags"
              value={draft.tags}
              onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))}
              onKeyDown={handleTextKeyDown}
              placeholder={copy.tagsPlaceholder}
              rows={2}
              maxLength={500}
              className="mt-2 min-h-[68px] w-full resize-none rounded-2xl border border-[#ddd0bb] bg-[#fffdf8] px-4 py-3 text-[13px] leading-relaxed text-[#30243f] outline-none transition-[border-color,box-shadow] placeholder:text-[#a99f90] focus:border-[#b89c5c] focus:ring-4 focus:ring-[#d9bf79]/20"
              data-testid="input-quick-capture-tags"
            />
            <p className="mt-2 text-[10px] leading-relaxed text-[#918777]" data-testid="text-quick-capture-tags-hint">
              {normalizeTags(draft.tags).length > 0
                ? normalizeTags(draft.tags).map((tag) => `#${tag}`).join(' · ')
                : copy.tagsPlaceholder}
            </p>
          </div>

          <DialogFooter className="mt-7 flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="min-h-12 rounded-2xl px-5 text-[13px] font-semibold text-[#756d5e] transition-colors hover:bg-[#f1e8d8] hover:text-[#30243f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b89c5c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf7ef]"
              data-testid="button-quick-capture-cancel"
            >
              {copy.cancel}
            </button>
            <button
              type="submit"
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#30243f] px-5 text-[13px] font-semibold text-[#fbf7ef] shadow-[0_8px_18px_rgba(48,36,63,0.16)] transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-[#463556] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b89c5c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf7ef] active:translate-y-0 sm:flex-none"
              data-testid="button-quick-capture-save"
            >
              <PenLine size={15} strokeWidth={2} aria-hidden="true" />
              {copy.save}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default QuickCaptureDialog;