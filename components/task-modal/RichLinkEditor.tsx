"use client";

/**
 * ============================================================================
 * FILE: components/task-modal/RichLinkEditor.tsx
 * MỤC ĐÍCH: Trình chèn và hiển thị đường liên kết (Rich Link) chuẩn Google Docs/Sheets
 * ============================================================================
 */

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExtractedLinkItem, formatURL } from "@/lib/helpers";
import {
  Link2,
  ExternalLink,
  Pencil,
  Trash2,
  Copy,
  Check,
  Globe,
  Unlink,
} from "lucide-react";

interface RichLinkEditorProps {
  fieldName: string;
  isEditing: boolean;
  onClose: () => void;
  onSaveLink: (title: string, url: string, target?: ExtractedLinkItem | null) => void;
  editingTargetLink?: ExtractedLinkItem | null;
}

export const RichLinkEditor: React.FC<RichLinkEditorProps> = ({
  fieldName,
  isEditing,
  onClose,
  onSaveLink,
  editingTargetLink,
}) => {
  const [linkTitle, setLinkTitle] = useState<string>(editingTargetLink?.text || "");
  const [linkUrl, setLinkUrl] = useState<string>(editingTargetLink?.url || "");

  if (!isEditing) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;
    onSaveLink(linkTitle.trim(), linkUrl.trim(), editingTargetLink);
    setLinkTitle("");
    setLinkUrl("");
  };

  return (
    <div className="p-3 bg-white dark:bg-slate-800/95 rounded-2xl border border-blue-300 dark:border-blue-700 shadow-lg space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-1.5">
        <span className="text-[11px] font-black text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5" />
          <span>{editingTargetLink ? "Chỉnh sửa đường liên kết" : "Chèn đường liên kết"}</span>
        </span>
        <span className="text-[10px] text-slate-400 font-medium">(Chuẩn Google Docs / Sheets)</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
            Văn bản (Tên hiển thị):
          </label>
          <Input
            type="text"
            placeholder="Văn bản hiển thị (vd: Slide câu 63, Ảnh lỗi, Minh chứng...)"
            value={linkTitle}
            onChange={(e) => setLinkTitle(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 rounded-xl text-xs h-8 font-semibold border-slate-200 dark:border-slate-700"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
            Đường liên kết (URL):
          </label>
          <Input
            type="text"
            placeholder="Dán đường dẫn (vd: https://drive.google.com/...)"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 rounded-xl text-xs h-8 font-semibold border-slate-200 dark:border-slate-700"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 text-xs font-bold text-slate-500 rounded-lg px-2.5 cursor-pointer"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={!linkUrl.trim()}
            size="sm"
            className="h-7 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 cursor-pointer shadow-xs"
          >
            Áp dụng
          </Button>
        </div>
      </form>
    </div>
  );
};
