import { useState, type FormEvent } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next") || "/drive/my-drive";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to={next} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not sign in");
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
          <h1 className="text-2xl text-textC">Sign in to Drive</h1>
        </div>
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
          className="w-full rounded-full bg-[#1a73e8] py-2.5 text-sm font-medium text-white hover:bg-[#1558b0] disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-center text-sm text-textC">
          No account?{" "}
          <Link to="/register" className="text-[#1a73e8]">
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}
