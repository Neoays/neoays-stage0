import React, { useState, useEffect } from 'react';
import { db } from '../../../services/firebaseConfig';
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp } from 'firebase/firestore';

interface Testimonial {
    id: string;
    authorName: string;
    authorRole: string;
    content: string;
    rating: number;
}

interface TestimonialsBlockProps {
    profileId: string;
    profileName: string;
    primaryColor?: string;
}

const TestimonialsBlock: React.FC<TestimonialsBlockProps> = ({
    profileId,
    profileName,
    primaryColor = '#4f46e5'
}) => {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ authorName: '', authorRole: '', content: '', rating: 5 });
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    // Fetch *approved* testimonials only
    useEffect(() => {
        const fetchTestimonials = async () => {
            if (!profileId) return;
            try {
                const q = query(
                    collection(db, `users/${profileId}/testimonials`),
                    where('status', '==', 'approved'),
                    orderBy('createdAt', 'desc')
                );
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Testimonial));
                setTestimonials(data);
            } catch (err) {
                console.error("Error fetching testimonials:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTestimonials();
    }, [profileId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.authorName || !formData.content) return;

        setStatus('submitting');
        try {
            await addDoc(collection(db, `users/${profileId}/testimonials`), {
                ...formData,
                targetProfile: profileId,
                status: 'pending', // Requires owner approval before displaying
                createdAt: serverTimestamp()
            });
            setStatus('success');
            setFormData({ authorName: '', authorRole: '', content: '', rating: 5 });
            setTimeout(() => {
                setStatus('idle');
                setShowForm(false);
            }, 4000);
        } catch (error) {
            console.error('Error submitting testimonial:', error);
            setStatus('error');
        }
    };

    // Rendering Logic
    if (isLoading) return null; // Or a subtle skeleton

    return (
        <div className="w-full max-w-4xl mx-auto my-12 px-4 sm:px-6">
            <div className="text-center mb-10">
                <h3 className="text-3xl font-black text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-heading, inherit)' }}>
                    Endorsements & Testimonials
                </h3>
                <p className="text-gray-500 mt-3 font-medium max-w-xl mx-auto">
                    See what others have to say about working with {profileName}.
                </p>

                {/* Add Testimonial Button */}
                {!showForm && status !== 'success' && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="mt-6 px-6 py-2.5 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all border outline-none"
                        style={{ color: primaryColor, borderColor: `${primaryColor}40`, backgroundColor: `${primaryColor}05` }}
                    >
                        + Leave an Endorsement
                    </button>
                )}
            </div>

            {/* Testimonials Grid/List */}
            {testimonials.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    {testimonials.map((t) => (
                        <div key={t.id} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 relative group overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full opacity-50 transition-opacity group-hover:opacity-100" style={{ backgroundColor: primaryColor }} />

                            <div className="flex text-amber-400 mb-4 text-sm gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <span key={i} className={i < t.rating ? 'opacity-100' : 'opacity-20 grayscale'}>★</span>
                                ))}
                            </div>

                            <p className="text-gray-700 italic leading-relaxed mb-6 font-medium relative z-10">
                                "{t.content}"
                            </p>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-inner" style={{ background: `linear-gradient(to bottom right, ${primaryColor}, ${primaryColor}80)` }}>
                                    {t.authorName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h5 className="font-bold text-gray-900 text-sm">{t.authorName}</h5>
                                    {t.authorRole && <p className="text-[10px] text-gray-500 uppercase tracking-wider font-black">{t.authorRole}</p>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                !showForm && (
                    <div className="text-center py-10 opacity-60">
                        <p className="text-sm italic text-gray-500">No public endorsements yet. Be the first to leave one!</p>
                    </div>
                )
            )}

            {/* Submission Form Overlay / Inline */}
            {showForm && (
                <div className="max-w-xl mx-auto bg-gray-50 rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-inner mt-8 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="font-bold text-gray-900">Write an Endorsement</h4>
                        <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-sm font-bold px-2 py-1 rounded bg-white border">Cancel</button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 ml-1">Your Name *</label>
                                <input
                                    type="text"
                                    name="authorName"
                                    required
                                    value={formData.authorName}
                                    onChange={handleChange}
                                    placeholder="Jane Doe"
                                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-indigo-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 ml-1">Your Role / Company</label>
                                <input
                                    type="text"
                                    name="authorRole"
                                    value={formData.authorRole}
                                    onChange={handleChange}
                                    placeholder="e.g. CEO at Acme Corp"
                                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-indigo-500 text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 ml-1">Rating</label>
                            <select
                                name="rating"
                                value={formData.rating}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-indigo-500 text-sm"
                            >
                                <option value="5">⭐⭐⭐⭐⭐ (Excellent)</option>
                                <option value="4">⭐⭐⭐⭐ (Very Good)</option>
                                <option value="3">⭐⭐⭐ (Good)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 ml-1">Your Testimonial *</label>
                            <textarea
                                name="content"
                                required
                                rows={4}
                                value={formData.content}
                                onChange={handleChange}
                                placeholder="Describe your experience working with them..."
                                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-indigo-500 text-sm resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'submitting'}
                            className="w-full py-4 rounded-xl font-bold text-white transition-all shadow-md uppercase text-xs tracking-wider"
                            style={{
                                backgroundColor: primaryColor,
                                opacity: status === 'submitting' ? 0.7 : 1
                            }}
                        >
                            {status === 'submitting' ? 'Submitting...' : 'Submit for Review'}
                        </button>
                    </form>
                </div>
            )}

            {status === 'success' && (
                <div className="max-w-xl mx-auto bg-green-50 text-green-700 p-6 rounded-xl text-center animate-fade-in border border-green-100 mt-8">
                    <span className="font-bold block">Thank you!</span>
                    <span className="text-sm opacity-90 mt-1 block">Your endorsement has been submitted and is pending approval from {profileName}.</span>
                </div>
            )}

            {status === 'error' && (
                <div className="max-w-xl mx-auto text-red-500 text-sm text-center mt-4 font-bold animate-shake">
                    Failed to submit testimonial. Please try again.
                </div>
            )}
        </div>
    );
};

export default TestimonialsBlock;
