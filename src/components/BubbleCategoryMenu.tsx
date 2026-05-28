import React from 'react';

interface CategoryBubble {
    id: string;
    name: string;
    nameAr?: string;
    icon: string;
    color: string;
    count: number;
}

interface BubbleCategoryMenuProps {
    categories: CategoryBubble[];
    businessName: string;
    businessLogo?: string;
    selectedCategory?: string;
    onSelectCategory: (categoryId: string) => void;
    onViewAll: () => void;
    isAr?: boolean;
}

// Auto-detect category icons based on name keywords
const getCategoryIcon = (categoryName: string): string => {
    const name = categoryName.toLowerCase();
    if (name.includes('tea') || name.includes('شاي')) return '🍵';
    if (name.includes('coffee') || name.includes('قهوة')) return '☕';
    if (name.includes('juice') || name.includes('عصير')) return '🧃';
    if (name.includes('drink') || name.includes('مشروب')) return '🥤';
    if (name.includes('burger') || name.includes('برجر')) return '🍔';
    if (name.includes('pizza') || name.includes('بيتزا')) return '🍕';
    if (name.includes('pasta') || name.includes('معكرونة')) return '🍝';
    if (name.includes('rice') || name.includes('أرز')) return '🍚';
    if (name.includes('curry') || name.includes('كاري')) return '🍛';
    if (name.includes('grill') || name.includes('مشوي')) return '🍖';
    if (name.includes('chicken') || name.includes('دجاج')) return '🍗';
    if (name.includes('fish') || name.includes('سمك')) return '🐟';
    if (name.includes('seafood') || name.includes('مأكولات بحرية')) return '🦐';
    if (name.includes('shrimp') || name.includes('روبيان')) return '🦐';
    if (name.includes('salad') || name.includes('سلطة')) return '🥗';
    if (name.includes('soup') || name.includes('شوربة')) return '🥣';
    if (name.includes('bread') || name.includes('خبز')) return '🍞';
    if (name.includes('sandwich') || name.includes('ساندويش')) return '🥪';
    if (name.includes('wrap') || name.includes('شاورما')) return '🌯';
    if (name.includes('dessert') || name.includes('حلويات')) return '🍰';
    if (name.includes('ice') || name.includes('آيس')) return '🍨';
    if (name.includes('cake') || name.includes('كيك')) return '🎂';
    if (name.includes('breakfast') || name.includes('فطور')) return '🍳';
    if (name.includes('appetizer') || name.includes('مقبلات')) return '🍱';
    if (name.includes('snack') || name.includes('سناك')) return '🍿';
    if (name.includes('fries') || name.includes('بطاطس')) return '🍟';
    if (name.includes('hot') || name.includes('ساخن')) return '🌶️';
    if (name.includes('special') || name.includes('خاص')) return '⭐';
    if (name.includes('offer') || name.includes('عرض')) return '🏷️';
    return '🍽️'; // Default food icon
};

// Bubble colors palette - vibrant and visually distinct
const bubbleColors = [
    'bg-rose-500',
    'bg-amber-500',
    'bg-emerald-500',
    'bg-cyan-500',
    'bg-violet-500',
    'bg-pink-500',
    'bg-blue-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-indigo-500'
];

const BubbleCategoryMenu: React.FC<BubbleCategoryMenuProps> = ({
    categories,
    businessName,
    businessLogo,
    selectedCategory,
    onSelectCategory,
    onViewAll,
    isAr = false
}) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-6">
            {/* Header with Business Name/Logo */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    {businessLogo ? (
                        <img
                            src={businessLogo}
                            alt={businessName}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-white/20 object-cover"
                        />
                    ) : (
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/10 flex items-center justify-center text-2xl">
                            🍽️
                        </div>
                    )}
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                            {businessName}
                        </h1>
                        <p className="text-xs text-white/60 font-medium uppercase tracking-widest">
                            {isAr ? 'القائمة' : 'Menu'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onViewAll}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider transition-colors"
                >
                    {isAr ? 'عرض الكل' : 'View All'}
                </button>
            </div>

            {/* Category Bubbles Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 sm:gap-6 max-w-2xl mx-auto">
                {categories.map((category, index) => (
                    <button
                        key={category.id}
                        onClick={() => onSelectCategory(category.id)}
                        className={`
                            group relative flex flex-col items-center justify-center
                            aspect-square rounded-3xl
                            ${bubbleColors[index % bubbleColors.length]}
                            ${selectedCategory === category.id ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-900' : ''}
                            shadow-lg hover:shadow-2xl
                            transform hover:scale-105 active:scale-95
                            transition-all duration-200
                            overflow-hidden
                        `}
                        style={{
                            animationDelay: `${index * 50}ms`
                        }}
                    >
                        {/* Icon */}
                        <span className="text-3xl sm:text-4xl mb-1 drop-shadow-lg transform group-hover:scale-110 transition-transform">
                            {category.icon || getCategoryIcon(category.name)}
                        </span>

                        {/* Name */}
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight text-center px-2 line-clamp-2">
                            {isAr && category.nameAr ? category.nameAr : category.name}
                        </span>

                        {/* Item count badge */}
                        {category.count > 0 && (
                            <span className="absolute top-1 right-1 bg-white/20 text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                                {category.count}
                            </span>
                        )}

                        {/* Subtle shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                ))}
            </div>

            {/* Today's Offer Quick Link */}
            <div className="mt-8 flex justify-center">
                <button
                    onClick={() => onSelectCategory('todays-offer')}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all"
                >
                    <span className="text-xl">🏷️</span>
                    <span className="text-sm font-black uppercase tracking-widest">
                        {isAr ? 'عروض اليوم' : "Today's Offers"}
                    </span>
                </button>
            </div>
        </div>
    );
};

export { getCategoryIcon, bubbleColors };
export default BubbleCategoryMenu;
