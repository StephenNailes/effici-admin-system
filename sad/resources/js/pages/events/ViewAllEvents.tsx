// resources/js/Pages/Events/ViewAllEvents.tsx

import MainLayout from '@/layouts/mainlayout';
import { Calendar, MessageCircle, MoreHorizontal } from 'lucide-react';
import CommentSection from '@/components/CommentSection';
import Modal from '@/components/Modal';
import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';

interface Event {
  id: number; // add id for DB reference
  title: string;
  date: string;
  created_by: 'student' | 'admin_assistant' | 'dean';
}

interface User {
  first_name: string;
  last_name: string;
  avatarUrl?: string;
}

interface Comment {
  id: number;
  text: string;
  date: string;
  user: User;
}

const avatarMap: Record<string, string> = {
  dean: '/avatars/dean.png',
  admin_assistant: '/avatars/admin.png',
  student: '/avatars/student.png',
};

export default function ViewAllEvents() {
  const { auth, events = [] } = usePage().props as any; // Expect events from props or API
  const currentUser: User = {
    first_name: auth.user.first_name,
    last_name: auth.user.last_name,
    avatarUrl: auth.user.avatarUrl || '/avatars/default.png',
  };

  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [modalEventId, setModalEventId] = useState<number | null>(null);

  const addComment = async (eventId: number, payload: { commentable_id: number; commentable_type: string; text: string }) => {
    try {
      const res = await axios.post('/comments', payload);
      const savedComment: Comment = res.data.comment; // <-- use .comment

      setComments((prev) => ({
        ...prev,
        [eventId]: [...(prev[eventId] || []), savedComment],
      }));
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const editComment = (eventIndex: number, commentId: number, newText: string) => {
    setComments((prev) => {
      const updated = (prev[eventIndex] || []).map((c) =>
        c.id === commentId ? { ...c, text: newText } : c
      );
      return { ...prev, [eventIndex]: updated };
    });
  };

  return (
    <MainLayout>
      <div className="p-6 font-poppins space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600">All Events</h1>
          <p className="text-gray-500">Explore upcoming activities and programs</p>
        </div>
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <Calendar className="text-red-500 w-6 h-6" /> Events List
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {events.length > 0 ? (
              events.map((event: Event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-2xl shadow p-7 border max-w-lg w-full h-[340px] flex flex-col justify-between mx-auto relative"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div>
                        <div className="font-bold text-lg text-gray-900 capitalize">{event.created_by}</div>
                        <div className="text-xs text-gray-500">{event.date}</div>
                      </div>
                      <MoreHorizontal className="ml-auto text-gray-400 cursor-pointer w-5 h-5" />
                    </div>
                    <div className="text-gray-800 mb-4 text-lg">{event.title}</div>
                  </div>
                  <div className="flex items-center border-t pt-3">
                    <button
                      className="flex items-center gap-2 text-gray-500 hover:text-red-600 text-base font-medium"
                      onClick={() => setModalEventId(event.id)}
                    >
                      <MessageCircle className="w-5 h-5" />
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
                    />
                  </Modal>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">No events available.</p>
            )}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
