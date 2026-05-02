// Local placeholders (figma:asset imports replaced for running outside Figma)
// Use BASE_URL so assets work on GitHub Pages (e.g. /Lokalposterstudio/)
const baseUrl = import.meta.env.BASE_URL;
const image_c92d52e8598ae346d604fac2120bd87eab98c2a9 = `${baseUrl}placeholder-logo.png`;
const samplePhotoBg = `${baseUrl}assets/sample-photo-bg.png`;
const samplePhotoNoBg = `${baseUrl}assets/sample-photo-nobg.png`;
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { ImageUploader } from '@/app/components/ImageUploader';
import { ThemeToggle } from '@/app/components/ThemeToggle';
import { DesignCanvas } from '@/app/components/DesignCanvas';
import { TagSelector } from '@/app/components/TagSelector';
import {
  TextStyleEditor,
  type TextStyle,
  hexToRgba,
  textStrokeToRNShadows,
  normalizeHex,
  computeNamePlaceholderAutoHeight,
  measureLineHeight,
  getNameFontFamilyForLabel,
} from '@/app/components/TextStyleEditor';
import { ExportPanel } from '@/app/components/ExportPanel';
import { getColor } from 'colorthief';
import { Toaster } from '@/app/components/ui/sonner';
import { toast } from 'sonner';
import { Button } from '@/app/components/ui/button';
import { Separator } from '@/app/components/ui/separator';
import { Slider } from '@/app/components/ui/slider';
import { Switch } from '@/app/components/ui/switch';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/app/components/ui/collapsible';
import { Alert, AlertTitle, AlertDescription } from '@/app/components/ui/alert';
import { LsdEasterEgg, LsdCredit } from '@/app/components/LsdEasterEgg';
import type { CompactTemplateJSON } from '@/templateSchema';
import Login from '@/app/Login';
import { getToken, clearToken } from '@/api/client';
import { getLanguages } from '@/api/languages/languages';
import { getCategories } from '@/api/categories/categories';
import { getPresignedUrl } from '@/api/get-presigned-url/getUploadUrl';
import { uploadImage } from '@/api/upload-image/uploadImage';
import { createPosterTemplate } from '@/api/create-poster-template/createPosterTemplate';
import { extensionForRasterContentType, normalizeRasterUploadContentType } from '@/utils/isRasterBackgroundFile';
import {
  loadPosterStudioSession,
  savePosterStudioSession,
  clearPosterStudioSession,
  type PosterStudioSessionPayload,
} from '@/utils/posterStudioSession';
import lokalLogo from "@/assets/c54dfe46038c59054ed3c72dcf43d44ef653d78a.png";
import {
  Upload, Tags, Download, User, Circle, Square,
  ChevronRight, ImageIcon, X, Palette,
  SlidersHorizontal, AlertCircle, LogOut, Loader2,
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

/** Keep splash visible this long after all boot checks pass (smooth handoff). */
const MIN_STUDIO_SPLASH_MS = 550;

function isVideoBackgroundUrl(url: string): boolean {
  if (/^data:video\//i.test(url)) return true;
  return /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(url);
}

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

const DEFAULT_TEXT_STYLE: TextStyle = {
  color: '#FFFFFF',
  fontSize: 48,
  fontWeight: 700,
  letterSpacing: 0,
  textShadow: { offsetX: 0, offsetY: 0, blur: 0, color: '#000000', opacity: 0 },
  textStroke: { width: 0, color: '#000000' },
  textAlignment: 'center',
  maxWidthPercent: 80,
};

function defaultImageHolder(): ImagePlaceholder {
  return {
    x: (CANVAS_WIDTH - 300) / 2,
    y: 200,
    diameter: 300,
  };
}

function defaultNameHolder(): NamePlaceholder {
  return {
    x: (CANVAS_WIDTH - Math.round(CANVAS_WIDTH * 0.8)) / 2,
    y: 550,
    width: Math.round(CANVAS_WIDTH * 0.8),
    height: 72,
  };
}

function applyPosterSnapshot(
  snap: PosterStudioSessionPayload,
  apply: {
    setBackgroundImage: (v: string | null) => void;
    setImageDimensions: Dispatch<SetStateAction<{ width: number; height: number } | null>>;
    setIsProfileTemplate: (v: boolean) => void;
    setSelectedTags: (v: string[]) => void;
    setSelectedLanguages: (v: string[]) => void;
    setUserName: (v: string) => void;
    setUserPhoto: (v: string | null) => void;
    setPhotoShape: (v: 'circle' | 'square') => void;
    setPhotoCornerRadius: (v: number) => void;
    setPhotoHasBackground: (v: boolean) => void;
    setPhotoStrokeWidth: (v: number) => void;
    setPhotoStrokeColor: (v: string) => void;
    setIsDarkMode: (v: boolean) => void;
    setTextStyle: Dispatch<SetStateAction<TextStyle>>;
    setImageHolder: Dispatch<SetStateAction<ImagePlaceholder>>;
    setNameHolder: Dispatch<SetStateAction<NamePlaceholder>>;
  },
) {
  apply.setBackgroundImage(snap.backgroundImage);
  apply.setImageDimensions(snap.imageDimensions);
  apply.setIsProfileTemplate(snap.isProfileTemplate);
  apply.setSelectedTags([...snap.selectedTags]);
  apply.setSelectedLanguages([...snap.selectedLanguages]);
  apply.setUserName(snap.userName);
  apply.setUserPhoto(snap.userPhoto);
  apply.setPhotoShape(snap.photoShape);
  apply.setPhotoCornerRadius(snap.photoCornerRadius);
  apply.setPhotoHasBackground(snap.photoHasBackground);
  apply.setPhotoStrokeWidth(snap.photoStrokeWidth);
  apply.setPhotoStrokeColor(snap.photoStrokeColor);
  apply.setIsDarkMode(snap.isDarkMode);
  apply.setTextStyle(snap.textStyle);
  apply.setImageHolder(snap.imageHolder);
  apply.setNameHolder(snap.nameHolder);
}

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
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!getToken());
  // Fallback test data used when backend is unreachable
  const TEST_PROFILE_TAGS  = ['Self', 'Good Morning', 'Birthday', 'Motivational', 'Festival'];
  const TEST_UPLOAD_TAGS   = ['Wishes', 'Anniversary', 'New Year', 'Quotes', 'Diwali'];
  const TEST_LANGUAGE_TAGS = ['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada'];

  const [profileTags,  setProfileTags]  = useState<string[]>([]);
  const [uploadTags,   setUploadTags]   = useState<string[]>([]);
  const [languageTags, setLanguageTags] = useState<string[]>([]);
  const [languagesError,   setLanguagesError]   = useState(false);
  const [categoriesError,  setCategoriesError]  = useState(false);
  const [isExporting,      setIsExporting]      = useState(false);
  const [persistReady, setPersistReady]       = useState(false);
  const [splashDismissed, setSplashDismissed] = useState(false);
  const [catalogReady, setCatalogReady]     = useState(false);
  const [fontsReady, setFontsReady]         = useState(false);
  const [backgroundGateReady, setBackgroundGateReady] = useState(true);
  const quotaWarningShownRef = useRef(false);

  async function fetchLanguages() {
    setLanguagesError(false);
    try {
      const langs = await getLanguages();
      setLanguageTags(langs);
    } catch {
      // Backend unreachable — load test data so the export workflow is unblocked
      setLanguageTags(TEST_LANGUAGE_TAGS);
    }
  }

  async function fetchCategories() {
    setCategoriesError(false);
    try {
      const cats = await getCategories();
      setProfileTags(cats.filter(c => c.is_active &&  c.use_profile_pic).map(c => c.name));
      setUploadTags (cats.filter(c => c.is_active && !c.use_profile_pic).map(c => c.name));
    } catch {
      // Backend unreachable — load test data so the export workflow is unblocked
      setProfileTags(TEST_PROFILE_TAGS);
      setUploadTags(TEST_UPLOAD_TAGS);
    }
  }

  /* ================= DESIGN STATE ================= */
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
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

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const [dominantColorHex, setDominantColorHex] = useState<string | null>(null);
  const [dominantColorCopied, setDominantColorCopied] = useState<boolean>(false);
  const nameFontFamily = getNameFontFamilyForLabel(userName);

  /* ── Fetch tag data whenever logged in; splash waits until both finish ── */
  useEffect(() => {
    if (!isLoggedIn) {
      setCatalogReady(false);
      return;
    }
    let cancelled = false;
    setCatalogReady(false);
    void (async () => {
      await Promise.all([fetchLanguages(), fetchCategories()]);
      if (!cancelled) setCatalogReady(true);
    })();
    return () => { cancelled = true; };
  }, [isLoggedIn]);

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

  const [textStyle, setTextStyle] = useState<TextStyle>({ ...DEFAULT_TEXT_STYLE });

  const canvasHeight = imageDimensions
    ? Math.round((CANVAS_WIDTH / imageDimensions.width) * imageDimensions.height)
    : 1350;
  const aspectRatioString = imageDimensions
    ? computeAspectRatioString(imageDimensions.width, imageDimensions.height)
    : '';

  const handleImageUpload = (imageUrl: string) => {
    const validateAndSet = (srcWidth: number, srcHeight: number) => {
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
    };
    const img = new window.Image();
    img.onload = () => validateAndSet(img.naturalWidth, img.naturalHeight);
    img.src = imageUrl;
  };

  const availableTags = isProfileTemplate ? profileTags : uploadTags;

  const prevIsProfileTemplate = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (prevIsProfileTemplate.current === undefined) {
      prevIsProfileTemplate.current = isProfileTemplate;
      return;
    }
    if (prevIsProfileTemplate.current !== isProfileTemplate) {
      setSelectedTags([]);
    }
    prevIsProfileTemplate.current = isProfileTemplate;
  }, [isProfileTemplate]);

  useEffect(() => {
    let cancelled = false;
    const extractDominant = async () => {
      if (!backgroundImage) {
        setDominantColorHex(null);
        return;
      }
      try {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Could not load image for color extraction.'));
          img.src = backgroundImage;
        });
        const color = await getColor(img, { quality: 10, ignoreWhite: false });
        const hex = color?.hex?.()?.toUpperCase?.() ?? null;
        if (!cancelled) setDominantColorHex(hex);
      } catch {
        if (!cancelled) setDominantColorHex(null);
      }
    };
    extractDominant();
    return () => { cancelled = true; };
  }, [backgroundImage]);

  const [imageHolder, setImageHolder] = useState<ImagePlaceholder>(() => defaultImageHolder());

  const [nameHolder, setNameHolder] = useState<NamePlaceholder>(() => defaultNameHolder());

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

  /* ── Hydrate workspace from localStorage after login ── */
  useEffect(() => {
    if (!isLoggedIn) {
      setPersistReady(false);
      return;
    }
    const snap = loadPosterStudioSession();
    if (!snap) {
      setPersistReady(true);
      return;
    }
    applyPosterSnapshot(snap, {
      setBackgroundImage,
      setImageDimensions,
      setIsProfileTemplate,
      setSelectedTags,
      setSelectedLanguages,
      setUserName,
      setUserPhoto,
      setPhotoShape,
      setPhotoCornerRadius,
      setPhotoHasBackground,
      setPhotoStrokeWidth,
      setPhotoStrokeColor,
      setIsDarkMode,
      setTextStyle,
      setImageHolder,
      setNameHolder,
    });
    setPersistReady(true);
  }, [isLoggedIn]);

  /* ── Fonts: splash waits until webfonts needed by the canvas can render ── */
  useEffect(() => {
    if (!isLoggedIn) {
      setFontsReady(false);
      return;
    }
    let cancelled = false;
    setFontsReady(false);
    const ready =
      typeof document !== 'undefined' && document.fonts && typeof document.fonts.ready !== 'undefined'
        ? document.fonts.ready
        : Promise.resolve();
    void ready.then(() => {
      if (!cancelled) setFontsReady(true);
    });
    return () => { cancelled = true; };
  }, [isLoggedIn]);

  /* ── Background raster/video: wait for first paint decode until splash dismisses ── */
  useEffect(() => {
    if (!isLoggedIn) {
      setBackgroundGateReady(true);
      return;
    }
    if (splashDismissed) {
      setBackgroundGateReady(true);
      return;
    }
    if (!backgroundImage) {
      setBackgroundGateReady(true);
      return;
    }
    setBackgroundGateReady(false);
    let cancelled = false;
    const url = backgroundImage;
    const done = () => {
      if (!cancelled) setBackgroundGateReady(true);
    };

    if (isVideoBackgroundUrl(url)) {
      const v = document.createElement('video');
      v.preload = 'auto';
      v.muted = true;
      v.playsInline = true;
      v.src = url;
      v.addEventListener('loadeddata', done, { once: true });
      v.addEventListener('error', done, { once: true });
      try {
        v.load();
      } catch {
        done();
      }
    } else {
      const img = new Image();
      img.onload = done;
      img.onerror = done;
      img.src = url;
    }

    return () => { cancelled = true; };
  }, [isLoggedIn, backgroundImage, splashDismissed]);

  const studioBootReady =
    persistReady &&
    catalogReady &&
    fontsReady &&
    backgroundGateReady;

  useEffect(() => {
    if (!isLoggedIn) {
      setSplashDismissed(false);
      return;
    }
    if (!studioBootReady) return;
    const id = window.setTimeout(() => setSplashDismissed(true), MIN_STUDIO_SPLASH_MS);
    return () => window.clearTimeout(id);
  }, [isLoggedIn, studioBootReady]);

  const showStudioSplash = isLoggedIn && (!studioBootReady || !splashDismissed);

  /* ── Persist workspace debounced ── */
  useEffect(() => {
    if (!isLoggedIn || !persistReady) return;
    const timer = window.setTimeout(() => {
      const saved = savePosterStudioSession({
        v: 1,
        backgroundImage,
        imageDimensions,
        isProfileTemplate,
        selectedTags,
        selectedLanguages,
        userName,
        userPhoto,
        photoShape,
        photoCornerRadius,
        photoHasBackground,
        photoStrokeWidth,
        photoStrokeColor,
        isDarkMode,
        textStyle,
        imageHolder,
        nameHolder,
      });
      if (!saved && !quotaWarningShownRef.current) {
        quotaWarningShownRef.current = true;
        toast.warning('Could not autosave workspace', {
          description: 'The design may be too large for browser storage. Try a smaller background image.',
        });
      }
    }, 520);
    return () => window.clearTimeout(timer);
  }, [
    isLoggedIn,
    persistReady,
    backgroundImage,
    imageDimensions,
    isProfileTemplate,
    selectedTags,
    selectedLanguages,
    userName,
    userPhoto,
    photoShape,
    photoCornerRadius,
    photoHasBackground,
    photoStrokeWidth,
    photoStrokeColor,
    isDarkMode,
    textStyle,
    imageHolder,
    nameHolder,
  ]);

  // Height auto-tracks actual rendered font height (measured via DOM after fonts load).
  // Reacts to font size, weight, stroke, shadow, and canvas height.
  useEffect(() => {
    let cancelled = false;
    measureLineHeight(textStyle.fontSize, textStyle.fontWeight, nameFontFamily).then((lineH) => {
      if (cancelled) return;
      const autoH = computeNamePlaceholderAutoHeight(
        lineH,
        textStyle.textStroke,
        textStyle.textShadow,
        canvasHeight,
      );
      setNameHolder(prev => prev.height !== autoH ? { ...prev, height: autoH } : prev);
    });
    return () => { cancelled = true; };
  }, [textStyle.fontSize, textStyle.fontWeight, textStyle.textStroke, textStyle.textShadow, canvasHeight, nameFontFamily]);

  const handleExport = async () => {
    if (selectedTags.length === 0) {
      toast.error('Select at least 1 primary category.', { description: 'Pick a Self/Wishes tag before exporting.' });
      return;
    }
    if (selectedLanguages.length === 0) {
      toast.error('Select at least 1 language.', { description: 'Pick a language before exporting.' });
      return;
    }

    setIsExporting(true);
    try {
      // 1. Convert background image to blob
      const bgBlob = await fetch(backgroundImage!).then(r => r.blob());
      const uploadContentType = normalizeRasterUploadContentType(bgBlob, backgroundImage);
      const uploadBlob =
        bgBlob.type === uploadContentType
          ? bgBlob
          : new Blob([await bgBlob.arrayBuffer()], { type: uploadContentType });

      // 2. Get presigned URL
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const ext = extensionForRasterContentType(uploadContentType);
      const { url: presignedUrl, fields } = await getPresignedUrl({
        file_name: `background-${ts}.${ext}`,
        content_type: uploadContentType,
      });

      // 3. Upload image via presigned POST
      await uploadImage(presignedUrl, fields, uploadBlob);
      const file_url = fields.key;

      // 4. Build payload
      const safeTextColor = normalizeHex(textStyle.color, '#FFFFFF');
      const safeStrokeColor = normalizeHex(textStyle.textStroke.color, '#000000');
      const safeShadowColor = normalizeHex(textStyle.textShadow.color, '#000000');
      const safePhotoStrokeColor = normalizeHex(photoStrokeColor, '#FFFFFF');
      const safeShadow = { ...textStyle.textShadow, color: safeShadowColor };
      const safeStroke = { ...textStyle.textStroke, color: safeStrokeColor };

      const raw_config: CompactTemplateJSON = {
        ar: aspectRatioString,
        t: isProfileTemplate,
        pc: selectedTags,
        lg: selectedLanguages,
        bg: file_url,
        dc: dominantColorHex,
        mt: 'image',
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

      // 5. Create poster template (sent to backend). No local JSON download.
      await createPosterTemplate({ title: `template-${ts}`, raw_config });
      toast.success('Template exported!', { description: 'Saved to backend.' });
    } catch (err) {
      toast.error('Export failed', { description: err instanceof Error ? err.message : 'Please try again.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadRenderedImage = useCallback(async () => {
    if (!backgroundImage) {
      toast.error('No canvas image to download.');
      return;
    }
    try {
      const loadImage = (src: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = src;
        });

      const canvas = document.createElement('canvas');
      canvas.width = CANVAS_WIDTH;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not initialize canvas renderer.');

      // Background (cover fit, same as preview)
      const bg = await loadImage(backgroundImage);
      const srcAspect = bg.width / bg.height;
      const dstAspect = CANVAS_WIDTH / canvasHeight;
      let sx = 0; let sy = 0; let sw = bg.width; let sh = bg.height;
      if (srcAspect > dstAspect) {
        sw = bg.height * dstAspect;
        sx = (bg.width - sw) / 2;
      } else if (srcAspect < dstAspect) {
        sh = bg.width / dstAspect;
        sy = (bg.height - sh) / 2;
      }
      ctx.drawImage(bg, sx, sy, sw, sh, 0, 0, CANVAS_WIDTH, canvasHeight);

      // Photo placeholder image (uploaded user photo or preview sample)
      const previewPhoto = userPhoto || (photoHasBackground ? samplePhotoBg : samplePhotoNoBg);
      if (previewPhoto) {
        const pimg = await loadImage(previewPhoto);
        const d = imageHolder.diameter;
        const px = imageHolder.x;
        const py = imageHolder.y;
        const radius = photoShape === 'circle' ? d / 2 : photoCornerRadius;

        ctx.save();
        ctx.beginPath();
        if (photoShape === 'circle') {
          ctx.arc(px + d / 2, py + d / 2, d / 2, 0, Math.PI * 2);
        } else {
          const rr = Math.max(0, Math.min(radius, d / 2));
          ctx.moveTo(px + rr, py);
          ctx.arcTo(px + d, py, px + d, py + d, rr);
          ctx.arcTo(px + d, py + d, px, py + d, rr);
          ctx.arcTo(px, py + d, px, py, rr);
          ctx.arcTo(px, py, px + d, py, rr);
          ctx.closePath();
        }
        ctx.clip();
        ctx.drawImage(pimg, px, py, d, d);
        ctx.restore();

        if (photoStrokeWidth > 0) {
          ctx.save();
          ctx.strokeStyle = normalizeHex(photoStrokeColor, '#FFFFFF');
          ctx.lineWidth = photoStrokeWidth;
          ctx.beginPath();
          if (photoShape === 'circle') {
            ctx.arc(px + d / 2, py + d / 2, d / 2 - photoStrokeWidth / 2, 0, Math.PI * 2);
          } else {
            const rr = Math.max(0, Math.min(radius, d / 2));
            const inset = photoStrokeWidth / 2;
            const x0 = px + inset;
            const y0 = py + inset;
            const w0 = d - photoStrokeWidth;
            const h0 = d - photoStrokeWidth;
            ctx.moveTo(x0 + rr, y0);
            ctx.arcTo(x0 + w0, y0, x0 + w0, y0 + h0, rr);
            ctx.arcTo(x0 + w0, y0 + h0, x0, y0 + h0, rr);
            ctx.arcTo(x0, y0 + h0, x0, y0, rr);
            ctx.arcTo(x0, y0, x0 + w0, y0, rr);
            ctx.closePath();
          }
          ctx.stroke();
          ctx.restore();
        }
      }

      // Name text
      const safeTextColor = normalizeHex(textStyle.color, '#FFFFFF');
      const safeStrokeColor = normalizeHex(textStyle.textStroke.color, '#000000');
      const safeShadowColor = normalizeHex(textStyle.textShadow.color, '#000000');
      const safeShadow = { ...textStyle.textShadow, color: safeShadowColor };
      const safeStroke = { ...textStyle.textStroke, color: safeStrokeColor };

      ctx.save();
      ctx.font = `${textStyle.fontWeight} ${textStyle.fontSize}px ${nameFontFamily}`;
      ctx.textAlign = textStyle.textAlignment as CanvasTextAlign;
      ctx.textBaseline = 'middle';

      const shadowPad = Math.max(safeShadow.blur + Math.max(Math.abs(safeShadow.offsetX), Math.abs(safeShadow.offsetY)), 0);
      const totalPad = Math.max(safeStroke.width, shadowPad);
      const contentLeft = nameHolder.x + totalPad + 6;
      const contentRight = nameHolder.x + nameHolder.width - totalPad - 6;
      const midY = nameHolder.y + nameHolder.height / 2;
      const textX = textStyle.textAlignment === 'left'
        ? contentLeft
        : textStyle.textAlignment === 'right'
          ? contentRight
          : (contentLeft + contentRight) / 2;

      if (safeStroke.width > 0) {
        const strokeOffsets = textStrokeToRNShadows(safeStroke);
        strokeOffsets.forEach((s) => {
          ctx.shadowOffsetX = s.textShadowOffset.width;
          ctx.shadowOffsetY = s.textShadowOffset.height;
          ctx.shadowBlur = 0;
          ctx.shadowColor = s.textShadowColor;
          ctx.fillStyle = safeTextColor;
          ctx.fillText(userName, textX, midY);
        });
      }

      ctx.shadowOffsetX = safeShadow.offsetX;
      ctx.shadowOffsetY = safeShadow.offsetY;
      ctx.shadowBlur = safeShadow.blur;
      ctx.shadowColor = hexToRgba(safeShadow.color, safeShadow.opacity);
      ctx.fillStyle = safeTextColor;
      ctx.fillText(userName, textX, midY);
      ctx.restore();

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      link.href = dataUrl;
      link.download = `rendered-poster-${ts}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Rendered image downloaded.');
    } catch (err) {
      toast.error('Download failed', { description: err instanceof Error ? err.message : 'Please try again.' });
    }
  }, [
    backgroundImage,
    canvasHeight,
    imageHolder,
    userPhoto,
    photoHasBackground,
    photoShape,
    photoCornerRadius,
    photoStrokeColor,
    photoStrokeWidth,
    nameHolder,
    textStyle,
    userName,
  ]);

  const handleCopyDominantColor = useCallback(async () => {
    if (!dominantColorHex) return;
    try {
      await navigator.clipboard.writeText(dominantColorHex);
      setDominantColorCopied(true);
      window.setTimeout(() => setDominantColorCopied(false), 1200);
    } catch {
      toast.error('Could not copy color code.');
    }
  }, [dominantColorHex]);

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

  /* ================= UI ================= */
  return (
    <div className={`${isDarkMode ? 'dark' : ''} h-screen flex flex-col bg-background text-foreground overflow-hidden`}>
      {!isLoggedIn ? (
        <Login
          onLogin={() => setIsLoggedIn(true)}
          isDarkMode={isDarkMode}
          onThemeToggle={setIsDarkMode}
        />
      ) : (
        <>
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
          <ThemeToggle isDarkMode={isDarkMode} onToggle={setIsDarkMode} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearPosterStudioSession();
              clearToken();
              setIsLoggedIn(false);
              setPersistReady(false);
              quotaWarningShownRef.current = false;
            }}
            className="h-8 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </Button>
        </div>
      </header>

      {showStudioSplash && (
        <div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-background text-foreground"
          aria-busy="true"
          aria-live="polite"
          aria-label="Loading workspace"
        >
          <img src={lokalLogo} alt="" className="h-10 w-10 rounded-lg opacity-90" />
          <div className="inline-flex flex-row items-center gap-1.5">
            <Loader2 className="size-5 shrink-0 animate-spin text-muted-foreground" aria-hidden />
            <span className="text-sm leading-none text-muted-foreground">Loading your workspace…</span>
          </div>
        </div>
      )}

      {/* ═══ Body ═══ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Panel ── */}
        <aside className="w-[272px] shrink-0 bg-card border-r border-border flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <PanelSection title="Background" icon={<ImageIcon className="w-3.5 h-3.5" />}>
              <ImageUploader
                onImageUpload={handleImageUpload}
                hasImage={!!backgroundImage}
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
                      type="button"
                      onClick={() => setIsProfileTemplate(true)}
                      className={`flex-1 text-xs py-1.5 rounded-sm ${
                        isProfileTemplate ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >Self</button>
                    <button
                      type="button"
                      onClick={() => setIsProfileTemplate(false)}
                      className={`flex-1 text-xs py-1.5 rounded-sm ${
                        !isProfileTemplate ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >Wishes</button>
                  </div>
                </div>

                {categoriesError ? (
                  <Alert variant="destructive" className="py-2.5 px-3">
                    <AlertCircle />
                    <AlertTitle className="text-xs">{isProfileTemplate ? 'Self' : 'Wishes'} Tags</AlertTitle>
                    <AlertDescription className="flex items-center justify-between gap-2 text-xs">
                      <span>Couldn't load tags</span>
                      <Button variant="outline" size="sm" className="h-6 px-2 text-xs" onClick={fetchCategories}>Retry</Button>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <TagSelector
                    title={`${isProfileTemplate ? 'Self' : 'Wishes'} Tags`}
                    availableTags={availableTags}
                    selectedTags={selectedTags}
                    onTagsChange={setSelectedTags}
                    required
                  />
                )}

                <Separator />

                {languagesError ? (
                  <Alert variant="destructive" className="py-2.5 px-3">
                    <AlertCircle />
                    <AlertTitle className="text-xs">Language</AlertTitle>
                    <AlertDescription className="flex items-center justify-between gap-2 text-xs">
                      <span>Couldn't load languages</span>
                      <Button variant="outline" size="sm" className="h-6 px-2 text-xs" onClick={fetchLanguages}>Retry</Button>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <TagSelector
                    title="Language"
                    availableTags={languageTags}
                    selectedTags={selectedLanguages}
                    onTagsChange={setSelectedLanguages}
                    required
                  />
                )}
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
                onDownloadImage={handleDownloadRenderedImage}
                dominantColorHex={dominantColorHex}
                dominantColorCopied={dominantColorCopied}
                onCopyDominantColor={handleCopyDominantColor}
                isExporting={isExporting}
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
            mediaType="image"
            textAlignment={textStyle.textAlignment}
            letterSpacing={textStyle.letterSpacing}
            textFontFamily={nameFontFamily}
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
        </>
      )}

      <Toaster theme={isDarkMode ? 'dark' : 'light'} richColors position="bottom-center" />
      <LsdEasterEgg open={showEasterEgg} onClose={() => setShowEasterEgg(false)} />
    </div>
  );
}