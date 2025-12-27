const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/db.json');

// Helper to read DB
const readDb = () => {
    if (!fs.existsSync(DB_PATH)) {
        return { users: [], official_documents: [], votes: [], transactions: [] };
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
};

// Helper to write DB
const writeDb = (data) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

module.exports = {
    // Users
    createUser: (userData) => {
        const db = readDb();
        const newUser = {
            id: db.users.length + 1,
            ...userData,
            created_at: new Date().toISOString()
        };
        db.users.push(newUser);
        writeDb(db);
        return newUser;
    },
    getUserById: (id) => {
        const db = readDb();
        return db.users.find(u => u.id === parseInt(id));
    },
    getUserByEmail: (email) => {
        const db = readDb();
        return db.users.find(u => u.email === email);
    },
    updateUserAvatar: (id, avatarUrl) => {
        const db = readDb();
        const user = db.users.find(u => u.id === parseInt(id));
        if (user) {
            user.profile_image = avatarUrl;
            writeDb(db);
        }
        return user;
    },
    getAllUsers: () => {
        const db = readDb();
        return db.users || [];
    },
    deleteUser: (id) => {
        const db = readDb();
        // Compare as strings to handle both numeric and string IDs
        const idStr = String(id);
        const index = db.users.findIndex(u => String(u.id) === idStr);
        if (index !== -1) {
            db.users.splice(index, 1);
            writeDb(db);
            return true;
        }
        return false;
    },
    updateUser: (id, updates) => {
        const db = readDb();
        const idStr = String(id);
        const index = db.users.findIndex(u => String(u.id) === idStr);
        if (index !== -1) {
            // Only update allowed fields
            const allowedFields = ['full_name', 'curp', 'address', 'clave_elector', 'seccion', 'birth_date', 'license_number', 'license_type', 'document_type', 'ine_verified', 'license_verified'];
            allowedFields.forEach(field => {
                if (updates[field] !== undefined) {
                    db.users[index][field] = updates[field];
                }
            });
            writeDb(db);
            return db.users[index];
        }
        return null;
    },

    // Governance Documents
    getDocuments: () => {
        const db = readDb();
        return db.official_documents || [];
    },
    addDocument: (docData) => {
        const db = readDb();
        const newDoc = {
            id: (db.official_documents.length || 0) + 1,
            ...docData,
            uploaded_at: new Date().toISOString()
        };
        if (!db.official_documents) db.official_documents = [];
        db.official_documents.push(newDoc);
        writeDb(db);
        return newDoc;
    },
    deleteDocument: (id) => {
        const db = readDb();
        if (db.official_documents) {
            db.official_documents = db.official_documents.filter(d => d.id !== parseInt(id));
            writeDb(db);
        }
    },

    // Votes
    vote: (voteData) => {
        const db = readDb();
        if (!db.votes) db.votes = [];

        // NOTE: Duplication check removed for demo - allows multiple votes
        // const exists = db.votes.find(v => v.user_id === voteData.user_id && v.poll_id === voteData.poll_id);
        // if (exists) throw new Error('User already voted');

        const newVote = {
            id: db.votes.length + 1,
            ...voteData,
            timestamp: new Date().toISOString()
        };
        db.votes.push(newVote);
        writeDb(db);
        return newVote;
    },
    getVoteStats: (pollId) => {
        const db = readDb();
        const votes = db.votes ? db.votes.filter(v => v.poll_id === pollId) : [];
        const stats = { favor: 0, contra: 0, abstencion: 0, total: 0 };
        votes.forEach(v => {
            if (stats[v.vote_option] !== undefined) {
                stats[v.vote_option]++;
                stats.total++;
            }
        });
        return stats;
    },

    // Dashboard
    getTransactions: (userId) => {
        const db = readDb();
        return db.transactions ? db.transactions.filter(t => t.user_id === parseInt(userId)) : [];
    },

    // New methods for enhanced security and validation
    getUserByPhone: (phone) => {
        const db = readDb();
        return db.users.find(u => u.phone === phone);
    },
    getUserByCURP: (curp) => {
        const db = readDb();
        return db.users.find(u => u.curp === curp);
    },
    getUserByMemberId: (memberId) => {
        const db = readDb();
        return db.users.find(u => u.member_id === memberId);
    },
    updateUserStatus: (id, status) => {
        const db = readDb();
        const user = db.users.find(u => u.id === parseInt(id));
        if (user) {
            user.status = status;
            user.status_updated_at = new Date().toISOString();
            writeDb(db);
        }
        return user;
    },
    updateUserVerification: (id, field, value) => {
        const db = readDb();
        const user = db.users.find(u => u.id === parseInt(id));
        if (user) {
            user[field] = value;
            writeDb(db);
        }
        return user;
    },
    getUsersByStatus: (status) => {
        const db = readDb();
        return db.users.filter(u => u.status === status);
    },
    addVerificationCode: (userId, code, type) => {
        const db = readDb();
        if (!db.verification_codes) db.verification_codes = [];

        const verification = {
            id: db.verification_codes.length + 1,
            user_id: userId,
            code,
            type, // 'email' or 'phone'
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min
            verified: false
        };

        db.verification_codes.push(verification);
        writeDb(db);
        return verification;
    },
    verifyCode: (userId, code, type) => {
        const db = readDb();
        if (!db.verification_codes) return false;

        const verification = db.verification_codes.find(v =>
            v.user_id === userId &&
            v.code === code &&
            v.type === type &&
            !v.verified &&
            new Date(v.expires_at) > new Date()
        );

        if (verification) {
            verification.verified = true;
            verification.verified_at = new Date().toISOString();
            writeDb(db);
            return true;
        }

        return false;
    },
    addAdminNote: (userId, note, adminId) => {
        const db = readDb();
        const user = db.users.find(u => u.id === parseInt(userId));
        if (user) {
            if (!user.admin_notes) user.admin_notes = [];
            user.admin_notes.push({
                note,
                admin_id: adminId,
                created_at: new Date().toISOString()
            });
            writeDb(db);
        }
        return user;
    },

    // Proposals (Votaciones)
    getProposals: () => {
        const db = readDb();
        return db.proposals || [];
    },
    createProposal: (proposalData) => {
        const db = readDb();
        if (!db.proposals) db.proposals = [];
        const newProposal = {
            id: Date.now(),
            ...proposalData,
            votes: { favor: 0, contra: 0, abstencion: 0 },
            createdAt: new Date().toISOString()
        };
        db.proposals.push(newProposal);
        writeDb(db);
        return newProposal;
    },
    updateProposal: (id, updates) => {
        const db = readDb();
        if (!db.proposals) return null;
        const index = db.proposals.findIndex(p => p.id === parseInt(id) || p.id === id);
        if (index !== -1) {
            db.proposals[index] = { ...db.proposals[index], ...updates };
            writeDb(db);
            return db.proposals[index];
        }
        return null;
    },
    deleteProposal: (id) => {
        const db = readDb();
        if (!db.proposals) return false;
        const initialLength = db.proposals.length;
        db.proposals = db.proposals.filter(p => p.id !== parseInt(id) && p.id !== id);
        if (db.proposals.length < initialLength) {
            writeDb(db);
            return true;
        }
        return false;
    },
    voteOnProposal: (proposalId, voteType) => {
        const db = readDb();
        if (!db.proposals) return null;
        const proposal = db.proposals.find(p => p.id === parseInt(proposalId) || p.id === proposalId);
        if (proposal && proposal.votes) {
            if (voteType === 'favor') proposal.votes.favor++;
            else if (voteType === 'contra') proposal.votes.contra++;
            else if (voteType === 'abstencion') proposal.votes.abstencion++;
            writeDb(db);
            return proposal;
        }
        return null;
    },

    // Commitments (Compromisos Cooperativos)
    // Month codes for reference generation
    MONTH_CODES: ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'],

    generateReference: function (curp, dueDate) {
        const curpPrefix = curp.substring(0, 4).toUpperCase();
        const date = new Date(dueDate);
        const monthCode = this.MONTH_CODES[date.getMonth()];
        const yearCode = String(date.getFullYear()).slice(-2);
        return `${curpPrefix}-${monthCode}${yearCode}`;
    },

    getCommitments: (userId) => {
        const db = readDb();
        if (!db.commitments) return [];
        if (userId) {
            return db.commitments.filter(c => c.userId === parseInt(userId));
        }
        return db.commitments;
    },

    createCommitment: function (commitmentData) {
        const db = readDb();
        if (!db.commitments) db.commitments = [];

        // Get user's CURP for reference
        const user = db.users.find(u => u.id === parseInt(commitmentData.userId));
        const curp = user?.curp || user?.member_id || 'XXXX';

        const reference = this.generateReference(curp, commitmentData.dueDate);

        const newCommitment = {
            id: Date.now(),
            ...commitmentData,
            userId: parseInt(commitmentData.userId),
            referenceNumber: reference,
            status: commitmentData.status || 'pending',
            paidDate: null,
            createdAt: new Date().toISOString()
        };
        db.commitments.push(newCommitment);
        writeDb(db);
        return newCommitment;
    },

    updateCommitmentStatus: (id, status, paidDate = null) => {
        const db = readDb();
        if (!db.commitments) return null;
        const commitment = db.commitments.find(c => c.id === parseInt(id) || c.id === id);
        if (commitment) {
            commitment.status = status;
            if (status === 'paid') {
                commitment.paidDate = paidDate || new Date().toISOString();
            }
            writeDb(db);
            return commitment;
        }
        return null;
    },

    deleteCommitment: (id) => {
        const db = readDb();
        if (!db.commitments) return false;
        const initialLength = db.commitments.length;
        db.commitments = db.commitments.filter(c => c.id !== parseInt(id) && c.id !== id);
        if (db.commitments.length < initialLength) {
            writeDb(db);
            return true;
        }
        return false;
    },

    // Cooperative Settings
    getCooperativeSettings: () => {
        const db = readDb();
        if (!db.cooperative_settings) {
            // Default settings if initialized for the first time
            db.cooperative_settings = {
                bank_name: 'BBVA Bancomer',
                account_holder: 'Cooperativa RAITE S.C. de R.L.',
                clabe: '012180015544332211',
                address: 'Av. Revolución 1234, Zona Centro, Tijuana, B.C.',
                phone: '664 123 4567',
                email: 'contacto@raite.coop'
            };
            writeDb(db);
        }
        return db.cooperative_settings;
    },

    updateCooperativeSettings: (settings) => {
        const db = readDb();
        db.cooperative_settings = { ...db.cooperative_settings, ...settings };
        writeDb(db);
        return db.cooperative_settings;
    }
};
