// resources/js/Pages/Events/ViewAllEvents.tsx

import MainLayout from '@/layouts/mainlayout';
import { Calendar, Plus, ArrowLeft } from 'lucide-react';
import CommentSection from '@/components/CommentSection';
import Modal from '@/components/Modal';
import PostCard from '@/components/PostCard';
import { useState, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
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

interface Event {
  id: number; // add id for DB reference
  title: string;
  date: string;
  description?: string;
  created_by: 'student' | 'admin_assistant' | 'dean';
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
  role: 'student' | 'admin_assistant' | 'dean';
  avatarUrl?: string;
};

type PageProps = {
  auth: { user: AuthUser };
  events?: Event[];
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

export default function ViewAllEvents() {
  const { auth, events = [] } = usePage<PageProps>().props; // Now events is a plain array
  const items: Event[] = Array.isArray(events) ? events : [];

  // Check if user can create events (admin_assistant or dean)
  const canCreateEvent = auth.user.role === 'admin_assistant' || auth.user.role === 'dean';

  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [modalEventId, setModalEventId] = useState<number | null>(null);
  // Delete confirmation modal state
  const [deleteEventId, setDeleteEventId] = useState<number | null>(null);
  
  // Like functionality state
  const [likes, setLikes] = useState<Record<number, { liked: boolean; count: number }>>({});

  const addComment = async (eventId: number, payload: { commentable_id: number; commentable_type: string; text: string; parent_id?: number }) => {
    try {
      await axios.post('/comments', payload);
      
      // Reload all comments to get the updated structure with replies
      const commentsRes = await axios.get(`/comments/events/${eventId}`);
      const commentArr = Array.isArray(commentsRes.data)
        ? commentsRes.data
        : Array.isArray(commentsRes.data.comments)
          ? commentsRes.data.comments
          : [];
      
      setComments((prev) => ({
        ...prev,
        [eventId]: commentArr,
      }));
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const toggleLike = async (eventId: number) => {
    try {
      const res = await axios.post('/likes/toggle', {
        likeable_id: eventId,
        likeable_type: 'events',
      });

      setLikes((prev) => ({
        ...prev,
        [eventId]: {
          liked: res.data.liked,
          count: res.data.likes_count,
        },
      }));
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  // Load likes and comments for all events on component mount
  useEffect(() => {
    const loadLikesAndComments = async () => {
  for (const event of items) {
        try {
          // Load likes
          const likesRes = await axios.get(`/likes/events/${event.id}`);
          setLikes((prev) => ({
            ...prev,
            [event.id]: {
              liked: likesRes.data.liked,
              count: likesRes.data.likes_count,
            },
          }));

          // Load comments
          const commentsRes = await axios.get(`/comments/events/${event.id}`);
          const commentArr = Array.isArray(commentsRes.data)
            ? commentsRes.data
            : Array.isArray(commentsRes.data.comments)
              ? commentsRes.data.comments
              : [];
          
          setComments((prev) => ({
            ...prev,
            [event.id]: commentArr,
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

  // Load comments when modal opens (for real-time updates)
  useEffect(() => {
    if (modalEventId !== null) {
      const loadCommentsForModal = async () => {
        try {
          const res = await axios.get(`/comments/events/${modalEventId}`);
          const commentArr = Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.data.comments)
              ? res.data.comments
              : [];
          
          setComments((prev) => ({
            ...prev,
            [modalEventId]: commentArr,
          }));
        } catch (error) {
          console.error('Failed to load comments for modal:', error);
        }
      };

      loadCommentsForModal();
    }
  }, [modalEventId]);

  const editComment = async (eventId: number, commentId: number, newText: string) => {
    try {
      await axios.put(`/comments/${commentId}`, { text: newText });
      
      // Reload comments to get updated data
      const commentsRes = await axios.get(`/comments/events/${eventId}`);
      const commentArr = Array.isArray(commentsRes.data)
        ? commentsRes.data
        : Array.isArray(commentsRes.data.comments)
          ? commentsRes.data.comments
          : [];
      
      setComments((prev) => ({
        ...prev,
        [eventId]: commentArr,
      }));
    } catch (error) {
      console.error('Failed to edit comment:', error);
    }
  };

  const handleEdit = (eventId: number) => {
    router.visit(`/events/${eventId}/edit`);
  };

  const handleDelete = (eventId: number) => {
    // Open themed confirmation modal instead of native confirm
    setDeleteEventId(eventId);
  };

  const confirmDeleteEvent = () => {
    if (deleteEventId === null) return;
    const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
    router.delete(`/events/${deleteEventId}`, {
      data: { _token: csrfToken },
      onSuccess: () => {
        setDeleteEventId(null);
        // Navigate back to index to avoid stale route and 404 resource errors
        router.visit('/events');
      },
      onError: () => {
        setDeleteEventId(null);
      },
      onFinish: () => {
        // no-op
      }
    });
  };

  const closeDeleteModal = () => setDeleteEventId(null);

  const handleBookmark = async (eventId: number) => {
    try {
      await axios.post(`/events/${eventId}/bookmark`);
      // You could add a toast notification here
      alert('Event bookmarked!');
    } catch (error) {
      console.error('Failed to bookmark event:', error);
    }
  };

  const canEditDelete = () => {
    // Allow all admin_assistants and deans to edit/delete any event
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
              <span className="text-red-600">All Events</span>
            </h1>
            <p className="mt-1 text-gray-500">Explore upcoming activities and programs</p>
          </div>
        </div>
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="text-red-500 w-6 h-6" /> Events List
            </h2>
            {canCreateEvent && (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => router.visit('/events/create')}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white shadow-sm hover:bg-red-700 focus:outline-none"
              >
                <Plus className="w-4 h-4" />
                Add Event
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
              items.map((event: Event) => (
                <PostCard
                  key={event.id}
                  post={event}
                  type="event"
                  date={event.date}
                  likes={likes[event.id] || { liked: false, count: 0 }}
                  commentsCount={(comments[event.id] || []).length}
                  canEditDelete={canEditDelete()}
                  onLike={() => toggleLike(event.id)}
                  onComment={() => setModalEventId(event.id)}
                  onEdit={() => handleEdit(event.id)}
                  onDelete={() => handleDelete(event.id)}
                  onBookmark={auth.user.role === 'student' ? () => handleBookmark(event.id) : undefined}
                  onPostClick={undefined}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No events available yet.</p>
                <p className="text-gray-400 text-sm">Check back later for upcoming events!</p>
              </div>
            )}
          </motion.div>

          {/* Comment Modal */}
          <Modal open={modalEventId !== null} onClose={() => setModalEventId(null)}>
            {modalEventId && (
              <CommentSection
                comments={comments[modalEventId] || []}
                commentableId={modalEventId}
                commentableType="events"
                onAddComment={(payload) => addComment(modalEventId, payload)}
                onEditComment={(commentId, newText) => editComment(modalEventId, commentId, newText)}
                onClose={() => setModalEventId(null)}
              />
            )}
          </Modal>
          {/* Pagination removed */}
        </section>
      </motion.div>
    {/* Delete Confirmation Modal */}
    <Modal open={deleteEventId !== null} onClose={closeDeleteModal}>
      <div className="w-full max-w-md">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Delete Event</h3>
        <p className="text-sm text-gray-600 mb-5">
          Are you sure you want to delete this event? Once deleted, it cannot be undone.
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
            onClick={confirmDeleteEvent}
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
    </MainLayout>
  );
}
