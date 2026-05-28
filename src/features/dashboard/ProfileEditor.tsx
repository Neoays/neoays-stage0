import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { SpinnerIcon } from '../../components/Icons';
import { updatePassword, updateEmail } from 'firebase/auth';
import { auth, db } from '../../services/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ALL_COUNTRY_CODES } from '../../constants/countryCodes';
import CategorySelector from '../../components/CategorySelector';

interface ProfileEditorProps {
    profileData: UserProfile;
    onUpdateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ profileData, onUpdateProfile }) => {
    const [formData, setFormData] = useState({
        displayName: '',
        username: '',
        email: '',
        bio: '',
        mobileNumber: '',
        businessCategory: '',
        category: '', // NEW: Professional/Business category
        designation: '', // NEW: Current job title
        companyId: '',
        country: '',
        countryCode: '',
        city: '',
        location: '', // NEW: User-friendly location string
        isPublic: false,
        tags: [] as string[],
        categories: [] as string[],
        profileType: 'personal' as UserProfile['profileType'],
        ngoDetails: {
            bloodDonationCount: 0,
            organizationType: ''
        },
        coordinates: undefined as { lat: number, lng: number } | undefined,
        welcomeMessage: '', // NEW: Custom greeting
        // Extended contact fields (Deprecated - moving to unified links)
        websites: [] as { url: string, label: string }[],
        additionalPhones: [] as { number: string, label: string, countryCode: string }[],
        linkedProfiles: [] as { profileId: string, name: string, relation: string, avatarUrl?: string }[]
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        if (profileData) {
            setFormData({
                displayName: profileData.displayName || '',
                username: profileData.username || '',
                email: profileData.email || '',
                bio: profileData.bio || '',
                mobileNumber: profileData.mobileNumber || '',
                businessCategory: profileData.businessCategory || '',
                category: profileData.category || '',
                companyId: profileData.companyId || '',
                country: profileData.country || (Intl.DateTimeFormat().resolvedOptions().timeZone.includes('Muscat') ? 'Oman' : Intl.DateTimeFormat().resolvedOptions().timeZone.includes('Kolkata') ? 'India' : 'Oman'),
                countryCode: profileData.countryCode || (Intl.DateTimeFormat().resolvedOptions().timeZone.includes('Muscat') ? '+968' : Intl.DateTimeFormat().resolvedOptions().timeZone.includes('Kolkata') ? '+91' : '+968'),
                city: profileData.city || '',
                location: profileData.location || '',
                isPublic: profileData.isPublic || false,
                tags: profileData.tags || [],
                categories: profileData.categories || [],
                profileType: profileData.profileType || 'personal',
                ngoDetails: {
                    bloodDonationCount: profileData.ngoDetails?.bloodDonationCount || 0,
                    organizationType: profileData.ngoDetails?.organizationType || ''
                },
                coordinates: profileData.coordinates || undefined,
                welcomeMessage: profileData.welcomeMessage || '',
                designation: profileData.designation || '',
                websites: profileData.websites || [],
                additionalPhones: profileData.additionalPhones || [],
                linkedProfiles: profileData.linkedProfiles || []
            });
        }
    }, [profileData]);

    const checkUsernameAvailability = async (name: string) => {
        if (!db || name === profileData.username) {
            setUsernameStatus('idle');
            return;
        }
        setUsernameStatus('checking');
        try {
            const docRef = doc(db, 'usernames', name.toLowerCase());
            const docSnap = await getDoc(docRef);
            setUsernameStatus(docSnap.exists() ? 'taken' : 'available');
        } catch (e) {
            console.error("Error checking username:", e);
            setUsernameStatus('idle');
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.username && formData.username !== profileData.username && formData.username.length >= 3) {
                checkUsernameAvailability(formData.username);
            } else {
                setUsernameStatus('idle');
            }
        }, 2000); // Increased buffer to prevent spelling misses
        return () => clearTimeout(timer);
    }, [formData.username, profileData.username, checkUsernameAvailability]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const val = name === 'username' ? value.toLowerCase().replace(/[^a-z0-9-]/g, '') : value;
        setFormData(prev => ({ ...prev, [name]: val }));
        setIsDirty(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.username !== profileData.username && usernameStatus !== 'available' && formData.username !== "") {
            if (usernameStatus === 'taken') alert("This Public ID is already taken.");
            return;
        }

        setIsSaving(true);
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Not authenticated");

            // Sync Firebase Auth Email if changed
            if (formData.email && formData.email !== profileData.email) {
                try {
                    await updateEmail(user, formData.email);
                } catch (e: any) {
                    if (e.code === 'auth/requires-recent-login') {
                        alert("For security, updating your login email requires a recent login. Please sign out and sign in again to change this.");
                        setIsSaving(false);
                        return;
                    }
                    throw e;
                }
            }

            // Sync Usernames Mapping
            if (formData.username && formData.username !== profileData.username) {
                await setDoc(doc(db, 'usernames', formData.username.toLowerCase()), { userId: user.uid });
            }

            // Sync Mobiles Mapping
            if (formData.mobileNumber && formData.mobileNumber !== profileData.mobileNumber) {
                const numericMobile = formData.mobileNumber.replace(/[^0-9+]/g, '');
                if (numericMobile.length >= 8) {
                    await setDoc(doc(db, 'mobiles', numericMobile), { userId: user.uid });
                }
            }

            await onUpdateProfile(formData);
            setIsDirty(false);
            alert("Profile updated successfully!");
        } catch (error: any) {
            console.error("Failed to save profile", error);
            alert(`Failed: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }
        if (!auth.currentUser) return;

        try {
            await updatePassword(auth.currentUser, newPassword);
            alert("Password updated successfully!");
            setNewPassword('');
        } catch (e: any) {
            console.error("Password update failed", e);
            alert(`Failed: ${e.message}. You may need to re-login to ensure security.`);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center justify-between">
                <span>📝 Edit Profile Details</span>
                {isDirty && <span className="text-xs text-amber-500 font-medium px-2 py-1 bg-amber-50 rounded-full">Unsaved Changes</span>}
            </h3>

            {/* Profile Type & Discovery Section */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 mb-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Profile Type</label>
                        <select
                            name="profileType"
                            value={formData.profileType}
                            onChange={(e) => {
                                setFormData(prev => ({ ...prev, profileType: e.target.value as UserProfile['profileType'] }));
                                setIsDirty(true);
                            }}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none text-sm"
                        >
                            <option value="personal">Personal Profile</option>
                            <option value="personal_jobseeker">Personal (Jobseeker)</option>
                            <option value="business">Business Profile</option>
                            <option value="business_person">Business Representative / Person</option>
                            <option value="staff">Company Staff / Employee</option>
                            <option value="ngo">NGO / Non-Profit</option>
                            <option value="society_club">Society / Club</option>
                        </select>
                    </div>

                    {(formData.profileType === 'ngo' || formData.profileType === 'personal' || formData.profileType === 'personal_jobseeker') && (
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Blood Donation Count</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    name="bloodDonationCount"
                                    value={formData.ngoDetails?.bloodDonationCount || 0}
                                    onChange={(e) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            ngoDetails: { ...prev.ngoDetails, bloodDonationCount: parseInt(e.target.value) || 0 }
                                        }));
                                        setIsDirty(true);
                                    }}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none text-sm"
                                    min="0"
                                />
                                <span className="text-xl">🩸</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Public ID Section */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
                <h4 className="text-sm font-bold text-indigo-900 mb-2">Unique Public ID (your-link)</h4>
                <div className="flex gap-2 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 font-bold">@</span>
                    <input
                        type="text"
                        name="username"
                        placeholder="your-id"
                        value={formData.username}
                        onChange={handleChange}
                        className={`flex-1 pl-8 p-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 ${usernameStatus === 'available' ? 'border-green-300 focus:ring-green-100' :
                            usernameStatus === 'taken' ? 'border-red-300 focus:ring-red-100' :
                                'border-indigo-200 focus:ring-indigo-100'
                            }`}
                    />
                    {usernameStatus === 'checking' && <SpinnerIcon className="absolute right-32 top-1/2 -translate-y-1/2 animate-spin h-4 w-4 text-indigo-400" />}
                </div>
                <p className="text-xs text-indigo-400 mt-2">Changing this will change your profile URL: neoays.com/{formData.username}</p>
                {usernameStatus === 'taken' && <p className="text-[10px] text-red-500 font-bold mt-1">This ID is already taken.</p>}
                {usernameStatus === 'available' && <p className="text-[10px] text-green-500 font-bold mt-1">This ID is available!</p>}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Email Address (Login ID)</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="your@email.com"
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Mobile Number</label>
                        <input
                            type="tel"
                            name="mobileNumber"
                            value={formData.mobileNumber}
                            onChange={handleChange}
                            placeholder="+968..."
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Country</label>
                        <select
                            name="country"
                            value={formData.country}
                            onChange={(e) => {
                                const selectedName = e.target.value;
                                const country = ALL_COUNTRY_CODES.find(c => c.name === selectedName);
                                setFormData(prev => ({
                                    ...prev,
                                    country: selectedName,
                                    countryCode: country ? country.code : ''
                                }));
                                setIsDirty(true);
                            }}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                        >
                            <option value="">Select Country...</option>
                            {ALL_COUNTRY_CODES.map(c => (
                                <option key={c.name} value={c.name}>
                                    {c.flag} {c.name} ({c.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">City</label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="e.g. Dubai"
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 transition-all outline-none"
                        />
                    </div>
                </div>

                {/* Explicit Location String field */}
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Detailed Display Location</label>
                    <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="e.g. Downtown Dubai, UAE"
                        className="w-full mb-4 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Display Name (Full Name)</label>
                        <input
                            type="text"
                            name="displayName"
                            value={formData.displayName}
                            onChange={handleChange}
                            placeholder="e.g. Dr. John Doe"
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Current Designation / Title</label>
                        <input
                            type="text"
                            name="designation"
                            value={(formData as any).designation || ''}
                            onChange={handleChange}
                            placeholder="e.g. Senior Consultant"
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                        />
                    </div>
                </div>

                {/* Category Selector */}
                <CategorySelector
                    profileType={formData.profileType || 'personal'}
                    value={formData.category}
                    onChange={(val: string) => {
                        setFormData(prev => ({ ...prev, category: val }));
                        setIsDirty(true);
                    }}
                />

                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Public Welcome Message (Optional)</label>
                    <input
                        type="text"
                        name="welcomeMessage"
                        value={formData.welcomeMessage}
                        onChange={handleChange}
                        placeholder="e.g. Welcome to my digital profile!"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                    />
                    <p className="text-[10px] text-gray-400 mt-1 px-1">This message appears prominently at the top of your public profile.</p>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Bio / Subtitle</label>
                    <textarea
                        name="bio"
                        rows={3}
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="Short description or tagline..."
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none resize-none"
                    />
                </div>

                {/* Password Change Section */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 mt-6">
                    <h4 className="text-sm font-bold text-slate-900 mb-2">Security Setting</h4>
                    <div className="flex gap-2">
                        <input
                            type="password"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-100"
                        />
                        <button
                            type="button"
                            onClick={handleChangePassword}
                            className="px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded-lg hover:bg-slate-900 transition-colors"
                        >
                            Update Password
                        </button>
                    </div>
                </div>

                {/* Discovery Settings */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <span>🔗</span> Profile Interlinking (Work at / Member of)
                    </h4>

                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            id="affiliationSearch"
                            placeholder="Search by username (e.g. apple)"
                            className="flex-1 p-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none text-sm"
                        />
                        <button
                            type="button"
                            onClick={async () => {
                                const input = document.getElementById('affiliationSearch') as HTMLInputElement;
                                const val = input.value.toLowerCase().replace('@', '');
                                if (val) {
                                    const uDoc = await getDoc(doc(db, 'usernames', val));
                                    if (uDoc.exists()) {
                                        const mapping = uDoc.data() as { userId?: string, profileId?: string, type?: string };
                                        const targetId = mapping.profileId || mapping.userId;
                                        const collection = mapping.profileId ? 'profiles' : 'users';

                                        if (targetId) {
                                            const pDoc = await getDoc(doc(db, collection, targetId));
                                            if (pDoc.exists()) {
                                                const pData = pDoc.data() as UserProfile;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    workExperience: [
                                                        ...(prev as any).workExperience || [],
                                                        {
                                                            companyId: targetId,
                                                            companyName: pData.displayName || pData.username,
                                                            role: mapping.type === 'business' ? 'Company Page' : 'Professional Contact',
                                                            status: 'active',
                                                            username: val,
                                                            photoURL: pData.photoURL
                                                        }
                                                    ]
                                                }));
                                                setIsDirty(true);
                                                input.value = '';
                                                alert(`Linked to @${val}!`);
                                            }
                                        }
                                    } else {
                                        alert("Profile not found.");
                                    }
                                }
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl"
                        >
                            Link Profile
                        </button>
                    </div>

                    {((formData as any).workExperience || []).map((work: any, i: number) => (
                        <div key={i} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-100 mb-2">
                            <div>
                                <p className="text-sm font-bold text-slate-900">{work.companyName}</p>
                                <p className="text-[10px] text-slate-500">{work.role} • {work.status}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData(prev => ({
                                        ...prev,
                                        workExperience: (prev as any).workExperience.filter((_: any, idx: number) => idx !== i)
                                    }));
                                    setIsDirty(true);
                                }}
                                className="text-red-500 text-xs font-bold"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>

                {/* Discovery Settings */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <span>🔍</span> Search & Discovery
                    </h4>

                    {/* Discovery Settings - Presence handled in Navbar toggle */}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Primary Role (Category)</label>
                            <select
                                name="categories"
                                value={formData.categories[0] || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFormData(prev => ({ ...prev, categories: val ? [val] : [] }));
                                    setIsDirty(true);
                                }}
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none"
                            >
                                <option value="">Select a Category...</option>
                                <option value="Advocate">Advocate</option>
                                <option value="Doctor">Doctor</option>
                                <option value="Workshop">Workshop</option>
                                <option value="Textile">Textile</option>
                                <option value="NGO Member">NGO Member</option>
                                <option value="Club Member">Club Member</option>
                                <option value="Business">Business</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Search Tags (Comma separated)</label>
                            <input
                                type="text"
                                value={formData.tags.join(', ')}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFormData(prev => ({
                                        ...prev,
                                        tags: val.split(',').map(t => t.trim()).filter(Boolean)
                                    }));
                                    setIsDirty(true);
                                }}
                                placeholder="e.g. Health, Cardiology, Emergency, Clinic"
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Location Settings (Optional for Globe Map) */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <span>🌍</span> Globe Map Discovery (Optional)
                    </h4>
                    <p className="text-xs text-slate-500 mb-4 font-medium leading-relaxed">
                        Setting your location allows people to discover your profile on our interactive 3D globe.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Latitude</label>
                            <input
                                type="number"
                                step="any"
                                value={formData.coordinates?.lat || ''}
                                onChange={(e) => {
                                    const lat = parseFloat(e.target.value);
                                    setFormData(prev => ({
                                        ...prev,
                                        coordinates: { lat, lng: prev.coordinates?.lng || 0 }
                                    }));
                                    setIsDirty(true);
                                }}
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500"
                                placeholder="0.0000"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Longitude</label>
                            <input
                                type="number"
                                step="any"
                                value={formData.coordinates?.lng || ''}
                                onChange={(e) => {
                                    const lng = parseFloat(e.target.value);
                                    setFormData(prev => ({
                                        ...prev,
                                        coordinates: { lat: prev.coordinates?.lat || 0, lng }
                                    }));
                                    setIsDirty(true);
                                }}
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500"
                                placeholder="0.0000"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={() => {
                                    if (!navigator.geolocation) {
                                        alert("Geolocation is not supported by your browser.");
                                        return;
                                    }
                                    navigator.geolocation.getCurrentPosition(
                                        (pos) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                coordinates: { lat: pos.coords.latitude, lng: pos.coords.longitude }
                                            }));
                                            setIsDirty(true);
                                            alert("Location detected successfully!");
                                        },
                                        (err) => {
                                            alert(`Error: ${err.message}`);
                                        }
                                    );
                                }}
                                className="w-full sm:w-auto px-4 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition"
                            >
                                Detect
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {isSaving ? <SpinnerIcon className="animate-spin h-5 w-5 mr-2" /> : null}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfileEditor;
