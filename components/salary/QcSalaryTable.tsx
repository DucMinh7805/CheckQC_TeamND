"use client";

/**
 * ============================================================================
 * FILE: components/salary/QcSalaryTable.tsx
 * MỤC ĐÍCH: Bảng hiển thị chi tiết số liệu tính lương QC và sắp xếp cột
 * ============================================================================
 */

import React from "react";
import { QcSalaryStatItem } from "@/types";
import { ArrowUpDown, ArrowUp, ArrowDown, Coins } from "lucide-react";

export type QcSortField = "qcName" | "doneQuestionsCount" | "totalErrorsChecked" | "doneTasksCount" | "totalSalary";

interface QcSalaryTableProps {
  salaryData: (QcSalaryStatItem & { totalSalary: number })[];
  totals: { doneTasks: number; doneQuestions: number; totalErrors: number; grandSalary: number };
  sortField: QcSortField | null;
  sortOrder: "asc" | "desc";
  onSort: (field: QcSortField) => void;
}

export const QcSalaryTable: React.FC<QcSalaryTableProps> = ({
  salaryData,
  totals,
  sortField,
  sortOrder,
  onSort,
}) => {
  const renderSortIcon = (field: QcSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 ml-1 inline-block" />;
    }
    if (sortOrder === "asc") {
      return <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ml-1 inline-block" />;
    }
    return <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ml-1 inline-block" />;
  };

  return (
    <div className="space-y-3">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-sm overflow-hidden w-full max-w-full">
        <div className="overflow-x-auto touch-pan-x w-full overscroll-x-contain scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
          <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[720px]">
            <thead>
              <tr className="bg-blue-100/80 dark:bg-blue-950/70 text-blue-950 dark:text-blue-200 font-black uppercase tracking-wider text-[11px] sm:text-xs border-b-2 border-blue-300 dark:border-blue-800">
                <th
                  onClick={() => onSort("qcName")}
                  className="p-3.5 pl-4 border-r border-blue-200/80 dark:border-blue-800/80 cursor-pointer select-none hover:bg-blue-200/80 transition"
                >
                  <div className="flex items-center justify-between">
                    <span>Tên QC</span>
                    {renderSortIcon("qcName")}
                  </div>
                </th>
                <th
                  onClick={() => onSort("doneTasksCount")}
                  className="p-3.5 text-center border-r border-blue-200/80 dark:border-blue-800/80 min-w-[100px] cursor-pointer select-none hover:bg-blue-200/60 transition"
                >
                  <div className="flex items-center justify-center">
                    <span>Số đề Done</span>
                    {renderSortIcon("doneTasksCount")}
                  </div>
                </th>
                <th
                  onClick={() => onSort("doneQuestionsCount")}
                  className="p-3.5 text-center border-r border-blue-200/80 dark:border-blue-800/80 min-w-[140px] cursor-pointer select-none hover:bg-blue-200/60 transition"
                >
                  <div className="flex items-center justify-center">
                    <span>Số câu đã check</span>
                    {renderSortIcon("doneQuestionsCount")}
                  </div>
                </th>
                <th
                  onClick={() => onSort("totalErrorsChecked")}
                  className="p-3.5 text-center border-r border-blue-200/80 dark:border-blue-800/80 min-w-[130px] cursor-pointer select-none hover:bg-blue-200/60 transition"
                >
                  <div className="flex items-center justify-center">
                    <span>Số lỗi đã check</span>
                    {renderSortIcon("totalErrorsChecked")}
                  </div>
                </th>
                <th
                  onClick={() => onSort("totalSalary")}
                  className="p-3.5 text-center min-w-[150px] font-black text-emerald-950 dark:text-emerald-100 bg-emerald-200/90 dark:bg-emerald-900/80 cursor-pointer select-none hover:bg-emerald-300 transition"
                >
                  <div className="flex items-center justify-center">
                    <span>TỔNG TIỀN (VNĐ)</span>
                    {renderSortIcon("totalSalary")}
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-bold text-slate-800 dark:text-slate-200">
              {salaryData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                    Không có dữ liệu QC trong tháng này
                  </td>
                </tr>
              ) : (
                salaryData.map((row, idx) => {
                  const isEven = idx % 2 === 0;
                  const rowBg = isEven
                    ? "bg-white dark:bg-slate-900"
                    : "bg-slate-50/90 dark:bg-slate-800/50";

                  return (
                    <tr
                      key={row.qcName}
                      className={`${rowBg} hover:bg-blue-50/50 dark:hover:bg-slate-800/80 transition`}
                    >
                      <td className="p-3.5 pl-4 font-black text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black text-xs">
                            {row.qcName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="block">{row.qcName}</span>
                            {row.role && (
                              <span className="text-[10px] text-slate-400 font-bold">
                                {row.role}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-3.5 text-center border-r border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                        {row.doneTasksCount > 0 ? (
                          <span className="font-extrabold">{row.doneTasksCount}</span>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="p-3.5 text-center border-r border-slate-200 dark:border-slate-700">
                        {row.doneQuestionsCount > 0 ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-black text-sm">
                            {row.doneQuestionsCount.toLocaleString("vi-VN")}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-semibold">0</span>
                        )}
                      </td>

                      <td className="p-3.5 text-center border-r border-slate-200 dark:border-slate-700">
                        {row.totalErrorsChecked > 0 ? (
                          <span className="text-rose-700 dark:text-rose-400 font-black text-sm">
                            {row.totalErrorsChecked.toLocaleString("vi-VN")}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-semibold">0</span>
                        )}
                      </td>

                      <td className="p-3.5 text-center font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40 text-sm">
                        {row.totalSalary > 0 ? `${row.totalSalary.toLocaleString("vi-VN")} ₫` : "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {salaryData.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 dark:bg-slate-800 font-black text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                  <td className="p-3.5 pl-4 uppercase tracking-wider text-xs border-r border-slate-200 dark:border-slate-700">
                    TỔNG CỘNG
                  </td>
                  <td className="p-3.5 text-center border-r border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                    {totals.doneTasks > 0 ? totals.doneTasks.toLocaleString("vi-VN") : "-"}
                  </td>
                  <td className="p-3.5 text-center border-r border-slate-200 dark:border-slate-700 text-emerald-800 dark:text-emerald-300 text-sm font-black">
                    {totals.doneQuestions.toLocaleString("vi-VN")}
                  </td>
                  <td className="p-3.5 text-center border-r border-slate-200 dark:border-slate-700 text-rose-800 dark:text-rose-300 text-sm font-black">
                    {totals.totalErrors.toLocaleString("vi-VN")}
                  </td>
                  <td className="p-3.5 text-center font-black text-emerald-900 dark:text-emerald-200 text-base bg-emerald-200/90 dark:bg-emerald-900/80">
                    {totals.grandSalary > 0 ? `${totals.grandSalary.toLocaleString("vi-VN")} ₫` : "-"}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div className="bg-blue-50/60 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-200/60 dark:border-blue-900/60 text-[11px] text-blue-800 dark:text-blue-300 font-semibold flex items-center gap-2">
        <Coins className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <span>
          <strong>Công thức tính lương QC:</strong> Tổng tiền = (Số câu đã Done × Đơn giá câu) + (Số lỗi đã check × Đơn giá lỗi).
        </span>
      </div>
    </div>
  );
};
