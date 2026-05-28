import React, { useState } from 'react';
import { db } from '../../../services/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface AppointmentBookingBlockProps {
    profileId: string;
    profileName: string;
    primaryColor?: string;
}

const AppointmentBookingBlock: React.FC<AppointmentBookingBlockProps> = ({
    profileId,
    profileName,
    primaryColor = '#4f46e5'
}) => {
    const [formData, setFormData] = useState({ name: '', email: '', mobile: '', date: '', time: '', notes: '' });
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    // Generate next 14 days for selection
    const availableDates = Array.from({ length: 14 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i + 1); // Start from tomorrow
        return {
            value: d.toISOString().split('T')[0],
            label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        };
    });

    const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.date || !formData.time) return;

        setStatus('submitting');
        try {
            await addDoc(collection(db, `users/${profileId}/appointments`), {
                ...formData,
                targetProfile: profileId,
                status: 'pending', // pending, confirmed, cancelled
                createdAt: serverTimestamp()
            });
            setStatus('success');
            setFormData({ name: '', email: '', mobile: '', date: '', time: '', notes: '' });
            setTimeout(() => setStatus('idle'), 5000);
        } catch (error) {
            console.error('Error saving appointment:', error);
            setStatus('error');
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto my-8 p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100/20 backdrop-blur-md bg-white/80" style={{
            boxShadow: `0 10px 40px -10px ${primaryColor}30`
        }}>
            <div className="text-center mb-6">
                <h3 className="text-2xl font-black text-gray-800 tracking-tight" style={{ fontFamily: 'var(--font-heading, inherit)' }}>
                    Book an Appointment
                </h3>
                <p className="text-sm text-gray-500 mt-2 font-medium">
                    Schedule a meeting or consultation with {profileName}.
                </p>
            </div>

            {status === 'success' ? (
                <div className="bg-emerald-50 text-emerald-700 p-6 rounded-xl text-center animate-fade-in border border-emerald-100 flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-2xl">📅</div>
                    <div>
                        <span className="font-bold text-lg block">Request Sent Successfully!</span>
                        <span className="text-sm opacity-80 mt-1 block">You will receive a confirmation shortly.</span>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-gray-500 mb-1.5 ml-1 tracking-widest">Select Date *</label>
                            <select
                                name="date"
                                required
                                value={formData.date}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50/50 border border-gray-200 focus:bg-white focus:outline-none transition-all text-sm font-medium"
                                style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)' }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = primaryColor;
                                    e.target.style.boxShadow = `0 0 0 3px ${primaryColor}20`;
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#E5E7EB';
                                    e.target.style.boxShadow = 'none';
                                }}
                            >
                                <option value="">Choose a date...</option>
                                {availableDates.map(date => (
                                    <option key={date.value} value={date.value}>{date.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-gray-500 mb-1.5 ml-1 tracking-widest">Select Time *</label>
                            <select
                                name="time"
                                required
                                value={formData.time}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50/50 border border-gray-200 focus:bg-white focus:outline-none transition-all text-sm font-medium"
                                onFocus={(e) => {
                                    e.target.style.borderColor = primaryColor;
                                    e.target.style.boxShadow = `0 0 0 3px ${primaryColor}20`;
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#E5E7EB';
                                    e.target.style.boxShadow = 'none';
                                }}
                            >
                                <option value="">Choose a time...</option>
                                {timeSlots.map(time => (
                                    <option key={time} value={time}>{time}</option>
                                ))}
                            </select>
                        </div>
                    </div>

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
                        <label className="block text-[10px] font-black uppercase text-gray-500 mb-1.5 ml-1 tracking-widest">Meeting Notes / Reason</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={3}
                            placeholder="What would you like to discuss?"
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
                        {status === 'submitting' ? 'Requesting...' : 'Request Appointment'}
                    </button>

                    {status === 'error' && (
                        <p className="text-red-500 text-xs text-center mt-2 font-bold animate-shake">
                            Failed to request appointment. Please try again.
                        </p>
                    )}
                </form>
            )}
        </div>
    );
};

export default AppointmentBookingBlock;
