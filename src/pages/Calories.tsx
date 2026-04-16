import { useState } from 'react';
import { useAuthStore, calculateBMR } from '../store/useAuthStore';
import { Navigation } from '../components/Navigation';
import { Plus, Target, Trash2, Scale } from 'lucide-react';

const INGREDIENTS = [
  { name: 'Jabłko', caloriesPer100g: 52 },
  { name: 'Banan', caloriesPer100g: 89 },
  { name: 'Pierś z kurczaka (surowa)', caloriesPer100g: 165 },
  { name: 'Ryż biały (surowy)', caloriesPer100g: 360 },
  { name: 'Twaróg chudy', caloriesPer100g: 99 },
  { name: 'Oliwa z oliwek', caloriesPer100g: 884 },
  { name: 'Chleb żytni', caloriesPer100g: 259 },
  { name: 'Wołowina (stek)', caloriesPer100g: 271 },
];

export const Calories = () => {
  const user = useAuthStore(state => state.user);
  const logMeal = useAuthStore(state => state.logMeal);
  const removeMeal = useAuthStore(state => state.removeMeal);
  
  const [customName, setCustomName] = useState('');
  const [customCalories, setCustomCalories] = useState('');
  
  const [selectedIngredient, setSelectedIngredient] = useState(INGREDIENTS[0].name);
  const [ingredientWeight, setIngredientWeight] = useState('');

  if (!user) return null;

  const bmr = calculateBMR(user.weight || 70, user.height || 175);
  const tdee = Math.round(bmr * 1.55);
  const consumed = user.consumedCalories || 0;
  const foodPercent = Math.min(100, Math.round((consumed / tdee) * 100));

  const handleAddCustomMeal = () => {
    const amount = Number(customCalories);
    if (customName && !isNaN(amount) && amount > 0) {
      logMeal(customName, amount);
      setCustomName('');
      setCustomCalories('');
    }
  };

  const handleAddIngredient = () => {
    const weight = Number(ingredientWeight);
    const ingredient = INGREDIENTS.find(i => i.name === selectedIngredient);
    if (ingredient && !isNaN(weight) && weight > 0) {
      const calculatedCalories = Math.round((ingredient.caloriesPer100g * weight) / 100);
      logMeal(`${ingredient.name} (${weight}g)`, calculatedCalories);
      setIngredientWeight('');
    }
  };


  const handleRemoveMeal = (id: string, calories: number) => {
    removeMeal(id, calories);
  };

  return (
    <>
    <div className="animate-fade-in container" style={{ paddingBottom: '100px', paddingTop: '24px', minHeight: '100vh' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 className="text-gradient" style={{ fontSize: '28px', marginBottom: '8px' }}>Tracker Kalorii</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Monitoruj swoje dzienne spożycie</p>
      </header>

      <section className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={20} color="var(--accent-base)" />
            <span style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>Zapotrzebowanie (TDEE)</span>
          </div>
          <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{consumed} / {tdee} kcal</span>
        </div>

        <div style={{ width: '100%', height: '12px', background: 'var(--surface-hover)', borderRadius: '6px', overflow: 'hidden', marginBottom: '16px' }}>
          <div style={{ width: `${foodPercent}%`, height: '100%', background: foodPercent > 100 ? '#ef4444' : 'var(--accent-gradient)', transition: 'width 0.3s' }} />
        </div>
        {foodPercent > 100 && (
          <p style={{ color: '#ef4444', fontSize: '14px', textAlign: 'center' }}>Przekroczono dzienny limit kalorii!</p>
        )}
      </section>

      <section className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Scale size={20} color="var(--accent-base)" />
          Kalkulator Produktów
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border-color)' }}>
          <select 
            className="input-field" 
            value={selectedIngredient} 
            onChange={e => setSelectedIngredient(e.target.value)}
            style={{ padding: '12px', color: 'var(--text-primary)', background: 'var(--surface-hover)' }}
          >
            {INGREDIENTS.map(ing => (
              <option key={ing.name} value={ing.name}>
                {ing.name} ({ing.caloriesPer100g} kcal/100g)
              </option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input 
              type="number" 
              className="input-field" 
              placeholder="Waga (gram)" 
              value={ingredientWeight} 
              onChange={e => setIngredientWeight(e.target.value)} 
              style={{ flex: 1, padding: '12px' }} 
            />
            <button className="btn btn-secondary" onClick={handleAddIngredient} style={{ padding: '0 24px' }}>
              <Plus size={24} />
            </button>
          </div>
        </div>

        <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Własny Posiłek</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Nazwa posiłku (np. Sałatka z kurczakiem)" 
            value={customName} 
            onChange={e => setCustomName(e.target.value)} 
            style={{ padding: '12px' }} 
          />
          <div style={{ display: 'flex', gap: '12px' }}>
            <input 
              type="number" 
              className="input-field" 
              placeholder="Kalorie" 
              value={customCalories} 
              onChange={e => setCustomCalories(e.target.value)} 
              style={{ flex: 1, padding: '12px' }} 
            />
            <button className="btn btn-secondary" onClick={handleAddCustomMeal} style={{ padding: '0 24px' }}>
              <Plus size={24} />
            </button>
          </div>
        </div>
      </section>

      <section>
        <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Dzisiejsze Posiłki</h3>
        {!user.meals || user.meals.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px', background: 'var(--surface-base)', borderRadius: '12px' }}>Brak dodanych posiłków na dziś.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {user.meals.map((meal) => (
              <div key={meal.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', alignItems: 'center' }}>
                <span style={{ fontWeight: 500 }}>{meal.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: 'var(--accent-base)', fontWeight: 'bold' }}>+{meal.calories} kcal</span>
                  <button 
                    onClick={() => handleRemoveMeal(meal.id, meal.calories)}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
    <Navigation />
    </>
  );
};
