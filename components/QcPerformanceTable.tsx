"use client";

/**
 * ============================================================================
 * FILE: components/QcPerformanceTable.tsx
 * MỤC ĐÍCH: Bảng năng suất số câu của từng nhân sự QC theo tháng được chọn
 * CHỨC NĂNG:
 *   1. Hiển thị danh sách các nhân sự QC: Tên, Số đề, Tổng câu, Đã check, Tỷ lệ %
 *   2. Hỗ trợ sắp xếp (Sort Tăng / Giảm) khi click vào tiêu đề các cột
 *   3. Mở rộng (Expand) từng dòng khi click để hiển thị QcTaskDetailRow
 * ============================================================================
 */

import React, { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { TaskItem } from "@/types";
import { cleanStr, getVal, getStatusObj } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Award, ChevronDown, ChevronUp, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { QcTaskDetailRow } from "@/components/QcTaskDetailRow";

type QCSortField =
  | "qcName"
  | "totalAssignedTasks"
  | "totalAssignedQuestions"
  | "totalCheckedQuestions"
  | "completionRate";

export const QcPerformanceTable: React.FC = () => {
  const { appData, qcQuestionStats, selectedAssignmentMonth } = useApp();
  const [expandedQC, setExpandedQC] = useState<string | null>(null);

  // Sorting state
  const [sortField, setSortField] = useState<QCSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const toggleExpand = (qcName: string) => {
    setExpandedQC((prev) => (prev === qcName ? null : qcName));
  };

  const sortedStats = useMemo(() => {
    if (!sortField) return qcQuestionStats;
    return [...qcQuestionStats].sort((a, b) => {
      if (sortField === "qcName") {
        return sortOrder === "asc"
          ? a.qcName.localeCompare(b.qcName, "vi")
          : b.qcName.localeCompare(a.qcName, "vi");
      }
      const valA = a[sortField] || 0;
      const valB = b[sortField] || 0;
      return sortOrder === "asc" ? valA - valB : valB - valA;
    });
  }, [qcQuestionStats, sortField, sortOrder]);

  const handleSort = (field: QCSortField) => {
    if (sortField === field) {
      if (sortOrder === "desc") setSortOrder("asc");
      else {
        setSortField(null);
        setSortOrder("desc");
      }
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const renderSortIcon = (field: QCSortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-400 ml-1 inline-block" />;
    return sortOrder === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ml-1 inline-block" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ml-1 inline-block" />
    );
  };

  const getQCErrors = (qcName: string) => {
    const clean = cleanStr(qcName).toLowerCase();
    return appData.filter((task: TaskItem) => {
      if (cleanStr(getVal(task, "QC")).toLowerCase() !== clean) return false;
      const l1 = cleanStr(getVal(task, "Lỗi lần 1"));
      const l2 = cleanStr(getVal(task, "Lỗi lần 2"));
      const l3 = cleanStr(getVal(task, "Lỗi lần 3"));
      const statusObj = getStatusObj(task);
      return l1 !== "" || l2 !== "" || l3 !== "" || statusObj.code === "ERROR" || statusObj.code === "WRONG";
    });
  };

  if (qcQuestionStats.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
            Bảng Năng Suất Số Câu Từng Nhân Sự QC ({selectedAssignmentMonth})
          </h3>
        </div>
        <span className="text-xs font-semibold text-slate-500">
          {qcQuestionStats.length} nhân sự QC (Nhấn vào hàng để xem chi tiết đề & lỗi)
        </span>
      </div>

      <div className="overflow-x-auto touch-pan-x w-full overscroll-x-contain scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-700/80 text-[11px] sm:text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              <th onClick={() => handleSort("qcName")} className="py-3.5 px-4 sm:px-6 cursor-pointer select-none hover:text-blue-600 transition">
                <div className="flex items-center gap-1">
                  <span>Nhân Sự QC</span>
                  {renderSortIcon("qcName")}
                </div>
              </th>
              <th onClick={() => handleSort("totalAssignedTasks")} className="py-3.5 px-4 text-center cursor-pointer select-none hover:text-blue-600 transition">
                <div className="flex items-center justify-center gap-1">
                  <span>Tổng Đề Giao</span>
                  {renderSortIcon("totalAssignedTasks")}
                </div>
              </th>
              <th onClick={() => handleSort("totalAssignedQuestions")} className="py-3.5 px-4 text-center cursor-pointer select-none hover:text-blue-600 transition">
                <div className="flex items-center justify-center gap-1">
                  <span>Tổng Câu Giao</span>
                  {renderSortIcon("totalAssignedQuestions")}
                </div>
              </th>
              <th onClick={() => handleSort("totalCheckedQuestions")} className="py-3.5 px-4 text-center cursor-pointer select-none hover:text-blue-600 transition">
                <div className="flex items-center justify-center gap-1">
                  <span>Số Câu Đã Check</span>
                  {renderSortIcon("totalCheckedQuestions")}
                </div>
              </th>
              <th onClick={() => handleSort("completionRate")} className="py-3.5 px-4 text-center min-w-[160px] cursor-pointer select-none hover:text-blue-600 transition">
                <div className="flex items-center justify-center gap-1">
                  <span>Tỷ Lệ Hoàn Thành</span>
                  {renderSortIcon("completionRate")}
                </div>
              </th>
              <th className="py-3.5 px-4 sm:px-6 text-right">Chi Tiết Đề</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm font-semibold">
            {sortedStats.map((qc) => {
              const isExpanded = expandedQC === qc.qcName;
              const compRate = qc.completionRate ?? 0;
              const qcErrors = getQCErrors(qc.qcName);

              return (
                <React.Fragment key={qc.qcName}>
                  <tr
                    onClick={() => toggleExpand(qc.qcName)}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition select-none"
                  >
                    <td className="py-4 px-4 sm:px-6 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black text-xs">
                        {qc.qcName ? qc.qcName.charAt(0).toUpperCase() : "?"}
                      </div>
                      <span>{qc.qcName || "Chưa phân công"}</span>
                    </td>
                    <td className="py-4 px-4 text-center text-slate-700 dark:text-slate-300 font-bold">{qc.totalAssignedTasks}</td>
                    <td className="py-4 px-4 text-center font-black text-blue-600 dark:text-blue-400">{qc.totalAssignedQuestions.toLocaleString("vi-VN")}</td>
                    <td className="py-4 px-4 text-center font-black text-emerald-600 dark:text-emerald-400">{qc.totalCheckedQuestions.toLocaleString("vi-VN")}</td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center gap-2 justify-center max-w-[140px] mx-auto">
                        <span className="font-extrabold text-xs w-10 text-right">{compRate}%</span>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              compRate >= 100 ? "bg-emerald-500" : compRate >= 60 ? "bg-blue-500" : compRate >= 30 ? "bg-amber-500" : "bg-rose-500"
                            }`}
                            style={{ width: `${Math.min(100, compRate)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <Button variant="ghost" size="sm" className="rounded-xl font-extrabold text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white">
                        {isExpanded ? (
                          <span className="flex items-center gap-1 text-blue-600">Đóng <ChevronUp className="w-3.5 h-3.5" /></span>
                        ) : (
                          <span className="flex items-center gap-1">Xem đề <ChevronDown className="w-3.5 h-3.5" /></span>
                        )}
                      </Button>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-slate-50/70 dark:bg-slate-900/60">
                      <td colSpan={6} className="p-2 sm:p-4">
                        <QcTaskDetailRow qc={qc} qcErrors={qcErrors} />
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
  );
};
