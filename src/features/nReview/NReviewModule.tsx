import React, { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, where, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../services/firebaseConfig';
import { Feedback, Survey, SurveyQuestion, SurveyResponse, UserProfile } from '../../types';
import {
    EnvelopeIcon,
    StarIcon,
    PlusIcon,
    TrashIcon,
    CheckCircleIcon,
    DownloadIcon,
    PencilIcon,
    LinkIcon
} from '../../components/Icons';
import * as XLSX from 'xlsx';

interface NReviewModuleProps {
    isStandalone?: boolean;
    profileData?: UserProfile;
    onUpdateProfile?: (updates: Partial<UserProfile>) => Promise<void>;
    businesses?: UserProfile[]; // For selecting voucher rewards from any business
}

type TabType = 'feedback' | 'review' | 'survey';

const NReviewModule: React.FC<NReviewModuleProps> = ({
    isStandalone = false,
    profileData,
    onUpdateProfile,
    businesses = []
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('feedback');
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // Survey Editor State
    const [isCreatingSurvey, setIsCreatingSurvey] = useState(false);
    const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
    const [surveyTitle, setSurveyTitle] = useState('');
    const [availableVouchers, setAvailableVouchers] = useState<{ id: string, title: string, businessId: string, businessName: string }[]>([]);

    // Reward State
    const [rewardEnabled, setRewardEnabled] = useState(false);
    const [partnerBusinessIds, setPartnerBusinessIds] = useState<string[]>([]); // Deprecated but kept for compatibility
    const [selectedVoucherId, setSelectedVoucherId] = useState('');

    useEffect(() => {
        if (businesses.length > 0) {
            const allVouchers: { id: string, title: string, businessId: string, businessName: string }[] = [];
            businesses.forEach(biz => {
                if (biz.vouchers) {
                    biz.vouchers.forEach(v => {
                        allVouchers.push({
                            id: v.id,
                            title: v.title,
                            businessId: biz.id!,
                            businessName: biz.displayName!
                        });
                    });
                }
            });
            setAvailableVouchers(allVouchers);
        }
    }, [businesses]);
    const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([]);

    // Google Review State
    const [googleMapsLink, setGoogleMapsLink] = useState(profileData?.googleMapsReviewLink || '');
    const [isSavingLink, setIsSavingLink] = useState(false);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            if (!user) setLoading(false);
        });
        return () => unsubscribeAuth();
    }, []);

    // Determine effective Business ID (Profile ID or User ID)
    const businessId = profileData?.id || currentUser?.uid;

    // Fetch Feedbacks
    useEffect(() => {
        if (!currentUser || !db || !businessId) return;
        setLoading(true);
        const feedbackRef = collection(db, 'feedback');
        // Feedback is linked to the User ID (owner) for now, or should be businessId? 
        // Feedback usually comes from profile, so it should be linked to profileId (businessId).
        // However, existing feedback might be linked to userId. Let's keep it as is for now or switch?
        // Let's assume feedback is also migrated to businessId.
        const q = query(
            feedbackRef,
            where('businessId', '==', businessId), // switched to businessId
            orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedFeedback: Feedback[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Feedback));
            setFeedbacks(fetchedFeedback);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching feedback:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, businessId]);

    // Fetch Surveys
    useEffect(() => {
        if (!currentUser || !db || !businessId) return;
        const surveysRef = collection(db, 'surveys');
        // Surveys are public read, so querying by businessId is fine and efficient
        const q = query(
            surveysRef,
            where('businessId', '==', businessId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedSurveys: Survey[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Survey));
            fetchedSurveys.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setSurveys(fetchedSurveys);
        }, (error) => {
            console.error("Error fetching surveys:", error);
        });

        return () => unsubscribe();
    }, [currentUser, businessId]);

    // Fetch Survey Responses
    useEffect(() => {
        if (!currentUser || !db || !businessId) return;
        const responsesRef = collection(db, 'surveyResponses');

        // SECURITY FIX: Query must filter by ownerId to satisfy "allow read if resource.data.ownerId == auth.uid"
        // We fetch all responses owned by user, then filter by businessId client-side
        const q = query(
            responsesRef,
            where('ownerId', '==', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedResponses: SurveyResponse[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as SurveyResponse));

            // Client-side filter for current business & sort
            const businessResponses = fetchedResponses
                .filter(r => r.businessId === businessId)
                .sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));

            setSurveyResponses(businessResponses);
        }, (error) => {
            console.error("Error fetching responses:", error);
        });

        return () => unsubscribe();
    }, [currentUser, businessId]);

    // Save Google Maps Link
    const handleSaveGoogleLink = async () => {
        if (!onUpdateProfile) return;
        setIsSavingLink(true);
        try {
            await onUpdateProfile({ googleMapsReviewLink: googleMapsLink });
        } finally {
            setIsSavingLink(false);
        }
    };

    // Add Question
    const handleAddQuestion = () => {
        const newQuestion: SurveyQuestion = {
            id: `q_${Date.now()}`,
            text: '',
            type: 'multiple-choice',
            options: [
                { id: `opt_1`, text: 'Option 1' },
                { id: `opt_2`, text: 'Option 2' }
            ],
            required: true,
            order: surveyQuestions.length
        };
        setSurveyQuestions([...surveyQuestions, newQuestion]);
    };

    // Update Question
    const updateQuestion = (index: number, updates: Partial<SurveyQuestion>) => {
        const updated = [...surveyQuestions];
        updated[index] = { ...updated[index], ...updates };
        setSurveyQuestions(updated);
    };

    // Delete Question
    const deleteQuestion = (index: number) => {
        setSurveyQuestions(surveyQuestions.filter((_, i) => i !== index));
    };

    // Add Option to Question
    const addOption = (questionIndex: number) => {
        const updated = [...surveyQuestions];
        const options = updated[questionIndex].options || [];
        options.push({ id: `opt_${Date.now()}`, text: '' });
        updated[questionIndex].options = options;
        setSurveyQuestions(updated);
    };

    // Save Survey
    const handleSaveSurvey = async () => {
        if (!currentUser || !db || !surveyTitle.trim() || !profileData?.id) return;

        // Find selected voucher to get its business ID
        const selectedVoucher = availableVouchers.find(v => v.id === selectedVoucherId);

        const surveyData = {
            businessId: profileData.id, // Use profileData.id instead of businessId
            ownerId: currentUser.uid,
            title: surveyTitle,
            questions: surveyQuestions,
            isActive: true,
            rewardEnabled: rewardEnabled,
            rewardVoucherId: selectedVoucherId || null,
            rewardVoucherBusinessId: selectedVoucher?.businessId || null, // Save source business ID
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        try {
            if (editingSurvey) {
                await updateDoc(doc(db, 'surveys', editingSurvey.id), {
                    ...surveyData,
                    createdAt: editingSurvey.createdAt
                });
            } else {
                await addDoc(collection(db, 'surveys'), surveyData);
            }
            resetSurveyEditor();
        } catch (error) {
            console.error('Error saving survey:', error);
        }
    };

    // Delete Survey
    const handleDeleteSurvey = async (surveyId: string) => {
        if (!db || !window.confirm('Delete this survey?')) return;
        try {
            await deleteDoc(doc(db, 'surveys', surveyId));
        } catch (error) {
            console.error('Error deleting survey:', error);
        }
    };

    // Toggle Survey Active
    const handleToggleSurvey = async (survey: Survey) => {
        if (!db) return;
        try {
            await updateDoc(doc(db, 'surveys', survey.id), {
                isActive: !survey.isActive
            });
        } catch (error) {
            console.error('Error toggling survey:', error);
        }
    };

    // Edit Survey
    const handleEditSurvey = (survey: Survey) => {
        setEditingSurvey(survey);
        setSurveyTitle(survey.title);
        setSurveyQuestions(survey.questions || []);
        setRewardEnabled(survey.rewardEnabled || false);
        setSelectedVoucherId(survey.rewardVoucherId || '');
        setIsCreatingSurvey(true);
    };

    // Reset Survey Editor
    const resetSurveyEditor = () => {
        setIsCreatingSurvey(false);
        setEditingSurvey(null);
        setSurveyTitle('');
        setSurveyQuestions([]);
        setRewardEnabled(false);
        setSelectedVoucherId('');
    };

    // Export Feedback CSV
    const exportFeedbackCSV = () => {
        const headers = ['Source', 'Date', 'Comment', 'Contact'];
        const rows = feedbacks.map(f => [
            f.source,
            f.timestamp?.toDate ? new Date(f.timestamp.toDate()).toLocaleString() : 'N/A',
            `"${(f.comment || '').replace(/"/g, '""')}"`,
            f.customerContact || ''
        ]);
        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", "customer_feedback.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Export Survey Responses to Excel
    const exportSurveyResponses = (survey: Survey) => {
        const responses = surveyResponses.filter(r => r.surveyId === survey.id);
        if (responses.length === 0) return;

        const headers = ['Submitted At', ...survey.questions.map(q => q.text), 'Contact', 'Voucher Claimed'];
        const data = responses.map(r => {
            const row: any = {
                'Submitted At': r.submittedAt?.toDate ? new Date(r.submittedAt.toDate()).toLocaleString() : 'N/A'
            };
            survey.questions.forEach(q => {
                const answer = r.answers.find(a => a.questionId === q.id);
                row[q.text] = Array.isArray(answer?.value) ? (answer?.value as string[]).join(', ') : answer?.value || '';
            });
            row['Contact'] = r.respondentContact || 'Anonymous';
            row['Voucher Claimed'] = r.voucherClaimed ? 'Yes' : 'No';
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Responses');
        XLSX.writeFile(wb, `survey_responses_${survey.title.replace(/\s+/g, '_')}.xlsx`);
    };

    // Copy Link Helper
    const handleCopyLink = (action: 'review' | 'survey') => {
        if (!profileData?.username) {
            alert("No username found for this profile.");
            return;
        }
        // Construct URL: current origin + / + username + ?action=...
        // Assuming public profile URL structure is domain.com/#/username or domain.com/username
        // We'll use the hash router format: domain/#/username?action=...
        // Or if it's a dedicated page: domain/p/username?action=...
        // Let's use the standard hash route for now as it's safer.

        const baseUrl = `${window.location.origin}/#/${profileData.username}`;
        const finalUrl = `${baseUrl}?action=${action}`;

        navigator.clipboard.writeText(finalUrl).then(() => {
            alert(`Link copied: ${finalUrl}`);
        });
    };

    if (!currentUser) return null;

    const tabs = [
        { id: 'feedback' as TabType, label: 'Feedback', icon: '💬', count: feedbacks.length },
        { id: 'review' as TabType, label: 'Google Review', icon: '⭐', count: null },
        { id: 'survey' as TabType, label: 'Survey', icon: '📋', count: surveys.length }
    ];

    return (
        <div className={`space-y-6 animate-fade-in-up ${isStandalone ? 'max-w-4xl mx-auto p-4' : ''}`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <StarIcon className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight">nReview</h2>
                    </div>
                    <p className="text-orange-100 font-medium text-lg max-w-lg">Feedback • Reviews • Surveys</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === tab.id
                            ? 'bg-orange-600 text-white shadow-lg'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                        {tab.count !== null && (
                            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100'
                                }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ====== FEEDBACK TAB ====== */}
            {activeTab === 'feedback' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 leading-none">Customer Feedback</h3>
                            <span className="text-xs text-gray-500 mt-1 inline-block">Collected from your profile</span>
                        </div>
                        {feedbacks.length > 0 && (
                            <button
                                onClick={exportFeedbackCSV}
                                className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                            >
                                <DownloadIcon className="w-4 h-4" /> Export CSV
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        </div>
                    ) : feedbacks.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="text-4xl mb-4">💬</div>
                            <h3 className="text-lg font-medium text-gray-900">No Feedback Yet</h3>
                            <p className="text-sm text-gray-500 mt-1">Enable feedback on your public profile to start collecting.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                            {feedbacks.map(item => (
                                <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {item.source}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {item.timestamp?.toDate ? new Date(item.timestamp.toDate()).toLocaleDateString() : 'Just now'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-800 mb-3 whitespace-pre-wrap">"{item.comment || 'No comment'}"</p>
                                    {item.customerContact && (
                                        <div className="flex items-center mt-3 pt-3 border-t border-gray-100">
                                            <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                                            <span className="text-xs text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded">{item.customerContact}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ====== GOOGLE REVIEW TAB ====== */}
            {activeTab === 'review' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Google Review Settings</h3>
                            <p className="text-xs text-gray-500 mt-1">Configure your Google Maps location link for customer reviews</p>
                        </div>
                        <button
                            onClick={() => handleCopyLink('review')}
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition"
                        >
                            <LinkIcon className="w-4 h-4" /> Copy Review Link
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Toggle */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div>
                                <h4 className="font-bold text-gray-900">Enable Google Reviews</h4>
                                <p className="text-xs text-gray-500">Show review button on your public profile</p>
                            </div>
                            <button
                                onClick={() => onUpdateProfile?.({ reviewEnabled: !profileData?.reviewEnabled })}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${profileData?.reviewEnabled
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-200 text-gray-500'
                                    }`}
                            >
                                {profileData?.reviewEnabled ? 'Enabled' : 'Disabled'}
                            </button>
                        </div>

                        {/* Google Maps Link Input */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Google Maps Review Link
                            </label>
                            <p className="text-xs text-gray-500 mb-3">
                                Paste your Google Maps location URL. Customers will be redirected here when they click to review.
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    value={googleMapsLink}
                                    onChange={(e) => setGoogleMapsLink(e.target.value)}
                                    placeholder="https://maps.google.com/..."
                                    className="flex-1 p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                />
                                <button
                                    onClick={handleSaveGoogleLink}
                                    disabled={isSavingLink || googleMapsLink === profileData?.googleMapsReviewLink}
                                    className="px-6 py-3 bg-orange-600 text-white rounded-xl font-bold text-sm hover:bg-orange-700 disabled:opacity-50 transition"
                                >
                                    {isSavingLink ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>

                        {/* Preview */}
                        {profileData?.googleMapsReviewLink && (
                            <div className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border border-orange-100">
                                <p className="text-sm font-bold text-gray-700 mb-4">Preview: How customers will see it</p>
                                <div className="flex items-center gap-4">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                onClick={() => window.open(profileData.googleMapsReviewLink, '_blank')}
                                                className="text-3xl hover:scale-110 transition-transform cursor-pointer"
                                            >
                                                ⭐
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-600">← Click a star to test</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ====== SURVEY TAB ====== */}
            {activeTab === 'survey' && (
                <div className="space-y-4">
                    {/* Survey Toggle */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-gray-900">Enable Surveys on Profile</h4>
                            <p className="text-xs text-gray-500">Allow customers to take surveys from your public profile</p>
                        </div>
                        <button
                            onClick={() => onUpdateProfile?.({ surveyEnabled: !profileData?.surveyEnabled })}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${profileData?.surveyEnabled
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-200 text-gray-500'
                                }`}
                        >
                            {profileData?.surveyEnabled ? 'Enabled' : 'Disabled'}
                        </button>
                    </div>

                    {/* Create Survey Button */}
                    {!isCreatingSurvey && (
                        <button
                            onClick={() => setIsCreatingSurvey(true)}
                            className="w-full p-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition"
                        >
                            <PlusIcon className="w-5 h-5" /> Create New Survey
                        </button>
                    )}

                    {/* Survey Editor */}
                    {isCreatingSurvey && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-gray-900">
                                    {editingSurvey ? 'Edit Survey' : 'Create Survey'}
                                </h3>
                                <button onClick={resetSurveyEditor} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
                            </div>

                            <div className="p-6 space-y-4">
                                <input
                                    type="text"
                                    value={surveyTitle}
                                    onChange={(e) => setSurveyTitle(e.target.value)}
                                    placeholder="Survey Title"
                                    className="w-full p-3 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                />

                                {/* Questions */}
                                <div className="space-y-4">
                                    {surveyQuestions.map((q, index) => (
                                        <div key={q.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="flex items-start gap-3 mb-3">
                                                <span className="text-xs font-bold text-gray-400 mt-3">Q{index + 1}</span>
                                                <input
                                                    type="text"
                                                    value={q.text}
                                                    onChange={(e) => updateQuestion(index, { text: e.target.value })}
                                                    placeholder="Question text..."
                                                    className="flex-1 p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                                />
                                                <select
                                                    value={q.type}
                                                    onChange={(e) => updateQuestion(index, { type: e.target.value as any })}
                                                    className="p-2 border border-gray-200 rounded-lg text-xs"
                                                >
                                                    <option value="multiple-choice">Multiple Choice</option>
                                                    <option value="rating">Rating (1-5)</option>
                                                    <option value="text">Long Answer</option>
                                                    <option value="short-text">Short Answer</option>
                                                </select>
                                                <button
                                                    onClick={() => deleteQuestion(index)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Options for Multiple Choice */}
                                            {q.type === 'multiple-choice' && (
                                                <div className="ml-8 space-y-2">
                                                    {q.options?.map((opt, optIndex) => (
                                                        <div key={opt.id} className="flex items-center gap-2">
                                                            <span className="w-4 h-4 rounded-full border-2 border-gray-300"></span>
                                                            <input
                                                                type="text"
                                                                value={opt.text}
                                                                onChange={(e) => {
                                                                    const opts = [...(q.options || [])];
                                                                    opts[optIndex] = { ...opts[optIndex], text: e.target.value };
                                                                    updateQuestion(index, { options: opts });
                                                                }}
                                                                placeholder={`Option ${optIndex + 1}`}
                                                                className="flex-1 p-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                                            />
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => addOption(index)}
                                                        className="text-xs text-orange-600 font-bold hover:underline"
                                                    >
                                                        + Add Option
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handleAddQuestion}
                                    className="w-full p-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 font-bold hover:border-orange-400 hover:text-orange-600 transition"
                                >
                                    + Add Question
                                </button>

                                {/* Reward Configuration */}
                                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h4 className="font-bold text-gray-900">Reward Participation</h4>
                                            <p className="text-xs text-gray-500">Offer a voucher to customers who complete this survey.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={rewardEnabled}
                                                onChange={(e) => setRewardEnabled(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                                        </label>
                                    </div>

                                    {rewardEnabled && (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Select Reward Voucher</label>
                                            {availableVouchers.length > 0 ? (
                                                <select
                                                    value={selectedVoucherId}
                                                    onChange={(e) => setSelectedVoucherId(e.target.value)}
                                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                                >
                                                    <option value="">-- Select a voucher --</option>
                                                    {availableVouchers.map(v => (
                                                        <option key={v.id} value={v.id}>
                                                            {v.title} ({v.businessName})
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <p className="text-xs text-red-500 font-bold">
                                                    No vouchers found. Create one in the "Offers" tab first.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={resetSurveyEditor}
                                        className="flex-1 p-3 bg-gray-100 text-gray-600 rounded-xl font-bold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveSurvey}
                                        disabled={!surveyTitle.trim() || surveyQuestions.length === 0}
                                        className="flex-1 p-3 bg-orange-600 text-white rounded-xl font-bold disabled:opacity-50 hover:bg-orange-700 transition"
                                    >
                                        Save Survey
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Survey List */}
                    {!isCreatingSurvey && surveys.length > 0 && (
                        <div className="space-y-3">
                            {surveys.map(survey => {
                                const responseCount = surveyResponses.filter(r => r.surveyId === survey.id).length;
                                return (
                                    <div key={survey.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                        <div className="p-4 flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-gray-900">{survey.title}</h4>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${survey.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        {survey.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {survey.questions?.length || 0} questions • {responseCount} responses
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => exportSurveyResponses(survey)}
                                                    disabled={responseCount === 0}
                                                    className={`p-2 rounded-lg transition ${responseCount > 0
                                                        ? 'text-green-600 hover:bg-green-50'
                                                        : 'text-gray-300 cursor-not-allowed'}`}
                                                    title={responseCount > 0 ? "Export to Excel" : "No responses to export"}
                                                >
                                                    <DownloadIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleCopyLink('survey')}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                    title="Copy Survey Link"
                                                >
                                                    <LinkIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditSurvey(survey)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                >
                                                    <PencilIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleSurvey(survey)}
                                                    className={`p-2 rounded-lg transition ${survey.isActive ? 'text-orange-600 hover:bg-orange-50' : 'text-gray-400 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <CheckCircleIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSurvey(survey.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Survey Responses Overview */}
                    {!isCreatingSurvey && surveyResponses.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                                <h3 className="text-lg font-bold text-gray-900">Recent Responses</h3>
                            </div>
                            <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                                {surveyResponses.slice(0, 10).map(response => {
                                    const survey = surveys.find(s => s.id === response.surveyId);
                                    return (
                                        <div key={response.id} className="p-4 hover:bg-gray-50">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{survey?.title || 'Unknown Survey'}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {response.respondentContact || 'Anonymous'} • {response.answers.length} answers
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {response.voucherClaimed && (
                                                        <span className="text-xs text-green-600 font-bold">🎁 Voucher Claimed</span>
                                                    )}
                                                    <span className="text-xs text-gray-400">
                                                        {response.submittedAt?.toDate ? new Date(response.submittedAt.toDate()).toLocaleDateString() : 'Just now'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!isCreatingSurvey && surveys.length === 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                            <div className="text-4xl mb-4">📋</div>
                            <h3 className="text-lg font-medium text-gray-900">No Surveys Yet</h3>
                            <p className="text-sm text-gray-500 mt-1">Create your first survey to start collecting customer feedback.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NReviewModule;
