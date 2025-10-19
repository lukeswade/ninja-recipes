import { useState } from 'react';
import { AddRecipeModal } from '../AddRecipeModal';
import { Button } from '@/components/ui/button';

export default function AddRecipeModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6 bg-background">
      <Button onClick={() => setOpen(true)}>Open Add Recipe Modal</Button>
      <AddRecipeModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={(recipe) => console.log('Recipe saved:', recipe)}
      />
    </div>
  );
}
