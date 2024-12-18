import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

function App() {
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState(
    localStorage.getItem("username") || ""
  );
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [isJoined, setIsJoined] = useState(!!localStorage.getItem("username"));

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    if (localStorage.getItem("username")) {
      const storedUsername = localStorage.getItem("username");
      newSocket.emit("restore-session", storedUsername);
    }

    newSocket.on("previous-messages", (fetchedMessages) => {
      setMessages(fetchedMessages);
    });

    newSocket.on("new-message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    newSocket.on("user-joined", ({ username }) => {
      setMessages((prev) => [
        ...prev,
        { sender: "System", text: `${username} joined the chat` },
      ]);
    });

    newSocket.on("user-left", ({ username }) => {
      setMessages((prev) => [
        ...prev,
        { sender: "System", text: `${username} left the chat` },
      ]);
    });

    newSocket.on("active-users", (fetchedUsers) => {
      setUsers(fetchedUsers);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleJoin = () => {
    if (socket && username.trim()) {
      socket.emit("join", username.trim());
      localStorage.setItem("username", username.trim());
      setIsJoined(true);
    }
  };

  const handleSendMessage = () => {
    if (socket && message.trim()) {
      const data = { sender: username, text: message };
      socket.emit("message", data);
      setMessage("");
    }
  };

  const handleLeaveChat = () => {
    if (socket) {
      socket.emit("leave");
      localStorage.removeItem("username");
      setIsJoined(false);
      setMessages([]);
      setUsers([]);
      setUsername("");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Real-Time Chat App</h1>

      {!isJoined ? (
        <div>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={handleJoin}>Join Chat</button>
        </div>
      ) : (
        <div>
          <h2>Welcome, {username}!</h2>

          <div
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              height: "300px",
              overflowY: "scroll",
            }}
          >
            {messages.map((msg, index) => (
              <div key={index}>
                <strong>{msg.sender}:</strong> {msg.text}
              </div>
            ))}
          </div>

          <div>
            <strong>Active Users:</strong>
            <ul>
              {users.map((user, index) => (
                <li key={index}>{user}</li>
              ))}
            </ul>
          </div>

          <input
            type="text"
            placeholder="Enter your message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <button onClick={handleSendMessage}>Send</button>

          <button
            onClick={handleLeaveChat}
            style={{
              marginTop: "10px",
              marginLeft: "50px",
              backgroundColor: "#ff4d4d",
              color: "white",
              border: "none",
              padding: "10px 20px",
              cursor: "pointer",
            }}
          >
            Leave Chat
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
