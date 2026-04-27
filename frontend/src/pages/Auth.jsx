import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Mail, Lock, User, Eye, EyeOff, ShieldCheck, RefreshCw, ArrowLeft } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

/* ─── OTP Input Component ──────────────────────────────────────────────── */
const OTPInput = ({ otp, setOtp }) => {
    const inputsRef = useRef([]);

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return; // digits only
        const newOtp = otp.split('');
        newOtp[index] = value.slice(-1);
        setOtp(newOtp.join(''));
        if (value && index < 5) inputsRef.current[index + 1]?.focus();
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setOtp(pasted);
            inputsRef.current[5]?.focus();
        }
        e.preventDefault();
    };

    return (
        <div className="flex gap-3 justify-center" onPaste={handlePaste}>
            {Array.from({ length: 6 }).map((_, i) => (
                <input
                    key={i}
                    ref={(el) => (inputsRef.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[i] || ''}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-11 h-14 text-center text-xl font-bold rounded-xl border-2 border-slate-600 bg-slate-800/80 text-white focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/30 transition-all duration-200"
                    autoComplete="one-time-code"
                />
            ))}
        </div>
    );
};

/* ─── Main Auth Page ────────────────────────────────────────────────────── */
const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // OTP step state
    const [step, setStep] = useState('credentials'); // 'credentials' | 'otp'
    const [otpEmail, setOtpEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [resendMsg, setResendMsg] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { login, googleLogin, verifyOTP, resendOTP, register } = useAuth();
    const navigate = useNavigate();

    // Countdown timer for resend
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    /* ── Step 1: credentials ── */
    const handleCredentialSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                const result = await login(email, password);
                if (result.otpSent) {
                    setOtpEmail(result.email);
                    setStep('otp');
                    setCountdown(60); // 60 s before resend
                }
            } else {
                await register(name, email, password);
                setIsLogin(true);
                // Optionally clear password so they have to type it again or just let them click login
                setPassword('');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    /* ── Step 2: OTP ── */
    const handleOTPSubmit = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) {
            setError('Please enter all 6 digits.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await verifyOTP(otpEmail, otp);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
            setOtp('');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (countdown > 0) return;
        setError('');
        setResendMsg('');
        try {
            await resendOTP(otpEmail);
            setOtp('');
            setCountdown(60);
            setResendMsg('✅ New OTP sent! Check your email.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP.');
        }
    };

    const handleBackToLogin = () => {
        setStep('credentials');
        setOtp('');
        setError('');
        setResendMsg('');
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        setLoading(true);
        try {
            await googleLogin(credentialResponse.credential);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Google authentication failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Google Login was unsuccessful. Try again later.');
    };

    /* ── Shared background ── */
    const Background = () => (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-teal-400/20 to-blue-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-purple-500/20 rounded-full blur-3xl" />
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-dark-bg dark:via-slate-900 dark:to-slate-950 transition-colors duration-300 relative overflow-hidden">
            <Background />

            <div className="relative z-10 w-full max-w-md px-4">
                <div className="glass-card p-8 animate-scale shadow-neon">

                    {/* ── Logo ── */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center mx-auto mb-4 shadow-glow">
                            {step === 'otp'
                                ? <ShieldCheck className="w-8 h-8 text-white" />
                                : <span className="text-white font-bold text-2xl">FE</span>
                            }
                        </div>
                        <h1 className="text-3xl font-bold gradient-text mb-2">FriendExpense</h1>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {step === 'otp'
                                ? 'Enter the 6-digit code sent to your email'
                                : isLogin
                                    ? 'Welcome back! Please login to your account.'
                                    : 'Create an account to track expenses with friends.'}
                        </p>
                    </div>

                    {/* ── Error banner ── */}
                    {error && (
                        <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* ══════════════════════════════════════════
                        STEP 1 — Credentials
                    ══════════════════════════════════════════ */}
                    {step === 'credentials' && (
                        <form onSubmit={handleCredentialSubmit} className="space-y-5">
                            {!isLogin && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                        <User className="w-4 h-4 mr-2" /> Full Name
                                    </label>
                                    <input
                                        type="text"
                                        id="reg-name"
                                        className="input-field"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        placeholder="John Doe"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                    <Mail className="w-4 h-4 mr-2" /> Email Address
                                </label>
                                <input
                                    type="email"
                                    id="auth-email"
                                    className="input-field"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                    <Lock className="w-4 h-4 mr-2" /> Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="auth-password"
                                        className="input-field pr-12"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                id="auth-submit"
                                disabled={loading}
                                className="w-full btn-primary mt-6 hover-lift flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        {isLogin ? 'Sending OTP…' : 'Creating Account…'}
                                    </span>
                                ) : isLogin ? (
                                    <><LogIn className="w-5 h-5 mr-2" /> Sign In</>
                                ) : (
                                    <><UserPlus className="w-5 h-5 mr-2" /> Create Account</>
                                )}
                            </button>
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white dark:bg-dark-card text-gray-500">Or continue with</span>
                                </div>
                            </div>
                            <div className="flex justify-center">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={handleGoogleError}
                                    theme="filled_blue"
                                    shape="pill"
                                />
                            </div>
                        </form>
                    )}

                    {/* ══════════════════════════════════════════
                        STEP 2 — OTP Verification
                    ══════════════════════════════════════════ */}
                    {step === 'otp' && (
                        <form onSubmit={handleOTPSubmit} className="space-y-6">
                            {/* Email hint */}
                            <div className="text-center py-3 px-4 rounded-xl bg-teal-500/10 border border-teal-500/20">
                                <p className="text-teal-300 text-sm font-medium">
                                    📧 Code sent to <span className="font-bold">{otpEmail}</span>
                                </p>
                            </div>

                            {/* OTP boxes */}
                            <OTPInput otp={otp} setOtp={setOtp} />

                            {/* Expiry notice */}
                            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                                This code expires in <span className="text-yellow-400 font-semibold">10 minutes</span>
                            </p>

                            <button
                                type="submit"
                                id="otp-submit"
                                disabled={loading || otp.length !== 6}
                                className="w-full btn-primary hover-lift flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Verifying…
                                    </span>
                                ) : (
                                    <><ShieldCheck className="w-5 h-5 mr-2" /> Verify & Sign In</>
                                )}
                            </button>

                            {/* Resend */}
                            <div className="text-center space-y-2">
                                {resendMsg && (
                                    <p className="text-green-400 text-sm">{resendMsg}</p>
                                )}
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={countdown > 0}
                                    className="flex items-center gap-1 mx-auto text-sm text-gray-400 hover:text-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                                </button>
                            </div>

                            {/* Back */}
                            <button
                                type="button"
                                onClick={handleBackToLogin}
                                className="flex items-center gap-1 mx-auto text-xs text-gray-500 hover:text-gray-300 transition-colors mt-2"
                            >
                                <ArrowLeft className="w-3 h-3" /> Back to login
                            </button>
                        </form>
                    )}

                    {/* Toggle login/register (only on credentials step) */}
                    {step === 'credentials' && (
                        <div className="mt-8 text-center">
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                {isLogin ? "Don't have an account?" : 'Already have an account?'}
                                <button
                                    onClick={() => { setIsLogin(!isLogin); setError(''); }}
                                    className="ml-2 text-primary-600 dark:text-primary-500 hover:text-primary-700 dark:hover:text-primary-400 font-medium transition-colors"
                                >
                                    {isLogin ? 'Sign up' : 'Sign in'}
                                </button>
                            </p>
                        </div>
                    )}
                </div>

                {/* OTP security badge */}
                {step === 'otp' && (
                    <div className="text-center mt-4 flex items-center justify-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-teal-500" />
                        <p className="text-gray-400 dark:text-gray-500 text-xs">
                            Secured with email OTP verification
                        </p>
                    </div>
                )}

                {step === 'credentials' && (
                    <div className="text-center mt-6">
                        <p className="text-gray-400 dark:text-gray-500 text-xs">
                            Split expenses effortlessly with friends
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Auth;
