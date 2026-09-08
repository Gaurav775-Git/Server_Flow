import React, { Children, createContext, useEffect, useState } from 'react'

const AuthContext = createContext();

export const AuthProvider = ({children})=>{
    const [user , setUser] = useState(null);
    const [loading , setLoading] = useState(true);

    useEffect(()=>{
        const token = localStorage.getItem('token');
        if(token){
            try{
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser({
                    id : payload.id,
                    email : payload.email,
                    name : payload.name || 'User'
                });
            }
            catch{
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    },[]);

    const login = (token , userData)=>{
        localStorage.setItem('token',token);
        setUser(userData);
    }
    
    const logout = ()=>{
        localStorage.removeItem('token');
        setUser(null);
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
