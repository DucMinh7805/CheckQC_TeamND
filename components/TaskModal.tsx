"use client";

/**
 * ============================================================================
 * FILE: components/TaskModal.tsx
 * MỤC ĐÍCH: Cửa sổ chi tiết và chỉnh sửa / phản hồi lỗi cho từng đề bài
 * CHỨC NĂNG:
 *   1. Xem toàn bộ thông tin đề bài (Tên, Số câu, Ai làm, QC, Link đề, Link SP)
 *   2. Nhập và cập nhật chi tiết Lỗi lần 1, 2, 3 (Dành cho QC)
 *   3. Phản hồi của Nội Dung và Phản hồi của QC kèm Minh chứng
 *   4. Phân quyền chặt chẽ theo vai trò (WORKER, QC, ADMIN) và cập nhật tức thì lên Google Sheets
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from "react";
import { TaskItem } from "@/types";
import { useApp } from "@/context/AppContext";
import {
  getVal,
  getStatusObj,
  formatURL,
  formatDateTime,
  cleanStr,
  extractRichLinks,
  ExtractedLinkItem,
} from "@/lib/helpers";
import { soundService } from "@/lib/sound";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  FolderOpen,
  Send,
  Loader2,
  AlertOctagon,
  AlertTriangle,
  History,
  Link2,
  User,
  ShieldCheck,
  Hash,
  Mail,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Copy,
  Check,
  Globe,
  Unlink,
} from "lucide-react";

interface TaskModalProps {
  task: TaskItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  isOpen,
  onClose,
}) => {
  const {
    currentUser,
    listUsers,
    saveTaskDetails,
    updateTaskStatus,
    impersonatedRole,
    availableWorkers,
    availableQCs,
  } = useApp();

  const [title, setTitle] = useState<string>("Đề bài");
  const [soCau, setSoCau] = useState<string>("");
  const [workerName, setWorkerName] = useState<string>("");
  const [qcName, setQcName] = useState<string>("");
  const [linkSp, setLinkSp] = useState<string>("");
  const [minhChung, setMinhChung] = useState<string>("");
  const [userFb, setUserFb] = useState<string>("");
  const [qcFb, setQcFb] = useState<string>("");
  const [loi1, setLoi1] = useState<string>("");
  const [loi2, setLoi2] = useState<string>("");
  const [loi3, setLoi3] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showTaskInfo, setShowTaskInfo] = useState<boolean>(true);
  const [isEditingTaskInfo, setIsEditingTaskInfo] = useState<boolean>(false);
  const [shouldNotify, setShouldNotify] = useState<boolean>(true);

  // Quản lý khung chèn / sửa link chuẩn phong cách Google Sheets
  const [activeLinkField, setActiveLinkField] = useState<string | null>(null);
  const [editingTargetLink, setEditingTargetLink] = useState<{ oldTitle: string; oldUrl: string } | null>(null);
  const [linkTitle, setLinkTitle] = useState<string>("");
  const [newLinkUrl, setNewLinkUrl] = useState<string>("");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastLoadedRowIndexRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen && task) {
      // Chỉ nạp dữ liệu từ props khi mở modal mới (hoặc mở đề khác)
      // Tuyệt đối KHÔNG ghi đè khi người dùng đang mở và gõ nội dung
      if (lastLoadedRowIndexRef.current !== task.row_index) {
        lastLoadedRowIndexRef.current = task.row_index;
        setTitle(getVal(task, "Tên đề") || "Đề bài");
        setSoCau(getVal(task, "Số câu") || "");
        setWorkerName(getVal(task, "Ai làm") || "");
        setQcName(getVal(task, "QC") || "");
        setLinkSp(getVal(task, "Link sản phẩm") || "");
        setMinhChung(getVal(task, "Minh chứng") || "");
        setUserFb(getVal(task, "Nội Dung Phản hồi") || "");
        setQcFb(getVal(task, "Phản hồi của QC") || "");
        setLoi1(getVal(task, "Lỗi lần 1") || "");
        setLoi2(getVal(task, "Lỗi lần 2") || "");
        setLoi3(getVal(task, "Lỗi lần 3") || "");
        setNote(getVal(task, "Note") || "");
        setActionError(null);
        setActionSuccess(null);
        setShowHistory(false);
        setShowTaskInfo(true);
        setIsEditingTaskInfo(false);
        setShouldNotify(true);
        setActiveLinkField(null);
        setEditingTargetLink(null);
        setLinkTitle("");
        setNewLinkUrl("");
        setCopiedUrl(null);
      }
    } else if (!isOpen) {
      lastLoadedRowIndexRef.current = null;
    }
  }, [isOpen, task]);

  if (!task) return null;

  const effectiveRole = impersonatedRole || currentUser?.role;
  const isWorker = effectiveRole === "WORKER";
  const isAdmin = effectiveRole === "ADMIN";

  const doerName = getVal(task, "Ai làm") || "Chưa rõ";
  const rawTime = getVal(task, "Thời gian");
  const timeFormatted = formatDateTime(rawTime);
  const status = getStatusObj(task);

  const workerUserObj = listUsers.find((u) => cleanStr(u.name).toLowerCase() === cleanStr(doerName).toLowerCase());
  const workerEmail = workerUserObj?.email || "";

  const canEditTaskInfo = !isWorker; // Cả QC và Super Admin đều có quyền chỉnh sửa nhập liệu
  const disableAdminFields = !canEditTaskInfo;
  const disableQCFields = isWorker;

  // Lấy hàm cập nhật state theo tên field
  const getFieldSetter = (fieldName: string): ((fn: (prev: string) => string) => void) => {
    switch (fieldName) {
      case "userFb": return setUserFb;
      case "qcFb": return setQcFb;
      case "loi1": return setLoi1;
      case "loi2": return setLoi2;
      case "loi3": return setLoi3;
      case "note": return setNote;
      default: return setUserFb;
    }
  };

  // Thêm hoặc Cập nhật Link theo chuẩn Google Sheets / Markdown
  const handleSaveLinkToField = (fieldName: string) => {
    if (!newLinkUrl.trim()) return;
    // Dọn sạch khoảng trắng và dấu ngắt dòng trong URL
    const cleanUrl = newLinkUrl.replace(/\s+/g, "").trim();
    const formattedUrl = formatURL(cleanUrl);
    const titleText = (linkTitle.trim() || "Link").replace(/\n/g, " ");
    const newMarkdown = `[${titleText}](${formattedUrl})`;
    const setter = getFieldSetter(fieldName);

    if (editingTargetLink) {
      // Sửa link cũ: Tìm và thay thế chuẩn xác vị trí link cũ
      setter((prev) => {
        const oldTitleEsc = escapeRegExp(editingTargetLink.oldTitle);
        const oldUrlEsc = escapeRegExp(editingTargetLink.oldUrl);

        let updated = prev.replace(new RegExp(`\\[${oldTitleEsc}\\]\\(${oldUrlEsc}\\)`, "i"), newMarkdown);
        if (updated === prev) {
          updated = prev.replace(new RegExp(oldUrlEsc, "i"), newMarkdown);
        }
        return updated;
      });
    } else {
      // Thêm link mới
      setter((prev) => (prev ? `${prev}\n${newMarkdown}` : newMarkdown));
    }

    setNewLinkUrl("");
    setLinkTitle("");
    setEditingTargetLink(null);
    setActiveLinkField(null);
  };

  // Xóa link khỏi nội dung văn bản
  const handleDeleteLinkFromField = (fieldName: string, itemToDelete: ExtractedLinkItem) => {
    const setter = getFieldSetter(fieldName);
    setter((prev) => {
      const titleEsc = escapeRegExp(itemToDelete.title);
      const urlEsc = escapeRegExp(itemToDelete.url);

      let updated = prev.replace(new RegExp(`\\[${titleEsc}\\]\\(${urlEsc}\\)`, "gi"), "");
      if (updated === prev) {
        updated = prev.replace(new RegExp(`\\[${titleEsc}\\]\\([^\\)]+\\)`, "gi"), "");
      }
      if (updated === prev) {
        updated = prev.replace(new RegExp(`[\\(\\[]?(?:Link\\s*)?${titleEsc}:?\\s*${urlEsc}[\\]\\)]?`, "gi"), "");
      }
      if (updated === prev) {
        updated = prev.replace(new RegExp(urlEsc, "gi"), "");
      }

      return updated.replace(/\n\s*\n\s*\n/g, "\n\n").trim();
    });
  };

  // Mở hộp thoại sửa link
  const handleStartEditLink = (fieldName: string, item: ExtractedLinkItem) => {
    setActiveLinkField(fieldName);
    setEditingTargetLink({ oldTitle: item.title, oldUrl: item.url });
    setLinkTitle(item.title);
    setNewLinkUrl(item.url);
  };

  // Sao chép link vào clipboard chuẩn Google Sheets
  const handleCopyLinkUrl = (url: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setActionError(null);
    setActionSuccess(null);

    const payload = {
      row_index: task.row_index,
      task_title: title,
      so_cau: soCau,
      worker_name: workerName,
      worker_email: workerEmail,
      qc_name: qcName,
      link_sp: linkSp,
      minh_chung: minhChung,
      loi_1: loi1,
      loi_2: loi2,
      loi_3: loi3,
      nd_phan_hoi: userFb,
      qc_phan_hoi: qcFb,
      note: note,
      should_notify: shouldNotify,
      sender_role: effectiveRole,
      sender_name: currentUser?.name || (isWorker ? workerName : qcName),
    };

    const res = await saveTaskDetails(payload);
    setIsSaving(false);

    if (res.success) {
      soundService.playNotificationSound("success");
      setActionSuccess("Đã lưu thông tin đề bài thành công!");
      setTimeout(() => {
        onClose();
      }, 900);
    } else {
      setActionError(res.message || "Lỗi lưu dữ liệu!");
    }
  };

  const handleStatusChange = async (newStatus: "PASS" | "WRONG") => {
    setIsUpdatingStatus(true);
    setActionError(null);
    setActionSuccess(null);

    const valToSet = newStatus === "PASS" ? "✅" : "❌";
    const res = await updateTaskStatus({
      row_index: task.row_index,
      qc_done: valToSet,
      task_title: title,
      worker_name: workerName,
      worker_email: workerEmail,
      qc_name: qcName,
      should_notify: shouldNotify,
      sender_role: effectiveRole,
      sender_name: currentUser?.name || qcName,
    });
    setIsUpdatingStatus(false);

    if (res.success) {
      onClose();
    } else {
      setActionError(res.message || "Lỗi cập nhật trạng thái!");
    }
  };

  // Mở trình soạn thảo Gmail với thông tin điền sẵn 100%
  const handleOpenDirectGmail = () => {
    if (!workerEmail) {
      alert(`Bạn "${doerName}" chưa có email trong Sheet Users!`);
      return;
    }

    const subject = encodeURIComponent(`[Trung tâm Nội Dung] QC kiểm tra đề: "${title}"`);
    let bodyText = `Chào ${doerName},\n\nQC (${qcName || currentUser?.name || 'QC'}) vừa kiểm tra đề "${title}".\n\nChi tiết bắt lỗi:\n`;
    if (loi1) bodyText += `• Lỗi 1: ${loi1}\n`;
    if (loi2) bodyText += `• Lỗi 2: ${loi2}\n`;
    if (loi3) bodyText += `• Lỗi 3: ${loi3}\n`;
    if (!loi1 && !loi2 && !loi3) bodyText += `(Không có lỗi ghi nhận)\n`;
    if (note) bodyText += `\nGhi chú thêm: ${note}\n`;
    bodyText += `\nVui lòng truy cập hệ thống để kiểm tra và hoàn thiện đề bài.\nTrân trọng!`;

    const body = encodeURIComponent(bodyText);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(workerEmail)}&su=${subject}&body=${body}`;
    window.open(gmailUrl, "_blank");
  };

  const renderStatusIcon = () => {
    if (status.code === "PASS") return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    if (status.code === "WRONG") return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    if (status.code === "ERROR") return <XCircle className="w-4 h-4 text-rose-600" />;
    return <Clock className="w-4 h-4 text-slate-500" />;
  };

  // Tự động tính số dòng tự nhiên để hiển thị đầy đủ văn bản mà không bị giật lag
  const calculateRows = (text: string, defaultRows: number = 2) => {
    if (!text) return defaultRows;
    const lines = text.split("\n").length;
    const charEstimate = Math.ceil(text.length / 55);
    return Math.min(8, Math.max(defaultRows, lines, charEstimate));
  };

  // Helper render ô nhập với tính năng chèn link Google Sheets chuẩn
  const renderRichInputField = (
    fieldName: string,
    label: string,
    value: string,
    setValue: (val: string) => void,
    readOnly: boolean,
    placeholder: string,
    minRows: number = 2,
    theme: "blue" | "rose" | "slate" = "slate"
  ) => {
    const isEditingLink = activeLinkField === fieldName;
    const extractedLinks = extractRichLinks(value);
    const dynamicRows = calculateRows(value, minRows);

    let labelColor = "text-slate-800 dark:text-slate-200";
    let btnColor = "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200/70 dark:border-blue-800";
    let textareaBorder = "border-slate-200 dark:border-slate-700 focus-visible:ring-blue-400";

    if (theme === "blue") {
      labelColor = "text-blue-900 dark:text-blue-300";
      textareaBorder = "border-blue-200 dark:border-blue-900 focus-visible:ring-blue-400";
    } else if (theme === "rose") {
      labelColor = "text-rose-900 dark:text-rose-300";
      btnColor = "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200/70 dark:border-rose-800";
      textareaBorder = "border-rose-200 dark:border-rose-800 focus-visible:ring-rose-400";
    }

    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className={`text-xs font-extrabold uppercase tracking-wider ${labelColor}`}>
            {label}
          </label>
          {!readOnly && (
            <button
              type="button"
              onClick={() => {
                if (isEditingLink) {
                  setActiveLinkField(null);
                  setEditingTargetLink(null);
                  setLinkTitle("");
                  setNewLinkUrl("");
                } else {
                  setActiveLinkField(fieldName);
                  setEditingTargetLink(null);
                  setLinkTitle("");
                  setNewLinkUrl("");
                }
              }}
              className={`text-[11px] font-bold hover:underline flex items-center gap-1 px-2.5 py-0.5 rounded-lg border ${btnColor} transition`}
            >
              <span>{isEditingLink ? "Đóng" : "+ Chèn Link"}</span>
              <Link2 className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Khung Chèn / Sửa Link Chuẩn Giao Diện Google Sheets */}
        {isEditingLink && (
          <div className="p-3 bg-white dark:bg-slate-800/95 rounded-2xl border border-blue-300 dark:border-blue-700 shadow-lg space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-1.5">
              <span className="text-[11px] font-black text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" />
                <span>{editingTargetLink ? "Chỉnh sửa đường liên kết" : "Chèn đường liên kết"}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">(Chuẩn Google Docs / Sheets)</span>
            </div>

            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                  Văn bản (Tên hiển thị):
                </label>
                <Input
                  type="text"
                  placeholder="Văn bản hiển thị (vd: Slide câu 63, Ảnh lỗi, Minh chứng...)"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 rounded-xl text-xs h-8 font-semibold border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                  Đường liên kết (URL):
                </label>
                <Input
                  type="text"
                  placeholder="Tìm kiếm hoặc dán đường liên kết (https://docs.google.com/...)"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSaveLinkToField(fieldName);
                    }
                  }}
                  className="bg-slate-50 dark:bg-slate-900 rounded-xl text-xs h-8 font-semibold border-slate-200 dark:border-slate-700"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setActiveLinkField(null);
                  setEditingTargetLink(null);
                  setLinkTitle("");
                  setNewLinkUrl("");
                }}
                className="text-xs h-7.5 px-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                Hủy
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleSaveLinkToField(fieldName)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs h-7.5 px-4 rounded-xl shadow-xs"
              >
                {editingTargetLink ? "Cập nhật" : "Áp dụng"}
              </Button>
            </div>
          </div>
        )}

        {/* Textarea mượt mà, hỗ trợ cuộn tự nhiên trên mọi thiết bị */}
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          readOnly={readOnly}
          rows={dynamicRows}
          placeholder={placeholder}
          className={`text-xs sm:text-sm font-semibold rounded-2xl p-3 resize-y transition-all ${textareaBorder} ${
            readOnly
              ? "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-default border-slate-200 dark:border-slate-700"
              : "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          }`}
        />

        {/* Thanh xem trước Link chuẩn Google Sheets (Pill card với Globe, Copy, Sửa, Xóa) */}
        {extractedLinks.length > 0 && (
          <div className="space-y-1.5 pt-0.5">
            {extractedLinks.map((item: ExtractedLinkItem, idx: number) => {
              const isCopied = copiedUrl === item.url;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-sm p-1.5 sm:p-2 flex items-center justify-between gap-2 transition-all hover:border-blue-300 dark:hover:border-blue-700"
                >
                  {/* Cột trái: Biểu tượng Globe + Tên + URL rút gọn */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 text-slate-600 dark:text-slate-300">
                      <Globe className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline truncate block"
                        title={item.url}
                      >
                        {item.title}
                      </a>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate block">
                        {item.url}
                      </span>
                    </div>
                  </div>

                  {/* Cột phải: Các nút thao tác chuẩn Google Sheets (Mở, Copy, Sửa, Xóa) */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Nút Mở tab mới */}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                      title="Mở đường liên kết trong tab mới"
                      aria-label={`Mở đường liên kết: ${item.title}`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    {/* Nút Sao chép link */}
                    <button
                      type="button"
                      onClick={() => handleCopyLinkUrl(item.url)}
                      className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                      title="Sao chép đường liên kết"
                      aria-label={`Sao chép đường liên kết: ${item.title}`}
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Nút Chỉnh sửa link */}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleStartEditLink(fieldName, item)}
                        className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                        title="Chỉnh sửa đường liên kết"
                        aria-label={`Chỉnh sửa đường liên kết: ${item.title}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Nút Xóa link */}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleDeleteLinkFromField(fieldName, item)}
                        className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                        title="Xóa đường liên kết"
                        aria-label={`Xóa đường liên kết: ${item.title}`}
                      >
                        <Unlink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[96vw] sm:w-[92vw] max-w-5xl h-[82vh] max-h-[82vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-150 focus:outline-none">
        <form onSubmit={handleSave} className="flex flex-col h-full overflow-hidden">
          {/* KHU VỰC CUỘN NỘI DUNG CHÍNH (CƠ CHẾ LƯỚT SIÊU MƯỢT TRÊN MOBILE/TABLET/LAPTOP) */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 bg-white dark:bg-slate-900 touch-pan-y"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {/* Header Thông Tin Đề Bài */}
            <div className="space-y-2.5 pr-8 sm:pr-0">
              {/* Dòng 1: Badge Trạng Thái + Nút Ẩn/Hiện + Lịch Sử */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={`${status.style} px-3 py-1 text-[11px] sm:text-xs font-black uppercase tracking-widest rounded-xl flex items-center gap-1.5 flex-shrink-0`}
                >
                  {renderStatusIcon()}
                  <span>{status.label}</span>
                </Badge>

                <div className="flex items-center gap-1 sm:gap-2">
                  {/* Nút Chỉnh sửa nhập liệu dạng thu gọn cho QC/Admin */}
                  {canEditTaskInfo && (
                    <button
                      type="button"
                      onClick={() => setIsEditingTaskInfo(!isEditingTaskInfo)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs ${
                        isEditingTaskInfo
                          ? "bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                          : "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900 border border-amber-200/80 dark:border-amber-800"
                      }`}
                      title={isEditingTaskInfo ? "Thu gọn form sửa" : "Chỉnh sửa nhập liệu (Tên đề, số câu, phân công)"}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>{isEditingTaskInfo ? "Đóng sửa" : "Sửa đề"}</span>
                    </button>
                  )}

                  {/* Nút Ẩn / Hiện thông tin đề */}
                  <button
                    type="button"
                    onClick={() => setShowTaskInfo(!showTaskInfo)}
                    className="px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 rounded-xl transition-all flex items-center gap-1"
                  >
                    {showTaskInfo ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span>Ẩn thông tin</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        <span>Hiện thông tin</span>
                      </>
                    )}
                  </button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl flex items-center gap-1 h-7 px-2.5"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Lịch sử</span>
                  </Button>
                </div>
              </div>

              {/* Tên Đề Bài (Nút Sửa Đề đã nằm ở trên thanh công cụ) */}
              <div className="flex items-start gap-2 flex-wrap min-w-0">
                <DialogTitle className="text-base sm:text-2xl font-black text-slate-900 dark:text-white leading-tight break-all [overflow-wrap:anywhere] break-words flex-1 min-w-0">
                  {title}
                </DialogTitle>
              </div>

              {/* Khối Badges Thông Tin Đề Bài */}
              {showTaskInfo && (
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 animate-in fade-in slide-in-from-top-1">
                  <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-xl border border-blue-200/70 dark:border-blue-800">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    <span>Nội dung: <strong>{doerName}</strong></span>
                  </span>

                  <span className="inline-flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 px-3 py-1 rounded-xl border border-purple-200/70 dark:border-purple-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                    <span>QC: <strong>{getVal(task, "QC") || "Chưa rõ"}</strong></span>
                  </span>

                  {soCau && (
                    <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                      <Hash className="w-3.5 h-3.5 text-blue-500" />
                      <span>Số câu: <strong>{soCau}</strong></span>
                    </span>
                  )}

                  {timeFormatted && (
                    <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{timeFormatted}</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Audit Log Box */}
            {showHistory && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 space-y-1 animate-in slide-in-from-top-2">
                <p className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                  <History className="w-4 h-4 text-blue-500" />
                  <span>Lịch Sử Kiểm Tra & Đổi Trạng Thái:</span>
                </p>
                <p>• Trạng thái hiện tại: <strong>{status.label}</strong></p>
                <p>• Người phụ trách duyệt: <strong>{getVal(task, "QC") || "Chưa rõ"}</strong></p>
                <p>• Thời gian ghi nhận: <strong>{timeFormatted || "Chưa rõ"}</strong></p>
              </div>
            )}

            {actionError && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2.5">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {actionSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* Dành cho QC & Super Admin: Khung Chỉnh sửa nhập liệu (Thu gọn / Mở rộng linh hoạt) */}
            {canEditTaskInfo && isEditingTaskInfo && (
              <div className="p-3.5 sm:p-4 bg-amber-50/70 dark:bg-amber-950/40 rounded-2xl border border-amber-300/90 dark:border-amber-700 space-y-3 animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between border-b border-amber-200/80 dark:border-amber-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                      <Pencil className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-[11px] sm:text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                      Chỉnh sửa nhập liệu ({effectiveRole === "ADMIN" ? "Super Admin" : "QC"})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingTaskInfo(false)}
                    className="text-[10px] font-bold text-amber-800 dark:text-amber-200 bg-amber-200/70 dark:bg-amber-900/60 hover:bg-amber-300/70 px-2 py-0.5 rounded-md transition"
                  >
                    ✕ Thu gọn
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3">
                  {/* Tên đề bài */}
                  <div className="space-y-1 sm:col-span-8">
                    <label className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 uppercase">
                      Tên đề bài:
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Nhập tên đề bài..."
                      className="bg-white dark:bg-slate-900 font-bold text-xs sm:text-sm h-9.5 border-amber-300 dark:border-amber-700"
                      required
                    />
                  </div>

                  {/* Số câu */}
                  <div className="space-y-1 sm:col-span-4">
                    <label className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 uppercase flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-blue-500" />
                      <span>Số câu:</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={soCau}
                      onChange={(e) => setSoCau(e.target.value)}
                      placeholder="Số câu hỏi"
                      className="bg-white dark:bg-slate-900 font-bold text-xs sm:text-sm h-9.5 border-amber-300 dark:border-amber-700"
                    />
                  </div>

                  {/* Ai làm */}
                  <div className="space-y-1 sm:col-span-6">
                    <label className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 uppercase flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-blue-500" />
                      <span>Nội dung làm:</span>
                    </label>
                    <Select value={workerName} onValueChange={(val) => val && setWorkerName(val)}>
                      <SelectTrigger className="bg-white dark:bg-slate-900 font-bold text-xs sm:text-sm h-9.5 border-amber-300 dark:border-amber-700">
                        <span>{workerName || "-- Chọn người làm --"}</span>
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {availableWorkers.map((w) => (
                          <SelectItem key={w} value={w} className="text-xs sm:text-sm font-bold">
                            {w}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* QC phụ trách */}
                  <div className="space-y-1 sm:col-span-6">
                    <label className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 uppercase flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                      <span>QC phụ trách:</span>
                    </label>
                    <Select value={qcName} onValueChange={(val) => val && setQcName(val)}>
                      <SelectTrigger className="bg-white dark:bg-slate-900 font-bold text-xs sm:text-sm h-9.5 border-amber-300 dark:border-amber-700">
                        <span>{qcName || "-- Chọn QC --"}</span>
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {availableQCs.map((q) => (
                          <SelectItem key={q} value={q} className="text-xs sm:text-sm font-bold">
                            {q}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* KHUNG NỘI DUNG 1 CỘT (TABLET / ĐIỆN THOẠI) & 2 CỘT (LAPTOP MÀN HÌNH RỘNG) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
              {/* CỘT TRÁI: LINKS HỆ THỐNG + PHẢN HỒI + GHI CHÚ */}
              <div className="space-y-4">
                {/* Links hệ thống */}
                <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                  <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Links hệ thống</span>
                  </h3>

                  {/* Link Sản Phẩm */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                      Link Sản Phẩm:
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={linkSp}
                        onChange={(e) => setLinkSp(e.target.value)}
                        readOnly={disableAdminFields && isWorker}
                        placeholder="https://docs.google.com/..."
                        aria-label="Đường link sản phẩm"
                        className="bg-white dark:bg-slate-900 rounded-xl font-semibold text-xs text-slate-800 dark:text-slate-200 h-9"
                      />
                      {linkSp && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(formatURL(linkSp), "_blank")}
                          aria-label="Mở link sản phẩm"
                          className="rounded-xl px-2.5 font-bold text-xs text-blue-700 dark:text-blue-300 border-blue-200 hover:bg-blue-50 flex items-center gap-1 flex-shrink-0 h-9"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Mở</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Link Minh Chứng */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                      Link Minh Chứng:
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={minhChung}
                        onChange={(e) => setMinhChung(e.target.value)}
                        readOnly={disableAdminFields && isWorker}
                        placeholder="https://chat.zalo.me/..."
                        aria-label="Đường link minh chứng"
                        className="bg-white dark:bg-slate-900 rounded-xl font-semibold text-xs text-slate-800 dark:text-slate-200 h-9"
                      />
                      {minhChung && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(formatURL(minhChung), "_blank")}
                          aria-label="Mở link minh chứng"
                          className="rounded-xl px-2.5 font-bold text-purple-700 dark:text-purple-300 border-purple-200 hover:bg-purple-50 flex items-center gap-1 flex-shrink-0 h-9"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>Mở</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ô Nội Dung Phản Hồi */}
                {renderRichInputField(
                  "userFb",
                  "Nội dung Phản hồi / Giải trình",
                  userFb,
                  setUserFb,
                  false,
                  "Nhập nội dung giải trình hoặc dán link phản hồi...",
                  3,
                  "blue"
                )}

                {/* Ô Ghi Chú Chung (Note) */}
                {renderRichInputField(
                  "note",
                  "Ghi chú (Note chung)",
                  note,
                  setNote,
                  false,
                  "Ghi chú thêm về đề này...",
                  2,
                  "slate"
                )}
              </div>

              {/* CỘT PHẢI: KHU VỰC BẮT LỖI QC */}
              <div className="space-y-3 bg-rose-50/40 dark:bg-rose-950/20 p-3.5 rounded-2xl border border-rose-100/90 dark:border-rose-900/60 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-rose-200/60 dark:border-rose-800 pb-2">
                    <h3 className="text-xs sm:text-sm font-extrabold text-rose-800 dark:text-rose-300 uppercase tracking-wider flex items-center gap-2">
                      <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span>Khu vực Bắt lỗi (QC)</span>
                    </h3>
                    {disableQCFields && (
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100/70 dark:bg-rose-950 px-2 py-0.5 rounded-md">
                        Chỉ đọc
                      </span>
                    )}
                  </div>

                  {/* Lỗi lần 1 */}
                  {renderRichInputField(
                    "loi1",
                    "Lỗi lần 1",
                    loi1,
                    setLoi1,
                    disableQCFields,
                    disableQCFields ? "Chưa ghi nhận lỗi lần 1" : "Nội dung lỗi lần 1...",
                    2,
                    "rose"
                  )}

                  {/* Lỗi lần 2 */}
                  {renderRichInputField(
                    "loi2",
                    "Lỗi lần 2",
                    loi2,
                    setLoi2,
                    disableQCFields,
                    disableQCFields ? "Chưa ghi nhận lỗi lần 2" : "Nội dung lỗi lần 2...",
                    2,
                    "rose"
                  )}

                  {/* Lỗi lần 3 */}
                  {renderRichInputField(
                    "loi3",
                    "Lỗi lần 3",
                    loi3,
                    setLoi3,
                    disableQCFields,
                    disableQCFields ? "Chưa ghi nhận lỗi lần 3" : "Nội dung lỗi lần 3...",
                    2,
                    "rose"
                  )}

                  {/* Phản hồi của QC */}
                  {renderRichInputField(
                    "qcFb",
                    "Phản hồi của QC",
                    qcFb,
                    setQcFb,
                    disableQCFields,
                    disableQCFields ? "Chưa có phản hồi từ QC" : "QC phản hồi thêm cho nhân sự...",
                    2,
                    "rose"
                  )}
                </div>

                {/* Nút Gửi Email Thông Báo Riêng Cho QC / Admin */}
                {!isWorker && (
                  <div className="pt-2 border-t border-rose-200/60 dark:border-rose-800">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleOpenDirectGmail}
                      disabled={!workerEmail}
                      aria-label={`Gửi email thông báo cho bạn ${doerName}`}
                      className="w-full rounded-xl bg-white dark:bg-slate-800 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-300 hover:bg-rose-100 font-extrabold text-xs flex items-center justify-center gap-2 py-2 shadow-2xs h-9.5"
                    >
                      <Mail className="w-4 h-4 text-rose-600" />
                      <span>Gửi tới mail Nội Dung làm</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* HÀNG NÚT HÀNH ĐỘNG CỐ ĐỊNH Ở ĐÁY DIALOG (LUÔN NHÌN THẤY 100% TRÊN MỌI THIẾT BỊ) */}
          <div className="p-3 sm:p-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 sm:gap-3 flex-shrink-0 z-30 shadow-lg">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 sm:flex-none flex-wrap">
              <Button
                type="submit"
                disabled={isSaving}
                aria-label="Lưu thông tin chi tiết đề bài"
                className="bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-black text-xs sm:text-sm px-5 py-2 h-10 rounded-xl shadow-md flex items-center justify-center gap-2 flex-1 sm:flex-none"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Lưu Thông Tin</span>
              </Button>

              {/* Checkbox Thông Báo dành cho Bạn làm nội dung */}
              {isWorker && (
                <label className="flex items-center gap-2 cursor-pointer select-none bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100/80 dark:hover:bg-blue-900/40 px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-800 transition flex-1 sm:flex-none">
                  <input
                    type="checkbox"
                    checked={shouldNotify}
                    onChange={(e) => setShouldNotify(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-bold text-blue-900 dark:text-blue-200 whitespace-nowrap">
                    Báo lại cho QC
                  </span>
                </label>
              )}

              {/* Checkbox Thông Báo dành cho QC & Admin */}
              {!isWorker && (
                <label className="flex items-center gap-2 cursor-pointer select-none bg-purple-50/80 dark:bg-purple-950/40 hover:bg-purple-100/80 dark:hover:bg-purple-900/40 px-3 py-2 rounded-xl border border-purple-200 dark:border-purple-800 transition flex-1 sm:flex-none">
                  <input
                    type="checkbox"
                    checked={shouldNotify}
                    onChange={(e) => setShouldNotify(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-bold text-purple-900 dark:text-purple-200 whitespace-nowrap">
                    Báo cho Bạn làm Nội Dung
                  </span>
                </label>
              )}
            </div>

            {!isWorker && (
              <div className="flex items-center gap-2 flex-1 sm:flex-none justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleStatusChange("PASS")}
                  disabled={isUpdatingStatus}
                  aria-label="Duyệt Pass cho đề bài này"
                  className="rounded-xl border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 font-black text-xs sm:text-sm px-4 py-2 h-10 flex-1 sm:flex-none flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Duyệt Pass</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleStatusChange("WRONG")}
                  disabled={isUpdatingStatus}
                  aria-label="Đánh dấu QC Sai cho đề bài này"
                  className="rounded-xl border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/40 hover:bg-amber-100 font-black text-xs sm:text-sm px-4 py-2 h-10 flex-1 sm:flex-none flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <XCircle className="w-4 h-4 text-amber-600" />
                  <span>QC Sai</span>
                </Button>
              </div>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
