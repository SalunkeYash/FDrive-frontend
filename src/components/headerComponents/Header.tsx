import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { avatarColorForEmail, emailInitial } from "@/lib/utils";
import UserInfo from "./UserInfo";
import Search from "./Search";

function Header() {
  const [displayUserInfo, setDisplayUserInfo] = useState(false);
  const { user } = useAuth();
  const accountRef = useRef<HTMLDivElement | null>(null);
  const initial = emailInitial(user?.email);
  const avatarBg = avatarColorForEmail(user?.email);

  useEffect(() => {
    if (!displayUserInfo) return;
    const onDown = (e: MouseEvent) => {
      if (
        accountRef.current &&
        !accountRef.current.contains(e.target as Node)
      ) {
        setDisplayUserInfo(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [displayUserInfo]);

  return (
    <header className="relative flex h-16 w-screen items-center gap-3 px-5 py-2">
      <div className="w-16 shrink-0 pl-1 duration-500 tablet:w-60">
        <Link to="/" className="flex w-fit items-center space-x-2 p-1">
          <img
            src="/logo.png"
            alt="logo"
            className="h-10 w-10 object-contain object-center"
            draggable={false}
          />
          <h1 className="hidden text-2xl tracking-tight text-textC tablet:block">
            Drive
          </h1>
        </Link>
      </div>
      <Search />
      <div className="min-w-0 flex-1" />
      <div ref={accountRef} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setDisplayUserInfo((prev) => !prev)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium text-white"
          style={{ backgroundColor: avatarBg }}
          aria-label="Account menu"
        >
          {initial}
        </button>
        {displayUserInfo && (
          <div className="absolute right-0 top-12">
            <UserInfo setDisplayUserInfo={setDisplayUserInfo} />
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
