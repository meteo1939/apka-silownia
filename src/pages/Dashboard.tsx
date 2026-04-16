import { useState, useEffect } from 'react';
import { useAuthStore, EXP_TO_NEXT_LEVEL, generateRandomItem, getPrestigeRank } from '../store/useAuthStore';
import { Navigation } from '../components/Navigation';
import { LogOut, Flame, Award, Edit2, Check, Shield, Sword, Crown, Zap, Ghost, Star, Skull, Package, Crosshair, Coins, ShoppingBag } from 'lucide-react';

const AVATARS = [
  { id: 'Shield', icon: Shield },
  { id: 'Sword', icon: Sword },
  { id: 'Crown', icon: Crown },
  { id: 'Zap', icon: Zap },
  { id: 'Ghost', icon: Ghost },
  { id: 'Star', icon: Star },
  { id: 'Skull', icon: Skull },
];

const MUSCLE_DESCRIPTIONS: Record<string, string> = {
  Core: 'Zdrowie w walce (Max HP)',
  Arms: 'Obrażenia (Damage bazowy)',
  Chest: 'Pancerz (Redukcja ciosów)',
  Legs: 'Zwinność (Szansa na Unik %)',
  Back: 'Energia (Zapas na uderzenia)',
  Shoulders: 'Precyzja (Szansa na Kryt %)',
};

export const Dashboard = () => {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const updateProfile = useAuthStore(state => state.updateProfile);
  const checkStreak = useAuthStore(state => state.checkStreak);
  const equipItem = useAuthStore(state => state.equipItem);
  const unequipItem = useAuthStore(state => state.unequipItem);
  const deductCoins = useAuthStore(state => state.deductCoins);
  const lootItem = useAuthStore(state => state.lootItem);

  const [isEditing, setIsEditing] = useState(false);
  const [editWeight, setEditWeight] = useState(user?.weight?.toString() || '70');
  const [editHeight, setEditHeight] = useState(user?.height?.toString() || '175');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const currentIconId = user?.heroIcon || 'Shield';
  const CurrentIconNode = AVATARS.find(a => a.id === currentIconId)?.icon || Shield;

  useEffect(() => {
    checkStreak();
  }, [checkStreak]);

  if (!user) return null;

  const nextLevelExp = user.level >= 1000 ? 1 : EXP_TO_NEXT_LEVEL(user.level);
  const progressPercent = user.level >= 1000 ? 100 : Math.min(100, Math.round((user.totalExp / nextLevelExp) * 100));

  const handleSaveProfile = () => {
    if (editWeight && editHeight) {
      updateProfile({ weight: Number(editWeight), height: Number(editHeight) });
      setIsEditing(false);
    }
  };

  const inventory = user.inventory || [];
  const equipped = user.equipped || { weapon: null, armor: null, accessory: null };

  const getRarityColor = (rarity: string) => {
    switch(rarity) {
      case 'Legendary': return '#eab308';
      case 'Epic': return '#a855f7';
      case 'Rare': return '#3b82f6';
      default: return '#9ca3af';
    }
  };

  const handleBuyBox = async (type: 'basic' | 'gladiator' | 'mythic') => {
    let cost = 0;
    let minRarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | undefined = undefined;

    if (type === 'basic') { cost = 50; }
    else if (type === 'gladiator') { cost = 200; minRarity = Math.random() > 0.5 ? 'Epic' : 'Rare'; }
    else if (type === 'mythic') { cost = 1000; minRarity = Math.random() > 0.3 ? 'Legendary' : 'Epic'; }

    if (await deductCoins(cost)) {
       const item = generateRandomItem(minRarity);
       lootItem(item);
       alert(`Otworzyłeś skrzynię! Zdobywasz: ${item.name} (+${item.statBoost.value} ${item.statBoost.stat})`);
    } else {
       alert("Nie masz wystarczająco Złota!");
    }
  };

  return (
    <>
    <div className="animate-fade-in container" style={{ paddingBottom: '100px', paddingTop: '24px', minHeight: '100vh' }}>
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div 
             onClick={() => setShowAvatarPicker(!showAvatarPicker)}
             style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--accent-base)', flexShrink: 0, cursor: 'pointer' }}>
            <CurrentIconNode size={32} color="var(--accent-base)" />
          </div>
          <div>
            <h1 className="text-gradient" style={{ fontSize: '28px', margin: 0, marginBottom: '4px' }}>
              {user.level >= 1000 ? 'Level MAX' : `Level ${user.level}`}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <p style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600, margin: 0 }}>{user.username}</p>
               <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: getPrestigeRank(user.prestige).color + '20', color: getPrestigeRank(user.prestige).color, fontWeight: 'bold' }}>
                  {getPrestigeRank(user.prestige).name}
               </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <div style={{ width: '100px', height: '6px', background: 'var(--surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--accent-gradient)' }} />
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {user.level >= 1000 ? 'MAX' : `${user.totalExp} / ${nextLevelExp}`}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
             <Coins size={20} color="#fbbf24" />
             <span style={{ fontWeight: 'bold' }}>{user.coins || 0}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
             <Award size={20} color="#a855f7" />
             <span style={{ fontWeight: 'bold' }}>{user.prestige || 0}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Flame size={20} color="#f97316" />
            <span style={{ fontWeight: 'bold' }}>{user.streak || 1}</span>
          </div>
          <button onClick={() => logout()} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {showAvatarPicker && (
        <section className="animate-fade-in glass-panel" style={{ padding: '16px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Choose your Hero Icon</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {AVATARS.map(avatar => {
              const Icon = avatar.icon;
              const isSelected = avatar.id === currentIconId;
              return (
                <button
                  key={avatar.id}
                  onClick={() => {
                    updateProfile({ heroIcon: avatar.id });
                    setShowAvatarPicker(false);
                  }}
                  style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px',
                    padding: '12px', background: isSelected ? 'var(--accent-base)' : 'var(--surface-hover)', 
                    border: 'none', borderRadius: '8px', cursor: 'pointer',
                    transition: '0.2s all'
                  }}
                >
                  <Icon size={24} color={isSelected ? 'white' : 'var(--accent-base)'} />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Profile & Vital Stats section */}
      <section className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px' }}>Vital Stats</h3>
          <button onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-base)', cursor: 'pointer' }}>
            {isEditing ? <Check size={20} /> : <Edit2 size={20} />}
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <span className="label">Weight (kg)</span>
            {isEditing ? (
              <input type="number" className="input-field" value={editWeight} onChange={e => setEditWeight(e.target.value)} style={{ padding: '8px' }} />
            ) : (
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{user.weight || 70} kg</div>
            )}
          </div>
          <div>
            <span className="label">Height (cm)</span>
            {isEditing ? (
              <input type="number" className="input-field" value={editHeight} onChange={e => setEditHeight(e.target.value)} style={{ padding: '8px' }} />
            ) : (
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{user.height || 175} cm</div>
            )}
          </div>
        </div>


      </section>

      {(user.achievements || []).length > 0 && (
        <section style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>Achievements</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(user.achievements || []).map((id, index) => (
              <div key={index} className="glass-panel" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={20} color="#fbbf24" />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{id}</span>
              </div>
            ))}
          </div>
        </section>
      )}


      
      <section>
        <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Military Equipment</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
          {['weapon', 'armor', 'accessory'].map(slot => {
            const item = equipped[slot as 'weapon'|'armor'|'accessory'];
            return (
               <div key={slot} className="glass-panel" style={{ padding: '12px', textAlign: 'center', border: item ? `1px solid ${getRarityColor(item.rarity)}` : '1px dashed var(--border-color)', position: 'relative' }}>
                 <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>{slot}</p>
                 {item ? (
                   <div onClick={() => unequipItem(slot as any)} style={{ cursor: 'pointer' }}>
                     <div style={{ fontWeight: 600, fontSize: '12px', color: getRarityColor(item.rarity) }}>{item.name}</div>
                     <div style={{ fontSize: '11px', color: 'var(--accent-base)' }}>+{item.statBoost.value} {item.statBoost.stat}</div>
                   </div>
                 ) : (
                   <div style={{ padding: '8px 0', opacity: 0.3 }}><Package size={24} style={{ margin: '0 auto' }} /></div>
                 )}
               </div>
            );
          })}
        </div>
        
        {inventory.length > 0 && (
          <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px' }}>
            <h4 style={{ fontSize: '14px', marginBottom: '12px' }}>Backpack</h4>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
              {inventory.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => equipItem(item.id, item.type)}
                  style={{ minWidth: '120px', padding: '8px', background: 'var(--surface-hover)', borderRadius: '8px', border: `1px solid ${getRarityColor(item.rarity)}`, cursor: 'pointer' }}
                >
                  <div style={{ fontWeight: 600, fontSize: '12px', color: getRarityColor(item.rarity) }}>{item.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--accent-base)' }}>+{item.statBoost.value} {item.statBoost.stat}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', border: '1px solid #fbbf24' }}>
           <h4 style={{ fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShoppingBag size={16} color="#fbbf24" /> Czarny Rynek (Sklep)
           </h4>
           <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Wydaj Złoto zarobione na Arenie na potężny, losowy ekwipunek.</p>
           
           <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => handleBuyBox('basic')} style={{ justifyContent: 'space-between' }}>
                 <span>Skrzynia Biedaka</span>
                 <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}><Coins size={14}/> 50</span>
              </button>
              <button className="btn btn-secondary" onClick={() => handleBuyBox('gladiator')} style={{ justifyContent: 'space-between', borderColor: '#a855f7' }}>
                 <span style={{ color: '#a855f7' }}>Pudło Gladiatora</span>
                 <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}><Coins size={14}/> 200</span>
              </button>
              <button className="btn btn-secondary" onClick={() => handleBuyBox('mythic')} style={{ justifyContent: 'space-between', borderColor: '#eab308' }}>
                 <span style={{ color: '#eab308', fontWeight: 'bold' }}>Mityczny Relikwiarz</span>
                 <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}><Coins size={14}/> 1000</span>
              </button>
           </div>
        </div>
      </section>

      <section>
        <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Muscle Stats</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Shoulders'].map((muscle) => {
            const stat = user.muscleStats[muscle];
            const mNextExp = stat.level >= 1000 ? 1 : EXP_TO_NEXT_LEVEL(stat.level);
            const mPercent = stat.level >= 1000 ? 100 : Math.min(100, Math.round((stat.exp / mNextExp) * 100));

            return (
              <div key={muscle} className="glass-panel" style={{ padding: '16px' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>{muscle}</p>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                   <Crosshair size={10} /> {MUSCLE_DESCRIPTIONS[muscle]}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
                    {stat.level >= 1000 ? 'MAX' : `Lv. ${stat.level}`}
                  </span>
                </div>
                <div style={{ width: '100%', height: '4px', background: 'var(--surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${mPercent}%`, height: '100%', background: 'var(--accent-base)' }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
    <Navigation />
    </>
  );
};
