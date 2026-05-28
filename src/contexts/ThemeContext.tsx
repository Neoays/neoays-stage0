import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme, ThemeId, UserThemeSettings } from '../types/theme';
import { getThemeById, modernGradientTheme } from '../themes/presets';

interface ThemeContextType {
    theme: Theme;
    themeId: ThemeId;
    setTheme: (themeId: ThemeId) => void;
    customSettings: UserThemeSettings | null;
    updateCustomSettings: (settings: Partial<UserThemeSettings>) => void;
    applyTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
    initialThemeId?: ThemeId;
    customSettings?: UserThemeSettings;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
    children,
    initialThemeId = 'modern-gradient',
    customSettings: initialCustomSettings
}) => {
    const [themeId, setThemeId] = useState<ThemeId>(initialThemeId);
    const [theme, setTheme] = useState<Theme>(getThemeById(initialThemeId));
    const [customSettings, setCustomSettings] = useState<UserThemeSettings | null>(
        initialCustomSettings || null
    );

    // Helper to load Google Fonts
    const loadGoogleFont = (fontFamily: string) => {
        if (!fontFamily) return;
        // Extract font name from string like "'Poppins', sans-serif" -> "Poppins"
        const fontName = fontFamily.split(',')[0].replace(/['"]/g, '').trim();
        const systemFonts = ['Inter', 'Target', 'sans-serif', 'serif', 'monospace', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI'];

        if (systemFonts.includes(fontName)) return;

        const linkId = `google-font-${fontName.toLowerCase().replace(/\s+/g, '-')}`;
        if (!document.getElementById(linkId)) {
            const link = document.createElement('link');
            link.id = linkId;
            link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800;900&display=swap`;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }
    };

    // Apply theme to document
    const applyTheme = (currentTheme: Theme) => {
        // console.log('🎨 Applying theme:', currentTheme.name);
        const root = document.documentElement;

        // Apply CSS custom properties
        root.style.setProperty('--color-primary', currentTheme.colors.primary);
        root.style.setProperty('--color-secondary', currentTheme.colors.secondary);
        root.style.setProperty('--color-accent', currentTheme.colors.accent);
        root.style.setProperty('--color-background', currentTheme.colors.background);
        root.style.setProperty('--color-surface', currentTheme.colors.surface);
        root.style.setProperty('--color-text', currentTheme.colors.text);
        root.style.setProperty('--color-text-secondary', currentTheme.colors.textSecondary);
        root.style.setProperty('--color-border', currentTheme.colors.border);
        root.style.setProperty('--color-success', currentTheme.colors.success);
        root.style.setProperty('--color-warning', currentTheme.colors.warning);
        root.style.setProperty('--color-error', currentTheme.colors.error);

        // Apply typography & Load Fonts
        root.style.setProperty('--font-family', currentTheme.typography.fontFamily);
        root.style.setProperty('--font-heading', currentTheme.typography.headingFont);

        loadGoogleFont(currentTheme.typography.fontFamily);
        loadGoogleFont(currentTheme.typography.headingFont);

        // Apply layout
        root.style.setProperty('--radius-sm', currentTheme.layout.borderRadius.sm);
        root.style.setProperty('--radius-md', currentTheme.layout.borderRadius.md);
        root.style.setProperty('--radius-lg', currentTheme.layout.borderRadius.lg);
        root.style.setProperty('--radius-xl', currentTheme.layout.borderRadius.xl);

        // Apply effects
        if (currentTheme.effects.gradient) {
            root.style.setProperty('--gradient-primary', currentTheme.effects.gradient);
        }

        // Set body background (optional fallback)
        document.body.style.backgroundColor = currentTheme.colors.background;
        document.body.style.color = currentTheme.colors.text;
        document.body.style.fontFamily = currentTheme.typography.fontFamily;
    };

    // Update theme when themeId changes
    useEffect(() => {
        const newTheme = getThemeById(themeId);

        // Apply custom settings if they exist
        if (customSettings) {
            const customizedTheme: Theme = {
                ...newTheme,
                colors: {
                    ...newTheme.colors,
                    ...customSettings.customColors,
                },
                typography: {
                    ...newTheme.typography,
                    fontFamily: customSettings.customFont || newTheme.typography.fontFamily,
                },
                layout: {
                    ...newTheme.layout,
                    ...customSettings.customLayout,
                },
            };
            setTheme(customizedTheme);
            applyTheme(customizedTheme);
        } else {
            setTheme(newTheme);
            applyTheme(newTheme);
        }
    }, [themeId, customSettings]);

    const handleSetTheme = (newThemeId: ThemeId) => {
        setThemeId(newThemeId);
        // Save to localStorage
        localStorage.setItem('neoays-theme', newThemeId);
    };

    const updateCustomSettings = (settings: Partial<UserThemeSettings>) => {
        const newSettings: UserThemeSettings = {
            ...customSettings,
            themeId,
            ...settings,
        } as UserThemeSettings;

        setCustomSettings(newSettings);
        // Save to localStorage
        localStorage.setItem('neoays-custom-theme', JSON.stringify(newSettings));
    };

    // Load theme from localStorage on mount
    useEffect(() => {
        const savedThemeId = localStorage.getItem('neoays-theme') as ThemeId;
        const savedCustomSettings = localStorage.getItem('neoays-custom-theme');

        if (savedThemeId && !initialThemeId) {
            setThemeId(savedThemeId);
        }

        if (savedCustomSettings && !initialCustomSettings) {
            try {
                setCustomSettings(JSON.parse(savedCustomSettings));
            } catch (e) {
                console.error('Failed to parse custom theme settings', e);
            }
        }
    }, []);

    const value: ThemeContextType = {
        theme,
        themeId,
        setTheme: handleSetTheme,
        customSettings,
        updateCustomSettings,
        applyTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
