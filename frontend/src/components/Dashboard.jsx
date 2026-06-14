import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

export default function Dashboard() {
  const [groups, setGroups] = useState([]);
  const [balances, setBalances] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const { authTokens } = useContext(AuthContext);

  const fetchDashboardData = () => {
    const headers = { 'Authorization': `Bearer ${authTokens?.access}` };

    fetch('http://127.0.0.1:8000/api/groups/', { headers })
      .then(res => res.json())
      .then(data => setGroups(Array.isArray(data) ? data : []));

    fetch('http://127.0.0.1:8000/api/expenses/balances/', { headers })
      .then(res => res.json())
      .then(data => setBalances(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    if (authTokens) {
      fetchDashboardData();
    }
  }, [authTokens]);

  const createGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    await fetch('http://127.0.0.1:8000/api/groups/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authTokens?.access}`
      },
      body: JSON.stringify({ name: newGroupName })
    });
    setNewGroupName('');
    fetchDashboardData();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Groups Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Your Groups</h2>
        
        <form onSubmit={createGroup} className="flex gap-2 mb-6">
          <input 
            type="text" 
            placeholder="New Group Name" 
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded shadow text-sm hover:bg-indigo-700">Create</button>
        </form>

        <div className="space-y-4">
          {groups.map(g => (
            <Link 
              key={g.id} 
              to={`/group/${g.id}`}
              className="block p-4 rounded-md border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition"
            >
              <h3 className="font-medium text-lg">{g.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{g.members.length} members</p>
            </Link>
          ))}
          {groups.length === 0 && <p className="text-gray-500 text-sm italic">You are not in any groups yet.</p>}
        </div>
      </div>

      {/* Balances Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">All Balances</h2>
        <div className="space-y-3">
          {balances.map(b => (
            <div key={b.username} className="flex justify-between items-center p-3 rounded bg-gray-50">
              <span className="font-medium">{b.username}</span>
              <span className={`font-bold ${b.net_balance > 0 ? 'text-green-600' : b.net_balance < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                {b.net_balance > 0 ? '+' : ''}{b.net_balance} INR
              </span>
            </div>
          ))}
          {balances.length === 0 && <p className="text-gray-500 text-sm italic">No balance data available.</p>}
        </div>
      </div>
    </div>
  );
}
