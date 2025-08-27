import React, { useState, useCallback } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { useDebounce } from '@/hooks';
import type { BaseComponentProps } from '@/types';

interface SearchBarProps extends BaseComponentProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onFilterClick?: () => void;
  showFilter?: boolean;
  initialValue?: string;
}

/**
 * SearchBar Component
 * 
 * A reusable search input with debounced search and optional filter button
 * 
 * @example
 * <SearchBar 
 *   placeholder="Search photos..." 
 *   onSearch={(query) => handleSearch(query)}
 *   showFilter
 *   onFilterClick={() => setShowFilters(true)}
 * />
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  onSearch,
  onFilterClick,
  showFilter = false,
  initialValue = '',
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  React.useEffect(() => {
    if (onSearch && debouncedSearchTerm !== initialValue) {
      onSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, onSearch, initialValue]);

  const handleClear = useCallback(() => {
    setSearchTerm('');
    if (onSearch) {
      onSearch('');
    }
  }, [onSearch]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  return (
    <div className={`search-bar ${className}`}>
      <div className="search-input-container">
        <Search className="search-icon" size={20} />
        <input
          type="search"
          value={searchTerm}
          onChange={handleChange}
          placeholder={placeholder}
          className="search-input"
          aria-label="Search"
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className="search-clear-button"
            aria-label="Clear search"
            type="button"
          >
            <X size={16} />
          </button>
        )}
        {showFilter && (
          <button
            onClick={onFilterClick}
            className="filter-button"
            aria-label="Open filters"
            type="button"
          >
            <Filter size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

SearchBar.displayName = 'SearchBar';

export default SearchBar;
