import { SubmissionItem } from '../types';

export const SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/19fDaIo47UDzbI76ly-d6a9vXkY6eHBLEOZj9_t6zwR4/edit?usp=sharing";
export const SPREADSHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/19fDaIo47UDzbI76ly-d6a9vXkY6eHBLEOZj9_t6zwR4/gviz/tq?tqx=out:csv";

export const INITIAL_SUBMISSIONS: SubmissionItem[] = [
  {
    id: "sub-sheet-1",
    submissionId: "7298c5b3-21e7-4036-b83b-9bd0ee41b310",
    submissionTime: "2026-07-27 7:48:21",
    satker: "KN Bandar Lampung",
    bidang: "Intelijen",
    fileUrl: "https://prod-fillout-oregon-s3.s3.us-west-2.amazonaws.com/orgid-783562/flowpublicid-rHpC47DCjJus/a68000e7-0337-4810-a25c-58e46b2bd406-ZGowhMqERtwO5nWiBOBPAbpcgUtgPMgySTnOOKTwSrqZPmhj8GrF3faZmfYDOr4EwhOQAPDxZwuAHEaKGJFPbWeN1L7FeRslD5p/B-5199-Permohonan-Persetujuan-Up--Melampaui-Besaran.pdf",
    fileName: "B-5199-Permohonan-Persetujuan-Up--Melampaui-Besaran.pdf",
    status: "direkomendasikan",
    checklist: {
      suratPermohonan: true,
      rincianUP: true,
      sptjm: true,
      matriksAkun: true,
      softcopyPdf: true,
    },
    auditorRecommendation: "Direkomendasikan disetujui penuh. Seluruh dokumen permohonan telah terverifikasi lengkap dan sesuai Permenkeu BA BUN.",
    auditorNotes: "Pemeriksaan fisik PDF dan lampiran dinyatakan sah dan lengkap.",
    auditorName: "Bpk. Hendra S., S.E., M.Si (Auditor Utama)",
    verifiedAt: "2026-07-27 08:15:00",
    financeStatus: "Siap Pencairan SP2D",
    financeNotes: "Verifikasi auditor telah diterima. Berkas diproses ke tahap pencairan KPPN.",
    financeProcessedAt: "2026-07-27 08:30:00",
    history: [
      {
        id: "log-1",
        timestamp: "2026-07-27 07:48:21",
        userRole: "keuangan",
        userName: "Sistem Google Sheets",
        action: "Pengajuan Diterima dari Spreadsheet Online",
        note: "Data otomatis tersinkronkan dari Google Sheets Sub Bagian Keuangan"
      },
      {
        id: "log-2",
        timestamp: "2026-07-27 08:15:00",
        userRole: "auditor",
        userName: "Bpk. Hendra S. (Admin Auditor)",
        action: "Pemeriksaan Selesai & Berkas Direkomendasikan",
        note: "Checklist 5/5 terpenuhi. Catatan: Seluruh syarat UP Melampaui Besaran terpenuhi."
      },
      {
        id: "log-3",
        timestamp: "2026-07-27 08:30:00",
        userRole: "keuangan",
        userName: "Ibu Rina W. (Admin Keuangan)",
        action: "Pembaruan Status Keuangan",
        note: "Disetujui untuk proses penandatanganan SP2D BA BUN."
      }
    ],
    source: "google_sheets"
  }
];

// Helper to parse CSV from Google Sheets output
export function parseGoogleSheetsCSV(csvText: string): Partial<SubmissionItem>[] {
  try {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) return [];

    const items: Partial<SubmissionItem>[] = [];
    
    // Simple CSV row parser handling quotes
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      if (row.length >= 4) {
        const subId = row[0]?.replace(/"/g, '') || `sheet-${Date.now()}-${i}`;
        const subTime = row[1]?.replace(/"/g, '') || new Date().toISOString().replace('T', ' ').slice(0, 19);
        const satker = row[2]?.replace(/"/g, '') || 'Satker BA BUN';
        const bidang = row[3]?.replace(/"/g, '') || 'Keuangan';
        const fileUrl = row[4]?.replace(/"/g, '') || '';
        
        let fileName = "Dokumen_Pengajuan_BA_BUN.pdf";
        if (fileUrl) {
          const parts = fileUrl.split('/');
          const lastPart = parts[parts.length - 1];
          if (lastPart) {
            fileName = decodeURIComponent(lastPart);
          }
        }

        items.push({
          submissionId: subId,
          submissionTime: subTime,
          satker,
          bidang,
          fileUrl,
          fileName,
          source: 'google_sheets'
        });
      }
    }

    return items;
  } catch (err) {
    console.error("Failed to parse Google Sheets CSV:", err);
    return [];
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
}
