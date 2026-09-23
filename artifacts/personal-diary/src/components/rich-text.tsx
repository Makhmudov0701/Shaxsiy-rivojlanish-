import { forwardRef, useEffect, useRef, type ReactNode } from 'react';

export type RichFormat = 'bold' | 'italic' | 'bullet' | 'quote';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function markdownInlineToHtml(value: string): string {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>');
}

export function markdownToEditorHtml(value: string | null | undefined): string {
  const lines = (value ?? '').split(/\r?\n/);
  const blocks: string[] = [];
  let bullets: string[] = [];

  const flushBullets = () => {
    if (bullets.length === 0) return;
    blocks.push(`<ul>${bullets.map((item) => `<li>${markdownInlineToHtml(item)}</li>`).join('')}</ul>`);
    bullets = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      bullets.push(trimmed.slice(2));
      continue;
    }
    flushBullets();
    if (!trimmed) continue;
    if (trimmed.startsWith('> ')) {
      blocks.push(`<blockquote>${markdownInlineToHtml(trimmed.slice(2))}</blockquote>`);
    } else {
      blocks.push(`<p>${markdownInlineToHtml(trimmed)}</p>`);
    }
  }
  flushBullets();
  return blocks.join('');
}

function serializeInlineNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const element = node as HTMLElement;
  const content = Array.from(element.childNodes).map(serializeInlineNode).join('');
  switch (element.tagName.toLowerCase()) {
    case 'strong':
    case 'b':
      return content ? `**${content}**` : '';
    case 'em':
    case 'i':
      return content ? `*${content}*` : '';
    case 'code':
      return content ? `\`${content}\`` : '';
    case 'br':
      return '\n';
    default:
      return content;
  }
}

export function serializeEditorContent(editor: HTMLElement): string {
  const blocks: string[] = [];
  let inlineContent = '';
  const flushInline = () => {
    const value = inlineContent.trim();
    if (value) blocks.push(value);
    inlineContent = '';
  };

  for (const node of Array.from(editor.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      inlineContent += node.textContent ?? '';
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue;

    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();
    if (tag === 'ul' || tag === 'ol') {
      flushInline();
      const items = Array.from(element.children)
        .filter((child) => child.tagName.toLowerCase() === 'li')
        .map((item) => `- ${serializeInlineNode(item).trim()}`)
        .filter((item) => item !== '-');
      if (items.length) blocks.push(items.join('\n'));
      continue;
    }
    if (tag === 'blockquote') {
      flushInline();
      const quote = serializeInlineNode(element).trim();
      if (quote) blocks.push(quote.split(/\r?\n/).map((line) => `> ${line}`).join('\n'));
      continue;
    }
    if (tag === 'p' || tag === 'div' || /^h[1-6]$/.test(tag)) {
      flushInline();
      const value = serializeInlineNode(element).trim();
      if (value) blocks.push(value);
      continue;
    }
    inlineContent += serializeInlineNode(element);
  }
  flushInline();
  return blocks.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}

export const VisualRichTextEditor = forwardRef<HTMLDivElement, {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}>(({ value, onChange, disabled = false }, forwardedRef) => {
  const internalRef = useRef<HTMLDivElement>(null);
  const editorRef = (forwardedRef as React.RefObject<HTMLDivElement | null>) ?? internalRef;

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (document.activeElement !== editor) {
      const nextHtml = markdownToEditorHtml(value);
      if (editor.innerHTML !== nextHtml) editor.innerHTML = nextHtml;
    }
  }, [editorRef, value]);

  return (
    <div
      ref={editorRef}
      contentEditable={!disabled}
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label="Matn muharriri"
      data-placeholder="Bugundan siz bilan nima qoldi? Istalgan joydan boshlang."
      data-testid="editor-entry-content"
      onInput={(event) => onChange(serializeEditorContent(event.currentTarget))}
      className="rich-editor min-h-[380px] w-full bg-transparent py-5 font-serif text-[23px] leading-[1.55] text-foreground outline-none"
    />
  );
});
VisualRichTextEditor.displayName = 'VisualRichTextEditor';

export function plainTextFromRichText(value: string | null | undefined): string {
  return (value ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_~`>#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function richTextWordCount(value: string | null | undefined): number {
  const plainText = plainTextFromRichText(value);
  return plainText ? plainText.split(/\s+/).length : 0;
}

export function estimatedReadingMinutes(value: string | null | undefined): number {
  return Math.max(1, Math.ceil(richTextWordCount(value) / 200));
}

function renderInline(value: string): ReactNode[] {
  const parts = value.split(/(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_|`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('__') && part.endsWith('__')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>;
    if (part.startsWith('_') && part.endsWith('_')) return <em key={index}>{part.slice(1, -1)}</em>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index} className="rounded bg-muted px-1.5 py-0.5 text-[.85em]">{part.slice(1, -1)}</code>;
    return <span key={index}>{part}</span>;
  });
}

export function RichTextPreview({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];

  const flushBullets = () => {
    if (bullets.length === 0) return;
    blocks.push(
      <ul key={`list-${blocks.length}`} className="my-4 list-disc space-y-2 pl-6">
        {bullets.map((item, index) => <li key={`${item}-${index}`}>{renderInline(item)}</li>)}
      </ul>,
    );
    bullets = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      bullets.push(trimmed.slice(2));
      return;
    }
    flushBullets();
    if (!trimmed) return;
    if (trimmed.startsWith('> ')) {
      blocks.push(<blockquote key={`quote-${index}`} className="my-4 border-l-2 border-[#d9a441] pl-4 italic text-muted-foreground">{renderInline(trimmed.slice(2))}</blockquote>);
      return;
    }
    blocks.push(<p key={`paragraph-${index}`} className="my-4">{renderInline(trimmed)}</p>);
  });
  flushBullets();

  return <div className="rich-text-preview font-serif text-[23px] leading-[1.55] text-foreground">{blocks.length ? blocks : <p className="text-muted-foreground/60">Hozircha matn yo‘q.</p>}</div>;
}