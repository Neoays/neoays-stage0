// Theme type definitions for Neoays profiles

export type ThemeId =
    | 'modern-gradient'
    | 'dark-elegance'
    | 'soft-pastel'
    | 'corporate-blue'
    | 'nature-green'
    | 'creative-purple'
    | 'bold-red'
    | 'neon-cyber'
    | 'beach-vibes'
    | 'autumn-warm';

export type LayoutStyle =
    | 'classic'
    | 'floating'
    | 'bento'
    | 'split'
    | 'story'
    | 'minimal'
    | 'immersive'
    | 'bento_modern'
    | 'lumia';

export interface ThemeColors {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
}

export interface ThemeTypography {
    fontFamily: string;
    headingFont: string;
    fontSize: {
        xs: string;
        sm: string;
        base: string;
        lg: string;
        xl: string;
        '2xl': string;
        '3xl': string;
        '4xl': string;
    };
    fontWeight: {
        light: number;
        normal: number;
        medium: number;
        semibold: number;
        bold: number;
        extrabold: number;
    };
}

export interface ThemeLayout {
    borderRadius: {
        sm: string;
        md: string;
        lg: string;
        xl: string;
        full: string;
    };
    spacing: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
        '2xl': string;
    };
    shadow: {
        sm: string;
        md: string;
        lg: string;
        xl: string;
        '2xl': string;
    };
}

export interface ThemeEffects {
    gradient?: string;
    pattern?: string;
    blur?: string;
    animation?: 'smooth' | 'bouncy' | 'none';
}

export interface Theme {
    id: ThemeId;
    name: string;
    description: string;
    category: 'professional' | 'creative' | 'minimal' | 'bold';
    colors: ThemeColors;
    typography: ThemeTypography;
    layout: ThemeLayout;
    effects: ThemeEffects;
    preview: string; // Preview image URL
    supportedTypes?: ('personal' | 'business' | 'ngo' | 'personal_jobseeker' | 'society_club' | 'business_person' | 'staff')[];
}

export interface UserThemeSettings {
    themeId: ThemeId;
    layoutStyle?: LayoutStyle;
    primaryColor?: string; // Hex code for custom brand color
    customColors?: Partial<ThemeColors>;
    customFont?: string;
    customLayout?: Partial<ThemeLayout>;
    glassmorphism?: boolean;
    animationsEnabled?: boolean;
}
