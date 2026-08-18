"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { QCQuestionStatItem, MonthlyAssignmentItem } from "@/types";
import { formatURL } from "@/lib/helpers";
import {
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Layers,
  Hash,
  Percent,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Calendar,
  Sparkles,
  Award,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

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

  const [expandedQC, setExpandedQC] = useState<string | null>(null);

  const effectiveRole = impersonatedRole || currentUser?.role;
  const isAdmin = effectiveRole === "ADMIN";

  // Chỉ dành cho Admin
  if (!isAdmin) return null;

  const toggleExpand = (qcName: string) => {
    setExpandedQC((prev) => (prev === qcName ? null : qcName));
  };

  // Xuất file CSV báo cáo số câu
  const handleExportCSV = () => {
    if (qcQuestionStats.length === 0) return;

    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += `BÁO CÁO TIẾN ĐỘ & SỐ CÂU QC - ${selectedAssignmentMonth}\n\n`;
    csvContent += "Nhân sự QC,Tổng đề giao,Tổng số câu giao,Số câu đã check,Tỷ lệ hoàn thành (%)\n";

    qcQuestionStats.forEach((q) => {
      csvContent += `"${q.qcName}",${q.totalAssignedTasks},${q.totalAssignedQuestions},${q.totalCheckedQuestions},"${q.completionRate}%"\n`;
    });

    csvContent += `\n"TỔNG TOÀN TEAM",${teamQuestionTotals.totalTasks},${teamQuestionTotals.totalAssignedQuestions},${teamQuestionTotals.totalCheckedQuestions},"${teamQuestionTotals.completionRate}%"\n\n`;

    csvContent += "CHI TIẾT ĐỀ BÀI TỪNG QC\n";
    csvContent += "QC,Tên đề,Số câu thực,Người làm,Trạng thái QC,Link đề,Link SP,Ghi chú\n";

    qcQuestionStats.forEach((q) => {
      q.tasksList.forEach((t) => {
        const statusText = t.qc_done ? "Đã check" : "Chưa check";
        csvContent += `"${q.qcName}","${t.task_title}",${t.so_cau},"${t.worker_name}","${statusText}","${t.link_de || ""}","${t.link_sp || ""}","${t.note || ""}"\n`;
      });
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `BaoCao_SoCau_QC_${selectedAssignmentMonth.replace(/[\s\.\/]/g, "_")}.csv`;
    link.click();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Top Banner & Bộ lọc Chọn Tháng Phân Công */}
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

        {/* Bộ lọc chọn tháng & Nút xuất báo cáo */}
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
            variant="outline"
            onClick={handleExportCSV}
            disabled={qcQuestionStats.length === 0}
            className="rounded-2xl border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100 font-extrabold text-xs sm:text-sm h-10 px-4 flex items-center gap-2 shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất Báo Cáo CSV</span>
          </Button>
        </div>
      </div>

      {/* Thông báo nếu chưa có dữ liệu tab tháng */}
      {availableAssignmentMonths.length === 0 && (
        <div className="p-8 rounded-3xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
          <h3 className="text-base font-extrabold text-amber-900 dark:text-amber-200">
            Chưa tìm thấy Tab phân công theo tháng trong Google Sheets
          </h3>
          <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 max-w-lg mx-auto font-medium">
            Hãy tạo các Tab có định dạng tên như: <strong>Tháng 8.2026</strong>, <strong>Tháng 9.2026</strong>... trong file Google Sheets và cập nhật mã Apps Script mới nhất để hệ thống tự động nhận diện.
          </p>
        </div>
      )}

      {/* 4 Thẻ KPI Tổng Toàn Team */}
      {availableAssignmentMonths.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Tổng Đề Phân Công */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Tổng Đề Phân Công
              </p>
              <FileCheck className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
              {teamQuestionTotals.totalTasks} <span className="text-xs font-bold text-slate-500">đề</span>
            </p>
          </div>

          {/* Tổng Số Câu Được Giao */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-extrabold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                Tổng Số Câu Giao
              </p>
              <Hash className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 mt-2">
              {teamQuestionTotals.totalAssignedQuestions.toLocaleString("vi-VN")} <span className="text-xs font-bold text-slate-500">câu</span>
            </p>
          </div>

          {/* Tổng Số Câu Đã Check */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                Số Câu Đã Check
              </p>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
              {teamQuestionTotals.totalCheckedQuestions.toLocaleString("vi-VN")} <span className="text-xs font-bold text-slate-500">câu</span>
            </p>
          </div>

          {/* Tỷ Lệ Hoàn Thành Toàn Team */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-extrabold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                Tiến Độ Toàn Team
              </p>
              <Percent className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
                {teamQuestionTotals.completionRate}%
              </p>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, teamQuestionTotals.completionRate)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bảng Thống Kê Tổng Hợp Chi Tiết Theo Từng QC */}
      {qcQuestionStats.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                Bảng Năng Suất Số Câu Từng Nhân Sự QC ({selectedAssignmentMonth})
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {qcQuestionStats.length} nhân sự QC
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-700/80 text-[11px] sm:text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Nhân Sự QC</th>
                  <th className="py-3.5 px-4 text-center">Tổng Đề Giao</th>
                  <th className="py-3.5 px-4 text-center">Tổng Câu Giao</th>
                  <th className="py-3.5 px-4 text-center">Số Câu Đã Check</th>
                  <th className="py-3.5 px-4 text-center min-w-[160px]">Tỷ Lệ Hoàn Thành</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Chi Tiết Đề</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm font-semibold">
                {qcQuestionStats.map((qc) => {
                  const isExpanded = expandedQC === qc.qcName;
                  return (
                    <React.Fragment key={qc.qcName}>
                      <tr
                        onClick={() => toggleExpand(qc.qcName)}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition select-none"
                      >
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 flex items-center justify-center font-black text-xs">
                              {qc.qcName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-black text-slate-900 dark:text-white">
                              {qc.qcName}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                          {qc.totalAssignedTasks}
                        </td>

                        <td className="py-3.5 px-4 text-center font-black text-blue-700 dark:text-blue-300">
                          {qc.totalAssignedQuestions.toLocaleString("vi-VN")}
                        </td>

                        <td className="py-3.5 px-4 text-center font-black text-emerald-700 dark:text-emerald-300">
                          {qc.totalCheckedQuestions.toLocaleString("vi-VN")}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex flex-col gap-1 items-center justify-center">
                            <span className="font-black text-xs text-purple-700 dark:text-purple-300">
                              {qc.completionRate}%
                            </span>
                            <div className="w-28 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  qc.completionRate >= 80
                                    ? "bg-emerald-500"
                                    : qc.completionRate >= 40
                                    ? "bg-blue-500"
                                    : "bg-amber-500"
                                }`}
                                style={{ width: `${Math.min(100, qc.completionRate)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(qc.qcName);
                            }}
                            className="rounded-xl font-bold text-xs h-8 px-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                          >
                            <span>{isExpanded ? "Thu gọn" : "Xem đề"}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 ml-1" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 ml-1" />
                            )}
                          </Button>
                        </td>
                      </tr>

                      {/* Hàng Accordion Mở Rộng: Danh Sách Chi Tiết Từng Đề của QC */}
                      {isExpanded && (
                        <tr className="bg-blue-50/30 dark:bg-slate-800/30">
                          <td colSpan={6} className="p-4 sm:p-6">
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 space-y-3 shadow-inner">
                              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                  Danh sách đề bài phân công cho {qc.qcName} ({qc.tasksList.length} đề)
                                </h4>
                                <span className="text-[11px] font-bold text-slate-500">
                                  {qc.totalCheckedQuestions} / {qc.totalAssignedQuestions} câu đã check
                                </span>
                              </div>

                              <div className="space-y-2">
                                {qc.tasksList.map((t, idx) => (
                                  <div
                                    key={idx}
                                    className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5"
                                  >
                                    <div className="space-y-1 min-w-0 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge
                                          variant="outline"
                                          className={`text-[10px] font-black rounded-md ${
                                            t.qc_done
                                              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                                              : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
                                          }`}
                                        >
                                          {t.qc_done ? "ĐÃ CHECK XONG" : "CHƯA CHECK"}
                                        </Badge>
                                        <span className="text-xs font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                                          {t.so_cau} câu thực
                                        </span>
                                        {t.worker_name && (
                                          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                            Làm bởi: <strong>{t.worker_name}</strong>
                                          </span>
                                        )}
                                      </div>
                                      <p className="font-black text-xs sm:text-sm text-slate-900 dark:text-white leading-snug">
                                        {t.task_title}
                                      </p>
                                      {t.note && (
                                        <p className="text-[11px] text-slate-500 font-medium italic">
                                          Note: {t.note}
                                        </p>
                                      )}
                                    </div>

                                    {/* Links đính kèm nếu có */}
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                      {t.link_de && (
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => window.open(formatURL(t.link_de || ""), "_blank")}
                                          className="text-[11px] h-7 px-2 font-bold rounded-lg border-blue-200 text-blue-700 hover:bg-blue-50 flex items-center gap-1"
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
                                          className="text-[11px] h-7 px-2 font-bold rounded-lg border-purple-200 text-purple-700 hover:bg-purple-50 flex items-center gap-1"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                          <span>Link SP</span>
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
