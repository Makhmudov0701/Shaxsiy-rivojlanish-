import type { ReactNode } from 'react';

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