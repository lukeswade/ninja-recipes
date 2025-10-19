import { useState } from 'react';
import { SearchBar } from '../SearchBar';

export default function SearchBarExample() {
  const [search, setSearch] = useState('');

  return (
    <div className="p-6 bg-background">
      <SearchBar value={search} onChange={setSearch} />
    </div>
  );
}
