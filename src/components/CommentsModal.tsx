import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Plus, User } from 'lucide-react';
import type { Comment } from '../types';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
  onAddComment: (text: string) => void;
  taskTitle: string;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({
  isOpen,
  onClose,
  comments,
  onAddComment,
  taskTitle
}) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(newComment.trim());
      setNewComment('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-[#161b22] border border-white/10 w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 max-h-[80vh] flex flex-col"
      >
        <div className="flex justify-between items-center p-6 border-b border-white/5">
          <div>
            <h2 className="text-2xl font-bold text-white">Comments</h2>
            <p className="text-secondary text-sm mt-1 truncate max-w-md">{taskTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-secondary transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence>
              {comments.length === 0 ? (
                <div className="text-center py-12 text-secondary/40">
                  <MessageCircle size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-light">No comments yet</p>
                  <p className="text-sm">Be the first to leave a note!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-bg/50 rounded-2xl p-4 border border-white/5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                        <User size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white">{comment.author}</span>
                          <span className="text-xs text-secondary">
                            {new Date(comment.createdAt).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed break-words">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Add Comment Form */}
          <div className="border-t border-white/5 p-6">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                <User size={14} />
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 bg-bg/50 text-white px-4 py-3 rounded-xl outline-none focus:ring-1 focus:ring-primary/50 border border-white/5 placeholder-secondary/40"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="bg-primary/20 hover:bg-primary hover:text-bg text-primary px-6 py-3 rounded-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};