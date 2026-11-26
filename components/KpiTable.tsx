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
import { classifyNdWork, cleanStr, normalizeMonthStr } from "@/lib/helpers";
import {
  Calendar,
  MoveHorizontal,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
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
  const { monthlyAssignments, listUsers, loadData, isLoading, appConfig, saveConfigToServer, selectedMonth } = useApp();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const availableMonths = useMemo(() => {
    return Object.keys(monthlyAssignments || {});
  }, [monthlyAssignments]);

  // Mỗi lần mở bảng, ưu tiên tháng đang lọc ở dashboard. Người dùng vẫn có thể
  // đổi tháng ngay trong bảng mà không bị đồng bộ nền tự động đổi lại.
  const [selectedKpiMonth, setSelectedKpiMonth] = useState<string>(
    selectedMonth || availableMonths[0] || "ALL"
  );

  // KpiTable luôn được mount cùng dashboard. Khi dữ liệu/tháng dashboard vừa
  // tải xong, phải nhận tháng đó thay vì giữ lại tháng mặc định đầu tiên.
  useEffect(() => {
    if (selectedMonth) setSelectedKpiMonth(selectedMonth);
  }, [selectedMonth]);

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

      const category = classifyNdWork({
        note: task.note,
        leaderCheck: task.leader_check,
      });
      dataMap[workerName][category] += soCau;
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
              Phân loại 6 định dạng đề bài & Tự động nhân đơn giá lương
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {availableMonths.length > 0 && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-0.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ml-2.5 flex-shrink-0" />
              <Select
                value={selectedKpiMonth}
                onValueChange={(val) => val && setSelectedKpiMonth(val)}
              >
                <SelectTrigger className="border-none bg-transparent shadow-none font-black text-xs sm:text-sm h-8 min-w-[145px] focus:ring-0">
                  <span className="truncate">
                    {selectedKpiMonth === "ALL" ? "Tất cả các tháng" : selectedKpiMonth}
                  </span>
                </SelectTrigger>
                <SelectContent className="max-h-60 rounded-2xl border-slate-200 dark:border-slate-800 shadow-xl overflow-y-auto">
                  <SelectItem value="ALL" className="font-black text-xs sm:text-sm text-emerald-700 dark:text-emerald-400">
                    Tất cả các tháng
                  </SelectItem>
                  {availableMonths.map((m) => (
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
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="rounded-2xl border-slate-200 dark:border-slate-700 h-8 px-3 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
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
          <span>Vuốt ngang để xem toàn bộ 6 cột phân loại đề</span>
        </span>
        <span>Công thức: Tổng tiền = ∑(Số câu × Đơn giá từng loại)</span>
      </div>
    </div>
  );
};
