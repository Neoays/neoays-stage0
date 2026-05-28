import { Theme } from '../types/theme';

// Modern Gradient Theme - Default
export const modernGradientTheme: Theme = {
    id: 'modern-gradient',
    name: 'Modern Gradient',
    description: 'Vibrant gradients with modern aesthetics',
    category: 'professional',
    colors: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        accent: '#ec4899',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1e293b',
        textSecondary: '#64748b',
        border: '#e2e8f0',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
    },
    typography: {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        headingFont: "'Poppins', sans-serif",
        fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
            '4xl': '2.25rem',
        },
        fontWeight: {
            light: 300,
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
            extrabold: 800,
        },
    },
    layout: {
        borderRadius: {
            sm: '0.375rem',
            md: '0.5rem',
            lg: '0.75rem',
            xl: '1rem',
            full: '9999px',
        },
        spacing: {
            xs: '0.5rem',
            sm: '0.75rem',
            md: '1rem',
            lg: '1.5rem',
            xl: '2rem',
            '2xl': '3rem',
        },
        shadow: {
            sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
            '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        },
    },
    effects: {
        gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
        animation: 'smooth',
    },
    preview: '/themes/modern-gradient.jpg',
    supportedTypes: ['personal', 'business'],
};

// Dark Elegance Theme
export const darkEleganceTheme: Theme = {
    id: 'dark-elegance',
    name: 'Dark Elegance',
    description: 'Sophisticated dark mode with gold accents',
    category: 'professional',
    colors: {
        primary: '#d4af37',
        secondary: '#c9a961',
        accent: '#ffd700',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f1f5f9',
        textSecondary: '#94a3b8',
        border: '#334155',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
    },
    typography: {
        fontFamily: "'Playfair Display', serif",
        headingFont: "'Cinzel', serif",
        fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
            '4xl': '2.25rem',
        },
        fontWeight: {
            light: 300,
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
            extrabold: 800,
        },
    },
    layout: {
        borderRadius: {
            sm: '0.25rem',
            md: '0.375rem',
            lg: '0.5rem',
            xl: '0.75rem',
            full: '9999px',
        },
        spacing: {
            xs: '0.5rem',
            sm: '0.75rem',
            md: '1rem',
            lg: '1.5rem',
            xl: '2rem',
            '2xl': '3rem',
        },
        shadow: {
            sm: '0 1px 2px 0 rgb(212 175 55 / 0.1)',
            md: '0 4px 6px -1px rgb(212 175 55 / 0.2)',
            lg: '0 10px 15px -3px rgb(212 175 55 / 0.3)',
            xl: '0 20px 25px -5px rgb(212 175 55 / 0.3)',
            '2xl': '0 25px 50px -12px rgb(212 175 55 / 0.4)',
        },
    },
    effects: {
        gradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        animation: 'smooth',
    },
    preview: '/themes/dark-elegance.jpg',
    supportedTypes: ['personal', 'business'],
};

// Soft Pastel Theme
export const softPastelTheme: Theme = {
    id: 'soft-pastel',
    name: 'Soft Pastel',
    description: 'Gentle pastel colors for a calm, friendly vibe',
    category: 'creative',
    colors: {
        primary: '#f0abfc',
        secondary: '#c4b5fd',
        accent: '#fda4af',
        background: '#fefce8',
        surface: '#fef3c7',
        text: '#78350f',
        textSecondary: '#92400e',
        border: '#fde68a',
        success: '#86efac',
        warning: '#fcd34d',
        error: '#fca5a5',
    },
    typography: {
        fontFamily: "'Quicksand', sans-serif",
        headingFont: "'Comfortaa', cursive",
        fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
            '4xl': '2.25rem',
        },
        fontWeight: {
            light: 300,
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
            extrabold: 800,
        },
    },
    layout: {
        borderRadius: {
            sm: '0.5rem',
            md: '0.75rem',
            lg: '1rem',
            xl: '1.5rem',
            full: '9999px',
        },
        spacing: {
            xs: '0.5rem',
            sm: '0.75rem',
            md: '1rem',
            lg: '1.5rem',
            xl: '2rem',
            '2xl': '3rem',
        },
        shadow: {
            sm: '0 1px 2px 0 rgb(240 171 252 / 0.1)',
            md: '0 4px 6px -1px rgb(240 171 252 / 0.2)',
            lg: '0 10px 15px -3px rgb(240 171 252 / 0.2)',
            xl: '0 20px 25px -5px rgb(240 171 252 / 0.3)',
            '2xl': '0 25px 50px -12px rgb(240 171 252 / 0.3)',
        },
    },
    effects: {
        gradient: 'linear-gradient(135deg, #fef3c7 0%, #fce7f3 50%, #ddd6fe 100%)',
        animation: 'bouncy',
    },
    preview: '/themes/soft-pastel.jpg',
    supportedTypes: ['personal'],
};

// Corporate Blue Theme
export const corporateBlueTheme: Theme = {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    description: 'Professional and trustworthy business theme',
    category: 'professional',
    colors: {
        primary: '#0ea5e9',
        secondary: '#0284c7',
        accent: '#06b6d4',
        background: '#ffffff',
        surface: '#f0f9ff',
        text: '#0c4a6e',
        textSecondary: '#075985',
        border: '#bae6fd',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
    },
    typography: {
        fontFamily: "'Roboto', sans-serif",
        headingFont: "'Montserrat', sans-serif",
        fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
            '4xl': '2.25rem',
        },
        fontWeight: {
            light: 300,
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
            extrabold: 800,
        },
    },
    layout: {
        borderRadius: {
            sm: '0.25rem',
            md: '0.375rem',
            lg: '0.5rem',
            xl: '0.75rem',
            full: '9999px',
        },
        spacing: {
            xs: '0.5rem',
            sm: '0.75rem',
            md: '1rem',
            lg: '1.5rem',
            xl: '2rem',
            '2xl': '3rem',
        },
        shadow: {
            sm: '0 1px 2px 0 rgb(14 165 233 / 0.05)',
            md: '0 4px 6px -1px rgb(14 165 233 / 0.1)',
            lg: '0 10px 15px -3px rgb(14 165 233 / 0.1)',
            xl: '0 20px 25px -5px rgb(14 165 233 / 0.1)',
            '2xl': '0 25px 50px -12px rgb(14 165 233 / 0.15)',
        },
    },
    effects: {
        gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
        animation: 'smooth',
    },
    preview: '/themes/corporate-blue.jpg',
    supportedTypes: ['business', 'ngo'],
};

// Nature Green Theme
export const natureGreenTheme: Theme = {
    id: 'nature-green',
    name: 'Nature Green',
    description: 'Fresh and organic, perfect for eco-friendly businesses',
    category: 'creative',
    colors: {
        primary: '#22c55e',
        secondary: '#16a34a',
        accent: '#84cc16',
        background: '#f7fee7',
        surface: '#ecfccb',
        text: '#14532d',
        textSecondary: '#166534',
        border: '#d9f99d',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
    },
    typography: {
        fontFamily: "'Nunito', sans-serif",
        headingFont: "'Fredoka', sans-serif",
        fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
            '4xl': '2.25rem',
        },
        fontWeight: {
            light: 300,
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
            extrabold: 800,
        },
    },
    layout: {
        borderRadius: {
            sm: '0.5rem',
            md: '0.75rem',
            lg: '1rem',
            xl: '1.25rem',
            full: '9999px',
        },
        spacing: {
            xs: '0.5rem',
            sm: '0.75rem',
            md: '1rem',
            lg: '1.5rem',
            xl: '2rem',
            '2xl': '3rem',
        },
        shadow: {
            sm: '0 1px 2px 0 rgb(34 197 94 / 0.1)',
            md: '0 4px 6px -1px rgb(34 197 94 / 0.15)',
            lg: '0 10px 15px -3px rgb(34 197 94 / 0.2)',
            xl: '0 20px 25px -5px rgb(34 197 94 / 0.2)',
            '2xl': '0 25px 50px -12px rgb(34 197 94 / 0.25)',
        },
    },
    effects: {
        gradient: 'linear-gradient(135deg, #ecfccb 0%, #d9f99d 50%, #bef264 100%)',
        animation: 'smooth',
    },
    preview: '/themes/nature-green.jpg',
    supportedTypes: ['business', 'ngo'],
};

// Minimalist Pro Theme (New)
export const minimalistProTheme: Theme = {
    id: 'autumn-warm', // Reusing ID to avoid breaking changes, renamed display to Minimalist Pro
    name: 'Minimalist Pro',
    description: 'Clean, strictly professional, monochrome with stark contrasts',
    category: 'minimal',
    colors: {
        primary: '#111827',
        secondary: '#374151',
        accent: '#000000',
        background: '#ffffff',
        surface: '#f3f4f6',
        text: '#111827',
        textSecondary: '#4b5563',
        border: '#e5e7eb',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
    },
    typography: {
        fontFamily: "'Inter', sans-serif",
        headingFont: "'Inter', sans-serif",
        fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
            '4xl': '2.25rem',
        },
        fontWeight: {
            light: 300,
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
            extrabold: 900,
        },
    },
    layout: {
        borderRadius: {
            sm: '0px',
            md: '2px',
            lg: '4px',
            xl: '6px',
            full: '0px', // Square aesthetic
        },
        spacing: {
            xs: '0.5rem',
            sm: '0.75rem',
            md: '1.25rem',
            lg: '2rem',
            xl: '3rem',
            '2xl': '5rem',
        },
        shadow: {
            sm: 'none',
            md: 'none',
            lg: 'none',
            xl: 'none',
            '2xl': 'none',
        },
    },
    effects: {
        gradient: 'none',
        animation: 'none',
    },
    preview: '/themes/minimalist-pro.jpg',
    supportedTypes: ['business'],
};


// Humanity Theme (New)
export const humanityTheme: Theme = {
    id: 'beach-vibes', // Reusing ID slot to keep type simpler for now, renamed to Humanity
    name: 'Humanity',
    description: 'Warm, earthy tones for non-profits and causes',
    category: 'creative',
    colors: {
        primary: '#ea580c', // Orange-600
        secondary: '#c2410c',
        accent: '#fb923c',
        background: '#fff7ed', // Orange-50
        surface: '#ffedd5', // Orange-100
        text: '#431407',
        textSecondary: '#7c2d12',
        border: '#fed7aa',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
    },
    typography: {
        fontFamily: "'Open Sans', sans-serif",
        headingFont: "'Merriweather', serif",
        fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
            '4xl': '2.25rem',
        },
        fontWeight: {
            light: 300,
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
            extrabold: 800,
        },
    },
    layout: {
        borderRadius: {
            sm: '0.5rem',
            md: '1rem',
            lg: '1.5rem',
            xl: '2rem',
            full: '9999px',
        },
        spacing: {
            xs: '0.5rem',
            sm: '0.75rem',
            md: '1rem',
            lg: '1.5rem',
            xl: '2rem',
            '2xl': '3rem',
        },
        shadow: {
            sm: '0 1px 2px 0 rgb(234 88 12 / 0.1)',
            md: '0 4px 6px -1px rgb(234 88 12 / 0.15)',
            lg: '0 10px 15px -3px rgb(234 88 12 / 0.2)',
            xl: '0 20px 25px -5px rgb(234 88 12 / 0.2)',
            '2xl': '0 25px 50px -12px rgb(234 88 12 / 0.25)',
        },
    },
    effects: {
        gradient: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
        animation: 'smooth',
    },
    preview: '/themes/humanity.jpg',
    supportedTypes: ['ngo'],
};

// Export all themes
export const themes: Theme[] = [
    modernGradientTheme,
    darkEleganceTheme,
    softPastelTheme,
    corporateBlueTheme,
    natureGreenTheme,
    minimalistProTheme,
    humanityTheme,
];

export const getThemeById = (id: string): Theme => {
    return themes.find(theme => theme.id === id) || modernGradientTheme;
};
