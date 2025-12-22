import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Settings, Plus, Pencil, X, Zap, Copy } from 'lucide-react';
import { generateDmcaLetter } from '../services/aiService';
import { logger } from '../utils';
import type { Client, AppSettings, DmcaProfile } from '../types';

interface DmcaGeneratorProps {
    client: Client;
    settings: AppSettings;
    onOpenSettings: () => void;
    onNotify?: (message: string) => void;
    actions: {
        addDmcaSite: (site: string) => void;
        removeDmcaSite: (site: string) => void;
        renameDmcaSite: (oldName: string, newName: string) => void;
        addDmcaHosting: (hosting: string) => void;
        removeDmcaHosting: (hosting: string) => void;
        renameDmcaHosting: (oldName: string, newName: string) => void;
    };
}

export const DmcaGenerator: React.FC<DmcaGeneratorProps> = ({
    client,
    settings,
    onOpenSettings,
    onNotify,
    actions
}) => {
    // --- Local State ---
    const [recipientType, setRecipientType] = useState<'site' | 'hosting' | 'upstream'>('site');
    const [isManagingSites, setIsManagingSites] = useState(false);
    const [newSiteName, setNewSiteName] = useState('');
    const [editingSite, setEditingSite] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const [isManagingHostings, setIsManagingHostings] = useState(false);
    const [newHostingName, setNewHostingName] = useState('');
    const [editingHosting, setEditingHosting] = useState<string | null>(null);
    const [editHostingValue, setEditHostingValue] = useState('');
    const [selectedSitesForHosting, setSelectedSitesForHosting] = useState<string[]>([]);

    const [dmcaContent, setDmcaContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Refs for select elements instead of document.getElementById
    const siteSelectRef = useRef<HTMLSelectElement>(null);
    const hostingSelectRef = useRef<HTMLSelectElement>(null);
    const upstreamSelectRef = useRef<HTMLSelectElement>(null);

    const handleGenerate = async () => {
        const isHostingMode = recipientType === 'hosting';
        const isUpstreamMode = recipientType === 'upstream';

        let target: string;
        if (isUpstreamMode) {
            target = upstreamSelectRef.current?.value || 'Upstream Provider';
        } else if (isHostingMode) {
            target = hostingSelectRef.current?.value || 'Generic Hosting';
        } else {
            target = siteSelectRef.current?.value || 'Generic Site';
        }

        if (!settings.groqApiKey) {
            alert("Please configure your Groq API Key in Settings > AI Integration first.");
            onOpenSettings();
            return;
        }

        setIsGenerating(true);
        setDmcaContent('Generating with Groq Llama 3...');

        try {
            let currentText = '';
            await generateDmcaLetter(
                client.name,
                target,
                settings.groqApiKey,
                client.dmcaProfile,
                (token) => {
                    currentText += token;
                    setDmcaContent(currentText);
                },
                isUpstreamMode ? 'upstream' : (isHostingMode ? 'hosting' : 'site'),
                (isHostingMode || isUpstreamMode) ? selectedSitesForHosting : undefined
            );
            onNotify?.(`AI generated letter for ${target}`);
        } catch (error) {
            logger.error("AI Generation failed", error as Error);
            const template = `Date: ${new Date().toLocaleDateString()}

To Whom It May Concern at ${target},

I am writing regarding the unauthorized use of my intellectual property ${isHostingMode && selectedSitesForHosting.length > 0 ? `on the following sites hosted by your service: ${selectedSitesForHosting.join(', ')}` : `on your platform (${target})`}.

The original copyrighted work is: [DESCRIPTION OF WORK]
The unauthorized material is located at: [URL]

I have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.

I state, under penalty of perjury, that the information in this notification is accurate and that I am authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.

Sincerely,
[YOUR NAME]`;
            setDmcaContent(template);
            alert("Generation failed. Using offline template. Check your API Key.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <motion.div
            key="dmca-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-4 flex-1 overflow-y-auto"
        >
            {/* Generator Controls */}
            <div className="glass p-6 rounded-2xl border border-white/5 relative overflow-visible group flex-shrink-0">
                <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors duration-500"></div>

                {/* Recipient Type Toggle */}
                <div className="flex gap-2 mb-4 z-10 relative">
                    <button
                        onClick={() => setRecipientType('site')}
                        className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${recipientType === 'site' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-secondary hover:bg-white/10'}`}
                    >
                        🌐 Website
                    </button>
                    <button
                        onClick={() => setRecipientType('hosting')}
                        className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${recipientType === 'hosting' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-secondary hover:bg-white/10'}`}
                    >
                        🖥️ Hosting
                    </button>
                    <button
                        onClick={() => setRecipientType('upstream')}
                        className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${recipientType === 'upstream' ? 'bg-warning/20 text-warning border border-warning/30' : 'bg-white/5 text-secondary hover:bg-white/10'}`}
                    >
                        ⬆️ Upstream
                    </button>
                </div>

                <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 z-10">
                        {recipientType === 'site' && (
                            <>
                                <label className="text-secondary/60 text-xs font-bold uppercase tracking-wider mb-2 block">Target Website</label>
                                <div className="flex items-center gap-3 bg-black/20 p-1 rounded-xl border border-white/5 focus-within:border-primary/50 transition-colors">
                                    <div className="p-2 bg-white/5 rounded-lg text-white">
                                        <LayoutDashboard size={18} />
                                    </div>
                                    <select
                                        ref={siteSelectRef}
                                        id="dmca-site-select"
                                        className="bg-transparent border-none text-white text-sm font-medium focus:ring-0 w-full outline-none [&>option]:bg-surface [&>option]:text-white"
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Choose site...</option>
                                        {(settings.dmcaSites || []).map(site => (
                                            <option key={site} value={site}>{site}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => setIsManagingSites(!isManagingSites)}
                                        className="p-2 hover:bg-white/10 rounded-lg text-secondary hover:text-white transition-colors"
                                        title="Manage Sites"
                                    >
                                        <Settings size={14} />
                                    </button>
                                </div>

                                {/* Site Manager */}
                                <AnimatePresence>
                                    {isManagingSites && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="mt-4 p-4 bg-black/40 rounded-xl border border-white/10 space-y-3">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={newSiteName}
                                                        onChange={(e) => setNewSiteName(e.target.value)}
                                                        placeholder="Add new site..."
                                                        className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && newSiteName.trim()) {
                                                                actions.addDmcaSite(newSiteName.trim());
                                                                setNewSiteName('');
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            if (newSiteName.trim()) {
                                                                actions.addDmcaSite(newSiteName.trim());
                                                                setNewSiteName('');
                                                            }
                                                        }}
                                                        className="px-3 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-xs font-bold transition-colors"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                                                    {(settings.dmcaSites || []).map(site => (
                                                        <div key={site} className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded text-xs text-secondary group hover:bg-white/10 transition-colors">
                                                            {editingSite === site ? (
                                                                <input
                                                                    autoFocus
                                                                    type="text"
                                                                    value={editValue}
                                                                    onChange={(e) => setEditValue(e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            if (editValue.trim() && editValue !== site) {
                                                                                actions.renameDmcaSite(site, editValue.trim());
                                                                            }
                                                                            setEditingSite(null);
                                                                        } else if (e.key === 'Escape') {
                                                                            setEditingSite(null);
                                                                        }
                                                                    }}
                                                                    onBlur={() => {
                                                                        if (editValue.trim() && editValue !== site) {
                                                                            actions.renameDmcaSite(site, editValue.trim());
                                                                        }
                                                                        setEditingSite(null);
                                                                    }}
                                                                    className="bg-black/40 border border-primary/50 rounded px-1 py-0.5 text-white min-w-[100px] outline-none"
                                                                />
                                                            ) : (
                                                                <>
                                                                    <span onClick={() => { setEditingSite(site); setEditValue(site); }} className="cursor-pointer hover:text-white transition-colors">{site}</span>
                                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button
                                                                            onClick={() => { setEditingSite(site); setEditValue(site); }}
                                                                            className="text-secondary/50 hover:text-primary transition-colors"
                                                                        >
                                                                            <Pencil size={10} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => confirm(`Delete "${site}"?`) && actions.removeDmcaSite(site)}
                                                                            className="text-secondary/50 hover:text-error transition-colors"
                                                                        >
                                                                            <X size={12} />
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </>
                        )}
                        {recipientType === 'hosting' && (
                            <>
                                {/* Hosting Provider Section */}
                                <label className="text-secondary/60 text-xs font-bold uppercase tracking-wider mb-2 block">Target Hosting Provider</label>
                                <div className="flex items-center gap-3 bg-black/20 p-1 rounded-xl border border-white/5 focus-within:border-primary/50 transition-colors">
                                    <div className="p-2 bg-white/5 rounded-lg text-white">
                                        <LayoutDashboard size={18} />
                                    </div>
                                    <select
                                        ref={hostingSelectRef}
                                        id="dmca-hosting-select"
                                        className="bg-transparent border-none text-white text-sm font-medium focus:ring-0 w-full outline-none [&>option]:bg-surface [&>option]:text-white"
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Choose hosting...</option>
                                        {(settings.dmcaHostings || []).map(hosting => (
                                            <option key={hosting} value={hosting}>{hosting}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => setIsManagingHostings(!isManagingHostings)}
                                        className="p-2 hover:bg-white/10 rounded-lg text-secondary hover:text-white transition-colors"
                                        title="Manage Hostings"
                                    >
                                        <Settings size={14} />
                                    </button>
                                </div>

                                {/* Hosting Manager */}
                                <AnimatePresence>
                                    {isManagingHostings && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="mt-4 p-4 bg-black/40 rounded-xl border border-white/10 space-y-3">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={newHostingName}
                                                        onChange={(e) => setNewHostingName(e.target.value)}
                                                        placeholder="Add new hosting..."
                                                        className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && newHostingName.trim()) {
                                                                actions.addDmcaHosting(newHostingName.trim());
                                                                setNewHostingName('');
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            if (newHostingName.trim()) {
                                                                actions.addDmcaHosting(newHostingName.trim());
                                                                setNewHostingName('');
                                                            }
                                                        }}
                                                        className="px-3 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-xs font-bold transition-colors"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                                                    {(settings.dmcaHostings || []).map(hosting => (
                                                        <div key={hosting} className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded text-xs text-secondary group hover:bg-white/10 transition-colors">
                                                            {editingHosting === hosting ? (
                                                                <input
                                                                    autoFocus
                                                                    type="text"
                                                                    value={editHostingValue}
                                                                    onChange={(e) => setEditHostingValue(e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            if (editHostingValue.trim() && editHostingValue !== hosting) {
                                                                                actions.renameDmcaHosting(hosting, editHostingValue.trim());
                                                                            }
                                                                            setEditingHosting(null);
                                                                        } else if (e.key === 'Escape') {
                                                                            setEditingHosting(null);
                                                                        }
                                                                    }}
                                                                    onBlur={() => {
                                                                        if (editHostingValue.trim() && editHostingValue !== hosting) {
                                                                            actions.renameDmcaHosting(hosting, editHostingValue.trim());
                                                                        }
                                                                        setEditingHosting(null);
                                                                    }}
                                                                    className="bg-black/40 border border-primary/50 rounded px-1 py-0.5 text-white min-w-[100px] outline-none"
                                                                />
                                                            ) : (
                                                                <>
                                                                    <span onClick={() => { setEditingHosting(hosting); setEditHostingValue(hosting); }} className="cursor-pointer hover:text-white transition-colors">{hosting}</span>
                                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button
                                                                            onClick={() => { setEditingHosting(hosting); setEditHostingValue(hosting); }}
                                                                            className="text-secondary/50 hover:text-primary transition-colors"
                                                                        >
                                                                            <Pencil size={10} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => confirm(`Delete "${hosting}"?`) && actions.removeDmcaHosting(hosting)}
                                                                            className="text-secondary/50 hover:text-error transition-colors"
                                                                        >
                                                                            <X size={12} />
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Multi-select Sites for Hosting */}
                                <div className="mt-4">
                                    <label className="text-secondary/60 text-xs font-bold uppercase tracking-wider mb-2 block">Infringing Sites on This Host</label>
                                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-black/20 rounded-xl border border-white/10">
                                        {(settings.dmcaSites || []).length === 0 ? (
                                            <span className="text-secondary/50 text-xs">No sites added yet</span>
                                        ) : (
                                            (settings.dmcaSites || []).map(site => (
                                                <label key={site} className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded text-xs text-secondary hover:bg-white/10 cursor-pointer transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedSitesForHosting.includes(site)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedSitesForHosting(prev => [...prev, site]);
                                                            } else {
                                                                setSelectedSitesForHosting(prev => prev.filter(s => s !== site));
                                                            }
                                                        }}
                                                        className="accent-primary"
                                                    />
                                                    <span>{site}</span>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                        {recipientType === 'upstream' && (
                            <>
                                {/* Upstream Provider Section */}
                                <label className="text-secondary/60 text-xs font-bold uppercase tracking-wider mb-2 block">Upstream Provider</label>
                                <div className="flex items-center gap-3 bg-black/20 p-1 rounded-xl border border-warning/20 focus-within:border-warning/50 transition-colors">
                                    <div className="p-2 bg-warning/10 rounded-lg text-warning">
                                        <LayoutDashboard size={18} />
                                    </div>
                                    <select
                                        ref={upstreamSelectRef}
                                        id="dmca-upstream-select"
                                        className="bg-transparent border-none text-white text-sm font-medium focus:ring-0 w-full outline-none [&>option]:bg-surface [&>option]:text-white"
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Choose upstream provider...</option>
                                        {(settings.dmcaHostings || []).map(hosting => (
                                            <option key={hosting} value={hosting}>{hosting}</option>
                                        ))}
                                    </select>
                                </div>
                                <p className="text-xs text-warning/60 mt-2">
                                    ⚠️ Upstream letters escalate to the hosting provider's bandwidth/infrastructure provider
                                </p>

                                {/* Select infringing sites */}
                                <div className="mt-4">
                                    <label className="text-secondary/60 text-xs font-bold uppercase tracking-wider mb-2 block">Non-Compliant Sites/Hostings</label>
                                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-black/20 rounded-xl border border-white/10">
                                        {(settings.dmcaSites || []).length === 0 && (settings.dmcaHostings || []).length === 0 ? (
                                            <span className="text-secondary/50 text-xs">No sites/hostings added yet</span>
                                        ) : (
                                            <>
                                                {(settings.dmcaSites || []).map(site => (
                                                    <label key={site} className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded text-xs text-secondary hover:bg-white/10 cursor-pointer transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedSitesForHosting.includes(site)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedSitesForHosting(prev => [...prev, site]);
                                                                } else {
                                                                    setSelectedSitesForHosting(prev => prev.filter(s => s !== site));
                                                                }
                                                            }}
                                                            className="accent-warning"
                                                        />
                                                        <span>🌐 {site}</span>
                                                    </label>
                                                ))}
                                                {(settings.dmcaHostings || []).map(hosting => (
                                                    <label key={hosting} className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded text-xs text-secondary hover:bg-white/10 cursor-pointer transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedSitesForHosting.includes(hosting)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedSitesForHosting(prev => [...prev, hosting]);
                                                                } else {
                                                                    setSelectedSitesForHosting(prev => prev.filter(s => s !== hosting));
                                                                }
                                                            }}
                                                            className="accent-warning"
                                                        />
                                                        <span>🖥️ {hosting}</span>
                                                    </label>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="z-10">
                        <button
                            disabled={isGenerating}
                            onClick={handleGenerate}
                            className={`px-8 py-4 ${isGenerating ? 'bg-primary/50 cursor-wait' : 'bg-primary hover:bg-primary/90'} text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-primary/20 flex items-center gap-3 transform ${!isGenerating && 'hover:-translate-y-1 active:scale-95'} whitespace-nowrap`}
                        >
                            <Zap size={20} className={`fill-white ${isGenerating ? 'animate-pulse' : ''}`} />
                            {isGenerating ? 'Generating...' : 'Generate Letter'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Editable Template Area */}
            <div className="flex-1 glass rounded-2xl border border-white/5 relative group cursor-text flex flex-col min-h-[300px]" onClick={() => document.getElementById('dmca-textarea')?.focus()}>
                <div className="absolute top-4 right-4 z-20 flex gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(dmcaContent);
                            onNotify?.('DMCA Notice Copied');
                        }}
                        className="p-2 glass hover:bg-white/10 text-primary rounded-lg transition-colors"
                        title="Copy to Clipboard"
                    >
                        <Copy size={16} />
                    </button>
                </div>
                <textarea
                    id="dmca-textarea"
                    value={dmcaContent}
                    onChange={(e) => setDmcaContent(e.target.value)}
                    className="w-full h-full bg-transparent border-none outline-none p-6 font-mono text-sm text-secondary/90 leading-relaxed resize-none placeholder-white/20 min-h-[280px]"
                    placeholder="Select a site and click Generate to start..."
                    spellCheck={false}
                />
                <div className="absolute bottom-0 right-0 p-8 opacity-5 pointer-events-none">
                    <Zap size={180} />
                </div>
            </div>
        </motion.div>
    );
};
