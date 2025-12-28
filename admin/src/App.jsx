import React, { useState, useEffect } from 'react';
import {
    Shield, Users, Eye, Trash2, CheckCircle, XCircle,
    LogOut, Search, RefreshCw, User, MapPin, CreditCard,
    Calendar, Hash, Lock, AlertTriangle, Download, Image,
    ZoomIn, Edit3, Save, X, Mail, Phone, Clock, MessageSquare,
    UserCheck, UserX, Play, Ban, FileText, Gavel, PlusCircle, ChevronDown, ChevronUp, Settings
} from 'lucide-react';

// Admin password
const ADMIN_PASSWORD = 'raite2024';

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'active'
    const [showPhotos, setShowPhotos] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showNotesModal, setShowNotesModal] = useState(null);
    const [newNote, setNewNote] = useState('');

    // Governance state
    const [showGovernance, setShowGovernance] = useState(false);
    const [proposals, setProposals] = useState([]);
    const [showNewProposal, setShowNewProposal] = useState(false);
    const [newProposal, setNewProposal] = useState({
        title: '',
        description: '',
        endDate: '',
        status: 'active'
    });

    // Commitments state
    const [showCommitments, setShowCommitments] = useState(false);
    const [commitments, setCommitments] = useState([]);
    const [showNewCommitment, setShowNewCommitment] = useState(false);
    const [commitmentReport, setCommitmentReport] = useState([]);
    const [showReport, setShowReport] = useState(false);
    const [newCommitment, setNewCommitment] = useState({
        userId: '',
        type: 'cuota',
        concept: 'Cuota Cooperativa',
        amount: '',
        dueDate: '',
        applyToAll: false
    });

    // Cooperative Settings
    const [showSettings, setShowSettings] = useState(false);
    const [coopSettings, setCoopSettings] = useState({
        bank_name: '',
        account_holder: '',
        clabe: '',
        address: '',
        phone: '',
        email: ''
    });

    // Fetch Settings
    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/settings');
            if (response.ok) {
                const data = await response.json();
                setCoopSettings(data);
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
        }
    };

    const updateSettings = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(coopSettings)
            });
            if (response.ok) {
                alert('Configuración guardada correctamente');
            }
        } catch (err) {
            console.error('Error updating settings:', err);
        }
    };



    // Fetch proposals from API
    const fetchProposals = async () => {
        try {
            const response = await fetch('/api/governance/proposals');
            if (response.ok) {
                const data = await response.json();
                setProposals(data);
            }
        } catch (err) {
            console.error('Error fetching proposals:', err);
        }
    };

    // Create proposal via API
    const createProposal = async (proposalData) => {
        try {
            const response = await fetch('/api/governance/proposals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(proposalData)
            });
            if (response.ok) {
                fetchProposals();
                return true;
            }
        } catch (err) {
            console.error('Error creating proposal:', err);
        }
        return false;
    };

    // Update proposal status via API
    const updateProposalStatus = async (id, status) => {
        try {
            const response = await fetch(`/api/governance/proposals/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (response.ok) {
                fetchProposals();
            }
        } catch (err) {
            console.error('Error updating proposal:', err);
        }
    };

    // Delete proposal via API
    const deleteProposalAPI = async (id) => {
        try {
            const response = await fetch(`/api/governance/proposals/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchProposals();
            }
        } catch (err) {
            console.error('Error deleting proposal:', err);
        }
    };

    // ===== COMMITMENTS API =====
    const fetchCommitments = async () => {
        try {
            const response = await fetch('/api/commitments');
            if (response.ok) {
                const data = await response.json();
                setCommitments(data);
            }
        } catch (err) {
            console.error('Error fetching commitments:', err);
        }
    };

    const createCommitmentAPI = async (commitmentData) => {
        try {
            const response = await fetch('/api/commitments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(commitmentData)
            });
            if (response.ok) {
                fetchCommitments();
                fetchCommitmentReport();
                return await response.json();
            }
        } catch (err) {
            console.error('Error creating commitment:', err);
        }
        return false;
    };

    const fetchCommitmentReport = async () => {
        try {
            const response = await fetch('/api/commitments/report');
            if (response.ok) {
                const data = await response.json();
                setCommitmentReport(data);
            }
        } catch (err) {
            console.error('Error fetching report:', err);
        }
    };

    const updateCommitmentStatusAPI = async (id, status) => {
        try {
            const response = await fetch(`/api/commitments/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (response.ok) {
                fetchCommitments();
            }
        } catch (err) {
            console.error('Error updating commitment:', err);
        }
    };

    const deleteCommitmentAPI = async (id) => {
        try {
            const response = await fetch(`/api/commitments/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchCommitments();
            }
        } catch (err) {
            console.error('Error deleting commitment:', err);
        }
    };

    // Check authentication
    useEffect(() => {
        const auth = sessionStorage.getItem('raite_admin_auth');
        if (auth === 'true') {
            setIsAuthenticated(true);
            fetchUsers();
            fetchStats();
            fetchProposals();
            fetchCommitments();
        }
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
            sessionStorage.setItem('raite_admin_auth', 'true');
            setError('');
            fetchUsers();
            fetchStats();
            fetchProposals();
            fetchStats();
            fetchProposals();
            fetchCommitments();
            fetchSettings();
        } else {
            setError('Contraseña incorrecta');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        sessionStorage.removeItem('raite_admin_auth');
        setPassword('');
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/users');
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users || data); // Handle both response formats
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/admin/stats');
            if (response.ok) {
                const data = await response.json();
                setStats(data.stats);
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const approveUser = async (userId, note = '') => {
        if (!confirm('¿Aprobar esta solicitud de registro?')) return;

        try {
            const response = await fetch(`/api/admin/users/${userId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ note: note || 'Solicitud aprobada' })
            });

            if (response.ok) {
                alert('✅ Usuario aprobado correctamente');
                fetchUsers();
                fetchStats();
                if (selectedUser?.id === userId) {
                    const updated = await response.json();
                    setSelectedUser(updated.user);
                }
            } else {
                const data = await response.json();
                alert(`❌ Error: ${data.message}`);
            }
        } catch (err) {
            alert(`❌ Error de conexión: ${err.message}`);
        }
    };

    const rejectUser = async () => {
        if (!showRejectModal || !rejectReason.trim()) {
            alert('Debes proporcionar un motivo para el rechazo');
            return;
        }

        try {
            const response = await fetch(`/api/admin/users/${showRejectModal}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: rejectReason })
            });

            if (response.ok) {
                alert('✅ Usuario rechazado');
                setShowRejectModal(null);
                setRejectReason('');
                fetchUsers();
                fetchStats();
                if (selectedUser?.id === showRejectModal) setSelectedUser(null);
            } else {
                const data = await response.json();
                alert(`❌ Error: ${data.message}`);
            }
        } catch (err) {
            alert(`❌ Error: ${err.message}`);
        }
    };

    const activateUser = async (userId) => {
        if (!confirm('¿Activar completamente esta cuenta?')) return;

        try {
            const response = await fetch(`/api/admin/users/${userId}/activate`, {
                method: 'POST'
            });

            if (response.ok) {
                alert('✅ Cuenta activada');
                fetchUsers();
                fetchStats();
            } else {
                const data = await response.json();
                alert(`❌ Error: ${data.message}`);
            }
        } catch (err) {
            alert(`❌ Error: ${err.message}`);
        }
    };

    const suspendUser = async (userId) => {
        const reason = prompt('Motivo de la suspensión:');
        if (!reason) return;

        try {
            const response = await fetch(`/api/admin/users/${userId}/suspend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            });

            if (response.ok) {
                alert('✅ Usuario suspendido');
                fetchUsers();
                fetchStats();
            } else {
                const data = await response.json();
                alert(`❌ Error: ${data.message}`);
            }
        } catch (err) {
            alert(`❌ Error: ${err.message}`);
        }
    };

    const addNote = async () => {
        if (!showNotesModal || !newNote.trim()) return;

        try {
            const response = await fetch(`/api/admin/users/${showNotesModal}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ note: newNote })
            });

            if (response.ok) {
                alert('✅ Nota agregada');
                setNewNote('');
                setShowNotesModal(null);
                fetchUsers();
                if (selectedUser?.id === showNotesModal) {
                    const updated = await response.json();
                    setSelectedUser(updated.user);
                }
            }
        } catch (err) {
            alert(`❌ Error: ${err.message}`);
        }
    };

    const deleteUser = async (userId) => {
        if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) return;

        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('✅ Usuario eliminado');
                fetchUsers();
                fetchStats();
                setSelectedUser(null);
            } else {
                const data = await response.json();
                alert(`❌ Error: ${data.message}`);
            }
        } catch (err) {
            alert(`❌ Error: ${err.message}`);
        }
    };

    // Filter users
    const filteredUsers = users
        .filter(user => {
            const matchesSearch =
                user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.curp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.member_id?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

            return matchesSearch && matchesStatus;
        });

    // Get status badge
    const getStatusBadge = (status) => {
        const badges = {
            pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Pendiente', icon: Clock },
            approved: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Aprobado', icon: CheckCircle },
            active: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Activo', icon: Play },
            rejected: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Rechazado', icon: XCircle },
            suspended: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Suspendido', icon: Ban }
        };
        const badge = badges[status] || badges.pending;
        const Icon = badge.icon;
        return (
            <span className={`inline-flex items-center gap-1 text-xs ${badge.bg} ${badge.text} px-2 py-1 rounded-full`}>
                <Icon className="w-3 h-3" /> {badge.label}
            </span>
        );
    };

    // Login Screen
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
                <div className="bg-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-700">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl mx-auto flex items-center justify-center mb-4">
                            <Shield className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">RAITE Admin</h1>
                        <p className="text-slate-400 text-sm mt-1">Panel de Control Seguro</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="text-slate-300 text-sm font-medium mb-2 block">
                                Contraseña de Administrador
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-orange-500"
                                    placeholder="••••••••"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-xl font-semibold hover:opacity-90"
                        >
                            Acceder al Panel
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Admin Dashboard
    return (
        <div className="min-h-screen text-white bg-slate-950">
            {/* Header */}
            <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 sticky top-0 z-40">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg">RAITE Admin</h1>
                            <p className="text-xs text-slate-400">Gestión de Usuarios</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Salir
                    </button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto p-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-xl font-bold">{stats?.total || users.length}</p>
                                <p className="text-slate-400 text-xs">Miembros</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-800 rounded-xl p-4 border border-yellow-700/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                                <Clock className="w-5 h-5 text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-xl font-bold">{stats?.pending || 0}</p>
                                <p className="text-slate-400 text-xs">Docs Pendientes</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <p className="text-xl font-bold">{stats?.approved || 0}</p>
                                <p className="text-slate-400 text-xs">Docs Aprobados</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <Play className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-xl font-bold">{stats?.active || 0}</p>
                                <p className="text-slate-400 text-xs">Miembros Activos</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                                <XCircle className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <p className="text-xl font-bold">{stats?.rejected || 0}</p>
                                <p className="text-slate-400 text-xs">Rechazados</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Governance Section */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 mb-6 overflow-hidden">
                    <button
                        onClick={() => setShowGovernance(!showGovernance)}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <Gavel className="w-5 h-5 text-purple-400" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-white">Gobernanza y Votaciones</h3>
                                <p className="text-xs text-slate-400">Administrar propuestas y votaciones</p>
                            </div>
                        </div>
                        {showGovernance ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </button>

                    {showGovernance && (
                        <div className="border-t border-slate-700 p-4 space-y-4">
                            {/* Add New Proposal Button */}
                            <div className="flex justify-between items-center">
                                <h4 className="text-slate-300 font-medium">Propuestas Activas</h4>
                                <button
                                    onClick={() => setShowNewProposal(!showNewProposal)}
                                    className="flex items-center gap-2 bg-purple-500/20 text-purple-300 px-4 py-2 rounded-lg hover:bg-purple-500/30 transition-colors"
                                >
                                    <PlusCircle className="w-4 h-4" />
                                    Nueva Propuesta
                                </button>
                            </div>

                            {/* New Proposal Form */}
                            {showNewProposal && (
                                <div className="bg-slate-900 rounded-xl p-4 space-y-4 border border-purple-500/30">
                                    <h5 className="text-white font-medium flex items-center gap-2">
                                        <Edit3 className="w-4 h-4 text-purple-400" />
                                        Crear Nueva Propuesta
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">Título de la Votación</label>
                                            <input
                                                type="text"
                                                value={newProposal.title}
                                                onChange={(e) => setNewProposal({ ...newProposal, title: e.target.value })}
                                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 outline-none"
                                                placeholder="Ej: Aprobación del presupuesto 2025"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">Fecha de Cierre</label>
                                            <input
                                                type="date"
                                                value={newProposal.endDate}
                                                onChange={(e) => setNewProposal({ ...newProposal, endDate: e.target.value })}
                                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Descripción</label>
                                        <textarea
                                            value={newProposal.description}
                                            onChange={(e) => setNewProposal({ ...newProposal, description: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 outline-none resize-none"
                                            rows="3"
                                            placeholder="Describe la propuesta a votar..."
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={() => setShowNewProposal(false)}
                                            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (newProposal.title && newProposal.endDate) {
                                                    const success = await createProposal(newProposal);
                                                    if (success) {
                                                        setNewProposal({ title: '', description: '', endDate: '', status: 'active' });
                                                        setShowNewProposal(false);
                                                        alert('✅ Propuesta creada exitosamente');
                                                    }
                                                } else {
                                                    alert('Por favor completa el título y la fecha de cierre');
                                                }
                                            }}
                                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                                        >
                                            <Save className="w-4 h-4" />
                                            Guardar Propuesta
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Proposals List */}
                            {proposals.length === 0 && !showNewProposal ? (
                                <div className="text-center py-8 text-slate-500">
                                    <Gavel className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                    <p>No hay propuestas activas</p>
                                    <p className="text-xs">Crea una nueva propuesta para iniciar una votación</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {proposals.map(proposal => (
                                        <div key={proposal.id} className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h5 className="text-white font-medium">{proposal.title}</h5>
                                                    <p className="text-xs text-slate-400 mt-1">{proposal.description}</p>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded-full ${proposal.status === 'active'
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-slate-500/20 text-slate-400'
                                                    }`}>
                                                    {proposal.status === 'active' ? '🟢 Activa' : '⏹️ Cerrada'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-slate-400">
                                                <span>Cierre: {new Date(proposal.endDate).toLocaleDateString('es-MX')}</span>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-green-400">✅ {proposal.votes?.favor || 0}</span>
                                                    <span className="text-red-400">❌ {proposal.votes?.contra || 0}</span>
                                                    <span className="text-slate-400">⏸️ {proposal.votes?.abstencion || 0}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-3">
                                                <button
                                                    onClick={() => {
                                                        const newStatus = proposal.status === 'active' ? 'closed' : 'active';
                                                        updateProposalStatus(proposal.id, newStatus);
                                                    }}
                                                    className="text-xs px-3 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
                                                >
                                                    {proposal.status === 'active' ? 'Cerrar Votación' : 'Reabrir'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm('¿Eliminar esta propuesta?')) {
                                                            deleteProposalAPI(proposal.id);
                                                        }
                                                    }}
                                                    className="text-xs px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Commitments Section */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 mb-6 overflow-hidden">
                    <button
                        onClick={() => setShowCommitments(!showCommitments)}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-yellow-400" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-white">Compromisos Cooperativos</h3>
                                <p className="text-xs text-slate-400">Cuotas, servicios y pagos</p>
                            </div>
                        </div>
                        {showCommitments ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </button>

                    {showCommitments && (
                        <div className="border-t border-slate-700 p-4 space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="text-slate-300 font-medium">Compromisos Pendientes ({commitments.filter(c => c.status === 'pending').length})</h4>
                                <button
                                    onClick={() => setShowNewCommitment(!showNewCommitment)}
                                    className="flex items-center gap-2 bg-yellow-500/20 text-yellow-300 px-4 py-2 rounded-lg hover:bg-yellow-500/30 transition-colors"
                                >
                                    <PlusCircle className="w-4 h-4" />
                                    Nuevo Compromiso
                                </button>
                            </div>

                            {/* New Commitment Form */}
                            {showNewCommitment && (
                                <div className="bg-slate-900 rounded-xl p-4 space-y-4 border border-yellow-500/30">
                                    <h5 className="text-white font-medium flex items-center gap-2">
                                        <Edit3 className="w-4 h-4 text-yellow-400" />
                                        Crear Compromiso
                                    </h5>

                                    {/* Mass Billing Toggle */}
                                    <div className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                                        <input
                                            type="checkbox"
                                            id="applyToAll"
                                            checked={newCommitment.applyToAll}
                                            onChange={(e) => setNewCommitment({ ...newCommitment, applyToAll: e.target.checked, userId: '' })}
                                            className="w-4 h-4 text-yellow-500"
                                        />
                                        <label htmlFor="applyToAll" className="text-yellow-300 text-sm font-medium">
                                            🔔 Cobrar a TODOS los cooperativistas ({users.length} miembros)
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">Usuario</label>
                                            <select
                                                value={newCommitment.userId}
                                                onChange={(e) => setNewCommitment({ ...newCommitment, userId: e.target.value })}
                                                disabled={newCommitment.applyToAll}
                                                className={`w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-500 outline-none ${newCommitment.applyToAll ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <option value="">{newCommitment.applyToAll ? 'Todos los usuarios' : 'Seleccionar usuario...'}</option>
                                                {users.map(u => (
                                                    <option key={u.id} value={u.id}>{u.full_name} ({u.curp?.substring(0, 4) || 'N/A'})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">Tipo</label>
                                            <select
                                                value={newCommitment.type}
                                                onChange={(e) => setNewCommitment({ ...newCommitment, type: e.target.value })}
                                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-500 outline-none"
                                            >
                                                <option value="cuota">Cuota</option>
                                                <option value="servicio">Servicio</option>
                                                <option value="credito">Crédito</option>
                                                <option value="otro">Otro</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">Concepto</label>
                                            <input
                                                type="text"
                                                value={newCommitment.concept}
                                                onChange={(e) => setNewCommitment({ ...newCommitment, concept: e.target.value })}
                                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-500 outline-none"
                                                placeholder="Cuota Enero 2025"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">Monto ($)</label>
                                            <input
                                                type="number"
                                                value={newCommitment.amount}
                                                onChange={(e) => setNewCommitment({ ...newCommitment, amount: e.target.value })}
                                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-500 outline-none"
                                                placeholder="500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">Fecha de Vencimiento</label>
                                            <input
                                                type="date"
                                                value={newCommitment.dueDate}
                                                onChange={(e) => setNewCommitment({ ...newCommitment, dueDate: e.target.value })}
                                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <button onClick={() => setShowNewCommitment(false)} className="px-4 py-2 text-slate-400 hover:text-white">
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={async () => {
                                                const canCreate = (newCommitment.applyToAll || newCommitment.userId) && newCommitment.amount && newCommitment.dueDate;
                                                if (canCreate) {
                                                    const result = await createCommitmentAPI(newCommitment);
                                                    if (result) {
                                                        const msg = newCommitment.applyToAll
                                                            ? `✅ Creados ${result.count || 1} compromisos para todos los usuarios`
                                                            : '✅ Compromiso creado';
                                                        setNewCommitment({ userId: '', type: 'cuota', concept: 'Cuota Cooperativa', amount: '', dueDate: '', applyToAll: false });
                                                        setShowNewCommitment(false);
                                                        alert(msg);
                                                    }
                                                } else {
                                                    alert(newCommitment.applyToAll ? 'Completa monto y fecha' : 'Completa usuario, monto y fecha');
                                                }
                                            }}
                                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
                                        >
                                            <Save className="w-4 h-4" />
                                            {newCommitment.applyToAll ? `Cobrar a ${users.length} usuarios` : 'Guardar'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Commitments List */}
                            {commitments.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                    <p>No hay compromisos registrados</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {commitments.map(c => {
                                        const user = users.find(u => u.id === c.userId);
                                        return (
                                            <div key={c.id} className="bg-slate-900 rounded-lg p-3 border border-slate-700 flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${c.status === 'paid' ? 'bg-green-500' : c.status === 'overdue' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                                                    <div>
                                                        <p className="text-white text-sm font-medium">{c.referenceNumber}</p>
                                                        <p className="text-xs text-slate-400">{user?.full_name || 'Usuario'} - {c.concept}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="text-white font-bold">${c.amount}</p>
                                                        <p className="text-xs text-slate-400">Vence: {new Date(c.dueDate).toLocaleDateString('es-MX')}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {c.status !== 'paid' && (
                                                            <button
                                                                onClick={() => updateCommitmentStatusAPI(c.id, 'paid')}
                                                                className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                                                            >
                                                                ✅ Pagado
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => deleteCommitmentAPI(c.id)}
                                                            className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Payment Status Report */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 mb-6 overflow-hidden">
                    <button
                        onClick={() => { setShowReport(!showReport); if (!showReport) fetchCommitmentReport(); }}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-400" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-white">📊 Reporte de Pagos</h3>
                                <p className="text-xs text-slate-400">Estado de cobros por miembro</p>
                            </div>
                        </div>
                        {showReport ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </button>

                    {showReport && (
                        <div className="border-t border-slate-700 p-4">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-4 gap-3 mb-4">
                                <div className="bg-slate-900 p-3 rounded-lg text-center">
                                    <p className="text-2xl font-bold text-white">{commitmentReport.length}</p>
                                    <p className="text-xs text-slate-400">Total</p>
                                </div>
                                <div className="bg-green-500/20 p-3 rounded-lg text-center">
                                    <p className="text-2xl font-bold text-green-400">{commitmentReport.filter(c => c.status === 'paid').length}</p>
                                    <p className="text-xs text-green-400">Pagados</p>
                                </div>
                                <div className="bg-yellow-500/20 p-3 rounded-lg text-center">
                                    <p className="text-2xl font-bold text-yellow-400">{commitmentReport.filter(c => c.status === 'pending' && !c.isOverdue).length}</p>
                                    <p className="text-xs text-yellow-400">Pendientes</p>
                                </div>
                                <div className="bg-red-500/20 p-3 rounded-lg text-center">
                                    <p className="text-2xl font-bold text-red-400">{commitmentReport.filter(c => c.isOverdue).length}</p>
                                    <p className="text-xs text-red-400">Vencidos</p>
                                </div>
                            </div>

                            {/* Report Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-900">
                                        <tr>
                                            <th className="text-left p-3 text-slate-400 font-medium">Miembro</th>
                                            <th className="text-left p-3 text-slate-400 font-medium">Referencia</th>
                                            <th className="text-left p-3 text-slate-400 font-medium">Concepto</th>
                                            <th className="text-right p-3 text-slate-400 font-medium">Monto</th>
                                            <th className="text-center p-3 text-slate-400 font-medium">Vencimiento</th>
                                            <th className="text-center p-3 text-slate-400 font-medium">Estado</th>
                                            <th className="text-center p-3 text-slate-400 font-medium">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {commitmentReport.map(c => (
                                            <tr key={c.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                                                <td className="p-3">
                                                    <div>
                                                        <p className="text-white font-medium">{c.userName}</p>
                                                        <p className="text-xs text-slate-500">{c.userCurp}</p>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-slate-300 font-mono text-xs">{c.referenceNumber}</td>
                                                <td className="p-3 text-slate-300">{c.concept}</td>
                                                <td className="p-3 text-right text-white font-bold">${c.amount}</td>
                                                <td className="p-3 text-center text-slate-400 text-xs">
                                                    {new Date(c.dueDate).toLocaleDateString('es-MX')}
                                                    <br />
                                                    <span className={c.isOverdue ? 'text-red-400' : c.daysUntilDue <= 5 ? 'text-yellow-400' : 'text-slate-500'}>
                                                        {c.isOverdue ? `Vencido ${Math.abs(c.daysUntilDue)}d` : `${c.daysUntilDue}d`}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    {c.status === 'paid' ? (
                                                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">✅ Pagado</span>
                                                    ) : c.isOverdue ? (
                                                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">🔴 Vencido</span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">🟡 Pendiente</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-center">
                                                    {c.status !== 'paid' && (
                                                        <button
                                                            onClick={async () => {
                                                                await updateCommitmentStatusAPI(c.id, 'paid');
                                                                fetchCommitmentReport();
                                                            }}
                                                            className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                                                        >
                                                            Marcar Pagado
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {commitmentReport.length === 0 && (
                                    <div className="text-center py-8 text-slate-500">
                                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                        <p>No hay compromisos para mostrar</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Cooperative Settings Section */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 mb-6 overflow-hidden">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <Settings className="w-5 h-5 text-blue-400" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-white">Configuración de la Cooperativa</h3>
                                <p className="text-xs text-slate-400">Datos bancarios y de contacto</p>
                            </div>
                        </div>
                        {showSettings ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </button>

                    {showSettings && (
                        <div className="border-t border-slate-700 p-8">
                            <form onSubmit={updateSettings} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-slate-300 border-b border-slate-700 pb-2">Datos Bancarios</h3>
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">Nombre del Banco</label>
                                            <input
                                                type="text"
                                                value={coopSettings.bank_name}
                                                onChange={e => setCoopSettings({ ...coopSettings, bank_name: e.target.value })}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">Titular de la Cuenta</label>
                                            <input
                                                type="text"
                                                value={coopSettings.account_holder}
                                                onChange={e => setCoopSettings({ ...coopSettings, account_holder: e.target.value })}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">CLABE Interbancaria</label>
                                            <input
                                                type="text"
                                                value={coopSettings.clabe}
                                                onChange={e => setCoopSettings({ ...coopSettings, clabe: e.target.value })}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-mono focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-slate-300 border-b border-slate-700 pb-2">Información General</h3>
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">Dirección Física</label>
                                            <textarea
                                                value={coopSettings.address}
                                                onChange={e => setCoopSettings({ ...coopSettings, address: e.target.value })}
                                                rows={3}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none resize-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">Teléfono de Contacto</label>
                                            <input
                                                type="text"
                                                value={coopSettings.phone}
                                                onChange={e => setCoopSettings({ ...coopSettings, phone: e.target.value })}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">Correo Electrónico</label>
                                            <input
                                                type="email"
                                                value={coopSettings.email}
                                                onChange={e => setCoopSettings({ ...coopSettings, email: e.target.value })}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-700 flex justify-end">
                                    <button
                                        type="submit"
                                        className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-900/20 transition-all hover:scale-105"
                                    >
                                        <Save className="w-5 h-5" /> Guardar Cambios
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, CURP, email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-orange-500"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="pending">⏳ Pendientes</option>
                        <option value="approved">✅ Aprobados</option>
                        <option value="active">🚀 Activos</option>
                        <option value="rejected">❌ Rechazados</option>
                        <option value="suspended">⛔ Suspendidos</option>
                    </select>
                    <button
                        onClick={() => { fetchUsers(); fetchStats(); }}
                        className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 hover:bg-slate-700 flex items-center gap-2"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        <span className="hidden md:inline">Actualizar</span>
                    </button>
                </div>

                {/* Users Table */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-900">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Usuario</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Contacto</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Estado</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Docs</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-700/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${user.document_type === 'license'
                                                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                                                    : 'bg-gradient-to-br from-orange-500 to-pink-500'
                                                    }`}>
                                                    {user.full_name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{user.full_name || 'Sin nombre'}</p>
                                                    <p className="text-xs text-slate-400 font-mono">{user.curp}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-xs space-y-1">
                                                <p className="flex items-center gap-1 text-slate-300">
                                                    <Mail className="w-3 h-3" /> {user.email || '-'}
                                                </p>
                                                <p className="flex items-center gap-1 text-slate-300">
                                                    <Phone className="w-3 h-3" /> {user.phone || '-'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {getStatusBadge(user.status)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {(user.ine_front_image || user.selfie_image) ? (
                                                <button
                                                    onClick={() => setShowPhotos(user)}
                                                    className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full hover:bg-purple-500/30 flex items-center gap-1"
                                                >
                                                    <Image className="w-3 h-3" /> Ver
                                                </button>
                                            ) : (
                                                <span className="text-xs text-slate-500">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    onClick={() => setSelectedUser(user)}
                                                    className="p-2 hover:bg-slate-600 rounded-lg"
                                                    title="Ver detalles"
                                                >
                                                    <Eye className="w-4 h-4 text-blue-400" />
                                                </button>
                                                {user.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => approveUser(user.id)}
                                                            className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg"
                                                            title="Aprobar"
                                                        >
                                                            <UserCheck className="w-4 h-4 text-green-400" />
                                                        </button>
                                                        <button
                                                            onClick={() => setShowRejectModal(user.id)}
                                                            className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg"
                                                            title="Rechazar"
                                                        >
                                                            <UserX className="w-4 h-4 text-red-400" />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => deleteUser(user.id)}
                                                    className="p-2 hover:bg-red-500/20 rounded-lg"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-400" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredUsers.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No se encontraron usuarios</p>
                        </div>
                    )}
                </div>
            </div>

            {/* User Detail Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-slate-800 rounded-2xl max-w-4xl w-full border border-slate-700 my-8">
                        <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800 z-10">
                            <h2 className="text-xl font-bold">Detalles del Usuario</h2>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="text-slate-400 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* Status & Actions */}
                            <div className="bg-slate-900 p-4 rounded-xl flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-slate-400 mb-1">Estado Actual</p>
                                    {getStatusBadge(selectedUser.status)}
                                </div>
                                <div className="flex gap-2">
                                    {selectedUser.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => approveUser(selectedUser.id)}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 flex items-center gap-2"
                                            >
                                                <UserCheck className="w-4 h-4" /> Aprobar
                                            </button>
                                            <button
                                                onClick={() => setShowRejectModal(selectedUser.id)}
                                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 flex items-center gap-2"
                                            >
                                                <UserX className="w-4 h-4" /> Rechazar
                                            </button>
                                        </>
                                    )}
                                    {selectedUser.status === 'approved' && (
                                        <button
                                            onClick={() => activateUser(selectedUser.id)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 flex items-center gap-2"
                                        >
                                            <Play className="w-4 h-4" /> Activar Cuenta
                                        </button>
                                    )}
                                    {selectedUser.status === 'active' && (
                                        <button
                                            onClick={() => suspendUser(selectedUser.id)}
                                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 flex items-center gap-2"
                                        >
                                            <Ban className="w-4 h-4" /> Suspender
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowNotesModal(selectedUser.id)}
                                        className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 flex items-center gap-2"
                                    >
                                        <MessageSquare className="w-4 h-4" /> Nota
                                    </button>
                                </div>
                            </div>

                            {/* Personal Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <InfoField icon={User} label="Nombre" value={selectedUser.full_name} />
                                <InfoField icon={CreditCard} label="CURP" value={selectedUser.curp} mono />
                                <InfoField icon={Mail} label="Email" value={selectedUser.email} />
                                <InfoField icon={Phone} label="Teléfono" value={selectedUser.phone} />
                                <InfoField icon={MapPin} label="Dirección" value={selectedUser.address} col2 />
                                <InfoField icon={Calendar} label="Fecha Nac." value={selectedUser.birth_date} />
                                <InfoField icon={Hash} label="Member ID" value={selectedUser.member_id} mono />
                            </div>

                            {/* Document Specific */}
                            {selectedUser.document_type === 'license' ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <InfoField icon={CreditCard} label="No. Licencia" value={selectedUser.license_number} mono />
                                    <InfoField icon={FileText} label="Tipo" value={selectedUser.license_type} />
                                    <InfoField icon={Calendar} label="Vigencia" value={selectedUser.license_vigencia} />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <InfoField icon={Hash} label="Clave Elector" value={selectedUser.clave_elector} mono />
                                    <InfoField icon={Hash} label="Sección" value={selectedUser.seccion} />
                                </div>
                            )}

                            {/* Bank & Emergency */}
                            {(selectedUser.clabe || selectedUser.emergency_contact_name) && (
                                <div className="grid grid-cols-2 gap-4">
                                    {selectedUser.clabe && <InfoField icon={CreditCard} label="CLABE" value={selectedUser.clabe} mono />}
                                    {selectedUser.bank_name && <InfoField icon={CreditCard} label="Banco" value={selectedUser.bank_name} />}
                                    {selectedUser.emergency_contact_name && <InfoField icon={User} label="Contacto Emerg." value={selectedUser.emergency_contact_name} />}
                                    {selectedUser.emergency_contact_phone && <InfoField icon={Phone} label="Tel. Emergencia" value={selectedUser.emergency_contact_phone} />}
                                </div>
                            )}

                            {/* Admin Notes */}
                            {selectedUser.admin_notes && selectedUser.admin_notes.length > 0 && (
                                <div className="bg-slate-900 p-4 rounded-xl">
                                    <h3 className="font-bold mb-3 flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5" /> Notas Administrativas
                                    </h3>
                                    <div className="space-y-2">
                                        {selectedUser.admin_notes.map((note, i) => (
                                            <div key={i} className="text-sm bg-slate-800 p-3 rounded-lg">
                                                <p className="text-slate-200">{note.note}</p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Admin ID: {note.admin_id} • {new Date(note.created_at).toLocaleString('es-MX')}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Photos Button */}
                            {(selectedUser.ine_front_image || selectedUser.selfie_image) && (
                                <button
                                    onClick={() => setShowPhotos(selectedUser)}
                                    className="w-full bg-purple-600 text-white py-3 rounded-xl hover:bg-purple-500 flex items-center justify-center gap-2"
                                >
                                    <Image className="w-5 h-5" /> Ver Documentos
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Photos Modal */}
            {showPhotos && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
                        <div className="p-6 border-b border-slate-700 flex justify-between sticky top-0 bg-slate-800">
                            <h2 className="text-xl font-bold">📷 Documentos de {showPhotos.full_name}</h2>
                            <button onClick={() => setShowPhotos(null)} className="text-slate-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <PhotoCard
                                title={showPhotos.document_type === 'license' ? 'Licencia Frente' : 'INE Frente'}
                                src={showPhotos.ine_front_image}
                            />
                            <PhotoCard
                                title={showPhotos.document_type === 'license' ? 'Licencia Reverso' : 'INE Reverso'}
                                src={showPhotos.ine_back_image}
                            />
                            <PhotoCard
                                title="Selfie"
                                src={showPhotos.selfie_image}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 rounded-2xl max-w-md w-full border border-slate-700 p-6">
                        <h3 className="text-xl font-bold mb-4">Rechazar Solicitud</h3>
                        <p className="text-slate-400 text-sm mb-4">Proporciona un motivo para el rechazo:</p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white resize-none focus:outline-none focus:border-red-500"
                            rows={4}
                            placeholder="Ej: Documentos ilegibles, datos incorrectos..."
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={rejectUser}
                                className="flex-1 bg-red-600 text-white py-3 rounded-xl hover:bg-red-500"
                            >
                                Confirmar Rechazo
                            </button>
                            <button
                                onClick={() => { setShowRejectModal(null); setRejectReason(''); }}
                                className="flex-1 bg-slate-700 text-white py-3 rounded-xl hover:bg-slate-600"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notes Modal */}
            {showNotesModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 rounded-2xl max-w-md w-full border border-slate-700 p-6">
                        <h3 className="text-xl font-bold mb-4">Agregar Nota</h3>
                        <textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white resize-none focus:outline-none focus:border-orange-500"
                            rows={4}
                            placeholder="Escribe una nota sobre este usuario..."
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={addNote}
                                className="flex-1 bg-orange-600 text-white py-3 rounded-xl hover:bg-orange-500"
                            >
                                Guardar Nota
                            </button>
                            <button
                                onClick={() => { setShowNotesModal(null); setNewNote(''); }}
                                className="flex-1 bg-slate-700 text-white py-3 rounded-xl hover:bg-slate-600"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper Components
const InfoField = ({ icon: Icon, label, value, mono, col2 }) => (
    <div className={`bg-slate-900 p-4 rounded-xl ${col2 ? 'col-span-2' : ''}`}>
        <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            {Icon && <Icon className="w-4 h-4" />}
            {label}
        </div>
        <p className={`font-semibold text-sm ${mono ? 'font-mono' : ''}`}>{value || '-'}</p>
    </div>
);

const PhotoCard = ({ title, src }) => (
    <div className="bg-slate-900 p-4 rounded-xl">
        <p className="text-slate-400 text-sm mb-3 font-medium">{title}</p>
        {src ? (
            <>
                <img
                    src={src}
                    alt={title}
                    className="w-full rounded-lg mb-3 border border-slate-700"
                />
                <div className="flex gap-2">
                    <a
                        href={src}
                        download
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-500/20 text-blue-400 py-2 rounded-lg hover:bg-blue-500/30 text-sm"
                    >
                        <Download className="w-4 h-4" /> Descargar
                    </a>
                </div>
            </>
        ) : (
            <p className="text-slate-500 text-center py-8">No disponible</p>
        )}
    </div>
);

export default App;
