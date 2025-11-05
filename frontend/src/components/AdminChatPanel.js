import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { MessageCircle, Send, User, Clock, XCircle } from 'lucide-react';
import { toast } from '../hooks/use-toast';

const AdminChatPanel = () => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]); // Sessions taken by this agent
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

  useEffect(() => {
    if (user) {
      // Initialize socket connection
      const newSocket = io(BACKEND_URL, {
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('Agent socket connected');
        setConnected(true);
        
        // Join as agent
        newSocket.emit('agent_join', {
          agentId: user._id || user.id,
          agentName: user.name
        });
      });

      newSocket.on('agent_sessions', (data) => {
        setSessions(data.sessions || []);
      });

      newSocket.on('new_session', (data) => {
        // Add new session to list
        setSessions((prev) => [{
          _id: data.sessionId,
          userName: data.userName,
          userEmail: data.userEmail,
          status: 'waiting',
          startedAt: new Date().toISOString()
        }, ...prev]);
        
        toast({
          title: 'Yeni Destek Talebi',
          description: `${data.userName} canlı destek talebinde bulundu`
        });
      });

      newSocket.on('session_taken', (data) => {
        setSelectedSession(data.sessionId);
        setMessages(data.messages || []);
        setActiveSessions((prev) => [...prev, data.sessionId]);
      });

      newSocket.on('new_message', (message) => {
        if (message.sessionId === selectedSession) {
          setMessages((prev) => [...prev, message]);
        }
      });

      newSocket.on('session_closed', (data) => {
        setSessions((prev) => prev.filter((s) => s._id !== data.sessionId));
        setActiveSessions((prev) => prev.filter((id) => id !== data.sessionId));
        
        if (selectedSession === data.sessionId) {
          setSelectedSession(null);
          setMessages([]);
        }
      });

      newSocket.on('disconnect', () => {
        console.log('Agent socket disconnected');
        setConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user, BACKEND_URL]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTakeSession = (session) => {
    if (!socket) return;
    
    socket.emit('agent_take_session', {
      sessionId: session._id,
      agentId: user._id || user.id,
      agentName: user.name
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !socket || !selectedSession) return;

    socket.emit('send_message', {
      sessionId: selectedSession,
      sender: 'agent',
      senderName: user.name,
      text: inputMessage
    });

    setInputMessage('');
  };

  const handleCloseSession = () => {
    if (!socket || !selectedSession) return;
    
    socket.emit('close_session', {
      sessionId: selectedSession
    });
    
    setSelectedSession(null);
    setMessages([]);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      waiting: { label: 'Bekliyor', color: 'bg-yellow-100 text-yellow-700' },
      active: { label: 'Aktif', color: 'bg-green-100 text-green-700' },
      closed: { label: 'Kapalı', color: 'bg-gray-100 text-gray-700' }
    };
    const { label, color } = statusMap[status] || statusMap.waiting;
    
    return <Badge className={color}>{label}</Badge>;
  };

  if (!connected) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Canlı destek sistemine bağlanıyor...</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6 h-[600px]">
      {/* Sessions List */}
      <Card className="md:col-span-1 overflow-hidden flex flex-col">
        <CardHeader>
          <CardTitle className="text-sm">Aktif Oturumlar ({sessions.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Bekleyen oturum yok</p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {sessions.map((session) => (
                <Card
                  key={session._id}
                  className={`cursor-pointer transition-all ${
                    selectedSession === session._id
                      ? 'border-pink-600 shadow-md'
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => {
                    if (!activeSessions.includes(session._id) && session.status === 'waiting') {
                      handleTakeSession(session);
                    } else if (activeSessions.includes(session._id)) {
                      setSelectedSession(session._id);
                      // Load messages for this session if needed
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="font-semibold text-sm">{session.userName}</span>
                      </div>
                      {getStatusBadge(session.status)}
                    </div>
                    <p className="text-xs text-gray-500">{session.userEmail}</p>
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(session.startedAt).toLocaleTimeString('tr-TR')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="md:col-span-2 overflow-hidden flex flex-col">
        {!selectedSession ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p>Bir oturum seçin</p>
            </div>
          </div>
        ) : (
          <>
            <CardHeader className="bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {sessions.find((s) => s._id === selectedSession)?.userName}
                  </CardTitle>
                  <CardDescription>
                    {sessions.find((s) => s._id === selectedSession)?.userEmail}
                  </CardDescription>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCloseSession}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Oturumu Kapat
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-4 py-2 ${
                      msg.sender === 'agent'
                        ? 'bg-pink-600 text-white'
                        : msg.sender === 'bot'
                        ? 'bg-gray-200 text-gray-800'
                        : 'bg-blue-100 text-gray-800'
                    }`}
                  >
                    {msg.sender !== 'agent' && (
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
            </CardContent>

            <CardContent className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};

export default AdminChatPanel;
