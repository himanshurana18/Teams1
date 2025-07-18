import React, { useState, useEffect, useRef } from 'react';
import { useTeam } from '../contexts/TeamContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatTime } from '../lib/utils';
import Button from '../components/ui/Button';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Type, 
  Image, 
  Calendar,
  ChevronDown
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender: {
    id: string;
    full_name: string;
    email: string;
  };
}

const Messages: React.FC = () => {
  const { currentTeam } = useTeam();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentTeam) {
      fetchMessages();
    }
  }, [currentTeam]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!currentTeam) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles:sender_id (
            id,
            full_name,
            email
          )
        `)
        .eq('team_id', currentTeam.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages = data?.map(msg => ({
        ...msg,
        sender: msg.profiles
      })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentTeam || !user || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            team_id: currentTeam.id,
            sender_id: user.id,
            content: newMessage.trim(),
            message_type: 'team'
          }
        ]);

      if (error) throw error;

      setNewMessage('');
      fetchMessages(); // Refresh messages
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (!currentTeam) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Team Selected</h3>
          <p className="text-gray-600">Select a team to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">Chatter</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Button className="bg-blue-500 hover:bg-blue-600 text-white">
            New Message
          </Button>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>{currentTeam.season || 'winter 39/2023'}</span>
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 bg-gray-50 overflow-hidden">
        <div className="h-full flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-6">
                <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Start the conversation
              </h3>
              <p className="text-gray-600 max-w-md">
                Team chatter allows you to communicate with your team in one convenient place.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {messages.map((message) => {
                const isCurrentUser = message.sender_id === user?.id;
                const senderName = message.sender?.full_name || message.sender?.email || 'Unknown';
                const initials = senderName.split(' ').map(n => n[0]).join('').toUpperCase();

                return (
                  <div key={message.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-white">
                          {initials}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {senderName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 bg-white rounded-lg px-3 py-2 shadow-sm border">
                        {message.content}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 px-6 py-4">
            <form onSubmit={handleSendMessage} className="space-y-3">
              <div className="relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Your message..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  disabled={sending}
                />
              </div>
              
              {/* Toolbar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Attach file"
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Add emoji"
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="GIF"
                  >
                    <Type className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Add image"
                  >
                    <Image className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Schedule message"
                  >
                    <Calendar className="h-5 w-5" />
                  </button>
                </div>
                
                <Button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>{sending ? 'Sending...' : 'Send'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;