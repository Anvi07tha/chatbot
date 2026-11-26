
"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved chats when website opens
  useEffect(() => {
    const savedChats = localStorage.getItem("ai-chats");

    if (savedChats) {
      setChats(JSON.parse(savedChats));
    }

    setIsLoaded(true);
  }, []);

  // Save chats whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("ai-chats", JSON.stringify(chats));
    }
  }, [chats, isLoaded]);

  // Start a new chat
  const newChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setError("");
  };

  // Open an old chat
  const openChat = (chat) => {
    setMessages(chat.messages);
    setCurrentChatId(chat.id);
    setError("");
  };

  // Delete a chat
  const deleteChat = (id) => {
    const updatedChats = chats.filter((chat) => chat.id !== id);
    setChats(updatedChats);

    if (currentChatId === id) {
      newChat();
    }
  };

  // Send message
  const handleSend = async (e) => {
    e.preventDefault();

    if (!message.trim() || loading) return;

    const userMessage = {
      text: message.trim(),
      sender: "user",
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setMessage("");
    setLoading(true);
    setError("");

    const chatId = currentChatId || Date.now();

    setCurrentChatId(chatId);

    // Save user message immediately
    setChats((prev) => {
      const existingChat = prev.find((chat) => chat.id === chatId);

      if (existingChat) {
        return prev.map((chat) =>
          chat.id === chatId
            ? { ...chat, messages: updatedMessages }
            : chat
        );
      }

      return [
        {
          id: chatId,
          title: userMessage.text.slice(0, 30),
          messages: updatedMessages,
        },
        ...prev,
      ];
    });

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      const finalMessages = [
        ...updatedMessages,
        {
          text: data.reply,
          sender: "ai",
        },
      ];

      setMessages(finalMessages);

      // Save AI response
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? { ...chat, messages: finalMessages }
            : chat
        )
      );

    } catch (err) {
      setError(err.message || "Unable to connect to AI.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0f172a] text-white flex">

      {/* Sidebar */}
      <aside className="w-64 bg-[#111827] p-5 hidden md:flex flex-col">

        <h1 className="text-2xl font-bold mb-8">
          AI Chatbot
        </h1>

        <button
          onClick={newChat}
          className="w-full border border-gray-600 rounded-xl p-3 hover:bg-gray-700"
        >
          + New Chat
        </button>

        <p className="text-gray-400 mt-8 mb-3 text-sm">
          Your conversations
        </p>

        <div className="flex-1 overflow-y-auto space-y-2">

          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer ${
                currentChatId === chat.id
                  ? "bg-gray-700"
                  : "hover:bg-gray-800"
              }`}
            >
              <button
                onClick={() => openChat(chat)}
                className="flex-1 text-left text-sm truncate"
              >
                {chat.title}
              </button>

              <button
                onClick={() => deleteChat(chat.id)}
                className="text-gray-400 hover:text-red-400"
                title="Delete chat"
              >
                ×
              </button>
            </div>
          ))}

          {chats.length === 0 && (
            <p className="text-gray-500 text-sm">
              No conversations yet.
            </p>
          )}

        </div>
      </aside>

      {/* Main Chat Area */}
      <section className="flex-1 flex flex-col min-w-0">

        <header className="p-5 border-b border-gray-700">
          <h2 className="text-lg font-semibold">
            AI Assistant
          </h2>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6">

          {messages.length === 0 && (
            <div className="h-full flex flex-col justify-center items-center text-center">

              <div className="text-5xl mb-5">🤖</div>

              <h1 className="text-3xl font-bold mb-3">
                How can I help you today?
              </h1>

              <p className="text-gray-400">
                Ask me anything. I'm here to help!
              </p>

            </div>
          )}

          <div className="max-w-3xl mx-auto space-y-5">

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.sender === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`p-4 rounded-2xl max-w-[85%] whitespace-pre-wrap ${
                    msg.sender === "user"
                      ? "bg-blue-600"
                      : "bg-gray-700"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="text-gray-400">
                AI is thinking...
              </div>
            )}

            {error && (
              <div className="text-red-400 text-sm">
                {error}
              </div>
            )}

          </div>
        </div>

        {/* Message Input */}
        <div className="w-full max-w-3xl mx-auto p-5">

          <form
            onSubmit={handleSend}
            className="flex gap-3 bg-[#1e293b] p-3 rounded-2xl border border-gray-700"
          >

            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message AI Assistant..."
              disabled={loading}
              className="flex-1 min-w-0 bg-transparent outline-none px-2 disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="bg-blue-600 px-5 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50"
            >
              Send
            </button>

          </form>

          <p className="text-center text-gray-500 text-xs mt-3">
            AI can make mistakes. Verify important information.
          </p>

        </div>

      </section>
    </main>
  );
}
