import { createContext, useContext, useEffect, useState } from 'react'
import { logoutUser, verifyUser } from './authApi'

const AuthContext = createContext();

export const AuthProvider = ({children})=>{
    const [user , setUser] = useState(null);
    const [loading , setLoading] = useState(true);

    useEffect(() => {
        const restoreSession = async () => {
            try {
                const response = await verifyUser();
                setUser(response.user);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        restoreSession();
    },[]);

    const login = (userData) => {
        setUser(userData);
    }
    
    const logout = async () => {
        try {
            await logoutUser();
        } finally {
            setUser(null);
        }
    }

    return (
        <AuthContext.Provider value={{user , loading , login, logout , isAuth :!!user}}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
