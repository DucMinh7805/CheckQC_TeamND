export type UserRole = 'WORKER' | 'QC' | 'ADMIN';

export interface User {
  name: string;
  email: string;
  pass: string;
  role: UserRole | string;
}

export interface TaskItem {
  row_index: number;
  "ID/ tháng"?: string;
  "ID/tháng"?: string;
  "Thời gian"?: string;
  "Tên đề"?: string;
  "Ai làm"?: string;
  "QC"?: string;
  "QC done"?: string | boolean;
  "Link sản phẩm"?: string;
  "Minh chứng"?: string;
  "Lỗi lần 1"?: string;
  "Lỗi lần 2"?: string;
  "Lỗi lần 3"?: string;
  "Nội Dung Phản hồi"?: string;
  "Phản hồi của QC"?: string;
  "Note"?: string;
  "Số câu"?: string | number;
  [key: string]: any;
}

export type StatusCode = 'PASS' | 'WRONG' | 'ERROR' | 'PENDING';

export interface StatusObj {
  code: StatusCode;
  label: string;
  style: string;
  iconName: 'CheckCircle2' | 'XCircle' | 'AlertTriangle' | 'Clock';
}

export type TabFilterType = 'ALL' | 'PENDING' | 'ERROR' | 'WRONG' | 'PASS';

export type AdvancedFilterType = 'ALL' | 'MY_TASKS' | 'MULTI_ERROR' | 'PENDING_3_DAYS';

export type ThemeAccent = 'blue' | 'indigo' | 'purple' | 'emerald' | 'rose' | 'amber';

export interface CreateTaskPayload {
  action: 'create';
  id_thang: string;
  task_title: string;
  so_cau: number | string;
  worker_name: string;
  worker_email?: string;
  qc_name: string;
  qc_done: string;
  link_sp: string;
  minh_chung: string;
  loi_1: string;
  loi_2: string;
  loi_3: string;
  nd_phan_hoi: string;
  note: string;
  send_email?: boolean;
}

export interface SaveTaskPayload {
  row_index: number;
  task_title?: string;
  so_cau?: number | string;
  worker_name?: string;
  worker_email?: string;
  qc_name?: string;
  link_sp?: string;
  minh_chung?: string;
  loi_1?: string;
  loi_2?: string;
  loi_3?: string;
  nd_phan_hoi?: string;
  qc_phan_hoi?: string;
  note?: string;
  send_email?: boolean;
}

export interface UpdateStatusPayload {
  row_index: number;
  qc_done: '✅' | '❌' | string;
  task_title?: string;
  worker_name?: string;
  worker_email?: string;
  send_email?: boolean;
}

export interface WorkerStatItem {
  workerName: string;
  totalTasks: number;
  totalQuestions: number;
  passCount: number;
  errorCount: number;
  wrongCount: number;
  pendingCount: number;
  loi1Count: number;
  loi2Count: number;
  loi3Count: number;
  totalErrors: number;
  passRate: number;
}

export interface QCStatItem {
  qcName: string;
  totalCheckedTasks: number;
  totalQuestionsChecked: number;
  totalErrorsFound: number;
  totalPassed: number;
  passRate: number;
}

export interface AppNotification {
  id: string;
  rowIndex: number;
  taskTitle: string;
  sender: string;
  senderLabel?: string;
  type: 'ERROR' | 'PASS' | 'WRONG' | 'FEEDBACK' | 'NEW_TASK';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}
