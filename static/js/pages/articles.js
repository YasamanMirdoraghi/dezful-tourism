// ═══════════════════════════════════════════════════════════
// pages/articles.js — صفحه‌ی لیست مقالات
// ═══════════════════════════════════════════════════════════

import { faNum, debounce, $ } from '../utils/index.js';

/**
 * راه‌اندازی صفحه‌ی مقالات
 */
export function initArticles() {
    const gridContainer = $('#articlesGrid');
    if (!gridContainer) return;

    const articlesData = window.ARTICLES_DATA || [];

    const resultCount = $('#resultCount');
    const paginationContainer = $('#paginationContainer');
    const searchInput = $('#searchInput');
    const clearAllBtn = $('#clearAllBtn');
    const filterCheckboxes = document.querySelectorAll('#filterSidebar input[type="checkbox"]');
    const sortRadios = document.querySelectorAll('#filterSidebar input[type="radio"]');

    let currentPage = 1;
    const itemsPerPage = 6;

    // ═══ توابع کمکی ═══
    function getDurationClass(duration) {
        if (duration < 5) return 'short';
        if (duration <= 10) return 'medium';
        return 'long';
    }

    function getInitials(name) {
        return name.split(' ').map(w => w[0]).join('');
    }

    // ═══ ساخت کارت مقاله ═══
    function createArticleCard(article) {
        const card = document.createElement('div');
        card.className = 'article-card';
        card.dataset.category = article.category;
        card.dataset.author = article.author;
        card.dataset.duration = getDurationClass(article.duration);
        card.dataset.date = article.dateRange;
        card.dataset.featured = article.featured || 'normal';

        card.style.direction = 'rtl';
        card.style.textAlign = 'right';

        let featuredBadge = '';
        if (article.featured === 'popular') {
            featuredBadge = `<span class="featured-badge"><i class="fas fa-fire"></i> پربازدید</span>`;
        } else if (article.featured === 'featured') {
            featuredBadge = `<span class="featured-badge" style="background:#f4d03f;color:#8b6914;"><i class="fas fa-star"></i> ویژه</span>`;
        } else if (article.featured === 'new') {
            featuredBadge = `<span class="featured-badge" style="background:var(--primary-green);"><i class="fas fa-bolt"></i> جدید</span>`;
        }

        const imageUrl = `/static/img/${article.slug}.jpg`;

        card.innerHTML = `
            <div class="article-img">
                <img src="${imageUrl}" alt="${article.title}" 
                    onerror="this.onerror=null; this.src='/static/img/${article.slug}.png'; this.onerror=function(){this.src='/static/img/${article.slug}.jpeg'; this.onerror=function(){this.src='/static/img/${article.slug}.webp'; this.onerror=function(){this.src='/static/img/asiyab-haye-abi.jpg';};};};" 
                    style="width:100%; height:100%; object-fit:cover;">
                <span class="badge">${article.category}</span>
                ${featuredBadge}
            </div>
            <div class="article-body" style="direction:rtl; text-align:right;">
                <h4 style="text-align:right;">${article.title}</h4>
                <p style="text-align:right;">${article.desc}</p>
                <div class="article-author" style="direction:rtl; text-align:right;">
                    <div class="avatar">${getInitials(article.author)}</div>
                    <div class="author-info">
                        <span class="author-name">${article.author}</span>
                        <span class="author-date">${article.date}</span>
                    </div>
                </div>
                <div class="meta" style="direction:rtl; text-align:right;">
                    <span><i class="far fa-clock"></i> ${faNum(article.duration)} دقیقه مطالعه</span>
                    <span><i class="far fa-eye"></i> ${faNum(article.views)}</span>
                </div>
                <a href="/articles/${article.slug}/" class="read-more-link" style="align-self:flex-end;">ادامه مطلب <i class="fas fa-arrow-left"></i></a>
            </div>
        `;
        return card;
    }

    // ═══ فیلتر ═══
    function getFilteredArticles() {
        const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

        const selectedCategories = [...document.querySelectorAll('[data-filter="category"]:checked')].map(c => c.value);
        const selectedAuthors = [...document.querySelectorAll('[data-filter="author"]:checked')].map(c => c.value);
        const selectedDurations = [...document.querySelectorAll('[data-filter="duration"]:checked')].map(c => c.value);
        const selectedDates = [...document.querySelectorAll('[data-filter="date"]:checked')].map(c => c.value);
        const selectedFeatured = [...document.querySelectorAll('[data-filter="featured"]:checked')].map(c => c.value);

        return articlesData.filter(article => {
            if (searchTerm && !article.title.toLowerCase().includes(searchTerm) && !article.desc.toLowerCase().includes(searchTerm)) return false;
            if (selectedCategories.length && !selectedCategories.includes(article.category)) return false;
            if (selectedAuthors.length && !selectedAuthors.includes(article.author)) return false;
            if (selectedDurations.length && !selectedDurations.includes(getDurationClass(article.duration))) return false;

            if (selectedDates.length) {
                const now = new Date();
                const publishedDate = new Date(article.published_date);
                const diffDays = Math.floor((now - publishedDate) / (1000 * 60 * 60 * 24));

                let dateMatch = false;
                selectedDates.forEach(d => {
                    if (d === 'month' && diffDays <= 30) dateMatch = true;
                    if (d === 'three-months' && diffDays <= 90) dateMatch = true;
                    if (d === 'six-months' && diffDays <= 180) dateMatch = true;
                    if (d === 'year' && diffDays <= 365) dateMatch = true;
                });
                if (!dateMatch) return false;
            }

            if (selectedFeatured.length && !selectedFeatured.includes(article.featured)) return false;

            return true;
        });
    }

    // ═══ مرتب‌سازی ═══
    function sortArticles(articles) {
        let sortType = 'newest';
        sortRadios.forEach(r => { if (r.checked) sortType = r.value; });

        const sorted = [...articles];
        switch (sortType) {
            case 'newest': return sorted.sort((a, b) => b.id - a.id);
            case 'popular': return sorted.sort((a, b) => {
                const order = { featured: 3, popular: 2, new: 1, normal: 0 };
                return (order[b.featured] || 0) - (order[a.featured] || 0);
            });
            case 'views': return sorted.sort((a, b) => b.views - a.views);
            case 'shortest': return sorted.sort((a, b) => a.duration - b.duration);
            default: return sorted;
        }
    }

    // ═══ رندر گرید ═══
    function renderGrid() {
        const filtered = getFilteredArticles();
        const sorted = sortArticles(filtered);
        const totalItems = sorted.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        if (totalItems === 0) {
            gridContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h4>مقاله‌ای یافت نشد</h4>
                    <p>فیلترها یا عبارت جستجو را تغییر دهید.</p>
                </div>
            `;
            if (resultCount) resultCount.textContent = `۰ مقاله`;
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        if (currentPage > totalPages) currentPage = totalPages;

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageArticles = sorted.slice(startIndex, endIndex);

        gridContainer.innerHTML = '';
        pageArticles.forEach(article => {
            gridContainer.appendChild(createArticleCard(article));
        });

        if (resultCount) resultCount.textContent = `${faNum(totalItems)} مقاله`;
        updatePagination(totalPages);

        // دکمه‌ی حذف فیلترها
        const searchActive = searchInput && searchInput.value.trim() !== '';
        const checkboxActive = document.querySelectorAll('#filterSidebar input[type="checkbox"]:checked').length > 0;
        const sortActive = document.querySelector('input[name="sort-by"]:checked') &&
                          document.querySelector('input[name="sort-by"]:checked').value !== 'newest';

        if (clearAllBtn) {
            if (searchActive || checkboxActive || sortActive) {
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

    sortRadios.forEach(r => {
        r.addEventListener('change', () => {
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
            const newestRadio = document.querySelector('input[name="sort-by"][value="newest"]');
            if (newestRadio) newestRadio.checked = true;
            if (searchInput) searchInput.value = '';
            currentPage = 1;
            renderGrid();
        });
    }

    // ═══ شروع ═══
    renderGrid();
}