import { cn } from '@/lib/utils';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Use 'default' for standard content, 'narrow' for text-heavy sections */
  size?: 'default' | 'narrow' | 'wide';
}

/**
 * Consistent max-width + horizontal padding wrapper for page sections.
 * Keeps content aligned across the entire app.
 */
function Container({
  className,
  size = 'default',
  ...props
}: ContainerProps) {
  return (
    <div
      data-slot="container"
      className={cn(
        'mx-auto w-full px-6 md:px-8',
        size === 'narrow' && 'max-w-3xl',
        size === 'default' && 'max-w-7xl',
        size === 'wide' && 'max-w-[1440px]',
        className
      )}
      {...props}
    />
  );
}

export { Container };
