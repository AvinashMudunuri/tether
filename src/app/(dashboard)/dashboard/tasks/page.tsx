"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { AttachmentPreview } from "@/components/attachment-preview";

type TaskAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
};

type Task = {
  id: string;
  title: string;
  dueDate: string | null;
  completed: boolean;
  notes: string | null;
  attachments?: TaskAttachment[];
};

export default function TasksPage() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);
  const [taskAttachments, setTaskAttachments] = useState<Record<string, TaskAttachment[]>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const fetchTasks = async () => {
    const res = await fetch("/api/v1/tasks", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setTasks(data);
      setTaskAttachments(
        data.reduce(
          (acc: Record<string, TaskAttachment[]>, t: Task) => ({
            ...acc,
            [t.id]: t.attachments ?? [],
          }),
          {}
        )
      );
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

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    setDeleteConfirmOpen(false);
    const id = taskToDelete;
    setTaskToDelete(null);
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

  const openDeleteConfirm = (id: string) => {
    setTaskToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleTaskFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    taskId: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPG, PNG, and WebP images are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB");
      return;
    }
    setUploadingTaskId(taskId);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/v1/tasks/${taskId}/attachments`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    setUploadingTaskId(null);
    e.target.value = "";
    if (res.ok) {
      const attachment = await res.json();
      setTaskAttachments((prev) => ({
        ...prev,
        [taskId]: [...(prev[taskId] ?? []), attachment],
      }));
      fetchTasks();
      toast.success("Attachment added");
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Failed to upload");
    }
  };

  const deleteTaskAttachment = async (taskId: string, attachmentId: string) => {
    const res = await fetch(
      `/api/v1/tasks/${taskId}/attachments/${attachmentId}`,
      { method: "DELETE", credentials: "include" }
    );
    if (res.ok) {
      setTaskAttachments((prev) => ({
        ...prev,
        [taskId]: (prev[taskId] ?? []).filter((a) => a.id !== attachmentId),
      }));
      fetchTasks();
      toast.success("Attachment removed");
    } else {
      toast.error("Failed to remove attachment");
    }
  };

  const dateFiltered = dateParam
    ? tasks.filter((t) => t.dueDate && t.dueDate.slice(0, 10) === dateParam)
    : tasks;

  const filtered =
    filter === "all"
      ? dateFiltered
      : filter === "pending"
        ? dateFiltered.filter((t) => !t.completed)
        : dateFiltered.filter((t) => t.completed);

  const dateLabel = dateParam
    ? new Date(dateParam + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Tasks
        </h1>
      </div>

      {dateLabel && (
        <p className="text-slate-600 dark:text-slate-400">
          {filtered.length === 0
            ? `No tasks due on ${dateLabel}`
            : `Tasks due on ${dateLabel}`}
          {" · "}
          <Link href="/dashboard/tasks" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
            Show all
          </Link>
        </p>
      )}

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
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Add task"
            >
              <Plus className="w-4 h-4" aria-hidden />
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
            {filtered.map((task) => {
              const isExpanded = expandedTaskId === task.id;
              const attachments = taskAttachments[task.id] ?? task.attachments ?? [];
              return (
                <li
                  key={task.id}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
                >
                  <div className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
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
                      onClick={() =>
                        setExpandedTaskId(isExpanded ? null : task.id)
                      }
                      className="flex-shrink-0 p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      aria-label={isExpanded ? "Collapse" : "Expand details"}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" aria-hidden />
                      ) : (
                        <ChevronDown className="w-4 h-4" aria-hidden />
                      )}
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(task.id)}
                      className="flex items-center gap-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 text-sm"
                      aria-label="Delete task"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden />
                      Delete
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-3 space-y-3">
                      {task.notes && task.notes.trim() && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                          {task.notes}
                        </p>
                      )}
                      <div>
                        <h4 className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                          <Paperclip className="w-3.5 h-3.5" aria-hidden />
                          Attachments
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          <label className="cursor-pointer">
                            <input
                              ref={(el) => {
                                fileInputRefs.current[task.id] = el;
                              }}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={(e) => handleTaskFileUpload(e, task.id)}
                              disabled={uploadingTaskId === task.id}
                              className="sr-only"
                              aria-label="Add attachment"
                            />
                            <span className="inline-flex items-center gap-2 px-2 py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:border-slate-400 dark:hover:border-slate-500 transition-colors">
                              {uploadingTaskId === task.id
                                ? "Uploading..."
                                : "Add image"}
                            </span>
                          </label>
                          {attachments.map((att) => (
                            <AttachmentPreview
                              key={att.id}
                              entityType="tasks"
                              entityId={task.id}
                              attachment={att}
                              onDelete={() =>
                                deleteTaskAttachment(task.id, att.id)
                              }
                            />
                          ))}
                        </div>
                        {attachments.length === 0 && uploadingTaskId !== task.id && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            No attachments. Add reference images or screenshots.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete task"
        message="Are you sure you want to delete this task? This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDeleteTask}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setTaskToDelete(null);
        }}
      />
    </div>
  );
}
