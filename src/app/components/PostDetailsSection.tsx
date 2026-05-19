import { useEffect, useLayoutEffect, useRef } from 'react';
import { format, isBefore, startOfToday } from 'date-fns';
import { CalendarIcon, Clock, Zap } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Calendar } from '@/app/components/ui/calendar';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Separator } from '@/app/components/ui/separator';
import { Switch } from '@/app/components/ui/switch';
import { cn } from '@/app/components/ui/utils';
import { defaultScheduleDateKey, parseDateKeyToLocalDate } from '@/utils/postSchedule';

function normalizeTimeDraft(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;

  let hhS = '';
  let mmS = '';
  const colonMatch = /^(\d{1,2}):(\d{1,2})$/.exec(raw);
  if (colonMatch) {
    [, hhS, mmS] = colonMatch;
  } else if (/^\d{1,4}$/.test(raw)) {
    if (raw.length <= 2) {
      hhS = raw;
      mmS = '0';
    } else if (raw.length === 3) {
      hhS = raw.slice(0, 1);
      mmS = raw.slice(1);
    } else {
      hhS = raw.slice(0, 2);
      mmS = raw.slice(2);
    }
  } else {
    return null;
  }

  const hh = Number(hhS);
  const mm = Number(mmS);
  if (!Number.isInteger(hh) || !Number.isInteger(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) {
    return null;
  }
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function coerceScheduleDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  let next = '';

  for (let i = 0; i < digits.length; i += 1) {
    const char = digits[i];

    if (i === 0) {
      next += char;
      continue;
    }

    if (i === 1) {
      const first = next[0];
      if (!first) break;
      if ((first === '2' && char > '3') || (first !== '2' && char > '9')) break;
      next += char;
      continue;
    }

    if (i === 2) {
      if (char > '5') break;
      next += char;
      continue;
    }

    next += char;
  }

  return next;
}

function formatScheduleTimeInput(value: string): string {
  const digits = coerceScheduleDigits(value);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `${digits}:`;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function timeDigits(value: string): string {
  return coerceScheduleDigits(value);
}

function digitIndexFromCaret(value: string, caret: number): number {
  return value.slice(0, Math.max(0, caret)).replace(/\D/g, '').length;
}

function caretFromDigitIndex(value: string, digitIndex: number): number {
  if (digitIndex <= 0) return 0;

  let seen = 0;
  for (let i = 0; i < value.length; i += 1) {
    if (!/\d/.test(value[i])) continue;
    seen += 1;
    if (seen === digitIndex) {
      if (seen === 2 && value[i + 1] === ':') {
        return i + 2;
      }
      return i + 1;
    }
  }

  return value.length;
}

function removeDigitRange(value: string, startDigitIndex: number, endDigitIndex: number): string {
  const digits = timeDigits(value);
  return `${digits.slice(0, startDigitIndex)}${digits.slice(endDigitIndex)}`;
}

function isAllowedControlKey(eventKey: string): boolean {
  return [
    'Tab',
    'Enter',
    'Escape',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ].includes(eventKey);
}

function insertScheduleDigit(
  value: string,
  selectionStart: number | null,
  selectionEnd: number | null,
  digit: string,
): { value: string; digitIndex: number } | null {
  const formatted = formatScheduleTimeInput(value);
  const start = selectionStart ?? formatted.length;
  const end = selectionEnd ?? start;
  const startDigitIndex = digitIndexFromCaret(formatted, start);
  const endDigitIndex = digitIndexFromCaret(formatted, end);
  const existingDigits = timeDigits(formatted);

  if (existingDigits.length === 0 && startDigitIndex === 0 && digit > '2') {
    return {
      value: formatScheduleTimeInput(`0${digit}`),
      digitIndex: 2,
    };
  }

  const mergedDigits = `${existingDigits.slice(0, startDigitIndex)}${digit}${existingDigits.slice(endDigitIndex)}`.slice(0, 4);

  if (mergedDigits.length >= 2) {
    const hour = Number(mergedDigits.slice(0, 2));
    if (hour > 23) return null;
  }

  if (mergedDigits.length >= 3) {
    const minuteTens = Number(mergedDigits[2]);
    if (minuteTens > 5) return null;
  }

  const nextFormatted = formatScheduleTimeInput(mergedDigits);
  return {
    value: nextFormatted,
    digitIndex: Math.min(startDigitIndex + 1, timeDigits(nextFormatted).length),
  };
}

interface PostDetailsSectionProps {
  postName: string;
  onPostNameChange: (v: string) => void;
  liveImmediately: boolean;
  onLiveImmediatelyChange: (v: boolean) => void;
  scheduleDateKey: string;
  onScheduleDateKeyChange: (ymd: string) => void;
  scheduleTimeHm: string;
  onScheduleTimeHmChange: (hm: string) => void;
}

export function PostDetailsSection({
  postName,
  onPostNameChange,
  liveImmediately,
  onLiveImmediatelyChange,
  scheduleDateKey,
  onScheduleDateKeyChange,
  scheduleTimeHm,
  onScheduleTimeHmChange,
}: PostDetailsSectionProps) {
  const selectedDate = parseDateKeyToLocalDate(scheduleDateKey) ?? startOfToday();
  const timeInputRef = useRef<HTMLInputElement | null>(null);
  const pendingCaretRef = useRef<number | null>(null);
  const formattedScheduleTime = formatScheduleTimeInput(scheduleTimeHm);

  const setScheduleTimeWithCaret = (nextFormatted: string, nextDigitIndex: number) => {
    const clampedDigitIndex = Math.min(nextDigitIndex, timeDigits(nextFormatted).length);
    pendingCaretRef.current = caretFromDigitIndex(nextFormatted, clampedDigitIndex);
    onScheduleTimeHmChange(nextFormatted);
  };

  useEffect(() => {
    if (liveImmediately) return;
    const parsed = parseDateKeyToLocalDate(scheduleDateKey);
    if (!parsed || isBefore(parsed, startOfToday())) {
      onScheduleDateKeyChange(defaultScheduleDateKey());
    }
  }, [liveImmediately, onScheduleDateKeyChange, scheduleDateKey]);

  useLayoutEffect(() => {
    const input = timeInputRef.current;
    const caret = pendingCaretRef.current;
    if (!input || caret == null || document.activeElement !== input) return;

    input.setSelectionRange(caret, caret);
    pendingCaretRef.current = null;
  }, [formattedScheduleTime]);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="post-display-name" className="text-xs text-muted-foreground">
          Post name
        </Label>
        <Input
          id="post-display-name"
          type="text"
          value={postName}
          onChange={(e) => onPostNameChange(e.target.value)}
          placeholder="e.g. from your image filename"
          className="h-9 text-xs shadow-none"
          maxLength={200}
          autoComplete="off"
        />
      </div>

      <Separator />

      <div className="flex flex-col gap-[calc(0.75rem+2px)]">
        <div className={cn('space-y-3', liveImmediately && 'opacity-45 pointer-events-none select-none')}>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 w-full justify-start gap-2 text-left text-xs font-normal shadow-none disabled:!opacity-100"
                  disabled={liveImmediately}
                >
                  <CalendarIcon className="size-3.5 shrink-0 opacity-70" aria-hidden />
                  <span>{format(selectedDate, 'PPP')}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  disabled={(d) => d < startOfToday()}
                  onSelect={(d) => {
                    if (d) onScheduleDateKeyChange(format(d, 'yyyy-MM-dd'));
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-schedule-time" className="text-xs text-muted-foreground">Time</Label>
            <div className="relative">
              <Clock className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground opacity-70" aria-hidden />
              <Input
                ref={timeInputRef}
                id="post-schedule-time"
                type="text"
                inputMode="numeric"
                pattern="[0-9:]*"
                enterKeyHint="done"
                placeholder="HH:mm (24h)"
                value={formattedScheduleTime}
                onChange={(e) => {
                  const nextFormatted = formatScheduleTimeInput(e.target.value);
                  const nextDigitIndex = Math.min(
                    timeDigits(nextFormatted).length,
                    digitIndexFromCaret(e.target.value, e.target.selectionStart ?? e.target.value.length),
                  );
                  setScheduleTimeWithCaret(nextFormatted, nextDigitIndex);
                }}
                onKeyDown={(e) => {
                  const { selectionStart, selectionEnd, value } = e.currentTarget;
                  const start = selectionStart ?? 0;
                  const end = selectionEnd ?? start;

                  if (e.ctrlKey || e.metaKey || e.altKey) return;

                  if (e.key === ':') {
                    e.preventDefault();
                    const currentDigits = timeDigits(value);
                    const currentDigitIndex = digitIndexFromCaret(value, start);
                    const targetDigitIndex = currentDigits.length >= 2 ? Math.max(currentDigitIndex, 2) : currentDigits.length;
                    pendingCaretRef.current = caretFromDigitIndex(formattedScheduleTime, targetDigitIndex);
                    return;
                  }

                  if (e.key.length === 1 && !/\d/.test(e.key)) {
                    e.preventDefault();
                    return;
                  }

                  if (isAllowedControlKey(e.key)) return;

                  if (/\d/.test(e.key)) {
                    e.preventDefault();
                    const inserted = insertScheduleDigit(value, start, end, e.key);
                    if (!inserted) return;
                    setScheduleTimeWithCaret(inserted.value, inserted.digitIndex);
                    return;
                  }

                  if (e.key === 'Backspace' || e.key === 'Delete') {
                    e.preventDefault();

                    const startDigitIndex = digitIndexFromCaret(value, start);
                    const endDigitIndex = digitIndexFromCaret(value, end);
                    const hasSelection = start !== end;

                    if (hasSelection) {
                      const nextFormatted = formatScheduleTimeInput(
                        removeDigitRange(value, startDigitIndex, endDigitIndex),
                      );
                      setScheduleTimeWithCaret(nextFormatted, startDigitIndex);
                      return;
                    }

                    if (e.key === 'Backspace') {
                      if (startDigitIndex <= 0) return;
                      const nextFormatted = formatScheduleTimeInput(
                        removeDigitRange(value, startDigitIndex - 1, startDigitIndex),
                      );
                      setScheduleTimeWithCaret(nextFormatted, startDigitIndex - 1);
                      return;
                    }

                    const digitsLength = timeDigits(value).length;
                    if (startDigitIndex >= digitsLength) return;
                    const nextFormatted = formatScheduleTimeInput(
                      removeDigitRange(value, startDigitIndex, startDigitIndex + 1),
                    );
                    setScheduleTimeWithCaret(nextFormatted, startDigitIndex);
                    return;
                  }
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const pastedDigits = e.clipboardData.getData('text').replace(/\D/g, '');
                  if (!pastedDigits) return;

                  let currentValue = e.currentTarget.value;
                  let start = e.currentTarget.selectionStart ?? currentValue.length;
                  let end = e.currentTarget.selectionEnd ?? start;
                  let lastApplied: { value: string; digitIndex: number } | null = null;

                  for (const digit of pastedDigits) {
                    const inserted = insertScheduleDigit(currentValue, start, end, digit);
                    if (!inserted) break;
                    lastApplied = inserted;
                    currentValue = inserted.value;
                    start = caretFromDigitIndex(currentValue, inserted.digitIndex);
                    end = start;
                  }

                  if (lastApplied) {
                    setScheduleTimeWithCaret(lastApplied.value, lastApplied.digitIndex);
                  }
                }}
                onBlur={(e) => {
                  const normalized = normalizeTimeDraft(e.target.value);
                  if (normalized) {
                    onScheduleTimeHmChange(normalized);
                  } else if (!e.target.value.trim()) {
                    onScheduleTimeHmChange('');
                  }
                }}
                disabled={liveImmediately}
                maxLength={5}
                className="h-9 pl-8 text-xs font-mono tabular-nums shadow-none disabled:!opacity-100"
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Zap className="size-3.5 shrink-0 text-primary opacity-80" aria-hidden />
            <Label htmlFor="post-live-switch" className="cursor-pointer text-xs font-medium text-foreground">
              Publish now
            </Label>
          </div>
          <Switch
            id="post-live-switch"
            checked={liveImmediately}
            onCheckedChange={onLiveImmediatelyChange}
            className="shrink-0"
          />
        </div>
      </div>
    </div>
  );
}
