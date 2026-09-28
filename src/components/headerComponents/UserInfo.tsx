import { useState, type FormEvent } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { HiOutlinePlus } from "react-icons/hi";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
import { MdOutlineCloud, MdOutlineEdit } from "react-icons/md";
import { PiSignOutBold } from "react-icons/pi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useDrive } from "@/context/DriveContext";
import {
  avatarColorForEmail,
  emailInitial,
  formatBytes,
} from "@/lib/utils";
import type { UserInfoProps } from "@/types";

function UserInfo({ setDisplayUserInfo }: UserInfoProps) {
  const { user, logout, updateDisplayName } = useAuth();
  const { quota } = useDrive();
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const email = user?.email || "";
  const name = user?.display_name || email.split("@")[0] || "User";
  const initial = emailInitial(email);
  const avatarBg = avatarColorForEmail(email);

  const bytesUsed = quota?.bytes_used ?? user?.bytes_used ?? 0;
  const bytesLimit = quota?.bytes_limit ?? user?.bytes_limit ?? 1;

  const close = () => setDisplayUserInfo(false);

  const signOut = async () => {
    await logout();
    close();
  };

  const addAnotherAccount = async () => {
    await logout();
    close();
    navigate("/login");
  };

  const startEditName = () => {
    setNameDraft(user?.display_name || "");
    setNameError(null);
    setEditingName(true);
  };

  const saveDisplayName = async (e: FormEvent) => {
    e.preventDefault();
    setSavingName(true);
    setNameError(null);
    try {
      await updateDisplayName(nameDraft);
      setEditingName(false);
    } catch {
      setNameError("Could not update display name.");
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div className="relative z-20 w-[22.5rem] rounded-[28px] bg-[#e9eef6] px-2 pb-2 pt-8 text-sm text-textC shadow-[0_4px_24px_rgba(0,0,0,0.18)]">
      <button
        type="button"
        onClick={close}
        className="absolute right-3 top-2.5 rounded-full p-1.5 hover:bg-black/5"
        aria-label="Close"
      >
        <AiOutlineClose className="h-5 w-5 text-[#444746]" />
      </button>

      <div className="overflow-hidden rounded-[24px] bg-white">
        <div className="flex items-start gap-3 px-4 py-3.5">
          <div className="relative shrink-0">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full text-[1.75rem] font-medium text-white ring-[3px] ring-[#aecbfa]"
              style={{ backgroundColor: avatarBg }}
            >
              {initial}
            </div>
            <button
              type="button"
              onClick={startEditName}
              className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border border-white bg-white shadow-sm hover:bg-[#f1f3f4]"
              aria-label="Edit display name"
            >
              <MdOutlineEdit className="h-3.5 w-3.5 text-[#444746]" />
            </button>
          </div>

          <div className="min-w-0 flex-1 pt-1">
            {editingName ? (
              <form onSubmit={saveDisplayName} className="space-y-1.5">
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  maxLength={255}
                  placeholder="Display name"
                  className="w-full rounded-lg border border-[#dadce0] px-2 py-1.5 text-sm outline-none focus:border-[#1a73e8]"
                />
                {nameError && (
                  <p className="text-xs text-red-600">{nameError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={savingName}
                    className="rounded-full bg-[#1a73e8] px-3 py-1 text-xs font-medium text-white hover:bg-[#1558b0] disabled:opacity-60"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingName(false)}
                    className="rounded-full px-3 py-1 text-xs font-medium hover:bg-[#f1f3f4]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p className="truncate text-[15px] font-medium leading-tight text-[#1f1f1f]">
                  Hi, {name}!
                </p>
                <p className="mt-0.5 truncate text-xs leading-tight text-[#444746]">
                  {email}
                </p>
                <span className="mt-1.5 inline-flex rounded-full border border-[#c2e7ff] bg-[#e8f0fe] px-2 py-0.5 text-[11px] font-medium text-[#001d35]">
                  Free
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-[#f1f3f4]"
            aria-label={expanded ? "Collapse account menu" : "Expand account menu"}
            aria-expanded={expanded}
          >
            {expanded ? (
              <IoChevronUp className="h-5 w-5 text-[#444746]" />
            ) : (
              <IoChevronDown className="h-5 w-5 text-[#444746]" />
            )}
          </button>
        </div>

        {expanded && (
          <>
            <div className="mx-3 border-t border-[#e0e3e7]" />

            <button
              type="button"
              onClick={() => {
                void addAnotherAccount();
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#f8fafc]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f0fe]">
                <HiOutlinePlus className="h-5 w-5 text-[#0b57d0]" />
              </span>
              <span className="text-[14px] font-medium text-[#1f1f1f]">
                Add another account
              </span>
            </button>

            <div className="mx-3 border-t border-[#e0e3e7]" />

            <button
              type="button"
              onClick={() => {
                void signOut();
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#f8fafc]"
            >
              <span className="flex h-8 w-8 items-center justify-center">
                <PiSignOutBold className="h-5 w-5 text-[#444746]" />
              </span>
              <span className="text-[14px] font-medium text-[#1f1f1f]">
                Sign out of all accounts
              </span>
            </button>

            <div className="mx-3 border-t border-[#e0e3e7]" />
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f0fe]">
                <MdOutlineCloud className="h-5 w-5 text-[#0b57d0]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-[#1f1f1f]">
                  {formatBytes(bytesUsed)} of {formatBytes(bytesLimit)} used
                </p>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#e0e3e7]">
                  <div
                    className={`h-full rounded-full ${
                      bytesUsed >= bytesLimit / 1.25
                        ? "bg-red-500"
                        : "bg-[#0b57d0]"
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        (bytesUsed / Math.max(bytesLimit, 1)) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default UserInfo;
