/**
 * ProfileEditor component for editing DMCA client profile information.
 * Extracted from App.tsx for better modularity.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Save } from 'lucide-react';
import type { Client, DmcaProfile } from '../types';

interface ProfileEditorProps {
    client: Client;
    onUpdateProfile: (clientId: number, profile: Partial<DmcaProfile>) => void;
    onNotify?: (message: string) => void;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({
    client,
    onUpdateProfile,
    onNotify,
}) => {
    const handleSave = () => {
        if (onNotify) onNotify('Profile Saved Successfully');
    };

    const updateField = (field: keyof DmcaProfile, value: string) => {
        onUpdateProfile(client.id, { ...client.dmcaProfile, [field]: value });
    };

    return (
        <motion.div
            key="profile-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6 flex-1 overflow-y-auto pr-2"
        >
            <div className="glass p-8 rounded-2xl border border-white/5 space-y-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <UserCheck size={20} className="text-primary" />   DMCA Client Profile
                    </h3>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                    >
                        <Save size={16} />
                        Save Profile
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-secondary">Name</label>
                        <input
                            type="text"
                            value={client.dmcaProfile?.legalName || ''}
                            onChange={(e) => updateField('legalName', e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                            placeholder="e.g. John Doe"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-secondary">Contact Email</label>
                        <input
                            type="text"
                            value={client.dmcaProfile?.email || ''}
                            onChange={(e) => updateField('email', e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                            placeholder="e.g. legal@example.com"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-secondary">Phone Number</label>
                        <input
                            type="text"
                            value={client.dmcaProfile?.phone || ''}
                            onChange={(e) => updateField('phone', e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                            placeholder="e.g. +1 (555) 123-4567"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-secondary">Physical Address</label>
                        <input
                            type="text"
                            value={client.dmcaProfile?.address || ''}
                            onChange={(e) => updateField('address', e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                            placeholder="e.g. 123 Legal Avenue, NY, USA"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-secondary">Original Source / Model Page URL</label>
                    <input
                        type="text"
                        value={client.dmcaProfile?.contentSourceUrl || ''}
                        onChange={(e) => updateField('contentSourceUrl', e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                        placeholder="e.g. https://example.com/models/my-client-model"
                    />
                    <p className="text-xs text-secondary/40">This link will be included in the letter to specify the original authorized content.</p>
                </div>

                <div className="pt-4 border-t border-white/5">
                    <p className="text-xs text-secondary/60 italic">These details will be automatically used by the AI to sign off your DMCA letters.</p>
                </div>
            </div>
        </motion.div>
    );
};
