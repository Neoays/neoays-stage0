import React, { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { MenuItem } from '../../types';
import { SpinnerIcon, DownloadIcon, CheckCircleIcon } from '../../components/Icons';
import neoaysLogo from '../../assets/neoays-logo.svg';

interface MenuItemShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    menuItems: MenuItem[];
    profileData: {
        username?: string;
        displayName?: string;
        photoURL?: string;
        currency?: string;
    };
}

type LayoutStyle = 'modern' | 'classic' | 'bold' | 'minimal' | 'hero' | 'promo' | 'spotlight' | 'offer' | 'combo';

const LAYOUT_OPTIONS: { id: LayoutStyle; name: string; description: string; category: 'standard' | 'offer' }[] = [
    { id: 'modern', name: 'Modern Gradient', description: 'Vibrant gradients', category: 'standard' },
    { id: 'classic', name: 'Classic Elegance', description: 'Professional look', category: 'standard' },
    { id: 'bold', name: 'Bold Promo', description: 'Eye-catching style', category: 'standard' },
    { id: 'minimal', name: 'Minimal Clean', description: 'Simple design', category: 'standard' },
    { id: 'hero', name: 'Hero Image', description: 'Big image, price corner', category: 'offer' },
    { id: 'promo', name: 'Flash Sale', description: 'Discount highlight', category: 'offer' },
    { id: 'spotlight', name: 'Spotlight', description: 'Single item focus', category: 'offer' },
    { id: 'offer', name: 'Special Offer', description: 'Promo banner style', category: 'offer' },
    { id: 'combo', name: 'Combo Deal', description: 'Multi-item offer', category: 'offer' },
];

const CURRENCY_OPTIONS = [
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal' },
    { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal' },
    { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar' },
    { code: 'BHD', symbol: '.د.ب', name: 'Bahraini Dinar' },
    { code: 'OMR', symbol: 'ر.ع.', name: 'Omani Rial' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
];

const MenuItemShareModal: React.FC<MenuItemShareModalProps> = ({
    isOpen,
    onClose,
    menuItems,
    profileData
}) => {
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [layoutStyle, setLayoutStyle] = useState<LayoutStyle>('modern');
    const [showPriceOnly, setShowPriceOnly] = useState(false);
    const [currency, setCurrency] = useState(profileData.currency || 'AED');
    const [isGenerating, setIsGenerating] = useState(false);
    const [layoutTab, setLayoutTab] = useState<'standard' | 'offer'>('standard');

    const captureRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const toggleItemSelection = (itemId: string) => {
        setSelectedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const selectedMenuItems = menuItems.filter(item => selectedItems.includes(item.id));
    const currencySymbol = CURRENCY_OPTIONS.find(c => c.code === currency)?.symbol || currency;

    const formatPrice = (price: string) => {
        // If price already has currency, just show it
        if (price.includes('AED') || price.includes('$') || price.includes('€') || price.includes('د.إ')) {
            return price;
        }
        return `${currencySymbol} ${price}`;
    };

    const downloadStory = async () => {
        if (!captureRef.current || selectedItems.length === 0) return;
        setIsGenerating(true);

        try {
            // Wait for fonts and images to fully load
            await new Promise(resolve => setTimeout(resolve, 500));

            const originalElement = captureRef.current;

            // Create a wrapper div positioned off-screen
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'position: fixed; left: -9999px; top: 0; z-index: -9999;';
            document.body.appendChild(wrapper);

            // Clone the element
            const clonedElement = originalElement.cloneNode(true) as HTMLElement;

            // Remove the scale transform and ensure proper dimensions
            clonedElement.style.transform = 'none';
            clonedElement.style.width = '1080px';
            clonedElement.style.height = '1920px';

            wrapper.appendChild(clonedElement);

            // Copy canvas content (QR codes) from original to cloned element
            const originalCanvases = originalElement.querySelectorAll('canvas');
            const clonedCanvases = clonedElement.querySelectorAll('canvas');
            originalCanvases.forEach((originalCanvas, index) => {
                const clonedCanvas = clonedCanvases[index];
                if (clonedCanvas && originalCanvas) {
                    const clonedCtx = clonedCanvas.getContext('2d');
                    if (clonedCtx) {
                        clonedCanvas.width = originalCanvas.width;
                        clonedCanvas.height = originalCanvas.height;
                        clonedCtx.drawImage(originalCanvas, 0, 0);
                    }
                }
            });

            // Force a reflow to ensure styles are applied
            await new Promise(resolve => setTimeout(resolve, 200));

            const canvas = await html2canvas(clonedElement, {
                useCORS: true,
                scale: 1,
                backgroundColor: null,
                logging: false,
                allowTaint: true,
                width: 1080,
                height: 1920,
                windowWidth: 1080,
                windowHeight: 1920,
            });

            // Clean up the cloned element
            document.body.removeChild(wrapper);

            const link = document.createElement('a');
            link.download = `menu-story-${Date.now()}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 0.95);
            link.click();
        } catch (err) {
            console.error('Failed to generate story', err);
            alert('Failed to generate image. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const qrValue = `${window.location.origin}/@${profileData.username}`;

    // Layout-specific background styles
    const getLayoutBackground = () => {
        switch (layoutStyle) {
            case 'modern':
                return 'bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-800';
            case 'classic':
                return 'bg-gradient-to-b from-slate-800 to-slate-900';
            case 'bold':
                return 'bg-gradient-to-br from-orange-500 via-red-500 to-pink-600';
            case 'minimal':
                return 'bg-white';
            case 'hero':
                return 'bg-black';
            case 'promo':
                return 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500';
            case 'spotlight':
                return 'bg-gradient-to-b from-gray-900 via-gray-800 to-black';
            case 'offer':
                return 'bg-gradient-to-br from-emerald-500 to-teal-700';
            default:
                return 'bg-slate-900';
        }
    };

    const getTextColor = () => {
        return layoutStyle === 'minimal' ? 'text-slate-900' : 'text-white';
    };

    const getPriceColor = () => {
        switch (layoutStyle) {
            case 'modern': return 'text-amber-300';
            case 'classic': return 'text-emerald-400';
            case 'bold': return 'text-yellow-300';
            case 'minimal': return 'text-indigo-600';
            case 'hero': return 'text-yellow-400';
            case 'promo': return 'text-white';
            case 'spotlight': return 'text-amber-400';
            case 'offer': return 'text-yellow-300';
            default: return 'text-white';
        }
    };

    // Render different layouts
    const renderStandardLayout = () => (
        <>
            {/* Header with Logo */}
            <div className="relative z-10 p-12 flex items-center gap-6">
                {profileData.photoURL ? (
                    <img
                        src={profileData.photoURL}
                        alt="Logo"
                        className="w-32 h-32 rounded-full border-4 border-white/20 object-cover shadow-2xl"
                        crossOrigin="anonymous"
                    />
                ) : (
                    <div className={`w-32 h-32 rounded-full ${layoutStyle === 'minimal' ? 'bg-indigo-100 text-indigo-600' : 'bg-white/10 text-white'} flex items-center justify-center text-5xl font-black`}>
                        {(profileData.displayName || 'M').charAt(0)}
                    </div>
                )}
                <div>
                    <h1 className={`text-5xl font-black ${getTextColor()}`}>
                        {profileData.displayName || 'Our Menu'}
                    </h1>
                    {profileData.username && (
                        <p className={`text-2xl mt-2 ${layoutStyle === 'minimal' ? 'text-gray-500' : 'text-white/60'}`}>
                            @{profileData.username}
                        </p>
                    )}
                </div>
            </div>

            {/* Items Grid - Auto-sizing based on item count */}
            <div className="relative z-10 flex-1 px-12 py-8 overflow-hidden flex items-center">
                <div className={`w-full grid gap-6 ${selectedMenuItems.length === 1 ? 'grid-cols-1' :
                    selectedMenuItems.length === 2 ? 'grid-cols-2' :
                        selectedMenuItems.length <= 4 ? 'grid-cols-2' : 'grid-cols-2'
                    }`}>
                    {selectedMenuItems.slice(0, 4).map(item => {
                        // Dynamic sizing based on item count
                        const isSingle = selectedMenuItems.length === 1;
                        const isDouble = selectedMenuItems.length === 2;
                        const imageSize = isSingle ? 'h-[500px]' : isDouble ? 'h-[350px]' : 'h-[280px]';
                        const titleSize = isSingle ? 'text-6xl' : isDouble ? 'text-4xl' : 'text-3xl';
                        const priceSize = isSingle ? 'text-7xl' : isDouble ? 'text-5xl' : 'text-4xl';
                        const padding = isSingle ? 'p-10' : isDouble ? 'p-6' : 'p-5';

                        return (
                            <div
                                key={item.id}
                                className={`${layoutStyle === 'minimal' ? 'bg-gray-50 border border-gray-100' : 'bg-white/10 backdrop-blur-sm border border-white/10'} rounded-[2rem] overflow-hidden`}
                            >
                                {item.imageUrl && (
                                    <div className={`w-full ${imageSize} relative`}>
                                        <img
                                            src={item.imageUrl}
                                            alt={item.name}
                                            className="absolute inset-0 w-full h-full object-cover"
                                            crossOrigin="anonymous"
                                        />
                                    </div>
                                )}
                                <div className={padding}>
                                    <h3 className={`${titleSize} font-black ${getTextColor()} mb-2`}>
                                        {item.name}
                                    </h3>
                                    {item.nameAr && (
                                        <p className={`${isSingle ? 'text-3xl' : 'text-xl'} mb-3 ${layoutStyle === 'minimal' ? 'text-gray-500' : 'text-white/60'}`} dir="rtl">
                                            {item.nameAr}
                                        </p>
                                    )}
                                    {!showPriceOnly && item.description && isSingle && (
                                        <p className={`text-xl mb-4 ${layoutStyle === 'minimal' ? 'text-gray-600' : 'text-white/70'}`}>
                                            {item.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-3">
                                        {item.oldPrice && (
                                            <span className={`${isSingle ? 'text-4xl' : 'text-2xl'} line-through ${layoutStyle === 'minimal' ? 'text-gray-400' : 'text-white/40'}`}>
                                                {formatPrice(item.oldPrice)}
                                            </span>
                                        )}
                                        <span className={`${priceSize} font-black ${getPriceColor()}`}>
                                            {formatPrice(item.price)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer with QR */}
            <div className="relative z-10 p-12 flex items-center justify-between">
                <div className={`${layoutStyle === 'minimal' ? 'bg-white border border-gray-200' : 'bg-white'} p-4 rounded-2xl shadow-xl`}>
                    <QRCodeCanvas value={qrValue} size={120} level="H" />
                </div>
                <div className={`text-right ${getTextColor()}`}>
                    <p className={`text-xl ${layoutStyle === 'minimal' ? 'text-gray-500' : 'text-white/60'}`}>Scan to view full menu</p>
                    <p className="text-2xl font-bold mt-1">neoays.com/@{profileData.username}</p>
                </div>
            </div>
        </>
    );

    // HERO Layout - Big Image with Price in Corner
    const renderHeroLayout = () => {
        const item = selectedMenuItems[0];
        if (!item) return null;

        return (
            <div className="relative w-full h-full">
                {/* Full Background Image */}
                {item.imageUrl ? (
                    <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        crossOrigin="anonymous"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                {/* Price Badge - Top Right Corner */}
                <div className="absolute top-12 right-12 z-20">
                    <div className="bg-yellow-400 text-black px-8 py-6 rounded-3xl transform rotate-3 shadow-2xl">
                        {item.oldPrice && (
                            <p className="text-2xl line-through opacity-60 text-center">{formatPrice(item.oldPrice)}</p>
                        )}
                        <p className="text-6xl font-black">{formatPrice(item.price)}</p>
                    </div>
                </div>

                {/* Logo - Top Left */}
                <div className="absolute top-12 left-12 z-20">
                    {profileData.photoURL ? (
                        <img
                            src={profileData.photoURL}
                            alt="Logo"
                            className="w-24 h-24 rounded-full border-4 border-white/30 object-cover shadow-2xl"
                            crossOrigin="anonymous"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl font-black text-white">
                            {(profileData.displayName || 'M').charAt(0)}
                        </div>
                    )}
                </div>

                {/* Content Bottom */}
                <div className="absolute bottom-0 left-0 right-0 z-20 p-12">
                    <h1 className="text-7xl font-black text-white mb-4 drop-shadow-2xl">
                        {item.name}
                    </h1>
                    {item.nameAr && (
                        <p className="text-4xl text-white/80 mb-4" dir="rtl">{item.nameAr}</p>
                    )}
                    {!showPriceOnly && item.description && (
                        <p className="text-2xl text-white/70 max-w-2xl mb-8">{item.description}</p>
                    )}

                    {/* Bottom Bar */}
                    <div className="flex items-center justify-between mt-8 pt-8 border-t border-white/20">
                        <div className="bg-white p-3 rounded-xl">
                            <QRCodeCanvas value={qrValue} size={80} level="H" />
                        </div>
                        <div className="text-right text-white">
                            <p className="text-xl font-bold">{profileData.displayName}</p>
                            <p className="text-lg opacity-60">@{profileData.username}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // PROMO Layout - Flash Sale Style
    const renderPromoLayout = () => {
        const item = selectedMenuItems[0];
        if (!item) return null;

        return (
            <div className="relative w-full h-full flex flex-col">
                {/* Flash Sale Banner */}
                <div className="bg-black text-yellow-400 py-6 text-center">
                    <p className="text-4xl font-black tracking-widest animate-pulse">⚡ FLASH SALE ⚡</p>
                </div>

                {/* Image Section */}
                <div className="flex-1 relative">
                    {item.imageUrl ? (
                        <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            crossOrigin="anonymous"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center">
                            <span className="text-[200px]">🔥</span>
                        </div>
                    )}

                    {/* Discount Badge */}
                    {item.oldPrice && (
                        <div className="absolute top-8 right-8 bg-red-600 text-white px-6 py-4 rounded-full rotate-12 shadow-2xl">
                            <p className="text-3xl font-black">SAVE!</p>
                        </div>
                    )}
                </div>

                {/* Info Section */}
                <div className="bg-black p-12">
                    <h2 className="text-5xl font-black text-white mb-4">{item.name}</h2>

                    <div className="flex items-center gap-6 mb-8">
                        {item.oldPrice && (
                            <span className="text-4xl text-gray-500 line-through">{formatPrice(item.oldPrice)}</span>
                        )}
                        <span className="text-7xl font-black text-yellow-400">{formatPrice(item.price)}</span>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-white/20">
                        <div className="flex items-center gap-4">
                            {profileData.photoURL && (
                                <img src={profileData.photoURL} alt="" className="w-16 h-16 rounded-full" crossOrigin="anonymous" />
                            )}
                            <div>
                                <p className="text-xl font-bold text-white">{profileData.displayName}</p>
                                <p className="text-lg text-white/60">@{profileData.username}</p>
                            </div>
                        </div>
                        <div className="bg-white p-3 rounded-xl">
                            <QRCodeCanvas value={qrValue} size={80} level="H" />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // SPOTLIGHT Layout - Single Item Focus
    const renderSpotlightLayout = () => {
        const item = selectedMenuItems[0];
        if (!item) return null;

        return (
            <div className="relative w-full h-full flex flex-col items-center justify-center p-12">
                {/* Spotlight Effect */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]" />

                {/* Logo Top */}
                <div className="absolute top-12 left-12 flex items-center gap-4">
                    {profileData.photoURL ? (
                        <img src={profileData.photoURL} alt="" className="w-16 h-16 rounded-full border-2 border-white/20" crossOrigin="anonymous" />
                    ) : null}
                    <p className="text-2xl font-bold text-white">{profileData.displayName}</p>
                </div>

                {/* Centered Item */}
                <div className="relative z-10 text-center">
                    {item.imageUrl && (
                        <div className="mx-auto mb-12 w-[500px] h-[500px] rounded-full overflow-hidden border-8 border-white/10 shadow-2xl">
                            <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                crossOrigin="anonymous"
                            />
                        </div>
                    )}

                    <h1 className="text-6xl font-black text-white mb-4">{item.name}</h1>
                    {item.nameAr && <p className="text-3xl text-white/60 mb-6" dir="rtl">{item.nameAr}</p>}

                    <div className="flex items-center justify-center gap-6">
                        {item.oldPrice && (
                            <span className="text-4xl text-white/40 line-through">{formatPrice(item.oldPrice)}</span>
                        )}
                        <span className="text-8xl font-black text-amber-400">{formatPrice(item.price)}</span>
                    </div>
                </div>

                {/* QR Bottom */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6">
                    <div className="bg-white p-3 rounded-xl">
                        <QRCodeCanvas value={qrValue} size={80} level="H" />
                    </div>
                    <p className="text-xl text-white/60">Scan to order</p>
                </div>
            </div>
        );
    };

    // OFFER Layout - Special Banner Style
    const renderOfferLayout = () => {
        const item = selectedMenuItems[0];
        if (!item) return null;

        return (
            <div className="relative w-full h-full flex flex-col">
                {/* Top Banner */}
                <div className="bg-yellow-400 py-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.05)_10px,rgba(0,0,0,0.05)_20px)]" />
                    <p className="text-5xl font-black text-black relative z-10">🎉 SPECIAL OFFER 🎉</p>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex">
                    {/* Image Side */}
                    <div className="w-1/2 relative">
                        {item.imageUrl ? (
                            <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="absolute inset-0 w-full h-full object-cover"
                                crossOrigin="anonymous"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center">
                                <span className="text-[150px]">🍽️</span>
                            </div>
                        )}
                    </div>

                    {/* Info Side */}
                    <div className="w-1/2 bg-white flex flex-col justify-center p-12">
                        <h2 className="text-5xl font-black text-gray-900 mb-4">{item.name}</h2>
                        {item.nameAr && <p className="text-3xl text-gray-600 mb-6" dir="rtl">{item.nameAr}</p>}

                        {!showPriceOnly && item.description && (
                            <p className="text-xl text-gray-600 mb-8">{item.description}</p>
                        )}

                        <div className="bg-emerald-50 rounded-3xl p-8 mb-8">
                            {item.oldPrice && (
                                <p className="text-2xl text-gray-400 line-through mb-2">{formatPrice(item.oldPrice)}</p>
                            )}
                            <p className="text-6xl font-black text-emerald-600">{formatPrice(item.price)}</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="bg-gray-100 p-3 rounded-xl">
                                <QRCodeCanvas value={qrValue} size={80} level="H" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{profileData.displayName}</p>
                                <p className="text-gray-500">@{profileData.username}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Banner */}
                <div className="bg-emerald-800 py-6 text-center">
                    <p className="text-2xl font-bold text-white">Limited Time Only! Order Now!</p>
                </div>
            </div>
        );
    };

    // COMBO Layout - Multi-item Offer
    const renderComboLayout = () => {
        if (selectedMenuItems.length === 0) return null;

        // Calculate total price
        const totalPrice = selectedMenuItems.reduce((sum, item) => {
            const price = parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0;
            return sum + price;
        }, 0);

        const totalOldPrice = selectedMenuItems.reduce((sum, item) => {
            const price = parseFloat((item.oldPrice || item.price).replace(/[^0-9.]/g, '')) || 0;
            return sum + price;
        }, 0);

        return (
            <div className="relative w-full h-full flex flex-col bg-gradient-to-br from-rose-500 via-purple-600 to-indigo-700">
                {/* Pattern Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />

                {/* Combo Banner */}
                <div className="relative z-10 bg-yellow-400 py-6 text-center">
                    <p className="text-4xl font-black text-black">🔥 COMBO DEAL 🔥</p>
                </div>

                {/* Header */}
                <div className="relative z-10 p-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {profileData.photoURL ? (
                            <img src={profileData.photoURL} alt="" className="w-20 h-20 rounded-full border-4 border-white/30" crossOrigin="anonymous" />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-black text-white">
                                {(profileData.displayName || 'M').charAt(0)}
                            </div>
                        )}
                        <div>
                            <h2 className="text-3xl font-black text-white">{profileData.displayName}</h2>
                            <p className="text-lg text-white/60">@{profileData.username}</p>
                        </div>
                    </div>
                </div>

                {/* Items Grid - 2x2 or flexible */}
                <div className="relative z-10 flex-1 px-8 py-4 overflow-hidden">
                    <div className={`grid ${selectedMenuItems.length <= 2 ? 'grid-cols-2' : selectedMenuItems.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'} gap-4 h-full`}>
                        {selectedMenuItems.slice(0, 6).map((item, index) => (
                            <div
                                key={item.id}
                                className="bg-white rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                {item.imageUrl && (
                                    <div className="w-full aspect-square relative">
                                        <img
                                            src={item.imageUrl}
                                            alt={item.name}
                                            className="absolute inset-0 w-full h-full object-cover"
                                            crossOrigin="anonymous"
                                        />
                                    </div>
                                )}
                                <div className="p-4">
                                    <h3 className="text-2xl font-black text-gray-900 truncate">{item.name}</h3>
                                    {item.nameAr && (
                                        <p className="text-lg text-gray-500 truncate" dir="rtl">{item.nameAr}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                        {item.oldPrice && (
                                            <span className="text-lg text-gray-400 line-through">{formatPrice(item.oldPrice)}</span>
                                        )}
                                        <span className="text-2xl font-black text-indigo-600">{formatPrice(item.price)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Total Price Section */}
                <div className="relative z-10 bg-black/30 backdrop-blur-sm p-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xl text-white/60 uppercase tracking-wider">Combo Price</p>
                            <div className="flex items-center gap-4">
                                {totalOldPrice > totalPrice && (
                                    <span className="text-4xl text-white/40 line-through">{formatPrice(totalOldPrice.toFixed(2))}</span>
                                )}
                                <span className="text-7xl font-black text-yellow-400">{formatPrice(totalPrice.toFixed(2))}</span>
                            </div>
                            <p className="text-lg text-white/60 mt-1">{selectedMenuItems.length} items included</p>
                        </div>
                        <div className="bg-white p-3 rounded-2xl">
                            <QRCodeCanvas value={qrValue} size={100} level="H" />
                        </div>
                    </div>
                </div>

                {/* Bottom Strip */}
                <div className="relative z-10 bg-yellow-400 py-4 text-center">
                    <p className="text-xl font-black text-black">Order Now & Save! 🎉</p>
                </div>
            </div>
        );
    };

    const renderLayout = () => {
        switch (layoutStyle) {
            case 'hero':
                return renderHeroLayout();
            case 'promo':
                return renderPromoLayout();
            case 'spotlight':
                return renderSpotlightLayout();
            case 'offer':
                return renderOfferLayout();
            case 'combo':
                return renderComboLayout();
            default:
                return renderStandardLayout();
        }
    };

    const isOfferLayout = ['hero', 'promo', 'spotlight', 'offer', 'combo'].includes(layoutStyle);

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/90 backdrop-blur-sm p-0 sm:p-4 pt-0 overflow-y-auto" onClick={onClose}>
            <div className="bg-white w-full sm:rounded-3xl sm:max-w-6xl overflow-hidden flex flex-col min-h-screen sm:min-h-0 sm:max-h-[95vh] sm:mt-4" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-purple-600">
                    <div>
                        <h3 className="text-lg font-bold text-white">Create Menu Story</h3>
                        <p className="text-indigo-200 text-xs">Select items and choose a layout to share</p>
                    </div>
                    <button onClick={onClose} className="text-2xl text-white/70 hover:text-white">&times;</button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col sm:flex-row">
                    {/* Left Panel - Item Selection & Options */}
                    <div className="w-full sm:w-1/3 border-b sm:border-b-0 sm:border-r border-gray-100 overflow-y-auto p-4 bg-gray-50 max-h-[50vh] sm:max-h-none">
                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Select Items ({selectedItems.length})</h4>
                        <div className="space-y-2 mb-6">
                            {menuItems.filter(item => item.isAvailable).map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => toggleItemSelection(item.id)}
                                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${selectedItems.includes(item.id)
                                        ? 'border-indigo-500 bg-indigo-50'
                                        : 'border-gray-100 bg-white hover:border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {item.imageUrl ? (
                                            <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xl">🍽</div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-slate-900 truncate">{item.name}</p>
                                            <div className="flex items-center gap-2">
                                                {item.oldPrice && (
                                                    <span className="text-xs text-gray-400 line-through">{item.oldPrice}</span>
                                                )}
                                                <span className="text-sm font-bold text-indigo-600">{item.price}</span>
                                            </div>
                                        </div>
                                        {selectedItems.includes(item.id) && (
                                            <CheckCircleIcon className="w-5 h-5 text-indigo-600" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Currency Selector */}
                        <div className="mb-6">
                            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Currency</h4>
                            <select
                                value={currency}
                                onChange={e => setCurrency(e.target.value)}
                                className="w-full p-3 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                {CURRENCY_OPTIONS.map(c => (
                                    <option key={c.code} value={c.code}>{c.symbol} - {c.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Layout Style Tabs */}
                        <div className="mb-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Layout Type</h4>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setLayoutTab('standard'); setLayoutStyle('modern'); }}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${layoutTab === 'standard' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                                >
                                    Standard
                                </button>
                                <button
                                    onClick={() => { setLayoutTab('offer'); setLayoutStyle('hero'); }}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${layoutTab === 'offer' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                                >
                                    Offer/Promo
                                </button>
                            </div>
                        </div>

                        {/* Layout Options */}
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            {LAYOUT_OPTIONS.filter(l => l.category === layoutTab).map(layout => (
                                <button
                                    key={layout.id}
                                    onClick={() => setLayoutStyle(layout.id)}
                                    className={`p-2 rounded-lg border-2 text-left transition-all ${layoutStyle === layout.id
                                        ? 'border-indigo-500 bg-indigo-50'
                                        : 'border-gray-100 hover:border-gray-200'
                                        }`}
                                >
                                    <p className="font-bold text-xs text-slate-900">{layout.name}</p>
                                    <p className="text-[10px] text-gray-500">{layout.description}</p>
                                </button>
                            ))}
                        </div>

                        {isOfferLayout && selectedItems.length > 1 && (
                            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">⚠️ Offer layouts show only the first selected item</p>
                        )}

                        <label className="flex items-center gap-3 cursor-pointer mt-4">
                            <input
                                type="checkbox"
                                checked={showPriceOnly}
                                onChange={e => setShowPriceOnly(e.target.checked)}
                                className="w-4 h-4 rounded text-indigo-600"
                            />
                            <span className="text-sm text-gray-600">Hide descriptions</span>
                        </label>
                    </div>

                    {/* Right Panel - Preview (hidden on mobile, shown on desktop) */}
                    <div className="hidden sm:flex flex-1 overflow-y-auto p-6 bg-slate-200 flex-col items-center justify-start pt-8">
                        {selectedItems.length === 0 ? (
                            <div className="text-center text-gray-400">
                                <p className="text-4xl mb-4">📱</p>
                                <p className="font-bold">Select items to preview</p>
                            </div>
                        ) : (
                            <div className="transform scale-[0.35] origin-center">
                                {/* Story Preview (1080x1920) */}
                                <div
                                    ref={captureRef}
                                    data-capture="true"
                                    className={`w-[1080px] h-[1920px] ${getLayoutBackground()} relative overflow-hidden flex flex-col font-sans`}
                                >
                                    {/* Decorative Elements for Standard Layouts */}
                                    {layoutStyle === 'modern' && (
                                        <>
                                            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl -mr-48 -mt-48" />
                                            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl -ml-32 -mb-32" />
                                        </>
                                    )}
                                    {layoutStyle === 'bold' && (
                                        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBzdHJva2Utb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
                                    )}

                                    {renderLayout()}

                                    {/* Powered By - Only for standard layouts */}
                                    {!isOfferLayout && (
                                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-30 flex items-center gap-2">
                                            <img src={neoaysLogo} className={`h-6 ${layoutStyle !== 'minimal' ? 'invert' : ''}`} alt="Neoays" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-white border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 sticky bottom-0">
                    <p className="text-xs text-gray-400 hidden sm:block">
                        {selectedItems.length} items • {LAYOUT_OPTIONS.find(l => l.id === layoutStyle)?.name} • {currencySymbol}
                    </p>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button onClick={onClose} className="flex-1 sm:flex-none px-6 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition">
                            Cancel
                        </button>
                        <button
                            onClick={downloadStory}
                            disabled={isGenerating || selectedItems.length === 0}
                            className="flex-1 sm:flex-none px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? <SpinnerIcon className="animate-spin h-5 w-5" /> : <DownloadIcon className="h-5 w-5" />}
                            Download Story
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MenuItemShareModal;
