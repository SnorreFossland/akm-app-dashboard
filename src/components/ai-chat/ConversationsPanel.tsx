import React, { useState } from 'react';

export interface ConversationsPanelProps {
    conversations: any[];
    onSelectConversation: (conversation: any) => void;
    onDeleteConversation: (id: string) => void;
    onSaveConversation: () => void;
    currentMessages?: any[];
}

const ConversationsPanel: React.FC<ConversationsPanelProps> = ({
    conversations,
    onSelectConversation,
    onDeleteConversation,
    onSaveConversation,
    currentMessages = []
}) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

    const handleSelectConversation = (conversation: any) => {
        // Toggle selected state - if clicking the same conversation, close it
        if (selectedId === conversation.id) {
            setSelectedId(null);
            // You might want to call onSelectConversation with null or empty data
            // depending on how your parent component handles this
            onSelectConversation(null);
        } else {
            setSelectedId(conversation.id);
            onSelectConversation(conversation);
        }
    };

    const handleCopyMessage = (content: string, messageId: string) => {
        navigator.clipboard.writeText(content);
        setCopiedMsgId(messageId);
        setTimeout(() => setCopiedMsgId(null), 2000);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Saved AI Conversations</h3>
                <button
                    onClick={onSaveConversation}
                    disabled={!currentMessages.length}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm disabled:opacity-50"
                >
                    Save Current Conversation
                </button>
            </div>

            {conversations.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                    No saved conversations yet
                </div>
            ) : (
                <div className="overflow-auto flex-1">
                    <div className="mb-4">
                        {conversations.map((conversation) => (
                            <React.Fragment key={conversation.id}>
                                <div
                                    onClick={() => handleSelectConversation(conversation)}
                                    className={`border ${selectedId === conversation.id ? 'border-blue-500 bg-gray-800' : 'border-gray-700'} 
                                          rounded mb-2 p-3 hover:bg-gray-800 cursor-pointer`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="font-medium">{conversation.title}</h4>
                                            <p className="text-xs text-gray-400">{conversation.date}</p>
                                            <p className="text-sm text-gray-300 mt-1">
                                                {conversation.messages?.length || 0} messages
                                            </p>
                                        </div>
                                        <div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteConversation(conversation.id);
                                                }}
                                                className="px-2 py-1 bg-red-700 hover:bg-red-600 text-white rounded text-xs"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Show messages directly under the selected conversation */}
                                {selectedId === conversation.id && (
                                    <div className="mb-4 ml-4 mr-2 border-l-2 border-blue-500 pl-3">
                                        <h4 className="text-sm font-medium mb-2">Messages</h4>
                                        <div className="rounded bg-gray-900 p-2 max-h-64 overflow-y-auto">
                                            {conversation.messages?.map((message: any, index: number) => {
                                                const messageId = `${conversation.id}-${index}`;
                                                return (
                                                    <div key={index} className={`mb-2 p-2 rounded ${message.role === 'user' ? 'bg-gray-800' : 'bg-gray-700'}`}>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <div className="text-xs font-bold">
                                                                {message.role === 'user' ? 'You' : 'AI'}
                                                            </div>
                                                            <button
                                                                onClick={() => handleCopyMessage(message.content, messageId)}
                                                                className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-0.5 rounded"
                                                                title="Copy message"
                                                            >
                                                                {copiedMsgId === messageId ? 'Copied!' : 'Copy'}
                                                            </button>
                                                        </div>
                                                        <div className="text-sm">
                                                            {message.content}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConversationsPanel;