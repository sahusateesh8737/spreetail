import { useState, useContext, useEffect } from 'react';
import AuthContext from '../context/AuthContext';

export default function AddExpenseModal({ group, onClose, onSuccess }) {
  const { authTokens, user } = useContext(AuthContext);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [splitType, setSplitType] = useState('equal');
  const [splits, setSplits] = useState([]);
  
  useEffect(() => {
    // Initialize splits data based on group members
    setSplits(group.members.map(m => ({
      user_id: m.id,
      username: m.username,
      selected: true,
      value: '' // Used for exact amount, percentage, or share value
    })));
  }, [group]);

  const handleSplitChange = (userId, field, value) => {
    setSplits(splits.map(s => s.user_id === userId ? { ...s, [field]: value } : s));
  };

  const calculateFinalSplits = () => {
    const totalAmt = parseFloat(amount);
    if (isNaN(totalAmt) || totalAmt <= 0) return [];

    let finalSplits = [];
    const activeSplits = splits.filter(s => s.selected);

    if (splitType === 'equal') {
      const splitAmt = (totalAmt / activeSplits.length).toFixed(2);
      activeSplits.forEach(s => {
        finalSplits.push({ user_id: s.user_id, amount_owed: splitAmt, split_type: 'equal' });
      });
    } else if (splitType === 'unequal') {
      activeSplits.forEach(s => {
        finalSplits.push({ user_id: s.user_id, amount_owed: s.value || 0, split_type: 'unequal', split_details: `Exact ${s.value}` });
      });
    } else if (splitType === 'percentage') {
      activeSplits.forEach(s => {
        const pct = parseFloat(s.value) || 0;
        const owed = (totalAmt * (pct / 100)).toFixed(2);
        finalSplits.push({ user_id: s.user_id, amount_owed: owed, split_type: 'percentage', split_details: `${pct}%` });
      });
    } else if (splitType === 'share') {
      const totalShares = activeSplits.reduce((acc, s) => acc + (parseFloat(s.value) || 0), 0);
      activeSplits.forEach(s => {
        const share = parseFloat(s.value) || 0;
        const owed = totalShares > 0 ? (totalAmt * (share / totalShares)).toFixed(2) : 0;
        finalSplits.push({ user_id: s.user_id, amount_owed: owed, split_type: 'share', split_details: `${share} shares` });
      });
    }
    return finalSplits;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentUserObj = group.members.find(m => m.username === user.username);
    if (!currentUserObj) {
      alert("You are not a member of this group!");
      return;
    }

    const splitsData = calculateFinalSplits();
    
    // Quick validation
    if (splitType === 'unequal') {
      const sum = splitsData.reduce((acc, s) => acc + parseFloat(s.amount_owed), 0);
      if (Math.abs(sum - parseFloat(amount)) > 0.1) {
        alert("Exact amounts do not add up to total amount!");
        return;
      }
    } else if (splitType === 'percentage') {
      const sumPct = splits.filter(s=>s.selected).reduce((acc, s) => acc + parseFloat(s.value || 0), 0);
      if (Math.abs(sumPct - 100) > 0.1) {
        alert("Percentages must add up to 100!");
        return;
      }
    }

    await fetch('http://127.0.0.1:8000/api/expenses/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authTokens?.access}`
      },
      body: JSON.stringify({
        group: group.id,
        description,
        total_amount: amount,
        currency: 'INR',
        date: new Date().toISOString().split('T')[0],
        payer_id: currentUserObj.id,
        splits_data: splitsData
      })
    });
    
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add an Expense</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Description</label>
            <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Total Amount</label>
            <input type="number" required min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 block w-full border rounded p-2" />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Split By</label>
            <div className="flex gap-2">
              {['equal', 'unequal', 'percentage', 'share'].map(type => (
                <button 
                  key={type} type="button" 
                  onClick={() => setSplitType(type)}
                  className={`px-3 py-1 rounded text-sm capitalize ${splitType === type ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 border-t pt-4">
            <label className="block text-sm font-medium">Split Details</label>
            {splits.map(s => (
              <div key={s.user_id} className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={s.selected} 
                  onChange={(e) => handleSplitChange(s.user_id, 'selected', e.target.checked)} 
                />
                <span className="flex-1 text-sm">{s.username}</span>
                {s.selected && splitType !== 'equal' && (
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder={splitType === 'percentage' ? '%' : splitType === 'share' ? 'shares' : 'exact amt'}
                    value={s.value}
                    onChange={(e) => handleSplitChange(s.user_id, 'value', e.target.value)}
                    className="border rounded p-1 w-24 text-sm"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border rounded hover:bg-gray-100">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700">Save Expense</button>
          </div>
        </form>
      </div>
    </div>
  );
}
