import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, getDocs, orderBy, query, doc, getDoc, setDoc, addDoc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const firebaseConfig = { apiKey: "AIzaSyDH1DZqaIi5sKRXspXDUWbMUZ4nr5JIy8Q", authDomain: "sakura-gameverse.firebaseapp.com", projectId: "sakura-gameverse", storageBucket: "sakura-gameverse.firebasestorage.app", messagingSenderId: "226328425516", appId: "1:226328425516:web:8dc11761639228c6120d89" };
const app = initializeApp(firebaseConfig); const db = getFirestore(app); const auth = getAuth(app);

const CORREO_ADMIN = "Sakuragameverse@gmail.com";
let productosAdminGlobal = []; let facturasAdminGlobal = []; let fotosBufferProducto = [];
let rpgObjetosAdminGlobal = [];

onAuthStateChanged(auth, (user) => { 
  if (user && user.email.toLowerCase() === CORREO_ADMIN.toLowerCase()) { 
    document.getElementById('lockScreen').style.display = 'none'; 
    document.getElementById('adminMainContent').style.display = 'block'; 
    cargarProductosAdmin(); 
    cargarAjustesWeb(); 
  } else { 
    document.getElementById('lockScreen').style.display = 'flex'; 
    document.getElementById('adminMainContent').style.display = 'none'; 
    if(user) {
      signOut(auth);
      alert("🛑 ACCESO DENEGADO: Tu cuenta de jugador no tiene permisos de administrador.");
    }
  } 
});

window.iniciarSesionAdmin = async function() { 
  const email = document.getElementById('adminEmailInput').value.trim(); 
  const pass = document.getElementById('adminPassInput').value; 
  const errorBox = document.getElementById('loginErrorMsg'); 
  const btn = document.getElementById('btnLoginSubmit'); 
  if (!email || !pass) return; 

  if (email.toLowerCase() !== CORREO_ADMIN.toLowerCase()) {
      errorBox.innerText = "🛑 No tienes permisos de administrador.";
      errorBox.style.display = 'block';
      return;
  }

  btn.disabled = true; errorBox.style.display = 'none'; 
  try { 
    await signInWithEmailAndPassword(auth, email, pass); 
    document.getElementById('adminPassInput').value = ""; 
  } catch (err) { 
    errorBox.innerText = "Credenciales inválidas."; 
    errorBox.style.display = 'block'; 
  } finally { 
    btn.disabled = false; 
  } 
};

window.cerrarSesionAdmin = async function() { if (confirm("¿Cerrar sesión?")) await signOut(auth); };

window.cambiarSeccion = function(panelId) { 
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); 
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active')); 
  event.currentTarget.classList.add('active'); 
  document.getElementById(`panel-${panelId}`).classList.add('active'); 

  if (panelId === 'productos') cargarProductosAdmin();
  if (panelId === 'rpg') cargarObjetosRPGAdmin();
  if (panelId === 'ajustes') cargarAjustesWeb();
  if (panelId === 'gacha') { cargarWaifusAdmin(); cargarHistorialGacha(); }
  if (panelId === 'pedidos') cargarPedidosAdmin();
  if (panelId === 'jugadores') cargarJugadoresAdmin();
  if (panelId === 'facturas') cargarFacturasAdmin();
  if (panelId === 'banners') cargarBannersAdmin();
  if (panelId === 'cupones') cargarCuponesAdmin();
  if (panelId === 'pagos' || panelId === 'rangos') cargarDatosGenerales();
  if (panelId === 'reviews') cargarReviewsAdmin();
};

function sanitizar(str) { if (!str) return ''; return String(str).replace(/[&<>"']/g, function(m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]; }); }

function comprimirYConvertirAWebP(archivo, maxDim = 600, calidad = 0.72) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader(); lector.onload = (e) => { const img = new Image(); img.onload = () => { let ancho = img.width; let alto = img.height; if (ancho > maxDim || alto > maxDim) { if (ancho > alto) { alto = Math.round((alto * maxDim) / ancho); ancho = maxDim; } else { ancho = Math.round((ancho * maxDim) / alto); alto = maxDim; } } const canvas = document.createElement('canvas'); canvas.width = ancho; canvas.height = alto; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, ancho, alto); resolve(canvas.toDataURL('image/webp', calidad)); }; img.onerror = reject; img.src = e.target.result; }; lector.onerror = reject; lector.readAsDataURL(archivo);
  });
}

window.cambiarContrasenaAdmin = async function(e) {
  e.preventDefault();
  const p1 = document.getElementById('adminNuevaClave').value;
  const p2 = document.getElementById('adminConfirmarClave').value;
  if (p1 !== p2) return alert("❌ Las contraseñas no coinciden.");
  if (p1.length < 6) return alert("❌ La contraseña es muy corta. Debe tener al menos 6 caracteres.");
  const user = auth.currentUser;
  if (user) {
    try {
      await updatePassword(user, p1);
      alert("✅ ¡Contraseña actualizada con éxito!");
      document.getElementById('adminNuevaClave').value = '';
      document.getElementById('adminConfirmarClave').value = '';
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') { alert("⚠️ Requiere inicio de sesión reciente para cambiar clave."); } else { alert("❌ Error: " + error.message); }
    }
  }
};

async function cargarAjustesWeb() { 
  try { 
    const snap = await getDoc(doc(db, "configuracion", "ajustes_web")); 
    if (snap.exists()) { 
      const d = snap.data(); 
      document.getElementById('ajustesTicker').value = d.ticker || ''; 
      document.getElementById('ajustesHeroTitle').value = d.heroTitle || ''; 
      document.getElementById('ajustesHeroDesc').value = d.heroDesc || ''; 
      document.getElementById('ajustesWhatsapp').value = d.whatsapp || ''; 
      document.getElementById('ajustesCostoGacha').value = d.costoGacha || 100; 
      document.getElementById('ajustesTokensCofre').value = d.tokensCofre || 15;
    } 
  } catch(e) { console.warn("Aviso CMS:", e); } 
}

window.guardarAjustesWeb = async function(e) { 
  e.preventDefault(); 
  try { 
    await setDoc(doc(db, "configuracion", "ajustes_web"), { 
      ticker: document.getElementById('ajustesTicker').value.trim(), 
      heroTitle: document.getElementById('ajustesHeroTitle').value.trim(), 
      heroDesc: document.getElementById('ajustesHeroDesc').value.trim(), 
      whatsapp: document.getElementById('ajustesWhatsapp').value.trim(), 
      costoGacha: parseInt(document.getElementById('ajustesCostoGacha').value) || 100,
      tokensCofre: parseInt(document.getElementById('ajustesTokensCofre').value) || 15
    }, { merge: true }); 
    alert("Ajustes actualizados."); 
  } catch(err) { console.warn("Error Guardar CMS:", err); } 
};

async function cargarObjetosRPGAdmin() {
  try {
    const q = query(collection(db, "rpg_objetos"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    rpgObjetosAdminGlobal = [];
    snapshot.forEach(docSnap => {
      rpgObjetosAdminGlobal.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderizarListaRPGAdmin();
  } catch(e) { console.warn("Error cargar RPG:", e); }
}

window.renderizarListaRPGAdmin = function() {
  const cont = document.getElementById('listaObjetosRPGAdmin');
  const filtroRanura = document.getElementById('filtroRanuraAdmin')?.value || 'todos';
  
  let objetosFiltrados = rpgObjetosAdminGlobal;
  
  // Lógica del nuevo filtro simple (armas, materiales o todos)
  if (filtroRanura === 'arma') {
    objetosFiltrados = rpgObjetosAdminGlobal.filter(obj => (obj.tipo || 'arma') === 'arma');
  } else if (filtroRanura === 'material') {
    objetosFiltrados = rpgObjetosAdminGlobal.filter(obj => (obj.tipo || 'arma') === 'material');
  }

  if (objetosFiltrados.length === 0) { 
    cont.innerHTML = "<p style='text-align:center; color:var(--text-muted);'>No hay objetos en esta categoría.</p>"; 
    return; 
  }
  
  let html = "";
  objetosFiltrados.forEach(obj => {
    let imgDisplay = obj.imgUrl ? `<img src="${obj.imgUrl}" class="item-card-thumb" style="object-fit:cover;">` : `<div class="item-card-thumb" style="display:flex; align-items:center; justify-content:center; font-size:1.5em;">🗡️</div>`;
    let ranuraTexto = obj.ranura ? obj.ranura.toUpperCase() : 'NINGUNA';
    let esBazar = obj.enBazar ? `<span class="tag-badge" style="background:#b000ff20; color:#b000ff; border-color:#b000ff;">🛒 BAZAR</span>` : '';
    
    html += `
    <div class="item-card-row">
      ${imgDisplay}
      <div class="item-card-info">
        <div class="item-card-title rareza-${obj.rareza}">${sanitizar(obj.nombre)}</div>
        <div class="item-card-meta"><span>${obj.tipo.toUpperCase()}</span> • <span class="tag-badge tag-${obj.rareza.toLowerCase()}">${obj.rareza}</span> • <span style="color:#00e5ff;">Ranura: ${ranuraTexto}</span> ${esBazar}</div>
      </div>
      <div class="item-card-actions">
        <button class="btn-action-touch btn-edit" onclick="prepararEdicionRPG('${obj.id}')"><i class="fas fa-pen"></i></button>
        <button class="btn-action-touch btn-del" onclick="eliminarObjetoRPG('${obj.id}')"><i class="fas fa-trash"></i></button>
      </div>
    </div>`;
  });
  cont.innerHTML = html;
};

window.guardarObjetoRPG = async function(btnElement) {
  let idEdit = document.getElementById('rpgEditId').value;
  let nombre = document.getElementById('rpgItemNombre').value.trim();
  let tipo = document.getElementById('rpgItemTipo').value;
  let rareza = document.getElementById('rpgItemRareza').value;
  let ranura = document.getElementById('rpgItemRanura').value;
  let atk = parseInt(document.getElementById('rpgItemAtk').value) || 0;
  let def = parseInt(document.getElementById('rpgItemDef').value) || 0;
  let costoMat = parseInt(document.getElementById('rpgItemCostoMat').value) || null;
  let costoTok = parseInt(document.getElementById('rpgItemCostoTok').value) || null;
  let pesoDrop = parseInt(document.getElementById('rpgItemPesoDrop').value) || null;
  let nivelReq = parseInt(document.getElementById('rpgItemNivelReq').value) || 1;
  let enBazar = document.getElementById('rpgItemBazar').checked;
  let precioBazar = parseInt(document.getElementById('rpgItemPrecioBazar').value) || 0;
  let fileInput = document.getElementById('rpgItemImg');

  if(!nombre) return alert("Ponle un nombre al objeto.");
  if(!idEdit && !fileInput.files[0]) return alert("Selecciona una imagen para el objeto nuevo.");
  if(enBazar && precioBazar <= 0) return alert("Si el objeto está en el Bazar, debe tener un Precio en Tokens válido.");
  
  let btn = (btnElement && btnElement instanceof HTMLElement) ? btnElement : document.createElement('button');
  btn.disabled = true;
  let btnOriginalText = btn.innerHTML || 'Forjar / Actualizar Objeto';
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo al Servidor...';

  try {
    let datosObj = { 
      nombre: nombre, tipo: tipo, rareza: rareza, ranura: ranura,
      stats: { atk: atk, def: def }, costoMat: costoMat, costoTok: costoTok,
      pesoDrop: pesoDrop, nivelReq: nivelReq, 
      enBazar: enBazar, precioBazar: precioBazar,
      timestamp: Date.now() 
    };

    if(fileInput.files[0]) {
      datosObj.imgUrl = await comprimirYConvertirAWebP(fileInput.files[0], 200, 0.8);
    }

    if(idEdit) {
      await updateDoc(doc(db, "rpg_objetos", idEdit), datosObj);
      alert(`¡Objeto "${nombre}" actualizado!`);
    } else {
      await addDoc(collection(db, "rpg_objetos"), datosObj);
      alert(`¡Objeto "${nombre}" forjado con éxito!`);
    }
    resetFormularioRPG();
    cargarObjetosRPGAdmin();
  } catch(e) { alert("Error al guardar el objeto."); console.warn(e); } finally { btn.disabled = false; btn.innerHTML = btnOriginalText; }
};

window.prepararEdicionRPG = function(id) {
  const obj = rpgObjetosAdminGlobal.find(item => item.id === id);
  if (!obj) return;
  document.getElementById('rpgEditId').value = obj.id;
  document.getElementById('rpgItemNombre').value = obj.nombre || '';
  document.getElementById('rpgItemTipo').value = obj.tipo || 'arma';
  document.getElementById('rpgItemRareza').value = obj.rareza || 'N';
  document.getElementById('rpgItemRanura').value = obj.ranura || 'ninguna';
  document.getElementById('rpgItemAtk').value = obj.stats?.atk || 0;
  document.getElementById('rpgItemDef').value = obj.stats?.def || 0;
  document.getElementById('rpgItemCostoMat').value = obj.costoMat || '';
  document.getElementById('rpgItemCostoTok').value = obj.costoTok || '';
  document.getElementById('rpgItemPesoDrop').value = obj.pesoDrop || '';
  document.getElementById('rpgItemNivelReq').value = obj.nivelReq || ''; 
  document.getElementById('rpgItemBazar').checked = obj.enBazar || false;
  document.getElementById('rpgItemPrecioBazar').value = obj.precioBazar || '';
  document.getElementById('rpgItemImg').value = ""; 
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.resetFormularioRPG = function() {
  document.getElementById('rpgEditId').value = "";
  document.getElementById('rpgItemNombre').value = "";
  document.getElementById('rpgItemRanura').value = "ninguna";
  document.getElementById('rpgItemAtk').value = "";
  document.getElementById('rpgItemDef').value = "";
  document.getElementById('rpgItemCostoMat').value = "";
  document.getElementById('rpgItemCostoTok').value = "";
  document.getElementById('rpgItemPesoDrop').value = "";
  document.getElementById('rpgItemNivelReq').value = ""; 
  document.getElementById('rpgItemBazar').checked = false;
  document.getElementById('rpgItemPrecioBazar').value = "";
  document.getElementById('rpgItemImg').value = "";
};

window.eliminarObjetoRPG = async function(id) {
  if(confirm("¿Destruir este objeto de la base de datos?")) {
    await deleteDoc(doc(db, "rpg_objetos", id));
    cargarObjetosRPGAdmin();
  }
};

window.ejecutarTorneoRumble = async function() {
  const rumbleRef = collection(db, "rumble_inscritos");
  const snapshot = await getDocs(rumbleRef);
  let jugadores = [];
  snapshot.forEach(d => jugadores.push(d.data().tag));

  if(jugadores.length < 2) return alert("Se necesitan al menos 2 jugadores inscritos para iniciar un Rumble.");

  let log = `<div style="color: #ffaa00; margin-bottom: 10px;">¡Comienza el Torneo con ${jugadores.length} tributos!</div>`;
  let eventos = [" eliminó a [V] con una katana.", " empujó a [V] fuera de la zona segura.", " le tiró un caparazón azul a [V].", " emboscó y derrotó a [V].", " hizo equipo temporalmente y luego traicionó a [V]."];
  let vivos = [...jugadores]; let turno = 1;

  while(vivos.length > 1) {
    vivos.sort(() => Math.random() - 0.5);
    let atacante = vivos[0]; let victima = vivos[1]; 
    let accion = eventos[Math.floor(Math.random() * eventos.length)].replace("[V]", `<span style='color:#ff3366'>${victima}</span>`);
    log += `[Día ${turno}] <strong>${atacante}</strong>${accion}<br>`;
    vivos.splice(1, 1); turno++;
  }

  let ganador = vivos[0];
  log += `<br><span style="color: #25d366; font-size: 1.2em;">🏆 ¡${ganador} ES EL GANADOR SUPREMO! 🏆</span><br>Premio enviado por el Administrador.`;

  await setDoc(doc(db, "rumble_historial", "ultimo_torneo"), { ganador: ganador, logHTML: log, fecha: Date.now() });
  snapshot.forEach(async (documento) => { await deleteDoc(doc(db, "rumble_inscritos", documento.id)); });
  alert(`Torneo finalizado con éxito. Ganador: ${ganador}.`);
};

window.toggleFormWaifu = function() { const box = document.getElementById('cajaFormWaifu'); const lbl = document.getElementById('lblToggleWaifu'); if(box.style.display === 'none') { box.style.display = 'block'; lbl.innerText = "Cerrar Creador"; } else { box.style.display = 'none'; lbl.innerText = "Agregar Tarjeta Waifu"; } };

async function cargarWaifusAdmin() {
  try {
    const q = query(collection(db, "waifus_gacha"), orderBy("timestamp", "desc")); const snapshot = await getDocs(q); const cont = document.getElementById('listaWaifusAdmin');
    if (snapshot.empty) { cont.innerHTML = "<p style='color:var(--text-muted); text-align:center;'>Gacha vacío.</p>"; return; }
    let htmlBloque = "";
    snapshot.forEach(d => {
      const w = { id: d.id, ...d.data() }; let tagClase = w.rareza === 'SSR' ? 'tag-ssr' : (w.rareza === 'SR' ? 'tag-sr' : (w.rareza === 'R' ? 'tag-r' : 'tag-n')); let iconOculto = w.oculto ? 'fa-eye-slash' : 'fa-eye'; let colorOculto = w.oculto ? '#ffaa00' : 'var(--secondary-color)';
      htmlBloque += `<div class="item-card-row ${w.oculto ? 'is-paused' : ''}"><img src="${w.imgUrl}" class="item-card-thumb"><div class="item-card-info"><div class="item-card-title">${sanitizar(w.nombre)}</div><div class="item-card-meta"><span class="tag-badge ${tagClase}">${w.rareza}</span> <span>•</span> <span style="color:#25d366;">${sanitizar(w.premio)}</span></div></div><div class="item-card-actions"><button class="btn-action-touch" style="color: ${colorOculto}; background: rgba(0,0,0,0.4); border: 1px solid ${colorOculto}40;" onclick="toggleOcultarWaifu('${w.id}', ${w.oculto})"><i class="fas ${iconOculto}"></i></button><button class="btn-action-touch btn-del" onclick="eliminarWaifu('${w.id}')"><i class="fas fa-trash"></i></button></div></div>`;
    });
    cont.innerHTML = htmlBloque;
  } catch(e) { console.warn("Error Cargar Waifus:", e); }
}

async function cargarHistorialGacha() {
  try {
    const q = query(collection(db, "historial_gacha"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    const cont = document.getElementById('listaHistorialGacha');
    if (snapshot.empty) { cont.innerHTML = "<p style='color:var(--text-muted); text-align:center;'>Nadie ha invocado aún.</p>"; return; }
    
    let html = "";
    snapshot.forEach(d => {
      let h = d.data();
      let fecha = new Date(h.timestamp).toLocaleString();
      let colorR = h.rareza === 'SSR' ? '#ffaa00' : (h.rareza === 'SR' ? '#b000ff' : (h.rareza === 'R' ? '#00e5ff' : '#b4becd'));
      
      html += `
      <div class="item-card-row">
        <div style="flex-grow:1;">
          <div style="font-weight:bold; color:#fff;">👤 ${sanitizar(h.jugador)} <span style="font-size:0.8em; color:var(--text-muted); font-weight:normal;">- ${fecha}</span></div>
          <div style="font-size:0.9em; color:var(--text-muted);">Desbloqueó: <strong style="color:${colorR};">${sanitizar(h.waifu)} (${h.rareza})</strong></div>
          <div style="font-size:0.85em; color:#25d366; margin-top:4px;"><i class="fas fa-gift"></i> Premio Pendiente: <strong>${sanitizar(h.premio)}</strong></div>
        </div>
        <button class="btn-action-touch btn-del" onclick="eliminarHistorialGacha('${d.id}')" title="Marcar como entregado"><i class="fas fa-check"></i></button>
      </div>`;
    });
    cont.innerHTML = html;
  } catch(e) {
    console.warn("Error al cargar el historial:", e);
    document.getElementById('listaHistorialGacha').innerHTML = `<p style='color:#ff3366; text-align:center;'><i class="fas fa-exclamation-triangle"></i> Fallo de conexión.</p>`;
  }
}

window.eliminarHistorialGacha = async function(id) {
  if(confirm("¿Ya aplicaste este descuento o entregaste el premio? (Esto borrará el registro de auditoría)")) {
    await deleteDoc(doc(db, "historial_gacha", id));
    cargarHistorialGacha();
  }
};

window.guardarWaifu = async function(e) { e.preventDefault(); const file = document.getElementById('waifuFileInput').files[0]; if (!file) return; const btn = document.getElementById('btnSubirWaifu'); btn.disabled = true; btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Imprimiendo carta...`; try { const imgUrl = await comprimirYConvertirAWebP(file, 600, 0.8); await addDoc(collection(db, "waifus_gacha"), { nombre: document.getElementById('waifuNombre').value.trim(), rareza: document.getElementById('waifuRareza').value, premio: document.getElementById('waifuPremio').value.trim(), imgUrl, oculto: false, timestamp: Date.now() }); document.getElementById('formWaifuGacha').reset(); cargarWaifusAdmin(); toggleFormWaifu(); } catch(err){ console.warn("Error subir waifu:", err); } finally { btn.disabled = false; btn.innerText = "Publicar Tarjeta Gacha"; } };
window.toggleOcultarWaifu = async function(id, estadoActual) { try { await updateDoc(doc(db, "waifus_gacha", id), { oculto: !estadoActual }); cargarWaifusAdmin(); } catch(e) { console.warn("Error ocultar waifu:", e); } };
window.eliminarWaifu = async function(id) { if (confirm("¿Quemar esta tarjeta permanentemente?")) { await deleteDoc(doc(db, "waifus_gacha", id)); cargarWaifusAdmin(); } };

window.toggleFormularioProducto = function() { const box = document.getElementById('cajaFormProducto'); const lbl = document.getElementById('lblToggleForm'); if(box.style.display === 'none') { box.style.display = 'block'; lbl.innerText = "Cerrar Formulario"; } else { box.style.display = 'none'; lbl.innerText = "Crear Nuevo Producto"; } };
window.procesarArchivosGaleria = async function(e) { const archivos = Array.from(e.target.files); if (!archivos.length) return; document.getElementById('txtEstadoSubida').style.display = 'block'; for (let archivo of archivos) { try { const url = await comprimirYConvertirAWebP(archivo, 600, 0.72); fotosBufferProducto.push(url); } catch(err){ console.warn("Error procesar img:", err); } } document.getElementById('txtEstadoSubida').style.display = 'none'; renderizarMiniaturasFotos(); e.target.value = ""; };
function renderizarMiniaturasFotos() { const cont = document.getElementById('contenedorPreviewFotos'); cont.innerHTML = ""; fotosBufferProducto.forEach((url, index) => { cont.innerHTML += `<div class="preview-foto-item"><img src="${url}"><button type="button" class="btn-del-foto-preview" onclick="removerFotoBuffer(${index})">✕</button></div>`; }); }
window.removerFotoBuffer = function(index) { fotosBufferProducto.splice(index, 1); renderizarMiniaturasFotos(); };
async function cargarProductosAdmin() { try { const q = query(collection(db, "productos"), orderBy("timestamp", "desc")); const snapshot = await getDocs(q); productosAdminGlobal = []; document.getElementById('totalProdsLbl').innerText = snapshot.size; document.getElementById('dashProds').innerText = snapshot.size; const cont = document.getElementById('listaProductosMobile'); if (snapshot.empty) { cont.innerHTML = `<p style="text-align:center;">No hay productos.</p>`; return; } let htmlBloque = ""; snapshot.forEach(docSnap => { const p = { id: docSnap.id, ...docSnap.data() }; productosAdminGlobal.push(p); const foto = (p.fotos && p.fotos.length > 0) ? p.fotos[0] : 'logo.webp?v=2'; let badgeClase = 'tag-stock'; if (p.estado && p.estado.includes("Encargo")) badgeClase = 'tag-encargo'; if (p.categoria === 'recargas') badgeClase = 'tag-digital'; let isOculto = p.oculto === true; let cardClass = isOculto ? "item-card-row card-item-filtro is-paused" : "item-card-row card-item-filtro"; let colorOculto = isOculto ? '#ffaa00' : 'var(--secondary-color)'; let stockValor = p.stock !== undefined ? p.stock : 'N/A'; htmlBloque += `<div class="${cardClass}" data-nombre="${sanitizar(p.nombre).toLowerCase()}"><img src="${foto}" class="item-card-thumb" loading="lazy"><div class="item-card-info"><div class="item-card-title">${sanitizar(p.nombre)}</div><div class="item-card-meta"><span>${sanitizar(p.categoria)}</span> <span>•</span> <span class="tag-badge ${badgeClase}">${p.estado || 'Stock'}</span> <span>•</span> <span style="color:var(--secondary-color);"><i class="fas fa-box-open"></i> ${stockValor} uds.</span></div><div class="item-card-price">$${Number(p.precio).toFixed(2)}</div></div><div class="item-card-actions"><button class="btn-action-touch" style="color: ${colorOculto}; background: rgba(0,0,0,0.4); border: 1px solid ${colorOculto}40;" onclick="toggleOcultarProducto('${p.id}', ${isOculto})"><i class="fas fa-eye"></i></button><button class="btn-action-touch btn-edit" onclick="prepararEdicion('${p.id}')"><i class="fas fa-pen"></i></button><button class="btn-action-touch btn-del" onclick="eliminarProducto('${p.id}')"><i class="fas fa-trash"></i></button></div></div>`; }); cont.innerHTML = htmlBloque; } catch(e) { console.warn("Error cargar prod:", e); } }
window.toggleOcultarProducto = async function(id, isOculto) { try { await updateDoc(doc(db, "productos", id), { oculto: !isOculto }); cargarProductosAdmin(); } catch(e) { console.warn("Error ocultar prod:", e); } };
window.guardarProducto = async function(e) { e.preventDefault(); const id = document.getElementById('prodEditId').value; if (fotosBufferProducto.length === 0) return alert("Añade foto."); try { const data = { nombre: document.getElementById('prodNombre').value.trim(), precio: parseFloat(document.getElementById('prodPrecio').value), stock: parseInt(document.getElementById('prodStock').value) || 0, categoria: document.getElementById('prodCategoria').value, coleccion: document.getElementById('prodColeccion').value.trim() || 'General', estado: document.getElementById('prodEstado').value, descripcion: document.getElementById('prodDesc').value.trim(), fotos: fotosBufferProducto, timestamp: Date.now() }; if (id) { await updateDoc(doc(db, "productos", id), data); } else { data.oculto = false; await addDoc(collection(db, "productos"), data); } resetFormularioProducto(); cargarProductosAdmin(); } catch(err) { console.warn("Error guardar prod:", err); } };
window.prepararEdicion = function(id) { const p = productosAdminGlobal.find(item => item.id === id); if (!p) return; document.getElementById('prodEditId').value = p.id; document.getElementById('prodNombre').value = p.nombre || ''; document.getElementById('prodPrecio').value = p.precio || ''; document.getElementById('prodStock').value = p.stock !== undefined ? p.stock : 10; document.getElementById('prodCategoria').value = p.categoria || 'figuras'; document.getElementById('prodColeccion').value = p.coleccion || ''; document.getElementById('prodEstado').value = p.estado || 'Envío Inmediato 📦'; document.getElementById('prodDesc').value = p.descripcion || ''; fotosBufferProducto = p.fotos ? [...p.fotos] : []; renderizarMiniaturasFotos(); document.getElementById('cajaFormProducto').style.display = "block"; window.scrollTo({ top: 0, behavior: 'smooth' }); };
window.resetFormularioProducto = function() { document.getElementById('formProducto').reset(); document.getElementById('prodEditId').value = ""; fotosBufferProducto = []; renderizarMiniaturasFotos(); document.getElementById('cajaFormProducto').style.display = "none"; };
window.eliminarProducto = async function(id) { if(confirm("¿Eliminar?")) { await deleteDoc(doc(db, "productos", id)); cargarProductosAdmin(); } };
window.filtrarTarjetasAdmin = function() { const val = document.getElementById('buscarEnAdmin').value.toLowerCase(); document.querySelectorAll('.card-item-filtro').forEach(c => { const nom = c.getAttribute('data-nombre') || ''; c.style.display = nom.includes(val) ? 'flex' : 'none'; }); };

window.toggleCajaPedidoManual = function() { const box = document.getElementById('cajaPedidoManual'); box.style.display = (box.style.display === 'none') ? 'block' : 'none'; };
window.toggleFormEnvioPedido = function(tipo) { document.getElementById('boxCamposEnvioAdmin').style.display = (tipo === 'digital') ? 'none' : 'block'; };
async function cargarPedidosAdmin() { try { const q = query(collection(db, "pedidos"), orderBy("timestamp", "desc")); const snapshot = await getDocs(q); const cont = document.getElementById('listaPedidosMobile'); document.getElementById('totalPedidosLbl').innerText = snapshot.size; if (snapshot.empty) { cont.innerHTML = `<p style="text-align: center;">Sin órdenes.</p>`; document.getElementById('dashIngresos').innerText = "$0.00"; document.getElementById('dashOrdenes').innerText = "0"; return; } let htmlBloque = ""; let totalUsdGanado = 0; let pedidosPendientes = 0; let ventas7Dias = [0, 0, 0, 0, 0, 0, 0]; let labels7Dias = []; let hoy = new Date(); hoy.setHours(23, 59, 59, 999); let limite7Dias = new Date(hoy); limite7Dias.setDate(limite7Dias.getDate() - 6); limite7Dias.setHours(0, 0, 0, 0); for(let i=6; i>=0; i--) { let d = new Date(); d.setDate(d.getDate() - i); labels7Dias.push(d.toLocaleDateString('es-ES', {weekday: 'short', day: 'numeric'})); } snapshot.forEach(docSnap => { const ped = docSnap.data(); let est = ped.estadoPedido || 'Pendiente'; if(est === 'Completado') totalUsdGanado += Number(ped.totalUsd || 0); else pedidosPendientes++; let ts = ped.timestamp || 0; if (est === 'Completado' && ts >= limite7Dias.getTime() && ts <= hoy.getTime()) { let dVenta = new Date(ts); let diffDays = Math.floor((hoy.getTime() - dVenta.getTime()) / (1000 * 3600 * 24)); if(diffDays >= 0 && diffDays <= 6) ventas7Dias[6 - diffDays] += Number(ped.totalUsd); } let colorEstado = '#ffaa00'; if(est === 'Pagado') colorEstado = '#00e5ff'; else if(est === 'Enviado') colorEstado = '#b000ff'; else if(est === 'Completado') colorEstado = '#25d366'; htmlBloque += `<div class="item-card-row"><div class="item-card-info"><div style="display:flex; justify-content:space-between; margin-bottom: 2px;"><strong>${sanitizar(ped.cliente)}</strong><span class="tag-badge" style="background: ${colorEstado}20; color: ${colorEstado}; border: 1px solid ${colorEstado}40;">${est}</span></div><div style="font-size:0.85em; color:var(--text-muted);"><i class="fab fa-whatsapp" style="color:#25d366;"></i> ${sanitizar(ped.telefono)}</div><div style="font-size:1.05em; font-weight:700; color:var(--secondary-color);">$${Number(ped.totalUsd).toFixed(2)}</div></div><div class="item-card-actions"><button class="btn-action-touch" style="color: ${colorEstado}; background: rgba(0,0,0,0.4); border: 1px solid ${colorEstado}40;" onclick="cambiarEstadoPedido('${docSnap.id}', '${est}')"><i class="fas fa-sync-alt"></i></button><button class="btn-action-touch btn-del" onclick="eliminarPedido('${docSnap.id}')"><i class="fas fa-trash"></i></button></div></div>`; }); cont.innerHTML = htmlBloque; document.getElementById('dashIngresos').innerText = "$" + totalUsdGanado.toFixed(2); document.getElementById('dashOrdenes').innerText = pedidosPendientes; dibujarGraficaVentas(labels7Dias, ventas7Dias); } catch(e) { console.warn("Error cargar pedidos:", e); } }
window.graficoVentasAdmin = null; function dibujarGraficaVentas(etiquetas, datos) { if (window.graficoVentasAdmin) window.graficoVentasAdmin.destroy(); const ctx = document.getElementById('graficoVentas').getContext('2d'); window.graficoVentasAdmin = new Chart(ctx, { type: 'line', data: { labels: etiquetas, datasets: [{ data: datos, borderColor: '#00e5ff', backgroundColor: 'rgba(0, 229, 255, 0.2)', borderWidth: 2, pointBackgroundColor: '#ff007f', pointBorderColor: '#fff', fill: true }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b8f9e' } }, x: { grid: { display: false }, ticks: { color: '#8b8f9e' } } } } }); }
window.cambiarEstadoPedido = async function(id, est) { let nuevo = 'Pendiente'; if(est === 'Pendiente') nuevo = 'Pagado'; else if(est === 'Pagado') nuevo = 'Enviado'; else if(est === 'Enviado') nuevo = 'Completado'; try { await updateDoc(doc(db, "pedidos", id), { estadoPedido: nuevo }); cargarPedidosAdmin(); } catch(e){ console.warn("Error estado pedido:", e); } };
window.guardarPedidoManual = async function(e) { e.preventDefault(); try { await addDoc(collection(db, "pedidos"), { cliente: document.getElementById('pedCliente').value, telefono: document.getElementById('pedTelefono').value, tipo: document.getElementById('pedTipo').value, metodoEnvio: document.getElementById('pedTipo').value, detalles: document.getElementById('pedDetalles').value, totalUsd: parseFloat(document.getElementById('pedTotalUsd').value), estadoPedido: "Pendiente", timestamp: Date.now() }); toggleCajaPedidoManual(); cargarPedidosAdmin(); } catch(err){ console.warn("Error pedido manual:", err); } };
window.eliminarPedido = async function(id) { if (confirm("¿Eliminar pedido?")) { await deleteDoc(doc(db, "pedidos", id)); cargarPedidosAdmin(); } };

function calcularRangoXP(xp) {
  let chunin = parseInt(document.getElementById('xpChunin')?.value) || 300;
  let jonin = parseInt(document.getElementById('xpJonin')?.value) || 600;
  let hokage = parseInt(document.getElementById('xpHokage')?.value) || 1000;
  if (xp >= hokage) return "Hokage";
  if (xp >= jonin) return "Jōnin";
  if (xp >= chunin) return "Chūnin";
  return "Genin";
}

async function cargarJugadoresAdmin() { 
  try { 
    const q = query(collection(db, "jugadores_cloud"), orderBy("updatedAt", "desc")); 
    const snapshot = await getDocs(q); 
    const cont = document.getElementById('listaJugadoresAdmin'); 
    if (snapshot.empty) { cont.innerHTML = "<p style='text-align:center;'>No hay jugadores registrados.</p>"; return; } 
    let htmlBloque = ""; 
    snapshot.forEach(d => { 
      const p = d.data().profile || {}; 
      const tag = p.tag || 'Sin Nombre'; 
      const xp = p.xp || 0; 
      const tokens = p.tokens || 0;
      const rango = p.rango || 'Genin'; 
      htmlBloque += `
      <div class="item-card-row">
        <div style="flex-grow: 1;">
          <div style="font-weight:700; color:#fff; font-size:1.05em;">${sanitizar(tag)}</div>
          <div style="font-size:0.85em; color:var(--text-muted);">
            Rango: <strong>${rango}</strong> | <strong style="color:var(--secondary-color);">${xp} XP</strong> | <strong style="color:#ffaa00;"><i class="fas fa-coins"></i> ${tokens} Tokens</strong>
          </div>
        </div>
        <div class="item-card-actions">
          <button class="btn-action-touch" style="color: #ff007f; border: 1px solid rgba(255,0,127,0.3);" title="Sumar/Restar XP" onclick="asignarXpManualmente('${d.id}', ${xp}, '${sanitizar(tag)}')"><i class="fas fa-star"></i></button>
          <button class="btn-action-touch" style="color: #ffaa00; border: 1px solid rgba(255,170,0,0.3);" title="Gestionar Tokens" onclick="asignarTokensManualmente('${d.id}', ${tokens}, '${sanitizar(tag)}')"><i class="fas fa-coins"></i></button>
          <button class="btn-action-touch btn-edit" title="Editar GamerTag" onclick="editarJugadorManualmente('${d.id}', '${sanitizar(tag)}')"><i class="fas fa-pen"></i></button>
          <button class="btn-action-touch btn-del" title="Eliminar Jugador" onclick="eliminarJugadorManualmente('${d.id}', '${sanitizar(tag)}')"><i class="fas fa-trash"></i></button>
          <button class="btn-action-touch" style="color: #ff3366; border: 1px solid rgba(255,51,102,0.3);" title="HARD RESET (Castigo a Tramposo)" onclick="resetearJugadorManualmente('${d.id}', '${sanitizar(tag)}')"><i class="fas fa-skull-crossbones"></i></button>
        </div>
      </div>`; 
    }); 
    cont.innerHTML = htmlBloque; 
  } catch(e) { console.warn("Error cargar jug:", e); } 
}

window.resetearJugadorManualmente = async function(uid, tag) {
  if (confirm(`🚨 ADVERTENCIA: ¿Estás seguro de hacer un HARD RESET a "${tag}"?\n\nEsto borrará todo su nivel, inventario, equipo y oro, regresándolo a Nivel 1. Úsalo solo con tramposos.`)) {
    try {
      let perfilCastigado = { 
        tag: tag, xp: 0, tokens: 0, rango: "Genin", profesion: "", 
        stats: { hpMax: 100, hpActual: 100, energiaMax: 100, energiaActual: 100, ultimaEnergia: Date.now(), atk: 10, def: 5 }, 
        inventario: [],
        equipo: { cabeza: null, pecho: null, piernas: null, pies: null, mano_derecha: null, mano_izquierda: null, amuleto: null, anillo: null, mascota: null },
        cooldowns: {}
      };
      
      await updateDoc(doc(db, "jugadores_cloud", uid), { 
          profile: perfilCastigado, 
          updatedAt: Date.now(),
          marcadoComoTramposo: true
      });
      
      alert(`☠️ Hard Reset aplicado con éxito a ${tag}. La justicia ha hablado.`);
      cargarJugadoresAdmin(); 
    } catch(e) { 
        alert("Error al resetear al jugador."); 
        console.warn(e);
    }
  }
};

window.asignarXpManualmente = async function(uid, currentXp, tag) { 
  let cantidad = parseInt(prompt(`⭐ ASIGNAR XP A: ${tag}\n\nIngresa la cantidad (usa negativos para restar):`)); 
  if (isNaN(cantidad)) return; 
  let newXp = currentXp + cantidad; 
  if (newXp < 0) newXp = 0; 
  let newRank = calcularRangoXP(newXp);
  try { 
    await updateDoc(doc(db, "jugadores_cloud", uid), { "profile.xp": newXp, "profile.rango": newRank, "updatedAt": Date.now() }); 
    cargarJugadoresAdmin(); 
  } catch(e) { alert("Error al actualizar XP"); } 
};

window.asignarTokensManualmente = async function(uid, currentTokens, tag) {
  let cantidad = parseInt(prompt(`🪙 GESTIONAR TOKENS DE: ${tag}\n\nIngresa la cantidad a sumar (usa negativos para restar):`));
  if (isNaN(cantidad)) return;
  let newTokens = currentTokens + cantidad;
  if (newTokens < 0) newTokens = 0;
  try {
    await updateDoc(doc(db, "jugadores_cloud", uid), { "profile.tokens": newTokens, "updatedAt": Date.now() });
    cargarJugadoresAdmin();
  } catch(e) { alert("Error al actualizar tokens."); }
};

window.editarJugadorManualmente = async function(uid, currentTag) {
  let nuevoTag = prompt("Modificar GamerTag:", currentTag);
  if (!nuevoTag || nuevoTag.trim() === "") return;
  try {
    await updateDoc(doc(db, "jugadores_cloud", uid), { "profile.tag": nuevoTag.trim(), "updatedAt": Date.now() });
    alert("GamerTag actualizado correctamente.");
    cargarJugadoresAdmin();
  } catch(e) { alert("Error al editar jugador."); }
};

window.eliminarJugadorManualmente = async function(uid, tag) {
  if (confirm(`¿Estás seguro de eliminar al jugador "${tag}"? Esta acción borrará sus datos de la nube.`)) {
    try { await deleteDoc(doc(db, "jugadores_cloud", uid)); cargarJugadoresAdmin(); } catch(e) { alert("Error al eliminar el jugador."); }
  }
};

window.toggleCajaFactura = function() { const box = document.getElementById('cajaFacturaManual'); box.style.display = (box.style.display === 'none') ? 'block' : 'none'; };
async function cargarFacturasAdmin() { const q = query(collection(db, "facturas"), orderBy("timestamp", "desc")); const snapshot = await getDocs(q); facturasAdminGlobal = []; const cont = document.getElementById('listaFacturasMobile'); document.getElementById('totalFacturasLbl').innerText = snapshot.size; if (snapshot.empty) { cont.innerHTML = ""; return; } let htmlBloque = ""; snapshot.forEach(docSnap => { const fac = { id: docSnap.id, ...docSnap.data() }; facturasAdminGlobal.push(fac); htmlBloque += `<div class="item-card-row"><div class="item-card-info"><strong>${sanitizar(fac.cliente)}</strong><br><span style="color:var(--secondary-color);">$${Number(fac.totalUsd).toFixed(2)}</span></div><div class="item-card-actions"><button class="btn-action-touch btn-print" onclick="imprimirFactura('${fac.id}')"><i class="fas fa-print"></i></button><button class="btn-action-touch btn-del" onclick="eliminarFactura('${fac.id}')"><i class="fas fa-trash"></i></button></div></div>`; }); cont.innerHTML = htmlBloque; }
window.guardarFactura = async function(e) { e.preventDefault(); await addDoc(collection(db, "facturas"), { cliente: document.getElementById('facCliente').value, cedula: document.getElementById('facCedula').value, metodo: document.getElementById('facMetodo').value, detalles: document.getElementById('facDetalles').value, totalUsd: parseFloat(document.getElementById('facTotal').value), timestamp: Date.now() }); document.getElementById('formFactura').reset(); toggleCajaFactura(); cargarFacturasAdmin(); };
window.eliminarFactura = async function(id) { if (confirm("¿Eliminar?")) { await deleteDoc(doc(db, "facturas", id)); cargarFacturasAdmin(); } };
window.imprimirFactura = function(id) { const fac = facturasAdminGlobal.find(f => f.id === id); if(!fac) return; document.getElementById('printFecha').innerText = new Date(fac.timestamp).toLocaleString(); document.getElementById('printCliente').innerText = fac.cliente; document.getElementById('printCedula').innerText = fac.cedula || 'N/A'; document.getElementById('printMetodo').innerText = fac.metodo; document.getElementById('printDetalles').innerText = fac.detalles; document.getElementById('printTotal').innerText = Number(fac.totalUsd).toFixed(2); window.print(); };

async function cargarBannersAdmin() { const q = query(collection(db, "banners"), orderBy("timestamp", "desc")); const snapshot = await getDocs(q); const cont = document.getElementById('listaBannersAdmin'); if (snapshot.empty) { cont.innerHTML = ""; return; } let htmlBloque = ""; snapshot.forEach(d => { htmlBloque += `<div class="item-card-row"><img src="${d.data().imgUrl}" style="width: 70px; height: 40px; object-fit: cover;"><button class="btn-action-touch btn-del" onclick="eliminarBanner('${d.id}')"><i class="fas fa-trash"></i></button></div>`; }); cont.innerHTML = htmlBloque; }
window.agregarBanner = async function(e) { e.preventDefault(); const file = document.getElementById('bannerFileInput').files[0]; if (!file) return; const url = await comprimirYConvertirAWebP(file, 900, 0.75); await addDoc(collection(db, "banners"), { imgUrl: url, timestamp: Date.now() }); cargarBannersAdmin(); };
window.eliminarBanner = async function(id) { if(confirm("¿Eliminar?")) { await deleteDoc(doc(db, "banners", id)); cargarBannersAdmin(); } };
async function cargarCuponesAdmin() { const snap = await getDocs(collection(db, "cupones")); const cont = document.getElementById('listaCuponesAdmin'); let html = ""; snap.forEach(d => { html += `<div class="item-card-row"><div style="flex-grow:1; color:var(--secondary-color); font-weight:bold;">${sanitizar(d.data().codigo)}</div><button class="btn-action-touch btn-del" onclick="eliminarCupon('${d.id}')"><i class="fas fa-trash"></i></button></div>`; }); cont.innerHTML = html; }
window.agregarCupon = async function(e) { e.preventDefault(); await addDoc(collection(db, "cupones"), { codigo: document.getElementById('cuponCodigo').value.toUpperCase(), porcentaje: parseInt(document.getElementById('cuponPorcentaje').value), timestamp: Date.now() }); cargarCuponesAdmin(); };
window.eliminarCupon = async function(id) { await deleteDoc(doc(db, "cupones", id)); cargarCuponesAdmin(); };
async function cargarDatosGenerales() { try { const snap = await getDoc(doc(db, "configuracion", "datos_pago")); if (snap.exists()) { const d = snap.data(); document.getElementById('pagoBanco').value = d.banco||''; document.getElementById('pagoTelefono').value = d.telefono||''; document.getElementById('pagoCedula').value = d.cedula||''; document.getElementById('pagoBinance').value = d.binance||''; } } catch(e){ console.warn("Error datos gen:", e); } try { const s = await getDoc(doc(db, "configuracion", "rangos_ninja")); if (s.exists()) { const d = s.data(); document.getElementById('xpChunin').value = d.chunin??300; document.getElementById('xpJonin').value = d.jonin??600; document.getElementById('xpHokage').value = d.hokage??1000; } } catch(e){} }
window.guardarDatosPago = async function(e) { e.preventDefault(); await setDoc(doc(db, "configuracion", "datos_pago"), { banco: document.getElementById('pagoBanco').value, telefono: document.getElementById('pagoTelefono').value, cedula: document.getElementById('pagoCedula').value, binance: document.getElementById('pagoBinance').value }); alert("Guardado."); };
window.guardarRangosNinja = async function(e) { e.preventDefault(); await setDoc(doc(db, "configuracion", "rangos_ninja"), { genin: 0, chunin: parseInt(document.getElementById('xpChunin').value), jonin: parseInt(document.getElementById('xpJonin').value), hokage: parseInt(document.getElementById('xpHokage').value) }); alert("Guardado."); };

async function cargarReviewsAdmin() { const q = query(collection(db, "reviews"), orderBy("timestamp", "desc")); const snap = await getDocs(q); let html=""; snap.forEach(d => { html += `<div class="item-card-row"><div style="flex-grow:1; font-size:0.9em;">${sanitizar(d.data().nombre)}<br><span style="color:var(--text-muted);">${sanitizar(d.data().texto)}</span></div><button class="btn-action-touch btn-del" onclick="eliminarReview('${d.id}')"><i class="fas fa-trash"></i></button></div>`; }); document.getElementById('listaReviewsAdmin').innerHTML = html; }
window.eliminarReview = async function(id) { await deleteDoc(doc(db, "reviews", id)); cargarReviewsAdmin(); };
