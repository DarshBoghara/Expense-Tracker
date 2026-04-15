import { useState, useRef, useCallback } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Category keyword map for voice parsing
const CATEGORY_MAP = {
    food:        'Food',
    lunch:       'Food',
    dinner:      'Food',
    breakfast:   'Food',
    restaurant:  'Food',
    dining:      'Food',
    eat:         'Food',
    coffee:      'Food',
    snack:       'Food',
    groceries:   'Food',
    grocery:     'Food',
    petrol:      'Travel',
    fuel:        'Travel',
    uber:        'Travel',
    cab:         'Travel',
    taxi:        'Travel',
    travel:      'Travel',
    train:       'Travel',
    bus:         'Travel',
    flight:      'Travel',
    metro:       'Travel',
    rent:        'Rent',
    house:       'Rent',
    room:        'Rent',
    electricity:  'Rent',
    wifi:        'Rent',
    internet:    'Rent',
    shopping:    'Shopping',
    clothes:     'Shopping',
    shirt:       'Shopping',
    amazon:      'Shopping',
    flipkart:    'Shopping',
    mall:        'Shopping',
    books:       'Shopping',
    book:        'Shopping',
};

function parseVoiceText(text) {
    const lower = text.toLowerCase();

    // Extract the amount (first number found)
    const amountMatch = lower.match(/\d+(\.\d+)?/);
    const amount = amountMatch ? parseFloat(amountMatch[0]) : null;

    // Try to find a category keyword
    let category = 'Other';
    for (const [keyword, cat] of Object.entries(CATEGORY_MAP)) {
        if (lower.includes(keyword)) {
            category = cat;
            break;
        }
    }

    // Derive title from input
    // Remove filler words and the number to build a short title
    const title = text
        .replace(/\d+(\.\d+)?/g, '')
        .replace(/\b(add|spent|spend|paid|pay|for|on|rs|rupees|inr|₹)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

    return { amount, category, title: title || category };
}

// ── States for the button UI ──────────────────────────────
const STATE = {
    IDLE:       'idle',
    LISTENING:  'listening',
    PROCESSING: 'processing',
    SUCCESS:    'success',
    ERROR:      'error',
};

const VoiceExpenseEntry = ({ group, setExpenses, setBalances }) => {
    const [uiState, setUiState] = useState(STATE.IDLE);
    const [transcript, setTranscript] = useState('');
    const [parsed, setParsed]         = useState(null);
    const [message, setMessage]       = useState('');
    const [showPopup, setShowPopup]   = useState(false);
    const recognitionRef = useRef(null);

    const startListening = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setMessage("⚠️ Voice input isn't supported in this browser. Try Chrome.");
            setUiState(STATE.ERROR);
            setShowPopup(true);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognitionRef.current = recognition;

        setUiState(STATE.LISTENING);
        setTranscript('');
        setParsed(null);
        setMessage('');
        setShowPopup(true);

        recognition.onresult = async (event) => {
            const text = event.results[0][0].transcript;
            setTranscript(text);
            setUiState(STATE.PROCESSING);

            const result = parseVoiceText(text);
            setParsed(result);

            if (!result.amount || result.amount <= 0) {
                setMessage("Couldn't detect an amount. Try: \"Add 200 for food\"");
                setUiState(STATE.ERROR);
                return;
            }

            // Submit to backend
            try {
                const token = localStorage.getItem('token');
                const payload = {
                    title: result.title || result.category,
                    amount: result.amount,
                    category: result.category,
                    groupId: group._id,
                    splitType: 'Equal',
                    splits: group.members.map(m => ({
                        user: m._id,
                        amount: parseFloat((result.amount / group.members.length).toFixed(2))
                    }))
                };

                await axios.post(`${API}/api/expenses`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setMessage(`✅ Added ₹${result.amount} for ${result.category}`);
                setUiState(STATE.SUCCESS);

                // Auto-dismiss after 3s
                setTimeout(() => {
                    setShowPopup(false);
                    setUiState(STATE.IDLE);
                }, 3000);
            } catch (err) {
                setMessage('Failed to add expense. Please try again.');
                setUiState(STATE.ERROR);
                console.error('Voice expense error:', err);
            }
        };

        recognition.onerror = (e) => {
            const msgs = {
                'no-speech':         'No speech detected. Please try again.',
                'audio-capture':     'Microphone not accessible.',
                'not-allowed':       'Microphone permission denied.',
                'network':           'Network error during recognition.',
            };
            setMessage(msgs[e.error] || 'Voice recognition error. Try again.');
            setUiState(STATE.ERROR);
        };

        recognition.onend = () => {
            if (uiState === STATE.LISTENING) {
                setUiState(STATE.IDLE);
            }
        };

        recognition.start();
    }, [group, uiState]);

    const stopListening = () => {
        recognitionRef.current?.stop();
        setUiState(STATE.IDLE);
    };

    const closePopup = () => {
        stopListening();
        setShowPopup(false);
        setUiState(STATE.IDLE);
    };

    // ── Button visual config ─────────────────────────────────
    const btnConfig = {
        [STATE.IDLE]:       { bg: 'from-teal-500 to-blue-500',   title: 'Voice Expense Entry', animClass: '' },
        [STATE.LISTENING]:  { bg: 'from-red-500 to-rose-500',    title: 'Listening… tap to stop', animClass: 'animate-pulse' },
        [STATE.PROCESSING]: { bg: 'from-yellow-500 to-amber-500',title: 'Processing…', animClass: 'animate-spin' },
        [STATE.SUCCESS]:    { bg: 'from-emerald-500 to-green-500',title: 'Added!', animClass: '' },
        [STATE.ERROR]:      { bg: 'from-red-600 to-red-500',     title: 'Error — tap to retry', animClass: '' },
    };
    const cfg = btnConfig[uiState];

    const MicIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
            <path d="M19 10a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V19H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-2.08A7 7 0 0 0 19 10z" />
        </svg>
    );

    const StopIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
    );

    const SpinnerIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeLinecap="round" />
        </svg>
    );

    return (
        <>
            {/* ── Floating mic button ──────────────────────── */}
            <button
                onClick={uiState === STATE.LISTENING ? stopListening : startListening}
                title={cfg.title}
                className={`fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full shadow-xl
                            bg-gradient-to-br ${cfg.bg} text-white flex items-center justify-center
                            transition-all duration-300 hover:scale-110 hover:shadow-2xl
                            focus:outline-none focus:ring-4 focus:ring-white/30
                            ${uiState === STATE.LISTENING ? 'ring-4 ring-red-400/50 scale-110' : ''}`}
            >
                {uiState === STATE.PROCESSING ? <SpinnerIcon /> :
                 uiState === STATE.LISTENING   ? <StopIcon />   : <MicIcon />}
            </button>

            {/* ── Popup feedback panel ─────────────────────── */}
            {showPopup && (
                <div className="fixed bottom-28 right-8 z-50 w-80 animate-slideDown"
                     style={{ animation: 'slideUp 0.3s ease-out' }}>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className={`h-1.5 bg-gradient-to-r ${cfg.bg}`} />
                        <div className="p-5">
                            {/* State label */}
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2">
                                    🎤 Voice Expense Entry
                                </h4>
                                <button
                                    onClick={closePopup}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Listening animation */}
                            {uiState === STATE.LISTENING && (
                                <div className="flex items-center gap-1.5 justify-center py-4">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i}
                                             className="w-1.5 bg-red-400 rounded-full"
                                             style={{
                                                 height: `${12 + (i % 3) * 10}px`,
                                                 animation: `pulse ${0.6 + i * 0.1}s ease-in-out infinite alternate`,
                                             }} />
                                    ))}
                                    <p className="ml-3 text-xs text-gray-500 dark:text-gray-400">Listening…</p>
                                </div>
                            )}

                            {/* Hint */}
                            {uiState === STATE.LISTENING && (
                                <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                                    Try: <span className="font-medium text-teal-500">"Add 500 for food"</span>
                                </p>
                            )}

                            {/* Transcript */}
                            {transcript && (
                                <div className="mb-3">
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Heard:</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-200 font-medium italic bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                                        "{transcript}"
                                    </p>
                                </div>
                            )}

                            {/* Parsed result */}
                            {parsed && uiState !== STATE.ERROR && (
                                <div className="flex gap-3">
                                    <div className="flex-1 bg-teal-50 dark:bg-teal-900/20 rounded-lg px-3 py-2 text-center">
                                        <p className="text-xs text-teal-600 dark:text-teal-400">Amount</p>
                                        <p className="font-bold text-teal-700 dark:text-teal-300">₹{parsed.amount}</p>
                                    </div>
                                    <div className="flex-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg px-3 py-2 text-center">
                                        <p className="text-xs text-indigo-600 dark:text-indigo-400">Category</p>
                                        <p className="font-bold text-indigo-700 dark:text-indigo-300">{parsed.category}</p>
                                    </div>
                                </div>
                            )}

                            {/* Status message */}
                            {message && (
                                <p className={`text-sm mt-3 text-center font-medium ${
                                    uiState === STATE.SUCCESS ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                                }`}>
                                    {message}
                                </p>
                            )}

                            {/* Retry button on error */}
                            {uiState === STATE.ERROR && (
                                <button
                                    onClick={startListening}
                                    className="mt-3 w-full py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-teal-500 to-blue-500 text-white hover:opacity-90 transition-opacity"
                                >
                                    🎤 Try Again
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Slide-up keyframe */}
            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse {
                    from { opacity: 0.4; }
                    to   { opacity: 1;   }
                }
            `}</style>
        </>
    );
};

export default VoiceExpenseEntry;
