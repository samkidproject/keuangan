export type UserRole = 'satker' | 'auditor' | 'keuangan';

export type VerificationStatus = 
  | 'belum_diperiksa'
  | 'sedang_diperiksa'
  | 'direkomendasikan'
  | 'perlu_perbaikan'
  | 'ditolak'
  | 'selesai_keuangan';

export interface AuditChecklist {
  suratPermohonan: boolean;
  rincianUP: boolean;
  sptjm: boolean;
  matriksAkun: boolean;
  softcopyPdf: boolean;
}

export interface HistoryLog {
  id: string;
  timestamp: string;
  userRole: UserRole;
  userName: string;
  action: string;
  note?: string;
}

export interface SatkerAccount {
  id: string;
  username: string;
  satkerName: string;
  bidangDefault?: string;
  status: 'aktif' | 'nonaktif';
  createdAt: string;
}

export interface SubmissionItem {
  id: string;
  submissionId: string;
  submissionTime: string;
  satker: string;
  bidang: string;
  fileUrl: string;
  fileName: string;
  jenisPengajuan?: string;
  nominal?: number;
  status: VerificationStatus;
  checklist: AuditChecklist;
  auditorRecommendation?: string;
  auditorNotes?: string;
  auditorName?: string;
  verifiedAt?: string;
  financeStatus?: string;
  financeNotes?: string;
  financeProcessedAt?: string;
  createdBySatkerUser?: string;
  notesFromSatker?: string;
  history: HistoryLog[];
  source: 'firebase' | 'manual' | 'satker_entry';
}

export interface FilterState {
  search: string;
  satker: string;
  bidang: string;
  status: string;
  viewMode: 'column' | 'table';
}
