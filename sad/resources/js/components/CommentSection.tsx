// resources/js/Components/CommentSection.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaHeart, FaReply, FaPaperPlane } from 'react-icons/fa';
import { usePage } from '@inertiajs/react';

interface User {
  first_name: string;
  last_name: string;
  avatarUrl?: string;
}

interface Comment {
  id: number;
  text: string;
  date: string;
  user?: User; // optional now
}

interface Props {
  comments: Comment[];
  commentableId: number;
  commentableType: string;
  onAddComment: (payload: {
    commentable_id: number;
    commentable_type: string;
    text: string;
  }) => void;
  onEditComment?: (id: number, newText: string) => void;
}

export default function CommentSection({
  comments,
  commentableId,
  commentableType,
  onAddComment,
  onEditComment,
}: Props) {
  const { auth } = usePage().props as any;
  const userFirstName = auth.user.first_name;
  const userAvatar = auth.user.avatarUrl || '/avatars/default.png';

  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    onAddComment({
      commentable_id: commentableId,
      commentable_type: commentableType,
      text: newComment,
    });

    setNewComment('');
  };

  const handleEdit = (id: number, currentText: string) => {
    setEditingId(id);
    setEditText(currentText);
  };

  const handleEditSubmit = (id: number) => {
    if (onEditComment && editText.trim()) {
      onEditComment(id, editText);
      setEditingId(null);
      setEditText('');
    }
  };

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col h-[600px] w-full max-w-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button className="text-red-500 text-xl font-bold">&larr;</button>
        <span className="text-lg font-semibold text-gray-800">Comments</span>
        <span className="text-gray-500 font-medium">{comments.length}</span>
      </div>

      {/* Comment List */}
      <ul className="flex-1 space-y-4 overflow-y-auto pb-2 pr-2 scrollbar-thin scrollbar-thumb-red-200 scrollbar-track-transparent">
        {comments.length === 0 && (
          <li className="text-gray-400 italic text-center">No comments yet.</li>
        )}
        {comments.map((c) => {
          const user = c.user || {
            first_name: 'Unknown',
            last_name: '',
            avatarUrl: '/avatars/default.png',
          };

          return (
            <li key={c.id} className="flex gap-3 items-start">
              <img
                src={user.avatarUrl || '/avatars/default.png'}
                alt={user.first_name}
                className="w-12 h-12 rounded-full object-cover mt-1"
              />
              <div className="flex-1">
                <div className="bg-red-50 rounded-xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">
                      {user.first_name}
                    </span>
                    <span className="text-xs text-gray-400">{c.date}</span>
                  </div>

                  {editingId === c.id ? (
                    <div className="flex gap-2 items-center mt-1">
                      <input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="border rounded px-2 py-1 text-sm flex-1 outline-none focus:ring focus:ring-red-200 text-black bg-white"
                        autoFocus
                      />
                      <button
                        className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                        onClick={() => handleEditSubmit(c.id)}
                      >
                        Save
                      </button>
                      <button
                        className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-800">{c.text}</p>
                  )}

                  <div className="flex items-center gap-4 mt-2">
                    <button className="text-xs text-red-500 font-semibold flex items-center gap-1 hover:underline">
                      <FaReply className="text-xs" /> Reply
                    </button>
                    <button className="text-xs text-gray-500 flex items-center gap-1">
                      <FaHeart className="text-sm" /> 1
                    </button>
                    {user.first_name === userFirstName && (
                      <button
                        className="text-xs text-blue-500 ml-2 hover:underline"
                        onClick={() => handleEdit(c.id, c.text)}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Add Comment Form */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 mt-4 bg-white rounded-full px-4 py-3 shadow"
      >
        <img
          src={userAvatar}
          alt={userFirstName}
          className="w-11 h-11 rounded-full object-cover"
        />
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 px-3 py-2 border-none outline-none text-sm bg-transparent text-black"
        />
        <button
          type="submit"
          className="text-red-500 hover:text-red-600 transition"
        >
          <FaPaperPlane className="text-xl" />
        </button>
      </form>
    </motion.div>
  );
}
