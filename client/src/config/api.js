// API Configuration for RAITE Frontend
// Update API_BASE_URL before building for production

// Development
// const API_BASE_URL = 'http://localhost:3000';

// Production - Update this with your Render URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const API = {
    BASE_URL: API_BASE_URL,

    // Auth endpoints
    LOGIN: `${API_BASE_URL}/api/users/login`,
    REGISTER: `${API_BASE_URL}/api/users/register`,
    PROFILE: `${API_BASE_URL}/api/users/profile`,

    // Dashboard endpoints
    DASHBOARD: `${API_BASE_URL}/api/dashboard`,
    EARNINGS: `${API_BASE_URL}/api/dashboard/earnings`,

    // Governance endpoints
    PROPOSALS: `${API_BASE_URL}/api/governance/proposals`,
    VOTE: `${API_BASE_URL}/api/governance/vote`,

    // Health check
    HEALTH: `${API_BASE_URL}/api/health`,
};

export default API;
