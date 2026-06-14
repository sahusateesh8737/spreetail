import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    const registerUser = async (e) => {
        e.preventDefault();
        const response = await fetch('http://127.0.0.1:8000/api/register/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'username': e.target.username.value, 
                'password': e.target.password.value,
                'email': e.target.email.value
            })
        });
        
        if (response.status === 201) {
            navigate('/login');
        } else {
            const data = await response.json();
            setError(data.error || 'Registration failed');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh]">
            <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Register Account</h2>
                {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</div>}
                <form onSubmit={registerUser} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input type="text" name="username" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" name="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input type="password" name="password" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required />
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 transition">Register</button>
                </form>
                <p className="mt-4 text-sm text-center">
                    Already have an account? <Link to="/login" className="text-indigo-600 hover:text-indigo-500">Login</Link>
                </p>
            </div>
        </div>
    );
}
