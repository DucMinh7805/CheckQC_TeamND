"use client";

/**
 * ============================================================================
 * FILE: components/TaskBoard.tsx
 * MỤC ĐÍCH: Bảng hiển thị danh sách các thẻ nhiệm vụ đề bài (Task Cards)
 * CHỨC NĂNG:
 *   1. Bộ lọc 5 Tab trạng thái: Tất Cả, Đang Lỗi, QC Sai, Chờ Duyệt, Đã Hoàn Thành
 *   2. Ô tìm kiếm nhanh theo Tên đề bài hoặc Người làm
 *   3. Nút xuất dữ liệu đề bài ra file Excel CSV
 *   4. Render lưới thẻ nhiệm vụ (TaskCard) tương ứng với vai trò người dùng
 * ============================================================================
 */

import React, { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { TabFilterType, TaskItem } from "@/types";
import { TaskCard } from "./TaskCard";
import { PersonalKpiBanner } from "./PersonalKpiBanner";
import { Loader2, FolderCheck, Search, X, FileSpreadsheet, PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getVal, exportTasksToCSV, cleanStr } from "@/lib/helpers";

interface TaskBoardProps {
  onOpenDetails: (task: TaskItem) => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ onOpenDetails }) => {
  const {
    currentUser,
    impersonatedRole,
    currentTab,
    setCurrentTab,
    filteredTasks,
    tabCounts,
    isLoading,
    selectedMonth,
    setIsCreateModalOpen,
  } = useApp();
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [visibleCount, setVisibleCount] = useState<number>(30);

  const effectiveRole = impersonatedRole || currentUser?.role;
  const canCreateTask = effectiveRole === "QC" || effectiveRole === "ADMIN";

  // Reset số lượng đề hiển thị khi đổi tab, tháng hoặc từ khóa tìm kiếm
  useEffect(() => {
    setVisibleCount(30);
  }, [currentTab, selectedMonth, searchQuery]);

  const tabs: {
    id: TabFilterType;
    label: string;
    countKey: keyof typeof tabCounts;
    dotColor?: string;
  }[] = [
    { id: "ALL", label: "Tất cả đề", countKey: "ALL" },
    { id: "PENDING", label: "Chờ duyệt", countKey: "PENDING" },
    { id: "ERROR", label: "Đang lỗi", countKey: "ERROR", dotColor: "bg-rose-500" },
    { id: "WRONG", label: "QC Sai", countKey: "WRONG", dotColor: "bg-amber-500" },
    { id: "PASS", label: "Đã Pass", countKey: "PASS", dotColor: "bg-emerald-500" },
  ];

  // Tìm kiếm theo tên đề bài, người làm ND, hoặc QC
  const displayTasks = useMemo(() => {
    if (!searchQuery.trim()) return filteredTasks;
    const query = searchQuery.trim().toLowerCase();
    return filteredTasks.filter((t) => {
      const title = cleanStr(getVal(t, "Tên đề")).toLowerCase();
      const doer = cleanStr(getVal(t, "Ai làm")).toLowerCase();
      const qc = cleanStr(getVal(t, "QC")).toLowerCase();
      return (
        title.includes(query) || doer.includes(query) || qc.includes(query)
      );
    });
  }, [filteredTasks, searchQuery]);

  const visibleTasks = useMemo(() => {
    return displayTasks.slice(0, visibleCount);
  }, [displayTasks, visibleCount]);

  return (
    <div className="flex-1 flex flex-col gap-4 min-w-0 w-full animate-in fade-in duration-300">
      <h2 className="sr-only">Danh sách đề bài và bộ lọc trạng thái</h2>

      {/* Thẻ Thống Kê Số Câu Cá Nhân (ND & QC) */}
      <PersonalKpiBanner />

      {/* Top Bar: Tabs, Quick Search & Nút Nhập Liệu Đề Mới */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 transition-all">
        {/* Tab Filters - Vuốt ngang mượt mà trên mobile, ẩn triệt để thanh cuộn */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none no-scrollbar pb-1 xl:pb-0 flex-nowrap flex-1 min-w-0" role="tablist" aria-label="Bộ lọc trạng thái đề bài">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            const count = tabCounts[tab.countKey] || 0;

            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-label={`Lọc ${tab.label}, hiện có ${count} đề`}
                onClick={() => setCurrentTab(tab.id)}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-black rounded-xl sm:rounded-2xl whitespace-nowrap transition-all flex items-center gap-1.5 sm:gap-2 flex-shrink-0 active:scale-[0.98] ${
                  isActive
                    ? "bg-slate-900 dark:bg-blue-600 text-white shadow-md shadow-slate-900/10"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                {tab.dotColor && (
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isActive ? "bg-white" : tab.dotColor
                    }`}
                  />
                )}
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full font-black flex-shrink-0 ${
                    isActive
                      ? "bg-slate-800 dark:bg-blue-700 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Thanh Tìm Kiếm & Nút Hành Động */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative flex-1 sm:w-60 lg:w-72 min-w-0">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Tìm tên đề, người làm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Tìm kiếm theo tên đề bài hoặc người làm"
              className="pl-9 sm:pl-10 pr-8 sm:pr-9 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white h-9 sm:h-10 placeholder:text-slate-500 dark:placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Xóa từ khóa tìm kiếm"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => exportTasksToCSV(displayTasks, selectedMonth)}
            title="Xuất danh sách ra file Excel (CSV)"
            aria-label="Xuất danh sách ra file Excel CSV"
            className="rounded-xl sm:rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 hover:scale-105 active:scale-95 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </Button>

          {/* Nút Nhập Liệu Đề Mới (dành riêng cho QC & Admin trên Desktop) */}
          {canCreateTask && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              aria-label="Nhập đề bài mới"
              className="hidden sm:flex bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-3.5 sm:px-4 py-2 sm:py-2.5 font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 items-center gap-1.5 sm:gap-2 transition-all flex-shrink-0 h-9 sm:h-10"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nhập Đề</span>
            </Button>
          )}
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 flex flex-col gap-3 min-h-[420px]">
        {isLoading ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-16 text-center text-slate-500 flex flex-col items-center justify-center border border-slate-200 dark:border-slate-800 shadow-xs">
            <Loader2 className="w-9 h-9 animate-spin mb-3 text-slate-900 dark:text-blue-500" />
            <span className="font-extrabold text-sm sm:text-base tracking-wide text-slate-800 dark:text-slate-200">
              Đang đồng bộ dữ liệu từ Google Sheets...
            </span>
          </div>
        ) : displayTasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-16 text-center text-slate-400 font-bold flex flex-col items-center justify-center border border-slate-200 dark:border-slate-800 shadow-xs animate-in fade-in">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-3 text-slate-300 dark:text-slate-600">
              <FolderCheck className="w-8 h-8" />
            </div>
            <p className="text-sm sm:text-base font-extrabold text-slate-600 dark:text-slate-400">
              {searchQuery
                ? "Không tìm thấy đề bài nào khớp với từ khóa tìm kiếm"
                : "Không có đề bài nào trong danh mục này"}
            </p>
            {canCreateTask && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 rounded-xl font-bold text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                <span>Nhập đề mới ngay</span>
              </Button>
            )}
          </div>
        ) : (
          <>
            {visibleTasks.map((task) => (
              <TaskCard
                key={task.row_index}
                task={task}
                onOpenDetails={onOpenDetails}
              />
            ))}

            {/* Nút Xem Thêm Đề Bài Nếu Số Đề > 30 */}
            {displayTasks.length > visibleCount && (
              <div className="pt-3 pb-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setVisibleCount((prev) => prev + 30)}
                  className="rounded-2xl font-extrabold text-xs sm:text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:bg-blue-50 dark:hover:bg-blue-950 text-blue-700 dark:text-blue-300 px-6 py-2.5 transition-all hover:scale-105"
                >
                  <span>Xem thêm {Math.min(30, displayTasks.length - visibleCount)} đề bài (Còn {displayTasks.length - visibleCount} đề)</span>
                </Button>
                <button
                  type="button"
                  onClick={() => setVisibleCount(displayTasks.length)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white underline transition"
                >
                  Hiển thị tất cả ({displayTasks.length} đề)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
