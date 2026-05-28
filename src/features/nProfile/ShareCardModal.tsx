import React, { useState, useRef, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { SpinnerIcon, DownloadIcon } from '../../components/Icons';

/* ═══════════════════════════════════════════════════════════
   ShareCardModal — Beautiful story-sized sharing cards
   6 preset styles, QR code, profile info, download/share
   ═══════════════════════════════════════════════════════════ */

interface ShareCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    profileData: {
        displayName?: string;
        username: string;
        photoURL?: string;
        bio?: string;
        subtitle?: string;
        businessCategory?: string;
        profileType?: string;
        themeSettings?: { primaryColor?: string };
    };
}

type CardStyle = 'midnight' | 'clean' | 'gradient' | 'frost' | 'split' | 'neon';

const STYLES: { id: CardStyle; name: string; emoji: string }[] = [
    { id: 'midnight', name: 'Midnight', emoji: '🌙' },
    { id: 'clean', name: 'Clean', emoji: '✨' },
    { id: 'gradient', name: 'Wave', emoji: '🌊' },
    { id: 'frost', name: 'Frost', emoji: '❄️' },
    { id: 'split', name: 'Bold', emoji: '⚡' },
    { id: 'neon', name: 'Neon', emoji: '💜' },
];

const ShareCardModal: React.FC<ShareCardModalProps> = ({ isOpen, onClose, profileData }) => {
    const [activeStyle, setActiveStyle] = useState<CardStyle>('midnight');
    const [isGenerating, setIsGenerating] = useState(false);
    const captureRef = useRef<HTMLDivElement>(null);

    const profileUrl = `${window.location.origin}/@${profileData.username}`;
    const primary = profileData.themeSettings?.primaryColor || '#6366f1';
    const initial = (profileData.displayName || profileData.username || 'N').charAt(0).toUpperCase();
    const designation = profileData.subtitle || profileData.businessCategory || '';

    // Download as high-res JPG
    const handleDownload = useCallback(async () => {
        if (!captureRef.current) return;
        setIsGenerating(true);
        try {
            await new Promise(r => setTimeout(r, 600));
            const canvas = await html2canvas(captureRef.current, {
                useCORS: true,
                scale: 2,
                backgroundColor: null,
                logging: false,
                allowTaint: true,
                width: 1080,
                height: 1920,
                windowWidth: 1080,
                windowHeight: 1920,
            });
            const link = document.createElement('a');
            link.download = `${profileData.username}-share-${activeStyle}-${Date.now()}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 0.95);
            link.click();
        } catch (err) {
            console.error('Failed to generate share card', err);
            alert('Failed to generate card. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    }, [activeStyle, profileData.username]);

    // Web Share API (mobile)
    const handleShare = useCallback(async () => {
        if (!captureRef.current) return;
        setIsGenerating(true);
        try {
            await new Promise(r => setTimeout(r, 600));
            const canvas = await html2canvas(captureRef.current, {
                useCORS: true,
                scale: 2,
                backgroundColor: null,
                logging: false,
                allowTaint: true,
                width: 1080,
                height: 1920,
                windowWidth: 1080,
                windowHeight: 1920,
            });
            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const file = new File([blob], `${profileData.username}-card.jpg`, { type: 'image/jpeg' });
                if (navigator.share && navigator.canShare?.({ files: [file] })) {
                    await navigator.share({
                        title: profileData.displayName || profileData.username,
                        text: `Check out my profile on Neoays!`,
                        files: [file],
                    });
                } else {
                    // Fallback: download
                    const link = document.createElement('a');
                    link.download = file.name;
                    link.href = URL.createObjectURL(blob);
                    link.click();
                }
                setIsGenerating(false);
            }, 'image/jpeg', 0.95);
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('Share failed', err);
            }
            setIsGenerating(false);
        }
    }, [activeStyle, profileData]);

    if (!isOpen) return null;

    // ══════════════ CARD RENDERERS ══════════════

    const renderPhoto = (size: string, borderColor: string, extraClass = '') => (
        profileData.photoURL ? (
            <img src={profileData.photoURL} alt="" className={`${size} rounded-full object-cover border-4 ${borderColor} shadow-2xl ${extraClass}`} crossOrigin="anonymous" />
        ) : (
            <div className={`${size} rounded-full ${borderColor} border-4 shadow-2xl flex items-center justify-center font-black text-white ${extraClass}`} style={{ backgroundColor: primary, fontSize: '100px' }}>
                {initial}
            </div>
        )
    );

    const renderQR = (qrSize: number, dark: string, light: string) => (
        <div className="bg-white p-4 rounded-3xl shadow-2xl">
            <QRCodeCanvas value={profileUrl} size={qrSize} level="H" fgColor={dark} bgColor={light} />
        </div>
    );

    const cardContent: Record<CardStyle, React.ReactNode> = {
        // ═══ 1. MIDNIGHT GLOW ═══
        midnight: (
            <div className="w-[1080px] h-[1920px] bg-[#0a0a1a] relative overflow-hidden flex flex-col items-center justify-center font-sans">
                {/* Glow effects */}
                <div className="absolute top-[20%] left-[30%] w-[500px] h-[500px] rounded-full opacity-20 blur-[150px]" style={{ backgroundColor: primary }}></div>
                <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] rounded-full opacity-15 blur-[120px] bg-purple-600"></div>

                {/* Photo with glow ring */}
                <div className="relative mb-16">
                    <div className="absolute inset-0 rounded-full blur-3xl opacity-40" style={{ backgroundColor: primary, transform: 'scale(1.3)' }}></div>
                    {renderPhoto('w-[280px] h-[280px]', 'border-white/20', 'relative z-10')}
                </div>

                <h1 className="text-[80px] font-black text-white text-center leading-[1.1] mb-4 z-10 px-12">
                    {profileData.displayName || profileData.username}
                </h1>
                {designation && (
                    <p className="text-[36px] font-medium text-white/60 text-center mb-12 z-10 px-16 uppercase tracking-[0.2em]">
                        {designation}
                    </p>
                )}
                <p className="text-[30px] text-white/40 text-center mb-20 z-10 px-20 leading-relaxed max-w-[900px] line-clamp-2">
                    {profileData.bio || 'Connect with me on Neoays'}
                </p>

                <div className="z-10">{renderQR(280, '#1a1a2e', '#ffffff')}</div>
                <p className="text-[22px] text-white/30 mt-8 uppercase tracking-[0.5em] font-bold z-10">Scan to connect</p>
            </div>
        ),

        // ═══ 2. CLEAN WHITE ═══
        clean: (
            <div className="w-[1080px] h-[1920px] bg-white relative overflow-hidden flex flex-col items-center justify-center font-sans">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gray-50 rounded-bl-full"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gray-50 rounded-tr-full"></div>

                {renderPhoto('w-[260px] h-[260px]', 'border-gray-100', 'relative z-10 mb-12')}

                <h1 className="text-[72px] font-black text-gray-900 text-center leading-[1.1] mb-4 z-10 px-12">
                    {profileData.displayName || profileData.username}
                </h1>
                {designation && (
                    <div className="z-10 mb-8 px-8 py-3 rounded-full" style={{ backgroundColor: `${primary}15` }}>
                        <p className="text-[28px] font-bold uppercase tracking-[0.15em]" style={{ color: primary }}>{designation}</p>
                    </div>
                )}
                <p className="text-[28px] text-gray-400 text-center mb-16 z-10 px-20 leading-relaxed max-w-[850px] line-clamp-2">
                    {profileData.bio || 'Connect with me digitally'}
                </p>

                <div className="z-10">{renderQR(260, primary, '#ffffff')}</div>
                <p className="text-[20px] text-gray-300 mt-6 uppercase tracking-[0.4em] font-bold z-10">@{profileData.username}</p>
            </div>
        ),

        // ═══ 3. GRADIENT WAVE ═══
        gradient: (
            <div className="w-[1080px] h-[1920px] relative overflow-hidden flex flex-col items-center justify-center font-sans"
                style={{ background: `linear-gradient(135deg, ${primary}, #7c3aed, #ec4899)` }}>
                {/* Wave decorations */}
                <div className="absolute top-0 left-0 w-full h-[400px] bg-white/5"></div>
                <div className="absolute bottom-0 left-0 w-full h-[350px] bg-black/10"></div>
                <div className="absolute top-[35%] left-[-5%] w-[500px] h-[500px] rounded-full bg-white/10 blur-3xl"></div>

                <div className="relative mb-12 z-10">
                    {renderPhoto('w-[300px] h-[300px]', 'border-white/30')}
                </div>

                <h1 className="text-[90px] font-black text-white text-center leading-[1.05] mb-4 z-10 px-12 drop-shadow-lg">
                    {profileData.displayName || profileData.username}
                </h1>
                {designation && (
                    <p className="text-[34px] font-bold text-white/80 text-center mb-10 z-10 bg-white/10 backdrop-blur-md px-10 py-3 rounded-full">
                        {designation}
                    </p>
                )}
                <p className="text-[30px] text-white/60 text-center mb-20 z-10 px-16 leading-relaxed max-w-[900px] line-clamp-2">
                    {profileData.bio || 'Discover my profile'}
                </p>

                <div className="z-10 bg-white/10 backdrop-blur-md p-6 rounded-[2rem] border border-white/20">
                    {renderQR(260, '#1e1e3f', '#ffffff')}
                </div>
                <p className="text-[22px] text-white/40 mt-8 uppercase tracking-[0.5em] font-bold z-10">Scan to connect</p>
            </div>
        ),

        // ═══ 4. GLASS FROST ═══
        frost: (
            <div className="w-[1080px] h-[1920px] relative overflow-hidden flex flex-col items-center justify-center font-sans bg-gray-100">
                {/* Blurred photo as background */}
                {profileData.photoURL && (
                    <>
                        <img src={profileData.photoURL} className="absolute inset-0 w-full h-full object-cover blur-[60px] scale-110 opacity-40" crossOrigin="anonymous" alt="" />
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl"></div>
                    </>
                )}
                {!profileData.photoURL && (
                    <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primary}30, #e0e7ff)` }}></div>
                )}

                {/* Glass card */}
                <div className="relative z-10 bg-white/70 backdrop-blur-2xl rounded-[60px] p-16 border border-white/50 shadow-2xl mx-12 flex flex-col items-center max-w-[900px]">
                    <div className="mb-10">
                        {renderPhoto('w-[240px] h-[240px]', 'border-white/80')}
                    </div>

                    <h1 className="text-[64px] font-black text-gray-900 text-center leading-[1.1] mb-3">
                        {profileData.displayName || profileData.username}
                    </h1>
                    {designation && (
                        <p className="text-[26px] font-bold text-gray-500 text-center mb-6 uppercase tracking-[0.15em]">{designation}</p>
                    )}
                    <p className="text-[24px] text-gray-400 text-center mb-12 leading-relaxed line-clamp-2 px-4">
                        {profileData.bio || 'Connect with me'}
                    </p>

                    {renderQR(220, primary, '#ffffff')}
                    <p className="text-[18px] text-gray-400 mt-6 uppercase tracking-[0.3em] font-bold">@{profileData.username}</p>
                </div>
            </div>
        ),

        // ═══ 5. SPLIT BOLD ═══
        split: (
            <div className="w-[1080px] h-[1920px] relative overflow-hidden flex flex-col font-sans bg-white">
                {/* Top half: Photo */}
                <div className="h-[960px] relative overflow-hidden" style={{ backgroundColor: primary }}>
                    {profileData.photoURL ? (
                        <img src={profileData.photoURL} className="w-full h-full object-cover opacity-90" crossOrigin="anonymous" alt="" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <span className="text-[300px] font-black text-white/20">{initial}</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60"></div>
                    <div className="absolute bottom-12 left-12 right-12 z-10">
                        <h1 className="text-[80px] font-black text-white leading-[1.05] drop-shadow-xl">
                            {profileData.displayName || profileData.username}
                        </h1>
                        {designation && (
                            <p className="text-[32px] font-bold text-white/70 mt-2 uppercase tracking-wider">{designation}</p>
                        )}
                    </div>
                </div>

                {/* Bottom half: Info + QR */}
                <div className="h-[960px] flex flex-col items-center justify-center px-16">
                    <p className="text-[30px] text-gray-500 text-center mb-16 leading-relaxed max-w-[850px] line-clamp-3">
                        {profileData.bio || 'Scan the QR code below to connect with me on my digital profile.'}
                    </p>
                    {renderQR(300, '#111111', '#ffffff')}
                    <p className="text-[24px] text-gray-300 mt-10 uppercase tracking-[0.5em] font-black">@{profileData.username}</p>
                </div>
            </div>
        ),

        // ═══ 6. NEON POP ═══
        neon: (
            <div className="w-[1080px] h-[1920px] bg-[#0f0f23] relative overflow-hidden flex flex-col items-center justify-center font-sans">
                {/* Neon glows */}
                <div className="absolute top-[10%] right-[10%] w-[300px] h-[300px] rounded-full blur-[100px] bg-pink-500 opacity-30"></div>
                <div className="absolute bottom-[15%] left-[10%] w-[350px] h-[350px] rounded-full blur-[100px] bg-cyan-500 opacity-25"></div>
                <div className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[600px] h-[600px] rounded-full blur-[150px] opacity-15" style={{ backgroundColor: primary }}></div>

                {/* Neon border photo */}
                <div className="relative mb-12 z-10">
                    <div className="absolute inset-[-8px] rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 blur-sm opacity-80"></div>
                    {renderPhoto('w-[260px] h-[260px]', 'border-[#0f0f23]', 'relative z-10')}
                </div>

                <h1 className="text-[76px] font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 text-center leading-[1.1] mb-4 z-10 px-12">
                    {profileData.displayName || profileData.username}
                </h1>
                {designation && (
                    <p className="text-[30px] font-bold text-cyan-300/60 text-center mb-10 z-10 uppercase tracking-[0.2em]">{designation}</p>
                )}
                <p className="text-[26px] text-white/30 text-center mb-16 z-10 px-20 leading-relaxed max-w-[850px] line-clamp-2">
                    {profileData.bio || 'Connect with me'}
                </p>

                <div className="z-10 p-1 rounded-3xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500">
                    <div className="bg-[#0f0f23] p-5 rounded-[22px]">
                        {renderQR(240, '#e0e0ff', '#0f0f23')}
                    </div>
                </div>
                <p className="text-[20px] text-purple-400/50 mt-8 uppercase tracking-[0.5em] font-bold z-10">@{profileData.username}</p>
            </div>
        ),
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/90 backdrop-blur-sm overflow-y-auto animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-3xl w-full max-w-lg m-4 overflow-hidden flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                    <div>
                        <h3 className="text-lg font-black text-gray-900">Share Card</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Choose a style & share</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-300 transition-colors text-sm font-bold">&times;</button>
                </div>

                {/* Style Selector — horizontal scroll */}
                <div className="flex gap-2 p-3 overflow-x-auto bg-gray-50 border-b border-gray-100 shrink-0">
                    {STYLES.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setActiveStyle(s.id)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${activeStyle === s.id
                                    ? 'bg-indigo-600 text-white shadow-lg scale-105'
                                    : 'bg-white text-gray-500 border border-gray-200 hover:border-indigo-200'
                                }`}
                        >
                            <span>{s.emoji}</span>
                            {s.name}
                        </button>
                    ))}
                </div>

                {/* Preview Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-200 flex flex-col items-center justify-center min-h-[300px]">
                    <div className="transform scale-[0.2] origin-center" style={{ width: '1080px', height: '1920px', margin: '-700px 0' }}>
                        {cardContent[activeStyle]}
                    </div>
                </div>

                {/* Actions */}
                <div className="p-4 bg-white border-t border-gray-100 flex gap-3 shrink-0">
                    <button onClick={onClose} className="px-5 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition flex-shrink-0">
                        Close
                    </button>
                    <div className="flex gap-2 flex-1 justify-end">
                        <button
                            onClick={handleDownload}
                            disabled={isGenerating}
                            className="px-5 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isGenerating ? <SpinnerIcon className="animate-spin h-4 w-4" /> : <DownloadIcon className="h-4 w-4" />}
                            Download
                        </button>
                        <button
                            onClick={handleShare}
                            disabled={isGenerating}
                            className="px-5 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isGenerating ? <SpinnerIcon className="animate-spin h-4 w-4" /> : '📤'}
                            Share
                        </button>
                    </div>
                </div>
            </div>

            {/* Hidden capture container — off-screen at full resolution */}
            <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
                <div ref={captureRef} style={{ width: '1080px', height: '1920px' }}>
                    {cardContent[activeStyle]}
                </div>
            </div>
        </div>
    );
};

export default ShareCardModal;
