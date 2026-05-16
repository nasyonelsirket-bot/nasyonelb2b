import SEO from '@/components/seo/SEO';
import ProductGrid from '@/components/home/ProductGrid';
import { useStore } from '@/context/StoreContext';

export default function CampaignsPage() {
  const { products } = useStore();
  const campaign = products.filter((p) => p.isCampaign);

  return (
    <>
      <SEO title="Kampanyalar" description="Kampanyalı B2B oyuncak ürünleri" path="/kampanyalar" />
      <div className="bg-gradient-to-r from-accent-gold to-accent-orange py-12">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="font-display text-3xl font-bold text-brand-950">Kampanyalar</h1>
          <p className="mt-2 text-brand-900/80">Özel toptan fiyat avantajları</p>
        </div>
      </div>
      <ProductGrid products={campaign} title="Kampanyalı Ürünler" />
    </>
  );
}
