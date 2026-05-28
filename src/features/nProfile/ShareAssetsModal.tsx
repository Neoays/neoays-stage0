import React, { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { SpinnerIcon, DownloadIcon } from '../../components/Icons';
import neoaysLogo from '../../assets/neoays-logo.svg';

interface ShareAssetsModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'profile' | 'voucher';
    data: any; // ProfileData or VoucherData
    logoUrl?: string;
}

const ShareAssetsModal: React.FC<ShareAssetsModalProps> = ({ isOpen, onClose, type, data, logoUrl }) => {
    const [activeTab, setActiveTab] = useState<'qr' | 'card' | 'story'>('qr');
    const [isGenerating, setIsGenerating] = useState(false);

    const cardRef = useRef<HTMLDivElement>(null);
    const storyRef = useRef<HTMLDivElement>(null);
    const captureRef = useRef<HTMLDivElement>(null);

    const displayLogo = logoUrl || neoaysLogo;

    if (!isOpen) return null;

    const downloadAsset = async (format: 'jpg' | 'pdf') => {
        if (!captureRef.current) return;
        setIsGenerating(true);
        try {
            // Wait for images and fonts to load
            await new Promise(resolve => setTimeout(resolve, 800));

            // Get dimensions based on active tab
            const width = activeTab === 'card' ? 1200 : 1080;
            const height = activeTab === 'card' ? 700 : 1920;

            const canvas = await html2canvas(captureRef.current, {
                useCORS: true,
                scale: 2, // High DPI
                backgroundColor: activeTab === 'card' ? '#ffffff' : null,
                logging: false,
                allowTaint: true,
                width: width,
                height: height,
                windowWidth: width,
                windowHeight: height,
            });

            if (format === 'jpg') {
                const link = document.createElement('a');
                link.download = `${type}-${activeTab}-${Date.now()}.jpg`;
                link.href = canvas.toDataURL('image/jpeg', 0.95);
                link.click();
            } else if (format === 'pdf') {
                // PDF fallback to JPG
                alert("PDF Support requires 'jspdf'. Generating high-res JPG for now which can be saved as PDF.");
                const link = document.createElement('a');
                link.download = `${type}-${activeTab}-${Date.now()}.jpg`;
                link.href = canvas.toDataURL('image/jpeg', 0.95);
                link.click();
            }
        } catch (err) {
            console.error("Failed to generate asset", err);
            alert("Failed to generate asset. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const qrValue = type === 'profile'
        ? `${window.location.origin}/@${data.username}`
        : `${window.location.origin}/offer/${data.merchantUsername || 'brand'}/${data.id}`;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/90 backdrop-blur-sm p-0 sm:p-4 pt-0 overflow-y-auto animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-900">Share {type === 'profile' ? 'Profile' : 'Voucher'}</h3>
                    <button onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-600">&times;</button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 bg-gray-50 gap-2 border-b border-gray-100">
                    {['qr', 'card', 'story'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'
                                }`}
                        >
                            {tab === 'qr' ? 'QR Code' : tab === 'card' ? 'Visiting Card' : 'Social Story'}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex flex-col items-center justify-center">

                    {/* QR View */}
                    {activeTab === 'qr' && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm text-center">
                            <QRCodeCanvas value={qrValue} size={200} level={"H"} includeMargin={true} />
                            <p className="mt-4 text-xs font-mono bg-gray-50 p-2 rounded text-gray-600 break-all">{qrValue}</p>
                        </div>
                    )}

                    {/* Visiting Card View */}
                    {activeTab === 'card' && (
                        <div className="transform scale-[0.6] sm:scale-75 origin-center transition-transform duration-300">
                            <div ref={cardRef} className="w-[600px] h-[350px] bg-white rounded-2xl shadow-2xl relative overflow-hidden p-8 flex flex-col justify-between border border-gray-100">
                                {/* Decorative BG */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full opacity-50 z-0"></div>
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-50 to-transparent rounded-tr-full opacity-50 z-0"></div>

                                {/* Top Row: Logo & Value/Tag */}
                                <div className="flex justify-between items-start z-10 relative">
                                    <div className="flex items-center gap-3">
                                        {logoUrl ? (
                                            <img src={logoUrl} alt="Logo" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md" crossOrigin="anonymous" />
                                        ) : (
                                            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-bold text-xl shadow-md">
                                                {(data.displayName || data.title || 'N').charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900 leading-tight">
                                                {type === 'profile' ? (data.displayName || `@${data.username}`) : data.title}
                                            </h2>
                                            {type === 'profile' && <p className="text-sm text-gray-500">@{data.username}</p>}
                                        </div>
                                    </div>
                                    {type === 'voucher' && (
                                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-md">
                                            <p className="font-bold text-xl">{data.value}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Content Body */}
                                <div className="flex justify-between items-center z-10 relative mt-2 gap-8">
                                    <div className="flex-1 space-y-4">
                                        <div className="h-1 w-16 bg-indigo-500 rounded-full"></div>
                                        <div className="min-h-[80px] flex items-center">
                                            <p className="text-gray-700 text-2xl font-medium leading-tight">
                                                {type === 'profile'
                                                    ? (data.bio || "Scan to connect with me directly on Neoays.")
                                                    : (data.description || "Scan to redeem this exclusive offer now!")}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 inline-flex items-center gap-3">
                                            <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Digital Code</span>
                                            <span className="text-indigo-600 font-mono font-black text-xl">{data.code || 'VALID'}</span>
                                        </div>
                                    </div>

                                    <div className="bg-white p-3 rounded-2xl shadow-xl border border-gray-100 shrink-0">
                                        <QRCodeCanvas value={qrValue} size={120} level={"H"} />
                                    </div>
                                </div>

                                <div className="absolute bottom-4 right-6 opacity-30 z-10">
                                    <img src={neoaysLogo} className="h-4 w-auto grayscale contrast-125" alt="Neoays" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Social Story View */}
                    {activeTab === 'story' && (
                        <div className="transform scale-[0.35] sm:scale-50 origin-center transition-transform duration-300">
                            <div ref={storyRef} className="w-[1080px] h-[1920px] bg-slate-900 relative overflow-hidden flex flex-col items-center pt-32 pb-20 font-sans">
                                {/* Background Image/Gradient */}
                                {type === 'voucher' && data.imageUrl ? (
                                    <>
                                        <img src={data.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-40 z-0" crossOrigin="anonymous" alt="Background" />
                                        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-900 z-0"></div>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#1a1c2e] to-[#0f1016] z-0"></div>
                                )}

                                {/* Top Logo Area */}
                                <div className="relative z-10 mt-12 mb-12 flex flex-col items-center">
                                    {logoUrl ? (
                                        <img src={logoUrl} className="w-48 h-48 rounded-full border-8 border-white/10 shadow-2xl object-cover mb-6" crossOrigin="anonymous" alt="Logo" />
                                    ) : (
                                        <div className="w-48 h-48 rounded-full bg-white/10 flex items-center justify-center text-white text-6xl font-black border-8 border-white/5 mb-6">
                                            {(data.displayName || data.title || 'N').charAt(0)}
                                        </div>
                                    )}

                                    {type === 'profile' && (
                                        <div className="bg-white/10 backdrop-blur-md px-8 py-3 rounded-full border border-white/10">
                                            <span className="text-white text-2xl tracking-normal uppercase font-bold">@{data.username}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Main Content */}
                                <div className="relative z-10 text-center px-12 max-w-4xl flex-1 flex flex-col justify-center">
                                    <h1 className="text-8xl font-black text-white mb-8 leading-[1.1]">
                                        {type === 'profile' ? (data.displayName || data.username) : data.title}
                                    </h1>

                                    {type === 'voucher' && (
                                        <div className="inline-block bg-gradient-to-r from-amber-200 to-yellow-500 text-slate-900 px-12 py-4 rounded-2xl shadow-xl transform -rotate-2 mb-12">
                                            <span className="text-8xl font-black tracking-tighter">{data.value}</span>
                                        </div>
                                    )}

                                    <p className="text-4xl text-slate-300 font-medium leading-relaxed mb-12">
                                        {type === 'profile'
                                            ? (data.bio || "Connect with me on my digital profile.")
                                            : (data.description || "Limited time offer. Scan to redeem now!")}
                                    </p>
                                </div>

                                <div className="relative z-10 bg-white p-8 rounded-[3rem] shadow-2xl mb-32">
                                    <QRCodeCanvas value={qrValue} size={450} level={"H"} includeMargin={true} />
                                    <div className="mt-6 text-center">
                                        <p className="text-slate-500 font-bold uppercase tracking-normal text-xl">Scan to {type === 'profile' ? 'Connect' : 'Redeem'}</p>
                                    </div>
                                </div>

                                {/* Footer Subtle Branding */}
                                <div className="relative z-10 flex items-center justify-center gap-3 opacity-30 mt-auto mb-12">
                                    <img src={neoaysLogo} className="h-10 w-auto invert brightness-200" alt="Neoays" />
                                </div>

                            </div>
                        </div>
                    )}

                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-white border-t border-gray-100 flex justify-end gap-3 z-50">
                    <button onClick={onClose} className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition">Close</button>
                    {activeTab !== 'qr' && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => downloadAsset('jpg')}
                                disabled={isGenerating}
                                className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {isGenerating ? <SpinnerIcon className="animate-spin h-5 w-5" /> : <DownloadIcon className="h-5 w-5" />}
                                JPG
                            </button>
                            <button
                                onClick={() => downloadAsset('pdf')}
                                disabled={isGenerating}
                                className="px-6 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {isGenerating ? <SpinnerIcon className="animate-spin h-5 w-5" /> : <DownloadIcon className="h-5 w-5" />}
                                PDF
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Hidden Capture Container - Rendered at large fixed size off-screen */}
            <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
                <div id="capture-target" ref={captureRef} style={{ width: activeTab === 'card' ? '1200px' : '1080px', height: activeTab === 'card' ? '700px' : '1920px' }}>

                    {activeTab === 'card' && (
                        <div className="w-[1200px] h-[700px] bg-white relative overflow-hidden p-16 flex flex-col justify-between border border-gray-100 font-sans">
                            {/* Decorative BG */}
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full opacity-50 z-0"></div>
                            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-purple-50 to-transparent rounded-tr-full opacity-50 z-0"></div>

                            {/* Top Row */}
                            <div className="flex justify-between items-start z-10 relative">
                                <div className="flex items-center gap-6">
                                    {logoUrl ? (
                                        <img src={logoUrl} alt="Logo" className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl" crossOrigin="anonymous" />
                                    ) : (
                                        <div className="w-32 h-32 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-bold text-5xl shadow-xl">
                                            {(data.displayName || data.title || 'N').charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <h2 className="text-5xl font-black text-gray-900 leading-tight">
                                            {type === 'profile' ? (data.displayName || `@${data.username}`) : data.title}
                                        </h2>
                                        {type === 'profile' && <p className="text-2xl text-gray-400 font-bold mt-1">@{data.username}</p>}
                                    </div>
                                </div>
                                {type === 'voucher' && (
                                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl shadow-xl">
                                        <p className="font-black text-4xl">{data.value}</p>
                                    </div>
                                )}
                            </div>

                            {/* Content Body */}
                            <div className="flex justify-between items-center z-10 relative mt-4 gap-12">
                                <div className="flex-1 space-y-8">
                                    <div className="h-2 w-32 bg-indigo-500 rounded-full"></div>
                                    <div className="min-h-[150px] flex items-center">
                                        <p className="text-gray-700 text-4xl font-semibold leading-snug">
                                            {type === 'profile'
                                                ? (data.bio || "Scan to connect with me directly on Neoays.")
                                                : (data.description || "Scan to redeem this exclusive offer now!")}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 border border-gray-200 rounded-2xl px-8 py-4 inline-flex items-center gap-6">
                                        <span className="text-xl text-gray-400 uppercase font-black tracking-[0.2em]">Digital Code</span>
                                        <span className="text-indigo-600 font-mono font-black text-4xl">{data.code || 'VALID'}</span>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-[2rem] shadow-2xl border border-gray-100 shrink-0">
                                    <QRCodeCanvas value={qrValue} size={250} level={"H"} />
                                </div>
                            </div>

                            <div className="absolute bottom-10 right-12 opacity-40 z-10 flex items-center gap-4">
                                <span className="text-xl font-black text-gray-300 uppercase tracking-widest">Powered By</span>
                                <img src={neoaysLogo} className="h-10 w-auto grayscale contrast-125" alt="Neoays" />
                            </div>
                        </div>
                    )}

                    {activeTab === 'story' && (
                        /* Use similar high-res structure for story */
                        <div className="w-[1080px] h-[1920px] bg-slate-900 relative overflow-hidden flex flex-col items-center pt-32 pb-20 font-sans">
                            {/* Simplified clone of story view for high-res */}
                            {type === 'voucher' && data.imageUrl ? (
                                <>
                                    <img src={data.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-40 z-0" crossOrigin="anonymous" alt="BG" />
                                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-900 z-0"></div>
                                </>
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-[#1a1c2e] to-[#0f1016] z-0"></div>
                            )}
                            <div className="relative z-10 mt-12 mb-12 flex flex-col items-center">
                                {logoUrl ? (
                                    <img src={logoUrl} className="w-64 h-64 rounded-full border-[12px] border-white/10 shadow-2xl object-cover mb-8" crossOrigin="anonymous" alt="L" />
                                ) : (
                                    <div className="w-64 h-64 rounded-full bg-white/10 flex items-center justify-center text-white text-8xl font-black border-[12px] border-white/5 mb-8">
                                        {(data.displayName || data.title || 'N').charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="relative z-10 text-center px-16 max-w-5xl flex-1 flex flex-col justify-center">
                                <h1 className="text-[120px] font-black text-white mb-12 leading-[1.1]">
                                    {type === 'profile' ? (data.displayName || data.username) : data.title}
                                </h1>
                                {type === 'voucher' && (
                                    <div className="inline-block bg-gradient-to-r from-amber-200 to-yellow-500 text-slate-900 px-16 py-8 rounded-3xl shadow-2xl transform -rotate-2 mb-16">
                                        <span className="text-[100px] font-black tracking-tighter">{data.value}</span>
                                    </div>
                                )}
                                <p className="text-[50px] text-slate-300 font-medium leading-relaxed mb-16">
                                    {type === 'profile'
                                        ? (data.bio || "Connect with me on my digital profile.")
                                        : (data.description || "Limited time offer. Scan to redeem now!")}
                                </p>
                            </div>
                            <div className="relative z-10 bg-white p-12 rounded-[4rem] shadow-2xl mb-40">
                                <QRCodeCanvas value={qrValue} size={500} level={"H"} includeMargin={true} />
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default ShareAssetsModal;
