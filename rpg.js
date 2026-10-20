window.minar = function() {
    if (gamerProfile.stats.energiaActual < 15) return document.getElementById('rpgResultadoGremio').innerHTML = `<span style="color:#ffcc00;"><i class="fas fa-bolt"></i> Sin Energía para picar piedra.</span>`;
    if (gamerProfile.stats.hpActual < 5) return document.getElementById('rpgResultadoGremio').innerHTML = `<span style="color:#ff3366;"><i class="fas fa-skull"></i> Estás muy débil para picar. Cúrate.</span>`;

    let ahora = Date.now(); let cooldownTime = 2 * 60 * 1000; let keyCooldown = 'cooldown_minar'; let ultimoUso = gamerProfile.cooldowns[keyCooldown] || 0;
    if (ahora - ultimoUso < cooldownTime) { let faltanSec = Math.ceil((cooldownTime - (ahora - ultimoUso)) / 1000); return document.getElementById('rpgResultadoGremio').innerHTML = `<span style="color:#00e5ff;"><i class="fas fa-hourglass-half"></i> Recuperando fuerzas... (${Math.floor(faltanSec / 60)}m ${faltanSec % 60}s).</span>`; }

    gamerProfile.stats.energiaActual -= 15; gamerProfile.stats.hpActual -= 5;
    let rng = Math.random() * 100; let msj = "Picas piedra, pero solo sacas escombros inútiles.";
    
    if (rng < 65) { 
        // LÓGICA DINÁMICA: Busca en toda la base de datos cualquier ítem creado como "material"
        let todosLosMateriales = rpgObjetosGlobal.filter(o => o.tipo === 'material');
        
        if (todosLosMateriales.length > 0) {
            // Extrae los nombres de esos materiales encontrados para calcular el drop
            let nombresMateriales = todosLosMateriales.map(m => m.nombre);
            let matGanado = calcularDropConPesos(nombresMateriales);
            
            if (matGanado) { 
                gamerProfile.inventario.push({ ...matGanado, uid_inventario: 'mat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) }); 
                msj = `¡Minaste con éxito: <strong class="rareza-${matGanado.rareza}">${window.sanitizarHTML(matGanado.nombre)}</strong>!`; 
            }
        } else {
            msj = "La mina está vacía. ¡El Admin no ha creado Materiales de Forja!";
        }
    }

    gamerProfile.cooldowns[keyCooldown] = ahora; gamerProfile.tokens = (gamerProfile.tokens || 0) + 3; gamerProfile.xp = (gamerProfile.xp || 0) + 15; window.guardarProgresoRPG();
    window.mostrarTextoFlotante(`+15 XP`, '#ffaa00'); document.getElementById('rpgResultadoGremio').innerHTML = `<span style="color:var(--secondary-color);">${msj}</span><br><span style="color:#25d366; font-size:0.85em;">+15 XP | +3 Tokens</span>`;
};
