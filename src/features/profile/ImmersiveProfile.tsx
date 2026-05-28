import React, { useState } from 'react';
import { UserProfile } from '../../types';
import './ImmersiveProfile.css';
import LinkRenderer from '../../components/LinkRenderer';

interface ImmersiveProfileProps {
    profileData: UserProfile;
    isLoading?: boolean;
}

const ImmersiveProfile: React.FC<ImmersiveProfileProps> = ({ profileData, isLoading = false }) => {
    const [editMode, setEditMode] = useState(false);

    // Mock data fallback if fields are missing (for dev preview)
    const bgImage = profileData.coverURL || profileData.photoURL || "https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=1000&q=80";

    return (
        <div className="immersive-container">
            {/* Main Section - Identity */}
            <section className="immersive-section" style={{ backgroundImage: `url(${bgImage})` }}>
                <div className="immersive-overlay">
                    <div className="profile-identity">
                        <h1 className={isLoading ? 'shimmer rounded-lg min-h-[50px] w-full mb-4' : ''}>
                            {profileData.displayName || profileData.username}
                        </h1>
                        {profileData.designation && (
                            <span className={`designation ${isLoading ? 'shimmer inline-block min-h-[24px] w-48' : ''}`}>
                                {isLoading ? '' : profileData.designation}
                            </span>
                        )}
                        <p className={`bio-text ${isLoading ? 'shimmer block min-h-[60px] w-full mt-4' : ''}`}>
                            {isLoading ? '' : profileData.bio}
                        </p>
                    </div>

                    <div className="immersive-actions">
                        {profileData.mobileNumber && (
                            <a href={`tel:${profileData.mobileNumber}`} className="action-btn primary">
                                📞 {isLoading ? 'Loading...' : 'Call Now'}
                            </a>
                        )}
                        <button className="action-btn" onClick={() => window.open(`vcardUrl...`)}>
                            💾 Save Contact
                        </button>
                    </div>

                    {/* Unified Link Renderer */}
                    <div className="mt-8 w-full max-w-lg">
                        <LinkRenderer
                            links={profileData.links || []}
                            primaryStyle="grid"
                        />
                    </div>
                </div>
            </section>

            {/* Second Section - Work Experience & Linked Profiles (Only if data exists) */}
            {(profileData.workExperience?.length || profileData.linkedProfiles?.length) ? (
                <section className="immersive-section" style={{
                    backgroundColor: '#111',
                    backgroundImage: 'radial-gradient(circle at 10% 20%, rgb(30, 30, 30) 0%, rgb(0, 0, 0) 90.2%)'
                }}>
                    <div className="immersive-overlay" style={{ height: '100%', justifyContent: 'center' }}>

                        {/* Work Experience */}
                        {profileData.workExperience && profileData.workExperience.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold mb-4">Work History</h2>
                                <div className="experience-timeline">
                                    {profileData.workExperience.map((exp, i) => (
                                        <div key={i} className="exp-card">
                                            <img
                                                src={exp.logoUrl || `https://ui-avatars.com/api/?name=${exp.companyName}&background=random`}
                                                alt={exp.companyName}
                                                className="exp-logo"
                                            />
                                            <div className="exp-details">
                                                <div className="exp-role">{exp.role}</div>
                                                <div className="exp-company">
                                                    {exp.companyName}
                                                    {exp.country && <span className="country-flag">{exp.country}</span>} {/* Can replace with Emoji Flag map */}
                                                </div>
                                                <div className="text-xs opacity-50 mt-1">
                                                    {exp.startDate || 'N/A'} — {exp.isCurrent ? 'Present' : exp.endDate}
                                                </div>
                                            </div>
                                            {exp.isCurrent && <span className="current-badge">Current</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Linked Profiles */}
                        {profileData.linkedProfiles && profileData.linkedProfiles.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Connected Profiles</h2>
                                <div className="linked-profiles-row">
                                    {profileData.linkedProfiles.map((link, i) => (
                                        <div key={i} className="linked-profile" onClick={() => window.location.href = `/p/${link.profileId}`}>
                                            <img
                                                src={link.avatarUrl || `https://ui-avatars.com/api/?name=${link.name}`}
                                                alt={link.name}
                                                className="linked-avatar"
                                            />
                                            <span className="linked-name">{link.name}</span>
                                            <span className="linked-relation">{link.relation}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </section>
            ) : null}

            {/* Gallery Section Placeholder (could be 3rd slide) */}
            <section className="immersive-section" style={{
                backgroundColor: '#050505',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <h2 className="text-3xl font-light opacity-50">Gallery Coming Soon</h2>
            </section>

        </div>
    );
};

export default ImmersiveProfile;
