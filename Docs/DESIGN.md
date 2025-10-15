# Design Principles - NewTon DC Tournament Manager

This document outlines the design principles established for the minimalistic, flat 2D redesign of the NewTon DC Tournament Manager interface.

## Core Design Philosophy

### Minimalistic Flat 2D Aesthetic
- **No gradients, shadows, or 3D effects** - Pure flat design
- **Clean rectangular shapes** with straight lines
- **Generous white space** for an airy, uncluttered feel
- **Thin borders** (1px) instead of thick visual elements
- **Professional, desktop-focused** approach without mobile considerations

### Color Strategy: Muted Monochromatic with Selective Accents

**Base Palette:**
- Background: `#f5f5f5` (light neutral)
- Cards/containers: `#ffffff` (white) with `#c0c0c0` borders
- Text: Various grays (`#2a2a2a`, `#333333`, `#666666`) - no pure black

**Accent Colors (Used Sparingly):**
- **Green** (`#166534`): Actions, positive states, frontside matches
- **Amber** (`#d97706`): Slightly destructive behavior (e.g., imports)
- **Red** (`#dc2626`): Destructive behavior (e.g., resets, deletions)

## Layout Principles

### Fixed Width Approach
- **Desktop-only design** - no responsive considerations needed
- **Fixed dimensions** prevent layout shifting and create stable, predictable interfaces
- **Example**: Tournament creation row = 1000px total width
  - Tournament Name: 510px
  - Tournament Date: 154px
  - Create Button: 220px
  - Gaps: 32px total (2 × 16px)

### Consistent Spacing System
- **Primary spacing**: 24px between major sections
- **Secondary spacing**: 16px between related elements
- **Tight spacing**: 8px or less for closely related items
- **Fine-tuned spacing**: Use negative margins (-6px) when needed for visual balance

### Height Standardization
- **Form elements**: 44px height (inputs, buttons, selects)
- **Content rows**: 72px height (tournament items, match items)
- **Headers**: 60px height (column headers)
- **Consistent baselines**: All interactive elements align perfectly
- **`box-sizing: border-box`** ensures predictable sizing

### Row Layout System
- **Fixed height enforcement**: `height: 72px`, `min-height: 72px`, `max-height: 72px`
- **Overflow protection**: `overflow: hidden` prevents content from expanding rows
- **Vertical centering**: `display: flex`, `flex-direction: column`, `justify-content: center`
- **Content independence**: Row height never varies regardless of content

## Typography Hierarchy

### Font Weights and Sizes
- **Main title**: 1.75rem, weight 600, pure black (`#000000`)
- **Section headers**: 1rem, weight 600, dark gray (`#222222`)
- **Navigation**: 16px, weight 400/500, medium gray (`#444444`)
- **Body text**: 14px, weight 400, dark gray (`#2a2a2a`)
- **Active elements**: Larger size (18px) + bold weight (700) + green color

### Active State Indication
- **Tournament names**: 18px + weight 700 + green color for active items
- **Navigation**: Orange accent (`rgba(180, 83, 9, 1)`) for active page
- **Status badges**: Green with stronger background for "Active" vs "Completed"

## Interactive Elements

### Button Styling
```css
/* Base button */
padding: 12px 20px;
border: 1px solid #b0b0b0;
background: #ffffff;
height: 44px;
font-weight: 500;

/* Action button (green) */
color: #166534;
border-color: #166534;
hover: background #dcfce7;

/* Warning button (amber) */
color: #d97706;
border-color: #d97706;
hover: background #fef3c7;

/* Danger button (red) */
color: #dc2626;
border-color: #dc2626;
hover: background #fef2f2;
```

**Important:** All buttons throughout the application use these flat design classes (`.btn`, `.btn-success`, `.btn-warning`, `.btn-danger`). Never use inline styles with filled backgrounds or colored backgrounds on buttons - this breaks the flat design consistency.

### Hover Effects
- **Border-based feedback** instead of background changes
- **Left borders** (3px) that appear on hover
- **Smooth transitions** (0.15s ease) for professional feel
- **Color-coded borders**: Green for general hover, context-appropriate colors for specific elements

## Content Organization

### Visual Separation Techniques
- **Background differentiation**:
  - Frontside matches: White background
  - Backside matches: Light gray (`#f7f7f7`) background
- **Full-width backgrounds**: Use negative margins to extend backgrounds to container edges
- **Border indicators**: Subtle borders that appear on interaction
- **Separator lines**: Consistent 1px solid #e8e8e8 borders between all rows (including last items)

### Navigation Design
- **Frameless navigation**: No button-like containers
- **Text-only styling**: 32px gaps between items
- **Minimal hover feedback**: Subtle color changes only
- **Active state**: Orange accent color with bold weight

## Form Design

### Input Styling
```css
width: 100%;
padding: 12px;
border: 1px solid #c0c0c0;
height: 44px;
transition: border-color 0.15s ease;

/* Focus state */
border-color: rgba(180, 83, 9, 1);
box-shadow: 0 0 0 2px rgba(180, 83, 9, 0.1);
```

### Layout Patterns
- **Aligned widths**: Related elements share consistent widths
- **Left-aligned**: All layouts start from the left edge
- **Fixed proportions**: Specific pixel values rather than flexible layouts

## Implementation Notes

### CSS Structure
- **Component-based styling**: Separate classes for different states
- **Utility classes**: Minimal use, prefer component-specific styling
- **Override patterns**: Use specific selectors for exceptions

### State Management
- **Clear class naming**: `.active-tournament`, `.frontside`, `.backside`
- **Multiple indicators**: Combine size, weight, and color for important states
- **Consistent patterns**: Same approach across different content types

## Registration Page Implementation

The Registration page follows all core design principles with these specific implementations:

### Layout Structure
- **Two-column layout**: Registration & Payment (34% width) and Tournament Results (66% width)
- **Fixed column proportions**: Provides optimal balance for player management and results viewing
- **Consistent header styling**: Both columns use 60px height headers with bottom borders
- **24px gap** between columns for clean separation

### Form Elements
- **Player name input**: 441px width for perfect alignment with Registration & Payment column
- **Control buttons row**: Left-aligned with 16px gaps between buttons
- **Player count display**: Positioned right of "Go to Tournament" button
- **All inputs and buttons**: Standard 44px height maintaining design consistency

### Player Cards
- **48px compact height**: Optimized for grid layout to handle 32+ players efficiently
- **Three-column grid**: Fixed layout showing exactly 3 cards per row for consistent density
- **Click-to-toggle payment**: Entire card is clickable to toggle paid/unpaid status
- **Visual payment status**:
  - Paid players: Subtle green background (#f0f9f4) with green border (#166534)
  - Unpaid players: White background (#ffffff) with amber border (#d97706)
- **Hover effects**: 1px lift with soft shadow plus background brightening for clear interactivity
- **Remove action**: Compact 24×24px "×" button positioned with z-index to prevent click conflicts

### Results Table
- **Full table structure**: Rank, Player, Points, Short Legs, High Outs, 180s, Tons columns
- **Alternating row styling**: Consistent with match results from Setup page
- **Scrollable content**: Maintains fixed column height with overflow handling

## Config Page Implementation

The Config page follows all core design principles with organized two-column layout for efficient configuration management:

### Layout Structure
- **Two-column layout**: Equal-width columns for balanced organization of configuration sections
- **Flexible height**: Uses `flex: 1` to fill available space between header and footer
- **Independent scrolling**: Each column scrolls independently for handling varying content lengths
- **Section cards**: Each configuration area contained in white cards with clear headers

### Configuration Sections
- **Consistent card styling**: White background with `#c0c0c0` borders and section headers
- **Grid layouts**: Point Values and Match Configuration use responsive grids with 200px minimum column width
- **Form organization**: Related settings grouped logically within sections
- **Button placement**: Action buttons positioned contextually within each section

### Form Elements
- **Standard inputs**: All inputs maintain 44px height for consistency
- **Grid spacing**: 16px gaps within configuration grids
- **Checkbox styling**: 16×16px checkboxes with proper text alignment and explanatory help text
- **Info boxes**: Logo instructions displayed in subtle gray background box (`#f9f9f9`)
- **Field help**: Small italic text (`#666666`) for additional guidance

### Typography and Spacing
- **Section headers**: 1rem, weight 600, consistent with other pages
- **24px gaps**: Between sections and columns
- **16px gaps**: Within form grids and button groups
- **Help text**: 12px italic for field guidance

## Design Exceptions

### Decorative vs. Functional Elements
While the application follows strict flat design principles with `border-radius: 0` for all functional UI elements, **decorative celebratory elements** are allowed subtle rounded corners for visual appeal:

- **Tournament Celebration Podium**: Podium stands maintain `border-radius: 8px 8px 0 0` (rounded top corners)
- **Player Name Boxes**: Celebration podium player cards keep `border-radius: 8px`
- **Rationale**: These purely decorative elements appear only in the celebration view and benefit from softer edges to create a more festive, rewarding visual experience

All functional elements (buttons, cards, inputs, containers) across Setup, Registration, Config, Tournament, and Match Controls pages use sharp, angular geometry (`border-radius: 0`).

## Future Application

When applying these principles to other pages:

1. **Maintain fixed layouts** - avoid flexible/responsive patterns
2. **Use the established color scheme** - green/amber/red for actions
3. **Apply consistent spacing** - 24px/16px/8px system
4. **Standardize heights** - 44px for all interactive elements
5. **Keep hover effects minimal** - border-based feedback
6. **Extend backgrounds fully** - use negative margins when needed
7. **Make active states obvious** - combine multiple visual indicators
8. **Decorative exceptions** - allow rounded corners only for purely celebratory/decorative elements that don't affect user interaction

## Key Measurements Reference

- **Standard element height**: 44px
- **Content row height**: 72px
- **Header height**: 60px
- **Primary gap**: 24px
- **Secondary gap**: 16px
- **Border width**: 1px
- **Hover border width**: 3px
- **Container border**: `#c0c0c0`
- **Separator lines**: `#e8e8e8`
- **Backside background**: `#f7f7f7`
- **Active orange**: `rgba(180, 83, 9, 1)`
- **Action green**: `#166534`

---

*Document updated 2025-10-15 to clarify button styling consistency across all components including modals.*