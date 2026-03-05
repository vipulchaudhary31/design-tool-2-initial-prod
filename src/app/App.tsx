// Local placeholders (figma:asset imports replaced for running outside Figma)
// Use BASE_URL so assets work on GitHub Pages (e.g. /Lokalposterstudio/)
const baseUrl = import.meta.env.BASE_URL;
const image_c92d52e8598ae346d604fac2120bd87eab98c2a9 = `${baseUrl}placeholder-logo.png`;
const samplePhotoBg = `${baseUrl}placeholder-sample-bg.png`;
const samplePhotoNoBg = `${baseUrl}placeholder-sample-nobg.png`;
import { useState, useEffect, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { ImageUploader } from '@/app/components/ImageUploader';
import { DesignCanvas } from '@/app/components/DesignCanvas';
import { TagSelector } from '@/app/components/TagSelector';
import { TextStyleEditor, type TextStyle, textShadowToRN, textStrokeToRNShadows, normalizeHex } from '@/app/components/TextStyleEditor';
import { ExportPanel } from '@/app/components/ExportPanel';
import { Toaster } from '@/app/components/ui/sonner';
import { toast } from 'sonner';
import { Button } from '@/app/components/ui/button';
import { Separator } from '@/app/components/ui/separator';
import { Slider } from '@/app/components/ui/slider';
import { Switch } from '@/app/components/ui/switch';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/app/components/ui/collapsible';
import { LsdEasterEgg, LsdCredit } from '@/app/components/LsdEasterEgg';
import type { CompactTemplateJSON } from '@/templateSchema';
import Login from '@/app/Login';
import lokalLogo from "@/assets/c54dfe46038c59054ed3c72dcf43d44ef653d78a.png";
import {
  Upload, Tags, Download, User, Circle, Square,
  ChevronRight, ImageIcon, X, Palette, Sun, Moon,
  SlidersHorizontal,
} from 'lucide-react';

interface ImagePlaceholder {
  x: number;
  y: number;
  diameter: number;
}

interface NamePlaceholder {
  x: number;
  y: number;
  width: number;
  height: number;
}

const CANVAS_WIDTH = 1080;

const ALLOWED_CANVAS_SIZES = [
  { height: 1152, label: '1080 x 1152' },
  { height: 1350, label: '1080 x 1350' },
  { height: 1484, label: '1080 x 1484' },
  { height: 1620, label: '1080 x 1620' },
];

function computeAspectRatioString(width: number, height: number): string {
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const d = gcd(width, height);
  const sw = width / d;
  const sh = height / d;
  if (sw <= 50 && sh <= 50) return `${sw}:${sh}`;
  const ratio = width / height;
  const commonRatios: [number, string][] = [
    [1, '1:1'], [4/3, '4:3'], [3/4, '3:4'],
    [16/9, '16:9'], [9/16, '9:16'],
    [3/2, '3:2'], [2/3, '2:3'],
  ];
  for (const [r, label] of commonRatios) {
    if (Math.abs(ratio - r) < 0.02) return label;
  }
  return `${sw}:${sh}`;
}

// Tags list trimmed to the approved sheet:
// - Sheet "Profile" → UI "Self"
// - Sheet "Upload"  → UI "Wishes"
const PROFILE_TAGS = [
  'Health',
  'Good Night',
  'Devotional',
  'Good Morning',
  'Life',
  'Sad',
  'Love',
  'Parents',
  'Motivation',
  'Money',
  'Friendship',
  'Personalities',
  'Events',
];

const UPLOAD_TAGS = ['Birthday', 'Anniversary'];

const LANGUAGE_TAGS = [
  'Bengali','English','Gujarati','Hindi','Kannada','Malayalam','Marathi','Punjabi','Tamil','Telugu'
];

/* ── Collapsible panel section ─────────────────────────────────────── */
function PanelSection({ title, icon, children, defaultOpen = true, badge }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-secondary/50 transition-colors group">
          <span className="text-muted-foreground" style={{ position: 'relative', top: '-0.5px' }}>{icon}</span>
          <span className="text-[13px] tracking-wide text-foreground flex-1">{title}</span>
          {badge}
          <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-[16px] pt-1 pb-4">{children}</div>
      </CollapsibleContent>
      <Separator />
    </Collapsible>
  );
}

/* ── Color swatch with picker ──────────────────────────────────────── */
function ColorPicker({ value, onChange, onBlur, fallback = '#FFFFFF' }: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  fallback?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="relative cursor-pointer shrink-0">
        <input
          type="color"
          value={value.length === 7 ? value : fallback}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className="w-8 h-8 rounded-md border border-border shadow-sm cursor-pointer hover:ring-2 hover:ring-ring/30 transition-shadow"
          style={{ backgroundColor: value.length >= 4 ? value : fallback }}
        />
      </label>
      <Input
        value={value}
        onChange={(e) => {
          const val = e.target.value;
          if (/^#[0-9a-fA-F]{0,6}$/.test(val) || val === '') {
            onChange(val || fallback);
          }
        }}
        onBlur={onBlur}
        className="flex-1 font-mono uppercase h-8 text-xs"
      />
    </div>
  );
}

export default function App() {
  /* ================= AUTH ================= */
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  /* ================= DESIGN STATE ================= */
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isProfileTemplate, setIsProfileTemplate] = useState<boolean>(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [userName, setUserName] = useState<string>('Srinivasalu Reddy');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [photoShape, setPhotoShape] = useState<'circle' | 'square'>('circle');
  const [photoCornerRadius, setPhotoCornerRadius] = useState<number>(16);
  const [photoHasBackground, setPhotoHasBackground] = useState<boolean>(false);
  const [photoStrokeWidth, setPhotoStrokeWidth] = useState<number>(0);
  const [photoStrokeColor, setPhotoStrokeColor] = useState<string>('#FFFFFF');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  /* ── Set page title & favicon ── */
  useEffect(() => {
    document.title = 'Posters Studio';
    const existingFavicon = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    if (existingFavicon) {
      existingFavicon.href = image_c92d52e8598ae346d604fac2120bd87eab98c2a9;
    } else {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = image_c92d52e8598ae346d604fac2120bd87eab98c2a9;
      document.head.appendChild(link);
    }
  }, []);

  /* ── Easter egg: 5 rapid logo clicks ── */
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const logoClickTimestamps = useRef<number[]>([]);

  const handleLogoClick = useCallback(() => {
    const now = Date.now();
    logoClickTimestamps.current = [...logoClickTimestamps.current.filter(t => now - t < 2000), now];
    if (logoClickTimestamps.current.length >= 5) {
      logoClickTimestamps.current = [];
      setShowEasterEgg(true);
    }
  }, []);

  const themeToggleRef = useRef<HTMLButtonElement>(null);

  const toggleTheme = useCallback(() => {
    const btn = themeToggleRef.current;

    // Fallback: no View Transitions API support
    if (!btn || !document.startViewTransition) {
      setIsDarkMode(prev => !prev);
      return;
    }

    // Get the center of the button for the circle origin
    const rect = btn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Max radius to cover the entire viewport from that point
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    // Start the view transition — flushSync ensures React updates the DOM synchronously
    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setIsDarkMode(prev => !prev);
      });
    });

    // Animate the new snapshot with an expanding circle clip-path
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
  }, []);

  const [textStyle, setTextStyle] = useState<TextStyle>({
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: 700,
    letterSpacing: 0,
    textShadow: { offsetX: 0, offsetY: 0, blur: 0, color: '#000000', opacity: 0 },
    textStroke: { width: 0, color: '#000000' },
    textAlignment: 'center',
    maxWidthPercent: 80,
  });

  const canvasHeight = imageDimensions
    ? Math.round((CANVAS_WIDTH / imageDimensions.width) * imageDimensions.height)
    : 1350;
  const aspectRatioString = imageDimensions
    ? computeAspectRatioString(imageDimensions.width, imageDimensions.height)
    : '';

  const handleImageUpload = (imageUrl: string, type: 'image' | 'video') => {
    const validateAndSet = (srcWidth: number, srcHeight: number, mt: 'image' | 'video') => {
      const normalizedHeight = Math.round((CANVAS_WIDTH / srcWidth) * srcHeight);
      const matched = ALLOWED_CANVAS_SIZES.find(
        size => Math.abs(normalizedHeight - size.height) <= 5
      );
      if (!matched) {
        toast.error('Unsupported aspect ratio', {
          description: `Accepted: ${ALLOWED_CANVAS_SIZES.map(s => s.label).join(', ')}`,
        });
        return;
      }
      setImageDimensions({ width: CANVAS_WIDTH, height: matched.height });
      setBackgroundImage(imageUrl);
      setMediaType(mt);
    };
    if (type === 'video') {
      const video = document.createElement('video');
      video.onloadedmetadata = () => validateAndSet(video.videoWidth, video.videoHeight, 'video');
      video.src = imageUrl;
    } else {
      const img = new window.Image();
      img.onload = () => validateAndSet(img.naturalWidth, img.naturalHeight, 'image');
      img.src = imageUrl;
    }
  };

  const availableTags = isProfileTemplate ? PROFILE_TAGS : UPLOAD_TAGS;

  useEffect(() => { setSelectedTags([]); }, [isProfileTemplate]);

  const [imageHolder, setImageHolder] = useState<ImagePlaceholder>({
    x: (CANVAS_WIDTH - 300) / 2, y: 200, diameter: 300,
  });

  const [nameHolder, setNameHolder] = useState<NamePlaceholder>({
    x: (CANVAS_WIDTH - Math.round(CANVAS_WIDTH * 0.8)) / 2,
    y: 550,
    width: Math.round(CANVAS_WIDTH * 0.8),
    height: 72, // default fontSize (48) + 24px padding
  });

  useEffect(() => {
    setImageHolder(prev => {
      const maxY = canvasHeight - prev.diameter;
      return prev.y > maxY ? { ...prev, y: Math.max(0, maxY) } : prev;
    });
    setNameHolder(prev => {
      const maxY = canvasHeight - prev.height;
      const maxX = CANVAS_WIDTH - prev.width;
      const nextY = prev.y > maxY ? Math.max(0, maxY) : prev.y;
      const nextX = Math.max(0, Math.min(maxX, prev.x));
      return (prev.y !== nextY || prev.x !== nextX) ? { ...prev, x: nextX, y: nextY } : prev;
    });
  }, [aspectRatioString, canvasHeight]);

  // Height auto-tracks font size (grows AND shrinks like Figma auto-height).
  // Formula: fontSize × lineHeight(1) + 24px padding (12 top + 12 bottom), capped at 12% canvas height.
  useEffect(() => {
    const autoH = Math.min(textStyle.fontSize + 24, Math.round(canvasHeight * 0.12));
    setNameHolder(prev => prev.height !== autoH ? { ...prev, height: autoH } : prev);
  }, [textStyle.fontSize, canvasHeight]);

  const handleExport = () => {
    if (selectedTags.length === 0) {
      toast.error('Select at least 1 primary category.', { description: 'Pick a Self/Wishes tag before exporting.' });
      return;
    }
    if (selectedLanguages.length === 0) {
      toast.error('Select at least 1 language.', { description: 'Pick a language before exporting.' });
      return;
    }

    const safeTextColor = normalizeHex(textStyle.color, '#FFFFFF');
    const safeStrokeColor = normalizeHex(textStyle.textStroke.color, '#000000');
    const safeShadowColor = normalizeHex(textStyle.textShadow.color, '#000000');
    const safePhotoStrokeColor = normalizeHex(photoStrokeColor, '#FFFFFF');
    const safeShadow = { ...textStyle.textShadow, color: safeShadowColor };
    const safeStroke = { ...textStyle.textStroke, color: safeStrokeColor };

    const payload: CompactTemplateJSON = {
      ar: aspectRatioString,
      t: isProfileTemplate,
      pc: selectedTags,
      lg: selectedLanguages,
      bg: backgroundImage,
      mt: mediaType,
      ip: {
        x: Math.round((imageHolder.x / CANVAS_WIDTH) * 100),
        y: Math.round((imageHolder.y / canvasHeight) * 100),
        d: Math.round((imageHolder.diameter / CANVAS_WIDTH) * 100),
        sh: photoShape,
        ...(photoShape === 'square' ? { cr: photoCornerRadius } : {}),
        hb: photoHasBackground,
        sw: photoStrokeWidth,
        sc: safePhotoStrokeColor,
      },
      np: {
        x: Math.round((nameHolder.x / CANVAS_WIDTH) * 100),
        y: Math.round((nameHolder.y / canvasHeight) * 100),
        w: Math.round((nameHolder.width / CANVAS_WIDTH) * 100),
        h: Math.round((nameHolder.height / canvasHeight) * 100),
        st: {
          ts: {
            c: safeTextColor,
            fs: textStyle.fontSize,
            fw: textStyle.fontWeight,
            ls: textStyle.letterSpacing,
            sh: (safeShadow.offsetX === 0
              && safeShadow.offsetY === 0
              && safeShadow.blur === 0
              && safeShadow.opacity === 0)
              ? null
              : {
                  ox: safeShadow.offsetX,
                  oy: safeShadow.offsetY,
                  bl: safeShadow.blur,
                  col: safeShadow.color,
                  op: safeShadow.opacity / 100,
                },
            st: {
              w: safeStroke.width,
              col: safeStroke.color,
            },
            ta: textStyle.textAlignment,
          },
        },
      },
    };

    console.log('Export Payload (compact):', payload);
    const jsonString = JSON.stringify(payload); // minified JSON (no whitespace)
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.download = `template-${ts}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success('Template exported!', { description: 'JSON saved to your device.' });
  };

  const currentStep = !backgroundImage
    ? 1
    : (selectedTags.length === 0 || selectedLanguages.length === 0)
      ? 2
      : 3;

  const steps = [
    { n: 1, label: 'Upload', icon: Upload },
    { n: 2, label: 'Tags', icon: Tags },
    { n: 3, label: 'Export', icon: Download },
  ];

  /* ================= LOGIN GATE ================= */
  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  /* ================= UI ================= */
  return (
    <div className={`${isDarkMode ? 'dark' : ''} h-screen flex flex-col bg-background text-foreground overflow-hidden`}>
      {/* ═══ Header ═══ */}
      <header className="h-12 shrink-0 flex items-center justify-between bg-card border-b border-border z-50 px-[16px] py-[0px]">
        <div className="flex items-center gap-2.5">
          <img src={lokalLogo} alt="Lokal" className="h-7 w-7 rounded-md cursor-pointer select-none" onClick={handleLogoClick} />
          <span className="text-sm text-foreground tracking-tight">Posters Studio</span>
        </div>

        <nav className="flex items-center gap-0.5">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const done = currentStep > s.n;
            const active = currentStep === s.n;
            return (
              <div key={s.n} className="flex items-center">
                {i > 0 && <div className={`w-5 h-px mx-1 ${done ? 'bg-primary/50' : 'bg-border'}`} />}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${
                  active ? 'bg-primary/15 text-primary' : done ? 'text-primary/50' : 'text-muted-foreground'
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                  <span>{s.label}</span>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {imageDimensions && (
            <span className="text-xs font-mono text-muted-foreground">
              {imageDimensions.width} x {imageDimensions.height} ({aspectRatioString})
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={toggleTheme}
            ref={themeToggleRef}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <button
            onClick={() => setIsLoggedIn(false)}
            className="text-sm font-semibold text-red-600"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ═══ Body ═══ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Panel ── */}
        <aside className="w-[272px] shrink-0 bg-card border-r border-border flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <PanelSection title="Background" icon={<ImageIcon className="w-3.5 h-3.5" />}>
              <ImageUploader
                onImageUpload={handleImageUpload}
                hasImage={!!backgroundImage}
                mediaType={mediaType}
              />
              {!backgroundImage && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {ALLOWED_CANVAS_SIZES.map(size => (
                    <span key={size.height} className="text-[10px] font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                      {size.label}
                    </span>
                  ))}
                </div>
              )}
            </PanelSection>

            <PanelSection
              title="Categories"
              icon={<Tags className="w-3.5 h-3.5" />}
              badge={selectedTags.length > 0 ? (
                <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full leading-none">{selectedTags.length}</span>
              ) : undefined}
            >
              <div className="space-y-4">
                {/* Template type segmented */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2">Template Type</Label>
                  <div className="flex bg-secondary rounded-md p-0.5">
                    <button
                      onClick={() => setIsProfileTemplate(true)}
                      className={`flex-1 text-xs py-1.5 rounded-sm transition-all ${
                        isProfileTemplate ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >Self</button>
                    <button
                      onClick={() => setIsProfileTemplate(false)}
                      className={`flex-1 text-xs py-1.5 rounded-sm transition-all ${
                        !isProfileTemplate ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >Wishes</button>
                  </div>
                </div>

                <TagSelector
                  title={`${isProfileTemplate ? 'Self' : 'Wishes'} Tags`}
                  availableTags={availableTags}
                  selectedTags={selectedTags}
                  onTagsChange={setSelectedTags}
                  required
                />

                <Separator />

                <TagSelector
                  title="Language"
                  availableTags={LANGUAGE_TAGS}
                  selectedTags={selectedLanguages}
                  onTagsChange={setSelectedLanguages}
                  required
                />
              </div>
            </PanelSection>

            <PanelSection title="Export" icon={<Download className="w-3.5 h-3.5" />}>
              <ExportPanel
                backgroundImage={backgroundImage}
                imageHolder={imageHolder}
                nameHolder={nameHolder}
                isProfileTemplate={isProfileTemplate}
                selectedTags={selectedTags}
                selectedLanguages={selectedLanguages}
                canvasWidth={CANVAS_WIDTH}
                canvasHeight={canvasHeight}
                onExport={handleExport}
              />
            </PanelSection>
          </div>
          <LsdCredit onClick={() => setShowEasterEgg(true)} />
        </aside>

        {/* ── Center Canvas ── */}
        <main className="flex-1 flex items-center justify-center bg-background overflow-hidden p-6">
          <DesignCanvas
            backgroundImage={backgroundImage}
            imageHolder={imageHolder}
            nameHolder={nameHolder}
            onImageHolderChange={setImageHolder}
            onNameHolderChange={setNameHolder}
            canvasWidth={CANVAS_WIDTH}
            canvasHeight={canvasHeight}
            aspectRatio={aspectRatioString}
            userName={userName}
            fontSize={textStyle.fontSize}
            fontWeight={textStyle.fontWeight}
            textColor={textStyle.color}
            textShadow={textStyle.textShadow}
            textStroke={textStyle.textStroke}
            userPhoto={userPhoto}
            samplePhoto={photoHasBackground ? samplePhotoBg : samplePhotoNoBg}
            photoHasBackground={photoHasBackground}
            mediaType={mediaType}
            textAlignment={textStyle.textAlignment}
            letterSpacing={textStyle.letterSpacing}
            photoShape={photoShape}
            photoCornerRadius={photoCornerRadius}
            photoStrokeWidth={photoStrokeWidth}
            photoStrokeColor={photoStrokeColor}
            onImageUpload={handleImageUpload}
            allowedCanvasSizes={ALLOWED_CANVAS_SIZES}
          />
        </main>

        {/* ── Right Panel ── */}
        <aside className="w-[288px] shrink-0 bg-card border-l border-border flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {backgroundImage ? (
              <>
                <PanelSection title="User Photo" icon={<User className="w-3.5 h-3.5" />}>
                  <div className="space-y-4">
                    {/* Background toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs text-foreground/80">User Background</Label>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Show profile bg</p>
                      </div>
                      <Switch
                        checked={photoHasBackground}
                        onCheckedChange={setPhotoHasBackground}
                      />
                    </div>

                    {/* Stroke */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs text-muted-foreground">Stroke Width</Label>
                        <span className="text-[11px] font-mono text-muted-foreground">{photoStrokeWidth}px</span>
                      </div>
                      <Slider
                        min={0} max={10} step={0.5}
                        value={[photoStrokeWidth]}
                        onValueChange={([v]) => setPhotoStrokeWidth(v)}
                      />
                    </div>
                    {photoStrokeWidth > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground mb-2">Stroke Color</Label>
                        <ColorPicker
                          value={photoStrokeColor}
                          onChange={setPhotoStrokeColor}
                          onBlur={() => setPhotoStrokeColor(normalizeHex(photoStrokeColor, '#FFFFFF'))}
                          fallback="#FFFFFF"
                        />
                      </div>
                    )}

                    {/* Shape */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2">Shape</Label>
                      <div className="flex gap-1.5">
                        <Button
                          variant={photoShape === 'circle' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1 gap-1.5 text-xs"
                          onClick={() => setPhotoShape('circle')}
                        >
                          <Circle className="w-3 h-3" /> Circle
                        </Button>
                        <Button
                          variant={photoShape === 'square' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1 gap-1.5 text-xs"
                          onClick={() => setPhotoShape('square')}
                        >
                          <Square className="w-3 h-3" /> Square
                        </Button>
                      </div>
                    </div>

                    {/* Corner radius */}
                    {photoShape === 'square' && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs text-muted-foreground">Corner Radius</Label>
                          <span className="text-[11px] font-mono text-muted-foreground">{photoCornerRadius}</span>
                        </div>
                        <Slider
                          min={0} max={50} step={1}
                          value={[photoCornerRadius]}
                          onValueChange={([v]) => setPhotoCornerRadius(v)}
                        />
                      </div>
                    )}

                    {/* Test photo — at the bottom, low prominence */}
                    <Separator />
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer shrink-0">
                        <input
                          type="file" accept="image/*" className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => setUserPhoto(ev.target?.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        {userPhoto ? (
                          <img src={userPhoto} alt="Test" className="w-8 h-8 rounded-md object-cover border border-border hover:ring-2 hover:ring-ring/30 transition-shadow" />
                        ) : (
                          <div className="w-8 h-8 rounded-md border border-dashed border-border flex items-center justify-center hover:border-primary/50 transition-colors">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                        )}
                      </label>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] text-muted-foreground">{userPhoto ? 'Test photo loaded' : 'No test photo'}</span>
                      </div>
                      {userPhoto && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => setUserPhoto(null)}>
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </PanelSection>

                <PanelSection title="Text Style" icon={<Palette className="w-3.5 h-3.5" />}>
                  <TextStyleEditor
                    textStyle={textStyle}
                    onChange={setTextStyle}
                    userName={userName}
                    onUserNameChange={setUserName}
                  />
                </PanelSection>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-8 py-12">
                <SlidersHorizontal className="w-5 h-5 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">Upload a background to access design controls</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      <Toaster richColors position="bottom-center" />
      <LsdEasterEgg open={showEasterEgg} onClose={() => setShowEasterEgg(false)} />
    </div>
  );
}