import { format, startOfToday } from 'date-fns';
import { CalendarIcon, Clock, Zap } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Calendar } from '@/app/components/ui/calendar';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Separator } from '@/app/components/ui/separator';
import { Switch } from '@/app/components/ui/switch';
import { cn } from '@/app/components/ui/utils';
import { parseDateKeyToLocalDate } from '@/utils/postSchedule';

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
                id="post-schedule-time"
                type="text"
                inputMode="numeric"
                placeholder="HH:mm (24h)"
                value={scheduleTimeHm}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^[0-9:]{0,5}$/.test(value)) onScheduleTimeHmChange(value);
                }}
                onBlur={(e) => {
                  const normalized = normalizeTimeDraft(e.target.value);
                  if (normalized) onScheduleTimeHmChange(normalized);
                }}
                disabled={liveImmediately}
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
