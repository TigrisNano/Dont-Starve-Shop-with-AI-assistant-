import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ProfilePage.css";

function ProfilePage() {
  const [profile, setProfile] = useState({
    username: "",
    email: "",
    phone: "",
  });

  const [passwords, setPasswords] = useState({
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [messages, setMessages] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get("http://localhost:3001/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setProfile({
          username: res.data.username || "",
          email: res.data.login_email || "",
          phone: res.data.phone_number || "",
        });
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  const handleProfileChange = (e) => {
    setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = (e) => {
    setPasswords((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const updateUsername = async () => {
    setErrors({});
    setMessages({});
    if (!profile.username.trim()) {
      setErrors({ username: "Username is required" });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:3001/api/profile",
        { username: profile.username },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages({ username: "Username updated" });
      localStorage.setItem("username", profile.username);
      window.dispatchEvent(new Event("usernameChanged"));
    } catch (err) {
      console.error(err);
      setMessages({ username: "Failed to update username" });
    }
  };

  const updateEmail = async () => {
    setErrors({});
    setMessages({});
    if (!profile.email.includes("@")) {
      setErrors({ email: "Invalid email address" });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:3001/api/profile",
        { login_email: profile.email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages({ email: "Email updated" });
    } catch (err) {
      console.error(err);
      setMessages({ email: "Failed to update email" });
    }
  };

  const updatePhone = async () => {
    setErrors({});
    setMessages({});
    if (!/^\d{10}$/.test(profile.phone)) {
      setErrors({ phone: "Phone number must be 10 digits" });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:3001/api/profile",
        { phone_number: profile.phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages({ phone: "Phone updated" });
    } catch (err) {
      console.error(err);
      setMessages({ phone: "Failed to update phone" });
    }
  };

  const updatePassword = async () => {
    setErrors({});
    setMessages({});

    if (passwords.password.length < 6) {
      setErrors({ password: "Password must be at least 6 characters" });
      return;
    }

    if (passwords.password !== passwords.confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:3001/api/profile",
        { password: passwords.password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages({ password: "Password updated" });
      setPasswords({ password: "", confirmPassword: "" });
    } catch (err) {
      console.error(err);
      setMessages({ password: "Failed to update password" });
    }
  };

  return (
    <div className="profile-container">
      <h2>User Profile</h2>

      <div className="form-group">
        <label>Username:</label>
        <input
          type="text"
          name="username"
          value={profile.username}
          onChange={handleProfileChange}
        />
        <button onClick={updateUsername}>Save Username</button>
      </div>

      <div className="form-group">
        <label>Email:</label>
        <input
          type="email"
          name="email"
          value={profile.email}
          onChange={handleProfileChange}
        />
        <button onClick={updateEmail}>Save Email</button>
      </div>

      <div className="form-group">
        <label>Phone:</label>
        <input
          type="text"
          name="phone"
          value={profile.phone}
          onChange={handleProfileChange}
        />
        <button onClick={updatePhone}>Save Phone</button>
      </div>

      <div className="form-group">
        <label>Password:</label>
        <input
          type="password"
          name="password"
          value={passwords.password}
          onChange={handlePasswordChange}
          placeholder="Enter new password"
        />
      </div>
      <div className="form-group">
        <label>Confirm Password:</label>
        <input
          type="password"
          name="confirmPassword"
          value={passwords.confirmPassword}
          onChange={handlePasswordChange}
          placeholder="Confirm new password"
        />
        <button onClick={updatePassword}>Save Password</button>
      </div>

      <div className="messages-container">
        {(errors.username ||
          errors.email ||
          errors.phone ||
          errors.password ||
          errors.confirmPassword) && (
          <div className="errors">
            {errors.username && <div className="error">{errors.username}</div>}
            {errors.email && <div className="error">{errors.email}</div>}
            {errors.phone && <div className="error">{errors.phone}</div>}
            {errors.password && <div className="error">{errors.password}</div>}
            {errors.confirmPassword && (
              <div className="error">{errors.confirmPassword}</div>
            )}
          </div>
        )}
        {(messages.username ||
          messages.email ||
          messages.phone ||
          messages.password) && (
          <div className="messages">
            {messages.username && (
              <div className="message">{messages.username}</div>
            )}
            {messages.email && <div className="message">{messages.email}</div>}
            {messages.phone && <div className="message">{messages.phone}</div>}
            {messages.password && (
              <div className="message">{messages.password}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
