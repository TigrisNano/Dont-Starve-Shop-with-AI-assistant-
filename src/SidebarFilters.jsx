import React from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import './SidebarFilters.css';

function SidebarFilters({ filters, onFilterChange }) {
  const categories = [
    'Tools', 'Light', 'Survival', 'Food', 'Science',
    'Fight', 'Structures', 'Refine', 'Magic', 'Dress', 'Ancient'
  ];

  const handleNameChange = (e) => {
    onFilterChange({ ...filters, name: e.target.value });
  };

  const handlePriceRangeChange = (range) => {
    onFilterChange({ ...filters, priceRange: range });
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    const isChecked = e.target.checked;
    const updatedCategories = isChecked
      ? [...filters.categories, category]
      : filters.categories.filter(c => c !== category);
    onFilterChange({ ...filters, categories: updatedCategories });
  };

  return (
    <div className="sidebar-content">
      <h3>Filters</h3>

      <div className="filter-group">
        <label htmlFor="search-input">Search:</label>
        <input
          id="search-input"
          type="text"
          value={filters.name}
          onChange={handleNameChange}
          placeholder="Example: Torch"
        />
      </div>

      <div className="filter-group">
        <label>Price: {filters.priceRange[0]} – {filters.priceRange[1]}</label>
        <Slider
          range
          min={0}
          max={1000}
          value={filters.priceRange}
          onChange={handlePriceRangeChange}
        />
      </div>

      <div className="filter-group">
        <label>Category:</label>
        <div className="categories-list">
          {categories.map(category => (
            <div key={category}>
              <input
                type="checkbox"
                id={`cat-${category}`}
                value={category}
                checked={filters.categories.includes(category)}
                onChange={handleCategoryChange}
              />
              <label htmlFor={`cat-${category}`}>{category}</label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SidebarFilters;
