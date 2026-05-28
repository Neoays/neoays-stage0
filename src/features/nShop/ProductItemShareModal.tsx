import React, { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { MenuItem } from '../../types';
import { SpinnerIcon, DownloadIcon, CheckCircleIcon, ShareIcon, ShoppingBagIcon } from '../../components/Icons';
import neoaysLogo from '../../assets/neoays-logo.svg';

interface ProductItemShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    productItems: MenuItem[];
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
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
];

const ProductItemShareModal: React.FC<ProductItemShareModalProps> = ({
    isOpen,
    onClose,
    productItems,
    profileData
}) => {
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [layoutStyle, setLayoutStyle] = useState<LayoutStyle>('modern');
    const [showPriceOnly, setShowPriceOnly] = useState(false);
    const [currency, setCurrency] = useState(profileData.currency || 'AED');
    const [isGenerating, setIsGenerating] = useState(false);
    const [layoutTab, setLayoutTab] = useState<'standard' | 'offer'>('standard');
    const [showShareOptions, setShowShareOptions] = useState(false);

    const captureRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const toggleItemSelection = (itemId: string) => {
        setSelectedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const selectedProductItems = productItems.filter(item => selectedItems.includes(item.id));
    const currencySymbol = CURRENCY_OPTIONS.find(c => c.code === currency)?.symbol || currency;

    const formatPrice = (price: string) => {
        if (price.includes('AED') || price.includes('$') || price.includes('€') || price.includes('د.إ')) {
            return price;
        }
        return `${currencySymbol} ${price}`;
    };

    const downloadStory = async () => {
        if (!captureRef.current || selectedItems.length === 0) return;
        setIsGenerating(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            const originalElement = captureRef.current;
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'position: fixed; left: -9999px; top: 0; z-index: -9999;';
            document.body.appendChild(wrapper);

            const clonedElement = originalElement.cloneNode(true) as HTMLElement;
            clonedElement.style.transform = 'none';
            clonedElement.style.width = '1080px';
            clonedElement.style.height = '1920px';

            wrapper.appendChild(clonedElement);

            // Copy canvas content (QR codes)
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

            document.body.removeChild(wrapper);

            const link = document.createElement('a');
            link.download = `product-story-${Date.now()}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 0.95);
            link.click();
        } catch (err) {
            console.error('Failed to generate story', err);
            alert('Failed to generate image. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const shareToSocial = async (platform: 'whatsapp' | 'instagram' | 'copy') => {
        const profileUrl = `${window.location.origin}/@${profileData.username}`;
        const text = `Check out our products! ${profileUrl}`;

        if (platform === 'whatsapp') {
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        } else if (platform === 'copy') {
            await navigator.clipboard.writeText(profileUrl);
            alert('Link copied to clipboard!');
        } else if (platform === 'instagram') {
            // Download image first for Instagram
            await downloadStory();
            alert('Image downloaded! Open Instagram and share from your gallery.');
        }
        setShowShareOptions(false);
    };

    const qrValue = `${window.location.origin}/@${profileData.username}`;

    const getLayoutBackground = () => {
        switch (layoutStyle) {
            case 'modern': return 'bg-gradient-to-br from-purple-600 via-violet-600 to-pink-700';
            case 'classic': return 'bg-gradient-to-b from-slate-800 to-slate-900';
            case 'bold': return 'bg-gradient-to-br from-orange-500 via-red-500 to-pink-600';
            case 'minimal': return 'bg-white';
            case 'hero': return 'bg-black';
            case 'promo': return 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500';
            case 'spotlight': return 'bg-gradient-to-b from-gray-900 via-gray-800 to-black';
            case 'offer': return 'bg-gradient-to-br from-purple-500 to-indigo-700';
            default: return 'bg-slate-900';
        }
    };

    const getTextColor = () => layoutStyle === 'minimal' ? 'text-slate-900' : 'text-white';

    const getPriceColor = () => {
        switch (layoutStyle) {
            case 'modern': return 'text-amber-300';
            case 'classic': return 'text-emerald-400';
            case 'bold': return 'text-yellow-300';
            case 'minimal': return 'text-purple-600';
            case 'hero': return 'text-yellow-400';
            case 'promo': return 'text-white';
            case 'spotlight': return 'text-amber-400';
            case 'offer': return 'text-yellow-300';
            default: return 'text-white';
        }
    };

    // Standard layout render
    const renderStandardLayout = () => (
        <>
            <div className="relative z-10 p-12 flex items-center gap-6">
                {profileData.photoURL ? (
                    <img
                        src={profileData.photoURL}
                        alt="Logo"
                        className="w-32 h-32 rounded-full border-4 border-white/20 object-cover shadow-2xl"
                        crossOrigin="anonymous"
                    />
                ) : (
                    <div className={`w-32 h-32 rounded-full ${layoutStyle === 'minimal' ? 'bg-purple-100 text-purple-600' : 'bg-white/10 text-white'} flex items-center justify-center text-5xl font-black`}>
                        {(profileData.displayName || 'S').charAt(0)}
                    </div>
                )}
                <div>
                    <h1 className={`text-5xl font-black ${getTextColor()}`}>
                        {profileData.displayName || 'Our Products'}
                    </h1>
                    {profileData.username && (
                        <p className={`text-2xl mt-2 ${layoutStyle === 'minimal' ? 'text-gray-500' : 'text-white/60'}`}>
                            @{profileData.username}
                        </p>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex-1 px-12 py-8 overflow-hidden flex items-center">
                <div className={`w-full grid gap-6 ${selectedProductItems.length === 1 ? 'grid-cols-1' :
                    selectedProductItems.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                    {selectedProductItems.slice(0, 4).map(item => {
                        const isSingle = selectedProductItems.length === 1;
                        const isDouble = selectedProductItems.length === 2;
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

            <div className="relative z-10 p-12 flex items-center justify-between">
                <div className={`${layoutStyle === 'minimal' ? 'bg-white border border-gray-200' : 'bg-white'} p-4 rounded-2xl shadow-xl`}>
                    <QRCodeCanvas value={qrValue} size={120} level="H" />
                </div>
                <div className={`text-right ${getTextColor()}`}>
                    <p className={`text-xl ${layoutStyle === 'minimal' ? 'text-gray-500' : 'text-white/60'}`}>Scan to shop</p>
                    <p className="text-2xl font-bold mt-1">neoays.com/@{profileData.username}</p>
                </div>
            </div>
        </>
    );

    // Hero layout for single product
    const renderHeroLayout = () => {
        const item = selectedProductItems[0];
        if (!item) return null;

        return (
            <div className="relative w-full h-full">
                {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-800 to-pink-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                <div className="absolute top-12 right-12 z-20">
                    <div className="bg-yellow-400 text-black px-8 py-6 rounded-3xl transform rotate-3 shadow-2xl">
                        {item.oldPrice && (
                            <p className="text-2xl line-through opacity-60 text-center">{formatPrice(item.oldPrice)}</p>
                        )}
                        <p className="text-6xl font-black">{formatPrice(item.price)}</p>
                    </div>
                </div>

                <div className="absolute top-12 left-12 z-20">
                    {profileData.photoURL ? (
                        <img src={profileData.photoURL} alt="Logo" className="w-24 h-24 rounded-full border-4 border-white/30 object-cover shadow-2xl" crossOrigin="anonymous" />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl font-black text-white">
                            {(profileData.displayName || 'S').charAt(0)}
                        </div>
                    )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 z-20 p-12">
                    <h1 className="text-7xl font-black text-white mb-4 leading-tight">{item.name}</h1>
                    {item.nameAr && <p className="text-4xl text-white/70 mb-6" dir="rtl">{item.nameAr}</p>}
                    {item.description && <p className="text-2xl text-white/80 mb-8 max-w-3xl">{item.description}</p>}

                    <div className="flex items-center gap-8 mt-8">
                        <div className="bg-white p-4 rounded-2xl shadow-xl">
                            <QRCodeCanvas value={qrValue} size={100} level="H" />
                        </div>
                        <div className="text-white">
                            <p className="text-xl opacity-70">Scan to shop</p>
                            <p className="text-2xl font-bold">@{profileData.username}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Promo layout
    const renderPromoLayout = () => {
        const item = selectedProductItems[0];
        if (!item) return null;

        const discount = item.oldPrice && item.price
            ? Math.round((1 - parseFloat(item.price) / parseFloat(item.oldPrice)) * 100)
            : null;

        return (
            <div className="relative w-full h-full flex flex-col">
                <div className="absolute inset-0 z-0 opacity-20">
                    {item.imageUrl && <img src={item.imageUrl} alt="" className="w-full h-full object-cover blur-xl" crossOrigin="anonymous" />}
                </div>

                <div className="relative z-10 p-12 text-center">
                    {profileData.photoURL && (
                        <img src={profileData.photoURL} alt="Logo" className="w-28 h-28 rounded-full border-4 border-white/30 object-cover shadow-2xl mx-auto mb-6" crossOrigin="anonymous" />
                    )}
                    <p className="text-3xl font-bold text-white/80 uppercase tracking-widest">Flash Sale</p>
                </div>

                <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-12">
                    {discount && (
                        <div className="bg-black/30 backdrop-blur-sm text-white px-12 py-6 rounded-3xl mb-8 transform -rotate-2">
                            <span className="text-[120px] font-black leading-none">{discount}%</span>
                            <span className="text-5xl font-bold block mt-2">OFF</span>
                        </div>
                    )}

                    {item.imageUrl && (
                        <div className="w-[400px] h-[400px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 mb-8">
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                        </div>
                    )}

                    <h2 className="text-5xl font-black text-white text-center mb-4">{item.name}</h2>

                    <div className="flex items-center gap-6">
                        {item.oldPrice && (
                            <span className="text-4xl line-through text-white/50">{formatPrice(item.oldPrice)}</span>
                        )}
                        <span className="text-7xl font-black text-white">{formatPrice(item.price)}</span>
                    </div>
                </div>

                <div className="relative z-10 p-12 flex items-center justify-center gap-8">
                    <div className="bg-white p-4 rounded-2xl shadow-xl">
                        <QRCodeCanvas value={qrValue} size={100} level="H" />
                    </div>
                    <div className="text-white text-center">
                        <p className="text-xl opacity-70">Shop Now</p>
                        <p className="text-2xl font-bold">@{profileData.username}</p>
                    </div>
                </div>
            </div>
        );
    };

    // Combo layout for multiple items
    const renderComboLayout = () => {
        const totalPrice = selectedProductItems.reduce((sum, item) => {
            const price = parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0;
            return sum + price;
        }, 0);

        return (
            <div className="relative w-full h-full flex flex-col bg-gradient-to-br from-purple-900 via-violet-800 to-indigo-900">
                <div className="relative z-10 p-12 text-center">
                    {profileData.photoURL && (
                        <img src={profileData.photoURL} alt="Logo" className="w-24 h-24 rounded-full border-4 border-white/30 object-cover shadow-2xl mx-auto mb-4" crossOrigin="anonymous" />
                    )}
                    <h1 className="text-5xl font-black text-white">Combo Deal</h1>
                    <p className="text-2xl text-white/60 mt-2">{selectedProductItems.length} items bundle</p>
                </div>

                <div className="relative z-10 flex-1 px-12 overflow-hidden">
                    <div className="grid grid-cols-2 gap-4 h-full">
                        {selectedProductItems.slice(0, 4).map((item, index) => (
                            <div key={item.id} className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10">
                                {item.imageUrl && (
                                    <div className="h-[200px]">
                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                    </div>
                                )}
                                <div className="p-4">
                                    <h3 className="text-2xl font-bold text-white truncate">{item.name}</h3>
                                    <p className="text-xl text-amber-300 font-bold mt-1">{formatPrice(item.price)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 p-12">
                    <div className="bg-gradient-to-r from-amber-400 to-yellow-500 rounded-3xl p-8 text-center shadow-2xl">
                        <p className="text-xl text-black/60 font-bold uppercase tracking-widest">Bundle Price</p>
                        <p className="text-6xl font-black text-black">{currencySymbol} {totalPrice.toFixed(2)}</p>
                    </div>

                    <div className="flex items-center justify-center gap-6 mt-8">
                        <div className="bg-white p-3 rounded-xl shadow-lg">
                            <QRCodeCanvas value={qrValue} size={80} level="H" />
                        </div>
                        <div className="text-white">
                            <p className="text-lg opacity-70">Scan to order</p>
                            <p className="text-xl font-bold">@{profileData.username}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderLayout = () => {
        switch (layoutStyle) {
            case 'hero': return renderHeroLayout();
            case 'promo': return renderPromoLayout();
            case 'combo': return renderComboLayout();
            default: return renderStandardLayout();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex bg-black/90 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="flex flex-col md:flex-row w-full h-full max-h-screen overflow-hidden" onClick={e => e.stopPropagation()}>

                {/* Left Panel - Controls */}
                <div className="w-full md:w-[400px] bg-white flex flex-col h-full overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                        <div className="flex items-center gap-2">
                            <ShoppingBagIcon className="w-5 h-5 text-purple-600" />
                            <h2 className="font-black text-lg text-gray-900">Share Products</h2>
                        </div>
                        <button onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-600">&times;</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {/* Product Selection */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Select Products</h3>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                {productItems.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => toggleItemSelection(item.id)}
                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${selectedItems.includes(item.id)
                                            ? 'bg-purple-50 border-2 border-purple-500'
                                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedItems.includes(item.id) ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                                            }`}>
                                            {selectedItems.includes(item.id) && <CheckCircleIcon className="w-3 h-3 text-white" />}
                                        </div>
                                        {item.imageUrl && (
                                            <img src={item.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 text-sm truncate">{item.name}</p>
                                            <p className="text-xs text-purple-600 font-bold">{formatPrice(item.price)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Layout Tabs */}
                        <div>
                            <div className="flex gap-2 mb-3">
                                <button
                                    onClick={() => setLayoutTab('standard')}
                                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg ${layoutTab === 'standard' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'
                                        }`}
                                >
                                    Standard
                                </button>
                                <button
                                    onClick={() => setLayoutTab('offer')}
                                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg ${layoutTab === 'offer' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'
                                        }`}
                                >
                                    Offers
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {LAYOUT_OPTIONS.filter(l => l.category === layoutTab).map(layout => (
                                    <button
                                        key={layout.id}
                                        onClick={() => setLayoutStyle(layout.id)}
                                        className={`p-3 rounded-xl text-left ${layoutStyle === layout.id
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <p className="text-xs font-bold">{layout.name}</p>
                                        <p className={`text-[10px] ${layoutStyle === layout.id ? 'text-white/70' : 'text-gray-400'}`}>
                                            {layout.description}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Currency */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Currency</h3>
                            <select
                                value={currency}
                                onChange={e => setCurrency(e.target.value)}
                                className="w-full p-3 bg-gray-50 rounded-xl text-sm font-bold text-gray-700"
                            >
                                {CURRENCY_OPTIONS.map(c => (
                                    <option key={c.code} value={c.code}>{c.symbol} - {c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-gray-100 space-y-2">
                        <button
                            onClick={downloadStory}
                            disabled={isGenerating || selectedItems.length === 0}
                            className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isGenerating ? <SpinnerIcon className="animate-spin h-5 w-5" /> : <DownloadIcon className="h-5 w-5" />}
                            Download Image
                        </button>
                        <button
                            onClick={() => setShowShareOptions(!showShareOptions)}
                            disabled={selectedItems.length === 0}
                            className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <ShareIcon className="h-5 w-5" />
                            Share Link
                        </button>
                        {showShareOptions && (
                            <div className="flex gap-2 animate-fade-in">
                                <button onClick={() => shareToSocial('whatsapp')} className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-bold">WhatsApp</button>
                                <button onClick={() => shareToSocial('instagram')} className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-bold">Instagram</button>
                                <button onClick={() => shareToSocial('copy')} className="flex-1 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm font-bold">Copy</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Preview */}
                <div className="flex-1 bg-slate-800 flex items-center justify-center p-4 overflow-hidden">
                    {selectedItems.length === 0 ? (
                        <div className="text-center text-white/50">
                            <ShoppingBagIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p className="text-xl font-bold">Select products to preview</p>
                        </div>
                    ) : (
                        <div className="transform scale-[0.35] sm:scale-50 origin-center">
                            <div
                                ref={captureRef}
                                className={`w-[1080px] h-[1920px] ${getLayoutBackground()} relative overflow-hidden flex flex-col font-sans`}
                            >
                                {renderLayout()}

                                {/* Watermark */}
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 opacity-30">
                                    <img src={neoaysLogo} className="h-8 w-auto grayscale brightness-200" alt="Neoays" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductItemShareModal;
