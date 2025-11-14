# Verify Layer UI Design Guide

## 🎨 Typography & Font Specifications

### Primary Text Elements

#### Search Result Title
- **Font**: Inter/System font
- **Font Weight**: 600 (Semi-bold)
- **Font Size**:
  - Mobile: 16px
  - Tablet: 18px
  - Desktop: 20px
- **Line Height**: 1.3
- **Color**: #1a1a1a (Dark gray)
- **Max Lines**: 2 lines với ellipsis

#### Channel/Author Name
- **Font**: Inter/System font
- **Font Weight**: 400 (Regular)
- **Font Size**:
  - Mobile: 14px
  - Tablet: 15px
  - Desktop: 16px
- **Color**: #666666 (Medium gray)
- **Line Height**: 1.4

#### Metadata (Duration, Views, Date)
- **Font**: Inter/System font
- **Font Weight**: 400 (Regular)
- **Font Size**:
  - Mobile: 12px
  - Tablet: 13px
  - Desktop: 14px
- **Color**: #888888 (Light gray)
- **Line Height**: 1.3

#### Status Messages (Verification States)
- **Font**: Inter/System font
- **Font Weight**: 500 (Medium)
- **Font Size**: 14px (all devices)
- **Line Height**: 1.4

---


## 📱 Layout Specifications

### Search Results Container
**Desktop (1200px+):**
- **Grid**: 3 columns
- **Gap**: 24px between cards
- **Container Width**: 1200px max
- **Margin**: 0 auto (centered)

**Tablet (768px - 1199px):**
- **Grid**: 2 columns
- **Gap**: 20px between cards
- **Container Padding**: 0 20px

**Mobile (320px - 767px):**
- **Grid**: 1 column
- **Gap**: 16px between cards
- **Container Padding**: 0 16px

### Individual Result Card Layout

**Card Dimensions:**
- **Desktop**: 400px width × auto height
- **Tablet**: ~350px width × auto height
- **Mobile**: Full width minus padding

**Internal Card Layout:**
- **Thumbnail Aspect Ratio**: 16:9
- **Thumbnail Position**: Top of card
- **Content Padding**: 16px all sides
- **Content Spacing**: 8px between elements

**Card Visual Style:**
- **Background**: White
- **Border**: 1px solid #E5E7EB
- **Border Radius**: 8px
- **Shadow**: 0 1px 3px rgba(0,0,0,0.1)
- **Hover Shadow**: 0 4px 12px rgba(0,0,0,0.15)

---

## 🔄 Loading States Design

### Initial Search Loading
**Visual Elements:**
- **Skeleton Cards**: 6 placeholder cards
- **Skeleton Animation**: Shimmer effect left to right
- **Skeleton Colors**:
  - Base: #F3F4F6
  - Highlight: #E5E7EB
- **Animation Duration**: 1.5s infinite

**Skeleton Card Structure:**
- Rectangle for thumbnail (16:9 ratio)
- 2 lines for title (different widths)
- 1 line for channel name
- 1 line for metadata

---

## 📄 Results Header Design

### Results Count Display
**Layout:**
- **Position**: Top left of results section
- **Font Size**: 18px (Desktop), 16px (Mobile)
- **Font Weight**: 500
- **Color**: #374151 (Dark gray)

**Format Examples:**
- "12 results found"
- "Showing 1-10 of 50+ results"
- "No results found"


## 🔍 Search More Actions

### Load More Button
**When Shown**: When pagination indicates more results available

**Default State:**
- **Text**: "Load More Results"
- **Text Color**: White
- **Width**: 200px minimum
- **Height**: 44px
- **Border Radius**: 6px
- **Font Weight**: 500
- **Position**: Center aligned below results

**Hover State:**
- **Transform**: translateY(-1px)
- **Shadow**: 0 4px 8px rgba(59,130,246,0.3)

**Loading State:**
- **Background**: #9CA3AF (Gray)
- **Text**: "Loading..."
- **Cursor**: not-allowed
- **Spinner**: 16px spinner inside button



### Text Colors
- **Primary**: #1F2937 (Very dark gray)
- **Secondary**: #6B7280 (Medium gray)
- **Tertiary**: #9CA3AF (Light gray)

---

## 📐 Spacing System

### Container Spacing
- **Large Desktop**: 48px top/bottom margins
- **Desktop**: 40px top/bottom margins
- **Tablet**: 32px top/bottom margins
- **Mobile**: 24px top/bottom margins

### Element Spacing
- **Card Internal Padding**: 16px all sides
- **Card Margin Bottom**: 20px
- **Section Margins**: 32px between major sections
- **Line Spacing**: 8px between related elements

### Grid Gaps
- **Desktop**: 24px horizontal, 32px vertical
- **Tablet**: 20px horizontal, 24px vertical
- **Mobile**: 16px horizontal, 20px vertical

---

## 🎭 Interaction States

### Card Hover Effects
**Visual Changes:**
- **Shadow**: Increase to 0 4px 12px rgba(0,0,0,0.15)
- **Transform**: translateY(-2px)
- **Transition**: 200ms ease-out
- **Border**: Remains same color but more prominent

### Button Interactions
**Default → Hover:**
- **Background**: Darken by 10%
- **Transform**: translateY(-1px)
- **Shadow**: Add/enhance shadow
- **Transition**: 150ms ease-out

**Active State (Click):**
- **Transform**: translateY(0px) (removes hover transform)
- **Transition**: 50ms ease-out

---

## 📊 Content Hierarchy

### Information Priority (Top to Bottom)
1. **Thumbnail**: Most prominent visual element
2. **Title**: Primary text, largest font size
3. **Channel/Author**: Secondary text
4. **Metadata**: Tertiary text (duration, views, date)
5. **Verification Status**: Subtle indicators

### Visual Weight Distribution
- **Thumbnail**: 40% of visual attention
- **Title**: 35% of visual attention
- **Channel**: 15% of visual attention
- **Metadata**: 10% of visual attention

---

## 🔄 User Flow Patterns

### Initial Search Flow
1. User enters search query
2. **Show**: Loading skeleton cards (6 cards)
3. **Verify data**: Backend verification process
4. **Show results based on verification**:
   - **Success**: Display all verified results
   - **Warning**: Show warning banner + filtered results
   - **Error**: Show error message with retry option

### Load More Flow
1. User scrolls to bottom of results
2. **Show**: "Load More Results" button
3. User clicks button
4. **Button state**: Changes to "Loading..." with spinner
5. **Background**: Fetch more results with verification
6. **Show new results**: Append below existing results
7. **Update button**:
   - **More available**: Reset to "Load More"
   - **No more**: Show "No more results" message

### Error Recovery Flow
1. **Initial error**: Show error message with "Try Again" button
2. **User clicks "Try Again"**: Button shows loading state
3. **Retry verification**: Re-attempt API call and verification
4. **Success/Failure**: Update UI accordingly

---

## 📱 Responsive Behavior

### Breakpoint Transitions
**Desktop → Tablet (1200px → 768px):**
- Grid changes from 3 to 2 columns
- Font sizes reduce by 1-2px
- Margins and padding reduce by 20%

**Tablet → Mobile (768px → 320px):**
- Grid changes from 2 to 1 column
- Font sizes reduce by 2-3px
- Touch targets minimum 44px height
- Increased padding for thumb navigation

### Mobile-Specific Adaptations
- **Larger touch targets**: Minimum 44px for buttons
- **Increased line spacing**: Better readability
- **Simplified layouts**: Reduced visual complexity
- **Thumb-friendly navigation**: Bottom-aligned actions when possible

---

## 🎯 Accessibility Considerations

### Color Contrast
- **Text on Background**: Minimum 4.5:1 contrast ratio
- **Status Indicators**: Don't rely on color alone
- **Focus States**: Clear visual focus indicators

### Interactive Elements
- **Touch Targets**: Minimum 44×44px on mobile
- **Alternative Text**: All images have descriptive alt text

### Screen Reader Support
- **Status Messages**: Announced when verification states change
- **Loading States**: Progress indicators are announced
- **Error Messages**: Clear, descriptive error text

---

## 🔌 Search V2 API Usage với Verify Service

### API Call Pattern
```
User Input → sanitize(query) → searchV2(query, options) → normalize → verify → UI Display
```

### Search Parameters
- **query** (string): Search keyword từ user input
- **pageToken** (string, optional): Token cho pagination, load more results
- **limit** (number, optional): Số results per page (default: 10-20)

### API Response Structure
```
{
  items: [
    {
      id: "video_id_here",
      title: "Video Title Here",
      channel: "Channel Name",
      thumbnailUrl: "https://img.youtube.com/vi/video_id/hqdefault.jpg",
      duration: "5:23",
      viewCount: "1.2M views",
      uploadDate: "2 days ago",
      type: "stream" // hoặc "channel"
    }
  ],
  pagination: {
    nextPageToken: "token_for_next_page",
    hasNextPage: true
  }
}
```

### Verify Service Integration
1. **searchV2()** được gọi với query và options
2. Response được pass qua **normalizers.normalizeSearchV2Results()**
3. Normalized data được pass qua **VERIFICATION_POLICIES.searchV2()**
4. Verified result trả về với status: success/warning/error
5. UI render based on verification status

---

## 📱 Layout Wireframe

### Desktop Layout (3 columns)
```
[Search Results Header]  [Verification Status ✓]
├─────────────────────────────────────────────────┤
│ [📷]  Video Title Here...           │ [📷]  Another Video...        │ [📷]  Third Video...           │
│       Channel Name                  │       Channel Name            │       Channel Name             │
│       1.2M views • 2 days ago      │       523K views • 1 week ago │       2.1M views • 3 days ago │
│       ✓ [5:23]                     │       ⚠ [3:41]              │       ✓ [10:15]               │
├─────────────────────────────────────┼───────────────────────────────┼────────────────────────────────┤
│ [📷]  Fourth Video...              │ [📷]  Fifth Video...         │ [📷]  Sixth Video...          │
│       Channel Name                  │       Channel Name            │       Channel Name             │
│       890K views • 1 day ago       │       156K views • 4 days ago│       3.2M views • 1 week ago │
│       ✓ [7:33]                     │       ✓ [12:45]             │       ❌ [--:--]               │
└─────────────────────────────────────┴───────────────────────────────┴────────────────────────────────┘
                                    [Load More Results]
```

### Mobile Layout (1 column)
```
[Search Results Header] [✓ Verified]
├─────────────────────────────────────┤
│ [📷 Thumbnail]      Video Title Here│
│ 16:9 ratio          Wraps to 2 lines│
│                     Channel Name    │
│                     1.2M • 2d • ✓  │
│                     [5:23]          │
├─────────────────────────────────────┤
│ [📷 Thumbnail]      Another Video   │
│                     Title Here...   │
│                     Channel Name    │
│                     523K • 1w • ⚠  │
│                     [3:41]          │
├─────────────────────────────────────┤
│ [📷 Thumbnail]      Third Video     │
│                     Title Content   │
│                     Channel Name    │
│                     2.1M • 3d • ✓  │
│                     [10:15]         │
└─────────────────────────────────────┘
         [Load More Results]
```

### Verification Status Indicators
- **✓**: Video data verified completely
- **⚠**: Some data missing or low quality
- **❌**: Verification failed
- **[5:23]**: Duration badge on thumbnail
- **📷**: Thumbnail placeholder (16:9 aspect ratio)

---

## 📊 Data Display Specification

### Required Data Fields
| Field | Display Location | Format | Fallback |
|-------|------------------|---------|----------|
| **title** | Main heading | Max 2 lines + ellipsis | "Untitled Video" |
| **channel** | Below title | Single line | "Unknown Channel" |
| **thumbnailUrl** | Left side/top | 16:9 image | Gray placeholder |
| **duration** | Overlay on thumbnail | "5:23" format | "--:--" |
| **viewCount** | Metadata row | "1.2M views" | "-- views" |
| **uploadDate** | Metadata row | "2 days ago" | "Unknown date" |
| **id** | Hidden (for functionality) | String | Required field |

### Optional Data Fields
| Field | Display Location | Format | Fallback |
|-------|------------------|---------|----------|
| **quality** | Badge on thumbnail | "HD", "4K" | Not shown |
| **fileSize** | Below metadata | "~25 MB" | Not shown |
| **type** | Internal use | "stream"/"channel" | "stream" |



### Metadata Row Format
**Desktop**: `1.2M views • 2 days ago • HD • ✓`
**Mobile**: `1.2M • 2d • ✓` (abbreviated)

### Empty States
| Condition | Display |
|-----------|---------|
| **No results** | "No videos found for '{query}'" |
| **Loading** | 6 skeleton cards with shimmer |
| **Error** | "Unable to search videos. Please try again." |
| **End of results** | "No more videos available" |

### Search Result Item States
| State | Visual Indicator | Typography |
|-------|------------------|------------|
| **Normal** | Full opacity, normal colors | Standard typography |
| **Hover** | Subtle shadow, title color #3B82F6 | Title becomes blue |
| **Selected** | Border highlight | Title bold weight 700 |
| **Unavailable** | 70% opacity, strikethrough | Grayed out text |
| **Loading** | Skeleton placeholder | Shimmer animation |

---

