import { useRef, useState } from 'react';

export default function ChatUI({ user, getToken, onLogout }) {
  const [messages, setMessages] = useState([{ role: 'assistant', content: `Hi ${user.name || 'there'}, ask me anything.` }]);
  const [input, setInput] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  const sendMessage = async (event) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const nextMessages = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const token = await getToken();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ messages: nextMessages.map(({ role, content }) => ({ role, content })) })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not reach model');

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = (event) => {
    const selected = Array.from(event.target.files || []).slice(0, 4);
    setFiles(selected);
  };

  return (
    <div className="chat-app">
      <aside className="sidebar">
        <div className="brand">GeNNio</div>
        <button className="sidebar-btn">+ New chat</button>
        <div className="sidebar-meta">{user.email}</div>
      </aside>

      <div className="chat-shell">
        <header className="chat-header">
          <h2>GeNNio Chat</h2>
          <button className="ghost" onClick={onLogout}>Log out</button>
        </header>

        <main className="chat-main">
          {messages.map((msg, idx) => (
            <article key={`${msg.role}-${idx}`} className={`bubble ${msg.role}`}>
              <strong>{msg.role === 'assistant' ? 'GeNNio' : 'You'}</strong>
              <p>{msg.content}</p>
            </article>
          ))}
        </main>

        {files.length > 0 && (
          <div className="file-strip">
            {files.map((file) => (
              <span key={file.name}>{file.name}</span>
            ))}
          </div>
        )}

        <form className="composer" onSubmit={sendMessage}>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFileChange} hidden />
          <button type="button" className="ghost composer-attach" onClick={() => fileRef.current?.click()}>+</button>
          <input
            className="composer-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask anything"
            maxLength={4000}
          />
          <button className="composer-send" type="submit" disabled={loading}>{loading ? '...' : 'Send'}</button>
        </form>
      </div>
    </div>
  );
}
