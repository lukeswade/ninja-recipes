import { useState } from 'react';
import { FilterBar } from '../FilterBar';

export default function FilterBarExample() {
  const [activeFilter, setActiveFilter] = useState('all');

  return (
    <div className="p-6 bg-background">
      <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
    </div>
  );
}
