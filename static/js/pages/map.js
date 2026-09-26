// ═══════════════════════════════════════════════════════════
// pages/map.js — نقشه‌ی گردشگری تعاملی
// ═══════════════════════════════════════════════════════════

import { faNum } from '../utils/index.js';

// ⭐ تابع کمکی برای گرفتن عنصر
const $id = (id) => document.getElementById(id);

/**
 * راه‌اندازی صفحه‌ی نقشه
 */
export function initMap() {
    // ⭐ اینجا اصلاح شد: getElementById
    const mapEl = document.getElementById('tourismMap');
    if (!mapEl || typeof L === 'undefined') return;

    const MAP_PLACES = window.MAP_PLACES || [];
    const TRIP_DATA = window.TRIP_DATA || null;
    const TRIP_MODE = window.TRIP_MODE || false;
    const IS_PLAN_MODE = window.IS_PLAN_MODE || false;
    const FAVORITE_IDS = window.FAVORITE_IDS || [];

    const ORD = ['اول', 'دوم', 'سوم', 'چهارم', 'پنجم', 'ششم', 'هفتم'];

    const DAY_COLORS = [
        '#2a9d8f', '#e9a23b', '#e76f51', '#6a994e',
        '#457b9d', '#c17c74', '#8e7cc3',
    ];
    const getDayColor = dayNumber => DAY_COLORS[(dayNumber - 1) % DAY_COLORS.length];

    // ═══ Toast ═══
    const toast = $id('toast');
    function showToast(msg) {
        if (!toast) return;
        const msgEl = $id('toastMsg');
        if (msgEl) msgEl.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2200);
    }

    // ═══ دسته‌بندی‌ها ═══
    const CAT_META = {};
    MAP_PLACES.forEach(p => {
        const catName = p.parent_cat || p.cat || 'سایر';
        if (!CAT_META[catName]) {
            CAT_META[catName] = { color: p.color || '#118b71', count: 0 };
        }
        CAT_META[catName].count++;
    });

    // ═══ State ═══
    let activeCats = new Set();
    let freeOnly = false, childOnly = false, favsOnly = false;
    let query = '';
    let favs = new Set(FAVORITE_IDS || []);
    let activeRoute = null;
    let routeEnabled = true;
    let activeDay = 'all';
    let daysArray = [];
    let tripPlaces = [];

    // ═══ نقشه ═══
    const map = L.map('tourismMap', {
        zoomControl: false,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        touchZoom: true
    });

    const MAPTILER_API_KEY = 'HJ7dofOgoJi2TfcV7XkF';
    const layers = {
        street: L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap', maxZoom: 19
        }),
        sat: L.tileLayer(`https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`, {
            attribution: '&copy; MapTiler', maxZoom: 19
        }),
        terrain: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenTopoMap', maxZoom: 17
        }),
        dark: L.tileLayer(`https://api.maptiler.com/maps/dark/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`, {
            attribution: '&copy; MapTiler', maxZoom: 19
        })
    };
    let currentLayer = 'street';
    layers.street.addTo(map);

    // ═══ Clustering ═══
    const clusterGroup = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        animate: true,
        animateAddingMarkers: true,
        iconCreateFunction: function (cluster) {
            const count = cluster.getChildCount();
            const size = count < 10 ? 34 : count < 50 ? 40 : 46;
            const fontSize = count < 10 ? 12 : count < 50 ? 13 : 14;

            return L.divIcon({
                html: `<div class="custom-cluster-inner" style="width:${size}px; height:${size}px;">
                    <span class="custom-cluster-num" style="font-size:${fontSize}px;">${faNum(count)}</span>
                </div>`,
                className: 'custom-cluster',
                iconSize: L.point(size, size),
                iconAnchor: L.point(size / 2, size / 2)
            });
        }
    });

    map.addLayer(clusterGroup);

    // ═══ Trip Mode: گروه‌بندی روزها ═══
    if (TRIP_MODE && TRIP_DATA) {
        const daysMap = {};
        TRIP_DATA.suggested_places.forEach(sp => {
            const p = MAP_PLACES.find(x => x.id === sp.id);
            if (p) {
                const pCopy = Object.assign({}, p, { day: sp.day });
                if (!daysMap[sp.day]) daysMap[sp.day] = [];
                daysMap[sp.day].push(pCopy);
                tripPlaces.push(pCopy);
            }
        });
        daysArray = Object.keys(daysMap).sort((a, b) => +a - +b).map(k => daysMap[k]);
    }

    const markers = new Map();

    // ═══ Pin Icon ═══
    function pinIcon(p, num, color) {
        const pinColor = color || '#118b71';
        return L.divIcon({
            className: 'pin-wrap',
            html: `<div class="pin" style="--c: ${pinColor};"><span>${num ? faNum(num) : ''}</span></div>
                   <div class="pin-label">${p.name}</div>`,
            iconSize: [26, 40],
            iconAnchor: [13, 30],
            popupAnchor: [0, -30]
        });
    }

    // ═══ Popup ═══
    function popupHtml(p, badgeText, badgeColor) {
        const badgeStyle = badgeColor ? `background:${badgeColor}; color:#fff;` : '';
        return `<div class="map-pop">
            <div class="map-pop-img">
                <img src="${p.image}" alt="${p.name}" onerror="this.parentNode.style.background='linear-gradient(135deg,#dff0ea,#cfe6dd)'">
                ${badgeText ? `<span class="map-pop-badge" style="${badgeStyle}">${badgeText}</span>` : ''}
            </div>
            <div class="map-pop-body">
                <h4>${p.name}</h4>
                <div class="map-pop-loc"><i class="fas fa-map-marker-alt"></i> دزفول</div>
                <p>${p.desc || p.short_description || ''}</p>
            </div>
        </div>`;
    }

    // ═══ محاسبه فاصله ═══
    function calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // ═══ Nearest Neighbor ═══
    function nearestNeighbor(places) {
        if (places.length <= 2) return [...places];

        const unvisited = [...places];
        const ordered = [];

        let current = unvisited.shift();
        ordered.push(current);

        while (unvisited.length > 0) {
            let nearestIdx = 0;
            let nearestDist = Infinity;

            for (let i = 0; i < unvisited.length; i++) {
                const dist = calculateDistance(current.lat, current.lng, unvisited[i].lat, unvisited[i].lng);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestIdx = i;
                }
            }

            current = unvisited.splice(nearestIdx, 1)[0];
            ordered.push(current);
        }

        return ordered;
    }

    // ═══ رسم مسیر ═══
    function drawRoute(placesList, color) {
        if (activeRoute) {
            map.removeControl(activeRoute);
            activeRoute = null;
        }

        if (!routeEnabled) return;
        if (!placesList || placesList.length < 2) return;

        const orderedPlaces = nearestNeighbor(placesList);
        const waypoints = orderedPlaces.map(p => L.latLng(p.lat, p.lng));
        const routeColor = color || '#118b71';

        try {
            activeRoute = L.Routing.control({
                waypoints: waypoints,
                routeWhileDragging: false,
                addWaypoints: false,
                fitSelectedRoutes: false,
                show: false,
                lineOptions: {
                    styles: [{ color: routeColor, weight: 5, opacity: 0.85, dashArray: '8, 8' }],
                    extendToWaypoints: true,
                    missingRouteTolerance: 0
                },
                createMarker: function () { return null; },
                router: L.Routing.osrmv1({
                    serviceUrl: 'https://router.project-osrm.org/route/v1',
                    profile: 'driving'
                })
            }).addTo(map);
        } catch (err) {
            console.error('❌ خطا در مسیریابی:', err);
        }
    }

    function clearRoute() {
        if (activeRoute) {
            map.removeControl(activeRoute);
            activeRoute = null;
        }
    }

    // ═══ Card HTML ═══
    function faTime(m) {
        return `${faNum(Math.floor(m / 60))}:${faNum(String(m % 60).padStart(2, '0'))}`;
    }

    function cardHtml(p, idx, dayIdx) {
        return `<div class="place-row">
            <span class="place-num">${faNum(idx + 1)}</span>
            <div class="place-card" data-id="${p.id}">
                <img class="pc-img" src="${p.image}" alt="${p.name}" onerror="this.style.background='linear-gradient(135deg,#dff0ea,#cfe6dd)'">
                <div class="pc-info">
                    <h4>${p.name}</h4>
                    <div class="pc-time">🕒 ${faTime(9 * 60 + idx * 60)} تا ${faTime(10 * 60 + idx * 60)}</div>
                    <div class="pc-meta">
                        <span>🏷️ ${p.cat || p.category || ''}</span>
                        <span>💰 ${p.cost === 0 ? 'رایگان' : faNum(p.cost.toLocaleString()) + ' تومان'}</span>
                    </div>
                </div>
            </div>
        </div>`;
    }

    // ═══ Render Trip List ═══
    function renderTripList() {
        const list = $id('mapList');
        const tabs = $id('plannerTabs');
        if (!list || !tabs) return;

        tabs.style.display = 'flex';
        const qf = $id('quickFiltersSection');
        if (qf) qf.style.display = 'none';
        const et = $id('extraTogglesSection');
        if (et) et.style.display = 'none';
        const sb = $id('searchBox');
        if (sb) sb.style.display = 'none';

        tabs.innerHTML =
            `<button class="ptab ${activeDay === 'all' ? 'active' : ''}" data-tab="all">
                <span class="t">نمای کلی</span>
                <span class="s">همه روزها</span>
            </button>` +
            daysArray.map((d, i) => `
                <button class="ptab ${activeDay !== 'all' && +activeDay === i ? 'active' : ''}" data-tab="${i}">
                    <span class="t">روز ${ORD[i] || faNum(i + 1)}</span>
                    <span class="s">${faNum(d.length)} جاذبه</span>
                </button>`).join('');

        if (activeDay === 'all') {
            list.innerHTML = daysArray.map((d, i) => `
                <div class="day-group">
                    <div class="day-group-title">روز ${faNum(i + 1)} <span>${faNum(d.length)} جاذبه</span></div>
                    ${d.map((p, idx) => cardHtml(p, idx, i)).join('')}
                </div>`).join('');
        } else {
            const i = +activeDay;
            list.innerHTML = `
                <div class="day-group">
                    <div class="day-group-title">روز ${faNum(i + 1)} <span>${faNum(daysArray[i].length)} جاذبه</span></div>
                    ${daysArray[i].map((p, idx) => cardHtml(p, idx, i)).join('')}
                </div>`;
        }

        const visibleCount = activeDay === 'all' ? tripPlaces.length : daysArray[+activeDay].length;
        const rc = $id('resultCount');
        if (rc) {
            rc.innerHTML = `
                <span><i class="fas fa-route"></i> ${faNum(visibleCount)} جاذبه</span>
                <span>${faNum(tripPlaces.filter(p => p.cost === 0).length)} رایگان</span>`;
        }

        list.querySelectorAll('.place-card').forEach(card => {
            card.addEventListener('click', () => highlightItem(+card.dataset.id));
        });
    }

    // ═══ Render Default List ═══
    function renderDefaultList(places) {
        const list = $id('mapList');
        if (!list) return;

        const tabs = $id('plannerTabs');
        if (tabs) tabs.style.display = 'none';
        const qf = $id('quickFiltersSection');
        if (qf) qf.style.display = 'block';
        const et = $id('extraTogglesSection');
        if (et) et.style.display = 'flex';
        const sb = $id('searchBox');
        if (sb) sb.style.display = 'block';

        if (!places.length) {
            list.innerHTML = `<div class="empty-list">
                <i class="fas fa-search"></i>
                <p>جاذبه‌ای با این فیلترها پیدا نشد</p>
            </div>`;
            const rc = $id('resultCount');
            if (rc) rc.innerHTML = `<span>۰ جاذبه</span>`;
            return;
        }

        list.innerHTML = places.map((p, idx) => `
            <div class="place-row">
                <span class="place-num">${faNum(idx + 1)}</span>
                <div class="place-card" data-id="${p.id}">
                    <img class="pc-img" src="${p.image}" alt="${p.name}" onerror="this.style.background='linear-gradient(135deg,#dff0ea,#cfe6dd)'">
                    <div class="pc-info">
                        <h4>${p.name}</h4>
                        <div class="pc-time">🕒 ${faNum(9)}:۰۰ تا ${faNum(10)}:۳۰</div>
                        <div class="pc-meta">
                            <span><i class="fas fa-tag" style="color:${p.color || '#118b71'};"></i> ${p.cat || p.category || ''}</span>
                            <span>💰 ${p.cost === 0 ? 'رایگان' : faNum(p.cost.toLocaleString()) + ' تومان'}</span>
                        </div>
                    </div>
                </div>
            </div>`).join('');

        const rc = $id('resultCount');
        if (rc) {
            rc.innerHTML = `
                <span><i class="fas fa-map-marker-alt"></i> ${faNum(places.length)} جاذبه از ${faNum(MAP_PLACES.length)}</span>
                <span>${faNum(places.filter(p => p.cost === 0).length)} رایگان</span>`;
        }

        list.querySelectorAll('.place-card').forEach(card => {
            card.addEventListener('click', () => highlightItem(+card.dataset.id));
        });
    }

    // ═══ Draw Map ═══
    function drawMap() {
        markers.forEach(m => clusterGroup.removeLayer(m));
        markers.clear();
        clusterGroup.clearLayers();
        clearRoute();

        const allPoints = [];
        let placesToDraw = [];

        if (TRIP_MODE && TRIP_DATA) {
            if (activeDay === 'all') {
                daysArray.forEach((d, i) => {
                    const dayNum = i + 1;
                    const color = getDayColor(dayNum);
                    d.forEach((p, idx) => {
                        placesToDraw.push({ p, num: idx + 1, day: dayNum, color });
                    });
                });
            } else {
                const i = +activeDay;
                const dayNum = i + 1;
                const color = getDayColor(dayNum);
                daysArray[i].forEach((p, idx) => {
                    placesToDraw.push({ p, num: idx + 1, day: dayNum, color });
                });
            }
        } else {
            const visible = getFilteredPlaces();
            visible.forEach((p, idx) => {
                const catName = p.parent_cat || p.cat || '';
                const catColor = (CAT_META[catName] && CAT_META[catName].color) || p.color || '#118b71';
                placesToDraw.push({
                    p, num: idx + 1, day: null, color: catColor,
                    badgeText: p.cat || '', badgeColor: catColor
                });
            });
        }

        placesToDraw.forEach(({ p, num, day, color, badgeText, badgeColor }) => {
            const badge = TRIP_MODE ? `روز ${faNum(day)}` : badgeText;
            const badgeCol = TRIP_MODE ? color : badgeColor;

            const m = L.marker([p.lat, p.lng], {
                icon: pinIcon(p, num, color)
            }).bindPopup(popupHtml(p, badge, badgeCol));

            clusterGroup.addLayer(m);
            markers.set(p.id, m);
            allPoints.push([p.lat, p.lng]);
        });

        if (TRIP_MODE && TRIP_DATA && activeDay !== 'all') {
            const i = +activeDay;
            drawRoute(daysArray[i], getDayColor(i + 1));
        }

        if (allPoints.length) {
            map.fitBounds(L.latLngBounds(allPoints), { padding: [80, 80], maxZoom: 14 });
        }
    }

    // ═══ Highlight ═══
    function highlightItem(id) {
        document.querySelectorAll('.place-card').forEach(el => {
            el.classList.toggle('active', +el.dataset.id === id);
        });
        const el = document.querySelector(`.place-card[data-id="${id}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        const m = markers.get(id);
        if (m) {
            clusterGroup.zoomToShowLayer(m, () => {
                m.openPopup();
            });
        }
    }

    // ═══ Filter ═══
    function getFilteredPlaces() {
        const q = query.trim();
        return MAP_PLACES.filter(p => {
            const catName = p.parent_cat || p.cat || '';
            if (activeCats.size > 0 && !activeCats.has(catName)) return false;
            if (freeOnly && p.cost !== 0) return false;
            if (childOnly && !p.child) return false;
            if (favsOnly && !favs.has(p.id)) return false;
            if (q && !(p.name.includes(q) || (p.desc || '').includes(q) || (p.sub || '').includes(q) || (p.cat || '').includes(q))) return false;
            return true;
        });
    }

    // ═══ Chips ═══
    function buildChips() {
        const chips = $id('qfChips');
        if (!chips) return;

        const cats = Object.entries(CAT_META)
            .filter(([_, meta]) => meta.count > 0)
            .sort((a, b) => b[1].count - a[1].count);

        chips.innerHTML = cats.map(([cat, meta]) => `
            <button class="qf-chip" data-cat="${cat}">
                <span class="chip-dot" style="background:${meta.color}"></span>${cat}
                <span class="chip-num">${faNum(meta.count)}</span>
            </button>
        `).join('');

        chips.querySelectorAll('.qf-chip').forEach(ch => ch.addEventListener('click', () => {
            const c = ch.dataset.cat;
            activeCats.has(c) ? activeCats.delete(c) : activeCats.add(c);
            ch.classList.toggle('active');
            updateQfActiveCount();
            applyFilters();
        }));
    }

    function updateQfActiveCount() {
        const count = activeCats.size;
        const el = $id('qfActiveCount');
        if (el) el.textContent = count > 0 ? faNum(count) : '';
    }

    function applyFilters() {
        if (TRIP_MODE && TRIP_DATA) return;
        const visible = getFilteredPlaces();
        renderDefaultList(visible);
        drawMap();
    }

    // ═══ Map Day Chips ═══
    function buildMapDayChips() {
        const container = $id('mapDayChips');
        if (!container) return;

        if (!TRIP_MODE || !TRIP_DATA || daysArray.length === 0) {
            container.classList.remove('show');
            container.style.display = 'none';
            return;
        }

        container.innerHTML = '';

        const allBtn = document.createElement('button');
        allBtn.className = 'map-chip' + (activeDay === 'all' ? ' active' : '');
        allBtn.textContent = 'همه';
        allBtn.addEventListener('click', () => {
            activeDay = 'all';
            renderTripList();
            drawMap();
            buildMapDayChips();
        });
        container.appendChild(allBtn);

        daysArray.forEach((d, i) => {
            const dayBtn = document.createElement('button');
            dayBtn.className = 'map-chip' + (activeDay !== 'all' && +activeDay === i ? ' active' : '');
            dayBtn.textContent = `روز ${faNum(i + 1)}`;
            dayBtn.addEventListener('click', () => {
                activeDay = i;
                renderTripList();
                drawMap();
                buildMapDayChips();
            });
            container.appendChild(dayBtn);
        });

        container.style.display = 'flex';
        container.classList.add('show');
    }

    // ═══ Legend ═══
    function buildLegend() {
        const legend = $id('mapLegend');
        const body = $id('legendBody');
        if (!legend || !body) return;

        if (TRIP_MODE && TRIP_DATA) {
            legend.style.display = 'none';
            return;
        }

        legend.style.display = '';
        const cats = Object.entries(CAT_META)
            .filter(([_, meta]) => meta.count > 0)
            .sort((a, b) => b[1].count - a[1].count);

        body.innerHTML = cats.map(([cat, meta]) =>
            `<div class="legend-item">
                <span class="legend-dot" style="background:${meta.color}"></span>
                <span>${cat}</span>
                <span style="margin-right:auto; color:#8b7355; font-size:10px;">${faNum(meta.count)}</span>
            </div>`
        ).join('');
    }

    // ═══ Event: Tabs ═══
    document.addEventListener('click', e => {
        const t = e.target.closest('[data-tab]');
        if (t && t.closest('#plannerTabs')) {
            activeDay = t.dataset.tab === 'all' ? 'all' : parseInt(t.dataset.tab, 10);
            renderTripList();
            drawMap();
            buildMapDayChips();
        }
    });

    // ═══ Event: Quick Filters Header ═══
    const qfHeader = $id('qfHeader');
    qfHeader?.addEventListener('click', () => {
        const section = $id('quickFiltersSection');
        const body = $id('qfBody');
        section?.classList.toggle('open');
        body?.classList.toggle('open');
    });

    // ═══ Event: Search ═══
    const sugBox = $id('searchSug');
    let searchT;
    const mapSearch = $id('mapSearch');
    mapSearch?.addEventListener('input', e => {
        clearTimeout(searchT);
        const q = e.target.value.trim();
        query = q;
        if (!q) { sugBox?.classList.remove('open'); applyFilters(); return; }

        const matches = MAP_PLACES.filter(p =>
            p.name.includes(q) || (p.desc || '').includes(q) || (p.cat || '').includes(q) || (p.sub || '').includes(q)
        ).slice(0, 6);

        if (!matches.length) {
            if (sugBox) sugBox.innerHTML = '<div style="padding:14px; text-align:center; color:#8b7355; font-size:12px;">نتیجه‌ای یافت نشد</div>';
        } else {
            if (sugBox) {
                sugBox.innerHTML = matches.map(p => `
                    <div class="sug-item" data-id="${p.id}">
                        <i class="fas fa-map-marker-alt" style="color:${p.color || '#118b71'}"></i>
                        <div>
                            <div class="sug-name">${p.name}</div>
                            <div class="sug-cat">${p.cat || ''}</div>
                        </div>
                    </div>`).join('');
                sugBox.querySelectorAll('.sug-item').forEach(el => el.addEventListener('click', () => {
                    const p = MAP_PLACES.find(x => x.id === +el.dataset.id);
                    if (p) { highlightItem(p.id); sugBox.classList.remove('open'); }
                }));
            }
        }
        sugBox?.classList.add('open');
        applyFilters();
    });

    mapSearch?.addEventListener('blur', () => setTimeout(() => sugBox?.classList.remove('open'), 200));

    // ═══ Event: Extra toggles ═══
    function toggleExtra(btnId) {
        const btn = $id(btnId);
        if (!btn) return false;
        const active = btn.dataset.active === 'true';
        btn.dataset.active = active ? 'false' : 'true';
        btn.classList.toggle('active', !active);
        return !active;
    }

    if (!TRIP_MODE) {
        $id('freeOnly')?.addEventListener('click', () => { freeOnly = toggleExtra('freeOnly'); applyFilters(); });
        $id('childOnly')?.addEventListener('click', () => { childOnly = toggleExtra('childOnly'); applyFilters(); });
        $id('favsOnly')?.addEventListener('click', () => { favsOnly = toggleExtra('favsOnly'); applyFilters(); });
    }

    // ═══ Event: Clear filters ═══
    $id('qfClear')?.addEventListener('click', () => {
        activeCats.clear();
        query = '';
        if (mapSearch) mapSearch.value = '';
        $id('qfChips')?.querySelectorAll('.qf-chip').forEach(c => c.classList.remove('active'));
        updateQfActiveCount();
        applyFilters();
    });

    // ═══ Event: Route toggle ═══
    $id('routeBtn')?.addEventListener('click', () => {
        routeEnabled = !routeEnabled;
        $id('routeBtn').classList.toggle('active', routeEnabled);

        if (routeEnabled && activeDay !== 'all') {
            const i = +activeDay;
            drawRoute(daysArray[i], getDayColor(i + 1));
            showToast('مسیر نمایش داده شد');
        } else {
            clearRoute();
            showToast(routeEnabled ? 'مسیر روشن' : 'مسیر خاموش');
        }
    });

    // ═══ Event: Layer switcher ═══
    const layerBtn = $id('layerBtn');
    const layerSwitcher = $id('layerSwitcher');
    layerBtn?.addEventListener('click', () => layerSwitcher?.classList.toggle('open'));
    layerSwitcher?.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
        const layer = btn.dataset.layer;
        if (layer === currentLayer) return;
        map.removeLayer(layers[currentLayer]);
        layers[layer].addTo(map);
        currentLayer = layer;
        layerSwitcher.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.layer === layer));
        layerSwitcher.classList.remove('open');
    }));
    document.addEventListener('click', e => {
        if (!e.target.closest('#layerBtn') && !e.target.closest('#layerSwitcher')) {
            layerSwitcher?.classList.remove('open');
        }
    });

    // ═══ Event: Locate ═══
    $id('locateBtn')?.addEventListener('click', () => {
        if (!navigator.geolocation) { showToast('مرورگر پشتیبانی نمی‌کند'); return; }
        showToast('در حال دریافت موقعیت...');
        navigator.geolocation.getCurrentPosition(pos => {
            const { latitude, longitude } = pos.coords;
            L.marker([latitude, longitude], {
                icon: L.divIcon({
                    className: 'pin-wrap',
                    html: '<div class="pin" style="--c:#2196f3"><span><i class="fas fa-user"></i></span></div>',
                    iconSize: [26, 40], iconAnchor: [13, 36]
                })
            }).addTo(map).bindPopup('<b>📍 موقعیت شما</b>').openPopup();
            map.flyTo([latitude, longitude], 14, { duration: 0.8 });
            showToast('موقعیت یافت شد');
        }, () => showToast('دسترسی رد شد'));
    });

    // ═══ Event: Fit bounds ═══
    $id('fitBtn')?.addEventListener('click', () => {
        const allPoints = (TRIP_MODE ? tripPlaces : MAP_PLACES).map(p => [p.lat, p.lng]);
        if (allPoints.length) {
            map.fitBounds(L.latLngBounds(allPoints), { padding: [80, 80], maxZoom: 14 });
        }
    });

    // ═══ Event: Sidebar toggle ═══
    const closeSb = $id('closeSb');
    const sbToggle = $id('sbToggle');
    const mapSidebar = $id('mapSidebar');

    closeSb?.addEventListener('click', () => {
        mapSidebar.classList.add('collapsed');
        sbToggle.classList.add('show');
        setTimeout(() => map.invalidateSize(), 400);
    });

    sbToggle?.addEventListener('click', () => {
        mapSidebar.classList.remove('collapsed');
        sbToggle.classList.remove('show');
        setTimeout(() => map.invalidateSize(), 400);
    });

    // ═══ Event: Legend toggle ═══
    $id('toggleLeg')?.addEventListener('click', () => {
        const leg = $id('mapLegend');
        leg?.classList.toggle('collapsed');
        const btn = $id('toggleLeg');
        if (btn) btn.innerHTML = leg?.classList.contains('collapsed')
            ? '<i class="fas fa-plus"></i>' : '<i class="fas fa-minus"></i>';
    });

    // ═══ شروع ═══
    if (TRIP_MODE && TRIP_DATA) {
        const subtitle = $id('sidebarSubtitle');
        if (subtitle) {
            subtitle.textContent = `${faNum(daysArray.length)} روزه - ${faNum(tripPlaces.length)} جاذبه`;
        }

        const rb = $id('routeBtn');
        if (rb) {
            rb.style.display = 'flex';
            rb.classList.add('active');
        }

        renderTripList();
        drawMap();
        buildMapDayChips();
        buildLegend();
    } else {
        const subtitle = $id('sidebarSubtitle');
        if (subtitle) subtitle.textContent = 'کشف جاذبه‌های شهر';
        buildChips();
        applyFilters();
        buildLegend();
    }

    setTimeout(() => map.invalidateSize(), 300);
}