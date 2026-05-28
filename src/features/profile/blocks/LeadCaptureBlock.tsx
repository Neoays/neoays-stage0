import React, { useState } from 'react';
import { db } from '../../../services/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '../../../types';

interface LeadCaptureBlockProps {
    profileId: string;
    profileName: string;
    primaryColor?: string;
}

const LeadCaptureBlock: React.FC<LeadCaptureBlockProps> = ({
    profileId,
    profileName,
    primaryColor = '#4f46e5'
}) => {
    const [formData, setFormData] = useState({ name: '', email: '', message: '', mobile: '' });
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.message) return;

        setStatus('submitting');
        try {
            await addDoc(collection(db, `users/${profileId}/leads`), {
                ...formData,
                targetProfile: profileId,
                status: 'new', // new, contacted, archived
                createdAt: serverTimestamp()
            });
            setStatus('success');
            setFormData({ name: '', email: '', message: '', mobile: '' });
            setTimeout(() => setStatus('idle'), 5000);
        } catch (error) {
            console.error('Error saving lead:', error);
            setStatus('error');
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto my-8 p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100/20 backdrop-blur-md bg-white/80" style={{
            boxShadow: `0 10px 40px -10px ${primaryColor}30`
        }}>
            <div className="text-center mb-6">
                <h3 className="text-2xl font-black text-gray-800 tracking-tight" style={{ fontFamily: 'var(--font-heading, inherit)' }}>
                    Get in Touch
                </h3>
                <p className="text-sm text-gray-500 mt-2 font-medium">
                    Send a direct message to {profileName}. They will get back to you shortly.
                </p>
            </div>

            {status === 'success' ? (
                <div className="bg-green-50 text-green-700 p-6 rounded-xl text-center animate-fade-in border border-green-100 flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">✓</div>
                    <div>
                        <span className="font-bold text-lg block">Message Sent Successfully!</span>
                        <span className="text-sm opacity-80 mt-1 block">Thank you for reaching out.</span>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-gray-500 mb-1.5 ml-1 tracking-widest">Your Name *</label>
                            <input
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="John Doe"
                                className="w-full px-4 py-3 rounded-xl bg-gray-50/50 border border-gray-200 focus:bg-white focus:outline-none transition-all text-sm font-medium"
                                style={{
                                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)',
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = primaryColor;
                                    e.target.style.boxShadow = `0 0 0 3px ${primaryColor}20`;
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#E5E7EB';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-gray-500 mb-1.5 ml-1 tracking-widest">Email Address *</label>
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="john@example.com"
                                className="w-full px-4 py-3 rounded-xl bg-gray-50/50 border border-gray-200 focus:bg-white focus:outline-none transition-all text-sm font-medium"
                                onFocus={(e) => {
                                    e.target.style.borderColor = primaryColor;
                                    e.target.style.boxShadow = `0 0 0 3px ${primaryColor}20`;
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#E5E7EB';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase text-gray-500 mb-1.5 ml-1 tracking-widest">Phone Number (Optional)</label>
                        <input
                            type="tel"
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleChange}
                            placeholder="+1 234 567 890"
                            className="w-full px-4 py-3 rounded-xl bg-gray-50/50 border border-gray-200 focus:bg-white focus:outline-none transition-all text-sm font-medium"
                            onFocus={(e) => {
                                e.target.style.borderColor = primaryColor;
                                e.target.style.boxShadow = `0 0 0 3px ${primaryColor}20`;
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#E5E7EB';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase text-gray-500 mb-1.5 ml-1 tracking-widest">Your Message *</label>
                        <textarea
                            name="message"
                            required
                            value={formData.message}
                            onChange={handleChange}
                            rows={4}
                            placeholder="How can we help you?"
                            className="w-full px-4 py-3 rounded-xl bg-gray-50/50 border border-gray-200 focus:bg-white focus:outline-none transition-all text-sm font-medium resize-none"
                            onFocus={(e) => {
                                e.target.style.borderColor = primaryColor;
                                e.target.style.boxShadow = `0 0 0 3px ${primaryColor}20`;
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#E5E7EB';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'submitting'}
                        className="w-full py-4 rounded-xl font-bold tracking-wide text-white transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:grayscale uppercase text-[11px]"
                        style={{
                            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
                            transform: status === 'submitting' ? 'scale(0.98)' : 'scale(1)'
                        }}
                    >
                        {status === 'submitting' ? 'Sending Message...' : 'Send Inquiry'}
                    </button>

                    {status === 'error' && (
                        <p className="text-red-500 text-xs text-center mt-2 font-bold animate-shake">
                            Failed to send message. Please try again.
                        </p>
                    )}
                </form>
            )}
        </div>
    );
};

export default LeadCaptureBlock;
