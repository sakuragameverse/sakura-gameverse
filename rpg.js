import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDH1DZqaIi5sKRXspXDUWbMUZ4nr5JIy8Q",
  authDomain: "sakura-gameverse.firebaseapp.com",
  projectId: "sakura-gameverse",
  storageBucket: "sakura-gameverse.firebasestorage.app",
  messagingSenderId: "226328425516",
  appId: "1:226328425516:web:8dc11761639228c6120d89"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUserUid = null;
let rpgObjetosGlobal = [];
let gamerProfile = JSON.parse(localStorage.getItem('sakura_gamer_profile')) || { 
  tag: "GamerOtaku_VE", xp: 150, tokens: 0, rango: "Genin", profesion: "", 
  stats: { hp: 100, atk: 10, def: 5 }, inventario: [],
  equipo: { cabeza: null, pecho: null, piernas: null, pies: null, mano_derecha: null, mano_izquierda: null, amuleto: null, anillo: null, mascota: null }
};

// ==========================================
// DICCIONARIOS DE LOOT Y ZONAS (SISTEMA RUNESCAPE)
// ==========================================
const lootMineria = ['Mineral de Cobre', 'Mineral de Hierro', 'Cristal de Caos', 'Acero Vorpal'];

const zonasCaza = {
    'gallinas': { nombre: 'Corral de Gallinas', xpReq: 0, xpGana: 5, tokGana: 0, probDrop: 10, drops: ['Poción de Vida Menor'] },
    'vacas': { nombre: 'Prado de Vacas', xpReq: 100, xpGana: 15, tokGana: 2, probDrop: 20, drops: ['Cuero de Lobo Huargo', 'Poción de Vida Menor'] },
    'goblins': { nombre: 'Campamento Goblin', xpReq: 300, xpGana: 40, tokGana: 5, probDrop: 30, drops: ['Daga de Bronce', 'Escudo de Madera Robusta'] },
    'gigantes': { nombre: 'Valle de Gigantes', xpReq: 800, xpGana: 100, tokGana: 15, probDrop: 45, drops: ['Espada de Carlin', 'Arco de Madera de Roble'] }
};

const mazmorras = {
    'facil': { nombre: 'Bosque Slime', poderReq: 40, xpGana: 45, tokGana: 5, probDrop: 40, drops: ['Bendición de la Diosa', 'Mineral de Cobre'] },
    'media': { nombre: 'Cueva Sangrienta', poderReq: 180, xpGana: 120, tokGana: 12, probDrop: 50, drops: ['Fragmento de Runa de Muerte', 'Katana de Hierro Frío', 'Báculo de Destrucción'] },
    'dificil': { nombre: 'Torre del Dragón', poderReq: 600, xpGana: 350, tokGana: 35, probDrop: 70, drops: ['Elucidator', 'Espada de Dios', 'Armadura de Placas Mágica (MPA)', 'Guadaña del Segador'] }
};

window.mostrarTextoFlotante = function(texto, color) {
    let el = document.createElement('div');
    el.className = 'floating-text'; el.style.color = color; el.style.left = '50%'; el.style.top = '40%';
    el.innerHTML = texto; document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
};

onAuthStateChanged(auth, async (user) => {
  if (user) { currentUserUid = user.uid; await window.descargarProgresoNube(user.uid); } 
  else { currentUserUid = null; window.renderizarTodoRPG(); }
  await window.cargarObjetosRPG();
});

// ==========================================
// CARGA DE OBJETOS CON COSTOS Y PESOS DINÁMICOS
// ==========================================
window.cargarObjetosRPG = async function() {
  try {
    const snapsObj = await getDocs(query(collection(db, "rpg_objetos")));
    rpgObjetosGlobal = [];
    snapsObj.forEach(d => {
      let obj = d.data();
      rpgObjetosGlobal.push({ 
        id: d.id, 
        nombre: obj.nombre, 
        tipo: (obj.tipo || 'arma').toLowerCase(), 
        rareza: obj.rareza || 'N', 
        ranura: obj.ranura || 'ninguna', 
        atk: obj.stats?.ataque || obj.stats?.atk || 0, 
        def: obj.stats?.defensa || obj.stats?.def || 0, 
        imgUrl: obj.imgUrl || '',
        costoMat: obj.costoMat || (obj.rareza === 'SSR' ? 100 : obj.rareza === 'SR' ? 35 : obj.rareza === 'R' ? 10 : 3),
        costoTok: obj.costoTok || (obj.rareza === 'SSR' ? 1000 : obj.rareza === 'SR' ? 250 : obj.rareza === 'R' ? 50 : 15),
        pesoDrop: obj.pesoDrop || (obj.rareza === 'SSR' ? 1 : obj.rareza === 'SR' ? 15 : obj.rareza === 'R' ? 100 : 1000)
      });
    });
    window.renderizarFraguaRPG();
  } catch(e) { console.warn("Error cargando objetos:", e); }
};

window.descargarProgresoNube = async function(uid) {
    try {
        const snap = await getDoc(doc(db, "jugadores_cloud", uid));
        if(snap.exists()) {
            const d = snap.data();
            if(d.profile) { gamerProfile = d.profile; if (!gamerProfile.equipo) gamerProfile.equipo = { cabeza: null, pecho: null, piernas: null, pies: null, mano_derecha: null, mano_izquierda: null, amuleto: null, anillo: null, mascota: null }; }
            localStorage.setItem('sakura_gamer_profile', JSON.stringify(gamerProfile));
        }
        window.renderizarTodoRPG();
    } catch(e) { console.warn("Error cargando perfil RPG:", e); }
};

window.guardarProgresoRPG = async function() {
    localStorage.setItem('sakura_gamer_profile', JSON.stringify(gamerProfile));
    if(currentUserUid) { try { await setDoc(doc(db, "jugadores_cloud", currentUserUid), { profile: gamerProfile, updatedAt: Date.now() }, { merge: true }); } catch(e) {} }
    window.renderizarTodoRPG();
};

window.renderizarTodoRPG = function() {
  document.getElementById('rpgPerfilTag').innerText = gamerProfile.tag || "Aventurero";
  document.getElementById('rpgPerfilClase').innerText = gamerProfile.profesion || "Sin Clase";
  document.getElementById('rpgPerfilTokens').innerHTML = `<i class="fas fa-coins"></i> ${gamerProfile.tokens || 0} Tokens`;
  document.getElementById('rpgPerfilXp').innerText = `${gamerProfile.xp || 0} XP`;

  let extraAtk = 0; let extraDef = 0;
  if (gamerProfile.equipo && gamerProfile.inventario) {
    for (let ranura in gamerProfile.equipo) {
      let uidItem = gamerProfile.equipo[ranura];
      if (uidItem) { let item = gamerProfile.inventario.find(i => i.uid_inventario === uidItem); if (item) { extraAtk += (item.atk || 0); extraDef += (item.def || 0); } }
    }
  }

  document.getElementById('rpgStatHp').innerText = gamerProfile.stats?.hp || 100;
  document.getElementById('rpgStatAtk').innerText = (gamerProfile.stats?.atk || 10) + (extraAtk > 0 ? ` (+${extraAtk})` : '');
  document.getElementById('rpgStatDef').innerText = (gamerProfile.stats?.def || 5) + (extraDef > 0 ? ` (+${extraDef})` : '');

  window.renderizarPaperDollGrande(); window.renderizarInventarioRPG(); window.renderizarFraguaRPG();
};

window.renderizarPaperDollGrande = function() {
  let grid = document.getElementById('paperDollGrid'); if(!grid) return;
  grid.style.cssText = `display: grid; grid-template-columns: repeat(3, 1fr); grid-template-areas: ". cabeza ." "amuleto . anillo" "mano_der pecho mano_izq" "piernas piernas piernas" "pies . mascota"; gap: 8px; max-width: 280px; margin: 0 auto;`;

  let ranurasConfig = { cabeza: { label: 'Cabeza', icon: '🪖', area: 'cabeza' }, amuleto: { label: 'Amuleto', icon: '📿', area: 'amuleto' }, anillo: { label: 'Anillo', icon: '💍', area: 'anillo' }, mano_derecha: { label: 'Mano Der.', icon: '🗡️', area: 'mano_der' }, pecho: { label: 'Pecho', icon: '🛡️', area: 'pecho' }, mano_izquierda: { label: 'Mano Izq.', icon: '🛡️', area: 'mano_izq' }, piernas: { label: 'Piernas', icon: '👖', area: 'piernas' }, pies: { label: 'Pies', icon: '🥾', area: 'pies' }, mascota: { label: 'Mascota', icon: '🐾', area: 'mascota' } };
  let html = "";

  for (let key in ranurasConfig) {
    let slot = ranurasConfig[key];
    let uidItemEquipado = gamerProfile.equipo?.[key];
    let itemObj = uidItemEquipado ? gamerProfile.inventario.find(i => i.uid_inventario === uidItemEquipado) : null;
    
    let contenido = `<div style="font-size: 1.1em; margin-bottom: 2px;">${slot.icon}</div><div style="font-size: 0.55em; color: var(--text-muted);">${slot.label}</div>`;
    let estilo = `grid-area: ${slot.area}; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 5px; text-align: center; cursor: pointer; min-height: 50px; display: flex; flex-direction: column; align-items: center; justify-content: center;`;
    
    if (itemObj) {
      let imgThumb = itemObj.imgUrl ? `<img src="${itemObj.imgUrl}" style="width: 22px; height: 22px; object-fit: contain; image-rendering: pixelated; margin-bottom: 2px;">` : `<div style="font-size: 1.1em;">${slot.icon}</div>`;
      contenido = `${imgThumb}<div style="font-size: 0.55em; color: #25d366; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${window.sanitizarHTML(itemObj.nombre)}</div>`;
      estilo = `grid-area: ${slot.area}; background: rgba(37,211,102,0.1); border: 1px solid rgba(37,211,102,0.4); border-radius: 6px; padding: 5px; text-align: center; cursor: pointer; min-height: 50px; display: flex; flex-direction: column; align-items: center; justify-content: center;`;
    }
    html += `<div style="${estilo}" title="Ranura: ${slot.label}" onclick="window.desequiparRanuraRPG('${key}')">${contenido}</div>`;
  }
  grid.innerHTML = html;
};

window.desequiparRanuraRPG = function(ranuraKey) {
  if (gamerProfile.equipo && gamerProfile.equipo[ranuraKey]) {
    gamerProfile.equipo[ranuraKey] = null; window.guardarProgresoRPG(); window.mostrarTextoFlotante('Desequipado', '#ffaa00');
  }
};

window.renderizarInventarioRPG = function() {
  let cont = document.getElementById('rpgContenedorInventario'); if(!cont) return;
  cont.style.cssText = `display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; max-height: 380px; overflow-y: auto; padding-right: 4px;`;
  cont.innerHTML = "";

  if(!gamerProfile.inventario) gamerProfile.inventario = [];
  let cantMateriales = gamerProfile.inventario.filter(i => (i.tipo || '').toLowerCase() === 'material').length;
  let lblMat = document.getElementById('rpgTotalMateriales'); if(lblMat) lblMat.innerText = cantMateriales;

  if (gamerProfile.inventario.length === 0) { cont.innerHTML = "<div style='grid-column: 1/-1; color: var(--text-muted); text-align: center; font-size: 0.85em; padding: 15px;'>Mochila vacía. ¡Explora las mazmorras o mina recursos!</div>"; return; }

  gamerProfile.inventario.forEach((item) => {
    let ranuraEquipada = null;
    if (gamerProfile.equipo) { for (let r in gamerProfile.equipo) { if (gamerProfile.equipo[r] === item.uid_inventario) { ranuraEquipada = r; break; } } }
    let isEquipped = ranuraEquipada !== null; let tipoLower = (item.tipo || '').toLowerCase();
    
    let icono = item.imgUrl ? `<img src="${item.imgUrl}" alt="${window.sanitizarHTML(item.nombre)}" style="width: 36px; height: 36px; object-fit: contain; image-rendering: pixelated; margin-bottom: 4px;">` : (tipoLower === 'material' ? "💎" : (tipoLower === 'consumible' ? "🧪" : "🗡️"));
    let accionClick = ""; let estiloCursor = "cursor: default;"; let infoExtra = "";

    if (tipoLower === 'consumible') { accionClick = `window.usarConsumibleRPG('${item.uid_inventario}')`; estiloCursor = "cursor: pointer;"; infoExtra = `<span style="color:#ff3366; font-size: 0.65em;">Usar poción</span>`; } 
    else if (item.ranura && item.ranura !== 'ninguna') { accionClick = `window.equiparItemRPG('${item.uid_inventario}')`; estiloCursor = "cursor: pointer;"; infoExtra = `<span style="font-size: 0.65em; color: ${isEquipped ? '#25d366' : 'var(--text-muted)'};">${isEquipped ? 'EQUIPADO' : 'ATK+'+(item.atk||0)+' | DEF+'+(item.def||0)}</span>`; } 
    else { infoExtra = `<span style="color:#b000ff; font-size: 0.65em;">Material de Forja</span>`; }

    let tokensVenta = item.rareza === 'SSR' ? 50 : (item.rareza === 'SR' ? 20 : (item.rareza === 'R' ? 8 : 2)); if(tipoLower === 'material') tokensVenta = 3;
    let btnVenderHtml = `<button onclick="event.stopPropagation(); window.venderItemRPG('${item.uid_inventario}', ${tokensVenta})" style="background: rgba(255,170,0,0.15); border: 1px solid rgba(255,170,0,0.4); color: #ffaa00; border-radius: 4px; padding: 2px 6px; font-size: 0.6em; cursor: pointer; margin-top: 4px; font-family: 'Chakra Petch', sans-serif;"><i class="fas fa-coins"></i> Vender (+${tokensVenta})</button>`;
    let bordeColor = isEquipped ? 'rgba(37,211,102,0.6)' : 'var(--glass-border)';

    cont.innerHTML += `
      <div style="${estiloCursor} background: rgba(0,0,0,0.45); border: 1px solid ${bordeColor}; border-radius: 8px; padding: 8px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: space-between; transition: all 0.2s ease;" onclick="${accionClick}">
        <div>
          <div style="height: 40px; display: flex; align-items: center; justify-content: center;">${icono}</div>
          <div class="rareza-${item.rareza}" style="font-weight: bold; font-size: 0.75em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${window.sanitizarHTML(item.nombre)}</div>
          <div style="margin-top: 2px;">${infoExtra}</div>
        </div>
        <div>${btnVenderHtml}</div>
      </div>`;
  });
};

window.equiparItemRPG = function(uid_inventario) {
  let item = gamerProfile.inventario.find(i => i.uid_inventario === uid_inventario); if (!item) return;
  let ranuraDestino = item.ranura; if (!ranuraDestino || ranuraDestino === 'ninguna') return alert("Este objeto no se puede equipar.");
  if (gamerProfile.equipo[ranuraDestino] === uid_inventario) { gamerProfile.equipo[ranuraDestino] = null; window.mostrarTextoFlotante('Desequipado', '#ffaa00'); } 
  else { gamerProfile.equipo[ranuraDestino] = uid_inventario; window.mostrarTextoFlotante(`Equipado en ${ranuraDestino.toUpperCase()}`, '#25d366'); }
  window.guardarProgresoRPG();
};

window.usarConsumibleRPG = function(uid_inventario) {
  let idx = gamerProfile.inventario.findIndex(i => i.uid_inventario === uid_inventario); if(idx === -1) return; let item = gamerProfile.inventario[idx];
  gamerProfile.stats.hp += (item.hpBonus || 25); gamerProfile.inventario.splice(idx, 1); window.guardarProgresoRPG(); window.mostrarTextoFlotante(`¡Usaste ${item.nombre}! +HP`, '#ff3366');
};

window.venderItemRPG = function(uid_inventario, tokensGanados) {
  let index = gamerProfile.inventario.findIndex(i => i.uid_inventario === uid_inventario); if(index === -1) return;
  if (gamerProfile.equipo) { for (let r in gamerProfile.equipo) { if (gamerProfile.equipo[r] === uid_inventario) gamerProfile.equipo[r] = null; } }
  gamerProfile.inventario.splice(index, 1); gamerProfile.tokens = (gamerProfile.tokens || 0) + tokensGanados;
  window.guardarProgresoRPG(); window.mostrarTextoFlotante(`+${tokensGanados} Tokens 🪙`, '#ffaa00');
  try{ confetti({ particleCount: 25, spread: 40, colors: ['#ffaa00', '#ffd700'] }); }catch(e){}
};

window.entrenarStatRPG = function(stat) {
  let costo = 10; if((gamerProfile.tokens || 0) < costo) return alert("No tienes suficientes Tokens (cuestan 10)."); gamerProfile.tokens -= costo;
  if(stat === 'hp') { gamerProfile.stats.hp += 10; window.mostrarTextoFlotante('+10 HP', '#ff3366'); } else if(stat === 'atk') { gamerProfile.stats.atk += 2; window.mostrarTextoFlotante('+2 ATK', '#ffaa00'); } else if(stat === 'def') { gamerProfile.stats.def += 2; window.mostrarTextoFlotante('+2 DEF', '#00e5ff'); }
  window.guardarProgresoRPG();
};

// ==========================================
// MOTOR DE DROPS PONDERADOS (WEIGHTED RNG)
// ==========================================
function calcularDropConPesos(nombresDrops) {
    let posibles = nombresDrops.map(nombre => rpgObjetosGlobal.find(o => o.nombre === nombre)).filter(Boolean);
    if(posibles.length === 0) return null;
    
    let pesoTotal = posibles.reduce((sum, item) => sum + item.pesoDrop, 0);
    let random = Math.random() * pesoTotal;
    let acumulado = 0;
    
    for(let i = 0; i < posibles.length; i++) {
        acumulado += posibles[i].pesoDrop;
        if(random <= acumulado) return posibles[i];
    }
    return posibles[0];
}

// ==========================================
// MOTOR DE CAZA Y MINERÍA PROGRESIVA
// ==========================================
window.cazarEnZona = function(zonaId) {
    let zona = zonasCaza[zonaId];
    if (gamerProfile.xp < zona.xpReq) {
        document.getElementById('rpgResultadoGremio').innerHTML = `<span style="color:#ff3366;"><i class="fas fa-lock"></i> Nivel muy bajo. Necesitas ${zona.xpReq} XP para cazar aquí.</span>`;
        return;
    }

    let ahora = Date.now();
    let cooldownTime = 2 * 60 * 1000; 
    let keyCooldown = 'sakura_cooldown_caza'; 
    let ultimoUso = localStorage.getItem(keyCooldown) || 0;

    if (ahora - ultimoUso < cooldownTime) {
        let faltanSec = Math.ceil((cooldownTime - (ahora - ultimoUso)) / 1000); 
        document.getElementById('rpgResultadoGremio').innerHTML = `<span style="color:#ff3366;"><i class="fas fa-hourglass-half"></i> Descansa. Faltan ${Math.floor(faltanSec / 60)}m ${faltanSec % 60}s.</span>`;
        return;
    }

    let rngDrop = Math.random() * 100;
    let msj = `Cazaste con éxito en <strong>${zona.nombre}</strong>.`;

    if (rngDrop <= zona.probDrop) {
        let itemDB = calcularDropConPesos(zona.drops);
        if (itemDB) {
            gamerProfile.inventario.push({ ...itemDB, uid_inventario: 'loot_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) });
            msj += `<br>¡Botín: <strong class="rareza-${itemDB.rareza}">${window.sanitizarHTML(itemDB.nombre)}</strong>!`;
        }
    }

    localStorage.setItem(keyCooldown, ahora);
    gamerProfile.tokens = (gamerProfile.tokens || 0) + zona.tokGana; 
    gamerProfile.xp = (gamerProfile.xp || 0) + zona.xpGana; 
    window.guardarProgresoRPG();
    
    window.mostrarTextoFlotante(`+${zona.xpGana} XP`, '#25d366');
    document.getElementById('rpgResultadoGremio').innerHTML = `<span style="color:var(--secondary-color);">${msj}</span><br><span style="color:#25d366; font-size:0.85em;">+${zona.xpGana} XP | +${zona.tokGana} Tokens</span>`;
};

window.minar = function() {
    let ahora = Date.now();
    let cooldownTime = 3 * 60 * 1000; 
    let keyCooldown = 'sakura_cooldown_minar'; 
    let ultimoUso = localStorage.getItem(keyCooldown) || 0;

    if (ahora - ultimoUso < cooldownTime) {
        let faltanSec = Math.ceil((cooldownTime - (ahora - ultimoUso)) / 1000); 
        document.getElementById('rpgResultadoGremio').innerHTML = `<span style="color:#ff3366;"><i class="fas fa-hourglass-half"></i> Descansa. Faltan ${Math.floor(faltanSec / 60)}m ${faltanSec % 60}s para volver a picar.</span>`;
        return;
    }

    let rng = Math.random() * 100;
    let msj = "Picas piedra, pero solo sacas escombros inútiles.";
    
    if (rng < 65) { 
        let matGanado = calcularDropConPesos(lootMineria);
        if (matGanado) {
            gamerProfile.inventario.push({ ...matGanado, uid_inventario: 'mat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) });
            msj = `¡Minaste con éxito: <strong class="rareza-${matGanado.rareza}">${window.sanitizarHTML(matGanado.nombre)}</strong>!`; 
        }
    }

    localStorage.setItem(keyCooldown, ahora);
    gamerProfile.tokens = (gamerProfile.tokens || 0) + 3; 
    gamerProfile.xp = (gamerProfile.xp || 0) + 15; 
    window.guardarProgresoRPG();
    
    window.mostrarTextoFlotante(`+15 XP`, '#25d366');
    document.getElementById('rpgResultadoGremio').innerHTML = `<span style="color:var(--secondary-color);">${msj}</span><br><span style="color:#25d366; font-size:0.85em;">+15 XP | +3 Tokens</span>`;
};

window.entrarMazmorraRPG = function(zonaId) {
  let mazmorra = mazmorras[zonaId];
  if(!mazmorra) return;

  let ahora = Date.now();
  let cooldownTime = 5 * 60 * 1000;
  let keyCooldown = 'sakura_cooldown_mazmorra_global';
  let ultimoUso = localStorage.getItem(keyCooldown) || 0;
  let log = document.getElementById('rpgResultadoGremio');

  if (ahora - ultimoUso < cooldownTime) {
    let faltanSec = Math.ceil((cooldownTime - (ahora - ultimoUso)) / 1000);
    log.innerHTML = `<span style="color:#ffaa00;"><i class="fas fa-campground"></i> Grupo descansando. Podrás entrar en ${Math.floor(faltanSec / 60)}m ${faltanSec % 60}s.</span>`;
    return;
  }

  let extraAtk = 0; let extraDef = 0;
  for (let r in gamerProfile.equipo) {
    let uid = gamerProfile.equipo[r];
    if(uid) { let it = gamerProfile.inventario.find(i => i.uid_inventario === uid); if(it) { extraAtk += (it.atk || 0); extraDef += (it.def || 0); } }
  }
  let poder = gamerProfile.stats.atk + extraAtk + gamerProfile.stats.def + extraDef;

  log.innerHTML = `<span style="color:#00e5ff;"><i class="fas fa-walking"></i> Explorando ${mazmorra.nombre}...</span>`;
  localStorage.setItem(keyCooldown, ahora);

  setTimeout(() => {
    if(poder >= mazmorra.poderReq) {
      let premioTxt = "Oro y Experiencia";

      let rngDrop = Math.random() * 100;
      if(rngDrop <= mazmorra.probDrop) {
        let lootItemDB = calcularDropConPesos(mazmorra.drops);
        if(lootItemDB) {
           gamerProfile.inventario.push({ ...lootItemDB, uid_inventario: 'loot_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) });
           premioTxt = `<span class="rareza-${lootItemDB.rareza}">${window.sanitizarHTML(lootItemDB.nombre)}</span>`;
        }
      }

      gamerProfile.xp = (gamerProfile.xp || 0) + mazmorra.xpGana;
      gamerProfile.tokens = (gamerProfile.tokens || 0) + mazmorra.tokGana;
      window.guardarProgresoRPG();

      window.mostrarTextoFlotante(`+${mazmorra.xpGana} XP`, '#25d366');
      log.innerHTML = `<span style="color:#25d366;"><i class="fas fa-check-circle"></i> ¡Expedición Exitosa en ${mazmorra.nombre}!</span><br>Loot obtenido: <strong>${premioTxt}</strong><br><span style="font-size:0.8em; color:var(--text-muted);">+${mazmorra.xpGana} XP | +${mazmorra.tokGana} Tokens</span>`;
      try{ confetti({ particleCount: 70, spread: 70 }); }catch(e){}
    } else {
      let perdida = Math.floor(mazmorra.xpGana / 2);
      gamerProfile.xp -= perdida; if(gamerProfile.xp < 0) gamerProfile.xp = 0;
      window.guardarProgresoRPG();
      window.mostrarTextoFlotante(`-${perdida} XP`, '#ff3366');
      log.innerHTML = `<span style="color:#ff3366;"><i class="fas fa-skull"></i> Derrota en ${mazmorra.nombre} (${poder}/${mazmorra.poderReq} Poder).</span><br><span style="font-size:0.8em;">Perdiste <strong style="color:#ffaa00;">${perdida} XP</strong>. ¡Mejora tu equipo!</span>`;
    }
  }, 1500);
};

// ==========================================
// FRAGUA OPTIMIZADA CON COSTOS BASE DE DATOS
// ==========================================
window.renderizarFraguaRPG = function() {
  let cont = document.getElementById('listaRecetasFragua'); if(!cont) return;
  let armas = rpgObjetosGlobal.filter(o => (o.tipo || '').toLowerCase() === 'arma');
  
  if(armas.length === 0) { cont.innerHTML = "<p style='color: var(--text-muted); font-size: 0.85em; text-align: center;'>No hay recetas en el servidor.</p>"; return; }

  let cantMat = gamerProfile.inventario.filter(i => (i.tipo || '').toLowerCase() === 'material').length;
  let html = "";
  
  armas.forEach(a => {
    let costoMat = a.costoMat;
    let costoTok = a.costoTok;

    let puede = cantMat >= costoMat && (gamerProfile.tokens || 0) >= costoTok;
    let thumb = a.imgUrl ? `<img src="${a.imgUrl}" style="width: 28px; height: 28px; object-fit: contain; image-rendering: pixelated; margin-right: 6px;">` : `🗡️`;

    html += `
      <div style="background: rgba(0,0,0,0.4); border: 1px solid var(--glass-border); border-radius: 6px; padding: 10px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center;">
          ${thumb}
          <div>
            <div class="rpg-item-name rareza-${a.rareza}" style="font-size: 0.85em; font-weight: bold;">${window.sanitizarHTML(a.nombre)}</div>
            <div style="font-size: 0.7em; color: var(--text-muted);">ATK +${a.atk} | DEF +${a.def}</div>
            <div style="font-size: 0.7em; font-weight: bold; color: ${puede ? 'var(--secondary-color)' : '#ff3366'};">Req: ${costoMat} 💎 | ${costoTok} 🪙</div>
          </div>
        </div>
        <button class="btn-comprar" style="margin: 0; padding: 6px 12px; font-size: 0.75em; background: ${puede ? '#ff5500' : 'rgba(255,255,255,0.1);'};" onclick="window.forjarItemRPG('${a.id}', ${costoMat}, ${costoTok})" ${!puede ? 'disabled' : ''}>Forjar</button>
      </div>`;
  });
  cont.innerHTML = html;
};

window.forjarItemRPG = function(idArma, costoMat, costoTok) {
  let cantMat = gamerProfile.inventario.filter(i => (i.tipo || '').toLowerCase() === 'material').length;
  if(cantMat < costoMat || (gamerProfile.tokens || 0) < costoTok) return alert("Recursos insuficientes.");
  let arma = rpgObjetosGlobal.find(o => o.id === idArma); if(!arma) return;

  gamerProfile.tokens -= costoTok;
  let borrados = 0;
  gamerProfile.inventario = gamerProfile.inventario.filter(i => { if((i.tipo || '').toLowerCase() === 'material' && borrados < costoMat) { borrados++; return false; } return true; });
  gamerProfile.inventario.push({ ...arma, uid_inventario: 'forj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) });

  window.guardarProgresoRPG();
  alert(`¡Has forjado: ${arma.nombre}!`);
};

window.sanitizarHTML = function(str) { 
  if (!str) return ''; 
  return String(str).replace(/[&<>"']/g, function(m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]; }); 
};

window.addEventListener('DOMContentLoaded', () => { window.renderizarTodoRPG(); });
