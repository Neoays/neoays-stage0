import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../services/firebaseConfig';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { UserConnection } from '../types';

interface ConnectionsContextType {
    connections: UserConnection[];
    loading: boolean;
    addConnection: (connection: Omit<UserConnection, 'id' | 'savedAt' | 'lastModified'>) => Promise<void>;
    updateConnection: (id: string, updates: Partial<UserConnection>) => Promise<void>;
    deleteConnection: (id: string) => Promise<void>;
}

const ConnectionsContext = createContext<ConnectionsContextType | undefined>(undefined);

export const ConnectionsProvider: React.FC<{ userId: string; children: ReactNode }> = ({ userId, children }) => {
    const [connections, setConnections] = useState<UserConnection[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setConnections([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, `users/${userId}/connections`),
            where('savedBy', '==', userId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const conns: UserConnection[] = [];
            snapshot.forEach((doc) => {
                conns.push({ id: doc.id, ...doc.data() } as UserConnection);
            });
            setConnections(conns);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching connections:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const addConnection = async (connection: Omit<UserConnection, 'id' | 'savedAt' | 'lastModified'>) => {
        try {
            await addDoc(collection(db, `users/${userId}/connections`), {
                ...connection,
                savedAt: serverTimestamp(),
                lastModified: serverTimestamp()
            });
        } catch (error) {
            console.error('Error adding connection:', error);
            throw error;
        }
    };

    const updateConnection = async (id: string, updates: Partial<UserConnection>) => {
        try {
            await updateDoc(doc(db, `users/${userId}/connections`, id), {
                ...updates,
                lastModified: serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating connection:', error);
            throw error;
        }
    };

    const deleteConnection = async (id: string) => {
        try {
            await deleteDoc(doc(db, `users/${userId}/connections`, id));
        } catch (error) {
            console.error('Error deleting connection:', error);
            throw error;
        }
    };

    return (
        <ConnectionsContext.Provider value={{ connections, loading, addConnection, updateConnection, deleteConnection }}>
            {children}
        </ConnectionsContext.Provider>
    );
};

export const useConnections = () => {
    const context = useContext(ConnectionsContext);
    if (!context) {
        throw new Error('useConnections must be used within ConnectionsProvider');
    }
    return context;
};
