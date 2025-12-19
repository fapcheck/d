/**
 * Client/Project selector dropdown for quick task adding.
 * Supports multi-select, select all, and search filtering.
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ChevronDown, Check, Briefcase, Hash, Users, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Client } from '../types';

interface ClientSelectorProps {
    clients: Client[];
    selectedClientIds: Set<number>;
    parsedClientId: number | null;
    isOpen: boolean;
    onToggleOpen: () => void;
    onToggleClient: (id: number) => void;
    onSelectAll: () => void;
    onClearAll: () => void;
}

/**
 * Dropdown for selecting projects with multi-select and search.
 */
export const ClientSelector: React.FC<ClientSelectorProps> = ({
    clients,
    selectedClientIds,
    parsedClientId,
    isOpen,
    onToggleOpen,
    onToggleClient,
    onSelectAll,
    onClearAll,
}) => {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const allSelected = clients.length > 0 && selectedClientIds.size === clients.length;

    // Filter clients by search query
    const filteredClients = useMemo(() => {
        if (!searchQuery.trim()) return clients;
        const query = searchQuery.toLowerCase();
        return clients.filter(c => c.name.toLowerCase().includes(query));
    }, [clients, searchQuery]);

    // Final client IDs for display
    const finalClientIds = selectedClientIds.size > 0
        ? Array.from(selectedClientIds)
        : parsedClientId ? [parsedClientId] : [];

    // Button label
    const selectionLabel = (() => {
        if (allSelected) return `ALL (${clients.length})`;
        if (selectedClientIds.size > 1) return `Selected: ${selectedClientIds.size}`;
        if (selectedClientIds.size === 1) {
            const id = Array.from(selectedClientIds)[0];
            return clients.find(c => c.id === id)?.name || 'Project...';
        }
        if (parsedClientId) {
            return clients.find(c => c.id === parsedClientId)?.name || 'Project...';
        }
        return 'Project...';
    })();

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                if (isOpen) onToggleOpen();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onToggleOpen]);

    // Focus search on open
    useEffect(() => {
        if (isOpen && searchRef.current) {
            setTimeout(() => searchRef.current?.focus(), 100);
        }
        if (!isOpen) {
            setSearchQuery('');
        }
    }, [isOpen]);

    return (
        <div className="w-full md:w-1/4 relative z-40" ref={dropdownRef}>
            <button
                onClick={onToggleOpen}
                className={`
          w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 outline-none
          ${isOpen ? 'bg-white/10 text-white' : 'bg-transparent text-secondary hover:text-white hover:bg-white/5'}
        `}
            >
                <span className="truncate flex items-center gap-2 font-medium">
                    {finalClientIds.length > 0 ? (
                        <>
                            {allSelected ? <Users size={16} className="text-primary" /> : <Briefcase size={16} className="text-primary" />}
                            {selectionLabel}
                        </>
                    ) : (
                        <span className="opacity-50 flex items-center gap-2">
                            <Hash size={16} /> {selectionLabel}
                        </span>
                    )}
                </span>
                <ChevronDown
                    size={16}
                    className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 right-0 mt-2 max-h-80 overflow-hidden rounded-xl border border-white/10 bg-[#161b22] shadow-2xl z-50"
                    >
                        {/* Search Input */}
                        <div className="p-2 border-b border-white/5">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                                <input
                                    ref={searchRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search projects..."
                                    className="w-full bg-white/5 text-white pl-9 pr-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary/50 placeholder-secondary/50"
                                />
                            </div>
                        </div>

                        <div className="overflow-y-auto max-h-60 p-1 scrollbar-thin scrollbar-thumb-white/10">
                            {clients.length === 0 ? (
                                <div className="p-4 text-center text-secondary text-sm">No projects</div>
                            ) : filteredClients.length === 0 ? (
                                <div className="p-4 text-center text-secondary text-sm">No matches for "{searchQuery}"</div>
                            ) : (
                                <>
                                    {/* Row: ALL - only show if no search query */}
                                    {!searchQuery.trim() && (
                                        <>
                                            <button
                                                onClick={() => (allSelected ? onClearAll() : onSelectAll())}
                                                className={`
                          w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all mb-1
                          ${allSelected ? 'bg-primary/20 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                        `}
                                            >
                                                <span className="truncate font-bold tracking-wider">ALL PROJECTS</span>
                                                <span className="text-[10px] opacity-50 uppercase">
                                                    {allSelected ? 'Selected' : `Select (${clients.length})`}
                                                </span>
                                            </button>
                                            <div className="h-px bg-white/5 my-1 mx-2" />
                                        </>
                                    )}

                                    {/* Individual Clients */}
                                    {filteredClients.map((client) => {
                                        const isChecked = selectedClientIds.has(client.id);
                                        return (
                                            <button
                                                key={client.id}
                                                onClick={() => onToggleClient(client.id)}
                                                className={`
                          w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all mb-0.5 last:mb-0
                          ${isChecked ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                        `}
                                            >
                                                <div className="flex items-center gap-2 truncate">
                                                    <div className={`w-5 h-5 rounded border border-white/10 flex items-center justify-center transition-colors ${isChecked ? 'bg-primary/30 border-primary/50' : 'bg-transparent'}`}>
                                                        {isChecked && <Check size={12} className="text-primary" />}
                                                    </div>
                                                    <span className="truncate">{client.name}</span>
                                                </div>
                                                <span className="text-[10px] text-secondary opacity-50">
                                                    {client.tasks.filter(t => !t.isDone).length} active
                                                </span>
                                            </button>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="absolute right-0 top-2 bottom-2 w-px bg-white/5 hidden md:block pointer-events-none"></div>
        </div>
    );
};
