import React, { useState, useEffect } from 'react';
import neojayMascot from '../assets/Neojay.png';

interface BrandedLoaderProps {
    message?: string;
    onReset?: () => void;
}

const BrandedLoader = ({ message = "Loading...", onReset }: BrandedLoaderProps) => {
    const [showReset, setShowReset] = useState(false);

    useEffect(() => {
        // Show reset option if loading takes too long (8 seconds)
        const timer = setTimeout(() => {
            setShowReset(true);
        }, 8000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/95 backdrop-blur-xl">
            <div className="relative flex items-center justify-center mb-8">
                {/* Waving Mascot */}
                <div className="relative animate-bounce-slow">
                    <img
                        src={neojayMascot}
                        alt="Neojay Mascot"
                        className="h-32 w-auto drop-shadow-2xl"
                    />
                </div>
            </div>

            {/* Premium Indeterminate Spinner */}
            <div className="w-40 h-1.5 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 via-indigo-500 to-cyan-400 w-1/2 animate-indeterminate-bar rounded-full"></div>
            </div>

            <p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">
                {message}
            </p>

            {showReset && onReset && (
                <button
                    onClick={onReset}
                    className="mt-8 px-4 py-2 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-red-50 hover:text-red-500 transition-colors animate-fade-in-up"
                >
                    Stuck? Reset Application
                </button>
            )}
        </div>
    );
};

export default BrandedLoader;
