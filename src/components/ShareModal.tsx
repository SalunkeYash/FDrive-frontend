import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import {
  AiOutlineCheck,
  AiOutlineClose,
  AiOutlineLink,
  AiOutlineLock,
} from "react-icons/ai";
import { MdPublic } from "react-icons/md";
import { api, ApiError } from "@/api/client";
import type { AccessRequestItem, ResourceAccess } from "@/api/types";
import type { FileEntry } from "@/types";

type ShareModalProps = {
  entry: FileEntry;
  onClose: () => void;
};

type LinkAccessMode = "restricted" | "anyone";
type ShareRole = "viewer" | "editor";

function ShareModal({ entry, onClose }: ShareModalProps) {
  const resourceType = entry.isFolder ? "folder" : "file";
  const title = entry.isFolder ? entry.folderName : entry.fileName;

  const [email, setEmail] = useState("");
  const [access, setAccess] = useState<ResourceAccess | null>(null);
  const [requests, setRequests] = useState<AccessRequestItem[]>([]);
  const [linkMode, setLinkMode] = useState<LinkAccessMode>("restricted");
  const [linkRole, setLinkRole] = useState<ShareRole>("viewer");
  const [showGeneralMenu, setShowGeneralMenu] = useState(false);
  const [showLinkRoleMenu, setShowLinkRoleMenu] = useState(false);
  const [generalMenuPos, setGeneralMenuPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [roleMenuPos, setRoleMenuPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const generalBtnRef = useRef<HTMLButtonElement>(null);
  const roleBtnRef = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAccess = async () => {
    const [data, pending] = await Promise.all([
      api.listResourceAccess(resourceType, entry.id),
      api.listAccessRequests(resourceType, entry.id),
    ]);
    setAccess(data);
    setRequests(pending);
    setLinkMode(data.link.enabled ? "anyone" : "restricted");
    setLinkRole((data.link.role as ShareRole) || "viewer");
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [data, pending] = await Promise.all([
          api.listResourceAccess(resourceType, entry.id),
          api.listAccessRequests(resourceType, entry.id),
        ]);
        if (cancelled) return;
        setAccess(data);
        setRequests(pending);
        setLinkMode(data.link.enabled ? "anyone" : "restricted");
        setLinkRole((data.link.role as ShareRole) || "viewer");
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "Could not load sharing info",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [entry.id, resourceType]);

  useLayoutEffect(() => {
    if (!showGeneralMenu || !generalBtnRef.current) {
      setGeneralMenuPos(null);
      return;
    }
    const rect = generalBtnRef.current.getBoundingClientRect();
    setGeneralMenuPos({ top: rect.top - 4, left: rect.left });
  }, [showGeneralMenu]);

  useLayoutEffect(() => {
    if (!showLinkRoleMenu || !roleBtnRef.current) {
      setRoleMenuPos(null);
      return;
    }
    const rect = roleBtnRef.current.getBoundingClientRect();
    setRoleMenuPos({ top: rect.top - 4, left: rect.right });
  }, [showLinkRoleMenu]);

  const shareWithUser = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const sharedEmail = email.trim();
      await api.createUserShare({
        resourceType,
        resourceId: entry.id,
        granteeEmail: sharedEmail,
        role: "viewer",
      });
      setEmail("");
      await loadAccess();
      setMessage(`Shared with ${sharedEmail}.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not share");
    } finally {
      setBusy(false);
    }
  };

  const changeGeneralAccess = async (mode: LinkAccessMode) => {
    setShowGeneralMenu(false);
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const data = await api.setLinkAccess({
        resourceType,
        resourceId: entry.id,
        access: mode,
        role: linkRole,
      });
      setAccess(data);
      setLinkMode(data.link.enabled ? "anyone" : "restricted");
      setLinkRole((data.link.role as ShareRole) || "viewer");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not update link access",
      );
    } finally {
      setBusy(false);
    }
  };

  const changeLinkRole = async (role: ShareRole) => {
    setShowLinkRoleMenu(false);
    setLinkRole(role);
    if (linkMode !== "anyone") return;
    setBusy(true);
    setError(null);
    try {
      const data = await api.setLinkAccess({
        resourceType,
        resourceId: entry.id,
        access: "anyone",
        role,
      });
      setAccess(data);
      setLinkRole((data.link.role as ShareRole) || role);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not update link role",
      );
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (linkMode === "anyone") {
        const data = await api.setLinkAccess({
          resourceType,
          resourceId: entry.id,
          access: "anyone",
          role: linkRole,
        });
        setAccess(data);
      }
      const url = `${window.location.origin}/open/${resourceType}/${entry.id}`;
      await navigator.clipboard.writeText(url);
      setMessage(
        linkMode === "anyone"
          ? "Link copied. Anyone with the link can open it."
          : "Link copied. Only people with access can open it.",
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not copy link");
    } finally {
      setBusy(false);
    }
  };

  const revokePerson = async (shareId: string | null) => {
    if (!shareId) return;
    setBusy(true);
    setError(null);
    try {
      await api.revokeShare(shareId);
      await loadAccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not remove access");
    } finally {
      setBusy(false);
    }
  };

  const initial = (name: string | null | undefined, emailAddr: string) =>
    (name?.trim()?.[0] || emailAddr[0] || "?").toUpperCase();

  return (
    <div
      data-drive-modal
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 px-6 pt-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 className="truncate text-xl font-normal text-[#1f1f1f]">
              Share “{title}”
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-1.5 hover:bg-[#f1f3f4]"
              aria-label="Close"
            >
              <AiOutlineClose className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={shareWithUser}>
            <div className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Add people"
                className="w-full rounded-lg border border-[#dadce0] px-3 py-3 text-sm outline-none focus:border-[#1a73e8]"
              />
              <button
                type="submit"
                disabled={busy}
                className="shrink-0 rounded-full bg-[#1a73e8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1558b0] disabled:opacity-60"
              >
                Share
              </button>
            </div>
          </form>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6">
        {requests.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-2 text-sm font-medium text-[#1f1f1f]">
              Requests
            </h3>
            <ul className="space-y-2">
              {requests.map((req) => (
                <li
                  key={req.id}
                  className="flex items-center gap-3 rounded-xl bg-[#f8fafd] px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-[#1f1f1f]">
                      {req.requester_display_name || req.requester_email}
                    </p>
                    <p className="truncate text-xs text-[#5f6368]">
                      Wants {req.requested_role}
                      {req.message ? ` · “${req.message}”` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      void (async () => {
                        setBusy(true);
                        try {
                          await api.approveAccessRequest(req.id);
                          await loadAccess();
                          setMessage("Access approved.");
                        } catch (err) {
                          setError(
                            err instanceof ApiError
                              ? err.message
                              : "Could not approve",
                          );
                        } finally {
                          setBusy(false);
                        }
                      })();
                    }}
                    className="rounded-full bg-[#1a73e8] px-3 py-1 text-xs font-medium text-white"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      void (async () => {
                        setBusy(true);
                        try {
                          await api.denyAccessRequest(req.id);
                          await loadAccess();
                        } catch (err) {
                          setError(
                            err instanceof ApiError
                              ? err.message
                              : "Could not deny",
                          );
                        } finally {
                          setBusy(false);
                        }
                      })();
                    }}
                    className="rounded-full px-3 py-1 text-xs font-medium text-[#5f6368] hover:bg-[#eee]"
                  >
                    Deny
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 pb-2">
          <h3 className="mb-2 text-sm font-medium text-[#1f1f1f]">
            People with access
          </h3>
          <ul className="space-y-2">
            {access && (
              <li className="flex items-center gap-3 py-1">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7b1fa2] text-sm font-medium text-white">
                  {initial(access.owner.display_name, access.owner.email)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-[#1f1f1f]">
                    {access.owner.display_name || access.owner.email}{" "}
                    <span className="text-[#5f6368]">(you)</span>
                  </p>
                  <p className="truncate text-xs text-[#5f6368]">
                    {access.owner.email}
                  </p>
                </div>
                <span className="text-sm text-[#5f6368]">Owner</span>
              </li>
            )}
            {access?.people.map((person) => (
              <li
                key={person.share_id ?? person.email}
                className="flex items-center gap-3 py-1"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a73e8] text-sm font-medium text-white">
                  {initial(person.display_name, person.email)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-[#1f1f1f]">
                    {person.display_name || person.email}
                  </p>
                  <p className="truncate text-xs text-[#5f6368]">{person.email}</p>
                </div>
                <select
                  value={person.role}
                  disabled={busy}
                  onChange={(e) => {
                    const value = e.target.value;
                    void (async () => {
                      setBusy(true);
                      try {
                        if (value === "remove") {
                          await revokePerson(person.share_id);
                          return;
                        }
                        await api.createUserShare({
                          resourceType,
                          resourceId: entry.id,
                          granteeEmail: person.email,
                          role: value as ShareRole,
                        });
                        await loadAccess();
                      } catch (err) {
                        setError(
                          err instanceof ApiError
                            ? err.message
                            : "Could not update role",
                        );
                      } finally {
                        setBusy(false);
                      }
                    })();
                  }}
                  className="rounded border-0 bg-transparent text-sm text-[#5f6368] outline-none"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="remove">Remove</option>
                </select>
              </li>
            ))}
          </ul>
        </div>
        </div>

        <div className="shrink-0 overflow-visible px-6 pb-6 pt-3">
        <div>
          <h3 className="mb-2 text-sm font-medium text-[#1f1f1f]">
            General access
          </h3>
          <div className="relative z-20 overflow-visible rounded-2xl bg-[#f1f3f4] px-3 py-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-white">
                {linkMode === "anyone" ? (
                  <MdPublic className="h-5 w-5 text-[#188038]" />
                ) : (
                  <AiOutlineLock className="h-5 w-5 text-[#5f6368]" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <button
                  ref={generalBtnRef}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setShowLinkRoleMenu(false);
                    setShowGeneralMenu((v) => !v);
                  }}
                  className="flex items-center gap-1 text-sm font-medium text-[#1f1f1f]"
                >
                  {linkMode === "anyone" ? "Anyone with the link" : "Restricted"}
                  <span className="text-xs text-[#5f6368]">▾</span>
                </button>
                <p className="text-xs text-[#5f6368]">
                  {linkMode === "anyone"
                    ? "Anyone on the internet with the link can view"
                    : "Only people with access can open with the link"}
                </p>
              </div>
              {linkMode === "anyone" && (
                <button
                  ref={roleBtnRef}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setShowGeneralMenu(false);
                    setShowLinkRoleMenu((v) => !v);
                  }}
                  className="rounded-lg px-2 py-1 text-sm text-[#5f6368] hover:bg-white"
                >
                  {linkRole === "editor" ? "Editor" : "Viewer"} ▾
                </button>
              )}
            </div>
          </div>
        </div>

        {message && <p className="mt-3 text-sm text-[#188038]">{message}</p>}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            disabled={busy}
            onClick={() => void copyLink()}
            className="flex items-center gap-2 rounded-full border border-[#dadce0] px-4 py-2 text-sm font-medium text-[#1a73e8] hover:bg-[#e8f0fe] disabled:opacity-60"
          >
            <AiOutlineLink className="h-4 w-4" />
            Copy link
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#1a73e8] px-5 py-2 text-sm font-medium text-white hover:bg-[#1558b0]"
          >
            Done
          </button>
        </div>
        </div>
      </div>

      {showGeneralMenu &&
        generalMenuPos &&
        createPortal(
          <div
            data-drive-modal
            className="fixed z-[70] w-56 -translate-y-full rounded-lg border border-[#dadce0] bg-white py-1 shadow-lg"
            style={{ top: generalMenuPos.top, left: generalMenuPos.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[#f1f3f4]"
              onClick={() => void changeGeneralAccess("restricted")}
            >
              Restricted
              {linkMode === "restricted" && (
                <AiOutlineCheck className="h-4 w-4 text-[#1a73e8]" />
              )}
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[#f1f3f4]"
              onClick={() => void changeGeneralAccess("anyone")}
            >
              Anyone with the link
              {linkMode === "anyone" && (
                <AiOutlineCheck className="h-4 w-4 text-[#1a73e8]" />
              )}
            </button>
          </div>,
          document.body,
        )}

      {showLinkRoleMenu &&
        roleMenuPos &&
        createPortal(
          <div
            data-drive-modal
            className="fixed z-[70] w-40 -translate-x-full -translate-y-full rounded-lg border border-[#dadce0] bg-white py-1 shadow-lg"
            style={{ top: roleMenuPos.top, left: roleMenuPos.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-[#5f6368]">
              Role
            </p>
            <button
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[#f1f3f4]"
              onClick={() => void changeLinkRole("viewer")}
            >
              Viewer
              {linkRole === "viewer" && (
                <AiOutlineCheck className="h-4 w-4 text-[#1a73e8]" />
              )}
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[#f1f3f4]"
              onClick={() => void changeLinkRole("editor")}
            >
              Editor
              {linkRole === "editor" && (
                <AiOutlineCheck className="h-4 w-4 text-[#1a73e8]" />
              )}
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}

export default ShareModal;
