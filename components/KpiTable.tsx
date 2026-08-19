"use client";

/**
 * ============================================================================
 * FILE: components/KpiTable.tsx
 * MỤC ĐÍCH: Bảng tính lương & Năng suất câu của Nhân sự Nội Dung theo loại đề
 * CHỨC NĂNG:
 *   1. Thống kê số lượng câu hỏi theo 7 loại định dạng đề (MCQ copy, MCQ gõ/AI khẩn, Đề tối khẩn, TH, AI create, CopyGT, Gõ GT)
 *   2. Tính TỔNG CÂU và Đơn giá lương thành tiền VND chính xác
 *   3. Hỗ trợ sắp xếp (Sort Tăng / Giảm) tất cả các cột
 *   4. Thiết kế cuộn ngang mượt mà trên Điện thoại và Máy tính bảng
 * ============================================================================
 */

import React, { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { User, MonthlyAssignmentItem } from "@/types";
import { cleanStr } from "@/lib/helpers";
import { Calendar, MoveHorizontal, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

type SortField =
  | "name"
  | "mcqCopy"
  | "mcqGo"
  | "deToiKhan"
  | "th"
  | "aiCreate"
  | "copyGt"
  | "goGt"
  | "total";

export const KpiTable: React.FC = () => {
  const { monthlyAssignments, listUsers } = useApp();

  const availableMonths = useMemo(() => {
    return Object.keys(monthlyAssignments || {});
  }, [monthlyAssignments]);

  const [selectedKpiMonth, setSelectedKpiMonth] = useState<string>("ALL");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (field: SortField) => {
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

  const kpiData = useMemo(() => {
    // 1. Lấy danh sách nhân sự trực tiếp từ Tab Users trên Google Sheet
    const dynamicWorkersOrder = listUsers.map((u: User) => cleanStr(u.name));

    // 2. Gom danh sách các đề từ sheet Nội Dung theo tháng được chọn
    let tasksList: MonthlyAssignmentItem[] = [];
    if (!monthlyAssignments || Object.keys(monthlyAssignments).length === 0) {
      tasksList = [];
    } else if (selectedKpiMonth === "ALL") {
      Object.values(monthlyAssignments).forEach((arr) => {
        if (Array.isArray(arr)) tasksList.push(...arr);
      });
    } else {
      tasksList = monthlyAssignments[selectedKpiMonth] || [];
    }

    // 3. Khởi tạo bảng dữ liệu cho từng nhân sự
    const dataMap: Record<string, any> = {};
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
      };
    });

    // 4. Quét từng dòng đề bài trong sheet Nội Dung
    tasksList.forEach((task: MonthlyAssignmentItem) => {
      const workerNameRaw = task.worker_name || "";
      const workerName = cleanStr(workerNameRaw).toLowerCase();
      if (!workerName) return;

      const note = cleanStr(task.note || "").toLowerCase();
      const leaderCheck = cleanStr(task.leader_check || "").toLowerCase();
      const title = cleanStr(task.task_title || "").toLowerCase();
      const combined = note + " " + leaderCheck;
      const combinedWithTitle = combined + " " + title;

      const soCau =
        typeof task.so_cau === "number"
          ? task.so_cau
          : parseInt(String(task.so_cau || "0").replace(/\D/g, ""), 10) || 0;
      if (soCau === 0) return;

      let targetObj = dataMap[workerName];
      if (!targetObj) {
        dataMap[workerName] = {
          name: cleanStr(workerNameRaw),
          mcqCopy: 0,
          mcqGo: 0,
          deToiKhan: 0,
          th: 0,
          aiCreate: 0,
          copyGt: 0,
          goGt: 0,
        };
        targetObj = dataMap[workerName];
      }

      // Phân loại logic chính xác
      if (
        combined.includes("gõ gt") ||
        combined.includes("gõ gt th") ||
        combined.includes("go gt")
      ) {
        targetObj.goGt += soCau;
      } else if (
        combined.includes("copygt") ||
        combined.includes("copy gt")
      ) {
        targetObj.copyGt += soCau;
      } else if (
        combined.includes("đề tối khẩn") ||
        combined.includes("de toi khan") ||
        combined.includes("tối khẩn")
      ) {
        targetObj.deToiKhan += soCau;
      } else if (
        combined.includes("ai khẩn") ||
        combined.includes("đề khẩn") ||
        combined.includes("ai khan") ||
        combined.includes("tính ai khẩn")
      ) {
        targetObj.mcqGo += soCau;
      } else if (
        combined.includes("tạo ai") ||
        combined.includes("tao ai") ||
        combined.includes("ai create")
      ) {
        targetObj.aiCreate += soCau;
      } else if (
        combinedWithTitle.includes("đề thực hành") ||
        combinedWithTitle.includes("thực hành") ||
        combinedWithTitle.includes("thuc hanh") ||
        combinedWithTitle.includes("chạy trạm") ||
        /\bth\b/i.test(combined)
      ) {
        targetObj.th += soCau;
      } else if (combined.includes("copy")) {
        targetObj.mcqCopy += soCau;
      } else {
        targetObj.mcqCopy += soCau;
      }
    });

    // 5. Kết quả theo đúng thứ tự tab Users
    let result = dynamicWorkersOrder
      .map((name) => dataMap[name.toLowerCase()])
      .filter(Boolean);

    Object.keys(dataMap).forEach((key) => {
      if (!dynamicWorkersOrder.some((w) => w.toLowerCase() === key)) {
        result.push(dataMap[key]);
      }
    });

    // 6. Xử lý sắp xếp nếu người dùng bấm vào cột
    if (sortField) {
      result = [...result].sort((a, b) => {
        let valA: any;
        let valB: any;

        if (sortField === "total") {
          valA =
            (a.mcqCopy || 0) +
            (a.mcqGo || 0) +
            (a.deToiKhan || 0) +
            (a.th || 0) +
            (a.aiCreate || 0) +
            (a.copyGt || 0) +
            (a.goGt || 0);
          valB =
            (b.mcqCopy || 0) +
            (b.mcqGo || 0) +
            (b.deToiKhan || 0) +
            (b.th || 0) +
            (b.aiCreate || 0) +
            (b.copyGt || 0) +
            (b.goGt || 0);
        } else if (sortField === "name") {
          valA = a.name;
          valB = b.name;
          return sortOrder === "asc"
            ? valA.localeCompare(valB, "vi")
            : valB.localeCompare(valA, "vi");
        } else {
          valA = a[sortField] || 0;
          valB = b[sortField] || 0;
        }

        return sortOrder === "asc" ? valA - valB : valB - valA;
      });
    }

    return result;
  }, [monthlyAssignments, selectedKpiMonth, listUsers, sortField, sortOrder]);

  // Tính tổng cộng toàn bộ theo từng cột
  const columnTotals = useMemo(() => {
    const totals = {
      mcqCopy: 0,
      mcqGo: 0,
      deToiKhan: 0,
      th: 0,
      aiCreate: 0,
      copyGt: 0,
      goGt: 0,
      grandTotal: 0,
    };

    kpiData.forEach((row) => {
      totals.mcqCopy += row.mcqCopy || 0;
      totals.mcqGo += row.mcqGo || 0;
      totals.deToiKhan += row.deToiKhan || 0;
      totals.th += row.th || 0;
      totals.aiCreate += row.aiCreate || 0;
      totals.copyGt += row.copyGt || 0;
      totals.goGt += row.goGt || 0;
      totals.grandTotal +=
        (row.mcqCopy || 0) +
        (row.mcqGo || 0) +
        (row.deToiKhan || 0) +
        (row.th || 0) +
        (row.aiCreate || 0) +
        (row.copyGt || 0) +
        (row.goGt || 0);
    });

    return totals;
  }, [kpiData]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-emerald-600/50 dark:text-emerald-400/50 ml-1 inline-block" />;
    }
    if (sortOrder === "asc") {
      return <ArrowUp className="w-3.5 h-3.5 text-emerald-800 dark:text-emerald-200 ml-1 inline-block" />;
    }
    return <ArrowDown className="w-3.5 h-3.5 text-emerald-800 dark:text-emerald-200 ml-1 inline-block" />;
  };

  return (
    <div className="space-y-4 max-w-full">
      {/* Bộ lọc tháng & Hướng dẫn vuốt trên Mobile */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-800/90 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-black text-slate-800 dark:text-slate-100">
            Lọc theo Tab Sheet Phân Công:
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 sm:hidden">
            <MoveHorizontal className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>Vuốt ngang để xem</span>
          </span>

          <select
            value={selectedKpiMonth}
            onChange={(e) => setSelectedKpiMonth(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer hover:border-emerald-500 transition shadow-2xs"
          >
            <option value="ALL">Tất cả các tháng</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bảng Kẻ Khung Rõ Ràng - Hỗ trợ Sắp Xếp Cột */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-sm overflow-hidden w-full max-w-full">
        <div className="overflow-x-auto touch-pan-x w-full overscroll-x-contain scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
          <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[760px]">
            <thead>
              <tr className="bg-emerald-100/80 dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-200 font-black uppercase tracking-wider text-[11px] sm:text-xs border-b-2 border-emerald-300 dark:border-emerald-800">
                <th
                  onClick={() => handleSort("name")}
                  className="p-3 sm:p-3.5 pl-4 border-r border-emerald-200/80 dark:border-emerald-800/80 sticky left-0 bg-emerald-100 dark:bg-emerald-950 z-20 w-28 cursor-pointer select-none hover:bg-emerald-200/80 transition shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                >
                  <div className="flex items-center justify-between">
                    <span>Tên</span>
                    {renderSortIcon("name")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("mcqCopy")}
                  className="p-3 sm:p-3.5 text-center border-r border-emerald-200/80 dark:border-emerald-800/80 min-w-[90px] cursor-pointer select-none hover:bg-emerald-200/60 transition"
                >
                  <span>MCQ copy</span>
                  {renderSortIcon("mcqCopy")}
                </th>
                <th
                  onClick={() => handleSort("mcqGo")}
                  className="p-3 sm:p-3.5 text-center border-r border-emerald-200/80 dark:border-emerald-800/80 min-w-[125px] cursor-pointer select-none hover:bg-emerald-200/60 transition"
                >
                  <span>MCQ gõ / AI khẩn</span>
                  {renderSortIcon("mcqGo")}
                </th>
                <th
                  onClick={() => handleSort("deToiKhan")}
                  className="p-3 sm:p-3.5 text-center border-r border-emerald-200/80 dark:border-emerald-800/80 min-w-[100px] cursor-pointer select-none hover:bg-emerald-200/60 transition"
                >
                  <span>Đề tối khẩn</span>
                  {renderSortIcon("deToiKhan")}
                </th>
                <th
                  onClick={() => handleSort("th")}
                  className="p-3 sm:p-3.5 text-center border-r border-emerald-200/80 dark:border-emerald-800/80 min-w-[70px] cursor-pointer select-none hover:bg-emerald-200/60 transition"
                >
                  <span>TH</span>
                  {renderSortIcon("th")}
                </th>
                <th
                  onClick={() => handleSort("aiCreate")}
                  className="p-3 sm:p-3.5 text-center border-r border-emerald-200/80 dark:border-emerald-800/80 min-w-[90px] cursor-pointer select-none hover:bg-emerald-200/60 transition"
                >
                  <span>AI create</span>
                  {renderSortIcon("aiCreate")}
                </th>
                <th
                  onClick={() => handleSort("copyGt")}
                  className="p-3 sm:p-3.5 text-center border-r border-emerald-200/80 dark:border-emerald-800/80 min-w-[85px] cursor-pointer select-none hover:bg-emerald-200/60 transition"
                >
                  <span>CopyGT</span>
                  {renderSortIcon("copyGt")}
                </th>
                <th
                  onClick={() => handleSort("goGt")}
                  className="p-3 sm:p-3.5 text-center border-r border-emerald-200/80 dark:border-emerald-800/80 min-w-[85px] cursor-pointer select-none hover:bg-emerald-200/60 transition"
                >
                  <span>Gõ GT</span>
                  {renderSortIcon("goGt")}
                </th>
                <th
                  onClick={() => handleSort("total")}
                  className="p-3 sm:p-3.5 text-center font-black text-emerald-950 dark:text-emerald-100 bg-emerald-200/90 dark:bg-emerald-900/80 min-w-[100px] cursor-pointer select-none hover:bg-emerald-300 transition"
                >
                  <span>TỔNG CÂU</span>
                  {renderSortIcon("total")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-bold text-slate-800 dark:text-slate-200">
              {kpiData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                    Không có dữ liệu trong tháng này
                  </td>
                </tr>
              ) : (
                kpiData.map((row, idx) => {
                  const totalWorker =
                    (row.mcqCopy || 0) +
                    (row.mcqGo || 0) +
                    (row.deToiKhan || 0) +
                    (row.th || 0) +
                    (row.aiCreate || 0) +
                    (row.copyGt || 0) +
                    (row.goGt || 0);

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
                      <td className="p-3 sm:p-3.5 text-center font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40">
                        {totalWorker > 0 ? totalWorker.toLocaleString("vi-VN") : ""}
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
                  <td className="p-3 sm:p-3.5 text-center font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/70 text-sm">
                    {columnTotals.grandTotal.toLocaleString("vi-VN")}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
