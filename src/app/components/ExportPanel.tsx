import { AlertCircle, CheckCircle2, Download, Loader2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { isPostScheduleAllowed } from '@/utils/postSchedule';

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
  onDownloadPost: () => void;
  isExporting?: boolean;
  isDownloadingPost?: boolean;
  downloadProgress?: number;
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
  onDownloadPost,
  isExporting = false,
  isDownloadingPost = false,
  downloadProgress = 0,
  postName = '',
  postLiveImmediately = false,
  postScheduleDateKey = '',
  postScheduleTimeHm = '09:00',
}: ExportPanelProps) {
  const checks = [
    { ok: !!backgroundImage, label: 'Background uploaded' },
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
    <div className="space-y-3">
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
        {isExporting ? 'Exporting…' : allValid ? 'Export' : 'Complete all checks'}
      </Button>
      <Button
        type="button"
        variant="link"
        size="sm"
        className="w-full justify-start px-0 text-xs text-muted-foreground hover:text-foreground"
        onClick={onDownloadPost}
        disabled={!backgroundImage || isDownloadingPost}
      >
        {isDownloadingPost ? (
          <>
            <Loader2 className="mr-1 w-3.5 h-3.5 animate-spin" />
            Downloading {Math.max(0, Math.min(100, Math.round(downloadProgress)))}%
          </>
        ) : (
          <>
            <Download className="mr-1 w-3.5 h-3.5" />
            Download Post
          </>
        )}
      </Button>

    </div>
  );
}
