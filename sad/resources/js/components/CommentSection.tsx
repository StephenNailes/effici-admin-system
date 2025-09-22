// resources/js/Components/CommentSection.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaHeart, FaReply, FaPaperPlane, FaTimes } from 'react-icons/fa';
import { usePage } from '@inertiajs/react';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  profile_picture?: string;
  avatarUrl?: string;
}

interface Reply {
  id: number;
  text: string;
  created_at: string;
  user: User;
}

interface Comment {
  id: number;
  text: string;
  created_at: string;
  user: User;
  replies?: Reply[];
}

interface Props {
  comments: Comment[];
  commentableId: number;
  commentableType: string;
  onAddComment: (payload: {
    commentable_id: number;
    commentable_type: string;
    text: string;
    parent_id?: number;
  }) => void;
  onEditComment?: (id: number, newText: string) => void;
  onClose: () => void;
}

export default function CommentSection({
  comments,
  commentableId,
  commentableType,
  onAddComment,
  onEditComment,
  onClose,
}: Props) {
  const { auth } = usePage().props as any;
  const userFirstName = auth.user.first_name;
  const userId = auth.user.id;
  // Match Sidebar logic for resolving profile picture URLs
  const getProfilePictureUrl = (profilePicture?: string | null) => {
    if (!profilePicture) return null;
    if (profilePicture.startsWith('/storage/')) return profilePicture;
    return `/storage/${profilePicture}`;
  };

  const currentUserProfileRaw: string | null = auth.user.profile_picture || auth.user.avatarUrl || null;
  const userAvatar = getProfilePictureUrl(currentUserProfileRaw) || '/images/profile.png';

  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

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

  const handleReplySubmit = (parentId: number) => {
    if (!replyText.trim()) return;

    onAddComment({
      commentable_id: commentableId,
      commentable_type: commentableType,
      text: replyText,
      parent_id: parentId,
    });

    setReplyText('');
    setReplyingTo(null);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-[600px] w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <span className="text-xl font-semibold text-gray-800">Comments</span>
        <div className="flex items-center gap-4">
          <span className="text-gray-500 font-medium">{comments.length} comments</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-600 transition p-1"
          >
            <FaTimes className="text-lg" />
          </button>
        </div>
      </div>

  {/* Comment List */}
  <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 italic">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="space-y-3">
              {/* Main Comment */}
              <div className="flex gap-3 items-start">
                {comment.user?.profile_picture || comment.user?.avatarUrl ? (
                  <img
                    src={getProfilePictureUrl(comment.user.profile_picture || comment.user.avatarUrl) || '/images/profile.png'}
                    alt={comment.user?.first_name || 'User'}
                    className="w-10 h-10 rounded-full object-cover mt-1"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      const parent = img.parentElement!;
                      parent.innerHTML = `<div class='flex w-10 h-10 items-center justify-center rounded-full bg-gray-200 text-gray-600 font-semibold text-sm'>${(comment.user?.first_name?.charAt(0) || 'U').toUpperCase()}</div>`;
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 font-semibold text-sm mt-1">
                    {(comment.user?.first_name?.charAt(0) || 'U').toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">
                        {comment.user?.first_name || 'Unknown User'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>

                    {editingId === comment.id ? (
                      <div className="space-y-2">
                        <input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200 text-black bg-white"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            className="text-xs px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                            onClick={() => handleEditSubmit(comment.id)}
                          >
                            Save
                          </button>
                          <button
                            className="text-xs px-3 py-1 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-800 text-sm">{comment.text}</p>
                    )}

                    <div className="flex items-center gap-4 mt-3">
                      <button
                        className="text-xs text-red-500 font-medium flex items-center gap-1 hover:underline"
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      >
                        <FaReply className="text-xs" /> Reply
                      </button>
                      {comment.user?.id === userId && !editingId && (
                        <button
                          className="text-xs text-blue-500 hover:underline"
                          onClick={() => handleEdit(comment.id, comment.text)}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Reply Form */}
                  {replyingTo === comment.id && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 ml-4"
                    >
                      <div className="flex gap-2 items-center">
                        {userAvatar ? (
                          <img
                            src={userAvatar}
                            alt={userFirstName}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              const parent = img.parentElement!;
                              parent.innerHTML = `<div class='flex w-8 h-8 items-center justify-center rounded-full bg-gray-200 text-gray-600 font-semibold text-xs'>${(userFirstName?.charAt(0) || 'U').toUpperCase()}</div>`;
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 font-semibold text-xs">
                            {(userFirstName?.charAt(0) || 'U').toUpperCase()}
                          </div>
                        )}
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a reply..."
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-200 text-black bg-white"
                          autoFocus
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleReplySubmit(comment.id);
                            }
                          }}
                        />
                        <button
                          onClick={() => handleReplySubmit(comment.id)}
                          className="text-red-500 hover:text-red-600 transition p-2"
                        >
                          <FaPaperPlane className="text-sm" />
                        </button>
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="text-gray-400 hover:text-gray-600 transition p-2"
                        >
                          <FaTimes className="text-sm" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 ml-4 space-y-3">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-2 items-start">
                          {reply.user?.profile_picture || reply.user?.avatarUrl ? (
                            <img
                              src={getProfilePictureUrl(reply.user.profile_picture || reply.user.avatarUrl) || '/images/profile.png'}
                              alt={reply.user?.first_name || 'User'}
                              className="w-8 h-8 rounded-full object-cover mt-1"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                const parent = img.parentElement!;
                                parent.innerHTML = `<div class='flex w-8 h-8 items-center justify-center rounded-full bg-gray-200 text-gray-600 font-semibold text-xs'>${(reply.user?.first_name?.charAt(0) || 'U').toUpperCase()}</div>`;
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 font-semibold text-xs mt-1">
                              {(reply.user?.first_name?.charAt(0) || 'U').toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900 text-sm">
                                  {reply.user?.first_name || 'Unknown User'}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {formatDate(reply.created_at)}
                                </span>
                              </div>
                              <p className="text-gray-800 text-sm">{reply.text}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Form */}
      <div className="p-6 border-t border-gray-100">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userFirstName}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                const parent = img.parentElement!;
                parent.innerHTML = `<div class='flex w-10 h-10 items-center justify-center rounded-full bg-gray-200 text-gray-600 font-semibold text-sm'>${(userFirstName?.charAt(0) || 'U').toUpperCase()}</div>`;
              }}
            />
          ) : (
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 font-semibold text-sm">
              {(userFirstName?.charAt(0) || 'U').toUpperCase()}
            </div>
          )}
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 px-4 py-3 border border-gray-200 rounded-full outline-none focus:ring-2 focus:ring-red-200 text-black bg-white"
          />
          <button
            type="submit"
            className="text-red-500 hover:text-red-600 transition p-3"
          >
            <FaPaperPlane className="text-lg" />
          </button>
        </form>
      </div>
    </div>
  );
}
