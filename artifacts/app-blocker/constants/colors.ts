/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#302640',
    tint: '#3e2e56',

    // Core surfaces
    background: '#f8f4ed',
    foreground: '#302640',

    // Cards / elevated surfaces
    card: '#fdfbf7',
    cardForeground: '#302640',

    // Primary action color (buttons, links, active states)
    primary: '#3e2e56',
    primaryForeground: '#fdfbf7',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#ede6d9',
    secondaryForeground: '#3e2e56',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#eeeae2',
    mutedForeground: '#6f6482',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#aacfc7',
    accentForeground: '#1e433b',

    // Destructive actions (delete, error states)
    destructive: '#c24138',
    destructiveForeground: '#fdfbf7',

    // Borders and input outlines
    border: '#ded5c9',
    input: '#ded5c9',
  },

  dark: {
    text: '#f8f4ed',
    tint: '#e9b658',
    background: '#1c1528',
    foreground: '#f8f4ed',
    card: '#292037',
    cardForeground: '#f8f4ed',
    primary: '#e9b658',
    primaryForeground: '#302640',
    secondary: '#342b43',
    secondaryForeground: '#f8f4ed',
    muted: '#342b43',
    mutedForeground: '#c5b9d0',
    accent: '#3f665d',
    accentForeground: '#d9f2e9',
    destructive: '#df786d',
    destructiveForeground: '#1c1528',
    border: '#3f3450',
    input: '#493e59',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 13,
};

export default colors;
