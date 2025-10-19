import { useState } from 'react';
import { MobileNav } from '../MobileNav';

export default function MobileNavExample() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="bg-background h-[300px] relative">
      <MobileNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onAddRecipe={() => console.log('Add recipe clicked')}
      />
    </div>
  );
}
