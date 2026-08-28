"use client";

/**
 * ============================================================================
 * FILE: components/NotificationModal.tsx
 * MỤC ĐÍCH: Modal Pop-up Thông Báo Chào Mừng & Nhắc Việc khi vào Web
 * ============================================================================
 */

import React, { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { TaskItem } from "@/types";
import { cleanStr, getVal, getStatusObj, isQcDone, normalizeMonthStr } from "@/lib/helpers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Bell,
  AlertCircle,
  Clock,
  User,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface NotificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { currentUser, appData, setEditingTask } = useApp();

  const currentUserName = cleanStr(currentUser?.name).toLowerCase();
  const userRole = cleanStr(currentUser?.role).toUpperCase();

  // 1. Lọc danh sách đề cần xử lý theo từng vai trò
  const urgentNotifications = useMemo(() => {
    if (!currentUser || !Array.isArray(appData)) return [];

    const items: Array<{
      task: TaskItem;
      title: string;
      month: string;
      workerName: string;
      qcName: string;
      timeStr: string;
      actionType: string;
      actionBadgeColor: string;
      errorDetail: string;
    }> = [];

    appData.forEach((task) => {
      const worker = cleanStr(getVal(task, "Ai làm"));
      const rawQc = cleanStr(getVal(task, "QC"));
      const qc = rawQc.replace(/\s*\([^)]*\)/g, "").trim();
      const title = cleanStr(getVal(task, "Tên đề"));
      const timeStr = cleanStr(getVal(task, "Thời gian"));
      const l1 = cleanStr(getVal(task, "Lỗi lần 1"));
      const l2 = cleanStr(getVal(task, "Lỗi lần 2"));
      const l3 = cleanStr(getVal(task, "Lỗi lần 3"));
      const ndPhanHoi = cleanStr(getVal(task, "Nội Dung Phản hồi"));
      const qcPhanHoi = cleanStr(getVal(task, "Phản hồi của QC"));

      const statusObj = getStatusObj(task);
      const isPass = statusObj.code === "PASS" || isQcDone(getVal(task, "QC done"));

      // Nếu đề đã Pass thì KHÔNG thông báo
      if (isPass) return;

      const hasError = l1 !== "" || l2 !== "" || l3 !== "" || statusObj.code === "ERROR" || statusObj.code === "WRONG";

      // Lấy thông tin tháng / kỳ làm việc
      const taskMonth = normalizeMonthStr(
        getVal(task, "ID/ tháng") || getVal(task, "ID/tháng") || "Chưa rõ"
      );

      // =====================================================================
      // TRƯỜNG HỢP 1: DÀNH CHO ADMIN (Toàn quyền thấy toàn bộ thông báo hệ thống)
      // =====================================================================
      if (userRole === "ADMIN") {
        if (hasError && (!ndPhanHoi || statusObj.code === "ERROR" || statusObj.code === "WRONG")) {
          items.push({
            task,
            title,
            month: taskMonth,
            workerName: worker || "Chưa rõ",
            qcName: qc || "Chưa gán",
            timeStr: timeStr || "Gần đây",
            actionType: "QC báo lỗi (Chờ ND sửa)",
            actionBadgeColor: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/80 dark:text-rose-300",
            errorDetail: l3 || l2 || l1 || "Đang có lỗi cần ND phản hồi",
          });
        } else if (ndPhanHoi !== "") {
          items.push({
            task,
            title,
            month: taskMonth,
            workerName: worker || "Chưa rõ",
            qcName: qc || "Chưa gán",
            timeStr: timeStr || "Gần đây",
            actionType: "ND đã phản hồi (Chờ QC check)",
            actionBadgeColor: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/80 dark:text-purple-300",
            errorDetail: ndPhanHoi,
          });
        } else if (statusObj.code === "PENDING") {
          items.push({
            task,
            title,
            month: taskMonth,
            workerName: worker || "Chưa rõ",
            qcName: qc || "Chưa gán",
            timeStr: timeStr || "Gần đây",
            actionType: "Đề mới chờ QC kiểm tra",
            actionBadgeColor: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300",
            errorDetail: "Đề bài đang chờ kiểm tra duyệt",
          });
        }
      }

      // =====================================================================
      // TRƯỜNG HỢP 2: DÀNH CHO NHÂN SỰ NỘI DUNG (ND)
      // =====================================================================
      else if (userRole === "ND" || userRole === "WORKER") {
        if (worker.toLowerCase() === currentUserName) {
          // Chỉ hiện khi đề có lỗi hoặc QC có phản hồi mà ND chưa phản hồi lại
          if (hasError && (!ndPhanHoi || statusObj.code === "ERROR" || statusObj.code === "WRONG")) {
            let actionType = "QC báo lỗi đề mới";
            let actionBadgeColor = "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/80 dark:text-rose-300";

            if (l3 !== "") {
              actionType = "QC cập nhật lỗi lần 3";
            } else if (l2 !== "") {
              actionType = "QC cập nhật lỗi lần 2";
            } else if (qcPhanHoi !== "") {
              actionType = "QC có phản hồi mới";
              actionBadgeColor = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300";
            }

            const errorSummary = l3 || l2 || l1 || qcPhanHoi || "Cần kiểm tra và sửa lại theo yêu cầu QC";

            items.push({
              task,
              title,
              month: taskMonth,
              workerName: worker,
              qcName: qc || "QC",
              timeStr: timeStr || "Gần đây",
              actionType,
              actionBadgeColor,
              errorDetail: errorSummary,
            });
          }
        }
      }

      // =====================================================================
      // TRƯỜNG HỢP 3: DÀNH CHO QC
      // =====================================================================
      else if (userRole === "QC") {
        const isMyQc = rawQc.toLowerCase() === currentUserName || qc.toLowerCase() === currentUserName;
        if (isMyQc) {
          // Hiện khi ND đã phản hồi lại hoặc đề mới đang chờ duyệt
          if (ndPhanHoi !== "") {
            items.push({
              task,
              title,
              month: taskMonth,
              workerName: worker || "Chưa gán",
              qcName: qc || "QC",
              timeStr: timeStr || "Gần đây",
              actionType: "ND đã phản hồi lại",
              actionBadgeColor: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/80 dark:text-purple-300",
              errorDetail: ndPhanHoi,
            });
          } else if (statusObj.code === "PENDING") {
            items.push({
              task,
              title,
              month: taskMonth,
              workerName: worker || "Chưa gán",
              qcName: qc || "QC",
              timeStr: timeStr || "Gần đây",
              actionType: "Chờ QC kiểm tra",
              actionBadgeColor: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300",
              errorDetail: "Đề bài đang chờ QC thẩm định và duyệt",
            });
          }
        }
      }
    });

    return items;
  }, [appData, currentUser, currentUserName, userRole]);

  const handleOpenTask = (task: TaskItem) => {
    onOpenChange(false);
    setEditingTask(task);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1rem)] sm:w-[95vw] max-w-6xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-50 dark:bg-slate-900 rounded-3xl border-slate-200 dark:border-slate-800 shadow-2xl">
        
        {/* Header Modal */}
        <DialogHeader className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 rounded-2xl flex-shrink-0">
              <Bell className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                <span>Trung Tâm Nhắc Việc & Thông Báo</span>
                {urgentNotifications.length > 0 && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-extrabold shadow-xs">
                    {urgentNotifications.length} việc cần làm
                  </span>
                )}
              </DialogTitle>
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 mt-0.5">
                Xin chào <strong>{currentUser?.name || "Bạn"}</strong>! Dưới đây là các đề bài cần bạn xử lý sớm.
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
              Bắt đầu làm việc
            </Button>
          </div>
        </DialogHeader>

        {/* Nội dung danh sách thông báo */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {urgentNotifications.length === 0 ? (
            <div className="p-10 text-center bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Tuyệt vời! Hiện tại bạn không có đề nào cần xử lý gấp.
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Tất cả các đề bài của bạn đều đã hoàn thành hoặc đang được kiểm tra bình thường.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[640px] sm:min-w-full">
                  <thead>
                    <tr className="bg-slate-100/90 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-black text-[11px] sm:text-xs uppercase border-b border-slate-200 dark:border-slate-700">
                      <th className="p-3 pl-4 min-w-[200px]">Tên đề</th>
                      <th
                        className={`p-3 min-w-[80px] transition-colors ${
                          userRole === "QC"
                            ? "bg-purple-100/90 dark:bg-purple-950/80 text-purple-800 dark:text-purple-200 border-x border-purple-200/70 dark:border-purple-800"
                            : ""
                        }`}
                      >
                        <span>QC</span>
                      </th>
                      <th
                        className={`p-3 min-w-[80px] transition-colors ${
                          userRole === "ND" || userRole === "WORKER"
                            ? "bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border-x border-emerald-200/70 dark:border-emerald-800"
                            : ""
                        }`}
                      >
                        <span>Ai làm</span>
                      </th>
                      <th className="p-3 min-w-[120px]">Thời gian</th>
                      <th className="p-3 min-w-[140px]">Loại cập nhật</th>
                      <th className="p-3 pr-4 text-right min-w-[110px]">Hành động</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {urgentNotifications.map((item, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50 dark:hover:bg-slate-750 transition"
                      >
                        <td className="p-3.5 pl-4 font-black text-slate-900 dark:text-white max-w-md xl:max-w-xl">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                              {item.month}
                            </span>
                            <span className="line-clamp-2">{item.title}</span>
                          </div>
                        </td>

                        <td
                          className={`p-3 font-bold whitespace-nowrap transition-colors ${
                            userRole === "QC"
                              ? "bg-purple-50/70 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 border-x border-purple-100 dark:border-purple-900/40"
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <User className={`w-3.5 h-3.5 ${userRole === "QC" ? "text-purple-600 dark:text-purple-400" : "text-blue-500"}`} />
                            <span className={userRole === "QC" ? "font-black text-purple-800 dark:text-purple-300" : ""}>{item.qcName}</span>
                          </span>
                        </td>

                        <td
                          className={`p-3 font-bold whitespace-nowrap transition-colors ${
                            userRole === "ND" || userRole === "WORKER"
                              ? "bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border-x border-emerald-100 dark:border-emerald-900/40"
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <span className={userRole === "ND" || userRole === "WORKER" ? "font-black text-emerald-800 dark:text-emerald-300" : ""}>
                            {item.workerName}
                          </span>
                        </td>

                        <td className="p-3 text-[11px] font-medium text-slate-500 whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{item.timeStr}</span>
                          </span>
                        </td>

                        <td className="p-3 whitespace-nowrap">
                          <span className={`text-[11px] px-2.5 py-1 rounded-xl font-black border inline-block shadow-2xs ${item.actionBadgeColor}`}>
                            {item.actionType}
                          </span>
                        </td>

                        <td className="p-3 pr-4 text-right whitespace-nowrap">
                          <Button
                            onClick={() => handleOpenTask(item.task)}
                            size="sm"
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black h-8 px-3.5 flex items-center gap-1 shadow-xs transition active:scale-95 cursor-pointer ml-auto"
                          >
                            <span>Xử lý ngay</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
