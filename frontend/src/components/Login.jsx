import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Login() {
    let { loginUser } = useContext(AuthContext);

    return (
        <div className="flex items-center justify-center min-h-[80vh]">
            <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Login to Splitwise Clone</h2>
                <form onSubmit={loginUser} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input type="text" name="username" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input type="password" name="password" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" required />
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 transition">Login</button>
                </form>
                <p className="mt-4 text-sm text-center">
                    Don't have an account? <Link to="/register" className="text-indigo-600 hover:text-indigo-500">Register</Link>
                </p>
            </div>
        </div>
    );
}
