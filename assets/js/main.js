// ============================================
// Fancy Silk Store — shared behavior
// ============================================

// PWA install support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

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
  const VISIBLE_ON_MOBILE = 8;
  row.innerHTML = REEL_IMAGES.map((file, i) => `
    <a class="reel-card${i >= VISIBLE_ON_MOBILE ? ' reel-extra' : ''}" href="https://www.instagram.com/fancy_silk_store_nakodar" target="_blank" rel="noopener">
      <img src="/assets/images/${file}" alt="Fancy Silk Store Instagram reel" loading="lazy">
      <div class="reel-play"><svg viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg></div>
      <span class="reel-label">Watch on Instagram</span>
    </a>
  `).join('');
  initReveal();

  if(REEL_IMAGES.length > VISIBLE_ON_MOBILE){
    const moreBtn = document.createElement('button');
    moreBtn.type = 'button';
    moreBtn.className = 'btn btn-outline reels-more-btn';
    moreBtn.textContent = 'View More Reels';
    row.insertAdjacentElement('afterend', moreBtn);
    moreBtn.addEventListener('click', () => {
      row.querySelectorAll('.reel-card.reel-extra').forEach(card => card.classList.remove('reel-extra'));
      initReveal();
      moreBtn.remove();
    });
  }
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
      <article class="carousel-card" data-id="${p.id}">
        <div class="cc-img"><img src="/assets/images/${p.image}" alt="${p.name} — ${p.fabric}" loading="lazy"></div>
        <div class="cc-body">
          <span class="cc-tag">${p.category}</span>
          <h3>${p.name}</h3>
          <div class="cc-price">${money(p.price)}</div>
          <div class="cc-btn-row">
            <button type="button" class="cc-view-btn" data-view="${p.id}">View</button>
            <a class="cc-order-btn" href="https://wa.me/918699161743?text=${msg}" target="_blank" rel="noopener" data-order="${p.id}">
              <img src="/assets/images/whatsapp-logo.jpg" class="btn-icon round" alt="">Order This
            </a>
          </div>
        </div>
      </article>
    `;
  }

  function gridCardHTML(p){
    const msg = encodeURIComponent(`Hi, I'm interested in the ${p.name} (${money(p.price)}). Is it available?`);
    return `
      <article class="grid-card" data-id="${p.id}">
        <div class="gc-img"><img src="/assets/images/${p.image}" alt="${p.name} — ${p.fabric}" loading="lazy"></div>
        <div class="gc-body">
          <span class="gc-tag">${p.category}</span>
          <h3>${p.name}</h3>
          <div class="gc-price">${money(p.price)}</div>
          <div class="gc-btn-row">
            <button type="button" class="gc-view-btn" data-view="${p.id}">View</button>
            <a class="gc-order-btn" href="https://wa.me/918699161743?text=${msg}" target="_blank" rel="noopener" data-order="${p.id}">
              <img src="/assets/images/whatsapp-logo.jpg" class="btn-icon round" alt="">Order This
            </a>
          </div>
        </div>
      </article>
    `;
  }

  function openLightbox(id){
    const p = PRODUCTS.find(x => x.id === Number(id));
    const box = document.getElementById('product-lightbox');
    if(!p || !box) return;
    const msg = encodeURIComponent(`Hi, I'm interested in the ${p.name} (${money(p.price)}). Is it available?`);
    box.querySelector('.pl-img img').src = `/assets/images/${p.image}`;
    box.querySelector('.pl-img img').alt = `${p.name} — ${p.fabric}`;
    box.querySelector('.pl-tag').textContent = p.category;
    box.querySelector('.pl-name').textContent = p.name;
    box.querySelector('.pl-fabric').textContent = p.fabric;
    box.querySelector('.pl-price').textContent = money(p.price);
    box.querySelector('.pl-order-btn').href = `https://wa.me/918699161743?text=${msg}`;
    box.querySelector('.pl-order-btn').dataset.order = p.id;
    box.classList.add('open');
    document.body.classList.add('no-scroll');
  }

  function closeLightbox(){
    const box = document.getElementById('product-lightbox');
    if(!box) return;
    box.classList.remove('open');
    document.body.classList.remove('no-scroll');
  }

  (function initLightbox(){
    const box = document.getElementById('product-lightbox');
    if(!box) return;
    box.querySelector('.product-lightbox-close').addEventListener('click', closeLightbox);
    box.querySelector('.product-lightbox-backdrop').addEventListener('click', closeLightbox);
    document.addEventListener('keydown', e => { if(e.key === 'Escape') closeLightbox(); });
  })();

  document.addEventListener('click', e => {
    const viewBtn = e.target.closest('[data-view]');
    if(!viewBtn) return;
    e.preventDefault();
    openLightbox(viewBtn.dataset.view);
  });

  function showToast(text){
    let toast = document.querySelector('.order-toast');
    if(!toast){
      toast = document.createElement('div');
      toast.className = 'order-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  }

  function shareOrder(id, waUrl){
    // Always open the chat with the store's number directly and immediately —
    // synchronously, before any await, since awaiting the image fetch first
    // causes browsers to treat window.open as a blocked popup once it's no
    // longer in the original user-gesture call stack. Going straight to the
    // store's number matters more than auto-attaching the image, and WhatsApp
    // gives no way to do both (its native Share Sheet attaches files fine but
    // can't pre-select a recipient, so it drops the direct-open behavior).
    const win = window.open(waUrl, '_blank', 'noopener');
    if(!win) window.location.href = waUrl;

    const p = PRODUCTS.find(x => x.id === Number(id));
    if(!p || !navigator.clipboard || !window.ClipboardItem) return;

    fetch(`/assets/images/${p.image}`)
      .then(resp => resp.blob())
      .then(blob => navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]))
      .then(() => showToast('Product image copied — paste it (long-press ▸ Paste, or Ctrl+V) into the WhatsApp chat that just opened.'))
      .catch(() => { /* best effort only — clipboard access can be denied/unsupported */ });
  }

  document.addEventListener('click', e => {
    const orderBtn = e.target.closest('[data-order]');
    if(!orderBtn) return;
    e.preventDefault();
    shareOrder(orderBtn.dataset.order, orderBtn.href);
  });

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

  const gridWrap = document.querySelector('.product-grid');

  function renderCards(){
    const list = currentCategory === 'All'
      ? PRODUCTS
      : PRODUCTS.filter(p => p.category === currentCategory);
    track.innerHTML = list.map(cardHTML).join('');
    cards = Array.from(track.querySelectorAll('.carousel-card'));
    active = 0;

    if(gridWrap){
      gridWrap.innerHTML = list.map(gridCardHTML).join('');
      initReveal();
    }

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

  let autoRotatePaused = false;
  setInterval(() => { if(!autoRotatePaused) goTo(active + 1); }, 4500);

  // View toggle — switch between the interactive carousel and the simple list
  const toggleBtns = document.querySelectorAll('.view-toggle-btn');
  const viewPanels = document.querySelectorAll('.catalog-view');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.viewMode;
      toggleBtns.forEach(b => b.classList.toggle('active', b === btn));
      viewPanels.forEach(panel => { panel.hidden = panel.dataset.mode !== mode; });
      autoRotatePaused = mode !== 'interactive';
      // Cards rendered while their panel was hidden never became visible to the
      // scroll-reveal IntersectionObserver, so they'd stay stuck at opacity:0.
      // Show them immediately instead of waiting on a scroll event that may never come.
      const shownPanel = document.querySelector(`.catalog-view[data-mode="${mode}"]`);
      if(shownPanel){
        shownPanel.querySelectorAll('.reveal, .reel-card, .grid-card').forEach(el => {
          el.dataset.observed = '1';
          el.classList.add('in-view');
        });
      }
      initReveal();
    });
  });
})();
