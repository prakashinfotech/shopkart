'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, Loader2 } from 'lucide-react';
import ProductForm, { type ProductFormData } from '@/components/admin/ProductForm';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyProduct = any;

function productToForm(p: AnyProduct): Partial<ProductFormData> {
  return {
    name:           p.name           ?? '',
    brand:          p.brand          ?? '',
    category:       p.category?._id  ?? p.category ?? '',
    description:    p.description    ?? '',
    price:          String(p.price   ?? ''),
    mrp:            String(p.mrp     ?? ''),
    stock:          String(p.stock   ?? 0),
    isFeatured:     Boolean(p.isFeatured),
    files:          [],
    existingImages: p.images ?? [],
    variants:       (p.variants ?? []).map((v: AnyProduct) => ({
      type:  v.type  ?? '',
      value: v.value ?? '',
      price: v.price != null ? String(v.price) : '',
      mrp:   v.mrp   != null ? String(v.mrp)   : '',
      stock: v.stock != null ? String(v.stock)  : '',
    })),
  };
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id     = params?.id as string;

  const [initial,  setInitial]  = useState<Partial<ProductFormData> | undefined>(undefined);
  const [fetching, setFetching] = useState(true);
  const [fetchErr, setFetchErr] = useState('');
  const [saving,   setSaving]   = useState(false);
  const [saveErr,  setSaveErr]  = useState('');

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem('token');
    fetch(`/api/admin/products/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.product) setInitial(productToForm(data.product));
        else setFetchErr(data.message ?? 'Product not found');
      })
      .catch(() => setFetchErr('Failed to load product'))
      .finally(() => setFetching(false));
  }, [id]);

  async function handleSubmit(form: ProductFormData) {
    setSaving(true);
    setSaveErr('');
    try {
      const fd = new FormData();
      fd.append('name',        form.name.trim());
      fd.append('brand',       form.brand.trim());
      fd.append('category',    form.category);
      fd.append('description', form.description.trim());
      fd.append('price',       form.price);
      fd.append('mrp',         form.mrp);
      fd.append('stock',       form.stock || '0');
      fd.append('isFeatured',  String(form.isFeatured));
      fd.append('variants',    JSON.stringify(form.variants));

      if (form.files.length > 0) {
        // New files selected — upload them (replaces all images)
        form.files.forEach(file => fd.append('images', file));
      } else {
        // No new files — tell the server which existing paths to keep
        fd.append('existingImages', JSON.stringify(form.existingImages));
      }

      const token = localStorage.getItem('token');
      const res   = await fetch(`/api/admin/products/${id}`, {
        method:  'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body:    fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      router.push('/admin/products');
    } catch (err: unknown) {
      setSaveErr(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/products"
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={16} className="text-gray-600" />
        </Link>
        <div className="flex items-center gap-2">
          <Package size={20} className="text-primary" />
          <h1 className="text-xl font-bold text-gray-900">Edit Product</h1>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6">
        {fetching ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : fetchErr ? (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">
            {fetchErr}
          </div>
        ) : (
          <ProductForm
            initial={initial}
            submitLabel="Save Changes"
            onSubmit={handleSubmit}
            loading={saving}
            error={saveErr}
          />
        )}
      </div>
    </div>
  );
}
