import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';
import Icon from '../common/Icon';
import './AdminSupport.css';

const AdminSupport: React.FC = () => {
    const [chats, setChats] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [replyText, setReplyText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const EMOJIS = ['👋', '🍊', '🌴', '🏖', '✈️', '🏨', '🛳', '⛷', '🗺', '🦁', '👍', '❤️', '😊', '😍', '🤔', '🙌'];

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchChats = async () => {
        try {
            const data = await api.get('/staff/chats');
            setChats(data);
        } catch (err) {
            console.error('Failed to fetch chats:', err);
        }
    };

    const fetchHistory = async (userId: number) => {
        try {
            const data = await api.get(`/chat/history?other_user_id=${userId}`);
            setMessages(data);
        } catch (err) {
            console.error('Failed to fetch history:', err);
        }
    };

    useEffect(() => {
        fetchChats();
        const interval = setInterval(fetchChats, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedUser) {
            fetchHistory(selectedUser.id);
            const interval = setInterval(() => fetchHistory(selectedUser.id), 3000);
            return () => clearInterval(interval);
        }
    }, [selectedUser]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (attachment?: {url: string, type: string}) => {
        if ((!replyText.trim() && !attachment) || !selectedUser) return;
        try {
            const newMsg = await api.post('/chat/send', { 
                content: replyText,
                receiver_id: selectedUser.id,
                attachment_url: attachment?.url,
                attachment_type: attachment?.type
            });
            setMessages([...messages, newMsg]);
            setReplyText('');
            setShowEmojiPicker(false);
        } catch (err) {
            console.error('Failed to send reply:', err);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedUser) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.upload(formData);
            const type = file.type.startsWith('image/') ? 'image' : 'file';
            handleSend({ url: res.url, type });
        } catch (err) {
            console.error('Admin upload failed:', err);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="admin-support-container">
            <div className="chats-list">
                <h3>Активні чати</h3>
                {chats.map(u => (
                    <div 
                        key={u.id} 
                        className={`chat-item ${selectedUser?.id === u.id ? 'active' : ''}`}
                        onClick={() => setSelectedUser(u)}
                    >
                        <div className="chat-avatar">{u.full_name[0]}</div>
                        <div className="chat-info">
                            <span className="chat-user-name">{u.full_name}</span>
                            <span className="chat-user-email">{u.email}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="chat-window">
                {selectedUser ? (
                    <>
                        <div className="chat-window-header">
                            <h4>Чат з {selectedUser.full_name}</h4>
                        </div>
                        <div className="chat-window-messages">
                            {messages.map((m, i) => (
                                <div key={i} className={`admin-msg ${m.is_from_staff ? 'staff' : 'user'}`}>
                                    <div className="msg-bubble">
                                        {m.attachment_url && (
                                            <div className="admin-attachment-preview">
                                                {m.attachment_type === 'image' ? (
                                                    <img src={m.attachment_url} alt="Attached" style={{ maxWidth: '100%', borderRadius: '8px', cursor: 'pointer' }} onClick={() => window.open(m.attachment_url)} />
                                                ) : (
                                                    <a href={m.attachment_url} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline', fontSize: '12px' }}>📁 Файл</a>
                                                )}
                                            </div>
                                        )}
                                        {m.content}
                                    </div>
                                    <span className="msg-time">{new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="chat-window-input">
                            {showEmojiPicker && (
                                <div className="admin-emoji-picker">
                                    {EMOJIS.map(e => <span key={e} onClick={() => setReplyText(replyText + e)}>{e}</span>)}
                                </div>
                            )}
                            <button className="chat-tool-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}><Icon name="star" size={20} /></button>
                            <button className="chat-tool-btn" onClick={() => fileInputRef.current?.click()}><Icon name="plane" size={20} /></button>
                            <input 
                                type="text" 
                                placeholder="Відповісти..." 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                disabled={isUploading}
                            />
                            <button onClick={() => handleSend()} disabled={isUploading}>{isUploading ? '...' : 'Надіслати'}</button>
                            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
                        </div>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <div className="empty-chat-icon"><Icon name="message" size={48} style={{ color: '#e0e0e0' }} /></div>
                        <p>Оберіть чат для початку спілкування</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSupport;
