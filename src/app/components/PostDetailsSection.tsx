import { format, parse as parseTime, startOfToday } from 'date-fns';
import { CalendarIcon, Clock, Zap } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Calendar } from '@/app/components/ui/calendar';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Separator } from '@/app/components/ui/separator';
import { Switch } from '@/app/components/ui/switch';
import { cn } from '@/app/components/ui/utils';
import { parseDateKeyToLocalDate } from '@/utils/postSchedule';

const HOURLY_TIME_OPTIONS = Array.from({ length: 24 }, (_, h) =>
  `${String(h).padStart(2, '0')}:00`);

function hourlySlotDisplay(hm: string): string {
  return format(parseTime(hm, 'HH:mm', new Date()), 'h:mm a');
}

function canonicalHourHm(hm: string): string {
  const raw = hm.trim().split(':')[0];
  const hh = Math.min(23, Math.max(0, Number.parseInt(raw ?? '0', 10) || 0));
  return `${String(hh).padStart(2, '0')}:00`;
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
  const [hourPickOpen, setHourPickOpen] = useState(false);
  const currentHourHm = canonicalHourHm(scheduleTimeHm);

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
            <Label className="text-xs text-muted-foreground">Time</Label>
            <Popover open={hourPickOpen} onOpenChange={setHourPickOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 w-full justify-start gap-2 text-left text-xs font-normal shadow-none disabled:!opacity-100"
                  disabled={liveImmediately}
                >
                  <Clock className="size-3.5 shrink-0 opacity-70" aria-hidden />
                  <span className="font-mono tabular-nums">{hourlySlotDisplay(currentHourHm)}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" sideOffset={4} className="w-[10.5rem] p-1">
                <div
                  className="max-h-52 overflow-y-auto overscroll-contain rounded-sm"
                  role="listbox"
                  aria-label="Hourly times"
                >
                  {HOURLY_TIME_OPTIONS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      role="option"
                      aria-selected={currentHourHm === slot}
                      className={cn(
                        'flex w-full items-center rounded-sm px-2 py-2 text-left text-xs tabular-nums transition-colors hover:bg-accent hover:text-accent-foreground',
                        currentHourHm === slot ? 'bg-primary/12 text-primary' : '',
                      )}
                      onClick={() => {
                        onScheduleTimeHmChange(slot);
                        setHourPickOpen(false);
                      }}
                    >
                      {hourlySlotDisplay(slot)}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
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
