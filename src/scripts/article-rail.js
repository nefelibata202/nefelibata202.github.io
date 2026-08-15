// 版心 · 鱼尾：把正文的 h2 分节刻在左侧版口上，朱砂双鱼尾随阅读位置下移。
// 纯增强——没有 JS 时页面照常可读，只是不显示版心。
export function rail() {
  const root = document.getElementById('ar-rail');
  const body = document.querySelector('.ar-main .post');
  const prog = document.getElementById('ar-prog');
  if (!root || !body) return;

  const heads = [...body.querySelectorAll('h2[id]')];
  const line = root.querySelector('.ar-fish');
  const name = root.querySelector('.ar-fish-name');
  const ticksBox = root.querySelector('.ar-rail-ticks');
  if (heads.length < 2 || !line || !name || !ticksBox) return;

  const ticks = heads.map((h) => {
    const label = (h.textContent || '').trim();
    const a = document.createElement('a');
    a.className = 'ar-tick';
    a.href = '#' + h.id;
    a.setAttribute('aria-label', '跳到：' + label);
    ticksBox.appendChild(a);
    return a;
  });

  let marks = [];
  let height = 1;

  function measure() {
    height = Math.max(1, body.offsetHeight);
    const top = body.getBoundingClientRect().top + window.scrollY;
    marks = heads.map((h) => (h.getBoundingClientRect().top + window.scrollY - top) / height);
    ticks.forEach((t, i) => { t.style.top = marks[i] * 100 + '%'; });
    root.classList.add('is-on');
    update();
  }

  function update() {
    const top = body.getBoundingClientRect().top + window.scrollY;
    const eye = window.scrollY + window.innerHeight * 0.34; // 视线落点，不是屏幕顶
    const p = Math.min(1, Math.max(0, (eye - top) / height));
    line.style.top = p * 100 + '%';
    if (prog) prog.style.transform = 'scaleX(' + p + ')';

    const before = p < marks[0] - 0.004;
    let cur = 0;
    for (let i = 0; i < marks.length; i++) if (p >= marks[i] - 0.004) cur = i;
    name.textContent = before ? '' : (heads[cur].textContent || '').trim();
    root.classList.toggle('is-pre', before);
    ticks.forEach((t, i) => t.classList.toggle('is-cur', !before && i === cur));
  }

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; update(); });
  };

  measure();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', measure, { passive: true });
  // 图片 / 字体 / Mermaid 落位后重新丈量
  addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  if (window.ResizeObserver) new ResizeObserver(measure).observe(body);
}
