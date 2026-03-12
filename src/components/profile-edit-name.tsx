"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function ProfileEditName({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { full_name: name.trim() },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Name updated");
      setEditing(false);
      router.refresh();
    }
  }

  if (editing) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Display name"
          className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
          aria-label="Display name"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => {
            setName(initialName);
            setEditing(false);
          }}
          className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm"
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-lg font-medium text-slate-900 dark:text-white">
        {initialName || "No name set"}
      </span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
      >
        Edit
      </button>
    </div>
  );
}
