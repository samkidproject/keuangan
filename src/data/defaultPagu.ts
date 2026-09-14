import { SatkerPagu } from '../types';

export const DEFAULT_SATKER_PAGU: SatkerPagu[] = [
  {
    satkerName: 'Kejati Lampung',
    paguAnggaran: 0,
    tahunAnggaran: 2026,
    keterangan: 'Pagu DIPA Kejaksaan Tinggi Lampung TA 2026'
  },
  {
    satkerName: 'Kejari Bandar Lampung',
    paguAnggaran: 0,
    tahunAnggaran: 2026,
    keterangan: 'Pagu DIPA Kejari Bandar Lampung TA 2026'
  },
  {
    satkerName: 'Kejari Metro',
    paguAnggaran: 0,
    tahunAnggaran: 2026,
    keterangan: 'Pagu DIPA Kejari Metro TA 2026'
  },
  {
    satkerName: 'Kejari Lampung Selatan',
    paguAnggaran: 0,
    tahunAnggaran: 2026,
    keterangan: 'Pagu DIPA Kejari Lampung Selatan TA 2026'
  },
  {
    satkerName: 'Kejari Lampung Tengah',
    paguAnggaran: 0,
    tahunAnggaran: 2026,
    keterangan: 'Pagu DIPA Kejari Lampung Tengah TA 2026'
  },
  {
    satkerName: 'Kejari Lampung Timur',
    paguAnggaran: 0,
    tahunAnggaran: 2026,
    keterangan: 'Pagu DIPA Kejari Lampung Timur TA 2026'
  },
  {
    satkerName: 'Kejari Lampung Utara',
    paguAnggaran: 0,
    tahunAnggaran: 2026,
    keterangan: 'Pagu DIPA Kejari Lampung Utara TA 2026'
  },
  {
    satkerName: 'Kejari Way Kanan',
    paguAnggaran: 0,
    tahunAnggaran: 2026,
    keterangan: 'Pagu DIPA Kejari Way Kanan TA 2026'
  },
  {
    satkerName: 'Kejari Tulang Bawang',
    paguAnggaran: 0,
    tahunAnggaran: 2026,
    keterangan: 'Pagu DIPA Kejari Tulang Bawang TA 2026'
  },
  {
    satkerName: 'Kejari Mesuji',
    paguAnggaran: 0,
    tahunAnggaran: 2026,
    keterangan: 'Pagu DIPA Kejari Mesuji TA 2026'
  },
  {
    satkerName: 'Kejari Tulang Bawang Barat',
    paguAnggaran: 0,
    tahunAnggaran: 2026,
    keterangan: 'Pagu DIPA Kejari Tulang Bawang Barat TA 2026'
  },
  {
    satkerName: 'Kejari Tanggamus',
    paguAnggaran: 0,
    tahunAnggaran: 2026,
    keterangan: 'Pagu DIPA Kejari Tanggamus TA 2026'
  },
  {
    satkerName: 'Kejari Pringsewu',
    paguAnggaran: 0,
    tahunAnggaran: 2026,
    keterangan: 'Pagu DIPA Kejari Pringsewu TA 2026'
  },
  {
    satkerName: 'Kejari Pesawaran',
    paguAnggaran: 0,
    tahunAnggaran: 2026,
    keterangan: 'Pagu DIPA Kejari Pesawaran TA 2026'
  },
  {
    satkerName: 'Kejari Lampung Barat',
    paguAnggaran: 0,
    tahunAnggaran: 2026,
    keterangan: 'Pagu DIPA Kejari Lampung Barat TA 2026'
  },
  {
    satkerName: 'Cabjari Bandar Lampung di Pelabuhan Panjang',
    paguAnggaran: 0,
    tahunAnggaran: 2026,
    keterangan: 'Pagu DIPA Cabjari Panjang TA 2026'
  },
  {
    satkerName: 'Cabjari Lampung Barat di Krui',
    paguAnggaran: 0,
    tahunAnggaran: 2026,
    keterangan: 'Pagu DIPA Cabjari Krui TA 2026'
  },
  {
    satkerName: 'Cabjari Tanggamus di Talang Padang',
    paguAnggaran: 0,
    tahunAnggaran: 2026,
    keterangan: 'Pagu DIPA Cabjari Talang Padang TA 2026'
  }
];

export const getDefaultPaguMap = (): Record<string, number> => {
  const map: Record<string, number> = {};
  DEFAULT_SATKER_PAGU.forEach(p => {
    map[p.satkerName] = 0;
  });
  return map;
};
