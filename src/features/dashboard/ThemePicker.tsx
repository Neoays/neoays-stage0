import { useTheme } from '../../contexts/ThemeContext';
import { themes } from '../../themes/presets';
import { ThemeId } from '../../types/theme';
import { UserProfile } from '../../types';

interface ThemePickerProps {
    profileType: UserProfile['profileType'];
    selectedThemeId?: string;
    onSelect: (themeId: string) => void;
}

const ThemePicker: React.FC<ThemePickerProps> = ({ profileType, selectedThemeId, onSelect }) => {
    const { setTheme } = useTheme(); // We still use this for immediate local preview if needed, but primary source is profileData

    // Filter themes
    const availableThemes = themes.filter(theme =>
        !theme.supportedTypes || theme.supportedTypes.includes((profileType || 'personal') as any)
    );

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <span>🎨</span>
                <span>Profile Design & Theme</span>
            </h3>
            <p className="text-sm text-gray-500 mb-6">Choose a look that matches your {profileType} brand.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableThemes.map((theme) => {
                    const isSelected = selectedThemeId === theme.id;
                    return (
                        <button
                            key={theme.id}
                            onClick={() => {
                                setTheme(theme.id); // Update local context for immediate feedback
                                onSelect(theme.id); // Persist to database
                            }}
                            className={`group relative text-left rounded-xl overflow-hidden border-2 transition-all duration-300 ${isSelected
                                ? 'border-indigo-600 ring-2 ring-indigo-100 ring-offset-2'
                                : 'border-slate-100 hover:border-slate-300 hover:shadow-md'
                                }`}
                        >
                            {/* Preview Area */}
                            <div
                                className="h-24 w-full relative flex items-center justify-center overflow-hidden"
                                style={{
                                    background: theme.effects.gradient || theme.colors.primary
                                }}
                            >
                                <div className="flex gap-2 relative z-10 transform group-hover:scale-110 transition-transform duration-500">
                                    <div className="w-8 h-8 rounded-full shadow-lg border-2 border-white" style={{ background: theme.colors.surface }}></div>
                                    <div className="w-8 h-8 rounded-full shadow-lg border-2 border-white -ml-4" style={{ background: theme.colors.secondary }}></div>
                                    <div className="w-8 h-8 rounded-full shadow-lg border-2 border-white -ml-4" style={{ background: theme.colors.accent }}></div>
                                </div>
                                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
                            </div>

                            {/* Content Area */}
                            <div className="p-4 bg-white">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={`font-bold text-sm ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                                        {theme.name}
                                    </h4>
                                    {isSelected && (
                                        <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            ACTIVE
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-2">{theme.description}</p>
                            </div>

                            {/* Hover Overlay Checkmark */}
                            {!isSelected && (
                                <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <span className="bg-white/90 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                        Select
                                    </span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400">Pro Tip: Switch your Profile Type to see different theme collections.</p>
            </div>
        </div>
    );
};

export default ThemePicker;
