'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface ImageUploaderProps {
  onUploadComplete: (url: string) => void;
  folder?: string;
}

export function ImageUploader({ onUploadComplete, folder = 'blissfy/products' }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      // 1. Get signature from API
      const { signature, timestamp, cloudName, apiKey, folder: signedFolder } = 
        await apiClient.post<{ signature: string; timestamp: number; cloudName: string; apiKey: string; folder: string }>('/v1/admin/uploads/sign', { folder });

      // 2. Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp.toString());
      formData.append('api_key', apiKey);
      formData.append('folder', signedFolder);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.secure_url) {
        onUploadComplete(data.secure_url);
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error('Upload error', err);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      {uploading && <p className="text-sm text-blue-600 mt-1">Uploading...</p>}
    </div>
  );
}
