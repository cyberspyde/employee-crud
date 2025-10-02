import { useState } from 'react';

export function Settings() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSave = () => {
    localStorage.setItem('adminPassword', password);
    setMessage('Password updated successfully!');
    setPassword('');
  };

  return (
    <div className="p-8">
      <h2 className="mb-4 text-2xl font-bold">Settings</h2>
      <div className="max-w-md">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Admin Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <button
          onClick={handleSave}
          className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Save
        </button>
        {message && <p className="mt-4 text-green-500">{message}</p>}
      </div>
    </div>
  );
}