"use client";

/**
 * ============================================================================
 * FILE: components/salary/NdSalaryTable.tsx
 * MỤC ĐÍCH: Bảng hiển thị 7 cột số lượng đề và tổng tiền lương cho từng nhân sự
 * ============================================================================
 */

import React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export type NdSortField =
  | "name"
  | "mcqCopy"
  | "mcqGo"
  | "deToiKhan"
  | "th"
  | "aiCreate"
  | "copyGt"
  | "goGt"
  | "total"
  | "totalSalary";

export interface NdKpiRowData {
  name: string;
  mcqCopy: number;
  mcqGo: number;
  deToiKhan: number;
  th: number;
  aiCreate: number;
  copyGt: number;
  goGt: number;
  total: number;
  totalSalary: number;
}

interface NdSalaryTableProps {
  kpiData: NdKpiRowData[];
  sortField: NdSortField | null;
  sortOrder: "asc" | "desc";
  onSort: (field: NdSortField) => void;
  columnTotals: {
    mcqCopy: number;
    mcqGo: number;
    deToiKhan: number;
    th: number;
    aiCreate: number;
    copyGt: number;
    goGt: number;
    grandTotal: number;
    grandSalary: number;
  };
}

export const NdSalaryTable: React.FC<NdSalaryTableProps> = ({
  kpiData,
  sortField,
  sortOrder,
  onSort,
  columnTotals,
}) => {
  const renderSortIcon = (field: NdSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 inline-block ml-1 opacity-70" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600 inline-block ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600 inline-block ml-1" />
    );
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
      <table className="w-full text-left border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="bg-emerald-100/90 dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-200 font-black text-[11px] sm:text-xs uppercase border-b border-emerald-200/80 dark:border-emerald-800/80">
            <th
              onClick={() => onSort("name")}
              className="p-3 sm:p-3.5 pl-4 border-r border-emerald-200/80 dark:border-emerald-800/80 min-w-[130px] cursor-pointer select-none hover:bg-emerald-200/60 transition sticky left-0 z-10 bg-emerald-100 dark:bg-emerald-950 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
            >
              <div className="flex items-center justify-between">
                <span>Tên</span>
                {renderSortIcon("name")}
              </div>
            </th>
            <th
              onClick={() => onSort("mcqCopy")}
              className="p-3 sm:p-3.5 text-center border-r border-emerald-200/80 dark:border-emerald-800/80 min-w-[85px] cursor-pointer select-none hover:bg-emerald-200/60 transition"
            >
              <span>MCQ copy</span>
              {renderSortIcon("mcqCopy")}
            </th>
            <th
              onClick={() => onSort("mcqGo")}
              className="p-3 sm:p-3.5 text-center border-r border-emerald-200/80 dark:border-emerald-800/80 min-w-[120px] cursor-pointer select-none hover:bg-emerald-200/60 transition"
            >
              <span>MCQ gõ / AI khẩn</span>
              {renderSortIcon("mcqGo")}
            </th>
            <th
              onClick={() => onSort("deToiKhan")}
              className="p-3 sm:p-3.5 text-center border-r border-emerald-200/80 dark:border-emerald-800/80 min-w-[95px] cursor-pointer select-none hover:bg-emerald-200/60 transition"
            >
              <span>Đề tối khẩn</span>
              {renderSortIcon("deToiKhan")}
            </th>
            <th
              onClick={() => onSort("th")}
              className="p-3 sm:p-3.5 text-center border-r border-emerald-200/80 dark:border-emerald-800/80 min-w-[65px] cursor-pointer select-none hover:bg-emerald-200/60 transition"
            >
              <span>TH</span>
              {renderSortIcon("th")}
            </th>
            <th
              onClick={() => onSort("aiCreate")}
              className="p-3 sm:p-3.5 text-center border-r border-emerald-200/80 dark:border-emerald-800/80 min-w-[85px] cursor-pointer select-none hover:bg-emerald-200/60 transition"
            >
              <span>AI create</span>
              {renderSortIcon("aiCreate")}
            </th>
            <th
              onClick={() => onSort("copyGt")}
              className="p-3 sm:p-3.5 text-center border-r border-emerald-200/80 dark:border-emerald-800/80 min-w-[80px] cursor-pointer select-none hover:bg-emerald-200/60 transition"
            >
              <span>CopyGT</span>
              {renderSortIcon("copyGt")}
            </th>
            <th
              onClick={() => onSort("goGt")}
              className="p-3 sm:p-3.5 text-center border-r border-emerald-200/80 dark:border-emerald-800/80 min-w-[80px] cursor-pointer select-none hover:bg-emerald-200/60 transition"
            >
              <span>Gõ GT</span>
              {renderSortIcon("goGt")}
            </th>
            <th
              onClick={() => onSort("total")}
              className="p-3 sm:p-3.5 text-center font-black text-emerald-950 dark:text-emerald-100 bg-emerald-200/90 dark:bg-emerald-900/80 min-w-[95px] border-r border-emerald-300 dark:border-emerald-800 cursor-pointer select-none hover:bg-emerald-300 transition"
            >
              <span>TỔNG CÂU</span>
              {renderSortIcon("total")}
            </th>
            <th
              onClick={() => onSort("totalSalary")}
              className="p-3 sm:p-3.5 text-center font-black text-amber-950 dark:text-amber-100 bg-amber-200/90 dark:bg-amber-900/80 min-w-[140px] cursor-pointer select-none hover:bg-amber-300 transition"
            >
              <span>TỔNG TIỀN (VNĐ)</span>
              {renderSortIcon("totalSalary")}
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-bold text-slate-800 dark:text-slate-200">
          {kpiData.length === 0 ? (
            <tr>
              <td colSpan={10} className="p-8 text-center text-slate-400 font-medium">
                Không có dữ liệu trong tháng này
              </td>
            </tr>
          ) : (
            kpiData.map((row, idx) => {
              const isEven = idx % 2 === 0;
              const rowBg = isEven
                ? "bg-white dark:bg-slate-900"
                : "bg-slate-50/90 dark:bg-slate-800/50";

              return (
                <tr
                  key={row.name}
                  className={`${rowBg} hover:bg-emerald-50/50 dark:hover:bg-slate-800/80 transition`}
                >
                  <td className={`p-3 sm:p-3.5 pl-4 font-black text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700 sticky left-0 z-10 ${rowBg} shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}>
                    {row.name}
                  </td>
                  <td className="p-3 sm:p-3.5 text-center border-r border-slate-200 dark:border-slate-700">
                    {row.mcqCopy > 0 ? (
                      <span className="text-slate-900 dark:text-white font-extrabold">{row.mcqCopy}</span>
                    ) : (
                      ""
                    )}
                  </td>
                  <td className="p-3 sm:p-3.5 text-center border-r border-slate-200 dark:border-slate-700">
                    {row.mcqGo > 0 ? (
                      <span className="text-blue-700 dark:text-blue-400 font-extrabold">{row.mcqGo}</span>
                    ) : (
                      ""
                    )}
                  </td>
                  <td className="p-3 sm:p-3.5 text-center border-r border-slate-200 dark:border-slate-700">
                    {row.deToiKhan > 0 ? (
                      <span className="text-rose-700 dark:text-rose-400 font-extrabold">{row.deToiKhan}</span>
                    ) : (
                      ""
                    )}
                  </td>
                  <td className="p-3 sm:p-3.5 text-center border-r border-slate-200 dark:border-slate-700">
                    {row.th > 0 ? (
                      <span className="text-amber-700 dark:text-amber-400 font-extrabold">{row.th}</span>
                    ) : (
                      ""
                    )}
                  </td>
                  <td className="p-3 sm:p-3.5 text-center border-r border-slate-200 dark:border-slate-700">
                    {row.aiCreate > 0 ? (
                      <span className="text-purple-700 dark:text-purple-400 font-extrabold">{row.aiCreate}</span>
                    ) : (
                      ""
                    )}
                  </td>
                  <td className="p-3 sm:p-3.5 text-center border-r border-slate-200 dark:border-slate-700">
                    {row.copyGt > 0 ? (
                      <span className="text-indigo-700 dark:text-indigo-400 font-extrabold">{row.copyGt}</span>
                    ) : (
                      ""
                    )}
                  </td>
                  <td className="p-3 sm:p-3.5 text-center border-r border-slate-200 dark:border-slate-700">
                    {row.goGt > 0 ? (
                      <span className="text-teal-700 dark:text-teal-400 font-extrabold">{row.goGt}</span>
                    ) : (
                      ""
                    )}
                  </td>
                  <td className="p-3 sm:p-3.5 text-center font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-r border-slate-200 dark:border-slate-700">
                    {row.total > 0 ? row.total.toLocaleString("vi-VN") : ""}
                  </td>
                  <td className="p-3 sm:p-3.5 text-center font-black text-amber-900 dark:text-amber-200 bg-amber-50/80 dark:bg-amber-950/40 text-sm">
                    {row.totalSalary > 0 ? `${row.totalSalary.toLocaleString("vi-VN")} ₫` : "-"}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>

        {kpiData.length > 0 && (
          <tfoot>
            <tr className="bg-slate-100 dark:bg-slate-800 font-black text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
              <td className="p-3 sm:p-3.5 pl-4 uppercase tracking-wider text-xs border-r border-slate-200 dark:border-slate-700 sticky left-0 z-10 bg-slate-100 dark:bg-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                TỔNG CỘNG
              </td>
              <td className="p-3 sm:p-3.5 text-center border-r border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                {columnTotals.mcqCopy > 0 ? columnTotals.mcqCopy.toLocaleString("vi-VN") : "-"}
              </td>
              <td className="p-3 sm:p-3.5 text-center border-r border-slate-200 dark:border-slate-700 text-blue-700 dark:text-blue-400">
                {columnTotals.mcqGo > 0 ? columnTotals.mcqGo.toLocaleString("vi-VN") : "-"}
              </td>
              <td className="p-3 sm:p-3.5 text-center border-r border-slate-200 dark:border-slate-700 text-rose-700 dark:text-rose-400">
                {columnTotals.deToiKhan > 0 ? columnTotals.deToiKhan.toLocaleString("vi-VN") : "-"}
              </td>
              <td className="p-3 sm:p-3.5 text-center border-r border-slate-200 dark:border-slate-700 text-amber-700 dark:text-amber-400">
                {columnTotals.th > 0 ? columnTotals.th.toLocaleString("vi-VN") : "-"}
              </td>
              <td className="p-3 sm:p-3.5 text-center border-r border-slate-200 dark:border-slate-700 text-purple-700 dark:text-purple-400">
                {columnTotals.aiCreate > 0 ? columnTotals.aiCreate.toLocaleString("vi-VN") : "-"}
              </td>
              <td className="p-3 sm:p-3.5 text-center border-r border-slate-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-400">
                {columnTotals.copyGt > 0 ? columnTotals.copyGt.toLocaleString("vi-VN") : "-"}
              </td>
              <td className="p-3 sm:p-3.5 text-center border-r border-slate-200 dark:border-slate-700 text-teal-700 dark:text-teal-400">
                {columnTotals.goGt > 0 ? columnTotals.goGt.toLocaleString("vi-VN") : "-"}
              </td>
              <td className="p-3 sm:p-3.5 text-center font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/70 text-sm border-r border-slate-200 dark:border-slate-700">
                {columnTotals.grandTotal.toLocaleString("vi-VN")}
              </td>
              <td className="p-3 sm:p-3.5 text-center font-black text-amber-900 dark:text-amber-100 bg-amber-200/90 dark:bg-amber-900/80 text-base">
                {columnTotals.grandSalary > 0 ? `${columnTotals.grandSalary.toLocaleString("vi-VN")} ₫` : "-"}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};
