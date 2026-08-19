"use client";

/**
 * ============================================================================
 * FILE: components/QcTaskDetailRow.tsx
 * MỤC ĐÍCH: Khung mở rộng chi tiết khi nhấn vào một nhân sự QC trên bảng
 * CHỨC NĂNG:
 *   1. Tab 1: "Danh sách đề phân công" -> Hiển thị danh sách đề, trạng thái check, link đề & link SP
 *   2. Tab 2: "Số lỗi ở từng đề" -> Danh sách các đề bị báo lỗi kèm 3 trường (Số câu, Ai làm, QC)
 *      và chi tiết các lần lỗi (Lỗi 1, Lỗi 2, Lỗi 3, Phản hồi, Minh chứng)
 * ============================================================================
 */

import React, { useState } from "react";
import { QCQuestionStatItem, TaskItem } from "@/types";
import { formatURL, getVal } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";

interface QcTaskDetailRowProps {
  qc: QCQuestionStatItem;
  qcErrors: TaskItem[];
}

export const QcTaskDetailRow: React.FC<QcTaskDetailRowProps> = ({
  qc,
  qcErrors,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"TASKS" | "ERRORS">("TASKS");
  const [expandedErrorIdx, setExpandedErrorIdx] = useState<number | null>(null);

  const toggleErrorDetail = (idx: number) => {
    setExpandedErrorIdx((prev) => (prev === idx ? null : idx));
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 space-y-4 shadow-sm w-full max-w-full">
      {/* Thanh chuyển 2 Tab: Chỉ ghi tên nội dung, không icon, không số thứ tự */}
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveSubTab("TASKS");
          }}
          className={
            "px-4 py-2 rounded-xl font-extrabold text-xs sm:text-sm transition-all " +
            (activeSubTab === "TASKS"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700")
          }
        >
          Danh sách đề phân công ({qc.tasksList.length})
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveSubTab("ERRORS");
          }}
          className={
            "px-4 py-2 rounded-xl font-extrabold text-xs sm:text-sm transition-all " +
            (activeSubTab === "ERRORS"
              ? "bg-slate-900 dark:bg-slate-700 text-white shadow-xs"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700")
          }
        >
          Số lỗi ở từng đề ({qcErrors.length})
        </button>
      </div>

      {/* NỘI DUNG TAB 1: DANH SÁCH ĐỀ PHÂN CÔNG */}
      {activeSubTab === "TASKS" && (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {qc.tasksList.map((t, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 hover:bg-slate-100/90 dark:hover:bg-slate-800 transition"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={
                      "text-[10px] font-black rounded-md px-1.5 py-0 " +
                      (t.qc_done
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300")
                    }
                  >
                    {t.qc_done ? "Đã Check Xong" : "Chưa Check"}
                  </Badge>
                  {t.worker_name && (
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Làm bởi: <strong className="text-slate-800 dark:text-slate-200">{t.worker_name}</strong>
                    </span>
                  )}
                </div>
                <p className="font-black text-xs sm:text-sm text-slate-900 dark:text-white leading-snug">
                  {t.task_title}
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-auto">
                {t.link_de && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(formatURL(t.link_de || ""), "_blank")}
                    className="text-[11px] h-7 px-2 font-bold rounded-lg border-blue-200 text-blue-700 hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Link đề</span>
                  </Button>
                )}
                {t.link_sp && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(formatURL(t.link_sp || ""), "_blank")}
                    className="text-[11px] h-7 px-2 font-bold rounded-lg border-purple-200 text-purple-700 hover:bg-purple-50 dark:hover:bg-slate-800 flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Link SP</span>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NỘI DUNG TAB 2: SỐ LỖI Ở TỪNG ĐỀ */}
      {activeSubTab === "ERRORS" && (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {qcErrors.length === 0 ? (
            <div className="p-6 text-center text-slate-400 font-bold text-xs bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              🎉 Tuyệt vời! Chưa ghi nhận đề nào bị báo lỗi của QC này.
            </div>
          ) : (
            qcErrors.map((task, idx) => {
              const title = getVal(task, "Tên đề") || "Đề bài";
              const worker = getVal(task, "Ai làm") || "N/A";
              const qcNameVal = getVal(task, "QC") || qc.qcName || "N/A";
              const soCauVal = getVal(task, "Số câu") || getVal(task, "Số câu thực") || "-";
              const loi1 = getVal(task, "Lỗi lần 1");
              const loi2 = getVal(task, "Lỗi lần 2");
              const loi3 = getVal(task, "Lỗi lần 3");
              const ndPhanHoi = getVal(task, "Nội Dung Phản hồi");
              const qcPhanHoi = getVal(task, "Phản hồi của QC");
              const minhChung = getVal(task, "Minh chứng");

              const isItemOpen = expandedErrorIdx === idx;

              return (
                <div
                  key={idx}
                  className="bg-slate-50/90 dark:bg-slate-800/60 rounded-xl border border-slate-200/90 dark:border-slate-700/80 overflow-hidden transition shadow-2xs"
                >
                  {/* Hàng Tiêu Đề Đề Bài */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleErrorDetail(idx);
                    }}
                    className="p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800 transition select-none"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
                        {worker}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs font-bold text-slate-600 dark:text-slate-300"
                      >
                        {isItemOpen ? (
                          <span className="flex items-center gap-1 text-blue-600">
                            Thu gọn <ChevronUp className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            Chi tiết lỗi <ChevronDown className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Khung Chi Tiết: 3 ô trường Số câu | Ai làm | QC + List lỗi */}
                  {isItemOpen && (
                    <div className="p-3.5 pt-0 border-t border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-900/90 space-y-3">
                      <div className="grid grid-cols-3 gap-2 pt-3 text-xs">
                        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">
                            Số câu:
                          </span>
                          <span className="font-black text-blue-600 dark:text-blue-400">
                            {soCauVal}
                          </span>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">
                            Ai làm:
                          </span>
                          <span className="font-black text-slate-900 dark:text-white">
                            {worker}
                          </span>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">
                            QC:
                          </span>
                          <span className="font-black text-purple-600 dark:text-purple-400">
                            {qcNameVal}
                          </span>
                        </div>
                      </div>

                      {/* Chi Tiết Lỗi Dạng List */}
                      <div className="space-y-1.5 pt-1 text-xs">
                        <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                          Chi tiết các lỗi ghi nhận:
                        </span>

                        <div className="space-y-2 bg-slate-50 dark:bg-slate-800/70 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
                          {loi1 && (
                            <div className="flex items-start gap-2">
                              <span className="font-extrabold text-amber-700 dark:text-amber-400 min-w-[70px] flex-shrink-0">
                                • Lỗi lần 1:
                              </span>
                              <span className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap flex-1">
                                {loi1}
                              </span>
                            </div>
                          )}

                          {loi2 && (
                            <div className="flex items-start gap-2">
                              <span className="font-extrabold text-orange-700 dark:text-orange-400 min-w-[70px] flex-shrink-0">
                                • Lỗi lần 2:
                              </span>
                              <span className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap flex-1">
                                {loi2}
                              </span>
                            </div>
                          )}

                          {loi3 && (
                            <div className="flex items-start gap-2">
                              <span className="font-extrabold text-rose-700 dark:text-rose-400 min-w-[70px] flex-shrink-0">
                                • Lỗi lần 3:
                              </span>
                              <span className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap flex-1">
                                {loi3}
                              </span>
                            </div>
                          )}

                          {ndPhanHoi && (
                            <div className="flex items-start gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                              <span className="font-extrabold text-blue-700 dark:text-blue-300 min-w-[70px] flex-shrink-0">
                                • ND phản hồi:
                              </span>
                              <span className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap flex-1">
                                {ndPhanHoi}
                              </span>
                            </div>
                          )}

                          {qcPhanHoi && (
                            <div className="flex items-start gap-2">
                              <span className="font-extrabold text-purple-700 dark:text-purple-300 min-w-[70px] flex-shrink-0">
                                • QC phản hồi:
                              </span>
                              <span className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap flex-1">
                                {qcPhanHoi}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Nút Xem Minh Chứng */}
                      {minhChung && (
                        <div className="pt-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(formatURL(minhChung), "_blank")}
                            className="h-8 px-3 text-xs font-bold rounded-xl border-rose-300 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Mở Link Minh Chứng</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
