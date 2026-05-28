/**
 * Utility functions for dynamic color generation and theme styling.
 */

/**
 * Lightens or darkens a hex color by a given percentage.
 */
export const adjustColor = (hex: string, percent: number) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;

    return '#' + (0x1000000 + (R < 255 ? R < 0 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 0 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 0 ? 0 : B : 255)).toString(16).slice(1);
};

/**
 * Generates a full theme palette from a single primary brand color.
 */
export const generatePalette = (primary: string) => {
    return {
        primary: primary,
        secondary: adjustColor(primary, -15), // Slightly darker
        accent: adjustColor(primary, 20),    // Brighter
        background: adjustColor(primary, 95), // Very light fade for bg
        surface: '#ffffff',
        text: '#1e293b',
        textSecondary: '#64748b',
        border: adjustColor(primary, 80),
    };
};

/**
 * Determines if a color is light or dark to set appropriate text contrast.
 */
export const getContrastText = (hex: string) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = (num >> 16);
    const g = (num >> 8 & 0x00FF);
    const b = (num & 0x0000FF);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#1e293b' : '#ffffff';
};
