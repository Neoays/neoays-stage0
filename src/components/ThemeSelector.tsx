import React, { useState, CSSProperties } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { themes } from '../themes/presets';
import { ThemeId } from '../types/theme';

interface ThemeSelectorProps {
  profileType?: 'personal' | 'business' | 'ngo';
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ profileType = 'personal' }) => {
  const { themeId, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  // Filter themes based on profileType
  const availableThemes = themes.filter(theme =>
    !theme.supportedTypes || theme.supportedTypes.includes(profileType)
  );

  const handleThemeSelect = (selectedThemeId: ThemeId) => {
    setTheme(selectedThemeId);
    setIsOpen(false);
  };

  const currentTheme = themes.find(t => t.id === themeId);

  // Inline styles
  const buttonStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 1rem',
    background: 'white',
    border: '2px solid #e2e8f0',
    borderRadius: '0.75rem',
    color: '#1e293b',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const backdropStyle: CSSProperties = {
    position: 'fixed',
    inset: '0',
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: 40,
  };

  const modalStyle: CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'white',
    borderRadius: '1.5rem',
    padding: '2rem',
    maxWidth: '900px',
    width: '90%',
    maxHeight: '85vh',
    overflowY: 'auto',
    zIndex: 50,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  };

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  };

  const themeCardStyle: CSSProperties = {
    position: 'relative',
    border: '2px solid #e2e8f0',
    borderRadius: '1rem',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.3s',
  };

  const themeCardActiveStyle: CSSProperties = {
    ...themeCardStyle,
    borderColor: 'var(--color-primary, #6366f1)',
    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
  };

  const previewStyle: CSSProperties = {
    height: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  };

  const circleStyle: CSSProperties = {
    width: '2rem',
    height: '2rem',
    borderRadius: '50%',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  };

  const selectedBadgeStyle: CSSProperties = {
    position: 'absolute',
    top: '0.75rem',
    right: '0.75rem',
    background: 'var(--color-primary, #6366f1)',
    color: 'white',
    padding: '0.5rem',
    borderRadius: '50%',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Theme Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={buttonStyle}
        aria-label="Select theme"
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-primary, #6366f1)';
          e.currentTarget.style.background = 'var(--color-surface, #f8fafc)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#e2e8f0';
          e.currentTarget.style.background = 'white';
        }}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
        <span className="ml-2 hidden sm:inline">
          {currentTheme?.name || 'Theme'}
        </span>
      </button>

      {/* Theme Selector Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            style={backdropStyle}
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div style={modalStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Choose Your Theme</h3>
                <p className="text-sm text-gray-500 mt-1">Showing themes for <span className="font-bold capitalize">{profileType}</span> profiles</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '0.5rem' }}
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div style={gridStyle}>
              {availableThemes.map((theme) => (
                <div
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme.id)}
                  style={themeId === theme.id ? themeCardActiveStyle : themeCardStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    if (themeId !== theme.id) {
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {/* Theme Preview */}
                  <div
                    style={{
                      ...previewStyle,
                      background: theme.effects.gradient || theme.colors.primary,
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div style={{ ...circleStyle, backgroundColor: theme.colors.primary }} />
                      <div style={{ ...circleStyle, backgroundColor: theme.colors.secondary }} />
                      <div style={{ ...circleStyle, backgroundColor: theme.colors.accent }} />
                    </div>
                  </div>

                  {/* Theme Info */}
                  <div style={{ padding: '1rem', background: 'white' }}>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>
                      {theme.name}
                    </h4>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
                      {theme.description}
                    </p>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      background: '#f1f5f9',
                      color: '#475569',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      borderRadius: '9999px',
                      textTransform: 'capitalize' as const,
                    }}>
                      {theme.category}
                    </span>
                  </div>

                  {/* Selected Indicator */}
                  {themeId === theme.id && (
                    <div style={selectedBadgeStyle}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
              <p className="text-sm text-gray-500">
                More themes coming soon! 🎨
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default ThemeSelector;
