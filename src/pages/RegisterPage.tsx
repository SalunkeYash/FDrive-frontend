import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";

export default function RegisterPage() {
  const { user, loading, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/drive/my-drive" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register(email, password, displayName || undefined);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not register");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bgc px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl bg-white p-8 shadow-md"
      >
        <div className="flex items-center space-x-2">
          <img src="/logo.png" alt="" className="h-10 w-10" />
          <h1 className="text-2xl text-textC">Create your Drive</h1>
        </div>
        <label className="block text-sm text-textC">
          Display name
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-darkC px-3 py-2 outline-none focus:border-textC2"
          />
        </label>
        <label className="block text-sm text-textC">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-darkC px-3 py-2 outline-none focus:border-textC2"
          />
        </label>
        <label className="block text-sm text-textC">
          Password
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-darkC px-3 py-2 outline-none focus:border-textC2"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-[#1a73e8] py-2.5 font-medium text-white hover:bg-[#1765cc] disabled:opacity-60"
        >
          {busy ? "Creating…" : "Create account"}
        </button>
        <p className="text-center text-sm text-textC">
          Already have an account?{" "}
          <Link to="/login" className="text-[#1a73e8]">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
