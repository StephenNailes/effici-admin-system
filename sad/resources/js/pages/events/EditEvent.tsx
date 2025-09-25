import MainLayout from '@/layouts/mainlayout';
import { Calendar, ArrowLeft, Save, AlertCircle, Link, Info, Upload, X, ImageIcon, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { router, useForm } from '@inertiajs/react';

interface Event {
  id: number;
  title: string;
  date: string;
  description: string;
  created_by: string;
  user_id: number;
  images?: ExistingImage[];
}

interface EditEventProps {
  event: Event;
}

interface ExistingImage {
  id: number;
  url: string;
  original_name: string;
  width: number;
  height: number;
  order: number;
}

export default function EditEvent({ event }: EditEventProps) {
  const { data, setData, put, post, processing, errors, reset } = useForm({
    title: event.title,
    date: event.date,
    description: event.description,
    images: [] as File[],
    remove_images: [] as number[],
    _method: 'PUT' as string,
  });

  const [isFormValid, setIsFormValid] = useState(false);
  const [showURLInfo, setShowURLInfo] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>(event.images || []);
  const [imagesToRemove, setImagesToRemove] = useState<number[]>([]);

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

  // Check form validity on mount with initial data
  useEffect(() => {
    checkFormValidity();
  }, []);

  // Handle new image uploads
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Calculate total images (existing + new - to be removed)
    const totalExistingImages = existingImages.length - imagesToRemove.length;
    const currentNewImages = data.images || [];
    const totalCurrentImages = totalExistingImages + currentNewImages.length;
    
    const availableSlots = 5 - totalCurrentImages;
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
      const updatedImages = [...currentNewImages, ...validFiles];
      setData('images', updatedImages);

      // Create preview URLs
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  // Remove new uploaded image
  const removeNewImage = (index: number) => {
    const updatedImages = data.images.filter((_, i) => i !== index);
    setData('images', updatedImages);

    // Clean up preview URLs
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index);
    URL.revokeObjectURL(imagePreviews[index]); // Cleanup memory
    setImagePreviews(updatedPreviews);
  };

  // Mark existing image for removal
  const markImageForRemoval = (imageId: number) => {
    if (!imagesToRemove.includes(imageId)) {
      const updatedRemovalList = [...imagesToRemove, imageId];
      setImagesToRemove(updatedRemovalList);
      setData('remove_images', updatedRemovalList);
    }
  };

  // Unmark existing image for removal
  const unmarkImageForRemoval = (imageId: number) => {
    const updatedRemovalList = imagesToRemove.filter(id => id !== imageId);
    setImagesToRemove(updatedRemovalList);
    setData('remove_images', updatedRemovalList);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use post with forceFormData to properly handle file uploads with PUT
    post(`/events/${event.id}`, {
      forceFormData: true,
      onSuccess: () => {
        // Clean up preview URLs
        imagePreviews.forEach(url => URL.revokeObjectURL(url));
        router.visit('/events');
      }
    });
  };

  return (
    <MainLayout>
      <div className="p-6 font-poppins">
        <button
          onClick={() => router.visit('/events')}
          className="flex items-center gap-2 text-gray-600 hover:text-red-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </button>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-red-600 flex items-center justify-center gap-2">
            <Calendar className="w-8 h-8" />
            Edit Event
          </h1>
          <p className="text-gray-500 mt-2">Update the event details</p>
          
          {/* URL Info Banner */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl mx-auto">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h3 className="text-sm font-semibold text-blue-800 mb-1">Pro Tip: Add Links</h3>
                <p className="text-sm text-blue-700">
                  You can include URLs in your event description (e.g., Google Forms, websites, documents). 
                  They will automatically become clickable links for users!
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                Event Title *
                <span className="text-xs text-gray-400">({data.title.length}/100)</span>
              </label>
              <input
                type="text"
                value={data.title}
                onChange={(e) => handleDataChange('title', e.target.value)}
                placeholder="Enter a clear, descriptive event title"
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
                Event Date *
              </label>
              <input
                type="date"
                value={data.date}
                onChange={(e) => handleDataChange('date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-black outline-none ${
                  errors.date 
                    ? 'border-red-300 bg-red-50' 
                    : data.date 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-300'
                }`}
                required
              />
              {errors.date ? (
                <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.date}
                </div>
              ) : data.date && (
                <p className="text-green-600 text-sm mt-1">✓ Date selected</p>
              )}
            </div>

            {/* Description Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                Event Description *
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
                    <li>• Links will automatically become clickable in the event post</li>
                  </ul>
                </div>
              )}
              
              <textarea
                value={data.description}
                onChange={(e) => handleDataChange('description', e.target.value)}
                placeholder="Describe the event details, agenda, location, requirements, etc. You can include links to registration forms, documents, or websites..."
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

            {/* Image Management Section */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <ImageIcon className="w-4 h-4" />
                Event Images
                <span className="text-xs text-gray-500">(Max 5 images, 10MB each)</span>
              </label>

              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Current Images</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {existingImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.url}
                          alt={image.original_name}
                          className={`w-full h-24 object-cover rounded-lg border transition-all ${
                            imagesToRemove.includes(image.id)
                              ? 'opacity-30 border-red-300 bg-red-50'
                              : 'border-gray-200 hover:border-red-300'
                          }`}
                          onError={(e) => {
                            // If image fails to load, show a placeholder
                            const img = e.target as HTMLImageElement;
                            img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDlWN0E2IDYgMCAwIDAgOSAzSDdBNiA2IDAgMCAwIDMgN1Y5QTYgNiAwIDAgMCA5IDIxSDdBNiA2IDAgMCAwIDIxIDE3VjlaTTkgMTlIN0E0IDQgMCAwIDEgMyAxM1Y3QTQgNCAwIDAgMSA3IDNIOUE0IDQgMCAwIDEgMTMgN1Y5QTQgNCAwIDAgMSA5IDEzSDdBNCA0IDAgMCAxIDMgOVYxN0E0IDQgMCAwIDEgNyAyMUg5QTQgNCAwIDAgMSAxMyAxN1Y5QTQgNCAwIDAgMSA5IDEzWiIgZmlsbD0iIzk5OTk5OSIvPgo8L3N2Zz4K';
                          }}
                        />
                        
                        {/* Remove/Restore Button */}
                        {imagesToRemove.includes(image.id) ? (
                          <button
                            type="button"
                            onClick={() => unmarkImageForRemoval(image.id)}
                            className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 hover:bg-green-600 transition-colors"
                            title="Restore image"
                          >
                            <ArrowLeft className="w-3 h-3 rotate-180" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => markImageForRemoval(image.id)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            title="Remove image"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                        
                        {/* Primary Image Badge */}
                        {image.order === 0 && !imagesToRemove.includes(image.id) && (
                          <div className="absolute bottom-1 left-1 bg-red-600 text-white text-xs px-1 rounded">
                            Primary
                          </div>
                        )}
                        
                        {/* Removal Overlay */}
                        {imagesToRemove.includes(image.id) && (
                          <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-20 rounded-lg">
                            <span className="text-red-700 text-xs font-bold">Will be removed</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Images */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-400 transition-colors">
                <input
                  type="file"
                  id="new-images"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/gif"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor="new-images"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-red-600">Click to add more images</span> or drag and drop
                  </div>
                  <div className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB (Recommended: 1080x1350 for best display)
                  </div>
                </label>
              </div>

              {/* New Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    New Images to Add ({imagePreviews.length})
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`New image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-green-200 bg-green-50"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-green-600 text-white text-xs px-1 rounded">
                          New
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Summary */}
              {(existingImages.length > 0 || imagePreviews.length > 0) && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                  Total images: {existingImages.length - imagesToRemove.length + imagePreviews.length} / 5
                  {imagesToRemove.length > 0 && (
                    <span className="text-red-600 ml-2">
                      ({imagesToRemove.length} marked for removal)
                    </span>
                  )}
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
                onClick={() => router.visit('/events')}
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
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Update Event
                  </>
                )}
              </button>
            </div>
            
            {!isFormValid && (
              <p className="text-center text-xs text-gray-500 mt-2">
                Please fill in all required fields to update the event
              </p>
            )}
          </form>
        </div>
      </div>
    </MainLayout>
  );
}