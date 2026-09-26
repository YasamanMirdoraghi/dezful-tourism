// ═══════════════════════════════════════════════════════════
// pages/attraction.js — صفحه‌ی جاذبه‌ها
// ═══════════════════════════════════════════════════════════

import { faNum, debounce, $ } from '../utils/index.js';

/**
 * راه‌اندازی صفحه‌ی جاذبه‌ها
 */
export function initAttraction() {
    const gridContainer = $('#attractionsGrid');
    if (!gridContainer) return;

    // ═══ داده‌ها از window ═══
    const placesData = window.PLACES_DATA || [];

    const resultCount = $('#resultCount');
    const paginationContainer = $('#paginationContainer');
    const clearAllBtn = $('#clearAllBtn');
    const searchInput = $('#searchInput');
    const filterCheckboxes = document.querySelectorAll('#filterSidebar input[type="checkbox"]');

    let currentPage = 1;
    const itemsPerPage = 12;

    // ═══ به‌روزرسانی تعداد رایگان/پولی ═══
    function updateCostCounts() {
        const freeCount = placesData.filter(p => p.cost === 0).length;
        const paidCount = placesData.filter(p => p.cost > 0).length;

        const freeEl = $('#freeCount');
        const paidEl = $('#paidCount');
        if (freeEl) freeEl.textContent = faNum(freeCount);
        if (paidEl) paidEl.textContent = faNum(paidCount);
    }

    // ═══ ساخت کارت جاذبه ═══
    function createCard(place) {
        const card = document.createElement('div');
        card.className = 'attraction-card';
        card.dataset.category = place.category;
        card.dataset.parentCategory = place.parent_category;
        card.dataset.cost = place.cost;

        const costText = place.cost === 0 ? 'رایگان' : faNum(place.cost.toLocaleString()) + ' تومان';
        const imageUrl = `/static/img/${place.slug}.jpg`;

        card.innerHTML = `
            <div class="attraction-img">
                <img src="${imageUrl}" alt="${place.name}" 
                    onerror="this.onerror=null; this.src='/static/img/${place.slug}.png'; this.onerror=function(){this.src='/static/img/${place.slug}.jpeg'; this.onerror=function(){this.src='/static/img/${place.slug}.webp'; this.onerror=function(){this.src='/static/img/asiyab-haye-abi.jpg';};};};">
                <span class="badge">${place.category}</span>
            </div>
            <div class="attraction-body">
                <h4>${place.name}</h4>
                <p>${place.short_description || place.desc || ''}</p>
                <div class="meta">
                    <span><i class="fas fa-wallet"></i> ${costText}</span>
                </div>
            </div>
        `;

        card.addEventListener('click', function () {
            window.location.href = `/places/place/${place.slug}/`;
        });

        card.style.cursor = 'pointer';

        return card;
    }

    // ═══ فیلتر ═══
    function getFilteredPlaces() {
        const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

        const selectedCategories = [...document.querySelectorAll('[data-filter="category"]:checked')].map(c => c.value);
        const selectedSubCategories = [...document.querySelectorAll('[data-filter="subcategory"]:checked')].map(c => c.value);
        const selectedCosts = [...document.querySelectorAll('[data-filter="cost"]:checked')].map(c => c.value);

        return placesData.filter(place => {
            // جستجو
            if (searchTerm && !place.name.toLowerCase().includes(searchTerm) && !place.short_description.toLowerCase().includes(searchTerm)) {
                return false;
            }

            // دسته‌بندی اصلی
            if (selectedCategories.length > 0 && !selectedCategories.includes(place.parent_category)) {
                return false;
            }

            // زیرمجموعه
            if (selectedSubCategories.length > 0 && !selectedSubCategories.includes(place.category)) {
                return false;
            }

            // هزینه
            if (selectedCosts.length > 0) {
                const isFree = place.cost === 0;
                const passFree = selectedCosts.includes('free');
                const passPaid = selectedCosts.includes('paid');

                if (passFree && passPaid) {
                    // هر دو انتخاب شده — همه قبول
                } else if (passFree && !isFree) {
                    return false;
                } else if (passPaid && isFree) {
                    return false;
                }
            }

            return true;
        });
    }

    // ═══ رندر گرید ═══
    function renderGrid() {
        const filtered = getFilteredPlaces();
        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        if (totalItems === 0) {
            gridContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h4>جاذبه‌ای یافت نشد</h4>
                    <p>فیلترها یا عبارت جستجو را تغییر دهید.</p>
                </div>
            `;
            if (resultCount) resultCount.textContent = `۰ جاذبه`;
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        if (currentPage > totalPages) currentPage = totalPages;

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pagePlaces = filtered.slice(startIndex, endIndex);

        gridContainer.innerHTML = '';
        pagePlaces.forEach(place => {
            gridContainer.appendChild(createCard(place));
        });

        if (resultCount) resultCount.textContent = `${faNum(totalItems)} جاذبه`;
        updatePagination(totalPages);

        // دکمه‌ی حذف فیلترها
        const searchActive = searchInput && searchInput.value.trim() !== '';
        const checkboxActive = document.querySelectorAll('#filterSidebar input[type="checkbox"]:checked').length > 0;

        if (clearAllBtn) {
            if (searchActive || checkboxActive) {
                clearAllBtn.classList.remove('d-none');
            } else {
                clearAllBtn.classList.add('d-none');
            }
        }
    }

    // ═══ صفحه‌بندی ═══
    function updatePagination(totalPages) {
        if (!paginationContainer) return;
        paginationContainer.innerHTML = '';
        if (totalPages <= 1) return;

        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) { currentPage--; renderGrid(); }
        });
        paginationContainer.appendChild(prevBtn);

        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = faNum(i);
            if (i === currentPage) pageBtn.classList.add('active');
            pageBtn.addEventListener('click', () => {
                if (currentPage !== i) { currentPage = i; renderGrid(); }
            });
            paginationContainer.appendChild(pageBtn);
        }

        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) { currentPage++; renderGrid(); }
        });
        paginationContainer.appendChild(nextBtn);
    }

    // ═══ رویدادها ═══
    filterCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            currentPage = 1;
            renderGrid();
        });
    });

    if (searchInput) {
        const debouncedSearch = debounce(() => {
            currentPage = 1;
            renderGrid();
        }, 300);
        searchInput.addEventListener('input', debouncedSearch);
    }

    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            filterCheckboxes.forEach(cb => cb.checked = false);
            if (searchInput) searchInput.value = '';
            currentPage = 1;
            renderGrid();
        });
    }

    // ═══ شروع ═══
    updateCostCounts();
    renderGrid();
}