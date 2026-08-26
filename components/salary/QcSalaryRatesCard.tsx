"use client";

/**
 * ============================================================================
 * FILE: components/salary/QcSalaryRatesCard.tsx
 * MỤC ĐÍCH: Thẻ hiển thị tóm tắt KPI và cấu hình đơn giá lương QC (câu / lỗi)
 * ============================================================================
 */

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertOctagon, ShieldCheck, Check } from "lucide-react";

interface QcSalaryRatesCardProps {
  totalQcCount: number;
  totalDoneQuestions: number;
  totalErrors: number;
  ratePerQuestion: number;
  ratePerError: number;
  isEditingRates: boolean;
  onRateQuestionChange: (val: number) => void;
  onRateErrorChange: (val: number) => void;
  onSaveRates: () => void;
}

export const QcSalaryRatesCard: React.FC<QcSalaryRatesCardProps> = ({
  totalQcCount,
  totalDoneQuestions,
  totalErrors,
  ratePerQuestion,
  ratePerError,
  isEditingRates,
  onRateQuestionChange,
  onRateErrorChange,
  onSaveRates,
}) => {
  return (
    <div className="space-y-3">
      {/* 3 Thẻ Tóm tắt KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Thẻ 1: Số nhân sự QC */}
        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold text-slate-500 uppercase block">Số Nhân Sự QC</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{totalQcCount}</span>
          </div>
        </div>

        {/* Thẻ 2: TỔNG CÂU ĐÃ DONE + Đơn giá câu */}
        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 shadow-xs flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black flex-shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase block">Tổng Câu Đã Done</span>
                <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">{totalDoneQuestions.toLocaleString("vi-VN")}</span>
              </div>
            </div>

            {!isEditingRates && (
              <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl">
                {ratePerQuestion > 0 ? `${ratePerQuestion.toLocaleString("vi-VN")} đ/câu` : "Chưa đặt giá"}
              </span>
            )}
          </div>

          {isEditingRates && (
            <div className="pt-2 border-t border-emerald-100 dark:border-emerald-900/40 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase block">
                Đơn giá / 1 câu đã check (VNĐ):
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="VD: 500"
                  value={ratePerQuestion || ""}
                  onChange={(e) => onRateQuestionChange(Math.max(0, Number(e.target.value) || 0))}
                  className="bg-emerald-50/50 dark:bg-slate-900 rounded-xl font-bold text-xs h-8 pr-7 border-emerald-200"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">đ</span>
              </div>
            </div>
          )}
        </div>

        {/* Thẻ 3: TỔNG SỐ LỖI ĐÃ CHECK + Đơn giá lỗi */}
        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-rose-200/80 dark:border-rose-900/60 shadow-xs flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 flex items-center justify-center font-black flex-shrink-0">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-rose-800 dark:text-rose-300 uppercase block">Tổng Số Lỗi Đã Check</span>
                <span className="text-lg font-black text-rose-700 dark:text-rose-400">{totalErrors.toLocaleString("vi-VN")}</span>
              </div>
            </div>

            {!isEditingRates && (
              <span className="text-xs font-black text-rose-800 dark:text-rose-300 bg-rose-100/70 dark:bg-rose-950/60 px-2.5 py-1 rounded-xl">
                {ratePerError > 0 ? `${ratePerError.toLocaleString("vi-VN")} đ/lỗi` : "Chưa đặt giá"}
              </span>
            )}
          </div>

          {isEditingRates && (
            <div className="pt-2 border-t border-rose-100 dark:border-rose-900/40 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase block">
                Đơn giá / 1 lỗi đã check (VNĐ):
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  step="500"
                  placeholder="VD: 1000"
                  value={ratePerError || ""}
                  onChange={(e) => onRateErrorChange(Math.max(0, Number(e.target.value) || 0))}
                  className="bg-rose-50/50 dark:bg-slate-900 rounded-xl font-bold text-xs h-8 pr-7 border-rose-200"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">đ</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Thanh OK Lưu Đơn Giá */}
      {isEditingRates && (
        <div className="flex items-center justify-end gap-2 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-2xl border border-amber-200 dark:border-amber-800 animate-in fade-in">
          <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 mr-auto">
            Nhập đơn giá câu và lỗi xong, bấm OK để áp dụng tính tiền vào bảng bên dưới:
          </span>
          <Button
            onClick={onSaveRates}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs h-8 px-4 flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>OK (Áp dụng & Lưu)</span>
          </Button>
        </div>
      )}
    </div>
  );
};
