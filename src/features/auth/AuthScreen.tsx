import React from 'react';
import { UserIcon, SpinnerIcon, CheckCircleIcon, LockIcon, GoogleIcon, EyeIcon, EyeSlashIcon } from '../../components/Icons';
import WhatsAppButton from '../../components/WhatsAppButton';
import { ALL_COUNTRY_CODES } from '../../constants/countryCodes';

const AuthScreen = ({
    identifier, setIdentifier,
    password, setPassword,
    showPassword, setShowPassword,
    authMode, status,
    isLoading, notification,
    handleUnifiedAuth,
    handleGoogleSignIn,
    handleForgotPassword,
    setAuthMode
}: any) => {
    const detectedCountry = identifier.startsWith('+')
        ? ALL_COUNTRY_CODES.find(c => identifier.startsWith(c.code))
        : null;

    const betaMessage = "I'm checking out Neoays and want to learn more about the fully functional page in beta.";

    const Divider = () => (
        <div className="my-3 flex items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="mx-3 flex-shrink text-[9px] font-black text-slate-400 uppercase tracking-widest">OR</span>
            <div className="flex-grow border-t border-slate-200"></div>
        </div>
    );

    return (
        <div className="w-full max-w-sm mx-auto p-2">
            {notification && (
                <div className={`p-3 mb-4 text-xs rounded-xl font-bold shadow-sm text-center animate-fade-in-down ${notification.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'
                    }`} role="alert">
                    {notification.message}
                </div>
            )}

            <div className="glass-effect rounded-[28px] premium-shadow p-6 transition-all duration-500 overflow-hidden relative hover:scale-[1.01] hover:shadow-2xl animate-float">
                <style>{`
                    @keyframes float {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-10px); }
                    }
                    .animate-float {
                        animation: float 6s ease-in-out infinite;
                    }
                `}</style>
                <div className="text-center mb-6">
                    <h2 className="text-xl font-black text-slate-900 mb-0.5 tracking-tight">Identity Hub</h2>
                    <div className="flex justify-center items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${authMode === 'login' ? 'bg-indigo-500' : 'bg-green-500'} animate-pulse`}></span>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                            {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleUnifiedAuth} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="block text-[9px] font-black text-slate-500 uppercase ml-1 tracking-wider">Identification</label>
                        <div className="relative group">
                            {detectedCountry ? (
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none h-full text-lg">
                                    {detectedCountry.flag}
                                </div>
                            ) : (
                                <UserIcon className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 h-full w-4 group-focus-within:text-indigo-600 transition-colors" />
                            )}
                            <input
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="Mobile / Email / UserID"
                                className={`w-full rounded-xl border-2 pl-10 p-3.5 text-xs font-semibold placeholder:text-slate-300 transition-all focus:outline-none focus:ring-4 ${status === 'exists' ? 'border-indigo-100 bg-indigo-50/10 focus:border-indigo-400 focus:ring-indigo-400/5' :
                                    status === 'new' ? 'border-green-100 bg-green-50/10 focus:border-green-400 focus:ring-green-400/5' :
                                        'border-slate-100 bg-white focus:border-indigo-500 focus:ring-indigo-500/5'
                                    }`}
                                disabled={isLoading}
                                required
                            />
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                {status === 'checking' && <SpinnerIcon className="animate-spin h-3.5 w-3.5 text-slate-400" />}
                                {status === 'exists' && <CheckCircleIcon className="h-4 w-4 text-indigo-500" />}
                                {status === 'new' && <span className="text-[8px] font-black text-green-600 uppercase tracking-tighter bg-green-50 px-1.5 py-0.5 rounded">New</span>}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-[9px] font-black text-slate-500 uppercase ml-1 tracking-wider">Security Password</label>
                        <div className="relative group">
                            <LockIcon className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 h-full w-4 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full rounded-xl border-2 border-slate-100 bg-white pl-10 pr-10 p-3.5 text-xs font-semibold placeholder:text-slate-300 transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/5"
                                disabled={isLoading}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                                {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full rounded-xl px-4 py-4 text-xs font-black uppercase text-white transition-all duration-300 shadow-lg active:scale-[0.98] disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-[0.22em] ${authMode === 'login' ? 'bg-slate-900 hover:bg-slate-800 shadow-slate-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'}`}
                        >
                            {isLoading ? <SpinnerIcon className="animate-spin h-4 w-4" /> : (authMode === 'login' ? 'Sign In Now' : 'Create Account')}
                        </button>
                    </div>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-slate-900 transition-colors"
                        >
                            {authMode === 'login' ? "New here? Create Account" : "Already have an account? Sign In"}
                        </button>
                    </div>

                    {authMode === 'signup' && (
                        <p className="text-[9px] text-slate-400 text-center font-bold px-4 leading-tight">
                            By creating an account, you agree to our <span className="text-indigo-500 cursor-pointer hover:underline">Privacy Policy</span> and <span className="text-indigo-500 cursor-pointer hover:underline">Terms</span>.
                        </p>
                    )}
                </form>

                <Divider />

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className="flex items-center justify-center rounded-xl bg-white border border-slate-100 px-2 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-500 transition-all duration-300 hover:bg-slate-50 disabled:opacity-50 w-full"
                    >
                        <GoogleIcon className="h-3.5 w-3.5 mr-2" /> Continue with Google
                    </button>

                    <div className="pt-2 border-t border-slate-50 flex flex-col items-center gap-2">
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest text-center">
                            Need a custom solution for your business?
                        </p>
                        <WhatsAppButton message={betaMessage} className="!p-3 !text-[9px] !rounded-xl !bg-slate-50 !border-slate-100 !text-slate-600 hover:!bg-slate-100 !w-full" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthScreen;
