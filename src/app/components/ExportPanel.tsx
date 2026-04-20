import { AlertCircle, Check, CheckCircle2, Copy, Download, ImageDown, Loader2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface ExportPanelProps {
  backgroundImage: string | null;
  imageHolder: { x: number; y: number; diameter: number };
  nameHolder: { x: number; y: number; width: number; height: number };
  isProfileTemplate: boolean;
  selectedTags: string[];
  selectedLanguages: string[];
  canvasWidth: number;
  canvasHeight: number;
  onExport: () => void;
  onDownloadImage?: () => void;
  dominantColorHex?: string | null;
  onCopyDominantColor?: () => void;
  dominantColorCopied?: boolean;
  isExporting?: boolean;
}

export function ExportPanel({
  backgroundImage,
  imageHolder,
  nameHolder,
  selectedTags,
  selectedLanguages,
  canvasWidth,
  canvasHeight,
  onExport,
  onDownloadImage,
  dominantColorHex,
  onCopyDominantColor,
  dominantColorCopied = false,
  isExporting = false,
}: ExportPanelProps) {
  const checks = [
    { ok: !!backgroundImage, label: 'Background uploaded' },
    { ok: selectedTags.length > 0, label: 'Primary category selected' },
    { ok: selectedLanguages.length > 0, label: 'Language selected' },
    {
      ok: imageHolder.x >= 0 && imageHolder.y >= 0 &&
        imageHolder.x + imageHolder.diameter <= canvasWidth &&
        imageHolder.y + imageHolder.diameter <= canvasHeight,
      label: 'Photo in bounds',
    },
    {
      ok: nameHolder.x >= 0 && nameHolder.y >= 0 &&
        nameHolder.x + nameHolder.width <= canvasWidth &&
        nameHolder.y + nameHolder.height <= canvasHeight,
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
        {isExporting ? 'Exporting…' : allValid ? 'Export Template' : 'Complete all checks'}
      </Button>

      {dominantColorHex && onCopyDominantColor && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="h-4 w-4 rounded-sm border border-border/80 shrink-0"
              style={{ backgroundColor: dominantColorHex }}
              aria-label={`Dominant color ${dominantColorHex}`}
            />
            <span className="text-xs font-mono text-foreground/80 truncate">{dominantColorHex}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-[11px] gap-1.5"
            onClick={onCopyDominantColor}
          >
            {dominantColorCopied ? (
              <>
                <Check className="w-3 h-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copy
              </>
            )}
          </Button>
        </div>
      )}

      {backgroundImage && onDownloadImage && (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          onClick={onDownloadImage}
        >
          <ImageDown className="w-3.5 h-3.5" />
          Download rendered image
        </Button>
      )}
    </div>
  );
}
