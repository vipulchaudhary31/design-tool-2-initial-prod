# Product Requirements Document (PRD)
## Template Design Studio for Mobile Image Templates

**Version:** 1.0  
**Last Updated:** January 16, 2026  
**Product Owner:** Lokal Design Team  
**Status:** Implemented

---

## 1. Executive Summary

The Template Design Studio is an internal design tool that empowers in-house designers to create shareable, personalized mobile image templates for community engagement. The tool supports creating templates in two portrait aspect ratios (3:4 and 9:16), allowing designers to position customizable placeholders for user photos and names with precise control over styling, alignment, and visual effects.

Templates created in this tool are exported as configuration payloads to the backend, where they are rendered as static images with real user data for distribution across the community.

---

## 2. Problem Statement

### Current Challenge
Designers need a fast, precise way to create mobile image templates that can be personalized with user data (photos and names) for various occasions and languages without requiring manual image editing for each user.

### Pain Points
- Manual image creation is time-consuming and doesn't scale
- Inconsistent positioning across different templates
- Difficulty previewing how templates will look with user data
- No standardized way to apply styling effects (borders, backgrounds, text alignment)
- Need for device-agnostic rendering across different screen sizes

### Solution
A web-based design tool that provides:
- Visual canvas for precise placeholder positioning
- Real-time preview with sample data
- Preset styling options for professional effects
- Configuration export for backend rendering
- Support for multiple occasions and languages

---

## 3. Goals & Objectives

### Primary Goals
1. **Speed**: Reduce template creation time from hours to minutes
2. **Precision**: Enable pixel-perfect positioning with percentage-based coordinates
3. **Consistency**: Standardize template styling across all occasions
4. **Scale**: Support multiple languages and occasions efficiently

### Success Criteria
- Designers can create a complete template in under 10 minutes
- Templates render consistently across all device sizes
- Zero backend code changes required for new template styles
- 100% accurate preview matching final rendered output

---

## 4. User Personas

### Primary Persona: Internal Designer
- **Role**: Graphic Designer at Lokal
- **Technical Skill**: Medium (comfortable with design tools, basic web interfaces)
- **Goals**: 
  - Create visually appealing templates quickly
  - Ensure templates work across multiple languages
  - Preview final output before publishing
- **Pain Points**:
  - Limited time for manual image creation
  - Need to support multiple occasions simultaneously
  - Want precise control over positioning

---

## 5. Features & Requirements

### 5.1 Canvas Configuration

#### Aspect Ratio Selection
- **Requirement**: Support for 2 portrait aspect ratios
  - **3:4 Portrait**: 1080×1440px (standard mobile)
  - **9:16 Portrait**: 1080×1920px (Instagram stories, full-screen mobile)
- **Behavior**: Canvas height adjusts automatically; placeholders clamp to new boundaries
- **UI**: Toggle buttons with clear dimension labels

#### Background Image Upload
- **Requirement**: Upload and crop background images to match selected aspect ratio
- **Features**:
  - Drag-and-drop or click-to-upload
  - Cropping interface with aspect ratio lock
  - Image preview before confirmation
  - Support for common formats (JPG, PNG, WebP)
- **Constraints**: Images must fill entire canvas (1080px width)

### 5.2 Placeholder Management

#### Circular User Photo Placeholder
- **Dimensions**: 250×250px (fixed diameter)
- **Positioning**: 
  - Draggable with smooth motion
  - Constrained to canvas boundaries
  - Visual feedback on drag (scale up, color change)
- **Styling Options**: 7 stroke styles (see section 5.4)
- **Storage**: Position stored as percentage coordinates

#### Rectangular Name Text Placeholder
- **Dimensions**: 
  - Height: 100px (fixed)
  - Width: 200-800px (adjustable)
- **Positioning**:
  - Draggable with smooth motion
  - Resizable via edge handle (horizontal only)
  - Constrained to canvas boundaries
  - Visual feedback on interaction
- **Styling Options**: 
  - 8 text background styles (see section 5.5)
  - 3 text alignment options (see section 5.6)
- **Storage**: Position and width stored as percentages

### 5.3 Design Canvas

#### Visual Display
- **Scaling**: Auto-scales to fit desktop screen while maintaining aspect ratio
- **Max Height**: 600px to prevent excessive scrolling
- **Coordinate System**: Works in original resolution (1080px width) for accurate export
- **Visual Cues**:
  - Canvas displays actual dimensions (e.g., "1080 × 1440px")
  - Aspect ratio label (e.g., "3:4 portrait")
  - Empty state with upload prompt

#### Interaction Patterns
- **Drag**: Click and drag placeholders to reposition
- **Resize**: Hover over name placeholder to reveal resize handle
- **Constraints**: All movements bounded to canvas edges
- **No Snapping**: Free-form positioning for maximum flexibility
- **No Animation**: Static output only (no animations exported)

### 5.4 Image Stroke Styles

7 preset border styles for the circular user photo:

| Style | Description | Visual Effect |
|-------|-------------|---------------|
| **None** | No border | Clean, borderless photo |
| **Simple** | White border (8px) | Classic, clean look with subtle shadow |
| **Double** | White border + inner purple ring | Layered effect with inset shadow |
| **Gradient** | Multi-color gradient border | Purple → Pink → Amber gradient |
| **Glow** | White border + purple glow | Soft glowing effect (32px radius) |
| **Thick** | Bold white border (16px) | Strong, prominent border |
| **Ring** | White border + inner purple ring | Stronger inner ring effect |

**Technical Implementation**:
- Uses CSS borders, box-shadows, and background properties
- All effects contained within element boundaries
- Scales proportionally in preview
- Exported as style identifier to backend

### 5.5 Text Background Styles

8 preset background styles for the name text placeholder:

| Style | Description | Use Case |
|-------|-------------|----------|
| **None** | No background | Minimal, clean overlay |
| **Solid** | Solid black overlay (50% opacity) | Maximum text readability |
| **Gradient** | Vertical gradient fade | Elegant, modern look |
| **Ribbon** | Horizontal ribbon effect | Badge-like appearance |
| **Badge** | Rounded badge shape | Friendly, approachable |
| **Outline** | Text stroke only | Transparent, artistic |
| **Blur** | Backdrop blur effect | Modern glass-morphism |
| **Shadow** | Drop shadow | Depth and elevation |

**Technical Implementation**:
- Renders as overlay beneath text
- Maintains text legibility across all styles
- Exported as style identifier to backend

### 5.6 Text Alignment

3 alignment options for name text within the text box:

| Alignment | Behavior |
|-----------|----------|
| **Left** | Text aligns to left edge with padding |
| **Center** | Text centers horizontally (default) |
| **Right** | Text aligns to right edge with padding |

**Font Specifications**:
- **Font Family**: Kohinoor Devanagari (supports multiple Indian languages)
- **Font Weight**: 600 (Semi-bold)
- **Font Size**: 14px
- **Text Shadow**: Applied when background style is "none"

### 5.7 Tag Management

#### Occasion Tags
- **Purpose**: Categorize templates by event type
- **Examples**: Good Morning, Christmas, Diwali, Birthday, New Year, Pongal, Quotes, Anniversary, Motivational
- **Selection**: Multi-select with visual pills
- **Required**: At least one occasion tag must be selected
- **UI**: Color-coded chips with remove buttons

#### Language Tags
- **Purpose**: Indicate supported languages for template text
- **Examples**: English, Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi
- **Selection**: Multi-select with visual pills
- **Required**: At least one language tag must be selected
- **UI**: Color-coded chips with remove buttons

### 5.8 Live Preview Panel

#### Preview Display
- **Scale**: 1/4 of original size (270px width)
- **Sample Data**:
  - User photo: Stock image from Unsplash
  - User name: "Rahul" (sample text)
- **Accuracy**: Exact representation of final rendered output
- **Styling**: Applies all selected styles (stroke, background, alignment)

#### Preview Features
- Updates in real-time as designer makes changes
- Shows actual font rendering (Kohinoor Devanagari)
- Displays all visual effects at scale
- Includes device frame for context

### 5.9 Position Coordinates Display

Real-time coordinate display showing:
- **User Photo**: (x, y) coordinates in pixels
- **User Name**: (x, y) coordinates in pixels
- **Name Width**: Current width in pixels

**Purpose**: Provides designers with precise positioning feedback for consistency across templates.

### 5.10 Export Functionality

#### Validation Requirements
Before export, the tool validates:
1. ✓ Background image uploaded
2. ✓ At least one occasion tag selected
3. ✓ At least one language tag selected
4. ✓ Placeholders positioned within canvas

#### Export Payload Structure
```json
{
  "aspectRatio": "3:4" | "9:16",
  "occasionTags": ["Good Morning", "Christmas"],
  "languageTags": ["English", "Hindi"],
  "backgroundImage": "data:image/jpeg;base64,...",
  "imagePlaceholder": {
    "x": 44.44,  // percentage of canvas width
    "y": 13.89,  // percentage of canvas height
    "diameter": 23.15  // percentage of canvas width
  },
  "namePlaceholder": {
    "x": 22.22,  // percentage of canvas width
    "y": 38.19,  // percentage of canvas height
    "width": 55.56,  // percentage of canvas width
    "height": 6.94  // percentage of canvas height
  },
  "textBackgroundStyle": "solid" | "gradient" | "ribbon" | "badge" | "outline" | "blur" | "shadow" | "none",
  "imageStrokeStyle": "simple" | "double" | "gradient" | "glow" | "thick" | "ring" | "none",
  "textAlignment": "left" | "center" | "right"
}
```

#### Export Behavior
- **Action**: Click "Upload Template" button
- **Validation**: Shows error if requirements not met
- **Feedback**: Success toast notification
- **Backend Integration**: POST to `/api/templates` endpoint (production)
- **Development**: Console logs payload for testing

---

## 6. Technical Specifications

### 6.1 Technology Stack

#### Frontend
- **Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS v4
- **Animations**: Motion (formerly Framer Motion)
- **Drag & Drop**: React DnD
- **Icons**: Lucide React
- **Notifications**: Sonner (toast library)

#### Build Tools
- **Bundler**: Vite
- **Import Alias**: `@` mapped to `/src` directory

### 6.2 Component Architecture

```
App.tsx (Root)
├── Header
├── Left Sidebar (Controls)
│   ├── AspectRatioSelector
│   ├── ImageUploader
│   ├── ImageCropper
│   ├── TagSelector (Occasions)
│   ├── TagSelector (Languages)
│   └── ExportPanel
├── Center Panel (Canvas)
│   └── DesignCanvas
│       ├── BackgroundImage
│       ├── DraggablePlaceholder (Circle - User Photo)
│       └── DraggablePlaceholder (Rectangle - Name Text)
└── Right Sidebar (Preview & Styling)
    ├── PreviewPanel
    ├── TextBackgroundSelector
    ├── ImageStrokeSelector
    ├── TextAlignmentSelector
    └── PositionCoordinatesDisplay
```

### 6.3 State Management

#### Global State (App.tsx)
```typescript
- aspectRatio: '3:4' | '9:16'
- backgroundImage: string | null
- rawImage: string | null (for cropping)
- selectedOccasions: string[]
- selectedLanguages: string[]
- textBackgroundStyle: TextBackgroundStyle
- imageStrokeStyle: ImageStrokeStyle
- textAlignment: TextAlignment
- imageHolder: { x: number, y: number, diameter: number }
- nameHolder: { x: number, y: number, width: number, height: number }
```

#### Coordinate System
- **Canvas Coordinates**: Original resolution (1080×1440 or 1080×1920)
- **Display Coordinates**: Scaled to fit screen (max 600px height)
- **Export Coordinates**: Percentages (device-agnostic)
- **Conversion**: Automatic scaling between coordinate systems

### 6.4 Responsive Behavior

- **Desktop**: Optimal (3-column layout)
- **Tablet**: Functional (stacked columns)
- **Mobile**: Not optimized (desktop-only tool for designers)

### 6.5 Browser Compatibility

- **Chrome**: 90+ ✓
- **Firefox**: 88+ ✓
- **Safari**: 14+ ✓
- **Edge**: 90+ ✓

### 6.6 Performance Targets

- **Initial Load**: < 2 seconds
- **Drag Responsiveness**: 60fps
- **Preview Update**: < 100ms after change
- **Export Generation**: < 500ms

---

## 7. User Flow

### 7.1 Complete Template Creation Flow

```
1. Designer opens Template Design Studio
   ↓
2. Select aspect ratio (3:4 or 9:16)
   ↓
3. Upload background image
   ↓
4. Crop image to exact aspect ratio
   ↓
5. Position user photo placeholder (circular)
   ↓
6. Position name text placeholder (rectangular)
   ↓
7. Resize name placeholder if needed
   ↓
8. Select occasion tags (multi-select)
   ↓
9. Select language tags (multi-select)
   ↓
10. Choose image stroke style (7 options)
   ↓
11. Choose text background style (8 options)
   ↓
12. Choose text alignment (3 options)
   ↓
13. Review live preview
   ↓
14. Click "Upload Template"
   ↓
15. Template exported to backend
   ↓
16. Success notification shown
```

### 7.2 Validation Flow

```
Export Button Clicked
   ↓
Is background uploaded? → NO → Show error: "Upload background image"
   ↓ YES
Any occasion tags? → NO → Show error: "Select at least one occasion"
   ↓ YES
Any language tags? → NO → Show error: "Select at least one language"
   ↓ YES
Generate payload
   ↓
Send to backend
   ↓
Show success message
```

---

## 8. Design Specifications

### 8.1 Visual Design Principles

- **Minimal Styling**: Clean, functional interface focused on the canvas
- **White Backgrounds**: Sections use white cards with subtle shadows
- **Amber Accents**: Primary action color (amber-500)
- **Purple Accents**: Styling options (purple-500)
- **Blue Accents**: Text alignment (blue-500)
- **Clear Hierarchy**: Numbered steps guide user through process

### 8.2 Typography

- **Headings**: Bold, 14-18px
- **Body Text**: Regular, 12-14px
- **Labels**: Semi-bold, 12px
- **Preview Text**: Kohinoor Devanagari, 600 weight, 14px
- **Monospace**: Coordinate displays

### 8.3 Spacing & Layout

- **Card Padding**: 20px
- **Section Gap**: 16px
- **Element Gap**: 12px
- **Grid Columns**: 3-9-3 (Left-Center-Right)
- **Border Radius**: 12px (cards), 8px (buttons)

### 8.4 Interactive Elements

#### Placeholders
- **Default State**: 
  - Circle: White dashed border, 30% opacity white fill
  - Rectangle: White dashed border, 30% opacity white fill
- **Hover State**: Subtle scale (1.02)
- **Drag State**: 
  - Amber background (60% opacity)
  - Scale up (1.05)
  - Elevated shadow
  - "Grabbing" cursor

#### Buttons
- **Primary (Upload Template)**: 
  - Amber background
  - White text
  - Shadow on hover
- **Secondary (Style Selectors)**:
  - White background
  - Border change on hover
  - Fill on selection
- **Tag Pills**:
  - Colored background
  - Remove icon on hover

### 8.5 Visual Feedback

- **Success**: Green toast notification (top-right)
- **Error**: Red toast notification (top-right)
- **Loading**: (Not currently implemented)
- **Validation**: Inline error messages with icons

---

## 9. Backend Integration

### 9.1 API Endpoint

**Endpoint**: `POST /api/templates`

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body**: See Export Payload Structure (Section 5.10)

**Response**:
```json
{
  "success": true,
  "templateId": "uuid",
  "message": "Template created successfully"
}
```

### 9.2 Backend Responsibilities

The backend receives the template configuration and:

1. **Stores Configuration**: Save template metadata in database
2. **Stores Background Image**: Upload to CDN/storage
3. **Renders Static Images**: When user requests personalized image:
   - Load background image
   - Composite user photo at specified coordinates
   - Render user name with specified styles
   - Apply stroke, background, and alignment styles
   - Export final static image (JPG/PNG)
4. **Serves Images**: Provide URL for end-user consumption

### 9.3 Rendering Engine Requirements

Backend must support:
- **Image Compositing**: Overlay user photo on background
- **Circle Masking**: Clip user photo to circular shape
- **Border Rendering**: Apply 7 stroke styles programmatically
- **Text Rendering**: 
  - Kohinoor Devanagari font
  - Weight 600, Size 14px
  - 3 alignment options
- **Background Effects**: Render 8 text background styles
- **Coordinate Mapping**: Convert percentages to actual pixels based on device size

---

## 10. Success Metrics

### 10.1 Efficiency Metrics

- **Average Template Creation Time**: Target < 10 minutes
- **Templates Created Per Designer Per Week**: Target 20+
- **Export Success Rate**: Target 99%+

### 10.2 Quality Metrics

- **Preview Accuracy**: 100% match between preview and final output
- **Positioning Precision**: ±2px tolerance on rendered images
- **Cross-Device Consistency**: 100% across different resolutions

### 10.3 Adoption Metrics

- **Designer Onboarding Time**: Target < 30 minutes
- **Tool Satisfaction Score**: Target 4.5/5
- **Feature Utilization**: Track usage of each style option

---

## 11. Known Limitations

### Current Limitations

1. **No Multi-Template Management**: Can only create one template at a time
2. **No Template Editing**: Cannot load/edit existing templates
3. **No Undo/Redo**: Cannot revert changes
4. **No Template Library**: No browsing of created templates
5. **No Collaboration**: Single-user editing only
6. **No Version History**: Cannot track template changes over time
7. **Desktop Only**: Not optimized for mobile/tablet designers
8. **No Custom Fonts**: Fixed to Kohinoor Devanagari
9. **Fixed Placeholder Sizes**: Cannot resize circular photo placeholder
10. **No Additional Elements**: Cannot add logos, stickers, or extra text fields

---

## 12. Future Considerations

### Phase 2 Features (Potential)

#### Template Management
- Browse library of created templates
- Edit existing templates
- Duplicate templates
- Archive/delete templates
- Search and filter by tags

#### Advanced Editing
- Undo/redo functionality
- Template versioning
- Multiple text fields
- Custom font selection
- Variable placeholder sizes
- Logo/sticker overlays

#### Collaboration
- Multi-user editing
- Comments and feedback
- Approval workflows
- Template sharing between designers

#### Analytics
- Template performance tracking
- User engagement metrics
- A/B testing capabilities
- Popular style combinations

#### Automation
- AI-powered background suggestions
- Auto-positioning based on background analysis
- Batch template creation
- Template recommendations

---

## 13. Glossary

| Term | Definition |
|------|------------|
| **Aspect Ratio** | Proportional relationship between width and height (e.g., 3:4) |
| **Canvas** | The design workspace representing the final image dimensions |
| **Placeholder** | Draggable element representing where user data will appear |
| **Stroke** | Border or outline around the circular user photo |
| **Text Background** | Visual effect behind the user name text |
| **Export Payload** | JSON configuration sent to backend for rendering |
| **Percentage Coordinates** | Position values relative to canvas size (device-agnostic) |
| **Occasion Tags** | Categories for when templates should be used |
| **Language Tags** | Supported languages for template text |
| **Live Preview** | Real-time visualization with sample data |

---

## 14. Appendix

### A. Sample Templates

**Good Morning Template (3:4)**
- Aspect Ratio: 3:4
- Background: Sunrise gradient
- User Photo: Top-center, Simple white stroke
- Name Text: Bottom-third, Solid background, Center aligned
- Tags: Good Morning, English, Hindi

**Birthday Template (9:16)**
- Aspect Ratio: 9:16
- Background: Colorful balloons
- User Photo: Center, Gradient stroke
- Name Text: Below photo, Badge background, Center aligned
- Tags: Birthday, English, Tamil, Telugu

### B. Technical Notes

**Font Loading**:
```css
@import url('https://fonts.googleapis.com/css2?family=Kohinoor+Devanagari:wght@600&display=swap');
```

**Coordinate Conversion**:
```javascript
// Canvas to Percentage
const percentX = (x / canvasWidth) * 100;
const percentY = (y / canvasHeight) * 100;

// Percentage to Canvas
const canvasX = (percentX / 100) * canvasWidth;
const canvasY = (percentY / 100) * canvasHeight;
```

---

## 15. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 16, 2026 | Product Team | Initial release with all core features |

---

**End of Document**
