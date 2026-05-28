import { UserProfile } from '../../types';
import { Theme } from '../../types/theme';
import { EnvelopeIcon, GlobeIcon } from '../Icons';
import { useLanguage } from '../../LanguageContext';
import { UserLink } from '../../types';
import LinkRenderer from '../LinkRenderer';
import GallerySection from '../GallerySection';

interface NgoLayoutProps {
    profileData: UserProfile;
    theme: Theme;
    isLoading?: boolean;
}

const NgoLayout: React.FC<NgoLayoutProps> = ({ profileData, theme, isLoading = false }) => {
    const { colors, typography, layout } = theme;

    const styles = {
        container: {
            minHeight: '100vh',
            backgroundColor: colors.background,
            color: colors.text,
            fontFamily: typography.fontFamily,
        },
        hero: {
            background: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), ${colors.primary}`, // Fallback if no image
            minHeight: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center' as const,
            padding: '4rem 2rem',
            color: 'white',
            position: 'relative' as const,
        },
        heroContent: {
            maxWidth: '800px',
            position: 'relative' as const,
            zIndex: 10,
        },
        profileImage: {
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            marginBottom: '1.5rem',
            border: '4px solid rgba(255,255,255,0.3)',
        },
        missionCard: {
            maxWidth: '900px',
            margin: '-3rem auto 3rem',
            padding: layout.spacing.xl,
            backgroundColor: 'white',
            borderRadius: layout.borderRadius.lg,
            boxShadow: layout.shadow.lg,
            position: 'relative' as const,
            zIndex: 20,
            textAlign: 'center' as const,
        },
        actionButton: {
            display: 'inline-block',
            padding: '1rem 2.5rem',
            backgroundColor: colors.accent,
            color: 'white',
            borderRadius: '50px',
            fontWeight: 'bold',
            fontSize: typography.fontSize.lg,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'all 0.2s',
            cursor: 'pointer',
            border: 'none',
            margin: '0.5rem',
        },
        secondaryButton: {
            display: 'inline-block',
            padding: '1rem 2.5rem',
            backgroundColor: 'transparent',
            color: colors.primary,
            border: `2px solid ${colors.primary}`,
            borderRadius: '50px',
            fontWeight: 'bold',
            fontSize: typography.fontSize.lg,
            transition: 'all 0.2s',
            cursor: 'pointer',
            margin: '0.5rem',
        },
        grid: {
            maxWidth: '1000px',
            margin: '0 auto 4rem',
            padding: '0 1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: layout.spacing.xl,
        },
        sectionTitle: {
            fontSize: typography.fontSize['2xl'],
            fontFamily: typography.headingFont,
            color: colors.text,
            marginBottom: layout.spacing.lg,
            textAlign: 'center' as const,
        },
        linkCard: {
            padding: '1.5rem',
            backgroundColor: colors.surface,
            borderRadius: layout.borderRadius.md,
            borderLeft: `4px solid ${colors.secondary}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textDecoration: 'none',
            color: colors.text,
            transition: 'transform 0.2s',
        }
    };

    const { language, dir } = useLanguage();
    const isAr = language === 'ar';

    return (
        <div style={styles.container} className={`antialiased ${isAr ? 'text-right font-arabic' : 'text-left'}`} dir={dir}>
            {/* Hero Section */}
            <div style={styles.hero}>
                {profileData.photoURL && (
                    <div className="absolute inset-0 z-0">
                        <img
                            src={profileData.photoURL}
                            alt="Background"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3 }}
                        />
                    </div>
                )}
                <div style={styles.heroContent}>
                    {(profileData.photoURL || isLoading) && (
                        <div className="flex justify-center">
                            <div style={styles.profileImage} className={isLoading ? 'shimmer' : ''} />
                        </div>
                    )}
                    <h1 style={{ fontSize: typography.fontSize['4xl'], fontFamily: typography.headingFont, fontWeight: 'bold', marginBottom: '1rem' }} className={isLoading ? 'shimmer rounded-lg min-h-[60px] w-2/3 mx-auto' : ''}>
                        {profileData.displayName}
                    </h1>
                    {profileData.categories && profileData.categories.length > 0 && (
                        <span className="inline-block px-4 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white mb-4">
                            {profileData.categories[0]}
                        </span>
                    )}
                </div>
            </div>

            {/* Mission / Bio Card */}
            <div style={styles.missionCard}>
                <div className="flex justify-center mb-4">
                    <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-gray-200">
                        {profileData.profileType?.replace('_', ' ') || 'NGO / Charity'}
                    </span>
                </div>

                {profileData.ngoDetails?.bloodDonationCount !== undefined && profileData.ngoDetails.bloodDonationCount > 0 && (
                    <div className="mb-6 flex flex-col items-center">
                        <div className="text-4xl mb-2 animate-bounce-subtle">🩸</div>
                        <div className="text-2xl font-black text-red-600">{profileData.ngoDetails.bloodDonationCount}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-red-400">
                            {isAr ? 'تبرعات الدم المسجلة' : 'Blood Donations Logged'}
                        </div>
                    </div>
                )}

                <h2 style={{ color: colors.primary, fontWeight: 'bold', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.875rem' }}>
                    {isAr ? 'مهمتنا' : 'OUR MISSION'}
                </h2>
                <p style={{ fontSize: typography.fontSize.xl, lineHeight: 1.6, color: colors.text }}>
                    {profileData.bio || (isAr ? "نحن مكرسون لإحداث تأثير إيجابي. انضم إلينا في رحلتنا نحو مستقبل أفضل." : "We are dedicated to making a positive impact. Join us in our journey towards a better future.")}
                </p>
                <div style={{ marginTop: '2rem' }}>
                    <button style={styles.actionButton} className="hover:transform hover:scale-105">
                        {isAr ? '❤️ تبرع الآن' : '❤️ Donate Now'}
                    </button>
                    <button style={styles.secondaryButton} className="hover:bg-gray-50">
                        {isAr ? '🤝 متطوع' : '🤝 Volunteer'}
                    </button>
                </div>
            </div>

            {/* Gallery Section */}
            {profileData.gallery && profileData.gallery.length > 0 && (
                <div style={{ maxWidth: '900px', margin: '0 auto 3rem', padding: '0 1.5rem' }}>
                    <h3 style={styles.sectionTitle}>{isAr ? 'معرض الصور' : 'Gallery'}</h3>
                    <GallerySection gallery={profileData.gallery} primaryColor={colors.primary} />
                </div>
            )}

            {/* Content Grid */}
            <div style={styles.grid}>
                {/* Contact & Info */}
                <div>
                    <h3 style={styles.sectionTitle}>{isAr ? 'تواصل معنا' : 'Get In Touch'}</h3>

                    {isLoading ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="h-20 bg-gray-100 rounded-2xl shimmer"></div>
                                <div className="h-20 bg-gray-100 rounded-2xl shimmer"></div>
                            </div>
                        </div>
                    ) : (
                        <LinkRenderer
                            links={profileData.links || []}
                            isAr={isAr}
                            primaryStyle="grid"
                        />
                    )}

                    <div className="mt-4 space-y-3">
                        {profileData.email && (
                            <div className="flex items-center justify-center p-3 bg-white rounded-lg shadow-sm border border-gray-50">
                                <EnvelopeIcon className={`w-4 h-4 text-gray-400 ${isAr ? 'ml-3' : 'mr-3'}`} />
                                <a href={`mailto:${profileData.email}`} className="text-sm text-gray-700 hover:underline">{profileData.email}</a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Latest Updates / Campaigns (using Vouchers as fallback content structure) */}
                <div>
                    <h3 style={styles.sectionTitle}>{isAr ? 'أحدث الحملات' : 'Latest Campaigns'}</h3>
                    {profileData.vouchers && profileData.vouchers.length > 0 ? (
                        <div className="space-y-4">
                            {profileData.vouchers.map((item: any, idx: number) => (
                                <div key={idx} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    {item.imageUrl && (
                                        <img src={item.imageUrl} alt={item.title} className="w-full h-32 object-cover" />
                                    )}
                                    <div className={`p-4 ${isAr ? 'text-right' : 'text-left'}`}>
                                        <h4 className="font-bold text-lg mb-2">{item.title}</h4>
                                        <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                                        <span className="text-xs font-semibold px-2 py-1 bg-gray-100 rounded text-gray-600">
                                            {isAr ? 'نشط' : 'Active'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            <p className="text-gray-400">{isAr ? 'لا توجد حملات نشطة في الوقت الحالي.' : 'No active campaigns at the moment.'}</p>
                        </div>
                    )}
                </div>
            </div>

            <footer style={{ backgroundColor: colors.surface, padding: '3rem 2rem', textAlign: 'center', marginTop: 'auto' }}>
                <p style={{ color: colors.textSecondary }}>{isAr ? 'معاً يمكننا إحداث فرق.' : 'Together we can make a difference.'}</p>
                <div style={{ marginTop: '1rem', fontWeight: 'bold', color: colors.primary }}>{profileData.displayName}</div>
            </footer>
        </div>
    );
};

export default NgoLayout;
