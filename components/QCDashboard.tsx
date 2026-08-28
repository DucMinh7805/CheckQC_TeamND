"use client";

/**
 * ============================================================================
 * FILE: components/QCDashboard.tsx
 * MỤC ĐÍCH: Bảng điều khiển dành riêng cho nhân sự QC khi đăng nhập
 * CHỨC NĂNG:
 *   1. Thống kê số lượng đề bài được phân công cho cá nhân QC
 *   2. Theo dõi tiến độ đề Đã Pass, Đang Báo Lỗi và Chưa Kiểm Tra
 *   3. Danh sách đề bài được phân công kèm nút thao tác nhanh
 * ============================================================================
 */

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { TaskItem } from "@/types";
import { getVal, getStatusObj, exportTasksToCSV } from "@/lib/helpers";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Hash,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  TableProperties,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface QCDashboardProps {
  onOpenDetails: (task: TaskItem) => void;
}

export const QCDashboard: React.FC<QCDashboardProps> = ({ onOpenDetails }) => {
  const { currentUser, qcPersonalStats, selectedMonth } = useApp();
  const [showQCDetail, setShowQCDetail] = useState<boolean>(false);

  if (currentUser?.role !== "QC") return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-4 sm:gap-5 transition-all">
      {/* Header Dashboard QC */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 sm:pb-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 sm:p-2.5 bg-purple-100/80 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded-2xl flex-shrink-0">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-extrabold text-slate-800 dark:text-white leading-snug">
              Bảng Thống Kê QC ({currentUser.name})
            </h2>
            <p className="text-[11px] sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
              Tổng hợp số liệu kiểm tra và bắt lỗi trong tháng đang chọn
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportTasksToCSV(qcPersonalStats.tasksList, `QC_${currentUser.name}_${selectedMonth}`)}
            aria-label="Xuất danh sách đề QC phụ trách ra CSV"
            className="rounded-xl sm:rounded-2xl border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 font-extrabold text-[11px] sm:text-xs flex items-center gap-1.5 h-8 sm:h-9"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Xuất CSV</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowQCDetail(!showQCDetail)}
            aria-label={showQCDetail ? "Đóng bảng chi tiết từng đề QC" : "Mở bảng chi tiết từng đề QC"}
            className="rounded-xl sm:rounded-2xl border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50 font-extrabold text-[11px] sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-xs h-8 sm:h-9"
          >
            <TableProperties className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
            <span>{showQCDetail ? "Đóng bảng" : "Bảng chi tiết"}</span>
            {showQCDetail ? (
              <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* 4 Thẻ KPI cá nhân của QC */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-slate-50/90 dark:bg-slate-800/80 p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-700 hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Đề Phụ Trách
            </p>
            <FileCheck2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
          </div>
          <p className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 sm:mt-2">
            {qcPersonalStats.totalTasks}
          </p>
        </div>

        <div className="bg-blue-50/70 dark:bg-blue-950/30 p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-blue-100/90 dark:border-blue-900/60 hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-extrabold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
              Số Câu Đã Check
            </p>
            <Hash className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
          </div>
          <p className="text-xl sm:text-3xl font-black text-blue-800 dark:text-blue-300 mt-1 sm:mt-2">
            {qcPersonalStats.totalQuestions}
          </p>
        </div>

        <div className="bg-rose-50/70 dark:bg-rose-950/30 p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-rose-100/90 dark:border-rose-900/60 hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-extrabold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
              Lỗi Đã Bắt
            </p>
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600" />
          </div>
          <p className="text-xl sm:text-3xl font-black text-rose-800 dark:text-rose-300 mt-1 sm:mt-2">
            {qcPersonalStats.totalErrorsFound}
          </p>
        </div>

        <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-emerald-100/90 dark:border-emerald-900/60 hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              Đã Pass
            </p>
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-3xl font-black text-emerald-800 dark:text-emerald-300 mt-1 sm:mt-2">
            {qcPersonalStats.totalPassed}
          </p>
        </div>
      </div>

      {/* Bảng Chi Tiết Các Đề QC Đã Check */}
      {showQCDetail && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Chi Tiết Từng Đề Do QC {currentUser.name} Phụ Trách ({qcPersonalStats.tasksList.length} đề)
            </h3>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-700">
                  <th className="p-3.5 pl-4">Tên Đề Bài</th>
                  <th className="p-3.5">Nội Dung Làm</th>
                  <th className="p-3.5 text-center">Số Câu</th>
                  <th className="p-3.5 text-center">Trạng Thái</th>
                  <th className="p-3.5">Lỗi Đã Bắt</th>
                  <th className="p-3.5 text-center">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {qcPersonalStats.tasksList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500 font-bold">
                      Không có đề nào do bạn phụ trách trong tháng này
                    </td>
                  </tr>
                ) : (
                  qcPersonalStats.tasksList.map((t: TaskItem) => {
                    const st = getStatusObj(t);
                    const loi1 = getVal(t, "Lỗi lần 1");
                    const loi2 = getVal(t, "Lỗi lần 2");
                    const loi3 = getVal(t, "Lỗi lần 3");
                    const hasError = loi1 || loi2 || loi3;

                    return (
                      <tr key={t.row_index} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                        <td className="p-3.5 pl-4 font-extrabold text-slate-800 dark:text-slate-200 max-w-xs truncate">
                          {getVal(t, "Tên đề") || "Không tên"}
                        </td>
                        <td className="p-3.5 font-bold text-slate-700 dark:text-slate-300">
                          {getVal(t, "Ai làm") || "--"}
                        </td>
                        <td className="p-3.5 text-center font-extrabold text-blue-700 dark:text-blue-400">
                          {getVal(t, "Số câu") || "0"}
                        </td>
                        <td className="p-3.5 text-center">
                          <Badge
                            variant="outline"
                            className={`${st.style} px-2.5 py-0.5 text-[10px] sm:text-xs font-extrabold uppercase rounded-lg`}
                          >
                            {st.label}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-xs text-slate-700 dark:text-slate-300 max-w-sm">
                          {hasError ? (
                            <div className="space-y-1">
                              {loi1 && (
                                <p className="text-amber-800 dark:text-amber-300 font-semibold truncate">
                                  <span className="font-extrabold">L1:</span> {loi1}
                                </p>
                              )}
                              {loi2 && (
                                <p className="text-orange-800 dark:text-orange-300 font-semibold truncate">
                                  <span className="font-extrabold">L2:</span> {loi2}
                                </p>
                              )}
                              {loi3 && (
                                <p className="text-rose-800 dark:text-rose-300 font-semibold truncate">
                                  <span className="font-extrabold">L3:</span> {loi3}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500 font-medium">Không ghi nhận lỗi</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onOpenDetails(t)}
                            aria-label={`Mở duyệt đề ${getVal(t, "Tên đề") || ""}`}
                            className="text-xs font-bold text-blue-700 dark:text-blue-300 hover:text-blue-900 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-xl"
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-1" />
                            <span>Mở duyệt</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
