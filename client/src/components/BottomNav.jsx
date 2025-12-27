import React from 'react';
import { Home, Users, Briefcase, FileText, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { icon: <Home size={24} />, label: 'Inicio', path: '/dashboard' },
        { icon: <Users size={24} />, label: 'Comunidad', path: '/community' },
        { icon: <Briefcase size={24} />, label: 'Servicios', path: '/services' },
        { icon: <FileText size={24} />, label: 'Gobernanza', path: '/governance' },
        { icon: <User size={24} />, label: 'Perfil', path: '/profile' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-safe">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-coop-blue' : 'text-gray-400'
                                }`}
                        >
                            <div className={`p-1 rounded-xl ${isActive ? 'bg-blue-50' : ''}`}>
                                {item.icon}
                            </div>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNav;
