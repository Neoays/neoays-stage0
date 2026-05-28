import React, { useState, useEffect } from 'react';
import { MenuItem, UserProfile } from '../types';
import {
    ShoppingBagIcon,
    PlusIcon,
    MinusIcon,
    ChevronRightIcon,
    ArrowLeftIcon,
    GridIcon,
    ViewListIcon
} from '../components/Icons';
import { useLanguage } from '../LanguageContext';
import BubbleCategoryMenu, { getCategoryIcon } from '../components/BubbleCategoryMenu';

interface PublicMenuViewProps {
    profileData: UserProfile;
    onClose: () => void;
}

type MenuLayout = 'cards' | 'grid' | 'list' | 'magazine';
type MenuView = 'bubble-select' | 'menu' | 'checkout';

const getCurrencySymbol = (country?: string, menuCurrency?: string) => {
    // If menuCurrency is explicitly set, use it
    if (menuCurrency) {
        return menuCurrency;
    }

    // Otherwise derive from country, default to Oman (OMR)
    switch (country?.toLowerCase()) {
        case 'united arab emirates':
        case 'uae':
            return 'AED';
        case 'oman':
            return 'OMR';
        case 'saudi arabia':
        case 'ksa':
            return 'SAR';
        case 'qatar':
            return 'QAR';
        case 'kuwait':
            return 'KWD';
        case 'bahrain':
            return 'BHD';
        case 'india':
            return '₹';
        case 'egypt':
            return 'EGP';
        case 'jordan':
            return 'JOD';
        case 'lebanon':
            return 'LBP';
        default:
            return 'OMR'; // Default to Oman
    }
};

// Theme colors mapping
const THEME_COLORS: Record<string, { primary: string; light: string; text: string; gradient: string }> = {
    indigo: { primary: 'bg-indigo-600', light: 'bg-indigo-50', text: 'text-indigo-600', gradient: 'from-indigo-500 to-purple-600' },
    emerald: { primary: 'bg-emerald-600', light: 'bg-emerald-50', text: 'text-emerald-600', gradient: 'from-emerald-500 to-teal-600' },
    rose: { primary: 'bg-rose-600', light: 'bg-rose-50', text: 'text-rose-600', gradient: 'from-rose-500 to-pink-600' },
    amber: { primary: 'bg-amber-600', light: 'bg-amber-50', text: 'text-amber-600', gradient: 'from-amber-500 to-orange-600' },
    violet: { primary: 'bg-violet-600', light: 'bg-violet-50', text: 'text-violet-600', gradient: 'from-violet-500 to-purple-600' },
    slate: { primary: 'bg-slate-700', light: 'bg-slate-50', text: 'text-slate-700', gradient: 'from-slate-600 to-gray-800' },
    orange: { primary: 'bg-orange-600', light: 'bg-orange-50', text: 'text-orange-600', gradient: 'from-orange-500 to-red-600' },
    cyan: { primary: 'bg-cyan-600', light: 'bg-cyan-50', text: 'text-cyan-600', gradient: 'from-cyan-500 to-blue-600' },
};

const PublicMenuView: React.FC<PublicMenuViewProps> = ({ profileData, onClose }) => {
    const [cart, setCart] = useState<{ [key: string]: number }>({});
    const [view, setView] = useState<MenuView>('bubble-select'); // Start with bubble selection on mobile
    const [customerMobile, setCustomerMobile] = useState('');
    const [menuLayout, setMenuLayout] = useState<MenuLayout>('cards');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile viewport
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Auto-switch to menu view on desktop
    useEffect(() => {
        if (!isMobile && view === 'bubble-select') {
            setView('menu');
        }
    }, [isMobile, view]);

    const { language } = useLanguage();
    const currency = getCurrencySymbol(profileData.country, profileData.menuCurrency);
    const isAr = language === 'ar';

    // Theme and offer settings
    const theme = THEME_COLORS[profileData.menuTheme || 'indigo'] || THEME_COLORS.indigo;
    const todaysOffer = profileData.todaysOffer || { enabled: false, itemIds: [], title: '', discount: '' };

    const menuItems = profileData.menuItems || [];
    const categories = Array.from(new Set(menuItems.map(item => isAr ? (item.categoryAr || item.category) : item.category)));

    // Get today's offer items
    const offerItems = todaysOffer.enabled
        ? menuItems.filter((item: MenuItem) => todaysOffer.itemIds?.includes(item.id))
        : [];

    const filteredItems = selectedCategory
        ? menuItems.filter((i: MenuItem) => (isAr ? (i.categoryAr || i.category) : i.category) === selectedCategory)
        : menuItems;

    // Build bubble categories with counts and icons
    const categoryBubbles = categories.map((cat, index) => {
        const catName = cat as string;
        const count = menuItems.filter((i: MenuItem) => (isAr ? (i.categoryAr || i.category) : i.category) === catName).length;
        return {
            id: catName,
            name: catName,
            nameAr: menuItems.find((i: MenuItem) => i.category === catName)?.categoryAr,
            icon: getCategoryIcon(catName),
            color: `bg-${['rose', 'amber', 'emerald', 'cyan', 'violet', 'pink', 'blue', 'orange'][index % 8]}-500`,
            count
        };
    });

    // Handle category selection from bubble menu
    const handleBubbleCategorySelect = (categoryId: string) => {
        if (categoryId === 'todays-offer') {
            setSelectedCategory(null);
        } else {
            setSelectedCategory(categoryId);
        }
        setView('menu');
    };

    // Allow going back to bubble selection on mobile
    const handleBackToCategories = () => {
        if (isMobile) {
            setView('bubble-select');
            setSelectedCategory(null);
        } else {
            onClose();
        }
    };


    const addToCart = (id: string) => {
        setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    };

    const removeFromCart = (id: string) => {
        setCart(prev => {
            const next = { ...prev };
            if (next[id] > 1) next[id]--;
            else delete next[id];
            return next;
        });
    };

    const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
    const totalPrice = Object.entries(cart).reduce((total, [id, qty]) => {
        const item = menuItems.find((i: MenuItem) => i.id === id);
        const price = parseFloat(item?.price.replace(/[^0-9.]/g, '') || '0');
        return total + (price * qty);
    }, 0);

    const handlePlaceOrder = () => {
        if (!customerMobile) {
            alert(isAr ? "يرجى إدخال رقم هاتفك المحمول للطلب." : "Please enter your mobile number for the order.");
            return;
        }
        const orderSummary = Object.entries(cart).map(([id, qty]) => {
            const item = menuItems.find((i: MenuItem) => i.id === id);
            return `${isAr ? (item?.nameAr || item?.name) : item?.name} x${qty}`;
        }).join('\n');

        const message = `*New Order from Neoays*\n\nItems:\n${orderSummary}\n\nTotal: ${currency} ${totalPrice.toFixed(2)}\nContact: ${customerMobile}`;

        const whatsappUrl = `https://wa.me/${profileData.mobileNumber.replace(/\+/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        alert(isAr ? "تم إرسال الطلب إلى التاجر عبر واتساب!" : "Order sent to merchant via WhatsApp!");
        onClose();
    };

    // Today's Offer Section
    const renderTodaysOffer = () => {
        if (!todaysOffer.enabled || offerItems.length === 0) return null;

        return (
            <div className="mb-6 animate-fade-in">
                {/* Offer Banner */}
                <div className={`bg-gradient-to-r ${theme.gradient} rounded-3xl p-4 mb-4 relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-white/80 text-xs font-bold uppercase tracking-widest">🔥 {isAr ? 'عرض اليوم' : "Today's Offer"}</p>
                            <h3 className="text-2xl font-black text-white">{todaysOffer.title || (isAr ? 'عروض خاصة' : 'Special Deals')}</h3>
                        </div>
                        {todaysOffer.discount && (
                            <div className="bg-yellow-400 text-black px-4 py-2 rounded-2xl font-black text-lg animate-pulse">
                                {todaysOffer.discount}
                            </div>
                        )}
                    </div>
                </div>

                {/* Offer Items Horizontal Scroll */}
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                    {offerItems.map((item: MenuItem, index: number) => (
                        <div
                            key={item.id}
                            className="flex-shrink-0 w-48 bg-white rounded-2xl overflow-hidden shadow-lg border-2 border-yellow-300 animate-fade-in-up"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="relative h-32">
                                {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className={`w-full h-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center`}>
                                        <span className="text-4xl">⭐</span>
                                    </div>
                                )}
                                <div className="absolute top-2 left-2 bg-yellow-400 text-black text-[10px] px-2 py-0.5 rounded-full font-black">
                                    🔥 OFFER
                                </div>
                            </div>
                            <div className="p-3">
                                <h4 className="font-bold text-sm text-slate-900 truncate">{isAr ? (item.nameAr || item.name) : item.name}</h4>
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-1">
                                        {item.oldPrice && <span className="text-xs text-gray-400 line-through">{item.oldPrice}</span>}
                                        <span className={`font-black ${theme.text}`}>{currency} {item.price}</span>
                                    </div>
                                    <button
                                        onClick={() => addToCart(item.id)}
                                        className={`h-8 w-8 ${theme.primary} text-white rounded-full flex items-center justify-center shadow-lg`}
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Animated Card Layout
    const renderCardsLayout = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredItems.filter((i: MenuItem) => i.isAvailable).map((item: MenuItem, index: number) => (
                <div
                    key={item.id}
                    className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-fade-in-up border border-gray-50"
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                    {/* Image with Overlay */}
                    <div className="relative h-48 overflow-hidden">
                        {item.imageUrl ? (
                            <>
                                <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            </>
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center">
                                <span className="text-6xl">🍽️</span>
                            </div>
                        )}

                        {/* Price Badge */}
                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                            <span className="font-black text-indigo-600">{currency} {item.price}</span>
                        </div>

                        {/* Discount Badge */}
                        {item.oldPrice && (
                            <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                                SALE
                            </div>
                        )}

                        {/* Name Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h4 className="font-black text-white text-lg drop-shadow-lg">{isAr ? (item.nameAr || item.name) : item.name}</h4>
                        </div>
                    </div>

                    {/* Content */}
                    <div className={`p-4 ${isAr ? 'text-right' : 'text-left'}`}>
                        {item.description && (
                            <p className="text-sm text-gray-500 line-clamp-2 mb-3">{isAr ? (item.descriptionAr || item.description) : item.description}</p>
                        )}

                        {/* Add to Cart */}
                        <div className="flex items-center justify-between">
                            {item.oldPrice && (
                                <span className="text-sm text-gray-400 line-through">{currency} {item.oldPrice}</span>
                            )}
                            <div className="flex-1" />
                            {cart[item.id] ? (
                                <div className="flex items-center gap-2 bg-indigo-100 rounded-full px-2 py-1">
                                    <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-indigo-600 hover:bg-white rounded-full transition">
                                        <MinusIcon className="h-4 w-4" />
                                    </button>
                                    <span className="font-black text-indigo-600 min-w-[20px] text-center">{cart[item.id]}</span>
                                    <button onClick={() => addToCart(item.id)} className="p-1.5 text-indigo-600 hover:bg-white rounded-full transition">
                                        <PlusIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => addToCart(item.id)}
                                    className="h-10 w-10 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-110 transition-all"
                                >
                                    <PlusIcon className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    // Grid Layout - Compact squares
    const renderGridLayout = () => (
        <div className="grid grid-cols-3 gap-3">
            {filteredItems.filter((i: MenuItem) => i.isAvailable).map((item: MenuItem, index: number) => (
                <div
                    key={item.id}
                    className="relative aspect-square rounded-2xl overflow-hidden shadow-md group animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                >
                    {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
                            <span className="text-4xl">🍽️</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-2">
                        <p className="text-white font-bold text-xs truncate">{isAr ? (item.nameAr || item.name) : item.name}</p>
                        <p className="text-yellow-300 font-black text-sm">{currency} {item.price}</p>
                    </div>
                    {cart[item.id] ? (
                        <div className="absolute top-2 right-2 bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                            {cart[item.id]}
                        </div>
                    ) : null}
                    <button
                        onClick={() => addToCart(item.id)}
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/40 flex items-center justify-center transition-opacity"
                    >
                        <div className="bg-white rounded-full p-3 transform scale-0 group-hover:scale-100 transition-transform">
                            <PlusIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                    </button>
                </div>
            ))}
        </div>
    );

    // List Layout - Horizontal cards
    const renderListLayout = () => (
        <div className="space-y-3">
            {filteredItems.filter((i: MenuItem) => i.isAvailable).map((item: MenuItem, index: number) => (
                <div
                    key={item.id}
                    className={`bg-white rounded-2xl p-3 flex gap-4 shadow-sm border border-gray-100 hover:shadow-lg transition-all animate-slide-in-right ${isAr ? 'flex-row-reverse' : ''}`}
                    style={{ animationDelay: `${index * 40}ms` }}
                >
                    {item.imageUrl && (
                        <div className="h-20 w-20 rounded-xl overflow-hidden flex-shrink-0 relative">
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            {item.oldPrice && (
                                <div className="absolute top-1 left-1 bg-red-500 text-white text-[8px] px-1 rounded font-bold">
                                    SALE
                                </div>
                            )}
                        </div>
                    )}
                    <div className={`flex-1 min-w-0 ${isAr ? 'text-right' : 'text-left'}`}>
                        <h4 className="font-bold text-slate-900 truncate">{isAr ? (item.nameAr || item.name) : item.name}</h4>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{isAr ? (item.descriptionAr || item.description) : item.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                            {item.oldPrice && <span className="text-xs text-gray-400 line-through">{item.oldPrice}</span>}
                            <span className="font-black text-indigo-600">{currency} {item.price}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                        {cart[item.id] ? (
                            <div className="flex items-center gap-2 bg-indigo-50 rounded-xl p-1">
                                <button onClick={() => removeFromCart(item.id)} className="p-1 text-indigo-600"><MinusIcon className="h-4 w-4" /></button>
                                <span className="text-xs font-black text-indigo-600 min-w-[16px] text-center">{cart[item.id]}</span>
                                <button onClick={() => addToCart(item.id)} className="p-1 text-indigo-600"><PlusIcon className="h-4 w-4" /></button>
                            </div>
                        ) : (
                            <button onClick={() => addToCart(item.id)} className="h-10 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                                <PlusIcon className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );

    // Magazine Layout - Featured + Grid
    const renderMagazineLayout = () => {
        const featured = filteredItems.filter((i: MenuItem) => i.isAvailable).slice(0, 1)[0];
        const rest = filteredItems.filter((i: MenuItem) => i.isAvailable).slice(1);

        return (
            <div className="space-y-4">
                {/* Featured Item */}
                {featured && (
                    <div className="relative rounded-3xl overflow-hidden h-64 shadow-2xl animate-fade-in group">
                        {featured.imageUrl ? (
                            <img src={featured.imageUrl} alt={featured.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-600" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent flex flex-col justify-end p-6">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-yellow-400 text-black text-xs font-black px-2 py-1 rounded-full">⭐ FEATURED</span>
                                {featured.oldPrice && <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">SALE</span>}
                            </div>
                            <h3 className="text-3xl font-black text-white mb-1">{isAr ? (featured.nameAr || featured.name) : featured.name}</h3>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {featured.oldPrice && <span className="text-xl text-white/60 line-through">{currency} {featured.oldPrice}</span>}
                                    <span className="text-3xl font-black text-yellow-400">{currency} {featured.price}</span>
                                </div>
                                {cart[featured.id] ? (
                                    <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1">
                                        <button onClick={() => removeFromCart(featured.id)} className="p-1 text-indigo-600"><MinusIcon className="h-5 w-5" /></button>
                                        <span className="font-black text-indigo-600">{cart[featured.id]}</span>
                                        <button onClick={() => addToCart(featured.id)} className="p-1 text-indigo-600"><PlusIcon className="h-5 w-5" /></button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => addToCart(featured.id)}
                                        className="bg-white text-indigo-600 px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-indigo-600 hover:text-white transition-colors"
                                    >
                                        <PlusIcon className="h-5 w-5" /> Add
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Rest in Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {rest.map((item: MenuItem, index: number) => (
                        <div
                            key={item.id}
                            className="bg-white rounded-2xl overflow-hidden shadow-md animate-fade-in-up group"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="relative h-32">
                                {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center">
                                        <span className="text-4xl">🍽️</span>
                                    </div>
                                )}
                                {item.oldPrice && (
                                    <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                                        SALE
                                    </div>
                                )}
                            </div>
                            <div className="p-3">
                                <h4 className="font-bold text-sm text-slate-900 truncate">{isAr ? (item.nameAr || item.name) : item.name}</h4>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="font-black text-indigo-600">{currency} {item.price}</span>
                                    {cart[item.id] ? (
                                        <div className="flex items-center gap-1 bg-indigo-100 rounded-full px-2 py-0.5">
                                            <button onClick={() => removeFromCart(item.id)} className="p-0.5 text-indigo-600"><MinusIcon className="h-3 w-3" /></button>
                                            <span className="text-xs font-black text-indigo-600">{cart[item.id]}</span>
                                            <button onClick={() => addToCart(item.id)} className="p-0.5 text-indigo-600"><PlusIcon className="h-3 w-3" /></button>
                                        </div>
                                    ) : (
                                        <button onClick={() => addToCart(item.id)} className="h-8 w-8 bg-indigo-600 text-white rounded-full flex items-center justify-center">
                                            <PlusIcon className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderMenuItems = () => {
        switch (menuLayout) {
            case 'grid': return renderGridLayout();
            case 'list': return renderListLayout();
            case 'magazine': return renderMagazineLayout();
            default: return renderCardsLayout();
        }
    };

    return (
        <div className={`fixed inset-0 z-50 bg-gray-50 flex flex-col animate-fade-in-up ${isAr ? 'text-right' : 'text-left'}`}>
            {/* Bubble Category Selection (Mobile-first) */}
            {view === 'bubble-select' && (
                <BubbleCategoryMenu
                    categories={categoryBubbles}
                    businessName={profileData.displayName || 'Menu'}
                    businessLogo={profileData.photoURL}
                    selectedCategory={selectedCategory || undefined}
                    onSelectCategory={handleBubbleCategorySelect}
                    onViewAll={() => {
                        setSelectedCategory(null);
                        setView('menu');
                    }}
                    isAr={isAr}
                />
            )}

            {/* Regular Menu View */}
            {view !== 'bubble-select' && (
                <>
                    {/* Header */}
                    <div className={`p-3 sm:p-4 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-20 ${isAr ? 'flex-row-reverse' : ''}`}>
                        <button onClick={handleBackToCategories} className="p-2 text-gray-400 hover:text-slate-900 rounded-xl hover:bg-gray-100 transition">
                            {isAr ? <ChevronRightIcon className="h-6 w-6 transform rotate-180" /> : <ArrowLeftIcon className="h-6 w-6" />}
                        </button>
                        <h2 className="text-base sm:text-lg font-black text-slate-900">
                            {view === 'menu'
                                ? (isAr ? `قائمة ${profileData.displayName}` : `${profileData.displayName}'s Menu`)
                                : (isAr ? 'الدفع' : 'Checkout')}
                        </h2>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setMenuLayout('cards')}
                                className={`p-2 rounded-lg transition ${menuLayout === 'cards' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'}`}
                            >
                                <GridIcon className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => setMenuLayout('list')}
                                className={`p-2 rounded-lg transition ${menuLayout === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'}`}
                            >
                                <ViewListIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className="sticky top-[60px] z-10 bg-white border-b border-gray-100 px-4 py-3 overflow-x-auto">
                        <div className={`flex gap-2 ${isAr ? 'flex-row-reverse' : ''}`}>
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${!selectedCategory
                                    ? 'bg-indigo-600 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {isAr ? 'الكل' : 'All'}
                            </button>
                            {categories.map((cat: any) => (
                                <button
                                    key={cat as string}
                                    onClick={() => setSelectedCategory(cat as string)}
                                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === cat
                                        ? 'bg-indigo-600 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {cat as string}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Layout Selector */}
                    <div className="px-4 py-2 flex gap-2 bg-gray-50">
                        {[
                            { id: 'cards', label: isAr ? 'بطاقات' : 'Cards', emoji: '🎴' },
                            { id: 'grid', label: isAr ? 'شبكة' : 'Grid', emoji: '🔲' },
                            { id: 'list', label: isAr ? 'قائمة' : 'List', emoji: '📋' },
                            { id: 'magazine', label: isAr ? 'مجلة' : 'Magazine', emoji: '📰' },
                        ].map(layout => (
                            <button
                                key={layout.id}
                                onClick={() => setMenuLayout(layout.id as MenuLayout)}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${menuLayout === layout.id
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-white text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {layout.emoji} {layout.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto pb-32">
                        {view === 'menu' ? (
                            <div className="p-4">
                                {renderTodaysOffer()}
                                {renderMenuItems()}
                            </div>
                        ) : (
                            <div className="p-6 space-y-8 animate-fade-in">
                                <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
                                        {isAr ? 'ملخص الطلب' : 'Order Summary'}
                                    </h3>
                                    <div className="space-y-4">
                                        {Object.entries(cart).map(([id, qty]) => {
                                            const item = menuItems.find((i: MenuItem) => i.id === id);
                                            return (
                                                <div key={id} className={`flex justify-between items-center pb-4 border-b border-gray-100 last:border-0 last:pb-0 ${isAr ? 'flex-row-reverse' : ''}`}>
                                                    <div className={`${isAr ? 'text-right' : 'text-left'}`}>
                                                        <p className="font-bold text-slate-900">{isAr ? (item?.nameAr || item?.name) : item?.name}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase">{isAr ? `الكمية: ${qty}` : `Qty: ${qty}`}</p>
                                                    </div>
                                                    <p className="font-black text-slate-800">{currency} {item?.price}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className={`mt-6 pt-6 border-t-2 border-dashed border-gray-200 flex justify-between items-center text-xl ${isAr ? 'flex-row-reverse' : ''}`}>
                                        <span className="font-black uppercase tracking-tight text-slate-400">{isAr ? 'الإجمالي' : 'Total'}</span>
                                        <span className="font-black text-indigo-600 text-2xl">{currency} {totalPrice.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="space-y-4 px-2">
                                    <label className={`text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block ${isAr ? 'text-right' : 'text-left'}`}>
                                        {isAr ? 'رقم هاتفك المحمول' : 'Your Mobile Number'}
                                    </label>
                                    <input
                                        type="tel"
                                        dir={isAr ? 'rtl' : 'ltr'}
                                        value={customerMobile}
                                        onChange={e => setCustomerMobile(e.target.value)}
                                        placeholder={isAr ? "رقم للتواصل لتأكيد الطلب" : "Contact for order confirmation"}
                                        className={`w-full p-4 rounded-2xl bg-white border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${isAr ? 'text-right' : 'text-left'}`}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sticky Checkout Bar */}
                    {cartCount > 0 && (
                        <div className="fixed bottom-0 inset-x-0 p-4 bg-white/90 backdrop-blur-xl border-t border-gray-100 shadow-2xl">
                            {view === 'menu' ? (
                                <button
                                    onClick={() => setView('checkout')}
                                    className={`w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl flex items-center justify-between px-6 shadow-xl transition-all hover:scale-[1.01] active:scale-95 ${isAr ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`flex items-center gap-3 ${isAr ? 'flex-row-reverse' : ''}`}>
                                        <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center font-black">
                                            {cartCount}
                                        </div>
                                        <span className="font-bold text-sm">{isAr ? 'عرض عربة التسوق' : 'View Cart'}</span>
                                    </div>
                                    <div className={`flex items-center gap-2 ${isAr ? 'flex-row-reverse' : ''}`}>
                                        <span className="text-lg font-black">{currency} {totalPrice.toFixed(2)}</span>
                                        <ChevronRightIcon className={`h-5 w-5 ${isAr ? 'transform rotate-180' : ''}`} />
                                    </div>
                                </button>
                            ) : (
                                <button
                                    onClick={handlePlaceOrder}
                                    className={`w-full h-14 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all hover:from-green-600 hover:to-emerald-700 active:scale-95 ${isAr ? 'flex-row-reverse' : ''}`}
                                >
                                    <ShoppingBagIcon className="h-6 w-6" />
                                    <span className="font-bold">{isAr ? 'إرسال الطلب عبر واتساب' : 'Place Order via WhatsApp'}</span>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Custom CSS for animations */}
                    <style>{`
                @keyframes slide-in-right {
                    from {
                        opacity: 0;
                        transform: translateX(${isAr ? '-20px' : '20px'});
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.4s ease-out forwards;
                }
            `}</style>
                </>
            )}
        </div>
    );
};

export default PublicMenuView;
