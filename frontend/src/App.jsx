import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-dark-bg text-dark-text">Loading...</div>;
    return user ? children : <Navigate to="/auth" />;
};

function AppContent() {
    return (
        <SocketProvider>
            <Router>
                <div className="min-h-screen bg-slate-50 dark:bg-dark-bg font-sans transition-colors duration-300">
                    <Routes>
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/" element={
                            <PrivateRoute>
                                <Dashboard />
                            </PrivateRoute>
                        } />
                        <Route path="/profile" element={
                            <PrivateRoute>
                                <Profile />
                            </PrivateRoute>
                        } />
                    </Routes>
                </div>
            </Router>
        </SocketProvider>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
