import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { MessageCircle, X, Send } from 'lucide-react';

const ChatWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

  useEffect(() => {
    if (isOpen && !socket && user) {
      // Initialize socket connection
      const newSocket = io(BACKEND_URL, {
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setConnected(true);
        
        // Start chat session
        newSocket.emit('start_chat', {
          userId: user._id || user.id,
          userName: user.name,
          userEmail: user.email
        });
      });

      newSocket.on('chat_started', (data) => {
        setSessionId(data.sessionId);
        setMessages(data.messages || []);
      });

      newSocket.on('new_message', (message) => {
        setMessages((prev) => [...prev, message]);
      });

      newSocket.on('agent_joined', (data) => {
        const systemMessage = {
          _id: Date.now().toString(),
          sender: 'bot',
          senderName: 'Sistem',
          text: `${data.agentName} sohbete katıldı.`,
          timestamp: new Date().toISOString()
        };
        setMessages((prev) => [...prev, systemMessage]);
      });

      newSocket.on('session_closed', () => {
        const systemMessage = {
          _id: Date.now().toString(),
          sender: 'bot',
          senderName: 'Sistem',
          text: 'Sohbet sonlandırıldı.',
          timestamp: new Date().toISOString()
        };
        setMessages((prev) => [...prev, systemMessage]);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isOpen, user, BACKEND_URL]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !socket || !sessionId) return;

    socket.emit('send_message', {
      sessionId,
      sender: 'user',
      senderName: user.name,
      text: inputMessage
    });

    setInputMessage('');
  };

  const handleClose = () => {
    setIsOpen(false);
    if (socket) {
      socket.close();
      setSocket(null);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg bg-pink-600 hover:bg-pink-700 z-50"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-2xl z-50 flex flex-col">
          <CardHeader className="bg-pink-600 text-white flex flex-row items-center justify-between py-3">
            <CardTitle className="text-lg flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              Canlı Destek
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-white hover:bg-pink-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {!connected && (
                <div className="text-center text-gray-500 py-4">
                  Bağlanıyor...
                </div>
              )}
              
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-4 py-2 ${
                      msg.sender === 'user'
                        ? 'bg-pink-600 text-white'
                        : msg.sender === 'bot'
                        ? 'bg-gray-200 text-gray-800'
                        : 'bg-blue-100 text-gray-800'
                    }`}
                  >
                    {msg.sender !== 'user' && (
                      <p className="text-xs font-semibold mb-1">
                        {msg.senderName}
                      </p>
                    )}
                    <p className="text-sm">{msg.text}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(msg.timestamp).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                  disabled={!connected || !sessionId}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={!connected || !sessionId || !inputMessage.trim()}
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default ChatWidget;
