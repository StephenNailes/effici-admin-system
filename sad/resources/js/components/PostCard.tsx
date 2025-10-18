// components/PostCard.tsx

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  MessageCircle, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Megaphone
} from 'lucide-react';
import { router, usePage } from '@inertiajs/react';
import { formatDateTime } from '@/lib/utils';
import { LinkifiedText } from '@/utils/linkify';

interface PostImage {
  id: number;
  url: string;
  original_name: string;
  width: number;
  height: number;
  order: number;
}

interface PostUser {
  id: number;
  first_name: string;
  last_name: string;
  profile_picture?: string;
}

interface BasePost {
  id: number;
  title: string;
  description?: string;
  created_by: 'student' | 'admin_assistant' | 'dean' | 'student_officer';
  user_id?: number;
  user?: PostUser;
  images?: PostImage[];
  created_at?: string;
  updated_at?: string;
}

interface PostCardProps {
  post: BasePost;
  type: 'event' | 'announcement';
  date?: string; // Legacy date field
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  likes: { liked: boolean; count: number };
  commentsCount: number;
  canEditDelete: boolean;
  onLike: (postId: number) => void;
  onComment: (postId: number) => void;
  onEdit: (postId: number) => void;
  onDelete: (postId: number) => void;
  onBookmark?: (postId: number) => void;
  onPostClick?: (postId: number) => void; // New prop for clicking on the post
}

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export default function PostCard({
  post,
  type,
  date,
  start_date,
  end_date,
  start_time,
  end_time,
  likes,
  commentsCount,
  canEditDelete,
  onLike,
  onComment,
  onEdit,
  onDelete,
  onBookmark,
  onPostClick
}: PostCardProps) {
  const { auth } = usePage<any>().props;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);



  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show only the posted timestamp (when the post was created)

  const nextImage = () => {
    if (post.images && post.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % post.images!.length);
    }
  };

  const prevImage = () => {
    if (post.images && post.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + post.images!.length) % post.images!.length);
    }
  };

  const userDisplayName = `${post.user?.first_name || 'Unknown'} ${post.user?.last_name || 'User'}`;
  const userInitials = (post.user?.first_name?.charAt(0) || 'U').toUpperCase();
  const typeIcon = type === 'event' ? Calendar : Megaphone;
  const TypeIconComponent = typeIcon;

  return (
    <motion.article
      variants={cardVariants}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200 self-start"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center space-x-3">
          {/* Profile Picture */}
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-red-500">
            {post.user?.profile_picture ? (
              <img
                src={post.user.profile_picture.startsWith('/storage/')
                  ? post.user.profile_picture
                  : `/storage/${post.user.profile_picture}`}
                alt={userDisplayName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  const parent = img.parentElement!;
                  parent.innerHTML = `<div class='flex h-full w-full items-center justify-center bg-red-500 text-white font-semibold text-sm'>${userInitials}</div>`;
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-red-500 text-sm font-semibold text-white">
                {userInitials}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900 text-sm truncate">
                {userDisplayName}
              </h4>
              <TypeIconComponent className="w-4 h-4 text-red-500" />
            </div>
            <div className="flex items-center text-xs text-gray-500 space-x-2 flex-wrap">
              {post.created_at && (
                <span>{formatDateTime(post.created_at)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Dropdown Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <MoreHorizontal className="w-5 h-5 text-gray-500" />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: -2 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -2 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-10 overflow-hidden"
              >
                {canEditDelete && (
                  <>
                    <button
                      onClick={() => {
                        onEdit(post.id);
                        setDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        onDelete(post.id);
                        setDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </>
                )}
                {auth.user.role === 'student' && onBookmark && (
                  <button
                    onClick={() => {
                      onBookmark(post.id);
                      setDropdownOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Bookmark className="w-4 h-4" />
                    Bookmark
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Post Content */}
      <div 
        className={`px-4 pb-3 ${onPostClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
        onClick={() => onPostClick && onPostClick(post.id)}
      >
        <h3 className="font-semibold text-lg text-gray-900 mb-2 leading-tight">
          {post.title}
        </h3>
        {post.description && (
          <div className="text-gray-700 text-sm leading-relaxed mb-3">
            <LinkifiedText text={post.description} />
          </div>
        )}
      </div>

      {/* Images */}
      {post.images && post.images.length > 0 ? (
        <div className="relative mt-1">
          <div className="aspect-[4/3] bg-gray-100 overflow-hidden rounded-b-xl">
            <img
              src={post.images[currentImageIndex].url}
              alt={post.images[currentImageIndex].original_name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // If image fails to load, show a placeholder
                const img = e.target as HTMLImageElement;
                const parent = img.parentElement!;
                parent.innerHTML = `<div class='flex h-full w-full items-center justify-center bg-gray-200 text-gray-500'>
                  <div class='text-center'>
                    <svg class='w-12 h-12 mx-auto mb-2' fill='currentColor' viewBox='0 0 20 20'>
                      <path fill-rule='evenodd' d='M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z' clip-rule='evenodd'/>
                    </svg>
                    <p class='text-sm'>Image unavailable</p>
                  </div>
                </div>`;
              }}
            />
          </div>

          {/* Image Navigation */}
          {post.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Image Indicators */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
                {post.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}

      {/* Actions Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center space-x-2 px-3 py-1 rounded-full transition-colors ${
            likes.liked 
              ? 'text-red-600 bg-red-50 hover:bg-red-100' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Heart className={`w-5 h-5 ${likes.liked ? 'fill-red-600' : ''}`} />
          <span className="text-sm font-medium">
            {likes.count > 0 ? likes.count : 'Like'}
          </span>
        </button>

        <button
          onClick={() => onComment(post.id)}
          className="flex items-center space-x-2 px-3 py-1 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium">
            {commentsCount > 0 ? `${commentsCount} Comments` : 'Comment'}
          </span>
        </button>
      </div>
    </motion.article>
  );
}