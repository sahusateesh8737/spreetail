import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [authTokens, setAuthTokens] = useState(() => localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const loginUser = async (e) => {
        e.preventDefault();
        const response = await fetch('http://127.0.0.1:8000/api/token/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({'username': e.target.username.value, 'password': e.target.password.value})
        });
        const data = await response.json();

        if (response.status === 200) {
            setAuthTokens(data);
            setUser({'username': e.target.username.value});
            localStorage.setItem('authTokens', JSON.stringify(data));
            localStorage.setItem('username', e.target.username.value);
            navigate('/');
        } else {
            alert('Something went wrong!');
        }
    };

    const logoutUser = () => {
        setAuthTokens(null);
        setUser(null);
        localStorage.removeItem('authTokens');
        localStorage.removeItem('username');
        navigate('/login');
    };

    useEffect(() => {
        if(authTokens){
            const savedUser = localStorage.getItem('username');
            if(savedUser){
                setUser({'username': savedUser});
            }
        }
        setLoading(false);
    }, [authTokens]);

    const contextData = {
        user: user,
        authTokens: authTokens,
        loginUser: loginUser,
        logoutUser: logoutUser,
    };

    return (
        <AuthContext.Provider value={contextData}>
            {loading ? null : children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
