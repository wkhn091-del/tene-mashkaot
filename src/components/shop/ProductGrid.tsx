import type { Product, Promotion } from '@/lib/types';
import { ProductCard } from './ProductCard';

export function ProductGrid({ products, promotions, locale }: { products: Product[]; promotions: Promotion[]; locale: string }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <li key={product._id} className="flex">
          <div className="w-full">
            <ProductCard product={product} promotions={promotions} locale={locale} priority={index < 4} />
          </div>
        </li>
      ))}
    </ul>
  );
}
