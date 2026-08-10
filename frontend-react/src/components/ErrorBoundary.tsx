import { Component } from 'react';

/**
 * ErrorBoundary that auto-resets when the URL changes.
 *
 * Without this, a crash on one page would permanently block all other
 * pages because the ErrorBoundary sits above the Router's <Routes>.
 * We listen to `popstate` + periodic location checks to detect navigation
 * and clear the error state, letting the new route render cleanly.
 */
export default class ErrorBoundary extends Component {
    _lastPath: string;

    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, info: null };
        this._lastPath = window.location.pathname;
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('React Error Boundary caught:', error, info);
        this.setState({ info });
    }

    componentDidMount() {
        // Listen for browser back/forward
        window.addEventListener('popstate', this._onLocationChange);
        // Also poll for pushState changes (React Router uses pushState, not popstate)
        this._locationInterval = setInterval(this._checkLocationChange, 200);
    }

    componentWillUnmount() {
        window.removeEventListener('popstate', this._onLocationChange);
        clearInterval(this._locationInterval);
    }

    _onLocationChange = () => {
        if (this.state.hasError) {
            this.setState({ hasError: false, error: null, info: null });
        }
    };

    _checkLocationChange = () => {
        const currentPath = window.location.pathname;
        if (currentPath !== this._lastPath) {
            this._lastPath = currentPath;
            if (this.state.hasError) {
                this.setState({ hasError: false, error: null, info: null });
            }
        }
    };

    _locationInterval: any;

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 40, color: '#EF4444', background: '#1E293B', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
                    <h2>⚠️ Something went wrong</h2>
                    <pre style={{ color: '#F59E0B', fontSize: 13, whiteSpace: 'pre-wrap', marginTop: 16 }}>
                        {this.state.error?.toString()}
                    </pre>
                    <pre style={{ color: '#94A3B8', fontSize: 11, whiteSpace: 'pre-wrap', marginTop: 12 }}>
                        {this.state.info?.componentStack}
                    </pre>
                    <button onClick={() => this.setState({ hasError: false, error: null, info: null })}
                        style={{ marginTop: 20, padding: '8px 20px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                        Try Again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
