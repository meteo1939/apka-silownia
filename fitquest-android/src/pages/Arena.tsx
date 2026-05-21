import { useState, useRef, useEffect } from 'react';
import { useAuthStore, getPrestigeRank } from '../store/useAuthStore';
import { Navigation } from '../components/Navigation';
import { Swords, Heart, Search, Zap, Flame, Trophy, Cpu, Eye, Coins } from 'lucide-react';

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
  difficulty?: 'weaker' | 'balanced' | 'stronger';
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
  dmgType?: 'dodge' | 'crit' | 'normal' | 'block';
  finalDmg?: number;
}

interface FloatingText {
  id: number;
  text: string;
  color: string;
}

const NICKNAMES = ["Cyber", "Shadow", "Wściekły", "Mroczny", "Płonący", "Tytanowy", "Bezlitosny", "Dziki", "Zardzewiały", "Neonowy"];
const NOUNS = ["Łamacz", "Uderzacz", "Wilk", "Łowca", "Gladiator", "Grom", "Buntownik", "Drań", "Rycerz", "Żniwiarz"];

const ATTACK_ACTIONS = [
  "wyprowadza potężne uderzenie z góry",
  "błyskawicznie kontratakuje od dołu",
  "wykonuje szybkie pchnięcie w odsłonięty bok",
  "próbuje przełamać pancerz potężnym cięciem",
  "skacze w kierunku rywala z wzniesioną bronią",
  "wykonuje szybką kombinację ciosów",
  "uderza z pełnym impetem i wściekłością"
];

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
  const [showLog, setShowLog] = useState(true);
  const [isFighting, setIsFighting] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [lastRewards, setLastRewards] = useState({ gold: 0, prestige: 0, won: false });
  
  const [logQueue, setLogQueue] = useState<CombatLogEntry[]>([]);

  // Soundless Matchmaking radar search simulation state
  const [isSearching, setIsSearching] = useState(false);
  const [searchLogs, setSearchLogs] = useState<string[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [attackerAnim, setAttackerAnim] = useState<string>('');
  const [defenderAnim, setDefenderAnim] = useState<string>('');
  const [critFlash, setCritFlash] = useState(false);
  const [lastHitEffect, setLastHitEffect] = useState<'slash-1' | 'slash-2' | 'dodge-wave' | 'block-shield' | null>(null);

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

        // Trigger animations and hit effects
        if (entry.attackerName) {
           if (entry.attackerName === player?.name) {
             setAttackerAnim('playerLunge');
           } else {
             setAttackerAnim('enemyLunge');
           }
        }

        const floatId = Date.now();
        if (entry.dmgType === 'crit' || entry.dmgType === 'normal') {
             const defIsPlayer = entry.attackerName === enemy?.name;
             const color = entry.dmgType === 'crit' ? '#fbbf24' : '#ef4444';
             const prefix = entry.dmgType === 'crit' ? 'KRYT! -' : '-';
             const text = `${prefix}${entry.finalDmg} HP`;

             // Randomize slash effect graphic
             setLastHitEffect(Math.random() > 0.5 ? 'slash-1' : 'slash-2');

             if (entry.dmgType === 'crit') {
               setCritFlash(true);
               setTimeout(() => setCritFlash(false), 200);
             }

             if (defIsPlayer) {
                 setDefenderAnim('shake-p');
                 setFloatsP(prev => [...prev, { id: floatId, text, color }]);
             } else {
                 setDefenderAnim('shake-e');
                 setFloatsE(prev => [...prev, { id: floatId, text, color }]);
             }
        } 
        else if (entry.dmgType === 'dodge') {
             const defIsPlayer = entry.attackerName === enemy?.name;
             setLastHitEffect('dodge-wave');
             if (defIsPlayer) {
                 setDefenderAnim('ghost-p');
                 setFloatsP(prev => [...prev, { id: floatId, text: '💨 UNIK!', color: '#38bdf8' }]);
             } else {
                 setDefenderAnim('ghost-e');
                 setFloatsE(prev => [...prev, { id: floatId, text: '💨 UNIK!', color: '#38bdf8' }]);
             }
        }
        else if (entry.dmgType === 'block') {
             const defIsPlayer = entry.attackerName === enemy?.name;
             setLastHitEffect('block-shield');
             if (defIsPlayer) {
                 setDefenderAnim('block-p');
                 setFloatsP(prev => [...prev, { id: floatId, text: '🛡 BLOK!', color: '#a3e635' }]);
             } else {
                 setDefenderAnim('block-e');
                 setFloatsE(prev => [...prev, { id: floatId, text: '🛡 BLOK!', color: '#a3e635' }]);
             }
        }

        // Clean up animations and slash graphics
        setTimeout(() => {
           setAttackerAnim('');
           setDefenderAnim('');
           setLastHitEffect(null);
        }, 350);

        setTimeout(() => {
           setFloatsP(prev => prev.filter(f => f.id !== floatId));
           setFloatsE(prev => prev.filter(f => f.id !== floatId));
        }, 900);

        if (entry.isEnd) {
          setIsFighting(false);
          setIsGameOver(true);
          let pGain = 0;
          let cGain = 0;
          if (entry.won && enemy) {
             let basePrestige = Math.floor(enemy.totalLvl / 2) + 10;
             let baseCoins = Math.floor(enemy.totalLvl * 1.5) + 20;

             let multiplier = 1.0;
             if (enemy.difficulty === 'weaker') multiplier = 0.5;
             else if (enemy.difficulty === 'stronger') multiplier = 1.6;

             pGain = Math.round(basePrestige * multiplier);
             cGain = Math.round(baseCoins * multiplier);

             addPrestige(pGain);
             addCoins(cGain);
             setCombatLog(prev => [...prev, `🏆 NAGRODA: Zyskujesz +${pGain} Prestiżu, +${cGain} Złota.`]);
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
    setIsSearching(true);
    setSearchLogs(["📡 Nawiązywanie połączenia z radarami Areny...", "🛡️ Skanowanie sygnatur gladiatorów w pobliżu poziomu mocy: " + playerBaseTotalSum]);
    
    setTimeout(() => {
      setSearchLogs(prev => [...prev, "🛰️ Zlokalizowano pasujących wojowników w sektorze południowym."]);
    }, 600);
    
    setTimeout(() => {
      setSearchLogs(prev => [...prev, "⚔️ Trzy sygnatury bojowe pobrane. Generowanie kart pretendentów..."]);
    }, 1300);

    setTimeout(() => {
      let ops: CombatStats[] = [];
      
      // 2 Weaker (Słaby)
      for(let i=0; i<2; i++) {
         let variance = -0.25 + (Math.random() * 0.1); 
         let eSum = Math.max(6, Math.round(playerBaseTotalSum * (1 + variance)));
         let rName = `${NICKNAMES[Math.floor(Math.random()*NICKNAMES.length)]} ${NOUNS[Math.floor(Math.random()*NOUNS.length)]}`;
         const stat = calculateStatsFromSum(rName, eSum);
         stat.difficulty = 'weaker';
         ops.push(stat);
      }
      
      // 2 Balanced (Równy)
      for(let i=0; i<2; i++) {
         let variance = -0.05 + (Math.random() * 0.1); 
         let eSum = Math.max(6, Math.round(playerBaseTotalSum * (1 + variance)));
         let rName = `${NICKNAMES[Math.floor(Math.random()*NICKNAMES.length)]} ${NOUNS[Math.floor(Math.random()*NOUNS.length)]}`;
         const stat = calculateStatsFromSum(rName, eSum);
         stat.difficulty = 'balanced';
         ops.push(stat);
      }
      
      // 2 Stronger (Silny)
      for(let i=0; i<2; i++) {
         let variance = 0.15 + (Math.random() * 0.15); 
         let eSum = Math.max(6, Math.round(playerBaseTotalSum * (1 + variance)));
         let rName = `${NICKNAMES[Math.floor(Math.random()*NICKNAMES.length)]} ${NOUNS[Math.floor(Math.random()*NOUNS.length)]}`;
         const stat = calculateStatsFromSum(rName, eSum);
         stat.difficulty = 'stronger';
         ops.push(stat);
      }

      setOpponents(ops);
      setSelectedEnemy(null);
      setIsSearching(false);
    }, 2000);
  };

  const generateEncounterLog = (pStats: CombatStats, eStats: CombatStats): CombatLogEntry[] => {
    let pHP = pStats.hp;
    let eHP = eStats.hp;
    let logs: CombatLogEntry[] = [];

    let pTurn = pStats.energy >= eStats.energy;

    logs.push({ 
       msg: `⚔️ Rozpoczęcie pojedynku! Sędzia daje znak. Inicjatywę przejmuje ${pTurn ? pStats.name : eStats.name} (${pTurn ? 'Szybszy refleks' : 'Zaskoczenie'}).`, 
       newPlayerHp: pHP, newEnemyHp: eHP, attackerName: '', isEnd: false 
     });
    
    let turns = 0;
    while(pHP > 0 && eHP > 0 && turns < 100) {
      turns++;

      let attacker = pTurn ? pStats : eStats;
      let defender = pTurn ? eStats : pStats;
      let action = ATTACK_ACTIONS[Math.floor(Math.random() * ATTACK_ACTIONS.length)];

      let isDodge = Math.random() * 100 < defender.dodge;
      if (isDodge) {
         logs.push({ 
            msg: `💨 ${attacker.name} ${action}, ale ${defender.name} wymanewrował cios sprytnym unikiem!`, 
            newPlayerHp: pHP, newEnemyHp: eHP, attackerName: attacker.name, isEnd: false, dmgType: 'dodge' 
         });
      } else {
         // Block chance based on armor (~15% base + armor bonus)
         let isBlock = Math.random() * 100 < Math.min(40, (defender.armor * 1.2) + 8);
         let isCrit = !isBlock && Math.random() * 100 < attacker.crit;
         let rawDmg = attacker.damage * (isCrit ? 2.2 : 1) * (0.85 + Math.random() * 0.3);
         let blockedPct = isBlock ? 0.72 : 0;
         let finalDmg = Math.max(1, Math.round(rawDmg * (1 - blockedPct) - (defender.armor * 0.4)));
         
         if (pTurn) eHP = Math.max(0, eHP - finalDmg);
         else pHP = Math.max(0, pHP - finalDmg);

         if (isBlock) {
           logs.push({ 
               msg: `🛡 ${defender.name} blokuje tarczą cios ${attacker.name}a! Pochłonięto większość energii (${finalDmg} przenikło).`, 
               newPlayerHp: pHP, newEnemyHp: eHP, attackerName: attacker.name, isEnd: false, dmgType: 'block', finalDmg 
           });
         } else {
           let critStr = isCrit ? `🔥 KRYTYCZNIE!` : `💥`;
           logs.push({ 
               msg: `${critStr} ${attacker.name} ${action} i zadaje ${finalDmg} obrażeń dla ${defender.name}!`, 
               newPlayerHp: pHP, newEnemyHp: eHP, attackerName: attacker.name, isEnd: false, dmgType: isCrit ? 'crit' : 'normal', finalDmg 
           });
         }
      }

      if (pHP <= 0 || eHP <= 0) break;
      pTurn = !pTurn;
    }

    if (pHP > 0) {
      logs.push({ msg: `👑 ZWYCIĘSTWO! ${pStats.name} pokonuje rywala i triumfuje na arenie!`, newPlayerHp: pHP, newEnemyHp: eHP, attackerName: '', isEnd: true, won: true });
    } else {
      logs.push({ msg: `💀 PORAŻKA. ${eStats.name} powala Cię na ziemię jednym mocnym uderzeniem.`, newPlayerHp: pHP, newEnemyHp: eHP, attackerName: '', isEnd: true, won: false });
    }

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
    setCombatLog([`🗡️ Wkraczasz na piasek Koloseum...`]);
    setIsFighting(true);
    setIsGameOver(false);
  };

  const getPercentage = (val: number, max: number) => Math.max(0, Math.min(100, (val / max) * 100));

  // Determine physics style coordinates for dynamic avatar positions
  let playerStyle: React.CSSProperties = {};
  let enemyStyle: React.CSSProperties = {};

  if (attackerAnim === 'playerLunge') {
    playerStyle = { transform: 'translateX(50px) translateY(10px) rotate(10deg)', zIndex: 10 };
  } else if (defenderAnim === 'shake-p') {
    playerStyle = { animation: 'arena-shake 0.3s' };
  } else if (defenderAnim === 'ghost-p') {
    playerStyle = { opacity: 0.4, transform: 'translateX(-20px) scale(0.95)', transition: 'transform 0.15s, opacity 0.15s' };
  } else if (defenderAnim === 'block-p') {
    playerStyle = { animation: 'arena-block 0.35s forwards' };
  }

  if (attackerAnim === 'enemyLunge') {
    enemyStyle = { transform: 'translateX(-50px) translateY(10px) rotate(-10deg)', zIndex: 10 };
  } else if (defenderAnim === 'shake-e') {
    enemyStyle = { animation: 'arena-shake 0.3s' };
  } else if (defenderAnim === 'ghost-e') {
    enemyStyle = { opacity: 0.4, transform: 'translateX(20px) scale(0.95)', transition: 'transform 0.15s, opacity 0.15s' };
  } else if (defenderAnim === 'block-e') {
    enemyStyle = { animation: 'arena-block-enemy 0.35s forwards' };
  }

  return (
    <>
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes spin-radar {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes sweep-radar {
        0% { transform: scale(0.95); opacity: 0.2; }
        50% { transform: scale(1.05); opacity: 0.6; }
        100% { transform: scale(0.95); opacity: 0.2; }
      }
      @keyframes slash-1-anim {
        0% { transform: translate(-50%, -50%) rotate(45deg) scaleX(0); opacity: 0; }
        30% { opacity: 1; scaleX(1); }
        100% { transform: translate(-50%, -50%) rotate(45deg) scaleX(1.2); opacity: 0; }
      }
      @keyframes slash-2-anim {
        0% { transform: translate(-50%, -50%) rotate(-45deg) scaleX(0); opacity: 0; }
        30% { opacity: 1; scaleX(1); }
        100% { transform: translate(-50%, -50%) rotate(-45deg) scaleX(1.2); opacity: 0; }
      }
      @keyframes dodge-wave-anim {
        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; border-width: 8px; }
        50% { opacity: 0.8; }
        100% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; border-width: 1px; }
      }
      @keyframes arena-shake {
        0% { transform: translate(0, 0); }
        10% { transform: translate(-6px, -4px) rotate(-1deg); }
        30% { transform: translate(6px, 4px) rotate(1deg); }
        50% { transform: translate(-4px, 4px) rotate(-1deg); }
        70% { transform: translate(4px, -2px) rotate(0deg); }
        90% { transform: translate(-2px, 2px) rotate(0deg); }
        100% { transform: translate(0, 0); }
      }
      @keyframes arena-block {
        0%   { transform: translateX(0) scale(1); filter: brightness(1); }
        20%  { transform: translateX(-10px) scale(1.08); filter: brightness(2) drop-shadow(0 0 12px #a3e635); }
        55%  { transform: translateX(-6px) scale(1.04); filter: brightness(1.5) drop-shadow(0 0 8px #a3e635); }
        100% { transform: translateX(0) scale(1); filter: brightness(1); }
      }
      @keyframes arena-block-enemy {
        0%   { transform: translateX(0) scale(1); filter: brightness(1); }
        20%  { transform: translateX(10px) scale(1.08); filter: brightness(2) drop-shadow(0 0 12px #a3e635); }
        55%  { transform: translateX(6px) scale(1.04); filter: brightness(1.5) drop-shadow(0 0 8px #a3e635); }
        100% { transform: translateX(0) scale(1); filter: brightness(1); }
      }
      @keyframes block-shield-anim {
        0%   { transform: translate(-50%, -50%) scale(0.3) rotate(-15deg); opacity: 0; }
        25%  { transform: translate(-50%, -50%) scale(1.2) rotate(5deg);  opacity: 1; }
        60%  { transform: translate(-50%, -50%) scale(1.0) rotate(0deg);  opacity: 0.9; }
        100% { transform: translate(-50%, -50%) scale(1.4) rotate(0deg);  opacity: 0; }
      }
      .crit-flash-overlay {
        position: fixed;
        inset: 0;
        background: rgba(255, 255, 255, 0.45);
        z-index: 100;
        pointer-events: none;
        transition: opacity 0.2s ease-out;
      }
    `}} />

    {critFlash && <div className="crit-flash-overlay" />}

    <div className="animate-fade-in container" style={{ paddingTop: '24px', paddingBottom: '100px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <header style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h1 className="text-gradient" style={{ fontSize: '28px', marginBottom: '6px' }}>Arena Gladiatorów</h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: myLeague.color, fontWeight: 'bold', border: `1px solid ${myLeague.color}33` }}>
              👑 {myLeague.name}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Prestiż: {user.prestige || 0}</span>
            <span style={{ fontSize: '13px', color: currentFightsLeft > 0 ? '#34d399' : '#ef4444', fontWeight: 'bold' }}>
               Walki: {currentFightsLeft}/5
            </span>
        </div>
      </header>

      {/* LOBBY / SEARCH SCREEN */}
      {!player || !enemy ? (
        <section className="glass-panel" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden' }}>
          
          {/* Neon cage background decorations */}
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px', borderRadius: '50%', border: '2px dashed var(--border-color)', opacity: 0.1, pointerEvents: 'none' }} />
          
          {/* SEARCHING RADAR ANIMATION */}
          {isSearching ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 10px', flex: 1 }}>
              <div style={{ 
                position: 'relative', 
                width: '160px', 
                height: '160px', 
                borderRadius: '50%', 
                border: '3px solid rgba(249,115,22,0.15)',
                boxShadow: '0 0 30px rgba(249,115,22,0.1)',
                marginBottom: '30px',
                animation: 'sweep-radar 2s infinite ease-in-out',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {/* Rotating scanner beam */}
                <div style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  borderRadius: '50%',
                  background: 'conic-gradient(from 0deg, var(--accent-base) 0deg, transparent 90deg, transparent 360deg)',
                  opacity: 0.25,
                  animation: 'spin-radar 1.5s infinite linear' 
                }} />
                
                {/* Center target crosshair */}
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px dashed var(--accent-base)', display: 'flex', alignItems: 'center', justifyItems: 'center', color: 'var(--accent-base)' }}>
                  <Cpu size={20} style={{ margin: 'auto', animation: 'pulse 1s infinite' }} />
                </div>
                
                {/* Fake discovered blip nodes */}
                <div style={{ position: 'absolute', top: '25%', left: '30%', width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 10px #34d399' }} />
                <div style={{ position: 'absolute', bottom: '30%', right: '25%', width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 10px #f59e0b' }} />
              </div>
              
              <h4 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Wyszukiwanie Przeciwników...</h4>
              <div style={{ 
                width: '100%', 
                background: 'rgba(0,0,0,0.3)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '8px', 
                padding: '12px', 
                fontFamily: 'monospace', 
                fontSize: '11px', 
                color: 'var(--accent-base)', 
                textAlign: 'left',
                height: '150px',
                overflowY: 'auto',
                scrollBehavior: 'smooth'
              }}>
                {searchLogs.map((logMsg, lIdx) => (
                  <div key={lIdx} style={{ marginBottom: '4px' }}>&gt; {logMsg}</div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {opponents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 10px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Search size={44} color={myLeague.color} style={{ margin: '0 auto 16px', opacity: 0.8 }} />
                  <h3 style={{ fontSize: '19px', marginBottom: '8px' }}>Gotowy na starcie?</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', maxWidth: '320px', margin: '0 auto 24px' }}>
                    Skaner matchmakingu dobierze sześciu gladiatorów o poziomach dopasowanych do Twojej łącznej siły fizycznej.
                  </p>
                  <button className="btn btn-primary" onClick={findOpponents} style={{ width: '100%', padding: '16px', fontSize: '17px', boxShadow: 'var(--shadow-glow)' }}>
                     Rozpocznij Skanowanie Areny
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                     <Flame size={18} color="var(--accent-base)" />
                     <h3 style={{ fontSize: '16px', margin: 0 }}>Wybierz cel pojedynku:</h3>
                   </div>
                   
                   {opponents.map((opp, idx) => {
                      let diffLabel = "Równy";
                      let diffColor = "#fbbf24";
                      let multLabel = "1.0x";
                      if (opp.difficulty === 'stronger') {
                         diffLabel = "Silny";
                         diffColor = "#ef4444";
                         multLabel = "1.6x";
                      } else if (opp.difficulty === 'weaker') {
                         diffLabel = "Słaby";
                         diffColor = "#34d399";
                         multLabel = "0.5x";
                      }
                      
                      const estPrestige = Math.round((Math.floor(opp.totalLvl / 2) + 10) * (opp.difficulty === 'weaker' ? 0.5 : opp.difficulty === 'stronger' ? 1.6 : 1.0));
                      const estCoins = Math.round((Math.floor(opp.totalLvl * 1.5) + 20) * (opp.difficulty === 'weaker' ? 0.5 : opp.difficulty === 'stronger' ? 1.6 : 1.0));
                      
                      return (
                        <div 
                          key={idx} 
                          onClick={() => setSelectedEnemy(opp)}
                          style={{
                             padding: '14px', borderRadius: '12px', cursor: 'pointer',
                             border: selectedEnemy === opp ? `2px solid var(--accent-base)` : '1px solid var(--border-color)',
                             background: selectedEnemy === opp ? 'rgba(249,115,22,0.1)' : 'var(--surface-color)',
                             display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                             transition: '0.2s',
                             boxShadow: selectedEnemy === opp ? '0 0 15px rgba(249,115,22,0.2)' : 'none'
                          }}
                        >
                           <div style={{ textAlign: 'left' }}>
                              <div style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--text-primary)' }}>{opp.name}</div>
                              <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                                 <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Moc: {opp.totalLvl}</span>
                                 <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-muted)' }} />
                                 <span style={{ fontSize: '11px', color: diffColor, fontWeight: 'bold' }}>{diffLabel} ({multLabel})</span>
                              </div>
                              <div style={{ fontSize: '11px', color: '#fbbf24', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                 <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Trophy size={11} color="#a855f7" /> +{estPrestige}</span>
                                 <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Coins size={11} color="#fbbf24" /> +{estCoins}</span>
                              </div>
                           </div>
                           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                              <div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Heart size={12} fill="#ef4444" /> {opp.hp} HP
                              </div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Pancerz: {opp.armor}</div>
                           </div>
                        </div>
                      );
                   })}
                   
                   <button 
                     className="btn btn-primary" 
                     disabled={!selectedEnemy || currentFightsLeft <= 0}
                     onClick={handleStartFight}
                     style={{ width: '100%', padding: '16px', marginTop: '16px', fontSize: '16px', boxShadow: selectedEnemy ? 'var(--shadow-glow)' : 'none' }}
                   >
                     <Swords size={20} /> {currentFightsLeft > 0 ? 'ROZPOCZNIJ WALKĘ' : 'BRAK PRÓB NA DZIŚ'}
                   </button>
                   <button className="btn btn-secondary" onClick={findOpponents} style={{ width: '100%', padding: '12px' }}>
                     Wyszukaj innych rywali (Skan)
                   </button>
                </div>
              )}
            </>
          )}
        </section>
      ) : (
        /* ACTIVE COMBAT ARENA SCREEN */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
          
          {/* THE HOLOGRAM GRID BATTLEFIELD */}
          <div style={{ 
            position: 'relative', 
            height: '240px', 
            background: 'radial-gradient(circle at center, #1b1310 0%, #0c0a09 100%)',
            border: '2px solid var(--accent-base)',
            borderRadius: '16px', 
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px',
            boxShadow: 'inset 0 0 40px rgba(249,115,22,0.3), 0 0 25px rgba(249,115,22,0.15)'
          }}>
            {/* Hologram neon lines */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(249,115,22,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.04) 1px, transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />
            
            {/* Visual Slashing Overlays */}
            {lastHitEffect === 'slash-1' && (
              <div style={{ 
                position: 'absolute', top: '50%', left: '50%', width: '120px', height: '6px', 
                background: 'linear-gradient(90deg, transparent, #ffffff, var(--accent-base), transparent)', 
                boxShadow: '0 0 15px #ff7a00, 0 0 30px #ff3c00',
                borderRadius: '50%',
                zIndex: 30,
                transform: 'translate(-50%, -50%) rotate(45deg)',
                animation: 'slash-1-anim 0.3s forwards'
              }} />
            )}
            {lastHitEffect === 'slash-2' && (
              <div style={{ 
                position: 'absolute', top: '50%', left: '50%', width: '120px', height: '6px', 
                background: 'linear-gradient(90deg, transparent, #ffffff, #ef4444, transparent)', 
                boxShadow: '0 0 15px #ff0055, 0 0 30px #ff0000',
                borderRadius: '50%',
                zIndex: 30,
                transform: 'translate(-50%, -50%) rotate(-45deg)',
                animation: 'slash-2-anim 0.3s forwards'
              }} />
            )}
            {lastHitEffect === 'dodge-wave' && (
              <div style={{ 
                position: 'absolute', top: '50%', left: '50%', width: '80px', height: '80px', 
                borderRadius: '50%',
                border: '4px solid #38bdf8',
                boxShadow: '0 0 20px #38bdf8',
                zIndex: 30,
                transform: 'translate(-50%, -50%)',
                animation: 'dodge-wave-anim 0.35s ease-out forwards'
              }} />
            )}
            {lastHitEffect === 'block-shield' && (
              <div style={{ 
                position: 'absolute', top: '50%', left: '50%',
                width: '70px', height: '70px',
                zIndex: 40,
                animation: 'block-shield-anim 0.4s ease-out forwards',
                transform: 'translate(-50%, -50%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                filter: 'drop-shadow(0 0 18px #a3e635)'
              }}>
                <svg viewBox="0 0 24 24" width="70" height="70" stroke="#a3e635" strokeWidth="2" fill="rgba(163,230,53,0.15)" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
            )}

            {/* LEFTSIDE: PLAYER FIGHTER PORTRAIT */}
            <div style={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', 
              width: '100px', transition: 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)', ...playerStyle 
            }}>
              {/* Avatar Shield Frame */}
              <div style={{ 
                width: '74px', height: '74px', borderRadius: '50%', 
                border: '3px solid var(--accent-base)',
                boxShadow: '0 0 20px rgba(249,115,22,0.4)',
                background: '#1c1917',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative'
              }}>
                <svg viewBox="0 0 24 24" width="36" height="36" stroke="var(--accent-base)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px var(--accent-base))' }}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                {/* Prestige Rank indicator */}
                <div style={{ position: 'absolute', bottom: '-4px', background: 'var(--accent-base)', color: 'black', fontSize: '9px', fontWeight: 'bold', padding: '1px 6px', borderRadius: '10px' }}>
                  TY
                </div>
              </div>
              <strong style={{ fontSize: '12px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>{player.name}</strong>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Moc: {player.totalLvl}</div>
              
              {/* Flying Damage Floating Texts for Player */}
              {floatsP.map(f => (
                <div key={f.id} className="animate-float-up" style={{ color: f.color, left: '30px', top: '10px', fontSize: '16px' }}>{f.text}</div>
              ))}
            </div>

            {/* CENTER FLAME OF WAR / VS BADGE */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 5 }}>
              <div style={{ 
                width: '42px', height: '42px', borderRadius: '50%', 
                background: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
                boxShadow: '0 0 25px #ef4444',
                color: 'white', fontWeight: 'bold', fontSize: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                animation: 'pulse 1.2s infinite'
              }}>
                VS
              </div>
              <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Runda {combatLog.length}</span>
            </div>

            {/* RIGHTSIDE: ENEMY FIGHTER PORTRAIT */}
            <div style={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', 
              width: '100px', transition: 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)', ...enemyStyle 
            }}>
              {/* Enemy Boss Frame */}
              <div style={{ 
                width: '74px', height: '74px', borderRadius: '50%', 
                border: '3px solid #ef4444',
                boxShadow: '0 0 20px rgba(239,68,68,0.4)',
                background: '#1c1917',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative'
              }}>
                <svg viewBox="0 0 24 24" width="36" height="36" stroke="#ef4444" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px #ef4444)' }}>
                  <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                  <line x1="12" y1="22" x2="12" y2="15.5" />
                  <polyline points="22 8.5 12 15.5 2 8.5" />
                  <polyline points="2 15.5 12 15.5 22 15.5" />
                  <polyline points="12 2 12 15.5" />
                </svg>
                <div style={{ position: 'absolute', bottom: '-4px', background: '#ef4444', color: 'white', fontSize: '9px', fontWeight: 'bold', padding: '1px 6px', borderRadius: '10px' }}>
                  WÓDZ
                </div>
              </div>
              <strong style={{ fontSize: '12px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>{enemy.name}</strong>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Moc: {enemy.totalLvl}</div>
              
              {/* Flying Damage Floating Texts for Enemy */}
              {floatsE.map(f => (
                <div key={f.id} className="animate-float-up" style={{ color: f.color, right: '30px', top: '10px', fontSize: '16px' }}>{f.text}</div>
              ))}
            </div>

          </div>

          {/* ACTIVE STATUS BARS */}
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* PLAYER HEALTH & ENERGY */}
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{player.name} (Ty)</span>
                <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 'bold' }}>{player.hp} / {player.maxHp} HP</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Heart size={14} color="#ef4444" fill="#ef4444" />
                <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <div style={{ width: `${getPercentage(player.hp, player.maxHp)}%`, height: '100%', background: 'linear-gradient(90deg, #ef4444, #f87171)', transition: '0.15s ease-out' }} />
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} color="#fbbf24" fill="#fbbf24" />
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(251,191,36,0.2)' }}>
                    <div style={{ width: `${getPercentage(player.energy, player.maxEnergy)}%`, height: '100%', background: 'linear-gradient(90deg, #fbbf24, #fcd34d)', transition: '0.15s ease-out' }} />
                </div>
              </div>
            </div>

            <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />

            {/* ENEMY HEALTH & ENERGY */}
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{enemy.name} (Przeciwnik)</span>
                <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 'bold' }}>{enemy.hp} / {enemy.maxHp} HP</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Heart size={14} color="#ef4444" fill="#ef4444" />
                <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <div style={{ width: `${getPercentage(enemy.hp, enemy.maxHp)}%`, height: '100%', background: 'linear-gradient(90deg, #ef4444, #f87171)', transition: '0.15s ease-out' }} />
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} color="#fbbf24" fill="#fbbf24" />
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(251,191,36,0.2)' }}>
                    <div style={{ width: `${getPercentage(enemy.energy, enemy.maxEnergy)}%`, height: '100%', background: 'linear-gradient(90deg, #fbbf24, #fcd34d)', transition: '0.15s ease-out' }} />
                </div>
              </div>
            </div>

          </div>

          {/* PLAY-BY-PLAY REAL-TIME TEXT TICKER */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowLog(!showLog)}
              style={{ padding: '8px 16px', fontSize: '13px', borderRadius: showLog ? '12px 12px 0 0' : '12px', borderBottom: showLog ? 'none' : '', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Eye size={14} /> {showLog ? 'Schowaj Transmisję Starcia' : 'Pokaż Transmisję Starcia'}
            </button>
            {showLog && (
               <div 
                 ref={scrollRef}
                 className="glass-panel" 
                 style={{ 
                   padding: '12px', 
                   overflowY: 'auto', 
                   display: 'flex', 
                   flexDirection: 'column', 
                   gap: '6px', 
                   height: '110px', 
                   borderRadius: '0 0 12px 12px', 
                   borderTop: 'none',
                   background: 'rgba(0,0,0,0.4)',
                   textAlign: 'left'
                 }}
               >
                 {combatLog.map((log, i) => {
                   let isPlayerAct = false;
                   if (player && log.includes(player.name)) isPlayerAct = true;
                   
                   return (
                     <div key={i} style={{ 
                        fontSize: '11px', lineHeight: '1.4', padding: '6px',
                        color: log.includes('🏆') ? '#4ade80' : log.includes('🔥') ? '#fbbf24' : log.includes('💨') ? '#38bdf8' : 'var(--text-secondary)',
                        background: 'rgba(255,255,255,0.01)', 
                        borderLeft: isPlayerAct ? '2px solid var(--accent-base)' : '2px solid #ef4444',
                        borderRadius: '4px'
                     }}>
                       {log}
                     </div>
                   );
                 })}
               </div>
            )}
          </div>

          {/* GAMEOVER DIALOG MODAL / REWARDS */}
          {isGameOver && (
            <div className="glass-panel animate-fade-in" style={{ padding: '24px', textAlign: 'center', marginTop: '10px', border: lastRewards.won ? '2px solid #fbbf24' : '2px solid #ef4444', background: 'rgba(28,25,23,0.95)' }}>
                <div style={{ margin: '0 auto 12px', width: '50px', height: '50px', borderRadius: '50%', background: lastRewards.won ? 'rgba(251,191,36,0.1)' : 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {lastRewards.won ? <Trophy size={28} color="#fbbf24" /> : <Flame size={28} color="#ef4444" />}
                </div>
                
                <h2 style={{ fontSize: '24px', marginBottom: '8px', color: lastRewards.won ? '#fbbf24' : '#ef4444', fontWeight: 800 }}>
                   {lastRewards.won ? 'WSPANIAŁE ZWYCIĘSTWO!' : 'ZAPISANY NA TARCE'}
                </h2>
                {lastRewards.won ? (
                   <>
                       <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '13px' }}>Twoja postać odnosi spektakularny triumf. Złoto i sława są Twoje!</p>
                       <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '24px' }}>
                           <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fbbf24' }}>+{lastRewards.gold}</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>ZŁOTO</div>
                           </div>
                           <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#a855f7' }}>+{lastRewards.prestige}</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>PRESTIŻ</div>
                           </div>
                       </div>
                   </>
                ) : (
                   <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '13px' }}>Przeciwnik obnażył słabości w Twojej gardzie. Poćwicz i spróbuj ponownie!</p>
                )}
                
                <button className="btn btn-primary" onClick={() => setPlayer(null)} style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 'bold' }}>
                  WRÓĆ DO KATEDRY WALK
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
