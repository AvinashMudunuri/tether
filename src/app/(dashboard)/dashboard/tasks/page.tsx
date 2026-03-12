"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";

type Task = {
  id: string;
  title: string;
  dueDate: string | null;
  completed: boolean;
  notes: string | null;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    const res = await fetch("/api/v1/tasks", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setTasks(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const res = await fetch("/api/v1/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle.trim(),
        dueDate: newDueDate || undefined,
      }),
      credentials: "include",
    });
    if (res.ok) {
      setNewTitle("");
      setNewDueDate("");
      fetchTasks();
      toast.success("Task added");
    } else {
      toast.error("Failed to add task");
    }
  };

  const toggleTask = async (id: string, completed: boolean) => {
    await fetch(`/api/v1/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
      credentials: "include",
    });
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed } : t))
    );
  };

  const updateTaskDueDate = async (id: string, dueDate: string | null) => {
    const res = await fetch(`/api/v1/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dueDate: dueDate || null }),
      credentials: "include",
    });
    if (res.ok) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, dueDate: dueDate } : t
        )
      );
      toast.success(dueDate ? "Due date set" : "Due date removed");
    } else {
      toast.error("Failed to update due date");
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    const res = await fetch(`/api/v1/tasks/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast.success("Task deleted");
    } else {
      toast.error("Failed to delete task");
    }
  };

  const filtered =
    filter === "all"
      ? tasks
      : filter === "pending"
        ? tasks.filter((t) => !t.completed)
        : tasks.filter((t) => t.completed);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Link
          href="/dashboard"
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Tasks
        </h1>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <form onSubmit={addTask} className="space-y-3 mb-6" aria-label="Add task">
          <div className="flex gap-3">
            <label htmlFor="new-task" className="sr-only">
              New task
            </label>
            <input
              id="new-task"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Add a task..."
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
              aria-label="Task title"
            />
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Due date"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Add task"
            >
              Add
            </button>
          </div>
        </form>

        <div
          className="flex gap-2 mb-4"
          role="group"
          aria-label="Filter tasks"
        >
          {(["all", "pending", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              aria-label={`Show ${f} tasks`}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">
            No tasks yet. Add one above.
          </p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <button
                  onClick={() => toggleTask(task.id, !task.completed)}
                  className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center ${
                    task.completed
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-slate-400"
                  }`}
                  aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                >
                  {task.completed && "✓"}
                </button>
                <div className="flex-1 min-w-0">
                  <span
                    className={
                      task.completed
                        ? "text-slate-500 dark:text-slate-400 line-through"
                        : "text-slate-900 dark:text-white"
                    }
                  >
                    {task.title}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <input
                      type="date"
                      value={task.dueDate ? task.dueDate.slice(0, 10) : ""}
                      onChange={(e) =>
                        updateTaskDueDate(task.id, e.target.value || null)
                      }
                      className="text-xs px-2 py-0.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-blue-500"
                      aria-label="Due date"
                    />
                  </div>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 text-sm"
                  aria-label="Delete task"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
