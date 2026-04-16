import { useState, useRef, useEffect } from 'react';
import { useAuthStore, getPrestigeRank } from '../store/useAuthStore';
import { Navigation } from '../components/Navigation';
import { Swords, Shield, Heart, Target, Search, ChevronDown, ChevronUp, Zap } from 'lucide-react';

interface CombatStats {
  name: string;
  hp: number;
  maxHp: number;
  armor: number;
  damage: number;
  energy: number;
  maxEnergy: number;
  dodge: number;
  crit: number;
  totalLvl: number;
}

const getEquippedBoost = (equipped: any, stat: string) => {
  if (!equipped) return 0;
  let sum = 0;
  ['weapon', 'armor', 'accessory'].forEach(slot => {
    const item = equipped[slot as 'weapon'|'armor'|'accessory'];
    if (item && item.statBoost.stat === stat) sum += item.statBoost.value;
  });
  return sum;
};

const calculateStatsFromSum = (name: string, totalSum: number): CombatStats => {
   const avg = Math.max(1, Math.round(totalSum / 6));
   
   const maxHp = 100 + (avg * 10);
   const maxEnergy = 50 + (avg * 5);

   return {
     name,
     maxHp,
     hp: maxHp,
     maxEnergy,
     energy: maxEnergy,
     damage: 10 + (avg * 2),
     dodge: Math.min(60, avg * 0.5),
     crit: Math.min(60, avg * 0.5),
     armor: avg * 1,
     totalLvl: totalSum
   };
};

const calculateStats = (name: string, level: number, muscleStats?: any, equipped?: any): CombatStats => {
  const coreLvl = muscleStats ? muscleStats['Core']?.level || 1 : level;
  const armsLvl = muscleStats ? muscleStats['Arms']?.level || 1 : level;
  const legsLvl = muscleStats ? muscleStats['Legs']?.level || 1 : level;
  const chestLvl = muscleStats ? muscleStats['Chest']?.level || 1 : level;
  const shouldersLvl = muscleStats ? muscleStats['Shoulders']?.level || 1 : level;
  const backLvl = muscleStats ? muscleStats['Back']?.level || 1 : level;

  const totalSum = coreLvl + armsLvl + legsLvl + chestLvl + shouldersLvl + backLvl;

  const bHp = getEquippedBoost(equipped, 'HP');
  const bDmg = getEquippedBoost(equipped, 'Damage');
  const bArmor = getEquippedBoost(equipped, 'Armor');
  const bDodge = getEquippedBoost(equipped, 'Dodge');
  const bCrit = getEquippedBoost(equipped, 'Crit');
  const bEnergy = getEquippedBoost(equipped, 'Energy');

  const maxHp = 100 + (coreLvl * 10) + bHp;
  const maxEnergy = 50 + (backLvl * 5) + bEnergy;

  return {
    name,
    maxHp,
    hp: maxHp,
    maxEnergy,
    energy: maxEnergy,
    damage: 10 + (armsLvl * 2) + bDmg,
    dodge: Math.min(60, (legsLvl * 0.5) + bDodge), 
    crit: Math.min(60, (shouldersLvl * 0.5) + bCrit), 
    armor: (chestLvl * 1) + bArmor,
    totalLvl: totalSum
  };
};

interface CombatLogEntry {
  msg: string;
  newPlayerHp: number;
  newEnemyHp: number;
  attackerName: string;
  isEnd: boolean;
  won?: boolean;
  dmgType?: 'dodge' | 'crit' | 'normal';
  finalDmg?: number;
}

interface FloatingText {
  id: number;
  text: string;
  color: string;
}

const NICKNAMES = ["Cyber", "Shadow", "Iron", "Neon", "Void", "Titan", "Rogue", "Ghost", "Viper", "Ronin"];
const NOUNS = ["Breaker", "Striker", "Wolf", "Hunter", "Crawler", "Reaper", "Gladiator", "Phreak"];

export const Arena = () => {
  const user = useAuthStore(state => state.user);
  const addPrestige = useAuthStore(state => state.addPrestige);
  const addCoins = useAuthStore(state => state.addCoins);
  const useArenaFight = useAuthStore(state => state.useArenaFight);

  const [opponents, setOpponents] = useState<CombatStats[]>([]);
  const [selectedEnemy, setSelectedEnemy] = useState<CombatStats | null>(null);
  
  const [player, setPlayer] = useState<CombatStats | null>(null);
  const [enemy, setEnemy] = useState<CombatStats | null>(null);
  
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [isFighting, setIsFighting] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [lastRewards, setLastRewards] = useState({ gold: 0, prestige: 0, won: false });
  
  const [logQueue, setLogQueue] = useState<CombatLogEntry[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [attackerAnim, setAttackerAnim] = useState<string>('');
  const [defenderAnim, setDefenderAnim] = useState<string>('');

  const [floatsP, setFloatsP] = useState<FloatingText[]>([]);
  const [floatsE, setFloatsE] = useState<FloatingText[]>([]);

  useEffect(() => {
    if (scrollRef.current && showLog) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [combatLog, showLog]);

  useEffect(() => {
    if (logQueue.length > 0 && isFighting) {
      const timer = setTimeout(() => {
        const entry = logQueue[0];
        setLogQueue(q => q.slice(1));
        
        setPlayer(p => p ? { ...p, hp: entry.newPlayerHp } : p);
        setEnemy(e => e ? { ...e, hp: entry.newEnemyHp } : e);
        setCombatLog(prev => [...prev, entry.msg]);

        // Animations based on hit type
        if (entry.attackerName) {
           if (entry.attackerName === player?.name) setAttackerAnim('playerAnimHit');
           else setAttackerAnim('enemyAnimHit');
        }

        const floatId = Date.now();
        if (entry.dmgType === 'crit' || entry.dmgType === 'normal') {
             const defIsPlayer = entry.attackerName === enemy?.name;
             const color = entry.dmgType === 'crit' ? '#fbbf24' : '#ef4444';
             const prefix = entry.dmgType === 'crit' ? 'KRYT -' : '-';
             const text = `${prefix}${entry.finalDmg}`;

             if (defIsPlayer) {
                 setDefenderAnim(entry.dmgType === 'crit' ? 'shake-p' : '');
                 setFloatsP(prev => [...prev, { id: floatId, text, color }]);
             } else {
                 setDefenderAnim(entry.dmgType === 'crit' ? 'shake-e' : '');
                 setFloatsE(prev => [...prev, { id: floatId, text, color }]);
             }
        } 
        else if (entry.dmgType === 'dodge') {
             const defIsPlayer = entry.attackerName === enemy?.name;
             if (defIsPlayer) {
                 setDefenderAnim('ghost-p');
                 setFloatsP(prev => [...prev, { id: floatId, text: 'UNIK', color: 'white' }]);
             } else {
                 setDefenderAnim('ghost-e');
                 setFloatsE(prev => [...prev, { id: floatId, text: 'UNIK', color: 'white' }]);
             }
        }

        setTimeout(() => {
           setAttackerAnim('');
           setDefenderAnim('');
        }, 400);

        setTimeout(() => {
           setFloatsP(prev => prev.filter(f => f.id !== floatId));
           setFloatsE(prev => prev.filter(f => f.id !== floatId));
        }, 1000);

        if (entry.isEnd) {
          setIsFighting(false);
          setIsGameOver(true);
          setShowLog(true);
          let pGain = 0;
          let cGain = 0;
          if (entry.won && enemy) {
             pGain = Math.floor(enemy.totalLvl / 2) + 10;
             cGain = Math.floor(enemy.totalLvl * 1.5) + 20;
             addPrestige(pGain);
             addCoins(cGain);
             setCombatLog(prev => [...prev, `[NAGRODA] +${pGain} Prestiżu, +${cGain} Złota.`]);
          }
          setLastRewards({ gold: cGain, prestige: pGain, won: !!entry.won });
        }
      }, 700); 
      
      return () => clearTimeout(timer);
    }
  }, [logQueue, isFighting, player?.name, enemy?.name, enemy, addPrestige, addCoins]);

  if (!user) return null;

  const playerBaseTotalSum = Object.values(user.muscleStats).reduce((acc, curr) => acc + curr.level, 0);

  const myLeague = getPrestigeRank(user.prestige || 0);

  const today = new Date().toLocaleDateString();
  let currentFightsLeft = user.arenaFightsLeft ?? 5;
  if (user.lastArenaReset && user.lastArenaReset !== today) {
     currentFightsLeft = 5;
  }

  const findOpponents = () => {
    let ops: CombatStats[] = [];
    for(let i=0; i<3; i++) {
       let variance = (Math.random() * 0.3) - 0.15; 
       let eSum = Math.max(6, Math.round(playerBaseTotalSum * (1 + variance)));
       let rName = `${NICKNAMES[Math.floor(Math.random()*NICKNAMES.length)]} ${NOUNS[Math.floor(Math.random()*NOUNS.length)]}`;
       ops.push(calculateStatsFromSum(rName, eSum));
    }
    setOpponents(ops);
    setSelectedEnemy(null);
  };

  const generateEncounterLog = (pStats: CombatStats, eStats: CombatStats): CombatLogEntry[] => {
    let pHP = pStats.hp;
    let eHP = eStats.hp;
    let logs: CombatLogEntry[] = [];

    let pTurn = pStats.energy >= eStats.energy;

    logs.push({ 
       msg: `Start walki. Inicjatywę przejmuje ${pTurn ? pStats.name : eStats.name} (Więcej Energii).`, 
       newPlayerHp: pHP, newEnemyHp: eHP, attackerName: '', isEnd: false 
    });
    
    let turns = 0;
    while(pHP > 0 && eHP > 0 && turns < 200) {
      turns++;

      let attacker = pTurn ? pStats : eStats;
      let defender = pTurn ? eStats : pStats;

      let isDodge = Math.random() * 100 < defender.dodge;
      if (isDodge) {
         logs.push({ 
            msg: `${attacker.name} atakuje! ${defender.name} wymanewrował cios (Zwinność).`, 
            newPlayerHp: pHP, newEnemyHp: eHP, attackerName: attacker.name, isEnd: false, dmgType: 'dodge' 
         });
      } else {
         let isCrit = Math.random() * 100 < attacker.crit;
         let rawDmg = attacker.damage * (isCrit ? 2 : 1) * (0.8 + Math.random() * 0.4); 
         let finalDmg = Math.max(1, Math.round(rawDmg - defender.armor));
         
         if (pTurn) eHP = Math.max(0, eHP - finalDmg);
         else pHP = Math.max(0, pHP - finalDmg);

         let critStr = isCrit ? `[KRYTYCZNIE]` : ``;
         
         logs.push({ 
             msg: `${attacker.name} ${critStr} trafia. Pancerz obmywa się krwią, zadano ${finalDmg} DMG.`, 
             newPlayerHp: pHP, newEnemyHp: eHP, attackerName: attacker.name, isEnd: false, dmgType: isCrit ? 'crit' : 'normal', finalDmg 
         });
      }

      if (pHP <= 0 || eHP <= 0) break;
      pTurn = !pTurn;
    }

    if (pHP > 0) logs.push({ msg: `Zwyciężył ${pStats.name}!`, newPlayerHp: pHP, newEnemyHp: eHP, attackerName: '', isEnd: true, won: true });
    else logs.push({ msg: `Przegrana. ${eStats.name} wygrywa wyzwanie.`, newPlayerHp: pHP, newEnemyHp: eHP, attackerName: '', isEnd: true, won: false });

    return logs;
  };

  const handleStartFight = () => {
    if (!selectedEnemy) return;
    
    if (!useArenaFight()) {
       alert("Osiągnięto limit walk na dzisiaj! Wróć jutro.");
       return;
    }

    const pStart = calculateStats(user.username, user.level, user.muscleStats, user.equipped);
    const eStart = selectedEnemy; 

    setPlayer(pStart);
    setEnemy(eStart);
    
    const simLog = generateEncounterLog(pStart, eStart);
    setLogQueue(simLog);
    setCombatLog([`Walka nawiązana.`]);
    setShowLog(false);
    setIsFighting(true);
    setIsGameOver(false);
  };

  const getPercentage = (val: number, max: number) => Math.max(0, Math.min(100, (val / max) * 100));

  const pAnimClass = attackerAnim === 'playerAnimHit' ? 'scale(1.05) translateX(15px)' : 'none';
  const eAnimClass = attackerAnim === 'enemyAnimHit' ? 'scale(1.05) translateX(-15px)' : 'none';

  return (
    <>
    <div className="animate-fade-in container" style={{ paddingTop: '24px', paddingBottom: '100px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <header style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h1 className="text-gradient" style={{ fontSize: '32px', marginBottom: '8px' }}>Arena Walki</h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: myLeague.color, fontWeight: 'bold' }}>{myLeague.name}</span>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Prestiż: {user.prestige || 0}</span>
            <span style={{ fontSize: '14px', color: currentFightsLeft > 0 ? '#34d399' : '#ef4444', fontWeight: 'bold' }}>
               Walki: {currentFightsLeft}/5
            </span>
        </div>
      </header>

      {!player || !enemy ? (
        <section className="glass-panel" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <Search size={40} color={myLeague.color} style={{ margin: '0 auto', opacity: 0.8 }} />
            <h3 style={{ marginTop: '12px' }}>Terminal Matchmakingu</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Algorytm wyszuka lustrzanych wojowników w pobliżu Twojego poziomu statystyk.</p>
          </div>

          {opponents.length === 0 ? (
             <button className="btn btn-primary" onClick={findOpponents} style={{ width: '100%', padding: '16px' }}>
                Szukaj Przeciwnika
             </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               {opponents.map((opp, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedEnemy(opp)}
                    style={{
                       padding: '12px', borderRadius: '8px', cursor: 'pointer',
                       border: selectedEnemy === opp ? `2px solid var(--accent-base)` : '1px solid var(--border-color)',
                       background: selectedEnemy === opp ? 'rgba(139,92,246,0.1)' : 'var(--surface-hover)',
                       display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                     <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{opp.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Moc (Statystyki): {opp.totalLvl}</div>
                     </div>
                     <div style={{ color: '#ef4444', fontWeight: 'bold' }}><Heart size={14} style={{display:'inline', verticalAlign:'middle'}}/> {opp.hp}</div>
                  </div>
               ))}
               <button 
                 className="btn btn-primary" 
                 disabled={!selectedEnemy || currentFightsLeft <= 0}
                 onClick={handleStartFight}
                 style={{ width: '100%', padding: '16px', marginTop: '16px' }}
               >
                 <Swords size={20} /> {currentFightsLeft > 0 ? 'INICJUJ STARCIE' : 'BRAK BILETÓW'}
               </button>
               <button className="btn btn-secondary" onClick={findOpponents} style={{ width: '100%' }}>Restartuj Skan</button>
            </div>
          )}
        </section>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            
            {/* Player Profile */}
            <div className={`glass-panel ${defenderAnim === 'shake-p' ? 'animate-shake' : ''} ${defenderAnim === 'ghost-p' ? 'animate-ghost' : ''}`} 
                 style={{ padding: '12px', border: '1px solid var(--accent-base)', transform: pAnimClass, transition: '0.1s transform', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                 <div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{player.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Moc: {player.totalLvl}</div>
                 </div>
              </div>
              
              {floatsP.map(f => <div key={f.id} className="animate-float-up" style={{ color: f.color, right: '-10px', top: '10px' }}>{f.text}</div>)}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                <Heart size={12} color="#ef4444" />
                <div style={{ width: '100%', height: '8px', background: 'var(--surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${getPercentage(player.hp, player.maxHp)}%`, height: '100%', background: '#ef4444', transition: '0.2s' }} />
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <Zap size={12} color="#fbbf24" />
                <div style={{ width: '100%', height: '4px', background: 'var(--surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${getPercentage(player.energy, player.maxEnergy)}%`, height: '100%', background: '#fbbf24', transition: '0.2s' }} />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px', fontSize: '9px', color: 'var(--text-muted)'}}>
                 <span><Swords size={10}/> {player.damage}</span>
                 <span><Shield size={10}/> {player.armor}</span>
                 <span><Target size={10}/> {Math.round(player.crit)}%</span>
              </div>
            </div>

            {/* Enemy Profile */}
            <div className={`glass-panel ${defenderAnim === 'shake-e' ? 'animate-shake' : ''} ${defenderAnim === 'ghost-e' ? 'animate-ghost' : ''}`} 
                 style={{ padding: '12px', border: '1px solid var(--border-color)', transform: eAnimClass, transition: '0.1s transform', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexDirection: 'row-reverse' }}>
                 <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{enemy.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Moc: {enemy.totalLvl}</div>
                 </div>
              </div>

              {floatsE.map(f => <div key={f.id} className="animate-float-up" style={{ color: f.color, left: '-10px', top: '10px' }}>{f.text}</div>)}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                <div style={{ width: '100%', height: '8px', background: 'var(--surface-hover)', borderRadius: '4px', overflow: 'hidden', transform: 'scaleX(-1)' }}>
                    <div style={{ width: `${getPercentage(enemy.hp, enemy.maxHp)}%`, height: '100%', background: '#ef4444', transition: '0.2s' }} />
                </div>
                <Heart size={12} color="#ef4444" />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <div style={{ width: '100%', height: '4px', background: 'var(--surface-hover)', borderRadius: '4px', overflow: 'hidden', transform: 'scaleX(-1)' }}>
                    <div style={{ width: `${getPercentage(enemy.energy, enemy.maxEnergy)}%`, height: '100%', background: '#fbbf24', transition: '0.2s' }} />
                </div>
                <Zap size={12} color="#fbbf24" />
              </div>
              
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px', fontSize: '9px', color: 'var(--text-muted)', justifyContent: 'flex-end'}}>
                 <span><Target size={10}/> {Math.round(enemy.crit)}%</span>
                 <span><Shield size={10}/> {enemy.armor}</span>
                 <span><Swords size={10}/> {enemy.damage}</span>
              </div>
            </div>

          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowLog(!showLog)}
              style={{ padding: '8px 16px', fontSize: '14px', borderRadius: showLog ? '12px 12px 0 0' : '12px', borderBottom: showLog ? 'none' : '' }}
            >
              {showLog ? <ChevronUp size={16}/> : <ChevronDown size={16}/>} 
              {showLog ? 'Schowaj Dziennik Walki' : 'Pokaż Dziennik Walki'}
            </button>
            {showLog && (
               <div 
                 ref={scrollRef}
                 className="glass-panel" 
                 style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', borderRadius: '0 0 12px 12px', borderTop: 'none' }}
               >
                 {combatLog.map((log, i) => (
                   <div key={i} style={{ 
                      fontSize: '12px', lineHeight: '1.4', padding: '4px',
                      color: log.includes('Zwyciążył') ? '#4ade80' : log.includes('KRYT') ? '#fbbf24' : 'var(--text-secondary)',
                      background: 'rgba(0,0,0,0.1)', borderRadius: '4px'
                   }}>
                     {log}
                   </div>
                 ))}
               </div>
            )}
          </div>

          {isGameOver && (
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', marginTop: '16px', border: lastRewards.won ? '2px solid #fbbf24' : '2px solid #ef4444' }}>
                <h2 style={{ fontSize: '24px', marginBottom: '8px', color: lastRewards.won ? '#fbbf24' : '#ef4444' }}>
                   {lastRewards.won ? 'ZWYCIĘSTWO!' : 'PORAŻKA'}
                </h2>
                {lastRewards.won ? (
                   <>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>Zgarniasz łupy wojenne i chwałę na Arenie.</p>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '24px' }}>
                          <div style={{ textAlign: 'center' }}>
                             <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fbbf24' }}>+{lastRewards.gold}</div>
                             <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ZŁOTO</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                             <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#a855f7' }}>+{lastRewards.prestige}</div>
                             <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>PRESTIŻ</div>
                          </div>
                      </div>
                   </>
                ) : (
                   <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Tym razem przeciwnik okazał się silniejszy. Wróć po treningu!</p>
                )}
                
                <button className="btn btn-primary" onClick={() => setPlayer(null)} style={{ width: '100%', padding: '16px', fontSize: '16px' }}>
                  WRÓĆ DO LOBBY
                </button>
            </div>
          )}

        </div>
      )}
      
    </div>
    <Navigation />
    </>
  );
};
