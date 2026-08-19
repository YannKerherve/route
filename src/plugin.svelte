<div class="nt-panel">
    <div class="nt-header">
        <span class="nt-header__icon">⛵</span>
        <span class="nt-header__title">Nav tool</span>
        <div class="nt-header-actions">
            <button class="nt-btn-minimize" on:click={toggleMinimize} title="Minimize/Expand">
                {isMinimized ? '🔼' : '🔽'}
            </button>
            <button class="nt-header__close" on:click={() => bcast.emit('rqstOpen', 'menu')}>✕</button>
        </div>
    </div>

    <div
        class="nt-drop"
        class:nt-drop--active={isDragging}
        on:dragover|preventDefault={() => (isDragging = true)}
        on:dragleave={() => (isDragging = false)}
        on:drop|preventDefault={handleDrop}
        on:click={() => fileInput.click()}
    >
        <span>📂 Load a CSV / XLSX file</span>
        <span class="nt-hint">Drag & drop or click (Tactics / SimSail / Adrena)</span>
        <input bind:this={fileInput} type="file" accept=".csv,.xlsx,.xls" multiple on:change={handleFileChange} style="display: none;" />
    </div>

    {#if !isMinimized}

    {#if routes.length > 0}
        <!-- Time block -->
        <div class="nt-info">
            <div class="nt-time-row">
                <span class="nt-tz-label">🌍 Windy (UTC)</span>
                <span class="nt-tz-val nt-tz-utc">{windyTimeUTC}</span>
            </div>
            <div class="nt-time-row">
                <span class="nt-tz-label">💻 Computer ({localTzName})</span>
                <span class="nt-tz-val nt-tz-local">{windyTimeLocal}</span>
            </div>
            <div class="nt-time-row">
                <span class="nt-tz-label">📄 CSV (UTC{csvTimezoneOffset >= 0 ? '+' : ''}{csvTimezoneOffset + manualOffset})</span>
                <span class="nt-tz-val nt-tz-csv">{windyTimeCSV}</span>
            </div>

            {#if detectedTz !== null}
                <div class="nt-tz-detected">✅ Timezone detected in CSV: UTC{detectedTz >= 0 ? '+' : ''}{detectedTz}</div>
            {:else}
                <div class="nt-tz-warn">⚠️ CSV timezone not detected — assuming UTC+0</div>
            {/if}

            <div class="nt-tz-controls">
                <label class="nt-tz-ctrl-label">
                    CSV timezone
                    <select bind:value={csvTimezoneOffset} on:change={onTimezoneChange} class="nt-select-format">
                        {#each tzOptions as h}
                            <option value={h}>UTC{h >= 0 ? '+' : ''}{h}</option>
                        {/each}
                    </select>
                </label>
                <label class="nt-tz-ctrl-label">
                    Manual offset
                    <div class="nt-offset-row">
                        <input
                            type="number"
                            bind:value={manualOffset}
                            on:change={onTimezoneChange}
                            min="-24" max="24"
                            class="nt-offset-input"
                        />
                        <span>h</span>
                    </div>
                </label>
            </div>

            <div class="nt-status">✅ {routes.length} route{routes.length > 1 ? 's' : ''} loaded</div>
        </div>
    {/if}

    {#if error}
        <div class="nt-error">⚠️ {error}</div>
    {/if}

    <!-- Loaded routes -->
    {#each routes as route, idx}
        <div class="nt-route-card">
            <div class="nt-route-header">
                <input type="checkbox" bind:checked={route.visible} on:change={() => toggleRoute(idx)} />
                <span class="nt-route-name" style="color: {route.color}">{route.name}</span>
                <button class="nt-btn-remove" on:click={() => removeRoute(idx)}>🗑</button>
            </div>

            <div class="nt-color-picker">
                {#each COLORS as color}
                    <button
                        class="nt-color-swatch"
                        class:nt-color-swatch--active={route.color === color}
                        style="background: {color};"
                        on:click={() => changeRouteColor(idx, color)}
                        title={color}
                    ></button>
                {/each}
            </div>

            <div class="nt-route-info">
                <span class="nt-meta">{route.waypoints.length} pts</span>
                <select
                    bind:value={route.format}
                    on:change={() => reloadRoute(idx)}
                    class="nt-select-format"
                    disabled={route.format === 'adrena'}
                    title={route.format === 'adrena' ? 'Format fixed (Adrena Excel file)' : ''}
                >
                    <option value="auto">Auto</option>
                    <option value="tactics">Tactics</option>
                    <option value="simsail">SimSail</option>
                    <option value="adrena">Adrena</option>
                </select>
            </div>

            {#if route.visible}
                <div class="nt-barbs-options">
                    <label class="nt-checkbox">
                        <input type="checkbox" bind:checked={route.showWind} on:change={() => updateBarbs(idx)} />
                        <span>💨 Wind</span>
                    </label>
                    <label class="nt-checkbox">
                        <input type="checkbox" bind:checked={route.showCurrent} on:change={() => updateBarbs(idx)} />
                        <span>🌊 Current</span>
                    </label>
                    <label class="nt-checkbox">
                        <input type="checkbox" bind:checked={route.showWaves} on:change={() => updateBarbs(idx)} />
                        <span>〰 Waves</span>
                    </label>
                </div>
                <button class="nt-btn-fit" on:click={() => fitRoute(idx)}>📍 Center</button>
            {/if}
        </div>
    {/each}

    <!-- ═══════════════════════════════════════════════
         MANUAL POINTS
    ═══════════════════════════════════════════════ -->
    <div class="nt-section">
        <div class="nt-section-header" on:click={() => showPointsPanel = !showPointsPanel}>
            <span>📍 Manual points</span>
            <span>{showPointsPanel ? '▲' : '▼'}</span>
        </div>
        {#if showPointsPanel}
            <div class="nt-point-form">
                <div class="nt-point-row">
                    <label class="nt-point-label">Lat</label>
                    <input class="nt-point-input" bind:value={ptLatDeg}  placeholder="48"      type="number" min="0"   max="90" />
                    <span class="nt-point-sep">°</span>
                    <input class="nt-point-input" bind:value={ptLatMin}  placeholder="12.345"  type="number" min="0"   max="60" step="0.001" />
                    <select class="nt-point-ns" bind:value={ptLatNS}>
                        <option>N</option><option>S</option>
                    </select>
                </div>
                <div class="nt-point-row">
                    <label class="nt-point-label">Lon</label>
                    <input class="nt-point-input" bind:value={ptLonDeg}  placeholder="002"     type="number" min="0"   max="180" />
                    <span class="nt-point-sep">°</span>
                    <input class="nt-point-input" bind:value={ptLonMin}  placeholder="34.567"  type="number" min="0"   max="60" step="0.001" />
                    <select class="nt-point-ns" bind:value={ptLonEW}>
                        <option>W</option><option>E</option>
                    </select>
                </div>
                <input class="nt-point-name-input" bind:value={ptName} placeholder="Point name (optional)" />
                <div class="nt-color-picker" style="margin:6px 0 8px">
                    {#each COLORS as color}
                        <button
                            class="nt-color-swatch"
                            class:nt-color-swatch--active={ptColor === color}
                            style="background:{color}"
                            on:click={() => ptColor = color}
                        ></button>
                    {/each}
                </div>
                <button class="nt-btn-fit" on:click={addManualPoint}>➕ Add</button>
                {#if ptError}<div class="nt-error">{ptError}</div>{/if}
            </div>

            {#each manualPoints as pt, idx}
                <div class="nt-route-card" style="margin-top:6px">
                    <div class="nt-route-header">
                        <input type="checkbox" bind:checked={pt.visible} on:change={() => togglePoint(idx)} />
                        <span class="nt-route-name" style="color:{pt.color}">{pt.name}</span>
                        <button class="nt-btn-remove" on:click={() => removePoint(idx)}>🗑</button>
                    </div>
                    <div style="font-size:10px;color:#aaa;padding:0 2px 4px">
                        {formatDMS(pt.lat, 'NS')} — {formatDMS(pt.lon, 'EW')}
                    </div>
                    <div class="nt-color-picker">
                        {#each COLORS as color}
                            <button
                                class="nt-color-swatch"
                                class:nt-color-swatch--active={pt.color === color}
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
         TSS
    ═══════════════════════════════════════════════ -->
    <div class="nt-section">
        <div class="nt-section-header" on:click={() => showTssPanel = !showTssPanel}>
            <span>🚢 TSS</span>
            <span>{showTssPanel ? '▲' : '▼'}</span>
        </div>
        {#if showTssPanel}
            <div style="padding:6px 4px">
                <label class="nt-checkbox">
                    <input type="checkbox" bind:checked={showTss} on:change={toggleTss} />
                    <span>Show Traffic Separation Schemes (Ouessant + Casquets)</span>
                </label>
            </div>
        {/if}
    </div>

    <!-- ═══════════════════════════════════════════════
         OPENSEAMAP (ECDIS-style seamarks, auto-loaded tiles)
    ═══════════════════════════════════════════════ -->
    <div class="nt-section">
        <div class="nt-section-header" on:click={() => showOSMPanel = !showOSMPanel}>
            <span>🗺️ OpenSeaMap</span>
            <span>{showOSMPanel ? '▲' : '▼'}</span>
        </div>
        {#if showOSMPanel}
            <div style="padding:8px 6px">
                {#if TILES_BASE_URL_IS_PLACEHOLDER}
                    <div class="nt-error">⚠️ TILES_BASE_URL is still the placeholder (YOUR_GITHUB_USER/YOUR_REPO) — edit it near the top of the OpenSeaMap section in plugin.svelte, then rebuild.</div>
                {/if}

                <label class="nt-checkbox">
                    <input type="checkbox" bind:checked={seamarksVisible} on:change={renderSeamarks} />
                    <span>Show seamarks</span>
                </label>

                {#if currentZoom < TILE_MIN_ZOOM}
                    <div class="nt-hint" style="margin-top:8px">
                        Zoom in to level {TILE_MIN_ZOOM}+ to load nautical chart tiles ({currentZoom.toFixed(0)} currently).
                    </div>
                {:else if tooManyTilesForView}
                    <div class="nt-tz-warn" style="margin-top:8px">
                        {pendingTileCount} tiles would be needed for this view — zoom in a bit more to load nautical chart tiles here.
                    </div>
                {:else}
                    <div class="nt-hint" style="margin-top:8px">
                        {loadedTileCount} tile{loadedTileCount > 1 ? 's' : ''} loaded · {seamarkFeatureCount} object{seamarkFeatureCount > 1 ? 's' : ''} visible at zoom {currentZoom.toFixed(0)}
                        {#if tilesLoading}<span class="nt-loading"> · loading…</span>{/if}
                    </div>
                    {#if attemptedTileCount > 0 && emptyTileCount === attemptedTileCount && !TILES_BASE_URL_IS_PLACEHOLDER}
                        <div class="nt-tz-warn" style="margin-top:6px">
                            Every tile fetched so far came back empty. Open <code>{TILES_BASE_URL}/{'{code}'}.geojson</code> directly in a browser tab to confirm the URL/branch/path are correct.
                        </div>
                    {/if}
                    {#if seamarkFeatureCount > 0 && seamarkFeatureCount < 5 && currentZoom < 12}
                        <div class="nt-hint" style="margin-top:6px">
                            Most "OTHER" category objects (rocks, berths, moorings…) only appear from zoom 12 — TSS/lighthouses/beacons appear earlier.
                        </div>
                    {/if}
                {/if}

                {#if seamarkError}<div class="nt-error">{seamarkError}</div>{/if}
            </div>
        {/if}
    </div>

    <!-- ═══════════════════════════════════════════════
         MEASURING TOOLS (distance / bearing)
    ═══════════════════════════════════════════════ -->
    <div class="nt-section">
        <div class="nt-section-header" on:click={() => showmeasurePanel = !showmeasurePanel}>
            <span>📏 Measuring tools</span>
            <span>{showmeasurePanel ? '▲' : '▼'}</span>
        </div>
        {#if showmeasurePanel}
            <div style="padding:8px 6px">
                <label class="nt-checkbox">
                    <input type="checkbox" bind:checked={measureActive} on:change={toggleMeasure} />
                    <span>Enable (click on the map)</span>
                </label>
                <div class="nt-hint" style="margin-top:6px">
                    Click once for the start point, click again for the end point. Distance in nautical miles, true bearing.
                </div>

                {#if measureStart}
                    <div class="nt-tz-warn" style="margin-top:8px">🎯 Start point set — click again to set the end point</div>
                {/if}

                {#if measurements.length > 0}
                    <div class="nt-measure-list">
                        {#each measurements as m, mi (m.id)}
                            <div class="nt-measure-item">
                                <div class="nt-measure-item-row">
                                    <span>#{mi + 1} — {m.distNM.toFixed(2)} NM / {m.brg.toFixed(0)}°</span>
                                    <div class="nt-measure-item-actions">
                                        <button class="nt-btn-edit" on:click={() => m.editing = !m.editing}>{m.editing ? '▲' : '✏️'}</button>
                                        <button class="nt-btn-remove" on:click={() => removeMeasurement(m.id)}>🗑</button>
                                    </div>
                                </div>

                                {#if m.editing}
                                    <div class="nt-measure-edit">
                                        <div class="nt-measure-lock-row">
                                            <label class="nt-radio">
                                                <input type="radio" name="lock-{m.id}" checked={m.locked === 'start'} on:change={() => m.locked = 'start'} />
                                                <span>Lock A</span>
                                            </label>
                                            <label class="nt-radio">
                                                <input type="radio" name="lock-{m.id}" checked={m.locked === 'end'} on:change={() => m.locked = 'end'} />
                                                <span>Lock B</span>
                                            </label>
                                        </div>

                                        <div class="nt-measure-point-grid">
                                            <span class="nt-measure-point-label">A (lat/lon)</span>
                                            <input class="nt-measure-coord-input" type="number" step="0.0001" bind:value={m.startLat} on:change={() => onMeasureLatLonEdit(m)} />
                                            <input class="nt-measure-coord-input" type="number" step="0.0001" bind:value={m.startLon} on:change={() => onMeasureLatLonEdit(m)} />
                                        </div>
                                        <div class="nt-measure-point-grid">
                                            <span class="nt-measure-point-label">B (lat/lon)</span>
                                            <input class="nt-measure-coord-input" type="number" step="0.0001" bind:value={m.endLat} on:change={() => onMeasureLatLonEdit(m)} />
                                            <input class="nt-measure-coord-input" type="number" step="0.0001" bind:value={m.endLon} on:change={() => onMeasureLatLonEdit(m)} />
                                        </div>

                                        <div class="nt-measure-point-grid">
                                            <span class="nt-measure-point-label">Distance (NM) / Bearing (°)</span>
                                            <input class="nt-measure-coord-input" type="number" step="0.01" bind:value={m.distNM} on:change={() => onMeasureDistBrgEdit(m)} />
                                            <input class="nt-measure-coord-input" type="number" step="1" bind:value={m.brg} on:change={() => onMeasureDistBrgEdit(m)} />
                                        </div>
                                        <div class="nt-hint">Editing distance/bearing moves the point that is NOT locked.</div>
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                    <button class="nt-btn-remove" style="width:100%;margin-top:8px" on:click={clearAllMeasurements}>🗑 Clear all</button>
                {/if}
            </div>
        {/if}
    </div>

    <div class="nt-section">
        <div class="nt-section-header" on:click={() => showWSPanel = !showWSPanel}>
            <span>🔵 WeatherScore</span>
            <span>{showWSPanel ? '▲' : '▼'}</span>
        </div>
        {#if showWSPanel}
            <div style="padding:6px 4px">
                <span class="nt-hint">WeatherScore: coming soon — automatic selection of the best weather model at sea.</span>
            </div>
        {/if}
    </div>

    {/if}

</div>
<script lang="ts">
    import bcast from "@windy/broadcast";
    import { onDestroy, onMount } from 'svelte';
    import { map } from "@windy/map";
    import store from '@windy/store';

    // --- STATE ---
    let routes = [];
    let isDragging = false;
    let error = "";
    let fileInput;
    let isMinimized = false;

    let windyTimeUTC = '';
    let windyTimeLocal = '';
    let windyTimeCSV = '';
    let localTzName = Intl.DateTimeFormat().resolvedOptions().timeZone;

    let csvTimezoneOffset = 0;
    let manualOffset = 0;
    let detectedTz = null;

    const tzOptions = Array.from({ length: 25 }, (_, i) => i - 12);

    let routeLayers = [];
    let boatLayers = [];
    let barbLayers = [];
    let unsubTime;

    const COLORS = [
        '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c',
        '#e67e22', '#f1c40f', '#e91e8c', '#00bcd4', '#8bc34a', '#ffffff',
    ];

    // -------------------------------------------------------------------
    // TIME HANDLING
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
    // MONTH / YEAR ROLLOVER FIX
    // -------------------------------------------------------------------

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
    // HEADER TIMEZONE DETECTION
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
    // PARSING UTILITIES
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
    // FORMAT PARSERS
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

        function adrenaSerialToMs(serial: number): number {
            const raw = new Date(Math.round((serial - 25569) * 86400000));
            const fixed = new Date(Date.UTC(
                raw.getUTCFullYear(),
                raw.getUTCDate() - 1,
                raw.getUTCMonth() + 1,
                raw.getUTCHours(),
                raw.getUTCMinutes(),
                raw.getUTCSeconds()
            ));
            return fixed.getTime();
        }

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
    // FILE HANDLING
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
                    error = `${file.name}: no valid data found`;
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
                error = `${file.name}: read error`;
                console.error(e);
            }
        }
    }

    // -------------------------------------------------------------------
    // ROUTE MANAGEMENT
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
        routes = [...routes];
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
    // MAP DISPLAY (routes)
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

    // Shortest-path angular interpolation (avoids fake 180 deg spins
    // when the boat heading crosses the 0/360 boundary).
    function shortestAngleLerp(a: number, b: number, ratio: number): number {
        let diff = ((b - a + 540) % 360) - 180;
        return (a + diff * ratio + 360) % 360;
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
            cog:   shortestAngleLerp(a.cog, b.cog, ratio),
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
    // NORMALIZED WEATHER BARBS
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
            .bindTooltip(`Wind: ${speedKnots.toFixed(1)}kt (barb ${roundedSpeed}kt) from ${direction.toFixed(0)}°`, {
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
            .bindTooltip(`Current: ${driftKnots.toFixed(1)}kt towards ${setDirection.toFixed(0)}°`, {
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
            .bindTooltip(`Swell: ${heightMeters.toFixed(1)}m${periodSeconds ? ', T=' + periodSeconds.toFixed(0) + 's' : ''} towards ${waveDirection.toFixed(0)}°`, {
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
    // FILE EVENT HANDLERS (routes)
    // -------------------------------------------------------------------

    const handleDrop = (e: DragEvent) => {
        isDragging = false;
        handleFiles(e.dataTransfer.files);
    };

    const handleFileChange = (e: Event) => handleFiles((e.target as HTMLInputElement).files);

    // ─── MANUAL POINTS ─────────────────────────────────────────
    let showPointsPanel = false;
    let manualPoints = [];
    let pointLayers  = [];

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
            ptError = 'Invalid coordinates';
            return;
        }
        const name  = ptName.trim() || `Point ${manualPoints.length + 1}`;
        const color = ptColor;
        const pt    = { lat, lon, name, color, visible: true };
        manualPoints = [...manualPoints, pt];

        const layer = L.layerGroup().addTo(map);
        pointLayers  = [...pointLayers, layer];
        drawPoint(manualPoints.length - 1);

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

    // ─── TSS ────────────────────────────────────────────────────
    let showTssPanel = false;
    let showTss      = false;
    let tssLayer      = null;

    const TSS_ZONES = [
        {
            name: 'Ouessant TSS — South lane',
            color: '#e67e22', fill: 0.20,
            coords: [
                [48.633222, -5.215239],
                [48.620061, -5.198417],
                [48.490350, -5.367922],
                [48.496494, -5.391267]
            ]
        },
        {
            name: 'Ouessant TSS — Central-south lane',
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
            name: 'Ouessant TSS — Central-north lane',
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
            name: 'Ouessant TSS — North lane',
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
            name: 'Casquets TSS — North lane',
            color: '#9b59b6', fill: 0.20,
            coords: [
                [50.143308, -2.471806],
                [50.110733, -2.459447],
                [50.027875, -2.944217],
                [50.059183, -2.957950]
            ]
        },
        {
            name: 'Casquets TSS — Central lane',
            color: '#9b59b6', fill: 0.20,
            coords: [
                [50.031844, -2.425800],
                [49.951944, -2.392156],
                [49.867928, -2.878300],
                [49.947525, -2.911258]
            ]
        },
        {
            name: 'Casquets TSS — South lane',
            color: '#9b59b6', fill: 0.20,
            coords: [
                [49.870681, -2.359119],
                [49.853861, -2.352253],
                [49.771447, -2.837711],
                [49.787411, -2.843892]
            ]
        }
    ];

    function toggleTss() {
        if (showTss) {
            drawTss();
        } else {
            tssLayer?.remove();
            tssLayer = null;
        }
    }

    function drawTss() {
        tssLayer?.remove();
        tssLayer = L.layerGroup().addTo(map);

        TSS_ZONES.forEach(zone => {
            try {
                const poly = L.polygon(zone.coords, {
                    color:       zone.color,
                    fillColor:   zone.color,
                    fillOpacity: zone.fill,
                    weight:      2,
                    opacity:     0.85
                }).addTo(tssLayer);

                try { poly.bindPopup(`<b>${zone.name}</b>`, { closeButton: false }); } catch(e) {}

            } catch(e) {
                console.warn('[TSS] Zone error', zone.name, e);
            }
        });
    }

    // ─── OPENSEAMAP — auto-loaded 1°×1° grid tiles ─────────────
    // Grid convention (see tools/split_tiles.py) — standard geographic tile
    // naming, keyed off the tile's SOUTH-WEST corner:
    //   "{N|S}{lat:2 digits}{E|W}{lon:3 digits}", e.g.:
    //     "N47W003" -> 47N-48N / 3W-2W
    //     "N48W005" -> 48N-49N / 5W-4W
    //     "S03W123" -> 3S-2S   / 123W-122W
    // Empty cells are never written by the split script, so a missing tile
    // simply means "no data here" — see the 404 handling in fetchTile().
    //
    // Tiles are plain static .geojson files fetched at runtime over HTTP from
    // your GitHub repo (via jsDelivr or raw.githubusercontent.com) — NOT
    // imported/bundled by Rollup. The Windy plugin build compiles to a single
    // dist/plugin.js (output.file), which cannot contain multiple chunks, so
    // a local `import('./tiles/X')` breaks the build. fetch() is a pure
    // runtime browser call and is invisible to the bundler, exactly like the
    // xlsx library already loaded above from an absolute CDN URL.
    //
    // >>> SET THIS to your repo before deploying <<<
    // jsDelivr is recommended: CORS-enabled, cached/CDN-backed, and free for
    // any public GitHub repo. Format:
    //   https://cdn.jsdelivr.net/gh/<github-user>/<repo>@<branch>/<path-to-tiles>
    // (raw.githubusercontent.com also works and updates instantly, but has
    // no CDN caching and stricter rate limits — fine for low traffic.)
    const TILES_BASE_URL = 'https://cdn.jsdelivr.net/gh/YannKerherve/route@main/tiles';
    const TILES_BASE_URL_IS_PLACEHOLDER = TILES_BASE_URL.includes('YOUR_GITHUB_USER');

    // 1° tiles are far smaller/cheaper to parse than the old 10° tiles, but
    // there are ~100x more of them for the same area, so a wide zoomed-out
    // view could otherwise trigger a huge burst of parallel HTTP requests
    // ("ramage"). Two safeguards keep that in check:
    //  - TILE_MIN_ZOOM raised so tiles only start loading once the visible
    //    area is reasonably small.
    //  - MAX_TILES_PER_VIEW: a hard cap; if more tiles than this would be
    //    needed for the current view we just ask the user to zoom in a bit
    //    more, instead of firing them all off at once.
    // There's no more hardcoded per-tile whitelist (AVAILABLE_TILES): at 1°
    // resolution that list would be huge and need regenerating every time
    // tiles are added, so we simply let fetchTile() 404 gracefully (it
    // already caches empty results so a given tile is never re-requested).
    const TILE_MIN_ZOOM = 8;
    const MAX_TILES_PER_VIEW = 150;
    const TILE_FETCH_BATCH_SIZE = 16; // fetched concurrently, in waves, to stay gentle on the CDN

    let showOSMPanel      = false;
    let seamarksVisible   = true;
    let seamarkLayer      = null;
    let seamarkError      = '';
    let currentZoom        = 0;
    let tilesLoading       = false;
    let loadedTileCount    = 0;
    let seamarkFeatureCount = 0;
    let attemptedTileCount  = 0;   // how many distinct tile codes we've tried to fetch
    let emptyTileCount      = 0;   // how many of those came back with zero features (incl. 404s)
    let tooManyTilesForView = false;
    let pendingTileCount    = 0;

    const tileCache: Record<string, any[]> = {};   // code -> array of GeoJSON features
    const loadingTiles = new Set<string>();

    // Normalizes a longitude to [-180, 180).
    function normLon(lon: number): number {
        return ((lon + 180) % 360 + 360) % 360 - 180;
    }

    // Builds a standard "{N|S}{lat:2}{E|W}{lon:3}" tile code from the
    // floored (south-west corner) integer lat/lon of a 1°×1° cell.
    function tileCodeForCell(latFloor: number, lonFloor: number): string {
        const latHem = latFloor >= 0 ? 'N' : 'S';
        const latAbs = String(Math.abs(latFloor)).padStart(2, '0');
        const lonHem = lonFloor >= 0 ? 'E' : 'W';
        const lonAbs = String(Math.abs(lonFloor)).padStart(3, '0');
        return `${latHem}${latAbs}${lonHem}${lonAbs}`;
    }

    function tilesForBounds(bounds: any): string[] {
        const south = Math.max(-90, Math.floor(bounds.getSouth()));
        const north = Math.min(89,  Math.floor(bounds.getNorth()));

        let west = normLon(bounds.getWest());
        let east = normLon(bounds.getEast());
        if (east <= west) east += 360; // antimeridian wrap

        const lonStart = Math.floor(west);
        const lonEnd   = Math.floor(east - 0.0000001);

        const codes: string[] = [];
        for (let la = south; la <= north; la++) {
            for (let lo = lonStart; lo <= lonEnd; lo++) {
                const lonDeg = Math.floor(normLon(lo));
                codes.push(tileCodeForCell(la, lonDeg));
            }
        }
        return codes;
    }

    // Fetches one tile's GeoJSON over HTTP. Returns [] (and caches that empty
    // result) both when the tile genuinely has no data and when it 404s —
    // either way there is nothing to draw there, and we should not keep
    // re-fetching it on every pan.
    async function fetchTile(code: string): Promise<{ features: any[], status: number }> {
        const res = await fetch(`${TILES_BASE_URL}/${code}.geojson`);
        if (!res.ok) return { features: [], status: res.status };
        const fc = await res.json();
        return { features: fc.features ?? [], status: res.status };
    }

    // Fetches a list of tile codes in small concurrent waves rather than all
    // at once, so we never blast the CDN with hundreds of simultaneous
    // requests when a big chunk of new tiles enters view at once.
    async function fetchTilesInBatches(codes: string[]): Promise<void> {
        for (let i = 0; i < codes.length; i += TILE_FETCH_BATCH_SIZE) {
            const batch = codes.slice(i, i + TILE_FETCH_BATCH_SIZE);
            await Promise.all(batch.map(async code => {
                loadingTiles.add(code);
                attemptedTileCount++;
                try {
                    const { features, status } = await fetchTile(code);
                    tileCache[code] = features;
                    if (features.length === 0) emptyTileCount++;
                    if (status === 404 && TILES_BASE_URL_IS_PLACEHOLDER) {
                        seamarkError = 'TILES_BASE_URL still points to the placeholder repo — edit it in plugin.svelte.';
                    }
                } catch (e) {
                    // network/CORS/parse error (not a plain 404): don't cache,
                    // so it gets retried on the next pan/zoom instead of
                    // silently staying blank forever.
                    console.warn('Tile fetch failed', code, e);
                    seamarkError = `Failed to load tile ${code} — check TILES_BASE_URL and CORS (see browser console/network tab).`;
                } finally {
                    loadingTiles.delete(code);
                }
            }));
        }
    }

    async function loadVisibleTiles() {
        currentZoom = typeof map.getZoom === 'function' ? map.getZoom() : 0;

        if (currentZoom < TILE_MIN_ZOOM) {
            tooManyTilesForView = false;
            renderSeamarks();
            return;
        }
        if (typeof map.getBounds !== 'function') return;

        const codes = tilesForBounds(map.getBounds());

        if (codes.length > MAX_TILES_PER_VIEW) {
            // Too many 1° cells for this view — don't fire a request storm,
            // just ask the user to zoom in a bit more.
            tooManyTilesForView = true;
            pendingTileCount = codes.length;
            renderSeamarks();
            return;
        }
        tooManyTilesForView = false;

        const toLoad = codes.filter(c => !(c in tileCache) && !loadingTiles.has(c));

        if (toLoad.length === 0) {
            renderSeamarks();
            return;
        }

        tilesLoading = true;
        seamarkError = '';

        await fetchTilesInBatches(toLoad);

        loadedTileCount = Object.keys(tileCache).length;
        tilesLoading = loadingTiles.size > 0;
        renderSeamarks();
    }

    // ── Colour palette & light character names ─────────────────
    const SEAMARK_COLORS: Record<string, string> = {
        red: '#e0302a', green: '#1fa34a', yellow: '#f1c40f', black: '#161616',
        white: '#ffffff', orange: '#e67e22', blue: '#2d7dd2',
        grey: '#95a5a6', gray: '#95a5a6', amber: '#e0a020', violet: '#8e44ad', magenta: '#c2185b'
    };

    const LIGHT_CHARACTERS: Record<string, string> = {
        F: 'Fixed', Fl: 'Flashing', LFl: 'Long-flashing', Oc: 'Occulting', Iso: 'Isophase',
        Q: 'Quick', VQ: 'Very quick', UQ: 'Ultra quick', IQ: 'Interrupted quick',
        IVQ: 'Interrupted very quick', IUQ: 'Interrupted ultra quick', Mo: 'Morse code',
        Al: 'Alternating', FFl: 'Fixed and flashing'
    };

    function firstColor(raw: string | undefined): string {
        if (!raw) return '#888888';
        const first = raw.split(';')[0].trim().toLowerCase();
        return SEAMARK_COLORS[first] || '#888888';
    }

    function typeLabel(typ: string): string {
        return (typ || 'seamark').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    // Type-specific attributes (category, colour, shape...) can live in two
    // different places depending on which export produced the tile:
    //  - older format: props.attributes  (flat "seamark:<type>:field" tags)
    //  - this dataset's format: props.children[seamark_type] (every
    //    "seamark:<group>:field" tag is bucketed under children[group],
    //    including when group === seamark_type — attributes stays empty)
    // Try children[type] first since that's what's actually populated here.
    function typeAttrs(props: any): any {
        const fromChildren = props.children?.[props.seamark_type];
        if (fromChildren && Object.keys(fromChildren).length > 0) return fromChildren;
        return props.attributes || {};
    }

    // ── SHOM beacon photos (French buoyage only) ────────────────
    // https://services.data.shom.fr/static/imagettes/BALISAGE/{ID}.jpg
    // ID is a 17-char national reference (FR + 15 digits). The current
    // download script writes it directly as props.shom_id; for tiles
    // generated by an older script version we fall back to scanning the
    // raw OSM tags (ref:inspire typically embeds it in a URL).
    const SHOM_PHOTO_BASE_URL = 'https://services.data.shom.fr/static/imagettes/BALISAGE/';
    const SHOM_ID_RE = /FR\d{15}/;

    function findShomId(props: any): string | null {
        if (props.shom_id) return props.shom_id;

        const tags = props.osm_tags || {};
        for (const key of ['ref:inspire', 'seamark:ref', 'ref']) {
            const v = tags[key];
            if (typeof v === 'string') {
                const m = v.match(SHOM_ID_RE);
                if (m) return m[0];
            }
        }
        for (const v of Object.values(tags)) {
            if (typeof v === 'string') {
                const m = v.match(SHOM_ID_RE);
                if (m) return m[0];
            }
        }
        return null;
    }

    // ── Popups: show every available attribute ──────────────────
    function buildPopupHtml(props: any, lat?: number, lon?: number): string {
        const rows: string[] = [];
        const push = (label: string, val: any) => {
            if (val === undefined || val === null || val === '') return;
            rows.push(`<div class="nt-pop-row"><b>${label}:</b> ${val}</div>`);
        };

        const title = props.name || typeLabel(props.seamark_type);
        let html = `<div class="nt-pop">`;

        const shomId = findShomId(props);
        if (shomId) {
            html += `<img class="nt-pop-img" src="${SHOM_PHOTO_BASE_URL}${shomId}.jpg" alt="${title}" loading="lazy" onerror="this.remove()" />`;
        }

        html += `<div class="nt-pop-title">${title}</div>`;
        html += `<div class="nt-pop-row"><b>Type:</b> ${typeLabel(props.seamark_type)}</div>`;

        const attrs = typeAttrs(props);
        if (attrs.category) push('Category', attrs.category.replace(/_/g, ' '));
        if (attrs.colour)   push('Colour', attrs.colour.replace(/;/g, ' / '));
        if (attrs.shape)    push('Shape', attrs.shape.replace(/_/g, ' '));
        if (attrs.water_level) push('Water level', attrs.water_level.replace(/_/g, ' '));

        const kids = props.children || {};
        if (kids.light) {
            const light = kids.light;
            const numbered = Object.keys(light).filter(k => /^\d+:/.test(k));
            if (numbered.length > 0) {
                const groups: Record<string, any> = {};
                numbered.forEach(k => {
                    const [n, field] = k.split(':');
                    groups[n] = groups[n] || {};
                    groups[n][field] = light[k];
                });
                Object.keys(groups).sort((a, b) => +a - +b).forEach(n => {
                    html += lightSectorRow(groups[n]);
                });
            } else {
                html += lightSectorRow(light);
            }
            if (light.reference) push('Light ref.', light.reference);
        }

        ['fog_signal', 'radio_station', 'topmark'].forEach(k => {
            if (kids[k]) {
                const v = Object.entries(kids[k]).map(([f, val]) => `${f}: ${val}`).join(', ');
                push(typeLabel(k), v);
            }
        });

        const common = props.common || {};
        Object.entries(common).forEach(([k, v]) => {
            if (k === 'type' || k === 'name') return;
            push(typeLabel(k), String(v).replace(/_/g, ' '));
        });

        if (lat !== undefined && lon !== undefined) {
            push('Position', `${formatDMS(lat, 'NS')} — ${formatDMS(lon, 'EW')}`);
        }

        html += rows.join('') + '</div>';
        return html;
    }

    function lightSectorRow(l: any): string {
        const char = l.character ? (LIGHT_CHARACTERS[l.character] || l.character) : null;
        const parts = [];
        if (l.colour) parts.push(`<span style="color:${firstColor(l.colour)};font-weight:bold">${l.colour}</span>`);
        if (char) parts.push(char + (l.group ? ` (${l.group})` : ''));
        if (l.period) parts.push(`period ${l.period}s`);
        if (l.range) parts.push(`range ${l.range} NM`);
        if (l.height) parts.push(`ht ${l.height} m`);
        if (l.sector_start !== undefined && l.sector_end !== undefined) {
            parts.push(`sector ${l.sector_start}°–${l.sector_end}°`);
        }
        return `<div class="nt-pop-row">💡 ${parts.join(' · ')}</div>`;
    }

    // ── ECDIS-style point icons (simplified IALA symbology) ─────
    function buildSeamarkIcon(props: any): { html: string, size: number } | null {
        const typ   = props.seamark_type || '';
        const attrs = typeAttrs(props);
        const kids  = props.children || {};
        const size  = 24;

        const svg = (inner: string, vb = 40) =>
            `<svg viewBox="0 0 ${vb} ${vb}" width="${size}" height="${size}" style="overflow:visible">${inner}</svg>`;
        const pole = `<line x1="20" y1="40" x2="20" y2="10" stroke="#555" stroke-width="2"/>`;

        if (typ.startsWith('buoy_lateral') || typ.startsWith('beacon_lateral')) {
            const cat = (attrs.category || '').toLowerCase();
            const col = cat === 'port' ? SEAMARK_COLORS.red
                      : cat === 'starboard' ? SEAMARK_COLORS.green
                      : firstColor(attrs.colour);
            const shape = cat === 'starboard'
                ? `<polygon points="20,6 29,32 11,32" fill="${col}" stroke="#000" stroke-width="1"/>`
                : `<rect x="11" y="10" width="18" height="22" fill="${col}" stroke="#000" stroke-width="1"/>`;
            // White halo behind the shape so red/green reads clearly over any
            // basemap colour, and pops at a glance without needing a click.
            const halo = `<circle cx="20" cy="20" r="15" fill="#fff" opacity="0.9"/>`;
            return { html: svg(pole + halo + shape), size };
        }

        if (typ.includes('cardinal')) {
            const cat = (attrs.category || '').toLowerCase();
            const bandTop = cat === 'south' || cat === 'west' ? SEAMARK_COLORS.yellow : SEAMARK_COLORS.black;
            const bandBot = cat === 'south' ? SEAMARK_COLORS.black
                          : cat === 'north' || cat === 'west' ? SEAMARK_COLORS.yellow
                          : SEAMARK_COLORS.black;
            const bandMid = (cat === 'east') ? SEAMARK_COLORS.yellow : SEAMARK_COLORS.black;;
            const body = bandMid
                ? `<rect x="12" y="10" width="16" height="8" fill="${bandTop}"/>
                   <rect x="12" y="18" width="16" height="6" fill="${bandMid}"/>
                   <rect x="12" y="24" width="16" height="8" fill="${bandBot}"/>`
                : `<rect x="12" y="10" width="16" height="11" fill="${bandTop}"/>
                   <rect x="12" y="21" width="16" height="11" fill="${bandBot}"/>`;
            const tri = (cy: number, up: boolean) => up
                ? `<polygon points="20,${cy - 4} 16,${cy + 4} 24,${cy + 4}" fill="#000"/>`
                : `<polygon points="20,${cy + 4} 16,${cy - 4} 24,${cy - 4}" fill="#000"/>`;
            let topmark = '';
            let dirLetter = '?';
            let dirColor = SEAMARK_COLORS.grey;
            if (cat === 'north')      { topmark = tri(2, true)  + tri(6, true);  dirLetter = 'N'; dirColor = '#00bcd4'; }
            else if (cat === 'south') { topmark = tri(2, false) + tri(6, false); dirLetter = 'S'; dirColor = '#e91e8c'; }
            else if (cat === 'east')  { topmark = tri(2, true)  + tri(8, false); dirLetter = 'E'; dirColor = '#f39c12'; }
            else if (cat === 'west')  { topmark = tri(2, false) + tri(8, true);  dirLetter = 'W'; dirColor = '#8e44ad'; }
            // Coloured halo (non-standard, purely for at-a-glance ID) plus a
            // bold N/E/S/W letter — the black/yellow band pattern alone is
            // easy to misread at small sizes (N vs S, E vs W are mirror
            // images of each other).
            const halo = cat ? `<circle cx="20" cy="20" r="16" fill="${dirColor}" opacity="0.35"/>` : '';
            const label = cat ? `<text x="20" y="9" font-size="9" font-weight="bold" text-anchor="middle" fill="${dirColor}" stroke="#000" stroke-width="0.4">${dirLetter}</text>` : '';
            return { html: svg(pole + halo + body + topmark + label), size };
        }

        if (typ.includes('isolated_danger')) {
            const body = `<rect x="12" y="10" width="16" height="10" fill="#161616"/>
                           <rect x="12" y="20" width="16" height="6" fill="#e0302a"/>
                           <rect x="12" y="26" width="16" height="6" fill="#161616"/>`;
            const topmark = `<circle cx="20" cy="4" r="3.5" fill="#161616"/><circle cx="20" cy="8" r="3.5" fill="#161616"/>`;
            return { html: svg(pole + body + topmark), size };
        }

        if (typ.includes('safe_water')) {
            const body = `<rect x="12" y="10" width="4" height="22" fill="#e0302a"/>
                           <rect x="16" y="10" width="4" height="22" fill="#ffffff"/>
                           <rect x="20" y="10" width="4" height="22" fill="#e0302a"/>
                           <rect x="24" y="10" width="4" height="22" fill="#ffffff"/>`;
            const topmark = `<circle cx="20" cy="5" r="4" fill="#e0302a"/>`;
            return { html: svg(pole + body + topmark), size };
        }

        if (typ.includes('special_purpose')) {
            const body = `<rect x="11" y="10" width="18" height="22" fill="${SEAMARK_COLORS.yellow}" stroke="#000" stroke-width="1"/>`;
            const topmark = `<line x1="15" y1="2" x2="25" y2="10" stroke="#000" stroke-width="2.5"/>
                              <line x1="25" y1="2" x2="15" y2="10" stroke="#000" stroke-width="2.5"/>`;
            return { html: svg(pole + body + topmark), size };
        }

        if (typ.startsWith('light_major') || typ.startsWith('light_minor')) {
            return buildLightIcon(kids.light);
        }

        if (typ === 'rock') {
            const wl = (attrs.water_level || '').toLowerCase();
            const col = wl === 'always_dry' ? '#161616' : '#7b3f00';
            return { html: svg(`<text x="20" y="26" font-size="22" text-anchor="middle" fill="${col}">✳</text>`), size: 16 };
        }

        if (typ.includes('wreck')) {
            const col = (attrs.category || '').includes('dangerous') ? '#e0302a' : '#7b1f1f';
            return { html: svg(`<line x1="10" y1="10" x2="30" y2="30" stroke="${col}" stroke-width="3"/>
                                 <line x1="30" y1="10" x2="10" y2="30" stroke="${col}" stroke-width="3"/>
                                 <circle cx="20" cy="20" r="15" fill="none" stroke="${col}" stroke-width="1.5" stroke-dasharray="3,2"/>`), size: 18 };
        }

        if (typ.includes('obstruction')) {
            return { html: svg(`<circle cx="20" cy="20" r="13" fill="none" stroke="#e67e22" stroke-width="2" stroke-dasharray="4,3"/>`), size: 16 };
        }

        if (typ === 'anchorage' || typ === 'anchor_berth' || typ === 'small_craft_facility') {
            return { html: svg(`<circle cx="20" cy="20" r="14" fill="none" stroke="#2d7dd2" stroke-width="2"/>
                                 <circle cx="20" cy="12" r="2.5" fill="#2d7dd2"/>
                                 <line x1="20" y1="14" x2="20" y2="28" stroke="#2d7dd2" stroke-width="2"/>
                                 <path d="M10 24 Q20 34 30 24" fill="none" stroke="#2d7dd2" stroke-width="2"/>`), size: 18 };
        }

        if (typ === 'marine_farm') {
            return { html: svg(`<rect x="8" y="8" width="24" height="24" fill="none" stroke="#1fa34a" stroke-width="2"/>
                                 <line x1="8" y1="16" x2="32" y2="16" stroke="#1fa34a" stroke-width="1"/>
                                 <line x1="8" y1="24" x2="32" y2="24" stroke="#1fa34a" stroke-width="1"/>`), size: 16 };
        }

        if (typ === 'offshore_platform') {
            return { html: svg(`<rect x="10" y="10" width="20" height="20" fill="#95a5a6" stroke="#000" stroke-width="1"/>
                                 <circle cx="20" cy="20" r="3" fill="#e67e22"/>`), size: 16 };
        }

        if (typ.includes('cable_submarine') || typ.includes('pipeline_submarine')) {
            return { html: svg(`<circle cx="20" cy="20" r="4" fill="#555"/>`), size: 10 };
        }

        if (typ === 'harbour') {
            return { html: svg(`<circle cx="20" cy="20" r="14" fill="#2d7dd2" opacity="0.85"/>
                                 <path d="M20 10 L20 26 M14 20 Q20 28 26 20" fill="none" stroke="#fff" stroke-width="2"/>`), size: 18 };
        }

        if (typ === 'landmark') {
            return { html: svg(`<polygon points="20,8 30,32 10,32" fill="none" stroke="#161616" stroke-width="2"/>`), size: 16 };
        }

        if (typ === 'berth') {
            return { html: svg(`<rect x="10" y="10" width="20" height="20" fill="none" stroke="#2d7dd2" stroke-width="2"/>`), size: 12 };
        }

        if (typ === 'mooring') {
            return { html: svg(`<circle cx="20" cy="20" r="8" fill="none" stroke="#161616" stroke-width="2"/>`), size: 12 };
        }

        if (typ === 'crane') {
            return { html: svg(`<line x1="14" y1="34" x2="14" y2="8" stroke="#555" stroke-width="2"/>
                                 <line x1="14" y1="8" x2="30" y2="16" stroke="#555" stroke-width="2"/>
                                 <line x1="30" y1="16" x2="30" y2="22" stroke="#555" stroke-width="1.5"/>`), size: 16 };
        }

        if (typ === 'rescue_station' || typ === 'coastguard_station') {
            return { html: svg(`<circle cx="20" cy="20" r="12" fill="#e0302a"/><circle cx="20" cy="20" r="6" fill="#fff"/>
                                 <line x1="20" y1="8" x2="20" y2="14" stroke="#fff" stroke-width="2"/>
                                 <line x1="20" y1="26" x2="20" y2="32" stroke="#fff" stroke-width="2"/>`), size: 16 };
        }

        if (typ === 'daymark') {
            return { html: svg(`<polygon points="20,8 30,20 20,32 10,20" fill="none" stroke="#161616" stroke-width="2"/>`), size: 14 };
        }

        if (typ === 'virtual_aton') {
            return { html: svg(`<polygon points="20,6 30,20 20,34 10,20" fill="none" stroke="#c2185b" stroke-width="2" stroke-dasharray="3,2"/>`), size: 16 };
        }

        if (typ === 'building' || typ === 'tank' || typ === 'pontoon') {
            return { html: svg(`<rect x="11" y="14" width="18" height="16" fill="#95a5a6" stroke="#000" stroke-width="1"/>`), size: 12 };
        }

        if (typ === 'pile') {
            return { html: svg(`<circle cx="20" cy="20" r="3" fill="#161616"/>`), size: 8 };
        }

        if (typ === 'gate') {
            return { html: svg(`<line x1="10" y1="20" x2="16" y2="20" stroke="#555" stroke-width="3"/>
                                 <line x1="24" y1="20" x2="30" y2="20" stroke="#555" stroke-width="3"/>`), size: 12 };
        }

        // generic fallback (covers any unhandled point type)
        return { html: svg(`<circle cx="20" cy="20" r="6" fill="#95a5a6" stroke="#000" stroke-width="1"/>`), size: 12 };
    }

    // Light sectors drawn like an OpenCPN/ECDIS light-sector rosette:
    // colour wedges for each sector, a solid dot for all-round lights.
    function buildLightIcon(light: any): { html: string, size: number } {
        const size = 64;
        const cx = 32, cy = 32, r = 24;

        const toXY = (deg: number, radius: number) => {
            const rad = deg * Math.PI / 180;
            return [cx + radius * Math.sin(rad), cy - radius * Math.cos(rad)];
        };

        let sectors: any[] = [];
        if (light) {
            const numbered = Object.keys(light).filter(k => /^\d+:/.test(k));
            if (numbered.length > 0) {
                const groups: Record<string, any> = {};
                numbered.forEach(k => {
                    const [n, field] = k.split(':');
                    groups[n] = groups[n] || {};
                    groups[n][field] = light[k];
                });
                sectors = Object.values(groups);
            } else {
                sectors = [light];
            }
        }

        let wedges = '';
        sectors.forEach(s => {
            const col = firstColor(s.colour) === '#888888' ? '#f1c40f' : firstColor(s.colour);
            if (s.sector_start !== undefined && s.sector_end !== undefined) {
                const start = (parseFloat(s.sector_start) + 180) % 360, end = (parseFloat(s.sector_end) + 180) % 360;
                const sweep = ((end - start + 360) % 360) || 360;
                const largeArc = sweep > 180 ? 1 : 0;
                const [x1, y1] = toXY(start, r);
                const [x2, y2] = toXY(end, r);
                wedges += `<path d="M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${col}" opacity="0.55" stroke="${col}" stroke-width="1"/>`;
            } else {
                wedges += `<circle cx="${cx}" cy="${cy}" r="9" fill="${col}" opacity="0.85" stroke="#000" stroke-width="1"/>`;
            }
        });

        const html = `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="overflow:visible">
            ${wedges}
            <circle cx="${cx}" cy="${cy}" r="4.5" fill="#fff" stroke="#000" stroke-width="1.5"/>
        </svg>`;

        return { html, size };
    }

    // ── area / line style (zones, lanes, tracks, cables…) ───────
    function styleForAreaType(typ: string): { color: string, fill?: string, weight: number, dash?: string, opacity: number } {
        const styles: Record<string, any> = {
            separation_zone:      { color: '#e67e22', fill: '#e67e22', weight: 1, opacity: 0.85 },
            separation_boundary:  { color: '#e67e22', weight: 2, dash: '6,4', opacity: 0.9 },
            separation_lane:      { color: '#e67e22', weight: 1, dash: '2,4', opacity: 0.6 },
            restricted_area:      { color: '#8e44ad', fill: '#8e44ad', weight: 2, dash: '4,3', opacity: 0.8 },
            recommended_track:    { color: '#1fa34a', weight: 2, dash: '8,4', opacity: 0.9 },
            navigation_line:      { color: '#333333', weight: 1, dash: '5,4', opacity: 0.8 },
            cable_submarine:      { color: '#555555', weight: 1, dash: '2,4', opacity: 0.7 },
            pipeline_submarine:   { color: '#8e44ad', weight: 1, dash: '2,4', opacity: 0.7 },
            fairway:              { color: '#2d7dd2', fill: '#2d7dd2', weight: 1, opacity: 0.4 },
            seabed_area:          { color: '#a97142', fill: '#a97142', weight: 1, opacity: 0.35 },
            shoreline_construction:{ color: '#a97142', weight: 2, opacity: 0.8 },
            marine_farm:          { color: '#1fa34a', fill: '#1fa34a', weight: 1, opacity: 0.4 },
            anchorage:            { color: '#2d7dd2', fill: '#2d7dd2', weight: 1, dash: '4,3', opacity: 0.4 },
        };
        return styles[typ] || { color: '#95a5a6', weight: 1, dash: '3,3', opacity: 0.6 };
    }

    function seamarkTooltipText(props: any): string {
        return props.name || typeLabel(props.seamark_type);
    }

    function renderSeamarks() {
        if (!seamarkLayer) return;
        seamarkLayer.clearLayers();

        seamarkFeatureCount = 0;
        if (!seamarksVisible || currentZoom < TILE_MIN_ZOOM || tooManyTilesForView) return;

        const zoom = currentZoom;
        const seen = new Set<number>();

        Object.values(tileCache).forEach((features: any[]) => {
            features.forEach(f => {
                const props = f.properties || {};
                if (seen.has(props.osm_id)) return; // dedupe across overlapping tiles
                seen.add(props.osm_id);

                const minZoom = props.min_zoom ?? 10;
                if (zoom < minZoom) return;

                const geom = f.geometry;
                if (!geom) return;

                if (geom.type === 'Point') {
                    const [lon, lat] = geom.coordinates;
                    const icon = buildSeamarkIcon(props);
                    if (!icon) return;
                    L.marker([lat, lon], {
                        icon: L.divIcon({ className: '', html: icon.html, iconSize: [icon.size, icon.size], iconAnchor: [icon.size / 2, icon.size / 2] })
                    }).addTo(seamarkLayer)
                      .bindTooltip(seamarkTooltipText(props), { direction: 'top' })
                      .bindPopup(buildPopupHtml(props, lat, lon));
                    seamarkFeatureCount++;
                } else if (geom.type === 'LineString') {
                    const latlngs = geom.coordinates.map(([lo, la]) => [la, lo]);
                    const style = styleForAreaType(props.seamark_type);
                    L.polyline(latlngs, {
                        color: style.color, weight: style.weight, opacity: style.opacity,
                        dashArray: style.dash
                    }).addTo(seamarkLayer).bindPopup(buildPopupHtml(props));
                    seamarkFeatureCount++;
                } else if (geom.type === 'Polygon') {
                    const latlngs = geom.coordinates[0].map(([lo, la]) => [la, lo]);
                    const style = styleForAreaType(props.seamark_type);
                    L.polygon(latlngs, {
                        color: style.color, fillColor: style.fill || style.color,
                        fillOpacity: style.fill ? style.opacity * 0.4 : 0,
                        weight: style.weight, opacity: style.opacity, dashArray: style.dash
                    }).addTo(seamarkLayer).bindPopup(buildPopupHtml(props));
                    seamarkFeatureCount++;
                }
            });
        });
    }

    // ─── MEASURING TOOLS (distance / true bearing) ──────────────
    // Uses Leaflet's own map 'click' event directly — simplest possible
    // wiring, and reliable since Leaflet already gives us the clicked
    // lat/lon (no manual container/rect math needed).
    let showmeasurePanel = false;
    let measureActive    = false;
    let measureLayer     = null;
    let measureStart: { lat: number, lon: number, marker: any } | null = null;
    let measurements: {
        id: number, distNM: number, brg: number,
        startLat: number, startLon: number, endLat: number, endLon: number,
        locked: 'start' | 'end', editing: boolean, layers: any[]
    }[] = [];

    function haversineNM(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 3440.065;
        const toRad = (d: number) => d * Math.PI / 180;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 +
                  Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    function initialBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const toRad = (d: number) => d * Math.PI / 180;
        const toDeg = (r: number) => r * 180 / Math.PI;
        const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
        const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
                  Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
        return (toDeg(Math.atan2(y, x)) + 360) % 360;
    }

    function destinationPoint(lat1: number, lon1: number, distNM: number, bearingDeg: number): { lat: number, lon: number } {
        const R = 3440.065;
        const toRad = (d: number) => d * Math.PI / 180;
        const toDeg = (r: number) => r * 180 / Math.PI;
        const delta = distNM / R;
        const theta = toRad(bearingDeg);
        const phi1 = toRad(lat1), lambda1 = toRad(lon1);

        const phi2 = Math.asin(Math.sin(phi1) * Math.cos(delta) + Math.cos(phi1) * Math.sin(delta) * Math.cos(theta));
        const lambda2 = lambda1 + Math.atan2(
            Math.sin(theta) * Math.sin(delta) * Math.cos(phi1),
            Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2)
        );

        return { lat: toDeg(phi2), lon: ((toDeg(lambda2) + 540) % 360) - 180 };
    }

    function drawMeasurement(m: any) {
        m.layers.forEach((l: any) => measureLayer.removeLayer(l));
        m.layers = [];

        const startMarker = L.circleMarker([m.startLat, m.startLon], {
            radius: 5, color: '#f1c40f', fillColor: '#f1c40f', fillOpacity: 1, weight: 2
        }).addTo(measureLayer).bindTooltip('A', { permanent: false });

        const endMarker = L.circleMarker([m.endLat, m.endLon], {
            radius: 5, color: '#f1c40f', fillColor: '#f1c40f', fillOpacity: 1, weight: 2
        }).addTo(measureLayer).bindTooltip('B', { permanent: false });

        const line = L.polyline(
            [[m.startLat, m.startLon], [m.endLat, m.endLon]],
            { color: '#f1c40f', weight: 2, dashArray: '6,4' }
        ).addTo(measureLayer);

        const midLat = (m.startLat + m.endLat) / 2;
        const midLon = (m.startLon + m.endLon) / 2;
        const label = L.marker([midLat, midLon], {
            icon: L.divIcon({
                className: '',
                html: `<div class="nt-measure-label">${m.distNM.toFixed(2)} NM / ${m.brg.toFixed(0)}°</div>`,
                iconSize: [0, 0]
            })
        }).addTo(measureLayer);

        m.layers = [startMarker, endMarker, line, label];
    }

    // Single Leaflet map click handler: first click sets the start point,
    // second click sets the end point and finalises the measurement.
    function onMapClickForMeasure(e: { latlng: { lat: number, lng: number } }) {
        const { lat, lng } = e.latlng;

        if (!measureStart) {
            const marker = L.circleMarker([lat, lng], {
                radius: 5, color: '#f1c40f', fillColor: '#f1c40f', fillOpacity: 1, weight: 2
            }).addTo(measureLayer);
            measureStart = { lat, lon: lng, marker };
            return;
        }

        measureLayer.removeLayer(measureStart.marker);

        const distNM = haversineNM(measureStart.lat, measureStart.lon, lat, lng);
        const brg    = initialBearing(measureStart.lat, measureStart.lon, lat, lng);

        const m = {
            id: Date.now() + Math.random(),
            distNM, brg,
            startLat: measureStart.lat, startLon: measureStart.lon,
            endLat: lat, endLon: lng,
            locked: 'start' as const, editing: false, layers: []
        };
        drawMeasurement(m);

        measurements = [...measurements, m];
        measureStart = null; // ready for the next pair of clicks
    }

    function onMeasureLatLonEdit(m: any) {
        m.distNM = haversineNM(m.startLat, m.startLon, m.endLat, m.endLon);
        m.brg    = initialBearing(m.startLat, m.startLon, m.endLat, m.endLon);
        drawMeasurement(m);
        measurements = [...measurements];
    }

    function onMeasureDistBrgEdit(m: any) {
        if (m.locked === 'start') {
            const dest = destinationPoint(m.startLat, m.startLon, m.distNM, m.brg);
            m.endLat = dest.lat; m.endLon = dest.lon;
        } else {
            const backBrg = (m.brg + 180) % 360;
            const dest = destinationPoint(m.endLat, m.endLon, m.distNM, backBrg);
            m.startLat = dest.lat; m.startLon = dest.lon;
        }
        drawMeasurement(m);
        measurements = [...measurements];
    }

    function toggleMeasure() {
        if (measureActive) {
            if (map.doubleClickZoom) map.doubleClickZoom.disable();
            map.on('click', onMapClickForMeasure);
        } else {
            if (map.doubleClickZoom) map.doubleClickZoom.enable();
            map.off('click', onMapClickForMeasure);
            if (measureStart) {
                measureStart.marker.remove();
                measureStart = null;
            }
        }
    }

function removeMeasurement(id: number) {
    const m = measurements.find(x => x.id === id);
    if (m) m.layers.forEach((l: any) => measureLayer.removeLayer(l));
    measurements = measurements.filter(x => x.id !== id);
}

function clearAllMeasurements() {
    measurements.forEach(m => m.layers.forEach((l: any) => measureLayer.removeLayer(l)));
    measurements = [];
    if (measureStart) {
        measureLayer.removeLayer(measureStart.marker);
        measureStart = null;
    }
}

    // ─── WEATHERSCORE (placeholder) ─────────────────────────────
    let showWSPanel = false;

    // ─── INIT / DESTROY ──────────────────────────────────────────
    let onViewChange: () => void;

    onMount(() => {
        unsubTime = store.on('timestamp', (ts: number) => {
            updateTimeDisplay(ts);
            updateBoatPosition(ts);
        });

        seamarkLayer = L.layerGroup().addTo(map);
        measureLayer = L.layerGroup().addTo(map);

        onViewChange = () => { loadVisibleTiles(); };

        if (typeof map.on === 'function') {
            map.on('zoomend', onViewChange);
            map.on('moveend', onViewChange);
        }
        onViewChange();
    });

    onDestroy(() => {
        unsubTime?.();
        routeLayers.forEach(l => l.remove());
        boatLayers.forEach(l => l.remove());
        barbLayers.forEach(l => l.remove());
        pointLayers.forEach(l => l.remove());
        tssLayer?.remove();
        seamarkLayer?.remove();
        measureLayer?.remove();

        if (typeof map.off === 'function') {
            map.off('zoomend', onViewChange);
            map.off('moveend', onViewChange);
        }
        map.off('click', onMapClickForMeasure);
        if (measureActive && map.doubleClickZoom) map.doubleClickZoom.enable();
    });

    export const onopen = () => {};
</script>

<style lang="less">
    .nt-panel {
        --nt-bg: #3c3c3c;
        --nt-bg-dark: #2e2e2e;
        --nt-bg-light: #4a4a4a;
        --nt-bg-lighter: #585858;
        --nt-border: #565656;
        --nt-accent: #3498db;

        position: fixed;
        bottom: 120px;
        left: 20px;
        width: 300px;
        background: rgba(60, 60, 60, 0.97);
        color: white;
        border-radius: 12px;
        padding: 15px;
        border: 1px solid var(--nt-border);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: var(--nt-bg-lighter) transparent;
        transition: all 0.3s ease;
        max-height: 80vh;
    }

    .nt-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: bold;
        border-bottom: 1px solid var(--nt-border);
        padding-bottom: 8px;
        margin-bottom: 12px;
    }
    .nt-header__icon { font-size: 18px; }
    .nt-header__title { flex: 1; margin-left: 8px; }

    .nt-header-actions {
        display: flex;
        gap: 8px;
        align-items: center;
    }

    .nt-btn-minimize {
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

    .nt-header__close {
        background: none;
        border: none;
        color: #e74c3c;
        cursor: pointer;
        font-size: 18px;
        padding: 0;
        transition: all 0.2s;
        &:hover { transform: scale(1.1); }
    }

    .nt-drop {
        border: 2px dashed var(--nt-bg-lighter);
        border-radius: 8px;
        padding: 20px;
        text-align: center;
        cursor: pointer;
        margin-bottom: 15px;
        transition: all 0.2s;
        &:hover, &--active {
            border-color: #3498db;
            background: var(--nt-bg-light);
        }
    }
    .nt-hint {
        display: block;
        font-size: 10px;
        color: #bbb;
        margin-top: 4px;
    }
    .nt-loading { color: #3498db; }

    .nt-info {
        background: var(--nt-bg-dark);
        padding: 10px;
        border-radius: 6px;
        margin-bottom: 15px;
    }

    .nt-time-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 3px 0;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        &:last-of-type { border-bottom: none; }
    }

    .nt-tz-label {
        font-size: 10px;
        color: #bbb;
    }

    .nt-tz-val {
        font-family: monospace;
        font-size: 11px;
        font-weight: bold;
    }

    .nt-tz-utc   { color: #3498db; }
    .nt-tz-local { color: #2ecc71; }
    .nt-tz-csv   { color: #e67e22; }

    .nt-tz-detected {
        font-size: 10px;
        color: #2ecc71;
        margin-top: 6px;
        padding: 4px 6px;
        background: rgba(46, 204, 113, 0.12);
        border-radius: 4px;
    }

    .nt-tz-warn {
        font-size: 10px;
        color: #f39c12;
        margin-top: 6px;
        padding: 4px 6px;
        background: rgba(243, 156, 18, 0.12);
        border-radius: 4px;
    }

    .nt-tz-controls {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid var(--nt-border);
    }

    .nt-tz-ctrl-label {
        font-size: 10px;
        color: #bbb;
        display: flex;
        flex-direction: column;
        gap: 3px;
        flex: 1;
    }

    .nt-offset-row {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        color: #ddd;
    }

    .nt-offset-input {
        background: var(--nt-bg-dark);
        border: 1px solid var(--nt-border);
        color: white;
        padding: 3px 6px;
        border-radius: 4px;
        font-size: 11px;
        width: 52px;
        text-align: center;
        &:focus { outline: none; border-color: #3498db; }
    }

    .nt-status {
        font-size: 12px;
        color: #2ecc71;
        margin-top: 8px;
    }

    .nt-route-card {
        background: var(--nt-bg-light);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 10px;
        border: 1px solid var(--nt-border);
    }

    .nt-route-header {
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

    .nt-route-name {
        flex: 1;
        font-weight: bold;
        font-size: 13px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .nt-btn-remove {
        background: rgba(231, 76, 60, 0.2);
        border: 1px solid #e74c3c;
        color: #e74c3c;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        &:hover { background: rgba(231, 76, 60, 0.4); }
    }

    .nt-btn-edit {
        background: rgba(52, 152, 219, 0.2);
        border: 1px solid #3498db;
        color: #3498db;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        &:hover { background: rgba(52, 152, 219, 0.4); }
    }

    .nt-color-picker {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-bottom: 8px;
        padding: 6px;
        background: var(--nt-bg-dark);
        border-radius: 6px;
        border: 1px solid var(--nt-border);
    }

    .nt-color-swatch {
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

    .nt-route-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }

    .nt-meta {
        font-size: 11px;
        color: #ccc;
    }

    .nt-select-format {
        background: var(--nt-bg-dark);
        border: 1px solid var(--nt-border);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        cursor: pointer;
        &:focus { outline: none; border-color: #3498db; }
        &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    .nt-barbs-options {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 8px;
        padding: 8px;
        background: var(--nt-bg-dark);
        border-radius: 6px;
    }

    .nt-checkbox {
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

    .nt-radio {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        cursor: pointer;
    }

    .nt-btn-fit {
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

    .nt-error {
        color: #e74c3c;
        font-size: 11px;
        background: rgba(231, 76, 60, 0.12);
        padding: 8px;
        border-radius: 6px;
        margin-top: 10px;
    }

    .nt-section {
        border: 1px solid var(--nt-border);
        border-radius: 8px;
        margin-bottom: 10px;
        overflow: hidden;
    }
    .nt-section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: rgba(52,152,219,0.14);
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
        user-select: none;
        &:hover { background: rgba(52,152,219,0.24); }
    }

    .nt-point-form {
        padding: 8px 10px;
    }
    .nt-point-row {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 6px;
    }
    .nt-point-label {
        font-size: 10px;
        color: #bbb;
        width: 22px;
        flex-shrink: 0;
    }
    .nt-point-input {
        background: var(--nt-bg-dark);
        border: 1px solid var(--nt-border);
        color: white;
        padding: 3px 5px;
        border-radius: 4px;
        font-size: 11px;
        width: 52px;
        text-align: center;
        &:focus { outline: none; border-color: #3498db; }
        -moz-appearance: textfield;
        &::-webkit-outer-spin-button,
        &::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    }
    .nt-point-sep {
        font-size: 13px;
        color: #ccc;
    }
    .nt-point-ns {
        background: var(--nt-bg-dark);
        border: 1px solid var(--nt-border);
        color: white;
        padding: 3px 4px;
        border-radius: 4px;
        font-size: 11px;
        cursor: pointer;
    }
    .nt-point-name-input {
        width: 100%;
        background: var(--nt-bg-dark);
        border: 1px solid var(--nt-border);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        margin-bottom: 4px;
        box-sizing: border-box;
        &:focus { outline: none; border-color: #3498db; }
    }

    .nt-measure-list {
        margin-top: 8px;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }
    .nt-measure-item {
        background: var(--nt-bg-dark);
        border-radius: 4px;
        padding: 6px 8px;
        font-size: 11px;
        font-family: monospace;
    }
    .nt-measure-item-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .nt-measure-item-actions {
        display: flex;
        gap: 4px;
    }
    .nt-measure-edit {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid var(--nt-border);
        display: flex;
        flex-direction: column;
        gap: 6px;
    }
    .nt-measure-lock-row {
        display: flex;
        gap: 12px;
    }
    .nt-measure-point-grid {
        display: grid;
        grid-template-columns: 1fr 60px 60px;
        gap: 4px;
        align-items: center;
    }
    .nt-measure-point-label {
        font-size: 10px;
        color: #bbb;
    }
    .nt-measure-coord-input {
        background: var(--nt-bg);
        border: 1px solid var(--nt-border);
        color: white;
        padding: 3px 4px;
        border-radius: 4px;
        font-size: 10px;
        width: 100%;
        box-sizing: border-box;
        &:focus { outline: none; border-color: #3498db; }
    }
    :global(.nt-measure-label) {
        background: rgba(46,46,46,0.92);
        color: #f1c40f;
        border: 1px solid #f1c40f;
        border-radius: 4px;
        padding: 2px 6px;
        font-size: 11px;
        font-weight: bold;
        white-space: nowrap;
        transform: translate(-50%, -50%);
    }

    :global(.nt-pop) {
        font-size: 12px;
        max-width: 240px;
    }
    :global(.nt-pop-img) {
        display: block;
        width: 100%;
        max-height: 160px;
        object-fit: cover;
        border-radius: 4px;
        margin-bottom: 6px;
    }
    :global(.nt-pop-title) {
        font-weight: bold;
        font-size: 13px;
        margin-bottom: 4px;
    }
    :global(.nt-pop-row) {
        margin: 2px 0;
    }
</style>
