import { AlertCircle, CheckCircle2, Download } from 'lucide-react';
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
      <Button onClick={onExport} disabled={!allValid} className="w-full gap-2" size="sm">
        <Download className="w-3.5 h-3.5" />
        {allValid ? 'Export Template' : 'Complete all checks'}
      </Button>
    </div>
  );
}
