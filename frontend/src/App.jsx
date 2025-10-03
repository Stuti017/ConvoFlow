import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const socket = io(API_URL, {
  autoConnect: false
});

export default function App() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!token) return;
    socket.connect();
    socket.on("new_message", (msg) => {
      if (msg.conversationId === activeConversation?._id) {
        setMessages((prev) => [...prev, msg]);
      }
    });
    return () => {
      socket.off("new_message");
      socket.disconnect();
    };
  }, [token, activeConversation]);

  const loginDemo = async () => {
    // quick helper to log in (replace with real form)
    const email = window.prompt("Email");
    const password = window.prompt("Password");
    const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
    fetchConversations();
  };

  const fetchConversations = async () => {
    const res = await axios.get(`${API_URL}/api/conversations`);
    setConversations(res.data);
  };

  const openConversation = async (c) => {
    setActiveConversation(c);
    socket.emit("join_conversation", c._id);
    const res = await axios.get(`${API_URL}/api/messages/${c._id}`);
    setMessages(res.data);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConversation) return;
    const res = await axios.post(`${API_URL}/api/messages`, {
      conversationId: activeConversation._id,
      text
    });
    const msg = {
      ...res.data,
      conversationId: activeConversation._id
    };
    setMessages((prev) => [...prev, msg]);
    socket.emit("send_message", {
      conversationId: activeConversation._id,
      ...msg
    });
    setText("");
  };

  if (!token) {
    return (
      <div style={{ padding: 24 }}>
        <h1>MERN Chat</h1>
        <button onClick={loginDemo}>Login</button>
        <p>Create a user via POST /api/auth/register first.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}>
      <aside style={{ width: 280, borderRight: "1px solid #ddd", padding: 16 }}>
        <h2>Conversations</h2>
        <button onClick={fetchConversations}>Refresh</button>
        <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
          {conversations.map((c) => (
            <li
              key={c._id}
              onClick={() => openConversation(c)}
              style={{
                padding: 8,
                marginBottom: 4,
                cursor: "pointer",
                background:
                  activeConversation?._id === c._id ? "#eee" : "transparent"
              }}
            >
              {c.isGroup
                ? c.name
                : c.participants
                    .filter((p) => p._id !== user._id)
                    .map((p) => p.name)
                    .join(", ")}
            </li>
          ))}
        </ul>
      </aside>

      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header style={{ padding: 16, borderBottom: "1px solid #ddd" }}>
          {activeConversation ? (
            <h3>
              {activeConversation.isGroup
                ? activeConversation.name
                : activeConversation.participants
                    .filter((p) => p._id !== user._id)
                    .map((p) => p.name)
                    .join(", ")}
            </h3>
          ) : (
            <h3>Select a conversation</h3>
          )}
        </header>

        <section
          style={{
            flex: 1,
            padding: 16,
            overflowY: "auto",
            background: "#fafafa"
          }}
        >
          {messages.map((m) => (
            <div
              key={m._id}
              style={{
                marginBottom: 8,
                textAlign: m.sender?._id === user._id ? "right" : "left"
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 8px",
                  borderRadius: 4,
                  background: m.sender?._id === user._id ? "#d1ffd6" : "#fff"
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  {m.sender?.name}
                </div>
                <div>{m.text}</div>
              </div>
            </div>
          ))}
        </section>

        {activeConversation && (
          <form
            onSubmit={sendMessage}
            style={{ display: "flex", padding: 16, borderTop: "1px solid #ddd" }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message..."
              style={{ flex: 1, padding: 8 }}
            />
            <button type="submit" style={{ marginLeft: 8 }}>
              Send
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
