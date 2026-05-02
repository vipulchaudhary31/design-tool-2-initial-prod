/**
 * Preserved AlertDialog layout for “replace background?” — not wired in the app (picker opens directly).
 * To use: wrap with AlertDialog.Root + `open` / `onOpenChange`; call `onConfirmPick`, then programme the file input.
 */

import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';

export interface ReplaceBackgroundConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** User dismisses via X / overlay / “Keep current” */
  onCancel: () => void;
  /** User confirms — caller should close dialog then trigger hidden file input */
  onConfirmPick: () => void;
}

export function ReplaceBackgroundConfirmDialog({
  open,
  onOpenChange,
  onCancel,
  onConfirmPick,
}: ReplaceBackgroundConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <div className="flex flex-col gap-5 px-6 pb-6 pt-6">
          <div className="flex items-start justify-between gap-3">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
              aria-hidden
            >
              <RefreshCw className="size-5" strokeWidth={2.25} />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="-mr-2 -mt-1 size-8 shrink-0 text-muted-foreground hover:text-foreground [&_svg]:size-4"
              aria-label="Close"
              onClick={onCancel}
            >
              <X />
            </Button>
          </div>
          <AlertDialogHeader className="gap-1.5 space-y-0 text-left">
            <AlertDialogTitle className="text-left">Replace background?</AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              Replacing your background will reset all your saved changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        <AlertDialogFooter className="gap-2 border-t border-border bg-muted/40 px-6 py-4 sm:justify-end">
          <AlertDialogCancel type="button" onClick={onCancel}>
            Keep current
          </AlertDialogCancel>
          <AlertDialogAction type="button" onClick={onConfirmPick}>
            Choose new image…
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
