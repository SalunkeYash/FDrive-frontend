import { useEffect, useRef, useState } from "react";
import { useNavigate, useMatch } from "react-router-dom";
import { AiFillCaretDown, AiOutlineClose } from "react-icons/ai";
import { BsArrowLeftCircle, BsGrid3X3Gap, BsListUl } from "react-icons/bs";
import React from "react";
import { useDrive } from "@/context/DriveContext";
import {
  hasActiveFilters,
  type ModifiedFilter,
  type PeopleFilter,
  type TypeFilter,
} from "@/lib/driveFilters";

type BreadcrumbItem = {
  id: string;
  label: string;
};

type OpenMenu = "type" | "people" | "modified" | null;

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "any", label: "Any type" },
  { value: "folder", label: "Folders" },
  { value: "document", label: "Documents" },
  { value: "pdf", label: "PDFs" },
  { value: "image", label: "Photos & images" },
  { value: "video", label: "Videos" },
  { value: "audio", label: "Audio" },
  { value: "archive", label: "Archives" },
  { value: "other", label: "Other" },
];

const PEOPLE_OPTIONS: { value: PeopleFilter; label: string }[] = [
  { value: "anyone", label: "Anyone" },
  { value: "shared", label: "Shared by me" },
  { value: "not_shared", label: "Not shared" },
];

const MODIFIED_OPTIONS: { value: ModifiedFilter; label: string }[] = [
  { value: "any", label: "Any time" },
  { value: "today", label: "Today" },
  { value: "last7", label: "Last 7 days" },
  { value: "last30", label: "Last 30 days" },
  { value: "this_year", label: "This year" },
  { value: "last_year", label: "Last year" },
];

function FilterMenu({
  label,
  active,
  open,
  onToggle,
  options,
  value,
  onSelect,
}: {
  label: string;
  active: boolean;
  open: boolean;
  onToggle: () => void;
  options: { value: string; label: string }[];
  value: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`flex items-center space-x-2 rounded-lg border px-4 py-1 text-sm font-medium ${
          active
            ? "border-[#1a73e8] bg-[#e8f0fe] text-[#1a73e8]"
            : "border-textC text-textC"
        }`}
      >
        <span>{label}</span>
        <AiFillCaretDown className="mt-0.5 h-3 w-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 min-w-[12rem] rounded-xl border border-[#dadce0] bg-white py-1 shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className={`flex w-full px-4 py-2 text-left text-sm hover:bg-darkC2 ${
                value === option.value
                  ? "bg-[#e8f0fe] font-medium text-[#1a73e8]"
                  : "text-textC"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FileHeader({
  headerName,
  breadcrumbs,
}: {
  headerName: string;
  breadcrumbs?: BreadcrumbItem[];
}) {
  const navigate = useNavigate();
  const isNestedFolder = Boolean(useMatch("/drive/folders/:folderId"));
  const {
    viewMode,
    setViewMode,
    filters,
    setTypeFilter,
    setPeopleFilter,
    setModifiedFilter,
    clearFilters,
  } = useDrive();
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const filtersRef = useRef<HTMLDivElement | null>(null);

  const breadcrumbTrail =
    breadcrumbs && breadcrumbs.length > 0
      ? breadcrumbs
      : [{ id: "", label: headerName }];

  const typeLabel =
    TYPE_OPTIONS.find((o) => o.value === filters.type)?.label || "Type";
  const peopleLabel =
    PEOPLE_OPTIONS.find((o) => o.value === filters.people)?.label || "People";
  const modifiedLabel =
    MODIFIED_OPTIONS.find((o) => o.value === filters.modified)?.label ||
    "Modified";

  useEffect(() => {
    if (!openMenu) return;
    const onDown = (event: MouseEvent) => {
      if (
        filtersRef.current &&
        !filtersRef.current.contains(event.target as Node)
      ) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openMenu]);

  return (
    <div className="flex flex-col space-y-6 p-5 pb-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center space-x-2 text-2xl text-textC">
          {isNestedFolder && (
            <BsArrowLeftCircle
              className="h-6 w-6 shrink-0 cursor-pointer"
              onClick={() => navigate(-1)}
            />
          )}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {breadcrumbTrail.map((item, index) => {
              const isLast = index === breadcrumbTrail.length - 1;
              const route =
                item.id === "shared"
                  ? "/drive/shared"
                  : item.id
                    ? `/drive/folders/${item.id}`
                    : "/drive/my-drive";

              return (
                <React.Fragment key={`${item.id}-${item.label}`}>
                  {index > 0 && <span className="text-lg text-textC/60">/</span>}
                  {isLast ? (
                    <h2 className="truncate">{item.label}</h2>
                  ) : (
                    <button
                      onClick={() => navigate(route)}
                      className="transition hover:text-blue-600"
                    >
                      {item.label}
                    </button>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="flex shrink-0 items-center rounded-full border border-[#dadce0] bg-white p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`rounded-full p-2 ${
              viewMode === "list"
                ? "bg-[#e8f0fe] text-[#1a73e8]"
                : "text-textC hover:bg-darkC2"
            }`}
            aria-label="List view"
            title="List view"
          >
            <BsListUl className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`rounded-full p-2 ${
              viewMode === "grid"
                ? "bg-[#e8f0fe] text-[#1a73e8]"
                : "text-textC hover:bg-darkC2"
            }`}
            aria-label="Grid view"
            title="Grid view"
          >
            <BsGrid3X3Gap className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div ref={filtersRef} className="flex flex-wrap items-center gap-2">
        <FilterMenu
          label={filters.type === "any" ? "Type" : typeLabel}
          active={filters.type !== "any"}
          open={openMenu === "type"}
          onToggle={() =>
            setOpenMenu((prev) => (prev === "type" ? null : "type"))
          }
          options={TYPE_OPTIONS}
          value={filters.type}
          onSelect={(value) => {
            setTypeFilter(value as TypeFilter);
            setOpenMenu(null);
          }}
        />
        <FilterMenu
          label={filters.people === "anyone" ? "People" : peopleLabel}
          active={filters.people !== "anyone"}
          open={openMenu === "people"}
          onToggle={() =>
            setOpenMenu((prev) => (prev === "people" ? null : "people"))
          }
          options={PEOPLE_OPTIONS}
          value={filters.people}
          onSelect={(value) => {
            setPeopleFilter(value as PeopleFilter);
            setOpenMenu(null);
          }}
        />
        <FilterMenu
          label={filters.modified === "any" ? "Modified" : modifiedLabel}
          active={filters.modified !== "any"}
          open={openMenu === "modified"}
          onToggle={() =>
            setOpenMenu((prev) => (prev === "modified" ? null : "modified"))
          }
          options={MODIFIED_OPTIONS}
          value={filters.modified}
          onSelect={(value) => {
            setModifiedFilter(value as ModifiedFilter);
            setOpenMenu(null);
          }}
        />
        {hasActiveFilters(filters) && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-[#1a73e8] hover:bg-[#e8f0fe]"
          >
            <AiOutlineClose className="h-3.5 w-3.5" />
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

export default FileHeader;
