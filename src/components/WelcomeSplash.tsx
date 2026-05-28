import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface WelcomeSplashProps {
    profileData: UserProfile;
    isLoading: boolean;
}

const WelcomeSplash: React.FC<WelcomeSplashProps> = ({ profileData, isLoading }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [shouldRender, setShouldRender] = useState(true);

    useEffect(() => {
        if (!isLoading) {
            // Start fade out after loading is complete
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 500); // Small delay to appreciate the splash

            // Remove from DOM after transition
            const removeTimer = setTimeout(() => {
                setShouldRender(false);
            }, 1500);

            return () => {
                clearTimeout(timer);
                clearTimeout(removeTimer);
            };
        }
    }, [isLoading]);

    if (!shouldRender) return null;

    const displayName = profileData.displayName || profileData.username || 'User';

    return (
        <div
            className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-all duration-1000 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0 scale-110 pointer-events-none'
                }`}
            style={{
                background: profileData.themeSettings?.primaryColor
                    ? `linear-gradient(135deg, ${profileData.themeSettings.primaryColor}, #000)`
                    : 'linear-gradient(135deg, #4f46e5, #000)',
            }}
        >
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-white rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 text-center px-6 animate-scale-in">
                {/* Logo/Icon Placeholder */}
                <div className="w-24 h-24 mb-8 mx-auto relative">
                    <div className="absolute inset-0 bg-white/20 rounded-3xl blur-2xl animate-pulse"></div>
                    <div className="w-full h-full bg-white/10 backdrop-blur-xl rounded-3xl border border-white/30 flex items-center justify-center text-4xl shadow-2xl">
                        ✨
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-white/60 text-xs font-black uppercase tracking-[0.4em] animate-fade-in">
                        Welcome to
                    </h2>
                    <h1 className="text-white text-4xl md:text-5xl font-black tracking-tighter mb-8">
                        {displayName}
                    </h1>

                    {profileData.welcomeMessage && (
                        <div className="max-w-md mx-auto py-4 px-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                            <p className="text-white/90 text-lg font-medium leading-relaxed italic">
                                "{profileData.welcomeMessage}"
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-12 flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
            </div>

            {/* Branding Footer */}
            <div className="absolute bottom-10 left-0 w-full text-center">
                <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">
                    Powered by Neoays
                </p>
            </div>
        </div>
    );
};

export default WelcomeSplash;
