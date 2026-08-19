"use client";

/**
 * ============================================================================
 * FILE: components/TeamSummaryKpiCards.tsx
 * MỤC ĐÍCH: 4 Thẻ thống kê tổng quan tiến độ của Toàn Team trong tháng
 * CHỨC NĂNG:
 *   1. Thẻ 1: Tổng Đề Phân Công (đếm tổng số đề trong tháng)
 *   2. Thẻ 2: Tổng Số Câu Giao (tổng số câu của tất cả các đề)
 *   3. Thẻ 3: Số Câu Đã Check (tổng số câu các đề QC đã hoàn thành)
 *   4. Thẻ 4: Tiến Độ Toàn Team (Tỷ lệ % kèm thanh tiến độ trực quan)
 * ============================================================================
 */

import React from "react";
import { useApp } from "@/context/AppContext";
import { FileCheck, Hash, CheckCircle2, Percent } from "lucide-react";

export const TeamSummaryKpiCards: React.FC = () => {
  const { teamQuestionTotals, availableAssignmentMonths } = useApp();

  if (availableAssignmentMonths.length === 0) return null;

  const totalTasks = teamQuestionTotals?.totalTasks ?? 0;
  const totalAssigned = teamQuestionTotals?.totalAssignedQuestions ?? 0;
  const totalChecked = teamQuestionTotals?.totalCheckedQuestions ?? 0;
  const completionRate = teamQuestionTotals?.completionRate ?? 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Thẻ 1: Tổng Đề Phân Công */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            Tổng Đề Phân Công
          </p>
          <FileCheck className="w-4 h-4 text-slate-500" />
        </div>
        <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
          {totalTasks} <span className="text-xs font-bold text-slate-500">đề</span>
        </p>
      </div>

      {/* Thẻ 2: Tổng Số Câu Giao */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Tổng Số Câu Giao
          </p>
          <Hash className="w-4 h-4 text-blue-500" />
        </div>
        <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 mt-2">
          {totalAssigned.toLocaleString("vi-VN")}{" "}
          <span className="text-xs font-bold text-blue-400">câu</span>
        </p>
      </div>

      {/* Thẻ 3: Số Câu Đã Check */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Số Câu Đã Check
          </p>
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        </div>
        <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
          {totalChecked.toLocaleString("vi-VN")}{" "}
          <span className="text-xs font-bold text-emerald-400">câu</span>
        </p>
      </div>

      {/* Thẻ 4: Tiến Độ Toàn Team */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            Tiến Độ Toàn Team
          </p>
          <Percent className="w-4 h-4 text-purple-500" />
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
            {completionRate}%
          </p>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
          <div
            className="bg-purple-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, completionRate)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
