import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { Survey, SurveyQuestion, SurveyResponse, UserProfile, Voucher } from '../types';
import { useVoucherClaim } from '../hooks/useVoucherClaim';
import { onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { CheckCircleIcon, SpinnerIcon } from '../components/Icons';
import { COUNTRY_CODES, getCountryByCode, getDefaultCountryCode } from '../constants/countryCodes';
import { useMobileVerification } from '../hooks/useMobileVerification';

interface PublicSurveyViewProps {
    profileData: UserProfile;
    onClose: () => void;
}

const PublicSurveyView: React.FC<PublicSurveyViewProps> = ({ profileData, onClose }) => {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);
    const [answers, setAnswers] = useState<{ [questionId: string]: string | string[] }>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [showVoucherModal, setShowVoucherModal] = useState(false);
    const [processingReward, setProcessingReward] = useState(false);

    // Mobile Claim State
    const [mobileNumber, setMobileNumber] = useState('');
    const [countryCode, setCountryCode] = useState(getDefaultCountryCode());
    const [password, setPassword] = useState('');
    const [userName, setUserName] = useState('');
    const [userExists, setUserExists] = useState(false);
    const [claimStep, setClaimStep] = useState<'form' | 'success'>('form');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Country Picker
    const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
    const [countryFilter, setCountryFilter] = useState('');

    // Voucher Claim Hooks
    const [rewardVoucher, setRewardVoucher] = useState<Voucher | null>(null);
    const { claimVoucher, loading: claiming, error: claimError, success: claimSuccess } = useVoucherClaim();
    const { checkMobileExists } = useMobileVerification();
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            // Pre-fill if logged in
            if (user && user.phoneNumber) {
                // user.phoneNumber is usually E.164 (e.g. +97150...)
                // We'd need to parse it, but for now simple check
            }
        });
        return () => unsubscribe();
    }, []);

    // Debounced Mobile Check
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

    const filteredCountries = useMemo(() => {
        return COUNTRY_CODES.filter(c =>
            c.name.toLowerCase().includes(countryFilter.toLowerCase()) ||
            c.code.includes(countryFilter)
        );
    }, [countryFilter]);

    // Fetch active surveys
    useEffect(() => {
        const fetchSurveys = async () => {
            if (!db || !profileData.id) return;
            try {
                const surveysRef = collection(db, 'surveys');
                const q = query(
                    surveysRef,
                    where('businessId', '==', profileData.id),
                    where('isActive', '==', true)
                );
                const snapshot = await getDocs(q);
                const fetchedSurveys = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Survey));
                setSurveys(fetchedSurveys);
                if (fetchedSurveys.length > 0) {
                    setActiveSurvey(fetchedSurveys[0]);
                }
            } catch (error) {
                console.error('Error fetching surveys:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSurveys();
    }, [profileData.id]);

    const handleAnswerChange = (questionId: string, value: string | string[]) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleSubmit = async () => {
        if (!activeSurvey || !db) return;
        setSubmitting(true);

        try {
            const responseData: Omit<SurveyResponse, 'id'> = {
                surveyId: activeSurvey.id,
                businessId: profileData.id || '',
                ownerId: profileData.ownerId || profileData.userId,
                answers: Object.entries(answers).map(([questionId, value]) => ({ questionId, value })),
                voucherClaimed: false,
                submittedAt: serverTimestamp()
            };

            await addDoc(collection(db, 'surveyResponses'), responseData);
            // Check for Reward
            if (activeSurvey.rewardEnabled && activeSurvey.rewardVoucherId) {
                setProcessingReward(true);
                // Find voucher in profileData
                let foundVoucher = profileData.vouchers?.find(v => v.id === activeSurvey.rewardVoucherId);

                // Fallback: Fetch fresh profile if voucher not found (e.g. stale cache or cross-business reward)
                if (!foundVoucher) {
                    try {
                        const targetBusinessId = activeSurvey.rewardVoucherBusinessId || activeSurvey.businessId;

                        const bizDoc = await getDoc(doc(db, 'profiles', targetBusinessId));
                        if (bizDoc.exists()) {
                            const bizData = bizDoc.data() as UserProfile;
                            foundVoucher = bizData.vouchers?.find(v => v.id === activeSurvey.rewardVoucherId);
                        }
                    } catch (e) {
                        console.error("Failed to fetch fresh reward voucher:", e);
                    }
                }

                if (foundVoucher) {
                    setRewardVoucher(foundVoucher);
                    setShowVoucherModal(true);
                } else {
                    console.warn("Reward voucher not found in current profile.");
                }
                setProcessingReward(false);
            }

            setSubmitted(true);

        } catch (error) {
            console.error('Error submitting survey:', error);
        } finally {
            setSubmitting(false);
        }
    };



    const renderQuestion = (question: SurveyQuestion, index: number) => {
        const value = answers[question.id];

        return (
            <div key={question.id} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start gap-3 mb-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-black">
                        {index + 1}
                    </span>
                    <div className="flex-1">
                        <p className="font-bold text-gray-900">{question.text}</p>
                        {question.required && <span className="text-red-500 text-xs ml-1">*</span>}
                    </div>
                </div>

                <div className="ml-9">
                    {question.type === 'multiple-choice' && question.options && (
                        <div className="space-y-2">
                            {question.options.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleAnswerChange(question.id, opt.text)}
                                    className={`w-full p-3 rounded-lg border-2 text-left transition-all text-sm ${value === opt.text
                                        ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <span className={`inline-block w-4 h-4 rounded-full border-2 mr-3 align-middle ${value === opt.text ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                                        }`} />
                                    {opt.text}
                                </button>
                            ))}
                        </div>
                    )}

                    {question.type === 'rating' && (
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    onClick={() => handleAnswerChange(question.id, star.toString())}
                                    className={`text-3xl transition-transform ${parseInt(value as string) >= star ? 'scale-110' : 'grayscale opacity-40'
                                        }`}
                                >
                                    ⭐
                                </button>
                            ))}
                        </div>
                    )}

                    {question.type === 'text' && (
                        <textarea
                            value={(value as string) || ''}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            placeholder="Type your answer..."
                            rows={3}
                            className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none resize-none"
                        />
                    )}

                    {question.type === 'short-text' && (
                        <input
                            type="text"
                            value={(value as string) || ''}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            placeholder="Your answer..."
                            className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!activeSurvey) {
        return (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-start justify-center p-0 sm:p-4 pt-0 overflow-y-auto">
                <div className="bg-white w-full sm:max-w-md sm:rounded-3xl overflow-hidden sm:mt-8 p-8 text-center">
                    <div className="text-4xl mb-4">📋</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Survey</h3>
                    <p className="text-gray-500 mb-6">This business doesn't have any active surveys right now.</p>
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (submitted && !showVoucherModal && !processingReward) {
        return (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-start justify-center p-0 sm:p-4 pt-0 overflow-y-auto">
                <div className="bg-white w-full sm:max-w-md sm:rounded-3xl overflow-hidden sm:mt-8 p-8 text-center">
                    <div className="text-6xl mb-4 animate-bounce">🎉</div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Thank You!</h3>
                    <p className="text-gray-500 mb-6">Your response has been submitted successfully.</p>
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-orange-600 text-white rounded-xl font-bold"
                    >
                        Done
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-start justify-center p-0 sm:p-4 pt-0 overflow-y-auto">
            <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl overflow-hidden min-h-screen sm:min-h-0 sm:mt-4 flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-br from-orange-500 to-red-500 p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full text-white flex items-center justify-center hover:bg-white/30 transition text-xl"
                    >
                        ×
                    </button>
                    <div className="flex items-center gap-4">
                        {profileData.photoURL ? (
                            <img src={profileData.photoURL} alt="" className="w-12 h-12 rounded-full border-2 border-white/30" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                                {profileData.displayName?.charAt(0)}
                            </div>
                        )}
                        <div>
                            <h2 className="font-black text-lg">{activeSurvey.title}</h2>
                            <p className="text-white/80 text-xs">{profileData.displayName}</p>
                        </div>
                    </div>
                </div>

                {/* Survey Selector (if multiple) */}
                {surveys.length > 1 && (
                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex gap-2 overflow-x-auto">
                        {surveys.map(s => (
                            <button
                                key={s.id}
                                onClick={() => { setActiveSurvey(s); setAnswers({}); }}
                                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${activeSurvey.id === s.id
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-white text-gray-600 border border-gray-200'
                                    }`}
                            >
                                {s.title}
                            </button>
                        ))}
                    </div>
                )}

                {/* Questions */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {activeSurvey.questions.map((q, i) => renderQuestion(q, i))}
                </div>

                {/* Submit Button */}
                <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0">
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full p-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-black text-lg shadow-lg disabled:opacity-50 transition"
                    >
                        {submitting ? 'Submitting...' : 'Submit Survey'}
                    </button>
                </div>
            </div>

            {/* Voucher Selection Modal */}
            {showVoucherModal && rewardVoucher && (
                <div className="fixed inset-0 z-[60] bg-black/80 flex items-start justify-center p-4 pt-8 overflow-y-auto">
                    <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden animate-scale-in relative">
                        {/* Close Button */}
                        <button
                            onClick={() => { setShowVoucherModal(false); onClose(); }}
                            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-black/5 rounded-full hover:bg-black/10 transition"
                        >
                            &times;
                        </button>

                        <div className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white text-center">
                            <div className="text-5xl mb-3">🎁</div>
                            <h3 className="text-2xl font-black">Claim Your Reward!</h3>
                            <p className="text-green-100 text-sm mt-1">Thanks for your feedback!</p>
                        </div>

                        {claimStep === 'success' ? (
                            <div className="p-8 text-center animate-fade-in-up">
                                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                    <CheckCircleIcon className="w-10 h-10" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-800 mb-2">Voucher Claimed!</h2>
                                <p className="text-slate-500 font-medium mb-6">It has been saved to your wallet.</p>

                                {!currentUser && (
                                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl mb-6 text-left">
                                        <p className="text-xs font-bold text-orange-800 mb-1">🔔 Important:</p>
                                        <p className="text-xs text-orange-700">
                                            Your password is your <span className="font-black">Mobile Number</span>.
                                            Use it to login anytime!
                                        </p>
                                    </div>
                                )}

                                <button
                                    onClick={() => window.location.hash = '#/nwallet'}
                                    className="w-full py-4 bg-slate-900 text-white font-black uppercase tracking-widest text-sm rounded-xl shadow-lg hover:bg-slate-800 transition-all flex justify-center items-center gap-2"
                                >
                                    Go to Wallet →
                                </button>
                            </div>
                        ) : (
                            <div className="p-6">
                                {/* Voucher Preview */}
                                <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-2xl text-center mb-6">
                                    <p className="font-black text-3xl text-orange-600 mb-1">{rewardVoucher.value}</p>
                                    <p className="font-bold text-gray-900">{rewardVoucher.title}</p>
                                    <p className="text-xs text-gray-500 mt-2">{rewardVoucher.description}</p>
                                </div>

                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    setIsSubmitting(true);
                                    const fullPhone = `${countryCode}${mobileNumber}`;
                                    const email = `${fullPhone.replace('+', '')}@neoays.com`;

                                    try {
                                        let user = auth.currentUser;

                                        if (!user) {
                                            if (userExists) {
                                                if (!password) { alert("Please enter password"); setIsSubmitting(false); return; }
                                                const cred = await signInWithEmailAndPassword(auth, email, password);
                                                user = cred.user;
                                            } else {
                                                if (!userName) { alert("Please enter name"); setIsSubmitting(false); return; }

                                                try {
                                                    const cred = await createUserWithEmailAndPassword(auth, email, fullPhone);
                                                    user = cred.user;

                                                    // Create basic profile
                                                    const newProfile: UserProfile = {
                                                        username: fullPhone.replace('+', ''),
                                                        displayName: userName,
                                                        email,
                                                        mobileNumber: fullPhone,
                                                        countryCode,
                                                        country: getCountryByCode(countryCode).name,
                                                        profileType: 'personal',
                                                        savedVouchers: []
                                                    };

                                                    await Promise.all([
                                                        setDoc(doc(db, 'users', user.uid), newProfile),
                                                        setDoc(doc(db, 'usernames', newProfile.username.toLowerCase()), { userId: user.uid })
                                                    ]);
                                                } catch (createError: any) {
                                                    if (createError.code === 'auth/email-already-in-use') {
                                                        alert("Account already exists. Please enter your password.");
                                                        setUserExists(true);
                                                        setIsSubmitting(false);
                                                        return;
                                                    }
                                                    throw createError;
                                                }
                                            }
                                        }

                                        const successId = await claimVoucher(rewardVoucher, profileData.id!, profileData.username, user!, fullPhone);

                                        if (successId) {
                                            setClaimStep('success');
                                        }

                                    } catch (err: any) {
                                        console.error(err);
                                        alert(err.message || "Claim failed");
                                    } finally {
                                        setIsSubmitting(false);
                                    }
                                }} className="space-y-4">

                                    {!currentUser && (
                                        <>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Mobile Number</label>
                                                <div className="flex gap-2">
                                                    <div
                                                        onClick={() => setIsCountryPickerOpen(true)}
                                                        className="w-20 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors"
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
                                                        disabled={isSubmitting}
                                                    />
                                                </div>
                                            </div>

                                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${mobileNumber.length > 6 ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
                                                {userExists ? (
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Password</label>
                                                        <input
                                                            type="password"
                                                            value={password}
                                                            onChange={e => setPassword(e.target.value)}
                                                            placeholder="••••••"
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-300"
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
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {claimError && <p className="text-xs text-red-500 font-bold text-center">{claimError}</p>}

                                    <button
                                        type="submit"
                                        disabled={isSubmitting || (!currentUser && mobileNumber.length < 7)}
                                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-black uppercase tracking-[0.2em] text-xs py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2"
                                    >
                                        {isSubmitting ? <SpinnerIcon className="w-4 h-4 animate-spin text-white" /> : (currentUser ? 'Claim as ' + (currentUser.displayName || 'CurrentUser') : 'Claim Reward')}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Country Picker */}
                        {isCountryPickerOpen && (
                            <div className="absolute inset-x-0 bottom-0 top-20 bg-white z-50 rounded-b-[32px] overflow-hidden flex flex-col animate-slide-up shadow-2xl">
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
                                            key={c.country} // Use country code (ISO) as key instead of calling code
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
            )}
        </div>
    );
};

export default PublicSurveyView;
