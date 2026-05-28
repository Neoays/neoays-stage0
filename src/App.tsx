import React, { useEffect, useState, lazy, Suspense } from 'react';
import { HelmetProvider } from 'react-helmet-async';

import BrandedLoader from './components/BrandedLoader';

// Lazy load route components for code splitting
const PublicProfileView = lazy(() => import('./page_views/PublicProfileView'));
const MainApplication = lazy(() => import('./layouts/MainApplication'));
const Home = lazy(() => import('./page_views/Home'));
const AdminPortal = lazy(() => import('./features/admin/AdminPortal'));
const OfferClaimView = lazy(() => import('./page_views/OfferClaimView'));
const NSalesPortal = lazy(() => import('./features/nsales/NSalesPortal'));
const QRRedirectPage = lazy(() => import('./page_views/QRRedirectPage'));
const StaffRedemptionPortal = lazy(() => import('./page_views/StaffRedemptionPortal'));

// Minimal loading fallback - fades in only if load takes time
const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin opacity-50"></div>
    </div>
);

export default function App() {
    return (
        <HelmetProvider>
            <Suspense fallback={<LoadingFallback />}>
                <AppContent />
            </Suspense>
        </HelmetProvider>
    );
}

function AppContent() {
    const [route, setRoute] = useState<{
        view: 'loading' | 'home' | 'app' | 'public' | 'offer' | 'admin' | 'ndeal' | 'nmenu' | 'nshop' | 'nreview' | 'nwallet' | 'nbusiness' | 'nconnect' | 'nsales' | 'qr' | 'ngame' | 'staff_redeem',
        params: { username?: string, offerId?: string, qrId?: string, staffUsername?: string } | null
    }>({ view: 'loading', params: null });

    const handleRouteChange = () => {
        const hash = window.location.hash;
        const path = window.location.pathname;

        // Match offer: #/offer/MERCHANT_ID/OFFER_ID OR /offer/MERCHANT_ID/OFFER_ID
        // But ONLY if the hash isn't pointing somewhere else (e.g. #/app after a successful claim)
        const hashIsAppRoute = hash.startsWith('#/app') || hash.startsWith('#/login') || hash.startsWith('#/dashboard') || hash.startsWith('#/ndeal') || hash.startsWith('#/nmenu') || hash.startsWith('#/nshop') || hash.startsWith('#/nreview') || hash.startsWith('#/nwallet') || hash.startsWith('#/nbusiness') || hash.startsWith('#/nconnect') || hash.startsWith('#/nsales') || hash.startsWith('#/ngame');
        const offerMatch = !hashIsAppRoute && (hash.startsWith('#/offer/') || path.startsWith('/offer/'));

        // Match public profile: #/@username OR #/username OR /username
        // Updated regex to allow query parameters (e.g. ?action=survey)
        const hashUsernameWithAt = hash.match(/^#\/@([a-z0-9-]+)(\?.*)?$/);
        const hashUsernameNoAt = hash.match(/^#\/([a-z0-9-]+)(\?.*)?$/);

        // Path match: anything that isn't reserved
        const isReservedPath = path === '/' || path.startsWith('/app') || path.startsWith('/login') || path.startsWith('/offer') || path.startsWith('/admin') || path.startsWith('/ndeal') || path.startsWith('/nmenu') || path.startsWith('/nshop') || path.startsWith('/nreview') || path.startsWith('/nwallet') || path.startsWith('/nbusiness') || path.startsWith('/nconnect') || path.startsWith('/nsales') || path.startsWith('/qr') || path.startsWith('/ngame') || path.startsWith('/redeem');
        const isReservedHash = hash.startsWith('#/app') || hash.startsWith('#/login') || hash.startsWith('#/dashboard') || hash.startsWith('#/admin') || hash.startsWith('#/offer') || hash.startsWith('#/ndeal') || hash.startsWith('#/nmenu') || hash.startsWith('#/nshop') || hash.startsWith('#/nreview') || hash.startsWith('#/nwallet') || hash.startsWith('#/nbusiness') || hash.startsWith('#/nconnect') || hash.startsWith('#/nsales') || hash.startsWith('#/qr') || hash.startsWith('#/ngame');

        const usernameMatch = (hashUsernameWithAt ? hashUsernameWithAt[1] : (hashUsernameNoAt && !isReservedHash ? hashUsernameNoAt[1] : null));

        // Improved Path Match: Handles /username and /@username
        let pathMatch = !isReservedPath && path.length > 1 ? path.substring(1) : null;
        if (pathMatch && pathMatch.startsWith('@')) {
            pathMatch = pathMatch.substring(1);
        }
        // Remove query params from path match if present
        if (pathMatch && pathMatch.includes('?')) {
            pathMatch = pathMatch.split('?')[0];
        }

        if (hash === '#/admin' || path === '/admin') {
            setRoute({ view: 'admin', params: null });
        } else if (hash.startsWith('#/nsales') || path.startsWith('/nsales')) {
            setRoute({ view: 'nsales', params: null });
        } else if (path.startsWith('/redeem/@') || path.startsWith('/redeem/')) {
            // Staff redemption portal: /redeem/@username or /redeem/username
            const raw = path.replace('/redeem/', '').replace('@', '').split('?')[0];
            setRoute({ view: 'staff_redeem', params: { staffUsername: raw } });
        } else if (hash.startsWith('#/qr/') || path.startsWith('/qr/')) {
            // Extract QR ID from path
            const qrId = hash.startsWith('#/qr/') ? hash.replace('#/qr/', '') : path.replace('/qr/', '');
            setRoute({ view: 'qr', params: { qrId: qrId.toUpperCase() } });
        } else if (hash.startsWith('#/ndeal') || path.startsWith('/ndeal')) {
            setRoute({ view: 'ndeal', params: null });
        } else if (hash.startsWith('#/nmenu') || path.startsWith('/nmenu')) {
            setRoute({ view: 'nmenu', params: null });
        } else if (hash.startsWith('#/nshop') || path.startsWith('/nshop')) {
            setRoute({ view: 'nshop', params: null });
        } else if (hash.startsWith('#/nreview') || path.startsWith('/nreview')) {
            setRoute({ view: 'nreview', params: null });
        } else if (hash.startsWith('#/nwallet') || path.startsWith('/nwallet')) {
            setRoute({ view: 'nwallet', params: null });
        } else if (hash.startsWith('#/nbusiness') || path.startsWith('/nbusiness')) {
            setRoute({ view: 'nbusiness', params: null });
        } else if (hash.startsWith('#/nconnect') || path.startsWith('/nconnect')) {
            setRoute({ view: 'nconnect', params: null });
        } else if (hash.startsWith('#/ngame') || path.startsWith('/ngame')) {
            setRoute({ view: 'ngame', params: null });
        } else if (hash.startsWith('#/app') || hash.startsWith('#/login') || hash.startsWith('#/dashboard') || path.startsWith('/app')) {
            // App (Login/Dashboard)
            setRoute({ view: 'app', params: null });
        } else if (offerMatch) {
            setRoute({ view: 'offer', params: null });
        } else if (usernameMatch) {
            setRoute({ view: 'public', params: { username: usernameMatch } });
        } else if (pathMatch) {
            setRoute({ view: 'public', params: { username: pathMatch } });
        } else {
            // Default to Home
            setRoute({ view: 'home', params: null });
        }
    };

    useEffect(() => {
        handleRouteChange();
        window.addEventListener('hashchange', handleRouteChange);
        window.addEventListener('popstate', handleRouteChange);
        return () => {
            window.removeEventListener('hashchange', handleRouteChange);
            window.removeEventListener('popstate', handleRouteChange);
        };
    }, []);

    if (route.view === 'loading') {
        return <LoadingFallback />;
    }

    if (route.view === 'admin') {
        return (
            <Suspense fallback={<LoadingFallback />}>
                <AdminPortal />
            </Suspense>
        );
    }

    if (route.view === 'offer') {
        return (
            <Suspense fallback={<LoadingFallback />}>
                <OfferClaimView />
            </Suspense>
        );
    }

    if (route.view === 'nsales') {
        return (
            <Suspense fallback={<LoadingFallback />}>
                <NSalesPortal />
            </Suspense>
        );
    }

    if (route.view === 'qr' && route.params?.qrId) {
        return (
            <Suspense fallback={<LoadingFallback />}>
                <QRRedirectPage qrId={route.params.qrId} />
            </Suspense>
        );
    }

    if (route.view === 'staff_redeem' && route.params?.staffUsername) {
        return (
            <Suspense fallback={<LoadingFallback />}>
                <StaffRedemptionPortal businessUsername={route.params.staffUsername} />
            </Suspense>
        );
    }

    if (route.view === 'public' && route.params?.username) {
        return (
            <Suspense fallback={<LoadingFallback />}>
                <PublicProfileView username={route.params.username} />
            </Suspense>
        );
    }

    if (route.view === 'app' || route.view === 'ndeal' || route.view === 'nmenu' || route.view === 'nshop' || route.view === 'nreview' || route.view === 'nwallet' || route.view === 'nbusiness' || route.view === 'nconnect' || route.view === 'ngame') {
        return (
            <Suspense fallback={<LoadingFallback />}>
                <div className="min-h-screen w-full bg-slate-50 text-slate-900 font-sans">
                    <MainApplication route={route} />
                </div>
            </Suspense>
        );
    }

    // Default: Home
    return (
        <Suspense fallback={<LoadingFallback />}>
            <Home />
        </Suspense>
    );
}
