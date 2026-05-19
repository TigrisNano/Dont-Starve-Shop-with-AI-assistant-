import { useState, useRef, useEffect } from "react";
import "./ChatWidget.css";
import AIIcon from "./AIIcon";

const AI_GREETING =
  "Hello! I'm your store assistant. I can help you find products and guide you through the website. How can I help you today?";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "ai", content: AI_GREETING },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef(null);

  // ✅ автоскрол
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTo({
        top: bodyRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, loading]);

  // ✅ якщо відкрили чат і він порожній — додати greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: "ai", content: AI_GREETING }]);
    }
  }, [isOpen, messages.length]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userText = input;
    const userMessage = { role: "user", content: userText };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });

      const data = await res.json();

      const aiMessage = {
        role: "ai",
        content: data.reply || "AI returned empty response.",
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "AI is unavailable." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  // ✅ ПРАВИЛЬНЕ очищення
  const clearChat = () => {
    setMessages([{ role: "ai", content: AI_GREETING }]);
  };

  return (
    <>
      <button className="chat-widget-button" onClick={() => setIsOpen(!isOpen)}>
        <AIIcon size={30} />
      </button>

      <div className={`chat-window ${isOpen ? "open" : ""}`}>
        <div className="chat-header">
          <span>Customer Assistant (AI)</span>
          <button className="clear-btn" onClick={clearChat}>
            Clear
          </button>
        </div>

        <div className="chat-body" ref={bodyRef}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`chat-message ${msg.role === "ai" ? "ai" : "user"}`}
            >
              {msg.content}
            </div>
          ))}

          {loading && (
            <div className="chat-message ai typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
        </div>

        <div className="chat-input">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question..."
          />
          <button onClick={sendMessage} disabled={loading}>
            Send
          </button>
        </div>
      </div>
    </>
  );
}
