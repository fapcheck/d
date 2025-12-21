import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Copy, Check } from 'lucide-react';
import type { NoteItem } from '../types';

interface SimpleListItemProps {
    item: NoteItem;
    onDelete: () => void;
    onUpdate: (content: string) => void;
    isAccount?: boolean;
}

export const SimpleListItem: React.FC<SimpleListItemProps> = ({ item, onDelete, onUpdate, isAccount }) => {
    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(item.content);

    const handleCopy = () => {
        navigator.clipboard.writeText(item.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = () => {
        if (editContent.trim() !== item.content) {
            onUpdate(editContent.trim());
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleSave();
        } else if (e.key === 'Escape') {
            setEditContent(item.content);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass p-4 rounded-xl border border-primary/20 ring-1 ring-primary/10"
            >
                <textarea
                    autoFocus
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent text-gray-300 text-sm leading-relaxed outline-none resize-none font-mono min-h-[100px]"
                    placeholder="Empty note..."
                />
                <div className="flex justify-end mt-2 text-[10px] text-secondary">
                    Ctrl+Enter to save • Esc to cancel
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            layout
            onClick={() => setIsEditing(true)}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass p-4 rounded-xl flex items-start justify-between gap-4 group hover:bg-white/[0.03] transition-colors border border-transparent hover:border-white/5 cursor-pointer"
        >
            <div className="flex-1 whitespace-pre-wrap text-secondary font-light text-sm leading-relaxed font-mono">
                {item.content}
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                {isAccount && (
                    <button
                        onClick={handleCopy}
                        className={`p-2 rounded-lg transition-colors ${copied ? 'text-success bg-success/10' : 'text-secondary hover:text-white hover:bg-white/10'}`}
                        title="Copy content"
                    >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                )}
                <button
                    onClick={onDelete}
                    className="p-2 rounded-lg text-secondary hover:text-error hover:bg-error/10 transition-colors"
                    title="Delete"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </motion.div>
    );
};
