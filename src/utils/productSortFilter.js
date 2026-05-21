import { sortByBestSellers } from '@/utils/productBestseller';

export const SORT_OPTIONS = [
  { id: 'bestseller', label: 'En çok satanlar' },
  { id: 'price_asc', label: 'Fiyat: düşükten yükseğe' },
  { id: 'price_desc', label: 'Fiyat: yüksekten düşüğe' },
  { id: 'rating', label: 'En yüksek puan' },
  { id: 'name', label: 'İsme göre (A-Z)' },
];

export function sortProducts(products, sortKey = 'bestseller') {
  const list = Array.isArray(products) ? [...products] : [];
  switch (sortKey) {
    case 'price_asc':
      return list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    case 'price_desc':
      return list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    case 'rating':
      return list.sort((a, b) => {
        const ra = Number(a.ratingAvg) || 0;
        const rb = Number(b.ratingAvg) || 0;
        if (rb !== ra) return rb - ra;
        return (Number(b.reviewCount) || 0) - (Number(a.reviewCount) || 0);
      });
    case 'name':
      return list.sort((a, b) =>
        String(a.name || '').localeCompare(String(b.name || ''), 'tr'),
      );
    case 'bestseller':
    default:
      return sortByBestSellers(list);
  }
}
