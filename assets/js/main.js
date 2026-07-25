// ============================================
// Fancy Silk Store — shared behavior
// ============================================

// Nav scroll state + mobile toggle
(function(){
  const nav = document.querySelector('.site-nav');
  if(!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 30);
  });
  const toggle = nav.querySelector('.nav-toggle');
  if(toggle){
    toggle.addEventListener('click', () => nav.classList.toggle('mobile-open'));
  }
})();

// Hero word-rotator (slide up/out, slide in from below — not a typewriter effect)
(function(){
  const el = document.querySelector('.word-rotate');
  if(!el) return;
  const words = (el.dataset.words || '').split(',').map(w => w.trim()).filter(Boolean);
  if(words.length < 2) return;

  let i = 0;
  const current = document.createElement('span');
  current.className = 'wr-current';
  current.textContent = words[0];
  el.textContent = '';
  el.appendChild(current);

  setInterval(() => {
    current.classList.add('wr-out');
    setTimeout(() => {
      i = (i + 1) % words.length;
      current.textContent = words[i];
      current.classList.remove('wr-out');
      current.classList.remove('wr-in');
      void current.offsetWidth; // restart animation
      current.classList.add('wr-in');
    }, 480);
  }, 2400);
})();

// Scroll-reveal for any .reveal / .reel-card element (re-runs safely if called after dynamic render)
function initReveal(){
  const targets = document.querySelectorAll('.reveal:not([data-observed]), .reel-card:not([data-observed])');
  if(!targets.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting){
        e.target.classList.add('in-view');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  targets.forEach(t => { t.dataset.observed = '1'; io.observe(t); });
}
initReveal();

// Marquee duplication for seamless loop
(function(){
  const track = document.querySelector('.marquee-track');
  if(!track) return;
  track.innerHTML += track.innerHTML;
})();

// ============================================
// Reels — render from REEL_IMAGES (products.js)
// ============================================
(function(){
  const row = document.querySelector('.reels-row');
  if(!row || typeof REEL_IMAGES === 'undefined') return;
  row.innerHTML = REEL_IMAGES.map(file => `
    <a class="reel-card" href="https://www.instagram.com/fancysilkstore" target="_blank" rel="noopener">
      <img src="/assets/images/${file}" alt="Fancy Silk Store Instagram reel" loading="lazy">
      <div class="reel-play"><svg viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg></div>
      <span class="reel-label">Watch on Instagram</span>
    </a>
  `).join('');
  initReveal();
})();

// ============================================
// Catalog — render cards + filters from PRODUCTS (products.js)
// ============================================
(function(){
  const track = document.querySelector('.carousel-track');
  const filtersWrap = document.querySelector('.catalog-filters');
  const dotsWrap = document.querySelector('.carousel-dots');
  if(!track || typeof PRODUCTS === 'undefined') return;

  let currentCategory = 'All';
  let active = 0;
  let cards = [];

  function money(n){ return '₹' + n.toLocaleString('en-IN'); }

  function cardHTML(p){
    const msg = encodeURIComponent(`Hi, I'm interested in the ${p.name} (${money(p.price)}). Is it available?`);
    return `
      <article class="carousel-card">
        <div class="cc-img"><img src="/assets/images/${p.image}" alt="${p.name} — ${p.fabric}" loading="lazy"></div>
        <div class="cc-body">
          <span class="cc-tag">${p.category}</span>
          <h3>${p.name}</h3>
          <div class="cc-price">${money(p.price)}</div>
          <a class="cc-order-btn" href="https://wa.me/918699161743?text=${msg}" target="_blank" rel="noopener">
            <img src="/assets/images/whatsapp-logo.jpg" class="btn-icon round" alt="">Order This
          </a>
        </div>
      </article>
    `;
  }

  function renderFilters(){
    if(!filtersWrap) return;
    const cats = ['All', ...PRODUCT_CATEGORIES];
    filtersWrap.innerHTML = cats.map(c =>
      `<button class="filter-chip${c === 'All' ? ' active' : ''}" data-cat="${c}">${c}</button>`
    ).join('');
    filtersWrap.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        filtersWrap.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentCategory = chip.dataset.cat;
        renderCards();
      });
    });
  }

  function renderCards(){
    const list = currentCategory === 'All'
      ? PRODUCTS
      : PRODUCTS.filter(p => p.category === currentCategory);
    track.innerHTML = list.map(cardHTML).join('');
    cards = Array.from(track.querySelectorAll('.carousel-card'));
    active = 0;

    if(dotsWrap){
      dotsWrap.innerHTML = cards.map((_, i) =>
        `<span class="${i === 0 ? 'active' : ''}"></span>`
      ).join('');
      Array.from(dotsWrap.children).forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));
    }
    positionCards();
  }

  function positionCards(){
    const n = cards.length;
    cards.forEach((card, i) => {
      const diff = (i - active + n) % n;
      let pos = 'hidden';
      if(diff === 0) pos = 'active';
      else if(diff === 1) pos = 'right1';
      else if(diff === 2) pos = 'right2';
      else if(diff === n - 1) pos = 'left1';
      else if(diff === n - 2) pos = 'left2';
      card.dataset.pos = pos;
    });
    if(dotsWrap){
      Array.from(dotsWrap.children).forEach((d, i) => d.classList.toggle('active', i === active));
    }
  }

  function goTo(i){
    const n = cards.length;
    if(!n) return;
    active = (i + n) % n;
    positionCards();
  }

  document.querySelector('.carousel-next')?.addEventListener('click', () => goTo(active + 1));
  document.querySelector('.carousel-prev')?.addEventListener('click', () => goTo(active - 1));

  // Clicking a side (non-active) card brings it to front instead of doing nothing
  track.addEventListener('click', e => {
    const card = e.target.closest('.carousel-card');
    if(!card) return;
    if(card.dataset.pos === 'active') return; // let the Order This link work normally
    e.preventDefault();
    const idx = cards.indexOf(card);
    if(idx !== -1) goTo(idx);
  });

  let startX = null;
  track.addEventListener('touchstart', e => startX = e.touches[0].clientX, {passive:true});
  track.addEventListener('touchend', e => {
    if(startX === null) return;
    const diff = e.changedTouches[0].clientX - startX;
    if(diff > 50) goTo(active - 1);
    else if(diff < -50) goTo(active + 1);
    startX = null;
  });

  renderFilters();
  renderCards();

  setInterval(() => goTo(active + 1), 4500);
})();
