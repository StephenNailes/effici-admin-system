// resources/js/Pages/Announcements/ViewAllAnnouncements.tsx

import MainLayout from '@/layouts/mainlayout';
import { Megaphone, MessageCircle, MoreHorizontal } from 'lucide-react';
import CommentSection from '@/components/CommentSection';
import Modal from '@/components/Modal';
import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';

interface Announcement {
  id: number;
  title: string;
  date: string;
  description: string;
  created_by: 'admin_assistant' | 'dean' ; // <-- use snake_case
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

export default function ViewAllAnnouncements() {
  const { auth, announcements = [] } = usePage().props as any;
  const currentUser: User = {
    first_name: auth.user.first_name,
    last_name: auth.user.last_name,
    avatarUrl: auth.user.avatarUrl || '/avatars/default.png',
  };

  // Filter using created_by (snake_case)
  const filtered = announcements.filter(
    (a: Announcement) => a.created_by === 'admin_assistant' || a.created_by === 'dean'
  );

  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [modalAnnouncementId, setModalAnnouncementId] = useState<number | null>(null);

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

  const addComment = async (
    announcementId: number,
    payload: { commentable_id: number; commentable_type: string; text: string }
  ) => {
    try {
      const res = await axios.post('/comments', payload);
      const savedComment: Comment = res.data.comment;

      setComments((prev) => ({
        ...prev,
        [announcementId]: [...(prev[announcementId] || []), savedComment],
      }));
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const editComment = (announcementId: number, commentId: number, newText: string) => {
    setComments((prev) => {
      const updated = (prev[announcementId] || []).map((c) =>
        c.id === commentId ? { ...c, text: newText } : c
      );
      return { ...prev, [announcementId]: updated };
    });
  };

  return (
    <MainLayout>
      <div className="p-6 font-poppins space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600">All Announcements</h1>
          <p className="text-gray-500">Catch up on the latest news and notices</p>
        </div>
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <Megaphone className="text-red-500 w-6 h-6" /> Announcement Board
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filtered.length > 0 ? (
              filtered.map((a: Announcement) => (
                <div
                  key={a.id}
                  className="bg-white rounded-2xl shadow p-7 border max-w-lg w-full h-[370px] flex flex-col justify-between mx-auto relative"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      
                      <div>
                        <div className="font-bold text-lg text-gray-900 capitalize">{a.created_by.replace('_', ' ')}</div>
                        <div className="text-xs text-gray-500">{a.date}</div>
                      </div>
                      <MoreHorizontal className="ml-auto text-gray-400 cursor-pointer w-5 h-5" />
                    </div>
                    <div className="text-gray-800 mb-1 text-lg">{a.title}</div>
                    <p className="text-gray-600 mb-4">{a.description}</p>
                  </div>
                  <div className="flex items-center border-t pt-3">
                    <button
                      className="flex items-center gap-2 text-gray-500 hover:text-red-600 text-base font-medium"
                      onClick={() => setModalAnnouncementId(a.id)}
                    >
                      <MessageCircle className="w-5 h-5" />
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
                    />
                  </Modal>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">No announcements posted.</p>
            )}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
