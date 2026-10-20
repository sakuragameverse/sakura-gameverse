<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sakura Gameverse</title>
  
  <meta property="og:title" content="Sakura Gameverse">
  <meta property="og:description" content="Coleccionables, ropa, productos gamer y recargas digitales para ti.">
  <meta property="og:image" content="https://sakuragameverse.com/icono.png">
  <meta property="og:url" content="https://sakuragameverse.com/">
  <meta property="og:type" content="website">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Sakura Gameverse">
  <meta name="twitter:description" content="Coleccionables, ropa, productos gamer y recargas digitales para ti.">
  <meta name="twitter:image" content="https://sakuragameverse.com/icono.png">
  
  <link rel="manifest" href="manifest.json">
  <link rel="icon" type="image/webp" href="logo.webp?v=2">
  <meta name="theme-color" content="#090314">
  
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Rajdhani:wght@500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js"></script>

  <link rel="stylesheet" href="tienda.css">
</head>
<body>

<div class="top-bar-notice">
  <div><i class="fas fa-check-circle" style="color: var(--secondary-color);"></i> <span id="spTexto">Bienvenido, Aventurero</span></div>
  <div style="color: var(--text-muted); font-size: 0.8em;" id="estadoSincronizacion"><i class="fas fa-wifi"></i> Online</div>
</div>

<div class="ticker-bar">
  <div class="ticker-content" id="ajustesTickerObj">
    Cargando información del servidor...
  </div>
</div>

<div id="modalCofreDiario" class="modal">
  <div class="modal-content" style="text-align: center;">
    <button class="cerrar-modal" onclick="cerrarCofreModal()">×</button>
    <h3 style="color: #ffaa00; margin-top: 0;">Recompensa Diaria</h3>
    <div id="cofreResultado" style="background: rgba(0,0,0,0.4); border: 1px dashed #ffaa00; padding: 18px; border-radius: var(--radius-sm); font-weight: 700; color: #fff; margin-bottom: 14px;">Cofre disponible (+50 XP y Tokens)</div>
    <button class="btn-comprar" style="background: #ffaa00; color: #000; box-shadow: 0 0 15px rgba(255,170,0,0.4);" onclick="abrirCofreDiario()">Reclamar Recompensa</button>
  </div>
</div>

<!-- SALÓN ARCADE GACHA (MULTIVERSO) -->
<div id="modalGacha" class="modal">
  <div class="modal-content" style="text-align: center; background: linear-gradient(180deg, rgba(14,4,31,0.95) 0%, #05010a 100%); border: 2px solid var(--secondary-color);">
    <button class="cerrar-modal" onclick="cerrarGachaModal()">×</button>
    <h3 style="color: var(--secondary-color); margin-top: 0; font-size: 1.5em; text-transform: uppercase; text-shadow: 0 0 10px var(--secondary-glow);"><i class="fas fa-gamepad"></i> Salón Arcade</h3>
    <p style="color: var(--text-muted); font-size: 0.85em; margin-bottom: 10px;">Elige una máquina y usa tus TOKENS para ganar cartas y descuentos.</p>

    <div class="cart-tabs" style="margin-bottom: 15px; border-radius: var(--radius-sm);">
      <button class="cart-tab-btn activo" id="tabGachaWaifu" onclick="cambiarModoGacha('waifus')">Waifus</button>
      <button class="cart-tab-btn" id="tabGachaPoke" onclick="cambiarModoGacha('pokemon')">Pokémon</button>
      <button class="cart-tab-btn" id="tabGachaGenshin" onclick="cambiarModoGacha('genshin')">Genshin</button>
    </div>
    
    <div id="gachaMachineContainer" style="position: relative; height: 220px; background: rgba(0,0,0,0.6); border-radius: var(--radius-md); margin-bottom: 15px; border: 1px dashed var(--glass-border); display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: inset 0 0 20px rgba(0,0,0,0.8);">
      <img id="gachaWaifuImg" src="logo.webp?v=2" style="height: 100%; object-fit: contain; opacity: 0.3; transition: all 0.3s ease;">
      <div id="gachaOverlay" style="position: absolute; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: bold; color: var(--secondary-color); font-size: 1.2em; z-index: 2; backdrop-filter: blur(2px);">
        <span id="gachaOverlayText"><i class="fas fa-bolt"></i> MÁQUINA LISTA</span>
      </div>
    </div>

    <div id="gachaResultado" style="display: none; background: rgba(0,0,0,0.4); border: 1px solid var(--secondary-color); padding: 12px; border-radius: var(--radius-sm); font-weight: 700; color: #fff; margin-bottom: 14px; animation: modalSlideUp 0.3s ease;">
        <span id="gachaRarezaBadge" class="tag-r">R</span>
        <div id="gachaNombre" style="font-size: 1.2em; margin: 6px 0;">Waifu</div>
        <div id="gachaPremio" style="color: #25d366; font-size: 0.9em;">Premio aquí</div>
    </div>

    <button class="btn-comprar" id="btnTirarGacha" onclick="realizarTiradaGacha()" style="font-size: 1.1em; text-shadow: 0 0 5px rgba(0,0,0,0.5);">
       Invocar x1 (<span id="lblCostoGacha">100</span> Tokens)
    </button>
    <div style="margin-top: 10px; font-size: 0.85em; color: var(--text-muted);">Tu saldo actual: <strong style="color:#ffaa00;"><i class="fas fa-coins"></i> <span id="lblSaldoGacha">0</span></strong></div>
  </div>
</div>

<div id="modalTemas" class="modal">
  <div class="modal-content" style="text-align: center;">
    <button class="cerrar-modal" onclick="cerrarTemasModal()">×</button>
    <h3 style="color: #fff; margin-top: 0;">Esquema de Color</h3>
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <button class="btn-comprar" style="background: #ff007f;" onclick="cambiarTema('theme-rosa')">Rosa Cyberpunk</button>
      <button class="btn-comprar" style="background: #0099ff; color: #000;" onclick="cambiarTema('theme-azul')">Azul Matrix</button>
      <button class="btn-comprar" style="background: #b000ff;" onclick="cambiarTema('theme-purpura')">Púrpura Arcade</button>
      <button class="btn-comprar" style="background: #ff5500;" onclick="cambiarTema('theme-overdrive')">Naranja Overdrive</button>
    </div>
  </div>
</div>

<div id="modalCloudSave" class="modal">
  <div class="modal-content" style="text-align: center;">
    <button class="cerrar-modal" onclick="cerrarCloudSaveModal()">×</button>
    <h3 style="color: var(--secondary-color); margin-top: 0;"><i class="fas fa-cloud"></i> Sincronización</h3>
    <p style="font-size: 0.85em; color: var(--text-muted); margin-bottom: 15px;">Guarda tu XP, Favoritos y Carrito en la nube para no perderlos nunca.</p>

    <div id="formCloudSave">
      <input type="email" id="authEmail" class="sugerencia-input" placeholder="Tu Correo Electrónico" style="margin-bottom: 8px;">
      <input type="password" id="authPass" class="sugerencia-input" placeholder="Contraseña Segura" style="margin-bottom: 12px;">

      <div style="display: flex; gap: 8px; margin-bottom: 10px;">
        <button class="btn-comprar" style="margin-top: 0; background: rgba(0, 229, 255, 0.1); color: var(--secondary-color); border: 1px solid var(--secondary-color); box-shadow: none;" onclick="registrarCloud()">Crear Cuenta</button>
        <button class="btn-comprar" style="margin-top: 0;" onclick="entrarCloud()">Entrar</button>
      </div>
      <p id="authErrorMsg" style="color: #ff3366; font-size: 0.8em; margin: 0; display: none; font-weight: bold;"></p>
    </div>
    
    <div id="perfilCloudSave" style="display: none;">
      <div style="font-size: 40px; color: #25d366; margin-bottom: 10px;"><i class="fas fa-check-circle"></i></div>
      <p style="font-size: 1.1em; font-weight: bold; color: #fff;">¡Partida Guardada!</p>
      <p style="font-size: 0.85em; color: var(--text-muted);">Tu progreso está sincronizado con la nube.</p>
      <button class="btn-comprar" style="background: rgba(255, 51, 102, 0.1); color: #ff3366; border: 1px solid rgba(255, 51, 102, 0.3); box-shadow: none; margin-top: 15px;" onclick="cerrarSesionCloud()">Cerrar Sesión (Borrar Local)</button>
    </div>
  </div>
</div>

<div id="modalRastreo" class="modal">
  <div class="modal-content">
    <button class="cerrar-modal" onclick="cerrarRastreoModal()">×</button>
    <h3 style="color: var(--secondary-color); margin-top: 0; text-align: center;"><i class="fas fa-radar"></i> Rastrear Paquete</h3>
    <p style="font-size: 0.85em; color: var(--text-muted); text-align: center; margin-bottom: 12px;">Ingresa el número de WhatsApp con el que realizaste tu compra.</p>
    <div style="display: flex; gap: 8px; margin-bottom: 14px;">
      <input type="text" id="inputRastreoTlf" class="sugerencia-input" placeholder="Ej: 04241234567">
      <button class="btn-cupon" onclick="buscarPedido()"><i class="fas fa-search"></i></button>
    </div>
    <div id="resultadoRastreo" style="background: rgba(0,0,0,0.3); padding: 14px; border-radius: var(--radius-sm); border: 1px dashed var(--glass-border); min-height: 80px; display: flex; flex-direction: column; justify-content: center;">
      <p style="color: var(--text-muted); text-align: center; margin: 0; font-size: 0.85em;">Tu estado de cuenta aparecerá aquí.</p>
    </div>
  </div>
</div>

<!-- MODAL LA ARENA (RUMBLE) -->
<div id="modalRumble" class="modal">
  <div class="modal-content" style="text-align: center; border-color: #ff3366;">
    <button class="cerrar-modal" onclick="cerrarRumbleModal()">×</button>
    <h3 style="color: #ff3366; margin-top: 0;"><i class="fas fa-skull-crossbones"></i> Torneo Rumble</h3>
    <p style="font-size: 0.85em; color: var(--text-muted);">Inscríbete en el evento oficial. El administrador iniciará la batalla pronto.</p>

    <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: var(--radius-sm); border: 1px dashed #ff3366; margin-bottom: 15px;">
      Estado: <strong id="lblEstadoRumble" style="color: #ffaa00;">Inscripciones Abiertas</strong><br>
      Inscritos actuales: <strong id="lblInscritosRumble" style="color: #fff;">0</strong>
    </div>

    <button id="btnInscribirseRumble" class="btn-comprar" style="background: #ff3366; box-shadow: 0 0 15px rgba(255,51,102,0.4);" onclick="inscribirseRumbleBD()">
      <i class="fas fa-pen-nib"></i> Inscribirse a la Batalla
    </button>

    <div style="margin-top: 20px; text-align: left;">
      <h4 style="color: var(--secondary-color); margin-bottom: 5px; font-size: 0.9em;">Última Batalla:</h4>
      <div id="logUltimoRumble" style="background: #000; padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--glass-border); height: 120px; overflow-y: auto; font-family: monospace; font-size: 0.8em; color: #fff;">
        Cargando resultados anteriores...
      </div>
    </div>
  </div>
</div>

<div class="hero-banner">
  <img src="logo.webp?v=2" alt="Sakura Gameverse" class="hero-logo" onclick="activarEasterEggLogo()" loading="eager" decoding="async">
  <br>
  <div class="store-status-badge"><div class="status-dot"></div> Horario de Atención: 10:00 AM - 7:00 PM</div>
  <div class="hero-title" id="ajustesHeroTitleObj">Cargando...</div>
  <div style="color: var(--text-muted); font-size: 0.9em; max-width: 500px; margin: 0 auto 14px auto;" id="ajustesHeroDescObj">...</div>
  <div id="bannerSliderContainer" class="banner-slider-container"></div>
  <br>
</div>

<div class="container">
  <div class="search-box">
    <input type="text" id="buscador" class="search-input" placeholder="Buscar por producto, personaje o franquicia..." onkeyup="buscarProductos()">
  </div>

  <div class="categorias-visuales-section">
    <div class="categorias-visuales-header">Categorías de Catálogo</div>
    <div class="carrusel-wrapper">
      <button class="carrusel-arrow arrow-prev" onclick="scrollCategoriasVisuales(-1)"><i class="fas fa-chevron-left"></i></button>
      <div class="carrusel-track" id="categoriasTrack">
        <div class="cat-card activa" onclick="filtrarCategoria('todos')">
          <img src="logo.webp?v=2" id="img-cat-todos" class="cat-img" alt="Todos" loading="lazy" decoding="async">
          <div class="cat-info"><div class="cat-title" id="title-cat-todos">Todo el Stock</div><div class="cat-count" id="count-todos">0 items</div></div>
        </div>
        <div class="cat-card" onclick="filtrarCategoria('recargas')">
          <img src="logo.webp?v=2" id="img-cat-recargas" class="cat-img" alt="Recargas" loading="lazy" decoding="async">
          <div class="cat-info"><div class="cat-title" id="title-cat-recargas">Recargas</div><div class="cat-count" id="count-recargas">0 items</div></div>
        </div>
        <div class="cat-card" onclick="filtrarCategoria('mangas')">
          <img src="logo.webp?v=2" id="img-cat-mangas" class="cat-img" alt="Mangas" loading="lazy" decoding="async">
          <div class="cat-info"><div class="cat-title" id="title-cat-mangas">Mangas & Libros</div><div class="cat-count" id="count-mangas">0 items</div></div>
        </div>
        <div class="cat-card" onclick="filtrarCategoria('ropa')">
          <img src="logo.webp?v=2" id="img-cat-ropa" class="cat-img" alt="Ropa" loading="lazy" decoding="async">
          <div class="cat-info"><div class="cat-title" id="title-cat-ropa">Vestimenta</div><div class="cat-count" id="count-ropa">0 items</div></div>
        </div>
        <div class="cat-card" onclick="filtrarCategoria('cartas')">
          <img src="logo.webp?v=2" id="img-cat-cartas" class="cat-img" alt="TCG" loading="lazy" decoding="async">
          <div class="cat-info"><div class="cat-title" id="title-cat-cartas">TCG & Cartas</div><div class="cat-count" id="count-cartas">0 items</div></div>
        </div>
        <div class="cat-card" onclick="filtrarCategoria('figuras')">
          <img src="logo.webp?v=2" id="img-cat-figuras" class="cat-img" alt="Figuras" loading="lazy" decoding="async">
          <div class="cat-info"><div class="cat-title" id="title-cat-figuras">Figuras</div><div class="cat-count" id="count-figuras">0 items</div></div>
        </div>
        <div class="cat-card" onclick="filtrarCategoria('mandos')">
          <img src="logo.webp?v=2" id="img-cat-mandos" class="cat-img" alt="Mandos" loading="lazy" decoding="async">
          <div class="cat-info"><div class="cat-title" id="title-cat-mandos">Mandos & Consolas</div><div class="cat-count" id="count-mandos">0 items</div></div>
        </div>
        <div class="cat-card" onclick="filtrarCategoria('perifericos')">
          <img src="logo.webp?v=2" id="img-cat-perifericos" class="cat-img" alt="Periféricos" loading="lazy" decoding="async">
          <div class="cat-info"><div class="cat-title" id="title-cat-perifericos">Periféricos Gamer</div><div class="cat-count" id="count-perifericos">0 items</div></div>
        </div>
      </div>
      <button class="carrusel-arrow arrow-next" onclick="scrollCategoriasVisuales(1)"><i class="fas fa-chevron-right"></i></button>
    </div>
  </div>

  <div class="controles-superiores">
    <div class="panel-controles-avanzados">
      <select id="selectColeccion" class="ordenar-select" onchange="cambiarColeccionDropdown(this.value)">
        <option value="todos">Colección: Todas las Franquicias</option>
      </select>
      <select id="selectEstado" class="ordenar-select" onchange="filtrarEstadoDropdown(this.value)">
        <option value="todos">Disponibilidad: Todo</option>
        <option value="Envío Inmediato 📦">Solo Stock Inmediato</option>
        <option value="Por Encargo ⚡">Bajo Encargo</option>
      </select>
      <select id="selectOrden" class="ordenar-select" onchange="ordenarProductos()">
        <option value="defecto">Ordenar: Predeterminado</option>
        <option value="reciente">Novedades: Más recientes</option>
        <option value="menor">Precio: Menor a Mayor</option>
        <option value="mayor">Precio: Mayor a Menor</option>
      </select>
    </div>
  </div>

  <div class="grid" id="catalogoNube"><p style="text-align: center; color: var(--text-muted); grid-column: 1/-1;">Sincronizando inventario...</p></div>

  <div id="contenedorCargarMas" style="text-align: center; margin-top: 25px;">
    <button id="btnCargarMas" style="display: none; width: auto; padding: 12px 30px; margin: 0 auto; border-radius: var(--radius-pill); background: rgba(0, 229, 255, 0.1); border: 1px solid var(--secondary-color); color: var(--secondary-color); font-family: 'Chakra Petch', sans-serif; font-weight: 700; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 0 10px rgba(0,229,255,0.2);" onclick="cargarMasProductos()">
      Mostrar más productos <i class="fas fa-chevron-down" style="margin-left: 5px;"></i>
    </button>
  </div>

  <div class="reviews-section">
    <h3 style="color: #fff; margin-top: 0; margin-bottom: 15px;">Opiniones de Clientes</h3>
    <div id="contenedorReviews"><p style="color: var(--text-muted);">Cargando reseñas verificadas...</p></div>
    <div style="margin-top: 15px;">
      <input type="text" id="revNombre" class="sugerencia-input" placeholder="Nombre o GamerTag" style="margin-bottom: 8px;">
      <select id="revEstrellas" class="sugerencia-input" style="margin-bottom: 8px;">
        <option value="⭐⭐⭐⭐⭐">5 / 5 - Excelente servicio</option>
        <option value="⭐⭐⭐⭐">4 / 5 - Muy bueno</option>
        <option value="⭐⭐⭐">3 / 5 - Conforme</option>
      </select>
      <textarea id="revTexto" class="sugerencia-input" rows="2" placeholder="Describe tu experiencia de compra..." style="margin-bottom: 8px;"></textarea>
      <button class="btn-comprar" style="width: auto; padding: 8px 18px;" onclick="agregarReview()">Publicar Opinión</button>
    </div>
  </div>

</div>

<!-- MODAL PRODUCTO DETALLE CON MINIGALERIA -->
<div id="miModal" class="modal">
  <div class="modal-content">
    <button class="cerrar-modal" onclick="cerrarModal()">×</button>
    <div class="breadcrumbs" id="modalBreadcrumbs">Inicio / <span>Categoría</span></div>
    <img id="modalImg" src="" alt="Producto" class="modal-img" loading="eager" decoding="async">
    
    <div id="modalContainerMinis" class="modal-miniaturas"></div>
    
    <div id="modalTag" class="modal-tag-info">Disponible</div>
    <h3 id="modalTitulo" style="color: #fff; margin: 4px 0 8px 0;">Título</h3>
    <div id="modalPrecio" style="color: var(--secondary-color); font-size: 1.4em; font-weight: 700; margin-bottom: 8px;">$0.00</div>
    <p id="modalDesc" style="font-size: 0.9em; color: var(--text-muted); margin-bottom: 14px; line-height: 1.4;">Detalles del producto.</p>
    
    <div id="tallasContainer" style="display: none; margin-bottom: 12px;">
      <label for="selectTalla" style="display: block; font-size: 0.85em; font-weight: 700; margin-bottom: 4px;">Seleccionar Talla:</label>
      <select id="selectTalla" class="talla-select">
        <option value="S">Talla S</option><option value="M" selected>Talla M</option><option value="L">Talla L</option><option value="XL">Talla XL</option>
      </select>
    </div>

    <div id="recargaContainer" style="display: none; margin-bottom: 12px;">
      <label for="inputPlayerId" style="display: block; font-size: 0.85em; font-weight: 700; margin-bottom: 4px;">ID de Jugador:</label>
      <input type="text" id="inputPlayerId" class="recarga-input" placeholder="Ingresa tu ID de cuenta">
      <label for="inputPlayerServer" style="display: block; font-size: 0.85em; font-weight: 700; margin: 8px 0 4px 0;">Servidor / Región:</label>
      <input type="text" id="inputPlayerServer" class="recarga-input" placeholder="Ej: Sudamérica / EE.UU.">
    </div>

    <button id="btnComprarModal" class="btn-comprar" onclick="agregarAlCarrito()"><i class="fas fa-cart-plus"></i> Añadir al Carrito</button>
    <button class="btn-compartir" onclick="compartirProductoWhatsApp()"><i class="fab fa-whatsapp"></i> Consultar por WhatsApp</button>
  </div>
</div>

<div id="modalOpcionesMenu" class="modal">
  <div class="modal-content" style="text-align: center;">
    <button class="cerrar-modal" onclick="cerrarMenuOpciones()">×</button>
    <h3 style="color: #fff; margin-top: 0;">Panel de Funciones</h3>
    <button id="btnInstalarPWA" class="btn-comprar btn-instalar" style="display: none; margin-bottom: 15px;" onclick="instalarPWA()"><i class="fas fa-download"></i> Instalar App Sakura</button>

    <div class="menu-opciones-grid">
      <!-- CENTRO RPG UNIFICADO -->
      <a href="rpg.html" class="btn-menu-opcion" style="grid-column: 1 / -1; color: #00e5ff; background: rgba(0,229,255,0.12); border: 1px solid rgba(0,229,255,0.4); padding: 14px; font-size: 1.05em;"><i class="fas fa-dragon"></i> Centro RPG</a>
      
      <button class="btn-menu-opcion" style="color: #ff3366;" onclick="cerrarMenuOpciones(); abrirRumbleModal()"><i class="fas fa-skull-crossbones"></i> La Arena</button>
      <button class="btn-menu-opcion" style="color: #00e5ff;" id="btnMenuCloud" onclick="cerrarMenuOpciones(); abrirCloudSaveModal()"><i class="fas fa-cloud"></i> Vincular Nube</button>
      <button class="btn-menu-opcion" style="color: #b000ff;" onclick="cerrarMenuOpciones(); abrirRastreoModal()"><i class="fas fa-radar"></i> Rastrear</button>
      <button class="btn-menu-opcion" style="color: #ffaa00;" onclick="cerrarMenuOpciones(); abrirCofreModal()"><i class="fas fa-gift"></i> Cofre Diario</button>
      <button class="btn-menu-opcion" style="color: var(--secondary-color);" onclick="cerrarMenuOpciones(); abrirGachaModal()"><i class="fas fa-capsules"></i> Gacha Center</button>
      <button class="btn-menu-opcion" style="color: #ff007f;" onclick="cerrarMenuOpciones(); abrirTemasModal()"><i class="fas fa-palette"></i> Temas</button>
      <button class="btn-menu-opcion" style="color: #e0f4ff;" onclick="toggleMusicaLoFi()"><i class="fas fa-music" id="iconoMusica"></i> Audio Lo-Fi</button>
      <button class="btn-menu-opcion" style="color: var(--text-muted);" onclick="cerrarMenuOpciones(); abrirFaqModal()"><i class="fas fa-question-circle"></i> Preguntas</button>
      <button class="btn-menu-opcion" style="color: #fff;" onclick="cerrarMenuOpciones(); abrirSugerenciaModal()"><i class="fas fa-lightbulb"></i> Encargos</button>
      <a href="admin.html" class="btn-menu-opcion" style="color: #ff3366;"><i class="fas fa-lock"></i> Gestión Admin</a>
      <a href="javascript:void(0)" onclick="abrirChatGlobalWhatsApp()" class="btn-menu-opcion" style="color: #25D366;"><i class="fab fa-whatsapp"></i> Chat Directo</a>
    </div>
  </div>
</div>

<div id="modalFavoritos" class="modal">
  <div class="modal-content">
    <button class="cerrar-modal" onclick="cerrarFavoritosModal()">×</button>
    <h3 style="color: #fff; margin-top: 0; text-align: center;">Artículos Guardados</h3>
    <div id="listaFavoritosDetalle" style="max-height: 250px; overflow-y: auto; margin-bottom: 14px;"></div>
  </div>
</div>

<div id="modalCarrito" class="modal">
  <div class="modal-content">
    <button class="cerrar-modal" onclick="cerrarCarritoModal()">×</button>
    <h3 style="color: #fff; margin-top: 0; text-align: center;">Resumen de Pedido</h3>
    
    <div class="cart-tabs">
      <button class="cart-tab-btn activo" id="tabBtnFisico" onclick="cambiarPestanaCarrito('fisico')">Físicos (<span id="countCartFisico">0</span>)</button>
      <button class="cart-tab-btn" id="tabBtnDigital" onclick="cambiarPestanaCarrito('digital')">Recargas (<span id="countCartDigital">0</span>)</button>
    </div>

    <div id="boxEnvioGratis" style="margin-bottom: 15px; display: none;">
      <div style="font-size: 0.85em; margin-bottom: 6px; color: var(--text-color); text-align: center; font-family: 'Rajdhani', sans-serif;" id="txtEnvioGratis">Calculando envío...</div>
      <div class="xp-bar-container" style="height: 6px; margin-top: 0; box-shadow: none;">
        <div class="xp-bar-fill" id="barEnvioGratis" style="width: 0%; background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));"></div>
      </div>
    </div>

    <div class="cupon-box">
      <input type="text" id="inputCupon" class="cupon-input" placeholder="Código de descuento">
      <button class="btn-cupon" onclick="aplicarCupon()">Aplicar</button>
    </div>
    <div id="mensajeCupon" style="font-size: 0.8em; margin-bottom: 8px;"></div>

    <div id="listaCarritoDetalle" style="max-height: 150px; overflow-y: auto; margin-bottom: 12px;"></div>
    
    <div id="boxUpsell" style="margin-bottom: 15px; display: none; padding-top: 10px; border-top: 1px dashed var(--glass-border);">
      <div style="font-size: 0.85em; color: var(--text-muted); margin-bottom: 8px; font-weight: 700;">✨ Completa tu pedido con esto:</div>
      <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 5px; scrollbar-width: none;" id="listaUpsell"></div>
    </div>

    <div class="form-group" style="margin-bottom: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); padding: 10px; border-radius: var(--radius-sm);">
      <label style="display: block; font-size: 0.85em; font-weight: 700; margin-bottom: 4px; color: var(--secondary-color);"><i class="fas fa-user-ninja"></i> Tus Datos (Para registrar orden):</label>
      <input type="text" id="cartClienteNombre" class="sugerencia-input" placeholder="Tu Nombre y Apellido" style="margin-bottom: 6px;">
      <input type="number" id="cartClienteTelefono" class="sugerencia-input" placeholder="Tu WhatsApp (Ej: 04241234567)">
    </div>

    <div id="apartadoEnvioFisico">
      <div style="margin-bottom: 10px;">
        <label style="display: block; font-size: 0.85em; font-weight: 700; margin-bottom: 4px;">Método de Despacho:</label>
        <select id="selectMetodoEnvio" class="talla-select">
          <option value="ZOOM (Cobro a destino)">ZOOM (Envío nacional - Cobro a destino)</option>
          <option value="MRW (Cobro a destino)">MRW (Envío nacional - Cobro a destino)</option>
          <option value="Entrega Personal (Bejuma)">Entrega Personal (Bejuma, Carabobo)</option>
          <option value="Entrega Personal (Miranda)">Entrega Personal (Miranda, Carabobo)</option>
        </select>
      </div>
      <div style="margin-bottom: 12px;" id="boxDireccionEnvio">
        <label style="display: block; font-size: 0.85em; font-weight: 700; margin-bottom: 4px;">Dirección de Entrega / Agencia:</label>
        <input type="text" id="inputDireccionEnvio" class="sugerencia-input" placeholder="Ciudad, Estado, Dirección o Agencia específica...">
      </div>
    </div>

    <div id="apartadoRecargasDigitales" style="display: none; background: rgba(0,0,0,0.3); border: 1px dashed var(--glass-border); padding: 10px; border-radius: var(--radius-sm); margin-bottom: 12px; font-size: 0.85em; color: var(--text-muted);">
      <strong style="color: var(--secondary-color);">Entrega Directa:</strong> Las recargas se ejecutan directamente con el ID y Servidor especificados. No aplican costos de flete ni datos de encomienda.
    </div>

    <div id="reciboDigital" class="recibo-box" style="display: none;">
      <div style="text-align: center; font-weight: 700; margin-bottom: 6px; color: var(--secondary-color);">RESUMEN DE CUENTA</div>
      <div id="reciboContenido"></div>
    </div>

    <div id="modalCarritoTotal" style="color: var(--secondary-color); font-size: 1.3em; font-weight: 700; margin-bottom: 12px; text-align: center; text-shadow: 0 0 10px rgba(0,229,255,0.3);">Total: $0.00</div>
    
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <button class="btn-compartir" style="margin-top: 0; padding: 10px; font-size: 0.85em; border-color: rgba(0, 229, 255, 0.4); color: var(--secondary-color);" onclick="compartirCarrito()"><i class="fas fa-share-nodes"></i> Compartir Carrito (Wishlist)</button>
      
      <div style="display: flex; gap: 8px;">
        <button style="flex: 1; padding: 10px; background: rgba(255,51,102,0.1); border: 1px solid rgba(255, 51, 102, 0.4); color: #ff3366; border-radius: var(--radius-sm); font-weight: 700; cursor: pointer; transition: all 0.2s ease;" onclick="vaciarCarrito()">Limpiar</button>
        <button style="flex: 2; padding: 10px; background: linear-gradient(135deg, #25D366, #1da851); color: #000; border: none; border-radius: var(--radius-sm); font-weight: 700; cursor: pointer; box-shadow: 0 4px 15px rgba(37,211,102,0.3);" id="btnFinalizarPedido" onclick="enviarPedidoWhatsApp()">Enviar Orden</button>
      </div>
    </div>
  </div>
</div>

<div id="modalFaq" class="modal">
  <div class="modal-content">
    <button class="cerrar-modal" onclick="cerrarFaqModal()">×</button>
    <h3 style="color: #fff; margin-top: 0; text-align: center;">Preguntas Frecuentes</h3>
    <div style="font-size: 0.9em; line-height: 1.5; color: var(--text-muted);">
      <p><strong style="color: #fff;">¿Dónde realizan entregas en persona?</strong><br>Puntos acordados previamente en Bejuma y Miranda, Estado Carabobo.</p>
      <p><strong style="color: #fff;">¿Cómo operan los despachos nacionales?</strong><br>Envíos cobro a destino a través de agencias ZOOM y MRW.</p>
    </div>
  </div>
</div>

<div class="bottom-nav">
  <div class="nav-item active" onclick="window.scrollTo({top: 0, behavior: 'smooth'}); reproducirSonido();"><i class="fas fa-th-large"></i><span>Catálogo</span></div>
  <div class="nav-item" onclick="abrirFavoritosModal()"><i class="fas fa-heart"></i><span>Guardados</span><div class="nav-badge" id="favBadge">0</div></div>
  <div class="nav-item" onclick="abrirCarritoModal()"><i class="fas fa-shopping-bag"></i><span>Carrito</span><div class="nav-badge" id="cartBadge">0</div></div>
  <div class="nav-item" onclick="abrirMenuOpciones()"><i class="fas fa-bars"></i><span>Menú</span></div>
</div>

<audio id="audioLoFi" loop src="https://stream.zeno.fm/f3wvbbqmdg8uv"></audio>

<script type="module" src="tienda.js?v=4"></script>
</body>
</html>
  

El de arriba es el Index HTML 


Y el de abajo es tienda.js 

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

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
let gamerProfile = {}; 

onAuthStateChanged(auth, async (user) => {
  if (user) { 
      currentUserUid = user.uid; 
      document.getElementById('pantallaAuthRPG').style.display = 'none';
      document.getElementById('contenidoJuegoRPG').style.display = 'block';
      await window.descargarProgresoNube(user.uid); 
  } else { 
      currentUserUid = null; gamerProfile = {}; 
      document.getElementById('pantallaAuthRPG').style.display = 'flex';
      document.getElementById('contenidoJuegoRPG').style.display = 'none';
  }
  await window.cargarObjetosRPG();
});

window.toggleRegistroRPG = function() {
    let titulo = document.getElementById('authSubtitle');
    let isLogin = document.getElementById('btnAuthConfirmarReg').style.display === 'none';
    
    document.getElementById('btnAuthEntrar').style.display = isLogin ? 'none' : 'block';
    document.getElementById('btnAuthToggleRegistrar').style.display = isLogin ? 'none' : 'block';
    document.getElementById('btnAuthConfirmarReg').style.display = isLogin ? 'block' : 'none';
    document.getElementById('btnAuthVolverLogin').style.display = isLogin ? 'block' : 'none';
    document.getElementById('authErrorMsg').style.display = 'none';
    titulo.innerText = isLogin ? "Crea tu Nickname para registrarte" : "Ingresa tu Nickname para continuar";
};

window.iniciarSesionRPG = async function() {
    let nick = document.getElementById('authNick').value.trim();
    let pass = document.getElementById('authPass').value;
    let errBox = document.getElementById('authErrorMsg');
    if(!nick || !pass) return;

    let emailAUsar = nick.includes('@') ? nick : nick.toLowerCase() + "@sakura.game";
    document.getElementById('btnAuthEntrar').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conectando...';
    try { await signInWithEmailAndPassword(auth, emailAUsar, pass); } 
    catch(e) { errBox.innerText = "Nickname o Contraseña incorrectos."; errBox.style.display = 'block'; document.getElementById('btnAuthEntrar').innerHTML = 'Iniciar Sesión'; }
};

window.crearCuentaRPG = async function() {
    let nick = document.getElementById('authNick').value.trim();
    let pass = document.getElementById('authPass').value;
    let errBox = document.getElementById('authErrorMsg');

    if(!nick || !pass) { errBox.innerText = "Completa todos los campos."; errBox.style.display = 'block'; return; }
    if(pass.length < 6) { errBox.innerText = "La contraseña debe tener al menos 6 caracteres."; errBox.style.display = 'block'; return; }
    if(nick.includes('@')) { errBox.innerText = "El Nickname no puede llevar @."; errBox.style.display = 'block'; return; }
    if(nick.toLowerCase() === "gamerotaku_ve" || nick.toLowerCase().includes("admin")) { errBox.innerText = "Ese nombre está reservado."; errBox.style.display = 'block'; return; }

    document.getElementById('btnAuthConfirmarReg').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
    try {
        const qTag = query(collection(db, "jugadores_cloud"), where("profile.tag", "==", nick));
        const tagSnap = await getDocs(qTag);
        if(!tagSnap.empty) { errBox.innerText = "Ese Nombre (GamerTag) ya está en uso."; errBox.style.display = 'block'; document.getElementById('btnAuthConfirmarReg').innerHTML = 'Crear Personaje'; return; }

        let fakeEmail = nick.toLowerCase() + "@sakura.game";
        const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, pass);
        
        let perfilInicial = { tag: nick, xp: 0, tokens: 0, rango: "Genin", profesion: "Sin Clase", stats: { hpMax: 100, hpActual: 100, energiaMax: 100, energiaActual: 100, ultimaEnergia: Date.now(), atk: 10, def: 5 }, inventario: [], equipo: { cabeza: null, pecho: null, piernas: null, pies: null, mano_derecha: null, mano_izquierda: null, amuleto: null, anillo: null, mascota: null }, cooldowns: {} };
        await setDoc(doc(db, "jugadores_cloud", userCredential.user.uid), { profile: perfilInicial, updatedAt: Date.now() });
    } catch(e) { errBox.innerText = "Error al crear la cuenta."; errBox.style.display = 'block'; document.getElementById('btnAuthConfirmarReg').innerHTML = 'Crear Personaje'; }
};

window.cerrarSesionRPG = async function() {
    if(confirm("¿Quieres salir de la cuenta actual?")) { await signOut(auth); localStorage.removeItem('sakura_gamer_profile'); window.location.reload(); }
};

// ==========================================
// MIGRACIÓN Y ESTADÍSTICAS PASIVAS
// ==========================================
function inicializarStats() {
    if(!gamerProfile.stats) return; 
    if (typeof gamerProfile.stats.hp === 'number') { gamerProfile.stats.hpMax = gamerProfile.stats.hp; gamerProfile.stats.hpActual = gamerProfile.stats.hp; delete gamerProfile.stats.hp; }
    if (!gamerProfile.stats.hpMax) { gamerProfile.stats.hpMax = 100; gamerProfile.stats.hpActual = 100; }
    if (!gamerProfile.stats.energiaMax) { gamerProfile.stats.energiaMax = 100; gamerProfile.stats.energiaActual = 100; gamerProfile.stats.ultimaEnergia = Date.now(); }
    if (!gamerProfile.cooldowns) { gamerProfile.cooldowns = {}; }
    if (!gamerProfile.profesion || gamerProfile.profesion === "Ninguna") { gamerProfile.profesion = "Sin Clase"; }
}

function actualizarEnergiaPasiva() {
    if(!gamerProfile.stats) return;
    let ahora = Date.now(); let tiempoPasado = ahora - (gamerProfile.stats.ultimaEnergia || ahora);
    let minutosPasados = Math.floor(tiempoPasado / 60000); 
    let limiteEnergia = gamerProfile.stats.energiaMax;
    
    if(gamerProfile.profesion === 'Mago') limiteEnergia += 30; // Pasiva Mago: +30 Energía Base

    if (minutosPasados > 0 && gamerProfile.stats.energiaActual < limiteEnergia) {
        gamerProfile.stats.energiaActual += minutosPasados;
        if (gamerProfile.stats.energiaActual > limiteEnergia) gamerProfile.stats.energiaActual = limiteEnergia;
        gamerProfile.stats.ultimaEnergia += minutosPasados * 60000; window.guardarProgresoRPG();
    } else if (gamerProfile.stats.energiaActual >= limiteEnergia) {
        gamerProfile.stats.ultimaEnergia = ahora;
    }
}

setInterval(() => { if(currentUserUid){ actualizarEnergiaPasiva(); window.renderizarTodoRPG(); } }, 60000);

function calcularNivel(xp) { return Math.floor(Math.sqrt((xp || 0) / 20)) + 1; }
function calcularXpNivelActual(nivel) { return Math.pow(nivel - 1, 2) * 20; }
function calcularXpSiguienteNivel(nivel) { return Math.pow(nivel, 2) * 20; }

// ==========================================
// ELECCIÓN DE CLASES (FASE 2)
// ==========================================
window.seleccionarClaseRPG = function(claseElegida) {
    if (confirm(`¿Estás seguro de elegir el camino del ${claseElegida}? Esta decisión es permanente.`)) {
        gamerProfile.profesion = claseElegida;
        document.getElementById('modalElegirClase').style.display = 'none';
        window.guardarProgresoRPG();
        window.mostrarTextoFlotante(`¡Ahora eres un ${claseElegida}!`, '#ffaa00');
        try{ confetti({ particleCount: 100, spread: 80, colors: ['#ffaa00', '#ffffff'] }); }catch(e){}
    }
};

const zonasCaza = {
    'gallinas': { nombre: 'Corral de Gallinas', reqNivel: 1, gastaHp: 2, gastaEn: 5, xpGana: 5, tokGana: 0, probDrop: 10, drops: ['Poción de Vida Menor'] },
    'vacas': { nombre: 'Prado de Vacas', reqNivel: 3, gastaHp: 5, gastaEn: 10, xpGana: 15, tokGana: 2, probDrop: 20, drops: ['Cuero de Lobo Huargo', 'Poción de Vida Menor'] },
    'goblins': { nombre: 'Campamento Goblin', reqNivel: 4, gastaHp: 10, gastaEn: 15, xpGana: 40, tokGana: 5, probDrop: 30, drops: ['Daga de Bronce', 'Escudo de Madera Robusta'] },
    'gigantes': { nombre: 'Valle de Gigantes', reqNivel: 7, gastaHp: 20, gastaEn: 20, xpGana: 100, tokGana: 15, probDrop: 45, drops: ['Espada de Carlin', 'Arco de Madera de Roble'] }
};

const mazmorras = {
    'facil': { nombre: 'Bosque Slime', poderReq: 40, gastaHp: 15, gastaEn: 25, xpGana: 45, tokGana: 5, probDrop: 40, drops: ['Bendición de la Diosa', 'Mineral de Cobre'] },
    'media': { nombre: 'Cueva Sangrienta', poderReq: 180, gastaHp: 30, gastaEn: 40, xpGana: 120, tokGana: 12, probDrop: 50, drops: ['Fragmento de Runa de Muerte', 'Katana de Hierro Frío', 'Báculo de Destrucción'] },
    'dificil': { nombre: 'Torre del Dragón', poderReq: 600, gastaHp: 60, gastaEn: 60, xpGana: 350, tokGana: 35, probDrop: 70, drops: ['Elucidator', 'Espada de Dios', 'Armadura de Placas Mágica (MPA)', 'Guadaña del Segador'] }
};

window.mostrarTextoFlotante = function(texto, color) { let el = document.createElement('div'); el.className = 'floating-text'; el.style.color = color; el.style.left = '50%'; el.style.top = '40%'; el.innerHTML = texto; document.body.appendChild(el); setTimeout(() => el.remove(), 1500); };

window.cargarObjetosRPG = async function() {
  try {
    const snapsObj = await getDocs(query(collection(db, "rpg_objetos"))); rpgObjetosGlobal = [];
    snapsObj.forEach(d => {
      let obj = d.data();
      rpgObjetosGlobal.push({ 
        id: d.id, nombre: obj.nombre, tipo: (obj.tipo || 'arma').toLowerCase(), rareza: obj.rareza || 'N', ranura: obj.ranura || 'ninguna', 
        atk: obj.stats?.atk || 0, def: obj.stats?.def || 0, imgUrl: obj.imgUrl || '',
        costoMat: obj.costoMat || (obj.rareza === 'SSR' ? 100 : obj.rareza === 'SR' ? 35 : obj.rareza === 'R' ? 10 : 3),
        costoTok: obj.costoTok || (obj.rareza === 'SSR' ? 1000 : obj.rareza === 'SR' ? 250 : obj.rareza === 'R' ? 50 : 15),
        pesoDrop: obj.pesoDrop || (obj.rareza === 'SSR' ? 1 : obj.rareza === 'SR' ? 15 : obj.rareza === 'R' ? 100 : 1000), nivelReq: obj.nivelReq || 1
      });
    });
    if(currentUserUid) window.renderizarFraguaRPG();
  } catch(e) { console.warn("Error cargando objetos:", e); }
};

window.descargarProgresoNube = async function(uid) {
    try {
        const snap = await getDoc(doc(db, "jugadores_cloud", uid));
        if(snap.exists()) {
            const d = snap.data(); if(d.profile) { gamerProfile = d.profile; inicializarStats(); if (!gamerProfile.equipo) gamerProfile.equipo = { cabeza: null, pecho: null, piernas: null, pies: null, mano_derecha: null, mano_izquierda: null, amuleto: null, anillo: null, mascota: null }; }
        } else {
            gamerProfile = { tag: "Admin_" + uid.substring(0,4), xp: 0, tokens: 0, rango: "Genin", profesion: "Sin Clase", stats: { hpMax: 100, hpActual: 100, energiaMax: 100, energiaActual: 100, ultimaEnergia: Date.now(), atk: 10, def: 5 }, inventario: [], equipo: { cabeza: null, pecho: null, piernas: null, pies: null, mano_derecha: null, mano_izquierda: null, amuleto: null, anillo: null, mascota: null }, cooldowns: {} };
            await setDoc(doc(db, "jugadores_cloud", uid), { profile: gamerProfile, updatedAt: Date.now() });
        }
        localStorage.setItem('sakura_gamer_profile', JSON.stringify(gamerProfile)); window.renderizarTodoRPG();
    } catch(e) {}
};

window.guardarProgresoRPG = async function() {
    if(!currentUserUid) return; localStorage.setItem('sakura_gamer_profile', JSON.stringify(gamerProfile));
    try { await setDoc(doc(db, "jugadores_cloud", currentUserUid), { profile: gamerProfile, updatedAt: Date.now() }, { merge: true }); } catch(e) {} window.renderizarTodoRPG();
};

window.renderizarTodoRPG = function() {
  if(!gamerProfile.stats) return; 
  actualizarEnergiaPasiva();

  let xpActual = gamerProfile.xp || 0; let nivelJugador = calcularNivel(xpActual);
  let xpBaseNivel = calcularXpNivelActual(nivelJugador); let xpProximo = calcularXpSiguienteNivel(nivelJugador);
  let pctXp = Math.min(100, Math.max(0, ((xpActual - xpBaseNivel) / (xpProximo - xpBaseNivel)) * 100));

  document.getElementById('rpgPerfilTag').innerText = gamerProfile.tag || "Aventurero";
  document.getElementById('rpgPerfilTokens').innerHTML = `<i class="fas fa-coins"></i> ${gamerProfile.tokens || 0} Tokens`;
  document.getElementById('rpgNivelBadge').innerText = `Nv. ${nivelJugador}`;
  document.getElementById('rpgProximoNivelTxt').innerText = nivelJugador + 1;
  document.getElementById('rpgBarraXpFill').style.width = `${pctXp}%`;
  document.getElementById('rpgBarraXpText').innerText = `${xpActual - xpBaseNivel} / ${xpProximo - xpBaseNivel} XP`;

  // BOTÓN DE CLASE SI ES NVL 5 Y NO TIENE CLASE
  let lblClase = document.getElementById('rpgPerfilClase');
  let btnElegir = document.getElementById('btnAbrirModalClase');
  lblClase.innerText = gamerProfile.profesion || "Sin Clase";
  
  if (nivelJugador >= 5 && (gamerProfile.profesion === "Sin Clase" || !gamerProfile.profesion)) {
      btnElegir.style.display = 'inline-block'; lblClase.style.color = 'var(--text-muted)';
  } else {
      btnElegir.style.display = 'none'; lblClase.style.color = 'var(--secondary-color)';
  }

  // APLICAR PASIVA MAGO: Energía Base + 30
  let enMaxReal = gamerProfile.stats.energiaMax + (gamerProfile.profesion === 'Mago' ? 30 : 0);
  let pctEn = Math.min(100, Math.max(0, (gamerProfile.stats.energiaActual / enMaxReal) * 100));
  document.getElementById('rpgBarraEnergiaFill').style.width = `${pctEn}%`;
  document.getElementById('rpgBarraEnergiaText').innerText = `${gamerProfile.stats.energiaActual}/${enMaxReal}`;

  let hpMaxReal = gamerProfile.stats.hpMax || 1;
  let pctHp = Math.min(100, Math.max(0, (gamerProfile.stats.hpActual / hpMaxReal) * 100));
  document.getElementById('rpgBarraHpFill').style.width = `${pctHp}%`;
  document.getElementById('rpgBarraHpText').innerText = `${gamerProfile.stats.hpActual}/${hpMaxReal}`;

  // CÁLCULO DE STATS CON PASIVAS
  let extraAtk = 0; let extraDef = 0;
  if (gamerProfile.equipo && gamerProfile.inventario) {
    for (let ranura in gamerProfile.equipo) {
      let uidItem = gamerProfile.equipo[ranura];
      if (uidItem) { 
        let item = gamerProfile.inventario.find(i => i.uid_inventario === uidItem); 
        if (item) { 
          let bonoMejoraAtk = (item.nivelMejora || 0) * (item.rareza === 'SSR' ? 20 : item.rareza === 'SR' ? 10 : item.rareza === 'R' ? 5 : 2);
          let bonoMejoraDef = (item.nivelMejora || 0) * (item.rareza === 'SSR' ? 10 : item.rareza === 'SR' ? 5 : item.rareza === 'R' ? 2 : 1);
          extraAtk += (item.atk || 0) + bonoMejoraAtk; extraDef += (item.def || 0) + bonoMejoraDef; 
        } 
      }
    }
  }

  let totalAtk = (gamerProfile.stats?.atk || 10) + extraAtk;
  let totalDef = (gamerProfile.stats?.def || 5) + extraDef;

  // PASIVA GUERRERO Y MAGO
  if (gamerProfile.profesion === 'Guerrero') { totalDef = Math.floor(totalDef * 1.10); } // +10% Defensa
  if (gamerProfile.profesion === 'Mago') { totalAtk = Math.floor(totalAtk * 1.10); } // +10% Ataque

  document.getElementById('rpgStatAtk').innerText = totalAtk;
  document.getElementById('rpgStatDef').innerText = totalDef;

  window.renderizarPaperDollGrande(); window.renderizarInventarioRPG(); window.renderizarFraguaRPG(); window.renderizarRefinamientoRPG();
};

window.renderizarPaperDollGrande = function() {
  if(!currentUserUid || !gamerProfile.equipo) return;
  let grid = document.getElementById('paperDollGrid'); if(!grid) return;
  grid.style.cssText = `display: grid; grid-template-columns: repeat(3, 1fr); grid-template-areas: ". cabeza ." "amuleto . anillo" "mano_der pecho mano_izq" "piernas piernas piernas" "pies . mascota"; gap: 8px; max-width: 280px; margin: 0 auto;`;
  let ranurasConfig = { cabeza: { label: 'Cabeza', icon: '🪖', area: 'cabeza' }, amuleto: { label: 'Amuleto', icon: '📿', area: 'amuleto' }, anillo: { label: 'Anillo', icon: '💍', area: 'anillo' }, mano_derecha: { label: 'Mano Der.', icon: '🗡️', area: 'mano_der' }, pecho: { label: 'Pecho', icon: '🛡️', area: 'pecho' }, mano_izquierda: { label: 'Mano Izq.', icon: '🛡️', area: 'mano_izq' }, piernas: { label: 'Piernas', icon: '👖', area: 'piernas' }, pies: { label: 'Pies', icon: '🥾', area: 'pies' }, mascota: { label: 'Mascota', icon: '🐾', area: 'mascota' } };
  let html = "";
  for (let key in ranurasConfig) {
    let slot = ranurasConfig[key]; let uidItemEquipado = gamerProfile.equipo?.[key]; let itemObj = uidItemEquipado ? gamerProfile.inventario.find(i => i.uid_inventario === uidItemEquipado) : null;
    let contenido = `<div style="font-size: 1.1em; margin-bottom: 2px;">${slot.icon}</div><div style="font-size: 0.55em; color: var(--text-muted);">${slot.label}</div>`;
    let estilo = `grid-area: ${slot.area}; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 5px; text-align: center; cursor: pointer; min-height: 50px; display: flex; flex-direction: column; align-items: center; justify-content: center;`;
    if (itemObj) {
      let imgThumb = itemObj.imgUrl ? `<img src="${itemObj.imgUrl}" style="width: 22px; height: 22px; object-fit: contain; image-rendering: pixelated; margin-bottom: 2px;">` : `<div style="font-size: 1.1em;">${slot.icon}</div>`;
      let lblNombre = itemObj.nivelMejora ? `${window.sanitizarHTML(itemObj.nombre)} <span class="text-upgrade">+${itemObj.nivelMejora}</span>` : window.sanitizarHTML(itemObj.nombre);
      contenido = `${imgThumb}<div style="font-size: 0.55em; color: #25d366; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${lblNombre}</div>`;
      estilo = `grid-area: ${slot.area}; background: rgba(37,211,102,0.1); border: 1px solid rgba(37,211,102,0.4); border-radius: 6px; padding: 5px; text-align: center; cursor: pointer; min-height: 50px; display: flex; flex-direction: column; align-items: center; justify-content: center;`;
    }
    html += `<div style="${estilo}" title="Ranura: ${slot.label}" onclick="window.desequiparRanuraRPG('${key}')">${contenido}</div>`;
  }
  grid.innerHTML = html;
};

window.desequiparRanuraRPG = function(ranuraKey) { if (gamerProfile.equipo && gamerProfile.equipo[ranuraKey]) { gamerProfile.equipo[ranuraKey] = null; window.guardarProgresoRPG(); window.mostrarTextoFlotante('Desequipado', '#ffaa00'); } };

window.renderizarInventarioRPG = function() {
  if(!currentUserUid || !gamerProfile.inventario) return;
  let cont = document.getElementById('rpgContenedorInventario'); if(!cont) return;
  cont.style.cssText = `display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; max-height: 380px; overflow-y: auto; padding-right: 4px;`;
  cont.innerHTML = "";

  let cantMateriales = gamerProfile.inventario.filter(i => (i.tipo || '').toLowerCase() === 'material').length;
  let lblMat = document.getElementById('rpgTotalMateriales'); if(lblMat) lblMat.innerText = cantMateriales;
  if (gamerProfile.inventario.length === 0) { cont.innerHTML = "<div style='grid-column: 1/-1; color: var(--text-muted); text-align: center; font-size: 0.85em; padding: 15px;'>Mochila vacía. ¡Explora las mazmorras o mina recursos!</div>"; return; }

  let nivelJugador = calcularNivel(gamerProfile.xp);

  gamerProfile.inventario.forEach((item) => {
    let ranuraEquipada = null; if (gamerProfile.equipo) { for (let r in gamerProfile.equipo) { if (gamerProfile.equipo[r] === item.uid_inventario) { ranuraEquipada = r; break; } } }
    let isEquipped = ranuraEquipada !== null; let tipoLower = (item.tipo || '').toLowerCase();
    let isLocked = (item.nivelReq && item.nivelReq > nivelJugador && tipoLower === 'arma');
    
    let icono = item.imgUrl ? `<img src="${item.imgUrl}" alt="${window.sanitizarHTML(item.nombre)}" style="width: 36px; height: 36px; object-fit: contain; image-rendering: pixelated; margin-bottom: 4px; opacity: ${isLocked?0.5:1};">` : (tipoLower === 'material' ? "💎" : (tipoLower === 'consumible' ? "🧪" : "🗡️"));
    let accionClick = ""; let estiloCursor = "cursor: default;"; let infoExtra = "";

    if (isLocked) { accionClick = `alert('Necesitas ser Nivel ${item.nivelReq} para equipar este objeto.')`; estiloCursor = "cursor: not-allowed;"; infoExtra = `<span style="font-size: 0.65em; color: #ff3366;"><i class="fas fa-lock"></i> Nv. ${item.nivelReq} Req.</span>`; } 
    else if (tipoLower === 'consumible') { accionClick = `window.usarConsumibleRPG('${item.uid_inventario}')`; estiloCursor = "cursor: pointer;"; infoExtra = `<span style="color:#ff3366; font-size: 0.65em;">Usar Consumible</span>`; } 
    else if (item.ranura && item.ranura !== 'ninguna') { accionClick = `window.equiparItemRPG('${item.uid_inventario}')`; estiloCursor = "cursor: pointer;"; infoExtra = `<span style="font-size: 0.65em; color: ${isEquipped ? '#25d366' : 'var(--text-muted)'};">${isEquipped ? 'EQUIPADO' : 'ATK/DEF +'}</span>`; } 
    else { infoExtra = `<span style="color:#b000ff; font-size: 0.65em;">Material de Forja</span>`; }

    let tokensVenta = item.rareza === 'SSR' ? 50 : (item.rareza === 'SR' ? 20 : (item.rareza === 'R' ? 8 : 2)); if(tipoLower === 'material') tokensVenta = 3;
    let btnVenderHtml = `<button onclick="event.stopPropagation(); window.venderItemRPG('${item.uid_inventario}', ${tokensVenta})" style="background: rgba(255,170,0,0.15); border: 1px solid rgba(255,170,0,0.4); color: #ffaa00; border-radius: 4px; padding: 2px 6px; font-size: 0.6em; cursor: pointer; margin-top: 4px; font-family: 'Chakra Petch', sans-serif; position: relative; z-index:2;"><i class="fas fa-coins"></i> Vender (+${tokensVenta})</button>`;
    let bordeColor = isEquipped ? 'rgba(37,211,102,0.6)' : (isLocked ? 'rgba(255,51,102,0.4)' : 'var(--glass-border)');
    let lockOverlay = isLocked ? `<div class="lock-overlay"><i class="fas fa-lock" style="color:#ff3366; font-size:1.5em; text-shadow: 0 0 5px black;"></i></div>` : '';
    let lblNombre = item.nivelMejora ? `${window.sanitizarHTML(item.nombre)} <span class="text-upgrade">+${item.nivelMejora}</span>` : window.sanitizarHTML(item.nombre);

    cont.innerHTML += `<div style="${estiloCursor} background: rgba(0,0,0,0.45); border: 1px solid ${bordeColor}; border-radius: 8px; padding: 8px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: space-between; transition: all 0.2s ease; position:relative; overflow:hidden;" onclick="${accionClick}">${lockOverlay}<div style="position:relative; z-index:1; width:100%;"><div style="height: 40px; display: flex; align-items: center; justify-content: center;">${icono}</div><div class="rareza-${item.rareza}" style="font-weight: bold; font-size: 0.75em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${lblNombre}</div><div style="margin-top: 2px;">${infoExtra}</div></div><div>${btnVenderHtml}</div></div>`;
  });
};

window.equiparItemRPG = function(uid_inventario) { let item = gamerProfile.inventario.find(i => i.uid_inventario === uid_inventario); if (!item) return; let nivelJugador = calcularNivel(gamerProfile.xp); if (item.nivelReq && nivelJugador < item.nivelReq) return alert(`Necesitas Nivel ${item.nivelReq} para equipar esto.`); let ranuraDestino = item.ranura; if (!ranuraDestino || ranuraDestino === 'ninguna') return alert("Este objeto no se puede equipar."); if (gamerProfile.equipo[ranuraDestino] === uid_inventario) { gamerProfile.equipo[ranuraDestino] = null; window.mostrarTextoFlotante('Desequipado', '#ffaa00'); } else { gamerProfile.equipo[ranuraDestino] = uid_inventario; window.mostrarTextoFlotante(`Equipado en ${ranuraDestino.toUpperCase()}`, '#25d366'); } window.guardarProgresoRPG(); };

window.usarConsumibleRPG = function(uid_inventario) { let idx = gamerProfile.inventario.findIndex(i => i.uid_inventario === uid_inventario); if(idx === -1) return; let item = gamerProfile.inventario[idx]; let nombreMinus = (item.nombre || "").toLowerCase(); let enMaxReal = gamerProfile.stats.energiaMax + (gamerProfile.profesion === 'Mago' ? 30 : 0); if (nombreMinus.includes("energía") || nombreMinus.includes("energia") || nombreMinus.includes("stamina")) { gamerProfile.stats.energiaActual += 50; if(gamerProfile.stats.energiaActual > enMaxReal) gamerProfile.stats.energiaActual = enMaxReal; window.mostrarTextoFlotante(`+50 Energía ⚡`, '#ffcc00'); } else { gamerProfile.stats.hpActual += 50; if(gamerProfile.stats.hpActual > gamerProfile.stats.hpMax) gamerProfile.stats.hpActual = gamerProfile.stats.hpMax; window.mostrarTextoFlotante(`Curado +50 HP`, '#ff3366'); } gamerProfile.inventario.splice(idx, 1); window.guardarProgresoRPG(); };

window.venderItemRPG = function(uid_inventario, tokensGanados) { let index = gamerProfile.inventario.findIndex(i => i.uid_inventario === uid_inventario); if(index === -1) return; if (gamerProfile.equipo) { for (let r in gamerProfile.equipo) { if (gamerProfile.equipo[r] === uid_inventario) gamerProfile.equipo[r] = null; } } gamerProfile.inventario.splice(index, 1); gamerProfile.tokens = (gamerProfile.tokens || 0) + tokensGanados; window.guardarProgresoRPG(); window.mostrarTextoFlotante(`+${tokensGanados} Tokens 🪙`, '#ffaa00'); try{ confetti({ particleCount: 25, spread: 40, colors: ['#ffaa00', '#ffd700'] }); }catch(e){} };

window.entrenarStatRPG = function(stat) { let costo = 10; if((gamerProfile.tokens || 0) < costo) return alert("No tienes suficientes Tokens (cuestan 10)."); gamerProfile.tokens -= costo; if(stat === 'hp') { gamerProfile.stats.hpMax += 10; gamerProfile.stats.hpActual = gamerProfile.stats.hpMax; window.mostrarTextoFlotante('+10 MaxHP', '#ff3366'); } else if(stat === 'energia') { gamerProfile.stats.energiaMax += 10; gamerProfile.stats.energiaActual = gamerProfile.stats.energiaMax + (gamerProfile.profesion === 'Mago'?30:0); window.mostrarTextoFlotante('+10 MaxEnergía', '#ffcc00'); } else if(stat === 'atk') { gamerProfile.stats.atk += 2; window.mostrarTextoFlotante('+2 ATK', '#ffaa00'); } else if(stat === 'def') { gamerProfile.stats.def += 2; window.mostrarTextoFlotante('+2 DEF', '#00e5ff'); } window.guardarProgresoRPG(); };

function calcularDropConPesos(nombresDrops) { let posibles = nombresDrops.map(nombre => rpgObjetosGlobal.find(o => o.nombre === nombre)).filter(Boolean); if(posibles.length === 0) return null; let pesoTotal = posibles.reduce((sum, item) => sum + item.pesoDrop, 0); let random = Math.random() * pesoTotal; let acumulado = 0; for(let i = 0; i < posibles.length; i++) { acumulado += posibles[i].pesoDrop; if(random <= acumulado) return posibles[i]; } return posibles[0]; }

window.cazarEnZona = function(zonaId) {
    let zona = zonasCaza[zonaId]; let nivelJugador = calcularNivel(gamerProfile.xp);
    if (nivelJugador < zona.reqNivel) return document.getElementById('rpgResultadoGremio').innerHTML = `<span style="color:#ffaa00;"><i class="fas fa-lock"></i> Necesitas Nivel ${zona.reqNivel}.</span>`;
    
    // PASIVA EXPLORADOR: Gasta menos energía
    let costoEnergia = zona.gastaEn; if (gamerProfile.profesion === 'Explorador') costoEnergia = Math.max(1, costoEnergia - 5);
    
    if (gamerProfile.stats.energiaActual < costoEnergia) return document.getElementById('rpgResultadoGremio').innerHTML = `<span style="color:#ffcc00;"><i class="fas fa-bolt"></i> Sin Energía.</span>`;
    if (gamerProfile.stats.hpActual < zona.gastaHp) return document.getElementById('rpgResultadoGremio').innerHTML = `<span style="color:#ff3366;"><i class="fas fa-skull"></i> Muy débil.</span>`;

    let ahora = Date.now(); let cooldownTime = 1 * 60 * 1000; let keyCooldown = 'cooldown_caza'; let ultimoUso = gamerProfile.cooldowns[keyCooldown] || 0;
    if (ahora - ultimoUso < cooldownTime) { let faltanSec = Math.ceil((cooldownTime - (ahora - ultimoUso)) / 1000); return document.getElementById('rpgResultadoGremio').innerHTML = `<span style="color:#00e5ff;"><i class="fas fa-hourglass-half"></i> Descansando... (${Math.floor(faltanSec / 60)}m ${faltanSec % 60}s).</span>`; }

    gamerProfile.stats.hpActual -= zona.gastaHp; gamerProfile.stats.energiaActual -= costoEnergia;
    
    // PASIVA EXPLORADOR: +15% prob Drop
    let probFinalDrop = zona.probDrop; if (gamerProfile.profesion === 'Explorador') probFinalDrop += 15;
    
    let rngDrop = Math.random() * 100; let msj = `Cazaste con éxito en <strong>${zona.nombre}</strong>.`;

    if (rngDrop <= probFinalDrop) {
        let itemDB = calcularDropConPesos(zona.drops);
        if (itemDB) { gamerProfile.inventario.push({ ...itemDB, uid_inventario: 'loot_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) }); msj += `<br>¡Botín: <strong class="rareza-${itemDB.rareza}">${window.sanitizarHTML(itemDB.nombre)}</strong>!`; }
    }

    gamerProfile.cooldowns[keyCooldown] = ahora; gamerProfile.tokens = (gamerProfile.tokens || 0) + zona.tokGana; gamerProfile.xp = (gamerProfile.xp || 0) + zona.xpGana; window.guardarProgresoRPG();
    window.mostrarTextoFlotante(`+${zona.xpGana} XP`, '#25d366'); document.getElementById('rpgResultadoGremio').innerHTML = `<span style="color:var(--secondary-color);">${msj}</span><br><span style="color:#25d366; font-size:0.85em;">+${zona.xpGana} XP | +${zona.tokGana} Tokens</span>`;
};

window.minar = function() {
    if (gamerProfile.stats.energiaActual < 15) return document.getElementById('rpgResultadoGremio').innerHTML = `<span style="color:#ffcc00;"><i class="fas fa-bolt"></i> Sin Energía.</span>`;
    if (gamerProfile.stats.hpActual < 5) return document.getElementById('rpgResultadoGremio').innerHTML = `<span style="color:#ff3366;"><i class="fas fa-skull"></i> Muy débil.</span>`;

    let ahora = Date.now(); let cooldownTime = 2 * 60 * 1000; let keyCooldown = 'cooldown_minar'; let ultimoUso = gamerProfile.cooldowns[keyCooldown] || 0;
    if (ahora - ultimoUso < cooldownTime) { let faltanSec = Math.ceil((cooldownTime - (ahora - ultimoUso)) / 1000); return document.getElementById('rpgResultadoGremio').innerHTML = `<span style="color:#00e5ff;"><i class="fas fa-hourglass-half"></i> Fuerzas... (${Math.floor(faltanSec / 60)}m ${faltanSec % 60}s).</span>`; }

    gamerProfile.stats.energiaActual -= 15; gamerProfile.stats.hpActual -= 5;
    
    // PASIVA ARTESANO: 30% Doble Drop
    let chanceDoble = gamerProfile.profesion === 'Artesano' ? 30 : 0;
    
    let rng = Math.random() * 100; let msj = "Sacas escombros inútiles.";
    
    if (rng < 65) { 
        let todosLosMateriales = rpgObjetosGlobal.filter(o => o.tipo === 'material');
        if (todosLosMateriales.length > 0) {
            let nombresMateriales = todosLosMateriales.map(m => m.nombre);
            let matGanado = calcularDropConPesos(nombresMateriales);
            if (matGanado) { 
                gamerProfile.inventario.push({ ...matGanado, uid_inventario: 'mat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) }); 
                msj = `¡Minaste: <strong class="rareza-${matGanado.rareza}">${window.sanitizarHTML(matGanado.nombre)}</strong>!`; 
                
                if(Math.random() * 100 <= chanceDoble) {
                    gamerProfile.inventario.push({ ...matGanado, uid_inventario: 'mat_doble_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) }); 
                    msj += ` <span style="color:#ffaa00;">(¡DOBLE POR ARTESANO!)</span>`;
                }
            }
        }
    }

    gamerProfile.cooldowns[keyCooldown] = ahora; gamerProfile.tokens = (gamerProfile.tokens || 0) + 3; gamerProfile.xp = (gamerProfile.xp || 0) + 15; window.guardarProgresoRPG();
    window.mostrarTextoFlotante(`+15 XP`, '#ffaa00'); document.getElementById('rpgResultadoGremio').innerHTML = `<span style="color:var(--secondary-color);">${msj}</span><br><span style="color:#25d366; font-size:0.85em;">+15 XP | +3 Tokens</span>`;
};

window.entrarMazmorraRPG = function(zonaId) {
  let mazmorra = mazmorras[zonaId]; if(!mazmorra) return;
  
  // PASIVA GUERRERO: -20% HP consumido
  let costoHp = mazmorra.gastaHp; if (gamerProfile.profesion === 'Guerrero') costoHp = Math.ceil(costoHp * 0.8);
  
  if (gamerProfile.stats.energiaActual < mazmorra.gastaEn) return document.getElementById('rpgResultadoGremio').innerHTML = `<span style="color:#ffcc00;"><i class="fas fa-bolt"></i> Energía insuficiente.</span>`;
  if (gamerProfile.stats.hpActual < costoHp) return document.getElementById('rpgResultadoGremio').innerHTML = `<span style="color:#ff3366;"><i class="fas fa-skull"></i> Necesitas ${costoHp} HP.</span>`;

  let ahora = Date.now(); let cooldownTime = 5 * 60 * 1000; let keyCooldown = 'cooldown_mazmorra_global'; let ultimoUso = gamerProfile.cooldowns[keyCooldown] || 0;
  let log = document.getElementById('rpgResultadoGremio');
  if (ahora - ultimoUso < cooldownTime) { let faltanSec = Math.ceil((cooldownTime - (ahora - ultimoUso)) / 1000); return log.innerHTML = `<span style="color:#ffaa00;"><i class="fas fa-campground"></i> Grupo descansando (${Math.floor(faltanSec / 60)}m ${faltanSec % 60}s).</span>`; }

  let extraAtk = 0; let extraDef = 0;
  for (let r in gamerProfile.equipo) {
    let uid = gamerProfile.equipo[r];
    if(uid) { 
        let it = gamerProfile.inventario.find(i => i.uid_inventario === uid); 
        if(it) { let bonoAtk = (it.nivelMejora || 0) * (it.rareza === 'SSR' ? 20 : it.rareza === 'SR' ? 10 : it.rareza === 'R' ? 5 : 2); extraAtk += (it.atk || 0) + bonoAtk; extraDef += (it.def || 0); } 
    }
  }
  
  let totalAtk = gamerProfile.stats.atk + extraAtk; let totalDef = gamerProfile.stats.def + extraDef;
  if(gamerProfile.profesion === 'Mago') totalAtk = Math.floor(totalAtk * 1.1);
  if(gamerProfile.profesion === 'Guerrero') totalDef = Math.floor(totalDef * 1.1);
  let poder = totalAtk + totalDef;

  log.innerHTML = `<span style="color:#00e5ff;"><i class="fas fa-walking"></i> Explorando ${mazmorra.nombre}...</span>`;
  gamerProfile.stats.energiaActual -= mazmorra.gastaEn; gamerProfile.stats.hpActual -= costoHp; gamerProfile.cooldowns[keyCooldown] = ahora; window.guardarProgresoRPG(); 

  setTimeout(() => {
    if(poder >= mazmorra.poderReq) {
      let premioTxt = "Oro y Experiencia"; let rngDrop = Math.random() * 100;
      if(rngDrop <= mazmorra.probDrop) {
        let lootItemDB = calcularDropConPesos(mazmorra.drops);
        if(lootItemDB) { gamerProfile.inventario.push({ ...lootItemDB, uid_inventario: 'loot_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) }); premioTxt = `<span class="rareza-${lootItemDB.rareza}">${window.sanitizarHTML(lootItemDB.nombre)}</span>`; }
      }
      gamerProfile.xp = (gamerProfile.xp || 0) + mazmorra.xpGana; gamerProfile.tokens = (gamerProfile.tokens || 0) + mazmorra.tokGana; window.guardarProgresoRPG();
      window.mostrarTextoFlotante(`+${mazmorra.xpGana} XP`, '#25d366'); log.innerHTML = `<span style="color:#25d366;"><i class="fas fa-check-circle"></i> ¡Expedición Exitosa en ${mazmorra.nombre}!</span><br>Loot obtenido: <strong>${premioTxt}</strong><br><span style="font-size:0.8em; color:var(--text-muted);">+${mazmorra.xpGana} XP | +${mazmorra.tokGana} Tokens</span>`;
    } else {
      let perdida = Math.floor(mazmorra.xpGana / 2); gamerProfile.xp -= perdida; if(gamerProfile.xp < 0) gamerProfile.xp = 0; window.guardarProgresoRPG();
      window.mostrarTextoFlotante(`Derrota`, '#ff3366'); log.innerHTML = `<span style="color:#ff3366;"><i class="fas fa-skull"></i> Derrota en ${mazmorra.nombre} (${poder}/${mazmorra.poderReq} Poder).</span><br><span style="font-size:0.8em;">Perdiste <strong style="color:#ffaa00;">${perdida} XP</strong>.</span>`;
    }
  }, 1500);
};

window.renderizarFraguaRPG = function() {
  if(!currentUserUid || !gamerProfile.inventario) return;
  let cont = document.getElementById('listaRecetasFragua'); if(!cont) return;
  let armas = rpgObjetosGlobal.filter(o => (o.tipo || '').toLowerCase() === 'arma');
  if(armas.length === 0) { cont.innerHTML = "<p style='color: var(--text-muted); font-size: 0.85em; text-align: center;'>No hay recetas.</p>"; return; }

  let cantMat = gamerProfile.inventario.filter(i => (i.tipo || '').toLowerCase() === 'material').length;
  let nivelJugador = calcularNivel(gamerProfile.xp);
  let html = "";
  
  armas.forEach(a => {
    // PASIVA ARTESANO: -1 Mat en forja general
    let costoMat = a.costoMat; if(gamerProfile.profesion === 'Artesano') costoMat = Math.max(1, costoMat - 1);
    let costoTok = a.costoTok; let reqNvl = a.nivelReq || 1;
    let puede = cantMat >= costoMat && (gamerProfile.tokens || 0) >= costoTok;
    let nvlColor = nivelJugador >= reqNvl ? 'var(--text-muted)' : '#ff3366';
    let thumb = a.imgUrl ? `<img src="${a.imgUrl}" style="width: 28px; height: 28px; object-fit: contain; image-rendering: pixelated; margin-right: 6px;">` : `🗡️`;

    html += `<div style="background: rgba(0,0,0,0.4); border: 1px solid var(--glass-border); border-radius: 6px; padding: 10px; display: flex; justify-content: space-between; align-items: center;"><div style="display: flex; align-items: center;">${thumb}<div><div class="rpg-item-name rareza-${a.rareza}" style="font-size: 0.85em; font-weight: bold;">${window.sanitizarHTML(a.nombre)}</div><div style="font-size: 0.7em; color: ${nvlColor};">ATK +${a.atk} | DEF +${a.def} | Nv.Req: ${reqNvl}</div><div style="font-size: 0.7em; font-weight: bold; color: ${puede ? 'var(--secondary-color)' : '#ff3366'};">Req: ${costoMat} 💎 | ${costoTok} 🪙</div></div></div><button class="btn-comprar" style="margin: 0; padding: 6px 12px; font-size: 0.75em; background: ${puede ? '#ff5500' : 'rgba(255,255,255,0.1);'};" onclick="window.forjarItemRPG('${a.id}', ${costoMat}, ${costoTok})" ${!puede ? 'disabled' : ''}>Forjar</button></div>`;
  });
  cont.innerHTML = html;
};

window.forjarItemRPG = function(idArma, costoMat, costoTok) {
  let cantMat = gamerProfile.inventario.filter(i => (i.tipo || '').toLowerCase() === 'material').length;
  if(cantMat < costoMat || (gamerProfile.tokens || 0) < costoTok) return alert("Recursos insuficientes.");
  let arma = rpgObjetosGlobal.find(o => o.id === idArma); if(!arma) return;

  gamerProfile.tokens -= costoTok; let borrados = 0;
  gamerProfile.inventario = gamerProfile.inventario.filter(i => { if((i.tipo || '').toLowerCase() === 'material' && borrados < costoMat) { borrados++; return false; } return true; });
  gamerProfile.inventario.push({ ...arma, nivelMejora: 0, uid_inventario: 'forj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) });

  window.guardarProgresoRPG(); alert(`¡Has forjado: ${arma.nombre}!`);
};

function getProbabilidadRefinamiento(nvl) {
    if(nvl < 3) return { prob: 100, riesgo: 'Seguro (100%)', color: '#25d366' };
    if(nvl === 3) return { prob: 70, riesgo: 'Riesgo: Falla y pierde mats (70%)', color: '#ffaa00' };
    if(nvl === 4) return { prob: 50, riesgo: 'Riesgo: Baja 1 Nivel (50%)', color: '#ff5500' };
    if(nvl >= 5) return { prob: 30, riesgo: 'PELIGRO: DESTRUCCIÓN (30%)', color: '#ff3366' };
    return { prob: 10, riesgo: 'DESTRUCCIÓN (10%)', color: '#ff3366' };
}

window.renderizarRefinamientoRPG = function() {
    if(!currentUserUid || !gamerProfile.inventario) return;
    let cont = document.getElementById('listaRefinamientoRPG'); if(!cont) return;
    let armasJugador = gamerProfile.inventario.filter(i => (i.tipo || '').toLowerCase() === 'arma' && i.ranura && i.ranura !== 'ninguna');
    if(armasJugador.length === 0) { cont.innerHTML = "<p style='color: var(--text-muted); font-size: 0.85em; text-align: center;'>No tienes armas para refinar. Forja una primero.</p>"; return; }

    let cantMat = gamerProfile.inventario.filter(i => (i.tipo || '').toLowerCase() === 'material').length;
    let html = "";

    armasJugador.forEach(item => {
        let nvl = item.nivelMejora || 0; let esMaximo = nvl >= 10;
        
        // PASIVA ARTESANO: -1 Mat al refinar
        let costoMat = (nvl + 1) * 2; if (gamerProfile.profesion === 'Artesano') costoMat = Math.max(1, costoMat - 1);
        let costoTok = (nvl + 1) * 20;
        
        let probData = getProbabilidadRefinamiento(nvl);
        let puede = cantMat >= costoMat && (gamerProfile.tokens || 0) >= costoTok;

        let thumb = item.imgUrl ? `<img src="${item.imgUrl}" style="width: 28px; height: 28px; object-fit: contain; image-rendering: pixelated; margin-right: 6px;">` : `🗡️`;
        let lblNombre = nvl > 0 ? `${window.sanitizarHTML(item.nombre)} <span class="text-upgrade">+${nvl}</span>` : window.sanitizarHTML(item.nombre);

        if (esMaximo) {
            html += `<div style="background: rgba(0,229,255,0.1); border: 1px solid #00e5ff; border-radius: 6px; padding: 10px; display: flex; justify-content: space-between; align-items: center; opacity:0.8;"><div style="display: flex; align-items: center;">${thumb}<div><div class="rpg-item-name rareza-${item.rareza}" style="font-size: 0.85em; font-weight: bold;">${lblNombre}</div><div style="font-size: 0.7em; color: #00e5ff; font-weight:bold;">¡NIVEL MÁXIMO ALCANZADO!</div></div></div></div>`;
        } else {
            html += `<div style="background: rgba(0,0,0,0.4); border: 1px solid var(--glass-border); border-radius: 6px; padding: 10px; display: flex; justify-content: space-between; align-items: center;"><div style="display: flex; align-items: center;">${thumb}<div><div class="rpg-item-name rareza-${item.rareza}" style="font-size: 0.85em; font-weight: bold;">${lblNombre}</div><div style="font-size: 0.7em; color: ${probData.color}; font-weight:bold;">${probData.riesgo}</div><div style="font-size: 0.7em; color: ${puede ? 'var(--secondary-color)' : '#ff3366'};">Costo Mejora: ${costoMat} 💎 | ${costoTok} 🪙</div></div></div><button class="btn-comprar" style="margin: 0; padding: 6px 12px; font-size: 0.75em; background: ${puede ? '#00e5ff' : 'rgba(255,255,255,0.1);'}; color: #000; font-weight:bold;" onclick="window.refinarItemRPG('${item.uid_inventario}')" ${!puede ? 'disabled' : ''}><i class="fas fa-hammer"></i> +${nvl+1}</button></div>`;
        }
    });
    cont.innerHTML = html;
};

window.refinarItemRPG = function(uid_inventario) {
    let idx = gamerProfile.inventario.findIndex(i => i.uid_inventario === uid_inventario); if (idx === -1) return;
    let item = gamerProfile.inventario[idx]; let nvl = item.nivelMejora || 0; if(nvl >= 10) return alert("El arma ya está al nivel máximo (+10).");

    let costoMat = (nvl + 1) * 2; if (gamerProfile.profesion === 'Artesano') costoMat = Math.max(1, costoMat - 1);
    let costoTok = (nvl + 1) * 20;
    let cantMat = gamerProfile.inventario.filter(i => (i.tipo || '').toLowerCase() === 'material').length;

    if(cantMat < costoMat || (gamerProfile.tokens || 0) < costoTok) return alert("Recursos insuficientes para refinar.");

    gamerProfile.tokens -= costoTok; let borrados = 0;
    gamerProfile.inventario = gamerProfile.inventario.filter(i => { if((i.tipo || '').toLowerCase() === 'material' && borrados < costoMat) { borrados++; return false; } return true; });
    idx = gamerProfile.inventario.findIndex(i => i.uid_inventario === uid_inventario); item = gamerProfile.inventario[idx];

    let probData = getProbabilidadRefinamiento(nvl); let rng = Math.random() * 100;
    if (rng <= probData.prob) {
        item.nivelMejora = nvl + 1; window.mostrarTextoFlotante(`¡ÉXITO! ${item.nombre} +${item.nivelMejora}`, '#00e5ff');
        try{ confetti({ particleCount: 50, spread: 60, colors: ['#00e5ff', '#ffffff'] }); }catch(e){}
    } else {
        if (probData.prob === 100) {} else if (nvl === 3) { window.mostrarTextoFlotante(`Fallo... Perdiste los materiales`, '#ffaa00'); } 
        else if (nvl === 4) { item.nivelMejora = Math.max(0, nvl - 1); window.mostrarTextoFlotante(`¡CRÍTICO! El arma bajó a +${item.nivelMejora}`, '#ff5500'); } 
        else if (nvl >= 5) {
            if (gamerProfile.equipo) { for (let r in gamerProfile.equipo) { if (gamerProfile.equipo[r] === uid_inventario) gamerProfile.equipo[r] = null; } }
            gamerProfile.inventario.splice(idx, 1); window.mostrarTextoFlotante(`¡ARMA DESTRUIDA!`, '#ff3366'); return window.guardarProgresoRPG(); 
        }
    }
    window.guardarProgresoRPG();
};

window.sanitizarHTML = function(str) { return String(str || '').replace(/[&<>"']/g, function(m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]; }); };