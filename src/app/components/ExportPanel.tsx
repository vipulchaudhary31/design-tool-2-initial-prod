import { Button } from "@/app/components/ui/button";
import { AlertCircle, Upload, CheckCircle } from "lucide-react";

interface PlaceholderPosition {
  x: number;
  y: number;
}

interface NamePlaceholder extends PlaceholderPosition {
  width: number;
  height: number;
}

interface ImagePlaceholder extends PlaceholderPosition {
  diameter: number;
}

interface ExportPanelProps {
  backgroundImage: string | null;
  imageHolder: ImagePlaceholder;
  nameHolder: NamePlaceholder;
  primaryCategory: string;
  secondaryCategory: string;
  selectedLanguages: string[];
  canvasWidth: number;
  canvasHeight: number;
  onExport: () => void;
}

export function ExportPanel({
  backgroundImage,
  imageHolder,
  nameHolder,
  primaryCategory,
  secondaryCategory,
  selectedLanguages,
  canvasWidth,
  canvasHeight,
  onExport,
}: ExportPanelProps) {
  const validations = {
    hasImage: !!backgroundImage,
    hasPrimaryCategory: !!primaryCategory,
    hasSecondaryCategory: !!secondaryCategory,
    hasLanguages: selectedLanguages.length > 0,
    imageInBounds:
      imageHolder.x >= 0 &&
      imageHolder.y >= 0 &&
      imageHolder.x + imageHolder.diameter <= canvasWidth &&
      imageHolder.y + imageHolder.diameter <= canvasHeight,
    nameInBounds:
      nameHolder.x >= 0 &&
      nameHolder.y >= 0 &&
      nameHolder.x + nameHolder.width <= canvasWidth &&
      nameHolder.y + nameHolder.height <= canvasHeight,
  };

  const allValid = Object.values(validations).every((v) => v);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <ValidationItem
          valid={validations.hasImage}
          label="Background image uploaded"
        />
        <ValidationItem
          valid={validations.hasPrimaryCategory}
          label="Primary category selected"
        />
        <ValidationItem
          valid={validations.hasSecondaryCategory}
          label="Secondary category selected"
        />
        <ValidationItem
          valid={validations.hasLanguages}
          label="Language tags selected"
        />
        <ValidationItem
          valid={validations.imageInBounds}
          label="Photo placeholder in bounds"
        />
        <ValidationItem
          valid={validations.nameInBounds}
          label="Name placeholder in bounds"
        />
      </div>

      <Button
        onClick={onExport}
        disabled={!allValid}
        className={`w-full h-11 font-semibold text-sm transition-all duration-200 ${
          allValid
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-200 hover:shadow-xl'
            : 'bg-gray-300 cursor-not-allowed'
        }`}
      >
        <Upload className="mr-2 h-4 w-4" />
        {allValid ? 'Upload Template' : 'Complete Requirements'}
      </Button>

      {!allValid && (
        <p className="text-xs text-gray-500 text-center bg-gray-50 rounded-lg py-2 px-3">
          ✓ Complete all validations above to proceed
        </p>
      )}

      {allValid && (
        <p className="text-xs text-green-700 text-center bg-green-50 rounded-lg py-2 px-3 font-medium">
          ✓ Ready to upload template
        </p>
      )}
    </div>
  );
}

function ValidationItem({
  valid,
  label,
}: {
  valid: boolean;
  label: string;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 p-2.5 rounded-lg transition-all ${
        valid ? 'bg-green-50' : 'bg-gray-50'
      }`}
    >
      {valid ? (
        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
      )}
      <span
        className={`text-xs font-medium ${
          valid ? 'text-green-900' : 'text-gray-500'
        }`}
      >
        {label}
      </span>
    </div>
  );
}