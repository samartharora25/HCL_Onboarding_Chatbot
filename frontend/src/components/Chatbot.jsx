import React, { useState, useEffect, useRef } from 'react';

const SUGGESTIONS = [
  "How do I install Python?",
  "How do I request admin access?",
  "Why can't I install software?",
  "How do I connect to VPN?",
  "How do I configure Outlook?",
  "How do I access company repositories?",
  "How do I raise an IT support ticket?"
];

const Chatbot = ({ user }) => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${user?.name || 'there'}! Welcome to HCL Tech. I am your IT Onboarding Assistant. How can I help you set up your device today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendOffline, setBackendOffline] = useState(false);
  
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Check backend status on mount
  useEffect(() => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');
    fetch(`${apiBaseUrl}/api/status`)
      .then(res => {
        if (!res.ok) throw new Error();
        setBackendOffline(false);
      })
      .catch(() => {
        setBackendOffline(true);
      });
  }, []);

  const sendMessage = async (textToSend) => {
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setBackendOffline(false);

    // Format chat history for context
    const chatHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');
      const response = await fetch(`${apiBaseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          history: chatHistory,
          user: {
            name: user?.name,
            employeeId: user?.employeeId
          }
        })
      });

      if (!response.ok) {
        throw new Error('Server returned an error');
      }

      const data = await response.json();
      
      const assistantMsg = {
        id: 'msg_' + Date.now() + '_res',
        role: 'assistant',
        content: data.answer,
        citations: data.citations || [],
        isFallback: data.is_fallback || false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      setBackendOffline(true);
      
      // Add error system message
      const errorMsg = {
        id: 'msg_' + Date.now() + '_err',
        role: 'assistant',
        content: "⚠️ **Unable to reach chatbot backend.** Please ensure the Flask backend server is running locally (e.g. `python app.py` on port 5000).\n\n" +
                 "**Direct advice based on standard guide:** For Python, Node.js, and VS Code, create a **Software Request** ticket on OneConnect (https://oneconnect.hcltech.com/) followed by an **Install Request** referencing that ticket.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="chat-interface-container">
      {backendOffline && (
        <div className="status-bar-offline">
          🔴 Backend server is currently offline. Chat replies are running in local simulation. Start Flask server to connect.
        </div>
      )}

      {/* Chat Area */}
      <div className="chat-messages-scrollarea">
        {messages.map((msg) => (
          <div key={msg.id} className={`message-bubble-wrapper ${msg.role === 'user' ? 'user-align' : 'assistant-align'}`}>
            <div className={`message-bubble ${msg.role === 'user' ? 'user-bg' : 'assistant-bg'}`}>
              <div className="msg-header">
                <span className="msg-sender">{msg.role === 'user' ? 'You' : 'HCL Assistant'}</span>
                <span className="msg-time">{msg.timestamp}</span>
              </div>
              <div className="msg-content">
                {/* Basic markdown renderer or text split by newline */}
                {msg.content.split('\n').map((line, lIdx) => {
                  // Simple strong/bold parser
                  let contentLine = line;
                  const boldRegex = /\*\*(.*?)\*\*/g;
                  const parts = [];
                  let lastIndex = 0;
                  let match;
                  
                  while ((match = boldRegex.exec(line)) !== null) {
                    parts.push(line.substring(lastIndex, match.index));
                    parts.push(<strong key={match.index}>{match[1]}</strong>);
                    lastIndex = boldRegex.lastIndex;
                  }
                  parts.push(line.substring(lastIndex));
                  
                  return (
                    <p key={lIdx} className="mb-2">
                      {parts.length > 1 ? parts : contentLine}
                    </p>
                  );
                })}
              </div>

              {/* Citations drawer */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="citations-container">
                  <p className="citations-header">Source Citations:</p>
                  <div className="citations-list">
                    {msg.citations.map((cite, cIdx) => (
                      <div key={cIdx} className="citation-pill">
                        <span className="cite-icon">📄</span>
                        <div className="cite-detail">
                          <span className="cite-title">{cite.source}</span>
                          {cite.urls && cite.urls.map((url, uIdx) => (
                            <a 
                              key={uIdx} 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="cite-link"
                            >
                              Open Link ↗
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="message-bubble-wrapper assistant-align">
            <div className="message-bubble assistant-bg">
              <div className="msg-header">
                <span className="msg-sender">HCL Assistant</span>
              </div>
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length === 1 && (
        <div className="suggestions-outer">
          <p className="text-xs text-slate-500 font-semibold mb-2">Common questions you can ask:</p>
          <div className="suggestions-grid">
            {SUGGESTIONS.map((item, idx) => (
              <button 
                key={idx} 
                onClick={() => sendMessage(item)} 
                className="suggestion-chip"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Send Form */}
      <form onSubmit={handleFormSubmit} className="chat-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about installing Python, admin access, VPN, Outlook, raising tickets..."
          className="chat-input-field"
          disabled={loading}
        />
        <button 
          type="submit" 
          disabled={loading || !input.trim()} 
          className="chat-send-btn"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Chatbot;
