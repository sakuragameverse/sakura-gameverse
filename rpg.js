import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
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
let gamerProfile = JSON.parse(localStorage.getItem('sakura_gamer_profile')) || { 
  tag: "GamerOtaku_VE", 
  xp: 150, 
  tokens: 0, 
  rango: "Genin", 
  profesion: "", 
  stats: { hp: 100, atk: 10, def: 5 },
  inventario: [],
  equipo: { cabeza: null, pecho: null, piernas: null, pies: null, mano_derecha: null, mano_izquierda: null, amuleto: null, anillo: null, mascota: null }
};

window.mostrarTextoFlotante = function(texto, color) {
    let el = document.createElement('div');
    el.className = 'floating-text';
    el.style.color = color;
    el.style.left = '50%';
    el.style.top = '40%';
    el.innerHTML = texto;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
};

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUserUid = user.uid;
    await window.descargarProgresoNube(user.uid);
  } else {
    currentUserUid = null;
    window.renderizarTodoRPG();
  }
});

window.descargarProgresoNube = async function(uid) {
    try {
        const docRef = doc(db, "jugadores_cloud", uid); 
        const snap = await getDoc(docRef);
        if(snap.exists()) {
            const d = snap.data();
            if(d.profile) {
                gamerProfile = d.profile;
                if (!gamerProfile.equipo) {
                  gamerProfile.equipo = { cabeza: null, pecho: null, piernas: null, pies: null, mano_derecha: null, mano_izquierda: null, amuleto: null, anillo: null, mascota: null };
                }
            }
            localStorage.setItem('sakura_gamer_profile', JSON.stringify(gamerProfile));
        }
        window.renderizarTodoRPG();
    } catch(e) { console.warn("Error cargando perfil RPG:", e); }
};

window.guardarProgresoRPG = async function() {
    localStorage.setItem('sakura_gamer_profile', JSON.stringify(gamerProfile));
    if(currentUserUid) {
        try { 
            await setDoc(doc(db, "jugadores_cloud", currentUserUid), { profile: gamerProfile, updatedAt: Date.now() }, { merge: true }); 
        } catch(e) { console.warn("Error guardando nube RPG:", e); }
    }
    window.renderizarTodoRPG();
};

window.renderizarTodoRPG = function() {
  document.getElementById('rpgPerfilTag').innerText = gamerProfile.tag || "Aventurero";
  document.getElementById('rpgPerfilClase').innerText = gamerProfile.profesion || "Sin Clase";
  document.getElementById('rpgPerfilTokens').innerHTML = `<i class="fas fa-coins"></i> ${gamerProfile.tokens || 0} Tokens`;
  document.getElementById('rpgPerfilXp').innerText = `${gamerProfile.xp || 0} XP`;

  let extraAtk = 0; 
  let extraDef = 0;
  
  if (gamerProfile.equipo && gamerProfile.inventario) {
    for (let ranura in gamerProfile.equipo) {
      let uidItem = gamerProfile.equipo[ranura];
      if (uidItem) {
        let item = gamerProfile.inventario.find(i => i.uid_inventario === uidItem);
        if (item) {
          extraAtk += (item.atk || 0);
          extraDef += (item.def || 0);
        }
      }
    }
  }

  document.getElementById('rpgStatHp').innerText = gamerProfile.stats?.hp || 100;
  document.getElementById('rpgStatAtk').innerText = (gamerProfile.stats?.atk || 10) + (extraAtk > 0 ? ` (+${extraAtk})` : '');
  document.getElementById('rpgStatDef').innerText = (gamerProfile.stats?.def || 5) + (extraDef > 0 ? ` (+${extraDef})` : '');

  window.renderizarPaperDollGrande();
  window.renderizarInventarioRPG();
};

window.renderizarPaperDollGrande = function() {
  let grid = document.getElementById('paperDollGrid');
  if(!grid) return;

  let ranurasConfig = [
    { key: 'cabeza', label: 'Cabeza', icon: '🪖' },
    { key: 'amuleto', label: 'Amuleto', icon: '📿' },
    { key: 'pecho', label: 'Pecho', icon: '🛡️' },
    { key: 'mano_derecha', label: 'Mano Der.', icon: '🗡️' },
    { key: 'mano_izquierda', label: 'Mano Izq.', icon: '🛡️' },
    { key: 'anillo', label: 'Anillo', icon: '💍' },
    { key: 'piernas', label: 'Piernas', icon: '👖' },
    { key: 'pies', label: 'Pies', icon: '🥾' },
    { key: 'mascota', label: 'Mascota', icon: '🐾' }
  ];

  let html = "";
  ranurasConfig.forEach(slot => {
    let uidItemEquipado = gamerProfile.equipo?.[slot.key];
    let itemObj = uidItemEquipado ? gamerProfile.inventario.find(i => i.uid_inventario === uidItemEquipado) : null;
    
    let contenido = `<div style="font-size: 1.5em; margin-bottom: 2px;">${slot.icon}</div><div style="font-size: 0.7em; color: var(--text-muted);">${slot.label}</div>`;
    let estilo = "background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px; text-align: center; cursor: pointer; min-height: 75px; display: flex; flex-direction: column; align-items: center; justify-content: center;";
    
    if (itemObj) {
      let imgThumb = itemObj.imgUrl ? `<img src="${itemObj.imgUrl}" style="width: 32px; height: 32px; object-fit: contain; image-rendering: pixelated; margin-bottom: 2px;">` : `<div style="font-size: 1.5em;">${slot.icon}</div>`;
      contenido = `${imgThumb}<div style="font-size: 0.65em; color: #25d366; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${window.sanitizarHTML(itemObj.nombre)}</div>`;
      estilo = "background: rgba(37,211,102,0.1); border: 1px solid rgba(37,211,102,0.4); border-radius: 8px; padding: 10px; text-align: center; cursor: pointer; min-height: 75px; display: flex; flex-direction: column; align-items: center; justify-content: center;";
    }

    html += `<div style="${estilo}" title="Ranura: ${slot.label}" onclick="window.desequiparRanuraRPG('${slot.key}')">${contenido}</div>`;
  });

  grid.innerHTML = html;
};

window.desequiparRanuraRPG = function(ranuraKey) {
  if (gamerProfile.equipo && gamerProfile.equipo[ranuraKey]) {
    gamerProfile.equipo[ranuraKey] = null;
    window.guardarProgresoRPG();
    window.mostrarTextoFlotante('Desequipado', '#ffaa00');
  }
};

window.renderizarInventarioRPG = function() {
  let cont = document.getElementById('rpgContenedorInventario');
  if(!cont) return;
  cont.innerHTML = "";

  if(!gamerProfile.inventario) gamerProfile.inventario = [];
  
  let cantMateriales = gamerProfile.inventario.filter(i => i.tipo === 'material').length;
  document.getElementById('rpgTotalMateriales').innerText = cantMateriales;

  if (gamerProfile.inventario.length === 0) {
    cont.innerHTML = "<div style='grid-column: 1/-1; color: var(--text-muted); text-align: center; font-size: 0.85em;'>Tu mochila está vacía. Visita la tienda o mazmorras.</div>";
    return;
  }

  gamerProfile.inventario.forEach((item) => {
    let ranuraEquipada = null;
    if (gamerProfile.equipo) {
      for (let r in gamerProfile.equipo) {
        if (gamerProfile.equipo[r] === item.uid_inventario) { ranuraEquipada = r; break; }
      }
    }
    
    let isEquipped = ranuraEquipada !== null;
    let cl = isEquipped ? 'rpg-item-card equipped' : 'rpg-item-card';
    
    let icono = item.imgUrl ? `<img src="${item.imgUrl}" alt="${window.sanitizarHTML(item.nombre)}">` : (item.tipo === 'material' ? "💎" : "🗡️");
    let accionClick = (item.ranura && item.ranura !== 'ninguna') ? `window.equiparItemRPG('${item.uid_inventario}')` : ``;
    let estiloCursor = (item.ranura && item.ranura !== 'ninguna') ? 'cursor: pointer;' : 'cursor: default; opacity: 0.85;';
    
    let infoExtra = (item.ranura && item.ranura !== 'ninguna') ? 
      `ATK +${item.atk || 0} | DEF +${item.def || 0}<br><div style="font-size: 0.7em; margin-top: 4px; color: ${isEquipped ? '#25d366' : '#888'};">${isEquipped ? 'EQUIPADO ('+ranuraEquipada.toUpperCase()+')' : 'Click para equipar'}</div>` : 
      `<span style="color:#b000ff">Material</span>`;

    let tokensVenta = item.rareza === 'SSR' ? 50 : (item.rareza === 'SR' ? 20 : (item.rareza === 'R' ? 8 : 2));
    if(item.tipo === 'material') tokensVenta = 3;

    let btnVenderHtml = `<button onclick="event.stopPropagation(); window.venderItemRPG('${item.uid_inventario}', ${tokensVenta})" style="background: rgba(255,170,0,0.15); border: 1px solid rgba(255,170,0,0.4); color: #ffaa00; border-radius: 4px; padding: 3px 8px; font-size: 0.7em; cursor: pointer; margin-top: 6px; font-family: 'Chakra Petch', sans-serif;"><i class="fas fa-coins"></i> Vender (+${tokensVenta})</button>`;

    cont.innerHTML += `
      <div class="${cl}" style="${estiloCursor}; background: rgba(0,0,0,0.4); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); padding: 10px; text-align: center;" onclick="${accionClick}">
        <div style="font-size: 2em; margin-bottom: 5px;">${icono}</div>
        <div class="rpg-item-name rareza-${item.rareza}" style="font-weight: bold; font-size: 0.9em;">${window.sanitizarHTML(item.nombre)}</div>
        <div class="rpg-item-stats" style="font-size: 0.75em; color: var(--text-muted); margin-top: 4px;">${infoExtra}${btnVenderHtml}</div>
      </div>`;
  });
};

window.equiparItemRPG = function(uid_inventario) {
  let item = gamerProfile.inventario.find(i => i.uid_inventario === uid_inventario);
  if (!item) return;

  let ranuraDestino = item.ranura;
  if (!ranuraDestino || ranuraDestino === 'ninguna') return alert("Este objeto no se puede equipar.");

  if (gamerProfile.equipo[ranuraDestino] === uid_inventario) {
    gamerProfile.equipo[ranuraDestino] = null;
    window.mostrarTextoFlotante('Desequipado', '#ffaa00');
  } else {
    gamerProfile.equipo[ranuraDestino] = uid_inventario;
    window.mostrarTextoFlotante(`Equipado en ${ranuraDestino.toUpperCase()}`, '#25d366');
  }

  window.guardarProgresoRPG();
};

window.venderItemRPG = function(uid_inventario, tokensGanados) {
  let index = gamerProfile.inventario.findIndex(i => i.uid_inventario === uid_inventario);
  if(index === -1) return;

  if (gamerProfile.equipo) {
    for (let r in gamerProfile.equipo) {
      if (gamerProfile.equipo[r] === uid_inventario) gamerProfile.equipo[r] = null;
    }
  }

  gamerProfile.inventario.splice(index, 1);
  gamerProfile.tokens = (gamerProfile.tokens || 0) + tokensGanados;

  window.guardarProgresoRPG();
  window.mostrarTextoFlotante(`+${tokensGanados} Tokens 🪙`, '#ffaa00');
  try{ confetti({ particleCount: 25, spread: 40, colors: ['#ffaa00', '#ffd700'] }); }catch(e){}
};

window.sanitizarHTML = function(str) { 
  if (!str) return ''; 
  return String(str).replace(/[&<>"']/g, function(m) { 
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]; 
  }); 
};

window.addEventListener('DOMContentLoaded', () => {
  window.renderizarTodoRPG();
});
