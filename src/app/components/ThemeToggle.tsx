import { useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/components/ui/utils';

interface ThemeToggleProps {
  isDarkMode: boolean;
  onToggle: (next: boolean) => void;
  className?: string;
}

export function ThemeToggle({ isDarkMode, onToggle, className }: ThemeToggleProps) {
  const ref = useRef<HTMLButtonElement>(null);

  const handleToggle = useCallback(() => {
    const btn = ref.current;

    if (!btn || !document.startViewTransition) {
      onToggle(!isDarkMode);
      return;
    }

    const rect = btn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        onToggle(!isDarkMode);
      });
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 500,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      );
    });
  }, [isDarkMode, onToggle]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn('h-8 w-8 text-muted-foreground hover:text-foreground', className)}
    >
      {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}
