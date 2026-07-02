// 归来重设计 · 共用增强：进入渐显 + 水印视差（尊重 prefers-reduced-motion）
export function enhance(root = document) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    root.querySelectorAll('.rd-reveal').forEach((el) => el.classList.add('is-in'));
    return;
  }
  const els = [...root.querySelectorAll('.rd-reveal')];
  const io = new IntersectionObserver((ents) => {
    ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  let seen = 0;
  els.forEach((el) => {
    if (el.getBoundingClientRect().top < innerHeight * 0.92) {
      el.style.transitionDelay = (seen++ * 90) + 'ms';
      setTimeout(() => el.classList.add('is-in'), 40);
    } else io.observe(el);
  });
  const pEls = [...root.querySelectorAll('[data-parallax]')];
  if (pEls.length) addEventListener('scroll', () => {
    pEls.forEach((el) => { el.style.translate = '0 ' + (scrollY * parseFloat(el.dataset.parallax || '-0.05')).toFixed(1) + 'px'; });
  }, { passive: true });
}

// 筛选 chips：容器内 [data-chip] 按钮，目标 [data-tags] 条目；淡出→切换→淡入
export function chipFilter({ chips, list, items, count, empty, onApply }) {
  const btns = [...chips.querySelectorAll('[data-chip]')];
  btns.forEach((b) => b.addEventListener('click', () => {
    btns.forEach((x) => x.classList.toggle('is-on', x === b));
    list.style.opacity = '0';
    setTimeout(() => {
      const tag = b.dataset.chip;
      let n = 0;
      items().forEach((it) => {
        const on = tag === '*' || (it.dataset.tags || '').split('|').includes(tag);
        it.hidden = !on;
        if (on) n++;
      });
      if (count) count.textContent = String(n);
      if (empty) empty.hidden = n > 0;
      if (onApply) onApply(tag, n);
      setTimeout(() => { list.style.opacity = '1'; }, 20);
    }, 180);
  }));
}
