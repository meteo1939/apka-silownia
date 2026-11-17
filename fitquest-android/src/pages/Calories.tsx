import { useState } from 'react';
import { useAuthStore, calculateBMR } from '../store/useAuthStore';
import { Navigation } from '../components/Navigation';
import { useTranslation } from '../lib/translations';
import { goalLabelKey } from '../lib/onboarding';
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

const translateIngredientName = (name: string, lang: string): string => {
  if (lang === 'pl') return name;
  const dict: Record<string, string> = {
    'Chleb żytni': 'Rye bread',
    'Bułka pszenna': 'Wheat roll',
    'Ryż biały': 'White rice',
    'Ryż brązowy': 'Brown rice',
    'Makaron pszenny': 'Wheat pasta',
    'Kasza gryczana': 'Buckwheat',
    'Owsianka (płatki)': 'Oatmeal (flakes)',
    'Pierś z kurczaka': 'Chicken breast',
    'Pierś z indyka': 'Turkey breast',
    'Schab wieprzowy': 'Pork loin',
    'Mielone z indyka': 'Ground turkey',
    'Stek wołowy': 'Beef steak',
    'Łosoś świeży': 'Fresh salmon',
    'Tuńczyk w sosie własnym': 'Tuna in brine',
    'Jajko (1 szt. ok. 50g)': 'Egg (1 pc. approx. 50g)',
    'Oliwa z oliwek': 'Olive oil',
    'Masło': 'Butter',
    'Masło orzechowe': 'Peanut butter',
    'Mleko 2%': 'Milk 2%',
    'Twaróg chudy': 'Low-fat curd cheese',
    'Twaróg półtłusty': 'Semi-fat curd cheese',
    'Skyr naturalny': 'Natural skyr',
    'Jogurt grecki': 'Greek yogurt',
    'Odżywka białkowa': 'Whey protein powder',
    'Jabłko': 'Apple',
    'Banan': 'Banana',
    'Truskawki': 'Strawberries',
    'Awokado': 'Avocado',
    'Ziemniaki (gotowane)': 'Potatoes (boiled)',
    'Orzechy włoskie': 'Walnuts',
    'Migdały': 'Almonds'
  };

  let result = name;
  for (const plKey of Object.keys(dict)) {
    if (result.startsWith(plKey)) {
      result = result.replace(plKey, dict[plKey]);
      break;
    }
  }
  return result;
};

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

const getDisplayName = (name: string, lang: string) => {
  const rawName = name.split('|')[0].trim();
  return translateIngredientName(rawName, lang);
};

export const Calories = () => {
  const { t, lang } = useTranslation();
  const user = useAuthStore(state => state.user);
  const logMeal = useAuthStore(state => state.logMeal);
  const removeMeal = useAuthStore(state => state.removeMeal);
  const onboarding = useAuthStore(state => state.onboarding);
  
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
  const tdee = onboarding?.targetCalories || Math.round(bmr * 1.55);
  const consumed = user.consumedCalories || 0;
  const foodPercent = Math.min(100, Math.round((consumed / tdee) * 100));

  // Calculate target macros (onboarding targets take priority)
  const proteinTarget = onboarding?.protein || (user.weight ? Math.round(user.weight * 2) : 140);
  const fatTarget = onboarding?.fat || (user.weight ? Math.round(user.weight * 1) : 70);
  const carbsTarget = onboarding?.carbs || Math.round((tdee - (proteinTarget * 4) - (fatTarget * 9)) / 4);

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

  const quickAddMeal = (namePl: string, nameEn: string, kcal: number, p: number, c: number, f: number) => {
    const name = lang === 'pl' ? namePl : nameEn;
    logMeal(`${name} |P:${p}g,C:${c}g,F:${f}g`, kcal);
  };

  const handleRemoveMeal = (id: string, calories: number) => {
    removeMeal(id, calories);
  };

  const filteredIngredients = INGREDIENTS.filter(i => {
    const translated = translateIngredientName(i.name, lang);
    return i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           translated.toLowerCase().includes(searchTerm.toLowerCase());
  }).slice(0, 5);

  return (
    <>
    <div className="container app-page page-calories page-transition">
      <header style={{ marginBottom: '24px' }}>
        <h1 className="text-gradient" style={{ fontSize: '28px', marginBottom: '8px' }}>{t('calories.title')}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {lang === 'pl' ? 'Planuj dietę i buduj formę gladiatora' : 'Plan your diet and build your gladiator physique'}
        </p>
      </header>

      {/* Calories Progress */}
      <section className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        {onboarding && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <span style={{ fontSize: '10px', padding: '3px 9px', borderRadius: '20px', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', color: 'var(--accent)', fontWeight: 600 }}>
              {t(goalLabelKey(onboarding.goal))}
            </span>
            <span style={{ fontSize: '10px', padding: '3px 9px', borderRadius: '20px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
              {t(`workout.plans.${onboarding.planId}.name`, onboarding.planId)}
            </span>
            <span style={{ fontSize: '10px', padding: '3px 9px', borderRadius: '20px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
              P {onboarding.protein}g · C {onboarding.carbs}g · F {onboarding.fat}g
            </span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={20} color="var(--accent-base)" />
            <span style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
              {onboarding
                ? (lang === 'pl' ? 'Cel kalorii z planu' : 'Plan calorie target')
                : (lang === 'pl' ? 'Zapotrzebowanie (TDEE)' : 'Daily Target (TDEE)')}
            </span>
          </div>
          <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{consumed} / {tdee} kcal</span>
        </div>

        <div style={{ width: '100%', height: '12px', background: 'var(--surface-hover)', borderRadius: '6px', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ width: `${foodPercent}%`, height: '100%', background: foodPercent > 100 ? 'var(--danger)' : 'var(--accent)', transition: 'width 0.3s' }} />
        </div>

        {/* Macros Progress Bar Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div style={{ background: 'var(--surface-2)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              {t('calories.protein')} (P)
            </span>
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{totalProtein} / {proteinTarget}g</span>
            <div style={{ width: '100%', height: '4px', background: 'var(--surface-3)', borderRadius: '2px', overflow: 'hidden', marginTop: '6px' }}>
              <div style={{ width: `${pPercent}%`, height: '100%', background: 'var(--accent)' }} />
            </div>
          </div>
          
          <div style={{ background: 'var(--surface-2)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              {lang === 'pl' ? 'Węgle' : 'Carbs'} (C)
            </span>
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{totalCarbs} / {carbsTarget}g</span>
            <div style={{ width: '100%', height: '4px', background: 'var(--surface-3)', borderRadius: '2px', overflow: 'hidden', marginTop: '6px' }}>
              <div style={{ width: `${cPercent}%`, height: '100%', background: 'var(--accent)' }} />
            </div>
          </div>

          <div style={{ background: 'var(--surface-2)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              {t('calories.fats')} (F)
            </span>
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{totalFat} / {fatTarget}g</span>
            <div style={{ width: '100%', height: '4px', background: 'var(--surface-3)', borderRadius: '2px', overflow: 'hidden', marginTop: '6px' }}>
              <div style={{ width: `${fPercent}%`, height: '100%', background: 'var(--accent)' }} />
            </div>
          </div>
        </div>

        {foodPercent > 100 && (
          <p style={{ color: 'var(--danger)', fontSize: '13px', textAlign: 'center', marginTop: '16px', fontWeight: 500 }}>
            {lang === 'pl' ? 'Przekroczono dzienny limit kalorii!' : 'Daily calorie limit exceeded!'}
          </p>
        )}
      </section>

      {/* Quick Add Presets */}
      <section className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="var(--accent-base)" />
          {t('calories.quickTemplates')}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => quickAddMeal('Śniadanie Siłacza (Jajka + Chleb)', 'Power Breakfast (Eggs + Bread)', 396, 23, 34, 15)} style={{ width: '100%', fontSize: '13px', padding: '10px 14px', justifyContent: 'space-between' }}>
            <span>{t('calories.breakfast')} ({lang === 'pl' ? 'Jajka + Chleb' : 'Eggs + Bread'})</span>
            <span style={{ color: 'var(--accent-base)', fontWeight: 600 }}>396 kcal | 23g {lang === 'pl' ? 'B' : 'P'}</span>
          </button>
          <button className="btn btn-secondary" onClick={() => quickAddMeal('Obiad Gladiatora (Kurczak + Ryż)', 'Gladiator Lunch (Chicken + Rice)', 696, 53, 80, 15)} style={{ width: '100%', fontSize: '13px', padding: '10px 14px', justifyContent: 'space-between' }}>
            <span>{t('calories.lunch')} ({lang === 'pl' ? 'Kurczak + Ryż' : 'Chicken + Rice'})</span>
            <span style={{ color: 'var(--accent-base)', fontWeight: 600 }}>696 kcal | 53g {lang === 'pl' ? 'B' : 'P'}</span>
          </button>
          <button className="btn btn-secondary" onClick={() => quickAddMeal('Białkowy Shake (Skyr + Banan + WPC)', 'Protein Shake (Skyr + Banana + WPC)', 338, 38, 44, 2)} style={{ width: '100%', fontSize: '13px', padding: '10px 14px', justifyContent: 'space-between' }}>
            <span>Shake ({lang === 'pl' ? 'Skyr + Banan + WPC' : 'Skyr + Banana + WPC'})</span>
            <span style={{ color: 'var(--accent-base)', fontWeight: 600 }}>338 kcal | 38g {lang === 'pl' ? 'B' : 'P'}</span>
          </button>
        </div>
      </section>

      {/* Advanced Product Search Calculator */}
      <section className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Scale size={20} color="var(--accent-base)" />
          {lang === 'pl' ? 'Wyszukaj i Oblicz Produkt' : 'Search & Calculate Product'}
        </h3>
        
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            className="input-field" 
            placeholder={t('calories.searchPlaceholder')} 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '42px', paddingRight: '12px' }}
          />
        </div>

        {searchTerm && !selectedIngredient && (
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
            {filteredIngredients.length === 0 ? (
              <div style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center' }}>
                {lang === 'pl' ? 'Brak wyników w bazie.' : 'No results in database.'}
              </div>
            ) : (
              filteredIngredients.map(ing => (
                <button
                  key={ing.name}
                  onClick={() => {
                    setSelectedIngredient(ing);
                    setSearchTerm(translateIngredientName(ing.name, lang));
                  }}
                  style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', textAlign: 'left', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span>{translateIngredientName(ing.name, lang)}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    {ing.caloriesPer100g} kcal / {lang === 'pl' ? 'B' : 'P'}:{ing.protein}g
                  </span>
                </button>
              ))
            )}
          </div>
        )}

        {selectedIngredient && (
          <div className="animate-fade-in" style={{ padding: '14px', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: '8px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{translateIngredientName(selectedIngredient.name, lang)}</span>
              <button 
                onClick={() => { setSelectedIngredient(null); setSearchTerm(''); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}
              >
                {t('common.cancel')}
              </button>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              100g: {selectedIngredient.caloriesPer100g} kcal | {lang === 'pl' ? 'B' : 'P'}: {selectedIngredient.protein}g | {lang === 'pl' ? 'W' : 'C'}: {selectedIngredient.carbs}g | {lang === 'pl' ? 'T' : 'F'}: {selectedIngredient.fat}g
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="number" 
            className="input-field" 
            placeholder={lang === 'pl' ? 'Waga (gram)' : 'Weight (grams)'} 
            value={ingredientWeight} 
            disabled={!selectedIngredient}
            onChange={e => setIngredientWeight(e.target.value)} 
            style={{ flex: 1, padding: '12px' }} 
          />
          <button className="btn btn-primary" onClick={handleAddIngredient} disabled={!selectedIngredient || !ingredientWeight} style={{ padding: '0 24px' }}>
            <Plus size={20} /> {t('calories.add')}
          </button>
        </div>
      </section>

      {/* Custom Meal Input */}
      <section className="card" style={{ padding: '24px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>{t('calories.customProduct')}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder={lang === 'pl' ? 'Nazwa posiłku (np. Obiad u babci)' : 'Meal name (e.g. Grandma\'s lunch)'} 
            value={customName} 
            onChange={e => setCustomName(e.target.value)} 
            style={{ padding: '12px' }} 
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <input 
              type="number" 
              className="input-field" 
              placeholder={t('calories.caloriesPlaceholder')} 
              value={customCalories} 
              onChange={e => setCustomCalories(e.target.value)} 
              style={{ padding: '12px' }} 
            />
            <input 
              type="number" 
              className="input-field" 
              placeholder={`${t('calories.protein')} (g)`} 
              value={customProtein} 
              onChange={e => setCustomProtein(e.target.value)} 
              style={{ padding: '12px' }} 
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <input 
              type="number" 
              className="input-field" 
              placeholder={`${lang === 'pl' ? 'Węglowodany' : 'Carbohydrates'} (g)`} 
              value={customCarbs} 
              onChange={e => setCustomCarbs(e.target.value)} 
              style={{ padding: '12px' }} 
            />
            <input 
              type="number" 
              className="input-field" 
              placeholder={`${t('calories.fats')} (g)`} 
              value={customFat} 
              onChange={e => setCustomFat(e.target.value)} 
              style={{ padding: '12px' }} 
            />
          </div>
          <button className="btn btn-secondary" onClick={handleAddCustomMeal} style={{ width: '100%', marginTop: '4px' }}>
            <Plus size={20} /> {t('calories.addFood')}
          </button>
        </div>
      </section>

      {/* Today's Meals */}
      <section>
        <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>{t('calories.mealHistory')}</h3>
        {!user.meals || user.meals.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
            {t('calories.noMeals')}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {user.meals.map((meal) => {
              const m = parseMacros(meal.name);
              const displayName = getDisplayName(meal.name, lang);
              return (
                <div key={meal.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{displayName}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {lang === 'pl' ? `B: ${m.protein}g | W: ${m.carbs}g | T: ${m.fat}g` : `P: ${m.protein}g | C: ${m.carbs}g | F: ${m.fat}g`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: 'var(--accent-base)', fontWeight: 'bold' }}>+{meal.calories} kcal</span>
                    <button 
                      onClick={() => handleRemoveMeal(meal.id, meal.calories)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
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
