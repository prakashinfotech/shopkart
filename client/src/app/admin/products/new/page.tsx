'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package } from 'lucide-react';
import ProductForm, { type ProductFormData } from '@/components/admin/ProductForm';

export default function AddProductPage() {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleSubmit(form: ProductFormData) {
    setLoading(true);
    setError('');
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
      form.files.forEach(file => fd.append('images', file));

      const token = localStorage.getItem('token');
      const res   = await fetch('/api/admin/products', {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        // Do NOT set Content-Type — browser sets it (with boundary) for FormData
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create product');
      router.push('/admin/products');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
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
          <h1 className="text-xl font-bold text-gray-900">Add New Product</h1>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6">
        <ProductForm
          submitLabel="Create Product"
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
}
