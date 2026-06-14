import { useState, useEffect, useRef, useContext } from 'react';
import { useParams } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

export default function ExpenseDetail() {
  const { id } = useParams();
  const { authTokens, user } = useContext(AuthContext);
  const [expense, setExpense] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const ws = useRef(null);

  useEffect(() => {
    if (!authTokens) return;

    fetch(`http://127.0.0.1:8000/api/expenses/${id}/`, {
      headers: { 'Authorization': `Bearer ${authTokens.access}` }
    })
      .then(res => res.json())
      .then(data => setExpense(data));

    // Connect WebSocket
    ws.current = new WebSocket(`ws://127.0.0.1:8000/ws/chat/expense/${id}/`);
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setChatMessages(prev => [...prev, data]);
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [id, authTokens]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (msgInput.trim() && ws.current && user) {
      ws.current.send(JSON.stringify({
        message: msgInput,
        username: user.username
      }));
      setMsgInput('');
    }
  };

  if (!expense) return <div className="p-8 text-center animate-pulse">Loading expense...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Expense Info */}
      <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">{expense.description}</h2>
        <p className="text-xl text-indigo-600 font-semibold mb-6">{expense.total_amount} {expense.currency}</p>
        
        <div className="bg-gray-50 rounded p-4 mb-6">
          <p className="text-gray-600 mb-1">Paid by <strong>{expense.payer.username}</strong> on {new Date(expense.date).toLocaleDateString()}</p>
          {expense.notes && <p className="text-sm text-gray-500 italic">Note: {expense.notes}</p>}
        </div>

        <h3 className="text-lg font-bold mb-3">Split Details</h3>
        <ul className="space-y-2">
          {expense.splits.map(split => (
            <li key={split.id} className="flex justify-between border-b border-gray-100 pb-2">
              <span className="flex items-center gap-2">
                <span>{split.user.username}</span>
                <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">{split.split_type}</span>
              </span>
              <span className="font-mono">{split.amount_owed} {expense.currency}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Real-time Chat */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col h-[500px]">
        <h3 className="text-lg font-bold mb-3 border-b pb-2">Live Chat</h3>
        <div className="flex-1 overflow-y-auto mb-4 space-y-3">
          {chatMessages.length === 0 && <p className="text-sm text-gray-400 text-center mt-4">No messages yet.</p>}
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.username === user?.username ? 'items-end' : 'items-start'}`}>
              <span className="text-xs text-gray-500 mb-0.5">{msg.username}</span>
              <div className={`px-3 py-2 rounded-lg text-sm max-w-[85%] ${msg.username === user?.username ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                {msg.message}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={sendMessage} className="flex gap-2">
          <input 
            type="text" 
            value={msgInput}
            onChange={(e) => setMsgInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          />
          <button type="submit" className="bg-indigo-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-indigo-700">Send</button>
        </form>
      </div>
    </div>
  );
}
