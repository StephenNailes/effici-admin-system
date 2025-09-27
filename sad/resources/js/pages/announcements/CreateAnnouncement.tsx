import MainLayout from '@/layouts/mainlayout';
import { Megaphone, ArrowLeft, Save, AlertCircle, Link, Upload, X, ImageIcon } from 'lucide-react';
import RedDatePicker from '@/components/RedDatePicker';
import { useState, useMemo } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import PostCard from '@/components/PostCard';

export default function CreateAnnouncement() {
  const { data, setData, post, processing, errors, reset } = useForm({
    title: '',
    date: '',
    description: '',
    images: [] as File[],
  });

  const [isFormValid, setIsFormValid] = useState(false);
  const [showURLInfo, setShowURLInfo] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const { auth } = usePage<any>().props;

  // Live preview post object
  const previewPost = useMemo(() => {
    const role = (auth?.user?.role || 'admin_assistant') as 'student' | 'admin_assistant' | 'dean';
    const user = auth?.user || {};
    const images = imagePreviews.map((url, index) => ({
      id: index,
      url,
      original_name: (data.images as File[])[index]?.name || `image-${index + 1}`,
      width: 0,
      height: 0,
      order: index,
    }));

    return {
      id: 0,
      title: data.title || '(Untitled announcement)',
      description: data.description || '',
      created_by: role,
      user: {
        id: user.id || 0,
        first_name: user.first_name || 'Admin',
        last_name: user.last_name || 'Assistant',
        profile_picture: user.profile_picture || undefined,
      },
      images,
      created_at: new Date().toISOString(),
    } as any;
  }, [auth, data.title, data.description, data.images, imagePreviews]);

  // Check form validity
  const checkFormValidity = () => {
    const isValid = data.title.trim() !== '' && 
                    data.date !== '' && 
                    data.description.trim() !== '';
    setIsFormValid(isValid);
  };

  // Update form validation on data changes
  const handleDataChange = (field: string, value: string) => {
    setData(field as any, value);
    setTimeout(checkFormValidity, 0);
  };

  // Handle image uploads
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 5 images total
    const currentImages = data.images || [];
    const availableSlots = 5 - currentImages.length;
    const newFiles = files.slice(0, availableSlots);

    if (files.length > availableSlots && availableSlots > 0) {
      alert(`You can only add ${availableSlots} more image(s). Maximum is 5 images total.`);
    } else if (availableSlots === 0) {
      alert('Maximum of 5 images allowed. Please remove some images first.');
      return;
    }

    // Validate file types and sizes
    const validFiles = newFiles.filter(file => {
      const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      
      if (!isValidType) {
        alert(`${file.name} is not a valid image type. Please use JPEG, PNG, or GIF.`);
        return false;
      }
      if (!isValidSize) {
        alert(`${file.name} is too large. Maximum file size is 10MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      const updatedImages = [...currentImages, ...validFiles];
      setData('images', updatedImages);

      // Create preview URLs
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    const updatedImages = data.images.filter((_, i) => i !== index);
    setData('images', updatedImages);

    // Clean up preview URLs
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index);
    URL.revokeObjectURL(imagePreviews[index]); // Cleanup memory
    setImagePreviews(updatedPreviews);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    post('/announcements', {
      forceFormData: true,
      onSuccess: () => {
        // Clean up preview URLs
        imagePreviews.forEach(url => URL.revokeObjectURL(url));
        reset();
        setImagePreviews([]);
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
            Create New Announcement
          </h1>
          <p className="text-gray-500 mt-2">Share important news and updates with the community</p>
        </div>

        {/* Two-column layout: form left, preview right */}
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left: Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                Announcement Title *
                <span className="text-xs text-gray-400">({data.title.length}/100)</span>
              </label>
              <input
                type="text"
                value={data.title}
                onChange={(e) => handleDataChange('title', e.target.value)}
                placeholder="Enter a clear, attention-grabbing announcement title"
                maxLength={100}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-black outline-none ${
                  errors.title 
                    ? 'border-red-300 bg-red-50' 
                    : data.title.trim() 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-300'
                }`}
                required
              />
              {errors.title ? (
                <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.title}
                </div>
              ) : data.title.trim() && (
                <p className="text-green-600 text-sm mt-1">✓ Title looks good</p>
              )}
            </div>

            {/* Date Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Announcement Date *
              </label>
              <RedDatePicker
                label="Announcement Date"
                required
                value={data.date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(val) => handleDataChange('date', val)}
                error={errors.date}
                helperText={!errors.date && data.date ? '✓ Date selected' : undefined}
              />
            </div>

            {/* Description Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                Announcement Description *
                <button
                  type="button"
                  onClick={() => setShowURLInfo(!showURLInfo)}
                  className="text-blue-600 hover:text-blue-700 transition-colors"
                  title="Link formatting help"
                >
                  <Link className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-400">({data.description.length}/1000)</span>
              </label>
              
              {showURLInfo && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                  <p className="text-blue-800 font-medium mb-1">Adding Links:</p>
                  <ul className="text-blue-700 space-y-1 text-xs">
                    <li>• Just paste URLs directly: https://forms.google.com/...</li>
                    <li>• Or use www.example.com format</li>
                    <li>• Links will automatically become clickable in the announcement</li>
                  </ul>
                </div>
              )}
              
              <textarea
                value={data.description}
                onChange={(e) => handleDataChange('description', e.target.value)}
                placeholder="Enter the announcement details, important information, deadlines, links to forms or documents, contact information, etc..."
                rows={6}
                maxLength={1000}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-vertical text-black outline-none ${
                  errors.description 
                    ? 'border-red-300 bg-red-50' 
                    : data.description.trim().length > 20 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-300'
                }`}
                required
              />
              {errors.description ? (
                <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.description}
                </div>
              ) : data.description.trim().length > 20 && (
                <p className="text-green-600 text-sm mt-1">✓ Good description length</p>
              )}
            </div>

            {/* Image Upload Section */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <ImageIcon className="w-4 h-4" />
                Announcement Images
                <span className="text-xs text-gray-500">(Optional, max 5 images, 10MB each)</span>
              </label>

              {/* Image Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-400 transition-colors">
                <input
                  type="file"
                  id="images"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/gif"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor="images"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-red-600">Click to upload</span> or drag and drop
                  </div>
                  <div className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB (Recommended: 1080x1350 for best display)
                  </div>
                </label>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Selected Images ({imagePreviews.length}/5)
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {index === 0 && (
                          <div className="absolute bottom-1 left-1 bg-red-600 text-white text-xs px-1 rounded">
                            Primary
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.images && (
                <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.images}
                </div>
              )}
            </div>

            {/* Form Progress Indicator */}
            {isFormValid && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Form ready to submit</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.visit('/announcements')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing || !isFormValid}
                className={`flex-1 px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all font-medium ${
                  processing || !isFormValid
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg transform hover:scale-105'
                }`}
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating Announcement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Announcement
                  </>
                )}
              </button>
            </div>

            {!isFormValid && (
              <p className="text-center text-xs text-gray-500 mt-2">
                Please fill in all required fields to create the announcement
              </p>
            )}
            </form>
          </div>

          {/* Right: Live Preview */}
          <div className="lg:sticky lg:top-6">
            <h2 className="text-sm font-semibold text-gray-600 mb-3">Live Preview</h2>
            <PostCard
              post={previewPost}
              type="announcement"
              date={data.date || new Date().toISOString().split('T')[0]}
              likes={{ liked: false, count: 0 }}
              commentsCount={0}
              canEditDelete={false}
              onLike={() => {}}
              onComment={() => {}}
              onEdit={() => {}}
              onDelete={() => {}}
              onPostClick={undefined}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}