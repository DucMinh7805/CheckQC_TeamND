"use client";

/**
 * ============================================================================
 * FILE: components/QcSalaryModal.tsx
 * MỤC ĐÍCH: Bảng tính lương & Thống kê lỗi của Nhân sự QC
 * ============================================================================
 */

import React, { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { User, MonthlyAssignmentItem, TaskItem, QcSalaryStatItem } from "@/types";
import {
  cleanStr,
  getVal,
  normalizeMonthStr,
  parseQcErrorCount,
  exportQcSalaryStatsToCSV,
  isTaskInQcSalaryMonth,
} from "@/lib/helpers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calculator, Calendar, RefreshCw, FileSpreadsheet, SlidersHorizontal } from "lucide-react";
import { QcSalaryRatesCard } from "@/components/salary/QcSalaryRatesCard";
import { QcSalaryTable, QcSortField } from "@/components/salary/QcSalaryTable";

interface QcSalaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QcSalaryModal: React.FC<QcSalaryModalProps> = ({
  open,
  onOpenChange,
}) => {
  const {
    monthlyAssignments,
    listUsers,
    appData,
    loadData,
    isLoading,
    availableAssignmentMonths,
    selectedAssignmentMonth,
  } = useApp();

  const [selectedMonth, setSelectedMonth] = useState<string>(
    selectedAssignmentMonth || (availableAssignmentMonths[0] || "ALL")
  );
  const [sortField, setSortField] = useState<QcSortField | null>("totalSalary");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Đơn giá tính lương QC (Đơn vị: VNĐ)
  const [ratePerQuestion, setRatePerQuestion] = useState<number>(0);
  const [ratePerError, setRatePerError] = useState<number>(0);
  const [isEditingRates, setIsEditingRates] = useState<boolean>(false);

  // Khởi tạo đơn giá từ localStorage khi mở
  useEffect(() => {
    try {
      const savedQRate = localStorage.getItem("qc_salary_rate_question");
      const savedERate = localStorage.getItem("qc_salary_rate_error");
      if (savedQRate !== null) setRatePerQuestion(Number(savedQRate) || 0);
      if (savedERate !== null) setRatePerError(Number(savedERate) || 0);
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (selectedAssignmentMonth && availableAssignmentMonths.includes(selectedAssignmentMonth)) {
      setSelectedMonth(selectedAssignmentMonth);
    }
  }, [selectedAssignmentMonth, availableAssignmentMonths]);

  const handleSaveRates = () => {
    try {
      localStorage.setItem("qc_salary_rate_question", String(ratePerQuestion));
      localStorage.setItem("qc_salary_rate_error", String(ratePerError));
    } catch (e) {}
    setIsEditingRates(false);
  };

  const handleSort = (field: QcSortField) => {
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

  // Danh sách các tháng có sẵn (kết hợp Sheet ND và các tháng phụ trong Sheet QC)
  const allAvailableSalaryMonths = useMemo(() => {
    const monthsSet = new Set<string>(availableAssignmentMonths);
    appData.forEach((item) => {
      const m = cleanStr(getVal(item, "ID/ tháng") || getVal(item, "ID/tháng"));
      if (m && !monthsSet.has(m) && !monthsSet.has(`Tháng ${m}`)) {
        monthsSet.add(m.startsWith("Tháng") ? m : `Tháng ${m}`);
      }
    });
    return Array.from(monthsSet);
  }, [availableAssignmentMonths, appData]);

  // Tính toán bảng lương & lỗi QC (hỗ trợ đề tồn T8 -> T9, 8.1/2026, Note "Đề tồn T8")
  const salaryData = useMemo(() => {
    const qcUsers = listUsers.filter((u: User) => {
      const r = cleanStr(u.role).toUpperCase();
      return r === "QC" || r === "ADMIN";
    });

    const dataMap: Record<string, QcSalaryStatItem & { totalSalary: number }> = {};

    qcUsers.forEach((u) => {
      const key = cleanStr(u.name).toLowerCase();
      dataMap[key] = {
        qcName: cleanStr(u.name),
        role: u.role,
        doneTasksCount: 0,
        doneQuestionsCount: 0,
        totalErrorsChecked: 0,
        totalSalary: 0,
        tasksList: [],
      };
    });

    // 1. Quét tất cả các đề trong monthlyAssignments để xử lý linh hoạt đề tồn giữa các tháng
    Object.entries(monthlyAssignments || {}).forEach(([tabMonthName, tasksArr]) => {
      if (!Array.isArray(tasksArr)) return;

      tasksArr.forEach((t: MonthlyAssignmentItem) => {
        const qcRaw = cleanStr(t.qc_name);
        if (!qcRaw) return;
        const key = qcRaw.toLowerCase();

        // Kiểm tra đề có thuộc kỳ tính lương QC được chọn không (xử lý đề tồn T8, T9...)
        const isMatch = isTaskInQcSalaryMonth(
          t.month || tabMonthName,
          t.note,
          t.leader_check,
          selectedMonth
        );

        if (!isMatch) return;

        if (!dataMap[key]) {
          dataMap[key] = {
            qcName: qcRaw,
            role: "QC",
            doneTasksCount: 0,
            doneQuestionsCount: 0,
            totalErrorsChecked: 0,
            totalSalary: 0,
            tasksList: [],
          };
        }

        // Chỉ tính câu khi QC đã Done
        if (t.qc_done) {
          dataMap[key].doneTasksCount += 1;
          dataMap[key].doneQuestionsCount += (t.so_cau || 0);
          dataMap[key].tasksList.push(t);
        }
      });
    });

    // 2. Quét số lỗi từ Sheet QC-2026 (appData)
    appData.forEach((task: TaskItem) => {
      const qcRaw = cleanStr(getVal(task, "QC"));
      if (!qcRaw) return;
      const key = qcRaw.toLowerCase();

      const itemMonth = getVal(task, "ID/ tháng") || getVal(task, "ID/tháng");
      const itemNote = getVal(task, "Note");

      const isMatch = isTaskInQcSalaryMonth(itemMonth, itemNote, "", selectedMonth);
      if (!isMatch) return;

      if (!dataMap[key]) {
        dataMap[key] = {
          qcName: qcRaw,
          role: "QC",
          doneTasksCount: 0,
          doneQuestionsCount: 0,
          totalErrorsChecked: 0,
          totalSalary: 0,
          tasksList: [],
        };
      }

      const e1 = parseQcErrorCount(getVal(task, "Lỗi lần 1"));
      const e2 = parseQcErrorCount(getVal(task, "Lỗi lần 2"));
      const e3 = parseQcErrorCount(getVal(task, "Lỗi lần 3"));
      dataMap[key].totalErrorsChecked += (e1 + e2 + e3);
    });

    // 3. Tính Tổng tiền
    Object.values(dataMap).forEach((item) => {
      item.totalSalary =
        item.doneQuestionsCount * (ratePerQuestion || 0) +
        item.totalErrorsChecked * (ratePerError || 0);
    });

    let result = qcUsers.map((u) => dataMap[cleanStr(u.name).toLowerCase()]).filter(Boolean);
    Object.keys(dataMap).forEach((k) => {
      if (!qcUsers.some((u) => cleanStr(u.name).toLowerCase() === k)) {
        result.push(dataMap[k]);
      }
    });

    if (sortField) {
      result.sort((a, b) => {
        if (sortField === "qcName") {
          return sortOrder === "asc"
            ? a.qcName.localeCompare(b.qcName, "vi")
            : b.qcName.localeCompare(a.qcName, "vi");
        }
        const valA = a[sortField] || 0;
        const valB = b[sortField] || 0;
        return sortOrder === "asc" ? valA - valB : valB - valA;
      });
    }

    return result;
  }, [monthlyAssignments, listUsers, appData, selectedMonth, ratePerQuestion, ratePerError, sortField, sortOrder]);

  const totals = useMemo(() => {
    let doneTasks = 0;
    let doneQuestions = 0;
    let totalErrors = 0;
    let grandSalary = 0;

    salaryData.forEach((row) => {
      doneTasks += row.doneTasksCount;
      doneQuestions += row.doneQuestionsCount;
      totalErrors += row.totalErrorsChecked;
      grandSalary += row.totalSalary;
    });

    return { doneTasks, doneQuestions, totalErrors, grandSalary };
  }, [salaryData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadData();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1rem)] sm:w-full max-w-5xl max-h-[92vh] sm:max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-50 dark:bg-slate-900 rounded-3xl border-slate-200 dark:border-slate-800 shadow-2xl">
        
        {/* Header Modal */}
        <DialogHeader className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 rounded-2xl flex-shrink-0">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                <span>Bảng Tính Lương QC</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-extrabold">
                  {selectedMonth === "ALL" ? "Tất cả các tháng" : selectedMonth}
                </span>
              </DialogTitle>
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 mt-0.5">
                Tính lương QC theo Số câu Done và Số lỗi đã check (Hỗ trợ chuyển đề tồn)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              size="sm"
              className="rounded-xl px-4 font-bold text-xs cursor-pointer"
            >
              Đóng
            </Button>
          </div>
        </DialogHeader>

        {/* Nội dung bên trong Modal */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Thanh công cụ: Bộ lọc tháng, Nút Đơn giá, Nút Đồng bộ, Nút Xuất CSV */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-800/90 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                Tháng tính lương:
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
              <Button
                variant={isEditingRates ? "default" : "outline"}
                size="sm"
                onClick={() => setIsEditingRates(!isEditingRates)}
                className={`rounded-xl font-bold text-xs h-8 px-3 flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all ${
                  isEditingRates
                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                    : "border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/40 hover:bg-amber-100"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{isEditingRates ? "Đóng cài đặt giá" : "Cài đặt đơn giá lương"}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={isLoading || isRefreshing}
                onClick={handleRefresh}
                className="rounded-xl border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100 font-bold text-xs h-8 px-3 flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading || isRefreshing ? "animate-spin text-blue-600" : ""}`} />
                <span>{isLoading || isRefreshing ? "Đang đồng bộ..." : "Đồng bộ từ Sheet"}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => exportQcSalaryStatsToCSV(salaryData, totals, selectedMonth)}
                disabled={salaryData.length === 0}
                className="rounded-xl border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 font-bold text-xs h-8 px-3 flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Xuất CSV</span>
              </Button>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer hover:border-blue-500 transition shadow-2xs"
              >
                <option value="ALL">Tất cả các tháng</option>
                {allAvailableSalaryMonths.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Khung Thẻ Tóm Tắt & Nhập Đơn Giá Lương QC */}
          <QcSalaryRatesCard
            totalQcCount={salaryData.length}
            totalDoneQuestions={totals.doneQuestions}
            totalErrors={totals.totalErrors}
            ratePerQuestion={ratePerQuestion}
            ratePerError={ratePerError}
            isEditingRates={isEditingRates}
            onRateQuestionChange={setRatePerQuestion}
            onRateErrorChange={setRatePerError}
            onSaveRates={handleSaveRates}
          />

          {/* Bảng Dữ Liệu Tính Lương & Lỗi QC */}
          <QcSalaryTable
            salaryData={salaryData}
            totals={totals}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
