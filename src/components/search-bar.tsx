"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";

type SearchResult = {
  tasks: { id: string; title: string; dueDate: string | null; status: string; type: string }[];
  appointments: { id: string; title: string; date: string; time: string; type: string }[];
};

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      } else {
        setResults(null);
      }
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [open]);

  const hasResults = results && (results.tasks.length > 0 || results.appointments.length > 0);
  const showDropdown = open && query.length >= 2;

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search tasks & appointments..."
          className="w-48 sm:w-64 pl-9 pr-8 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Search"
          aria-haspopup="listbox"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" aria-hidden />
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          className="absolute top-full left-0 right-0 mt-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg z-50 max-h-80 overflow-auto"
          role="listbox"
        >
          {loading ? (
            <p className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">Searching...</p>
          ) : !hasResults ? (
            <p className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">No results found</p>
          ) : (
            <>
              {results!.tasks.length > 0 && (
                <div className="px-3 py-1">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tasks</p>
                  {results!.tasks.map((t) => (
                    <Link
                      key={t.id}
                      href="/dashboard/tasks"
                      onClick={() => setOpen(false)}
                      className="block px-2 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-sm text-slate-900 dark:text-white"
                      role="option"
                    >
                      <span className={t.status === "completed" ? "line-through text-slate-500" : ""}>{t.title}</span>
                      {t.dueDate && (
                        <span className="ml-2 text-xs text-slate-400">
                          {new Date(t.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
              {results!.appointments.length > 0 && (
                <div className="px-3 py-1">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Appointments</p>
                  {results!.appointments.map((a) => (
                    <Link
                      key={a.id}
                      href={`/dashboard/appointments/${a.id}`}
                      onClick={() => setOpen(false)}
                      className="block px-2 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-sm text-slate-900 dark:text-white"
                      role="option"
                    >
                      {a.title}
                      <span className="ml-2 text-xs text-slate-400">
                        {new Date(a.date).toLocaleDateString()} · {a.time.slice(0, 5)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
