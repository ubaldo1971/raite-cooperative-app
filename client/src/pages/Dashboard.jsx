import React, { useState, useEffect } from 'react';
import { TrendingUp, Car, Wallet, AlertCircle, CheckCircle, X, ArrowRight, Users, Landmark, Lock, CreditCard, Printer } from 'lucide-react';
import TokenWidget from '../components/TokenWidget';
import EarningsModal from '../components/EarningsModal';

const StatCard = ({ icon, title, value, subtext, color }) => (
    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
            {React.cloneElement(icon, { size: 18, className: `text-${color.split('-')[1]}-600` })}
        </div>
        <div className="flex-1">
            <p className="text-[10px] font-semibold text-gray-400 uppercase">{title}</p>
            <p className="text-lg font-bold text-gray-800">{value}</p>
        </div>
        <span className="text-[10px] text-gray-400">{subtext}</span>
    </div>
);

const TOKEN_PRICE = 25.50;

const Dashboard = () => {
    const [isEarningsOpen, setIsEarningsOpen] = useState(false);
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [showSellModal, setShowSellModal] = useState(false);
    const [tokenBalance, setTokenBalance] = useState(150);
    const [buyAmount, setBuyAmount] = useState('');
    const [buyTokens, setBuyTokens] = useState('');
    const [sellAmount, setSellAmount] = useState('');
    const [sellMxn, setSellMxn] = useState('');
    const [sellMode, setSellMode] = useState('exchange'); // 'exchange' or 'p2p'
    const [recipientId, setRecipientId] = useState('');
    const [transactionSuccess, setTransactionSuccess] = useState(false);
    const [transactionType, setTransactionType] = useState('');
    const [lastTransactionAmount, setLastTransactionAmount] = useState(0);

    // Withdraw Funds State
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawError, setWithdrawError] = useState('');
    const [withdrawSuccess, setWithdrawSuccess] = useState(false);
    const [availableBalance, setAvailableBalance] = useState(10368.47);

    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);

    // Cooperative Bank Account for transfers
    // Cooperative Bank Account state
    const [cooperativeBank, setCooperativeBank] = useState({
        clabe: '012180001234567890',
        bank: 'BBVA',
        holder: 'COOPERATIVA RAITE S.C. DE R.L.',
        concept: 'Pago Cuota Cooperativa',
        address: '',
        phone: '',
        email: ''
    });

    // Fetch cooperative settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/settings');
                if (response.ok) {
                    const data = await response.json();
                    setCooperativeBank(prev => ({
                        ...prev,
                        clabe: data.clabe || prev.clabe,
                        bank: data.bank_name || prev.bank,
                        holder: data.account_holder || prev.holder,
                        address: data.address || '',
                        phone: data.phone || '',
                        email: data.email || ''
                    }));
                }
            } catch (err) {
                console.error('Error fetching settings:', err);
            }
        };
        fetchSettings();
    }, []);

    // User Data from localStorage (set during login)
    const [userData] = useState(() => {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                return JSON.parse(storedUser);
            }
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
        return null;
    });

    // Bank Account - uses userData for holder name
    const bankAccount = {
        clabe: '032180012345678901',
        bank: 'BBVA',
        holder: userData?.full_name || 'TITULAR DE CUENTA'
    };

    // Helper to get user's first name
    const getUserFirstName = () => {
        if (userData?.full_name) {
            return userData.full_name.split(' ')[0];
        }
        return 'Usuario';
    };

    // Helper to get user initials
    const getUserInitials = () => {
        if (userData?.full_name) {
            const names = userData.full_name.split(' ');
            if (names.length >= 2) {
                return names[0][0] + names[1][0];
            }
            return names[0][0];
        }
        return 'U';
    };

    // Helper to get user profile image URL
    const getUserProfileImage = () => {
        const imageUrl = userData?.profile_image || userData?.selfie_image;
        if (imageUrl) {
            // If it's a relative URL, prepend the server base
            if (imageUrl.startsWith('/')) {
                return imageUrl;
            }
            return imageUrl;
        }
        return null;
    };

    const [earnings, setEarnings] = useState({
        taller: 1250.50,
        llantera: 850.20,
        autofin: 3400.00,
        fin_ev: 150.00,
        gruas: 320.40,
        refaccionaria: 640.80,
        prestamos_pers: 1200.00,
        prestamos_hipo: 2100.00,
        seguro: 450.50
    });

    const [activeProposals, setActiveProposals] = useState([]);
    const [userCommitments, setUserCommitments] = useState([]);

    // Fetch user commitments from API
    useEffect(() => {
        const fetchCommitments = async () => {
            if (!userData?.id) return;
            try {
                const response = await fetch(`/api/commitments/user/${userData.id}`);
                if (response.ok) {
                    const data = await response.json();
                    // Filter only pending/overdue for "Próximos Pagos"
                    setUserCommitments(data.filter(c => c.status === 'pending' || c.status === 'overdue'));
                }
            } catch (err) {
                console.error('Error fetching commitments:', err);
            }
        };

        fetchCommitments();
        const interval = setInterval(fetchCommitments, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, [userData?.id]);

    // Fetch proposals from API
    useEffect(() => {
        const fetchProposals = async () => {
            try {
                const response = await fetch('/api/governance/proposals');
                if (response.ok) {
                    const data = await response.json();
                    // Transform API data to match expected format
                    const transformed = data.map(p => ({
                        id: p.id,
                        title: p.title,
                        status: p.status,
                        favor: p.votes?.favor || 0,
                        contra: p.votes?.contra || 0,
                        abstencion: p.votes?.abstencion || 0,
                        total: (p.votes?.favor || 0) + (p.votes?.contra || 0) + (p.votes?.abstencion || 0)
                    }));
                    setActiveProposals(transformed);
                }
            } catch (err) {
                console.error('Error fetching proposals:', err);
            }
        };

        fetchProposals();
        // Auto-refresh every 10 seconds
        const interval = setInterval(fetchProposals, 10000);
        return () => clearInterval(interval);
    }, []);

    // Get status indicator color and label
    const getStatusIndicator = (status) => {
        switch (status) {
            case 'active':
                return { color: 'bg-green-500', label: 'En Curso', pulse: true };
            case 'paused':
                return { color: 'bg-orange-500', label: 'Detenida', pulse: true };
            case 'closed':
                return { color: 'bg-red-500', label: 'Finalizada', pulse: false };
            default:
                return { color: 'bg-green-500', label: 'En Curso', pulse: true };
        }
    };

    // Calculate tokens from MXN amount (for display when using MXN input)
    const tokensFromAmount = buyAmount ? Math.floor(parseFloat(buyAmount) / TOKEN_PRICE) : 0;
    // Calculate MXN from tokens (for display when using tokens input)
    const mxnFromBuyTokens = buyTokens ? (parseFloat(buyTokens) * TOKEN_PRICE) : 0;
    // Final token count to buy (prioritize direct token input)
    const finalBuyTokens = buyTokens ? parseInt(buyTokens) : tokensFromAmount;
    const mxnFromTokens = sellAmount ? (parseFloat(sellAmount) * TOKEN_PRICE) : 0;

    // Handle MXN input change - sync with tokens
    const handleBuyAmountChange = (value) => {
        setBuyAmount(value);
        if (value) {
            setBuyTokens(Math.floor(parseFloat(value) / TOKEN_PRICE).toString());
        } else {
            setBuyTokens('');
        }
    };

    // Handle tokens input change - sync with MXN
    const handleBuyTokensChange = (value) => {
        setBuyTokens(value);
        if (value) {
            setBuyAmount((parseFloat(value) * TOKEN_PRICE).toFixed(2));
        } else {
            setBuyAmount('');
        }
    };

    const handleBuyTokens = () => {
        if (finalBuyTokens > 0) {
            setLastTransactionAmount(finalBuyTokens);
            setTokenBalance(prev => prev + finalBuyTokens);
            setTransactionType('buy');
            setTransactionSuccess(true);
            setBuyAmount('');
            setBuyTokens('');
            setTimeout(() => {
                setTransactionSuccess(false);
                setShowBuyModal(false);
            }, 3000);
        }
    };

    const handleSellTokens = () => {
        const amount = parseInt(sellAmount);
        if (amount > 0 && amount <= tokenBalance) {
            setLastTransactionAmount(amount);
            setTokenBalance(prev => prev - amount);
            setTransactionType(sellMode === 'exchange' ? 'sell-exchange' : 'sell-p2p');
            setTransactionSuccess(true);
            setSellAmount('');
            setSellMxn('');
            setRecipientId('');
            setTimeout(() => {
                setTransactionSuccess(false);
                setShowSellModal(false);
            }, 3000);
        }
    };

    // Handle Sell tokens input - sync with MXN
    const handleSellAmountChange = (value) => {
        setSellAmount(value);
        if (value) {
            setSellMxn((parseFloat(value) * TOKEN_PRICE).toFixed(2));
        } else {
            setSellMxn('');
        }
    };

    // Handle Sell MXN input - sync with tokens
    const handleSellMxnChange = (value) => {
        setSellMxn(value);
        if (value) {
            setSellAmount(Math.floor(parseFloat(value) / TOKEN_PRICE).toString());
        } else {
            setSellAmount('');
        }
    };

    // Simulate live voting updates
    useEffect(() => {
        const interval = setInterval(() => {
            // Randomly increment one of the vote categories
            const rand = Math.random();
            let key = 'abstencion';
            if (rand < 0.6) key = 'favor';
            else if (rand < 0.9) key = 'contra';

            setVoteStats(prev => {
                const newState = { ...prev };
                newState[key] += 1;
                newState.total += 1;
                return newState;
            });
        }, 2000); // New vote every 2 seconds
        return () => clearInterval(interval);
    }, []);

    // Simulate live ticking of earnings
    useEffect(() => {
        const interval = setInterval(() => {
            setEarnings(prev => ({
                taller: prev.taller + Math.random() * 0.4,
                llantera: prev.llantera + Math.random() * 0.3,
                autofin: prev.autofin + Math.random() * 0.8,
                fin_ev: prev.fin_ev + Math.random() * 0.9,
                gruas: prev.gruas + Math.random() * 0.2,
                refaccionaria: prev.refaccionaria + Math.random() * 0.4,
                prestamos_pers: prev.prestamos_pers + Math.random() * 0.5,
                prestamos_hipo: prev.prestamos_hipo + Math.random() * 0.7,
                seguro: prev.seguro + Math.random() * 0.1
            }));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const totalShared = Object.values(earnings).reduce((acc, curr) => acc + curr, 0);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <EarningsModal
                isOpen={isEarningsOpen}
                onClose={() => setIsEarningsOpen(false)}
                earnings={earnings}
                totalShared={totalShared}
            />

            {/* Compact Header */}
            <div className="bg-coop-blue text-white p-4 pb-14 rounded-b-[2rem] shadow-md relative z-0">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold">Hola, {getUserFirstName()}</h1>
                        <p className="text-blue-200 text-xs">Socio {userData?.member_id || '#-----'} • {userData?.status === 'active' ? 'Activo' : 'Pendiente'}</p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                        <div>
                            <p className="text-blue-300 text-[9px] uppercase font-semibold">Ganancias Coop</p>
                            <div className="flex items-center gap-1">
                                <span className="text-xl font-bold">
                                    ${totalShared.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <TrendingUp size={14} className="text-coop-green" />
                            </div>
                        </div>
                        {getUserProfileImage() ? (
                            <img
                                src={getUserProfileImage()}
                                alt="Perfil"
                                className="w-9 h-9 rounded-full object-cover shadow border-2 border-white"
                            />
                        ) : (
                            <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-coop-blue text-sm font-bold shadow">{getUserInitials()}</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Overlapping Token Widget */}
            <div className="px-4 -mt-10 relative z-10">
                <TokenWidget
                    onOpenDetails={() => setIsEarningsOpen(true)}
                    tokens={tokenBalance}
                    setTokens={setTokenBalance}
                />
            </div>

            {/* Compact Buy/Sell Section */}
            <div className="px-4 mt-3">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-3 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-bold text-sm flex items-center gap-1">💎 Tokens RAITE</span>
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-white text-xs font-bold">{tokenBalance} tokens</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowBuyModal(true)}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1 text-sm transition-all shadow"
                        >
                            📈 Comprar
                        </button>
                        <button
                            onClick={() => setShowSellModal(true)}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1 text-sm transition-all shadow"
                        >
                            📉 Vender
                        </button>
                    </div>
                    <div className="mt-2 flex justify-between text-[10px] text-indigo-200">
                        <span>Precio: <span className="text-white font-bold">${TOKEN_PRICE.toFixed(2)} MXN</span></span>
                        <span className="text-green-300">+2.5% hoy</span>
                    </div>
                </div>
            </div>

            {/* Buy Tokens Modal */}
            {showBuyModal && (
                <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-green-500 to-teal-500 p-4 flex justify-between items-center">
                            <h3 className="text-white font-bold text-lg">📈 Comprar Tokens</h3>
                            <button onClick={() => setShowBuyModal(false)} className="text-white/80 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        {!transactionSuccess ? (
                            <div className="p-5">
                                {/* Two input options */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Monto (MXN)</label>
                                        <input
                                            type="number"
                                            value={buyAmount}
                                            onChange={(e) => handleBuyAmountChange(e.target.value)}
                                            placeholder="Ej: 1000"
                                            className="w-full p-3 border-2 border-gray-200 rounded-lg text-base font-bold focus:border-green-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tokens (RTE)</label>
                                        <input
                                            type="number"
                                            value={buyTokens}
                                            onChange={(e) => handleBuyTokensChange(e.target.value)}
                                            placeholder="Ej: 50"
                                            className="w-full p-3 border-2 border-gray-200 rounded-lg text-base font-bold focus:border-green-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="bg-green-50 p-3 rounded-lg mb-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] text-gray-500">Recibirás:</p>
                                            <p className="text-2xl font-black text-green-600">{finalBuyTokens} tokens</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-500">Costo:</p>
                                            <p className="text-lg font-bold text-gray-700">${(finalBuyTokens * TOKEN_PRICE).toFixed(2)} MXN</p>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">Precio: ${TOKEN_PRICE} MXN por token</p>
                                </div>

                                <button
                                    onClick={handleBuyTokens}
                                    disabled={finalBuyTokens <= 0}
                                    className={`w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 ${finalBuyTokens > 0
                                        ? 'bg-gradient-to-r from-green-500 to-teal-500 hover:shadow-lg'
                                        : 'bg-gray-300 cursor-not-allowed'
                                        }`}
                                >
                                    Confirmar Compra <ArrowRight size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <div className="w-24 h-24 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4 animate-bounce">
                                    <CheckCircle className="text-green-500" size={48} />
                                </div>
                                <h4 className="text-2xl font-black text-gray-800">¡Compra Exitosa!</h4>
                                <div className="bg-green-50 rounded-xl p-4 mt-4 mb-2">
                                    <p className="text-sm text-gray-500">Tokens acreditados:</p>
                                    <p className="text-4xl font-black text-green-600">+{lastTransactionAmount}</p>
                                </div>
                                <div className="bg-gray-100 rounded-xl p-3">
                                    <p className="text-xs text-gray-400">Nuevo balance en billetera:</p>
                                    <p className="text-2xl font-bold text-gray-800">{tokenBalance} tokens 💎</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Sell Tokens Modal */}
            {showSellModal && (
                <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4 flex justify-between items-center">
                            <h3 className="text-white font-bold text-lg">📉 Vender Tokens</h3>
                            <button onClick={() => setShowSellModal(false)} className="text-white/80 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        {!transactionSuccess ? (
                            <div className="p-5">
                                {/* Mode Selector */}
                                <div className="flex gap-2 mb-3">
                                    <button
                                        onClick={() => setSellMode('exchange')}
                                        className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${sellMode === 'exchange'
                                            ? 'bg-red-500 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        💱 Exchange
                                    </button>
                                    <button
                                        onClick={() => setSellMode('p2p')}
                                        className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${sellMode === 'p2p'
                                            ? 'bg-purple-500 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <Users size={16} /> P2P Chofer
                                    </button>
                                </div>

                                {/* Two input options */}
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tokens (RTE)</label>
                                        <input
                                            type="number"
                                            value={sellAmount}
                                            onChange={(e) => handleSellAmountChange(e.target.value)}
                                            placeholder="Ej: 50"
                                            max={tokenBalance}
                                            className="w-full p-3 border-2 border-gray-200 rounded-lg text-base font-bold focus:border-red-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Monto (MXN)</label>
                                        <input
                                            type="number"
                                            value={sellMxn}
                                            onChange={(e) => handleSellMxnChange(e.target.value)}
                                            placeholder="Ej: 1275"
                                            className="w-full p-3 border-2 border-gray-200 rounded-lg text-base font-bold focus:border-red-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-400 mb-3">Tienes {tokenBalance} tokens disponibles</p>

                                {sellMode === 'p2p' && (
                                    <div className="mb-3">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">ID del Comprador</label>
                                        <input
                                            type="text"
                                            value={recipientId}
                                            onChange={(e) => setRecipientId(e.target.value)}
                                            placeholder="Ej: PXLXJU19850519806"
                                            className="w-full p-3 border-2 border-gray-200 rounded-lg font-mono text-sm focus:border-purple-500 focus:outline-none"
                                        />
                                    </div>
                                )}

                                <div className={`p-3 rounded-lg mb-4 ${sellMode === 'exchange' ? 'bg-red-50' : 'bg-purple-50'}`}>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] text-gray-500">Vender:</p>
                                            <p className="text-xl font-black text-gray-800">{sellAmount || 0} tokens</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-500">{sellMode === 'exchange' ? 'Recibirás:' : 'Te pagarán:'}</p>
                                            <p className={`text-xl font-black ${sellMode === 'exchange' ? 'text-red-600' : 'text-purple-600'}`}>
                                                ${mxnFromTokens.toFixed(2)} MXN
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSellTokens}
                                    disabled={parseInt(sellAmount) <= 0 || parseInt(sellAmount) > tokenBalance || (sellMode === 'p2p' && !recipientId)}
                                    className={`w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 ${parseInt(sellAmount) > 0 && parseInt(sellAmount) <= tokenBalance && (sellMode !== 'p2p' || recipientId)
                                        ? `bg-gradient-to-r ${sellMode === 'exchange' ? 'from-red-500 to-orange-500' : 'from-purple-500 to-indigo-500'} hover:shadow-lg`
                                        : 'bg-gray-300 cursor-not-allowed'
                                        }`}
                                >
                                    {sellMode === 'exchange' ? 'Vender al Exchange' : 'Transferir a Chofer'} <ArrowRight size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="p-10 text-center">
                                <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${transactionType === 'sell-exchange' ? 'bg-red-100' : 'bg-purple-100'
                                    }`}>
                                    <CheckCircle className={transactionType === 'sell-exchange' ? 'text-red-500' : 'text-purple-500'} size={40} />
                                </div>
                                <h4 className="text-xl font-bold text-gray-800">
                                    {transactionType === 'sell-exchange' ? '¡Venta Exitosa!' : '¡Transferencia Exitosa!'}
                                </h4>
                                <p className="text-gray-500 mt-2">
                                    {transactionType === 'sell-exchange' ? 'Fondos acreditados a tu cuenta' : 'Tokens enviados al comprador'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )
            }

            {/* Compact Stats Row */}
            <div className="px-4 mt-3 space-y-2">
                <StatCard
                    icon={<TrendingUp />}
                    title="Ingresos (Mes)"
                    value="$8,200"
                    subtext="+15%"
                    color="bg-green-100"
                />
                <StatCard
                    icon={<Car />}
                    title="Viajes"
                    value="42"
                    subtext="Esta semana"
                    color="bg-blue-100"
                />
            </div>

            {/* ========== SECCIÓN RETIRO DE FONDOS ========== */}
            <div className="px-4 mt-4">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl border-2 border-emerald-500/30 shadow-lg relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>

                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <Landmark className="text-emerald-400" size={20} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm">Saldo Disponible para Retiro</h3>
                                <p className="text-slate-400 text-[10px]">Transferencia SPEI a tu cuenta</p>
                            </div>
                        </div>
                        <div className="bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/30">
                            <span className="text-[10px] text-emerald-400 font-semibold">✓ RETIRABLE</span>
                        </div>
                    </div>

                    {/* Available Balance */}
                    <div className="bg-slate-700/50 rounded-xl p-3 mb-3 border border-slate-600">
                        <p className="text-slate-400 text-[10px] uppercase tracking-wide mb-1">Disponible</p>
                        <p className="text-3xl font-black text-emerald-400">
                            ${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            <span className="text-sm text-slate-400 font-normal ml-1">MXN</span>
                        </p>
                    </div>

                    {/* Bank Account Info */}
                    <div className="flex items-center gap-2 mb-3 text-slate-400">
                        <CreditCard size={14} />
                        <span className="text-xs">
                            {bankAccount.bank} •••• {bankAccount.clabe.slice(-4)}
                        </span>
                    </div>

                    {/* Withdraw Input */}
                    <div className="mb-3">
                        <label className="text-[10px] text-slate-400 uppercase font-semibold mb-1 block">Monto a Retirar</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                            <input
                                type="number"
                                value={withdrawAmount}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setWithdrawAmount(value);
                                    if (parseFloat(value) > availableBalance) {
                                        setWithdrawError('El monto no puede ser mayor al saldo disponible');
                                    } else if (parseFloat(value) <= 0 && value !== '') {
                                        setWithdrawError('Ingresa un monto válido');
                                    } else {
                                        setWithdrawError('');
                                    }
                                }}
                                placeholder="0.00"
                                className={`w-full pl-8 pr-4 py-3 bg-slate-700 border-2 rounded-lg text-white text-lg font-bold placeholder-slate-500 focus:outline-none transition-colors ${withdrawError
                                    ? 'border-red-500 focus:border-red-500'
                                    : withdrawAmount && !withdrawError
                                        ? 'border-emerald-500 focus:border-emerald-400'
                                        : 'border-slate-600 focus:border-emerald-500'
                                    }`}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">MXN</span>
                        </div>
                        {withdrawError && (
                            <div className="flex items-center gap-1 mt-1 text-red-400 text-xs">
                                <AlertCircle size={12} />
                                <span>{withdrawError}</span>
                            </div>
                        )}
                        <p className="text-[10px] text-slate-500 mt-1">Máximo: ${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} MXN</p>
                    </div>

                    {/* Withdraw Button */}
                    <button
                        onClick={() => {
                            if (parseFloat(withdrawAmount) > 0 && parseFloat(withdrawAmount) <= availableBalance && !withdrawError) {
                                setShowWithdrawModal(true);
                            }
                        }}
                        disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > availableBalance || withdrawError}
                        className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 ${withdrawAmount && parseFloat(withdrawAmount) > 0 && parseFloat(withdrawAmount) <= availableBalance && !withdrawError
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]'
                            : 'bg-slate-600 cursor-not-allowed opacity-50'
                            }`}
                    >
                        <Landmark size={18} />
                        Retirar a Mi Cuenta
                    </button>

                    {/* Non-withdrawable notice */}
                    <div className="mt-3 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <div className="flex items-start gap-2">
                            <Lock size={12} className="text-amber-400 mt-0.5" />
                            <p className="text-[10px] text-amber-300">
                                <span className="font-bold">Tokens y Dividendos</span> no son retirables directamente.
                                Primero debes venderlos o liquidarlos para convertirlos en saldo disponible.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Withdraw Confirmation Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
                        {!withdrawSuccess ? (
                            <>
                                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Landmark className="text-white" size={24} />
                                        <h3 className="text-white font-bold text-lg">Confirmar Retiro</h3>
                                    </div>
                                    <button onClick={() => setShowWithdrawModal(false)} className="text-white/80 hover:text-white">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="p-5">
                                    <div className="text-center mb-4">
                                        <p className="text-gray-500 text-sm">Vas a retirar</p>
                                        <p className="text-4xl font-black text-emerald-600">
                                            ${parseFloat(withdrawAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            <span className="text-lg text-gray-400 ml-1">MXN</span>
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-4 border border-gray-100">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 text-sm">Cuenta Destino:</span>
                                            <span className="font-mono font-bold text-gray-800 text-sm">•••• {bankAccount.clabe.slice(-4)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 text-sm">CLABE:</span>
                                            <span className="font-mono text-gray-600 text-xs">{bankAccount.clabe}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 text-sm">Banco:</span>
                                            <span className="font-bold text-gray-800">{bankAccount.bank}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 text-sm">Titular:</span>
                                            <span className="font-bold text-gray-800 text-sm">{bankAccount.holder}</span>
                                        </div>
                                        <div className="border-t border-gray-200 pt-2 flex justify-between">
                                            <span className="text-gray-500 text-sm">Comisión:</span>
                                            <span className="font-bold text-green-600">$0.00 MXN</span>
                                        </div>
                                    </div>

                                    <div className="bg-amber-50 p-3 rounded-lg mb-4 flex items-start gap-2">
                                        <AlertCircle className="text-amber-500 mt-0.5" size={16} />
                                        <p className="text-xs text-amber-700">
                                            El depósito llegará en un plazo de 1-2 horas hábiles vía SPEI.
                                        </p>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowWithdrawModal(false)}
                                            className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-500 hover:bg-gray-50 transition"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={() => {
                                                setAvailableBalance(prev => prev - parseFloat(withdrawAmount));
                                                setWithdrawSuccess(true);
                                                setTimeout(() => {
                                                    setWithdrawSuccess(false);
                                                    setShowWithdrawModal(false);
                                                    setWithdrawAmount('');
                                                }, 3000);
                                            }}
                                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold hover:shadow-lg transition flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={18} />
                                            Confirmar Retiro
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="p-8 text-center">
                                <div className="w-20 h-20 bg-emerald-100 rounded-full mx-auto flex items-center justify-center mb-4 animate-bounce">
                                    <CheckCircle className="text-emerald-500" size={40} />
                                </div>
                                <h4 className="text-2xl font-black text-gray-800">¡Retiro Exitoso!</h4>
                                <p className="text-gray-500 mt-2">Tu transferencia SPEI está en proceso</p>
                                <div className="bg-emerald-50 rounded-xl p-4 mt-4">
                                    <p className="text-sm text-gray-500">Monto enviado:</p>
                                    <p className="text-3xl font-black text-emerald-600">
                                        ${parseFloat(withdrawAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })} MXN
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">A {bankAccount.bank} •••• {bankAccount.clabe.slice(-4)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Compact Live Voting */}
            <div className="px-4 mt-3 space-y-3">
                {activeProposals.map(proposal => (
                    <div key={proposal.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${getStatusIndicator(proposal.status).color} ${getStatusIndicator(proposal.status).pulse ? 'animate-pulse' : ''}`}></span>
                                <span className="font-bold text-gray-800 text-sm">
                                    {getStatusIndicator(proposal.status).label} {proposal.status === 'active' ? '🟢' : proposal.status === 'paused' ? '🟠' : '🔴'}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-lg font-bold text-gray-800">{proposal.total.toLocaleString()}</span>
                                <span className="text-[9px] text-gray-400 uppercase ml-1">votos</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-500 mb-2">{proposal.title}</p>

                        {/* Closed Voting - Show Final Results */}
                        {proposal.status === 'closed' && (
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <span className="text-xs font-bold text-gray-700">🏁 VOTACIÓN TERMINADA</span>
                                </div>
                                {proposal.total > 0 ? (
                                    <>
                                        <div className="flex justify-center gap-6 text-center mb-2">
                                            <div>
                                                <span className="text-lg font-bold text-green-600">{Math.round((proposal.favor / proposal.total) * 100)}%</span>
                                                <p className="text-[9px] text-gray-500">A Favor</p>
                                            </div>
                                            <div>
                                                <span className="text-lg font-bold text-red-600">{Math.round((proposal.contra / proposal.total) * 100)}%</span>
                                                <p className="text-[9px] text-gray-500">En Contra</p>
                                            </div>
                                            <div>
                                                <span className="text-lg font-bold text-gray-500">{Math.round((proposal.abstencion / proposal.total) * 100)}%</span>
                                                <p className="text-[9px] text-gray-500">Abstención</p>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            {proposal.favor > proposal.contra ? (
                                                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">✅ APROBADA</span>
                                            ) : proposal.contra > proposal.favor ? (
                                                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">❌ RECHAZADA</span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">⚖️ EMPATE</span>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center">
                                        <span className="text-[10px] text-gray-400">Sin votos registrados</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Active/Paused Voting - Show Progress Bars */}
                        {proposal.status !== 'closed' && proposal.total > 0 && (
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] w-14 text-gray-600">A Favor</span>
                                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                        <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${(proposal.favor / proposal.total) * 100}%` }}></div>
                                    </div>
                                    <span className="text-[10px] font-bold w-10 text-right">{Math.round((proposal.favor / proposal.total) * 100)}%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] w-14 text-gray-600">En Contra</span>
                                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                        <div className="bg-red-500 h-1.5 rounded-full transition-all" style={{ width: `${(proposal.contra / proposal.total) * 100}%` }}></div>
                                    </div>
                                    <span className="text-[10px] font-bold w-10 text-right">{Math.round((proposal.contra / proposal.total) * 100)}%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] w-14 text-gray-600">Abstención</span>
                                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                        <div className="bg-gray-400 h-1.5 rounded-full transition-all" style={{ width: `${(proposal.abstencion / proposal.total) * 100}%` }}></div>
                                    </div>
                                    <span className="text-[10px] font-bold w-10 text-right">{Math.round((proposal.abstencion / proposal.total) * 100)}%</span>
                                </div>
                            </div>
                        )}

                        {/* No votes yet for active/paused */}
                        {proposal.status !== 'closed' && proposal.total === 0 && (
                            <div className="text-center py-2">
                                <span className="text-[10px] text-gray-400">Aún no hay votos registrados</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="p-4 space-y-4">
                <h3 className="font-bold text-gray-800 text-lg">Estado del Vehículo</h3>
                <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-500 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <CheckCircle className="text-green-600" size={20} />
                        </div>
                        <div>
                            <h4 className="font-semibold">Verificación Vigente</h4>
                            <p className="text-sm text-gray-500">Próxima: 12 Dic 2024</p>
                        </div>
                    </div>
                </div>

                <h3 className="font-bold text-gray-800 text-lg">Próximos Pagos</h3>
                {userCommitments.length > 0 ? (
                    <div className="space-y-2">
                        {userCommitments.map(c => {
                            const dueDate = new Date(c.dueDate);
                            const today = new Date();
                            const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                            const isOverdue = diffDays < 0;

                            return (
                                <div
                                    key={c.id}
                                    className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${isOverdue ? 'border-red-500' : 'border-yellow-500'} cursor-pointer hover:shadow-md transition-shadow`}
                                    onClick={() => { setSelectedPayment(c); setShowPaymentModal(true); }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className={`p-2 rounded-lg ${isOverdue ? 'bg-red-50' : 'bg-yellow-50'}`}>
                                                <Wallet className={isOverdue ? 'text-red-600' : 'text-yellow-600'} size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold">{c.concept}</h4>
                                                <p className="text-xs text-gray-400">Ref: {c.referenceNumber}</p>
                                                <p className={`text-sm ${isOverdue ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                                                    {isOverdue ? `⚠️ Vencido hace ${Math.abs(diffDays)} días` : `Vence en ${diffDays} días`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`font-bold text-lg ${isOverdue ? 'text-red-600' : 'text-gray-800'}`}>
                                                ${c.amount}
                                            </span>
                                            <p className="text-xs text-orange-500 font-medium">Toca para pagar →</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <CheckCircle className="text-green-600" size={20} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-green-700">Sin pagos pendientes</h4>
                                <p className="text-sm text-gray-500">Estás al corriente</p>
                            </div>
                        </div>
                        <span className="text-green-600 font-bold">✓</span>
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {showPaymentModal && selectedPayment && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-4 rounded-t-2xl text-white">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold">💳 Pago de Cuota</h3>
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="text-white/80 hover:text-white text-2xl"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Amount */}
                            <div className="text-center py-4 bg-gray-50 rounded-xl">
                                <p className="text-sm text-gray-500 mb-1">Monto a pagar</p>
                                <p className="text-4xl font-bold text-gray-800">${selectedPayment.amount}</p>
                                <p className="text-sm text-gray-500 mt-1">{selectedPayment.concept}</p>
                            </div>

                            {/* Reference */}
                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                                <p className="text-xs text-orange-600 font-medium mb-1">📋 Número de Referencia (IMPORTANTE)</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-lg font-mono font-bold text-orange-700">{selectedPayment.referenceNumber}</p>
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(selectedPayment.referenceNumber); alert('Referencia copiada'); }}
                                        className="text-xs bg-orange-500 text-white px-3 py-1 rounded-lg"
                                    >
                                        Copiar
                                    </button>
                                </div>
                            </div>

                            {/* Bank Transfer Details */}
                            <div className="border rounded-xl p-4 space-y-3">
                                <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                                    🏦 Datos para Transferencia
                                </h4>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Banco</span>
                                        <span className="font-medium">{cooperativeBank.bank}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Beneficiario</span>
                                        <span className="font-medium text-xs text-right">{cooperativeBank.holder}</span>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">CLABE Interbancaria</p>
                                        <div className="flex items-center justify-between">
                                            <p className="font-mono text-lg font-bold">{cooperativeBank.clabe}</p>
                                            <button
                                                onClick={() => { navigator.clipboard.writeText(cooperativeBank.clabe); alert('CLABE copiada'); }}
                                                className="text-xs bg-blue-500 text-white px-3 py-1 rounded-lg"
                                            >
                                                Copiar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Instructions */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                                <p className="text-xs text-yellow-800">
                                    ⚠️ <strong>IMPORTANTE:</strong> Incluye tu número de referencia <strong>{selectedPayment.referenceNumber}</strong> en el concepto de la transferencia para identificar tu pago.
                                </p>
                            </div>

                            {/* Generate Ticket Button */}
                            <button
                                onClick={() => {
                                    const ticketWindow = window.open('', '_blank', 'width=400,height=600');
                                    const ticketContent = `
                                        <html>
                                        <head>
                                            <title>Ticket de Pago - RAITE</title>
                                            <style>
                                                body { font-family: 'Courier New', monospace; padding: 20px; max-width: 320px; margin: 0 auto; color: #000; }
                                                .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 15px; margin-bottom: 15px; }
                                                .logo { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
                                                .subtitle { font-size: 12px; text-transform: uppercase; }
                                                .details { margin-bottom: 15px; }
                                                .row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
                                                .label { font-weight: bold; }
                                                .divider { border-top: 1px dashed #000; margin: 15px 0; }
                                                .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 10px; }
                                                .reference-box { border: 2px solid #000; padding: 10px; text-align: center; margin: 15px 0; font-weight: bold; background: #f0f0f0; }
                                                .footer { text-align: center; font-size: 10px; margin-top: 30px; }
                                                @media print {
                                                    body { -webkit-print-color-adjust: exact; }
                                                    .no-print { display: none; }
                                                }
                                            </style>
                                        </head>
                                        <body>
                                            <div class="header">
                                                <div class="logo">RAITE Cooperativa</div>
                                                <div class="subtitle">Orden de Pago</div>
                                                <div style="font-size: 10px; margin-top: 5px;">${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>

                                            <div class="details">
                                                <div class="row">
                                                    <span class="label">Socio:</span>
                                                    <span>${getUserFirstName()}</span>
                                                </div>
                                                <div class="row">
                                                    <span class="label">ID Socio:</span>
                                                    <span>${userData?.member_id || '---'}</span>
                                                </div>
                                            </div>

                                            <div class="divider"></div>

                                            <div class="details">
                                                <div class="row">
                                                    <span class="label">Concepto:</span>
                                                    <span style="text-align:right; max-width: 60%;">${selectedPayment.concept}</span>
                                                </div>
                                            </div>

                                            <div class="divider"></div>

                                            <div class="row" style="align-items: center;">
                                                <span class="label" style="font-size: 14px;">TOTAL A PAGAR:</span>
                                                <span class="total">$${selectedPayment.amount} MXN</span>
                                            </div>

                                            <div class="reference-box">
                                                <div style="font-size: 10px; text-transform: uppercase; margin-bottom: 5px;">Referencia Única</div>
                                                <div style="font-size: 16px;">${selectedPayment.referenceNumber}</div>
                                            </div>

                                            <div class="details">
                                                <div style="font-weight: bold; margin-bottom: 5px; font-size: 12px;">DATOS BANCARIOS:</div>
                                                <div class="row">
                                                    <span class="label">Banco:</span>
                                                    <span>${cooperativeBank.bank}</span>
                                                </div>
                                                <div class="row">
                                                    <span class="label">Beneficiario:</span>
                                                    <span>${cooperativeBank.holder}</span>
                                                </div>
                                                <div class="row">
                                                    <span class="label">CLABE:</span>
                                                    <span>${cooperativeBank.clabe}</span>
                                                </div>
                                            </div>

                                            <div class="footer">
                                                <p>*** IMPORTANTE ***</p>
                                                <p>Incluye tu Referencia en el concepto de la transferencia.</p>
                                                <p>Este documento no es un comprobante fiscal.</p>
                                            </div>
                                            <script>
                                                window.onload = function() { window.print(); }
                                            </script>
                                        </body>
                                        </html>
                                    `;
                                    ticketWindow.document.write(ticketContent);
                                    ticketWindow.document.close();
                                }}
                                className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-transform active:scale-95"
                            >
                                <Printer size={20} /> Generar e Imprimir Ticket
                            </button>

                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="w-full border border-gray-300 text-gray-600 py-2 rounded-xl"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default Dashboard;
