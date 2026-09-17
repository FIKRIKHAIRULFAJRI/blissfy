'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { ImageUploader } from '@/components/ImageUploader';

export default function HomepageSettingsPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingBanner, setIsAddingBanner] = useState(false);

  // New Banner Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [desktopImageUrl, setDesktopImageUrl] = useState('');
  const [mobileImageUrl, setMobileImageUrl] = useState('');
  const [targetLink, setTargetLink] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [s, b] = await Promise.all([
        apiClient.get<any[]>('/v1/admin/homepage/sections'),
        apiClient.get<any[]>('/v1/admin/homepage/banners')
      ]);
      setSections(s);
      setBanners(b);
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = async (id: string, isActive: boolean) => {
    await apiClient.patch(`/v1/admin/homepage/sections/${id}`, { is_active: !isActive });
    setSections(sections.map(s => s.id === id ? { ...s, is_active: !isActive } : s));
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/v1/admin/homepage/banners', {
        title,
        subtitle,
        desktopImageUrl,
        mobileImageUrl: mobileImageUrl || desktopImageUrl,
        targetLink,
        isActive: true,
      });
      setIsAddingBanner(false);
      setTitle('');
      setSubtitle('');
      setDesktopImageUrl('');
      setMobileImageUrl('');
      setTargetLink('');
      loadData();
    } catch (err) {
      console.error('Failed to create banner', err);
      alert('Failed to create banner');
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Homepage Settings</h1>
      
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Display Sections</h2>
        <div className="space-y-4">
          {sections.map(section => (
            <div key={section.id} className="flex items-center justify-between p-3 border rounded">
              <span>{section.section_type.toUpperCase().replace('_', ' ')}</span>
              <button 
                onClick={() => toggleSection(section.id, section.is_active)}
                className={`px-4 py-1 rounded text-white ${section.is_active ? 'bg-green-500' : 'bg-gray-400'}`}
              >
                {section.is_active ? 'Active' : 'Inactive'}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Hero Banners</h2>
        <div className="space-y-4">
          {banners.map(banner => (
            <div key={banner.id} className="p-4 border rounded flex items-center justify-between">
              <div>
                <img src={banner.desktop_image_url || banner.desktopImageUrl} alt="" className="h-20 w-32 object-cover rounded mb-2" />
                <div className="font-medium">{banner.title}</div>
                <div className="text-sm text-gray-500">{banner.subtitle}</div>
              </div>
            </div>
          ))}

          {isAddingBanner ? (
            <form onSubmit={handleCreateBanner} className="border p-4 rounded bg-gray-50 space-y-4">
              <h3 className="font-semibold">Add New Hero Banner</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Subtitle</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Target Link</label>
                <input
                  type="text"
                  value={targetLink}
                  onChange={(e) => setTargetLink(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="/products"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Desktop Image</label>
                {desktopImageUrl && <img src={desktopImageUrl} alt="Preview" className="h-20 object-cover my-2 rounded" />}
                <ImageUploader onUploadComplete={(url) => setDesktopImageUrl(url)} folder="blissfy/banners" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mobile Image (Opsional)</label>
                {mobileImageUrl && <img src={mobileImageUrl} alt="Preview" className="h-20 object-cover my-2 rounded" />}
                <ImageUploader onUploadComplete={(url) => setMobileImageUrl(url)} folder="blissfy/banners" />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingBanner(false)}
                  className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Banner
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingBanner(true)}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:bg-gray-50"
            >
              + Add New Banner
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
