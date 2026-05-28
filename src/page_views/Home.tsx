import React, { useState, lazy, Suspense } from 'react';
import { UserIcon, GiftIcon, ShoppingBagIcon, QrcodeIcon, ArrowRightIcon } from '../components/Icons';
import neoaysLogo from '../assets/neoays-logo.svg';

// Lazy load heavy 3D globe component
const GlobeMap = lazy(() => import('../components/GlobeMap'));

const Home = () => {
    const [lang, setLang] = useState<'en' | 'ar'>('en');
    const [showGlobe, setShowGlobe] = useState(false);

    const toggleLang = () => {
        setLang(prev => prev === 'en' ? 'ar' : 'en');
    };

    const navigateToApp = () => {
        window.location.hash = '#/app';
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden selection:bg-indigo-500 selection:text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>

            {/* Sticky Minimal Nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/20 transition-all duration-300">
                <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <img src={neoaysLogo} alt="Neoays" className="h-8 w-auto" />
                        {/* Text removed as requested */}
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={toggleLang} className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 transition-colors">
                            {lang === 'en' ? 'Arabic' : 'English'}
                        </button>
                        <button
                            onClick={() => window.location.hash = '#/login'}
                            className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-indigo-600 transition-colors"
                        >
                            Sign In
                        </button>
                        <button
                            onClick={navigateToApp}
                            className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-95"
                        >
                            {lang === 'en' ? 'Launch App' : 'ابدأ التطبيق'}
                        </button>
                    </div>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section className="relative pt-40 pb-32 px-6 overflow-hidden">
                <div className="max-w-[1400px] mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 backdrop-blur-sm border border-white/50 shadow-sm mb-10 animate-fade-in-down hover:scale-105 transition-transform cursor-default">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                            {lang === 'en' ? 'The Future of Networking' : 'مستقبل التواصل'}
                        </span>
                    </div>

                    <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-8 text-slate-900 leading-[0.9] animate-fade-in-up">
                        Your Digital Identity.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-gradient-x">Reimagined.</span>
                    </h1>

                    <p className="text-lg md:text-2xl text-slate-500 font-medium max-w-3xl mx-auto mb-14 leading-relaxed animate-fade-in-up delay-100">
                        {lang === 'en'
                            ? 'The all-in-one platform for professionals and businesses. Connect, engage, and grow with a powerful suite of digital tools designed for the modern era.'
                            : 'المنصة الشاملة للمحترفين والشركات. تواصل، تفاعل، ونمو مع مجموعة قوية من الأدوات الرقمية المصممة للعصر الحديث.'}
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-5 animate-fade-in-up delay-200">
                        <button
                            onClick={navigateToApp}
                            className="h-14 px-10 bg-indigo-600 text-white rounded-full font-bold text-sm tracking-wide hover:translate-y-[-2px] hover:shadow-xl hover:shadow-indigo-500/40 transition-all flex items-center gap-2 group"
                        >
                            Get Started
                            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button className="h-14 px-10 bg-white text-slate-900 border border-slate-200 rounded-full font-bold text-sm tracking-wide hover:bg-slate-50 hover:border-slate-300 transition-colors">
                            View Demo
                        </button>
                    </div>
                </div>

                {/* Aurora Background Effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-300/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
                <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-purple-300/20 rounded-full blur-[100px] pointer-events-none animate-float"></div>
                <div className="absolute top-[30%] left-[-10%] w-[500px] h-[500px] bg-pink-300/20 rounded-full blur-[100px] pointer-events-none animate-float" style={{ animationDelay: '2s' }}></div>

                {/* Grain Overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
            </section>

            {/* BENTO GRID FEATURES */}
            <section className="py-24 px-6 relative">
                <div className="absolute inset-0 bg-slate-50/50 skew-y-3 transform origin-top-left -z-10"></div>
                <div className="max-w-[1400px] mx-auto">
                    <div className="mb-16 text-center">
                        <span className="text-indigo-600 font-bold uppercase tracking-widest text-xs mb-3 block">Features</span>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Everything you need.</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(320px,auto)]">
                        {/* Featured: nProfile */}
                        <div className="md:col-span-2 bg-white rounded-[2.5rem] p-8 md:p-14 border border-white/60 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500 relative overflow-hidden group cursor-pointer" onClick={navigateToApp}>
                            <div className="relative z-10 max-w-lg">
                                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-indigo-200">
                                    <UserIcon className="w-7 h-7" />
                                </div>
                                <h3 className="text-4xl font-black mb-6 tracking-tight text-slate-900">nProfile</h3>
                                <p className="text-slate-500 font-medium text-xl mb-10 leading-relaxed">
                                    The only link you'll ever need. Aggregate your entire digital presence into one stunning, shareable profile.
                                </p>
                                <span className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-indigo-600 group-hover:gap-4 transition-all">
                                    Create Profile <ArrowRightIcon className="w-4 h-4" />
                                </span>
                            </div>
                            {/* Abstract Decor */}
                            <div className="absolute right-[-15%] top-[-10%] w-[450px] h-[450px] bg-gradient-to-br from-indigo-100 to-blue-50 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000 opacity-60"></div>
                            <div className="absolute right-[5%] bottom-[10%] opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100 transform translate-y-4 group-hover:translate-y-0">
                                <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/50">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-xl">🚀</div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-900">Profile Visits</p>
                                            <p className="text-lg font-black text-indigo-600">+124%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feature: nCard */}
                        <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group cursor-pointer hover:-translate-y-2 transition-transform duration-500">
                            <div className="relative z-10">
                                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md border border-white/10">
                                    <QrcodeIcon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-3xl font-black mb-4 tracking-tight">nCard</h3>
                                <p className="text-slate-400 font-medium mb-8 text-base leading-relaxed">
                                    Smart NFC & QR business cards. Share instantly, eco-friendly.
                                </p>
                            </div>
                            <div className="absolute bottom-0 right-0 w-48 h-48 bg-purple-600 rounded-full blur-[80px] opacity-60 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute top-0 right-0 p-8 opacity-20">
                                <QrcodeIcon className="w-40 h-40" />
                            </div>
                        </div>

                        {/* Feature: nClaim */}
                        <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-[2.5rem] p-8 md:p-12 border border-pink-100/50 shadow-xl shadow-pink-100/50 hover:-translate-y-2 transition-transform duration-500 group relative overflow-hidden">
                            <div className="w-14 h-14 bg-white text-pink-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-pink-100">
                                <GiftIcon className="w-7 h-7" />
                            </div>
                            <h3 className="text-3xl font-black mb-4 text-slate-900 tracking-tight">nClaim</h3>
                            <p className="text-slate-600 font-medium text-base leading-relaxed">
                                Boost loyalty with smart vouchers. Engage customers like never before.
                            </p>
                            <div className="absolute bottom-[-20%] right-[-20%] w-[300px] h-[300px] bg-pink-200/40 rounded-full blur-[60px] group-hover:scale-125 transition-transform duration-700"></div>
                        </div>

                        {/* Feature: nShop */}
                        <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-8 md:p-14 text-white shadow-xl shadow-indigo-200/50 hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10 relative z-10">
                                <div className="max-w-md">
                                    <div className="w-14 h-14 bg-white/20 text-white rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md border border-white/20">
                                        <ShoppingBagIcon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-4xl font-black mb-6 tracking-tight">nShop</h3>
                                    <p className="text-indigo-100 font-medium text-xl leading-relaxed">
                                        Launch your store in minutes. Sell products, manage inventory, and accept payments seamlessly.
                                    </p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-xl transform md:rotate-3 hover:rotate-0 transition-transform duration-500 w-full md:w-auto">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100"></div>
                                        <div className="space-y-2">
                                            <div className="h-2 w-24 bg-slate-200 rounded-full"></div>
                                            <div className="h-2 w-16 bg-slate-100 rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="h-24 w-full md:w-56 bg-slate-50 rounded-lg mb-4"></div>
                                    <div className="flex justify-between items-center">
                                        <div className="h-3 w-16 bg-slate-200 rounded-full"></div>
                                        <div className="h-8 w-16 bg-indigo-600 rounded-lg"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* GLOBAL NETWORK */}
            <section className="py-32 px-6 bg-slate-950 text-white overflow-hidden relative">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
                <div className="max-w-[1400px] mx-auto text-center relative z-10">
                    <span className="text-indigo-500 font-bold uppercase tracking-widest text-xs mb-4 block animate-fade-in">Unlimited Connections</span>
                    <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500">Global Network</h2>
                    <p className="text-slate-400 text-lg mb-16 max-w-2xl mx-auto">Join a thriving community of professionals and businesses from around the world.</p>

                    <div className="h-[700px] w-full bg-slate-900/50 rounded-[3rem] overflow-hidden shadow-2xl border border-slate-800 relative group backdrop-blur-sm">
                        {showGlobe ? (
                            <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>}>
                                <GlobeMap onSelectProfile={(username) => {
                                    window.history.pushState(null, '', `/${username}`);
                                    window.dispatchEvent(new Event('popstate'));
                                }} />
                            </Suspense>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full">
                                <div className="text-6xl mb-6">🌍</div>
                                <button
                                    onClick={() => setShowGlobe(true)}
                                    className="px-8 py-4 bg-indigo-600 text-white rounded-full font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30"
                                >
                                    Explore Global Network
                                </button>
                                <p className="mt-4 text-slate-500 text-sm">Click to load interactive 3D globe</p>
                            </div>
                        )}
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                    </div>
                </div>
                {/* Background lighting */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none"></div>
            </section>

            {/* CALL TO ACTION */}
            <section className="py-32 px-6 bg-slate-50">
                <div className="max-w-5xl mx-auto bg-black text-white rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl skew-y-1">
                    <div className="relative z-10 skew-y-[-1deg]">
                        <h2 className="text-5xl md:text-7xl font-black mb-10 tracking-tighter">Ready to start?</h2>
                        <button
                            onClick={navigateToApp}
                            className="h-16 px-12 bg-white text-black rounded-full font-black text-lg tracking-wide hover:scale-105 transition-transform hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                        >
                            Create Your Profile
                        </button>
                    </div>
                    {/* Abstract Shine */}
                    <div className="absolute top-[-50%] left-[-20%] w-[600px] h-[600px] bg-indigo-500/30 rounded-full blur-[100px] animate-pulse-slow"></div>
                    <div className="absolute bottom-[-50%] right-[-20%] w-[600px] h-[600px] bg-purple-500/30 rounded-full blur-[100px] animate-pulse-slow"></div>
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-white py-16 border-t border-slate-100">
                <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3">
                        <img src={neoaysLogo} alt="Neoays" className="h-6 w-auto grayscale opacity-40 hover:opacity-100 hover:grayscale-0 transition-all duration-300" />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">© 2026 Neoays</span>
                    </div>
                    <div className="flex gap-10">
                        <button className="text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-colors">Privacy</button>
                        <button className="text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-colors">Terms</button>
                        <button className="text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-colors">Support</button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
