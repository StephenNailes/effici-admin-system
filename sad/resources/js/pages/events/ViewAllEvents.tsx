// resources/js/Pages/Events/ViewAllEvents.tsx

import MainLayout from '@/layouts/mainlayout';
import { Calendar, MessageCircle, MoreHorizontal, Plus, ArrowLeft, Edit, Trash2, Bookmark, Heart } from 'lucide-react';
import CommentSection from '@/components/CommentSection';
import Modal from '@/components/Modal';
import { useState, useRef, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

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
  const { auth, events = [] } = usePage<PageProps>().props; // Expect events from props or API

  // Check if user can create events (admin_assistant or dean)
  const canCreateEvent = auth.user.role === 'admin_assistant' || auth.user.role === 'dean';

  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [modalEventId, setModalEventId] = useState<number | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);
  // Delete confirmation modal state
  const [deleteEventId, setDeleteEventId] = useState<number | null>(null);
  // Keep a ref per event id so outside-click detection targets the correct card
  const dropdownRefs = useRef<Record<number, HTMLDivElement | null>>({});
  
  // Like functionality state
  const [likes, setLikes] = useState<Record<number, { liked: boolean; count: number }>>({});

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

  const addComment = async (eventId: number, payload: { commentable_id: number; commentable_type: string; text: string; parent_id?: number }) => {
    try {
      const res = await axios.post('/comments', payload);
      
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
      for (const event of events) {
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
    
    if (events.length > 0) {
      loadLikesAndComments();
    }
  }, [events]);

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
    setDropdownOpen(null);
  };

  const handleDelete = (eventId: number) => {
    // Open themed confirmation modal instead of native confirm
    setDeleteEventId(eventId);
    setDropdownOpen(null);
  };

  const confirmDeleteEvent = () => {
    if (deleteEventId === null) return;
    router.delete(`/events/${deleteEventId}`, {
      onSuccess: () => {
        setDeleteEventId(null);
        router.reload();
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
    setDropdownOpen(null);
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
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
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
            {events.length > 0 ? (
              events.map((event: Event) => (
                <motion.article
                  variants={cardVariants}
                  key={event.id}
                  className="group relative mx-auto flex w-full max-w-lg flex-col justify-between rounded-xl border border-gray-100 bg-white/90 p-6 shadow-sm ring-1 ring-transparent backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-red-50"
                >
                  <div>
                    <div className="mb-4 flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-red-600 bg-red-600 text-white">
                        {event.user?.profile_picture ? (
                          <img
                            src={event.user.profile_picture.startsWith('/storage/')
                              ? event.user.profile_picture
                              : `/storage/${event.user.profile_picture}`}
                            alt={`${event.user?.first_name || ''} ${event.user?.last_name || ''}`}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              const parent = img.parentElement!;
                              parent.innerHTML = `<div class='flex h-full w-full items-center justify-center bg-red-600 text-white font-semibold text-sm'>${(event.user?.first_name?.charAt(0) || 'U').toUpperCase()}</div>`;
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-red-600 text-sm font-semibold text-white">
                            {(event.user?.first_name?.charAt(0) || 'U').toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-semibold text-gray-900">
                          {event.user?.first_name || 'Unknown'} {event.user?.last_name || 'User'}
                        </div>
                        <div className="text-xs text-gray-500">{event.date}</div>
                      </div>
                      <div
                        className="relative"
                        ref={(el) => {
                          dropdownRefs.current[event.id] = el;
                        }}
                      >
                        <button
                          aria-haspopup="menu"
                          aria-expanded={dropdownOpen === event.id}
                          className="rounded p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                          onClick={() => setDropdownOpen(dropdownOpen === event.id ? null : event.id)}
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                        <AnimatePresence>
                          {dropdownOpen === event.id && (
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
                                    onClick={() => handleEdit(event.id)}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    <Edit className="h-4 w-4" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(event.id)}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                  </button>
                                </>
                              )}
                              {auth.user.role === 'student' && (
                                <button
                                  onClick={() => handleBookmark(event.id)}
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
                    <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-gray-900">{event.title}</h3>
                    {event.description && (
                      <p className="mb-4 line-clamp-3 text-sm leading-6 text-gray-600">{event.description}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    {/* Like Button */}
                    <button
                      className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-red-600"
                      onClick={() => toggleLike(event.id)}
                    >
                      <Heart 
                        className={`h-5 w-5 ${
                          likes[event.id]?.liked 
                            ? 'fill-red-500 text-red-500' 
                            : 'text-gray-400'
                        }`} 
                      />
                      <span>Like</span>
                      {likes[event.id]?.count > 0 && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                          {likes[event.id].count}
                        </span>
                      )}
                    </button>

                    {/* Comment Button - moved to right side */}
                    <button
                      className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-red-600"
                      onClick={() => setModalEventId(event.id)}
                    >
                      <MessageCircle className="h-5 w-5" />
                      {(comments[event.id] || []).length} Comments
                    </button>
                  </div>
                  <Modal open={modalEventId === event.id} onClose={() => setModalEventId(null)}>
                    <CommentSection
                      comments={comments[event.id] || []}
                      commentableId={event.id}
                      commentableType="events"
                      onAddComment={(payload) => addComment(event.id, payload)}
                      onEditComment={(commentId, newText) => editComment(event.id, commentId, newText)}
                      onClose={() => setModalEventId(null)}
                    />
                  </Modal>
                </motion.article>
              ))
            ) : (
              <p className="text-gray-500 italic">No events available.</p>
            )}
          </motion.div>
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
