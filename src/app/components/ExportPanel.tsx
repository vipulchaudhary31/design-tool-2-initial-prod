import { AlertCircle, CheckCircle2, Download, Loader2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Progress } from '@/app/components/ui/progress';
import { isPostScheduleAllowed } from '@/utils/postSchedule';
import type { ExportFinalizationStatus } from '@/utils/exportBackgroundFinalizer';

interface ExportPanelProps {
  backgroundImage: string | null;
  imageHolder: { x: number; y: number; diameter: number };
  nameHolder: { x: number; y: number; width: number; height: number };
  isProfileTemplate: boolean;
  selectedTags: string[];
  selectedLanguages: string[];
  canvasWidth: number;
  canvasHeight: number;
  nameLayout?: 'strip' | 'overlay';
  onExport: () => void;
  onPreview?: () => void;
  isExporting?: boolean;
  exportStatus?: ExportFinalizationStatus | null;
  exportLabel?: string;
  previewLabel?: string;
  postName?: string;
  postLiveImmediately?: boolean;
  postScheduleDateKey?: string;
  postScheduleTimeHm?: string;
}

export function ExportPanel({
  backgroundImage,
  imageHolder,
  nameHolder,
  selectedTags,
  selectedLanguages,
  canvasWidth,
  canvasHeight,
  nameLayout = 'strip',
  onExport,
  onPreview,
  isExporting = false,
  exportStatus = null,
  exportLabel = 'Save',
  previewLabel = 'Preview',
  postName = '',
  postLiveImmediately = false,
  postScheduleDateKey = '',
  postScheduleTimeHm = '09:00',
}: ExportPanelProps) {
  const checks = [
    { ok: !!backgroundImage, label: 'Design uploaded' },
    { ok: selectedTags.length > 0, label: 'Primary category selected' },
    { ok: selectedLanguages.length > 0, label: 'Language selected' },
    { ok: !!(postName ?? '').trim(), label: 'Post name entered' },
    {
      ok: isPostScheduleAllowed(postLiveImmediately, postScheduleDateKey, postScheduleTimeHm),
      label: postLiveImmediately ? 'Publishes when saved (live)' : 'Scheduled publish time',
    },
    {
      ok: imageHolder.x >= 0 && imageHolder.y >= 0 &&
        imageHolder.x + imageHolder.diameter <= canvasWidth &&
        imageHolder.y + imageHolder.diameter <= canvasHeight,
      label: 'Photo in bounds',
    },
    {
      ok: nameLayout === 'strip' || (
        nameHolder.x >= 0 && nameHolder.y >= 0 &&
        nameHolder.x + nameHolder.width <= canvasWidth &&
        nameHolder.y + nameHolder.height <= canvasHeight
      ),
      label: 'Name in bounds',
    },
  ];

  const allValid = checks.every(c => c.ok);

  return (
    <div className="space-y-3 pb-10">
      <div className="space-y-1">
        {checks.map(c => (
          <div key={c.label} className="flex items-center gap-2 py-1">
            {c.ok ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-chart-2 shrink-0" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            )}
            <span className={`text-xs ${c.ok ? 'text-foreground/70' : 'text-muted-foreground/60'}`}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
      <Button onClick={onExport} disabled={!allValid || isExporting} className="w-full gap-2" size="sm">
        {isExporting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        {isExporting ? 'Working…' : exportLabel}
      </Button>
      {onPreview ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={onPreview}
            disabled={!allValid || isExporting}
            className="h-auto px-0 text-xs text-muted-foreground underline decoration-muted-foreground/60 underline-offset-4 hover:text-foreground"
          >
            {previewLabel}
          </Button>
        </div>
      ) : null}
      {exportStatus && (
        <div className="rounded-md border border-border/60 bg-secondary/45 px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-foreground/80">{exportStatus.label}</span>
            <span className="text-[11px] text-muted-foreground">{Math.round(exportStatus.progress)}%</span>
          </div>
          <Progress value={exportStatus.progress} className="mt-2 h-1.5" />
          {exportStatus.detail ? (
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              {exportStatus.detail}
            </p>
          ) : null}
        </div>
      )}

    </div>
  );
}
