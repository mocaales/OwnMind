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
    <div className="chat-shell">
      <header>
        <div>
          <h2>GeNNio Chat</h2>
          <span>Signed in as {user.email}</span>
        </div>
        <button className="ghost" onClick={onLogout}>Log out</button>
      </header>

      <main>
        {messages.map((msg, idx) => (
          <article key={`${msg.role}-${idx}`} className={`bubble ${msg.role}`}>
            <strong>{msg.role === 'assistant' ? 'AI' : 'You'}</strong>
            <p>{msg.content}</p>
          </article>
        ))}
      </main>

      <form className="composer" onSubmit={sendMessage}>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFileChange} hidden />
        <button type="button" className="ghost" onClick={() => fileRef.current?.click()}>Attach</button>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Message GeNNio..."
          maxLength={4000}
        />
        <button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send'}</button>
      </form>
      {files.length > 0 && (
        <div className="file-strip">
          {files.map((file) => (
            <span key={file.name}>{file.name}</span>
          ))}
        </div>
      )}
    </div>
  );
}
