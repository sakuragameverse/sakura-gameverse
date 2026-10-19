window.renderizarPaperDollGrande = function() {
  let grid = document.getElementById('paperDollGrid');
  if(!grid) return;

  // Cambiamos el diseño a una estructura de silueta corporal exacta
  grid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-areas: 
      ". cabeza ."
      "mano_der amuleto mano_izq"
      "pecho anillo mascota"
      "piernas pies .";
    gap: 10px;
    max-width: 320px;
    margin: 0 auto;
  `;

  let ranurasConfig = {
    cabeza: { label: 'Cabeza', icon: '🪖', area: 'cabeza' },
    amuleto: { label: 'Amuleto', icon: '📿', area: 'amuleto' },
    pecho: { label: 'Pecho', icon: '🛡️', area: 'pecho' },
    mano_derecha: { label: 'Mano Der.', icon: '🗡️', area: 'mano_der' },
    mano_izquierda: { label: 'Mano Izq.', icon: '🛡️', area: 'mano_izq' },
    anillo: { label: 'Anillo', icon: '💍', area: 'anillo' },
    piernas: { label: 'Piernas', icon: '👖', area: 'piernas' },
    pies: { label: 'Pies', icon: '🥾', area: 'pies' },
    mascota: { label: 'Mascota', icon: '🐾', area: 'mascota' }
  };

  let html = "";
  for (let key in ranurasConfig) {
    let slot = ranurasConfig[key];
    let uidItemEquipado = gamerProfile.equipo?.[key];
    let itemObj = uidItemEquipado ? gamerProfile.inventario.find(i => i.uid_inventario === uidItemEquipado) : null;
    
    let contenido = `<div style="font-size: 1.3em; margin-bottom: 2px;">${slot.icon}</div><div style="font-size: 0.6em; color: var(--text-muted);">${slot.label}</div>`;
    let estilo = `grid-area: ${slot.area}; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px; text-align: center; cursor: pointer; min-height: 65px; display: flex; flex-direction: column; align-items: center; justify-content: center;`;
    
    if (itemObj) {
      let imgThumb = itemObj.imgUrl ? `<img src="${itemObj.imgUrl}" style="width: 28px; height: 28px; object-fit: contain; image-rendering: pixelated; margin-bottom: 2px;">` : `<div style="font-size: 1.3em;">${slot.icon}</div>`;
      contenido = `${imgThumb}<div style="font-size: 0.6em; color: #25d366; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${window.sanitizarHTML(itemObj.nombre)}</div>`;
      estilo = `grid-area: ${slot.area}; background: rgba(37,211,102,0.1); border: 1px solid rgba(37,211,102,0.4); border-radius: 8px; padding: 8px; text-align: center; cursor: pointer; min-height: 65px; display: flex; flex-direction: column; align-items: center; justify-content: center;`;
    }

    html += `<div style="${estilo}" title="Ranura: ${slot.label}" onclick="window.desequiparRanuraRPG('${key}')">${contenido}</div>`;
  }

  grid.innerHTML = html;
};
