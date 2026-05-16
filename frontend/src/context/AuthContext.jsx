import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const { data } = await axios.get(`${API}/api/auth/profile`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setUser(data);
                } catch (error) {
                    console.error('Error fetching user:', error);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        fetchUser();
    }, []);

    /**
     * Complete login process.
     */
    const login = async (email, password) => {
        const { data } = await axios.post(`${API}/api/auth/login`, { email, password });
        localStorage.setItem('token', data.token);
        // Fetch full profile (includes createdAt) instead of using JWT payload
        const profileRes = await axios.get(`${API}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${data.token}` }
        });
        setUser(profileRes.data);
        return data;
    };

    const register = async (name, email, password) => {
        const { data } = await axios.post(`${API}/api/auth/register`, { name, email, password });
        return data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const googleLogin = async (credential) => {
        const { data } = await axios.post(`${API}/api/auth/google`, { credential });
        localStorage.setItem('token', data.token);
        // Fetch full profile (includes createdAt) instead of using JWT payload
        const profileRes = await axios.get(`${API}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${data.token}` }
        });
        setUser(profileRes.data);
        return data;
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, googleLogin, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
