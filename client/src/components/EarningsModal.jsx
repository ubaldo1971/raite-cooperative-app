import React from 'react';
import { X, TrendingUp } from 'lucide-react';

const EarningsModal = ({ isOpen, onClose, earnings, totalShared }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
                <div className="bg-coop-blue p-6 text-white flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold">Ganancias Cooperativas</h2>
                        <p className="text-blue-200 text-sm">Tu participación en los servicios</p>
                    </div>
                    <button onClick={onClose} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    <div className="text-center p-4 bg-gray-50 rounded-2xl border border-gray-100 flex-shrink-0">
                        <span className="text-gray-500 text-sm uppercase">Total Acumulado</span>
                        <h3 className="text-3xl font-bold text-coop-green mt-1">
                            ${totalShared.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                        <div className="flex justify-center items-center mt-2 text-green-600 text-xs font-semibold">
                            <TrendingUp size={12} className="mr-1" />
                            <span>Actualizándose en tiempo real</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <EarningRow title="Taller Mecánico" amount={earnings.taller} icon="🔧" color="bg-orange-100 text-orange-600" />
                        <EarningRow title="Llantera" amount={earnings.llantera} icon="🛞" color="bg-slate-100 text-slate-600" />
                        <EarningRow title="Autofinanciamiento" amount={earnings.autofin} icon="🚙" color="bg-purple-100 text-purple-600" />
                        <EarningRow title="Financiamiento EV" amount={earnings.fin_ev} icon="🔌" color="bg-green-100 text-green-600" />
                        <EarningRow title="Grúas" amount={earnings.gruas} icon="🏗️" color="bg-yellow-100 text-yellow-600" />
                        <EarningRow title="Refaccionaria" amount={earnings.refaccionaria} icon="🔩" color="bg-zinc-100 text-zinc-600" />
                        <EarningRow title="Préstamos Personales" amount={earnings.prestamos_pers} icon="💰" color="bg-emerald-100 text-emerald-600" />
                        <EarningRow title="Préstamos Hipotecarios" amount={earnings.prestamos_hipo} icon="🏡" color="bg-blue-100 text-blue-600" />
                        <EarningRow title="Seguro" amount={earnings.seguro} icon="🚑" color="bg-red-100 text-red-600" />
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full bg-gray-100 text-gray-800 font-bold py-3 rounded-xl hover:bg-gray-200 transition flex-shrink-0"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};

const EarningRow = ({ title, amount, icon, color }) => (
    <div className="flex justify-between items-center p-3 rounded-xl hover:bg-gray-50 transition">
        <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color} text-lg`}>
                {icon}
            </div>
            <span className="font-semibold text-gray-700">{title}</span>
        </div>
        <div className="text-right">
            <span className="font-bold text-gray-800">
                ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
        </div>
    </div>
);

export default EarningsModal;
