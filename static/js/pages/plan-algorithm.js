// ═══════════════════════════════════════════════════════════
// 🎯 بخش ۱: سیاست هر جاذبه
// ═══════════════════════════════════════════════════════════
export function getPlacePolicy(place) {
    const d = place.duration || 60;
    if (d >= 360) return { type: 'full_day', maxCompanions: 0, label: '🔒 روز کامل' };
    if (d >= 240) return { type: 'large', maxCompanions: 1, label: '🔒 بزرگ' };
    if (d >= 180) return { type: 'medium', maxCompanions: 2, label: '⏱️ متوسط' };
    if (d >= 90) return { type: 'small', maxCompanions: 4, label: '📦 کوچیک' };
    return { type: 'tiny', maxCompanions: 5, label: '📦 خیلی کوچیک' };
}

// ═══════════════════════════════════════════════════════════
// ⚙️ بخش ۲: تنظیمات کلی
// ═══════════════════════════════════════════════════════════
export const CONFIG = {
    center: { lat: 32.3833, lng: 48.4000 },
    maxTripDays: 7,
    breakTimeMinutes: 30,
    lunchTimeMinutes: 60,
    lunchThreshold: 4 * 60,
    averageTravelSpeedKmh: 30,
    knnMultiplier: 6,

    cbf: {
        baseSimilarity: 0.35,
        weightedScore: 0.65
    },

    fuzzyBase: {
        interest: 30, budget: 20, child: 15,
        duration: 15, popularity: 10, rating: 10
    },

    fuzzyRules: {
        shortTrip: { interest: +15, popularity: -5 },
        longTrip: { duration: +8, rating: +5 },
        lowBudget: { budget: +15, popularity: -5 },
        highBudget: { interest: +5, rating: +5 },
        withChild: { child: +15, duration: +5 }
    },

    assignment: {
        idealTolerance: 45,
        hardTolerance: 60,
        softLimit: 15,
        maxIterations: 300,
        poolMaxSize: 80,
        minAcceptable: 20,

        // 🆕 سقف تعداد جاذبه‌های large بر اساس تعداد روز
        //  ۱-۲ روز  → ۰
        //  ۳-۴ روز  → ۱
        //  ۵-۶ روز  → ۲
        //  ۷ روز    → ۳
        maxLargeSlotsByDay: (daysCount) => {
            if (daysCount <= 2) return 0;
            if (daysCount <= 4) return 1;
            if (daysCount <= 6) return 2;
            return 3;
        },

        // 🆕 سقف تعداد جاذبه‌های full_day
        maxFullDaySlotsByDay: (daysCount) => {
            if (daysCount === 1) return 0;
            if (daysCount === 2) return 1;
            return Math.floor(daysCount / 2);
        },

        weights: {
            emptyDayBonus: 50,
            emptyDayPreferred: 200,
            veryCloseDist: 500,
            closeDist: 350,
            mediumDist: 250,
            nearDist: 150,
            okDist: 50,
            farDistPenalty: -100,
            veryFarDistWeight: 20,

            newSelectedCategory: 800,
            secondSelectedCategory: 100,
            newCategoryInFill: 400,
            secondCategoryInFill: 150,
            missingCategoryFill: 5000,
            missingCategoryScoreMult: 0.3,

            sameCategoryInDayPenalty: 100,
            sameCategoryInFillPenalty: 120,
            sameFamilyPenalty: 20,
            avgDistPenalty: 3,

            idealTimeBonus: 200,
            idealTimeBonusFill: 300,
            fillRatioWeight: 100,
            timeGapMax: 60,
            timeGapMaxFill: 100,

            idealDiffWeight: 0.5,
            hardDiffWeight: 10,
            hardBasePenalty: 50,
            overflowBasePenalty: 500,
            overflowQuadratic: 50,
            avgDistWeightCost: 15,
            maxDistWeightCost: 8,
            farDistThreshold: 15,
            farDistQuadraticCost: 20,

            interestLevelBonus: { 0: -80, 1: -50, 2: -20, 3: +10 },
            interestLevelDefault: +50,

            redundantCategoryPenalty: 100,
            redundantCategoryThreshold: 2,

            placeScoreWeight: 0.2,
            placeScoreWeightLarge: 0.5,
            placeScoreWeightFill: 0.2,

            repair: {
                levelBasePenalty: 1000,
                scoreWeight: 1,
                durationWeight: 2,
                distPenalty: 20
            },

            fallbackScoreFromRating: true
        }
    },

    interestPriority: {
        '-1': 30,
        0: 1000,
        1: 700,
        2: 400,
        3: 200,
        4: 100,
        5: 60,
        6: 40
    },

    familyChain: {
        'nature_far':  ['nature_far', 'nature_near', 'recreation', 'urban', 'historical', 'religious'],
        'nature_near': ['nature_near', 'nature_far', 'recreation', 'urban', 'historical', 'religious'],
        'recreation':  ['recreation', 'nature_near', 'nature_far', 'urban', 'historical', 'religious'],
        'religious':   ['religious', 'historical', 'urban', 'recreation', 'nature_near', 'nature_far'],
        'historical':  ['historical', 'religious', 'urban', 'recreation', 'nature_near', 'nature_far'],
        'urban':       ['urban', 'historical', 'religious', 'recreation', 'nature_near', 'nature_far']
    },
    chainWeights: [1.0, 0.7, 0.5, 0.35, 0.25, 0.15]
};

// ═══════════════════════════════════════════════════════════
// 📐 بخش ۳: توابع کمکی
// ═══════════════════════════════════════════════════════════
export function calcDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function euclideanDistance(a, b) {
    let sum = 0;
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) sum += (a[i] - b[i]) ** 2;
    return Math.sqrt(sum);
}

export function travelMinutesForDistance(km) {
    if (!Number.isFinite(km) || km <= 0) return 0;
    if (km <= 2) return km * 4;
    if (km <= 10) return (km / 30) * 60;
    return (km / 50) * 60;
}

function finiteNumber(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

// ═══════════════════════════════════════════════════════════
// 🧠 داده‌های سراسری (از window خوانده می‌شن)
// ═══════════════════════════════════════════════════════════
function getRealPlaces() {
    return window.REAL_PLACES || [];
}

function getCategoriesData() {
    return window.CATEGORIES || [];
}

function getAllCategories() {
    return getCategoriesData().map(c => c.name);
}

function getPlaceCategory(place) {
    const raw = place?.category;
    const cat = getCategoriesData().find(c =>
        String(c.id) === String(raw) || String(c.name) === String(raw)
    );
    return cat || { id: 0, name: 'سایر', family: 'other' };
}

function getPlaceDuration(place) {
    return Math.max(1, Math.round(finiteNumber(place?.duration, 60)));
}

function placeDistance(a, b) {
    if (!a || !b) return Infinity;
    const aLat = finiteNumber(a.lat, NaN), aLng = finiteNumber(a.lng, NaN);
    const bLat = finiteNumber(b.lat, NaN), bLng = finiteNumber(b.lng, NaN);
    if (![aLat, aLng, bLat, bLng].every(Number.isFinite)) return Infinity;
    return calcDistance(aLat, aLng, bLat, bLng);
}

function routeDistance(route) {
    if (!route || route.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < route.length; i++) {
        const d = placeDistance(route[i - 1], route[i]);
        if (Number.isFinite(d)) total += d;
    }
    return total;
}

function dayTimeExact(day) {
    if (!Array.isArray(day) || day.length === 0) return 0;
    let visitTime = 0;
    for (const place of day) visitTime += getPlaceDuration(place);

    const breakTime = Math.max(0, day.length - 1) * CONFIG.breakTimeMinutes;
    const lunchTime = visitTime + breakTime > CONFIG.lunchThreshold ? CONFIG.lunchTimeMinutes : 0;
    const travelTime = travelMinutesForDistance(routeDistance(day));

    return visitTime + breakTime + lunchTime + travelTime;
}

function dayTimeEstimated(day) {
    if (!Array.isArray(day) || day.length === 0) return 0;
    if (day.length === 1) return getPlaceDuration(day[0]);

    let visitTime = 0;
    for (const place of day) visitTime += getPlaceDuration(place);

    const breakTime = Math.max(0, day.length - 1) * CONFIG.breakTimeMinutes;
    const lunchTime = visitTime + breakTime > CONFIG.lunchThreshold ? CONFIG.lunchTimeMinutes : 0;

    let totalMinDist = 0;
    for (let i = 0; i < day.length; i++) {
        let minD = Infinity;
        for (let j = 0; j < day.length; j++) {
            if (i === j) continue;
            minD = Math.min(minD, placeDistance(day[i], day[j]));
        }
        if (Number.isFinite(minD)) totalMinDist += minD;
    }
    const estimatedTravelTime = travelMinutesForDistance(totalMinDist / 2);

    return visitTime + breakTime + lunchTime + estimatedTravelTime;
}

function dayTime(day) {
    return dayTimeEstimated(day);
}

function dayCost(day) {
    if (!Array.isArray(day)) return 0;
    return day.reduce((sum, p) => sum + finiteNumber(p && p.cost, 0), 0);
}

// ═══════════════════════════════════════════════════════════
// 🌫️ بخش ۴: Fuzzy Logic
// ═══════════════════════════════════════════════════════════
function triangularMF(x, a, b, c) {
    if (x <= a || x >= c) return 0;
    if (x === b) return 1;
    if (x < b) return (x - a) / (b - a);
    return (c - x) / (c - b);
}

function membershipDuration(days) {
    return { short: triangularMF(days, 0, 1, 4), medium: triangularMF(days, 2, 4, 6), long: triangularMF(days, 5, 7, 10) };
}

function membershipBudget(millions) {
    return { low: triangularMF(millions, 0, 2, 5), medium: triangularMF(millions, 3, 6, 10), high: triangularMF(millions, 8, 12, 20) };
}

function getFuzzyWeights(duration, hasChild, budgetMax) {
    const durMem = membershipDuration(duration);
    const budMem = membershipBudget(budgetMax / 1_000_000);
    const w = { ...CONFIG.fuzzyBase };
    const R = CONFIG.fuzzyRules;

    w.interest += durMem.short * R.shortTrip.interest;
    w.popularity += durMem.short * R.shortTrip.popularity;
    w.duration += durMem.long * R.longTrip.duration;
    w.rating += durMem.long * R.longTrip.rating;
    w.budget += budMem.low * R.lowBudget.budget;
    w.popularity += budMem.low * R.lowBudget.popularity;
    w.interest += budMem.high * R.highBudget.interest;
    w.rating += budMem.high * R.highBudget.rating;
    if (hasChild) { w.child += R.withChild.child; w.duration += R.withChild.duration; }

    Object.keys(w).forEach(k => { if (w[k] < 0.5) w[k] = 0.5; });
    const total = Object.values(w).reduce((a, b) => a + b, 0);
    Object.keys(w).forEach(k => { w[k] = Math.round((w[k] / total) * 100 * 100) / 100; });
    return w;
}

// ═══════════════════════════════════════════════════════════
// 🎯 بخش ۵: CBF (Content-Based Filtering)
// ═══════════════════════════════════════════════════════════
function buildPlaceVector(place, userPrefs) {
    const ALL_CATEGORIES = getAllCategories();
    const cat = getPlaceCategory(place);
    const catVec = ALL_CATEGORIES.map(name => cat.name === name ? 1 : 0);

    const budgetMax = Math.max(1, finiteNumber(userPrefs?.budgetMax, 5_000_000));
    const cost = Math.max(0, finiteNumber(place.cost, 0));
    const affordability = cost === 0 ? 1 : Math.max(0, 1 - Math.min(cost / budgetMax, 1));

    const rating = Math.max(0, Math.min(finiteNumber(place.rating, 3.5) / 5, 1));
    const childFit = place.is_child_friendly ? 1 : 0;

    const placeDurationH = getPlaceDuration(place) / 60;
    const avgDailyHours = Math.max(0.5, finiteNumber(userPrefs?.avgDailyHours, 8));
    const durationFit = 1 - Math.min(Math.abs(placeDurationH - avgDailyHours / 3) / 12, 1);

    const distKm = calcDistance(
        finiteNumber(place.lat, CONFIG.center.lat),
        finiteNumber(place.lng, CONFIG.center.lng),
        CONFIG.center.lat, CONFIG.center.lng
    );
    const proximity = 1 - Math.min(distKm / 50, 1);

    return [...catVec, affordability, rating, childFit, durationFit, proximity];
}

function buildUserVector(userPrefs, fuzzyWeights) {
    const ALL_CATEGORIES = getAllCategories();
    const catVec = ALL_CATEGORIES.map(cat => userPrefs.interests.includes(cat) ? 1 : 0);
    return [...catVec, 1, 1, userPrefs.hasChild ? 1 : 0.5, 1, 1];
}

function normalizeFeatureVectors(vectors) {
    if (!vectors.length) return [];
    const dims = vectors[0].length;
    const mins = Array(dims).fill(Infinity), maxs = Array(dims).fill(-Infinity);
    for (const v of vectors) {
        for (let i = 0; i < dims; i++) {
            mins[i] = Math.min(mins[i], v[i]);
            maxs[i] = Math.max(maxs[i], v[i]);
        }
    }
    return vectors.map(v => v.map((x, i) => {
        const span = maxs[i] - mins[i];
        return span > 1e-12 ? (x - mins[i]) / span : 0;
    }));
}

function cosineSimilarity(a, b) {
    let dot = 0, normA = 0, normB = 0;
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) { dot += a[i] * b[i]; normA += a[i] * a[i]; normB += b[i] * b[i]; }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function getInterestChainScore(place, selectedCategories) {
    const CATEGORIES_DATA = getCategoriesData();
    const placeCat = getPlaceCategory(place);

    if (selectedCategories.some(sc => sc.name === placeCat.name)) {
        return { score: 1.0, level: 0 };
    }
    for (const sc of selectedCategories) {
        const scCat = CATEGORIES_DATA.find(c => c.name === sc.name);
        if (scCat && scCat.family && placeCat.family && scCat.family === placeCat.family) {
            return { score: 0.7, level: 1 };
        }
    }
    let bestScore = 0, bestLevel = -1;
    for (const sc of selectedCategories) {
        const scCat = CATEGORIES_DATA.find(c => c.name === sc.name);
        if (!scCat || !scCat.family) continue;
        const chain = CONFIG.familyChain[scCat.family];
        if (!chain) continue;
        const idx = chain.indexOf(placeCat.family);
        if (idx >= 1 && idx < CONFIG.chainWeights.length) {
            const score = CONFIG.chainWeights[idx];
            if (score > bestScore) {
                bestScore = score;
                bestLevel = idx + 1;
            }
        }
    }
    return { score: bestScore, level: bestLevel };
}

function cbfScoring(places, userPrefs, fuzzyWeights) {
    const userVec = buildUserVector(userPrefs, fuzzyWeights);
    const w = {
        interest: fuzzyWeights.interest / 100,
        budget: fuzzyWeights.budget / 100,
        child: fuzzyWeights.child / 100,
        duration: fuzzyWeights.duration / 100,
        popularity: fuzzyWeights.popularity / 100,
        rating: fuzzyWeights.rating / 100
    };

    return places.map((place, index) => {
        const cat = getPlaceCategory(place);
        const chainResult = getInterestChainScore(place, userPrefs.interestObjects || []);
        const placeVec = buildPlaceVector(place, userPrefs);
        const baseSim = cosineSimilarity(userVec, placeVec);

        let score = 0;
        score += chainResult.score * w.interest;

        const budgetMax = userPrefs.budgetMax;
        let budgetScore;
        if (place.cost === 0) budgetScore = 1;
        else if (place.cost <= budgetMax * 0.2) budgetScore = 0.9;
        else if (place.cost <= budgetMax * 0.5) budgetScore = 0.7;
        else if (place.cost <= budgetMax) budgetScore = 0.4;
        else budgetScore = 0.1;
        score += budgetScore * w.budget;

        if (userPrefs.hasChild) score += (place.is_child_friendly ? 1 : 0) * w.child;
        else score += 0.5 * w.child;

        let durScore;
        if (place.duration <= 60) durScore = 1;
        else if (place.duration <= 90) durScore = 0.8;
        else if (place.duration <= 120) durScore = 0.6;
        else durScore = 0.3;
        score += durScore * w.duration;

        const popScore = Math.min(((place.views || 0) / 20) * 0.6 + ((place.rating || 3.5) / 5) * 0.4, 1);
        score += popScore * w.popularity;

        score += Math.min((place.rating || 3.5) / 5, 1) * w.rating;

        const finalScore01 = baseSim * CONFIG.cbf.baseSimilarity + score * CONFIG.cbf.weightedScore;

        return {
            ...place,
            __algoId: place.id ?? `place_${index}`,
            __category: cat,
            __categoryName: cat.name,
            __family: cat.family,
            __duration: getPlaceDuration(place),
            __interest: chainResult.score,
            __interestLevel: chainResult.level,
            __similarity: baseSim,
            __weightedScore: score,
            score: Math.round(finalScore01 * 100)
        };
    });
}

// ═══════════════════════════════════════════════════════════
// 🎯 بخش ۶: Top-K Candidates
// ═══════════════════════════════════════════════════════════
function selectTopKCandidates(scoredPlaces, userPrefs, fuzzyWeights, durationDays, budgetMax) {
    const unique = [];
    const seen = new Set();
    for (const p of scoredPlaces) {
        const id = p.__algoId ?? p.id;
        if (seen.has(id)) continue;
        seen.add(id);
        unique.push(p);
    }

    const budgetFiltered = unique.filter(p => {
        const cost = Math.max(0, finiteNumber(p.cost, 0));
        return cost === 0 || cost <= budgetMax * 1.10;
    });

    const userVec = buildUserVector(userPrefs, fuzzyWeights);
    const rawVectors = budgetFiltered.map(p => buildPlaceVector(p, userPrefs));
    const normalized = normalizeFeatureVectors([userVec, ...rawVectors]);
    const normalizedUser = normalized[0] || userVec;

    const candidates = budgetFiltered.map((place, i) => {
        const v = normalized[i + 1] || rawVectors[i];
        const distance = euclideanDistance(normalizedUser, v);
        return { ...place, __knnDistance: distance };
    });

    const totalHours = (userPrefs.avgDailyHours || 8) * durationDays;
    const K = Math.min(
        CONFIG.assignment.poolMaxSize,
        Math.max(20, Math.ceil(totalHours / 0.9) + userPrefs.interestObjects.length * 3)
    );

    candidates.sort((a, b) => {
        if (Math.abs(a.__knnDistance - b.__knnDistance) > 1e-9) return a.__knnDistance - b.__knnDistance;
        return (b.score || 0) - (a.score || 0);
    });

    const pool = [];
    const usedIds = new Set();
    for (const catName of userPrefs.interests) {
        const p = candidates.find(x => x.__categoryName === catName);
        if (p && !usedIds.has(p.__algoId)) {
            pool.push(p);
            usedIds.add(p.__algoId);
        }
    }
    for (const p of candidates) {
        if (pool.length >= K) break;
        if (usedIds.has(p.__algoId)) continue;
        pool.push(p);
        usedIds.add(p.__algoId);
    }
    return { pool, K, candidateCount: candidates.length };
}

// ═══════════════════════════════════════════════════════════
// 🎯 بخش ۷: Assignment
// ═══════════════════════════════════════════════════════════
function computeNewTime(day, place) {
    if (!place) return dayTime(day);
    return dayTime([...(day || []), place]);
}

// 🆕 شمارش تعداد large های کل برنامه
function countLargeInPlan(days) {
    let count = 0;
    for (const day of days) {
        for (const p of day) {
            if (getPlacePolicy(p).type === 'large') count++;
        }
    }
    return count;
}

// 🆕 چک می‌کنه که آیا اضافه کردن این جاذبه به این روز مجازه
function canAddPlaceToDay(day, place) {
    const newType = getPlacePolicy(place).type;
    const dayTypes = day.map(x => getPlacePolicy(x).type);

    // اگه full_day توی روز هست، هیچی اضافه نشه
    if (dayTypes.includes('full_day')) return false;

    // اگه large توی روز هست، large دیگه اضافه نشه
    if (newType === 'large' && dayTypes.includes('large')) return false;

    // اگه جاذبه جدید full_day هست و روز خالیه، مجازه
    if (newType === 'full_day' && day.length > 0) return false;

    // چک سیاست همراهان
    const mainPlace = day[0];
    if (mainPlace) {
        const policy = getPlacePolicy(mainPlace);
        const companions = day.length - 1;
        if (companions >= policy.maxCompanions) return false;
    }

    return true;
}

function assignPlacesToDays(pool, daysCount, dailyDurations, allPlaces, selectedCategories) {
    const W = CONFIG.assignment.weights;
    const targets = dailyDurations.map(h => Math.round(h * 60));
    const SOFT_LIMIT = CONFIG.assignment.softLimit;

    const days = Array.from({ length: daysCount }, () => []);
    const usedInPlan = new Set();
    const selectedCatNames = (selectedCategories || []).map(c => c.name);
    const unassigned = [];

    const fullDayPlaces = pool.filter(p => getPlacePolicy(p).type === 'full_day');
    const largePlaces = pool.filter(p => getPlacePolicy(p).type === 'large');
    const normalPlaces = pool.filter(p => !['full_day', 'large'].includes(getPlacePolicy(p).type));

    // ═══ حداکثر تعداد full_day بر اساس تعداد روز ═══
    const maxFullDaySlots = CONFIG.assignment.maxFullDaySlotsByDay(daysCount);

    fullDayPlaces.sort((a, b) => b.score - a.score);
    const selectedFullDay = fullDayPlaces.slice(0, maxFullDaySlots);

    selectedFullDay.forEach((p, i) => {
        const dayIdx = Math.floor((i + 1) * daysCount / (selectedFullDay.length + 1));
        days[dayIdx].push(p);
        usedInPlan.add(p.__algoId);
    });

    // ═══ حداکثر تعداد large بر اساس تعداد روز ═══
    const maxLargeSlots = CONFIG.assignment.maxLargeSlotsByDay(daysCount);

    largePlaces.sort((a, b) => b.score - a.score);
    let largeAssigned = 0;

    for (const p of largePlaces) {
        if (usedInPlan.has(p.__algoId)) continue;

        // 🆕 چک سقف large
        if (largeAssigned >= maxLargeSlots) {
            unassigned.push(p);
            continue;
        }

        let bestDay = -1, bestScore = -Infinity;
        for (let d = 0; d < days.length; d++) {
            // 🆕 نه full_day، نه large دیگه
            if (days[d].some(x => {
                const t = getPlacePolicy(x).type;
                return t === 'full_day' || t === 'large';
            })) continue;

            const newTime = computeNewTime(days[d], p);
            if (newTime > targets[d] + CONFIG.assignment.hardTolerance) continue;

            let score = 0;
            if (days[d].length === 0) score += W.emptyDayPreferred;
            score += (newTime / targets[d]) * W.fillRatioWeight;
            score += (p.score || 0) * W.placeScoreWeightLarge;

            if (score > bestScore) {
                bestScore = score;
                bestDay = d;
            }
        }
        if (bestDay >= 0) {
            days[bestDay].push(p);
            usedInPlan.add(p.__algoId);
            largeAssigned++;
        } else {
            unassigned.push(p);
        }
    }

    const sorted = [...normalPlaces].sort((a, b) => {
        const la = a.__interestLevel ?? 99;
        const lb = b.__interestLevel ?? 99;
        if (la !== lb) return la - lb;
        return b.__duration - a.__duration;
    });

    assignPass(days, sorted, targets, selectedCatNames, usedInPlan, unassigned, 0, SOFT_LIMIT);

    const availableFromAll = (allPlaces || [])
        .filter(p => !usedInPlan.has(p.id))
        .filter(p => !unassigned.some(u => u.id === p.id));

    const normalizeAll = availableFromAll.map(p => {
        const cat = getPlaceCategory(p);
        const chainResult = getInterestChainScore(p, selectedCategories || []);
        return {
            ...p,
            __algoId: p.id,
            __category: cat,
            __categoryName: cat.name,
            __family: cat.family,
            __duration: getPlaceDuration(p),
            __interest: chainResult.score,
            __interestLevel: chainResult.level,
            score: Math.round((p.rating || 3.5) / 5 * 100)
        };
    });

    fillFromAllSources(days, unassigned, normalizeAll, targets, SOFT_LIMIT, selectedCatNames, usedInPlan, maxLargeSlots);
    strongLocalSearch(days, targets, SOFT_LIMIT, selectedCatNames, maxLargeSlots);
    cleanupOutOfRangeDays(days, targets, unassigned, usedInPlan);

    return { days, unassigned };
}

function assignPass(days, candidates, targets, selectedCatNames, usedInPlan, unassigned, extraTolerance, SOFT_LIMIT) {
    const W = CONFIG.assignment.weights;
    const tolerance = CONFIG.assignment.hardTolerance + extraTolerance;

    for (const place of candidates) {
        if (usedInPlan.has(place.__algoId)) continue;

        let bestDay = -1;
        let bestScore = -Infinity;

        for (let d = 0; d < days.length; d++) {
            const day = days[d];
            const target = targets[d];

            // 🆕 چک جامع (full_day / large / همراهان)
            if (!canAddPlaceToDay(day, place)) continue;

            const newTime = computeNewTime(day, place);
            if (newTime > target + tolerance) continue;

            if (day.length > 0) {
                let maxDist = 0;
                for (const existing of day) {
                    maxDist = Math.max(maxDist, placeDistance(place, existing));
                }
                if (maxDist > SOFT_LIMIT * 2) continue;
            }

            let score = 0;

            if (day.length > 0) {
                let minDist = Infinity;
                let avgDist = 0;
                for (const existing of day) {
                    const dist = placeDistance(place, existing);
                    minDist = Math.min(minDist, dist);
                    avgDist += dist;
                }
                avgDist /= day.length;

                if (minDist < 1) score += W.veryCloseDist;
                else if (minDist < 2) score += W.closeDist;
                else if (minDist < 3) score += W.mediumDist;
                else if (minDist < 5) score += W.nearDist;
                else if (minDist < 8) score += W.okDist;
                else if (minDist < 12) score += W.farDistPenalty;
                else score -= minDist * W.veryFarDistWeight;

                score -= avgDist * W.avgDistPenalty;
            } else {
                score += W.emptyDayBonus;
            }

            const level = place.__interestLevel ?? 99;
            score += (CONFIG.interestPriority[level] || 50) * 0.5;

            const catCount = days.flat().filter(x => x.__categoryName === place.__categoryName).length;
            if (catCount === 0 && selectedCatNames.includes(place.__categoryName)) {
                score += W.newSelectedCategory;
            } else if (catCount === 1 && selectedCatNames.includes(place.__categoryName)) {
                score += W.secondSelectedCategory;
            }

            const diff = Math.abs(newTime - target);
            if (diff <= CONFIG.assignment.idealTolerance) score += W.idealTimeBonus;
            else score += Math.max(0, W.timeGapMax - diff);

            const fillRatio = newTime / target;
            score += fillRatio * W.fillRatioWeight;

            const sameCatCount = day.filter(x => x.__categoryName === place.__categoryName).length;
            score -= sameCatCount * W.sameCategoryInDayPenalty;

            const sameFamilyCount = day.filter(x => x.__family === place.__family).length;
            score -= sameFamilyCount * W.sameFamilyPenalty;

            score += (place.score || 0) * W.placeScoreWeight;

            if (score > bestScore) {
                bestScore = score;
                bestDay = d;
            }
        }

        if (bestDay !== -1) {
            days[bestDay].push(place);
            usedInPlan.add(place.__algoId);
        } else {
            unassigned.push(place);
        }
    }
}

function fillFromAllSources(days, unassigned, allAvailable, targets, SOFT_LIMIT, selectedCatNames, usedInPlan, maxLargeSlots) {
    const W = CONFIG.assignment.weights;

    // 🆕 شمارش فعلی large ها
    let currentLargeCount = countLargeInPlan(days);

    const usedCategories = new Set();
    for (const day of days) {
        for (const p of day) usedCategories.add(p.__categoryName);
    }

    const missingCategories = (selectedCatNames || []).filter(cat => !usedCategories.has(cat));

    if (missingCategories.length > 0) {
        for (const catName of missingCategories) {
            const candidates = [...unassigned, ...allAvailable]
                .filter(p => p.__categoryName === catName)
                .filter(p => !usedInPlan.has(p.__algoId))
                .sort((a, b) => (b.score || 0) - (a.score || 0));

            if (candidates.length === 0) continue;

            for (const place of candidates) {
                // 🆕 چک سقف large
                if (getPlacePolicy(place).type === 'large' && currentLargeCount >= maxLargeSlots) {
                    continue;
                }

                let bestDay = -1;
                let bestScore = -Infinity;

                for (let d = 0; d < days.length; d++) {
                    const day = days[d];
                    const target = targets[d];

                    // 🆕 چک جامع
                    if (!canAddPlaceToDay(day, place)) continue;

                    const newTime = computeNewTime(day, place);
                    if (newTime > target + CONFIG.assignment.hardTolerance) continue;

                    if (day.length > 0) {
                        let maxDist = 0;
                        for (const existing of day) {
                            maxDist = Math.max(maxDist, placeDistance(place, existing));
                        }
                        if (maxDist > SOFT_LIMIT * 2) continue;
                    }

                    let score = W.missingCategoryFill + (place.score || 0) * W.missingCategoryScoreMult;
                    if (score > bestScore) {
                        bestScore = score;
                        bestDay = d;
                    }
                }

                if (bestDay >= 0) {
                    days[bestDay].push(place);
                    usedInPlan.add(place.__algoId);
                    if (getPlacePolicy(place).type === 'large') currentLargeCount++;

                    const uIdx = unassigned.findIndex(u => u.__algoId === place.__algoId);
                    if (uIdx >= 0) unassigned.splice(uIdx, 1);
                    const aIdx = allAvailable.findIndex(a => a.__algoId === place.__algoId);
                    if (aIdx >= 0) allAvailable.splice(aIdx, 1);
                    break;
                }
            }
        }
    }

    let improved = true;
    let safety = 0;

    const allCandidates = [...unassigned, ...allAvailable].filter(p => !usedInPlan.has(p.__algoId));
    allCandidates.sort((a, b) => {
        const la = a.__interestLevel ?? 99;
        const lb = b.__interestLevel ?? 99;
        if (la !== lb) return la - lb;
        return (b.score || 0) - (a.score || 0);
    });

    while (improved && safety++ < 100) {
        improved = false;

        const dayOrder = days.map((day, i) => ({ idx: i, gap: targets[i] - dayTime(day) }))
            .filter(x => x.gap > CONFIG.assignment.minAcceptable)
            .sort((a, b) => b.gap - a.gap);

        for (const { idx: d } of dayOrder) {
            const day = days[d];
            const target = targets[d];

            let bestPlaceIdx = -1;
            let bestScore = -Infinity;

            for (let i = 0; i < allCandidates.length; i++) {
                const place = allCandidates[i];
                if (usedInPlan.has(place.__algoId)) continue;

                // 🆕 چک سقف large
                if (getPlacePolicy(place).type === 'large' && currentLargeCount >= maxLargeSlots) {
                    continue;
                }

                // 🆕 چک جامع
                if (!canAddPlaceToDay(day, place)) continue;

                const newTime = computeNewTime(day, place);
                if (newTime > target + CONFIG.assignment.hardTolerance) continue;

                let minDist = Infinity;
                if (day.length > 0) {
                    let maxDist = 0;
                    for (const existing of day) {
                        const dist = placeDistance(place, existing);
                        maxDist = Math.max(maxDist, dist);
                        minDist = Math.min(minDist, dist);
                    }
                    if (maxDist > SOFT_LIMIT * 2) continue;
                }

                const level = place.__interestLevel ?? 99;

                let score = 0;
                if (level === 0) score += 500;
                else if (level === 1) score += 350;
                else if (level === 2) score += 200;
                else if (level === 3) score += 100;
                else score += 25;

                if (day.length > 0) {
                    if (minDist < 1) score += 400;
                    else if (minDist < 2) score += 300;
                    else if (minDist < 3) score += 200;
                    else if (minDist < 5) score += 100;
                    else if (minDist < 8) score += 20;
                    else if (minDist < 12) score -= 100;
                    else score -= minDist * 15;
                }

                const catCount = days.flat().filter(p => p.__categoryName === place.__categoryName).length;
                if (catCount === 0 && (selectedCatNames || []).includes(place.__categoryName)) {
                    score += W.newCategoryInFill;
                } else if (catCount === 1 && (selectedCatNames || []).includes(place.__categoryName)) {
                    score += W.secondCategoryInFill;
                }

                const sameCatInDay = day.filter(x => x.__categoryName === place.__categoryName).length;
                score -= sameCatInDay * W.sameCategoryInFillPenalty;

                const newGap = Math.abs(target - newTime);
                if (newGap <= CONFIG.assignment.idealTolerance) score += W.idealTimeBonusFill;
                else score += Math.max(0, W.timeGapMaxFill - newGap);

                score += (place.score || 0) * W.placeScoreWeightFill;

                if (score > bestScore) {
                    bestScore = score;
                    bestPlaceIdx = i;
                }
            }

            if (bestPlaceIdx >= 0) {
                const place = allCandidates[bestPlaceIdx];
                const alreadyUsed = days.some(day => day.some(p => p.__algoId === place.__algoId));
                if (!alreadyUsed) {
                    day.push(place);
                    usedInPlan.add(place.__algoId);
                    if (getPlacePolicy(place).type === 'large') currentLargeCount++;
                }
                allCandidates.splice(bestPlaceIdx, 1);
                improved = true;
                break;
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════
// 🔍 بخش ۸: Local Search
// ═══════════════════════════════════════════════════════════
function totalCost(days, targets, dayTimes) {
    const W = CONFIG.assignment.weights;
    let total = 0;

    for (let i = 0; i < days.length; i++) {
        const t = dayTimes[i];
        const target = targets[i];
        const absDiff = Math.abs(t - target);

        if (absDiff <= CONFIG.assignment.idealTolerance) {
            total += absDiff * W.idealDiffWeight;
        } else if (absDiff <= CONFIG.assignment.hardTolerance) {
            total += (absDiff - CONFIG.assignment.idealTolerance) * W.hardDiffWeight + W.hardBasePenalty;
        } else {
            const excess = absDiff - CONFIG.assignment.hardTolerance;
            total += W.overflowBasePenalty + excess * excess * W.overflowQuadratic;
        }
    }

    for (const day of days) {
        if (day.length < 2) continue;
        let totalDist = 0, maxDist = 0, n = 0;
        for (let a = 0; a < day.length; a++) {
            for (let b = a + 1; b < day.length; b++) {
                const d = placeDistance(day[a], day[b]);
                totalDist += d;
                maxDist = Math.max(maxDist, d);
                n++;
            }
        }
        if (n > 0) {
            const avg = totalDist / n;
            total += avg * W.avgDistWeightCost;
            total += maxDist * W.maxDistWeightCost;
            if (maxDist > W.farDistThreshold) {
                total += Math.pow(maxDist - W.farDistThreshold, 2) * W.farDistQuadraticCost;
            }
        }
    }

    for (const day of days) {
        for (const p of day) {
            const level = p.__interestLevel ?? 99;
            const bonus = W.interestLevelBonus[level];
            total += (bonus !== undefined) ? bonus : W.interestLevelDefault;
        }
    }

    for (const day of days) {
        const catCounts = {};
        for (const p of day) {
            catCounts[p.__categoryName] = (catCounts[p.__categoryName] || 0) + 1;
        }
        for (const cat in catCounts) {
            if (catCounts[cat] > W.redundantCategoryThreshold) {
                total += (catCounts[cat] - W.redundantCategoryThreshold) * W.redundantCategoryPenalty;
            }
        }
    }

    return total;
}

function tryMove(days, targets, SOFT_LIMIT, dayTimes, beforeCost, maxLargeSlots) {
    const HARD = CONFIG.assignment.hardTolerance;
    const currentLargeCount = countLargeInPlan(days);

    for (let a = 0; a < days.length; a++) {
        for (let i = days[a].length - 1; i >= 0; i--) {
            const place = days[a][i];
            const placeType = getPlacePolicy(place).type;

            if (days[a].length === 1 && placeType === 'full_day') continue;

            for (let b = 0; b < days.length; b++) {
                if (a === b) continue;

                // 🆕 چک سقف large اگه جابه‌جایی large هست
                if (placeType === 'large') {
                    // چون از یه روز برداشته می‌شه و به روز دیگه اضافه می‌شه،
                    // تعداد کل تغییر نمی‌کنه — ولی چک می‌کنیم که روز مقصد large نداشته باشه
                    if (days[b].some(x => getPlacePolicy(x).type === 'large')) continue;
                }

                // 🆕 چک جامع قبل از حرکت
                if (!canAddPlaceToDay(days[b], place)) continue;

                let distOk = true;
                for (const existing of days[b]) {
                    if (placeDistance(place, existing) > SOFT_LIMIT * 2) {
                        distOk = false;
                        break;
                    }
                }
                if (!distOk) continue;

                days[a].splice(i, 1);
                days[b].push(place);

                const newTimeA = dayTimeEstimated(days[a]);
                const newTimeB = dayTimeEstimated(days[b]);

                if (newTimeA > targets[a] + HARD || newTimeB > targets[b] + HARD) {
                    days[b].pop();
                    days[a].splice(i, 0, place);
                    continue;
                }

                const oldTimeA = dayTimes[a], oldTimeB = dayTimes[b];
                dayTimes[a] = newTimeA;
                dayTimes[b] = newTimeB;
                const newCost = totalCost(days, targets, dayTimes);

                if (newCost < beforeCost - 1) return true;

                days[b].pop();
                days[a].splice(i, 0, place);
                dayTimes[a] = oldTimeA;
                dayTimes[b] = oldTimeB;
            }
        }
    }
    return false;
}

function trySwap(days, targets, SOFT_LIMIT, dayTimes, beforeCost, maxLargeSlots) {
    const HARD = CONFIG.assignment.hardTolerance;

    for (let a = 0; a < days.length; a++) {
        for (let b = a + 1; b < days.length; b++) {
            for (let i = 0; i < days[a].length; i++) {
                for (let j = 0; j < days[b].length; j++) {
                    const pa = days[a][i];
                    const pb = days[b][j];

                    const typeA = getPlacePolicy(pa).type;
                    const typeB = getPlacePolicy(pb).type;

                    if (typeA === 'full_day' && days[b].length > 0) continue;
                    if (typeB === 'full_day' && days[a].length > 0) continue;

                    // 🆕 دو تا large جابه‌جا نشن
                    if (typeA === 'large' && typeB === 'large') continue;

                    // 🆕 چک: اگه روز مقصد large داره، large جدید نره
                    const aHasLarge = days[a].some((x, idx) => idx !== i && getPlacePolicy(x).type === 'large');
                    const bHasLarge = days[b].some((x, idx) => idx !== j && getPlacePolicy(x).type === 'large');
                    if (typeA === 'large' && bHasLarge) continue;
                    if (typeB === 'large' && aHasLarge) continue;

                    days[a][i] = pb;
                    days[b][j] = pa;

                    const timeA = dayTimeEstimated(days[a]);
                    const timeB = dayTimeEstimated(days[b]);

                    if (timeA <= targets[a] + HARD && timeB <= targets[b] + HARD) {
                        const oldTimeA = dayTimes[a], oldTimeB = dayTimes[b];
                        dayTimes[a] = timeA;
                        dayTimes[b] = timeB;
                        const newCost = totalCost(days, targets, dayTimes);

                        if (newCost < beforeCost - 1) return true;

                        dayTimes[a] = oldTimeA;
                        dayTimes[b] = oldTimeB;
                    }

                    days[a][i] = pa;
                    days[b][j] = pb;
                }
            }
        }
    }
    return false;
}

function strongLocalSearch(days, targets, SOFT_LIMIT, selectedCatNames, maxLargeSlots) {
    const MAX_ITER = CONFIG.assignment.maxIterations;
    const dayTimes = days.map(d => dayTimeEstimated(d));

    for (let iter = 0; iter < MAX_ITER; iter++) {
        const beforeCost = totalCost(days, targets, dayTimes);
        if (tryMove(days, targets, SOFT_LIMIT, dayTimes, beforeCost, maxLargeSlots)) continue;
        if (trySwap(days, targets, SOFT_LIMIT, dayTimes, beforeCost, maxLargeSlots)) continue;
        break;
    }

    return days;
}

function cleanupOutOfRangeDays(days, targets, unassigned, usedInPlan) {
    const RW = CONFIG.assignment.weights.repair;

    for (let i = 0; i < days.length; i++) {
        const day = days[i];
        const target = targets[i];

        let time = dayTimeEstimated(day);
        let safety = 0;

        while (time > target + CONFIG.assignment.hardTolerance && day.length > 1 && safety++ < 20) {
            let removeIdx = -1;
            let worstScore = Infinity;

            for (let j = 0; j < day.length; j++) {
                const p = day[j];
                if (getPlacePolicy(p).type === 'full_day') continue;
                if (day.length === 1) continue;

                const level = p.__interestLevel ?? 99;

                let distScore = 0, otherCount = 0;
                for (let k = 0; k < day.length; k++) {
                    if (k === j) continue;
                    distScore += placeDistance(p, day[k]);
                    otherCount++;
                }
                distScore /= Math.max(1, otherCount);

                const score =
                    (4 - Math.min(level, 4)) * RW.levelBasePenalty +
                    (p.score || 0) * RW.scoreWeight +
                    getPlaceDuration(p) * RW.durationWeight -
                    distScore * RW.distPenalty;

                if (score < worstScore) {
                    worstScore = score;
                    removeIdx = j;
                }
            }

            if (removeIdx >= 0) {
                const removed = day.splice(removeIdx, 1)[0];
                usedInPlan.delete(removed.__algoId);
                if (!unassigned.some(u => u.__algoId === removed.__algoId)) {
                    unassigned.push(removed);
                }
                time = dayTimeEstimated(day);
            } else {
                break;
            }
        }
    }
}

function repairAfterTSP(days, targets, unassigned, usedInPlan) {
    const HARD = CONFIG.assignment.hardTolerance;
    const RW = CONFIG.assignment.weights.repair;
    let totalRemoved = 0;

    for (let i = 0; i < days.length; i++) {
        const day = days[i];
        const target = targets[i];

        let time = dayTimeExact(day);
        let safety = 0;

        while (time > target + HARD && day.length > 1 && safety++ < 10) {
            let removeIdx = -1;
            let worstScore = Infinity;

            for (let j = 0; j < day.length; j++) {
                const p = day[j];
                if (getPlacePolicy(p).type === 'full_day') continue;
                if (day.length === 1) continue;

                const level = p.__interestLevel ?? 99;

                let distScore = 0, otherCount = 0;
                for (let k = 0; k < day.length; k++) {
                    if (k === j) continue;
                    distScore += placeDistance(p, day[k]);
                    otherCount++;
                }
                distScore /= Math.max(1, otherCount);

                const score =
                    (4 - Math.min(level, 4)) * RW.levelBasePenalty +
                    (p.score || 0) * RW.scoreWeight +
                    getPlaceDuration(p) * RW.durationWeight -
                    distScore * RW.distPenalty;

                if (score < worstScore) {
                    worstScore = score;
                    removeIdx = j;
                }
            }

            if (removeIdx >= 0) {
                const removed = day.splice(removeIdx, 1)[0];
                if (usedInPlan) usedInPlan.delete(removed.__algoId);
                if (unassigned && !unassigned.some(u => u.__algoId === removed.__algoId)) {
                    unassigned.push(removed);
                }
                time = dayTimeExact(day);
                totalRemoved++;
            } else {
                break;
            }
        }
    }

    return totalRemoved;
}

// ═══════════════════════════════════════════════════════════
// 🧭 بخش ۹: TSP
// ═══════════════════════════════════════════════════════════
function nearestNeighborRoute(day) {
    if (day.length <= 2) return [...day];
    const remaining = new Set(day);
    const start = [...day].sort((a, b) => (b.score || 0) - (a.score || 0))[0];
    const route = [start];
    remaining.delete(start);

    while (remaining.size) {
        const last = route[route.length - 1];
        let bestPlace = null;
        let bestDist = Infinity;
        for (const candidate of remaining) {
            const d = placeDistance(last, candidate);
            if (d < bestDist) { bestDist = d; bestPlace = candidate; }
        }
        route.push(bestPlace);
        remaining.delete(bestPlace);
    }
    return route;
}

function twoOptImprove(route) {
    if (route.length < 3) return [...route];
    let best = [...route];
    let bestDist = routeDistance(best);
    let improved = true;
    let safety = 0;

    while (improved && safety++ < 100) {
        improved = false;
        for (let i = 1; i < best.length - 1; i++) {
            for (let k = i + 1; k < best.length; k++) {
                const candidate = best.slice(0, i)
                    .concat(best.slice(i, k + 1).reverse())
                    .concat(best.slice(k + 1));
                const d = routeDistance(candidate);
                if (d < bestDist - 1e-9) {
                    best = candidate;
                    bestDist = d;
                    improved = true;
                    break;
                }
            }
            if (improved) break;
        }
    }
    return best;
}

function optimizeRoutes(days) {
    return days.map(day => {
        if (day.length < 2) return [...day];
        return twoOptImprove(nearestNeighborRoute(day));
    });
}

// ═══════════════════════════════════════════════════════════
// 🚀 بخش ۱۰: Pipeline اصلی
// ═══════════════════════════════════════════════════════════
export function getRecommendations(interests, options, logFn) {
    const _log = logFn || (() => { });
    const CATEGORIES_DATA = getCategoriesData();
    const REAL_PLACES = getRealPlaces();

    const selectedCategories = interests
        .map(name => CATEGORIES_DATA.find(c => c.name === name))
        .filter(Boolean);

    const budgetMax = Number((options.budgetStr || '0-5000000').split('-')[1]) || 5_000_000;
    const duration = Math.max(1, Math.min(CONFIG.maxTripDays, Number(options.duration) || 3));
    const hasChild = Boolean(options.hasChild);
    const dailyDurations = Array.from({ length: duration }, (_, i) =>
        Math.max(0.5, finiteNumber(options.dailyDurations?.[i], 8))
    );
    const avgDailyHours = dailyDurations.reduce((a, b) => a + b, 0) / dailyDurations.length;

    _log('══════════════════════════════════════');
    _log('🚀 الگوریتم ترکیبی');
    _log(`📅 ${duration} روز | مدت: ${dailyDurations.join('/')} ساعت`);
    _log(`💰 بودجه: ${(budgetMax / 1e6).toFixed(1)}M | کودک: ${hasChild ? 'بله' : 'خیر'}`);

    // 🆕 لاگ سقف‌ها
    const maxFullDay = CONFIG.assignment.maxFullDaySlotsByDay(duration);
    const maxLarge = CONFIG.assignment.maxLargeSlotsByDay(duration);
    _log(`🔒 سقف full_day: ${maxFullDay} | سقف large: ${maxLarge}`);
    _log('══════════════════════════════════════');

    if (!REAL_PLACES.length || !selectedCategories.length) return [];

    _log('\n▸ فاز ۱: Fuzzy Weights');
    const fuzzyWeights = getFuzzyWeights(duration, hasChild, budgetMax);

    _log('\n▸ فاز ۲: CBF + Top-K');
    const userPrefs = {
        interests: selectedCategories.map(c => c.name),
        interestObjects: selectedCategories,
        budgetMax,
        hasChild,
        avgDailyHours
    };

    const scored = cbfScoring(REAL_PLACES, userPrefs, fuzzyWeights);
    const topKResult = selectTopKCandidates(scored, userPrefs, fuzzyWeights, duration, budgetMax);
    const selected = topKResult.pool;

    _log(`   ${selected.length} جاذبه از ${topKResult.candidateCount} کاندید (K=${topKResult.K})`);
    if (selected.length === 0) return [];

    _log('\n▸ فاز ۳: Assignment');
    const assignResult = assignPlacesToDays(selected, duration, dailyDurations, REAL_PLACES, selectedCategories);
    let days = assignResult.days;
    const unassigned = assignResult.unassigned;
    const usedInPlan = new Set(days.flat().map(p => p.__algoId));

    _log(`   ${days.flat().length} مکان تخصیص یافت`);

    _log('\n▸ فاز ۴: TSP');
    const beforeDist = days.reduce((s, d) => s + routeDistance(d), 0);
    days = optimizeRoutes(days);
    const afterDist = days.reduce((s, d) => s + routeDistance(d), 0);
    _log(`   مسافت: ${beforeDist.toFixed(2)} → ${afterDist.toFixed(2)} km`);

    _log('\n▸ فاز ۵: Repair');
    const targets = dailyDurations.map(h => Math.round(h * 60));
    const removed = repairAfterTSP(days, targets, unassigned, usedInPlan);
    _log(`   ${removed} جاذبه حذف شد`);

    days.__unassigned = unassigned;
    return days;
}