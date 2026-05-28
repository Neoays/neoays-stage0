import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { ThemeId, LayoutStyle } from '../../types/theme';
import { themes } from '../../themes/presets';
import { CheckCircleIcon } from '../../components/Icons';

interface ThemeCustomizerProps {
    profileData: UserProfile;
    onUpdateProfile: (data: Partial<UserProfile>) => Promise<void>;
}



const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ profileData, onUpdateProfile }) => {
    const [saving, setSaving] = useState(false);

    // Current Settings with defaults
    const currentThemeId = (profileData.themeId as ThemeId) || 'modern-gradient';
    const settings = profileData.themeSettings || {
        themeId: currentThemeId,
        layoutStyle: 'classic',
        primaryColor: themes.find(t => t.id === currentThemeId)?.colors.primary || '#6366f1',
        customFont: "'Inter', sans-serif"
    };

    const handleUpdate = async (updates: any) => {
        setSaving(true);
        // If changing theme ID, we also reset some custom colors to that theme's defaults unless explicitly overridden
        let newSettings = { ...settings, ...updates };

        if (updates.themeId) {
            const newTheme = themes.find(t => t.id === updates.themeId);
            if (newTheme) {
                newSettings.primaryColor = newTheme.colors.primary;
                newSettings.customFont = newTheme.typography.fontFamily;
            }
        }

        try {
            await onUpdateProfile({
                themeId: updates.themeId || settings.themeId,
                themeSettings: newSettings
            });
        } catch (error) {
            console.error('Failed to update theme:', error);
        } finally {
            setSaving(false);
        }
    };

    const layouts: { id: LayoutStyle; name: string; icon: string }[] = [
        { id: 'classic', name: 'Classic', icon: '📋' },
        { id: 'floating', name: 'Glass', icon: '✨' },
        { id: 'bento', name: 'Bento', icon: '🍱' },
        { id: 'split', name: 'Split', icon: '🌗' },
        { id: 'story', name: 'Story', icon: '📱' },
        { id: 'minimal', name: 'Minimal', icon: '▫️' },
        { id: 'bento_modern', name: 'Grid', icon: '🏗️' },
        { id: 'lumia', name: 'Lumia', icon: '🔲' },
    ];

    return (
        <div className="space-y-6">
            {/* Layouts Row */}
            <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">1. Choose Layout Style</label>
                <div className="flex flex-wrap gap-2">
                    {layouts.map((layout) => (
                        <button
                            key={layout.id}
                            onClick={() => handleUpdate({ layoutStyle: layout.id })}
                            className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl border-2 transition-all ${settings.layoutStyle === layout.id
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm'
                                : 'border-slate-100 bg-white hover:border-slate-200 text-slate-400'
                                }`}
                        >
                            <span className="text-xl mb-1">{layout.icon}</span>
                            <span className="text-[8px] font-black uppercase tracking-tighter">
                                {layout.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Presets Row */}
            <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">2. Select Design Preset</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {themes.map((theme) => {
                        const isActive = currentThemeId === theme.id;
                        return (
                            <button
                                key={theme.id}
                                onClick={() => handleUpdate({ themeId: theme.id })}
                                className={`group relative h-20 rounded-xl border-2 transition-all duration-300 overflow-hidden ${isActive
                                    ? 'border-indigo-600 shadow-lg scale-105'
                                    : 'border-slate-100 hover:border-slate-200'
                                    }`}
                                title={theme.name}
                            >
                                <div className="absolute inset-0" style={{ background: theme.effects.gradient || theme.colors.primary }}></div>
                                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
                                {isActive && (
                                    <div className="absolute top-1 right-1 bg-white text-indigo-600 rounded-full p-0.5 shadow-sm">
                                        <CheckCircleIcon className="w-3 h-3" />
                                    </div>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 p-1 bg-white/90 backdrop-blur-sm">
                                    <p className={`text-[8px] font-black uppercase truncate text-center ${isActive ? 'text-indigo-600' : 'text-slate-600'}`}>{theme.name}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Customizer Row (Compact) */}
            <div className="flex flex-col sm:flex-row gap-6 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div className="flex-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Brand Color</label>
                    <div className="flex flex-wrap gap-2">
                        {['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#141414'].map((color) => (
                            <button
                                key={color}
                                onClick={() => handleUpdate({ primaryColor: color })}
                                className={`w-6 h-6 rounded-lg border-2 transition-transform ${settings.primaryColor === color ? 'scale-110 ring-1 ring-offset-2 ring-indigo-500 border-transparent shadow-sm' : 'border-white hover:scale-105'
                                    }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                        <div className="relative w-6 h-6 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-indigo-400 bg-white">
                            <span className="text-slate-400 text-[10px]">+</span>
                            <input
                                type="color"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                value={settings.primaryColor}
                                onChange={(e) => handleUpdate({ primaryColor: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-1 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-6 pt-4 sm:pt-0">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Status</label>
                    <div className="flex items-center gap-2">
                        {saving ? (
                            <div className="flex items-center gap-2 text-indigo-600">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest">Applying Design...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircleIcon className="w-3 h-3" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Design Applied</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThemeCustomizer;
