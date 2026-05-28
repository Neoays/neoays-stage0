import React, { useState, useRef } from 'react';
import { MenuItem, UserProfile } from '../../types';
import {
    PlusIcon,
    TrashIcon,
    CheckCircleIcon,
    TagIcon,
    ShoppingBagIcon,
    EditIcon,
    PhotoIcon,
    SpinnerIcon,
    ShareIcon
} from '../../components/Icons';
import { compressImage } from '../../utils/imageUtils';
import ProductItemShareModal from './ProductItemShareModal';

interface NShopModuleProps {
    profileData: UserProfile;
    onUpdateProfile: (updatedData: Partial<UserProfile>) => Promise<void>;
    isStandalone?: boolean;
}

const NShopModule: React.FC<NShopModuleProps> = ({ profileData, onUpdateProfile, isStandalone = false }) => {
    const [productItems, setProductItems] = useState<MenuItem[]>(profileData.productItems || []);
    const [isAdding, setIsAdding] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const editFileInputRef = useRef<HTMLInputElement>(null);

    const [newItem, setNewItem] = useState<Partial<MenuItem>>({
        name: '',
        nameAr: '',
        price: '',
        oldPrice: '',
        category: 'General',
        categoryAr: '',
        description: '',
        descriptionAr: '',
        imageUrl: '',
        isAvailable: true
    });

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

        const updatedItems = [...productItems, item];
        setProductItems(updatedItems);
        await onUpdateProfile({ productItems: updatedItems });
        setIsAdding(false);
        setNewItem({
            name: '',
            nameAr: '',
            price: '',
            oldPrice: '',
            category: 'General',
            categoryAr: '',
            description: '',
            descriptionAr: '',
            imageUrl: '',
            isAvailable: true
        });
    };

    const handleEditItem = async () => {
        if (!editingItem || !editingItem.name || !editingItem.price) return;

        const updatedItems = productItems.map(item =>
            item.id === editingItem.id ? editingItem : item
        );
        setProductItems(updatedItems);
        await onUpdateProfile({ productItems: updatedItems });
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
        if (!window.confirm("Delete this product?")) return;
        const updatedItems = productItems.filter(item => item.id !== id);
        setProductItems(updatedItems);
        await onUpdateProfile({ productItems: updatedItems });
    };

    const toggleAvailability = async (id: string) => {
        const updatedItems = productItems.map(item =>
            item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
        );
        setProductItems(updatedItems);
        await onUpdateProfile({ productItems: updatedItems });
    };

    return (
        <div className={`space-y-6 animate-fade-in-up ${isStandalone ? 'max-w-4xl mx-auto p-4' : ''}`}>
            <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <TagIcon className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight">nShop</h2>
                    </div>
                    <p className="text-purple-100 font-medium text-lg max-w-lg">your store, everywhere : showcase products instantly</p>
                </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-purple-900">Product Catalog Status</h4>
                    <p className="text-xs text-purple-700">List your products for visitors to browse.</p>
                </div>
                <button
                    onClick={() => onUpdateProfile({ productsEnabled: !profileData.productsEnabled })}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${profileData.productsEnabled ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-400 border-gray-200'}`}
                >
                    {profileData.productsEnabled ? 'Live' : 'Hidden'}
                </button>
            </div>

            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Products</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{productItems.length} items listed</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowShareModal(true)}
                        disabled={productItems.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all disabled:opacity-50"
                    >
                        <ShareIcon className="h-4 w-4" /> Share
                    </button>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg hover:shadow-purple-200"
                    >
                        <PlusIcon className="h-4 w-4" /> Add Product
                    </button>
                </div>
            </div>

            {/* Form */}
            {isAdding && (
                <div className="bg-purple-50/50 p-6 rounded-3xl border-2 border-dashed border-purple-200 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4 bg-white p-4 rounded-2xl border border-purple-50">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-1">Product Name (EN)</label>
                                <input
                                    type="text"
                                    value={newItem.name}
                                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                    placeholder="e.g. Premium Headphones"
                                    className="w-full p-3 rounded-xl bg-slate-50 border border-purple-100 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-1 text-right block">الاسم (AR)</label>
                                <input
                                    type="text"
                                    dir="rtl"
                                    value={newItem.nameAr}
                                    onChange={e => setNewItem({ ...newItem, nameAr: e.target.value })}
                                    placeholder="مثال: سماعات ممتازة"
                                    className="w-full p-3 rounded-xl bg-slate-50 border border-purple-100 text-sm focus:ring-2 focus:ring-purple-500 outline-none text-right"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 bg-white p-4 rounded-2xl border border-purple-50">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-1">Price</label>
                                    <input
                                        type="text"
                                        value={newItem.price}
                                        onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                                        placeholder="25.00"
                                        className="w-full p-3 rounded-xl bg-slate-50 border border-purple-100 text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest ml-1">Old Price</label>
                                    <input
                                        type="text"
                                        value={newItem.oldPrice}
                                        onChange={e => setNewItem({ ...newItem, oldPrice: e.target.value })}
                                        placeholder="35.00"
                                        className="w-full p-3 rounded-xl bg-orange-50 border border-orange-100 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-1">Category</label>
                                    <input
                                        type="text"
                                        list="product-categories"
                                        value={newItem.category}
                                        onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                                        className="w-full p-3 rounded-xl bg-slate-50 border border-purple-100 text-sm"
                                    />
                                    <datalist id="product-categories">
                                        <option>Electronics</option>
                                        <option>Fashion</option>
                                        <option>Home</option>
                                        <option>Beauty</option>
                                        <option>Sports</option>
                                    </datalist>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-1 text-right block">الفئة</label>
                                    <input
                                        type="text"
                                        dir="rtl"
                                        value={newItem.categoryAr}
                                        onChange={e => setNewItem({ ...newItem, categoryAr: e.target.value })}
                                        className="w-full p-3 rounded-xl bg-slate-50 border border-purple-100 text-sm text-right"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 md:col-span-2 bg-white p-4 rounded-2xl border border-purple-50">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-1">Description (EN)</label>
                                <textarea
                                    value={newItem.description}
                                    onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                                    placeholder="Product description..."
                                    className="w-full p-3 rounded-xl bg-slate-50 border border-purple-100 text-sm h-20 resize-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-1 text-right block">الوصف (AR)</label>
                                <textarea
                                    dir="rtl"
                                    value={newItem.descriptionAr}
                                    onChange={e => setNewItem({ ...newItem, descriptionAr: e.target.value })}
                                    placeholder="وصف المنتج..."
                                    className="w-full p-3 rounded-xl bg-slate-50 border border-purple-100 text-sm h-20 resize-none text-right"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2 bg-white p-4 rounded-2xl border border-purple-50">
                            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-1">Product Image</label>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={e => handleImageUpload(e, false)}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="flex-1 flex items-center justify-center gap-2 p-3 bg-purple-50 text-purple-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-100 transition-all"
                                >
                                    {isUploading ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : <PhotoIcon className="h-4 w-4" />}
                                    Upload Image
                                </button>
                                <input
                                    type="url"
                                    value={newItem.imageUrl}
                                    onChange={e => setNewItem({ ...newItem, imageUrl: e.target.value })}
                                    placeholder="Or paste image URL..."
                                    className="flex-1 p-3 rounded-xl bg-slate-50 border border-purple-100 text-sm"
                                />
                            </div>
                            {newItem.imageUrl && (
                                <div className="relative h-32 w-48 rounded-2xl overflow-hidden border-2 border-purple-100 shadow-sm group">
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
                        <button onClick={handleAddItem} className="px-8 py-2 bg-purple-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg">Save Product</button>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="grid grid-cols-1 gap-4">
                {productItems.map(item => (
                    <div key={item.id} className={`bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between group hover:border-purple-200 transition-all shadow-sm ${!item.isAvailable ? 'opacity-60' : ''}`}>
                        <div className="flex items-center gap-4">
                            {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className={`h-12 w-12 rounded-xl object-cover ${!item.isAvailable ? 'grayscale' : ''}`} />
                            ) : (
                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${item.isAvailable ? 'bg-purple-50 text-purple-300' : 'bg-gray-50 text-gray-300'}`}>
                                    <TagIcon className="h-6 w-6" />
                                </div>
                            )}
                            <div>
                                <div className="flex items-center gap-2">
                                    <h5 className={`font-bold text-sm ${item.isAvailable ? 'text-slate-900' : 'text-gray-400 line-through'}`}>{item.name}</h5>
                                    <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-bold uppercase tracking-widest">{item.category}</span>
                                </div>
                                <p className="text-xs text-gray-400 font-medium">{item.description || 'No description'}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {item.oldPrice && <span className="text-xs text-gray-400 line-through">{item.oldPrice}</span>}
                                    <span className="text-sm font-black text-purple-600">{item.price}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => setEditingItem(item)}
                                className="p-2 text-purple-500 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                                title="Edit Product"
                            >
                                <EditIcon className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => toggleAvailability(item.id)}
                                className={`p-2 rounded-lg ${item.isAvailable ? 'text-green-500 bg-green-50' : 'text-gray-300 bg-gray-50'}`}
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
                {productItems.length === 0 && !isAdding && (
                    <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
                        <TagIcon className="h-12 w-12 text-gray-100 mx-auto mb-4" />
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">No products yet</p>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingItem && (
                <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-0 sm:p-4 pt-0 overflow-y-auto">
                    <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in">
                        <h3 className="text-lg font-black text-slate-900 mb-4">Edit Product</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Name */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Product Name (EN)</label>
                                <input
                                    type="text"
                                    value={editingItem.name}
                                    onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                                    className="w-full p-3 rounded-xl bg-slate-50 border border-purple-100 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest text-right block">الاسم (AR)</label>
                                <input
                                    type="text"
                                    dir="rtl"
                                    value={editingItem.nameAr || ''}
                                    onChange={e => setEditingItem({ ...editingItem, nameAr: e.target.value })}
                                    className="w-full p-3 rounded-xl bg-slate-50 border border-purple-100 text-sm text-right"
                                />
                            </div>
                            {/* Price */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Price</label>
                                <input
                                    type="text"
                                    value={editingItem.price}
                                    onChange={e => setEditingItem({ ...editingItem, price: e.target.value })}
                                    className="w-full p-3 rounded-xl bg-slate-50 border border-purple-100 text-sm"
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
                                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Category</label>
                                <input
                                    type="text"
                                    list="edit-product-categories"
                                    value={editingItem.category}
                                    onChange={e => setEditingItem({ ...editingItem, category: e.target.value })}
                                    className="w-full p-3 rounded-xl bg-slate-50 border border-purple-100 text-sm"
                                />
                                <datalist id="edit-product-categories">
                                    <option>Electronics</option>
                                    <option>Fashion</option>
                                    <option>Home</option>
                                    <option>Beauty</option>
                                    <option>Sports</option>
                                </datalist>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest text-right block">الفئة</label>
                                <input
                                    type="text"
                                    dir="rtl"
                                    value={editingItem.categoryAr || ''}
                                    onChange={e => setEditingItem({ ...editingItem, categoryAr: e.target.value })}
                                    className="w-full p-3 rounded-xl bg-slate-50 border border-purple-100 text-sm text-right"
                                />
                            </div>
                            {/* Description */}
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Description (EN)</label>
                                <textarea
                                    value={editingItem.description || ''}
                                    onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                                    className="w-full p-3 rounded-xl bg-slate-50 border border-purple-100 text-sm h-20 resize-none"
                                />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest text-right block">الوصف (AR)</label>
                                <textarea
                                    dir="rtl"
                                    value={editingItem.descriptionAr || ''}
                                    onChange={e => setEditingItem({ ...editingItem, descriptionAr: e.target.value })}
                                    className="w-full p-3 rounded-xl bg-slate-50 border border-purple-100 text-sm h-20 resize-none text-right"
                                />
                            </div>
                            {/* Image */}
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Product Image</label>
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
                                        className="flex-1 flex items-center justify-center gap-2 p-3 bg-purple-50 text-purple-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-100 transition-all"
                                    >
                                        {isUploading ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : <PhotoIcon className="h-4 w-4" />}
                                        Upload Image
                                    </button>
                                    <input
                                        type="url"
                                        value={editingItem.imageUrl || ''}
                                        onChange={e => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                                        placeholder="Or paste image URL..."
                                        className="flex-1 p-3 rounded-xl bg-slate-50 border border-purple-100 text-sm"
                                    />
                                </div>
                                {editingItem.imageUrl && (
                                    <div className="relative h-32 w-48 rounded-2xl overflow-hidden border-2 border-purple-100 shadow-sm group">
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
                            <button onClick={handleEditItem} className="px-8 py-2 bg-purple-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            <ProductItemShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                productItems={productItems}
                profileData={{
                    username: profileData.username,
                    displayName: profileData.displayName,
                    photoURL: profileData.photoURL
                }}
            />
        </div>
    );
};

export default NShopModule;
