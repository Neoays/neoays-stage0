import React, { useState, useEffect } from 'react';
import { auth, db } from '../../services/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { UserProfile } from '../../types';
import { SpinnerIcon, TimesIcon } from '../../components/Icons';
import { COUNTRY_CODES, getCountryByCode, getDefaultCountryCode } from '../../constants/countryCodes';
import { useMobileVerification } from '../../hooks/useMobileVerification';

interface QuickConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    profileName: string;
}

const QuickConnectModal: React.FC<QuickConnectModalProps> = ({ isOpen, onClose, onSuccess, profileName }) => {
    const [userName, setUserName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [countryCode, setCountryCode] = useState(getDefaultCountryCode());
    const [password, setPassword] = useState('');
    const [userExists, setUserExists] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
    const [countryFilter, setCountryFilter] = useState('');

    const { checkMobileExists } = useMobileVerification();

    useEffect(() => {
        if (mobileNumber.length >= 7) {
            const timer = setTimeout(async () => {
                const fullPhone = `${countryCode}${mobileNumber}`;
                const result = await checkMobileExists(fullPhone);
                setUserExists(result.exists);
                if (result.exists && result.userName) setUserName(result.userName);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [mobileNumber, countryCode, checkMobileExists]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const fullPhone = `${countryCode}${mobileNumber}`;
        const email = `${fullPhone.replace('+', '')}@neoays.com`;

        try {
            if (userExists) {
                if (!password) throw new Error("Please enter password");
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                if (!userName) throw new Error("Please enter your name");
                const cred = await createUserWithEmailAndPassword(auth, email, fullPhone);

                const newProfile: UserProfile = {
                    username: fullPhone.replace('+', ''),
                    displayName: userName,
                    email,
                    mobileNumber: fullPhone,
                    countryCode,
                    profileType: 'personal',
                    createdAt: new Date().toISOString()
                };

                await Promise.all([
                    setDoc(doc(db, 'users', cred.user.uid), newProfile),
                    setDoc(doc(db, 'usernames', newProfile.username.toLowerCase()), { userId: cred.user.uid })
                ]);
            }
            onSuccess();
            onClose();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const filteredCountries = COUNTRY_CODES.filter(c =>
        c.name.toLowerCase().includes(countryFilter.toLowerCase()) ||
        c.code.includes(countryFilter)
    );

    return (
        <div className="fixed inset-0 z-[1001] flex items-start justify-center p-0 sm:p-4 pt-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="bg-white w-full max-w-[400px] rounded-[32px] overflow-hidden shadow-2xl relative animate-scale-in">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors z-10">
                    <TimesIcon className="w-4 h-4 text-slate-500" />
                </button>

                <div className="p-8 pb-4">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Connect with {profileName}</h2>
                    <p className="text-slate-500 text-sm font-medium mt-1">Join Neoays to save this profile and build your digital network.</p>
                </div>

                <form onSubmit={handleAuth} className="p-8 pt-4 space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Mobile Number</label>
                        <div className="flex gap-2">
                            <div
                                onClick={() => setIsCountryPickerOpen(true)}
                                className="w-20 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors h-12"
                            >
                                <span className="text-lg mr-1">{getCountryByCode(countryCode).flag}</span>
                                <span className="text-xs font-bold text-slate-700">{countryCode}</span>
                            </div>
                            <input
                                type="tel"
                                value={mobileNumber}
                                onChange={e => setMobileNumber(e.target.value.replace(/[^0-9]/g, ''))}
                                placeholder="50xxxxxxx"
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                            />
                        </div>
                    </div>

                    <div className={`overflow-hidden transition-all duration-300 ${mobileNumber.length > 6 ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
                        {userExists ? (
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all h-12"
                                />
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Your Name</label>
                                <input
                                    type="text"
                                    value={userName}
                                    onChange={e => setUserName(e.target.value)}
                                    placeholder="John Doe"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all h-12"
                                />
                            </div>
                        )}
                    </div>

                    {error && <p className="text-[10px] text-red-500 font-bold text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={isSubmitting || mobileNumber.length < 7}
                        className="w-full bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-xs py-4 rounded-xl shadow-lg hover:bg-slate-800 active:scale-95 disabled:opacity-50 transition-all flex justify-center items-center gap-2 mt-4"
                    >
                        {isSubmitting ? <SpinnerIcon className="w-4 h-4 animate-spin text-white" /> : (userExists ? 'Login & Connect' : 'Join & Connect')}
                    </button>
                </form>

                {isCountryPickerOpen && (
                    <div className="absolute inset-0 bg-white z-[20] flex flex-col animate-slide-up">
                        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                            <input
                                autoFocus
                                placeholder="Search country..."
                                className="flex-1 bg-slate-50 p-2 rounded-lg text-sm border-none outline-none font-bold"
                                value={countryFilter}
                                onChange={e => setCountryFilter(e.target.value)}
                            />
                            <button onClick={() => setIsCountryPickerOpen(false)} className="p-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-500 uppercase">Close</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {filteredCountries.map(c => (
                                <div
                                    key={c.code}
                                    onClick={() => { setCountryCode(c.code); setIsCountryPickerOpen(false); }}
                                    className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                                >
                                    <span className="text-xl">{c.flag}</span>
                                    <span className="text-xs font-bold text-slate-900">{c.name}</span>
                                    <span className="text-xs font-medium text-slate-400 ml-auto">{c.code}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuickConnectModal;
