import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./AdminPage.css";
import {
  BarChart,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Line,
} from "recharts";

function AdminPage() {
  const [accessGranted, setAccessGranted] = useState(false);
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [role, setRole] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeTab, setActiveTab] = useState("editItems");
  const [analyticsYear, setAnalyticsYear] = useState([]);
  const [analyticsMonth, setAnalyticsMonth] = useState([]);
  const [salesYear, setSalesYear] = useState([]);
  const navigate = useNavigate();

  const categories = [
    "All",
    "Tools",
    "Light",
    "Survival",
    "Food",
    "Science",
    "Fight",
    "Structures",
    "Refine",
    "Magic",
    "Dress",
    "Ancient",
  ];

  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    quantity: 1,
    description: "",
    category: "Tools",
    image: null,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    try {
      const decoded = jwtDecode(token);
      setRole(decoded.role_id);
      if (decoded.role_id === 1 || decoded.role_id === 2) {
        setAccessGranted(true);
      } else navigate("/");
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (accessGranted && role === 1) {
      axios
        .get("http://localhost:3001/api/users", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })
        .then((res) => setUsers(res.data))
        .catch((err) => console.error(err));
    }
  }, [accessGranted, role]);

  useEffect(() => {
    if (!accessGranted) return;
    axios
      .get("http://localhost:3001/api/items")
      .then((res) => {
        setItems(res.data);
        setFilteredItems(res.data);
      })
      .catch((err) => console.error(err));
  }, [accessGranted]);

  useEffect(() => {
    let filtered = items;
    if (selectedCategory !== "All") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredItems(filtered);
  }, [searchTerm, selectedCategory, items]);

  useEffect(() => {
    axios
      .get("http://localhost:3001/api/analytics/categories/year")
      .then((res) => setAnalyticsYear(res.data));
    axios
      .get("http://localhost:3001/api/analytics/categories/month")
      .then((res) => setAnalyticsMonth(res.data));
    axios.get("http://localhost:3001/api/analytics/sales/year").then((res) =>
      setSalesYear(
        res.data.map((item) => ({
          month: new Date(item.month + "-01").toLocaleString("en", {
            month: "short",
          }),
          total: Number(item.total),
        }))
      )
    );
  }, [activeTab]);

  const changeUserRole = async (userId, newRoleId) => {
    try {
      await axios.put(
        `http://localhost:3001/api/users/${userId}/role`,
        { role_id: newRoleId },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      const res = await axios.get("http://localhost:3001/api/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      alert("Error changing user role");
    }
  };

  const handleEditClick = (item) => setEditingItem(item);

  const handleItemChange = (e) => {
    const { name, value, files } = e.target;
    setEditingItem((prev) => ({
      ...prev,
      [name]: files && files.length > 0 ? files[0] : value,
    }));
  };

  const saveItem = async () => {
    if (!editingItem.name || !editingItem.price || !editingItem.category) {
      alert("Please fill in all required fields!");
      return;
    }

    const formData = new FormData();
    formData.append("name", editingItem.name);
    formData.append("price", editingItem.price);
    formData.append("quantity", editingItem.quantity);
    formData.append("description", editingItem.description);
    formData.append("category", editingItem.category);
    formData.append(
      "newCategory",
      editingItem.newCategory || editingItem.category
    );

    if (editingItem.image && editingItem.image instanceof File) {
      formData.append("image", editingItem.image);
      formData.append("imageName", editingItem.image.name);
    }

    try {
      await axios.put(
        `http://localhost:3001/api/items/${editingItem.category}/${editingItem.id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      alert("Item updated!");
      setEditingItem(null);

      const res = await axios.get("http://localhost:3001/api/items");
      setItems(res.data);
    } catch (err) {
      console.error(err);
      alert("Error updating item");
    }
  };

  const deleteItem = async (item) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${item.name}" from category ${item.category}?`
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(
        `http://localhost:3001/api/items/${item.category}/${item.id}`
      );
      alert("Item deleted!");
      const res = await axios.get("http://localhost:3001/api/items");
      setItems(res.data);
    } catch (err) {
      console.error(err);
      alert("Error deleting item");
    }
  };

  if (!accessGranted) return null;

  return (
    <div className="admin-container">
      <h1>Admin Panel</h1>
      <div className="admin-tabs">
        {role === 1 && (
          <button
            className={activeTab === "editUsers" ? "active" : ""}
            onClick={() => setActiveTab("editUsers")}
          >
            Edit Users
          </button>
        )}
        <button
          className={activeTab === "addItem" ? "active" : ""}
          onClick={() => setActiveTab("addItem")}
        >
          Add New Item
        </button>
        <button
          className={activeTab === "editItems" ? "active" : ""}
          onClick={() => setActiveTab("editItems")}
        >
          Edit Items
        </button>
        <button
          className={activeTab === "analytics" ? "active" : ""}
          onClick={() => setActiveTab("analytics")}
        >
          Analytics
        </button>
      </div>

      {activeTab === "editUsers" && role === 1 && (
        <div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id}>
                  <td>{u.username}</td>
                  <td>{u.role_name}</td>
                  <td>
                    {u.role_name !== "admin" && (
                      <button onClick={() => changeUserRole(u.user_id, 2)}>
                        Make Admin
                      </button>
                    )}
                    {u.role_name !== "customer" && (
                      <button onClick={() => changeUserRole(u.user_id, 3)}>
                        Make Customer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "addItem" && (
        <div className="edit-block">
          <input
            name="name"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            placeholder="Name *"
            required
          />
          <input
            name="price"
            type="number"
            value={newItem.price}
            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
            placeholder="Price *"
            required
          />
          <textarea
            name="description"
            value={newItem.description}
            onChange={(e) =>
              setNewItem({ ...newItem, description: e.target.value })
            }
            placeholder="Description"
          />
          <select
            value={newItem.category}
            onChange={(e) =>
              setNewItem({ ...newItem, category: e.target.value })
            }
            required
          >
            {categories
              .filter((c) => c !== "All")
              .map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
          </select>
          <input
            type="file"
            onChange={(e) =>
              setNewItem({ ...newItem, image: e.target.files[0] })
            }
          />
          <button
            onClick={async () => {
              if (!newItem.name || !newItem.price || !newItem.category) {
                alert("Please fill in all required fields!");
                return;
              }
              try {
                const formData = new FormData();
                formData.append("name", newItem.name);
                formData.append("price", newItem.price);
                formData.append("quantity", newItem.quantity);
                formData.append("description", newItem.description);
                formData.append("category", newItem.category);
                if (newItem.image) formData.append("image", newItem.image);

                await axios.post("http://localhost:3001/api/items", formData, {
                  headers: { "Content-Type": "multipart/form-data" },
                });

                alert("Item added!");
                setNewItem({
                  name: "",
                  price: "",
                  quantity: 1,
                  description: "",
                  category: "Tools",
                  image: null,
                });

                const res = await axios.get("http://localhost:3001/api/items");
                setItems(res.data);
              } catch (err) {
                console.error(err);
                alert("Error adding item");
              }
            }}
          >
            Add Item
          </button>
        </div>
      )}

      {activeTab === "editItems" && (
        <div>
          <div className="filter-bar">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Image</th>
                  <th>Category</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={`${item.category}-${item.id}`}>
                    <td>{item.name}</td>
                    <td>{item.price}</td>
                    <td>
                      <img
                        src={item.image_path}
                        alt={item.name}
                        className="item-img"
                      />
                    </td>
                    <td>{item.category}</td>
                    <td>
                      <button onClick={() => handleEditClick(item)}>
                        Edit
                      </button>
                      <button onClick={() => deleteItem(item)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {editingItem && (
            <div className="edit-block">
              <h3>Editing Item: {editingItem.name}</h3>
              <input
                name="name"
                value={editingItem.name}
                onChange={handleItemChange}
                placeholder="Name *"
                required
              />
              <input
                name="price"
                type="number"
                value={editingItem.price}
                onChange={handleItemChange}
                placeholder="Price *"
                required
              />
              <textarea
                name="description"
                value={editingItem.description}
                onChange={handleItemChange}
                placeholder="Description"
              />
              <select
                name="newCategory"
                value={editingItem.newCategory || editingItem.category}
                onChange={handleItemChange}
                required
              >
                {categories
                  .filter((c) => c !== "All")
                  .map((cat) => (
                    <option key={cat}>{cat}</option>
                  ))}
              </select>
              <input type="file" name="image" onChange={handleItemChange} />
              <button onClick={saveItem}>Save</button>
              <button onClick={() => setEditingItem(null)}>Cancel</button>
            </div>
          )}
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="analytics-block">
          <h2>Top 11 Categories This Year</h2>
          <BarChart width={600} height={300} data={analyticsYear}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" />
          </BarChart>

          <h2>Top 11 Categories This Month</h2>
          <BarChart width={600} height={300} data={analyticsMonth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" />
          </BarChart>

          <h2>Total Sales This Year</h2>
          <LineChart width={700} height={300} data={salesYear}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="total" />
          </LineChart>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
