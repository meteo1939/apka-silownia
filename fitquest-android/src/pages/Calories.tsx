import { useState } from 'react';
import { useAuthStore, calculateBMR } from '../store/useAuthStore';
import { Navigation } from '../components/Navigation';
import { Plus, Target, Trash2, Scale, Search, Sparkles } from 'lucide-react';

const INGREDIENTS = [
  { name: 'Chleb żytni', caloriesPer100g: 259, protein: 6.5, carbs: 48, fat: 1.7 },
  { name: 'Bułka pszenna', caloriesPer100g: 272, protein: 8, carbs: 55, fat: 1.5 },
  { name: 'Ryż biały', caloriesPer100g: 360, protein: 7, carbs: 80, fat: 0.6 },
  { name: 'Ryż brązowy', caloriesPer100g: 350, protein: 7.5, carbs: 72, fat: 2.5 },
  { name: 'Makaron pszenny', caloriesPer100g: 355, protein: 12, carbs: 72, fat: 1.5 },
  { name: 'Kasza gryczana', caloriesPer100g: 340, protein: 12.5, carbs: 69, fat: 2.7 },
  { name: 'Owsianka (płatki)', caloriesPer100g: 366, protein: 13.5, carbs: 62, fat: 7 },
  { name: 'Pierś z kurczaka', caloriesPer100g: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: 'Pierś z indyka', caloriesPer100g: 135, protein: 30, carbs: 0, fat: 1.5 },
  { name: 'Schab wieprzowy', caloriesPer100g: 174, protein: 24, carbs: 0, fat: 8.8 },
  { name: 'Mielone z indyka', caloriesPer100g: 146, protein: 19, carbs: 0, fat: 8 },
  { name: 'Stek wołowy', caloriesPer100g: 271, protein: 26, carbs: 0, fat: 19 },
  { name: 'Łosoś świeży', caloriesPer100g: 208, protein: 20, carbs: 0, fat: 13 },
  { name: 'Tuńczyk w sosie własnym', caloriesPer100g: 116, protein: 26, carbs: 0, fat: 1 },
  { name: 'Jajko (1 szt. ok. 50g)', caloriesPer100g: 143, protein: 12.5, carbs: 0.7, fat: 9.5 },
  { name: 'Oliwa z oliwek', caloriesPer100g: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Masło', caloriesPer100g: 717, protein: 0.8, carbs: 0.7, fat: 81 },
  { name: 'Masło orzechowe', caloriesPer100g: 588, protein: 25, carbs: 20, fat: 50 },
  { name: 'Mleko 2%', caloriesPer100g: 50, protein: 3.4, carbs: 4.7, fat: 2 },
  { name: 'Twaróg chudy', caloriesPer100g: 99, protein: 19.8, carbs: 3.5, fat: 0.5 },
  { name: 'Twaróg półtłusty', caloriesPer100g: 133, protein: 18.7, carbs: 3.7, fat: 4.7 },
  { name: 'Skyr naturalny', caloriesPer100g: 65, protein: 12, carbs: 4, fat: 0 },
  { name: 'Jogurt grecki', caloriesPer100g: 115, protein: 9, carbs: 4, fat: 7.5 },
  { name: 'Odżywka białkowa', caloriesPer100g: 380, protein: 78, carbs: 8, fat: 6 },
  { name: 'Jabłko', caloriesPer100g: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  { name: 'Banan', caloriesPer100g: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  { name: 'Truskawki', caloriesPer100g: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
  { name: 'Awokado', caloriesPer100g: 160, protein: 2, carbs: 9, fat: 15 },
  { name: 'Ziemniaki (gotowane)', caloriesPer100g: 87, protein: 1.9, carbs: 20, fat: 0.1 },
  { name: 'Orzechy włoskie', caloriesPer100g: 654, protein: 15, carbs: 14, fat: 65 },
  { name: 'Migdały', caloriesPer100g: 579, protein: 21, carbs: 22, fat: 49 }
];

const parseMacros = (name: string) => {
  const match = name.match(/\|P:(\d+(\.\d+)?)g,C:(\d+(\.\d+)?)g,F:(\d+(\.\d+)?)g/);
  if (match) {
    return {
      protein: parseFloat(match[1]),
      carbs: parseFloat(match[3]),
      fat: parseFloat(match[5])
    };
  }
  return { protein: 0, carbs: 0, fat: 0 };
};

const getDisplayName = (name: string) => {
  return name.split('|')[0].trim();
};

export const Calories = () => {
  const user = useAuthStore(state => state.user);
  const logMeal = useAuthStore(state => state.logMeal);
  const removeMeal = useAuthStore(state => state.removeMeal);
  
  const [customName, setCustomName] = useState('');
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFat, setCustomFat] = useState('');
  
  const [selectedIngredient, setSelectedIngredient] = useState<typeof INGREDIENTS[0] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [ingredientWeight, setIngredientWeight] = useState('');

  if (!user) return null;

  const bmr = calculateBMR(user.weight || 70, user.height || 175);
  const tdee = Math.round(bmr * 1.55);
  const consumed = user.consumedCalories || 0;
  const foodPercent = Math.min(100, Math.round((consumed / tdee) * 100));

  // Calculate target macros
  const proteinTarget = user.weight ? Math.round(user.weight * 2) : 140;
  const fatTarget = user.weight ? Math.round(user.weight * 1) : 70;
  const carbsTarget = Math.round((tdee - (proteinTarget * 4) - (fatTarget * 9)) / 4);

  // Sum current macros
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  if (user.meals) {
    user.meals.forEach(meal => {
      const macros = parseMacros(meal.name);
      totalProtein += macros.protein;
      totalCarbs += macros.carbs;
      totalFat += macros.fat;
    });
  }

  totalProtein = Math.round(totalProtein * 10) / 10;
  totalCarbs = Math.round(totalCarbs * 10) / 10;
  totalFat = Math.round(totalFat * 10) / 10;

  const pPercent = Math.min(100, Math.round((totalProtein / proteinTarget) * 100));
  const cPercent = Math.min(100, Math.round((totalCarbs / carbsTarget) * 100));
  const fPercent = Math.min(100, Math.round((totalFat / fatTarget) * 100));

  const handleAddCustomMeal = () => {
    const amount = Number(customCalories);
    if (customName && !isNaN(amount) && amount > 0) {
      const p = customProtein ? Number(customProtein) : 0;
      const c = customCarbs ? Number(customCarbs) : 0;
      const f = customFat ? Number(customFat) : 0;
      
      logMeal(`${customName} |P:${p}g,C:${c}g,F:${f}g`, amount);
      setCustomName('');
      setCustomCalories('');
      setCustomProtein('');
      setCustomCarbs('');
      setCustomFat('');
    }
  };

  const handleAddIngredient = () => {
    const weight = Number(ingredientWeight);
    if (selectedIngredient && !isNaN(weight) && weight > 0) {
      const calculatedCalories = Math.round((selectedIngredient.caloriesPer100g * weight) / 100);
      const p = ((selectedIngredient.protein * weight) / 100).toFixed(1);
      const c = ((selectedIngredient.carbs * weight) / 100).toFixed(1);
      const f = ((selectedIngredient.fat * weight) / 100).toFixed(1);
      
      logMeal(`${selectedIngredient.name} (${weight}g) |P:${p}g,C:${c}g,F:${f}g`, calculatedCalories);
      setIngredientWeight('');
      setSelectedIngredient(null);
      setSearchTerm('');
    }
  };

  const quickAddMeal = (name: string, kcal: number, p: number, c: number, f: number) => {
    logMeal(`${name} |P:${p}g,C:${c}g,F:${f}g`, kcal);
  };

  const handleRemoveMeal = (id: string, calories: number) => {
    removeMeal(id, calories);
  };

  const filteredIngredients = INGREDIENTS.filter(i =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  return (
    <>
    <div className="animate-fade-in container" style={{ paddingBottom: '120px', paddingTop: '24px', minHeight: '100vh' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 className="text-gradient" style={{ fontSize: '28px', marginBottom: '8px' }}>Tracker Kalorii</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Planuj dietę i buduj formę gladiatora</p>
      </header>

      {/* Calories Progress */}
      <section className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={20} color="var(--accent-base)" />
            <span style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>Zapotrzebowanie (TDEE)</span>
          </div>
          <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{consumed} / {tdee} kcal</span>
        </div>

        <div style={{ width: '100%', height: '12px', background: 'var(--surface-hover)', borderRadius: '6px', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ width: `${foodPercent}%`, height: '100%', background: foodPercent > 100 ? '#ef4444' : 'var(--accent-gradient)', transition: 'width 0.3s' }} />
        </div>

        {/* Macros Progress Bar Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Białko (P)</span>
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{totalProtein} / {proteinTarget}g</span>
            <div style={{ width: '100%', height: '4px', background: 'var(--surface-hover)', borderRadius: '2px', overflow: 'hidden', marginTop: '6px' }}>
              <div style={{ width: `${pPercent}%`, height: '100%', background: '#ef4444' }} />
            </div>
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Węgle (C)</span>
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{totalCarbs} / {carbsTarget}g</span>
            <div style={{ width: '100%', height: '4px', background: 'var(--surface-hover)', borderRadius: '2px', overflow: 'hidden', marginTop: '6px' }}>
              <div style={{ width: `${cPercent}%`, height: '100%', background: '#f59e0b' }} />
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Tłuszcze (F)</span>
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{totalFat} / {fatTarget}g</span>
            <div style={{ width: '100%', height: '4px', background: 'var(--surface-hover)', borderRadius: '2px', overflow: 'hidden', marginTop: '6px' }}>
              <div style={{ width: `${fPercent}%`, height: '100%', background: '#10b981' }} />
            </div>
          </div>
        </div>

        {foodPercent > 100 && (
          <p style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', marginTop: '16px', fontWeight: 500 }}>⚠️ Przekroczono dzienny limit kalorii!</p>
        )}
      </section>

      {/* Quick Add Presets */}
      <section className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="var(--accent-base)" />
          Szybkie Zestawy Gladiatora
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => quickAddMeal('Śniadanie Siłacza (Jajka + Chleb)', 396, 23, 34, 15)} style={{ width: '100%', fontSize: '13px', padding: '10px 14px', justifyContent: 'space-between' }}>
            <span>🍳 Śniadanie Siłacza (Jajka + Chleb)</span>
            <span style={{ color: 'var(--accent-base)', fontWeight: 600 }}>396 kcal | 23g B</span>
          </button>
          <button className="btn btn-secondary" onClick={() => quickAddMeal('Obiad Gladiatora (Kurczak + Ryż + Oliwa)', 696, 53, 80, 15)} style={{ width: '100%', fontSize: '13px', padding: '10px 14px', justifyContent: 'space-between' }}>
            <span>🍗 Obiad Gladiatora (Kurczak + Ryż)</span>
            <span style={{ color: 'var(--accent-base)', fontWeight: 600 }}>696 kcal | 53g B</span>
          </button>
          <button className="btn btn-secondary" onClick={() => quickAddMeal('Białkowy Shake (Skyr + Banan + WPC)', 338, 38, 44, 2)} style={{ width: '100%', fontSize: '13px', padding: '10px 14px', justifyContent: 'space-between' }}>
            <span>🥤 Białkowy Shake (Skyr + Banan + WPC)</span>
            <span style={{ color: 'var(--accent-base)', fontWeight: 600 }}>338 kcal | 38g B</span>
          </button>
        </div>
      </section>

      {/* Advanced Product Search Calculator */}
      <section className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Scale size={20} color="var(--accent-base)" />
          Wyszukaj i Oblicz Produkt
        </h3>
        
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            className="input-field" 
            placeholder="Wpisz nazwę produktu... (np. Ryż, Kurczak)" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '42px', paddingRight: '12px' }}
          />
        </div>

        {searchTerm && !selectedIngredient && (
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
            {filteredIngredients.length === 0 ? (
              <div style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center' }}>Brak wyników w bazie.</div>
            ) : (
              filteredIngredients.map(ing => (
                <button
                  key={ing.name}
                  onClick={() => {
                    setSelectedIngredient(ing);
                    setSearchTerm(ing.name);
                  }}
                  style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', textAlign: 'left', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span>{ing.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{ing.caloriesPer100g} kcal / B:{ing.protein}g</span>
                </button>
              ))
            )}
          </div>
        )}

        {selectedIngredient && (
          <div className="animate-fade-in" style={{ padding: '14px', background: 'rgba(249,115,22,0.05)', border: '1px dashed var(--accent-base)', borderRadius: '8px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedIngredient.name}</span>
              <button 
                onClick={() => { setSelectedIngredient(null); setSearchTerm(''); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}
              >
                Anuluj
              </button>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              100g: {selectedIngredient.caloriesPer100g} kcal | B: {selectedIngredient.protein}g | W: {selectedIngredient.carbs}g | T: {selectedIngredient.fat}g
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="number" 
            className="input-field" 
            placeholder="Waga (gram)" 
            value={ingredientWeight} 
            disabled={!selectedIngredient}
            onChange={e => setIngredientWeight(e.target.value)} 
            style={{ flex: 1, padding: '12px' }} 
          />
          <button className="btn btn-primary" onClick={handleAddIngredient} disabled={!selectedIngredient || !ingredientWeight} style={{ padding: '0 24px' }}>
            <Plus size={20} /> Add
          </button>
        </div>
      </section>

      {/* Custom Meal Input */}
      <section className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Własny Posiłek</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Nazwa posiłku (np. Obiad u babci)" 
            value={customName} 
            onChange={e => setCustomName(e.target.value)} 
            style={{ padding: '12px' }} 
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <input 
              type="number" 
              className="input-field" 
              placeholder="Kalorie (kcal)" 
              value={customCalories} 
              onChange={e => setCustomCalories(e.target.value)} 
              style={{ padding: '12px' }} 
            />
            <input 
              type="number" 
              className="input-field" 
              placeholder="Białko (g)" 
              value={customProtein} 
              onChange={e => setCustomProtein(e.target.value)} 
              style={{ padding: '12px' }} 
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <input 
              type="number" 
              className="input-field" 
              placeholder="Węglowodany (g)" 
              value={customCarbs} 
              onChange={e => setCustomCarbs(e.target.value)} 
              style={{ padding: '12px' }} 
            />
            <input 
              type="number" 
              className="input-field" 
              placeholder="Tłuszcze (g)" 
              value={customFat} 
              onChange={e => setCustomFat(e.target.value)} 
              style={{ padding: '12px' }} 
            />
          </div>
          <button className="btn btn-secondary" onClick={handleAddCustomMeal} style={{ width: '100%', marginTop: '4px' }}>
            <Plus size={20} /> Dodaj własny posiłek
          </button>
        </div>
      </section>

      {/* Today's Meals */}
      <section>
        <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Dzisiejsze Posiłki</h3>
        {!user.meals || user.meals.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>Brak dodanych posiłków na dziś.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {user.meals.map((meal) => {
              const m = parseMacros(meal.name);
              const displayName = getDisplayName(meal.name);
              return (
                <div key={meal.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{displayName}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      B: {m.protein}g | W: {m.carbs}g | T: {m.fat}g
                    </span>
                  </div>
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
              );
            })}
          </div>
        )}
      </section>

    </div>
    <Navigation />
    </>
  );
};
