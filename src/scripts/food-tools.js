const storageKey = (city, name) => `guilai:food-dishes:${encodeURIComponent(city)}:${encodeURIComponent(name)}`;

export function initFoodTools(root = document) {
  root.querySelectorAll('[data-dish-editor]').forEach((editor) => {
    const key = storageKey(editor.dataset.city, editor.dataset.name);
    const input = editor.querySelector('[data-dish-input]');
    const display = editor.closest('.rd-spot')?.querySelector('[data-dishes-display] .val');
    const status = editor.querySelector('.rd-save-status');
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) input.value = saved;
    } catch { /* Storage can be unavailable in private browsing. */ }

    const updateDisplay = (value) => {
      if (!display) return;
      const dishes = value.split(/[,，、]/).map((dish) => dish.trim()).filter(Boolean);
      display.textContent = dishes.length ? dishes.join(' / ') : '还没记';
    };
    updateDisplay(input.value);

    editor.querySelector('[data-dish-form]').addEventListener('submit', (event) => {
      event.preventDefault();
      const value = input.value.trim();
      try {
        localStorage.setItem(key, value);
        updateDisplay(value);
        status.textContent = '已保存在这台设备';
      } catch {
        status.textContent = '保存失败，请检查浏览器存储设置';
      }
    });
  });

  root.querySelectorAll('[data-copy-address]').forEach((button) => {
    button.addEventListener('click', async () => {
      const label = button.textContent;
      try {
        await navigator.clipboard.writeText(button.dataset.copyAddress);
        button.textContent = '已复制';
      } catch {
        button.textContent = '复制失败';
      }
      button.disabled = true;
      setTimeout(() => { button.textContent = label; button.disabled = false; }, 1800);
    });
  });
}

export function initFoodFilters(root = document) {
  const cityGroup = root.getElementById('food-city-filters');
  const cuisineSelect = root.getElementById('food-cuisine-filter');
  const searchInput = root.getElementById('food-search');
  const viewTabs = root.getElementById('food-view-tabs');
  const spots = [...root.querySelectorAll('[data-food-spot]')];
  if (!cityGroup || !cuisineSelect || !searchInput || !viewTabs || !spots.length) return;

  let city = '*';
  let activeStatus = 'visited';
  let currentPage = 1;
  const pageSize = 5;
  const cityButtons = [...cityGroup.querySelectorAll('[data-city-filter]')];
  const tabButtons = [...viewTabs.querySelectorAll('[data-food-status]')];
  const pagers = [...root.querySelectorAll('[data-food-pagination]')];
  const apply = () => {
    const cuisine = cuisineSelect.value;
    const query = searchInput.value.trim().toLocaleLowerCase();
    const filtered = spots.filter((spot) => (city === '*' || spot.dataset.city === city)
        && (cuisine === '*' || (spot.dataset.cuisines || '').split('|').includes(cuisine))
        && (!query || spot.textContent.toLocaleLowerCase().includes(query)));
    const visited = filtered.filter((spot) => spot.dataset.status === 'visited').length;
    const wanted = filtered.filter((spot) => spot.dataset.status === 'wishlist').length;
    const activeSpots = filtered.filter((spot) => spot.dataset.status === activeStatus);
    const pageCount = Math.max(1, Math.ceil(activeSpots.length / pageSize));
    currentPage = Math.min(currentPage, pageCount);
    const start = (currentPage - 1) * pageSize;
    const pageSpots = new Set(activeSpots.slice(start, start + pageSize));
    spots.forEach((spot) => { spot.hidden = !pageSpots.has(spot); });

    const visitedSection = root.getElementById('rd-visited');
    const wishlistSection = root.getElementById('rd-wishlist');
    visitedSection.hidden = activeStatus !== 'visited' || visited === 0;
    wishlistSection.hidden = activeStatus !== 'wishlist' || wanted === 0;
    root.querySelectorAll('.rd-band').forEach((band) => {
      band.hidden = ![...band.querySelectorAll('[data-food-spot]')].some((spot) => !spot.hidden);
    });
    root.getElementById('rd-empty').hidden = activeSpots.length > 0;
    root.getElementById('rd-count').textContent = String(visited);
    root.getElementById('rd-wish-count').textContent = String(wanted);
    root.getElementById('visited-section-count').textContent = `${visited} 家`;
    root.getElementById('wishlist-section-count').textContent = `${wanted} 家`;

    tabButtons.forEach((button) => {
      const selected = button.dataset.foodStatus === activeStatus;
      button.classList.toggle('is-on', selected);
      button.setAttribute('aria-pressed', String(selected));
      button.querySelector('.food-tab-count').textContent = String(button.dataset.foodStatus === 'visited' ? visited : wanted);
    });
    pagers.forEach((pager) => {
      pager.hidden = activeSpots.length <= pageSize;
      pager.querySelector('[data-page-label]').textContent = `${start + 1}–${Math.min(start + pageSize, activeSpots.length)} / ${activeSpots.length} 家 · ${currentPage} / ${pageCount} 页`;
      pager.querySelector('[data-page-prev]').disabled = currentPage === 1;
      pager.querySelector('[data-page-next]').disabled = currentPage === pageCount;
    });
  };

  tabButtons.forEach((button) => button.addEventListener('click', () => {
    activeStatus = button.dataset.foodStatus;
    currentPage = 1;
    apply();
  }));
  cityButtons.forEach((button) => button.addEventListener('click', () => {
    city = button.dataset.cityFilter;
    currentPage = 1;
    cityButtons.forEach((item) => item.classList.toggle('is-on', item === button));
    apply();
  }));
  cuisineSelect.addEventListener('change', () => { currentPage = 1; apply(); });
  searchInput.addEventListener('input', () => { currentPage = 1; apply(); });
  pagers.forEach((pager) => {
    pager.querySelector('[data-page-prev]').addEventListener('click', () => { currentPage -= 1; apply(); });
    pager.querySelector('[data-page-next]').addEventListener('click', () => { currentPage += 1; apply(); });
  });
  apply();
}
