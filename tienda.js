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
        let html = `<div style="font-size: 0.9em; margin-bottom: 15px; color: #fff;">Última orden de: <strong>${sanitizarHTML(p.cliente)}</strong></div><div class="timeline">`;
        estados.forEach((e, i) => {
            let activeClass = i <= idxEstado ? 'active' : ''; let colorInfo = i <= idxEstado ? 'color: #fff;' : 'color: var(--text-muted);'; let icono = "";
            if(e === "Pendiente") icono = "<i class='fas fa-clock'></i> "; if(e === "Pagado") icono = "<i class='fas fa-check-double'></i> ";
            if(e === "Enviado") icono = "<i class='fas fa-truck-fast'></i> "; if(e === "Completado") icono = "<i class='fas fa-box-open'></i> ";
            let guiaInfo = (e === 'Enviado' && p.guiaEnvio && i <= idxEstado) ? `<div style="color: #b000ff; font-size: 0.85em; margin-top: 6px; font-weight:bold; background: rgba(176,0,255,0.1); padding: 4px; border-radius:4px;"><i class="fas fa-barcode"></i> Número de Guía: ${sanitizarHTML(p.guiaEnvio)}</div>` : '';
            html += `<div class="timeline-item ${activeClass}" style="${colorInfo}"><strong>${icono} ${e}</strong>${guiaInfo}</div>`;
        });
        html += `</div><div style="margin-top: 10px; font-size: 0.8em; color: var(--secondary-color); text-align:right;">Monto Orden: $${Number(p.totalUsd).toFixed(2)}</div>`;
        cont.innerHTML = html;
    } catch(error) { cont.innerHTML = "<p style='color: #ff3366; text-align:center;'>Hubo un error de conexión.</p>"; }
};

window.aplicarCupon = async function() {
  reproducirSonido(); let c = document.getElementById('inputCupon').value.trim().toUpperCase(); let msg = document.getElementById('mensajeCupon'); if(!c) return;
  try {
    const q = query(collection(db, "cupones"), where("codigo", "==", c)); const querySnapshot = await getDocs(q);
    if(!querySnapshot.empty) {
      let cuponData = querySnapshot.docs[0].data(); descuentoAplicado = (cuponData.porcentaje || 0) / 100;
      msg.style.color = "#25D366"; msg.innerText = `Cupón aplicado (-${cuponData.porcentaje}%)`;
    } else { descuentoAplicado = 0; msg.style.color = "#ff3366"; msg.innerText = "Cupón inválido o caducado."; }
    abrirCarritoModal();
  } catch(e) { msg.style.color = "#ff3366"; msg.innerText = "Error al validar cupón."; }
};

let umbralesRangosNube = { genin: 0, chunin: 300, jonin: 600, hokage: 1000 };
async function cargarUmbralesRangosNube() {
  try { const docRef = doc(db, "configuracion", "rangos_ninja"); const docSnap = await getDoc(docRef); if (docSnap.exists()) umbralesRangosNube = docSnap.data(); } catch(e) { console.warn("Aviso Rangos:", e); }
}

async function cargarReviewsNube() {
  try {
    const q = query(collection(db, "reviews"), orderBy("timestamp", "desc")); const querySnapshot = await getDocs(q);
    let c = document.getElementById('contenedorReviews'); if(!c) return; c.innerHTML = "";
    if (querySnapshot.empty) { c.innerHTML = "<p style='color:var(--text-muted);'>Aún no hay reseñas registradas.</p>"; return; }
    querySnapshot.forEach((docSnap) => {
      let r = docSnap.data();
      c.innerHTML += `<div class="review-card"><div style="font-weight:700; color:#fff; margin-bottom:2px;">${sanitizarHTML(r.nombre)}</div><div style="color:#ffcc00; font-size:0.85em; margin-bottom:4px;">${sanitizarHTML(r.estrellas)}</div><div style="color:var(--text-muted); font-size:0.9em;">${sanitizarHTML(r.texto)}</div></div>`;
    });
  } catch (e) { console.warn("Aviso Reviews:", e); }
}

window.agregarReview = async function() {
  reproducirSonido(); let n = document.getElementById('revNombre').value.trim(); let e = document.getElementById('revEstrellas').value; let t = document.getElementById('revTexto').value.trim();
  if(!n || !t) return alert("Por favor completa tu nombre y comentario.");
  try {
    await addDoc(collection(db, "reviews"), { nombre: n, estrellas: e, texto: t, timestamp: Date.now() });
    document.getElementById('revNombre').value = ""; document.getElementById('revTexto').value = ""; 
    await cargarReviewsNube(); alert("Opinión registrada correctamente.");
  } catch(err) { alert("Error al guardar la reseña."); }
};

window.addEventListener('DOMContentLoaded', async () => {
  await cargarCMSyGacha();
  cargarBannersDeNube(); cargarProductosDeNube(); cargarConfigCategoriasPublico(); cargarReviewsNube(); 
  cargarUmbralesRangosNube().then(() => { actualizarRangoSegunXP(); });
  
  try {
    const qObj = query(collection(db, "rpg_objetos"));
    const snapsObj = await getDocs(qObj);
    rpgObjetosGlobal = [];
    snapsObj.forEach(d => {
      let obj = d.data();
      rpgObjetosGlobal.push({ 
        id: d.id, 
        nombre: obj.nombre, 
        tipo: obj.tipo || 'arma', 
        rareza: obj.rareza || 'N', 
        atk: obj.stats?.ataque || obj.stats?.atk || 0, 
        def: obj.stats?.defensa || obj.stats?.def || 0,
        imgUrl: obj.imgUrl || ''
      });
    });
  } catch(e) { console.error("Error cargando objetos RPG:", e); }

  document.getElementById('inputGamerTag').value = gamerProfile.tag; actualizarBadges(); renderizarAlbumWaifus();
});

window.cerrarModal = function() { document.getElementById('miModal').style.display = 'none'; };

window.productoActual = null; let descuentoAplicado = 0; let pestanaCarritoActual = 'fisico';

// CORRECCIÓN APLICADA: Parámetro cambiado de prodId a id
window.toggleFavoritoPorId = function(event, id) {
    event.stopPropagation(); reproducirSonido();
    let prod = productosNubeGlobal.find(p => p.id === id); if (!prod) return;
    let idx = favoritos.findIndex(f => f.id === id);
    if (idx >= 0) { favoritos.splice(idx, 1); } 
    else { favoritos.push({ id: prod.id, titulo: prod.nombre, precio: prod.precio, img: (prod.fotos && prod.fotos.length > 0) ? prod.fotos[0] : 'logo.webp?v=2' }); }
    localStorage.setItem('sakura_favoritos', JSON.stringify(favoritos)); actualizarBadges(); guardarProgresoNube();
};

window.abrirFavoritosModal = function() {
    pushModalState();
    reproducirSonido(); let cont = document.getElementById('listaFavoritosDetalle'); cont.innerHTML = "";
    if (favoritos.length === 0) { cont.innerHTML = "<p style='color:var(--text-muted); text-align:center;'>No tienes artículos guardados.</p>"; } 
    else {
        favoritos.forEach(f => {
            cont.innerHTML += `<div class="cart-item-row" onclick="cerrarFavoritosModal(); abrirModalPorId('${f.id}')" style="cursor:pointer;"><img src="${f.img}" class="cart-item-img" loading="lazy"><div class="cart-item-info"><strong>${sanitizarHTML(f.titulo)}</strong><br><span style="color:var(--secondary-color);">$${Number(f.precio).toFixed(2)}</span></div><button class="cart-item-del" onclick="event.stopPropagation(); toggleFavoritoPorId(event, '${f.id}')"><i class="fas fa-trash"></i></button></div>`;
        });
    }
    document.getElementById('modalFavoritos').style.display = 'flex';
};

window.cerrarFavoritosModal = function() { document.getElementById('modalFavoritos').style.display = 'none'; };

window.cambiarPestanaCarrito = function(pestana) {
    reproducirSonido(); pestanaCarritoActual = pestana;
    document.getElementById('tabBtnFisico').classList.toggle('activo', pestana === 'fisico'); document.getElementById('tabBtnDigital').classList.toggle('activo', pestana === 'digital');
    document.getElementById('apartadoEnvioFisico').style.display = (pestana === 'fisico') ? 'block' : 'none'; document.getElementById('apartadoRecargasDigitales').style.display = (pestana === 'digital') ? 'block' : 'none';
    renderizarListaCarrito();
};

window.activarEasterEggLogo = function() { reproducirSonido(); try{ confetti({ particleCount: 50, spread: 60, origin: { y: 0.3 } }); }catch(e){ console.warn("Aviso Confetti:", e); } };

window.abrirCofreModal = function() { 
    pushModalState();
    reproducirSonido(); 
    document.getElementById('cofreResultado').innerText = `Cofre disponible (+50 XP y +${ajustesWebGlobal.tokensCofre} Tokens)`;
    document.getElementById('modalCofreDiario').style.display = 'flex'; 
};
window.cerrarCofreModal = function() { document.getElementById('modalCofreDiario').style.display = 'none'; };
window.abrirCofreDiario = function() {
  reproducirSonido(); let ultimo = localStorage.getItem('sakura_ultimo_cofre'); let hoy = new Date().toDateString();
  if(ultimo === hoy) return alert("Ya abriste tu cofre hoy. Vuelve mañana.");
  
  window.ganarXP(50);
  let tokensGanados = ajustesWebGlobal.tokensCofre;
  gamerProfile.tokens = (gamerProfile.tokens || 0) + tokensGanados; 
  localStorage.setItem('sakura_ultimo_cofre', hoy); 
  document.getElementById('cofreResultado').innerText = `¡Ganaste 50 XP y ${tokensGanados} Tokens!`;
  mostrarTextoFlotante('+50 XP', '#25d366');
  try{ confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); }catch(e){ console.warn("Aviso Confetti:", e); } 
  window.guardarProgresoLocalRPG();
};

window.abrirTemasModal = function() { pushModalState(); reproducirSonido(); document.getElementById('modalTemas').style.display = 'flex'; };
window.cerrarTemasModal = function() { document.getElementById('modalTemas').style.display = 'none'; };
window.cambiarTema = function(tema) { reproducirSonido(); document.body.className = ''; if(tema) document.body.classList.add(tema); cerrarTemasModal(); };

window.toggleMusicaLoFi = function() {
  reproducirSonido(); let audio = document.getElementById('audioLoFi'); let icon = document.getElementById('iconoMusica'); if(!audio) return;
  if(audio.paused) { audio.play(); icon.classList.remove('fa-music'); icon.classList.add('fa-pause-circle'); }
  else { audio.pause(); icon.classList.remove('fa-pause-circle'); icon.classList.add('fa-music'); }
};

window.agregarAlCarrito = function() {
  reproducirSonido(); let item = { ...window.productoActual };
  if(item.esRopa) { item.titulo += ` (Talla: ${document.getElementById('selectTalla').value})`; }
  if(item.esRecarga) {
    let playerId = document.getElementById('inputPlayerId').value.trim(); let playerServer = document.getElementById('inputPlayerServer').value.trim();
    if(!playerId) return alert("Indica el ID de jugador para procesar la recarga.");
    item.titulo += ` [ID: ${playerId}${playerServer ? ' / Servidor: ' + playerServer : ''}]`;
  }
  carrito.push(item); actualizarCarritoUI(); cerrarModal(); 
};

function actualizarCarritoUI() { localStorage.setItem('sakura_carrito', JSON.stringify(carrito)); actualizarBadges(); guardarProgresoNube(); }

function actualizarBadges() { 
  document.getElementById('cartBadge').innerText = carrito.length; document.getElementById('favBadge').innerText = favoritos.length; 
  document.querySelectorAll('.item-producto').forEach(card => {
      let prodId = card.getAttribute('data-id'); let btnFav = card.querySelector('.btn-fav-card');
      if (favoritos.some(f => f.id === prodId)) { btnFav.classList.add('favorito'); } else { btnFav.classList.remove('favorito'); }
  });
}

window.abrirCarritoModal = function() {
  pushModalState();
  reproducirSonido(); let tieneFisicos = carrito.some(i => !i.esRecarga); let tieneDigitales = carrito.some(i => i.esRecarga);
  pestanaCarritoActual = (tieneDigitales && !tieneFisicos) ? 'digital' : 'fisico';
  document.getElementById('tabBtnFisico').classList.toggle('activo', pestanaCarritoActual === 'fisico'); document.getElementById('tabBtnDigital').classList.toggle('activo', pestanaCarritoActual === 'digital');
  document.getElementById('apartadoEnvioFisico').style.display = (pestanaCarritoActual === 'fisico') ? 'block' : 'none'; document.getElementById('apartadoRecargasDigitales').style.display = (pestanaCarritoActual === 'digital') ? 'block' : 'none';
  renderizarListaCarrito(); document.getElementById('modalCarrito').style.display = 'flex';
};

function renderizarListaCarrito() {
  let cont = document.getElementById('listaCarritoDetalle'); let reciboContenido = document.getElementById('reciboContenido');
  let boxUpsell = document.getElementById('boxUpsell'); let contUpsell = document.getElementById('listaUpsell');
  cont.innerHTML = ""; reciboContenido.innerHTML = "";

  let itemsFisicos = carrito.filter(i => !i.esRecarga); let itemsDigitales = carrito.filter(i => i.esRecarga);
  let subFisico = itemsFisicos.reduce((s, i) => s + Number(i.precio), 0); actualizarBarraEnvio(subFisico);
  document.getElementById('countCartFisico').innerText = itemsFisicos.length; document.getElementById('countCartDigital').innerText = itemsDigitales.length;

  let itemsMostrados = (pestanaCarritoActual === 'fisico') ? itemsFisicos : itemsDigitales;
  if (itemsMostrados.length === 0) { cont.innerHTML = `<p style='color:var(--text-muted); text-align:center;'>Sin artículos agregados.</p>`;
  } else {
    itemsMostrados.forEach((item) => {
      let idxOriginal = carrito.indexOf(item);
      cont.innerHTML += `<div class="cart-item-row"><img src="${item.img}" class="cart-item-img" loading="lazy"><div class="cart-item-info"><strong>${sanitizarHTML(item.titulo)}</strong><br><span style="color:var(--secondary-color);">$${Number(item.precio).toFixed(2)}</span></div><button class="cart-item-del" onclick="removerDelCarrito(${idxOriginal})"><i class="fas fa-times"></i></button></div>`;
    });
  }

  if (carrito.length > 0) {
    let candidatos = productosNubeGlobal.filter(p => !p.oculto && Number(p.precio) <= 15 && !carrito.some(c => c.id === p.id)); candidatos.sort(() => 0.5 - Math.random()); let sugerencias = candidatos.slice(0, 4); 
    if(sugerencias.length > 0) {
      boxUpsell.style.display = 'block';
      contUpsell.innerHTML = sugerencias.map(s => `<div class="upsell-card"><img src="${s.fotos && s.fotos.length > 0 ? s.fotos[0] : 'logo.webp?v=2'}" class="upsell-img"><div class="upsell-title">${sanitizarHTML(s.nombre)}</div><div class="upsell-price">$${Number(s.precio).toFixed(2)}</div><button class="upsell-btn" onclick="agregarUpsell('${s.id}')"><i class="fas fa-plus"></i> Añadir</button></div>`).join('');
    } else { boxUpsell.style.display = 'none'; }
  } else { boxUpsell.style.display = 'none'; }

  if (carrito.length > 0) {
    let sub = carrito.reduce((s, i) => s + Number(i.precio), 0); let tot = sub * (1 - descuentoAplicado); document.getElementById('modalCarritoTotal').innerText = `Total: $${tot.toFixed(2)}`;
  } else { document.getElementById('modalCarritoTotal').innerText = "Total: $0.00"; }
}

function actualizarBarraEnvio(subtotalFisico) {
  let box = document.getElementById('boxEnvioGratis'); let txt = document.getElementById('txtEnvioGratis'); let bar = document.getElementById('barEnvioGratis');
  if(subtotalFisico === 0 || pestanaCarritoActual === 'digital') { box.style.display = 'none'; return; }
  box.style.display = 'block';
  if (subtotalFisico >= META_ENVIO_GRATIS) {
    txt.innerHTML = `¡Lo lograste! Tienes <strong style="color: #25D366;">Envío Nacional Gratis</strong> 🎉`; bar.style.width = '100%'; bar.style.background = 'linear-gradient(90deg, #25D366, #1da851)';
  } else {
    let faltante = (META_ENVIO_GRATIS - subtotalFisico).toFixed(2); let porcentaje = (subtotalFisico / META_ENVIO_GRATIS) * 100;
    txt.innerHTML = `Faltan <strong style="color: var(--secondary-color);">$${faltante}</strong> para <strong style="color: #25D366;">Envío Gratis</strong>`; bar.style.width = `${porcentaje}%`; bar.style.background = 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))';
  }
}

window.agregarUpsell = function(id) {
  reproducirSonido(); let prod = productosNubeGlobal.find(p => p.id === id);
  if(prod) {
    let item = { id: prod.id, img: (prod.fotos && prod.fotos.length > 0) ? prod.fotos[0] : 'logo.webp?v=2', titulo: prod.nombre, precio: prod.precio, esRopa: false, esRecarga: false };
    if(prod.categoria === 'recargas') item.esRecarga = true; carrito.push(item); actualizarCarritoUI(); renderizarListaCarrito();
  }
};

window.removerDelCarrito = function(index) { reproducirSonido(); carrito.splice(index, 1); actualizarCarritoUI(); renderizarListaCarrito(); };
window.cerrarCarritoModal = function() { document.getElementById('modalCarrito').style.display = 'none'; };
window.vaciarCarrito = function() { reproducirSonido(); carrito = []; descuentoAplicado = 0; actualizarCarritoUI(); renderizarListaCarrito(); };

window.compartirCarrito = function() {
  reproducirSonido(); if(carrito.length === 0) return alert("Tu lista está vacía. Añade productos primero.");
  let msg = `✨ ¡Hola! Esta es mi lista de deseos (Wishlist) de *Sakura Gameverse*:\n\n`;
  carrito.forEach((i, idx) => { msg += `🎁 ${i.titulo} -$${Number(i.precio).toFixed(2)}\n`; });
  let tot = carrito.reduce((s, i) => s + Number(i.precio), 0); msg += `\n*Total aprox:* $${tot.toFixed(2)}\n\n¡Ojalá me regalen algo de aquí! 🥺💖`;
  if (navigator.share) { navigator.share({ title: 'Mi Wishlist Sakura Gameverse', text: msg }).catch(console.error); } 
  else { window.open("https://wa.me/" + ajustesWebGlobal.whatsapp + "?text=" + encodeURIComponent(msg), '_blank'); }
};

window.enviarPedidoWhatsApp = async function() {
  reproducirSonido(); if(carrito.length === 0) return alert("El carrito está vacío.");

  let nombreCli = document.getElementById('cartClienteNombre').value.trim();
  let tlfCli = document.getElementById('cartClienteTelefono').value.trim();
  if(!nombreCli || !tlfCli) { return alert("⚠️ Por favor, llena la casilla 'Tus Datos' (Nombre y WhatsApp) para registrar la orden en el sistema antes de enviarla."); }
  
  let tieneFisicos = carrito.some(i => !i.esRecarga); let tieneDigitales = carrito.some(i => i.esRecarga);
  let metodoEnvio = document.getElementById('selectMetodoEnvio') ? document.getElementById('selectMetodoEnvio').value : "No especificado";
  let direccionEnvio = document.getElementById('inputDireccionEnvio') ? document.getElementById('inputDireccionEnvio').value.trim() : "";

  if (tieneFisicos && !direccionEnvio) { cambiarPestanaCarrito('fisico'); return alert("Por favor indica la dirección o agencia de destino."); }

  let sub = carrito.reduce((s, i) => s + Number(i.precio), 0); let tot = sub * (1 - descuentoAplicado); 
  let msgParaWhatsApp = `Hola Sakura Gameverse, deseo procesar el siguiente pedido:\n\n*Cliente:* ${nombreCli}\n*Contacto:*${tlfCli}\n\n`;
  let detallesBD = ""; 
  
  if (tieneFisicos) {
    msgParaWhatsApp += `📦 ARTÍCULOS FÍSICOS:\n`;
    carrito.filter(i => !i.esRecarga).forEach((i, idx) => { msgParaWhatsApp += `  ${idx+1}. ${i.titulo} -$${Number(i.precio).toFixed(2)}\n`; detallesBD += `1x ${i.titulo} ($${Number(i.precio).toFixed(2)})\n`; });
    msgParaWhatsApp += `Logística: ${metodoEnvio}\nDestino:${direccionEnvio}\n\n`;
  }

  if (tieneDigitales) {
    msgParaWhatsApp += `⚡ RECARGAS DIGITALES:\n`;
    carrito.filter(i => i.esRecarga).forEach((i, idx) => { msgParaWhatsApp += `  ${idx+1}. ${i.titulo} -$${Number(i.precio).toFixed(2)}\n`; detallesBD += `1x ${i.titulo} ($${Number(i.precio).toFixed(2)})\n`; });
    msgParaWhatsApp += `Modalidad: Acreditación Directa\n\n`;
  }

  msgParaWhatsApp += `Total a Cancelar: $${tot.toFixed(2)}\nQuedo a la espera de confirmación y datos de pago.`;

  let btnSubmit = document.getElementById('btnFinalizarPedido'); btnSubmit.disabled = true; btnSubmit.innerHTML = "<i class='fas fa-spinner fa-spin'></i> Registrando...";

  try {
      await addDoc(collection(db, "pedidos"), {
          cliente: nombreCli, telefono: tlfCli, tipo: (tieneFisicos && tieneDigitales) ? 'Mixto' : (tieneFisicos ? 'fisico' : 'digital'),
          metodoEnvio: tieneFisicos ? metodoEnvio : 'Entrega Digital Directa', direccionEnvio: direccionEnvio,
          detalles: detallesBD.trim(), totalUsd: tot, estadoPedido: "Pendiente", guiaEnvio: "", timestamp: Date.now()
      });
      window.open("https://wa.me/" + ajustesWebGlobal.whatsapp + "?text=" + encodeURIComponent(msgParaWhatsApp), '_blank'); 
      vaciarCarrito(); cerrarCarritoModal();
  } catch(err) { alert("Hubo un error de conexión registrando tu pedido. Por favor intenta de nuevo."); } 
  finally { btnSubmit.disabled = false; btnSubmit.innerHTML = "Enviar Orden"; }
};

window.compartirProductoWhatsApp = function() {
  reproducirSonido(); let msg = `Hola Sakura Gameverse, deseo consultar disponibilidad de:\n\n*${window.productoActual.titulo}*\nPrecio:$${Number(window.productoActual.precio).toFixed(2)}`; 
  window.open("https://wa.me/" + ajustesWebGlobal.whatsapp + "?text=" + encodeURIComponent(msg), '_blank');
};

window.abrirChatGlobalWhatsApp = function() {
  reproducirSonido(); window.open("https://wa.me/" + ajustesWebGlobal.whatsapp, '_blank'); cerrarMenuOpciones();
};

window.abrirFaqModal = function() { pushModalState(); reproducirSonido(); document.getElementById('modalFaq').style.display = 'flex'; };
window.cerrarFaqModal = function() { document.getElementById('modalFaq').style.display = 'none'; };

window.abrirSugerenciaModal = function() {
    pushModalState();
    reproducirSonido();
    let n = prompt("Ingresa tu GamerTag o Nombre:"); if(!n) return;
    let d = prompt("¿Qué coleccionable, figura o código te gustaría encargar?"); if(!d) return;
    window.open("https://wa.me/" + ajustesWebGlobal.whatsapp + "?text=" + encodeURIComponent(`*Búsqueda de Tesoro:*\nHola Sakura, soy ${n}. Me gustaría encargar/conseguir el siguiente artículo: ${d}`), '_blank');
};

window.abrirMenuOpciones = function() { pushModalState(); reproducirSonido(); document.getElementById('modalOpcionesMenu').style.display = 'flex'; };
window.cerrarMenuOpciones = function() { document.getElementById('modalOpcionesMenu').style.display = 'none'; };

function actualizarRangoSegunXP() {
  let xp = gamerProfile.xp; let u = umbralesRangosNube;
  let max = 0; let min = 0; let nextRango = "";

  if (xp >= (u.hokage ?? 1000)) { gamerProfile.rango = "Hokage"; max = xp; min = u.hokage ?? 1000; nextRango = "MAX"; }
  else if (xp >= (u.jonin ?? 600)) { gamerProfile.rango = "Jōnin"; max = u.hokage ?? 1000; min = u.jonin ?? 600; nextRango = "Hokage"; }
  else if (xp >= (u.chunin ?? 300)) { gamerProfile.rango = "Chūnin"; max = u.jonin ?? 600; min = u.chunin ?? 300; nextRango = "Jōnin"; }
  else { gamerProfile.rango = "Genin"; max = u.chunin ?? 300; min = 0; nextRango = "Chūnin"; }

  let pct = 100;
  if(nextRango !== "MAX") {
      pct = ((xp - min) / (max - min)) * 100; document.getElementById('lblXpNext').innerHTML = `Faltan <strong style="color:var(--secondary-color);">${max - xp} XP</strong> para${nextRango}`;
  } else { document.getElementById('lblXpNext').innerText = `¡Rango Máximo Alcanzado!`; }
  
  let barra = document.getElementById('barXp'); if(barra) setTimeout(() => { barra.style.width = pct + "%"; }, 200);
  
  let lblXp = document.getElementById('lblXp'); if(lblXp) lblXp.innerText = gamerProfile.xp; 
  let lblRango = document.getElementById('lblRango'); if(lblRango) lblRango.innerText = gamerProfile.rango;
  let lblTokens = document.getElementById('lblTokens'); if(lblTokens) lblTokens.innerHTML = `<i class="fas fa-coins"></i> ${gamerProfile.tokens || 0}`;
}

window.ganarXP = function(cantidad) { gamerProfile.xp += cantidad; actualizarRangoSegunXP(); };

// ==========================================
// SISTEMA RPG V2 (EXPEDICIONES, MINERÍA, FRAGUA Y RUMBLE)
// ==========================================

// ==========================================
// EL GIMNASIO (Entrenamiento de Stats Base)
// ==========================================
window.entrenarStat = function(stat) {
  reproducirSonido();
  let costoTokens = 10;
  
  if (!gamerProfile.tokens || gamerProfile.tokens < costoTokens) {
    return alert("¡No tienes suficientes Tokens! 🪙\nCuestan 10 Tokens por entrenamiento.\nConsigue más abriendo cofres o cazando en el Gremio.");
  }
  
  // Cobramos los tokens
  gamerProfile.tokens -= costoTokens;
  
  // Aumentamos el stat correspondiente
  if (stat === 'hp') {
    gamerProfile.stats.hp += 10;
    mostrarTextoFlotante('+10 HP', '#ff3366');
  } else if (stat === 'atk') {
    gamerProfile.stats.atk += 2;
    mostrarTextoFlotante('+2 ATK', '#ffaa00');
  } else if (stat === 'def') {
    gamerProfile.stats.def += 2;
    mostrarTextoFlotante('+2 DEF', '#00e5ff');
  }
  
  // Guardamos partida, actualizamos pantalla y lanzamos confetti
  window.guardarProgresoLocalRPG();
  document.getElementById('lblTokens').innerHTML = `<i class="fas fa-coins"></i> ${gamerProfile.tokens}`;
  try { confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 }, colors: ['#ffaa00', '#00e5ff'] }); } catch(e){}
};

window.guardarProgresoLocalRPG = function() {
  localStorage.setItem('sakura_gamer_profile', JSON.stringify(gamerProfile));
  guardarProgresoNube();
  actualizarUiPerfil();
};

window.verificarProfesion = function() {
  if (!gamerProfile.profesion || gamerProfile.profesion === "") {
    let eleccion = prompt("¡Elige tu camino!\n1. Guerrero (Mucha Defensa)\n2. Cazador (Balanceado)\n3. Hechicero (Mucho Ataque)");
    if (eleccion === "1") { gamerProfile.profesion = "Guerrero"; gamerProfile.stats = { hp: 150, atk: 8, def: 15 }; } 
    else if (eleccion === "2") { gamerProfile.profesion = "Cazador"; gamerProfile.stats = { hp: 100, atk: 15, def: 8 }; } 
    else if (eleccion === "3") { gamerProfile.profesion = "Hechicero"; gamerProfile.stats = { hp: 80, atk: 25, def: 5 }; } 
    else { return window.verificarProfesion(); }
    window.guardarProgresoLocalRPG();
    alert("¡Genial! Eres un " + gamerProfile.profesion + ".");
  }
};

window.actualizarUiPerfil = function() {
  let extraAtk = 0; let extraDef = 0;
  if (gamerProfile.equipo.armaId && gamerProfile.inventario) {
    let item = gamerProfile.inventario.find(i => i.uid_inventario === gamerProfile.equipo.armaId);
    if (item) { extraAtk = item.atk; extraDef = item.def; }
  }
  
  let lblProf = document.getElementById('lblProfesion');
  if(lblProf) lblProf.innerText = gamerProfile.profesion || "Ninguna";
  
  let lblHp = document.getElementById('lblHp');
  if(lblHp) lblHp.innerText = gamerProfile.stats.hp;
  
  let lblAtk = document.getElementById('lblAtk');
  if(lblAtk) lblAtk.innerText = gamerProfile.stats.atk + " (+" + extraAtk + ")";
  
  let lblDef = document.getElementById('lblDef');
  if(lblDef) lblDef.innerText = gamerProfile.stats.def + " (+" + extraDef + ")";

  renderizarInventario();
};

window.renderizarInventario = function() {
  let cont = document.getElementById('contenedorInventario'); 
  if(!cont) return;
  cont.innerHTML = "";
  if(!gamerProfile.inventario) gamerProfile.inventario = [];
  
  let cantMateriales = gamerProfile.inventario.filter(i => i.tipo === 'material').length;
  let lblTotalMat = document.getElementById('lblTotalMateriales');
  if(lblTotalMat) lblTotalMat.innerText = cantMateriales;

  if (gamerProfile.inventario.length === 0) {
    cont.innerHTML = "<div style='grid-column: 1/-1; color: var(--text-muted); font-size: 0.85em;'>Mochila vacía. Ve a minar o a las mazmorras.</div>";
    return;
  }

  gamerProfile.inventario.forEach((item) => {
    let isEquipped = gamerProfile.equipo.armaId === item.uid_inventario; 
    let cl = isEquipped ? 'rpg-item-card equipped' : 'rpg-item-card';
    
    let icono = "";
    if (item.imgUrl) {
      icono = `<img src="${item.imgUrl}" alt="${sanitizarHTML(item.nombre)}">`;
    } else {
      icono = item.tipo === 'material' ? "💎" : (item.tipo === 'consumible' ? "🧪" : "🗡️");
    }

    let accionClick = item.tipo === 'arma' ? `equiparItem('${item.uid_inventario}')` : ``;
    let estiloCursor = item.tipo === 'arma' ? 'cursor: pointer;' : 'cursor: default; opacity: 0.85;';
    let infoExtra = item.tipo === 'arma' ? `ATK +${item.atk} | DEF +${item.def}<br><div style="font-size: 0.8em; margin-top: 5px; color: ${isEquipped ? '#25d366' : '#888'};">${isEquipped ? 'EQUIPADO' : 'Click para equipar'}</div>` : `<span style="color:#b000ff">Material</span>`;
    
    cont.innerHTML += `<div class="${cl}" style="${estiloCursor}" onclick="${accionClick}"><div class="rpg-item-icon">${icono}</div><div class="rpg-item-name rareza-${item.rareza}">${sanitizarHTML(item.nombre)}</div><div class="rpg-item-stats">${infoExtra}</div></div>`;
  });
};

window.equiparItem = function(uid_inventario) {
  reproducirSonido();
  if (gamerProfile.equipo.armaId === uid_inventario) { gamerProfile.equipo.armaId = null; } 
  else { gamerProfile.equipo.armaId = uid_inventario; }
  window.guardarProgresoLocalRPG();
};

window.abrirGamerProfileModal = function() { 
    pushModalState();
    reproducirSonido(); 
    window.actualizarUiPerfil();
    document.getElementById('modalGamerProfile').style.display = 'flex'; 
};
window.cerrarGamerProfileModal = function() { document.getElementById('modalGamerProfile').style.display = 'none'; };

window.abrirGremioModal = function() { 
    pushModalState();
    reproducirSonido(); 
    window.verificarProfesion(); 
    document.getElementById('modalGremio').style.display = 'flex'; 

    // CARGAR EL RANKING EN VIVO DEL SALÓN DE LA FAMA
    if(!rankingCargado) {
        rankingCargado = true;
        const qRanking = query(collection(db, "jugadores_cloud"), orderBy("profile.xp", "desc"), limit(5));
        onSnapshot(qRanking, (snapshot) => {
            let html = "";
            let pos = 1;
            snapshot.forEach(doc => {
                let d = doc.data().profile;
                let tag = d.tag || 'Aventurero';
                let xp = d.xp || 0;
                let rango = d.rango || 'Genin';
                let colorStr = pos === 1 ? '#ffaa00' : (pos === 2 ? '#b4becd' : (pos === 3 ? '#cd7f32' : '#8b8f9e'));
                let medalla = pos <= 3 ? `<i class="fas fa-medal" style="color:${colorStr}; font-size:1.2em;"></i>` : `<span style="color:${colorStr}; font-weight:bold; font-size:1.1em;">#${pos}</span>`;
                
                html += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="width: 20px; text-align:center;">${medalla}</div>
                        <div><strong style="color:#fff;">${sanitizarHTML(tag)}</strong> <br><span style="font-size:0.75em; color:var(--text-muted); text-transform:uppercase;">[${rango}]</span></div>
                    </div>
                    <div style="color: var(--secondary-color); font-weight:bold; font-size: 1.1em;">${xp} XP</div>
                </div>`;
                pos++;
            });
            document.getElementById('rankingGremioContainer').innerHTML = html || "<p style='color:var(--text-muted); text-align:center;'>Aún no hay leyendas.</p>";
        });
    }
};
window.cerrarGremioModal = function() { document.getElementById('modalGremio').style.display = 'none'; };

window.abrirFraguaModal = function() { 
  pushModalState();
  reproducirSonido();
  window.verificarProfesion();
  let cantMateriales = gamerProfile.inventario.filter(i => i.tipo === 'material').length;
  document.getElementById('fraguaMateriales').innerText = cantMateriales;
  document.getElementById('fraguaTokens').innerText = gamerProfile.tokens || 0;
  
  let contRecetas = document.getElementById('listaRecetasFragua'); contRecetas.innerHTML = "";
  let armasDisponibles = rpgObjetosGlobal.filter(obj => obj.tipo === 'arma');
  
  if (armasDisponibles.length === 0) {
    contRecetas.innerHTML = "<p style='color:var(--text-muted); font-size:0.9em;'>El Admin aún no ha forjado recetas en el servidor.</p>";
  } else {
    armasDisponibles.forEach(arma => {
      let costoMat = 1; let costoTok = 5;
      if(arma.rareza === 'R') { costoMat = 3; costoTok = 10; }
      if(arma.rareza === 'SR') { costoMat = 6; costoTok = 25; }
      if(arma.rareza === 'SSR') { costoMat = 12; costoTok = 60; }

      let puedeForjar = (cantMateriales >= costoMat && (gamerProfile.tokens || 0) >= costoTok);
      
      let thumbImg = arma.imgUrl ? `<img src="${arma.imgUrl}" style="width:36px; height:36px; object-fit:contain; image-rendering:pixelated; margin-right:8px; border-radius:4px; vertical-align:middle;">` : `🗡️ `;

      contRecetas.innerHTML += `
        <div style="background: rgba(0,0,0,0.5); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); padding: 12px; text-align: left; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center;">
            ${thumbImg}
            <div>
              <div class="rpg-item-name rareza-${arma.rareza}">${sanitizarHTML(arma.nombre)}</div>
              <div style="font-size: 0.75em; color: var(--text-muted); margin-bottom: 4px;">ATK +${arma.atk} | DEF +${arma.def}</div>
              <div style="font-size: 0.8em; font-weight: bold;">
                <span style="color: ${cantMateriales >= costoMat ? '#00e5ff' : '#ff3366'};"><i class="fas fa-gem"></i> ${costoMat}</span> | 
                <span style="color: ${(gamerProfile.tokens || 0) >= costoTok ? '#ffaa00' : '#ff3366'};"><i class="fas fa-coins"></i> ${costoTok}</span>
              </div>
            </div>
          </div>
          <button class="btn-comprar" style="width: auto; padding: 8px 15px; margin: 0; background: ${puedeForjar ? '#ff5500' : 'rgba(255,255,255,0.1)'}; color: #fff;" onclick="forjarObjeto('${arma.id}', ${costoMat}, ${costoTok})" ${!puedeForjar ? 'disabled' : ''}>
            <i class="fas fa-hammer"></i>
          </button>
        </div>`;
    });
  }
  document.getElementById('modalFragua').style.display = 'flex'; 
};
window.cerrarFraguaModal = function() { document.getElementById('modalFragua').style.display = 'none'; };

window.forjarObjeto = function(idArma, costoMat, costoTok) {
  reproducirSonido();
  let cantMateriales = gamerProfile.inventario.filter(i => i.tipo === 'material').length;
  if(cantMateriales < costoMat || (gamerProfile.tokens || 0) < costoTok) return alert("Recursos insuficientes.");
  let armaData = rpgObjetosGlobal.find(a => a.id === idArma); if(!armaData) return;
  
  gamerProfile.tokens -= costoTok;
  let borrados = 0;
  gamerProfile.inventario = gamerProfile.inventario.filter(item => { if(item.tipo === 'material' && borrados < costoMat) { borrados++; return false; } return true; });
  
  gamerProfile.inventario.push({ ...armaData, uid_inventario: Date.now().toString() });
  window.guardarProgresoLocalRPG(); alert(`¡Has forjado: ${armaData.nombre}!`); window.abrirFraguaModal();
};

window.accionRPG = function(tipo) {
  reproducirSonido();
  let ahora = Date.now();
  let cooldownTime = tipo === 'cazar' ? (3 * 60 * 1000) : (10 * 60 * 1000); 
  let keyCooldown = 'sakura_cooldown_' + tipo; let ultimoUso = localStorage.getItem(keyCooldown) || 0;

  if (ahora - ultimoUso < cooldownTime) {
    let faltanSegundos = Math.ceil((cooldownTime - (ahora - ultimoUso)) / 1000); let faltanMinutos = Math.floor(faltanSegundos / 60); let seg = faltanSegundos % 60;
    document.getElementById('rpgResultado').innerHTML = `<span style="color:#ff3366;"><i class="fas fa-hourglass-half"></i> Descansa. Vuelve en ${faltanMinutos}m y ${seg}s.</span>`;
    return;
  }

  let rng = Math.floor(Math.random() * 100); let msj = ""; let xpG = 0; let tokG = 0;
  if (tipo === 'cazar') {
    if (rng < 30) { msj = "No encontraste monstruos."; xpG = 5; } else if (rng < 85) { msj = "Cazaste un Goblin."; xpG = 15; tokG = 2; } else { msj = "¡Cazaste un Lobo Huargo!"; xpG = 40; tokG = 10; }
  } else if (tipo === 'minar') {
    let materialesDB = rpgObjetosGlobal.filter(obj => obj.tipo === 'material');
    if(materialesDB.length > 0) {
      let matGanado = materialesDB[Math.floor(Math.random() * materialesDB.length)];
      gamerProfile.inventario.push({ ...matGanado, uid_inventario: Date.now().toString() + rng });
      msj = `¡Minaste: <strong>${sanitizarHTML(matGanado.nombre)}</strong>!`; xpG = 20; tokG = 2;
    } else { msj = "Has extraído Mineral Básico."; xpG = 10; }
  }
  localStorage.setItem(keyCooldown, ahora);
  gamerProfile.tokens += tokG; window.ganarXP(xpG); window.guardarProgresoLocalRPG();
  mostrarTextoFlotante(`+${xpG} XP`, '#25d366');
  document.getElementById('rpgResultado').innerHTML = `<span style="color:var(--secondary-color);">${msj}</span><br><span style="color:#25d366;">+${xpG} XP | +${tokG} Tokens</span>`;
};

// EXPEDICIÓN CON ENFRIAMIENTO GLOBAL DE 10 MINUTOS Y RIESGO DE PERDER XP
window.entrarMazmorra = function(dificultad) {
  reproducirSonido();
  
  let ahora = Date.now();
  let cooldownMinutos = 10;
  let cooldownTime = cooldownMinutos * 60 * 1000; 
  let keyCooldown = 'sakura_cooldown_mazmorra_global'; 
  let ultimoUso = localStorage.getItem(keyCooldown) || 0;

  let log = document.getElementById('rpgResultado');

  if (ahora - ultimoUso < cooldownTime) {
    let faltanSegundos = Math.ceil((cooldownTime - (ahora - ultimoUso)) / 1000); 
    let faltanMinutos = Math.floor(faltanSegundos / 60); 
    let seg = faltanSegundos % 60;
    log.innerHTML = `<span style="color:#ffaa00;"><i class="fas fa-campground"></i> Reposando en la fogata.</span><br><span style="font-size: 0.85em; color:var(--text-muted);">Tu energía de expedición recarga en ${faltanMinutos}m y ${seg}s. ¡Tómate un café o explora la tienda! ☕✨</span>`;
    return;
  }

  let extraAtk = 0; let extraDef = 0;
  if (gamerProfile.equipo.armaId && gamerProfile.inventario) {
    let item = gamerProfile.inventario.find(i => i.uid_inventario === gamerProfile.equipo.armaId);
    if (item) { extraAtk = item.atk; extraDef = item.def; }
  }
  let poderTotal = gamerProfile.stats.atk + extraAtk + gamerProfile.stats.def + extraDef + (gamerProfile.xp / 10);
  
  let poderEnemigo = 0; let nombreZonas = ""; let recompensaXp = 0;
  let matDB = rpgObjetosGlobal.filter(a => a.tipo === 'material' || a.tipo === 'arma');
  
  if (dificultad === 'facil') { poderEnemigo = 40; nombreZonas = "Bosque Slime"; recompensaXp = 45; }
  if (dificultad === 'media') { poderEnemigo = 180; nombreZonas = "Cueva Sangrienta"; recompensaXp = 120; }
  if (dificultad === 'dificil') { poderEnemigo = 600; nombreZonas = "Torre del Dragón"; recompensaXp = 350; }

  log.innerHTML = `<span style="color: #00e5ff;"><i class="fas fa-walking"></i> Explorando ${nombreZonas}...</span>`;
  
  localStorage.setItem(keyCooldown, ahora);

  setTimeout(() => {
    let poderFinalEnemigo = poderEnemigo * (0.9 + (Math.random() * 0.2));

    if (poderTotal >= poderFinalEnemigo) {
      let premioTxt = "Oro y experiencia.";
      let rngDrop = Math.random() * 100;

      if (rngDrop <= 40 && matDB.length > 0) {
          let itemDrop = matDB[Math.floor(Math.random() * matDB.length)];
          gamerProfile.inventario.push({ ...itemDrop, uid_inventario: Date.now().toString() });
          
          let displayIcon = itemDrop.imgUrl ? `<img src="${itemDrop.imgUrl}" style="width:22px; height:22px; vertical-align:middle; image-rendering:pixelated; border-radius:4px;">` : `💎`;
          premioTxt = `<span class="rareza-${itemDrop.rareza}">${displayIcon} ${sanitizarHTML(itemDrop.nombre)}</span>`;
      }

      gamerProfile.xp += recompensaXp; 
      gamerProfile.tokens += Math.floor(recompensaXp / 10); 
      window.guardarProgresoLocalRPG();
      
      mostrarTextoFlotante(`+${recompensaXp} XP`, '#25d366');
      log.innerHTML = `<span style="color: #25d366;"><i class="fas fa-check-circle"></i> ¡Expedición Exitosa en ${nombreZonas}!</span><br>Loot obtenido: <strong>${premioTxt}</strong><br><span style="font-size:0.85em; color:var(--text-muted);">+${recompensaXp} XP | +${Math.floor(recompensaXp / 10)} Tokens</span>`;
      try{ confetti({ particleCount: 70, spread: 60 }); }catch(e){} 

    } else {
      let xpPerdida = Math.floor(recompensaXp / 2);
      gamerProfile.xp -= xpPerdida;
      if(gamerProfile.xp < 0) gamerProfile.xp = 0;
      window.guardarProgresoLocalRPG();

      mostrarTextoFlotante(`-${xpPerdida} XP`, '#ff3366');
      log.innerHTML = `<span style="color: #ff3366;"><i class="fas fa-skull"></i> ¡Fuiste superado en ${nombreZonas}!</span><br><span style="font-size: 0.85em;">Apenas lograste escapar con vida. Perdiste <strong style="color:#ffaa00;">${xpPerdida} XP</strong>. ¡Mejora tu equipo en la Forja!</span>`; 
    }
  }, 2000);
};

window.abrirRumbleModal = async function() { 
  pushModalState();
  reproducirSonido();
  document.getElementById('modalRumble').style.display = 'flex'; 
  
  if (escuchadorRumble) escuchadorRumble(); 

  escuchadorRumble = onSnapshot(query(collection(db, "rumble_inscritos")), (snapshot) => {
    let lbl = document.getElementById('lblInscritosRumble');
    if(lbl) lbl.innerText = snapshot.size;
    let yaInscrito = false; snapshot.forEach(doc => { if(doc.data().tag === gamerProfile.tag) yaInscrito = true; });
    let btn = document.getElementById('btnInscribirseRumble');
    if(btn) {
        if(yaInscrito) { btn.disabled = true; btn.innerHTML = "<i class='fas fa-check'></i> Ya estás inscrito"; btn.style.background = "#25d366"; } 
        else { btn.disabled = false; btn.innerHTML = "<i class='fas fa-pen-nib'></i> Inscribirse"; btn.style.background = "#ff3366"; }
    }
  });

  try { 
    const docSnap = await getDoc(doc(db, "rumble_historial", "ultimo_torneo")); 
    if (docSnap.exists() && document.getElementById('logUltimoRumble')) { 
      document.getElementById('logUltimoRumble').innerHTML = docSnap.data().logHTML; 
    } 
  } catch(e) { console.warn("Aviso Rumble Historial:", e); }
};

window.cerrarRumbleModal = function() { 
  document.getElementById('modalRumble').style.display = 'none'; 
  if (escuchadorRumble) { escuchadorRumble(); escuchadorRumble = null; }
};

window.inscribirseRumbleBD = async function() {
  reproducirSonido();
  let btn = document.getElementById('btnInscribirseRumble'); btn.disabled = true; btn.innerHTML = "<i class='fas fa-spinner fa-spin'></i>";
  try { await setDoc(doc(db, "rumble_inscritos", gamerProfile.tag), { tag: gamerProfile.tag, fecha: Date.now() }); alert("¡Inscripción exitosa!"); } 
  catch(e) { alert("Error."); btn.disabled = false; }
};
