import { NavLink } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import SnapshotButton from './SnapshotButton';
import '../styles/auth.css';

interface NavItem {
    path: string;
    icon: string;
    label: string;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
    {
        title: 'Discovery',
        items: [
            { path: '/', icon: '🔬', label: 'Single Antigen' },
            { path: '/compare', icon: '⚖️', label: 'Comparison' },
            { path: '/heatmap', icon: '🧫', label: 'Tissue Heatmap' },
            { path: '/synergy', icon: '🎯', label: 'Multi-Target' },
            { path: '/drug-discovery', icon: '💊', label: 'Drug Discovery' },
            { path: '/drugs', icon: '💊', label: 'Interactions' },
        ],
    },
    {
        title: 'Intelligence',
        items: [
            { path: '/neural-bridge', icon: '🧠', label: 'Neural Bridge' },
            { path: '/research-copilot', icon: '🤖', label: 'Research Copilot' },
            { path: '/search', icon: '🔍', label: 'NLP Search' },
            { path: '/genomic-analyzer', icon: '🧬', label: 'Genomic Analyzer' },
            { path: '/multi-omics', icon: '🧬', label: 'Multi-Omics' },
            { path: '/deep-learning', icon: '🧪', label: 'Deep Learning' },
            { path: '/validation', icon: '🏆', label: 'Model Validation' },
            { path: '/disease-atlas', icon: '🌍', label: 'Disease Atlas' },
        ],
    },
    {
        title: 'Clinical',
        items: [
            { path: '/twin', icon: '🧑‍⚕️', label: 'Digital Twin' },
            { path: '/genomics', icon: '🧬', label: 'Genomic Profiler' },
            { path: '/genome-upload', icon: '📤', label: 'Genome Upload' },
            { path: '/stratify', icon: '👥', label: 'Stratification' },
            { path: '/wizard', icon: '📝', label: 'Patient Wizard' },
            { path: '/trial-matcher', icon: '🏥', label: 'Trial Matcher' },
            { path: '/trials', icon: '🧪', label: 'Clinical Trials' },
            { path: '/adverse-events', icon: '⚠️', label: 'Adverse Events' },
            { path: '/outcomes', icon: '📊', label: 'Outcomes' },
        ],
    },
    {
        title: 'Analytics',
        items: [
            { path: '/population', icon: '🌍', label: 'Population Sim' },
            { path: '/health-economics', icon: '💰', label: 'Economics' },
            { path: '/leaderboard', icon: '🏆', label: 'Leaderboard' },
            { path: '/dataset', icon: '📊', label: 'Dataset Intel' },
            { path: '/patents', icon: '⚖️', label: 'Patents' },
        ],
    },
    {
        title: 'Platform',
        items: [
            { path: '/collaboration', icon: '👥', label: 'Collaboration' },
            { path: '/community', icon: '🌐', label: 'Community' },
            { path: '/batch', icon: '📋', label: 'Batch Upload' },
            { path: '/regulatory', icon: '🛡️', label: 'Regulatory' },
        ],
    },
    {
        title: 'Enterprise',
        items: [
            { path: '/admin', icon: '🛡️', label: 'Admin' },
            { path: '/mfa', icon: '🔐', label: 'MFA Security' },
            { path: '/billing', icon: '💳', label: 'Billing' },
            { path: '/organizations', icon: '🏢', label: 'Organizations' },
            { path: '/audit', icon: '📜', label: 'Audit Log' },
            { path: '/status', icon: '⚙️', label: 'System Status' },
            { path: '/profile', icon: '👤', label: 'Profile' },
        ],
    },
];

function getInitialTheme(): 'dark' | 'light' {
    const stored = localStorage.getItem('carvanta-theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return 'light'; // Default
}

export default function Layout({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, logout } = useAuth();

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('carvanta-theme', theme);
    }, [theme]);

    // Lock body scroll when mobile sidebar is open
    useEffect(() => {
        if (sidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [sidebarOpen]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const closeSidebar = useCallback(() => setSidebarOpen(false), []);

    const initials = user?.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '??';

    return (
        <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
            {/* ── Mobile Top Bar ─────────────────────────────────── */}
            <header className="mobile-topbar">
                <button
                    className="hamburger-btn"
                    onClick={() => setSidebarOpen(prev => !prev)}
                    aria-label="Toggle navigation"
                >
                    <span className={`hamburger-icon ${sidebarOpen ? 'open' : ''}`}>
                        <span /><span /><span />
                    </span>
                </button>
                <span className="mobile-brand">◆ CARVanta</span>
            </header>

            {/* ── Overlay (mobile only) ─────────────────────────── */}
            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={closeSidebar} />
            )}

            {/* ── Sidebar ───────────────────────────────────────── */}
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <h1>◆ CARVanta</h1>
                    <p>AI-Augmented Biomarker Intelligence</p>
                </div>
                <nav className="sidebar-nav">
                    {NAV_SECTIONS.map(section => (
                        <div key={section.title} className="nav-section">
                            <div className="nav-section-title">{section.title}</div>
                            {section.items.map(item => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    end={item.path === '/'}
                                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                    onClick={closeSidebar}
                                >
                                    <span className="nav-icon">{item.icon}</span>
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>
                <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
                    <span className="theme-toggle-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
                {user && (
                    <div className="user-menu">
                        <div className="user-avatar">{initials}</div>
                        <div className="user-info">
                            <div className="user-name">{user.full_name}</div>
                            <div className="user-role">{user.role}</div>
                        </div>
                        <button className="user-logout" onClick={logout} title="Sign out">🚪</button>
                    </div>
                )}
                <div className="sidebar-footer">
                    <div>CARVanta v5 · Enterprise</div>
                    <div>© CARVanta — carvanta.ai</div>
                </div>
            </aside>
            <main className="main-content">
                {children}
                <SnapshotButton />
            </main>
        </div>
    );
}

