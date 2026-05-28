import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import './GlassProfile.css';

interface GlassProfileProps {
    profileData: UserProfile | null;
}

const GlassProfile: React.FC<GlassProfileProps> = ({ profileData }) => {
    const [lang, setLang] = useState<'en' | 'ar'>('en');
    const [mode, setMode] = useState<'light' | 'dark'>('light');
    const [overlayImage, setOverlayImage] = useState<string | null>(null);
    const [surveyAnswer, setSurveyAnswer] = useState<string | null>(null);
    const [surveyCount, setSurveyCount] = useState(0);
    const [showThanks, setShowThanks] = useState(false);

    useEffect(() => {
        const storedCount = localStorage.getItem('neoays_v_count');
        if (storedCount) {
            setSurveyCount(parseInt(storedCount));
        }
    }, []);

    // Translations
    const t = {
        title: { en: profileData?.displayName || profileData?.username || "Neoays User", ar: profileData?.displayName || profileData?.username || "مستخدم Neoays" },
        subtitle: { en: profileData?.bio || "Digital Business Identity", ar: profileData?.bio || "الهوية الرقمية للأعمال" },
        save: { en: "Save Contact", ar: "حفظ جهة الإتصال" },
        call: { en: "Call Center", ar: "مركز الإتصال" },
        connect: { en: "Quick Connect", ar: "روابط سريعة" },
        rate: { en: "Rate Our Service", ar: "قيم خدماتنا" },
        rate_sub: { en: "Tap stars to review us on Google", ar: "اضغط على النجوم للتقييم" },
        q: { en: "How did you hear about us?", ar: "كيف سمعت عنا؟" },
        media: { en: "Media Gallery", ar: "معرض الوسائط" },
        mode: { en: "Mode", ar: "الوضع" },
        whatsapp: { en: "WhatsApp", ar: "واتساب" },
        website: { en: "Website", ar: "موقع الكتروني" },
        location: { en: "Location", ar: "موقعك" },
        loading: { en: "Loading Profile...", ar: "جاري تحميل الملف الشخصي..." }
    };

    if (!profileData) {
        return <div className="min-h-screen flex items-center justify-center text-white">{t.loading[lang]}</div>;
    }

    const toggleLang = () => {
        setLang(prev => prev === 'en' ? 'ar' : 'en');
    };

    const toggleMode = () => {
        setMode(prev => prev === 'light' ? 'dark' : 'light');
    };

    const saveContact = () => {
        const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${profileData.displayName || profileData.username}\nTEL;TYPE=WORK,VOICE:${profileData.mobileNumber || ''}\nEMAIL:${profileData.email}\nURL:${window.location.href}\nEND:VCARD`;
        const blob = new Blob([vcard], { type: "text/vcard" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${profileData.username}.vcf`;
        link.href = url;
        link.click();
    };

    const shareProfile = () => {
        const shareData = {
            title: t.title[lang],
            text: t.subtitle[lang],
            url: window.location.href
        };

        if (navigator.share) {
            navigator.share(shareData).catch(console.error);
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
        }
    };

    const handleSurvey = (answer: string) => {
        if (surveyCount >= 5) return;
        setSurveyAnswer(answer);
        setShowThanks(true);
        const newCount = surveyCount + 1;
        setSurveyCount(newCount);
        localStorage.setItem('neoays_v_count', newCount.toString());
        setTimeout(() => setShowThanks(false), 3000);

        // In a real implementation, you would submit this to a backend
        // Result handled by feature manager
    };

    // Helper to find specific link types
    const whatsappLink = profileData.links?.find(l => l.title.toLowerCase().includes('whatsapp') || l.url.includes('wa.me'))?.url || `https://wa.me/${profileData.mobileNumber?.replace(/\D/g, '')}`;
    const websiteLink = profileData.links?.find(l => l.title.toLowerCase().includes('website') || l.url.includes('http'))?.url || '#';
    const locationLink = profileData.links?.find(l => l.title.toLowerCase().includes('location') || l.title.toLowerCase().includes('map') || l.url.includes('goo.gl'))?.url || '#';

    // Mock Gallery since we don't have it in DB yet
    const galleryImages = [
        "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80"
    ];

    return (
        <div className="glass-profile-body" data-theme={mode} dir={lang === 'ar' ? 'rtl' : 'ltr'}>

            {/* Fullscreen Overlay */}
            {overlayImage && (
                <div className="gallery-overlay animate-fade-in" onClick={() => setOverlayImage(null)}>
                    <span className="close">&times;</span>
                    <img src={overlayImage} alt="Fullscreen" />
                </div>
            )}

            <div className="main-grid">

                {/* Profile Header Card */}
                <div className="glass-card span-full">
                    <div className="profile-header">
                        <img
                            src={profileData.photoURL || `https://ui-avatars.com/api/?name=${profileData.username}&size=128&background=random`}
                            className="p-img"
                            alt={profileData.username}
                        />
                        <div className="profile-info">
                            <h1>{lang === 'en' ? t.title.en : t.title.ar}</h1>
                            <p>{lang === 'en' ? t.subtitle.en : t.subtitle.ar}</p>
                        </div>
                    </div>
                    <div className="actions">
                        <button className="btn btn-s" onClick={toggleLang}>
                            {lang === 'en' ? 'العربية' : 'English'}
                        </button>
                        <button className="btn btn-s" onClick={toggleMode}>
                            🌓 {t.mode[lang]}
                        </button>
                        <button className="btn btn-s" onClick={shareProfile} title="Share Profile">
                            🔗 Share
                        </button>
                        <button className="btn btn-p" onClick={saveContact}>
                            {t.save[lang]}
                        </button>
                        <a href={`tel:${profileData.mobileNumber}`} className="btn btn-p">
                            {t.call[lang]}
                        </a>
                    </div>
                </div>

                {/* Quick Connect */}
                <div className="glass-card">
                    <div className="sect-title">{t.connect[lang]}</div>
                    <div className="grid-3">
                        <a href={whatsappLink} target="_blank" rel="noreferrer" className="nav-item">
                            <img src="https://cdn-icons-png.flaticon.com/512/3670/3670051.png" alt="WhatsApp" />
                            <span>{t.whatsapp[lang]}</span>
                        </a>
                        <a href={websiteLink} target="_blank" rel="noreferrer" className="nav-item">
                            <img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" alt="Website" />
                            <span>{t.website[lang]}</span>
                        </a>
                        <a href={locationLink} target="_blank" rel="noreferrer" className="nav-item">
                            <img src="https://cdn-icons-png.flaticon.com/512/854/854878.png" alt="Location" />
                            <span>{t.location[lang]}</span>
                        </a>
                    </div>
                </div>

                {/* Rating */}
                <div className="glass-card">
                    <div className="sect-title">{t.rate[lang]}</div>
                    <div className="stars" onClick={() => window.open(`https://www.google.com/search?q=${profileData.username}+reviews`, '_blank')}>
                        ★ ★ ★ ★ ★
                    </div>
                    <p style={{ fontSize: '0.75rem', opacity: 0.7, textAlign: 'center' }}>
                        {t.rate_sub[lang]}
                    </p>
                </div>

                {/* Survey */}
                <div className="glass-card span-2">
                    <div className="sect-title">
                        <span>{t.q[lang]}</span>
                        <span style={{ opacity: 0.4 }}>{surveyCount}/5</span>
                    </div>
                    <div className="survey-grid">
                        {[
                            { en: "Doctor", ar: "طبيب" },
                            { en: "Flyer", ar: "مطوية" },
                            { en: "Hospital", ar: "مستشفى" },
                            { en: "WhatsApp", ar: "واتساب" },
                            { en: "Instagram", ar: "انستجرام" },
                            { en: "Google Maps", ar: "خرائط جوجل" },
                            { en: "Friends", ar: "أصدقاء" },
                            { en: "Other", ar: "آخر" }
                        ].map((option) => (
                            <div
                                key={option.en}
                                className={`survey-btn ${surveyAnswer === option.en ? 'active' : ''}`}
                                onClick={() => handleSurvey(option.en)}
                            >
                                <span className={lang === 'ar' ? 'ar' : 'en'}>
                                    {lang === 'ar' ? option.ar : option.en}
                                </span>
                            </div>
                        ))}
                    </div>
                    {showThanks && <div id="thanks">✓ Thank you! Submission recorded.</div>}
                </div>

                {/* Media Gallery */}
                <div className="glass-card">
                    <div className="sect-title">{t.media[lang]}</div>
                    <div className="v-cont">
                        <iframe src="https://www.youtube.com/embed/Mp8lkKFm2T4" title="Video" allowFullScreen></iframe>
                    </div>
                    <div className="gal">
                        {(profileData.vouchers && profileData.vouchers.length > 0 ? profileData.vouchers.map(v => v.imageUrl || `https://via.placeholder.com/100?text=Offer`) : galleryImages).slice(0, 4).map((img, i) => (
                            <img
                                key={i}
                                src={img}
                                onClick={() => setOverlayImage(img)}
                                alt="Gallery"
                                onError={(e) => { (e.target as HTMLImageElement).src = `https://via.placeholder.com/100?text=IMG` }}
                            />
                        ))}
                    </div>
                    <p style={{ fontSize: '0.6rem', opacity: 0.5, marginTop: '8px', textAlign: 'center' }}>
                        Tap photo to enlarge
                    </p>
                </div>

                {/* Branding Footer */}
                <div className="span-full flex justify-center py-6 opacity-40 hover:opacity-100 transition-opacity">
                    <a href="https://neoays.com" target="_blank" rel="noreferrer" className="flex items-center gap-2">
                        <img
                            src="https://neoays.com/assets/logo.png"
                            alt="Neoays"
                            className="h-4 w-auto"
                            style={{ filter: mode === 'light' ? 'brightness(0)' : 'brightness(0) invert(1)' }}
                        />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-inherit">Powered by Neoays</span>
                    </a>
                </div>

            </div>
        </div>
    );
};

export default GlassProfile;
