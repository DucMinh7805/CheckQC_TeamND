/**
 * ============================================================================
 * FILE: lib/stats.ts
 * MỤC ĐÍCH: Tính toán thống kê KPI, phân loại Tab, tính số lỗi và tổng số câu
 * ============================================================================
 */

import {
  TaskItem,
  TabCounts,
  DashboardStats,
  WorkerStatItem,
  QCStatItem,
  QcPersonalStats,
} from "@/types";
import {
  getVal,
  getStatusObj,
  cleanStr,
  isMultiError,
  isPending3Days,
  normalizeMonthStr,
  isTaskInQcSalaryMonth,
  parseQcErrorCount,
} from "./helpers";

/**
 * Đếm số lượng đề theo từng Tab (Tất cả, Đang lỗi, QC Sai, Chờ duyệt, Đã Pass)
 */
export function calculateTabCounts(tasks: TaskItem[]): TabCounts {
  const counts: TabCounts = {
    ALL: tasks.length,
    PENDING: 0,
    ERROR: 0,
    WRONG: 0,
    PASS: 0,
  };

  tasks.forEach((item) => {
    const code = getStatusObj(item).code;
    if (code === "PASS") counts.PASS += 1;
    else if (code === "ERROR") counts.ERROR += 1;
    else if (code === "WRONG") counts.WRONG += 1;
    else counts.PENDING += 1;
  });

  return counts;
}

/**
 * Thống kê tổng hợp toàn diện (Dashboard Stats, Worker Stats, QC Team Stats) - O(N) Single Pass
 */
export function calculateDashboardAndTeamStats(tasks: TaskItem[]): {
  stats: DashboardStats;
  workerStats: WorkerStatItem[];
  qcTeamStats: QCStatItem[];
} {
  if (!tasks || tasks.length === 0) {
    return {
      stats: {
        total: 0,
        pass: 0,
        error: 0,
        wrong: 0,
        pending: 0,
        totalQuestions: 0,
        totalLoi1: 0,
        totalLoi2: 0,
        totalLoi3: 0,
        multiErrorCount: 0,
        pending3DaysCount: 0,
      },
      workerStats: [],
      qcTeamStats: [],
    };
  }

  let pass = 0;
  let error = 0;
  let wrong = 0;
  let pending = 0;
  let totalQuestions = 0;
  let totalLoi1 = 0;
  let totalLoi2 = 0;
  let totalLoi3 = 0;
  let multiErrorCount = 0;
  let pending3DaysCount = 0;

  const workerMap = new Map<string, WorkerStatItem>();
  const qcMap = new Map<string, QCStatItem>();

  for (let i = 0; i < tasks.length; i++) {
    const item = tasks[i];
    const statusObj = getStatusObj(item);
    const statusCode = statusObj.code;

    if (statusCode === "PASS") pass++;
    else if (statusCode === "ERROR") error++;
    else if (statusCode === "WRONG") wrong++;
    else pending++;

    const qs = parseInt(getVal(item, "Số câu")) || 0;
    totalQuestions += qs;

    const hasLoi1 = !!getVal(item, "Lỗi lần 1");
    const hasLoi2 = !!getVal(item, "Lỗi lần 2");
    const hasLoi3 = !!getVal(item, "Lỗi lần 3");

    if (hasLoi1) totalLoi1++;
    if (hasLoi2) totalLoi2++;
    if (hasLoi3) totalLoi3++;
    if (isMultiError(item)) multiErrorCount++;
    if (isPending3Days(item)) pending3DaysCount++;

    const errorTotal = (hasLoi1 ? 1 : 0) + (hasLoi2 ? 1 : 0) + (hasLoi3 ? 1 : 0);
    const workerName = cleanStr(getVal(item, "Ai làm")) || "Chưa rõ";
    const qcName = cleanStr(getVal(item, "QC")) || "Chưa phân công";

    // Cập nhật thống kê Worker
    let curW = workerMap.get(workerName);
    if (!curW) {
      curW = {
        workerName,
        totalTasks: 0,
        totalQuestions: 0,
        passCount: 0,
        errorCount: 0,
        wrongCount: 0,
        pendingCount: 0,
        loi1Count: 0,
        loi2Count: 0,
        loi3Count: 0,
        totalErrors: 0,
        passRate: 0,
      };
      workerMap.set(workerName, curW);
    }
    curW.totalTasks += 1;
    curW.totalQuestions += qs;
    if (statusCode === "PASS") curW.passCount += 1;
    else if (statusCode === "ERROR") curW.errorCount += 1;
    else if (statusCode === "WRONG") curW.wrongCount += 1;
    else curW.pendingCount += 1;

    if (hasLoi1) curW.loi1Count += 1;
    if (hasLoi2) curW.loi2Count += 1;
    if (hasLoi3) curW.loi3Count += 1;
    curW.totalErrors = curW.loi1Count + curW.loi2Count + curW.loi3Count;
    curW.passRate = curW.totalTasks > 0 ? Math.round((curW.passCount / curW.totalTasks) * 100) : 0;

    // Cập nhật thống kê QC
    let curQC = qcMap.get(qcName);
    if (!curQC) {
      curQC = {
        qcName,
        totalCheckedTasks: 0,
        totalQuestionsChecked: 0,
        totalErrorsFound: 0,
        totalPassed: 0,
        passRate: 0,
      };
      qcMap.set(qcName, curQC);
    }
    curQC.totalCheckedTasks += 1;
    curQC.totalQuestionsChecked += qs;
    curQC.totalErrorsFound += errorTotal;
    if (statusCode === "PASS") curQC.totalPassed += 1;
    curQC.passRate = curQC.totalCheckedTasks > 0 ? Math.round((curQC.totalPassed / curQC.totalCheckedTasks) * 100) : 0;
  }

  const workerStatsList = Array.from(workerMap.values()).sort(
    (a, b) => b.totalQuestions - a.totalQuestions
  );

  const qcTeamStatsList = Array.from(qcMap.values()).sort(
    (a, b) => b.totalQuestionsChecked - a.totalQuestionsChecked
  );

  return {
    stats: {
      total: tasks.length,
      pass,
      error,
      wrong,
      pending,
      totalQuestions,
      totalLoi1,
      totalLoi2,
      totalLoi3,
      multiErrorCount,
      pending3DaysCount,
    },
    workerStats: workerStatsList,
    qcTeamStats: qcTeamStatsList,
  };
}

/**
 * Thống kê cá nhân cho QC
 */
export function calculateQcPersonalStats(
  appData: TaskItem[],
  currentUserName: string,
  selectedMonth: string
): QcPersonalStats {
  const normalizedUser = cleanStr(currentUserName).toLowerCase();

  const qcTasks = appData.filter((item) => {
    const idThang = normalizeMonthStr(
      getVal(item, "ID/ tháng") || getVal(item, "ID/tháng")
    );
    const mMatch = selectedMonth === "ALL" || idThang === selectedMonth;
    const qcMatch = cleanStr(getVal(item, "QC")).toLowerCase() === normalizedUser;
    return mMatch && qcMatch;
  });

  let totalQuestions = 0;
  let totalErrorsFound = 0;
  let totalPassed = 0;

  qcTasks.forEach((item) => {
    const qs = parseInt(getVal(item, "Số câu")) || 0;
    totalQuestions += qs;

    if (getVal(item, "Lỗi lần 1")) totalErrorsFound++;
    if (getVal(item, "Lỗi lần 2")) totalErrorsFound++;
    if (getVal(item, "Lỗi lần 3")) totalErrorsFound++;

    if (getStatusObj(item).code === "PASS") totalPassed++;
  });

  return {
    totalTasks: qcTasks.length,
    totalQuestions,
    totalErrorsFound,
    totalPassed,
    tasksList: qcTasks,
  };
}
