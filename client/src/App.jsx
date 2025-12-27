import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import MainLayout from './layouts/MainLayout';
import Welcome from './pages/Welcome';
import Register from './pages/Register';
import RegisterScan from './pages/RegisterScan';
import RegisterManual from './pages/RegisterManual';
import RegisterCloud from './pages/RegisterCloud';
import RegisterPuter from './pages/RegisterPuter';
import RegisterLicense from './pages/RegisterLicense';
import RegisterUnified from './pages/RegisterUnified';
import Login from './pages/Login';
import PendingApproval from './pages/PendingApproval';
import Dashboard from './pages/Dashboard';
import { Community, Services, Governance, Profile } from './pages/SecondaryPages';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
          <Navbar />
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/register" element={<RegisterUnified />} />
              <Route path="/register-ine" element={<RegisterCloud />} />
              <Route path="/register-license" element={<RegisterLicense />} />
              <Route path="/register-manual" element={<RegisterManual />} />
              <Route path="/register-scan" element={<RegisterScan />} />
              <Route path="/register-puter" element={<RegisterPuter />} />
              <Route path="/login" element={<Login />} />
              <Route path="/pending-approval" element={<PendingApproval />} />

              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/community" element={<Community />} />
                <Route path="/services" element={<Services />} />
                <Route path="/governance" element={<Governance />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Routes>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
