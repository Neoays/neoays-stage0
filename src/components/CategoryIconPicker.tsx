import React, { useState, useMemo } from 'react';
import { getCategoryIcon } from '../components/BubbleCategoryMenu';

interface CategoryIconPickerProps {
    categoryName: string;
    selectedIcon?: string;
    onSelectIcon: (icon: string) => void;
}

// Comprehensive icon library for food categories
const FOOD_ICONS = [
    // Beverages
    '☕', '🍵', '🧃', '🥤', '🧋', '🍺', '🍷', '🥂', '🍹', '🍾',
    // Fast Food
    '🍔', '🍟', '🌭', '🍕', '🌮', '🌯', '🥪', '🥙', '🧆', '🥞',
    // Main Courses
    '🍛', '🍜', '🍝', '🍲', '🍚', '🍱', '🥘', '🍖', '🍗', '🥓',
    // Seafood
    '🐟', '🦐', '🦞', '🦀', '🦑', '🦪', '🍣', '🍤',
    // Salads & Healthy
    '🥗', '🥒', '🥬', '🥦', '🥕', '🌽', '🍅', '🥑',
    // Desserts
    '🍰', '🎂', '🧁', '🍪', '🍩', '🍮', '🥧', '🍦', '🍨', '🍧',
    // Fruits
    '🍎', '🍊', '🍋', '🍇', '🍓', '🍌', '🥭', '🍑', '🍍', '🥝',
    // Bread & Bakery
    '🍞', '🥐', '🥯', '🧇', '🥨', '🥖',
    // Misc Food
    '🥣', '🍳', '🧈', '🧀', '🥚', '🍿',
    // Special & Labels
    '⭐', '🏷️', '🔥', '💯', '✨', '❤️', '🆕', '👨‍🍳', '🍽️', '🥢'
];

// Category keyword to icon mapping for auto-detection
const CATEGORY_KEYWORDS: Record<string, string[]> = {
    '☕': ['coffee', 'قهوة', 'كافيه', 'espresso', 'latte'],
    '🍵': ['tea', 'شاي', 'chai'],
    '🥤': ['drink', 'مشروب', 'beverage', 'عصير', 'juice'],
    '🍔': ['burger', 'برجر', 'hamburger'],
    '🍕': ['pizza', 'بيتزا'],
    '🍝': ['pasta', 'معكرونة', 'spaghetti'],
    '🍛': ['curry', 'كاري', 'biryani', 'برياني'],
    '🍖': ['grill', 'مشوي', 'bbq', 'steak'],
    '🍗': ['chicken', 'دجاج', 'fried'],
    '🐟': ['fish', 'سمك'],
    '🦐': ['seafood', 'مأكولات بحرية', 'shrimp', 'روبيان'],
    '🥗': ['salad', 'سلطة', 'healthy'],
    '🥣': ['soup', 'شوربة'],
    '🍞': ['bread', 'خبز', 'bakery'],
    '🥪': ['sandwich', 'ساندويش'],
    '🌯': ['wrap', 'شاورما', 'shawarma'],
    '🍰': ['dessert', 'حلويات', 'sweet'],
    '🍨': ['ice', 'آيس كريم', 'gelato'],
    '🎂': ['cake', 'كيك'],
    '🍳': ['breakfast', 'فطور', 'brunch'],
    '🍱': ['appetizer', 'مقبلات', 'starter'],
    '🍿': ['snack', 'سناك'],
    '🍟': ['fries', 'بطاطس', 'sides'],
    '🌶️': ['hot', 'ساخن', 'spicy'],
    '⭐': ['special', 'خاص', 'signature'],
    '🏷️': ['offer', 'عرض', 'deal', 'discount'],
    '🆕': ['new', 'جديد'],
    '🍽️': ['main', 'رئيسي', 'entree'],
};

// Auto-detect best icon based on category name
const autoDetectIcon = (categoryName: string): string => {
    const name = categoryName.toLowerCase();

    for (const [icon, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(keyword => name.includes(keyword.toLowerCase()))) {
            return icon;
        }
    }

    // Fall back to getCategoryIcon from BubbleCategoryMenu
    return getCategoryIcon(categoryName);
};

const CategoryIconPicker: React.FC<CategoryIconPickerProps> = ({
    categoryName,
    selectedIcon,
    onSelectIcon
}) => {
    const [isOpen, setIsOpen] = useState(false);

    // Auto-detect icon if none selected
    const suggestedIcon = useMemo(() => autoDetectIcon(categoryName), [categoryName]);
    const currentIcon = selectedIcon || suggestedIcon;

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all"
            >
                <span className="text-2xl">{currentIcon}</span>
                <span className="text-xs text-gray-500 font-medium">
                    {isOpen ? 'Close' : 'Change'}
                </span>
            </button>

            {/* Icon Picker Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-2 p-3 bg-white rounded-2xl shadow-2xl border border-gray-100 w-[280px] animate-fade-in">
                    {/* Auto-suggestion */}
                    <div className="mb-3 p-2 bg-indigo-50 rounded-xl">
                        <p className="text-xs font-bold text-indigo-600 mb-1">Suggested for "{categoryName}":</p>
                        <button
                            onClick={() => {
                                onSelectIcon(suggestedIcon);
                                setIsOpen(false);
                            }}
                            className={`text-3xl p-2 rounded-lg transition-all ${currentIcon === suggestedIcon
                                    ? 'bg-indigo-600 ring-2 ring-indigo-300'
                                    : 'hover:bg-indigo-100'
                                }`}
                        >
                            {suggestedIcon}
                        </button>
                    </div>

                    {/* All Icons Grid */}
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">All Icons</p>
                    <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                        {FOOD_ICONS.map((icon, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    onSelectIcon(icon);
                                    setIsOpen(false);
                                }}
                                className={`text-xl p-1.5 rounded-lg transition-all ${currentIcon === icon
                                        ? 'bg-indigo-600 ring-2 ring-indigo-300 transform scale-110'
                                        : 'hover:bg-gray-100'
                                    }`}
                            >
                                {icon}
                            </button>
                        ))}
                    </div>

                    {/* Close button */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-full mt-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 transition"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
};

export { autoDetectIcon, FOOD_ICONS };
export default CategoryIconPicker;
