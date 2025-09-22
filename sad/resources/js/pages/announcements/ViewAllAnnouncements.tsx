  // resources/js/Pages/Announcements/ViewAllAnnouncements.tsx

import MainLayout from '@/layouts/mainlayout';
import { Megaphone, MessageCircle, MoreHorizontal, Plus, ArrowLeft, Edit, Trash2, Bookmark, Heart } from 'lucide-react';
import CommentSection from '@/components/CommentSection';
import Modal from '@/components/Modal';
import { useEffect, useState, useRef } from 'react';
import { usePage, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

interface Announcement {
  id: number;
  title: string;
  date: string;
  description: string;
  created_by: 'admin_assistant' | 'dean' ; // <-- use snake_case
  user_id?: number; // fallback when relation missing
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    profile_picture?: string;
  };
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
  role: 'student' | 'admin_assistant' | 'dean';
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

  // Check if user can create announcements (admin_assistant or dean)
  const canCreateAnnouncement = auth.user.role === 'admin_assistant' || auth.user.role === 'dean';

  // Filter using created_by (snake_case)
  const filtered = announcements.filter(
    (a: Announcement) => a.created_by === 'admin_assistant' || a.created_by === 'dean'
  );

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
      const ann = filtered.find((a: Announcement) => a.id === modalAnnouncementId);
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
  }, [modalAnnouncementId, filtered]);

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
      const res = await axios.post('/comments', payload);
      
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
      for (const announcement of filtered) {
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
    
    if (filtered.length > 0) {
      loadLikesAndComments();
    }
  }, [filtered]);

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
    router.delete(`/announcements/${deleteAnnouncementId}`, {
      onSuccess: () => {
        setDeleteAnnouncementId(null);
        router.reload();
      },
      onError: () => {
        setDeleteAnnouncementId(null);
      }
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
    // Allow all admin_assistants and deans to edit/delete any announcement
    return auth.user.role === 'admin_assistant' || auth.user.role === 'dean';
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
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
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
            {filtered.length > 0 ? (
              filtered.map((a: Announcement) => (
                <motion.article
                  key={a.id}
                  variants={cardVariants}
                  className="group relative mx-auto flex w-full max-w-lg flex-col justify-between rounded-xl border border-gray-100 bg-white/90 p-6 shadow-sm ring-1 ring-transparent backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-red-50"
                >
                  <div>
                    <div className="mb-4 flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-red-600 bg-red-600 text-white">
                        {a.user?.profile_picture ? (
                          <img
                            src={a.user.profile_picture.startsWith('/storage/')
                              ? a.user.profile_picture
                              : `/storage/${a.user.profile_picture}`}
                            alt={`${a.user?.first_name || ''} ${a.user?.last_name || ''}`}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              const parent = img.parentElement!;
                              parent.innerHTML = `<div class='flex h-full w-full items-center justify-center bg-red-600 text-white font-semibold text-sm'>${(a.user?.first_name?.charAt(0) || 'U').toUpperCase()}</div>`;
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-red-600 text-sm font-semibold text-white">
                            {(a.user?.first_name?.charAt(0) || 'U').toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-gray-900">
                          {a.user?.first_name || 'Unknown'} {a.user?.last_name || 'User'}
                        </div>
                        <div className="text-xs text-gray-500">{a.date}</div>
                      </div>
                      <div
                        className="relative"
                        ref={(el) => {
                          dropdownRefs.current[a.id] = el;
                        }}
                      >
                        <button
                          aria-haspopup="menu"
                          aria-expanded={dropdownOpen === a.id}
                          className="rounded p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                          onClick={() => setDropdownOpen(dropdownOpen === a.id ? null : a.id)}
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                        <AnimatePresence>
                          {dropdownOpen === a.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.98, y: -2 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.98, y: -2 }}
                              transition={{ duration: 0.12 }}
                              className="absolute right-0 top-6 z-10 mt-1 w-48 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-lg"
                            >
                              {canEditDelete() && (
                                <>
                                  <button
                                    onClick={() => handleEdit(a.id)}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    <Edit className="h-4 w-4" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(a.id)}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                  </button>
                                </>
                              )}
                              {auth.user.role === 'student' && (
                                <button
                                  onClick={() => handleBookmark(a.id)}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Bookmark className="h-4 w-4" />
                                  Save/Bookmark
                                </button>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-gray-900">{a.title}</h3>
                    <p className="mb-4 line-clamp-3 text-sm leading-6 text-gray-600">{a.description}</p>
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    {/* Like Button */}
                    <button
                      className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-red-600"
                      onClick={() => toggleLike(a.id)}
                    >
                      <Heart 
                        className={`h-5 w-5 ${
                          likes[a.id]?.liked 
                            ? 'fill-red-500 text-red-500' 
                            : 'text-gray-400'
                        }`} 
                      />
                      <span>Like</span>
                      {likes[a.id]?.count > 0 && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                          {likes[a.id].count}
                        </span>
                      )}
                    </button>

                    {/* Comment Button - moved to right side */}
                    <button
                      className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-red-600"
                      onClick={() => setModalAnnouncementId(a.id)}
                    >
                      <MessageCircle className="h-5 w-5" />
                      {(comments[a.id] || []).length} Comments
                    </button>
                  </div>
                  <Modal open={modalAnnouncementId === a.id} onClose={() => setModalAnnouncementId(null)}>
                    <CommentSection
                      comments={Array.isArray(comments[a.id]) ? comments[a.id] : []}
                      commentableId={a.id}
                      commentableType="announcements"
                      onAddComment={(payload) => addComment(a.id, payload)}
                      onEditComment={(commentId, newText) => editComment(a.id, commentId, newText)}
                      onClose={() => setModalAnnouncementId(null)}
                    />
                  </Modal>
                </motion.article>
              ))
            ) : (
              <p className="text-gray-500 italic">No announcements posted.</p>
            )}
          </motion.div>
        </section>
      </motion.div>
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
