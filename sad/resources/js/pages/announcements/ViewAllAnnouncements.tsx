// resources/js/Pages/Announcements/ViewAllAnnouncements.tsx

import MainLayout from '@/layouts/mainlayout';
import { Megaphone, Plus, ArrowLeft } from 'lucide-react';
import CommentSection from '@/components/CommentSection';
import Modal from '@/components/Modal';
import PostCard from '@/components/PostCard';
import { useEffect, useState, useRef } from 'react';
import { usePage, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import axios from 'axios';

// Pagination removed; pages now receive plain arrays

interface PostImage {
  id: number;
  url: string;
  original_name: string;
  width: number;
  height: number;
  order: number;
}

interface Announcement {
  id: number;
  title: string;
  date: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  description: string;
  created_by: 'admin_assistant' | 'dean' | 'student_officer'; // <-- use snake_case
  user_id?: number; // fallback when relation missing
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    profile_picture?: string;
  };
  images?: PostImage[];
  created_at?: string;
  updated_at?: string;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  avatarUrl?: string;
}

interface Comment {
  id: number;
  text: string;
  created_at: string;
  user: User;
  replies?: Comment[];
}

type AuthUser = {
  first_name: string;
  last_name: string;
  role: 'student' | 'admin_assistant' | 'dean' | 'student_officer' | 'moderator' | 'academic_coordinator';
  avatarUrl?: string;
};

type PageProps = {
  auth: { user: AuthUser };
  announcements?: Announcement[];
};

// Animations
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

const gridVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export default function ViewAllAnnouncements() {
  const { auth, announcements = [] } = usePage<PageProps>().props;

  // Check if user can create announcements (admin_assistant, dean, or student_officer)
  const canCreateAnnouncement = auth.user.role === 'admin_assistant' || auth.user.role === 'dean' || auth.user.role === 'student_officer';

  const items: Announcement[] = Array.isArray(announcements) ? announcements : [];

  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [modalAnnouncementId, setModalAnnouncementId] = useState<number | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);
  const [deleteAnnouncementId, setDeleteAnnouncementId] = useState<number | null>(null);
  // Per-announcement refs for precise outside-click handling
  const dropdownRefs = useRef<Record<number, HTMLDivElement | null>>({});
  
  // Like functionality state
  const [likes, setLikes] = useState<Record<number, { liked: boolean; count: number }>>({});

  useEffect(() => {
    if (modalAnnouncementId !== null) {
      const ann = items.find((a: Announcement) => a.id === modalAnnouncementId);
      if (!ann) return;
      axios
        .get(`/comments/announcements/${ann.id}`)
        .then((res) => {
          const commentArr = Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.data.comments)
              ? res.data.comments
              : [];
          setComments((prev) => ({
            ...prev,
            [ann.id]: commentArr,
          }));
        })
        .catch((err) => {
          console.error('Failed to load comments:', err);
          setComments((prev) => ({
            ...prev,
            [ann.id]: [],
          }));
        });
    }
  }, [modalAnnouncementId, items]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownOpen === null) return;
      const container = dropdownRefs.current[dropdownOpen];
      if (container && !container.contains(event.target as Node)) {
        setDropdownOpen(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const addComment = async (
    announcementId: number,
    payload: { commentable_id: number; commentable_type: string; text: string; parent_id?: number }
  ) => {
    try {
      await axios.post('/comments', payload);
      
      // Reload all comments to get the updated structure with replies
      const commentsRes = await axios.get(`/comments/announcements/${announcementId}`);
      const commentArr = Array.isArray(commentsRes.data)
        ? commentsRes.data
        : Array.isArray(commentsRes.data.comments)
          ? commentsRes.data.comments
          : [];
      
      setComments((prev) => ({
        ...prev,
        [announcementId]: commentArr,
      }));
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const toggleLike = async (announcementId: number) => {
    try {
      const res = await axios.post('/likes/toggle', {
        likeable_id: announcementId,
        likeable_type: 'announcements',
      });

      setLikes((prev) => ({
        ...prev,
        [announcementId]: {
          liked: res.data.liked,
          count: res.data.likes_count,
        },
      }));
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  // Load likes and comments for all announcements on component mount
  useEffect(() => {
    const loadLikesAndComments = async () => {
      for (const announcement of items) {
        try {
          // Load likes
          const likesRes = await axios.get(`/likes/announcements/${announcement.id}`);
          setLikes((prev) => ({
            ...prev,
            [announcement.id]: {
              liked: likesRes.data.liked,
              count: likesRes.data.likes_count,
            },
          }));

          // Load comments
          const commentsRes = await axios.get(`/comments/announcements/${announcement.id}`);
          const commentArr = Array.isArray(commentsRes.data)
            ? commentsRes.data
            : Array.isArray(commentsRes.data.comments)
              ? commentsRes.data.comments
              : [];
          
          setComments((prev) => ({
            ...prev,
            [announcement.id]: commentArr,
          }));
        } catch (error) {
          console.error('Failed to load likes or comments:', error);
        }
      }
    };
    
    if (items.length > 0) {
      loadLikesAndComments();
    }
  }, [items]);

  const editComment = async (announcementId: number, commentId: number, newText: string) => {
    try {
      await axios.put(`/comments/${commentId}`, { text: newText });
      
      // Reload comments to get updated data
      const commentsRes = await axios.get(`/comments/announcements/${announcementId}`);
      const commentArr = Array.isArray(commentsRes.data)
        ? commentsRes.data
        : Array.isArray(commentsRes.data.comments)
          ? commentsRes.data.comments
          : [];
      
      setComments((prev) => ({
        ...prev,
        [announcementId]: commentArr,
      }));
    } catch (error) {
      console.error('Failed to edit comment:', error);
    }
  };

  const handleEdit = (announcementId: number) => {
    router.visit(`/announcements/${announcementId}/edit`);
    setDropdownOpen(null);
  };

  const handleDelete = (announcementId: number) => {
    setDeleteAnnouncementId(announcementId);
    setDropdownOpen(null);
  };

  const confirmDeleteAnnouncement = () => {
    if (deleteAnnouncementId === null) return;
    const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
    router.delete(`/announcements/${deleteAnnouncementId}`, {
      data: { _token: csrfToken },
      preserveScroll: true,
      onFinish: () => {
        // Close the modal regardless of outcome; server redirect will navigate back to index
        setDeleteAnnouncementId(null);
      },
    });
  };

  const closeDeleteModal = () => setDeleteAnnouncementId(null);

  const handleBookmark = async (announcementId: number) => {
    try {
      await axios.post(`/announcements/${announcementId}/bookmark`);
      // You could add a toast notification here
      alert('Announcement bookmarked!');
    } catch (error) {
      console.error('Failed to bookmark announcement:', error);
    }
    setDropdownOpen(null);
  };

  const canEditDelete = () => {
    // Allow all admin_assistants, deans, and student_officers to edit/delete any announcement
    return auth.user.role === 'admin_assistant' || auth.user.role === 'dean' || auth.user.role === 'student_officer';
  };

  return (
    <MainLayout>
      <motion.div
        className="px-4 py-6 sm:px-6 lg:px-8 font-poppins space-y-8"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="mb-2">
          <button
            onClick={() => {
              const userRole = auth.user.role;
              if (userRole === 'admin_assistant') {
                router.visit('/admin/dashboard');
              } else if (userRole === 'dean') {
                router.visit('/dean/dashboard');
              } else if (userRole === 'moderator') {
                router.visit('/moderator/dashboard');
              } else if (userRole === 'academic_coordinator') {
                router.visit('/academic-coordinator/dashboard');
              } else {
                router.visit('/student/dashboard');
              }
            }}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>
          <div className="mt-4 text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              <span className="text-red-600">All Announcements</span>
            </h1>
            <p className="mt-1 text-gray-500">Catch up on the latest news and notices</p>
          </div>
        </div>
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <Megaphone className="text-red-500 w-6 h-6" /> Announcement Board
            </h2>
            {canCreateAnnouncement && (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => router.visit('/announcements/create')}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white shadow-sm hover:bg-red-700 focus:outline-none"
              >
                <Plus className="w-4 h-4" />
                Add Announcement
              </motion.button>
            )}
          </div>
          <motion.div
            variants={gridVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {items.length > 0 ? (
              items.map((announcement: Announcement) => (
                <PostCard
                  key={announcement.id}
                  post={announcement}
                  type="announcement"
                  date={announcement.date}
                  start_date={announcement.start_date}
                  end_date={announcement.end_date}
                  start_time={announcement.start_time}
                  end_time={announcement.end_time}
                  likes={likes[announcement.id] || { liked: false, count: 0 }}
                  commentsCount={(comments[announcement.id] || []).length}
                  canEditDelete={canEditDelete()}
                  onLike={() => toggleLike(announcement.id)}
                  onComment={() => setModalAnnouncementId(announcement.id)}
                  onEdit={() => handleEdit(announcement.id)}
                  onDelete={() => handleDelete(announcement.id)}
                  onBookmark={auth.user.role === 'student' ? () => handleBookmark(announcement.id) : undefined}
                  onPostClick={undefined}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No announcements available yet.</p>
                <p className="text-gray-400 text-sm">Check back later for important updates!</p>
              </div>
            )}
          </motion.div>
        </section>
      </motion.div>

      {/* Comment Modal */}
          <Modal open={modalAnnouncementId !== null} onClose={() => setModalAnnouncementId(null)}>
            {modalAnnouncementId && (
              <CommentSection
                comments={comments[modalAnnouncementId] || []}
                commentableId={modalAnnouncementId}
                commentableType="announcements"
                onAddComment={(payload) => addComment(modalAnnouncementId, payload)}
                onEditComment={(commentId, newText) => editComment(modalAnnouncementId, commentId, newText)}
                onClose={() => setModalAnnouncementId(null)}
              />
            )}
          </Modal>
      {/* Delete Confirmation Modal */}
      <Modal open={deleteAnnouncementId !== null} onClose={closeDeleteModal}>
        <div className="w-full max-w-md">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Delete Announcement</h3>
          <p className="text-sm text-gray-600 mb-5">
            Are you sure you want to delete this announcement? Once deleted, it cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              className="px-4 py-2 rounded-lg text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 transition"
              onClick={closeDeleteModal}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700 transition font-semibold"
              onClick={confirmDeleteAnnouncement}
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
