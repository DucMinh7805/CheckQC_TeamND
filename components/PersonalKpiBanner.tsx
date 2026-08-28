"use client";

/**
 * ============================================================================
 * FILE: components/PersonalKpiBanner.tsx
 * MỤC ĐÍCH: Thẻ thống kê số câu cá nhân của Nhân sự ND & QC (Không hiện tiền lương)
 * VỊ TRÍ: Đặt ngay trên dòng phân loại đề của trang chủ
 * ============================================================================
 */

import React, { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { cleanStr, getVal, normalizeMonthStr, isTaskInQcSalaryMonth, parseQcErrorCount, isQcDone } from "@/lib/helpers";
import { MonthlyAssignmentItem, TaskItem } from "@/types";
import {
  FileText,
  Info,
  UserCheck,
} from "lucide-react";

export const PersonalKpiBanner: React.FC = () => {
  const {
    currentUser,
    monthlyAssignments,
    appData,
    selectedMonth,
  } = useApp();

  const currentUserName = cleanStr(currentUser?.name).toLowerCase();
  const userRole = cleanStr(currentUser?.role).toUpperCase();

  // 1. Tính toán thống kê Nội Dung của cá nhân người dùng trong tháng
  const ndStats = useMemo(() => {
    if (!currentUser) return { taskCount: 0, mcqCopy: 0, mcqGo: 0, deToiKhan: 0, th: 0, aiCreate: 0, copyGt: 0, goGt: 0, totalQuestions: 0 };
    
    let tasksList: MonthlyAssignmentItem[] = [];
    if (!monthlyAssignments || Object.keys(monthlyAssignments).length === 0) {
      tasksList = [];
    } else if (selectedMonth === "ALL") {
      Object.values(monthlyAssignments).forEach((arr) => {
        if (Array.isArray(arr)) tasksList.push(...arr);
      });
    } else {
      // Đối với ND: Tháng nào tính trọn vẹn ở tab tháng đó (Không có đề tồn)
      const targetNorm = normalizeMonthStr(selectedMonth);
      Object.entries(monthlyAssignments).forEach(([tabName, arr]) => {
        if (Array.isArray(arr) && normalizeMonthStr(tabName) === targetNorm) {
          tasksList.push(...arr);
        }
      });
    }

    const myNdTasks = tasksList.filter(
      (t) => cleanStr(t.worker_name).toLowerCase() === currentUserName
    );

    let mcqCopy = 0;
    let mcqGo = 0;
    let deToiKhan = 0;
    let th = 0;
    let aiCreate = 0;
    let copyGt = 0;
    let goGt = 0;

    myNdTasks.forEach((task) => {
      const note = cleanStr(task.note || "").toLowerCase();
      const leaderCheck = cleanStr(task.leader_check || "").toLowerCase();
      const title = cleanStr(task.task_title || "").toLowerCase();

      const soCau =
        typeof task.so_cau === "number"
          ? task.so_cau
          : parseInt(String(task.so_cau), 10) || 0;

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
        mcqCopy += soCau;
      } else if (isAiKhan) {
        mcqGo += soCau;
      } else if (isUrgent) {
        deToiKhan += soCau;
      } else if (isGiaiThich && isCopy) {
        copyGt += soCau;
      } else if (isGiaiThich && !isCopy) {
        goGt += soCau;
      } else if (isThucHanh) {
        th += soCau;
      } else if (isCopy) {
        mcqCopy += soCau;
      } else if (isAi) {
        aiCreate += soCau;
      } else {
        mcqGo += soCau;
      }
    });

    const totalQuestions = mcqCopy + mcqGo + deToiKhan + th + aiCreate + copyGt + goGt;

    return {
      taskCount: myNdTasks.length,
      mcqCopy,
      mcqGo,
      deToiKhan,
      th,
      aiCreate,
      copyGt,
      goGt,
      totalQuestions,
    };
  }, [monthlyAssignments, selectedMonth, currentUserName, currentUser]);

  // 2. Tính toán thống kê QC của cá nhân người dùng trong tháng
  const qcStats = useMemo(() => {
    if (!currentUser || (userRole !== "QC" && userRole !== "ADMIN")) return null;

    // Lookup tên đề sang số câu
    const s2Lookup = new Map<string, number>();
    Object.values(monthlyAssignments || {}).forEach((arr) => {
      if (Array.isArray(arr)) {
        arr.forEach((t) => {
          const k = cleanStr(t.task_title).toLowerCase();
          if (k && !s2Lookup.has(k) && t.so_cau) s2Lookup.set(k, t.so_cau);
        });
      }
    });

    const myQcTasksMap = new Map<string, { title: string; so_cau: number }>();

    // Quét Sheet 2
    Object.entries(monthlyAssignments || {}).forEach(([tabName, tasksArr]) => {
      if (!Array.isArray(tasksArr)) return;
      tasksArr.forEach((t) => {
        if (cleanStr(t.qc_name).toLowerCase() !== currentUserName) return;
        if (!isTaskInQcSalaryMonth(t.month || tabName, t.note, t.leader_check, selectedMonth)) return;
        if (isQcDone(t.qc_done)) {
          const k = cleanStr(t.task_title).toLowerCase();
          myQcTasksMap.set(k, { title: t.task_title, so_cau: t.so_cau || 0 });
        }
      });
    });

    // Quét Sheet 1
    let totalErrors = 0;
    appData.forEach((task: TaskItem) => {
      if (cleanStr(getVal(task, "QC")).toLowerCase() !== currentUserName) return;
      const itemMonth = getVal(task, "ID/ tháng") || getVal(task, "ID/tháng");
      if (!isTaskInQcSalaryMonth(itemMonth, getVal(task, "Note"), "", selectedMonth)) return;

      const e1 = parseQcErrorCount(getVal(task, "Lỗi lần 1"));
      const e2 = parseQcErrorCount(getVal(task, "Lỗi lần 2"));
      const e3 = parseQcErrorCount(getVal(task, "Lỗi lần 3"));
      totalErrors += (e1 + e2 + e3);

      const isDone = isQcDone(getVal(task, "QC done"));
      const hasErrors = (e1 + e2 + e3) > 0 || cleanStr(getVal(task, "Lỗi lần 1")) !== "" || cleanStr(getVal(task, "Lỗi lần 2")) !== "" || cleanStr(getVal(task, "Lỗi lần 3")) !== "";

      if (isDone || hasErrors) {
        const rawTitle = cleanStr(getVal(task, "Tên đề"));
        const k = rawTitle.toLowerCase();
        let sc = typeof task["Số câu"] === "number" ? task["Số câu"] : parseInt(String(task["Số câu"] || "").replace(/\D/g, ""), 10) || 0;
        if (sc === 0 && s2Lookup.has(k)) sc = s2Lookup.get(k) || 0;

        if (myQcTasksMap.has(k)) {
          const ex = myQcTasksMap.get(k)!;
          if (ex.so_cau === 0 && sc > 0) ex.so_cau = sc;
        } else {
          myQcTasksMap.set(k, { title: rawTitle, so_cau: sc });
        }
      }
    });

    let totalCheckedQuestions = 0;
    myQcTasksMap.forEach((t) => {
      totalCheckedQuestions += t.so_cau;
    });

    return {
      checkedTasksCount: myQcTasksMap.size,
      totalCheckedQuestions,
      totalErrors,
    };
  }, [monthlyAssignments, appData, selectedMonth, currentUserName, userRole, currentUser]);

  if (!currentUser) return null;

  const hasNdData = ndStats.totalQuestions > 0 || ndStats.taskCount > 0;
  const isQcUser = userRole === "QC" || userRole === "ADMIN";

  if (!hasNdData && !isQcUser) return null;

  return (
    <div className="w-full mb-4 space-y-2.5">
      {/* KHỐI 1: THẺ THỐNG KÊ SỐ CÂU NỘI DUNG (Dành cho ND hoặc QC có làm đề ND) */}
      {hasNdData && (
        <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-blue-50/80 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-slate-900/60 p-3.5 sm:p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2.5 border-b border-emerald-200/60 dark:border-emerald-800/40">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
                  <span>Số Câu Nội Dung Đã Làm của {currentUser.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 font-extrabold">
                    {selectedMonth === "ALL" ? "Tất cả các tháng" : selectedMonth}
                  </span>
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-emerald-900 dark:text-emerald-300 font-black text-sm sm:text-base">
              <span>Tổng:</span>
              <span className="px-2.5 py-0.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                {ndStats.totalQuestions.toLocaleString("vi-VN")} câu
              </span>
            </div>
          </div>

          {/* Chi tiết 7 loại đề */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2.5">
            <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700 text-center">
              <span className="block text-[10px] font-bold text-slate-500">MCQ Copy</span>
              <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">
                {ndStats.mcqCopy > 0 ? ndStats.mcqCopy.toLocaleString("vi-VN") : "-"}
              </span>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700 text-center">
              <span className="block text-[10px] font-bold text-slate-500">MCQ Gõ / AI Khẩn</span>
              <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">
                {ndStats.mcqGo > 0 ? ndStats.mcqGo.toLocaleString("vi-VN") : "-"}
              </span>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700 text-center">
              <span className="block text-[10px] font-bold text-rose-600 dark:text-rose-400">Đề Tối Khẩn</span>
              <span className="text-xs sm:text-sm font-black text-rose-700 dark:text-rose-300">
                {ndStats.deToiKhan > 0 ? ndStats.deToiKhan.toLocaleString("vi-VN") : "-"}
              </span>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700 text-center">
              <span className="block text-[10px] font-bold text-slate-500">Thực Hành (TH)</span>
              <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">
                {ndStats.th > 0 ? ndStats.th.toLocaleString("vi-VN") : "-"}
              </span>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700 text-center">
              <span className="block text-[10px] font-bold text-blue-600 dark:text-blue-400">AI Create</span>
              <span className="text-xs sm:text-sm font-black text-blue-700 dark:text-blue-300">
                {ndStats.aiCreate > 0 ? ndStats.aiCreate.toLocaleString("vi-VN") : "-"}
              </span>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700 text-center">
              <span className="block text-[10px] font-bold text-slate-500">CopyGT</span>
              <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">
                {ndStats.copyGt > 0 ? ndStats.copyGt.toLocaleString("vi-VN") : "-"}
              </span>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700 text-center col-span-2 sm:col-span-1">
              <span className="block text-[10px] font-bold text-slate-500">Gõ GT</span>
              <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">
                {ndStats.goGt > 0 ? ndStats.goGt.toLocaleString("vi-VN") : "-"}
              </span>
            </div>
          </div>

          <div className="pt-2 text-[10px] sm:text-[11px] text-emerald-800/90 dark:text-emerald-400/90 font-medium italic flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            <span>* Số câu tính được chỉ mang tính chất tham khảo & không chịu trách nhiệm pháp lý.</span>
          </div>
        </div>
      )}

      {/* KHỐI 2: THẺ THỐNG KÊ CÔNG VIỆC QC (Dành cho QC / Admin) */}
      {isQcUser && qcStats && (
        <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-purple-50/80 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-slate-900/60 p-3.5 sm:p-4 rounded-2xl border border-blue-200/80 dark:border-blue-800/60 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2.5 border-b border-blue-200/60 dark:border-blue-800/40">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-600 text-white rounded-xl shadow-xs">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-blue-950 dark:text-blue-200 flex items-center gap-2">
                  <span>Tiến Độ Check QC của {currentUser.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-200/80 dark:bg-blue-900/80 text-blue-900 dark:text-blue-200 font-extrabold">
                    {selectedMonth === "ALL" ? "Tất cả các tháng" : selectedMonth}
                  </span>
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-blue-900 dark:text-blue-300 font-black text-sm sm:text-base">
              <span>Đã check:</span>
              <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded-xl shadow-xs">
                {qcStats.totalCheckedQuestions.toLocaleString("vi-VN")} câu
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-2.5">
            <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 text-center">
              <span className="block text-[10px] font-bold text-slate-500">Số đề đã check</span>
              <span className="text-sm sm:text-base font-black text-blue-700 dark:text-blue-300">
                {qcStats.checkedTasksCount} đề
              </span>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 text-center">
              <span className="block text-[10px] font-bold text-slate-500">Số câu đã check</span>
              <span className="text-sm sm:text-base font-black text-emerald-700 dark:text-emerald-300">
                {qcStats.totalCheckedQuestions.toLocaleString("vi-VN")} câu
              </span>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 text-center">
              <span className="block text-[10px] font-bold text-slate-500">Số lỗi đã check</span>
              <span className="text-sm sm:text-base font-black text-rose-700 dark:text-rose-300">
                {qcStats.totalErrors} lỗi
              </span>
            </div>
          </div>

          <div className="pt-2 text-[10px] sm:text-[11px] text-blue-800/90 dark:text-blue-400/90 font-medium italic flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            <span>* Số câu tính được chỉ mang tính chất tham khảo & không chịu trách nhiệm pháp lý.</span>
          </div>
        </div>
      )}
    </div>
  );
};
