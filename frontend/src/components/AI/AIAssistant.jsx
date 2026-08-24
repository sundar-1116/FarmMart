import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export default function AIAssistant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!user) return null;

  const role = user.role || 'user';

  // Role-specific opening suggested prompt pills
  const getOpeningSuggestions = () => {
    if (role === 'farmer') {
      return [
        'Show my pending procurement tasks',
        'Show my latest procurement',
        'What needs my attention?',
        'Which task should I handle first?',
        'Show my pending offers',
        'Give me a procurement summary'
      ];
    } else if (role === 'buyer') {
      return [
        'Show my active demands',
        'Show my latest procurement',
        'What payments are pending?',
        'What deliveries need attention?',
        'Which task should I handle first?',
        'Give me a procurement summary'
      ];
    } else if (role === 'admin') {
      return [
        'Give me a system overview',
        'Show active demands',
        'Show active procurement tasks',
        'What needs attention?',
        'Give me a marketplace summary',
        'Show recent activity'
      ];
    }
    return ['What needs my attention?', 'Show my tasks'];
  };

  // Context-aware follow-up suggestions for active conversation
  const getFollowUpSuggestions = (lastMsg) => {
    const intent = lastMsg?.intent;
    if (role === 'farmer') {
      if (intent === 'pending_procurement_tasks') {
        return ['Which one is urgent?', 'How much is it worth?', 'What should I do next?'];
      }
      if (intent === 'latest_procured_task' || intent === 'procured_tasks') {
        return ['How much is it worth?', 'When is it due?', 'What about the other task?'];
      }
      return ['Which one is urgent?', 'How much is it worth?', 'What should I do next?'];
    } else if (role === 'buyer') {
      if (intent === 'pending_payments' || intent === 'pending_deliveries') {
        return ['Which task should I handle first?', 'How much is it worth?', 'Show active demands'];
      }
      return ['What payments are pending?', 'What deliveries need attention?', 'What should I do next?'];
    } else if (role === 'admin') {
      return ['Show recent activity', 'What needs attention?', 'Show active procurement tasks'];
    }
    return ['What should I do next?', 'Show my tasks'];
  };

  const handleSend = async (textToSend) => {
    const queryText = (textToSend || prompt).trim();
    if (!queryText || loading) return;

    setError('');
    const userMsg = { sender: 'user', text: queryText, timestamp: new Date() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setPrompt('');
    setLoading(true);

    const conversationPayload = nextMessages.slice(-8).map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
      intent: m.intent
    }));

    try {
      const res = await api.askAIAssistant(queryText, conversationPayload);
      if (res.success && res.data) {
        const aiMsg = {
          sender: 'ai',
          text: res.data.answer,
          intent: res.data.intent,
          suggestedActions: res.data.suggestedActions || [],
          followUpSuggestions: res.data.followUpSuggestions || [],
          references: res.data.referencedIds || res.data.references || {},
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        setError(res.message || 'FarmMart AI is temporarily unavailable. Please try again.');
      }
    } catch (err) {
      console.error('[AI ASSISTANT ERROR]', err.message);
      setError(err.message || 'FarmMart AI is temporarily unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  return (
    <>
      {/* FLOATING AI ASSISTANT BUTTON */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 999,
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--primary-color)',
            borderRadius: '9999px',
            padding: '12px 20px',
            color: 'var(--primary-color)',
            boxShadow: '0 0 20px var(--primary-glow), 0 8px 32px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(12px)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: '700',
            fontSize: '0.9rem',
            transition: 'all 0.3s ease'
          }}
          className="ai-float-btn"
        >
          <span style={{ fontSize: '1.2rem' }}>✨</span>
          <span>Ask FarmMart AI</span>
        </button>
      )}

      {/* AI DRAWER PANEL */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: 'calc(100vw - 32px)',
            maxWidth: '440px',
            height: '620px',
            maxHeight: 'calc(100vh - 48px)',
            backgroundColor: 'rgba(11, 28, 19, 0.95)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7), 0 0 25px rgba(0, 255, 157, 0.15)',
            backdropFilter: 'blur(16px)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-color)',
              background: 'rgba(0, 255, 157, 0.03)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(0, 255, 157, 0.15)',
                  border: '1px solid var(--primary-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem'
                }}
              >
                ✨
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                  FarmMart AI Assistant
                </h3>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                  <span className="badge badge-info" style={{ fontSize: '0.6rem', padding: '1px 5px', textTransform: 'uppercase' }}>{role}</span>
                  <span>Read-Only Context Active</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '1.25rem',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages Body */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '16px 8px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2.2rem', marginBottom: '6px' }}>🤖</div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                  Welcome back, {user.name}!
                </h4>
                <p style={{ margin: '0 0 16px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  How can FarmMart AI assist your operational workflow today?
                </p>

                {/* Role-Aware Opening Quick Action Suggestions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-color)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Quick Suggested Actions
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                    {getOpeningSuggestions().map((promptText, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSend(promptText)}
                        disabled={loading}
                        style={{
                          background: 'rgba(0, 255, 157, 0.04)',
                          border: '1px solid rgba(0, 255, 157, 0.2)',
                          borderRadius: '10px',
                          padding: '10px 14px',
                          color: 'var(--text-light)',
                          fontSize: '0.8rem',
                          textAlign: 'left',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontWeight: '500'
                        }}
                        onMouseOver={(e) => { if (!loading) e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
                        onMouseOut={(e) => { if (!loading) e.currentTarget.style.borderColor = 'rgba(0, 255, 157, 0.2)'; }}
                      >
                        <span style={{ color: 'var(--primary-color)' }}>⚡</span>
                        <span>{promptText}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => {
              const isLastMessage = idx === messages.length - 1;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    style={{
                      maxWidth: '88%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      lineHeight: '1.45',
                      backgroundColor: msg.sender === 'user' ? 'rgba(0, 255, 157, 0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${msg.sender === 'user' ? 'var(--primary-color)' : 'rgba(255,255,255,0.08)'}`,
                      color: 'var(--text-primary)',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {msg.text}
                  </div>

                  {/* Navigation Actions */}
                  {msg.sender === 'ai' && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                      {msg.suggestedActions.map((action, aIdx) => (
                        <button
                          key={aIdx}
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            navigate(action.route);
                          }}
                          style={{
                            background: 'rgba(59, 130, 246, 0.15)',
                            border: '1px solid #3b82f6',
                            color: '#60a5fa',
                            fontSize: '0.7rem',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          🔗 {action.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Contextual Follow-up Suggested Questions */}
                  {msg.sender === 'ai' && isLastMessage && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                        Suggested follow-ups:
                      </span>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {(msg.followUpSuggestions && msg.followUpSuggestions.length > 0 ? msg.followUpSuggestions : getFollowUpSuggestions(msg)).map((supr, fIdx) => (
                          <button
                            key={fIdx}
                            type="button"
                            onClick={() => handleSend(supr)}
                            disabled={loading}
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '8px',
                              padding: '5px 10px',
                              color: 'var(--text-light)',
                              fontSize: '0.72rem',
                              cursor: loading ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => { if (!loading) e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
                            onMouseOut={(e) => { if (!loading) e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                          >
                            💬 {supr}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px', padding: '0 4px' }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', fontSize: '0.8rem' }}>
                <div className="loading-spinner" style={{ width: '16px', height: '16px', margin: 0, borderWidth: '2px' }}></div>
                <span>FarmMart AI is analyzing authorized database context...</span>
              </div>
            )}

            {error && (
              <div className="form-error" style={{ fontSize: '0.75rem', padding: '8px 12px', margin: 0 }}>
                ⚠️ {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={handleFormSubmit} style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask FarmMart AI..."
                maxLength={500}
                disabled={loading}
              />
              <button
                type="submit"
                className="form-btn"
                style={{ width: 'auto', padding: '0 16px', height: '38px', fontSize: '0.85rem' }}
                disabled={loading || !prompt.trim()}
              >
                Send
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', padding: '0 2px' }}>
              <span>Strict AI Read-Only Boundary</span>
              <span>{prompt.length}/500</span>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
