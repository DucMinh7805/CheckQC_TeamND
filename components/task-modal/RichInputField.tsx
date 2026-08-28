"use client";

/**
 * ============================================================================
 * FILE: components/task-modal/RichInputField.tsx
 * MỤC ĐÍCH: Ô nhập văn bản kèm chèn link và hiển thị liên kết Google Docs/Sheets
 * ============================================================================
 */

import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { extractRichLinks, ExtractedLinkItem, formatURL } from "@/lib/helpers";
import { Link2, ExternalLink, Pencil, Trash2, Copy, Check, Globe } from "lucide-react";
import { RichLinkEditor } from "./RichLinkEditor";

interface RichInputFieldProps {
  fieldName: string;
  label: string;
  value: string;
  setValue: (val: string) => void;
  readOnly: boolean;
  placeholder: string;
  minRows?: number;
  theme?: "blue" | "rose" | "slate";
}

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const RichInputField: React.FC<RichInputFieldProps> = ({
  fieldName,
  label,
  value,
  setValue,
  readOnly,
  placeholder,
  minRows = 2,
  theme = "slate",
}) => {
  const [isEditingLink, setIsEditingLink] = useState<boolean>(false);
  const [editingTargetLink, setEditingTargetLink] = useState<ExtractedLinkItem | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const extractedLinks = extractRichLinks(value);

  const calculateRows = (text: string, defaultRows: number = 2) => {
    if (!text) return defaultRows;
    const lines = text.split("\n").length;
    const charEstimate = Math.ceil(text.length / 55);
    return Math.min(8, Math.max(defaultRows, lines, charEstimate));
  };

  const dynamicRows = calculateRows(value, minRows);

  let labelColor = "text-slate-800 dark:text-slate-200";
  let btnColor = "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200/70 dark:border-blue-800";
  let textareaBorder = "border-slate-200 dark:border-slate-700 focus-visible:ring-blue-400";

  if (theme === "blue") {
    labelColor = "text-blue-900 dark:text-blue-300";
    textareaBorder = "border-blue-200 dark:border-blue-900 focus-visible:ring-blue-400";
  } else if (theme === "rose") {
    labelColor = "text-rose-900 dark:text-rose-300";
    btnColor = "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200/70 dark:border-rose-800";
    textareaBorder = "border-rose-200 dark:border-rose-800 focus-visible:ring-rose-400";
  }

  const handleSaveLink = (title: string, url: string, target?: ExtractedLinkItem | null) => {
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "https://" + cleanUrl;
    }
    const cleanTitle = title.trim() || cleanUrl;
    const markdownLink = `[${cleanTitle}](${cleanUrl})`;

    let updatedValue = value || "";
    if (target && target.raw) {
      updatedValue = updatedValue.replace(target.raw, markdownLink);
    } else {
      updatedValue = updatedValue.trim() ? `${updatedValue.trim()}\n${markdownLink}` : markdownLink;
    }

    setValue(updatedValue);
    setIsEditingLink(false);
    setEditingTargetLink(null);
  };

  const handleDeleteLink = (linkItem: ExtractedLinkItem) => {
    const rawTarget = linkItem.raw || linkItem.url || "";
    if (!rawTarget) return;
    const regex = new RegExp(`(^|\\n)?${escapeRegExp(rawTarget)}(\\n|$)?`, "g");
    let updated = value.replace(regex, (match, p1, p2) => {
      if (p1 && p2) return "\n";
      return "";
    }).trim();
    setValue(updated);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 1500);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className={`text-xs font-extrabold uppercase tracking-wider ${labelColor}`}>
          {label}
        </label>
        {!readOnly && (
          <button
            type="button"
            onClick={() => {
              if (isEditingLink) {
                setIsEditingLink(false);
                setEditingTargetLink(null);
              } else {
                setIsEditingLink(true);
                setEditingTargetLink(null);
              }
            }}
            className={`text-[11px] font-bold hover:underline flex items-center gap-1 px-2.5 py-0.5 rounded-lg border ${btnColor} transition cursor-pointer`}
          >
            <span>{isEditingLink ? "Đóng" : "+ Chèn Link"}</span>
            <Link2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {isEditingLink && (
        <RichLinkEditor
          fieldName={fieldName}
          isEditing={isEditingLink}
          onClose={() => {
            setIsEditingLink(false);
            setEditingTargetLink(null);
          }}
          onSaveLink={handleSaveLink}
          editingTargetLink={editingTargetLink}
        />
      )}

      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        readOnly={readOnly}
        rows={dynamicRows}
        placeholder={placeholder}
        className={`text-xs sm:text-sm font-semibold rounded-2xl p-3 resize-y transition-all ${textareaBorder} ${
          readOnly
            ? "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-default border-slate-200 dark:border-slate-700"
            : "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
        }`}
      />

      {extractedLinks.length > 0 && (
        <div className="space-y-1.5 pt-0.5">
          {extractedLinks.map((item: ExtractedLinkItem, idx: number) => {
            const isCopied = copiedUrl === item.url;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-xs p-1.5 sm:p-2 flex items-center justify-between gap-2 transition-all hover:border-blue-300 dark:hover:border-blue-700"
              >
                <a
                  href={formatURL(item.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 min-w-0 flex-1 group"
                >
                  <div className="p-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-xl flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-xs text-blue-600 dark:text-blue-400 truncate group-hover:underline">
                        {item.text}
                      </span>
                      <ExternalLink className="w-3 h-3 text-blue-400 opacity-60 group-hover:opacity-100 flex-shrink-0" />
                    </div>
                    <span className="text-[10px] text-slate-400 truncate block">
                      {item.url}
                    </span>
                  </div>
                </a>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(item.url)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                    title="Sao chép liên kết"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  {!readOnly && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTargetLink(item);
                          setIsEditingLink(true);
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                        title="Chỉnh sửa liên kết"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLink(item)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                        title="Xóa liên kết"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
