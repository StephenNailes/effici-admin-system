import MainLayout from '@/layouts/mainlayout';
import { Megaphone, ArrowLeft, Save } from 'lucide-react';
import { useState } from 'react';
import { router, useForm } from '@inertiajs/react';

interface Announcement {
  id: number;
  title: string;
  date: string;
  description: string;
  created_by: string;
  user_id: number;
}

interface EditAnnouncementProps {
  announcement: Announcement;
}

export default function EditAnnouncement({ announcement }: EditAnnouncementProps) {
  const { data, setData, put, processing, errors, reset } = useForm({
    title: announcement.title,
    date: announcement.date,
    description: announcement.description,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(`/announcements/${announcement.id}`, {
      onSuccess: () => {
        router.visit('/announcements');
      }
    });
  };

  return (
    <MainLayout>
      <div className="p-6 font-poppins">
        <button
          onClick={() => router.visit('/announcements')}
          className="flex items-center gap-2 text-gray-600 hover:text-red-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Announcements
        </button>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-red-600 flex items-center justify-center gap-2">
            <Megaphone className="w-8 h-8" />
            Edit Announcement
          </h1>
          <p className="text-gray-500 mt-2">Update the announcement details</p>
        </div>

        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 border">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Announcement Title *
              </label>
              <input
                type="text"
                value={data.title}
                onChange={(e) => setData('title', e.target.value)}
                placeholder="Enter announcement title"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-black outline-none"
                required
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* Date Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Announcement Date *
              </label>
              <input
                type="date"
                value={data.date}
                onChange={(e) => setData('date', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-black outline-none"
                required
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">{errors.date}</p>
              )}
            </div>

            {/* Description Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Announcement Description *
              </label>
              <textarea
                value={data.description}
                onChange={(e) => setData('description', e.target.value)}
                placeholder="Describe the announcement details..."
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-vertical text-black outline-none"
                required
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.visit('/announcements')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Update Announcement
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}