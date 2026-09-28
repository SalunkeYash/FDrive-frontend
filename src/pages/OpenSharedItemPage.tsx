import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { AiOutlineLock } from "react-icons/ai";
import { api, ApiError, getAccessToken } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import type { ResolveSharedItem } from "@/api/types";

export default function OpenSharedItemPage() {
  const { resourceType = "", resourceId = "" } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<ResolveSharedItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"viewer" | "editor">("viewer");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const type = resourceType === "file" || resourceType === "folder"
    ? resourceType
    : null;

  useEffect(() => {
    if (!type || !resourceId || authLoading) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.resolveSharedItem(type, resourceId);
        if (cancelled) return;
        setData(result);
        if (result.status === "public" && result.link_token) {
          navigate(`/share/${result.link_token}`, { replace: true });
          return;
        }
        if (result.status === "allowed") {
          if (type === "folder") {
            navigate(`/drive/folders/${resourceId}`, { replace: true });
          } else {
            navigate("/drive/shared", { replace: true });
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "Could not open shared item",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [type, resourceId, authLoading, navigate, user?.id]);

  if (!type) {
    return <Navigate to="/drive/my-drive" replace />;
  }

  const requestAccess = async () => {
    if (!getAccessToken()) {
      navigate(
        `/login?next=${encodeURIComponent(`/open/${type}/${resourceId}`)}`,
      );
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.requestAccess({
        resourceType: type,
        resourceId,
        role,
        message: message.trim() || undefined,
      });
      setSent(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not request access",
      );
    } finally {
      setBusy(false);
    }
  };

  if (authLoading || loading || data?.status === "public" || data?.status === "allowed") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-sm text-[#5f6368]">
        Loading…
      </div>
    );
  }

  if (data?.status === "not_found") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
        <h1 className="text-2xl font-medium text-[#1f1f1f]">Item not found</h1>
        <Link to="/drive/my-drive" className="mt-4 text-sm text-[#1a73e8]">
          Go to Drive
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="flex items-center gap-2 px-6 py-4">
        <span className="text-lg font-medium text-[#1f1f1f]">FDrive</span>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-10 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-md flex-1">
          <h1 className="text-3xl font-medium text-[#1f1f1f]">
            You need access
          </h1>
          <p className="mt-2 text-sm text-[#5f6368]">
            Request access, or switch to an account with access.
            {data?.resource_name ? (
              <>
                {" "}
                Item: <span className="font-medium text-[#1f1f1f]">{data.resource_name}</span>
              </>
            ) : null}
          </p>

          {sent ? (
            <p className="mt-8 rounded-xl bg-[#e6f4ea] px-4 py-3 text-sm text-[#137333]">
              Access request sent
              {data?.owner_email ? ` to ${data.owner_email}` : ""}. You’ll get
              access after the owner approves.
            </p>
          ) : (
            <div className="mt-8 space-y-4">
              <div className="space-y-2">
                {(
                  [
                    ["viewer", "Viewer"],
                    ["editor", "Editor"],
                  ] as const
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-3 text-sm text-[#1f1f1f]"
                  >
                    <input
                      type="radio"
                      name="role"
                      checked={role === value}
                      onChange={() => setRole(value)}
                      className="h-4 w-4 accent-[#1a73e8]"
                    />
                    {label}
                  </label>
                ))}
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message (optional)"
                rows={3}
                className="w-full rounded-lg border border-[#dadce0] px-3 py-2 text-sm outline-none focus:border-[#1a73e8]"
              />

              <button
                type="button"
                disabled={busy}
                onClick={() => void requestAccess()}
                className="rounded-full bg-[#1a73e8] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1558b0] disabled:opacity-60"
              >
                {user ? "Request access" : "Sign in to request access"}
              </button>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>

        <div className="hidden flex-1 items-center justify-center lg:flex">
          <div className="relative h-64 w-64">
            <div className="absolute left-10 top-8 h-40 w-28 rotate-[-8deg] rounded-2xl bg-[#202124]" />
            <div className="absolute bottom-10 right-8 h-16 w-16 rounded-full bg-[#f6aea9]" />
            <div className="absolute right-16 top-6 h-10 w-10 rounded-md bg-[#fdd663]" />
            <div className="absolute bottom-16 left-6 h-8 w-8 rounded-full bg-[#81c995]" />
            <div className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#1a73e8] text-white">
              <AiOutlineLock className="h-9 w-9" />
            </div>
          </div>
        </div>
      </main>

      <footer className="px-6 py-6 text-center text-sm text-[#5f6368]">
        {user ? (
          <p>
            You&apos;re signed in as{" "}
            <span className="inline-flex items-center rounded-full border border-[#dadce0] px-3 py-1 text-[#1f1f1f]">
              {user.email}
            </span>
          </p>
        ) : (
          <p>
            Not signed in.{" "}
            <Link
              to={`/login?next=${encodeURIComponent(`/open/${type}/${resourceId}`)}`}
              className="text-[#1a73e8]"
            >
              Sign in
            </Link>
          </p>
        )}
      </footer>
    </div>
  );
}
