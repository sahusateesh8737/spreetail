import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import AddExpenseModal from './AddExpenseModal';
import SettleUpModal from './SettleUpModal';

export default function ExpenseList() {
  const { id } = useParams();
  const { authTokens, user } = useContext(AuthContext);
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSettleUp, setShowSettleUp] = useState(false);

  const fetchGroupData = () => {
    const headers = { 'Authorization': `Bearer ${authTokens?.access}` };
    
    fetch(`http://127.0.0.1:8000/api/groups/${id}/`, { headers })
      .then(res => res.json())
      .then(data => setGroup(data));

    fetch('http://127.0.0.1:8000/api/expenses/', { headers })
      .then(res => res.json())
      .then(data => {
        setExpenses(Array.isArray(data) ? data.filter(e => e.group === parseInt(id)) : []);
      });
  };

  useEffect(() => {
    if(authTokens) fetchGroupData();
  }, [id, authTokens]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    const res = await fetch(`http://127.0.0.1:8000/api/groups/${id}/add_user/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authTokens?.access}`
      },
      body: JSON.stringify({ username: newUsername })
    });
    
    if (res.ok) {
      setNewUsername('');
      fetchGroupData();
    } else {
      alert("User not found or error adding member.");
    }
  };

  if (!group) return <div className="p-8 text-center animate-pulse">Loading group...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      
      {/* Sidebar: Group Management */}
      <div className="md:col-span-1 space-y-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-3">Members ({group.members.length})</h3>
          <ul className="space-y-2 mb-4">
            {group.members.map(m => (
              <li key={m.id} className="text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs">{m.username[0].toUpperCase()}</span>
                {m.username}
              </li>
            ))}
          </ul>
          
          <form onSubmit={handleAddMember} className="flex flex-col gap-2 border-t pt-4">
            <label className="text-xs font-semibold text-gray-500">Invite Existing User</label>
            <input 
              type="text" 
              placeholder="Username" 
              className="border border-gray-300 rounded px-2 py-1 text-sm"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
            <button type="submit" className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded text-sm hover:bg-indigo-100 font-medium">Add to Group</button>
          </form>
        </div>
      </div>

      {/* Main Content: Expenses */}
      <div className="md:col-span-3 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">{group.name}</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowSettleUp(true)} className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 font-medium">Settle Up</button>
            <button onClick={() => setShowAddExpense(true)} className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 font-medium">Add Expense</button>
          </div>
        </div>

        <div className="space-y-4">
          {expenses.map(e => (
            <Link 
              key={e.id} 
              to={`/expense/${e.id}`}
              className="flex items-center justify-between p-4 rounded-md border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition"
            >
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">{new Date(e.date).toLocaleDateString()}</span>
                <span className="font-semibold text-lg">{e.description}</span>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">{e.payer.username} paid</div>
                <div className="font-bold text-indigo-700">{e.total_amount} {e.currency}</div>
              </div>
            </Link>
          ))}
          {expenses.length === 0 && <p className="text-gray-500 text-center py-8">No expenses here yet.</p>}
        </div>
      </div>

      {showAddExpense && (
        <AddExpenseModal 
          group={group} 
          onClose={() => setShowAddExpense(false)} 
          onSuccess={() => { setShowAddExpense(false); fetchGroupData(); }}
        />
      )}

      {showSettleUp && (
        <SettleUpModal 
          group={group} 
          onClose={() => setShowSettleUp(false)} 
          onSuccess={() => { setShowSettleUp(false); fetchGroupData(); }}
        />
      )}

    </div>
  );
}
