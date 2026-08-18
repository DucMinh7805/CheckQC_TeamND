"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CreateTaskPayload } from "@/types";
import { useApp } from "@/context/AppContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  FilePlus2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Hash,
  Link2,
  AlertOctagon,
  User,
  ShieldCheck,
  Send,
  FileSpreadsheet,
  Mail,
} from "lucide-react";
import { cleanStr } from "@/lib/helpers";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    currentUser,
    listUsers,
    availableMonths,
    availableWorkers,
    availableQCs,
    selectedMonth,
    createNewTask,
  } = useApp();

  const [idThang, setIdThang] = useState<string>("");
  const [taskTitle, setTaskTitle] = useState<string>("");
  const [soCau, setSoCau] = useState<string>("");
  const [workerName, setWorkerName] = useState<string>("");
  const [qcName, setQcName] = useState<string>("");
  const [qcDone, setQcDone] = useState<string>("");
  const [linkSp, setLinkSp] = useState<string>("");
  const [minhChung, setMinhChung] = useState<string>("");
  const [loi1, setLoi1] = useState<string>("");
  const [loi2, setLoi2] = useState<string>("");
  const [loi3, setLoi3] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [sendEmail, setSendEmail] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Email của bạn Nội dung được chọn
  const workerObj = useMemo(() => {
    return listUsers.find((u) => cleanStr(u.name).toLowerCase() === cleanStr(workerName).toLowerCase());
  }, [listUsers, workerName]);

  const workerEmail = workerObj?.email || "";

  // Khởi tạo các giá trị mặc định khi mở modal
  useEffect(() => {
    if (isOpen) {
      const defaultMonth =
        selectedMonth && selectedMonth !== "ALL"
          ? selectedMonth
          : availableMonths[0] || `${new Date().getMonth() + 1}/${new Date().getFullYear()}`;
      setIdThang(defaultMonth);
      setTaskTitle("");
      setSoCau("");
      setWorkerName("");
      setQcName(currentUser?.role === "QC" || currentUser?.role === "ADMIN" ? currentUser.name : "");
      setQcDone("");
      setLinkSp("");
      setMinhChung("");
      setLoi1("");
      setLoi2("");
      setLoi3("");
      setNote("");
      setSendEmail(true);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, selectedMonth, availableMonths, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      setErrorMessage("Vui lòng nhập Tên bài!");
      return;
    }
    if (!workerName.trim()) {
      setErrorMessage("Vui lòng chọn nhân sự ở mục 'Ai làm'!");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const numericSoCau = soCau !== "" ? Math.max(0, parseInt(soCau, 10) || 0) : "";

    const payload: CreateTaskPayload & { send_email?: boolean } = {
      action: "create",
      id_thang: idThang.trim(),
      task_title: taskTitle.trim(),
      so_cau: numericSoCau,
      worker_name: workerName.trim(),
      worker_email: workerEmail,
      qc_name: qcName.trim() || currentUser?.name || "",
      qc_done: qcDone,
      link_sp: linkSp.trim(),
      minh_chung: minhChung.trim(),
      loi_1: loi1.trim(),
      loi_2: loi2.trim(),
      loi_3: loi3.trim(),
      nd_phan_hoi: "",
      note: note.trim(),
      send_email: sendEmail && !!workerEmail,
    };

    const res = await createNewTask(payload as any);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage("Đã tạo đề bài và ghi vào Google Sheets thành công!");
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setErrorMessage(res.message || "Lỗi tạo đề bài!");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100%-1rem)] sm:w-full max-w-4xl max-h-[90vh] sm:max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header: Đệm pr-12 trên mobile để không bị nút X che */}
        <DialogHeader className="p-4 sm:p-6 pr-12 sm:pr-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-500/20 flex-shrink-0">
              <FilePlus2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                Nhập đề mới
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        {/* Form Body Rộng Rãi - Bố Cục Từng Khung Từng Dòng Rõ Ràng */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white dark:bg-slate-900">
          <div className="flex-1 overflow-y-auto p-4 sm:p-7 space-y-4 sm:space-y-6 overscroll-contain">
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2.5 animate-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2.5 animate-in slide-in-from-top-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* KHUNG 1: THÔNG TIN BÀI LÀM (Tháng -> Tên bài + Số câu -> Ai làm + QC) */}
            <div className="bg-slate-50/80 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-slate-700 space-y-3.5">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>1. Thông Tin Phân Công Bài Làm</span>
              </h3>

              {/* Dòng 1: Tháng */}
              <div className="space-y-1">
                <label className="text-[11px] sm:text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <span>Tháng:</span>
                </label>
                <Select value={idThang} onValueChange={(val) => val && setIdThang(val)}>
                  <SelectTrigger className="w-full bg-white dark:bg-slate-900 rounded-xl font-bold text-xs sm:text-sm h-10">
                    <span>{idThang ? `Tháng ${idThang}` : "-- Chọn tháng --"}</span>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 shadow-xl max-h-56">
                    {availableMonths.map((m) => (
                      <SelectItem key={m} value={m} className="font-bold text-xs sm:text-sm py-2">
                        Tháng {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dòng 2: Tên bài (dài) + Số câu (kế bên) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="space-y-1 md:col-span-8">
                  <label className="text-[11px] sm:text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase">
                    Tên bài:
                  </label>
                  <Input
                    type="text"
                    placeholder="Nhập tên bài kiểm tra..."
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    aria-label="Tên bài kiểm tra"
                    className="bg-white dark:bg-slate-900 rounded-xl font-bold text-xs sm:text-sm h-10"
                    required
                  />
                </div>

                <div className="space-y-1 md:col-span-4">
                  <label className="text-[11px] sm:text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-blue-500" />
                    <span>Số câu:</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={soCau}
                    aria-label="Số lượng câu hỏi"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setSoCau("");
                      } else {
                        const num = parseInt(val, 10);
                        setSoCau(isNaN(num) ? "" : String(Math.max(0, num)));
                      }
                    }}
                    className="bg-white dark:bg-slate-900 rounded-xl font-bold text-xs sm:text-sm h-10"
                  />
                </div>
              </div>

              {/* Dòng 3: Ai làm + QC */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] sm:text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    <span>Ai làm:</span>
                  </label>
                  <Select value={workerName} onValueChange={(val) => val && setWorkerName(val)}>
                    <SelectTrigger className="w-full bg-white dark:bg-slate-900 rounded-xl font-bold text-xs sm:text-sm h-10">
                      <span>{workerName || "-- Chọn người làm --"}</span>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 shadow-xl max-h-56">
                      {availableWorkers.map((name) => (
                        <SelectItem key={name} value={name} className="font-semibold text-xs sm:text-sm py-2">
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] sm:text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                    <span>QC:</span>
                  </label>
                  <Select value={qcName} onValueChange={(val) => val && setQcName(val)}>
                    <SelectTrigger className="w-full bg-white dark:bg-slate-900 rounded-xl font-bold text-xs sm:text-sm h-10">
                      <span>{qcName || "-- Chọn QC phụ trách --"}</span>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 shadow-xl max-h-56">
                      {availableQCs.map((name) => (
                        <SelectItem key={name} value={name} className="font-semibold text-xs sm:text-sm py-2">
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* KHUNG 2: ĐƯỜNG LINK & TRẠNG THÁI */}
            <div className="bg-slate-50/80 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-slate-700 space-y-3.5">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Link2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>2. Đường Link & Trạng Thái Ban Đầu</span>
              </h3>

              {/* Dòng Link Sản Phẩm */}
              <div className="space-y-1">
                <label className="text-[11px] sm:text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-blue-500" />
                  <span>Link Sản Phẩm:</span>
                </label>
                <Input
                  type="text"
                  placeholder="https://docs.google.com/..."
                  value={linkSp}
                  onChange={(e) => setLinkSp(e.target.value)}
                  className="bg-white dark:bg-slate-900 rounded-xl font-semibold text-xs sm:text-sm h-10"
                />
              </div>

              {/* Dòng Link Minh Chứng */}
              <div className="space-y-1">
                <label className="text-[11px] sm:text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-purple-500" />
                  <span>Link Minh Chứng:</span>
                </label>
                <Input
                  type="text"
                  placeholder="https://chat.zalo.me/..."
                  value={minhChung}
                  onChange={(e) => setMinhChung(e.target.value)}
                  className="bg-white dark:bg-slate-900 rounded-xl font-semibold text-xs sm:text-sm h-10"
                />
              </div>

              {/* Dòng Trạng Thái Duyệt */}
              <div className="space-y-1">
                <label className="text-[11px] sm:text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase">
                  Trạng Thái Duyệt Ban Đầu:
                </label>
                <Select value={qcDone} onValueChange={(val) => setQcDone(val || "")}>
                  <SelectTrigger className="w-full bg-white dark:bg-slate-900 rounded-xl font-bold text-xs sm:text-sm h-10">
                    <span>
                      {qcDone === "✅"
                        ? "✅ Đã Pass"
                        : qcDone === "❌"
                        ? "❌ QC Sai"
                        : "⏳ Chờ duyệt (Chưa duyệt)"}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 shadow-xl">
                    <SelectItem value="" className="font-semibold text-xs sm:text-sm py-2">
                      ⏳ Chờ duyệt (Chưa duyệt)
                    </SelectItem>
                    <SelectItem value="✅" className="font-semibold text-xs sm:text-sm py-2 text-emerald-600">
                      ✅ Đã Pass
                    </SelectItem>
                    <SelectItem value="❌" className="font-semibold text-xs sm:text-sm py-2 text-amber-600">
                      ❌ QC Sai
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* KHUNG 3: GHI NHẬN LỖI */}
            <div className="bg-rose-50/40 dark:bg-rose-950/20 p-4 sm:p-5 rounded-2xl border border-rose-100 dark:border-rose-900/60 space-y-3.5">
              <h3 className="text-xs sm:text-sm font-extrabold text-rose-800 dark:text-rose-300 uppercase tracking-wider flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>3. Ghi Nhận Lỗi Kiểm Tra & Ghi Chú</span>
              </h3>

              {/* Dòng Lỗi Lần 1 */}
              <div className="space-y-1">
                <label className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                  Lỗi Lần 1:
                </label>
                <Textarea
                  placeholder="Nội dung lỗi lần 1 (nếu có)..."
                  value={loi1}
                  onChange={(e) => setLoi1(e.target.value)}
                  rows={2}
                  className="bg-white dark:bg-slate-900 rounded-xl text-xs sm:text-sm font-semibold border-rose-200 dark:border-rose-800"
                />
              </div>

              {/* Dòng Lỗi Lần 2 */}
              <div className="space-y-1">
                <label className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                  Lỗi Lần 2:
                </label>
                <Textarea
                  placeholder="Nội dung lỗi lần 2 (nếu có)..."
                  value={loi2}
                  onChange={(e) => setLoi2(e.target.value)}
                  rows={2}
                  className="bg-white dark:bg-slate-900 rounded-xl text-xs sm:text-sm font-semibold border-rose-200 dark:border-rose-800"
                />
              </div>

              {/* Dòng Lỗi Lần 3 */}
              <div className="space-y-1">
                <label className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                  Lỗi Lần 3:
                </label>
                <Textarea
                  placeholder="Nội dung lỗi lần 3 (nếu có)..."
                  value={loi3}
                  onChange={(e) => setLoi3(e.target.value)}
                  rows={2}
                  className="bg-white dark:bg-slate-900 rounded-xl text-xs sm:text-sm font-semibold border-rose-200 dark:border-rose-800"
                />
              </div>

              {/* Dòng Ghi Chú Chung */}
              <div className="space-y-1 pt-1">
                <label className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Ghi Chú Chung (Note):
                </label>
                <Textarea
                  placeholder="Ghi chú thêm về đề này..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="bg-white dark:bg-slate-900 rounded-xl text-xs sm:text-sm font-semibold border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            {/* Tùy chọn Gửi Email Thông Báo */}
            {workerEmail && (
              <div className="p-3.5 sm:p-4 bg-blue-50/80 dark:bg-blue-950/40 rounded-2xl border border-blue-200/80 dark:border-blue-800 flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 bg-blue-600 text-white rounded-xl flex-shrink-0 shadow-xs">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-extrabold text-blue-900 dark:text-blue-200">
                      Gửi email thông báo cho bạn Nội Dung
                    </p>
                    <p className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold truncate">
                      Gửi tới: <span className="underline">{workerEmail}</span>
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-blue-700 dark:text-blue-300 flex-shrink-0 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-700 shadow-2xs hover:bg-blue-50">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Bật gửi mail</span>
                </label>
              </div>
            )}
          </div>

          {/* Footer Cố Định Không Bị Cắt */}
          <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-end gap-2.5 sm:gap-3 flex-shrink-0 shadow-lg">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl px-4 py-2 font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-300 h-10"
            >
              Hủy
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm px-5 py-2 h-10 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu đề...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Lưu Đề Mới Vào Sheet</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
