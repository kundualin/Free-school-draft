import React, { useState, useEffect, useRef } from 'react';
import { Flag, Paperclip } from 'lucide-react';
import { Repo } from '../services/db';
import { Avatar } from './Avatar';
import { User } from '../types';
import { fmtTime, isValidUrl, notify } from '../utils/helpers';

interface ChatProps {
  user: User;
  onOpenReportModal: (targetUserId: string) => void;
  onShowToast: (msg: string, tone?: 'success' | 'error') => void;
}

export const Chat: React.FC<ChatProps> = ({ user, onOpenReportModal, onShowToast }) => {
  const isTeacher = user.role === 'teacher';

  // Get contacts
  const getContacts = (): User[] => {
    if (user.role === 'student') {
      const myCourseIds = Repo.enrollments.all()
        .filter(e => e.userId === user.id)
        .map(e => e.courseId);

      const teacherIds = new Set<string>();
      Repo.users.all()
        .filter(u => u.role === 'teacher' && u.verificationStatus === 'approved')
        .forEach(t => {
          if ((t.subjects || []).some(s => myCourseIds.includes(s))) {
            teacherIds.add(t.id);
          }
        });

      return Repo.users.all().filter(u => teacherIds.has(u.id));
    } else {
      const mySubjects = user.subjects || [];
      const studentIds = new Set<string>();
      Repo.enrollments.all().forEach(e => {
        if (mySubjects.includes(e.courseId)) {
          studentIds.add(e.userId);
        }
      });
      return Repo.users.all().filter(u => studentIds.has(u.id));
    }
  };

  const contacts = getContacts();
  const [activeContactId, setActiveContactId] = useState<string | null>(
    contacts.length > 0 ? contacts[0].id : null
  );

  const [text, setText] = useState('');
  const [chatAttachOpen, setChatAttachOpen] = useState(false);
  const [attachLink, setAttachLink] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatIdFor = (a: string, b: string) => [a, b].sort().join('__');
  const activeContact = contacts.find(c => c.id === activeContactId);
  const chatId = activeContact ? chatIdFor(user.id, activeContact.id) : null;

  const msgs = chatId
    ? Repo.messages.all().filter(m => m.chatId === chatId).sort((a, b) => a.ts - b.ts)
    : [];

  useEffect(() => {
    if (chatId) {
      Repo.messages.markRead(chatId, user.id);
    }
  }, [chatId, msgs.length, user.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeContactId || !chatId) return;

    Repo.messages.create({
      chatId,
      senderId: user.id,
      text: text.trim()
    });

    notify.newMessage(activeContactId, user);
    setText('');
  };

  const handleAttachLink = () => {
    if (!isValidUrl(attachLink.trim())) {
      onShowToast('Enter a valid link.', 'error');
      return;
    }
    if (!activeContactId || !chatId) return;

    Repo.messages.create({
      chatId,
      senderId: user.id,
      text: '',
      attachment: attachLink.trim()
    });

    notify.newMessage(activeContactId, user);
    setAttachLink('');
    setChatAttachOpen(false);
  };

  const renderAttachment = (url: string) => {
    const isImage = /\.(png|jpe?g|gif|webp)(\?|$)/i.test(url);
    if (isImage) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <img src={url} className="max-w-[220px] rounded-lg block mb-1.5" alt="Shared attachment" />
        </a>
      );
    }
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-block text-[12.5px] underline mb-1.5">
        📎 Shared file link
      </a>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-fs-green tracking-tight">Messages</h1>
        <p className="text-fs-ink-soft text-[13.5px] mt-1.5">
          {isTeacher ? 'Chat with students who joined your courses.' : 'Chat directly with your tutors.'}
        </p>
      </div>

      <div className="flex flex-col md:flex-row h-auto md:h-[calc(100vh-220px)] border border-fs-line rounded-2xl overflow-hidden bg-fs-paper">
        {/* Contact List */}
        <div className="w-full md:w-[260px] border-b md:border-b-0 md:border-r border-fs-line overflow-y-auto max-h-[180px] md:max-h-none flex-shrink-0">
          {contacts.length > 0 ? (
            contacts.map((c) => {
              const cChatId = chatIdFor(user.id, c.id);
              const unread = Repo.messages.all().filter(
                m => m.chatId === cChatId && m.senderId !== user.id && !m.readBy.includes(user.id)
              ).length;

              return (
                <div
                  key={c.id}
                  className={`flex items-center gap-2.5 px-4 py-3.5 border-b border-fs-line cursor-pointer transition-colors ${
                    c.id === activeContactId ? 'bg-fs-green-pale' : 'hover:bg-fs-cream'
                  }`}
                  onClick={() => {
                    setActiveContactId(c.id);
                    setChatAttachOpen(false);
                  }}
                >
                  <Avatar name={c.name} size={32} photo={c.photo} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-bold text-fs-ink truncate">{c.name}</div>
                    <div className="text-[11.5px] text-fs-ink-soft">
                      {isTeacher ? (c.level || 'Student') : 'Tutor'}
                    </div>
                  </div>
                  {unread > 0 && (
                    <span className="bg-fs-red text-white text-[9.5px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 flex-shrink-0">
                      {unread}
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-12 px-5 text-center text-fs-ink-soft">
              <div className="text-2xl mb-2">✉️</div>
              <p className="text-xs">
                {isTeacher ? 'No students yet.' : 'Join a course to message its tutor.'}
              </p>
            </div>
          )}
        </div>

        {/* Message Thread */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeContact ? (
            <>
              {/* Header */}
              <div className="px-5 py-4 border-b border-fs-line flex items-center gap-3">
                <Avatar name={activeContact.name} size={32} photo={activeContact.photo} />
                <div>
                  <div className="text-[13px] font-bold text-fs-ink">{activeContact.name}</div>
                  <div className="text-[11px] text-fs-ink-soft">
                    {isTeacher ? (activeContact.level || 'Student') : 'Tutor'}
                  </div>
                </div>
                <button
                  type="button"
                  className="w-9 h-9 border border-fs-line rounded-lg inline-flex items-center justify-center hover:border-fs-red transition-colors ml-auto text-fs-ink-soft hover:text-fs-red"
                  title="Report this user"
                  onClick={() => onOpenReportModal(activeContact.id)}
                >
                  <Flag className="w-4 h-4" />
                </button>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-2.5">
                {msgs.length > 0 ? (
                  msgs.map((m) => {
                    const isMe = m.senderId === user.id;
                    const isRead = m.readBy && m.readBy.includes(activeContact.id);
                    const bubbleClass = isMe
                      ? 'self-end bg-fs-green text-fs-paper fs-msg-me'
                      : 'self-start bg-fs-cream border border-fs-line text-fs-ink fs-msg-them';

                    return (
                      <div
                        key={m.id}
                        className={`max-w-[65%] px-3.5 py-2.5 rounded-2xl text-[13.5px] leading-relaxed ${bubbleClass}`}
                      >
                        {m.attachment && renderAttachment(m.attachment)}
                        {m.text && <div>{m.text}</div>}
                        <span className="text-[10px] opacity-65 mt-1 block">
                          {fmtTime(m.ts)}
                          {isMe ? ` · ${isRead ? '✓✓ Seen' : '✓ Sent'}` : ''}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex-1 flex items-center justify-center text-fs-ink-soft text-[13.5px]">
                    Say hello to start the conversation.
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Form Input */}
              <form className="flex gap-2.5 px-4 py-3.5 border-t border-fs-line items-center" onSubmit={handleSend}>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message..."
                  autoComplete="off"
                  className="flex-1 px-3.5 py-2.5 border-[1.5px] border-fs-line rounded-full text-[13.5px] bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green"
                />
                <button
                  type="button"
                  className="w-9 h-9 border border-fs-line rounded-lg inline-flex items-center justify-center hover:border-fs-green transition-colors flex-shrink-0 text-fs-ink-soft"
                  title="Attach a link (Drive, image, etc.)"
                  onClick={() => setChatAttachOpen(!chatAttachOpen)}
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  className="bg-fs-green text-fs-paper hover:bg-fs-green-mid font-semibold rounded-lg px-3 py-1.5 text-[13px] transition-colors"
                >
                  Send
                </button>
              </form>

              {/* Attachment panel */}
              {chatAttachOpen && (
                <div className="flex gap-2 px-4 pb-3.5">
                  <input
                    type="text"
                    value={attachLink}
                    onChange={(e) => setAttachLink(e.target.value)}
                    placeholder="Paste a link (Google Drive image, PDF, etc.)"
                    className="flex-1 px-3 py-2 border-[1.5px] border-fs-line rounded-lg text-[12.5px] bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green"
                  />
                  <button
                    type="button"
                    className="bg-transparent text-fs-green border border-fs-line hover:border-fs-green px-3 py-1.5 text-[13px] font-semibold rounded-lg transition-colors"
                    onClick={handleAttachLink}
                  >
                    Attach
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-fs-ink-soft text-[13.5px]">
              Select a conversation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
