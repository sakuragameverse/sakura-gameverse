import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, getDocs, orderBy, query, doc, getDoc, setDoc, addDoc, where, onSnapshot, limit } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

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

let productosNubeGlobal = [];
let globalAudioCtx = null;
const META_ENVIO_GRATIS = 40.00; 
let filtroGlobal = { categoria: 'todos', coleccion: 'todos', estado: 'todos', busqueda: '' };
let limiteActual = 12;

let ajustesWebGlobal = { whatsapp: "584244970576", costoGacha: 100, tokensCofre: 15 };
let waifusGachaGlobal = [];
let modoGachaActual = 'waifus'; 
let currentUserUid = null;
let escuchadorRumble = null;
let rankingCargado = false;

let gamerProfile = JSON.parse(localStorage.getItem('sakura_gamer_profile')) || { 
  tag: "GamerOtaku_VE", 
  xp: 150, 
  tokens: 0, 
  rango: "Genin", 
  waifus: [],
  profesion: "", 
  stats: { hp: 100, atk: 10, def: 5 },
  inventario: [],
  equipo: { armaId: null }
};

if(gamerProfile.profesion === undefined) {
  gamerProfile.profesion = "";
  gamerProfile.stats = { hp: 100, atk: 10, def: 5 };
  gamerProfile.inventario = [];
  gamerProfile.equipo = { armaId: null };
}

let carrito = JSON.parse(localStorage.getItem('sakura_carrito')) || [];
let favoritos = JSON.parse(localStorage.getItem('sakura_favoritos')) || [];
let rpgObjetosGlobal = [];

// ====== HISTORIAL Y NAVEGACIÓN (BOTÓN ATRÁS DEL TELÉFONO) ======
function pushModalState() { history.pushState({ modalAbierto: true }, null, ""); }
window.addEventListener("popstate", function(event) {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
});

// ====== DAÑO FLOTANTE (RPG TOUCH) ======
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

async function cargarCMSyGacha() {
  try {
      const snap = await getDoc(doc(db, "configuracion", "ajustes_web"));
      if (snap.exists()) {
          let d = snap.data();
          if(d.whatsapp) ajustesWebGlobal.whatsapp = d.whatsapp;
          if(d.costoGacha) ajustesWebGlobal.costoGacha = parseInt(d.costoGacha);
          if(d.tokensCofre !== undefined) ajustesWebGlobal.tokensCofre = parseInt(d.tokensCofre);
          
          if(d.ticker) document.getElementById('ajustesTickerObj').innerText = d.ticker;
          if(d.heroTitle) document.getElementById('ajustesHeroTitleObj').innerText = d.heroTitle;
          if(d.heroDesc) document.getElementById('ajustesHeroDescObj').innerText = d.heroDesc;
          
          let lbl = document.getElementById('lblCostoGacha');
          if(lbl) lbl.innerText = ajustesWebGlobal.costoGacha;
      }
  } catch(e) { console.warn("Aviso CMS:", e); }

  try {
      const q = query(collection(db, "waifus_gacha"));
      const snaps = await getDocs(q);
      waifusGachaGlobal = [];
      snaps.forEach(d => {
          let w = d.data();
          if(!w.oculto) waifusGachaGlobal.push({id: d.id, ...w});
      });
  } catch(e) { console.warn("Aviso Gacha BD:", e); }
}

window.cambiarModoGacha = function(modo) {
    reproducirSonido();
    modoGachaActual = modo;
    document.getElementById('tabGachaWaifu').classList.remove('activo');
    document.getElementById('tabGachaPoke').classList.remove('activo');
    document.getElementById('tabGachaGenshin').classList.remove('activo');
    
    let img = document.getElementById('gachaWaifuImg');
    let text = document.getElementById('gachaOverlayText');
    document.getElementById('gachaResultado').style.display = 'none';

    if(modo === 'pokemon') {
        document.getElementById('tabGachaPoke').classList.add('activo');
        img.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png';
        text.innerHTML = "<i class='fas fa-cube'></i> MÁQUINA POKÉMON";
    } else if(modo === 'genshin') {
        document.getElementById('tabGachaGenshin').classList.add('activo');
        img.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Genshin_Impact_logo.svg/512px-Genshin_Impact_logo.svg.png';
        text.innerHTML = "<i class='fas fa-star'></i> MÁQUINA GENSHIN";
    } else {
        document.getElementById('tabGachaWaifu').classList.add('activo');
        img.src = 'logo.webp?v=2';
        text.innerHTML = "<i class='fas fa-bolt'></i> MÁQUINA WAIFUS";
    }
    img.style.opacity = '0.3';
    img.classList.remove('animating-gacha');
};

window.abrirGachaModal = function() {
    pushModalState();
    reproducirSonido();
    document.getElementById('lblSaldoGacha').innerText = gamerProfile.tokens || 0;
    document.getElementById('modalGacha').style.display = 'flex';
    cambiarModoGacha('waifus');
    document.getElementById('gachaOverlay').style.display = 'flex';
};
window.cerrarGachaModal = function() { document.getElementById('modalGacha').style.display = 'none'; };

window.realizarTiradaGacha = async function() {
    reproducirSonido();
    let costo = ajustesWebGlobal.costoGacha;
    
    if(!gamerProfile.tokens) gamerProfile.tokens = 0;
    if(gamerProfile.tokens < costo) return alert(`Necesitas al menos ${costo} Tokens para realizar una invocación.`);
    
    if(modoGachaActual === 'waifus' && waifusGachaGlobal.length === 0) return alert("Tu máquina de Waifus está vacía. Ve al Admin y agrega cartas.");

    let btn = document.getElementById('btnTirarGacha');
    btn.disabled = true;
    
    gamerProfile.tokens -= costo; 
    actualizarRangoSegunXP(); 
    guardarProgresoNube();
    document.getElementById('lblSaldoGacha').innerText = gamerProfile.tokens;

    let overlay = document.getElementById('gachaOverlay');
    let img = document.getElementById('gachaWaifuImg');
    let resBox = document.getElementById('gachaResultado');
    
    overlay.innerHTML = "<i class='fas fa-spinner fa-spin' style='font-size: 2em; margin-bottom:10px; color:#ff007f;'></i><span>INVOCANDO...</span>";
    overlay.style.display = "flex";
    img.style.opacity = "1";
    img.classList.add('animating-gacha'); 
    resBox.style.display = "none";

    if (modoGachaActual === 'waifus') {
        setTimeout(() => {
            let rand = Math.random() * 100;
            let targetRareza = rand <= 2 ? 'SSR' : (rand <= 10 ? 'SR' : (rand <= 40 ? 'R' : 'N'));
            
            let posibles = waifusGachaGlobal.filter(w => w.rareza === targetRareza);
            if(posibles.length === 0) posibles = waifusGachaGlobal; 
            let elegida = posibles[Math.floor(Math.random() * posibles.length)];

            procesarResultadoGacha(elegida.id, elegida.nombre, elegida.imgUrl, elegida.rareza, elegida.premio, "Waifu");
            btn.disabled = false;
        }, 1800);
    } 
    else if (modoGachaActual === 'pokemon') {
        try {
            let randomId = Math.floor(Math.random() * 1010) + 1;
            let resp = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
            let data = await resp.json();
            
            let rand = Math.random() * 100;
            let rareza = rand <= 2 ? 'SSR' : (rand <= 10 ? 'SR' : (rand <= 40 ? 'R' : 'N'));
            
            let pokeName = data.name.charAt(0).toUpperCase() + data.name.slice(1);
            let pokeImg = data.sprites.other['official-artwork'].front_default || data.sprites.front_default;
            
            setTimeout(() => {
                procesarResultadoGacha('poke_'+randomId, pokeName, pokeImg, rareza, "¡Pokémon Atrapado!", "Pokémon");
                btn.disabled = false;
            }, 1000);
        } catch(e) {
            alert("Error de conexión con la base Pokémon.");
            img.classList.remove('animating-gacha');
            btn.disabled = false;
        }
    }
    else if (modoGachaActual === 'genshin') {
        try {
            let resp = await fetch(`https://genshin.jmp.blue/characters`);
            let chars = await resp.json();
            let randomChar = chars[Math.floor(Math.random() * chars.length)];
            
            let charDataResp = await fetch(`https://genshin.jmp.blue/characters/${randomChar}`);
            let charData = await charDataResp.json();
            
            let rareza = charData.rarity === 5 ? 'SSR' : (charData.rarity === 4 ? 'SR' : 'R');
            let charName = charData.name;
            let charImg = `https://genshin.jmp.blue/characters/${randomChar}/icon-big`;
            
            setTimeout(() => {
                procesarResultadoGacha('gen_'+randomChar, charName, charImg, rareza, `Visión: ${charData.vision || 'Ninguna'}`, "Genshin");
                btn.disabled = false;
            }, 1000);
        } catch(e) {
            alert("Error de conexión con el servidor de Genshin.");
            img.classList.remove('animating-gacha');
            btn.disabled = false;
        }
    }
};

function procesarResultadoGacha(id, nombre, imgUrl, rareza, premio, tipo) {
    let overlay = document.getElementById('gachaOverlay');
    let img = document.getElementById('gachaWaifuImg');
    let resBox = document.getElementById('gachaResultado');

    if(!gamerProfile.waifus) gamerProfile.waifus = [];
    if(!gamerProfile.waifus.some(w => w.nombre === nombre)) {
        gamerProfile.waifus.push({id: id, nombre: nombre, imgUrl: imgUrl, rareza: rareza});
        guardarProgresoNube();
        renderizarAlbumWaifus();
    }

    try {
        addDoc(collection(db, "historial_gacha"), {
            jugador: gamerProfile.tag,
            waifu: `${tipo}:${nombre}`,
            rareza: rareza,
            premio: premio,
            timestamp: Date.now()
        });
    } catch(e) { console.warn("Aviso historial gacha:", e); }

    overlay.style.display = "none";
    img.classList.remove('animating-gacha');
    img.src = imgUrl;
    img.style.opacity = "1";
    
    let badge = document.getElementById('gachaRarezaBadge');
    badge.innerText = rareza;
    badge.className = "tag-badge tag-" + rareza.toLowerCase();
    document.getElementById('gachaNombre').innerText = nombre;
    document.getElementById('gachaPremio').innerText = premio;
    resBox.style.display = "block";

    if(rareza === 'SSR') { try{ confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } }); }catch(e){ console.warn("Aviso Confetti:", e); } }
    else if(rareza === 'SR') { try{ confetti({ particleCount: 50, spread: 50, origin: { y: 0.5 } }); }catch(e){ console.warn("Aviso Confetti:", e); } }
}

function renderizarAlbumWaifus() {
    let cont = document.getElementById('albumWaifusContenedor');
    let arr = gamerProfile.waifus || [];
    document.getElementById('lblTotalWaifusJugador').innerText = arr.length;
    
    if(arr.length === 0) {
        cont.innerHTML = `<p style="color: var(--text-muted); font-size: 0.8em; margin: 0;">Juega al Arcade para coleccionar.</p>`;
        return;
    }
    
    let html = "";
    arr.sort((a,b) => {
       let r = {'SSR':4, 'SR':3, 'R':2, 'N':1};
       return (r[b.rareza]||0) - (r[a.rareza]||0);
    });

    arr.forEach(w => {
        let badgeColor = w.rareza === 'SSR' ? '#ffaa00' : (w.rareza === 'SR' ? '#b000ff' : (w.rareza === 'R' ? '#00e5ff' : '#b4becd'));
        html += `
        <div class="waifu-card-mini">
            <img src="${w.imgUrl}" loading="lazy">
            <div class="badge" style="background: rgba(0,0,0,0.8); color: ${badgeColor}; padding: 2px 6px; border-radius: 4px; font-weight: bold; border: 1px solid ${badgeColor}40;">${w.rareza}</div>
        </div>`;
    });
    cont.innerHTML = html;
}

onAuthStateChanged(auth, async (user) => {
  let btnMenu = document.getElementById('btnMenuCloud');
  let lblEstado = document.getElementById('estadoSincronizacion');
  if (user) {
    currentUserUid = user.uid;
    lblEstado.innerHTML = `<i class="fas fa-cloud-arrow-down" style="color:#25d366;"></i> Nube Conectada`;
    if(btnMenu) btnMenu.innerHTML = `<i class="fas fa-user-check"></i> Cuenta Vinculada`;
    
    await descargarProgresoNube(user.uid);
    
    document.getElementById('formCloudSave').style.display = 'none';
    document.getElementById('perfilCloudSave').style.display = 'block';
  } else {
    currentUserUid = null;
    lblEstado.innerHTML = `<i class="fas fa-gamepad" style="color:var(--text-muted);"></i> Jugador Local`;
    if(btnMenu) btnMenu.innerHTML = `<i class="fas fa-cloud"></i> Vincular Nube`;
    
    document.getElementById('formCloudSave').style.display = 'block';
    document.getElementById('perfilCloudSave').style.display = 'none';
  }
});

window.abrirCloudSaveModal = function() { pushModalState(); reproducirSonido(); document.getElementById('authErrorMsg').style.display = 'none'; document.getElementById('modalCloudSave').style.display = 'flex'; };
window.cerrarCloudSaveModal = function() { document.getElementById('modalCloudSave').style.display = 'none'; };

window.registrarCloud = async function() {
  reproducirSonido(); let e = document.getElementById('authEmail').value.trim(); let p = document.getElementById('authPass').value.trim(); let msg = document.getElementById('authErrorMsg');
  if(!e || !p) { msg.innerText = "Llenar campos."; msg.style.display="block"; return; }
  try { msg.style.display="none"; await createUserWithEmailAndPassword(auth, e, p); await guardarProgresoNube(); cerrarCloudSaveModal(); } 
  catch(err) { msg.innerText = "Error: El correo ya existe o la clave es muy corta."; msg.style.display="block"; }
};

window.entrarCloud = async function() {
  reproducirSonido(); let e = document.getElementById('authEmail').value.trim(); let p = document.getElementById('authPass').value.trim(); let msg = document.getElementById('authErrorMsg');
  if(!e || !p) { msg.innerText = "Llenar campos."; msg.style.display="block"; return; }
  try { msg.style.display="none"; await signInWithEmailAndPassword(auth, e, p); cerrarCloudSaveModal(); } 
  catch(err) { msg.innerText = "Usuario no encontrado o clave incorrecta."; msg.style.display="block"; }
};

window.cerrarSesionCloud = async function() {
  reproducirSonido(); await signOut(auth);
  localStorage.removeItem('sakura_gamer_profile'); localStorage.removeItem('sakura_carrito'); localStorage.removeItem('sakura_favoritos');
  gamerProfile = { tag: "Gamer_Guest", xp: 0, tokens: 0, rango: "Genin", waifus: [], profesion: "", stats: {hp: 100, atk: 10, def: 5}, inventario: [], equipo: {armaId: null} }; carrito = []; favoritos = [];
  actualizarBadges(); actualizarRangoSegunXP(); renderizarAlbumWaifus(); cerrarCloudSaveModal(); alert("Sesión cerrada. Tu partida está a salvo en la nube.");
};

async function descargarProgresoNube(uid) {
    try {
        const docRef = doc(db, "jugadores_cloud", uid); const snap = await getDoc(docRef);
        if(snap.exists()) {
            const d = snap.data();
            if(d.profile) {
                gamerProfile = d.profile;
                if (gamerProfile.tokens === undefined) gamerProfile.tokens = 0; 
                if(gamerProfile.profesion === undefined) gamerProfile.profesion = ""; 
                if(!gamerProfile.stats) gamerProfile.stats = {hp:100,atk:10,def:5};
                if(!gamerProfile.inventario) gamerProfile.inventario = [];
                if(!gamerProfile.equipo) gamerProfile.equipo = {armaId: null};
            }
            if(d.favoritos) favoritos = d.favoritos; if(d.carrito) carrito = d.carrito;
            if(d.ultimoCofre) localStorage.setItem('sakura_ultimo_cofre', d.ultimoCofre);
            
            localStorage.setItem('sakura_gamer_profile', JSON.stringify(gamerProfile)); localStorage.setItem('sakura_favoritos', JSON.stringify(favoritos)); localStorage.setItem('sakura_carrito', JSON.stringify(carrito));
            document.getElementById('inputGamerTag').value = gamerProfile.tag; actualizarBadges(); actualizarRangoSegunXP(); renderizarAlbumWaifus();
        } else { guardarProgresoNube(); }
    } catch(e) { console.warn("Aviso Descarga Nube:", e); }
}

window.guardarProgresoNube = async function() {
    if(!currentUserUid) return;
    try { await setDoc(doc(db, "jugadores_cloud", currentUserUid), { profile: gamerProfile, favoritos: favoritos, carrito: carrito, ultimoCofre: localStorage.getItem('sakura_ultimo_cofre') || '', updatedAt: Date.now() }, { merge: true }); } catch(e) { console.warn("Aviso Guardado Nube:", e); }
};

let eventoInstalacion = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); eventoInstalacion = e; const btn = document.getElementById('btnInstalarPWA'); if(btn) btn.style.display = 'block'; });
window.instalarPWA = async function() { reproducirSonido(); if (!eventoInstalacion) return; eventoInstalacion.prompt(); const { outcome } = await eventoInstalacion.userChoice; if (outcome === 'accepted') document.getElementById('btnInstalarPWA').style.display = 'none'; eventoInstalacion = null; };

window.reproducirSonido = function() {
  try {
    if (!globalAudioCtx) globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (globalAudioCtx.state === 'suspended') globalAudioCtx.resume();
    const osc = globalAudioCtx.createOscillator(); const gainNode = globalAudioCtx.createGain();
    osc.type = 'triangle'; osc.frequency.setValueAtTime(520, globalAudioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.04, globalAudioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, globalAudioCtx.currentTime + 0.06);
    osc.connect(gainNode); gainNode.connect(globalAudioCtx.destination); osc.start(); osc.stop(globalAudioCtx.currentTime + 0.06);
  } catch(e) { console.warn("Aviso Audio:", e); }
};

function sanitizarHTML(str) { if (!str) return ''; return String(str).replace(/[&<>"']/g, function(m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]; }); }

async function cargarConfigCategoriasPublico() {
  try {
    const q = query(collection(db, "configuracion"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((docSnap) => {
      let conf = docSnap.data();
      if(conf?.tipo === 'categoria_foto') {
        let catImgEl = document.getElementById(`img-cat-${conf.categoriaId}`);
        if(catImgEl && conf.imgUrl) catImgEl.src = conf.imgUrl;
        let catTitleEl = document.getElementById(`title-cat-${conf.categoriaId}`);
        if(catTitleEl && conf.nombrePersonalizado) catTitleEl.innerText = conf.nombrePersonalizado;
      }
    });
  } catch (e) { console.warn("Aviso Config Categorías:", e); }
}

window.copiarTexto = function(texto) { reproducirSonido(); navigator.clipboard.writeText(texto).then(() => alert("Copiado al portapapeles.")); };

async function cargarBannersDeNube() {
  try {
    const q = query(collection(db, "banners"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    const container = document.getElementById('bannerSliderContainer');
    let bannersValidos = [];
    querySnapshot.forEach((docSnap) => { let b = docSnap.data(); if (b?.imgUrl) bannersValidos.push(b.imgUrl); });
    if (bannersValidos.length === 0) { container.style.display = 'none'; return; }
    container.style.display = 'block';
    let htmlImgs = ''; let htmlDots = '<div class="banner-dots">'; 
    bannersValidos.forEach((url, index) => {
      htmlImgs += `<img src="${url}" class="banner-slide ${index === 0 ? 'active' : ''}" data-index="${index}" loading="lazy">`;
      htmlDots += `<div class="banner-dot ${index === 0 ? 'active' : ''}" onclick="cambiarBannerManual(${index})"></div>`;
    });
    htmlDots += '</div>'; container.innerHTML = htmlImgs + htmlDots; iniciarAutoSliderBanners(bannersValidos.length);
  } catch (e) { console.warn("Aviso Banners:", e); }
}
let bannerInterval; let totalBanners = 0;
function iniciarAutoSliderBanners(total) { totalBanners = total; if(total <= 1) return; bannerInterval = setInterval(() => rotarBanner(1), 5000); }
window.rotarBanner = function(direccion) {
  if(totalBanners <= 1) return; let slides = document.querySelectorAll('.banner-slide'); let dots = document.querySelectorAll('.banner-dot');
  if(!slides.length) return;
  let currentIdx = Array.from(slides).findIndex(s => s.classList.contains('active'));
  if(currentIdx === -1) currentIdx = 0;
  slides[currentIdx].classList.remove('active'); dots[currentIdx].classList.remove('active');
  let nextIdx = currentIdx + direccion;
  if(nextIdx >= totalBanners) nextIdx = 0; if(nextIdx < 0) nextIdx = totalBanners - 1;
  slides[nextIdx].classList.add('active'); dots[nextIdx].classList.add('active');
};

async function cargarProductosDeNube() {
  try {
    const q = query(collection(db, "productos"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    productosNubeGlobal = [];
    querySnapshot.forEach((docSnap) => { productosNubeGlobal.push({ id: docSnap.id, ...docSnap.data() }); });
    renderizarProductosEnTienda(productosNubeGlobal);
  } catch (error) { document.getElementById('catalogoNube').innerHTML = "<p style='color: #ff3366; text-align: center; grid-column: 1/-1;'>No fue posible conectar con la base de datos.</p>"; }
}

window.renderizarProductosEnTienda = function(lista) {
  let contenedor = document.getElementById('catalogoNube'); if (!contenedor) return; contenedor.innerHTML = "";
  let conteo = { recargas: 0, mangas: 0, ropa: 0, mandos: 0, perifericos: 0, figuras: 0, peluches: 0, cartas: 0, katanas: 0, lamparas: 0, accesorios: 0 };
  
  let prodsVisibles = lista.filter(p => !p.oculto);
  let elTodos = document.getElementById('count-todos'); if(elTodos) elTodos.innerText = prodsVisibles.length + " items";
  if (prodsVisibles.length === 0) { contenedor.innerHTML = "<p style='color: var(--text-muted); text-align: center; grid-column: 1/-1;'>No se encontraron productos disponibles.</p>"; return; }

  lista.forEach((prod, indexProd) => {
    if(prod.oculto) return; 
    let fotosArray = (prod.fotos && prod.fotos.length > 0) ? prod.fotos : ['logo.webp?v=2'];
    let categoria = (prod.categoria || 'mangas').toLowerCase();
    let esRecarga = categoria === 'recargas';
    
    if (categoria === 'teclados' || categoria === 'audifonos' || categoria === 'perifericos') { conteo.perifericos++; } 
    else if (conteo[categoria] !== undefined) { conteo[categoria]++; }

    let isAgotado = (prod.stock !== undefined && prod.stock <= 0) && !esRecarga;
    let badgeClase = isAgotado ? 'badge-agotado' : (prod.estado && prod.estado.includes("Encargo") ? 'badge-encargo' : (esRecarga ? 'badge-digital' : 'badge-stock'));
    let textoBadge = isAgotado ? 'AGOTADO' : (prod.estado || (esRecarga ? 'Recarga Directa' : 'Stock'));
    let cardClassAddition = isAgotado ? ' agotado' : '';

    let imgsHtml = ''; 
    fotosArray.forEach((foto, fIdx) => { imgsHtml += `<img src="${foto}" class="${fIdx === 0 ? 'activa' : ''}" loading="lazy">`; });

    let btnCarruselHtml = '';
    if(fotosArray.length > 1) {
        btnCarruselHtml = `
          <button class="carrusel-btn carrusel-prev" onclick="event.stopPropagation(); moverCarruselCard('${prod.id}', -1)"><i class="fas fa-chevron-left"></i></button>
          <button class="carrusel-btn carrusel-next" onclick="event.stopPropagation(); moverCarruselCard('${prod.id}', 1)"><i class="fas fa-chevron-right"></i></button>
        `;
    }

    contenedor.innerHTML += `
      <div class="card item-producto${cardClassAddition}" data-id="${prod.id}" data-nombre="${sanitizarHTML(prod.nombre).toLowerCase()}" data-categoria="${categoria}" data-precio="${prod.precio}" onclick="abrirModalPorId('${prod.id}')">
        <button class="btn-fav-card" onclick="toggleFavoritoPorId(event, '${prod.id}')"><i class="fas fa-heart"></i></button>
        <div class="badge-estado ${badgeClase}">${textoBadge}</div>
        <div class="card-img-container" id="carrusel-card-${prod.id}">
          ${imgsHtml}${btnCarruselHtml}
        </div>
        <div class="card-title">${sanitizarHTML(prod.nombre)}</div> <div class="precio-container"><span class="card-price">$${Number(prod.precio).toFixed(2)}</span></div>
      </div>
    `;
  });

  for(let cat in conteo) { let elem = document.getElementById('count-' + cat); if(elem) elem.innerText = conteo[cat] + " items"; }
  renderizarSelectColecciones(lista); limiteActual = 12; aplicarFiltrosGlobales();
};

window.moverCarruselCard = function(prodId, direccion) {
    reproducirSonido();
    let contenedor = document.getElementById(`carrusel-card-${prodId}`);
    if(!contenedor) return;
    let imgs = Array.from(contenedor.querySelectorAll('img'));
    let idxActual = imgs.findIndex(img => img.classList.contains('activa'));
    if(idxActual === -1) idxActual = 0;
    
    imgs[idxActual].classList.remove('activa');
    let nuevoIdx = idxActual + direccion;
    if(nuevoIdx >= imgs.length) nuevoIdx = 0;
    if(nuevoIdx < 0) nuevoIdx = imgs.length - 1;
    
    imgs[nuevoIdx].classList.add('activa');
};

function renderizarSelectColecciones(productos) {
  const select = document.getElementById('selectColeccion'); if (!select) return;
  const coleccionesUnicas = new Set();
  productos.forEach(p => { if (!p.oculto && p.coleccion && p.coleccion.trim() !== '') coleccionesUnicas.add(p.coleccion.trim()); });
  let html = `<option value="todos">Colección: Todas</option>`;
  coleccionesUnicas.forEach(col => { html += `<option value="${sanitizarHTML(col)}">${sanitizarHTML(col)}</option>`; });
  select.innerHTML = html;
}

window.cambiarColeccionDropdown = function(col) { reproducirSonido(); filtroGlobal.coleccion = col; limiteActual = 12; aplicarFiltrosGlobales(); };
window.filtrarCategoria = function(cat) {
  reproducirSonido(); document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('activa'));
  let cardVisual = document.querySelector(`.cat-card[onclick*="'${cat}'"]`); if(cardVisual) cardVisual.classList.add('activa');
  filtroGlobal.categoria = cat; limiteActual = 12; aplicarFiltrosGlobales();
};
window.filtrarEstadoDropdown = function(est) { reproducirSonido(); filtroGlobal.estado = est; limiteActual = 12; aplicarFiltrosGlobales(); };
window.buscarProductos = function() { filtroGlobal.busqueda = document.getElementById('buscador').value.trim().toLowerCase(); limiteActual = 12; aplicarFiltrosGlobales(); };

function aplicarFiltrosGlobales() {
  let productos = document.querySelectorAll('#catalogoNube .item-producto'); let mostrados = 0; let coincidencias = 0;
  productos.forEach(card => {
    let cat = (card.getAttribute('data-categoria') || '').toLowerCase(); let nom = card.getAttribute('data-nombre') || '';
    let cumpleCat = (filtroGlobal.categoria === 'todos') ? true : (filtroGlobal.categoria === 'perifericos' ? (cat === 'perifericos' || cat === 'teclados' || cat === 'audifonos') : cat === filtroGlobal.categoria);
    let cumpleBusqueda = (!filtroGlobal.busqueda || nom.includes(filtroGlobal.busqueda));

    if (cumpleCat && cumpleBusqueda) {
      coincidencias++; if (mostrados < limiteActual) { card.style.display = 'block'; mostrados++; } else { card.style.display = 'none'; }
    } else { card.style.display = 'none'; }
  });
  let btnCargarMas = document.getElementById('btnCargarMas'); if (btnCargarMas) btnCargarMas.style.display = (coincidencias > limiteActual) ? 'block' : 'none';
}

window.cargarMasProductos = function() { reproducirSonido(); limiteActual += 12; aplicarFiltrosGlobales(); };

window.abrirModalPorId = function(prodId) {
  pushModalState();
  reproducirSonido(); const prod = productosNubeGlobal.find(p => p.id === prodId); if (!prod) return;
  const fotosArray = (prod.fotos && prod.fotos.length > 0) ? prod.fotos : ['logo.webp?v=2'];
  const esRecarga = prod.categoria === 'recargas'; const esAgotado = (prod.stock !== undefined && prod.stock <= 0) && !esRecarga;
  
  window.productoActual = { id: prod.id, img: fotosArray[0], titulo: prod.nombre, precio: prod.precio, esRopa: prod?.categoria?.includes('ropa'), esRecarga };

  document.getElementById('modalImg').src = fotosArray[0]; 
  document.getElementById('modalTitulo').innerText = prod.nombre; 
  document.getElementById('modalPrecio').innerText = "$" + Number(prod.precio).toFixed(2);
  document.getElementById('modalDesc').innerText = prod.descripcion || 'Producto oficial Sakura Gameverse.';
  document.getElementById('modalTag').innerText = esAgotado ? 'AGOTADO' : (prod.estado || 'Stock');
  document.getElementById('tallasContainer').style.display = window.productoActual.esRopa ? 'block' : 'none';
  document.getElementById('recargaContainer').style.display = esRecarga ? 'block' : 'none';

  let minisCont = document.getElementById('modalContainerMinis');
  if(fotosArray.length > 1) {
      let htmlMinis = '';
      fotosArray.forEach((foto, i) => { htmlMinis += `<img src="${foto}" class="modal-mini-img ${i===0?'activo':''}" onclick="cambiarImagenModal(this, '${foto}')">`; });
      minisCont.innerHTML = htmlMinis;
  } else { minisCont.innerHTML = ''; }

  let btnAdd = document.getElementById('btnComprarModal');
  if(esAgotado) { btnAdd.disabled = true; btnAdd.innerHTML = '<i class="fas fa-ban"></i> Sin Stock Temporalmente'; } 
  else { btnAdd.disabled = false; btnAdd.innerHTML = '<i class="fas fa-cart-plus"></i> Añadir al Carrito'; }
  
  document.getElementById('miModal').style.display = 'flex';
};

window.cambiarImagenModal = function(elemento, url) {
    reproducirSonido(); document.getElementById('modalImg').src = url; window.productoActual.img = url; 
    document.querySelectorAll('.modal-mini-img').forEach(img => img.classList.remove('activo')); elemento.classList.add('activo');
};

window.abrirRastreoModal = function() {
    pushModalState();
    reproducirSonido(); document.getElementById('modalRastreo').style.display = 'flex';
    document.getElementById('resultadoRastreo').innerHTML = "<p style='color: var(--text-muted); text-align: center; margin: 0; font-size: 0.85em;'>Tu estado de cuenta aparecerá aquí.</p>";
    document.getElementById('inputRastreoTlf').value = "";
};
window.cerrarRastreoModal = function() { document.getElementById('modalRastreo').style.display = 'none'; };

window.buscarPedido = async function() {
    reproducirSonido(); let tlf = document.getElementById('inputRastreoTlf').value.trim();
    if(!tlf) return alert("Por favor ingresa un número de teléfono válido.");
    let cont = document.getElementById('resultadoRastreo'); cont.innerHTML = "<p style='text-align:center; color: var(--secondary-color);'><i class='fas fa-spinner fa-spin'></i> Conectando con la base de datos...</p>";
    try {
        const q = query(collection(db, "pedidos"), where("telefono", "==", tlf)); const snap = await getDocs(q);
        if(snap.empty) { cont.innerHTML = "<p style='color: #ff3366; text-align:center; font-weight: bold;'><i class='fas fa-exclamation-circle'></i> No se encontraron pedidos recientes con este número.</p>"; return; }
        let pedidos = []; snap.forEach(d => pedidos.push({id: d.id, ...d.data()})); pedidos.sort((a,b) => b.timestamp - a.timestamp); let p = pedidos[0]; 
        let estados = ["Pendiente", "Pagado", "Enviado", "Completado"]; let idxEstado = estados.indexOf(p.estadoPedido); if(idxEstado === -1) idxEstado = 0; 
        let html = `<div style="font-size:
