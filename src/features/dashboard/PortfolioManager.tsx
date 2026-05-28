import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { SpinnerIcon, TrashIcon } from '../../components/Icons';

interface PortfolioItem {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    linkUrl?: string;
    category?: string;
    createdAt: any;
}

const PortfolioManager = ({ userId }: { userId: string }) => {
    const [items, setItems] = useState<PortfolioItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        imageUrl: '',
        linkUrl: '',
        category: ''
    });
    const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');

    useEffect(() => {
        if (!userId || !db) return;

        const q = query(
            collection(db, `users/${userId}/portfolio_items`),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched: PortfolioItem[] = [];
            snapshot.forEach((doc) => {
                fetched.push({ id: doc.id, ...doc.data() } as PortfolioItem);
            });
            setItems(fetched);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching portfolio items:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.description) return;

        setStatus('saving');
        try {
            await addDoc(collection(db, `users/${userId}/portfolio_items`), {
                ...formData,
                createdAt: serverTimestamp()
            });
            setStatus('idle');
            setIsAdding(false);
            setFormData({ title: '', description: '', imageUrl: '', linkUrl: '', category: '' });
        } catch (error) {
            console.error("Error adding portfolio item:", error);
            setStatus('error');
        }
    };

    const deleteItem = async (id: string) => {
        if (!window.confirm("Are you sure you want to permanently delete this portfolio item?")) return;
        try {
            await deleteDoc(doc(db, `users/${userId}/portfolio_items/${id}`));
        } catch (error) {
            console.error("Error deleting portfolio item:", error);
            alert("Failed to delete item.");
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <SpinnerIcon className="animate-spin h-8 w-8 text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <span>📁</span> Portfolio Manager
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Manage case studies, projects, and featured work.</p>
                </div>

                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all"
                    >
                        + Add Item
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 mb-8 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-gray-800">Add New Portfolio Item</h4>
                        <button onClick={() => setIsAdding(false)} className="text-sm font-bold text-gray-500 hover:text-gray-700">Cancel</button>
                    </div>

                    <form onSubmit={handleAddItem} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 ml-1">Title *</label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="Project Title"
                                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-indigo-500 focus:outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 ml-1">Category</label>
                                <input
                                    type="text"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    placeholder="e.g., Web Design, Real Estate"
                                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-indigo-500 focus:outline-none text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 ml-1">Cover Image URL</label>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <input
                                        type="url"
                                        name="imageUrl"
                                        value={formData.imageUrl}
                                        onChange={handleChange}
                                        placeholder="https://example.com/image.jpg"
                                        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-indigo-500 focus:outline-none text-sm"
                                    />
                                </div>
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200 overflow-hidden flex-shrink-0">
                                    {formData.imageUrl ? (
                                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                    ) : (
                                        <span className="text-2xl text-gray-300">🖼️</span>
                                    )}
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1 ml-1">Paste a direct link to an image (Imgur, Cloudinary, etc.)</p>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 ml-1">Description *</label>
                            <textarea
                                name="description"
                                required
                                rows={4}
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe the project, your role, and the outcome..."
                                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-indigo-500 focus:outline-none text-sm resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 ml-1">External Link (Optional)</label>
                            <input
                                type="url"
                                name="linkUrl"
                                value={formData.linkUrl}
                                onChange={handleChange}
                                placeholder="https://..."
                                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-indigo-500 focus:outline-none text-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'saving'}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white font-bold py-3 rounded-xl shadow-md transition-all uppercase tracking-wider text-xs"
                        >
                            {status === 'saving' ? 'Saving...' : 'Save Portfolio Item'}
                        </button>
                        {status === 'error' && <p className="text-red-500 text-xs text-center mt-2 font-bold animate-shake">Failed to save item.</p>}
                    </form>
                </div>
            )}

            {items.length === 0 && !isAdding ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50">
                    <div className="text-4xl mb-3">🖼️</div>
                    <h4 className="font-bold text-gray-800">Your portfolio is empty</h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">Add your best work to showcase your skills to profile visitors.</p>
                    <button onClick={() => setIsAdding(true)} className="mt-4 px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold bg-white text-gray-700 shadow-sm hover:bg-gray-50">
                        Create First Item
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map(item => (
                        <div key={item.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm group hover:shadow-md transition-all flex flex-col">
                            <div className="w-full aspect-video bg-gray-100 relative overflow-hidden">
                                {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-3xl">📁</div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <button onClick={() => deleteItem(item.id)} className="w-8 h-8 bg-white/90 backdrop-blur text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 flex flex-col flex-1">
                                {item.category && <span className="text-[9px] font-black uppercase text-indigo-600 tracking-widest mb-1 block">{item.category}</span>}
                                <h4 className="font-bold text-gray-900 mb-1 text-sm line-clamp-1">{item.title}</h4>
                                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">{item.description}</p>

                                {item.linkUrl && (
                                    <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" className="mt-auto text-[10px] font-bold text-indigo-600 hover:underline">
                                        View Link →
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PortfolioManager;
