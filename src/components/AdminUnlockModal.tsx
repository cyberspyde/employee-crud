import { useState } from 'react';

interface AdminUnlockModalProps {
  onUnlock: () => void;
}

export function AdminUnlockModal({ onUnlock }: AdminUnlockModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleUnlock = () => {
    const storedPassword = localStorage.getItem('adminPassword') || 'admin123';
    if (password === storedPassword) {
      onUnlock();
    } else {
      setError('Incorrect password');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="rounded-lg bg-white p-8 shadow-lg">
        <h2 className="mb-4 text-xl font-bold">Admin Unlock</h2>
        <p className="mb-4">Enter the password to access the application.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-gray-300 p-2"
        />
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        <button
          onClick={handleUnlock}
          className="mt-4 w-full rounded-md bg-blue-500 p-2 text-white hover:bg-blue-600"
        >
          Unlock
        </button>
      </div>
    </div>
  );
}