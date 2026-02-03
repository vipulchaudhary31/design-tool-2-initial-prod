import { useState } from "react";
import {toast} from 'sonner';
import lokalLogo from "@/assets/7f52afd4f9acd98b14c7800f5a0a27def664508d.png";

interface LoginProps {
  onLogin: () => void;
}

// ✅ Hardcoded allowed users
const ALLOWED_USERS = [
  {
    email: "hd.vishwas@getlokalapp.com",
    password: "Lokal@1234",
  },
  {
    email: "krishnakumar@getlokalapp.com",
    password: "Lokal@51",
  },
];


export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    const userExists = ALLOWED_USERS.some(
      (user) => user.email === email && user.password === password
    );

    if (userExists) {
      setError("");
      toast.success("Login successful 🎉");
      onLogin();
    } else {
      setError("Invalid email or password");
      toast.error("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img
            src={lokalLogo}
            alt="Lokal"
            className="h-14 w-14 rounded-xl mb-3"
          />
          <h1 className="text-2xl font-bold text-gray-900">
            Template Studio
          </h1>
          <p className="text-sm text-gray-600 mt-1 text-center">
            Internal design tool for Lokal team
          </p>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@getlokalapp.com"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 focus:outline-none"
          />
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 focus:outline-none"
          />
        </div>

        {/* Error text (optional, toast already shows it) */}
        {error && (
          <p className="text-sm text-red-500 mb-3 text-center">
            {error}
          </p>
        )}

        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full px-4 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 transition-all font-semibold text-white shadow-md"
        >
          Sign in
        </button>

        {/* Footer note */}
        <p className="text-xs text-gray-500 text-center mt-6">
          Access restricted to approved Lokal team members
        </p>
      </div>
    </div>
  );
}
