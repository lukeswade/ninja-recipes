import { Header } from '../Header';
import { ThemeProvider } from '../ThemeProvider';

export default function HeaderExample() {
  return (
    <ThemeProvider>
      <div className="bg-background min-h-[200px]">
        <Header
          onAddRecipe={() => console.log('Add recipe clicked')}
          onProfileClick={() => console.log('Profile clicked')}
        />
      </div>
    </ThemeProvider>
  );
}
