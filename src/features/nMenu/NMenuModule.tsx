import React, { useState, useEffect, useRef } from 'react';
import { MenuItem, Order } from '../../types';
import {
    PlusIcon,
    TrashIcon,
    CheckCircleIcon,
    ShoppingBagIcon,
    TagIcon,
    CameraIcon,
    PhotoIcon,
    SpinnerIcon,
    ShareIcon,
    StarIcon,
    EditIcon
} from '../../components/Icons';
import { compressImage } from '../../utils/imageUtils';
import MenuItemShareModal from './MenuItemShareModal';
import MenuExcelManager from './MenuExcelManager';

interface NMenuModuleProps {
    profileData: any;
    onUpdateProfile: (updatedData: any) => Promise<void>;
    isStandalone?: boolean;
}

// Theme color options
const MENU_THEMES = [
    { id: 'indigo', name: 'Indigo', primary: 'bg-indigo-600', light: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
    { id: 'emerald', name: 'Emerald', primary: 'bg-emerald-600', light: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    { id: 'rose', name: 'Rose', primary: 'bg-rose-600', light: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
    { id: 'amber', name: 'Amber', primary: 'bg-amber-600', light: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
    { id: 'violet', name: 'Violet', primary: 'bg-violet-600', light: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
    { id: 'slate', name: 'Slate', primary: 'bg-slate-700', light: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
    { id: 'orange', name: 'Orange', primary: 'bg-orange-600', light: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
    { id: 'cyan', name: 'Cyan', primary: 'bg-cyan-600', light: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200' },
] as const;

// Debounce delay in milliseconds
const DEBOUNCE_DELAY = 800;

const NMenuModule: React.FC<NMenuModuleProps> = ({ profileData, onUpdateProfile, isStandalone = false }) => {
    const [menuItems, setMenuItems] = useState<MenuItem[]>(profileData.menuItems || []);
    const [isAdding, setIsAdding] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showTodaysOfferSetup, setShowTodaysOfferSetup] = useState(false);
    const [newItem, setNewItem] = useState<Partial<MenuItem>>({
        name: '',
        nameAr: '',
        price: '',
        oldPrice: '',
        category: 'Main Course',
        categoryAr: '',
        description: '',
        descriptionAr: '',
        imageUrl: '',
        isAvailable: true
    });
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const editFileInputRef = React.useRef<HTMLInputElement>(null);

    // Local state for debounced Today's Offer fields
    const [localOfferTitle, setLocalOfferTitle] = useState(profileData.todaysOffer?.title || '');
    const [localOfferDiscount, setLocalOfferDiscount] = useState(profileData.todaysOffer?.discount || '');

    // Debounce timer refs
    const offerTitleTimer = useRef<NodeJS.Timeout | null>(null);
    const offerDiscountTimer = useRef<NodeJS.Timeout | null>(null);

    const currentTheme = MENU_THEMES.find(t => t.id === profileData.menuTheme) || MENU_THEMES[0];
    const todaysOffer = profileData.todaysOffer || { enabled: false, itemIds: [], title: '', discount: '' };

    // Sync local state when profileData changes
    useEffect(() => {
        setLocalOfferTitle(profileData.todaysOffer?.title || '');
        setLocalOfferDiscount(profileData.todaysOffer?.discount || '');
    }, [profileData.todaysOffer?.title, profileData.todaysOffer?.discount]);

    const handleAddItem = async () => {
        if (!newItem.name || !newItem.price) return;

        const item: MenuItem = {
            id: Date.now().toString(),
            name: newItem.name!,
            nameAr: newItem.nameAr || '',
            price: newItem.price!,
            oldPrice: newItem.oldPrice || '',
            category: newItem.category || 'General',
            categoryAr: newItem.categoryAr || '',
            description: newItem.description || '',
            descriptionAr: newItem.descriptionAr || '',
            imageUrl: newItem.imageUrl || '',
            isAvailable: true
        };

        const updatedItems = [...menuItems, item];
        setMenuItems(updatedItems);
        await onUpdateProfile({ menuItems: updatedItems });
        setIsAdding(false);
        setNewItem({
            name: '',
            nameAr: '',
            price: '',
            oldPrice: '',
            category: 'Main Course',
            categoryAr: '',
            description: '',
            descriptionAr: '',
            imageUrl: '',
            isAvailable: true
        });
    };

    const handleEditItem = async () => {
        if (!editingItem || !editingItem.name || !editingItem.price) return;

        const updatedItems = menuItems.map(item =>
            item.id === editingItem.id ? editingItem : item
        );
        setMenuItems(updatedItems);
        await onUpdateProfile({ menuItems: updatedItems });
        setEditingItem(null);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const compressedDataUrl = await compressImage(file);
            if (isEdit && editingItem) {
                setEditingItem({ ...editingItem, imageUrl: compressedDataUrl });
            } else {
                setNewItem(prev => ({ ...prev, imageUrl: compressedDataUrl }));
            }
        } catch (error) {
            console.error("Image upload failed:", error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (editFileInputRef.current) editFileInputRef.current.value = '';
        }
    };

    const handleDeleteItem = async (id: string) => {
        if (!window.confirm("Delete this item?")) return;
        const updatedItems = menuItems.filter(item => item.id !== id);
        setMenuItems(updatedItems);
        await onUpdateProfile({ menuItems: updatedItems });
    };

    const toggleAvailability = async (id: string) => {
        const updatedItems = menuItems.map(item =>
            item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
        );
        setMenuItems(updatedItems);
        await onUpdateProfile({ menuItems: updatedItems });
    };

    const handleThemeChange = async (themeId: string) => {
        await onUpdateProfile({ menuTheme: themeId });
    };

    // Handle Excel import - replace all menu items
    const handleExcelImport = async (importedItems: MenuItem[]) => {
        const previousItems = menuItems; // Save for rollback
        setMenuItems(importedItems);
        try {
            await onUpdateProfile({ menuItems: importedItems });
        } catch (err) {
            // Rollback local state on error
            setMenuItems(previousItems);
            throw err; // Re-throw for MenuExcelManager to handle
        }
    };

    const toggleTodaysOfferItem = (itemId: string) => {
        const currentIds = todaysOffer.itemIds || [];
        const newIds = currentIds.includes(itemId)
            ? currentIds.filter((id: string) => id !== itemId)
            : [...currentIds, itemId];
        return newIds;
    };

    // Immediate save for non-text fields
    const saveTodaysOffer = async (updates: any) => {
        await onUpdateProfile({ todaysOffer: { ...todaysOffer, ...updates } });
    };

    // Debounced save for offer title
    const handleOfferTitleChange = (value: string) => {
        setLocalOfferTitle(value);
        if (offerTitleTimer.current) clearTimeout(offerTitleTimer.current);
        offerTitleTimer.current = setTimeout(() => {
            onUpdateProfile({ todaysOffer: { ...todaysOffer, title: value } });
        }, DEBOUNCE_DELAY);
    };

    // Debounced save for offer discount
    const handleOfferDiscountChange = (value: string) => {
        setLocalOfferDiscount(value);
        if (offerDiscountTimer.current) clearTimeout(offerDiscountTimer.current);
        offerDiscountTimer.current = setTimeout(() => {
            onUpdateProfile({ todaysOffer: { ...todaysOffer, discount: value } });
        }, DEBOUNCE_DELAY);
    };

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (offerTitleTimer.current) clearTimeout(offerTitleTimer.current);
            if (offerDiscountTimer.current) clearTimeout(offerDiscountTimer.current);
        };
    }, []);

    return (
        <div className={`space-y-6 animate-fade-in-up ${isStandalone ? 'max-w-4xl mx-auto p-4' : ''}`}>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <ShoppingBagIcon className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight">nMenu</h2>
                    </div>
                    <p className="text-blue-100 font-medium text-lg max-w-lg">digital dining defined : the smartest way to show your menu</p>
                </div>
            </div>

            {/* Theme Selector */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h4 className="font-bold text-slate-900">Menu Theme</h4>
                        <p className="text-xs text-gray-400">Choose a color scheme for your public menu</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${currentTheme.primary} text-white`}>
                        {currentTheme.name}
                    </span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {MENU_THEMES.map(theme => (
                        <button
                            key={theme.id}
                            onClick={() => handleThemeChange(theme.id)}
                            className={`w-10 h-10 rounded-xl ${theme.primary} transition-all hover:scale-110 ${profileData.menuTheme === theme.id ? 'ring-4 ring-offset-2 ring-gray-300 scale-110' : ''
                                }`}
                            title={theme.name}
                        />
                    ))}
                </div>
            </div>

            {/* Today's Offer Section */}
            <div className={`p-4 rounded-2xl border-2 transition-all ${todaysOffer.enabled ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${todaysOffer.enabled ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-400'}`}>
                            <StarIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900">Today's Special Offer</h4>
                            <p className="text-xs text-gray-500">{todaysOffer.enabled ? `${todaysOffer.itemIds?.length || 0} items selected` : 'Highlight items on your menu'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowTodaysOfferSetup(!showTodaysOfferSetup)}
                            className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-white rounded-lg border border-gray-200 hover:border-gray-300"
                        >
                            {showTodaysOfferSetup ? 'Close' : 'Setup'}
                        </button>
                        <button
                            onClick={() => saveTodaysOffer({ enabled: !todaysOffer.enabled })}
                            className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${todaysOffer.enabled ? 'bg-yellow-500 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-200'
                                }`}
                        >
                            {todaysOffer.enabled ? '🔥 Live' : 'Off'}
                        </button>
                    </div>
                </div>

                {showTodaysOfferSetup && (
                    <div className="mt-4 space-y-4 animate-fade-in">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Offer Title</label>
                                <input
                                    type="text"
                                    value={localOfferTitle}
                                    onChange={e => handleOfferTitleChange(e.target.value)}
                                    placeholder="e.g. Today's Special"
                                    className="w-full p-2.5 rounded-xl bg-white border border-orange-200 text-sm mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Discount Badge</label>
                                <input
                                    type="text"
                                    value={localOfferDiscount}
                                    onChange={e => handleOfferDiscountChange(e.target.value)}
                                    placeholder="e.g. 20% OFF"
                                    className="w-full p-2.5 rounded-xl bg-white border border-orange-200 text-sm mt-1"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2 block">Select Offer Items</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                                {menuItems.map(item => {
                                    const isSelected = todaysOffer.itemIds?.includes(item.id);
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => saveTodaysOffer({ itemIds: toggleTodaysOfferItem(item.id) })}
                                            className={`p-3 rounded-xl text-left transition-all ${isSelected
                                                ? 'bg-yellow-400 text-black border-2 border-yellow-500'
                                                : 'bg-white border border-gray-200 hover:border-yellow-300'
                                                }`}
                                        >
                                            <p className="font-bold text-sm truncate">{item.name}</p>
                                            <p className={`text-xs ${isSelected ? 'text-yellow-800' : 'text-gray-400'}`}>{item.price}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-blue-900">Digital Menu Status</h4>
                    <p className="text-xs text-blue-700">Control public visibility of your menu.</p>
                </div>
                <button
                    onClick={() => onUpdateProfile({ menuEnabled: !profileData.menuEnabled })}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${profileData.menuEnabled !== false ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-400 border-gray-200'}`}
                >
                    {profileData.menuEnabled !== false ? 'Live' : 'Hidden'}
                </button>
            </div>

            {/* Currency Selector */}
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-emerald-900">Currency</h4>
                    <p className="text-xs text-emerald-700">Set currency symbol for prices.</p>
                </div>
                <select
                    value={profileData.menuCurrency || ''}
                    onChange={(e) => onUpdateProfile({ menuCurrency: e.target.value || undefined })}
                    className="px-4 py-2 rounded-xl text-sm font-bold border border-emerald-200 bg-white text-emerald-900 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                >
                    <option value="">Auto (from country)</option>
                    <option value="OMR">🇴🇲 OMR - Omani Rial</option>
                    <option value="AED">🇦🇪 AED - UAE Dirham</option>
                    <option value="SAR">🇸🇦 SAR - Saudi Riyal</option>
                    <option value="QAR">🇶🇦 QAR - Qatari Riyal</option>
                    <option value="KWD">🇰🇼 KWD - Kuwaiti Dinar</option>
                    <option value="BHD">🇧🇭 BHD - Bahraini Dinar</option>
                    <option value="EGP">🇪🇬 EGP - Egyptian Pound</option>
                    <option value="JOD">🇯🇴 JOD - Jordanian Dinar</option>
                    <option value="LBP">🇱🇧 LBP - Lebanese Pound</option>
                    <option value="₹">🇮🇳 ₹ - Indian Rupee</option>
                    <option value="$">🇺🇸 $ - US Dollar</option>
                    <option value="€">🇪🇺 € - Euro</option>
                    <option value="£">🇬🇧 £ - British Pound</option>
                </select>
            </div>

            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Menu Items</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{menuItems.length} items listed</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowShareModal(true)}
                        disabled={menuItems.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ShareIcon className="h-4 w-4" /> Create Story
                    </button>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200"
                    >
                        <PlusIcon className="h-4 w-4" /> Add Item
                    </button>
                </div>
            </div>

            {/* Excel Import/Export Section */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h4 className="font-bold text-slate-900">Bulk Import / Export</h4>
                        <p className="text-xs text-gray-400">Upload or download menu items via Excel file</p>
                    </div>
                </div>
                <MenuExcelManager
                    menuItems={menuItems}
                    onImport={handleExcelImport}
                    businessName={profileData.displayName || 'Menu'}
                />
            </div>

            {/* Add Item Form Overlay */}
            {isAdding && (
                <div className="bg-indigo-50/50 p-6 rounded-3xl border-2 border-dashed border-indigo-200 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name Section */}
                        <div className="space-y-4 bg-white p-4 rounded-2xl border border-indigo-50">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Item Name (English)</label>
                                <input
                                    type="text"
                                    value={newItem.name}
                                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                    placeholder="e.g. Signature Burger"
                                    className="w-full p-3 rounded-xl bg-slate-50 border border-indigo-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1 text-right block">اسم الصنف (العربية)</label>
                                <input
                                    type="text"
                                    dir="rtl"
                                    value={newItem.nameAr}
                                    onChange={e => setNewItem({ ...newItem, nameAr: e.target.value })}
                                    placeholder="مثال: برجر مميز"
                                    className="w-full p-3 rounded-xl bg-slate-50 border border-indigo-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-right font-arabic"
                                />
                            </div>
                        </div>

                        {/* Price & Category Section */}
                        <div className="space-y-4 bg-white p-4 rounded-2xl border border-indigo-50">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Price (e.g. 25.00)</label>
                                    <input
                                        type="text"
                                        value={newItem.price}
                                        onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                                        placeholder="25.00"
                                        className="w-full p-3 rounded-xl bg-slate-50 border border-indigo-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest ml-1">Old Price (Optional)</label>
                                    <input
                                        type="text"
                                        value={newItem.oldPrice}
                                        onChange={e => setNewItem({ ...newItem, oldPrice: e.target.value })}
                                        placeholder="35.00 (for promo)"
                                        className="w-full p-3 rounded-xl bg-orange-50 border border-orange-100 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Category</label>
                                    <input
                                        type="text"
                                        list="categories"
                                        value={newItem.category}
                                        onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                                        className="w-full p-3 rounded-xl bg-slate-50 border border-indigo-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1 text-right block">الفئة</label>
                                    <input
                                        type="text"
                                        dir="rtl"
                                        value={newItem.categoryAr}
                                        onChange={e => setNewItem({ ...newItem, categoryAr: e.target.value })}
                                        className="w-full p-3 rounded-xl bg-slate-50 border border-indigo-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-right font-arabic"
                                    />
                                </div>
                                <datalist id="categories">
                                    <option>Main Course</option>
                                    <option>Starters</option>
                                    <option>Drinks</option>
                                    <option>Desserts</option>
                                    <option>Specials</option>
                                </datalist>
                            </div>
                        </div>

                        {/* Description Section */}
                        <div className="space-y-4 md:col-span-2 bg-white p-4 rounded-2xl border border-indigo-50">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Description (English)</label>
                                <textarea
                                    value={newItem.description}
                                    onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                                    placeholder="Describe your item..."
                                    className="w-full p-3 rounded-xl bg-slate-50 border border-indigo-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1 text-right block">الوصف (العربية)</label>
                                <textarea
                                    dir="rtl"
                                    value={newItem.descriptionAr}
                                    onChange={e => setNewItem({ ...newItem, descriptionAr: e.target.value })}
                                    placeholder="وصف الصنف..."
                                    className="w-full p-3 rounded-xl bg-slate-50 border border-indigo-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none text-right font-arabic"
                                />
                            </div>
                        </div>

                        {/* Image Section */}
                        <div className="md:col-span-2 space-y-3 bg-white p-4 rounded-2xl border border-indigo-50">
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Item Image</label>

                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                            />

                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="flex-1 flex items-center justify-center gap-2 p-3 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
                                >
                                    {isUploading ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : <PhotoIcon className="h-4 w-4" />}
                                    Upload Image
                                </button>
                                <button
                                    onClick={() => {
                                        if (fileInputRef.current) {
                                            fileInputRef.current.setAttribute('capture', 'environment');
                                            fileInputRef.current.click();
                                        }
                                    }}
                                    disabled={isUploading}
                                    className="flex-1 flex items-center justify-center gap-2 p-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
                                >
                                    <CameraIcon className="h-4 w-4" />
                                    Take Photo
                                </button>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-indigo-300">
                                    <TagIcon className="h-4 w-4" />
                                </div>
                                <input
                                    type="url"
                                    value={newItem.imageUrl}
                                    onChange={e => setNewItem({ ...newItem, imageUrl: e.target.value })}
                                    placeholder="Or paste an image URL..."
                                    className="w-full pl-10 p-3 rounded-xl bg-slate-50 border border-indigo-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            {newItem.imageUrl && (
                                <div className="mt-2 relative h-32 w-48 rounded-2xl overflow-hidden border-2 border-indigo-100 shadow-sm group">
                                    <img src={newItem.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => setNewItem({ ...newItem, imageUrl: '' })}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <TrashIcon className="h-3 w-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button onClick={() => setIsAdding(false)} className="px-6 py-2 text-xs font-black text-gray-400 uppercase tracking-widest">Cancel</button>
                        <button onClick={handleAddItem} className="px-8 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg">Save Item</button>
                    </div>
                </div>
            )
            }

            <div className="grid grid-cols-1 transition-all">
                {/* Items List */}
                <div className="space-y-3">
                    {menuItems.map(item => (
                        <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between group hover:border-indigo-200 transition-all shadow-sm">
                            <div className="flex items-center gap-4">
                                {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.name} className={`h-12 w-12 rounded-xl object-cover ${!item.isAvailable ? 'grayscale opacity-50' : ''}`} />
                                ) : (
                                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-xl shadow-inner ${item.isAvailable ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-300 grayscale'}`}>
                                        <ShoppingBagIcon className="h-6 w-6" />
                                    </div>
                                )}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h5 className={`font-bold text-sm ${item.isAvailable ? 'text-slate-900' : 'text-gray-400 line-through'}`}>{item.name}</h5>
                                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-bold uppercase tracking-widest">{item.category}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 font-medium">{item.description || 'No description'}</p>
                                    <p className="text-sm font-black text-indigo-600 mt-1">{item.price}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => setEditingItem(item)}
                                    className="p-2 text-indigo-500 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                                    title="Edit Item"
                                >
                                    <EditIcon className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => toggleAvailability(item.id)}
                                    className={`p-2 rounded-lg transition-colors ${item.isAvailable ? 'text-green-500 bg-green-50' : 'text-gray-400 bg-gray-50'}`}
                                    title={item.isAvailable ? "Set Unavailable" : "Set Available"}
                                >
                                    <CheckCircleIcon className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {menuItems.length === 0 && !isAdding && (
                        <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
                            <ShoppingBagIcon className="h-12 w-12 text-gray-100 mx-auto mb-4" />
                            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Your menu is empty</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Item Modal */}
            {editingItem && (
                <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-0 sm:p-4 pt-0 overflow-y-auto">
                    <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in">
                        <h3 className="text-lg font-black text-slate-900 mb-4">Edit Menu Item</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Name */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Item Name (English)</label>
                                <input
                                    type="text"
                                    value={editingItem.name}
                                    onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                                    className="w-full p-3 rounded-xl bg-slate-50 border border-indigo-100 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest text-right block">اسم الصنف (العربية)</label>
                                <input
                                    type="text"
                                    dir="rtl"
                                    value={editingItem.nameAr || ''}
                                    onChange={e => setEditingItem({ ...editingItem, nameAr: e.target.value })}
                                    className="w-full p-3 rounded-xl bg-slate-50 border border-indigo-100 text-sm text-right"
                                />
                            </div>
                            {/* Price */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Price</label>
                                <input
                                    type="text"
                                    value={editingItem.price}
                                    onChange={e => setEditingItem({ ...editingItem, price: e.target.value })}
                                    className="w-full p-3 rounded-xl bg-slate-50 border border-indigo-100 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Old Price (Optional)</label>
                                <input
                                    type="text"
                                    value={editingItem.oldPrice || ''}
                                    onChange={e => setEditingItem({ ...editingItem, oldPrice: e.target.value })}
                                    className="w-full p-3 rounded-xl bg-orange-50 border border-orange-100 text-sm"
                                />
                            </div>
                            {/* Category */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Category</label>
                                <input
                                    type="text"
                                    list="edit-categories"
                                    value={editingItem.category}
                                    onChange={e => setEditingItem({ ...editingItem, category: e.target.value })}
                                    className="w-full p-3 rounded-xl bg-slate-50 border border-indigo-100 text-sm"
                                />
                                <datalist id="edit-categories">
                                    <option>Main Course</option>
                                    <option>Starters</option>
                                    <option>Drinks</option>
                                    <option>Desserts</option>
                                    <option>Specials</option>
                                </datalist>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest text-right block">الفئة</label>
                                <input
                                    type="text"
                                    dir="rtl"
                                    value={editingItem.categoryAr || ''}
                                    onChange={e => setEditingItem({ ...editingItem, categoryAr: e.target.value })}
                                    className="w-full p-3 rounded-xl bg-slate-50 border border-indigo-100 text-sm text-right"
                                />
                            </div>
                            {/* Description */}
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Description (English)</label>
                                <textarea
                                    value={editingItem.description || ''}
                                    onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                                    className="w-full p-3 rounded-xl bg-slate-50 border border-indigo-100 text-sm h-20 resize-none"
                                />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest text-right block">الوصف (العربية)</label>
                                <textarea
                                    dir="rtl"
                                    value={editingItem.descriptionAr || ''}
                                    onChange={e => setEditingItem({ ...editingItem, descriptionAr: e.target.value })}
                                    className="w-full p-3 rounded-xl bg-slate-50 border border-indigo-100 text-sm h-20 resize-none text-right"
                                />
                            </div>
                            {/* Image */}
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Item Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={editFileInputRef}
                                    onChange={e => handleImageUpload(e, true)}
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => editFileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="flex-1 flex items-center justify-center gap-2 p-3 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
                                    >
                                        {isUploading ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : <PhotoIcon className="h-4 w-4" />}
                                        Upload Image
                                    </button>
                                    <input
                                        type="url"
                                        value={editingItem.imageUrl || ''}
                                        onChange={e => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                                        placeholder="Or paste image URL..."
                                        className="flex-1 p-3 rounded-xl bg-slate-50 border border-indigo-100 text-sm"
                                    />
                                </div>
                                {editingItem.imageUrl && (
                                    <div className="relative h-32 w-48 rounded-2xl overflow-hidden border-2 border-indigo-100 shadow-sm group">
                                        <img src={editingItem.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => setEditingItem({ ...editingItem, imageUrl: '' })}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <TrashIcon className="h-3 w-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                            <button onClick={() => setEditingItem(null)} className="px-6 py-2 text-xs font-black text-gray-400 uppercase tracking-widest">Cancel</button>
                            <button onClick={handleEditItem} className="px-8 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            <MenuItemShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                menuItems={menuItems}
                profileData={{
                    username: profileData.username,
                    displayName: profileData.displayName,
                    photoURL: profileData.photoURL
                }}
            />
        </div >
    );
};

export default NMenuModule;
