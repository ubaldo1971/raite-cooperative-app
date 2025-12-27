-- Raite Cooperative PWA Schema

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'member', -- 'admin', 'member'
    curp VARCHAR(20),
    birth_date DATE,
    gender VARCHAR(20),
    address TEXT,
    phone VARCHAR(20),
    elector_key VARCHAR(50),
    profile_image TEXT,
    member_id VARCHAR(50) UNIQUE, -- Generated ID (RFC style)
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR(50), -- 'ine_front', 'ine_back', 'selfie'
    url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Governance: Official Statutes/Acts
CREATE TABLE IF NOT EXISTS official_documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    size VARCHAR(20),
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Governance: Voting
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    poll_id VARCHAR(50) DEFAULT 'presupuesto_2024', -- Hardcoded for current demo
    vote_option VARCHAR(20), -- 'favor', 'contra', 'abstencion'
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, poll_id) -- One vote per user per poll
);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR(50), -- 'earnings', 'dividend', 'token_purchase'
    amount DECIMAL(10, 2),
    description TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

