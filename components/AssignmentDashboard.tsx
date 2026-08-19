"use client";

/**
 * ============================================================================
 * FILE: components/AssignmentDashboard.tsx
 * MỤC ĐÍCH: Màn hình chính của Tab "Báo Cáo Tổng Số Câu QC" (Dành cho Admin)
 * CHỨC NĂNG:
 *   1. Hiển thị Banner tiêu đề và Bộ chọn tháng phân công (Tháng 8.2026, 9.2026...)
 *   2. Nút bấm mở cửa sổ "Báo lỗi QC" (QcErrorReportModal)
 *   3. Nút bấm "Xuất Báo Cáo CSV" tải file Excel thống kê
 *   4. Ghép nối 2 component con: TeamSummaryKpiCards & QcPerformanceTable
 * ============================================================================
 */

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { exportQcQuestionStatsToCSV } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { BarChart3, Layers, Calendar, Sparkles, AlertCircle, FileSpreadsheet } from "lucide-react";
import { TeamSummaryKpiCards } from "@/components/TeamSummaryKpiCards";
import { QcPerformanceTable } from "@/components/QcPerformanceTable";
import { QcErrorReportModal } from "@/components/QcErrorReportModal";

export const AssignmentDashboard: React.FC = () => {
  const {
    currentUser,
    impersonatedRole,
    availableAssignmentMonths,
    selectedAssignmentMonth,
    setSelectedAssignmentMonth,
    qcQuestionStats,
    teamQuestionTotals,
  } = useApp();

  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState<boolean>(false);

  const effectiveRole = impersonatedRole || currentUser?.role;
  if (effectiveRole !== "ADMIN") return null;

  return (
    <div className="space-y-5 animate-in fade-in duration-300 max-w-full">
      {/* Header Banner & Điều khiển */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-500/20 flex-shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 font-extrabold text-[11px] uppercase tracking-wider border border-blue-200/80 dark:border-blue-800 mb-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Dành Cho Quản Trị Viên (Admin)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Báo Cáo Tổng Số Câu & Năng Suất QC
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
              Tổng hợp và đối soát tiến độ câu thực tế từ Sheet Phân Công theo từng tháng
            </p>
          </div>
        </div>

        {/* Bộ lọc tháng & Nút Báo lỗi QC + Xuất CSV */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-end">
          {availableAssignmentMonths.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Calendar className="w-4 h-4 text-blue-600 ml-2" />
              <Select
                value={selectedAssignmentMonth}
                onValueChange={(val) => val && setSelectedAssignmentMonth(val)}
              >
                <SelectTrigger className="border-none bg-transparent shadow-none font-black text-xs sm:text-sm h-9 min-w-[140px]">
                  <span>{selectedAssignmentMonth || "Chọn tháng"}</span>
                </SelectTrigger>
                <SelectContent className="max-h-60 rounded-2xl">
                  {availableAssignmentMonths.map((m) => (
                    <SelectItem key={m} value={m} className="font-extrabold text-xs sm:text-sm">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            onClick={() => setIsAnalyticsOpen(true)}
            aria-label="Mở Báo lỗi QC"
            className="rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs sm:text-sm h-10 px-4 flex items-center gap-2 shadow-md transition-all active:scale-[0.98]"
          >
            <BarChart3 className="w-4 h-4 text-white" />
            <span>Báo lỗi QC</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => exportQcQuestionStatsToCSV(qcQuestionStats, teamQuestionTotals, selectedAssignmentMonth)}
            disabled={qcQuestionStats.length === 0}
            className="rounded-2xl border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100 font-extrabold text-xs sm:text-sm h-10 px-4 flex items-center gap-2 shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất Báo Cáo CSV</span>
          </Button>
        </div>
      </div>

      {/* Thông báo nếu chưa có Tab phân công */}
      {availableAssignmentMonths.length === 0 && (
        <div className="p-8 rounded-3xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
          <h3 className="text-base font-extrabold text-amber-900 dark:text-amber-200">
            Chưa tìm thấy Tab phân công theo tháng trong Google Sheets
          </h3>
          <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 max-w-lg mx-auto font-medium">
            Hãy tạo các Tab có định dạng tên như: <strong>Tháng 8.2026</strong>... trong file Google Sheets để hệ thống tự động nhận diện.
          </p>
        </div>
      )}

      {/* 4 Thẻ KPI Tổng Toàn Team */}
      <TeamSummaryKpiCards />

      {/* Bảng Năng Suất Số Câu Từng QC */}
      <QcPerformanceTable />

      {/* Modal Báo Cáo Lỗi Của QC */}
      <QcErrorReportModal open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen} />
    </div>
  );
};
