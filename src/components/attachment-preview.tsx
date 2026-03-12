"use client";

import { useState, useEffect } from "react";
import { Trash2, Image } from "lucide-react";

type Attachment = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
};

type EntityType = "appointments" | "tasks";

export function AttachmentPreview({
  entityType,
  entityId,
  attachment,
  onDelete,
}: {
  entityType: EntityType;
  entityId: string;
  attachment: Attachment;
  onDelete: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(
      `/api/v1/${entityType}/${entityId}/attachments/${attachment.id}/url`,
      { credentials: "include" }
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.url) setUrl(data.url);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entityType, entityId, attachment.id]);

  const isImage = attachment.mimeType.startsWith("image/");

  return (
    <div className="group relative flex flex-col rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800/50">
      <div className="aspect-square w-24 min-w-24 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
        {loading ? (
          <div className="animate-pulse w-12 h-12 rounded bg-slate-200 dark:bg-slate-700" />
        ) : isImage && url ? (
          <img
            src={url}
            alt={attachment.fileName}
            className="w-full h-full object-cover"
          />
        ) : (
          <Image className="w-8 h-8 text-slate-400" aria-hidden />
        )}
      </div>
      <div className="p-2 min-w-0">
        <p
          className="text-xs text-slate-600 dark:text-slate-400 truncate"
          title={attachment.fileName}
        >
          {attachment.fileName}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-1 right-1 z-10 p-1 rounded bg-red-500/90 text-white opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500"
        aria-label={`Delete ${attachment.fileName}`}
      >
        <Trash2 className="w-3 h-3" aria-hidden />
      </button>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 z-0"
          aria-label={`Open ${attachment.fileName} in new tab`}
        />
      )}
    </div>
  );
}
