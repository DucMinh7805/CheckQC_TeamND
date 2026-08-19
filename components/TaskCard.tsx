"use client";

/**
 * ============================================================================
 * FILE: components/TaskCard.tsx
 * MỤC ĐÍCH: Thẻ hiển thị tóm tắt từng đề bài (Task Card)
 * CHỨC NĂNG:
 *   1. Hiển thị Trạng thái (Pass, Lỗi, Chờ QC check...), Số câu, Ai làm, QC
 *   2. Cảnh báo Lỗi lần 1, 2, 3 và Tồn > 3 ngày
 *   3. Mở nhanh Link đề và Link sản phẩm
 *   4. Nhấn vào thẻ để mở Modal xem / chỉnh sửa chi tiết (TaskModal)
 * ============================================================================
 */

import React from "react";
import { TaskItem } from "@/types";
import { useApp } from "@/context/AppContext";
import {
  getVal,
  getStatusObj,
  formatURL,
  formatDateTime,
  isMultiError,
  isPending3Days,
} from "@/lib/helpers";
import { Badge } from "@/components/ui/badge";
import {
  User as UserIcon,
  ShieldCheck,
  Hash,
  Clock,
  ExternalLink,
  FolderOpen,
  AlertTriangle,
  Lock,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaskCardProps {
  task: TaskItem;
  onOpenDetails: (task: TaskItem) => void;
}

const TaskCardComponent: React.FC<TaskCardProps> = ({ task, onOpenDetails }) => {
  const { currentUser, impersonatedRole, advancedFilter } = useApp();

  const title = getVal(task, "Tên đề") || "Đề bài không tên";
  const doerName = getVal(task, "Ai làm") || "Chưa rõ";
  const qcName = getVal(task, "QC") || "Chưa rõ";
  const questionsCount = getVal(task, "Số câu") || 0;
  const rawTime = getVal(task, "Thời gian");
  const timeFormatted = formatDateTime(rawTime);

  const linkSp = formatURL(getVal(task, "Link sản phẩm"));
  const linkMc = formatURL(getVal(task, "Minh chứng"));

  const status = getStatusObj(task);
  const effectiveRole = impersonatedRole || currentUser?.role;

  // Quyền click chỉnh sửa đề:
  // - ADMIN: Toàn quyền click mọi đề
  // - QC: Toàn quyền click mọi đề
  // - WORKER: Chỉ click được đề do chính mình làm
  let canEdit = true;
  if (effectiveRole === "WORKER") {
    canEdit = currentUser?.name === doerName;
  }

  // Bộ lọc ưu tiên: Chỉ nổi bật nhẹ nhàng khi Admin/Người dùng đang kích hoạt chế độ lọc tương ứng
  const isMultiErr = isMultiError(task);
  const isPendingLong = isPending3Days(task);

  const shouldHighlightMultiError = advancedFilter === "MULTI_ERROR" && isMultiErr;
  const shouldHighlightPending = advancedFilter === "PENDING_3_DAYS" && isPendingLong;
  const isPriorityFiltered = shouldHighlightMultiError || shouldHighlightPending;

  return (
    <div
      role={canEdit ? "button" : undefined}
      tabIndex={canEdit ? 0 : undefined}
      aria-label={canEdit ? `Mở chi tiết đề bài: ${title}` : `Đề bài ${title} (Chỉ xem)`}
      onClick={() => {
        if (canEdit) onOpenDetails(task);
      }}
      onKeyDown={(e) => {
        if (canEdit && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onOpenDetails(task);
        }
      }}
      className={`group relative w-full max-w-full overflow-hidden bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 [content-visibility:auto] [contain-intrinsic-size:120px] ${
        canEdit
          ? "cursor-pointer hover:-translate-y-0.5 sm:hover:-translate-y-1 hover:shadow-xl hover:border-[var(--accent-primary)] hover:shadow-[var(--accent-glow)] dark:hover:border-[var(--accent-neon)] dark:hover:shadow-[0_0_30px_var(--accent-glow-dark)] dark:hover:bg-[var(--accent-dark-bg)] active:scale-[0.99]"
          : "cursor-not-allowed opacity-90 border-slate-200/80 dark:border-slate-800"
      } ${
        isPriorityFiltered
          ? "bg-amber-50/40 dark:bg-amber-950/30 border-amber-300/80 dark:border-amber-700/80 shadow-xs ring-1 ring-amber-300/40"
          : "border-slate-200/80 dark:border-slate-800 shadow-xs"
      }`}
    >
      <div className="flex flex-col gap-2.5 sm:gap-3 min-w-0 w-full">
        {/* Hàng trên: Tên đề bài (trái) + Badge Trạng thái & Nút thao tác (phải) */}
        <div className="flex items-start justify-between gap-2.5 sm:gap-3 min-w-0 w-full">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0 flex-1">
            <h3
              className="font-black text-sm sm:text-base lg:text-lg text-slate-900 dark:text-white group-hover:text-[var(--accent-primary)] dark:group-hover:text-[var(--accent-neon)] transition-colors leading-snug break-all [overflow-wrap:anywhere] break-words line-clamp-3 min-w-0"
              title={title}
            >
              {title}
            </h3>

            {/* Khóa nếu là đề của người khác đối với góc nhìn nhân sự */}
            {!canEdit && (
              <Badge
                variant="outline"
                className="bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 flex-shrink-0"
                title="Đề của nhân sự khác (Chỉ xem)"
              >
                <Lock className="w-3 h-3" />
                <span>Chỉ xem</span>
              </Badge>
            )}

            {/* Tag Cảnh Báo Ưu Tiên */}
            {shouldHighlightMultiError && (
              <Badge
                variant="outline"
                className="bg-amber-100/90 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 flex-shrink-0"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Lỗi ≥ 2 lần</span>
              </Badge>
            )}

            {shouldHighlightPending && (
              <Badge
                variant="outline"
                className="bg-rose-100/90 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-200 text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 flex-shrink-0"
              >
                <Clock className="w-3.5 h-3.5 text-rose-600" />
                <span>Tồn đọng &gt; 3 ngày</span>
              </Badge>
            )}
          </div>

          {/* Cụm Trạng thái & Link: Hoàn toàn không có đường kẻ cắt ngang, liền mạch tự nhiên */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Trên Desktop (xl+): Hiển thị thêm Link SP & Minh chứng */}
            <div className="hidden xl:flex items-center gap-1.5 flex-wrap">
              {linkSp && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(linkSp, "_blank");
                  }}
                  aria-label={`Mở link sản phẩm cho đề ${title}`}
                  className="rounded-xl font-extrabold text-[11px] sm:text-xs text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/80 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100 hover:text-blue-800 flex items-center gap-1.5 h-7 sm:h-8 px-2.5 transition shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Link SP</span>
                </Button>
              )}

              {linkMc && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(linkMc, "_blank");
                  }}
                  aria-label={`Mở link minh chứng cho đề ${title}`}
                  className="rounded-xl font-extrabold text-[11px] sm:text-xs text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/80 bg-purple-50/50 dark:bg-purple-950/30 hover:bg-purple-100 hover:text-purple-800 flex items-center gap-1.5 h-7 sm:h-8 px-2.5 transition shadow-2xs"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Minh chứng</span>
                </Button>
              )}
            </div>

            {/* Badge Trạng thái chuẩn: Nằm cùng hàng trên góc phải, vừa vặn và hài hòa trên cả 3 thiết bị */}
            <Badge
              variant="outline"
              className={`${status.style} font-black text-[10px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-xl uppercase tracking-wider flex items-center gap-1.5 h-7 sm:h-8 shadow-2xs flex-shrink-0`}
            >
              <span>{status.label}</span>
            </Badge>
          </div>
        </div>

        {/* Hàng dưới: Badges thông tin (Người làm, QC, Số câu, Thời gian) */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-xl border border-slate-200/70 dark:border-slate-700/70 text-slate-800 dark:text-slate-200 transition-colors">
            <UserIcon className="w-3.5 h-3.5 text-blue-500" />
            <span>Nội dung: <strong className="text-slate-900 dark:text-white font-extrabold">{doerName}</strong></span>
          </span>

          <span className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-xl border border-slate-200/70 dark:border-slate-700/70 text-slate-800 dark:text-slate-200 transition-colors">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
            <span>QC: <strong className="text-slate-900 dark:text-white font-extrabold">{qcName}</strong></span>
          </span>

          {questionsCount > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-blue-50/80 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-xl border border-blue-200/70 dark:border-blue-800/70 transition-colors">
              <Hash className="w-3.5 h-3.5" />
              <span>{questionsCount} câu</span>
            </span>
          )}

          {timeFormatted && (
            <span className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-xl border border-slate-200/70 dark:border-slate-700/70 text-slate-600 dark:text-slate-300 transition-colors">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{timeFormatted}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const TaskCard = React.memo(TaskCardComponent);


