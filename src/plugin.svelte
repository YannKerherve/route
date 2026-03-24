<div class="kbt-panel">
    <div class="kbt-header">
        <span class="kbt-header__icon">⛵</span>
        <span class="kbt-header__title">Tactics</span>
        <button class="kbt-header__close" on:click={() => bcast.emit('rqstOpen', 'menu')}>✕</button>
    </div>

    <div
        class="kbt-drop"
        class:kbt-drop--active={isDragging}
        on:dragover|preventDefault={() => (isDragging = true)}
        on:dragleave={() => (isDragging = false)}
        on:drop|preventDefault={handleDrop}
        on:click={() => fileInput.click()}
    >
        <span>📂 Charger le fichier CSV</span>
        <span class="kbt-hint">Glissez-déposez vos 400+ lignes ici</span>
        <input bind:this={fileInput} type="file" accept=".csv" style="display:none" on:change={handleFileChange} />
    </div>

    {#if routes.length > 0}
        <div class="kbt-info">
            <div class="kbt-time">🕒 {windyTimeStr}</div>
            <div class="kbt-status">✅ {routes[0].waypoints.length} points chargés</div>
            <button class="kbt-btn-fit" on:click={fitRoute}>Centrer la route</button>
        </div>
    {/if}

    {#if error}
        <div class="kbt-error">⚠️ {error}</div>
    {/if}
</div>

<script lang="ts">
    import bcast from "@windy/broadcast";
    import { onDestroy, onMount } from 'svelte';
    import { map } from "@windy/map"; // Importation directe depuis Windy
    import store from '@windy/store';

    // --- ETAT ---
    let routes = [];
    let isDragging = false;
    let error = "";
    let fileInput;
    let windyTimeStr = "";
    let unsubTime;

    // Calques comme dans ton exemple
    let routeLayer = L.layerGroup().addTo(map);
    let boatLayer = L.layerGroup().addTo(map);
    let boatMarker = null;
    let pastPath = null;

    // --- PARSER ROBUSTE ---

    function cleanNum(val) {
        if (!val) return 0;
        return parseFloat(val.replace(/[^\d.-]/g, '')) || 0;
    }

    function parseLatLon(raw) {
        if (!raw) return null;
        // Nettoyage des caractères d'encodage (le fameux )
        const clean = raw.replace(/[^\x00-\x7F]/g, " ").trim();
        const m = clean.match(/^(\d+)[°\s]+(\d+(?:\.\d+)?)['\s]+([NSEW])$/i);
        if (!m) return null;
        const dec = parseFloat(m[1]) + parseFloat(m[2]) / 60;
        return (m[3].toUpperCase() === 'S' || m[3].toUpperCase() === 'W') ? -dec : dec;
    }

    function parseTimestamp(raw) {
        const m = raw?.trim().match(/^([a-zA-Z]+ \d+),\s*(\d{1,2}):(\d{2})$/);
        if (!m) return null;
        return new Date(`${m[1]} ${new Date().getFullYear()} ${m[2]}:${m[3]}:00 UTC`).getTime();
    }

    async function handleFiles(files) {
        error = "";
        const file = files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
            const header = lines[0].toLowerCase().split(';');
            
            const i = (name) => header.indexOf(name);
            const waypoints = [];

            for (let j = 1; j < lines.length; j++) {
                const c = lines[j].split(';');
                const lat = parseLatLon(c[i('lat.')]);
                const lon = parseLatLon(c[i('lon.')]);
                const time = parseTimestamp(c[i('timestamp')]);

                if (lat !== null && lon !== null && time !== null) {
                    waypoints.push({
                        lat, lon, time,
                        sog: cleanNum(c[i('sog')]),
                        cog: cleanNum(c[i('cog')]),
                        tws: cleanNum(c[i('tws')]),
                        twd: cleanNum(c[i('twd')]),
                        label: c[i('timestamp')]
                    });
                }
            }

            if (waypoints.length > 0) {
                routes = [{ name: file.name, waypoints }];
                drawFullRoute(routes[0]);
                updateBoatPosition(store.get('timestamp'));
            } else {
                error = "Aucune donnée valide (vérifiez l'encodage)";
            }
        } catch (e) {
            error = "Erreur de lecture du fichier";
            console.error(e);
        }
    }

    // --- AFFICHAGE CARTE ---

function drawFullRoute(route) {
    routeLayer.clearLayers();
    const latLngs = route.waypoints.map(w => [w.lat, w.lon]);
    
    // LIGNE BLANCHE CONTINUE (au lieu de pointillés bleus)
    L.polyline(latLngs, { 
        color: '#ffffff', 
        weight: 2, 
        opacity: 0.8  // Un peu de transparence pour voir le fond de carte
    }).addTo(routeLayer);
    
    // On garde les petits points de passage (optionnel, tu peux les enlever)
    route.waypoints.forEach(w => {
        L.circleMarker([w.lat, w.lon], { radius: 1.5, color: '#ccc', weight: 1 }).addTo(routeLayer);
    });

    map.fitBounds(L.polyline(latLngs).getBounds());
}

function getInterpolatedPosition(ts, waypoints) {
    if (waypoints.length === 0) return null;
    
    // 1. Trouver l'intervalle [A, B] où se situe le timestamp Windy
    let a = waypoints[0];
    let b = waypoints[waypoints.length - 1];

    if (ts <= a.time) return a;
    if (ts >= b.time) return b;

    for (let i = 0; i < waypoints.length - 1; i++) {
        if (ts >= waypoints[i].time && ts <= waypoints[i+1].time) {
            a = waypoints[i];
            b = waypoints[i+1];
            break;
        }
    }

    // 2. Calculer le ratio de progression entre A et B (entre 0 et 1)
    const ratio = (ts - a.time) / (b.time - a.time);

    // 3. Calculer la position estimée
    return {
        lat: a.lat + (b.lat - a.lat) * ratio,
        lon: a.lon + (b.lon - a.lon) * ratio,
        cog: a.cog + (b.cog - a.cog) * ratio, // Optionnel : rotation fluide aussi
        sog: a.sog + (b.sog - a.sog) * ratio,
        label: a.label
    };
}




function updateBoatPosition(ts) {
    if (routes.length === 0) return;
    
    // On récupère la position interpolée au lieu du point fixe
    const current = getInterpolatedPosition(ts, routes[0].waypoints);
    if (!current) return;

    boatLayer.clearLayers();

    // Trace passée (jusqu'à la position interpolée actuelle)
    const pastPoints = routes[0].waypoints.filter(p => p.time < ts).map(p => [p.lat, p.lon]);
    pastPoints.push([current.lat, current.lon]); // On ajoute la pointe fluide
    
    L.polyline(pastPoints, { color: '#e74c3c', weight: 4 }).addTo(boatLayer);

    // Icône bateau
    const boatIcon = L.divIcon({
        className: '',
        html: `<svg viewBox="0 0 100 100" width="30" height="30" style="transform: rotate(${current.cog}deg);">
                <polygon points="50,0 90,100 50,80 10,100" fill="#e74c3c" stroke="white" stroke-width="5"/>
               </svg>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });

    L.marker([current.lat, current.lon], { icon: boatIcon }).addTo(boatLayer)
        .bindPopup(`<b>Position Estimée</b><br>SOG: ${current.sog.toFixed(1)} kt`);
}



    const fitRoute = () => {
        if (routes[0]) map.fitBounds(L.polyline(routes[0].waypoints.map(w => [w.lat, w.lon])).getBounds());
    };

    const handleDrop = (e) => { isDragging = false; handleFiles(e.dataTransfer.files); };
    const handleFileChange = (e) => handleFiles(e.target.files);

    onMount(() => {
        unsubTime = store.on('timestamp', ts => {
            windyTimeStr = new Date(ts).toUTCString();
            updateBoatPosition(ts);
        });
    });

    onDestroy(() => {
        unsubTime?.();
        routeLayer.remove();
        boatLayer.remove();
    });

    export const onopen = () => {};
</script>

<style lang="less">
    .kbt-panel {
        position: fixed; bottom: 120px; left: 20px; width: 280px;
        background: rgba(15, 15, 25, 0.95); color: white; border-radius: 12px;
        padding: 15px; border: 1px solid #334; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    }
    .kbt-header { display: flex; justify-content: space-between; font-weight: bold; border-bottom: 1px solid #334; padding-bottom: 8px; margin-bottom: 12px; }
    .kbt-drop { 
        border: 2px dashed #445; border-radius: 8px; padding: 20px; text-align: center; cursor: pointer;
        &:hover, &--active { border-color: #3498db; background: #1a1f2e; }
    }
    .kbt-hint { display: block; font-size: 10px; color: #778; margin-top: 4px; }
    .kbt-info { margin-top: 15px; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; }
    .kbt-time { font-family: monospace; font-size: 10px; color: #3498db; margin-bottom: 5px; }
    .kbt-status { font-size: 12px; color: #2ecc71; margin-bottom: 8px; }
    .kbt-btn-fit { width: 100%; background: #3498db; border: none; color: white; padding: 6px; border-radius: 4px; cursor: pointer; font-size: 11px; }
    .kbt-error { color: #e74c3c; font-size: 11px; margin-top: 10px; }
</style>





