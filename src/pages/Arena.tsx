import { useState, useRef, useEffect } from 'react';
import { useAuthStore, getPrestigeRank, type Item, type MuscleStat } from '../store/useAuthStore';
import { Navigation } from '../components/Navigation';
import { useToast } from '../components/toastContext';
import { useTranslation } from '../lib/translations';
import { Swords, Heart, Search, Flame, Trophy, Cpu, Eye, Coins } from 'lucide-react';

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

type EquippedItems = {
  weapon: Item | null;
  armor: Item | null;
  accessory: Item | null;
};

const getEquippedBoost = (equipped: EquippedItems | null | undefined, stat: string) => {
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

const calculateStats = (
  name: string,
  level: number,
  muscleStats?: Record<string, MuscleStat>,
  equipped?: EquippedItems
): CombatStats => {
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

const NICKNAMES_PL = ["Cyber", "Shadow", "Wściekły", "Mroczny", "Płonący", "Tytanowy", "Bezlitosny", "Dziki", "Zardzewiały", "Neonowy"];
const NOUNS_PL = ["Łamacz", "Uderzacz", "Wilk", "Łowca", "Gladiator", "Grom", "Buntownik", "Drań", "Rycerz", "Żniwiarz"];

const NICKNAMES_EN = ["Cyber", "Shadow", "Furious", "Dark", "Blazing", "Titanium", "Merciless", "Wild", "Rusty", "Neon"];
const NOUNS_EN = ["Breaker", "Striker", "Wolf", "Hunter", "Gladiator", "Thunder", "Rebel", "Rascal", "Knight", "Reaper"];

const ATTACK_ACTIONS_PL = [
  "wyprowadza potężne uderzenie z góry",
  "błyskawicznie kontratakuje od dołu",
  "wykonuje szybkie pchnięcie w odsłonięty bok",
  "próbuje przełamać pancerz potężnym cięciem",
  "skacze w kierunku rywala z wzniesioną bronią",
  "wykonuje szybką kombinację ciosów",
  "uderza z pełnym impetem i wściekłością"
];

const ATTACK_ACTIONS_EN = [
  "unleashes a powerful strike from above",
  "instantly counterattacks from below",
  "delivers a quick thrust into an exposed flank",
  "tries to break the armor with a heavy slash",
  "leaps towards the opponent with weapon raised",
  "performs a rapid combo of strikes",
  "strikes with full momentum and fury"
];

export const Arena = () => {
  const { t, lang } = useTranslation();
  const toast = useToast();
  const user = useAuthStore(state => state.user);
  const addPrestige = useAuthStore(state => state.addPrestige);
  const addCoins = useAuthStore(state => state.addCoins);
  const consumeArenaFight = useAuthStore(state => state.useArenaFight);

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
             const color = entry.dmgType === 'crit' ? 'var(--accent)' : 'var(--danger)';
             const prefix = entry.dmgType === 'crit' ? (lang === 'pl' ? 'KRYT! -' : 'CRIT! -') : '-';
             const text = `${prefix}${entry.finalDmg} HP`;

             // Randomize slash effect graphic
             setLastHitEffect(Math.random() > 0.5 ? 'slash-1' : 'slash-2');

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
             const text = lang === 'pl' ? 'UNIK!' : 'DODGE!';
             if (defIsPlayer) {
                  setDefenderAnim('ghost-p');
                  setFloatsP(prev => [...prev, { id: floatId, text, color: 'var(--text-secondary)' }]);
             } else {
                  setDefenderAnim('ghost-e');
                  setFloatsE(prev => [...prev, { id: floatId, text, color: 'var(--text-secondary)' }]);
             }
        }
        else if (entry.dmgType === 'block') {
             const defIsPlayer = entry.attackerName === enemy?.name;
             setLastHitEffect('block-shield');
             const text = lang === 'pl' ? 'BLOK!' : 'BLOCK!';
             if (defIsPlayer) {
                  setDefenderAnim('block-p');
                  setFloatsP(prev => [...prev, { id: floatId, text, color: 'var(--text-primary)' }]);
             } else {
                  setDefenderAnim('block-e');
                  setFloatsE(prev => [...prev, { id: floatId, text, color: 'var(--text-primary)' }]);
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
              const basePrestige = Math.floor(enemy.totalLvl / 2) + 10;
              const baseCoins = Math.floor(enemy.totalLvl * 1.5) + 20;

              let multiplier = 1.0;
              if (enemy.difficulty === 'weaker') multiplier = 0.5;
              else if (enemy.difficulty === 'stronger') multiplier = 1.6;

              pGain = Math.round(basePrestige * multiplier);
              cGain = Math.round(baseCoins * multiplier);

              addPrestige(pGain);
              addCoins(cGain);
              setCombatLog(prev => [...prev, lang === 'pl' 
                ? `NAGRODA: Zyskujesz +${pGain} Prestiżu, +${cGain} Złota.`
                : `REWARD: You gain +${pGain} Prestige, +${cGain} Gold.`
              ]);
           }
           setLastRewards({ gold: cGain, prestige: pGain, won: !!entry.won });
        }
      }, 700); 
      
      return () => clearTimeout(timer);
    }
  }, [logQueue, isFighting, player?.name, enemy?.name, enemy, addPrestige, addCoins, lang]);

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
    setSearchLogs([
      lang === 'pl' ? "Nawiązywanie połączenia z radarami Areny..." : "Establishing connection with Arena radars...",
      (lang === 'pl' ? "Skanowanie sygnatur gladiatorów w pobliżu poziomu mocy: " : "Scanning gladiator signatures near power level: ") + playerBaseTotalSum
    ]);
    
    setTimeout(() => {
      setSearchLogs(prev => [...prev, lang === 'pl' ? "Zlokalizowano pasujących wojowników w sektorze południowym." : "Located matching fighters in the southern sector."]);
    }, 600);
    
    setTimeout(() => {
      setSearchLogs(prev => [...prev, lang === 'pl' ? "Sygnatury bojowe pobrane. Generowanie kart pretendentów..." : "Combat signatures retrieved. Generating contender cards..."]);
    }, 1300);

    setTimeout(() => {
      const ops: CombatStats[] = [];
      
      // 2 Weaker (Słaby)
      for(let i=0; i<2; i++) {
         const variance = -0.25 + (Math.random() * 0.1); 
         const eSum = Math.max(6, Math.round(playerBaseTotalSum * (1 + variance)));
         const rName = lang === 'pl'
           ? `${NICKNAMES_PL[Math.floor(Math.random()*NICKNAMES_PL.length)]} ${NOUNS_PL[Math.floor(Math.random()*NOUNS_PL.length)]}`
           : `${NICKNAMES_EN[Math.floor(Math.random()*NICKNAMES_EN.length)]} ${NOUNS_EN[Math.floor(Math.random()*NOUNS_EN.length)]}`;
         const stat = calculateStatsFromSum(rName, eSum);
         stat.difficulty = 'weaker';
         ops.push(stat);
      }
      
      // 2 Balanced (Równy)
      for(let i=0; i<2; i++) {
         const variance = -0.05 + (Math.random() * 0.1); 
         const eSum = Math.max(6, Math.round(playerBaseTotalSum * (1 + variance)));
         const rName = lang === 'pl'
           ? `${NICKNAMES_PL[Math.floor(Math.random()*NICKNAMES_PL.length)]} ${NOUNS_PL[Math.floor(Math.random()*NOUNS_PL.length)]}`
           : `${NICKNAMES_EN[Math.floor(Math.random()*NICKNAMES_EN.length)]} ${NOUNS_EN[Math.floor(Math.random()*NOUNS_EN.length)]}`;
         const stat = calculateStatsFromSum(rName, eSum);
         stat.difficulty = 'balanced';
         ops.push(stat);
      }
      
      // 2 Stronger (Silny)
      for(let i=0; i<2; i++) {
         const variance = 0.15 + (Math.random() * 0.15); 
         const eSum = Math.max(6, Math.round(playerBaseTotalSum * (1 + variance)));
         const rName = lang === 'pl'
           ? `${NICKNAMES_PL[Math.floor(Math.random()*NICKNAMES_PL.length)]} ${NOUNS_PL[Math.floor(Math.random()*NOUNS_PL.length)]}`
           : `${NICKNAMES_EN[Math.floor(Math.random()*NICKNAMES_EN.length)]} ${NOUNS_EN[Math.floor(Math.random()*NOUNS_EN.length)]}`;
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
    const logs: CombatLogEntry[] = [];

    let pTurn = pStats.energy >= eStats.energy;

    const startMsg = lang === 'pl'
      ? `Rozpoczęcie pojedynku! Sędzia daje znak. Inicjatywę przejmuje ${pTurn ? pStats.name : eStats.name} (${pTurn ? 'Szybszy refleks' : 'Zaskoczenie'}).`
      : `Match starts! The referee gives the signal. ${pTurn ? pStats.name : eStats.name} takes initiative (${pTurn ? 'Faster reflexes' : 'Surprise'}).`;

    logs.push({ 
       msg: startMsg, 
       newPlayerHp: pHP, newEnemyHp: eHP, attackerName: '', isEnd: false 
     });
    
    let turns = 0;
    while(pHP > 0 && eHP > 0 && turns < 100) {
      turns++;

      const attacker = pTurn ? pStats : eStats;
      const defender = pTurn ? eStats : pStats;
      const action = (lang === 'pl' ? ATTACK_ACTIONS_PL : ATTACK_ACTIONS_EN)[Math.floor(Math.random() * (lang === 'pl' ? ATTACK_ACTIONS_PL.length : ATTACK_ACTIONS_EN.length))];

      const isDodge = Math.random() * 100 < defender.dodge;
      if (isDodge) {
         logs.push({ 
            msg: lang === 'pl'
              ? `${attacker.name} ${action}, ale ${defender.name} wymanewrował cios sprytnym unikiem!`
              : `${attacker.name} ${action}, but ${defender.name} evaded the blow with a clever dodge!`, 
            newPlayerHp: pHP, newEnemyHp: eHP, attackerName: attacker.name, isEnd: false, dmgType: 'dodge' 
         });
      } else {
         const isBlock = Math.random() * 100 < Math.min(40, (defender.armor * 1.2) + 8);
         const isCrit = !isBlock && Math.random() * 100 < attacker.crit;
         const rawDmg = attacker.damage * (isCrit ? 2.2 : 1) * (0.85 + Math.random() * 0.3);
         const blockedPct = isBlock ? 0.72 : 0;
         const finalDmg = Math.max(1, Math.round(rawDmg * (1 - blockedPct) - (defender.armor * 0.4)));
         
         if (pTurn) eHP = Math.max(0, eHP - finalDmg);
         else pHP = Math.max(0, pHP - finalDmg);

         if (isBlock) {
           logs.push({ 
               msg: lang === 'pl'
                 ? `${defender.name} blokuje tarczą cios ${attacker.name}a! Pochłonięto większość energii (${finalDmg} przenikło).`
                 : `${defender.name} blocks ${attacker.name}'s strike with a shield! Absorbed most energy (${finalDmg} penetrated).`, 
               newPlayerHp: pHP, newEnemyHp: eHP, attackerName: attacker.name, isEnd: false, dmgType: 'block', finalDmg 
           });
         } else {
           const critStr = isCrit 
             ? (lang === 'pl' ? `KRYTYCZNIE!` : `CRITICAL!`) 
             : ``;
           logs.push({ 
               msg: lang === 'pl'
                 ? `${critStr} ${attacker.name} ${action} i zadaje ${finalDmg} obrażeń dla ${defender.name}!`
                 : `${critStr} ${attacker.name} ${action} and deals ${finalDmg} damage to ${defender.name}!`, 
               newPlayerHp: pHP, newEnemyHp: eHP, attackerName: attacker.name, isEnd: false, dmgType: isCrit ? 'crit' : 'normal', finalDmg 
           });
         }
      }

      if (pHP <= 0 || eHP <= 0) break;
      pTurn = !pTurn;
    }

    if (pHP > 0) {
      logs.push({ 
        msg: lang === 'pl'
          ? `ZWYCIĘSTWO! ${pStats.name} pokonuje rywala i triumfuje na arenie!`
          : `VICTORY! ${pStats.name} defeats the rival and triumphs in the arena!`, 
        newPlayerHp: pHP, newEnemyHp: eHP, attackerName: '', isEnd: true, won: true 
      });
    } else {
      logs.push({ 
        msg: lang === 'pl'
          ? `PORAŻKA. ${eStats.name} powala Cię na ziemię jednym mocnym uderzeniem.`
          : `DEFEAT. ${eStats.name} knocks you to the ground with a powerful blow.`, 
        newPlayerHp: pHP, newEnemyHp: eHP, attackerName: '', isEnd: true, won: false 
      });
    }

    return logs;
  };

  const handleStartFight = async () => {
    if (!selectedEnemy) return;

    const allowed = await consumeArenaFight();
    if (!allowed) {
       toast({ text: t('arena.noFights'), tone: 'error' });
       return;
    }

    const pStart = calculateStats(user.username, user.level, user.muscleStats, user.equipped);
    const eStart = selectedEnemy; 

    setPlayer(pStart);
    setEnemy(eStart);
    
    const simLog = generateEncounterLog(pStart, eStart);
    setLogQueue(simLog);
    setCombatLog([lang === 'pl' ? `Wkraczasz na piasek Koloseum...` : `You step onto the sands of the Colosseum...`]);
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

  const getDifficultyLabel = (diff?: string) => {
    if (diff === 'stronger') return t('arena.hard');
    if (diff === 'weaker') return t('arena.easy');
    return t('arena.medium');
  };

  const getPrestigeRankName = (prestige: number) => {
    const raw = getPrestigeRank(prestige).name;
    return t(`dashboard.prestigeRanks.${raw}`, raw);
  };

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
        20%  { transform: translateX(-10px) scale(1.08); filter: brightness(1.6) drop-shadow(0 0 12px rgba(230,232,236,0.55)); }
        55%  { transform: translateX(-6px) scale(1.04); filter: brightness(1.3) drop-shadow(0 0 8px rgba(230,232,236,0.38)); }
        100% { transform: translateX(0) scale(1); filter: brightness(1); }
      }
      @keyframes arena-block-enemy {
        0%   { transform: translateX(0) scale(1); filter: brightness(1); }
        20%  { transform: translateX(10px) scale(1.08); filter: brightness(1.6) drop-shadow(0 0 12px rgba(230,232,236,0.55)); }
        55%  { transform: translateX(6px) scale(1.04); filter: brightness(1.3) drop-shadow(0 0 8px rgba(230,232,236,0.38)); }
        100% { transform: translateX(0) scale(1); filter: brightness(1); }
      }
      @keyframes block-shield-anim {
        0%   { transform: translate(-50%, -50%) scale(0.3) rotate(-15deg); opacity: 0; }
        25%  { transform: translate(-50%, -50%) scale(1.2) rotate(5deg);  opacity: 1; }
        60%  { transform: translate(-50%, -50%) scale(1.0) rotate(0deg);  opacity: 0.9; }
        100% { transform: translate(-50%, -50%) scale(1.4) rotate(0deg);  opacity: 0; }
      }
      .crit-flash-overlay {
        display: none;
      }
    `}} />

    <div className="container app-page page-arena page-transition" style={{ display: 'flex', flexDirection: 'column' }}>
      
      <header className="arena-head">
        <div>
          <span className="eyebrow">{t('arena.sector')}</span>
          <h1 className="arena-title">{t('arena.title')}</h1>
        </div>
        <div className="arena-hud">
          <div className="arena-chip">
            <span className="arena-chip-label">{t('arena.rank')}</span>
            <strong className="arena-chip-value is-rank" style={{ color: myLeague.color }}>{getPrestigeRankName(user.prestige || 0)}</strong>
          </div>
          <div className="arena-chip">
            <span className="arena-chip-label">{t('arena.prestigeReward')}</span>
            <strong className="arena-chip-value stat-display">{(user.prestige || 0).toLocaleString()}</strong>
          </div>
          <div className={`arena-chip${currentFightsLeft <= 0 ? ' is-empty' : ''}`}>
            <span className="arena-chip-label">{t('arena.fights')}</span>
            <div className="arena-pips" role="img" aria-label={`${currentFightsLeft}/5`}>
              {[0, 1, 2, 3, 4].map(slot => (
                <span key={slot} className={`arena-pip${slot < currentFightsLeft ? ' is-on' : ''}`} />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* LOBBY / SEARCH SCREEN */}
      {!player || !enemy ? (
        <section className="card arena-lobby">
          
          {/* SEARCHING RADAR ANIMATION */}
          {isSearching ? (
            <div className="arena-search">
              <div className="arena-radar">
                <Cpu size={22} color="var(--accent)" />
              </div>
              
              <h4 className="arena-search-title">
                {lang === 'pl' ? 'Wyszukiwanie Przeciwników...' : 'Searching for Opponents...'}
              </h4>
              <div className="arena-search-log">
                {searchLogs.map((logMsg, lIdx) => (
                  <div key={lIdx}>&gt; {logMsg}</div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {opponents.length === 0 ? (
                <div className="arena-lobby-empty">
                  <div className="arena-lobby-icon">
                    <Search size={30} color="var(--accent)" />
                  </div>
                  <h3 className="arena-lobby-title">
                    {lang === 'pl' ? 'Gotowy na starcie?' : 'Ready for battle?'}
                  </h3>
                  <p className="arena-lobby-desc">
                    {lang === 'pl' 
                      ? 'Skaner matchmakingu dobierze sześciu gladiatorów o poziomach dopasowanych do Twojej łącznej siły fizycznej.'
                      : 'The matchmaking scanner will find six gladiators with levels matched to your overall physical strength.'}
                  </p>
                  <button className="btn btn-primary arena-scan-btn" onClick={findOpponents}>
                    {t('arena.scanBtn')}
                  </button>
                </div>
              ) : (
                <div className="arena-targets">
                   <div className="arena-targets-head">
                     <Flame size={16} color="var(--accent)" />
                     <h3>
                       {lang === 'pl' ? 'Wybierz cel pojedynku' : 'Select battle target'}
                     </h3>
                   </div>
                   
                   {opponents.map((opp, idx) => {
                      const diffLabel = getDifficultyLabel(opp.difficulty);
                      const isHard = opp.difficulty === 'stronger';
                      const isEasy = opp.difficulty === 'weaker';
                      const multLabel = isHard ? '1.6x' : isEasy ? '0.5x' : '1.0x';
                      
                      const estPrestige = Math.round((Math.floor(opp.totalLvl / 2) + 10) * (opp.difficulty === 'weaker' ? 0.5 : opp.difficulty === 'stronger' ? 1.6 : 1.0));
                      const estCoins = Math.round((Math.floor(opp.totalLvl * 1.5) + 20) * (opp.difficulty === 'weaker' ? 0.5 : opp.difficulty === 'stronger' ? 1.6 : 1.0));
                      
                      return (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => setSelectedEnemy(opp)}
                          aria-pressed={selectedEnemy === opp}
                          className={`arena-opponent${selectedEnemy === opp ? ' is-selected' : ''}`}
                        >
                           <span className="arena-opponent-main">
                              <span className="arena-opponent-name">{opp.name}</span>
                              <span className="arena-opponent-meta">
                                 <span className={`arena-diff${isHard ? ' is-hard' : isEasy ? ' is-easy' : ''}`}>
                                   {diffLabel} · {multLabel}
                                 </span>
                                 <span className="meta-chip">
                                   {lang === 'pl' ? 'Pancerz' : 'Armor'} <strong>{opp.armor}</strong>
                                 </span>
                              </span>
                              <span className="arena-opponent-rewards">
                                 <span><Trophy size={11} /> +{estPrestige}</span>
                                 <span><Coins size={11} /> +{estCoins}</span>
                              </span>
                           </span>
                           <span className="arena-opponent-side">
                              <span className="arena-opponent-hp">
                                <Heart size={11} fill="currentColor" /> {opp.hp} HP
                              </span>
                              <span className="arena-opponent-power stat-display">{opp.totalLvl}</span>
                              <span className="arena-opponent-power-label">
                                {lang === 'pl' ? 'Moc' : 'Power'}
                              </span>
                           </span>
                        </button>
                      );
                   })}
                   
                   <button 
                     className="btn btn-primary" 
                     disabled={!selectedEnemy || currentFightsLeft <= 0}
                     onClick={handleStartFight}
                     style={{ width: '100%', padding: '14px', marginTop: '6px', fontSize: '15px' }}
                   >
                     <Swords size={20} /> {currentFightsLeft > 0 ? (lang === 'pl' ? 'ROZPOCZNIJ WALKĘ' : 'START FIGHT') : (lang === 'pl' ? 'BRAK PRÓB NA DZIŚ' : 'NO FIGHTS LEFT TODAY')}
                   </button>
                   <button className="btn btn-secondary" onClick={findOpponents} style={{ width: '100%', padding: '12px' }}>
                     {lang === 'pl' ? 'Wyszukaj innych rywali (Skan)' : 'Search for other rivals (Scan)'}
                   </button>
                </div>
              )}
            </>
          )}
        </section>
      ) : (
        /* ACTIVE COMBAT ARENA SCREEN */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
          
          {/* ARENA BATTLEFIELD */}
          <div className="arena-stage">
            <div className="arena-stage-top">
              <span>ARENA // 07</span>
              <span>{lang === 'pl' ? 'Pojedynek' : 'Duel'}</span>
            </div>
            
            {/* Visual Slashing Overlays */}
            {lastHitEffect === 'slash-1' && (
              <div style={{ 
                position: 'absolute', top: '50%', left: '50%', width: '120px', height: '4px', 
                background: 'linear-gradient(90deg, transparent, var(--accent), transparent)', 
                boxShadow: 'none',
                borderRadius: '50%',
                zIndex: 30,
                transform: 'translate(-50%, -50%) rotate(45deg)',
                animation: 'slash-1-anim 0.3s forwards'
              }} />
            )}
            {lastHitEffect === 'slash-2' && (
              <div style={{ 
                position: 'absolute', top: '50%', left: '50%', width: '120px', height: '4px', 
                background: 'linear-gradient(90deg, transparent, var(--danger), transparent)', 
                boxShadow: 'none',
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
                border: '3px solid var(--text-secondary)',
                boxShadow: 'none',
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
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <svg viewBox="0 0 24 24" width="70" height="70" stroke="var(--text-primary)" strokeWidth="2" fill="rgba(236,238,241,0.1)" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
            )}

            {/* LEFTSIDE: PLAYER FIGHTER PORTRAIT */}
            <div className="arena-fighter" style={playerStyle}>
              <div className="arena-portrait is-player">
                <svg viewBox="0 0 24 24" width="32" height="32" stroke="var(--accent)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <div className="arena-fighter-tag">{lang === 'pl' ? 'TY' : 'YOU'}</div>
              </div>
              <strong className="arena-fighter-name">{player.name}</strong>
              <div className="arena-fighter-power">
                {lang === 'pl' ? 'Moc' : 'Power'} {player.totalLvl}
              </div>
              
              {/* Flying Damage Floating Texts for Player */}
              {floatsP.map(f => (
                <div key={f.id} className="animate-float-up" style={{ color: f.color, left: '30px', top: '10px', fontSize: '16px' }}>{f.text}</div>
              ))}
            </div>

            {/* CENTER FLAME OF WAR / VS BADGE */}
            <div className="arena-vs">
              <div className="arena-vs-badge">VS</div>
              <span className="arena-vs-round">{t('arena.round')} {combatLog.length}</span>
            </div>

            {/* RIGHTSIDE: ENEMY FIGHTER PORTRAIT */}
            <div className="arena-fighter" style={enemyStyle}>
              <div className="arena-portrait is-enemy">
                <svg viewBox="0 0 24 24" width="32" height="32" stroke="var(--danger)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                  <line x1="12" y1="22" x2="12" y2="15.5" />
                  <polyline points="22 8.5 12 15.5 2 8.5" />
                  <polyline points="2 15.5 12 15.5 22 15.5" />
                  <polyline points="12 2 12 15.5" />
                </svg>
                <div className="arena-fighter-tag">{lang === 'pl' ? 'RYWAL' : 'RIVAL'}</div>
              </div>
              <strong className="arena-fighter-name">{enemy.name}</strong>
              <div className="arena-fighter-power">
                {lang === 'pl' ? 'Moc' : 'Power'} {enemy.totalLvl}
              </div>
              
              {/* Flying Damage Floating Texts for Enemy */}
              {floatsE.map(f => (
                <div key={f.id} className="animate-float-up" style={{ color: f.color, right: '30px', top: '10px', fontSize: '16px' }}>{f.text}</div>
              ))}
            </div>

          </div>

          {/* ACTIVE STATUS BARS */}
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* PLAYER HEALTH & ENERGY */}
            <div className="arena-status-block">
              <div className="arena-status-head">
                <span className="arena-status-role">{lang === 'pl' ? 'Ty' : 'You'}</span>
                <span className="arena-status-name">{player.name}</span>
                <span className="arena-status-hp"><Heart size={13} fill="currentColor" /> {player.hp} / {player.maxHp}</span>
              </div>
              <div className="arena-bar-row">
                <span className="arena-bar-label">HP</span>
                <div className="arena-bar-track">
                  <div className="arena-bar-fill hp" style={{ width: `${getPercentage(player.hp, player.maxHp)}%` }} />
                </div>
              </div>
              <div className="arena-bar-row">
                <span className="arena-bar-label">EN</span>
                <div className="arena-bar-track is-energy">
                  <div className="arena-bar-fill energy" style={{ width: `${getPercentage(player.energy, player.maxEnergy)}%` }} />
                </div>
              </div>
            </div>

            <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />

            {/* ENEMY HEALTH & ENERGY */}
            <div className="arena-status-block">
              <div className="arena-status-head">
                <span className="arena-status-role">{t('arena.enemy')}</span>
                <span className="arena-status-name">{enemy.name}</span>
                <span className="arena-status-hp"><Heart size={13} fill="currentColor" /> {enemy.hp} / {enemy.maxHp}</span>
              </div>
              <div className="arena-bar-row">
                <span className="arena-bar-label">HP</span>
                <div className="arena-bar-track">
                  <div className="arena-bar-fill hp" style={{ width: `${getPercentage(enemy.hp, enemy.maxHp)}%` }} />
                </div>
              </div>
              <div className="arena-bar-row">
                <span className="arena-bar-label">EN</span>
                <div className="arena-bar-track is-energy">
                  <div className="arena-bar-fill energy" style={{ width: `${getPercentage(enemy.energy, enemy.maxEnergy)}%` }} />
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
              <Eye size={14} /> {showLog 
                ? (lang === 'pl' ? 'Schowaj Transmisję Starcia' : 'Hide Combat Feed') 
                : (lang === 'pl' ? 'Pokaż Transmisję Starcia' : 'Show Combat Feed')}
            </button>
            {showLog && (
               <div 
                 ref={scrollRef}
                 className="card" 
                 style={{ 
                   padding: '12px', 
                   overflowY: 'auto', 
                   display: 'flex', 
                   flexDirection: 'column', 
                   gap: '6px', 
                   height: '110px', 
                   borderRadius: '0 0 12px 12px', 
                   borderTop: 'none',
                   background: 'var(--surface-2)',
                   textAlign: 'left'
                 }}
               >
                 {combatLog.map((log, i) => {
                    let isPlayerAct = false;
                    if (player && log.includes(player.name)) isPlayerAct = true;
                    
                    return (
                      <div key={i} style={{ 
                         fontSize: '11px', lineHeight: '1.4', padding: '6px',
                         color: (log.includes('NAGRODA:') || log.includes('REWARD:')) ? 'var(--accent)' : 'var(--text-secondary)',
                         background: 'transparent', 
                         borderLeft: isPlayerAct ? '2px solid var(--accent-base)' : '2px solid var(--border-strong)',
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
            <div className="card animate-fade-in" style={{ padding: '24px', textAlign: 'center', marginTop: '10px', border: lastRewards.won ? '1px solid var(--accent-border)' : '1px solid rgba(239,68,68,0.35)', background: 'var(--surface)' }}>
                <div style={{ margin: '0 auto 12px', width: '48px', height: '48px', borderRadius: '50%', background: lastRewards.won ? 'var(--accent-soft)' : 'var(--danger-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {lastRewards.won ? <Trophy size={28} color="var(--accent)" /> : <Flame size={28} color="var(--danger)" />}
                </div>
                
                <span className="eyebrow">{t('arena.combatReport')}</span>
                <h2 style={{ fontSize: '28px', margin: '4px 0 8px', color: lastRewards.won ? 'var(--accent)' : 'var(--danger)', fontWeight: 800 }}>
                   {lastRewards.won ? t('arena.victory') : (lang === 'pl' ? 'ZAPISANY NA TARCE' : 'DEFEATED IN BATTLE')}
                </h2>
                {lastRewards.won ? (
                   <>
                       <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '13px' }}>
                         {lang === 'pl' 
                           ? 'Twoja postać odnosi spektakularny triumf. Złoto i sława są Twoje!'
                           : 'Your avatar achieves a spectacular victory. Gold and glory are yours!'}
                       </p>
                       <div style={{ display: 'flex', justifyContent: 'center', gap: '36px', marginBottom: '24px' }}>
                           <div style={{ textAlign: 'center' }}>
                              <div className="stat-display" style={{ fontSize: '36px', color: 'var(--accent)' }}>+{lastRewards.gold}</div>
                              <div className="eyebrow">{t('arena.goldReward')}</div>
                           </div>
                           <div style={{ textAlign: 'center' }}>
                              <div className="stat-display" style={{ fontSize: '36px', color: 'var(--text)' }}>+{lastRewards.prestige}</div>
                              <div className="eyebrow">{t('arena.prestigeReward')}</div>
                           </div>
                       </div>
                   </>
                ) : (
                   <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '13px' }}>
                     {lang === 'pl' 
                       ? 'Przeciwnik obnażył słabości w Twojej gardzie. Poćwicz i spróbuj ponownie!'
                       : 'The opponent exposed weakness in your guard. Train more and try again!'}
                   </p>
                )}
                
                <button className="btn btn-primary" onClick={() => setPlayer(null)} style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 'bold' }}>
                  {lang === 'pl' ? 'WRÓĆ DO KATEDRY WALK' : 'RETURN TO BATTLE LOBBY'}
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
