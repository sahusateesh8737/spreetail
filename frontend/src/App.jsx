import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthProvider } from './context/AuthContext';
import AuthContext from './context/AuthContext';
import Dashboard from './components/Dashboard';
import ExpenseList from './components/ExpenseList';
import ExpenseDetail from './components/ExpenseDetail';
import Login from './components/Login';
import Register from './components/Register';

const PrivateRoute = ({ children }) => {
  let { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
};

function Navigation() {
  let { user, logoutUser } = useContext(AuthContext);
  
  return (
    <nav className="bg-indigo-600 text-white shadow-md p-4 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold tracking-tight">Splitwise Clone</Link>
      <div className="text-sm flex items-center gap-4">
        {user ? (
          <>
            <span>Welcome, <strong>{user.username}</strong></span>
            <button onClick={logoutUser} className="bg-indigo-700 px-3 py-1 rounded hover:bg-indigo-800">Logout</button>
          </>
        ) : (
          <Link to="/login" className="bg-white text-indigo-600 px-3 py-1 rounded font-medium">Login</Link>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 text-gray-900">
          <Navigation />
          <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/group/:id" element={<PrivateRoute><ExpenseList /></PrivateRoute>} />
              <Route path="/expense/:id" element={<PrivateRoute><ExpenseDetail /></PrivateRoute>} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
