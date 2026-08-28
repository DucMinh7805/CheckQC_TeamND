"use client";

/**
 * ============================================================================
 * FILE: components/KpiTable.tsx
 * MỤC ĐÍCH: Bảng tính lương & Năng suất câu của Nhân sự Nội Dung theo loại đề
 * ============================================================================
 */

import React, { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { User, MonthlyAssignmentItem } from "@/types";
import { cleanStr, normalizeMonthStr } from "@/lib/helpers";
import {
  Calendar,
  MoveHorizontal,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NdSalaryRatesCard, NdRates } from "./salary/NdSalaryRatesCard";
import { NdSalaryTable, NdSortField, NdKpiRowData } from "./salary/NdSalaryTable";

const DEFAULT_RATES: NdRates = {
  mcqCopy: 0,
  mcqGo: 0,
  deToiKhan: 0,
  th: 0,
  aiCreate: 0,
  copyGt: 0,
  goGt: 0,
};

export const KpiTable: React.FC = () => {
  const { monthlyAssignments, listUsers, loadData, isLoading, appConfig, saveConfigToServer } = useApp();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const availableMonths = useMemo(() => {
    return Object.keys(monthlyAssignments || {});
  }, [monthlyAssignments]);

  const [selectedKpiMonth, setSelectedKpiMonth] = useState<string>(
    availableMonths[0] || "ALL"
  );

  useEffect(() => {
    if (selectedKpiMonth === "ALL" && availableMonths.length > 0) {
      setSelectedKpiMonth(availableMonths[0]);
    }
  }, [availableMonths]);

  const [sortField, setSortField] = useState<NdSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Cấu hình đơn giá lương cho 7 loại đề Nội Dung (Đơn vị: VNĐ/câu)
  const [rates, setRates] = useState<NdRates>(DEFAULT_RATES);
  const [isEditingRates, setIsEditingRates] = useState<boolean>(false);

  // Đọc đơn giá từ Server (Google Sheet) hoặc localStorage khi khởi động
  useEffect(() => {
    if (appConfig && appConfig.nd_salary_rates) {
      setRates(appConfig.nd_salary_rates);
    } else {
      try {
        const saved = localStorage.getItem("nd_salary_rates");
        if (saved) {
          setRates(JSON.parse(saved));
        }
      } catch (e) {}
    }
  }, [appConfig]);

  const handleSaveRates = async () => {
    try {
      localStorage.setItem("nd_salary_rates", JSON.stringify(rates));
      if (saveConfigToServer) {
        await saveConfigToServer("nd_salary_rates", rates);
      }
    } catch (e) {}
    setIsEditingRates(false);
  };

  const handleRateChange = (field: keyof NdRates, val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setRates((prev) => ({ ...prev, [field]: num }));
  };

  const handleSort = (field: NdSortField) => {
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

  const kpiData: NdKpiRowData[] = useMemo(() => {
    const dynamicWorkersOrder = listUsers.map((u: User) => cleanStr(u.name));

    let tasksList: MonthlyAssignmentItem[] = [];
    if (!monthlyAssignments || Object.keys(monthlyAssignments).length === 0) {
      tasksList = [];
    } else if (selectedKpiMonth === "ALL") {
      Object.values(monthlyAssignments).forEach((arr) => {
        if (Array.isArray(arr)) tasksList.push(...arr);
      });
    } else {
      const targetNorm = normalizeMonthStr(selectedKpiMonth);
      if (monthlyAssignments[selectedKpiMonth]) {
        tasksList = monthlyAssignments[selectedKpiMonth];
      } else {
        const foundKey = Object.keys(monthlyAssignments).find(
          (k) => normalizeMonthStr(k) === targetNorm
        );
        tasksList = foundKey ? monthlyAssignments[foundKey] : [];
      }
    }

    const dataMap: Record<string, NdKpiRowData> = {};
    dynamicWorkersOrder.forEach((worker) => {
      dataMap[worker.toLowerCase()] = {
        name: worker,
        mcqCopy: 0,
        mcqGo: 0,
        deToiKhan: 0,
        th: 0,
        aiCreate: 0,
        copyGt: 0,
        goGt: 0,
        total: 0,
        totalSalary: 0,
      };
    });

    tasksList.forEach((task: MonthlyAssignmentItem) => {
      const workerNameRaw = task.worker_name || "";
      const workerName = cleanStr(workerNameRaw).toLowerCase();
      if (!workerName) return;

      const note = cleanStr(task.note || "").toLowerCase();
      const leaderCheck = cleanStr(task.leader_check || "").toLowerCase();
      const title = cleanStr(task.task_title || "").toLowerCase();

      const soCau =
        typeof task.so_cau === "number"
          ? task.so_cau
          : parseInt(String(task.so_cau), 10) || 0;

      if (!dataMap[workerName]) {
        dataMap[workerName] = {
          name: workerNameRaw,
          mcqCopy: 0,
          mcqGo: 0,
          deToiKhan: 0,
          th: 0,
          aiCreate: 0,
          copyGt: 0,
          goGt: 0,
          total: 0,
          totalSalary: 0,
        };
      }

      const isUrgent =
        /t[ốổo]i\s*kh[ẩa]n/i.test(leaderCheck) ||
        /t[ốổo]i\s*kh[ẩa]n/i.test(note);

      const isAiKhan =
        /ai\s*kh[ẩa]n/i.test(note) ||
        /ai\s*kh[ẩa]n/i.test(leaderCheck);

      const isCopy =
        leaderCheck.includes("copy") ||
        note.includes("copy") ||
        title.includes("copy");

      const isThucHanh =
        title.includes("thực hành") ||
        title.includes("thuc hanh") ||
        leaderCheck.includes("thực hành") ||
        note.includes("thực hành");

      const isAi =
        leaderCheck.includes("ai") ||
        note.includes("ai") ||
        title.includes("ai");

      const isGiaiThich =
        leaderCheck.includes("giải thích") ||
        leaderCheck.includes("gt") ||
        note.includes("giải thích") ||
        note.includes("gt") ||
        title.includes("giải thích") ||
        title.includes("gt");

      if (leaderCheck.includes("copy")) {
        dataMap[workerName].mcqCopy += soCau;
      } else if (isAiKhan) {
        dataMap[workerName].mcqGo += soCau;
      } else if (isUrgent) {
        dataMap[workerName].deToiKhan += soCau;
      } else if (isGiaiThich && isCopy) {
        dataMap[workerName].copyGt += soCau;
      } else if (isGiaiThich && !isCopy) {
        dataMap[workerName].goGt += soCau;
      } else if (isThucHanh) {
        dataMap[workerName].th += soCau;
      } else if (isCopy) {
        dataMap[workerName].mcqCopy += soCau;
      } else if (isAi) {
        dataMap[workerName].aiCreate += soCau;
      } else {
        dataMap[workerName].mcqGo += soCau;
      }
    });

    const result = Object.values(dataMap).map((row) => {
      const total =
        row.mcqCopy +
        row.mcqGo +
        row.deToiKhan +
        row.th +
        row.aiCreate +
        row.copyGt +
        row.goGt;

      const totalSalary =
        row.mcqCopy * rates.mcqCopy +
        row.mcqGo * rates.mcqGo +
        row.deToiKhan * rates.deToiKhan +
        row.th * rates.th +
        row.aiCreate * rates.aiCreate +
        row.copyGt * rates.copyGt +
        row.goGt * rates.goGt;

      return {
        ...row,
        total,
        totalSalary,
      };
    });

    if (!sortField) return result;

    return [...result].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === "string") {
        return sortOrder === "asc"
          ? (aVal as string).localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      }

      return sortOrder === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [monthlyAssignments, selectedKpiMonth, listUsers, rates, sortField, sortOrder]);

  const columnTotals = useMemo(() => {
    return kpiData.reduce(
      (acc, curr) => ({
        mcqCopy: acc.mcqCopy + curr.mcqCopy,
        mcqGo: acc.mcqGo + curr.mcqGo,
        deToiKhan: acc.deToiKhan + curr.deToiKhan,
        th: acc.th + curr.th,
        aiCreate: acc.aiCreate + curr.aiCreate,
        copyGt: acc.copyGt + curr.copyGt,
        goGt: acc.goGt + curr.goGt,
        grandTotal: acc.grandTotal + curr.total,
        grandSalary: acc.grandSalary + curr.totalSalary,
      }),
      {
        mcqCopy: 0,
        mcqGo: 0,
        deToiKhan: 0,
        th: 0,
        aiCreate: 0,
        copyGt: 0,
        goGt: 0,
        grandTotal: 0,
        grandSalary: 0,
      }
    );
  }, [kpiData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
      {/* Header & Bộ lọc tháng */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-xs">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Bảng Tính Lương & Năng Suất Nội Dung</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-extrabold">
                {selectedKpiMonth === "ALL" ? "Tất cả các tháng" : selectedKpiMonth}
              </span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 font-bold">
              Phân loại 7 định dạng đề bài & Tự động nhân đơn giá lương
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {availableMonths.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedKpiMonth("ALL")}
                className={`px-3 py-1 text-xs font-black rounded-lg transition ${
                  selectedKpiMonth === "ALL"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                }`}
              >
                Tất cả
              </button>
              {availableMonths.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedKpiMonth(m)}
                  className={`px-3 py-1 text-xs font-black rounded-lg transition ${
                    selectedKpiMonth === m
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="rounded-xl border-slate-200 dark:border-slate-700 h-8 px-2.5 text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* Thẻ cấu hình đơn giá lương */}
      <NdSalaryRatesCard
        rates={rates}
        isEditingRates={isEditingRates}
        setIsEditingRates={setIsEditingRates}
        onRateChange={handleRateChange}
        onSaveRates={handleSaveRates}
      />

      {/* Bảng dữ liệu chính */}
      <NdSalaryTable
        kpiData={kpiData}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        columnTotals={columnTotals}
      />

      {/* Ghi chú chân trang */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1">
        <span className="flex items-center gap-1">
          <MoveHorizontal className="w-3.5 h-3.5" />
          <span>Vuốt ngang để xem toàn bộ 7 cột phân loại đề</span>
        </span>
        <span>Công thức: Tổng tiền = ∑(Số câu × Đơn giá từng loại)</span>
      </div>
    </div>
  );
};
