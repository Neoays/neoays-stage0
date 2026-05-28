import React, { useState } from 'react';
import { MenuItem, UserProfile } from '../types';
import {
    ShoppingBagIcon,
    PlusIcon,
    MinusIcon,
    ChevronRightIcon,
    CurrencyDollarIcon,
    ArrowLeftIcon,
    TagIcon
} from '../components/Icons';
import { useLanguage } from '../LanguageContext';

interface PublicProductViewProps {
    profileData: UserProfile;
    onClose: () => void;
}

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

const PublicProductView: React.FC<PublicProductViewProps> = ({ profileData, onClose }) => {
    const [cart, setCart] = useState<{ [key: string]: number }>({});
    const [view, setView] = useState<'products' | 'checkout'>('products');

    const { language } = useLanguage();
    const currency = getCurrencySymbol(profileData.country, profileData.menuCurrency);
    const isAr = language === 'ar';

    const productItems = profileData.productItems || [];
    const categories = Array.from(new Set(productItems.map(item => isAr ? (item.categoryAr || item.category) : item.category)));

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
        const item = productItems.find((i: MenuItem) => i.id === id);
        const price = parseFloat(item?.price.replace(/[^0-9.]/g, '') || '0');
        return total + (price * qty);
    }, 0);

    const handleWhatsAppInquiry = () => {
        const inquirySummary = Object.entries(cart).map(([id, qty]) => {
            const item = productItems.find((i: MenuItem) => i.id === id);
            return `${isAr ? (item?.nameAr || item?.name) : item?.name} x${qty}`;
        }).join('\n');

        const message = `*Product Inquiry via Neoays*\n\nProducts:\n${inquirySummary}\n\nTotal Estimate: ${currency} ${totalPrice.toFixed(2)}`;
        const whatsappUrl = `https://wa.me/${profileData.mobileNumber.replace(/\+/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className={`fixed inset-0 z-50 bg-white flex flex-col animate-fade-in-up ${isAr ? 'text-right' : 'text-left'}`}>
            {/* Header */}
            <div className={`p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 ${isAr ? 'flex-row-reverse' : ''}`}>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-slate-900">
                    {isAr ? <ChevronRightIcon className="h-6 w-6 transform rotate-180" /> : <ArrowLeftIcon className="h-6 w-6" />}
                </button>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                    {view === 'products'
                        ? (isAr ? 'كتالوج المنتجات' : 'Product Catalog')
                        : (isAr ? 'السلة' : 'Cart')}
                </h2>
                <div className="w-10" />
            </div>

            <div className="flex-1 overflow-y-auto pb-32">
                {view === 'products' ? (
                    <div className="p-4 space-y-8">
                        {categories.map((cat: any) => (
                            <section key={cat as string} className="space-y-4">
                                <h3 className={`text-xs font-black text-indigo-500 uppercase tracking-[0.2em] ${isAr ? 'mr-1' : 'ml-1'}`}>{cat as string}</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {productItems.filter((i: MenuItem) => (isAr ? (i.categoryAr || i.category) : i.category) === cat).map((item: MenuItem) => (
                                        <div key={item.id} className={`bg-white border border-gray-100 rounded-2xl p-4 flex gap-4 shadow-sm active:scale-[0.98] transition-transform ${isAr ? 'flex-row-reverse' : ''}`}>
                                            {item.imageUrl && (
                                                <div className="h-20 w-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-50 border border-gray-100">
                                                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-900 truncate">{isAr ? (item.nameAr || item.name) : item.name}</h4>
                                                <p className="text-[10px] font-black text-indigo-600 mt-2">{currency} {item.price}</p>
                                            </div>
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                {cart[item.id] ? (
                                                    <div className="flex items-center gap-3 bg-indigo-50 rounded-xl p-1">
                                                        <button onClick={() => removeFromCart(item.id)} className="p-1 text-indigo-600">
                                                            <MinusIcon className="h-4 w-4" />
                                                        </button>
                                                        <span className="text-xs font-black text-indigo-600">{cart[item.id]}</span>
                                                        <button onClick={() => addToCart(item.id)} className="p-1 text-indigo-600">
                                                            <PlusIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => addToCart(item.id)} className="h-10 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
                                                        <PlusIcon className="h-5 w-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                ) : (
                    <div className="p-6 space-y-6 animate-fade-in">
                        <div className="bg-slate-50 rounded-[2rem] p-6 border border-gray-100">
                            {Object.entries(cart).map(([id, qty]) => {
                                const item = productItems.find((i: MenuItem) => i.id === id);
                                return (
                                    <div key={id} className={`flex justify-between items-center py-2 ${isAr ? 'flex-row-reverse' : ''}`}>
                                        <p className="font-bold">{isAr ? (item?.nameAr || item?.name) : item?.name} x{qty}</p>
                                        <p className="font-black text-indigo-600">{currency} {item?.price}</p>
                                    </div>
                                );
                            })}
                            <div className="mt-4 pt-4 border-t border-dashed border-gray-300 flex justify-between font-black">
                                <span>{isAr ? 'المجموع' : 'Total'}</span>
                                <span className="text-xl text-indigo-600">{currency} {totalPrice.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {cartCount > 0 && (
                <div className="fixed bottom-0 inset-x-0 p-4 bg-white/80 backdrop-blur-lg border-t border-gray-100">
                    {view === 'products' ? (
                        <button onClick={() => setView('checkout')} className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl">
                            {isAr ? 'عرض السلة' : 'View Cart'} ({cartCount})
                        </button>
                    ) : (
                        <button onClick={handleWhatsAppInquiry} className="w-full h-14 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl flex items-center justify-center gap-2">
                            <ShoppingBagIcon className="h-5 w-5" />
                            {isAr ? 'استفسار عبر واتساب' : 'Inquire via WhatsApp'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default PublicProductView;
