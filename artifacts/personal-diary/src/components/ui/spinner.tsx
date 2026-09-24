import { cn } from '@/lib/utils';
import { Loader2Icon } from 'lucide-react';

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  const { ref, ...svgProps } = props;
  return (
    <Loader2Icon
      role="status"
      aria-label="Yuklanmoqda"
      className={cn('size-4 animate-spin', className)}
      {...svgProps}
      ref={ref as Parameters<typeof Loader2Icon>[0]['ref']}
    />
  );
}

export { Spinner };
