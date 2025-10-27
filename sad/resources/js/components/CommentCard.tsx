import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, User, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export interface CommentCardData {
  id: string;
  text: string;
  creatorName: string;
  creatorRole: string;
  status: 'pending' | 'addressed' | 'resolved';
  pageNumber: number;
  created: string;
  studentResponse?: string;
  // Coordinate data for PDF highlighting
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface CommentCardProps {
  comment: CommentCardData;
  isSelected?: boolean;
  onClick?: () => void;
  isStudent?: boolean;
  onReplyClick?: () => void;
}

export default function CommentCard({ comment, isSelected, onClick, isStudent = false, onReplyClick }: CommentCardProps) {
  const getStatusIcon = () => {
    switch (comment.status) {
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'addressed':
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = () => {
    switch (comment.status) {
      case 'resolved':
        return 'bg-green-50 border-green-200';
      case 'addressed':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  const getRoleBadgeColor = () => {
    const roleColors: Record<string, string> = {
      admin_assistant: 'bg-purple-100 text-purple-800',
      moderator: 'bg-indigo-100 text-indigo-800',
      academic_coordinator: 'bg-cyan-100 text-cyan-800',
      dean: 'bg-red-100 text-red-800',
      vp_finance: 'bg-emerald-100 text-emerald-800',
    };
    return roleColors[comment.creatorRole] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = () => {
    const roleLabels: Record<string, string> = {
      admin_assistant: 'Admin Assistant',
      moderator: 'Moderator',
      academic_coordinator: 'Academic Coordinator',
      dean: 'Dean',
      vp_finance: 'VP Finance',
    };
    return roleLabels[comment.creatorRole] || comment.creatorRole;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`
        relative p-4 rounded-xl border-2 shadow-md transition-all cursor-pointer
        ${isSelected 
          ? 'border-red-500 bg-red-50 shadow-xl ring-2 ring-red-200' 
          : `${getStatusColor()} hover:shadow-lg`
        }
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <MessageSquare className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">{comment.creatorName}</span>
              {getStatusIcon()}
            </div>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor()}`}>
              {getRoleLabel()}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-medium text-gray-500">Page {comment.pageNumber}</span>
          <div className="text-xs text-gray-400 mt-0.5">
            {new Date(comment.created).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Comment Text */}
      <div className="mb-3">
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap line-clamp-3">
          {comment.text}
        </p>
      </div>

      {/* Student Response (if any) */}
      {comment.studentResponse && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-3 h-3 text-blue-600" />
            <span className="text-xs font-semibold text-blue-600">Your Response</span>
          </div>
          <p className="text-xs text-gray-700 bg-white px-3 py-2 rounded-lg border border-gray-200 line-clamp-2">
            {comment.studentResponse}
          </p>
        </div>
      )}

      {/* Footer: status + actions */}
      <div className="mt-3 flex items-center justify-between">
        <span className={`
          inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold
          ${comment.status === 'resolved' 
            ? 'bg-green-100 text-green-800' 
            : comment.status === 'addressed' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-yellow-100 text-yellow-800'
          }
        `}>
          {comment.status === 'resolved' ? 'Resolved' : comment.status === 'addressed' ? 'Addressed' : 'Pending'}
        </span>

        <div className="flex items-center gap-3">
          {/* Red pressed indicator when selected */}
          {isSelected && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-block w-2 h-2 bg-red-600 rounded-full"
            />
          )}

          {/* Reply button (students) */}
          {isStudent && comment.status !== 'resolved' && (
            <button
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={(e) => { e.stopPropagation(); onReplyClick && onReplyClick(); }}
            >
              {comment.status === 'addressed' ? 'Edit Reply' : 'Reply'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
