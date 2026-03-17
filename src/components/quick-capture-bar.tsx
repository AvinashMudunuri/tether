"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, X, CheckSquare, Calendar } from "lucide-react";
import { toast } from "sonner";
import {
  parseQuickCapture,
  formatAppointmentPreview,
  type QuickCaptureParseResult,
} from "@/lib/quick-capture-parse";

async function parseWithAI(input: string, retries = 1): Promise<QuickCaptureParseResult | null> {
  const res = await fetch("/api/v1/parse-quick-capture", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
    credentials: "include",
  });
  if (res.ok) {
    const data = (await res.json()) as QuickCaptureParseResult;
    return { ...data, confidence: "high" as const };
  }
  if (res.status === 429 || res.status === 503) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 2000));
      return parseWithAI(input, retries - 1);
    }
  }
  return null;
}

type SearchResult = {
  tasks: { id: string; title: string; dueDate: string | null; status: string; type: string }[];
  appointments: { id: string; title: string; date: string; time: string; type: string }[];
};

export function QuickCaptureBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [parseResult, setParseResult] = useState<QuickCaptureParseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [aiParsing, setAiParsing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setSearchResults(null);
      setParseResult(null);
      return;
    }
    setParseResult(parseQuickCapture(query));
    const timer = setTimeout(async () => {
      setLoading(true);
      const searchRes = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}`, {
        credentials: "include",
      });
      if (searchRes.ok) {
        const data = await searchRes.json();
        setSearchResults(data);
      } else {
        setSearchResults(null);
      }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (aiParsing) return;
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open || aiParsing) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [open, aiParsing]);

  const hasSearchResults = searchResults && (searchResults.tasks.length > 0 || searchResults.appointments.length > 0);
  const hasCreateSuggestion = parseResult !== null;
  const showDropdown = open && (query.length >= 2 || (query.length === 0 && open));
  const showHints = open && query.length === 0;

  const EXAMPLE_HINTS = [
    "Meeting with John Friday 3pm",
    "Pay electricity bill tonight",
    "Doctor appointment tomorrow 10am",
    "Lunch with Sarah sometime next week",
  ];

  async function handleSubmit() {
    const parsed = parseResult ?? parseQuickCapture(query);
    if (!parsed || creating || aiParsing) return;

    if (parsed.confidence === "high") {
      await createItem(parsed);
      return;
    }

    setAiParsing(true);
    try {
      const aiResult = await parseWithAI(query);
      if (aiResult) {
        await createItem(aiResult);
      } else {
        await createItem(parsed);
      }
    } finally {
      setAiParsing(false);
    }
  }

  async function createItem(item: QuickCaptureParseResult) {
    setCreating(true);
    try {
      if (item.type === "task") {
        const res = await fetch("/api/v1/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: item.title,
            dueDate: item.dueDate || undefined,
          }),
          credentials: "include",
        });
        if (res.ok) {
          toast.success(`Task created — ${item.title}`);
          setQuery("");
          setOpen(false);
          router.refresh();
        } else {
          toast.error("Failed to create task");
        }
      } else {
        const res = await fetch("/api/v1/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: item.title,
            date: item.date,
            time: item.time,
            timezoneOffset: new Date().getTimezoneOffset(),
            reminderTypes: ["1_day", "1_hour", "15_min"],
          }),
          credentials: "include",
        });
        if (res.ok) {
          const preview = formatAppointmentPreview(item.date, item.time);
          toast.success(`Appointment created — ${item.title} · ${preview}`);
          setQuery("");
          setOpen(false);
          router.refresh();
        } else {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error || "Failed to create appointment");
        }
      }
    } finally {
      setCreating(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      if (parseResult) {
        e.preventDefault();
        handleSubmit();
      }
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  }

  if (aiParsing) {
    return (
      <div className="relative" ref={ref}>
        <div className="flex items-center gap-2 w-full max-w-md rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20 px-3 py-2.5">
          <span className="inline-block w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" aria-hidden />
          <p className="text-sm text-slate-700 dark:text-slate-300">Parsing with AI…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 dark:text-amber-400" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder='Smart capture — try "Meeting tomorrow 5pm"'
          className="w-64 sm:w-80 pl-9 pr-8 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/80 dark:to-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-400/50 dark:focus:ring-amber-500/30 dark:focus:border-amber-500/50"
          aria-label="Smart capture — add tasks, appointments, or search"
          aria-haspopup="listbox"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Clear"
          >
            <X className="w-4 h-4" aria-hidden />
          </button>
        )}
      </div>

      {showHints && (
        <div className="absolute top-full left-0 right-0 mt-1 py-3 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg z-50">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Try:</p>
          <ul className="space-y-1">
            {EXAMPLE_HINTS.map((hint) => (
              <li key={hint}>
                <button
                  type="button"
                  onClick={() => {
                    setQuery(hint);
                    inputRef.current?.focus();
                  }}
                  className="text-sm text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 w-full text-left px-2 py-1.5 rounded"
                >
                  • {hint}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showDropdown && query.length >= 2 && (
        <div
          className="absolute top-full left-0 right-0 mt-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg z-50 max-h-80 overflow-auto"
          role="listbox"
        >
          {loading ? (
            <p className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">Searching...</p>
          ) : (
            <>
              {hasCreateSuggestion && (
                <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                    Create
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={creating}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left disabled:opacity-60 disabled:cursor-not-allowed"
                    role="option"
                    aria-selected="false"
                  >
                    {parseResult!.type === "task" ? (
                      <>
                        <CheckSquare className="w-4 h-4 text-amber-500" aria-hidden />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            ✨ Create Task — {parseResult!.title}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4 text-blue-500" aria-hidden />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            ✨ Create Appointment — {parseResult!.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {formatAppointmentPreview(parseResult!.date, parseResult!.time)}
                          </p>
                        </div>
                      </>
                    )}
                  </button>
                </div>
              )}

              {hasSearchResults ? (
                <div className="px-3 py-2">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                    Search results
                  </p>
                  {searchResults!.tasks.length > 0 && (
                    <div className="mb-1">
                      {searchResults!.tasks.map((t) => (
                        <Link
                          key={t.id}
                          href="/dashboard/tasks"
                          onClick={() => setOpen(false)}
                          className="block px-2 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-sm text-slate-900 dark:text-white"
                          role="option"
                          aria-selected="false"
                        >
                          <span className={t.status === "completed" ? "line-through text-slate-500" : ""}>
                            {t.title}
                          </span>
                          {t.dueDate && (
                            <span className="ml-2 text-xs text-slate-400">
                              {new Date(t.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                  {searchResults!.appointments.length > 0 && (
                    <div>
                      {searchResults!.appointments.map((a) => (
                        <Link
                          key={a.id}
                          href={`/dashboard/appointments/${a.id}`}
                          onClick={() => setOpen(false)}
                          className="block px-2 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-sm text-slate-900 dark:text-white"
                          role="option"
                          aria-selected="false"
                        >
                          {a.title}
                          <span className="ml-2 text-xs text-slate-400">
                            {new Date(a.date).toLocaleDateString()} · {a.time.slice(0, 5)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                !hasCreateSuggestion && (
                  <p className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">No results found</p>
                )
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
