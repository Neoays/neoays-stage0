import React, { useState, useRef, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { SpinnerIcon, DownloadIcon } from '../../components/Icons';

/* ═══════════════════════════════════════════════════════════════════
   TEMPLATE STUDIO — Creative profile sharing with 12+ templates
   Categories: Classic · Fun · Travel · Pro
   + Photo filters + AI placeholder
   ═══════════════════════════════════════════════════════════════════ */

interface TemplateStudioProps {
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

// ═══════ TEMPLATE DEFINITIONS ═══════
type Category = 'classic' | 'fun' | 'travel' | 'pro';
type TemplateId = 'midnight' | 'clean' | 'gradient' | 'neon' | 'passport' | 'wanted' | 'trading' | 'movie' | 'boarding' | 'polaroid' | 'newspaper' | 'idbadge';

interface TemplateDef {
    id: TemplateId;
    name: string;
    emoji: string;
    category: Category;
}

const CATEGORIES: { id: Category; label: string; emoji: string }[] = [
    { id: 'classic', label: 'Classic', emoji: '🎨' },
    { id: 'fun', label: 'Fun', emoji: '🎭' },
    { id: 'travel', label: 'Travel', emoji: '🎫' },
    { id: 'pro', label: 'Pro', emoji: '📰' },
];

const TEMPLATES: TemplateDef[] = [
    { id: 'midnight', name: 'Midnight', emoji: '🌙', category: 'classic' },
    { id: 'clean', name: 'Clean', emoji: '✨', category: 'classic' },
    { id: 'gradient', name: 'Wave', emoji: '🌊', category: 'classic' },
    { id: 'neon', name: 'Neon', emoji: '💜', category: 'classic' },
    { id: 'passport', name: 'Passport', emoji: '📕', category: 'fun' },
    { id: 'wanted', name: 'Wanted', emoji: '🤠', category: 'fun' },
    { id: 'trading', name: 'Card', emoji: '🃏', category: 'fun' },
    { id: 'movie', name: 'Movie', emoji: '🎬', category: 'fun' },
    { id: 'boarding', name: 'Boarding', emoji: '✈️', category: 'travel' },
    { id: 'polaroid', name: 'Polaroid', emoji: '📸', category: 'travel' },
    { id: 'newspaper', name: 'News', emoji: '📰', category: 'pro' },
    { id: 'idbadge', name: 'ID Badge', emoji: '🪪', category: 'pro' },
];

// ═══════ PHOTO FILTERS ═══════
const FILTERS = [
    { id: 'none', name: 'None', css: 'none' },
    { id: 'vintage', name: 'Vintage', css: 'sepia(0.4) contrast(1.1) brightness(0.95)' },
    { id: 'sepia', name: 'Sepia', css: 'sepia(0.8)' },
    { id: 'bw', name: 'B&W', css: 'grayscale(1) contrast(1.2)' },
    { id: 'warm', name: 'Warm', css: 'sepia(0.2) saturate(1.4) brightness(1.05)' },
    { id: 'cool', name: 'Cool', css: 'saturate(0.8) brightness(1.1) hue-rotate(15deg)' },
    { id: 'vivid', name: 'Vivid', css: 'saturate(1.8) contrast(1.1)' },
    { id: 'soft', name: 'Soft', css: 'brightness(1.1) contrast(0.9) blur(0.3px)' },
];

const TemplateStudio: React.FC<TemplateStudioProps> = ({ isOpen, onClose, profileData }) => {
    const [activeTemplate, setActiveTemplate] = useState<TemplateId>('passport');
    const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
    const [activeFilter, setActiveFilter] = useState('none');
    const [isGenerating, setIsGenerating] = useState(false);
    const captureRef = useRef<HTMLDivElement>(null);

    const profileUrl = `${window.location.origin}/@${profileData.username}`;
    const primary = profileData.themeSettings?.primaryColor || '#6366f1';
    const initial = (profileData.displayName || profileData.username || 'N').charAt(0).toUpperCase();
    const designation = profileData.subtitle || profileData.businessCategory || '';
    const filterCss = FILTERS.find(f => f.id === activeFilter)?.css || 'none';

    const filteredTemplates = activeCategory === 'all'
        ? TEMPLATES
        : TEMPLATES.filter(t => t.category === activeCategory);

    // Download
    const handleDownload = useCallback(async () => {
        if (!captureRef.current) return;
        setIsGenerating(true);
        try {
            await new Promise(r => setTimeout(r, 600));
            const canvas = await html2canvas(captureRef.current, {
                useCORS: true, scale: 2, backgroundColor: null,
                logging: false, allowTaint: true,
                width: 1080, height: 1920, windowWidth: 1080, windowHeight: 1920,
            });
            const link = document.createElement('a');
            link.download = `${profileData.username}-${activeTemplate}-${Date.now()}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 0.95);
            link.click();
        } catch { alert('Failed to generate. Please try again.'); }
        finally { setIsGenerating(false); }
    }, [activeTemplate, profileData.username]);

    // Share
    const handleShare = useCallback(async () => {
        if (!captureRef.current) return;
        setIsGenerating(true);
        try {
            await new Promise(r => setTimeout(r, 600));
            const canvas = await html2canvas(captureRef.current, {
                useCORS: true, scale: 2, backgroundColor: null,
                logging: false, allowTaint: true,
                width: 1080, height: 1920, windowWidth: 1080, windowHeight: 1920,
            });
            canvas.toBlob(async (blob) => {
                if (!blob) { setIsGenerating(false); return; }
                const file = new File([blob], `${profileData.username}-card.jpg`, { type: 'image/jpeg' });
                if (navigator.share && navigator.canShare?.({ files: [file] })) {
                    await navigator.share({ title: profileData.displayName || profileData.username, text: 'Check out my profile!', files: [file] });
                } else {
                    const link = document.createElement('a');
                    link.download = file.name;
                    link.href = URL.createObjectURL(blob);
                    link.click();
                }
                setIsGenerating(false);
            }, 'image/jpeg', 0.95);
        } catch (err: any) {
            if (err.name !== 'AbortError') console.error(err);
            setIsGenerating(false);
        }
    }, [activeTemplate, profileData]);

    if (!isOpen) return null;

    // ═══════ PHOTO WITH FILTER ═══════
    const renderPhoto = (size: string, extra = '', borderStyle = 'border-4 border-white/30') => {
        const filterStyle = filterCss !== 'none' ? { filter: filterCss } : {};
        return profileData.photoURL ? (
            <img src={profileData.photoURL} alt="" className={`${size} rounded-full object-cover ${borderStyle} shadow-2xl ${extra}`} style={filterStyle} crossOrigin="anonymous" />
        ) : (
            <div className={`${size} rounded-full ${borderStyle} shadow-2xl flex items-center justify-center font-black text-white ${extra}`} style={{ backgroundColor: primary, fontSize: '100px' }}>
                {initial}
            </div>
        );
    };

    const renderPhotoSquare = (size: string, extra = '') => {
        const filterStyle = filterCss !== 'none' ? { filter: filterCss } : {};
        return profileData.photoURL ? (
            <img src={profileData.photoURL} alt="" className={`${size} object-cover shadow-2xl ${extra}`} style={filterStyle} crossOrigin="anonymous" />
        ) : (
            <div className={`${size} flex items-center justify-center font-black text-white ${extra}`} style={{ backgroundColor: primary, fontSize: '120px' }}>{initial}</div>
        );
    };

    const renderQR = (qrSize: number, dark = '#111', light = '#fff') => (
        <div className="bg-white p-4 rounded-2xl shadow-xl"><QRCodeCanvas value={profileUrl} size={qrSize} level="H" fgColor={dark} bgColor={light} /></div>
    );

    const name = profileData.displayName || profileData.username;
    const bio = profileData.bio || 'Connect with me on Neoays';
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // ═══════════════════════════════════════════════════════════════
    //  TEMPLATE RENDERERS
    // ═══════════════════════════════════════════════════════════════

    const CARD: Record<TemplateId, React.ReactNode> = {

        // ═══ CLASSIC: MIDNIGHT ═══
        midnight: (
            <div className="w-[1080px] h-[1920px] bg-[#0a0a1a] relative overflow-hidden flex flex-col items-center justify-center">
                <div className="absolute top-[20%] left-[30%] w-[500px] h-[500px] rounded-full opacity-20 blur-[150px]" style={{ backgroundColor: primary }}></div>
                <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] rounded-full opacity-15 blur-[120px] bg-purple-600"></div>
                <div className="relative mb-16">
                    <div className="absolute inset-0 rounded-full blur-3xl opacity-40" style={{ backgroundColor: primary, transform: 'scale(1.3)' }}></div>
                    {renderPhoto('w-[280px] h-[280px]', 'relative z-10', 'border-4 border-white/20')}
                </div>
                <h1 className="text-[80px] font-black text-white text-center leading-[1.1] mb-4 z-10 px-12">{name}</h1>
                {designation && <p className="text-[36px] font-medium text-white/60 text-center mb-12 z-10 px-16 uppercase tracking-[0.2em]">{designation}</p>}
                <p className="text-[30px] text-white/40 text-center mb-20 z-10 px-20 leading-relaxed max-w-[900px] line-clamp-2">{bio}</p>
                <div className="z-10">{renderQR(280, '#1a1a2e')}</div>
                <p className="text-[22px] text-white/30 mt-8 uppercase tracking-[0.5em] font-bold z-10">Scan to connect</p>
            </div>
        ),

        // ═══ CLASSIC: CLEAN ═══
        clean: (
            <div className="w-[1080px] h-[1920px] bg-white relative overflow-hidden flex flex-col items-center justify-center">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gray-50 rounded-bl-full"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gray-50 rounded-tr-full"></div>
                {renderPhoto('w-[260px] h-[260px]', 'relative z-10 mb-12', 'border-4 border-gray-100')}
                <h1 className="text-[72px] font-black text-gray-900 text-center leading-[1.1] mb-4 z-10 px-12">{name}</h1>
                {designation && <div className="z-10 mb-8 px-8 py-3 rounded-full" style={{ backgroundColor: `${primary}15` }}><p className="text-[28px] font-bold uppercase tracking-[0.15em]" style={{ color: primary }}>{designation}</p></div>}
                <p className="text-[28px] text-gray-400 text-center mb-16 z-10 px-20 leading-relaxed max-w-[850px] line-clamp-2">{bio}</p>
                <div className="z-10">{renderQR(260, primary)}</div>
                <p className="text-[20px] text-gray-300 mt-6 uppercase tracking-[0.4em] font-bold z-10">@{profileData.username}</p>
            </div>
        ),

        // ═══ CLASSIC: GRADIENT ═══
        gradient: (
            <div className="w-[1080px] h-[1920px] relative overflow-hidden flex flex-col items-center justify-center" style={{ background: `linear-gradient(135deg, ${primary}, #7c3aed, #ec4899)` }}>
                <div className="absolute top-[35%] left-[-5%] w-[500px] h-[500px] rounded-full bg-white/10 blur-3xl"></div>
                <div className="relative mb-12 z-10">{renderPhoto('w-[300px] h-[300px]', '', 'border-4 border-white/30')}</div>
                <h1 className="text-[90px] font-black text-white text-center leading-[1.05] mb-4 z-10 px-12 drop-shadow-lg">{name}</h1>
                {designation && <p className="text-[34px] font-bold text-white/80 text-center mb-10 z-10 bg-white/10 backdrop-blur-md px-10 py-3 rounded-full">{designation}</p>}
                <p className="text-[30px] text-white/60 text-center mb-20 z-10 px-16 leading-relaxed max-w-[900px] line-clamp-2">{bio}</p>
                <div className="z-10 bg-white/10 backdrop-blur-md p-6 rounded-[2rem] border border-white/20">{renderQR(260, '#1e1e3f')}</div>
            </div>
        ),

        // ═══ CLASSIC: NEON ═══
        neon: (
            <div className="w-[1080px] h-[1920px] bg-[#0f0f23] relative overflow-hidden flex flex-col items-center justify-center">
                <div className="absolute top-[10%] right-[10%] w-[300px] h-[300px] rounded-full blur-[100px] bg-pink-500 opacity-30"></div>
                <div className="absolute bottom-[15%] left-[10%] w-[350px] h-[350px] rounded-full blur-[100px] bg-cyan-500 opacity-25"></div>
                <div className="relative mb-12 z-10">
                    <div className="absolute inset-[-8px] rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 blur-sm opacity-80"></div>
                    {renderPhoto('w-[260px] h-[260px]', 'relative z-10', 'border-4 border-[#0f0f23]')}
                </div>
                <h1 className="text-[76px] font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 text-center leading-[1.1] mb-4 z-10 px-12">{name}</h1>
                {designation && <p className="text-[30px] font-bold text-cyan-300/60 text-center mb-10 z-10 uppercase tracking-[0.2em]">{designation}</p>}
                <p className="text-[26px] text-white/30 text-center mb-16 z-10 px-20 leading-relaxed max-w-[850px] line-clamp-2">{bio}</p>
                <div className="z-10 p-1 rounded-3xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500"><div className="bg-[#0f0f23] p-5 rounded-[22px]">{renderQR(240, '#e0e0ff', '#0f0f23')}</div></div>
            </div>
        ),

        // ═══════════════════════════════════════════════
        //                    FUN
        // ═══════════════════════════════════════════════

        // ═══ FUN: OLD PASSPORT ═══
        passport: (
            <div className="w-[1080px] h-[1920px] relative overflow-hidden flex flex-col" style={{ background: 'linear-gradient(180deg, #1a3a2a 0%, #1f4d35 10%, #f5e6c8 10%, #f5e6c8 90%, #1a3a2a 90%)' }}>
                {/* Green header */}
                <div className="h-[190px] flex items-center justify-center px-16">
                    <div className="text-center">
                        <p className="text-[24px] text-amber-200/80 font-bold uppercase tracking-[0.5em]">Digital Identity</p>
                        <h2 className="text-[48px] font-black text-white tracking-[0.15em] mt-1">PASSPORT</h2>
                    </div>
                </div>

                {/* Passport page */}
                <div className="flex-1 bg-[#f5e6c8] px-16 py-12 flex flex-col">
                    {/* Decorative border */}
                    <div className="flex-1 border-[3px] border-[#c4a882] rounded-lg p-12 flex flex-col" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(196,168,130,0.1) 40px, rgba(196,168,130,0.1) 41px)' }}>

                        {/* Photo + Details row */}
                        <div className="flex gap-12 mb-12">
                            <div className="border-[3px] border-[#8b7355] p-2 bg-white shadow-md">
                                {renderPhotoSquare('w-[280px] h-[350px]', 'rounded-none')}
                            </div>
                            <div className="flex-1 space-y-6">
                                <div><p className="text-[18px] text-[#8b7355] font-bold uppercase tracking-widest">Surname / Name</p><p className="text-[42px] font-black text-[#1a1a1a] leading-tight mt-1">{name}</p></div>
                                {designation && <div><p className="text-[18px] text-[#8b7355] font-bold uppercase tracking-widest">Designation</p><p className="text-[32px] font-bold text-[#333] mt-1">{designation}</p></div>}
                                <div><p className="text-[18px] text-[#8b7355] font-bold uppercase tracking-widest">Username</p><p className="text-[28px] font-mono font-bold text-[#333] mt-1">@{profileData.username}</p></div>
                                <div><p className="text-[18px] text-[#8b7355] font-bold uppercase tracking-widest">Date of Issue</p><p className="text-[24px] font-bold text-[#333] mt-1">{dateStr}</p></div>
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="mb-8 border-t-2 border-[#c4a882] pt-6">
                            <p className="text-[18px] text-[#8b7355] font-bold uppercase tracking-widest mb-2">About</p>
                            <p className="text-[26px] text-[#444] leading-relaxed line-clamp-3">{bio}</p>
                        </div>

                        {/* Stamps & QR */}
                        <div className="flex items-end justify-between mt-auto">
                            <div className="space-y-3">
                                <div className="w-[180px] h-[180px] border-[4px] border-red-700/30 rounded-full flex items-center justify-center transform -rotate-12">
                                    <div className="text-center"><p className="text-red-700/40 font-black text-[20px] uppercase tracking-wider">VERIFIED</p><p className="text-red-700/30 font-bold text-[14px]">NEOAYS</p></div>
                                </div>
                            </div>
                            <div className="bg-white p-4 border-2 border-[#8b7355] shadow-md">
                                <QRCodeCanvas value={profileUrl} size={200} level="H" fgColor="#1a3a2a" bgColor="#ffffff" />
                                <p className="text-center text-[14px] text-[#8b7355] font-bold mt-2 uppercase tracking-wider">Scan to verify</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Green footer */}
                <div className="h-[190px] flex items-center justify-center">
                    <p className="text-[20px] text-amber-200/40 font-bold uppercase tracking-[0.4em]">NEOAYS DIGITAL IDENTITY SYSTEM</p>
                </div>
            </div>
        ),

        // ═══ FUN: WANTED POSTER ═══
        wanted: (
            <div className="w-[1080px] h-[1920px] relative overflow-hidden flex flex-col items-center" style={{ background: 'linear-gradient(180deg, #d4a96a 0%, #c49a5c 30%, #b8894f 70%, #a07740 100%)' }}>
                {/* Texture overlay */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(0,0,0,0.1) 100%)' }}></div>

                {/* Top decoration */}
                <div className="mt-16 mb-6 z-10 text-center">
                    <div className="inline-block border-4 border-[#5c3a1e] px-12 py-2"><p className="text-[28px] text-[#5c3a1e] font-black uppercase tracking-[0.3em]">REWARD</p></div>
                </div>

                <h1 className="text-[140px] font-black text-[#3a1f0a] z-10 tracking-tight leading-[0.9]" style={{ fontFamily: 'Georgia, serif' }}>WANTED</h1>
                <p className="text-[36px] text-[#5c3a1e] font-bold z-10 mb-8 uppercase tracking-[0.3em]">Dead or Alive</p>

                {/* Photo frame */}
                <div className="z-10 bg-[#f5e6d0] p-4 border-4 border-[#5c3a1e] mb-8 shadow-2xl">
                    {renderPhotoSquare('w-[450px] h-[450px]', 'rounded-none')}
                </div>

                <h2 className="text-[72px] font-black text-[#3a1f0a] z-10 text-center px-12 leading-tight mb-4" style={{ fontFamily: 'Georgia, serif' }}>{name}</h2>
                {designation && <p className="text-[30px] text-[#5c3a1e] font-bold z-10 uppercase tracking-wider mb-6">{designation}</p>}

                <p className="text-[28px] text-[#5c3a1e]/80 z-10 text-center px-20 leading-relaxed max-w-[850px] line-clamp-2 mb-10" style={{ fontFamily: 'Georgia, serif' }}>{bio}</p>

                <div className="z-10 bg-[#f5e6d0] p-4 border-2 border-[#5c3a1e] mb-6">
                    <QRCodeCanvas value={profileUrl} size={180} level="H" fgColor="#3a1f0a" bgColor="#f5e6d0" />
                </div>
                <p className="text-[20px] text-[#5c3a1e]/50 z-10 uppercase tracking-[0.4em] font-bold">Scan to Connect</p>
            </div>
        ),

        // ═══ FUN: TRADING CARD ═══
        trading: (
            <div className="w-[1080px] h-[1920px] relative overflow-hidden flex flex-col" style={{ background: `linear-gradient(135deg, ${primary}, #1e1e3f)` }}>
                {/* Card frame */}
                <div className="m-8 flex-1 bg-[#1a1a2e] rounded-[40px] border-[6px] overflow-hidden flex flex-col" style={{ borderColor: primary }}>
                    {/* Top: Photo area */}
                    <div className="relative h-[900px] overflow-hidden">
                        {profileData.photoURL ? (
                            <img src={profileData.photoURL} className="w-full h-full object-cover" style={{ filter: filterCss !== 'none' ? filterCss : undefined }} crossOrigin="anonymous" alt="" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: primary }}><span className="text-[250px] font-black text-white/20">{initial}</span></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#1a1a2e]"></div>
                        {/* Rarity badge */}
                        <div className="absolute top-6 right-6 px-6 py-2 rounded-full shadow-xl" style={{ backgroundColor: primary }}>
                            <p className="text-white font-black text-[20px] uppercase tracking-wider">★ LEGENDARY</p>
                        </div>
                    </div>

                    {/* Bottom: Info */}
                    <div className="flex-1 px-12 pb-12 flex flex-col">
                        <h1 className="text-[64px] font-black text-white leading-tight">{name}</h1>
                        {designation && <p className="text-[26px] font-bold text-white/50 uppercase tracking-wider mt-1">{designation}</p>}

                        <p className="text-[22px] text-white/40 mt-6 leading-relaxed line-clamp-2">{bio}</p>

                        {/* Stats bar */}
                        <div className="grid grid-cols-3 gap-4 mt-8 mb-8">
                            {[{ label: 'CONNECT', val: '∞' }, { label: 'NETWORK', val: 'S+' }, { label: 'IMPACT', val: '99' }].map(s => (
                                <div key={s.label} className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
                                    <p className="text-[36px] font-black text-white">{s.val}</p>
                                    <p className="text-[14px] text-white/40 font-bold uppercase tracking-wider">{s.label}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto flex items-end justify-between">
                            <div><p className="text-[16px] text-white/20 uppercase tracking-widest font-bold">@{profileData.username}</p><p className="text-[14px] text-white/10 mt-1">{dateStr}</p></div>
                            <div className="bg-white p-3 rounded-xl shadow-xl"><QRCodeCanvas value={profileUrl} size={120} level="H" /></div>
                        </div>
                    </div>
                </div>
            </div>
        ),

        // ═══ FUN: MOVIE POSTER ═══
        movie: (
            <div className="w-[1080px] h-[1920px] bg-black relative overflow-hidden flex flex-col">
                {/* Dramatic photo */}
                <div className="h-[1200px] relative overflow-hidden">
                    {profileData.photoURL ? (
                        <img src={profileData.photoURL} className="w-full h-full object-cover scale-110" style={{ filter: `${filterCss !== 'none' ? filterCss + ' ' : ''}contrast(1.2) brightness(0.8)` }} crossOrigin="anonymous" alt="" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-800 to-black"><span className="text-[400px] font-black text-white/5">{initial}</span></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black"></div>
                    <div className="absolute top-12 left-0 right-0 text-center">
                        <p className="text-[20px] text-white/30 uppercase tracking-[0.8em] font-bold">Neoays Studios Presents</p>
                    </div>
                </div>

                {/* Title area */}
                <div className="flex-1 flex flex-col items-center justify-center text-center px-12 relative z-10">
                    <h1 className="text-[100px] font-black text-white leading-[0.95] tracking-tight">{name.toUpperCase()}</h1>
                    {designation && <p className="text-[32px] font-bold text-amber-400 mt-4 uppercase tracking-[0.2em]">{designation}</p>}
                    <p className="text-[24px] text-white/40 mt-4 leading-relaxed max-w-[800px] line-clamp-2">{bio}</p>
                    <div className="flex items-center gap-6 mt-8">
                        <div className="bg-white p-3 rounded-xl"><QRCodeCanvas value={profileUrl} size={100} level="H" /></div>
                        <div className="text-left"><p className="text-white/60 text-[18px] font-bold uppercase tracking-wider">Scan QR</p><p className="text-white/30 text-[16px]">To connect</p></div>
                    </div>
                    <p className="text-[16px] text-white/15 mt-6 uppercase tracking-[0.5em] font-bold">Coming soon to a network near you</p>
                </div>
            </div>
        ),

        // ═══════════════════════════════════════════════
        //                   TRAVEL
        // ═══════════════════════════════════════════════

        // ═══ TRAVEL: BOARDING PASS ═══
        boarding: (
            <div className="w-[1080px] h-[1920px] bg-[#f0f4f8] relative overflow-hidden flex flex-col items-center justify-center p-12">
                <div className="w-full bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-200">
                    {/* Airline header */}
                    <div className="px-12 py-8 flex justify-between items-center" style={{ backgroundColor: primary }}>
                        <div><p className="text-white text-[24px] font-black uppercase tracking-widest">Neoays Airlines</p><p className="text-white/60 text-[16px] font-bold">Digital Boarding Pass</p></div>
                        <div className="text-white text-right"><p className="text-[18px] font-bold uppercase tracking-wider">Class</p><p className="text-[36px] font-black">VIP</p></div>
                    </div>

                    {/* Main content */}
                    <div className="p-12 space-y-10">
                        <div className="flex justify-between items-end">
                            <div><p className="text-[18px] text-gray-400 font-bold uppercase tracking-widest">Passenger</p><p className="text-[48px] font-black text-gray-900 leading-tight">{name}</p>{designation && <p className="text-[22px] text-gray-400 font-bold mt-1">{designation}</p>}</div>
                            <div className="shrink-0 ml-8">{renderPhoto('w-[140px] h-[140px]', '', 'border-4 border-gray-200')}</div>
                        </div>

                        <div className="grid grid-cols-3 gap-8">
                            <div><p className="text-[16px] text-gray-400 font-bold uppercase tracking-widest">From</p><p className="text-[48px] font-black text-gray-900">YOU</p></div>
                            <div className="flex items-center justify-center"><span className="text-[48px]">✈️</span></div>
                            <div className="text-right"><p className="text-[16px] text-gray-400 font-bold uppercase tracking-widest">To</p><p className="text-[48px] font-black" style={{ color: primary }}>ME</p></div>
                        </div>

                        <div className="grid grid-cols-3 gap-8">
                            <div><p className="text-[14px] text-gray-400 font-bold uppercase tracking-widest">Date</p><p className="text-[24px] font-bold text-gray-900">{dateStr}</p></div>
                            <div><p className="text-[14px] text-gray-400 font-bold uppercase tracking-widest">Gate</p><p className="text-[24px] font-bold text-gray-900">OPEN</p></div>
                            <div><p className="text-[14px] text-gray-400 font-bold uppercase tracking-widest">Seat</p><p className="text-[24px] font-bold text-gray-900">1A</p></div>
                        </div>

                        <p className="text-[22px] text-gray-400 leading-relaxed line-clamp-2">{bio}</p>
                    </div>

                    {/* Tear line */}
                    <div className="border-t-[3px] border-dashed border-gray-200 mx-6"></div>

                    {/* QR section */}
                    <div className="p-12 flex items-center justify-between">
                        <div><p className="text-[16px] text-gray-400 font-bold uppercase tracking-widest">@{profileData.username}</p><p className="text-[14px] text-gray-300 mt-1">Scan to board</p></div>
                        <QRCodeCanvas value={profileUrl} size={160} level="H" />
                    </div>
                </div>
            </div>
        ),

        // ═══ TRAVEL: POLAROID ═══
        polaroid: (
            <div className="w-[1080px] h-[1920px] bg-gradient-to-br from-amber-50 to-orange-100 relative overflow-hidden flex flex-col items-center justify-center">
                {/* Polaroid frame */}
                <div className="bg-white p-8 pb-24 shadow-2xl transform rotate-[-2deg]" style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
                    {renderPhotoSquare('w-[700px] h-[700px]', 'rounded-none')}
                </div>

                {/* Handwritten text */}
                <div className="mt-12 text-center z-10 transform rotate-[-1deg]">
                    <h1 className="text-[72px] font-black text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>{name}</h1>
                    {designation && <p className="text-[30px] text-gray-500 mt-2" style={{ fontFamily: 'Georgia, serif' }}>{designation}</p>}
                    <p className="text-[24px] text-gray-400 mt-6 px-16 max-w-[800px] leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>{bio}</p>
                </div>

                <div className="mt-12 z-10">{renderQR(180, '#333')}</div>
                <p className="text-[18px] text-gray-400 mt-4 z-10 uppercase tracking-widest font-bold">@{profileData.username}</p>
            </div>
        ),

        // ═══════════════════════════════════════════════
        //                     PRO
        // ═══════════════════════════════════════════════

        // ═══ PRO: NEWSPAPER ═══
        newspaper: (
            <div className="w-[1080px] h-[1920px] bg-[#faf8f0] relative overflow-hidden flex flex-col p-12">
                {/* Masthead */}
                <div className="text-center border-b-[6px] border-double border-gray-900 pb-4 mb-2">
                    <p className="text-[16px] text-gray-500 font-bold uppercase tracking-[0.4em]">Neoays Digital Times</p>
                    <h1 className="text-[80px] font-black text-gray-900 leading-[0.9]" style={{ fontFamily: 'Georgia, Times, serif' }}>THE DAILY PROFILE</h1>
                    <div className="flex justify-between items-center mt-2 px-8"><p className="text-[16px] text-gray-500">{dateStr}</p><p className="text-[16px] text-gray-500">Special Edition</p><p className="text-[16px] text-gray-500">Vol. 1 No. 1</p></div>
                </div>
                <div className="border-b-2 border-gray-900 mb-6"></div>

                {/* Headline */}
                <h2 className="text-[64px] font-black text-gray-900 leading-[1.05] mb-4" style={{ fontFamily: 'Georgia, Times, serif' }}>
                    "{name}" Makes Digital Debut
                </h2>
                <p className="text-[24px] text-gray-600 font-bold mb-6 italic" style={{ fontFamily: 'Georgia, Times, serif' }}>{designation || 'Profile now available for digital connection'}</p>

                {/* Photo + Article */}
                <div className="flex gap-8 mb-8">
                    <div className="border-2 border-gray-300 p-1 bg-white shrink-0">
                        {renderPhotoSquare('w-[350px] h-[400px]', 'rounded-none')}
                        <p className="text-[14px] text-gray-500 text-center mt-2 italic">{name} — Photo</p>
                    </div>
                    <div className="flex-1" style={{ columns: '1', fontFamily: 'Georgia, Times, serif' }}>
                        <p className="text-[22px] text-gray-700 leading-relaxed mb-4 first-letter:text-[56px] first-letter:font-bold first-letter:float-left first-letter:mr-2 first-letter:leading-[0.8]">{bio}</p>
                        <p className="text-[22px] text-gray-700 leading-relaxed">Scan the QR code below to connect with {name} directly through their digital profile on the Neoays platform. A new era of digital networking has arrived.</p>
                    </div>
                </div>

                {/* QR & footer */}
                <div className="mt-auto border-t-2 border-gray-300 pt-6 flex items-center justify-between">
                    <div><p className="text-[18px] text-gray-500 font-bold uppercase tracking-widest">Connect Now</p><p className="text-[14px] text-gray-400 mt-1">@{profileData.username} on Neoays</p></div>
                    <QRCodeCanvas value={profileUrl} size={160} level="H" fgColor="#111" />
                </div>
            </div>
        ),

        // ═══ PRO: ID BADGE ═══
        idbadge: (
            <div className="w-[1080px] h-[1920px] bg-gray-100 relative overflow-hidden flex flex-col items-center justify-center p-12">
                <div className="w-full max-w-[900px] bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-200">
                    {/* Badge header */}
                    <div className="h-[180px] flex items-center px-12" style={{ backgroundColor: primary }}>
                        <div className="flex items-center gap-6">
                            <div className="w-[60px] h-[60px] bg-white/20 rounded-full flex items-center justify-center"><span className="text-white text-[30px] font-black">N</span></div>
                            <div><p className="text-white text-[28px] font-black uppercase tracking-wider">NEOAYS</p><p className="text-white/60 text-[18px] font-bold">Digital Identity Card</p></div>
                        </div>
                    </div>

                    {/* Badge body */}
                    <div className="p-12 flex flex-col items-center text-center">
                        <div className="border-[6px] rounded-full p-1 mb-8" style={{ borderColor: primary }}>{renderPhoto('w-[280px] h-[280px]', '', 'border-none')}</div>
                        <h1 className="text-[56px] font-black text-gray-900">{name}</h1>
                        {designation && <p className="text-[28px] font-bold mt-2 uppercase tracking-wider" style={{ color: primary }}>{designation}</p>}
                        <p className="text-[22px] text-gray-400 mt-4 leading-relaxed max-w-[700px] line-clamp-2">{bio}</p>

                        <div className="w-full h-px bg-gray-200 my-8"></div>

                        <div className="grid grid-cols-2 gap-6 w-full mb-8">
                            <div className="bg-gray-50 rounded-xl p-4"><p className="text-[14px] text-gray-400 font-bold uppercase tracking-widest">ID</p><p className="text-[22px] font-mono font-bold text-gray-900">@{profileData.username}</p></div>
                            <div className="bg-gray-50 rounded-xl p-4"><p className="text-[14px] text-gray-400 font-bold uppercase tracking-widest">Issued</p><p className="text-[22px] font-bold text-gray-900">{dateStr}</p></div>
                        </div>

                        <QRCodeCanvas value={profileUrl} size={200} level="H" fgColor={primary} />
                        <p className="text-[16px] text-gray-300 mt-4 uppercase tracking-widest font-bold">Scan to verify</p>
                    </div>
                </div>
            </div>
        ),
    };

    // ═══════════════════════════════════════════════════════════════
    //  STUDIO UI
    // ═══════════════════════════════════════════════════════════════

    return (
        <div className="fixed inset-0 z-50 bg-[#0a0a12]/95 backdrop-blur-xl flex flex-col animate-fade-in" onClick={onClose}>
            <div className="flex flex-col h-full" onClick={e => e.stopPropagation()}>

                {/* ═══ HEADER ═══ */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight">Template Studio</h2>
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Create & share beautiful profile cards</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => alert('✨ AI Art generation coming soon! We\'re integrating with advanced AI models to generate custom artistic backgrounds based on your profile.')} className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg flex items-center gap-1.5">
                            ✨ AI Style
                        </button>
                        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 transition text-lg">&times;</button>
                    </div>
                </div>

                {/* ═══ CATEGORY TABS ═══ */}
                <div className="flex gap-2 px-6 py-3 border-b border-white/5 overflow-x-auto shrink-0">
                    <button onClick={() => setActiveCategory('all')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${activeCategory === 'all' ? 'bg-white text-gray-900' : 'text-white/40 hover:text-white/60'}`}>All</button>
                    {CATEGORIES.map(c => (
                        <button key={c.id} onClick={() => setActiveCategory(c.id)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 ${activeCategory === c.id ? 'bg-white text-gray-900' : 'text-white/40 hover:text-white/60'}`}>
                            <span>{c.emoji}</span>{c.label}
                        </button>
                    ))}
                </div>

                {/* ═══ TEMPLATE GRID ═══ */}
                <div className="flex gap-2 px-6 py-3 overflow-x-auto shrink-0">
                    {filteredTemplates.map(t => (
                        <button key={t.id} onClick={() => setActiveTemplate(t.id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${activeTemplate === t.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105' : 'bg-white/5 text-white/50 border border-white/10 hover:border-white/20'}`}>
                            <span className="text-sm">{t.emoji}</span>{t.name}
                        </button>
                    ))}
                </div>

                {/* ═══ PREVIEW ═══ */}
                <div className="flex-1 overflow-y-auto flex items-center justify-center p-4 min-h-0">
                    <div className="transform scale-[0.2] sm:scale-[0.25] origin-center" style={{ width: '1080px', height: '1920px', margin: '-700px 0' }}>
                        {CARD[activeTemplate]}
                    </div>
                </div>

                {/* ═══ PHOTO FILTERS ═══ */}
                <div className="flex gap-2 px-6 py-3 overflow-x-auto border-t border-white/5 shrink-0">
                    {FILTERS.map(f => (
                        <button key={f.id} onClick={() => setActiveFilter(f.id)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${activeFilter === f.id ? 'bg-white text-gray-900' : 'bg-white/5 text-white/40 hover:text-white/60'}`}>
                            {f.name}
                        </button>
                    ))}
                </div>

                {/* ═══ ACTIONS ═══ */}
                <div className="flex gap-3 px-6 py-4 border-t border-white/10 shrink-0">
                    <button onClick={onClose} className="px-5 py-3 text-white/40 font-bold hover:text-white/60 rounded-xl transition">Close</button>
                    <div className="flex-1"></div>
                    <button onClick={handleDownload} disabled={isGenerating} className="px-6 py-3 bg-white text-gray-900 font-black rounded-xl hover:bg-gray-100 shadow-lg transition-all flex items-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50">
                        {isGenerating ? <SpinnerIcon className="animate-spin h-4 w-4" /> : <DownloadIcon className="h-4 w-4" />} Download
                    </button>
                    <button onClick={handleShare} disabled={isGenerating} className="px-6 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-lg transition-all flex items-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50">
                        {isGenerating ? <SpinnerIcon className="animate-spin h-4 w-4" /> : '📤'} Share
                    </button>
                </div>
            </div>

            {/* Hidden capture — full resolution */}
            <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
                <div ref={captureRef} style={{ width: '1080px', height: '1920px' }}>{CARD[activeTemplate]}</div>
            </div>
        </div>
    );
};

export default TemplateStudio;
