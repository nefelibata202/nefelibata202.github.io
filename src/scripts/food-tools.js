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
