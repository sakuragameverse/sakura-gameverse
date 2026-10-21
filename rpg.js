import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const firebaseConfig = { apiKey: "AIzaSyDH1DZqaIi5sKRXspXDUWbMUZ4nr5JIy8Q", authDomain: "sakura-gameverse.firebaseapp.com", projectId: "sakura-gameverse", storageBucket: "sakura-gameverse.firebasestorage.app", messagingSenderId: "226328425516", appId: "1:226328425516:web:8dc11761639228c6120d89" };
const app = initializeApp(firebaseConfig); const db = getFirestore(app); const auth = getAuth(app);
let currentUserUid = null; let rpgObjetosGlobal = []; let gamerProfile = {}; let escuchadorRumble = null;

onAuthStateChanged(auth, async (user) => {
  if (user) { 
      currentUserUid = user.uid; 
      document.getElementById('pantallaAuthRPG').style.display = 'none'; document.getElementById('contenidoJuegoRPG').style.display = 'block';
      await window.descargarProgresoNube(user.uid); 
      iniciarEscuchadorRumble();
  } else { 
      currentUserUid = null; gamerProfile = {}; 
      document.getElementById('pantallaAuthRPG').style.display = 'flex'; document.getElementById('contenidoJuegoRPG').style.display = 'none';
      if(escuchadorRumble) { escuchadorRumble(); escuchadorRumble = null; }
  }
  await window.cargarObjetosRPG();
});

window.toggleRegistroRPG = function() {
    let isLogin = document.getElementById('btnAuthConfirmarReg').style.display === 'none';
    document.getElementById('btnAuthEntrar').style.display = isLogin ? 'none' : 'block'; document.getElementById('btnAuthToggleRegistrar').style.display = isLogin ? 'none' : 'block';
    document.getElementById('btnAuthConfirmarReg').style.display = isLogin ? 'block' : 'none'; document.getElementById('btnAuthVolverLogin').style.display = isLogin ? 'block' : 'none';
    document.getElementById('authErrorMsg').style.display = 'none'; document.getElementById('authSubtitle').innerText = isLogin ? "Crea tu Nickname para registrarte" : "Ingresa tu Nickname para continuar";
};

window.iniciarSesionRPG = async function() {
    let nick = document.getElementById('authNick').value.trim(); let pass = document.getElementById('authPass').value; let errBox = document.getElementById('authErrorMsg');
    if(!nick || !pass) return; let emailAUsar = nick.includes('@') ? nick : nick.toLowerCase() + "@sakura.game";
    document.getElementById('btnAuthEntrar').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conectando...';
    try { await signInWithEmailAndPassword(auth, emailAUsar, pass); } catch(e) { errBox.innerText = "Credenciales incorrectas."; errBox.style.display = 'block'; document.getElementById('btnAuthEntrar').innerHTML = 'Despertar'; }
};

window.crearCuentaRPG = async function() {
    let nick = document.getElementById('authNick').value.trim(); let pass = document.getElementById('authPass').value; let errBox = document.getElementById('authErrorMsg');
    if(!nick || !pass) { errBox.innerText = "Llenar campos."; errBox.style.display = 'block'; return; }
    if(nick.includes('@') || nick.toLowerCase() === "gamerotaku_ve" || nick.toLowerCase().includes("admin")) { errBox.innerText = "Nombre reservado o inválido."; errBox.style.display = 'block'; return; }

    document.getElementById('btnAuthConfirmarReg').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
    try {
        const tagSnap = await getDocs(query(collection(db, "jugadores_cloud"), where("profile.tag", "==", nick)));
        if(!tagSnap.empty) { errBox.innerText = "Nickname en uso."; errBox.style.display = 'block'; document.getElementById('btnAuthConfirmarReg').innerHTML = 'Crear Personaje'; return; }
        let fakeEmail = nick.toLowerCase() + "@sakura.game"; const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, pass);
        let perfilInicial = { tag: nick, xp: 0, tokens: 0, rango: "Genin", profesion: "Sin Clase", stats: { hpMax: 100, hpActual: 100, energiaMax: 100, energiaActual: 100, ultimaEnergia: Date.now(), atk: 10, def: 5 }, inventario: [], equipo: {}, cooldowns: {} };
        await setDoc(doc(db, "jugadores_cloud", userCredential.user.uid), { profile: perfilInicial, updatedAt: Date.now() });
    } catch(e) { errBox.innerText = "Error de red."; errBox.style.display = 'block'; document.getElementById('btnAuthConfirmarReg').innerHTML = 'Crear Personaje'; }
};

window.cerrarSesionRPG = async function() { if(confirm("¿Quieres desconectarte?")) { await signOut(auth); localStorage.removeItem('sakura_gamer_profile'); window.location.reload(); } };

function inicializarStatsYMigrar() {
    if(!gamerProfile.stats) return; 
    if (typeof gamerProfile.stats.hp === 'number') { gamerProfile.stats.hpMax = gamerProfile.stats.hp; gamerProfile.stats.hpActual = gamerProfile.stats.hp; delete gamerProfile.stats.hp; }
    if (!gamerProfile.stats.hpMax) { gamerProfile.stats.hpMax = 100; gamerProfile.stats.hpActual = 100; }
    if (!gamerProfile.stats.energiaMax) { gamerProfile.stats.energiaMax = 100; gamerProfile.stats.energiaActual = 100; gamerProfile.stats.ultimaEnergia = Date.now(); }
    if (!gamerProfile.cooldowns) { gamerProfile.cooldowns = {}; }
    if (!gamerProfile.profesion || gamerProfile.profesion === "Ninguna") { gamerProfile.profesion = "Sin Clase"; }
    if(gamerProfile.inventario) {
        let inventarioLimpio = [];
        gamerProfile.inventario.forEach(item => {
            let tipo = (item.tipo || '').toLowerCase();
            if (tipo === 'material' || tipo === 'consumible') { let existente = inventarioLimpio.find(i => i.nombre === item.nombre); if (existente) { existente.cantidad = (existente.cantidad || 1) + (item.cantidad || 1); } else { item.cantidad = item.cantidad || 1; inventarioLimpio.push(item); } } 
            else { item.cantidad = 1; inventarioLimpio.push(item); }
        });
        gamerProfile.inventario = inventarioLimpio;
    }
}

window.agregarItemInventario = function(itemObj, cantidadAdd = 1) {
    let tipo = (itemObj.tipo || '').toLowerCase(); let esApilable = (tipo === 'material' || tipo === 'consumible');
    if (esApilable) { let existente = gamerProfile.inventario.find(i => i.nombre === itemObj.nombre); if (existente) { existente.cantidad = (existente.cantidad || 1) + cantidadAdd; return; } }
    itemObj.cantidad = cantidadAdd; if (!itemObj.uid_inventario) itemObj.uid_inventario = 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7); gamerProfile.inventario.push(itemObj);
};

window.consumirMaterialesPorCantidadGlobal = function(cantidadNecesaria) {
    let consumidos = 0;
    for (let i = 0; i < gamerProfile.inventario.length; i++) {
        let item = gamerProfile.inventario[i];
        if ((item.tipo || '').toLowerCase() === 'material') { let disp = item.cantidad || 1; let aTomar = Math.min(disp, cantidadNecesaria - consumidos); item.cantidad -= aTomar; consumidos += aTomar; if (consumidos >= cantidadNecesaria) break; }
    }
    gamerProfile.inventario = gamerProfile.inventario.filter(i => i.cantidad > 0);
};

// ==========================================
// NUEVO: SISTEMA DE REGENERACIÓN PASIVA (HP y ENERGÍA)
// ==========================================
function actualizarEnergiaPasiva() {
    if(!gamerProfile.stats) return; 
    let ahora = Date.now(); 
    let tiempoPasado = ahora - (gamerProfile.stats.ultimaEnergia || ahora); 
    let minutosPasados = Math.floor(tiempoPasado / 60000); 

    let limiteEnergia = gamerProfile.stats.energiaMax + (gamerProfile.profesion === 'Mago' ? 30 : 0);
    let limiteHp = gamerProfile.stats.hpMax;

    if (minutosPasados > 0) {
        let actualizo = false;
        
        // Recupera +1 de Energía por minuto
        if (gamerProfile.stats.energiaActual < limiteEnergia) { 
            gamerProfile.stats.energiaActual += minutosPasados; 
            if (gamerProfile.stats.energiaActual > limiteEnergia) gamerProfile.stats.energiaActual = limiteEnergia; 
            actualizo = true;
        } 
        
        // Recupera +2 de HP por minuto
        if (gamerProfile.stats.hpActual < limiteHp) {
            gamerProfile.stats.hpActual += (minutosPasados * 2);
            if (gamerProfile.stats.hpActual > limiteHp) gamerProfile.stats.hpActual = limiteHp;
            actualizo = true;
        }

        if (actualizo) {
            gamerProfile.stats.ultimaEnergia += minutosPasados * 60000; 
            window.guardarProgresoRPG();
        } else if (gamerProfile.stats.energiaActual >= limiteEnergia && gamerProfile.stats.hpActual >= limiteHp) { 
            gamerProfile.stats.ultimaEnergia = ahora; 
        }
    }
}

function calcularNivel(xp) { return Math.floor(Math.sqrt((xp || 0) / 20)) + 1; }
function calcularXpNivelActual(nivel) { return Math.pow(nivel - 1, 2) * 20; }
function calcularXpSiguienteNivel(nivel) { return Math.pow(nivel, 2) * 20; }

window.seleccionarClaseRPG = function(clase) { if (confirm(`¿Jurar lealtad al Sendero del ${clase}? Es permanente.`)) { gamerProfile.profesion = clase; document.getElementById('modalElegirClase').style.display = 'none'; window.guardarProgresoRPG(); try{ confetti({ particleCount: 100, spread: 80, colors: ['#ffaa00', '#ffffff'] }); }catch(e){} } };

const zonasCaza = { 'gallinas': { nombre: 'Bosque Menor', reqNivel: 1, gastaHp: 2, gastaEn: 5, xpGana: 5, tokGana: 0, probDrop: 10, drops: ['Poción de Vida Menor'] }, 'vacas': { nombre: 'Llanuras', reqNivel: 3, gastaHp: 5, gastaEn: 10, xpGana: 15, tokGana: 2, probDrop: 20, drops: ['Cuero de Lobo Huargo', 'Poción de Vida Menor'] }, 'goblins': { nombre: 'Campamento Goblin', reqNivel: 4, gastaHp: 10, gastaEn: 15, xpGana: 40, tokGana: 5, probDrop: 30, drops: ['Daga de Bronce', 'Escudo de Madera Robusta'] }, 'gigantes': { nombre: 'Valle Gigantes', reqNivel: 7, gastaHp: 20, gastaEn: 20, xpGana: 100, tokGana: 15, probDrop: 45, drops: ['Espada de Carlin', 'Arco de Madera de Roble'] } };
const mazmorras = { 'facil': { nombre: 'Bosque Slime', poderReq: 40, gastaHp: 15, gastaEn: 25, xpGana: 45, tokGana: 5, probDrop: 40, drops: ['Bendición de la Diosa', 'Cobre'] }, 'media': { nombre: 'Cueva Sangrienta', poderReq: 180, gastaHp: 30, gastaEn: 40, xpGana: 120, tokGana: 12, probDrop: 50, drops: ['Fragmento de Runa de Muerte', 'Katana de Hierro Frío', 'Báculo de Destrucción'] }, 'dificil': { nombre: 'Torre del Dragón', poderReq: 600, gastaHp: 60, gastaEn: 60, xpGana: 350, tokGana: 35, probDrop: 70, drops: ['Elucidator', 'Espada de Dios', 'Armadura de Placas Mágica (MPA)', 'Guadaña del Segador'] } };

window.mostrarTextoFlotante = function(texto, color) { let el = document.createElement('div'); el.className = 'floating-text'; el.style.color = color; el.style.left = '50%'; el.style.top = '40%'; el.innerHTML = texto; document.body.appendChild(el); setTimeout(() => el.remove(), 1500); };

window.cargarObjetosRPG = async function() {
  try {
    const snapsObj = await getDocs(query(collection(db, "rpg_objetos"))); rpgObjetosGlobal = [];
    snapsObj.forEach(d => { 
        let obj = d.data(); 
        rpgObjetosGlobal.push({ 
            id: d.id, nombre: obj.nombre, tipo: (obj.tipo || 'arma').toLowerCase(), rareza: obj.rareza || 'N', 
            ranura: obj.ranura || 'ninguna', atk: obj.stats?.atk || 0, def: obj.stats?.def || 0, imgUrl: obj.imgUrl || '', 
            costoMat: obj.costoMat || 3, costoTok: obj.costoTok || 15, pesoDrop: obj.pesoDrop || 100, nivelReq: obj.nivelReq || 1,
            enBazar: obj.enBazar || false, precioBazar: obj.precioBazar || 0
        }); 
    });
    if(currentUserUid) { window.renderizarFraguaRPG(); window.renderizarHorno(); window.renderizarBazarRPG(); }
  } catch(e) {}
};

window.descargarProgresoNube = async function(uid) {
    try {
        const snap = await getDoc(doc(db, "jugadores_cloud", uid));
        if(snap.exists()) { let d = snap.data(); if(d.profile) { gamerProfile = d.profile; inicializarStatsYMigrar(); if (!gamerProfile.equipo) gamerProfile.equipo = {}; } }
        localStorage.setItem('sakura_gamer_profile', JSON.stringify(gamerProfile)); window.renderizarTodoRPG();
    } catch(e) {}
};

window.guardarProgresoRPG = async function() {
    if(!currentUserUid) return; localStorage.setItem('sakura_gamer_profile', JSON.stringify(gamerProfile));
    try { await setDoc(doc(db, "jugadores_cloud", currentUserUid), { profile: gamerProfile, updatedAt: Date.now() }, { merge: true }); } catch(e) {} window.renderizarTodoRPG();
};

window.obtenerPoderJugador = function() {
  let extraAtk = 0; let extraDef = 0;
  if (gamerProfile.equipo && gamerProfile.inventario) {
    for (let ranura in gamerProfile.equipo) { let uidItem = gamerProfile.equipo[ranura]; if (uidItem) { let item = gamerProfile.inventario.find(i => i.uid_inventario === uidItem); if (item) { let bonoMejoraAtk = (item.nivelMejora || 0) * (item.rareza === 'SSR' ? 20 : item.rareza === 'SR' ? 10 : item.rareza === 'R' ? 5 : 2); let bonoMejoraDef = (item.nivelMejora || 0) * (item.rareza === 'SSR' ? 10 : item.rareza === 'SR' ? 5 : item.rareza === 'R' ? 2 : 1); extraAtk += (item.atk || 0) + bonoMejoraAtk; extraDef += (item.def || 0) + bonoMejoraDef; } } }
  }
  let totalAtk = (gamerProfile.stats?.atk || 10) + extraAtk; let totalDef = (gamerProfile.stats?.def || 5) + extraDef;
  if (gamerProfile.profesion === 'Guerrero') totalDef = Math.floor(totalDef * 1.10); if (gamerProfile.profesion === 'Mago') totalAtk = Math.floor(totalAtk * 1.10);
  return { atk: totalAtk, def: totalDef, total: totalAtk + totalDef };
};

window.renderizarTodoRPG = function() {
  if(!gamerProfile.stats) return; inicializarStatsYMigrar(); actualizarEnergiaPasiva();

  let xpActual = gamerProfile.xp || 0; let nivelJugador = calcularNivel(xpActual); let xpBaseNivel = calcularXpNivelActual(nivelJugador); let xpProximo = calcularXpSiguienteNivel(nivelJugador);
  let pctXp = Math.min(100, Math.max(0, ((xpActual - xpBaseNivel) / (xpProximo - xpBaseNivel)) * 100));

  document.getElementById('rpgPerfilTag').innerText = gamerProfile.tag || "Aventurero"; document.getElementById('rpgPerfilTokens').innerText = `${gamerProfile.tokens || 0} 🪙`;
  document.getElementById('rpgNivelBadge').innerText = `Nv. ${nivelJugador}`; document.getElementById('rpgProximoNivelTxt').innerText = nivelJugador + 1;
  document.getElementById('rpgBarraXpFill').style.width = `${pctXp}%`; document.getElementById('rpgBarraXpText').innerText = `${xpActual - xpBaseNivel} /${xpProximo - xpBaseNivel} XP`;

  let lblClase = document.getElementById('rpgPerfilClase'); let btnElegir = document.getElementById('btnAbrirModalClase'); lblClase.innerText = gamerProfile.profesion || "Sin Clase";
  if (nivelJugador >= 5 && (gamerProfile.profesion === "Sin Clase" || !gamerProfile.profesion)) { btnElegir.style.display = 'inline-block'; lblClase.style.color = '#888'; } else { btnElegir.style.display = 'none'; lblClase.style.color = '#fff'; }

  let enMaxReal = gamerProfile.stats.energiaMax + (gamerProfile.profesion === 'Mago' ? 30 : 0); let pctEn = Math.min(100, Math.max(0, (gamerProfile.stats.energiaActual / enMaxReal) * 100));
  document.getElementById('rpgBarraEnergiaFill').style.width = `${pctEn}%`; document.getElementById('rpgBarraEnergiaText').innerText = `${gamerProfile.stats.energiaActual}/${enMaxReal}`;

  let hpMaxReal = gamerProfile.stats.hpMax || 1; let pctHp = Math.min(100, Math.max(0, (gamerProfile.stats.hpActual / hpMaxReal) * 100));
  document.getElementById('rpgBarraHpFill').style.width = `${pctHp}%`; document.getElementById('rpgBarraHpText').innerText = `${gamerProfile.stats.hpActual}/${hpMaxReal}`;

  let statsPoder = window.obtenerPoderJugador();
  document.getElementById('rpgStatAtk').innerText = statsPoder.atk; document.getElementById('rpgStatDef').innerText = statsPoder.def;

  window.renderizarPaperDollGrande(); window.renderizarInventarioRPG(); window.renderizarFraguaRPG(); window.renderizarRefinamientoRPG(); window.renderizarHorno(); window.renderizarBazarRPG();
};

window.renderizarPaperDollGrande = function() {
  if(!currentUserUid || !gamerProfile.equipo) return;
  let grid = document.getElementById('paperDollGrid'); if(!grid) return; 
  
  let ranurasConfig = [
    { key: 'amuleto', label: 'Amuleto', icon: '📿' },
    { key: 'cabeza', label: 'Cabeza', icon: '🪖' },
    { key: 'mascota', label: 'Mascota', icon: '🐾' },
    { key: 'mano_derecha', label: 'Mano Der.', icon: '🗡️' },
    { key: 'pecho', label: 'Pecho', icon: '🛡️' },
    { key: 'mano_izquierda', label: 'Mano Izq.', icon: '🛡️' },
    { key: 'anillo', label: 'Anillo', icon: '💍' },
    { key: 'piernas', label: 'Piernas', icon: '👖' },
    { key: 'pies', label: 'Pies', icon: '🥾' }
  ];
  
  let html = "";
  ranurasConfig.forEach(slot => {
    let uidItemEquipado = gamerProfile.equipo?.[slot.key]; 
    let itemObj = uidItemEquipado ? gamerProfile.inventario.find(i => i.uid_inventario === uidItemEquipado) : null;
    
    let contenido = `<div style="font-size: 1.5em; opacity: 0.3;">${slot.icon}</div><div style="font-size: 0.5em; color: #555; margin-top: 4px; text-transform:uppercase; font-weight:bold;">${slot.label}</div>`;
    let estilo = `background: rgba(0,0,0,0.6); border: 1px dashed #333; border-radius: 8px; padding: 5px; text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; position:relative; overflow:hidden; transition:0.2s; box-shadow: inset 0 0 10px #000;`;
    
    if (itemObj) {
      let imgThumb = itemObj.imgUrl ? `<img src="${itemObj.imgUrl}" style="width: 32px; height: 32px; object-fit: contain; image-rendering: pixelated; margin-bottom: 2px;">` : `<div style="font-size: 1.5em;">${slot.icon}</div>`;
      let lblNombre = itemObj.nivelMejora ? `<span style="color:#00e5ff;">+${itemObj.nivelMejora}</span>` : ``;
      contenido = `${imgThumb}<div style="font-size: 0.55em; color: #fff; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; text-shadow: 0 0 2px #000;">${window.sanitizarHTML(itemObj.nombre)}</div><div style="position:absolute; top:2px; right:4px; font-size:0.7em; font-weight:bold;">${lblNombre}</div>`; 
      estilo = `background: rgba(37,211,102,0.05); border: 1px solid rgba(37,211,102,0.4); border-radius: 8px; padding: 5px; text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; position:relative; box-shadow: inset 0 0 15px rgba(37,211,102,0.1);`;
    }
    html += `<div style="${estilo}" title="${slot.label}" onclick="window.desequiparRanuraRPG('${slot.key}')">${contenido}</div>`;
  });
  grid.innerHTML = html;
};

window.desequiparRanuraRPG = function(ranuraKey) { if (gamerProfile.equipo && gamerProfile.equipo[ranuraKey]) { gamerProfile.equipo[ranuraKey] = null; window.guardarProgresoRPG(); window.mostrarTextoFlotante('Desequipado', '#ffaa00'); } };

window.renderizarInventarioRPG = function() {
  if(!currentUserUid || !gamerProfile.inventario) return;
  let cont = document.getElementById('rpgContenedorInventario'); if(!cont) return; cont.innerHTML = "";

  let cantMateriales = gamerProfile.inventario.filter(i => (i.tipo || '').toLowerCase() === 'material').reduce((acc, i) => acc + (i.cantidad || 1), 0);
  let lblMat = document.getElementById('rpgTotalMateriales'); if(lblMat) lblMat.innerText = cantMateriales;
  if (gamerProfile.inventario.length === 0) { cont.innerHTML = "<div style='grid-column: 1/-1; color: #555; text-align: center; font-size: 0.8em; padding: 15px;'>Mochila vacía.</div>"; return; }

  let nivelJugador = calcularNivel(gamerProfile.xp);

  gamerProfile.inventario.forEach((item) => {
    let ranuraEquipada = null; if (gamerProfile.equipo) { for (let r in gamerProfile.equipo) { if (gamerProfile.equipo[r] === item.uid_inventario) { ranuraEquipada = r; break; } } }
    let isEquipped = ranuraEquipada !== null; let tipoLower = (item.tipo || '').toLowerCase(); let isLocked = (item.nivelReq && item.nivelReq > nivelJugador && tipoLower === 'arma');
    
    let badge = (item.cantidad && item.cantidad > 1) ? `<div class="badge-cantidad">x${item.cantidad}</div>` : '';
    let icono = item.imgUrl ? `<img src="${item.imgUrl}" alt="${window.sanitizarHTML(item.nombre)}" style="width: 30px; height: 30px; object-fit: contain; image-rendering: pixelated; opacity: ${isLocked?0.3:1};">` : (tipoLower === 'material' ? "💎" : (tipoLower === 'consumible' ? "🧪" : "🗡️"));
    let accionClick = ""; let estiloCursor = "cursor: default;"; let infoExtra = "";

    if (isLocked) { accionClick = `alert('Necesitas Nivel ${item.nivelReq} para equipar.')`; estiloCursor = "cursor: not-allowed;"; infoExtra = `<span style="font-size: 0.65em; color: #ff3366;"><i class="fas fa-lock"></i> Nv. ${item.nivelReq}</span>`; } 
    else if (tipoLower === 'consumible') { accionClick = `window.usarConsumibleRPG('${item.uid_inventario}')`; estiloCursor = "cursor: pointer;"; infoExtra = `<span style="color:#ff3366; font-size: 0.65em;">Usar Consumible</span>`; } 
    else if (item.ranura && item.ranura !== 'ninguna') { accionClick = `window.equiparItemRPG('${item.uid_inventario}')`; estiloCursor = "cursor: pointer;"; infoExtra = `<span style="font-size: 0.65em; color: ${isEquipped ? '#25d366' : '#555'};">${isEquipped ? 'EQUIPADO' : 'ATK/DEF'}</span>`; } 
    else { infoExtra = `<span style="color:#b000ff; font-size: 0.65em;">Material</span>`; }

    let tokensVenta = item.rareza === 'SSR' ? 50 : (item.rareza === 'SR' ? 20 : (item.rareza === 'R' ? 8 : 2)); if(tipoLower === 'material') tokensVenta = 3;
    let btnVenderHtml = `<button onclick="event.stopPropagation(); window.venderItemRPG('${item.uid_inventario}', ${tokensVenta})" style="background: transparent; border: 1px solid #333; color: #888; border-radius: 4px; padding: 2px 6px; font-size: 0.6em; cursor: pointer; margin-top: 4px; transition: 0.2s;" onmouseover="this.style.borderColor='#ffaa00'; this.style.color='#ffaa00'" onmouseout="this.style.borderColor='#333'; this.style.color='#888'"><i class="fas fa-coins"></i> Vender</button>`;
    let bordeColor = isEquipped ? '#25d366' : (isLocked ? '#ff3366' : '#222');
    let bg = isEquipped ? 'rgba(37,211,102,0.05)' : 'transparent';
    let lockOverlay = isLocked ? `<div class="lock-overlay" style="background: rgba(0,0,0,0.8);"><i class="fas fa-lock" style="color:#ff3366; font-size:1.2em;"></i></div>` : '';
    let lblNombre = item.nivelMejora ? `${window.sanitizarHTML(item.nombre)} <span class="text-upgrade">+${item.nivelMejora}</span>` : window.sanitizarHTML(item.nombre);

    cont.innerHTML += `<div style="${estiloCursor} background: ${bg}; border: 1px solid ${bordeColor}; border-radius: 6px; padding: 8px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: space-between; position:relative; overflow:hidden;" onclick="${accionClick}">${badge}${lockOverlay}<div style="position:relative; z-index:1; width:100%;"><div style="height: 35px; display: flex; align-items: center; justify-content: center; margin-bottom:4px;">${icono}</div><div class="rareza-${item.rareza}" style="font-weight: bold; font-size: 0.7em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${lblNombre}</div><div>${infoExtra}</div></div><div>${btnVenderHtml}</div></div>`;
  });
};

window.equiparItemRPG = function(uid_inventario) { let item = gamerProfile.inventario.find(i => i.uid_inventario === uid_inventario); if (!item) return; let nivelJugador = calcularNivel(gamerProfile.xp); if (item.nivelReq && nivelJugador < item.nivelReq) return alert(`Necesitas Nivel ${item.nivelReq} para equipar esto.`); let ranuraDestino = item.ranura; if (!ranuraDestino || ranuraDestino === 'ninguna') return alert("No se puede equipar."); if (gamerProfile.equipo[ranuraDestino] === uid_inventario) { gamerProfile.equipo[ranuraDestino] = null; window.mostrarTextoFlotante('Desequipado', '#ffaa00'); } else { gamerProfile.equipo[ranuraDestino] = uid_inventario; window.mostrarTextoFlotante(`Equipado`, '#25d366'); } window.guardarProgresoRPG(); };
window.usarConsumibleRPG = function(uid_inventario) { let idx = gamerProfile.inventario.findIndex(i => i.uid_inventario === uid_inventario); if(idx === -1) return; let item = gamerProfile.inventario[idx]; let nombreMinus = (item.nombre || "").toLowerCase(); let enMaxReal = gamerProfile.stats.energiaMax + (gamerProfile.profesion === 'Mago' ? 30 : 0); if (nombreMinus.includes("energía") || nombreMinus.includes("energia") || nombreMinus.includes("stamina")) { gamerProfile.stats.energiaActual += 50; if(gamerProfile.stats.energiaActual > enMaxReal) gamerProfile.stats.energiaActual = enMaxReal; window.mostrarTextoFlotante(`+50 Energía ⚡`, '#ffcc00'); } else { gamerProfile.stats.hpActual += 50; if(gamerProfile.stats.hpActual > gamerProfile.stats.hpMax) gamerProfile.stats.hpActual = gamerProfile.stats.hpMax; window.mostrarTextoFlotante(`Curado +50 HP`, '#ff3366'); } if (item.cantidad > 1) { item.cantidad--; } else { gamerProfile.inventario.splice(idx, 1); } window.guardarProgresoRPG(); };
window.venderItemRPG = function(uid_inventario, tokensPorUnidad) { let index = gamerProfile.inventario.findIndex(i => i.uid_inventario === uid_inventario); if(index === -1) return; let item = gamerProfile.inventario[index]; let maxCant = item.cantidad || 1; let cantAVender = 1; if (maxCant > 1) { let resp = prompt(`¿Cuántas unidades quieres vender? (Tienes ${maxCant})`); if (resp === null) return; cantAVender = parseInt(resp); if (isNaN(cantAVender) || cantAVender <= 0 || cantAVender > maxCant) return alert("Cantidad inválida."); } if (gamerProfile.equipo) { for (let r in gamerProfile.equipo) { if (gamerProfile.equipo[r] === uid_inventario) gamerProfile.equipo[r] = null; } } if (cantAVender >= maxCant) { gamerProfile.inventario.splice(index, 1); } else { item.cantidad -= cantAVender; } let totalGanado = cantAVender * tokensPorUnidad; gamerProfile.tokens = (gamerProfile.tokens || 0) + totalGanado; window.guardarProgresoRPG(); window.mostrarTextoFlotante(`+${totalGanado} Tokens`, '#ffaa00'); };

window.entrenarStatRPG = function(stat) { 
    let costo = 10; 
    if((gamerProfile.tokens || 0) < costo) return alert("No tienes suficientes Tokens."); 
    gamerProfile.tokens -= costo; 
    if(stat === 'hp') { gamerProfile.stats.hpMax += 10; window.mostrarTextoFlotante('+10 MaxHP', '#ff3366'); } 
    else if(stat === 'energia') { gamerProfile.stats.energiaMax += 10; window.mostrarTextoFlotante('+10 MaxEnergía', '#ffcc00'); } 
    else if(stat === 'atk') { gamerProfile.stats.atk += 2; window.mostrarTextoFlotante('+2 ATK', '#ffaa00'); } 
    else if(stat === 'def') { gamerProfile.stats.def += 2; window.mostrarTextoFlotante('+2 DEF', '#00e5ff'); } 
    window.guardarProgresoRPG(); 
};

function calcularDropConPesos(nombresDrops) { let posibles = nombresDrops.map(nombre => rpgObjetosGlobal.find(o => o.nombre === nombre && !o.enBazar)).filter(Boolean); if(posibles.length === 0) return null; let pesoTotal = posibles.reduce((sum, item) => sum + item.pesoDrop, 0); let random = Math.random() * pesoTotal; let acumulado = 0; for(let i = 0; i < posibles.length; i++) { acumulado += posibles[i].pesoDrop; if(random <= acumulado) return posibles[i]; } return posibles[0]; }

window.cazarEnZona = function(zonaId) {
    let zona = zonasCaza[zonaId]; let nivelJugador = calcularNivel(gamerProfile.xp);
    if (nivelJugador < zona.reqNivel) return document.getElementById('rpgResultadoGremio').innerHTML = `<span style="color:#ffaa00;">Bloqueado. Nv. ${zona.reqNivel} Req.</span>`;
    let costoEnergia = zona.gastaEn; if (gamerProfile.profesion === 'Explorador') costoEnergia = Math.max(1, costoEnergia - 5);
    if (gamerProfile.stats.energiaActual < costoEnergia) return document.getElementById('rpgResultadoGremio').innerHTML = `<span style="color:#ffcc00;">Agotado. Faltan ⚡.</span>`;
    if (gamerProfile.stats.hpActual < zona.gastaHp) return document.getElementById('rpgResultadoGremio').innerHTML = `<span style="color:#ff3366;">Al borde de la muerte. Cúrate.</span>`;
    let ahora = Date.now(); let cooldownTime = 1 * 60 * 1000; let keyCooldown = 'cooldown_caza'; let ultimoUso = gamerProfile.cooldowns[keyCooldown] || 0;
    if (ahora - ultimoUso < cooldownTime) { return document.getElementById('rpgResultadoGremio').innerHTML = `<span style="color:#555;">Descansando...</span>`; }
    
    gamerProfile.stats.hpActual -= zona.gastaHp; gamerProfile.stats.energiaActual -= costoEnergia;
    let probFinalDrop = zona.probDrop; if (gamerProfile.profesion === 'Explorador') probFinalDrop += 15;
    let rngDrop = Math.random() * 100; let msj = `Sobreviviste en <strong>${zona.nombre}</strong>.`;

    if (rngDrop <= probFinalDrop) { let itemDB = calcularDropConPesos(zona.drops); if (itemDB) { window.agregarItemInventario({...itemDB}); msj += `<br>Botín: <strong class="rareza-${itemDB.rareza}">${window.sanitizarHTML(itemDB.nombre)}</strong>`; } }
    gamerProfile.cooldowns[keyCooldown] = ahora; gamerProfile.tokens = (gamerProfile.tokens || 0) + zona.tokGana; gamerProfile.xp = (gamerProfile.xp || 0) + zona.xpGana; window.guardarProgresoRPG();
    window.mostrarTextoFlotante(`+${zona.xpGana} XP`, '#25d366'); document.getElementById('rpgResultadoGremio').innerHTML = `<span style="color:#fff;">${msj}</span><br><span style="color:#25d366; font-size:0.9em;">+${zona.xpGana} XP | +${zona.tokGana} 🪙</span>`;
};

window.minar = function() {
    if (gamerProfile.stats.energiaActual < 15) return document.getElementById('rpgResultadoGremio').innerHTML = `<span style="color:#ffcc00;">Agotado. Faltan ⚡.</span>`;
    if (gamerProfile.stats.hpActual < 5) return document.getElementById('rpgResultadoGremio').innerHTML = `<span style="color:#ff3366;">Estás herido.</span>`;
    let ahora = Date.now(); let cooldownTime = 2 * 60 * 1000; let keyCooldown = 'cooldown_minar'; let ultimoUso = gamerProfile.cooldowns[keyCooldown] || 0;
    if (ahora - ultimoUso < cooldownTime) { return document.getElementById('rpgResultadoGremio').innerHTML = `<span style="color:#555;">Picota rota...</span>`; }
    gamerProfile.stats.energiaActual -= 15; gamerProfile.stats.hpActual -= 5;
    let chanceDoble = gamerProfile.profesion === 'Artesano' ? 30 : 0; let rng = Math.random() * 100; let msj = "Solo sacas escombros.";
    if (rng < 65) { 
        let todosLosMateriales = rpgObjetosGlobal.filter(o => o.tipo === 'material' && !o.enBazar);
        if (todosLosMateriales.length > 0) {
            let nombresMateriales = todosLosMateriales.map(m => m.nombre); let matGanado = calcularDropConPesos(nombresMateriales);
            if (matGanado) { let qty = 1; if(Math.random() * 100 <= chanceDoble) { qty = 2; msj = `Extraes <strong class="rareza-${matGanado.rareza}">${window.sanitizarHTML(matGanado.nombre)} x2</strong> <span style="color:#ffaa00;">(Bono Artesano)</span>`; } else { msj = `Extraes <strong class="rareza-${matGanado.rareza}">${window.sanitizarHTML(matGanado.nombre)}</strong>`; } window.agregarItemInventario({...matGanado}, qty); }
        }
    }
    gamerProfile.cooldowns[keyCooldown] = ahora; gamerProfile.tokens = (gamerProfile.tokens || 0) + 3; gamerProfile.xp = (gamerProfile.xp || 0) + 15; window.guardarProgresoRPG();
    window.mostrarTextoFlotante(`+15 XP`, '#ffaa00'); document.getElementById('rpgResultadoGremio').innerHTML = `<span style="color:#fff;">${msj}</span><br><span style="color:#25d366; font-size:0.9em;">+15 XP | +3 🪙</span>`;
};

window.entrarMazmorraRPG = function(zonaId) {
  let mazmorra = mazmorras[zonaId]; if(!mazmorra) return;
  let costoHp = mazmorra.gastaHp; if (gamerProfile.profesion === 'Guerrero') costoHp = Math.ceil(costoHp * 0.8);
  if (gamerProfile.stats.energiaActual < mazmorra.gastaEn) return document.getElementById('rpgResultadoGremio').innerHTML = `<span style="color:#ffcc00;">Agotado.</span>`;
  if (gamerProfile.stats.hpActual < costoHp) return document.getElementById('rpgResultadoGremio').innerHTML = `<span style="color:#ff3366;">Morirías antes de entrar. Necesitas ${costoHp} HP.</span>`;
  let ahora = Date.now(); let cooldownTime = 5 * 60 * 1000; let keyCooldown = 'cooldown_mazmorra_global'; let ultimoUso = gamerProfile.cooldowns[keyCooldown] || 0;
  let log = document.getElementById('rpgResultadoGremio');
  if (ahora - ultimoUso < cooldownTime) { return log.innerHTML = `<span style="color:#555;">Grupo descansando...</span>`; }
  
  let statsPoder = window.obtenerPoderJugador(); let poder = statsPoder.total;
  log.innerHTML = `<span style="color:#00e5ff;">Explorando ${mazmorra.nombre}...</span>`;
  gamerProfile.stats.energiaActual -= mazmorra.gastaEn; gamerProfile.stats.hpActual -= costoHp; gamerProfile.cooldowns[keyCooldown] = ahora; window.guardarProgresoRPG(); 

  setTimeout(() => {
    if(poder >= mazmorra.poderReq) {
      let premioTxt = "Nada de valor."; let rngDrop = Math.random() * 100;
      if(rngDrop <= mazmorra.probDrop) { let lootItemDB = calcularDropConPesos(mazmorra.drops); if(lootItemDB) { window.agregarItemInventario({...lootItemDB}); premioTxt = `<span class="rareza-${lootItemDB.rareza}">${window.sanitizarHTML(lootItemDB.nombre)}</span>`; } }
      gamerProfile.xp = (gamerProfile.xp || 0) + mazmorra.xpGana; gamerProfile.tokens = (gamerProfile.tokens || 0) + mazmorra.tokGana; window.guardarProgresoRPG();
      window.mostrarTextoFlotante(`+${mazmorra.xpGana} XP`, '#25d366'); log.innerHTML = `<span style="color:#25d366;">¡Limpiaste ${mazmorra.nombre}!</span><br>Loot: <strong>${premioTxt}</strong><br><span style="font-size:0.8em; color:#888;">+${mazmorra.xpGana} XP | +${mazmorra.tokGana} 🪙</span>`;
    } else {
      let perdida = mazmorra.xpGana; gamerProfile.xp -= perdida; if(gamerProfile.xp < 0) gamerProfile.xp = 0; window.guardarProgresoRPG();
      window.mostrarTextoFlotante(`Derrota`, '#ff3366'); log.innerHTML = `<span style="color:#ff3366;">Derrota en ${mazmorra.nombre}. Tus huesos adornan el suelo.</span><br><span style="font-size:0.8em;">Perdiste <strong style="color:#ffaa00;">${perdida} XP</strong>.</span>`;
    }
  }, 1500);
};

// ==========================================
// EL COLISEO Y MOTOR NARRATIVO (LIFE IN ADVENTURE)
// ==========================================
window.cambiarPestanaColiseo = function(modo) {
    document.getElementById('tabModoAventura').classList.toggle('activo', modo === 'aventura'); document.getElementById('tabModoRumble').classList.toggle('activo', modo === 'rumble');
    document.getElementById('coliseoAventura').style.display = modo === 'aventura' ? 'block' : 'none'; document.getElementById('coliseoRumble').style.display = modo === 'rumble' ? 'block' : 'none';
};

window.iniciarEscuchadorRumble = function() {
    if(escuchadorRumble) return;
    escuchadorRumble = onSnapshot(query(collection(db, "rumble_inscritos")), (snapshot) => {
        let lbl = document.getElementById('lblInscritosRumble'); if(lbl) lbl.innerText = snapshot.size;
        let yaInscrito = false; snapshot.forEach(doc => { if(doc.data().tag === gamerProfile.tag) yaInscrito = true; });
        let btn = document.getElementById('btnInscribirseRumble');
        if(btn) { if(yaInscrito) { btn.disabled = true; btn.innerHTML = "Inscrito"; btn.style.background = "#25d366"; } else { btn.disabled = false; btn.innerHTML = "Inscribirse al Torneo"; btn.style.background = "#ff3366"; } }
    });
    getDoc(doc(db, "rumble_historial", "ultimo_torneo")).then(docSnap => {
        if (docSnap.exists() && document.getElementById('logUltimoRumble')) { document.getElementById('logUltimoRumble').innerHTML = docSnap.data().logHTML; }
    }).catch(e => console.warn(e));
};

window.inscribirseRumbleBD = async function() {
  let btn = document.getElementById('btnInscribirseRumble'); btn.disabled = true; btn.innerHTML = "Conectando...";
  try { await setDoc(doc(db, "rumble_inscritos", gamerProfile.tag), { tag: gamerProfile.tag, fecha: Date.now() }); alert("¡Inscripción exitosa!"); } 
  catch(e) { alert("Error."); btn.disabled = false; }
};

const bancoEventosNarrativos = [
    { texto: "Un Caballero Renegado te bloquea el puente. Su espada brilla con oscuridad.", opciones: [{ texto: "Atacar de frente", tipo: "atk", req: 30 }, { texto: "Bloquear y contraatacar", tipo: "def", req: 25 }, { texto: "Huir cobardemente", tipo: "huir", req: 0 }] },
    { texto: "Encuentras un cofre antiguo atrapado en raíces con espinas venenosas.", opciones: [{ texto: "Cortar las raíces", tipo: "atk", req: 25 }, { texto: "Resistir el veneno y abrirlo", tipo: "def", req: 20 }, { texto: "Ignorar el cofre", tipo: "huir", req: 0 }] },
    { texto: "El suelo colapsa bajo tus pies y caes hacia un nido de arañas gigantes.", opciones: [{ texto: "Ataque de caída", tipo: "atk", req: 40 }, { texto: "Escudarte del impacto", tipo: "def", req: 35 }, { texto: "Escalar la pared", tipo: "huir", req: 0 }] },
    { texto: "Un Mercader Fantasma te ofrece un trato: tu vitalidad a cambio de riquezas.", opciones: [{ texto: "Intimidarlo", tipo: "atk", req: 45 }, { texto: "Resistir su magia", tipo: "def", req: 30 }, { texto: "Rechazar el trato", tipo: "huir", req: 0 }] },
    { texto: "Llegas a la Guarida del Rey Goblin. Duerme sobre oro.", opciones: [{ texto: "Ejecución letal", tipo: "atk", req: 50 }, { texto: "Robar en sigilo", tipo: "def", req: 40 }, { texto: "Demasiado riesgo. Huir.", tipo: "huir", req: 0 }] }
];

let estadoAventura = { activa: false, paso: 0, maxPasos: 3, xpAcum: 0, tokAcum: 0, eventoActual: null };

window.iniciarAventuraNarrativa = function() {
    if (gamerProfile.stats.energiaActual < 30) return alert("Necesitas 30 Energía ⚡ para la expedición.");
    if (gamerProfile.stats.hpActual < 25) return alert("Estás muy débil. Cúrate primero, morirás ahí dentro.");
    
    gamerProfile.stats.energiaActual -= 30;
    estadoAventura = { activa: true, paso: 1, maxPasos: 3, xpAcum: 0, tokAcum: 0, eventoActual: null };
    window.guardarProgresoRPG(); window.cargarPasoAventura();
};

window.cargarPasoAventura = function() {
    let pool = bancoEventosNarrativos.sort(() => 0.5 - Math.random()); estadoAventura.eventoActual = pool[0];
    let infoHTML = `<div style="color:#555; font-weight:bold; font-size:0.8em; margin-bottom:8px; text-transform:uppercase;">[ Etapa ${estadoAventura.paso} / ${estadoAventura.maxPasos} ]</div>`;
    infoHTML += estadoAventura.eventoActual.texto;
    document.getElementById('narrativeBox').innerHTML = infoHTML;
    
    let htmlOpciones = "";
    estadoAventura.eventoActual.opciones.forEach((opc, index) => { htmlOpciones += `<button class="narrative-btn" onclick="resolverAventuraNarrativa(${index})">${opc.texto}</button>`; });
    document.getElementById('narrativeOptions').innerHTML = htmlOpciones;
};

window.resolverAventuraNarrativa = function(indexOpcion) {
    if(!estadoAventura.activa) return;
    let opcion = estadoAventura.eventoActual.opciones[indexOpcion]; let statsPoder = window.obtenerPoderJugador(); let box = document.getElementById('narrativeBox'); let btnBox = document.getElementById('narrativeOptions');

    if (opcion.tipo === 'huir') {
        let xpSalvada = Math.floor(estadoAventura.xpAcum / 2); let tokSalvado = Math.floor(estadoAventura.tokAcum / 2);
        gamerProfile.xp += xpSalvada; gamerProfile.tokens += tokSalvado;
        box.innerHTML = `<span style="color:#ffaa00;">Huiste del peligro.</span> Abandonaste la expedición, pero salvaste la mitad del botín.<br><br>Ganas: +${xpSalvada} XP y +${tokSalvado} 🪙.`;
        btnBox.innerHTML = `<button class="narrative-btn" onclick="reiniciarAventuraUI()">Volver al Gremio</button>`;
        estadoAventura.activa = false; window.guardarProgresoRPG(); return;
    }

    let statUsado = opcion.tipo === 'atk' ? statsPoder.atk : statsPoder.def; let rngDado = Math.floor(Math.random() * 21) - 10; let totalTirada = statUsado + rngDado;

    if (totalTirada >= opcion.req) {
        let gananciaXp = 50 + (estadoAventura.paso * 20); let gananciaTok = 10 + (estadoAventura.paso * 5);
        estadoAventura.xpAcum += gananciaXp; estadoAventura.tokAcum += gananciaTok;
        box.innerHTML = `<span style="color:#25d366;">¡Éxito!</span> Superaste el obstáculo.<br><br>Botín asegurado: <span style="color:#ffaa00;">${estadoAventura.tokAcum} 🪙</span> y <span style="color:#00e5ff;">${estadoAventura.xpAcum} XP</span>.`;
        if (estadoAventura.paso < estadoAventura.maxPasos) { estadoAventura.paso++; btnBox.innerHTML = `<button class="narrative-btn" style="border-left: 2px solid #25d366;" onclick="cargarPasoAventura()">Avanzar a la oscuridad</button>`; } 
        else {
            gamerProfile.xp += estadoAventura.xpAcum; gamerProfile.tokens += estadoAventura.tokAcum;
            box.innerHTML += `<br><br><strong style="color:#b000ff;">¡EXPEDICIÓN COMPLETADA!</strong><br>Sobreviviste.`;
            btnBox.innerHTML = `<button class="narrative-btn" onclick="reiniciarAventuraUI()">Reclamar Botín y Volver</button>`;
            estadoAventura.activa = false; window.guardarProgresoRPG(); try{ confetti({ particleCount: 80, spread: 70 }); }catch(e){}
        }
    } else {
        let dmg = 30 + (estadoAventura.paso * 15); gamerProfile.stats.hpActual -= dmg;
        if (gamerProfile.stats.hpActual <= 0) {
            gamerProfile.stats.hpActual = 0;
            let penalizacionMuerte = estadoAventura.xpAcum * 2; gamerProfile.xp -= penalizacionMuerte; if(gamerProfile.xp < 0) gamerProfile.xp = 0;
            box.innerHTML = `<span style="color:#ff3366; font-weight:bold;">HAS MUERTO.</span><br><br>El golpe fue fatal. Perdiste todo el botín acumulado y <strong style="color:#ffaa00;">${penalizacionMuerte} XP</strong> extra de tu nivel.`;
            btnBox.innerHTML = `<button class="narrative-btn" style="border-left: 2px solid #ff3366;" onclick="reiniciarAventuraUI()">Revivir en la ciudad</button>`;
            estadoAventura.activa = false; window.guardarProgresoRPG();
        } else {
            box.innerHTML = `<span style="color:#ff3366;">¡Fallo Crítico!</span> Recibiste un tajo profundo de <strong>-${dmg} HP</strong>.<br><br>Botín en riesgo: ${estadoAventura.xpAcum} XP.`;
            if (estadoAventura.paso < estadoAventura.maxPasos) { estadoAventura.paso++; btnBox.innerHTML = `<button class="narrative-btn" style="border-left: 2px solid #ff5500;" onclick="cargarPasoAventura()">Arrastrarte adelante</button>`; } 
            else {
                gamerProfile.xp += estadoAventura.xpAcum; gamerProfile.tokens += estadoAventura.tokAcum;
                box.innerHTML += `<br><br><strong style="color:#b000ff;">¡EXPEDICIÓN COMPLETADA A DURAS PENAS!</strong><br>Sobreviviste sangrando.`;
                btnBox.innerHTML = `<button class="narrative-btn" onclick="reiniciarAventuraUI()">Volver al Gremio</button>`;
                estadoAventura.activa = false; window.guardarProgresoRPG(); try{ confetti({ particleCount: 80, spread: 70 }); }catch(e){}
            }
        }
    }
};

window.reiniciarAventuraUI = function() {
    document.getElementById('narrativeBox').innerHTML = "El portón se alza. Más allá solo hay oscuridad y promesas de gloria y muerte.";
    document.getElementById('narrativeOptions').innerHTML = `<button class="narrative-btn" onclick="iniciarAventuraNarrativa()">Adentrarse (-30 ⚡)</button>`;
};

// ==========================================
// EL DISTRITO COMERCIAL (TABS DE CRAFTEO Y COMPRA)
// ==========================================
window.cambiarPestanaCraft = function(tab) {
    document.getElementById('btnTabMercado').classList.toggle('activo', tab === 'mercado'); document.getElementById('btnTabFragua').classList.toggle('activo', tab === 'fragua'); document.getElementById('btnTabHorno').classList.toggle('activo', tab === 'horno'); document.getElementById('btnTabRefinar').classList.toggle('activo', tab === 'refinar');
    document.getElementById('secMercado').style.display = tab === 'mercado' ? 'block' : 'none'; document.getElementById('secFragua').style.display = tab === 'fragua' ? 'block' : 'none'; document.getElementById('secHorno').style.display = tab === 'horno' ? 'block' : 'none'; document.getElementById('secRefinar').style.display = tab === 'refinar' ? 'block' : 'none';
};

window.renderizarBazarRPG = function() {
    if(!currentUserUid) return; let cont = document.getElementById('listaBazarRPG'); if(!cont) return;
    let itemsBazar = rpgObjetosGlobal.filter(o => o.enBazar === true);
    if(itemsBazar.length === 0) { cont.innerHTML = "<p style='color: #555; font-size: 0.8em; text-align: center;'>El mercader no tiene artículos hoy.</p>"; return; }
    
    let html = "";
    itemsBazar.forEach(item => {
        let puedeComprar = (gamerProfile.tokens || 0) >= item.precioBazar;
        let thumb = item.imgUrl ? `<img src="${item.imgUrl}" style="width: 32px; height: 32px; object-fit: contain; image-rendering: pixelated; margin-right: 8px;">` : `<div style="font-size: 1.5em; margin-right: 8px;">🗡️</div>`;
        let infoExtra = item.tipo === 'arma' ? `ATK +${item.atk} | DEF +${item.def}` : `Material Exclusivo`;
        
        html += `<div class="rpg-list-item" style="border-left-color: #00e5ff;">
            <div style="display: flex; align-items: center;">
                ${thumb}
                <div>
                    <div class="rpg-item-name rareza-${item.rareza}" style="font-size: 0.85em; font-weight: bold;">${window.sanitizarHTML(item.nombre)}</div>
                    <div style="font-size: 0.65em; color: #888;">${infoExtra}</div>
                </div>
            </div>
            <button class="btn-comprar" style="margin: 0; padding: 6px 12px; font-size: 0.75em; background: ${puedeComprar ? '#00e5ff' : 'transparent'}; border: 1px solid ${puedeComprar ? '#00e5ff' : '#444'}; color: ${puedeComprar ? '#000' : '#666'}; width:auto;" onclick="window.comprarEnBazar('${item.id}')" ${!puedeComprar ? 'disabled' : ''}>
                ${item.precioBazar} 🪙
            </button>
        </div>`;
    });
    cont.innerHTML = html;
};

window.comprarEnBazar = function(idItem) {
    let item = rpgObjetosGlobal.find(o => o.id === idItem); if(!item) return;
    if((gamerProfile.tokens || 0) < item.precioBazar) return alert("Tokens insuficientes.");
    if(confirm(`¿Deseas comprar: ${item.nombre}?`)) {
        gamerProfile.tokens -= item.precioBazar;
        let itemAGuardar = {...item}; if(item.tipo === 'arma') itemAGuardar.nivelMejora = 0;
        window.agregarItemInventario(itemAGuardar, 1); window.guardarProgresoRPG();
        window.mostrarTextoFlotante(`¡Comprado!`, '#00e5ff'); try{ confetti({ particleCount: 60, spread: 50, colors: ['#00e5ff', '#ffaa00'] }); }catch(e){}
    }
};

const recetasHorno = [ { id: 'h_cobre', reqMat: 'Cobre', reqCant: 5, tok: 10, resNombre: 'Lingote de Cobre', resRareza: 'R' }, { id: 'h_hierro', reqMat: 'Hierro', reqCant: 5, tok: 25, resNombre: 'Lingote de Hierro', resRareza: 'SR' }, { id: 'h_caos', reqMat: 'Cristal de Caos', reqCant: 3, tok: 50, resNombre: 'Gema del Caos', resRareza: 'SSR' } ];
window.renderizarHorno = function() {
    let cont = document.getElementById('listaHornoFundicion'); if(!cont) return; let html = "";
    recetasHorno.forEach(r => { let matPoseido = gamerProfile.inventario.find(i => i.nombre === r.reqMat)?.cantidad || 0; let puede = matPoseido >= r.reqCant && (gamerProfile.tokens || 0) >= r.tok; 
    html += `<div class="rpg-list-item"><div><div style="font-weight: bold; font-size: 0.8em; color: #ccc;">${r.resNombre} <span class="tag-badge tag-${r.resRareza.toLowerCase()}">${r.resRareza}</span></div><div style="font-size: 0.65em; color: ${matPoseido >= r.reqCant ? '#25d366' : '#ff3366'};">${r.reqMat} (${matPoseido}/${r.reqCant})</div></div><button class="btn-comprar" style="margin: 0; padding: 6px 12px; font-size: 0.7em; background: ${puede ? '#b000ff' : 'transparent'}; border: 1px solid ${puede ? '#b000ff' : '#444'}; color: ${puede ? '#fff' : '#666'}; width:auto;" onclick="window.fundirEnHorno('${r.id}')" ${!puede ? 'disabled' : ''}>${r.tok} 🪙</button></div>`; });
    cont.innerHTML = html;
};
window.fundirEnHorno = function(idReceta) {
    let receta = recetasHorno.find(r => r.id === idReceta); if(!receta) return;
    let matIndex = gamerProfile.inventario.findIndex(i => i.nombre === receta.reqMat);
    if(matIndex === -1 || (gamerProfile.inventario[matIndex].cantidad || 1) < receta.reqCant || (gamerProfile.tokens || 0) < receta.tok) return alert("Materiales insuficientes.");
    gamerProfile.tokens -= receta.tok; gamerProfile.inventario[matIndex].cantidad -= receta.reqCant; if(gamerProfile.inventario[matIndex].cantidad <= 0) gamerProfile.inventario.splice(matIndex, 1);
    window.agregarItemInventario({ nombre: receta.resNombre, tipo: 'material', rareza: receta.resRareza, pesoDrop: 0 }); window.guardarProgresoRPG(); window.mostrarTextoFlotante(`Fusión completa`, '#b000ff');
};

window.renderizarFraguaRPG = function() {
  if(!currentUserUid || !gamerProfile.inventario) return; let cont = document.getElementById('listaRecetasFragua'); if(!cont) return;
  let armas = rpgObjetosGlobal.filter(o => (o.tipo || '').toLowerCase() === 'arma' && !o.enBazar);
  if(armas.length === 0) { cont.innerHTML = "<p style='color: #555; font-size: 0.8em; text-align: center;'>No hay recetas.</p>"; return; }
  let nivelJugador = calcularNivel(gamerProfile.xp); let html = "";
  armas.forEach(a => {
    let costoMat = a.costoMat; if(gamerProfile.profesion === 'Artesano') costoMat = Math.max(1, costoMat - 1);
    let cantTotalMateriales = gamerProfile.inventario.filter(i => (i.tipo || '').toLowerCase() === 'material').reduce((acc, i) => acc + (i.cantidad || 1), 0);
    let costoTok = a.costoTok; let reqNvl = a.nivelReq || 1; let puede = cantTotalMateriales >= costoMat && (gamerProfile.tokens || 0) >= costoTok;
    let nvlColor = nivelJugador >= reqNvl ? '#888' : '#ff3366'; let thumb = a.imgUrl ? `<img src="${a.imgUrl}" style="width: 28px; height: 28px; object-fit: contain; image-rendering: pixelated; margin-right: 6px;">` : `🗡️`;
    html += `<div class="rpg-list-item" style="border-left-color: #ffaa00;"><div style="display: flex; align-items: center;">${thumb}<div><div class="rpg-item-name rareza-${a.rareza}" style="font-size: 0.8em; font-weight: bold;">${window.sanitizarHTML(a.nombre)}</div><div style="font-size: 0.65em; color: ${nvlColor};">ATK +${a.atk} | DEF +${a.def} | Nv.Req: ${reqNvl}</div><div style="font-size: 0.65em; font-weight: bold; color: ${puede ? '#aaa' : '#ff3366'};">Req: ${costoMat} 💎 | ${costoTok} 🪙</div></div></div><button class="btn-comprar" style="margin: 0; padding: 6px 10px; font-size: 0.7em; background: ${puede ? '#ffaa00' : 'transparent'}; border: 1px solid ${puede ? '#ffaa00' : '#444'}; color: ${puede ? '#000' : '#666'}; width:auto;" onclick="window.forjarItemRPG('${a.id}', ${costoMat}, ${costoTok})" ${!puede ? 'disabled' : ''}>Forjar</button></div>`;
  });
  cont.innerHTML = html;
};

window.forjarItemRPG = function(idArma, costoMat, costoTok) {
  let cantTotalMateriales = gamerProfile.inventario.filter(i => (i.tipo || '').toLowerCase() === 'material').reduce((acc, i) => acc + (i.cantidad || 1), 0);
  if(cantTotalMateriales < costoMat || (gamerProfile.tokens || 0) < costoTok) return alert("Recursos insuficientes.");
  let arma = rpgObjetosGlobal.find(o => o.id === idArma); if(!arma) return;
  gamerProfile.tokens -= costoTok; window.consumirMaterialesPorCantidadGlobal(costoMat); window.agregarItemInventario({...arma, nivelMejora: 0});
  window.guardarProgresoRPG(); alert(`¡Forjaste: ${arma.nombre}!`);
};

function getProbabilidadRefinamiento(nvl) { if(nvl < 3) return { prob: 100, riesgo: 'Seguro (100%)', color: '#25d366' }; if(nvl === 3) return { prob: 70, riesgo: 'Riesgo: Falla y pierde mats (70%)', color: '#ffaa00' }; if(nvl === 4) return { prob: 50, riesgo: 'Riesgo: Baja 1 Nivel (50%)', color: '#ff5500' }; if(nvl >= 5) return { prob: 30, riesgo: 'PELIGRO: DESTRUCCIÓN (30%)', color: '#ff3366' }; return { prob: 10, riesgo: 'DESTRUCCIÓN (10%)', color: '#ff3366' }; }
window.renderizarRefinamientoRPG = function() {
    if(!currentUserUid || !gamerProfile.inventario) return; let cont = document.getElementById('listaRefinamientoRPG'); if(!cont) return;
    let armasJugador = gamerProfile.inventario.filter(i => (i.tipo || '').toLowerCase() === 'arma' && i.ranura && i.ranura !== 'ninguna');
    if(armasJugador.length === 0) { cont.innerHTML = "<p style='color: #555; font-size: 0.8em; text-align: center;'>No tienes armas para refinar.</p>"; return; }

    let cantMat = gamerProfile.inventario.filter(i => (i.tipo || '').toLowerCase() === 'material').reduce((acc, i) => acc + (i.cantidad || 1), 0);
    let html = "";
    armasJugador.forEach(item => {
        let nvl = item.nivelMejora || 0; let esMaximo = nvl >= 10;
        let costoMat = (nvl + 1) * 2; if (gamerProfile.profesion === 'Artesano') costoMat = Math.max(1, costoMat - 1);
        let costoTok = (nvl + 1) * 20; let probData = getProbabilidadRefinamiento(nvl); let puede = cantMat >= costoMat && (gamerProfile.tokens || 0) >= costoTok;
        let thumb = item.imgUrl ? `<img src="${item.imgUrl}" style="width: 28px; height: 28px; object-fit: contain; image-rendering: pixelated; margin-right: 6px;">` : `🗡️`;
        let lblNombre = nvl > 0 ? `${window.sanitizarHTML(item.nombre)} <span class="text-upgrade">+${nvl}</span>` : window.sanitizarHTML(item.nombre);

        if (esMaximo) { html += `<div class="rpg-list-item" style="border-left-color:#00e5ff; opacity:0.6;"><div style="display: flex; align-items: center;">${thumb}<div><div class="rpg-item-name rareza-${item.rareza}" style="font-size: 0.8em; font-weight: bold;">${lblNombre}</div><div style="font-size: 0.65em; color: #00e5ff;">¡NIVEL MÁXIMO!</div></div></div></div>`; } 
        else { html += `<div class="rpg-list-item" style="border-left-color: ${probData.color};"><div style="display: flex; align-items: center;">${thumb}<div><div class="rpg-item-name rareza-${item.rareza}" style="font-size: 0.8em; font-weight: bold;">${lblNombre}</div><div style="font-size: 0.65em; color: ${probData.color};">${probData.riesgo}</div><div style="font-size: 0.65em; color: ${puede ? '#aaa' : '#ff3366'};">Costo: ${costoMat} 💎 | ${costoTok} 🪙</div></div></div><button class="btn-comprar" style="margin: 0; padding: 6px 12px; font-size: 0.7em; background: ${puede ? probData.color : 'transparent'}; border: 1px solid ${puede ? probData.color : '#444'}; color: ${puede ? '#000' : '#666'}; font-weight:bold; width:auto;" onclick="window.refinarItemRPG('${item.uid_inventario}')" ${!puede ? 'disabled' : ''}>+${nvl+1}</button></div>`; }
    });
    cont.innerHTML = html;
};

window.refinarItemRPG = function(uid_inventario) {
    let idx = gamerProfile.inventario.findIndex(i => i.uid_inventario === uid_inventario); if (idx === -1) return;
    let item = gamerProfile.inventario[idx]; let nvl = item.nivelMejora || 0; if(nvl >= 10) return alert("Arma al máximo.");
    let costoMat = (nvl + 1) * 2; if (gamerProfile.profesion === 'Artesano') costoMat = Math.max(1, costoMat - 1); let costoTok = (nvl + 1) * 20;
    let cantMat = gamerProfile.inventario.filter(i => (i.tipo || '').toLowerCase() === 'material').reduce((acc, i) => acc + (i.cantidad || 1), 0);
    if(cantMat < costoMat || (gamerProfile.tokens || 0) < costoTok) return alert("Recursos insuficientes para refinar.");

    gamerProfile.tokens -= costoTok; window.consumirMaterialesPorCantidadGlobal(costoMat);
    idx = gamerProfile.inventario.findIndex(i => i.uid_inventario === uid_inventario); item = gamerProfile.inventario[idx];
    let probData = getProbabilidadRefinamiento(nvl); let rng = Math.random() * 100;
    if (rng <= probData.prob) { item.nivelMejora = nvl + 1; window.mostrarTextoFlotante(`¡ÉXITO! +${item.nivelMejora}`, '#00e5ff'); try{ confetti({ particleCount: 50, spread: 60, colors: ['#00e5ff', '#ffffff'] }); }catch(e){} } 
    else {
        if (probData.prob === 100) {} else if (nvl === 3) { window.mostrarTextoFlotante(`Falla`, '#ffaa00'); } 
        else if (nvl === 4) { item.nivelMejora = Math.max(0, nvl - 1); window.mostrarTextoFlotante(`¡CRÍTICO! Bajó a +${item.nivelMejora}`, '#ff5500'); } 
        else if (nvl >= 5) { if (gamerProfile.equipo) { for (let r in gamerProfile.equipo) { if (gamerProfile.equipo[r] === uid_inventario) gamerProfile.equipo[r] = null; } } gamerProfile.inventario.splice(idx, 1); window.mostrarTextoFlotante(`¡ARMA DESTRUIDA!`, '#ff3366'); return window.guardarProgresoRPG(); }
    }
    window.guardarProgresoRPG();
};
window.sanitizarHTML = function(str) { return String(str || '').replace(/[&<>"']/g, function(m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]; }); };

// ==========================================
// SISTEMA DE TIMERS EN VIVO (COOLDOWNS)
// ==========================================
setInterval(() => {
    if(!currentUserUid || !gamerProfile.cooldowns || !gamerProfile.stats) return;
    let ahora = Date.now();
    
    // 1. Timer de Caza (1 min)
    let ultimoCaza = gamerProfile.cooldowns['cooldown_caza'] || 0;
    let diffCaza = 60000 - (ahora - ultimoCaza);
    let elCaza = document.getElementById('ui-cd-caza');
    if(elCaza) {
        if(diffCaza > 0) {
            let sec = Math.ceil(diffCaza/1000);
            elCaza.innerHTML = `<i class="fas fa-hourglass-half"></i> ${Math.floor(sec/60)}m ${sec%60}s`;
            elCaza.style.color = "#ffaa00";
        } else {
            elCaza.innerHTML = `<i class="fas fa-check"></i> Listo`;
            elCaza.style.color = "#25d366";
        }
    }

    // 2. Timer de Mina (2 min)
    let ultimoMinar = gamerProfile.cooldowns['cooldown_minar'] || 0;
    let diffMinar = 120000 - (ahora - ultimoMinar);
    let elMinar = document.getElementById('ui-cd-mina');
    if(elMinar) {
        if(diffMinar > 0) {
            let sec = Math.ceil(diffMinar/1000);
            elMinar.innerHTML = `<i class="fas fa-hourglass-half"></i> ${Math.floor(sec/60)}m ${sec%60}s`;
            elMinar.style.color = "#ffaa00";
        } else {
            elMinar.innerHTML = `<i class="fas fa-check"></i> Listo`;
            elMinar.style.color = "#25d366";
        }
    }

    // 3. Timer de Mazmorra (5 min)
    let ultimoMaz = gamerProfile.cooldowns['cooldown_mazmorra_global'] || 0;
    let diffMaz = 300000 - (ahora - ultimoMaz);
    let elMaz = document.getElementById('ui-cd-mazmorra');
    if(elMaz) {
        if(diffMaz > 0) {
            let sec = Math.ceil(diffMaz/1000);
            elMaz.innerHTML = `<i class="fas fa-hourglass-half"></i> ${Math.floor(sec/60)}m ${sec%60}s`;
            elMaz.style.color = "#ffaa00";
        } else {
            elMaz.innerHTML = `<i class="fas fa-check"></i> Listo`;
            elMaz.style.color = "#25d366";
        }
    }
    
    // 4. Timers de Regeneración (HP y Energía)
    let ultimaRegen = gamerProfile.stats.ultimaEnergia || ahora;
    let diffRegen = 60000 - (ahora - ultimaRegen);
    let secRegen = Math.max(0, Math.ceil(diffRegen / 1000));
    
    let limiteEnergia = gamerProfile.stats.energiaMax + (gamerProfile.profesion === 'Mago' ? 30 : 0);
    let limiteHp = gamerProfile.stats.hpMax;

    let elEn = document.getElementById('ui-timer-en');
    if(elEn) {
        if(gamerProfile.stats.energiaActual < limiteEnergia) {
            elEn.innerHTML = `+1 ⚡ en ${secRegen}s`;
        } else {
            elEn.innerHTML = `MÁXIMO`;
        }
    }

    let elHp = document.getElementById('ui-timer-hp');
    if(elHp) {
        if(gamerProfile.stats.hpActual < limiteHp) {
            elHp.innerHTML = `+2 ♥ en ${secRegen}s`;
        } else {
            elHp.innerHTML = `MÁXIMO`;
        }
    }
}, 1000);
