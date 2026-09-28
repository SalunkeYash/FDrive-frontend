import { useEffect, useRef, useState } from "react";
import { AiFillFolder, AiOutlineSearch } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/client";
import type { ApiFile, ApiFolder } from "@/api/types";
import { useDrive } from "@/context/DriveContext";
import fileIcons from "../fileIcons";

type SearchHit =
  | { kind: "folder"; id: string; name: string }
  | { kind: "file"; id: string; name: string; extension: string };

const DEBOUNCE_MS = 300;

function extensionOf(name: string): string {
  return name.includes(".")
    ? (name.split(".").pop()?.toLowerCase() ?? "")
    : "";
}

function mapResults(folders: ApiFolder[], files: ApiFile[]): SearchHit[] {
  const folderHits: SearchHit[] = folders.map((folder) => ({
    kind: "folder",
    id: folder.id,
    name: folder.name,
  }));
  const fileHits: SearchHit[] = files.map((file) => ({
    kind: "file",
    id: file.id,
    name: file.name,
    extension: extensionOf(file.name),
  }));
  return [...folderHits, ...fileHits];
}

function Search() {
  const [searchText, setSearchText] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [onFocus, setOnFocus] = useState(false);
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const requestIdRef = useRef(0);
  const { openOrDownloadFile } = useDrive();
  const navigate = useNavigate();

  const showResults = onFocus && searchText.trim().length > 0;

  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOnFocus(false);
      }
    };
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  useEffect(() => {
    const trimmed = searchText.trim();
    if (!trimmed) {
      setDebouncedQuery("");
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    const timer = window.setTimeout(() => {
      setDebouncedQuery(trimmed);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const requestId = ++requestIdRef.current;
    let cancelled = false;

    (async () => {
      try {
        const data = await api.searchDrive(debouncedQuery);
        if (cancelled || requestId !== requestIdRef.current) return;
        setResults(mapResults(data.folders, data.files));
        setError(null);
      } catch {
        if (cancelled || requestId !== requestIdRef.current) return;
        setResults([]);
        setError("Search failed. Try again.");
      } finally {
        if (!cancelled && requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  return (
    <div ref={containerRef} className="relative w-full max-w-[860px]">
      <div
        className={`flex items-center rounded-full bg-darkC2 px-4 transition-shadow ${
          onFocus
            ? "bg-white shadow-md ring-1 ring-[#dadce0]"
            : "hover:bg-[#e7ebf0]"
        }`}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-textC">
          <AiOutlineSearch className="h-5 w-5" />
        </span>
        <input
          onFocus={() => setOnFocus(true)}
          onChange={(e) => setSearchText(e.target.value)}
          value={searchText}
          type="search"
          placeholder="Search in Drive"
          className="w-full bg-transparent py-3 pr-3 text-base text-textC placeholder:text-[#5f6368] outline-none"
        />
      </div>

      {showResults && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 max-h-60 overflow-y-auto rounded-2xl bg-white py-2 shadow-lg ring-1 ring-[#dadce0]">
          {loading ? (
            <div className="px-5 py-2 text-sm text-[#5f6368]">Searching…</div>
          ) : error ? (
            <div className="px-5 py-2 text-sm text-red-600">{error}</div>
          ) : results.length === 0 ? (
            <div className="px-5 py-2 text-sm text-[#5f6368]">
              No results match your search.
            </div>
          ) : (
            results.map((item) => {
              const icon =
                fileIcons[item.kind === "file" ? item.extension : ""] ??
                fileIcons["any"];
              return (
                <button
                  key={`${item.kind}-${item.id}`}
                  type="button"
                  onClick={() => {
                    setOnFocus(false);
                    setSearchText("");
                    setResults([]);
                    if (item.kind === "folder") {
                      navigate(`/drive/folders/${item.id}`);
                    } else {
                      void openOrDownloadFile(item.id, "open");
                    }
                  }}
                  className="flex w-full items-center space-x-3.5 px-4 py-2 text-left hover:bg-darkC2"
                >
                  <span className="h-6 w-6 shrink-0">
                    {item.kind === "folder" ? (
                      <AiFillFolder className="h-full w-full text-textC" />
                    ) : (
                      icon
                    )}
                  </span>
                  <span className="w-full truncate text-sm">{item.name}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default Search;
