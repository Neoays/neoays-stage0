import React from 'react';
import { PROFESSIONAL_CATEGORIES, BUSINESS_CATEGORIES, NGO_CATEGORIES } from '../constants/categories';

interface CategorySelectorProps {
    profileType: 'personal' | 'business' | 'ngo' | 'personal_jobseeker' | 'society_club' | 'business_person' | 'staff';
    value: string;
    onChange: (value: string) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ profileType, value, onChange }) => {
    const getCategories = () => {
        switch (profileType) {
            case 'business':
            case 'business_person':
                return BUSINESS_CATEGORIES;
            case 'ngo':
            case 'society_club':
                return NGO_CATEGORIES;
            case 'personal':
            case 'personal_jobseeker':
            case 'staff':
            default:
                return PROFESSIONAL_CATEGORIES;
        }
    };

    const categories = getCategories();

    return (
        <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                {profileType === 'business' ? 'Business Category' : 'Professional Category'}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none text-sm"
            >
                <option value="">Select Category...</option>
                {categories.map((cat: string) => (
                    <option key={cat} value={cat}>
                        {cat}
                    </option>
                ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
                This helps people find you in search filters
            </p>
        </div>
    );
};

export default CategorySelector;
