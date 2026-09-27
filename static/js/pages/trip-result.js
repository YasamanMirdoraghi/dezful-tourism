// ═══════════════════════════════════════════════════════════
// pages/trip-result.js — صفحه‌ی نتیجه‌ی سفر
// ═══════════════════════════════════════════════════════════

import { faNum, pad2, $ } from '../utils/index.js';

export function initTripResult() {
    const mapEl = document.getElementById('resultMap');
    if (!mapEl) return;

    const PLACES_IN_TRIP = window.PLACES_IN_TRIP || [];
    const IS_PLAN_MODE = window.IS_PLAN_MODE || false;
    const MATCHED_ROUTES = window.MATCHED_HISTORICAL_ROUTES || [];

    if (!PLACES_IN_TRIP.length) return;

    const ORD = ['اول', 'دوم', 'سوم', 'چهارم', 'پنجم', 'ششم', 'هفتم'];

    // ═══ گروه‌بندی جاذبه‌ها بر اساس روز ═══
    const daysMap = {};
    PLACES_IN_TRIP.forEach(p => {
        if (!daysMap[p.day]) daysMap[p.day] = [];
        daysMap[p.day].push(p);
    });

    const daysArray = Object.keys(daysMap).sort((a, b) => +a - +b).map(k => daysMap[k]);

    let activeTab = 'all';
    let mapInstance = null;
    let currentLayer = 'street';
    let mapLayers = null;

    // 🆕 لایه‌ی مسیر تاریخی
    let historicalRouteLayer = null;
    let activeHistoricalRouteId = null;

    // ═══ محاسبه فاصله ═══
    function calcDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    function distTxt(km) {
        return km < 1 ? `${faNum(Math.round(km * 1000))} متر` : `حدود ${faNum(Math.round(km))} کیلومتر`;
    }

    function schedule(dayPlaces) {
        return dayPlaces.map((p, idx) => {
            const dist = idx ? calcDistance(dayPlaces[idx - 1].lat, dayPlaces[idx - 1].lng, p.lat, p.lng) : 0;
            return { p, dist };
        });
    }

    function cardsHtml(dayPlaces, di) {
        return schedule(dayPlaces).map((it, idx) => {
            const durationMin = it.p.duration || 60;
            return `<div class="place-row">
                <span class="place-num">${faNum(idx + 1)}</span>
                <div class="place-card">
                    <img class="pc-img" src="${it.p.image}" alt="${it.p.name}" onerror="this.style.background='linear-gradient(135deg,#dff0ea,#cfe6dd)'">
                    <div class="pc-info">
                        <h4>${it.p.name}</h4>
                        <div class="pc-time">
                            <span class="duration-chip">
                                <i class="fas fa-hourglass-half"></i>
                                مدت بازدید: ${faNum(durationMin)} دقیقه
                            </span>
                            ${it.dist > 0 ? `
                                <span class="distance-chip">
                                    <i class="fas fa-route"></i>
                                    ${distTxt(it.dist)} از قبلی
                                </span>
                            ` : ''}
                        </div>
                        <div class="pc-meta">
                            <span>🏷️ ${it.p.category}</span>
                            <span>💰 ${it.p.cost === 0 ? 'رایگان' : faNum(it.p.cost.toLocaleString()) + ' تومان'}</span>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    function renderAll() {
        const days = daysArray;
        const plannerDays = document.getElementById('plannerDays');
        if (!plannerDays) return;

        if (!days.length) {
            plannerDays.innerHTML = '<p style="text-align:center; color:#8b7355; padding:40px 10px;">هیچ جاذبه‌ای برای این برنامه ثبت نشده است.</p>';
            return;
        }

        const plannerTabs = document.getElementById('plannerTabs');
        if (plannerTabs) {
            plannerTabs.innerHTML =
                `<button class="ptab ${activeTab === 'all' ? 'active' : ''}" data-tab="all"><span class="t">نمای کلی</span><span class="s">همه روزها</span></button>` +
                days.map((_, i) => `<button class="ptab ${activeTab !== 'all' && +activeTab === i ? 'active' : ''}" data-tab="${i}"><span class="t">روز ${ORD[i] || faNum(i + 1)}</span><span class="s">${faNum(days[i].length)} جاذبه</span></button>`).join('');
        }

        const renderDayBlock = (dayPlaces, i) => {
            return `<div class="day-block">
                <div class="day-block-title">روز ${faNum(i + 1)} <span>${faNum(dayPlaces.length)} جاذبه</span></div>
                ${cardsHtml(dayPlaces, i)}
            </div>`;
        };

        if (activeTab === 'all') {
            plannerDays.innerHTML = days.map((d, i) => renderDayBlock(d, i)).join('');
        } else {
            const i = +activeTab;
            plannerDays.innerHTML = renderDayBlock(days[i], i);
        }

        const mapDayChips = document.getElementById('mapDayChips');
        if (mapDayChips) {
            mapDayChips.innerHTML =
                `<button class="map-chip ${activeTab === 'all' ? 'active' : ''}" data-tab="all">همه</button>` +
                days.map((_, i) => `<button class="map-chip ${activeTab !== 'all' && +activeTab === i ? 'active' : ''}" data-tab="${i}">روز ${faNum(i + 1)}</button>`).join('');
        }

        showOnMap();
    }

    const MAPTILER_API_KEY = 'HJ7dofOgoJi2TfcV7XkF';

    function createMapLayers() {
        return {
            street: L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors', maxZoom: 19
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
    }

    // ═══════════════════════════════════════════════════════════
    // 🆕 رسم مسیر تاریخی روی نقشه
    // ═══════════════════════════════════════════════════════════
    function drawHistoricalRoute(routeId) {
        if (!mapInstance) return;

        // پاک کردن لایه‌ی قبلی
        if (historicalRouteLayer) {
            mapInstance.removeLayer(historicalRouteLayer);
            historicalRouteLayer = null;
        }

        const route = MATCHED_ROUTES.find(r => r.id === routeId);
        if (!route || !route.all_stops || route.all_stops.length < 2) {
            return;
        }

        const coords = route.all_stops
            .filter(s => s.lat && s.lng)
            .map(s => [s.lat, s.lng]);

        if (coords.length < 2) return;

        historicalRouteLayer = L.layerGroup().addTo(mapInstance);

        // ═══ خط قرمز نقطه‌چین (هاله‌ی سفید) ═══
        L.polyline(coords, {
            color: '#ffffff',
            weight: 10,
            opacity: 0.4,
            lineCap: 'round',
        }).addTo(historicalRouteLayer).bringToBack();

        // ═══ خط اصلی قرمز ═══
        L.polyline(coords, {
            color: '#e74c3c',
            weight: 5,
            opacity: 0.9,
            dashArray: '10, 8',
            lineCap: 'round',
            lineJoin: 'round',
        }).addTo(historicalRouteLayer);

        // ═══ مارکر ایستگاه‌ها ═══
        route.all_stops.forEach((stop, idx) => {
            if (!stop.lat || !stop.lng) return;

            const marker = L.marker([stop.lat, stop.lng], {
                icon: L.divIcon({
                    className: 'historical-stop-marker',
                    html: `<div class="hist-stop-pin"><span>${faNum(idx + 1)}</span></div>`,
                    iconSize: [22, 22],
                    iconAnchor: [11, 11],
                })
            })
            .addTo(historicalRouteLayer)
            .bindPopup(`
                <div style="direction: rtl; font-family: Vazirmatn, sans-serif; padding: 6px;">
                    <strong style="color: #e74c3c; display: block; margin-bottom: 6px;">
                        <i class="fas fa-map-pin"></i> ایستگاه ${faNum(idx + 1)}
                    </strong>
                    <span style="font-size: 14px; font-weight: 700; color: #4a3a2a;">${stop.name}</span>
                    ${stop.note ? `<br><small style="color: #888; font-size: 11px;">${stop.note}</small>` : ''}
                </div>
            `);
        });

        activeHistoricalRouteId = routeId;

        // نمایش پیام
        showRouteToast(`مسیر «${route.name}» روی نقشه نمایش داده شد`);
    }

    function clearHistoricalRoute() {
        if (historicalRouteLayer && mapInstance) {
            mapInstance.removeLayer(historicalRouteLayer);
            historicalRouteLayer = null;
        }
        activeHistoricalRouteId = null;
    }

    // 🆕 اتصال دکمه‌های «نمایش روی همین نقشه»
    document.querySelectorAll('.hr-btn.secondary[data-route-id]').forEach(btn => {
        btn.addEventListener('click', function () {
            const routeId = parseInt(this.dataset.routeId, 10);

            if (activeHistoricalRouteId === routeId) {
                clearHistoricalRoute();
                this.innerHTML = '<i class="fas fa-draw-polygon"></i> نمایش روی همین نقشه';
                showRouteToast('مسیر از روی نقشه پاک شد');
            } else {
                // همه دکمه‌ها رو ریست کن
                document.querySelectorAll('.hr-btn.secondary[data-route-id]').forEach(b => {
                    b.innerHTML = '<i class="fas fa-draw-polygon"></i> نمایش روی همین نقشه';
                });
                drawHistoricalRoute(routeId);
                this.innerHTML = '<i class="fas fa-times"></i> مخفی کردن مسیر';
            }
        });
    });

    // ═══ Toast مسیر ═══
    function showRouteToast(msg) {
        let toast = document.getElementById('routeToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'routeToast';
            toast.className = 'route-toast';
            toast.innerHTML = `<i class="fas fa-route"></i><span class="route-toast-text"></span>`;
            document.body.appendChild(toast);
        }
        toast.querySelector('.route-toast-text').textContent = msg;
        toast.classList.add('show');
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => toast.classList.remove('show'), 2800);
    }

    function showOnMap() {
        if (typeof L === 'undefined') return;
        if (!document.getElementById('resultMap')) return;

        if (mapInstance) {
            mapInstance.remove();
            mapInstance = null;
        }

        mapInstance = L.map('resultMap', { zoomControl: false });
        L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

        mapLayers = createMapLayers();
        mapLayers[currentLayer].addTo(mapInstance);

        const all = [];
        const dayColors = ['#f4a62a', '#118b71', '#ff5050', '#2196f3', '#9c27b0', '#ff9800', '#4caf50'];

        const drawDay = (places, dayIdx) => {
            const pts = [];
            const color = dayColors[dayIdx % dayColors.length];

            schedule(places).forEach((it, idx) => {
                const marker = L.marker([it.p.lat, it.p.lng], {
                    icon: L.divIcon({
                        className: 'pin-wrap',
                        html: `<div class="pin" style="background:${color}"><span>${faNum(idx + 1)}</span></div><div class="pin-label">${it.p.name}</div>`,
                        iconSize: [30, 44],
                        iconAnchor: [15, 33],
                        popupAnchor: [0, -34]
                    })
                })
                    .addTo(mapInstance)
                    .bindPopup(`
                        <div class="map-pop">
                            <div class="map-pop-img">
                                <img src="${it.p.image}" alt="${it.p.name}" onerror="this.parentNode.style.background='linear-gradient(135deg,#dff0ea,#cfe6dd)'">
                                <span class="map-pop-badge" style="background:${color}; color:#fff;">روز ${faNum(dayIdx + 1)}</span>
                            </div>
                            <div class="map-pop-body">
                                <h4>${it.p.name}</h4>
                                <div class="map-pop-loc"><i class="fas fa-map-marker-alt"></i> دزفول، خوزستان</div>
                                <p>${it.p.desc || ''}</p>
                            </div>
                        </div>`);

                marker.on('mouseover', () => marker.openPopup());
                marker.on('mouseout', () => marker.closePopup());

                pts.push([it.p.lat, it.p.lng]);
                all.push([it.p.lat, it.p.lng]);
            });

            if (pts.length > 1) {
                L.polyline(pts, {
                    color: color, weight: 4, opacity: 0.85,
                    dashArray: '8 8', lineCap: 'round'
                }).addTo(mapInstance);
            }
        };

        if (activeTab === 'all') {
            daysArray.forEach((d, i) => drawDay(d, i));
        } else if (daysArray[+activeTab]) {
            drawDay(daysArray[+activeTab], +activeTab);
        }

        // 🆕 اگه مسیر تاریخی فعال بود، دوباره رسمش کن
        if (activeHistoricalRouteId) {
            drawHistoricalRoute(activeHistoricalRouteId);
        }

        if (all.length) {
            mapInstance.fitBounds(L.latLngBounds(all), { padding: [50, 50] });
        }
        setTimeout(() => mapInstance && mapInstance.invalidateSize(), 400);
    }

    // ═══ سوییچ لایه‌ها ═══
    (function () {
        const layerBtn = document.getElementById('mapLayerBtn');
        const layerSwitcher = document.getElementById('layerSwitcher');

        if (!layerBtn || !layerSwitcher) return;

        layerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = layerSwitcher.classList.toggle('open');
            layerBtn.classList.toggle('active', isOpen);
        });

        layerSwitcher.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                const layer = btn.dataset.layer;
                if (layer === currentLayer || !mapLayers || !mapInstance) return;

                if (mapInstance.hasLayer(mapLayers[currentLayer])) {
                    mapInstance.removeLayer(mapLayers[currentLayer]);
                }
                mapLayers[layer].addTo(mapInstance);
                currentLayer = layer;

                layerSwitcher.querySelectorAll('button').forEach(b => {
                    b.classList.toggle('active', b.dataset.layer === layer);
                });
                layerSwitcher.classList.remove('open');
                layerBtn.classList.remove('active');
            });
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('#mapLayerBtn') && !e.target.closest('#layerSwitcher')) {
                layerSwitcher.classList.remove('open');
                layerBtn.classList.remove('active');
            }
        });
    })();

    // ═══ Tab click ═══
    document.addEventListener('click', e => {
        const t = e.target.closest('[data-tab]');
        if (t) {
            activeTab = t.dataset.tab === 'all' ? 'all' : parseInt(t.dataset.tab, 10);
            renderAll();
        }
    });

    renderAll();
}