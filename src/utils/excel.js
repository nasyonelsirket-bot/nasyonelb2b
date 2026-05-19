<<<<<<< HEAD
import * as XLSX from 'xlsx';
import { buildCategoriesFromProducts } from '@/utils/categories';

const COLUMN_MAP = {
  'ürün adı': 'name',
  'urun adi': 'name',
  'urun adı': 'name',
  'product name': 'name',
  name: 'name',
  'stok kodu': 'sku',
  'stok kodu': 'sku',
  sku: 'sku',
  stok: 'sku',
  kategori: 'category',
  category: 'category',
  fiyat: 'price',
  price: 'price',
  'görsel url': 'image',
  'gorsel url': 'image',
  image: 'image',
  görsel: 'image',
  açıklama: 'description',
  aciklama: 'description',
  description: 'description',
  'minimum sipariş': 'minOrder',
  'minimum siparis': 'minOrder',
  minorder: 'minOrder',
  'min order': 'minOrder',
};

function normalizeHeader(h) {
  return String(h || '')
    .trim()
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        const products = rows
          .map((row, idx) => {
            const mapped = {};
            Object.entries(row).forEach(([key, val]) => {
              const norm = normalizeHeader(key);
              const field = COLUMN_MAP[norm] || COLUMN_MAP[key.toLowerCase?.()] ;
              if (field) mapped[field] = val;
            });

            if (!mapped.name) return null;

            return {
              id: `excel-${Date.now()}-${idx}`,
              name: String(mapped.name).trim(),
              sku: String(mapped.sku || `SKU-${idx + 1}`).trim(),
              category: String(mapped.category || 'Genel').trim(),
              price: parseFloat(String(mapped.price).replace(',', '.')) || 0,
              image: String(mapped.image || '').trim(),
              description: String(mapped.description || '').trim(),
              isNew: false,
              isCampaign: false,
              minOrder: parseInt(mapped.minOrder, 10) || 1,
            };
          })
          .filter(Boolean);

        const categories = buildCategoriesFromProducts(products).map((c, i) => ({
          ...c,
          id: `cat-excel-${i}`,
        }));

        resolve({ products, categories });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Dosya okunamadı'));
    reader.readAsArrayBuffer(file);
  });
}
=======
import * as XLSX from 'xlsx';
import { buildCategoriesFromProducts } from '@/utils/categories';

const COLUMN_MAP = {
  'ürün adı': 'name',
  'urun adi': 'name',
  'urun adı': 'name',
  'product name': 'name',
  name: 'name',
  'stok kodu': 'sku',
  'stok kodu': 'sku',
  sku: 'sku',
  stok: 'sku',
  kategori: 'category',
  category: 'category',
  fiyat: 'price',
  price: 'price',
  'görsel url': 'image',
  'gorsel url': 'image',
  image: 'image',
  görsel: 'image',
  açıklama: 'description',
  aciklama: 'description',
  description: 'description',
  'minimum sipariş': 'minOrder',
  'minimum siparis': 'minOrder',
  minorder: 'minOrder',
  'min order': 'minOrder',
};

function normalizeHeader(h) {
  return String(h || '')
    .trim()
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        const products = rows
          .map((row, idx) => {
            const mapped = {};
            Object.entries(row).forEach(([key, val]) => {
              const norm = normalizeHeader(key);
              const field = COLUMN_MAP[norm] || COLUMN_MAP[key.toLowerCase?.()] ;
              if (field) mapped[field] = val;
            });

            if (!mapped.name) return null;

            return {
              id: `excel-${Date.now()}-${idx}`,
              name: String(mapped.name).trim(),
              sku: String(mapped.sku || `SKU-${idx + 1}`).trim(),
              category: String(mapped.category || 'Genel').trim(),
              price: parseFloat(String(mapped.price).replace(',', '.')) || 0,
              image: String(mapped.image || '').trim(),
              description: String(mapped.description || '').trim(),
              isNew: false,
              isCampaign: false,
              minOrder: parseInt(mapped.minOrder, 10) || 1,
            };
          })
          .filter(Boolean);

        const categories = buildCategoriesFromProducts(products).map((c, i) => ({
          ...c,
          id: `cat-excel-${i}`,
        }));

        resolve({ products, categories });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Dosya okunamadı'));
    reader.readAsArrayBuffer(file);
  });
}
>>>>>>> 4d1702da50b32d1e25ef371646e044a4b268a938
