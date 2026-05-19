import React, { useEffect, useState } from "react";
import axios from "axios";
import SidebarFilters from "./SidebarFilters";
import "./Catalog.css";
import { Link } from "react-router-dom";

function Catalog() {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({
    name: "",
    priceRange: [0, 1000],
    categories: [],
  });

  useEffect(() => {
    axios
      .get("http://localhost:3001/api/items")
      .then((response) => setItems(response.data))
      .catch((error) => console.error("items load error:", error));
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const filteredItems = items.filter((item) => {
    const matchesName = item.name
      .toLowerCase()
      .includes(filters.name.toLowerCase());
    const matchesPrice =
      item.price >= filters.priceRange[0] &&
      item.price <= filters.priceRange[1];
    const matchesCategory =
      filters.categories.length === 0 ||
      filters.categories.includes(item.category);
    return matchesName && matchesPrice && matchesCategory;
  });

  return (
    <div className="catalog-container">
      <div className="sidebar">
        <SidebarFilters filters={filters} onFilterChange={handleFilterChange} />
      </div>

      <div className="items">
        <div className="items-grid">
          {filteredItems.map((item) => (
            <Link
              to={`/product/${item.category}/${item.id}`}
              key={item.category + item.id}
              className="catalog-card"
            >
              <img
                src={item.image_path}
                alt={item.name}
                className="catalog-img"
              />
              <h3>{item.name}</h3>
              <p>
                <b>Price:</b> {item.price} gold
              </p>
              <p className="catalog-desc">{item.description}</p>
              <p className="catalog-cat">
                <b>Category:</b> {item.category}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Catalog;
