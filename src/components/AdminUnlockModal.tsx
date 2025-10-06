import { useState } from "react";

interface AdminUnlockModalProps {
  onUnlock: () => void;
}

export function AdminUnlockModal({ onUnlock }: AdminUnlockModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleUnlock = () => {
    const storedPassword = localStorage.getItem("adminPassword") || "admin123";
    if (password === storedPassword) {
      onUnlock();
    } else {
      setError("Noto'g'ri parol");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70">
      <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-slate-800 dark:shadow-2xl transition-colors">
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          Administrator Kirish
        </h2>
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          Ilovaga kirish uchun parolni kiriting.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-blue-400 transition-colors"
        />
        {error && (
          <p className="mt-2 text-sm text-red-500 dark:text-red-400">{error}</p>
        )}
        <button
          onClick={handleUnlock}
          className="mt-4 w-full rounded-md bg-blue-500 p-2 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        >
          Kirish
        </button>
      </div>
    </div>
  );
}
