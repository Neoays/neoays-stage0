import { UserProfile } from '../../types';
import './BentoProfile.css';
import LinkRenderer from '../../components/LinkRenderer';

interface BentoProfileProps {
    profileData: UserProfile;
    isLoading?: boolean;
}

const BentoProfile: React.FC<BentoProfileProps> = ({ profileData, isLoading = false }) => {
    // Gallery from data
    const galleryItems = profileData.gallery || [];

    return (
        <div className="bento-container">
            <div className="bento-grid">

                {/* 1. Identity Block (Span 2x2) */}
                <div className="bento-card span-2-col span-2-row identity-card">
                    <div className={`bento-avatar-container ${isLoading ? 'shimmer' : ''}`} style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto', overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
                        {!isLoading && (
                            <img
                                src={profileData.photoURL || `https://ui-avatars.com/api/?name=${profileData.username}`}
                                alt="Profile"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        )}
                    </div>
                    <h1 className={`bento-name ${isLoading ? 'shimmer rounded-lg min-h-[36px] w-2/3 mx-auto mt-4' : ''}`}>
                        {profileData.displayName || profileData.username}
                    </h1>
                    {(profileData.designation || isLoading) && (
                        <span className={`bento-role ${isLoading ? 'shimmer inline-block min-h-[20px] w-32 mt-2' : ''}`}>
                            {isLoading ? '' : profileData.designation}
                        </span>
                    )}
                    <p style={{ marginTop: '1rem', opacity: 0.7, fontSize: '0.9rem' }} className={isLoading ? 'shimmer block min-h-[40px] w-full' : ''}>
                        {isLoading ? '' : (profileData.bio || "Welcome to my digital space.")}
                    </p>
                    <div className="flex gap-2 justify-center mt-4">
                        <a href={`tel:${profileData.mobileNumber}`} className="contact-chip">Call Me</a>
                        <button className="contact-chip website" onClick={() => alert('Saved!')}>Save</button>
                    </div>
                </div>

                {/* 2. Map Block */}
                <div className="bento-card map-card">
                    <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'white', padding: '4px 8px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 'bold' }}>
                        📍 Dubai, UAE
                    </div>
                </div>

                {/* 3. Work Experience Block (Span 2 Row) */}
                {profileData.workExperience && profileData.workExperience.length > 0 && (
                    <div className="bento-card span-2-row experience-card">
                        <div className="bento-section-title">Work History</div>
                        <div className="exp-mini-list">
                            {profileData.workExperience.slice(0, 4).map((exp, i) => (
                                <div key={i} className="exp-mini-item">
                                    <img
                                        src={exp.logoUrl || `https://ui-avatars.com/api/?name=${exp.companyName}&background=random`}
                                        alt="Logo"
                                        className="exp-mini-logo"
                                    />
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{exp.companyName}</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{exp.role}</div>
                                    </div>
                                    {exp.isCurrent && <span style={{ marginLeft: 'auto', fontSize: '0.6rem', background: 'green', color: 'white', padding: '2px 4px', borderRadius: 4 }}>Now</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 4. Social / Websites Block (Unified) */}
                <div className="bento-card">
                    <div className="bento-section-title">Connect</div>
                    <div className="contact-links w-full">
                        <LinkRenderer
                            links={profileData.links || []}
                            primaryStyle="minimal"
                            secondaryStyle="pills"
                        />
                    </div>
                </div>

                {/* 5. Gallery Block */}
                {galleryItems.length > 0 && (
                    <div className="bento-card span-2-col">
                        <div className="gallery-grid">
                            {galleryItems.slice(0, 2).map((item, i) => (
                                item.type === 'video' ? (
                                    <div key={item.id} className="gallery-video-mini">
                                        <iframe
                                            src={item.url.replace('watch?v=', 'embed/').split('&')[0]}
                                            title="Video"
                                            className="w-full h-full rounded-lg"
                                            frameBorder="0"
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                ) : (
                                    <img key={item.id} src={item.url} className="gallery-img" alt="Gallery" />
                                )
                            ))}
                        </div>
                    </div>
                )}

                {/* 6. Linked Profiles */}
                {profileData.linkedProfiles && (
                    <div className="bento-card span-full" style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem', overflowX: 'auto' }}>
                        <div className="bento-section-title" style={{ minWidth: '80px' }}>People</div>
                        {profileData.linkedProfiles.map((link, i) => (
                            <div key={i} className="flex flex-col items-center min-w-[60px]" onClick={() => window.open(`/p/${link.profileId}`, '_blank')}>
                                <img src={link.avatarUrl || `https://ui-avatars.com/api/?name=${link.name}`} style={{ width: 40, height: 40, borderRadius: '50%' }} alt={link.name} />
                                <span style={{ fontSize: '0.7rem', marginTop: 4 }}>{link.name}</span>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
};

export default BentoProfile;
