import SEO from '@/components/seo/SEO';
import ProductGrid from '@/components/home/ProductGrid';
import { useStore } from '@/context/StoreContext';

export default function NewProductsPage() {
  const { products } = useStore();
  const newest = products.filter((p) => p.isNew);

  return (
    <>
      <SEO title="Yeni Ürünler" description="Yeni eklenen B2B oyuncak ürünleri" path="/yeni-urunler" />
      <div className="bg-brand-900 text-white py-12">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="font-display text-3xl font-bold">Yeni Ürünler</h1>
          <p className="mt-2 text-brand-200">Kataloğa yeni eklenen ürünler</p>
        </div>
      </div>
      <ProductGrid products={newest} title="Yeni Eklenenler" />
    </>
  );
}
