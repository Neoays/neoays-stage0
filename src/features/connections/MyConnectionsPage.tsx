import React, { useState } from 'react';
import { useConnections } from '../../contexts/ConnectionsContext';
import { UserConnection } from '../../types';
import { PlusIcon, SearchIcon } from '../../components/Icons';

export default function MyConnectionsPage() {
    const { connections, loading, deleteConnection, updateConnection } = useConnections();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterCountry, setFilterCountry] = useState('');
    const [sortBy, setSortBy] = useState<'recent' | 'name' | 'category'>('recent');

    const filteredConnections = connections
        .filter((conn) => {
            const matchesSearch = conn.profileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                conn.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                conn.category?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = !filterCategory || conn.category === filterCategory;
            const matchesCountry = !filterCountry || conn.country === filterCountry;
            return matchesSearch && matchesCategory && matchesCountry;
        })
        .sort((a, b) => {
            if (sortBy === 'name') return a.profileName.localeCompare(b.profileName);
            if (sortBy === 'category') return (a.category || '').localeCompare(b.category || '');
            // Default: recent
            return (b.addedAt?.toMillis ? b.addedAt.toMillis() : 0) - (a.addedAt?.toMillis ? a.addedAt.toMillis() : 0);
        });

    const uniqueCategories = Array.from(new Set(connections.map(c => c.category).filter(Boolean)));
    const uniqueCountries = Array.from(new Set(connections.map(c => c.country).filter(Boolean)));

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading connections...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">My Connections</h1>
                    <p className="text-gray-600">Manage your saved contacts and network ({connections.length} total)</p>
                </div>

                {/* Search & Filters */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search connections..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-indigo-500"
                            />
                        </div>

                        {/* Category Filter */}
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-indigo-500"
                        >
                            <option value="">All Categories</option>
                            {uniqueCategories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>

                        {/* Country Filter */}
                        <select
                            value={filterCountry}
                            onChange={(e) => setFilterCountry(e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-indigo-500"
                        >
                            <option value="">All Countries</option>
                            {uniqueCountries.map((country) => (
                                <option key={country} value={country}>{country}</option>
                            ))}
                        </select>

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-indigo-500"
                        >
                            <option value="recent">Most Recent</option>
                            <option value="name">Name (A-Z)</option>
                            <option value="category">Category</option>
                        </select>
                    </div>
                </div>

                {/* Connections Grid */}
                {filteredConnections.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-gray-500 text-lg mb-4">No connections found</p>
                        <p className="text-gray-400 text-sm">Save profiles you discover to build your network</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredConnections.map((conn) => (
                            <ConnectionCard key={conn.id} connection={conn} onDelete={deleteConnection} onUpdate={updateConnection} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

interface ConnectionCardProps {
    connection: UserConnection;
    onDelete: (id: string) => Promise<void>;
    onUpdate: (id: string, updates: Partial<UserConnection>) => Promise<void>;
}

function ConnectionCard({ connection, onDelete, onUpdate }: ConnectionCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [note, setNote] = useState(connection.note || '');

    const handleSaveNote = async () => {
        await onUpdate(connection.id!, { note });
        setIsEditing(false);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                        {connection.profileName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">{connection.profileName}</h3>
                        {connection.category && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{connection.category}</span>
                        )}
                    </div>
                </div>
                <button
                    onClick={() => onDelete(connection.id!)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg text-sm"
                >
                    ×
                </button>
            </div>

            {connection.city && connection.country && (
                <p className="text-sm text-gray-600 mb-2">📍 {connection.city}, {connection.country}</p>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100">
                {isEditing ? (
                    <div>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Add private notes..."
                            className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                            rows={3}
                        />
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={handleSaveNote}
                                className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => {
                                    setNote(connection.note || '');
                                    setIsEditing(false);
                                }}
                                className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div onClick={() => setIsEditing(true)} className="cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors">
                            <p className="text-xs text-gray-500 mb-1">Private Note:</p>
                            <p className="text-sm text-gray-700">{connection.note || 'Click to add note...'}</p>
                        </div>
                        <button
                            onClick={() => {
                                const targetUser = (connection as any).username || connection.profileId;
                                window.open(`/${targetUser}`, '_blank');
                            }}
                            className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
                        >
                            View Profile
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
