'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { PageHeader } from '@/components/common';
import ConversationList from '@/components/messages/ConversationList';
import ChatInterface from '@/components/messages/ChatInterface';
import { MessageCircle } from 'lucide-react';

export default function StudentMessagesPage() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
    const [selectedConversation, setSelectedConversation] = useState<{
        applicationId: string;
        otherPartyName: string;
    } | null>(null);

    const handleSelectConversation = (applicationId: string) => {
        setSelectedApplicationId(applicationId);
        // This will be populated by the conversation data
        // For now, we'll set it and the ChatInterface will handle the details
        setSelectedConversation({
            applicationId,
            otherPartyName: 'Company' // This will be updated when we have the full conversation data
        });
    };

    // Handle query param for auto-selection
    useEffect(() => {
        const appId = searchParams.get('applicationId');
        if (appId) {
            handleSelectConversation(appId);
        }
    }, [searchParams]);

    if (!user) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col md:p-4 lg:p-6 lg:max-w-7xl lg:mx-auto w-full bg-gray-50 md:bg-transparent">
            {/* Mobile Header */}
            <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <h1 className="text-lg font-bold text-gray-900">Messages</h1>
                <div className="text-sm text-gray-500">
                    {selectedConversation ? 'Chat' : 'Conversations'}
                </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden md:block mb-4">
                <PageHeader
                    title="Messages"
                    subtitle="Chat with companies about your internship applications"
                />
            </div>

            <div className="flex-1 bg-white md:rounded-2xl md:shadow-sm md:border md:border-gray-200 overflow-hidden flex min-h-0">
                {/* Conversations List */}
                <div className={`w-full md:w-80 lg:w-96 border-r border-gray-100 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                    <ConversationList
                        selectedApplicationId={selectedApplicationId}
                        onSelectConversation={handleSelectConversation}
                        currentUserRole="student"
                    />
                </div>

                {/* Chat Area */}
                <div className={`flex-1 flex flex-col bg-gray-50/50 min-h-0 ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                    {selectedConversation ? (
                        <ChatInterface
                            applicationId={selectedConversation.applicationId}
                            currentUserId={user.id}
                            otherPartyName={selectedConversation.otherPartyName}
                            onBack={() => {
                                setSelectedConversation(null);
                                setSelectedApplicationId(null);
                            }}
                        />
                    ) : (
                        <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-500">
                            <div>
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MessageCircle className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Select a conversation</h3>
                                <p className="text-sm mt-1 max-w-sm mx-auto">
                                    Choose a conversation from the list to start messaging with companies.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
