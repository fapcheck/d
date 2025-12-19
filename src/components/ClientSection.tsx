import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ClientCard } from './ClientCard';
import { PRIORITY_CONFIG } from '../constants';
import type { Priority, Client } from '../types';

interface ClientSectionProps {
    type: Priority;
    title: string;
    items: Client[];
    isOpen: boolean;
    onToggle: () => void;
    onSelectClient: (id: number) => void;
    onRemoveClient: (id: number) => void;
    onUpdatePriority: (id: number, priority: Priority) => void;
}

export const ClientSection: React.FC<ClientSectionProps> = ({
    type, title, items, isOpen, onToggle,
    onSelectClient, onRemoveClient, onUpdatePriority
}) => {
    if (items.length === 0) return null;

    return (
        <div className="w-full">
            <button
                onClick={onToggle}
                className={`flex items-center gap-3 w-full text-left mb-4 group ${PRIORITY_CONFIG[type].color}`}
            >
                <div className="p-1 rounded-md bg-white/5 group-hover:bg-white/10 transition-colors">
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
                <span className="font-bold text-sm tracking-widest uppercase opacity-80">{title}</span>
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-gray-400 border border-white/5">{items.length}</span>
                <div className="h-px bg-current flex-1 opacity-10 ml-2"></div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-2">
                            {items.map(client => (
                                <ClientCard
                                    key={client.id}
                                    client={client}
                                    onClick={() => onSelectClient(client.id)}
                                    onRemove={onRemoveClient}
                                    onUpdatePriority={onUpdatePriority}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};