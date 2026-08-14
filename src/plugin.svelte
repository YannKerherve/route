<div class="kbt-panel">
    <div class="kbt-header">
        <span class="kbt-header__icon">⛵</span>
        <span class="kbt-header__title">Multi-Routes Reader</span>
        <div class="kbt-header-actions">
            <button class="kbt-btn-minimize" on:click={toggleMinimize} title="Minimize/Expand">
                {isMinimized ? '🔼' : '🔽'}
            </button>
            <button class="kbt-header__close" on:click={() => bcast.emit('rqstOpen', 'menu')}>✕</button>
        </div>
    </div>

    <div
        class="kbt-drop"
        class:kbt-drop--active={isDragging}
        on:dragover|preventDefault={() => (isDragging = true)}
        on:dragleave={() => (isDragging = false)}
        on:drop|preventDefault={handleDrop}
        on:click={() => fileInput.click()}
    >
        <span>📂 Charger un fichier CSV / XLSX</span>
        <span class="kbt-hint">Glisser-déposer ou cliquer (Tactics / SimSail / Adrena)</span>
        <input bind:this={fileInput} type="file" accept=".csv,.xlsx,.xls" multiple on:change={handleFileChange} style="display: none;" />
    </div>

    {#if !isMinimized}

    {#if routes.length > 0}
        <!-- Bloc horaire -->
        <div class="kbt-info">
            <div class="kbt-time-row">
                <span class="kbt-tz-label">🌍 Windy (UTC)</span>
                <span class="kbt-tz-val kbt-tz-utc">{windyTimeUTC}</span>
            </div>
            <div class="kbt-time-row">
                <span class="kbt-tz-label">💻 Ordi ({localTzName})</span>
                <span class="kbt-tz-val kbt-tz-local">{windyTimeLocal}</span>
            </div>
            <div class="kbt-time-row">
                <span class="kbt-tz-label">📄 CSV (UTC{csvTimezoneOffset >= 0 ? '+' : ''}{csvTimezoneOffset + manualOffset})</span>
                <span class="kbt-tz-val kbt-tz-csv">{windyTimeCSV}</span>
            </div>

            {#if detectedTz !== null}
                <div class="kbt-tz-detected">✅ Fuseau détecté dans le CSV : UTC{detectedTz >= 0 ? '+' : ''}{detectedTz}</div>
            {:else}
                <div class="kbt-tz-warn">⚠️ Fuseau CSV non détecté — UTC+0 supposé</div>
            {/if}

            <div class="kbt-tz-controls">
                <label class="kbt-tz-ctrl-label">
                    Fuseau CSV
                    <select bind:value={csvTimezoneOffset} on:change={onTimezoneChange} class="kbt-select-format">
                        {#each tzOptions as h}
                            <option value={h}>UTC{h >= 0 ? '+' : ''}{h}</option>
                        {/each}
                    </select>
                </label>
                <label class="kbt-tz-ctrl-label">
                    Décalage manuel
                    <div class="kbt-offset-row">
                        <input
                            type="number"
                            bind:value={manualOffset}
                            on:change={onTimezoneChange}
                            min="-24" max="24"
                            class="kbt-offset-input"
                        />
                        <span>h</span>
                    </div>
                </label>
            </div>

            <div class="kbt-status">✅ {routes.length} route{routes.length > 1 ? 's' : ''} chargée{routes.length > 1 ? 's' : ''}</div>
        </div>
    {/if}

    {#if error}
        <div class="kbt-error">⚠️ {error}</div>
    {/if}

    <!-- Liste des routes chargées -->
    {#each routes as route, idx}
        <div class="kbt-route-card">
            <div class="kbt-route-header">
                <input type="checkbox" bind:checked={route.visible} on:change={() => toggleRoute(idx)} />
                <span class="kbt-route-name" style="color: {route.color}">{route.name}</span>
                <button class="kbt-btn-remove" on:click={() => removeRoute(idx)}>🗑</button>
            </div>

            <!-- Sélecteur de couleur -->
            <div class="kbt-color-picker">
                {#each COLORS as color}
                    <button
                        class="kbt-color-swatch"
                        class:kbt-color-swatch--active={route.color === color}
                        style="background: {color};"
                        on:click={() => changeRouteColor(idx, color)}
                        title={color}
                    ></button>
                {/each}
            </div>

            <div class="kbt-route-info">
                <span class="kbt-meta">{route.waypoints.length} pts</span>
                <select bind:value={route.format} on:change={() => reloadRoute(idx)} class="kbt-select-format">
                    <option value="auto">Auto</option>
                    <option value="tactics">Tactics</option>
                    <option value="simsail">SimSail</option>
                    <option value="adrena">Adrena</option>
                </select>
            </div>

            {#if route.visible}
                <div class="kbt-barbs-options">
                    <label class="kbt-checkbox">
                        <input type="checkbox" bind:checked={route.showWind} on:change={() => updateBarbs(idx)} />
                        <span>💨 Vent</span>
                    </label>
                    <label class="kbt-checkbox">
                        <input type="checkbox" bind:checked={route.showCurrent} on:change={() => updateBarbs(idx)} />
                        <span>🌊 Courant</span>
                    </label>
                    <label class="kbt-checkbox">
                        <input type="checkbox" bind:checked={route.showWaves} on:change={() => updateBarbs(idx)} />
                        <span>〰 Vagues</span>
                    </label>
                </div>
                <button class="kbt-btn-fit" on:click={() => fitRoute(idx)}>📍 Centrer</button>
            {/if}
        </div>
    {/each}

    <!-- ═══════════════════════════════════════════════
         BLOC POINTS MANUELS
    ═══════════════════════════════════════════════ -->
    <div class="kbt-section">
        <div class="kbt-section-header" on:click={() => showPointsPanel = !showPointsPanel}>
            <span>📍 Manual drawing</span>
            <span>{showPointsPanel ? '▲' : '▼'}</span>
        </div>
        {#if showPointsPanel}
            <div class="kbt-point-form">
                <div class="kbt-point-row">
                    <label class="kbt-point-label">Lat</label>
                    <input class="kbt-point-input" bind:value={ptLatDeg}  placeholder="48"      type="number" min="0"   max="90" />
                    <span class="kbt-point-sep">°</span>
                    <input class="kbt-point-input" bind:value={ptLatMin}  placeholder="12.345"  type="number" min="0"   max="60" step="0.001" />
                    <select class="kbt-point-ns" bind:value={ptLatNS}>
                        <option>N</option><option>S</option>
                    </select>
                </div>
                <div class="kbt-point-row">
                    <label class="kbt-point-label">Lon</label>
                    <input class="kbt-point-input" bind:value={ptLonDeg}  placeholder="002"     type="number" min="0"   max="180" />
                    <span class="kbt-point-sep">°</span>
                    <input class="kbt-point-input" bind:value={ptLonMin}  placeholder="34.567"  type="number" min="0"   max="60" step="0.001" />
                    <select class="kbt-point-ns" bind:value={ptLonEW}>
                        <option>W</option><option>E</option>
                    </select>
                </div>
                <input class="kbt-point-name-input" bind:value={ptName} placeholder="Nom du point (optionnel)" />
                <!-- Sélecteur couleur -->
                <div class="kbt-color-picker" style="margin:6px 0 8px">
                    {#each COLORS as color}
                        <button
                            class="kbt-color-swatch"
                            class:kbt-color-swatch--active={ptColor === color}
                            style="background:{color}"
                            on:click={() => ptColor = color}
                        ></button>
                    {/each}
                </div>
                <button class="kbt-btn-fit" on:click={addManualPoint}>➕ Ajouter</button>
                {#if ptError}<div class="kbt-error">{ptError}</div>{/if}
            </div>

            {#each manualPoints as pt, idx}
                <div class="kbt-route-card" style="margin-top:6px">
                    <div class="kbt-route-header">
                        <input type="checkbox" bind:checked={pt.visible} on:change={() => togglePoint(idx)} />
                        <span class="kbt-route-name" style="color:{pt.color}">{pt.name}</span>
                        <button class="kbt-btn-remove" on:click={() => removePoint(idx)}>🗑</button>
                    </div>
                    <div style="font-size:10px;color:#889;padding:0 2px 4px">
                        {formatDMS(pt.lat, 'NS')} — {formatDMS(pt.lon, 'EW')}
                    </div>
                    <div class="kbt-color-picker">
                        {#each COLORS as color}
                            <button
                                class="kbt-color-swatch"
                                class:kbt-color-swatch--active={pt.color === color}
                                style="background:{color}"
                                on:click={() => changePointColor(idx, color)}
                            ></button>
                        {/each}
                    </div>
                </div>
            {/each}
        {/if}
    </div>

    <!-- ═══════════════════════════════════════════════
         BLOC DST
    ═══════════════════════════════════════════════ -->
    <div class="kbt-section">
        <div class="kbt-section-header" on:click={() => showPointsPanel = !showPointsPanel}>
            <span>📍 Manual drawing</span>
            <span>{showPointsPanel ? '▲' : '▼'}</span>
        </div>
        {#if showPointsPanel}
            <div class="kbt-point-form">
                <div class="kbt-point-row">
                    <label class="kbt-point-label">Lat</label>
                    <input class="kbt-point-input" bind:value={ptLatDeg}  placeholder="48"     type="number" min="0"   max="90" />
                    <span class="kbt-point-sep">°</span>
                    <input class="kbt-point-input" bind:value={ptLatMin}  placeholder="12.345"  type="number" min="0"   max="60" step="0.001" />
                    <select class="kbt-point-ns" bind:value={ptLatNS}>
                        <option>N</option><option>S</option>
                    </select>
                </div>
                <div class="kbt-point-row">
                    <label class="kbt-point-label">Lon</label>
                    <input class="kbt-point-input" bind:value={ptLonDeg}  placeholder="002"    type="number" min="0"   max="180" />
                    <span class="kbt-point-sep">°</span>
                    <input class="kbt-point-input" bind:value={ptLonMin}  placeholder="34.567"  type="number" min="0"   max="60" step="0.001" />
                    <select class="kbt-point-ns" bind:value={ptLonEW}>
                        <option>W</option><option>E</option>
                    </select>
                </div>
                <input class="kbt-point-name-input" bind:value={ptName} placeholder="Nom du point (optionnel)" />
                <div class="kbt-color-picker" style="margin:6px 0 8px">
                    {#each COLORS as color}
                        <button
                            class="kbt-color-swatch"
                            class:kbt-color-swatch--active={ptColor === color}
                            style="background:{color}"
                            on:click={() => ptColor = color}
                        ></button>
                    {/each}
                </div>
                <button class="kbt-btn-fit" on:click={addManualPoint}>➕ Ajouter</button>
                {#if ptError}<div class="kbt-error">{ptError}</div>{/if}
            </div>

            {#each manualPoints as pt, idx}
                <div class="kbt-route-card" style="margin-top:6px">
                    <div class="kbt-route-header">
                        <input type="checkbox" bind:checked={pt.visible} on:change={() => togglePoint(idx)} />
                        <span class="kbt-route-name" style="color:{pt.color}">{pt.name}</span>
                        <button class="kbt-btn-remove" on:click={() => removePoint(idx)}>🗑</button>
                    </div>
                    <div style="font-size:10px;color:#889;padding:0 2px 4px">
                        {formatDMS(pt.lat, 'NS')} — {formatDMS(pt.lon, 'EW')}
                    </div>
                    <div class="kbt-color-picker">
                        {#each COLORS as color}
                            <button
                                class="kbt-color-swatch"
                                class:kbt-color-swatch--active={pt.color === color}
                                style="background:{color}"
                                on:click={() => changePointColor(idx, color)}
                            ></button>
                        {/each}
                    </div>
                </div>
            {/each}
        {/if}
    </div>

    <div class="kbt-section">
        <div class="kbt-section-header" on:click={() => showDstPanel = !showDstPanel}>
            <span>🚢 TSS</span>
            <span>{showDstPanel ? '▲' : '▼'}</span>
        </div>
        {#if showDstPanel}
            <div style="padding:6px 4px">
                <label class="kbt-checkbox">
                    <input type="checkbox" bind:checked={showDst} on:change={toggleDst} />
                    <span>Afficher les DST (Ouessant + Calvados)</span>
                </label>
            </div>
        {/if}
    </div>

    <div class="kbt-section">
        <div class="kbt-section-header" on:click={() => showOSMPanel = !showOSMPanel}>
            <span>🗺️ OpenSee Map</span>
            <span>{showOSMPanel ? '▲' : '▼'}</span>
        </div>
        {#if showOSMPanel}
            <div style="padding:6px 4px">
                <label class="kbt-checkbox">
                    <input type="checkbox" bind:checked={showDst} on:change={toggleDst} />
                    <span>Show OpenSea Map. (Do not use for navigation purposes)</span>
                </label>
            </div>
        {/if}
    </div>

    <div class="kbt-section">
        <div class="kbt-section-header" on:click={() => showmeasurePanel = !showmeasurePanel}>
            <span>📏 Measuring tools</span>
            <span>{showmeasurePanel ? '▲' : '▼'}</span>
        </div>
        {#if showmeasurePanel}
            <div style="padding:6px 4px">
                <label class="kbt-checkbox">
                    <input type="checkbox" bind:checked={showDst} on:change={toggleDst} />
                    <span>...</span>
                </label>
            </div>
        {/if}
    </div>

    <div class="kbt-section">
        <div class="kbt-section-header" on:click={() => showWSPanel = !showWSPanel}>
            <span>🔵 WeatherScore</span>
            <span>{showWSPanel ? '▲' : '▼'}</span>
        </div>
        {#if showWSPanel}
            <div style="padding:6px 4px">
                <label class="kbt-checkbox">
                    <input type="checkbox" bind:checked={showDst} on:change={toggleDst} />
                    <span>WheatherScore information coming here soon : use the best weather model at sea</span>
                </label>
            </div>
        {/if}
    </div>

    {/if}

{/if}

</div>
<script lang="ts">
    import bcast from "@windy/broadcast";
    import { onDestroy, onMount } from 'svelte';
    import { map } from "@windy/map";
    import store from '@windy/store';

    // --- ÉTAT ---
    let routes = [];
    let isDragging = false;
    let error = "";
    let fileInput;
    let isMinimized = false;

    // Heures affichées
    let windyTimeUTC = '';
    let windyTimeLocal = '';
    let windyTimeCSV = '';
    let localTzName = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Gestion des fuseaux horaires
    let csvTimezoneOffset = 0;
    let manualOffset = 0;
    let detectedTz = null;

    const tzOptions = Array.from({ length: 25 }, (_, i) => i - 12);

    // Calques Leaflet
    let routeLayers = [];
    let boatLayers = [];
    let barbLayers = [];
    let unsubTime;

    // --- CONFIGURATION ---
    // Portefeuille de 12 couleurs
    const COLORS = [
        '#e74c3c', // rouge
        '#3498db', // bleu
        '#2ecc71', // vert
        '#f39c12', // orange
        '#9b59b6', // violet
        '#1abc9c', // turquoise
        '#e67e22', // orange foncé
        '#f1c40f', // jaune
        '#e91e8c', // rose
        '#00bcd4', // cyan
        '#8bc34a', // vert clair
        '#ffffff', // blanc
    ];

    // -------------------------------------------------------------------
    // GESTION DU TEMPS
    // -------------------------------------------------------------------

    function totalOffsetMs(): number {
        return (csvTimezoneOffset + manualOffset) * 3_600_000;
    }

    function applyOffset(rawTs: number | null): number | null {
        if (rawTs === null) return null;
        return rawTs - totalOffsetMs();
    }

    function toCsvDisplayTime(tsUtcMs: number): string {
        const shifted = new Date(tsUtcMs + totalOffsetMs());
        return shifted.toISOString().slice(11, 19);
    }

    function updateTimeDisplay(ts: number): void {
        const d = new Date(ts);

        windyTimeUTC = d.toISOString().slice(11, 19) + ' UTC';

        windyTimeLocal = d.toLocaleTimeString([], {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        windyTimeCSV = toCsvDisplayTime(ts)
            + ' (UTC' + (csvTimezoneOffset + manualOffset >= 0 ? '+' : '')
            + (csvTimezoneOffset + manualOffset) + ')';
    }

    function onTimezoneChange(): void {
        routes.forEach((_, idx) => reloadRoute(idx));
        updateTimeDisplay(store.get('timestamp'));
    }

    // -------------------------------------------------------------------
    // CORRECTION CHANGEMENT DE MOIS / ANNÉE
    // -------------------------------------------------------------------

    /**
     * Corrige les timestamps quand on franchit un changement de mois ou d'année.
     * Si un waypoint N+1 est chronologiquement avant N, on ajoute un mois
     * jusqu'à ce que la séquence soit cohérente.
     */
    function fixTimestampRollover(waypoints: any[]): void {
        for (let i = 1; i < waypoints.length; i++) {
            while (waypoints[i].time !== null && waypoints[i - 1].time !== null
                   && waypoints[i].time < waypoints[i - 1].time) {
                waypoints[i].time = addOneMonth(waypoints[i].time);
            }
        }
    }

    function addOneMonth(ts: number): number {
        const d = new Date(ts);
        d.setUTCMonth(d.getUTCMonth() + 1);
        return d.getTime();
    }

    // -------------------------------------------------------------------
    // DÉTECTION DU FUSEAU DANS LES HEADERS
    // -------------------------------------------------------------------

    function detectTimezone(header: string[]): number | null {
        const tzRe = /(?:UTC|GMT)([+-]\d{1,2})(?::\d{2})?/i;
        for (const h of header) {
            const m = h.match(tzRe);
            if (m) return parseInt(m[1], 10);
        }
        return null;
    }

    // -------------------------------------------------------------------
    // PARSERS UTILITAIRES
    // -------------------------------------------------------------------

    function cleanNum(val: string): number {
        if (!val) return 0;
        return parseFloat(val.replace(/[^\d.-]/g, '')) || 0;
    }

    function parseLatLonTactics(raw: string): number | null {
        if (!raw) return null;
        const clean = raw.replace(/[^\x00-\x7F]/g, ' ').trim();
        const m = clean.match(/^(\d+)[°\s]+(\d+(?:\.\d+)?)['\s]+([NSEW])$/i);
        if (!m) return null;
        const dec = parseFloat(m[1]) + parseFloat(m[2]) / 60;
        return (m[3].toUpperCase() === 'S' || m[3].toUpperCase() === 'W') ? -dec : dec;
    }

    function parseLatLonSimSail(raw: string): number | null {
        if (!raw) return null;
        const clean = raw.replace(/[^\x00-\x7F]/g, ' ').trim();
        const m = clean.match(/^(\d+)[°\s]*([NSEW])\s+(\d+)[']\s+(\d+)/i);
        if (!m) return null;
        const deg = parseFloat(m[1]);
        const min = parseFloat(m[3]) + parseFloat(m[4]) / 1000;
        const dec = deg + min / 60;
        return (m[2].toUpperCase() === 'S' || m[2].toUpperCase() === 'W') ? -dec : dec;
    }

    function parseLatLonAdrena(raw: string): number | null {
        if (!raw) return null;
        const clean = raw.trim();
        const m = clean.match(/^(\d+)[°\s]+(\d+[,\.]\d+)\s*([NSEW])$/i);
        if (!m) return null;
        const dec = parseFloat(m[1]) + parseFloat(m[2].replace(',', '.')) / 60;
        return (m[3].toUpperCase() === 'S' || m[3].toUpperCase() === 'W') ? -dec : dec;
    }

    function parseTimestampTactics(raw: string): number | null {
        const m = raw?.trim().match(/^([a-zA-Z]+ \d+),\s*(\d{1,2}):(\d{2})$/);
        if (!m) return null;
        return new Date(`${m[1]} ${new Date().getFullYear()} ${m[2]}:${m[3]}:00 UTC`).getTime();
    }

    function parseTimestampSimSail(raw: string): number | null {
        const m = raw?.trim().match(/^(\d{2})\/(\d{2})\s*-\s*(\d{2}):(\d{2}):(\d{2})$/);
        if (!m) return null;
        const year = new Date().getFullYear();
        return Date.UTC(year, parseInt(m[2]) - 1, parseInt(m[1]),
                        parseInt(m[3]), parseInt(m[4]), parseInt(m[5]));
    }

    function parseTimestampAdrena(raw: string, year?: number): number | null {
        const m = raw?.trim().match(/^(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})/);
        if (!m) return null;
        const y = year ?? new Date().getFullYear();
        return Date.UTC(y, parseInt(m[2]) - 1, parseInt(m[1]),
                        parseInt(m[3]), parseInt(m[4]), 0);
    }

    // -------------------------------------------------------------------
    // PARSERS PAR FORMAT
    // -------------------------------------------------------------------

    function parseTacticsCSV(text: string): any[] {
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        const header = lines[0].split(';');

        const tz = detectTimezone(header);
        if (tz !== null) {
            detectedTz = tz;
            csvTimezoneOffset = tz;
        }

        const i = (name: string) => header.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
        const waypoints = [];

        for (let j = 1; j < lines.length; j++) {
            const c = lines[j].split(';');
            const lat = parseLatLonTactics(c[i('Lat.')]);
            const lon = parseLatLonTactics(c[i('Lon.')]);
            const time = applyOffset(parseTimestampTactics(c[i('Timestamp')]));

            if (lat !== null && lon !== null && time !== null) {
                waypoints.push({
                    lat, lon, time,
                    sog:   cleanNum(c[i('SOG')]),
                    cog:   cleanNum(c[i('COG')]),
                    tws:   cleanNum(c[i('TWS')]),
                    twd:   cleanNum(c[i('TWD')]),
                    twa:   cleanNum(c[i('TWA')]),
                    cs:    cleanNum(c[i('CS')]),
                    cd:    cleanNum(c[i('CD')]),
                    twh:   cleanNum(c[i('TWH')]),
                    pwd:   cleanNum(c[i('PWD')]),
                    label: c[i('Timestamp')]
                });
            }
        }

        fixTimestampRollover(waypoints);
        return waypoints;
    }

    function parseSimSailCSV(text: string): any[] {
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        const header = lines[0].split(';');

        const tz = detectTimezone(header);
        if (tz !== null) {
            detectedTz = tz;
            csvTimezoneOffset = tz;
        }

        const i = (name: string) => header.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
        const waypoints = [];

        for (let j = 1; j < lines.length; j++) {
            const c = lines[j].split(';');
            const lat = parseLatLonSimSail(c[i('LAT')]);
            const lon = parseLatLonSimSail(c[i('LON')]);
            const time = applyOffset(parseTimestampSimSail(c[i('Time')]));

            if (lat !== null && lon !== null && time !== null) {
                waypoints.push({
                    lat, lon, time,
                    sog:   cleanNum(c[i('SOG')]),
                    cog:   cleanNum(c[i('COG')]),
                    tws:   cleanNum(c[i('TWS')]),
                    twd:   cleanNum(c[i('TWD')]),
                    twa:   cleanNum(c[i('TWA')]),
                    cs:    cleanNum(c[i('CS')]),
                    cd:    cleanNum(c[i('CD')]),
                    sws:   cleanNum(c[i('SWS')]),
                    swd:   cleanNum(c[i('SWD')]),
                    htsgw: cleanNum(c[i('HTSGW')]),
                    wvdir: cleanNum(c[i('WVDIR')]),
                    label: c[i('Time')]
                });
            }
        }

        fixTimestampRollover(waypoints);
        return waypoints;
    }

    function parseAdrenaXLSX(data: any[][]): any[] {
        const header = (data[0] || []).map(h => h != null ? String(h) : '');

        const tz = detectTimezone(header);
        if (tz !== null) {
            detectedTz = tz;
            csvTimezoneOffset = tz;
        }

        const waypoints = [];
        const num = (v: any) => {
            if (v == null || v === '---') return 0;
            const n = parseFloat(String(v).replace(',', '.'));
            return isNaN(n) ? 0 : n;
        };

        // Adrena XLSX : deux formats de date selon les lignes
        //
        // 1) String "DD/MM HH:MM" (premières lignes, sans année)
        //    → on déduit l'année depuis le premier serial (voir ci-dessous)
        //
        // 2) Serial Excel numérique (dès qu'un changement de mois survient)
        //    → SheetJS retourne un NUMBER brut (nb de jours depuis 1899-12-30)
        //    → MAIS Adrena stocke la date en DD/MM dans la cellule texte source,
        //      et Excel l'interprète en MM/DD quand il crée le serial.
        //      Résultat : le serial représente mois et jour INVERSÉS.
        //    → Correction : après conversion standard, on swap month↔day.
        //
        // Fonction de conversion serial → timestamp avec swap mois/jour
        function adrenaSerialToMs(serial: number): number {
            const raw = new Date(Math.round((serial - 25569) * 86400000));
            // swap : raw.getUTCMonth()+1 est en réalité le jour,
            //        raw.getUTCDate()    est en réalité le mois (1-based)
            const fixed = new Date(Date.UTC(
                raw.getUTCFullYear(),
                raw.getUTCDate() - 1,      // vrai mois (0-based)
                raw.getUTCMonth() + 1,     // vrai jour
                raw.getUTCHours(),
                raw.getUTCMinutes(),
                raw.getUTCSeconds()
            ));
            return fixed.getTime();
        }

        // Déduire l'année pour les strings : chercher le premier serial,
        // le convertir (avec swap), et comparer son mois au mois de départ.
        // Si mois départ > mois serial → changement d'année → stringYear = serialYear - 1
        let stringYear: number = new Date().getFullYear();
        for (let k = 1; k < data.length; k++) {
            const cell = data[k][1];
            if (typeof cell === 'number') {
                const firstMs   = adrenaSerialToMs(cell);
                const firstDate = new Date(firstMs);
                const serialYear  = firstDate.getUTCFullYear();
                const serialMonth = firstDate.getUTCMonth() + 1;
                const firstStrCell = data[1][1];
                if (typeof firstStrCell === 'string') {
                    const mStr = firstStrCell.trim().match(/^\d{2}\/(\d{2})/);
                    if (mStr) {
                        const startMonth = parseInt(mStr[1]);
                        stringYear = startMonth > serialMonth ? serialYear - 1 : serialYear;
                    }
                } else {
                    stringYear = serialYear;
                }
                break;
            }
        }

        for (let j = 1; j < data.length; j++) {
            const c = data[j];
            const latRaw  = c[5]  != null ? String(c[5])  : null;
            const lonRaw  = c[6]  != null ? String(c[6])  : null;

            const rawCell = c[1];
            let time: number | null = null;
            if (typeof rawCell === 'number') {
                time = applyOffset(adrenaSerialToMs(rawCell));
            } else if (rawCell instanceof Date) {
                time = applyOffset(rawCell.getTime());
            } else if (rawCell != null) {
                time = applyOffset(parseTimestampAdrena(String(rawCell), stringYear));
            }

            const timeRaw = rawCell != null ? String(rawCell) : null;

            const lat  = parseLatLonAdrena(latRaw);
            const lon  = parseLatLonAdrena(lonRaw);

            if (lat === null || lon === null || time === null) continue;

            waypoints.push({
                lat, lon, time,
                sog:   num(c[13]),
                cog:   num(c[14]),
                tws:   num(c[22]),
                twa:   num(c[23]),
                twd:   num(c[61]),
                cs:    num(c[67]),
                cd:    num(c[68]),
                htsgw: num(c[76]),
                wvdir: num(c[77]),
                twh:   num(c[83]),
                pwd:   num(c[84]),
                label: timeRaw
            });
        }

        fixTimestampRollover(waypoints);
        return waypoints;
    }

    function detectFormat(header: string[]): string {
        const lower = header.map(h => h.toLowerCase());
        if (lower.includes('wp') && lower.includes('brake power')) return 'tactics';
        if (lower.includes('time') && lower.includes('btw') && lower.includes('htsgw')) return 'simsail';
        return 'unknown';
    }

    async function parseFile(file: File, forcedFormat = 'auto'): Promise<{ waypoints: any[], format: string }> {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        const header = lines[0].split(';');

        let format = forcedFormat === 'auto' ? detectFormat(header) : forcedFormat;
        let waypoints = [];

        if (format === 'tactics') {
            waypoints = parseTacticsCSV(text);
        } else if (format === 'simsail') {
            waypoints = parseSimSailCSV(text);
        }

        return { waypoints, format };
    }

    // -------------------------------------------------------------------
    // GESTION DES FICHIERS
    // -------------------------------------------------------------------

    async function handleFiles(files: FileList | File[]) {
        error = '';
        for (const file of files) {
            try {
                let waypoints = [];
                let format = 'unknown';

                detectedTz = null;

                if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                    const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs');
                    const ab = await file.arrayBuffer();
                    const wb = XLSX.read(ab, { type: 'array' });
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
                    waypoints = parseAdrenaXLSX(data);
                    format = 'adrena';
                } else {
                    const result = await parseFile(file);
                    waypoints = result.waypoints;
                    format = result.format;
                }

                if (waypoints.length === 0) {
                    error = `${file.name} : aucune donnée valide`;
                    continue;
                }

                const colorIdx = routes.length % COLORS.length;
                const route = {
                    name: file.name,
                    waypoints,
                    format,
                    color: COLORS[colorIdx],
                    visible: true,
                    showWind: false,
                    showCurrent: false,
                    showWaves: false,
                    rawFile: file
                };

                routes = [...routes, route];
                const idx = routes.length - 1;

                routeLayers[idx] = L.layerGroup().addTo(map);
                boatLayers[idx]  = L.layerGroup().addTo(map);
                barbLayers[idx]  = L.layerGroup().addTo(map);

                drawFullRoute(idx);
                updateBoatPosition(store.get('timestamp'));
                updateTimeDisplay(store.get('timestamp'));

            } catch (e) {
                error = `${file.name} : erreur de lecture`;
                console.error(e);
            }
        }
    }

    // -------------------------------------------------------------------
    // GESTION DES ROUTES
    // -------------------------------------------------------------------

    function toggleRoute(idx: number) {
        if (routes[idx].visible) {
            routeLayers[idx].addTo(map);
            boatLayers[idx].addTo(map);
            updateBarbs(idx);
        } else {
            routeLayers[idx].remove();
            boatLayers[idx].remove();
            barbLayers[idx].remove();
        }
    }

    function removeRoute(idx: number) {
        routeLayers[idx].remove();
        boatLayers[idx].remove();
        barbLayers[idx].remove();

        routes      = routes.filter((_, i) => i !== idx);
        routeLayers = routeLayers.filter((_, i) => i !== idx);
        boatLayers  = boatLayers.filter((_, i) => i !== idx);
        barbLayers  = barbLayers.filter((_, i) => i !== idx);
    }

    function changeRouteColor(idx: number, color: string) {
        routes[idx] = { ...routes[idx], color };
        routes = [...routes]; // force reactivity
        drawFullRoute(idx);
        updateBoatPosition(store.get('timestamp'));
        updateBarbs(idx);
    }

    async function reloadRoute(idx: number) {
        const route = routes[idx];

        let waypoints = [];
        let format = route.format;

        try {
            if (route.rawFile.name.endsWith('.xlsx') || route.rawFile.name.endsWith('.xls')) {
                const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs');
                const ab = await route.rawFile.arrayBuffer();
                const wb = XLSX.read(ab, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
                waypoints = parseAdrenaXLSX(data);
                format = 'adrena';
            } else {
                const result = await parseFile(route.rawFile, route.format);
                waypoints = result.waypoints;
                format = result.format;
            }
        } catch (e) {
            console.error('reloadRoute error:', e);
            return;
        }

        routes[idx] = { ...routes[idx], waypoints, format };

        drawFullRoute(idx);
        updateBarbs(idx);
        updateBoatPosition(store.get('timestamp'));
    }

    function fitRoute(idx: number) {
        const latLngs = routes[idx].waypoints.map(w => [w.lat, w.lon]);
        map.fitBounds(L.polyline(latLngs).getBounds());
    }

    function toggleMinimize() {
        isMinimized = !isMinimized;
    }

    // -------------------------------------------------------------------
    // AFFICHAGE CARTE
    // -------------------------------------------------------------------

    function drawFullRoute(idx: number) {
        const route = routes[idx];
        routeLayers[idx].clearLayers();

        const latLngs = route.waypoints.map(w => [w.lat, w.lon]);
        L.polyline(latLngs, {
            color: route.color,
            weight: 2,
            opacity: 0.7
        }).addTo(routeLayers[idx]);

        route.waypoints.forEach((w, i) => {
            if (i % 5 === 0) {
                L.circleMarker([w.lat, w.lon], {
                    radius: 2,
                    color: route.color,
                    fillColor: route.color,
                    fillOpacity: 0.6,
                    weight: 1
                }).addTo(routeLayers[idx]);
            }
        });
    }

    function getInterpolatedPosition(ts: number, waypoints: any[]): any | null {
        if (waypoints.length === 0) return null;

        let a = waypoints[0];
        let b = waypoints[waypoints.length - 1];

        if (ts <= a.time) return a;
        if (ts >= b.time) return b;

        for (let i = 0; i < waypoints.length - 1; i++) {
            if (ts >= waypoints[i].time && ts <= waypoints[i + 1].time) {
                a = waypoints[i];
                b = waypoints[i + 1];
                break;
            }
        }

        const ratio = (ts - a.time) / (b.time - a.time);
        return {
            lat:   a.lat   + (b.lat   - a.lat)   * ratio,
            lon:   a.lon   + (b.lon   - a.lon)    * ratio,
            cog:   a.cog   + (b.cog   - a.cog)    * ratio,
            sog:   a.sog   + (b.sog   - a.sog)    * ratio,
            tws:   a.tws   + (b.tws   - a.tws)    * ratio,
            twd:   a.twd   + (b.twd   - a.twd)    * ratio,
            label: a.label
        };
    }

    function updateBoatPosition(ts: number) {
        routes.forEach((route, idx) => {
            if (!route.visible) return;

            const current = getInterpolatedPosition(ts, route.waypoints);
            if (!current) return;

            boatLayers[idx].clearLayers();

            const pastPoints = route.waypoints.filter(p => p.time < ts).map(p => [p.lat, p.lon]);
            pastPoints.push([current.lat, current.lon]);

            L.polyline(pastPoints, {
                color: route.color,
                weight: 4,
                opacity: 0.9
            }).addTo(boatLayers[idx]);

            const boatIcon = L.divIcon({
                className: '',
                html: `<svg viewBox="0 0 100 100" width="30" height="30" style="transform: rotate(${current.cog}deg);">
                        <polygon points="50,0 90,100 50,80 10,100" fill="${route.color}" stroke="white" stroke-width="5"/>
                       </svg>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

            const csvTimeStr = toCsvDisplayTime(ts);
            L.marker([current.lat, current.lon], { icon: boatIcon })
                .addTo(boatLayers[idx])
                .bindPopup(`
                    <b>${route.name}</b><br>
                    SOG: ${current.sog.toFixed(1)} kt<br>
                    TWS: ${current.tws.toFixed(1)} kt<br>
                    <small>UTC: ${new Date(ts).toISOString().slice(11,19)}</small><br>
                    <small>CSV (UTC${csvTimezoneOffset + manualOffset >= 0 ? '+' : ''}${csvTimezoneOffset + manualOffset}): ${csvTimeStr}</small>
                `);
        });
    }

    // -------------------------------------------------------------------
    // BARBULES NORMALISÉES
    // -------------------------------------------------------------------

    function createWindBarb(lat: number, lon: number, direction: number, speedKnots: number) {
        const roundedSpeed = Math.ceil(speedKnots / 5) * 5;
        const rotation = direction % 360;

        const triangles = Math.floor(roundedSpeed / 50);
        let remaining = roundedSpeed % 50;
        const longBars = Math.floor(remaining / 10);
        remaining = remaining % 10;
        const shortBars = Math.floor(remaining / 5);

        let barbsSvg = '';
        let offset = 8;

        for (let i = 0; i < triangles; i++) {
            barbsSvg += `<polygon points="40,${offset} 28,${offset + 12} 40,${offset + 12}" fill="#000" stroke="none"/>`;
            offset += 15;
        }
        for (let i = 0; i < longBars; i++) {
            barbsSvg += `<line x1="40" y1="${offset}" x2="52" y2="${offset - 8}" stroke="#000" stroke-width="3"/>`;
            offset += 6;
        }
        for (let i = 0; i < shortBars; i++) {
            barbsSvg += `<line x1="40" y1="${offset}" x2="48" y2="${offset - 5}" stroke="#000" stroke-width="2.5"/>`;
            offset += 5;
        }

        const icon = L.divIcon({
            className: '',
            html: `<svg viewBox="0 0 80 80" width="80" height="80" style="transform: rotate(${rotation}deg); overflow: visible;">
                    <line x1="40" y1="40" x2="40" y2="8" stroke="#000" stroke-width="3"/>
                    <circle cx="40" cy="40" r="4" fill="#fff" stroke="#000" stroke-width="2"/>
                    ${barbsSvg}
                   </svg>`,
            iconSize: [80, 80],
            iconAnchor: [40, 40]
        });

        return L.marker([lat, lon], { icon })
            .bindTooltip(`Vent: ${speedKnots.toFixed(1)}kt (barbe ${roundedSpeed}kt) de ${direction.toFixed(0)}°`, {
                permanent: false,
                direction: 'top'
            });
    }

    function createCurrentBarb(lat: number, lon: number, setDirection: number, driftKnots: number) {
        if (driftKnots < 0.1) return null;

        const length = Math.min(30 + driftKnots * 20, 60);

        const icon = L.divIcon({
            className: '',
            html: `<svg viewBox="0 0 80 80" width="70" height="70" style="transform: rotate(${setDirection}deg); overflow: visible;">
                    <line x1="40" y1="40" x2="40" y2="${40 - length}" stroke="#0088cc" stroke-width="3.5"/>
                    <polygon points="40,${40 - length} 33,${40 - length + 9} 47,${40 - length + 9}" fill="#0088cc" stroke="none"/>
                    <circle cx="40" cy="40" r="3.5" fill="#fff" stroke="#0088cc" stroke-width="2"/>
                   </svg>
                   <div style="position: absolute; bottom: -18px; left: 50%; transform: translateX(-50%);
                               font-size: 11px; font-weight: bold; color: #0088cc; background: rgba(255,255,255,0.95);
                               padding: 2px 5px; border-radius: 3px; white-space: nowrap; border: 1px solid #0088cc;">
                       ${driftKnots.toFixed(1)}kt
                   </div>`,
            iconSize: [70, 70],
            iconAnchor: [35, 35]
        });

        return L.marker([lat, lon], { icon })
            .bindTooltip(`Courant: ${driftKnots.toFixed(1)}kt vers ${setDirection.toFixed(0)}°`, {
                permanent: false,
                direction: 'top'
            });
    }

    function createWaveBarb(lat: number, lon: number, waveDirection: number, heightMeters: number, periodSeconds: number | null = null) {
        if (heightMeters < 0.3) return null;

        const length = Math.min(25 + heightMeters * 12, 55);

        const icon = L.divIcon({
            className: '',
            html: `<svg viewBox="0 0 80 80" width="75" height="75" style="transform: rotate(${waveDirection}deg); overflow: visible;">
                    <path d="M 40,40 Q 37,${40 - length / 3} 40,${40 - 2 * length / 3} T 40,${40 - length}"
                          stroke="#4488ff" stroke-width="3.5" fill="none"/>
                    <polygon points="40,${40 - length} 33,${40 - length + 9} 47,${40 - length + 9}" fill="#4488ff" stroke="none"/>
                    <circle cx="40" cy="40" r="3.5" fill="#fff" stroke="#4488ff" stroke-width="2"/>
                   </svg>
                   <div style="position: absolute; bottom: -22px; left: 50%; transform: translateX(-50%);
                               font-size: 10px; font-weight: bold; color: #4488ff; background: rgba(255,255,255,0.95);
                               padding: 2px 5px; border-radius: 3px; white-space: nowrap; border: 1px solid #4488ff;">
                       ${heightMeters.toFixed(1)}m${periodSeconds ? ' / ' + periodSeconds.toFixed(0) + 's' : ''}
                   </div>`,
            iconSize: [75, 75],
            iconAnchor: [37.5, 37.5]
        });

        return L.marker([lat, lon], { icon })
            .bindTooltip(`Houle: ${heightMeters.toFixed(1)}m${periodSeconds ? ', T=' + periodSeconds.toFixed(0) + 's' : ''} vers ${waveDirection.toFixed(0)}°`, {
                permanent: false,
                direction: 'top'
            });
    }

    function updateBarbs(idx: number) {
        const route = routes[idx];
        barbLayers[idx].clearLayers();

        if (!route.visible) return;

        let interval = 1;
        if (route.waypoints.length > 100) interval = Math.floor(route.waypoints.length / 50);
        else if (route.waypoints.length > 50) interval = 2;

        route.waypoints.forEach((wp, i) => {
            if (i % interval !== 0) return;

            if (route.showWind && wp.twd && wp.tws > 0) {
                const barb = createWindBarb(wp.lat, wp.lon, wp.twd, wp.tws);
                if (barb) barb.addTo(barbLayers[idx]);
            }

            if (route.showCurrent && wp.cd !== undefined && wp.cs !== undefined && wp.cs > 0) {
                const barb = createCurrentBarb(wp.lat, wp.lon, wp.cd, wp.cs);
                if (barb) barb.addTo(barbLayers[idx]);
            }

            if (route.showWaves) {
                let barb = null;
                if (wp.wvdir && wp.htsgw > 0) {
                    barb = createWaveBarb(wp.lat, wp.lon, wp.wvdir, wp.htsgw);
                } else if (wp.pwd && wp.twh > 0) {
                    barb = createWaveBarb(wp.lat, wp.lon, wp.pwd, wp.twh);
                }
                if (barb) barb.addTo(barbLayers[idx]);
            }
        });
    }

    // -------------------------------------------------------------------
    // EVENT HANDLERS
    // -------------------------------------------------------------------

    const handleDrop = (e: DragEvent) => {
        isDragging = false;
        handleFiles(e.dataTransfer.files);
    };

    const handleFileChange = (e: Event) => handleFiles((e.target as HTMLInputElement).files);

    onMount(() => {
        unsubTime = store.on('timestamp', (ts: number) => {
            updateTimeDisplay(ts);
            updateBoatPosition(ts);
        });
    });

    // ─── POINTS MANUELS ───────────────────────────────────────
    let showPointsPanel = false;
    let manualPoints = [];
    let pointLayers  = [];

    // Formulaire
    let ptLatDeg = '', ptLatMin = '', ptLatNS = 'N';
    let ptLonDeg = '', ptLonMin = '', ptLonEW = 'W';
    let ptName   = '';
    let ptColor  = COLORS[0];
    let ptError  = '';

    function parseDMtoDD(deg: string, min: string, hem: string): number | null {
        const d = parseFloat(deg);
        const m = parseFloat(min);
        if (isNaN(d) || isNaN(m)) return null;
        const dd = d + m / 60;
        return (hem === 'S' || hem === 'W') ? -dd : dd;
    }

    function formatDMS(dd: number, axis: 'NS' | 'EW'): string {
        const abs  = Math.abs(dd);
        const deg  = Math.floor(abs);
        const min  = ((abs - deg) * 60).toFixed(3);
        const hem  = axis === 'NS' ? (dd >= 0 ? 'N' : 'S') : (dd >= 0 ? 'E' : 'W');
        return `${deg}° ${min} ${hem}`;
    }

    function addManualPoint() {
        ptError = '';
        const lat = parseDMtoDD(String(ptLatDeg), String(ptLatMin), ptLatNS);
        const lon = parseDMtoDD(String(ptLonDeg), String(ptLonMin), ptLonEW);
        if (lat === null || lon === null) {
            ptError = 'Coordonnées invalides';
            return;
        }
        const name  = ptName.trim() || `Point ${manualPoints.length + 1}`;
        const color = ptColor;
        const pt    = { lat, lon, name, color, visible: true };
        manualPoints = [...manualPoints, pt];

        const layer = L.layerGroup().addTo(map);
        pointLayers  = [...pointLayers, layer];
        drawPoint(manualPoints.length - 1);

        // Reset form
        ptLatDeg = ''; ptLatMin = ''; ptLonDeg = ''; ptLonMin = '';
        ptName   = '';
    }

    function drawPoint(idx: number) {
        const pt = manualPoints[idx];
        pointLayers[idx].clearLayers();
        if (!pt.visible) return;

        const icon = L.divIcon({
            className: '',
            html: `<svg viewBox="0 0 40 50" width="28" height="35">
                    <path d="M20 0 C9 0 0 9 0 20 C0 34 20 50 20 50 C20 50 40 34 40 20 C40 9 31 0 20 0Z"
                          fill="${pt.color}" stroke="white" stroke-width="3"/>
                    <circle cx="20" cy="20" r="7" fill="white"/>
                   </svg>`,
            iconSize: [28, 35],
            iconAnchor: [14, 35],
            popupAnchor: [0, -35]
        });

        L.marker([pt.lat, pt.lon], { icon })
            .addTo(pointLayers[idx])
            .bindPopup(`<b>${pt.name}</b><br>${formatDMS(pt.lat,'NS')}<br>${formatDMS(pt.lon,'EW')}`);
    }

    function togglePoint(idx: number) {
        drawPoint(idx);
    }

    function removePoint(idx: number) {
        pointLayers[idx].remove();
        manualPoints = manualPoints.filter((_, i) => i !== idx);
        pointLayers  = pointLayers.filter((_, i) => i !== idx);
    }

    function changePointColor(idx: number, color: string) {
        manualPoints[idx] = { ...manualPoints[idx], color };
        manualPoints = [...manualPoints];
        drawPoint(idx);
    }

    // ─── DST ──────────────────────────────────────────────────
    let showDstPanel = false;
    let showDst      = false;
    let dstLayer     = null;

    // Coordonnées officielles SHOM (DMS → DD)
    const DST_ZONES = [
        {
            name: 'Ouessant — Forme Sud',
            color: '#e67e22', fill: 0.20,
            coords: [
                [48.633222, -5.215239],
                [48.620061, -5.198417],
                [48.490350, -5.367922],
                [48.496494, -5.391267]
            ]
        },
        {
            name: 'Ouessant — Forme Centrale Sud',
            color: '#e67e22', fill: 0.20,
            coords: [
                [48.806764, -5.420558],
                [48.660483, -5.246836],
                [48.510136, -5.437725],
                [48.584683, -5.702769],
                [48.747036, -5.572308]
            ]
        },
        {
            name: 'Ouessant — Forme Centrale Nord',
            color: '#e67e22', fill: 0.20,
            coords: [
                [48.946758, -5.544156],
                [48.878167, -5.478925],
                [48.809931, -5.658139],
                [48.622825, -5.810572],
                [48.660936, -5.921122],
                [48.867325, -5.748775]
            ]
        },
        {
            name: 'Ouessant — Forme Nord',
            color: '#e67e22', fill: 0.20,
            coords: [
                [49.031017, -5.616939],
                [49.016608, -5.601833],
                [48.925558, -5.844906],
                [48.698567, -6.027553],
                [48.708264, -6.048267],
                [48.939272, -5.859439]
            ]
        },
        {
            name: 'Casquets — Forme Nord',
            color: '#9b59b6', fill: 0.20,
            coords: [
                [50.143308, -2.471806],
                [50.110733, -2.459447],
                [50.027875, -2.944217],
                [50.059183, -2.957950]
            ]
        },
        {
            name: 'Casquets — Forme Centre',
            color: '#9b59b6', fill: 0.20,
            coords: [
                [50.031844, -2.425800],
                [49.951944, -2.392156],
                [49.867928, -2.878300],
                [49.947525, -2.911258]
            ]
        },
        {
            name: 'Casquets — Forme Sud',
            color: '#9b59b6', fill: 0.20,
            coords: [
                [49.870681, -2.359119],
                [49.853861, -2.352253],
                [49.771447, -2.837711],
                [49.787411, -2.843892]
            ]
        }
    ];

    function toggleDst() {
        if (showDst) {
            drawDst();
        } else {
            dstLayer?.remove();
            dstLayer = null;
        }
    }

    function drawDst() {
        dstLayer?.remove();
        dstLayer = L.layerGroup().addTo(map);

        DST_ZONES.forEach(zone => {
            try {
                const poly = L.polygon(zone.coords, {
                    color:       zone.color,
                    fillColor:   zone.color,
                    fillOpacity: zone.fill,
                    weight:      2,
                    opacity:     0.85
                }).addTo(dstLayer);

                // Leaflet-GL ne supporte pas bindTooltip → bindPopup au clic
                try { poly.bindPopup(`<b>${zone.name}</b>`, { closeButton: false }); } catch(e) {}


            } catch(e) {
                console.warn('[DST] Erreur zone', zone.name, e);
            }
        });
    }

    // ─── DESTRUCTION ──────────────────────────────────────────
    onDestroy(() => {
        unsubTime?.();
        routeLayers.forEach(l => l.remove());
        boatLayers.forEach(l => l.remove());
        barbLayers.forEach(l => l.remove());
        pointLayers.forEach(l => l.remove());
        dstLayer?.remove();
    });

    export const onopen = () => {};
</script>

<style lang="less">
    .kbt-panel {
        position: fixed;
        bottom: 120px;
        left: 20px;
        width: 300px;
        background: rgba(15, 15, 25, 0.95);
        color: white;
        border-radius: 12px;
        padding: 15px;
        border: 1px solid #334;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: #445 transparent;
        transition: all 0.3s ease;
        max-height: 80vh;
    }

    .kbt-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: bold;
        border-bottom: 1px solid #334;
        padding-bottom: 8px;
        margin-bottom: 12px;
    }
    .kbt-header__icon { font-size: 18px; }
    .kbt-header__title { flex: 1; margin-left: 8px; }

    .kbt-header-actions {
        display: flex;
        gap: 8px;
        align-items: center;
    }

    .kbt-btn-minimize {
        background: rgba(52, 152, 219, 0.2);
        border: 1px solid #3498db;
        color: #3498db;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
        &:hover {
            background: rgba(52, 152, 219, 0.4);
            transform: scale(1.05);
        }
    }

    .kbt-header__close {
        background: none;
        border: none;
        color: #e74c3c;
        cursor: pointer;
        font-size: 18px;
        padding: 0;
        transition: all 0.2s;
        &:hover { transform: scale(1.1); }
    }

    .kbt-drop {
        border: 2px dashed #445;
        border-radius: 8px;
        padding: 20px;
        text-align: center;
        cursor: pointer;
        margin-bottom: 15px;
        transition: all 0.2s;
        &:hover, &--active {
            border-color: #3498db;
            background: #1a1f2e;
        }
    }
    .kbt-hint {
        display: block;
        font-size: 10px;
        color: #778;
        margin-top: 4px;
    }

    /* ---- Bloc info / horloge ---- */
    .kbt-info {
        background: rgba(0, 0, 0, 0.3);
        padding: 10px;
        border-radius: 6px;
        margin-bottom: 15px;
    }

    .kbt-time-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 3px 0;
        border-bottom: 1px solid rgba(255,255,255,0.05);
        &:last-of-type { border-bottom: none; }
    }

    .kbt-tz-label {
        font-size: 10px;
        color: #889;
    }

    .kbt-tz-val {
        font-family: monospace;
        font-size: 11px;
        font-weight: bold;
    }

    .kbt-tz-utc   { color: #3498db; }
    .kbt-tz-local { color: #2ecc71; }
    .kbt-tz-csv   { color: #e67e22; }

    .kbt-tz-detected {
        font-size: 10px;
        color: #2ecc71;
        margin-top: 6px;
        padding: 4px 6px;
        background: rgba(46, 204, 113, 0.1);
        border-radius: 4px;
    }

    .kbt-tz-warn {
        font-size: 10px;
        color: #f39c12;
        margin-top: 6px;
        padding: 4px 6px;
        background: rgba(243, 156, 18, 0.1);
        border-radius: 4px;
    }

    .kbt-tz-controls {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #334;
    }

    .kbt-tz-ctrl-label {
        font-size: 10px;
        color: #889;
        display: flex;
        flex-direction: column;
        gap: 3px;
        flex: 1;
    }

    .kbt-offset-row {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        color: #aaa;
    }

    .kbt-offset-input {
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid #445;
        color: white;
        padding: 3px 6px;
        border-radius: 4px;
        font-size: 11px;
        width: 52px;
        text-align: center;
        &:focus { outline: none; border-color: #3498db; }
    }

    .kbt-status {
        font-size: 12px;
        color: #2ecc71;
        margin-top: 8px;
    }

    /* ---- Routes ---- */
    .kbt-route-card {
        background: rgba(0, 0, 0, 0.4);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 10px;
        border: 1px solid #334;
    }

    .kbt-route-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;

        input[type="checkbox"] {
            cursor: pointer;
            width: 16px;
            height: 16px;
        }
    }

    .kbt-route-name {
        flex: 1;
        font-weight: bold;
        font-size: 13px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .kbt-btn-remove {
        background: rgba(231, 76, 60, 0.2);
        border: 1px solid #e74c3c;
        color: #e74c3c;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        &:hover { background: rgba(231, 76, 60, 0.4); }
    }

    /* ---- Sélecteur de couleur ---- */
    .kbt-color-picker {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-bottom: 8px;
        padding: 6px;
        background: rgba(0, 0, 0, 0.25);
        border-radius: 6px;
        border: 1px solid #334;
    }

    .kbt-color-swatch {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 2px solid transparent;
        cursor: pointer;
        padding: 0;
        transition: transform 0.15s, border-color 0.15s;

        &:hover {
            transform: scale(1.25);
            border-color: rgba(255, 255, 255, 0.6);
        }

        &--active {
            border-color: white;
            transform: scale(1.2);
            box-shadow: 0 0 0 1px rgba(0,0,0,0.5);
        }
    }

    .kbt-route-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }

    .kbt-meta {
        font-size: 11px;
        color: #999;
    }

    .kbt-select-format {
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid #445;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        cursor: pointer;
        &:focus { outline: none; border-color: #3498db; }
    }

    .kbt-barbs-options {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 8px;
        padding: 8px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 6px;
    }

    .kbt-checkbox {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        cursor: pointer;

        input[type="checkbox"] {
            cursor: pointer;
            width: 14px;
            height: 14px;
        }

        &:hover { color: #3498db; }
    }

    .kbt-btn-fit {
        width: 100%;
        background: #3498db;
        border: none;
        color: white;
        padding: 6px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        &:hover { background: #2980b9; }
    }

    .kbt-error {
        color: #e74c3c;
        font-size: 11px;
        background: rgba(231, 76, 60, 0.1);
        padding: 8px;
        border-radius: 6px;
        margin-top: 10px;
    }

    /* ── Sections repliables ── */
    .kbt-section {
        border: 1px solid #334;
        border-radius: 8px;
        margin-bottom: 10px;
        overflow: hidden;
    }
    .kbt-section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: rgba(52,152,219,0.12);
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
        user-select: none;
        &:hover { background: rgba(52,152,219,0.22); }
    }

    /* ── Formulaire point manuel ── */
    .kbt-point-form {
        padding: 8px 10px;
    }
    .kbt-point-row {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 6px;
    }
    .kbt-point-label {
        font-size: 10px;
        color: #889;
        width: 22px;
        flex-shrink: 0;
    }
    .kbt-point-input {
        background: rgba(0,0,0,0.5);
        border: 1px solid #445;
        color: white;
        padding: 3px 5px;
        border-radius: 4px;
        font-size: 11px;
        width: 52px;
        text-align: center;
        &:focus { outline: none; border-color: #3498db; }
        /* Masquer les flèches number */
        -moz-appearance: textfield;
        &::-webkit-outer-spin-button,
        &::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    }
    .kbt-point-sep {
        font-size: 13px;
        color: #aaa;
    }
    .kbt-point-ns {
        background: rgba(0,0,0,0.5);
        border: 1px solid #445;
        color: white;
        padding: 3px 4px;
        border-radius: 4px;
        font-size: 11px;
        cursor: pointer;
    }
    .kbt-point-name-input {
        width: 100%;
        background: rgba(0,0,0,0.5);
        border: 1px solid #445;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        margin-bottom: 4px;
        box-sizing: border-box;
        &:focus { outline: none; border-color: #3498db; }
    }
</style>
