import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Info } from 'lucide-react';

const TokenWidget = ({ onOpenDetails, tokens, setTokens }) => {
    // Initial state: price $5.00 USD
    // Tokens now passed as prop from parent
    const [basePriceUsd] = useState(5.00);
    const [currentPriceUsd, setCurrentPriceUsd] = useState(5.00);
    const [exchangeRate] = useState(20.50); // Fixed for demo, or could be dynamic

    const [dividends, setDividends] = useState(450.00);
    const [lastDividend, setLastDividend] = useState(null);
    const [showPayoutAnim, setShowPayoutAnim] = useState(false);

    // Reinvestment State
    const [showReinvestModal, setShowReinvestModal] = useState(false);
    const [reinvestSuccess, setReinvestSuccess] = useState(false);

    // Investment Simulator State
    const [showSimModal, setShowSimModal] = useState(false);
    const [simAmount, setSimAmount] = useState(0);

    // Next Dividend State
    const [daysUntilPayout, setDaysUntilPayout] = useState(45);
    const [estimatedNextPayout, setEstimatedNextPayout] = useState(0);

    // Handle Escape Key to close modals
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setShowSimModal(false);
                setShowReinvestModal(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Simulation of "Real-time" market fluctuation
    useEffect(() => {
        const interval = setInterval(() => {
            // Fluctuate between -2% and +2% randomly
            const change = (Math.random() - 0.45) * 0.01;
            setCurrentPriceUsd(prev => Math.max(0.10, prev + change));
        }, 3000); // Update every 3 seconds

        return () => clearInterval(interval);
    }, []);

    // Update estimated payout when price or tokens change
    useEffect(() => {
        // Estimate: 8% yield based on current value (simulated)
        const est = tokens * 0.08 * currentPriceUsd * exchangeRate;
        setEstimatedNextPayout(est);
    }, [tokens, currentPriceUsd, exchangeRate]);

    // Derived values
    const priceMxn = currentPriceUsd * exchangeRate;
    const totalValueMxn = tokens * priceMxn;
    const percentChange = ((currentPriceUsd - basePriceUsd) / basePriceUsd) * 100;
    const isUp = percentChange >= 0;

    // Simulator Logic
    const simTotalTokens = tokens + simAmount;
    const simInvestmentCost = simAmount * priceMxn;
    const simAnnualDividend = simTotalTokens * 0.12 * priceMxn; // Assumed 12% Annual Yield
    const simTotalValue = simTotalTokens * priceMxn;
    const simGrandTotal = simTotalValue + simAnnualDividend + dividends; // Capital + Future Dividends + Current Dividends

    const applySimulation = () => {
        if (simAmount > 0) {
            setTokens(prev => prev + simAmount);
            setShowSimModal(false);
            setReinvestSuccess(true); // Reuse success animation
            setSimAmount(0); // Reset slider
            setTimeout(() => setReinvestSuccess(false), 4000);
        }
    };

    // Reinvestment Logic
    const tokensPurchasable = dividends / priceMxn;
    const confirmReinvest = () => {
        setTokens(prev => prev + tokensPurchasable);
        setDividends(0);
        setShowReinvestModal(false);
        setReinvestSuccess(true);
        setTimeout(() => setReinvestSuccess(false), 4000);
    };

    return (
        <div className="bg-gradient-to-br from-indigo-900 to-coop-blue text-white p-4 rounded-xl shadow-lg relative overflow-hidden mb-4">
            {/* Background Decorative Circles */}
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-white opacity-5 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -ml-6 -mb-6 w-20 h-20 bg-white opacity-5 rounded-full blur-xl"></div>

            {/* Reinvest Modal - Fixed Position */}
            {showReinvestModal && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white text-gray-800 rounded-2xl p-4 w-full max-w-sm shadow-2xl relative">
                        <button onClick={() => setShowReinvestModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
                        <h3 className="font-bold text-lg mb-2">Reinvertir Dividendos</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Aprovecha el interés compuesto comprando más tokens con tus ganancias.
                        </p>

                        <div className="bg-gray-100 p-3 rounded-xl mb-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Disponible:</span>
                                <span className="font-bold text-green-600">${dividends.toLocaleString(undefined, { minimumFractionDigits: 2 })} MXN</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Precio Actual:</span>
                                <span>${priceMxn.toFixed(2)} MXN</span>
                            </div>
                            <div className="border-t border-gray-300 pt-2 flex justify-between font-bold text-coop-blue">
                                <span>Recibes:</span>
                                <span>+{tokensPurchasable.toFixed(4)} RTE</span>
                            </div>
                        </div>

                        <div className="flex space-x-2">
                            <button
                                onClick={() => setShowReinvestModal(false)}
                                className="flex-1 py-2 rounded-lg border border-gray-300 font-semibold text-gray-600 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmReinvest}
                                className="flex-1 py-2 rounded-lg bg-coop-blue text-white font-bold hover:bg-blue-800"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Investment Simulator Modal - Fixed Position */}
            {showSimModal && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white text-gray-800 rounded-2xl p-5 w-full max-w-md shadow-2xl border border-gray-200 relative">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-xl text-gray-800">Simulador de Inversión 🚀</h3>
                            <button onClick={() => setShowSimModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold p-2">✕</button>
                        </div>

                        <p className="text-sm text-gray-500 mb-6">
                            Visualiza el crecimiento de tu patrimonio adquiriendo más Tokens Raite.
                        </p>

                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-coop-blue">Agregar Tokens</span>
                                <input
                                    type="number"
                                    value={simAmount}
                                    onChange={(e) => setSimAmount(Math.min(5000, Math.max(0, Number(e.target.value) || 0)))}
                                    placeholder="0"
                                    className="w-28 p-2 border-2 border-gray-200 rounded-lg text-lg font-bold text-coop-blue text-right focus:border-coop-blue focus:outline-none"
                                />
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="5000"
                                step="10"
                                value={simAmount}
                                onChange={(e) => setSimAmount(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-coop-blue"
                            />
                            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                <span>0</span>
                                <span>5,000 RTE</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl space-y-3 mb-4 border border-gray-100">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Inversión Requerida:</span>
                                <span className="font-bold text-gray-800">${simInvestmentCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} MXN</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Proyección Div. Anual (12%):</span>
                                <span className="font-bold text-green-600">+${simAnnualDividend.toLocaleString(undefined, { maximumFractionDigits: 0 })} MXN</span>
                            </div>
                            <div className="border-t border-gray-200 pt-3 mt-2">
                                <p className="text-center text-xs text-gray-400 uppercase tracking-widest mb-1">Gran Total Patrimonial Estimado</p>
                                <p className="text-center text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500">
                                    ${simGrandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })} MXN
                                </p>
                            </div>
                        </div>

                        {/* Investor-Only Section */}
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200 mb-4">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xl">💼</span>
                                <h4 className="font-bold text-purple-800 text-base">Solo Inversionista (Sin Operación)</h4>
                            </div>
                            <p className="text-xs text-purple-600 mb-3">
                                Proyección de utilidad para quien solo compra tokens sin manejar vehículo.
                                Base: 1,000 tokens actuales + {simAmount.toLocaleString()} nuevos = <span className="font-bold">{(1000 + simAmount).toLocaleString()} tokens</span>
                            </p>

                            {/* Time-based projections */}
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <div className="bg-white p-3 rounded-lg border border-purple-100">
                                    <p className="text-xs text-gray-500 uppercase font-semibold">1 Año</p>
                                    <p className="text-base font-bold text-purple-700">
                                        +${((1000 + simAmount) * priceMxn * 0.12).toLocaleString(undefined, { maximumFractionDigits: 0 })} MXN
                                    </p>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-purple-100">
                                    <p className="text-xs text-gray-500 uppercase font-semibold">3 Años</p>
                                    <p className="text-base font-bold text-purple-700">
                                        +${((1000 + simAmount) * priceMxn * 0.12 * 3).toLocaleString(undefined, { maximumFractionDigits: 0 })} MXN
                                    </p>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-purple-100">
                                    <p className="text-xs text-gray-500 uppercase font-semibold">5 Años</p>
                                    <p className="text-base font-bold text-purple-700">
                                        +${((1000 + simAmount) * priceMxn * 0.12 * 5).toLocaleString(undefined, { maximumFractionDigits: 0 })} MXN
                                    </p>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-purple-100">
                                    <p className="text-xs text-gray-500 uppercase font-semibold">10 Años</p>
                                    <p className="text-base font-bold text-green-600">
                                        +${((1000 + simAmount) * priceMxn * 0.12 * 10).toLocaleString(undefined, { maximumFractionDigits: 0 })} MXN
                                    </p>
                                </div>
                            </div>

                            <div className="bg-purple-100 p-3 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-purple-700 font-semibold">Capital + Dividendos (10 años):</span>
                                    <span className="text-xl font-black text-purple-800">
                                        ${(((1000 + simAmount) * priceMxn) + ((1000 + simAmount) * priceMxn * 0.12 * 10)).toLocaleString(undefined, { maximumFractionDigits: 0 })} MXN
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowSimModal(false)}
                                className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-gray-500 hover:bg-gray-50 transition"
                            >
                                Cerrar
                            </button>
                            <button
                                onClick={applySimulation}
                                disabled={simAmount === 0}
                                className={`flex-1 py-3 rounded-xl text-white font-bold shadow-lg transition transform active:scale-95 ${simAmount > 0 ? 'bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600' : 'bg-gray-300 cursor-not-allowed'}`}
                            >
                                Simular Compra
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative z-10">
                {showPayoutAnim && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-3 py-1 rounded-full font-bold shadow-xl animate-bounce z-50 whitespace-nowrap text-sm">
                        💰 +${lastDividend?.toFixed(2)} MXN
                    </div>
                )}

                {reinvestSuccess && (
                    <div className="absolute top-6 right-0 bg-green-500 text-white px-3 py-1 rounded-l-full font-bold shadow-xl animate-slide-in-right z-50 flex items-center gap-1 text-sm">
                        <TrendingUp size={14} /> ¡Éxito!
                    </div>
                )}

                {/* Compact Header Row */}
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h2 className="text-blue-100 text-xs font-medium uppercase tracking-wider flex items-center gap-1">
                            Raite Tokens
                            <span className="bg-blue-500/30 px-1.5 py-0.5 rounded text-[10px] text-blue-200">LIVE</span>
                        </h2>
                        <p className="text-3xl font-bold tracking-tight">
                            {tokens.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-sm font-normal text-blue-300">RTE</span>
                        </p>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs ${isUp ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                        {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        <span className="font-bold">{percentChange >= 0 ? '+' : ''}{percentChange.toFixed(2)}%</span>
                    </div>
                </div>

                {/* Compact Value Row */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                    <div>
                        <p className="text-blue-200 text-[10px]">Valor Estimado (MXN)</p>
                        <span className="text-xl font-semibold">
                            ${totalValueMxn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-blue-300 ml-1">(@ ${priceMxn.toFixed(2)} / token)</span>
                    </div>
                    <button onClick={onOpenDetails} className="bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors">
                        <Info size={16} className="text-blue-100" />
                    </button>
                </div>

                {/* Compact Dividend Section */}
                <div className="bg-white/5 rounded-lg p-2.5 backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <div>
                            <p className="text-blue-200 text-[10px] uppercase tracking-wide font-semibold">Dividendos Acumulados</p>
                            <p className="text-lg font-bold text-green-300">${dividends.toLocaleString(undefined, { minimumFractionDigits: 2 })} MXN</p>
                        </div>
                        <div className="sm:text-right">
                            <p className="text-blue-200 text-[10px] uppercase">Próximo Pago: <span className="font-bold text-white">{daysUntilPayout} días</span></p>
                            <p className="text-[10px] text-green-300 font-medium">Est. +${estimatedNextPayout.toLocaleString(undefined, { maximumFractionDigits: 0 })} MXN</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                        <button
                            onClick={() => setShowReinvestModal(true)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-bold px-3 py-2.5 rounded-lg transition shadow border border-blue-500"
                        >
                            💰 Reinvertir
                        </button>
                        <button
                            onClick={() => setShowSimModal(true)}
                            className="flex-1 bg-green-500 hover:bg-green-600 active:scale-95 text-white text-sm font-bold px-3 py-2.5 rounded-lg transition shadow border border-green-400"
                        >
                            📊 Simular Pago
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TokenWidget;
