import { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';

export default function SettleUpModal({ group, onClose, onSuccess }) {
  const { authTokens, user } = useContext(AuthContext);
  const [payeeId, setPayeeId] = useState('');
  const [amount, setAmount] = useState('');

  const currentUserObj = group.members.find(m => m.username === user.username);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!payeeId || !amount || !currentUserObj) return;

    await fetch('http://127.0.0.1:8000/api/settlements/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authTokens?.access}`
      },
      body: JSON.stringify({
        payer: currentUserObj.id,
        payee: payeeId,
        amount: amount,
        currency: 'INR',
        date: new Date().toISOString().split('T')[0],
        notes: "Settled up"
      })
    });
    
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <h2 className="text-xl font-bold mb-4 text-center">Settle Up</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">You are paying to:</label>
            <select 
              required
              value={payeeId} 
              onChange={(e) => setPayeeId(e.target.value)} 
              className="mt-1 block w-full border rounded p-2"
            >
              <option value="">Select a member...</option>
              {group.members.filter(m => m.id !== currentUserObj?.id).map(m => (
                <option key={m.id} value={m.id}>{m.username}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount (INR)</label>
            <input 
              type="number" 
              required 
              min="1" 
              step="0.01" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              className="mt-1 block w-full border rounded p-2" 
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border rounded hover:bg-gray-100">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700">Record Payment</button>
          </div>
        </form>
      </div>
    </div>
  );
}
