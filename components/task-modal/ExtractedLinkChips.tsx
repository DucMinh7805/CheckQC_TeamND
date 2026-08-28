"use client";

/**
 * ============================================================================
 * FILE: components/task-modal/ExtractedLinkChips.tsx
 * MỤC ĐÍCH: Hiển thị các thẻ liên kết đính kèm (Link chips) kèm nút mở/sửa/xóa/copy
 * ============================================================================
 */

import React, { useState } from "react";
import { ExtractedLinkItem, formatURL } from "@/lib/helpers";
import { ExternalLink, Pencil, Trash2, Copy, Check, Globe, Link2 } from "lucide-react";

interface ExtractedLinkChipsProps {
  links: ExtractedLinkItem[];
  readOnly: boolean;
  onEditLink: (link: ExtractedLinkItem) => void;
  onDeleteLink: (link: ExtractedLinkItem) => void;
}

export const ExtractedLinkChips: React.FC<ExtractedLinkChipsProps> = ({
  links,
  readOnly,
  onEditLink,
  onDeleteLink,
}) => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  if (!links || links.length === 0) return null;

  const handleCopy = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 1500);
  };

  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {links.map((link, idx) => {
        const isCopied = copiedUrl === link.url;
        return (
          <div
            key={idx}
            className="group flex items-center gap-1.5 bg-blue-50/90 dark:bg-slate-800/90 hover:bg-blue-100 dark:hover:bg-slate-750 text-blue-900 dark:text-blue-300 border border-blue-200/80 dark:border-slate-700 px-2.5 py-1 rounded-xl text-xs font-bold transition shadow-2xs"
          >
            <a
              href={formatURL(link.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:underline truncate max-w-[200px]"
              title={link.url}
            >
              <Globe className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <span className="truncate">{link.text}</span>
              <ExternalLink className="w-3 h-3 text-blue-500 opacity-70 flex-shrink-0" />
            </a>

            <div className="flex items-center gap-1 pl-1 border-l border-blue-200 dark:border-slate-700">
              <button
                type="button"
                onClick={(e) => handleCopy(e, link.url)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
                title="Sao chép liên kết"
              >
                {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>

              {!readOnly && (
                <>
                  <button
                    type="button"
                    onClick={() => onEditLink(link)}
                    className="text-slate-400 hover:text-blue-600 p-0.5 rounded cursor-pointer"
                    title="Chỉnh sửa liên kết"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteLink(link)}
                    className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                    title="Xóa liên kết"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
