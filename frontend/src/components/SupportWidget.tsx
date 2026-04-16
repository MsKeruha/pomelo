import React, { useState, useEffect, useRef } from 'react';
import './SupportWidget.css';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Icon from './common/Icon';

const SupportWidget: React.FC = () => {
    const { language, t } = useSettings();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const { user, token } = useAuth();
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const EMOJIS = ['👋', '😊', '👍', '❤️', '🔥', '✨', '✈️', '🏝️', '🏨', '🛳️', '⛷️', '🗺️', '🦁', '🍊', '🌊', '☀️', '⭐', '📍', '🎒', '📸', '🥂', '🥘', '🌍', '🙌', '👏', '🤝', '✅'];

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchHistory = async () => {
        if (!token) return;
        try {
            const data = await api.get('/chat/history');
            setMessages(data);
        } catch (err) {
            console.error('Failed to fetch chat history:', err);
        }
    };

    useEffect(() => {
        if (isOpen && token) {
            fetchHistory();
            const interval = setInterval(fetchHistory, 3000); // 3s polling
            return () => clearInterval(interval);
        }
    }, [isOpen, token]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (attachment?: {url: string, type: string}) => {
        if ((!inputText.trim() && !attachment) || !token) return;

        try {
            const newMsg = await api.post('/chat/send', { 
                content: inputText,
                attachment_url: attachment?.url,
                attachment_type: attachment?.type
            });
            setMessages([...messages, newMsg]);
            setInputText('');
            setShowEmojiPicker(false);
        } catch (err) {
            console.error('Failed to send message:', err);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !token) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.upload(formData);
            const type = file.type.startsWith('image/') ? 'image' : 'file';
            handleSend({ url: res.url, type });
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setIsUploading(false);
        }
    };

    // Don't show for staff
    if (user?.role === 'admin' || user?.role === 'manager') {
        return null;
    }

    return (
        <div className="support-widget">
            {isOpen && (
                <div className="support-chat-window">
                    <div className="chat-header">
                        <div className="chat-bot-info">
                            <span className="bot-avatar"><Icon name="pomelo" size={20} /></span>
                            <div className="bot-text">
                                <span className="bot-name">{t('support.title', 'Pomelo-підтримка')}</span>
                                <span className="bot-status">● {t('support.online', 'Онлайн')}</span>
                            </div>
                        </div>
                        <button className="btn-close-chat" onClick={() => setIsOpen(false)}><Icon name="close" size={16} /></button>
                    </div>
                    
                    <div className="chat-messages">
                        {messages.length === 0 && (
                            <div className="msg bot-msg">{t('support.welcome', 'Привіт! Чим можу допомогти з вибором туру? 🍊')}</div>
                        )}
                        {messages.map((m, i) => (
                            <div key={i} className={`msg ${m.is_from_staff ? 'bot-msg' : 'user-msg'}`}>
                                {m.attachment_url && (
                                    <div className="msg-attachment">
                                        {m.attachment_type === 'image' ? (
                                            <img src={m.attachment_url} alt="Attachment" className="chat-img-preview" onClick={() => window.open(m.attachment_url)} />
                                        ) : (
                                            <a href={m.attachment_url} target="_blank" rel="noreferrer" className="chat-file-link">
                                                <Icon name="paperclip" size={16} /> {t('support.file_attached', 'Файл вкладено')}
                                            </a>
                                        )}
                                    </div>
                                )}
                                {m.content && <div className="msg-text">{m.content}</div>}
                                <span className="msg-info-row">
                                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {!m.is_from_staff && <Icon name="check-check" size={12} style={{ marginLeft: '6px', color: '#38dbff' }} />}
                                </span>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="chat-input-area">
                        {showEmojiPicker && (
                            <div className="emoji-picker-popup">
                                {EMOJIS.map(e => (
                                    <span key={e} className="emoji-item" onClick={() => setInputText(inputText + e)}>{e}</span>
                                ))}
                            </div>
                        )}
                        <input 
                            type="text" 
                            placeholder={token ? t('support.placeholder', 'Напишіть нам...') : t('support.login_required', 'Увійдіть, щоб написати')} 
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            disabled={!token || isUploading}
                        />
                        <div className="input-btns">
                            <button className="btn-chat-tool" onClick={() => setShowEmojiPicker(!showEmojiPicker)} disabled={!token} title={t('support.emoji', 'Емодзі')}>
                                <Icon name="smile" size={20} />
                            </button>
                            <button className="btn-chat-tool" onClick={() => fileInputRef.current?.click()} disabled={!token || isUploading} title={t('support.attach', 'Прикріпити файл')}>
                                <Icon name="paperclip" size={20} />
                            </button>
                            <button className="btn-send-msg" onClick={() => handleSend()} disabled={!token || isUploading}>
                                {isUploading ? '...' : <Icon name="send" size={18} />}
                            </button>
                        </div>
                        <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
                    </div>
                </div>
            )}
            {!isOpen && (
                <div className="support-bubble" onClick={() => setIsOpen(true)}>
                    <span className="bubble-title">{t('support.title', 'Pomelo-підтримка')}</span>
                    <p className="bubble-text">
                        {t('support.bubble_welcome', 'Привіт! Потрібна допомога?')} <Icon name="pomelo" size={16} style={{ verticalAlign: 'middle' }} />
                    </p>
                </div>
            )}
            <button 
                className={`support-button ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                {isOpen ? <Icon name="close" size={24} /> : <Icon name="message" size={24} />}
            </button>
        </div>
    );
};

export default SupportWidget;
