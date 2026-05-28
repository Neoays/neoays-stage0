import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { SpinnerIcon, TrashIcon, EyeIcon, EyeSlashIcon } from '../../components/Icons';

interface Testimonial {
    id: string;
    authorName: string;
    authorRole: string;
    content: string;
    rating: number;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: any;
}

const TestimonialsManager = ({ userId }: { userId: string }) => {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');

    useEffect(() => {
        if (!userId || !db) return;

        const q = query(
            collection(db, `users/${userId}/testimonials`),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched: Testimonial[] = [];
            snapshot.forEach((doc) => {
                fetched.push({ id: doc.id, ...doc.data() } as Testimonial);
            });
            setTestimonials(fetched);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching testimonials:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const updateStatus = async (id: string, newStatus: Testimonial['status']) => {
        try {
            await updateDoc(doc(db, `users/${userId}/testimonials/${id}`), {
                status: newStatus
            });
        } catch (error) {
            console.error("Error updating testimonial status:", error);
            alert("Failed to update status.");
        }
    };

    const deleteTestimonial = async (id: string) => {
        if (!window.confirm("Are you sure you want to permanently delete this testimonial?")) return;
        try {
            await deleteDoc(doc(db, `users/${userId}/testimonials/${id}`));
        } catch (error) {
            console.error("Error deleting testimonial:", error);
            alert("Failed to delete testimonial.");
        }
    };

    const filtered = testimonials.filter(t => filter === 'all' ? true : t.status === filter);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <SpinnerIcon className="animate-spin h-8 w-8 text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <span>⭐</span> Testimonials Manager
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Review and approve endorsements before they appear on your profile.</p>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto max-w-full">
                    {['pending', 'approved', 'all'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-4 py-1.5 text-xs font-bold capitalize rounded-md transition-all whitespace-nowrap ${filter === f ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {f === 'pending' && testimonials.filter(t => t.status === 'pending').length > 0 && (
                                <span className="mr-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[9px]">
                                    {testimonials.filter(t => t.status === 'pending').length}
                                </span>
                            )}
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50">
                    <div className="text-4xl mb-3">📝</div>
                    <h4 className="font-bold text-gray-800">No {filter !== 'all' ? filter : ''} testimonials</h4>
                    <p className="text-xs text-gray-500 mt-1">When someone submits an endorsement, it will appear here for your review.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filtered.map(t => (
                        <div key={t.id} className={`p-5 rounded-xl border transition-all ${t.status === 'pending' ? 'bg-amber-50/30 border-amber-200 shadow-sm' : 'bg-white border-gray-100'}`}>

                            <div className="flex justify-between items-start mb-3">
                                <div className="flex text-amber-400 text-sm gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <span key={i} className={i < t.rating ? 'opacity-100' : 'opacity-20 grayscale'}>★</span>
                                    ))}
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${t.status === 'approved' ? 'bg-green-100 text-green-700' :
                                        t.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                            'bg-red-100 text-red-700'
                                    }`}>
                                    {t.status}
                                </span>
                            </div>

                            <p className="text-gray-800 italic leading-snug mb-4 text-sm">
                                "{t.content}"
                            </p>

                            <div className="flex items-center gap-3 mb-4 bg-gray-50/50 p-3 rounded-lg border border-gray-100/50">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                    {t.authorName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h5 className="font-bold text-gray-900 text-xs">{t.authorName}</h5>
                                    {t.authorRole && <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{t.authorRole}</p>}
                                </div>
                            </div>

                            <div className="flex gap-2 pt-3 border-t border-gray-100 mt-auto">
                                {t.status !== 'approved' && (
                                    <button onClick={() => updateStatus(t.id, 'approved')} className="flex-1 py-1.5 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                                        <EyeIcon className="w-3.5 h-3.5" /> Approve
                                    </button>
                                )}
                                {t.status === 'approved' && (
                                    <button onClick={() => updateStatus(t.id, 'pending')} className="flex-1 py-1.5 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">
                                        <EyeSlashIcon className="w-3.5 h-3.5" /> Hide
                                    </button>
                                )}
                                <button onClick={() => deleteTestimonial(t.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100">
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>

                            <p className="text-[9px] text-gray-400 mt-3 font-medium text-center">
                                Submitted: {t.createdAt?.toDate ? t.createdAt.toDate().toLocaleString() : 'Just now'}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TestimonialsManager;
