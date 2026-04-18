/* ==============================
   GUZZA – app.js
   ============================== */

'use strict';

/* ────────────────────────────────
   PRODUCT DATA
──────────────────────────────── */
const PRODUCTS = [
  { id: 'muzza',     name: 'Muzza',    price: 9000,  category: 'clasicas' },
  { id: 'fugazzeta', name: 'Fugazzetta', price: 9000, category: 'clasicas' },
  { id: 'napo',      name: 'Napo',     price: 10000, category: 'especiales' },
  { id: 'ramon',     name: 'Ramón',    price: 11000, category: 'especiales' },
  { id: 'cruda',     name: 'Cruda',    price: 12000, category: 'especiales' },
  { id: 'cinco',     name: '5 Quesos', price: 14000, category: 'especiales' },
];

const WHATSAPP_NUMBER = '5491166730361';

/* ────────────────────────────────
   CART STATE
──────────────────────────────── */
let cart = []; // [{ id, name, price, qty }]

/* ────────────────────────────────
   DAY DETECTION
──────────────────────────────── */
function getBusinessState() {
  const day = new Date().getDay(); // 0=Sun, 1=Mon … 6=Sat
  const isWeekend = day === 0 || day === 6;
  return { isWeekend, isOpen: !isWeekend };
}

/* ────────────────────────────────
   STATUS BANNER
──────────────────────────────── */
function renderStatusBanner() {
  const banner = document.getElementById('status-banner');
  if (!banner) return;

  const { isOpen } = getBusinessState();

  if (isOpen) {
    banner.textContent = '🟢 Tomando pedidos para este finde';
    banner.className = 'status-banner open';
  } else {
    banner.textContent = '🚚 Entregando pedidos. Volvemos el lunes';
    banner.className = 'status-banner closed';
  }
}

/* ────────────────────────────────
   FORMAT PRICE
──────────────────────────────── */
function formatPrice(n) {
  return '$' + n.toLocaleString('es-AR');
}

/* ────────────────────────────────
   RENDER PRODUCT CARDS
──────────────────────────────── */
function renderProducts() {
  const { isWeekend } = getBusinessState();
  const clasicasGrid  = document.getElementById('clasicas-grid');
  const especialesGrid = document.getElementById('especiales-grid');
  const weekendNotice = document.getElementById('weekend-notice');

  if (!clasicasGrid || !especialesGrid) return;

  if (isWeekend && weekendNotice) weekendNotice.style.display = 'block';

  const renderCard = (product) => {
    const card = document.createElement('div');
    card.className = 'product-card';

    const nameEl = document.createElement('p');
    nameEl.className = 'product-name';
    nameEl.textContent = product.name;

    const priceEl = document.createElement('p');
    priceEl.className = 'product-price';
    priceEl.textContent = formatPrice(product.price);

    const btn = document.createElement('button');
    btn.className = 'product-add-btn';
    btn.textContent = 'Añadir al carrito';
    btn.dataset.id = product.id;
    btn.disabled = isWeekend;
    btn.setAttribute('aria-label', `Añadir ${product.name} al carrito`);

    if (!isWeekend) {
      btn.addEventListener('click', () => addToCart(product));
    }

    card.appendChild(nameEl);
    card.appendChild(priceEl);
    card.appendChild(btn);

    return card;
  };

  PRODUCTS.forEach(p => {
    const card = renderCard(p);
    if (p.category === 'clasicas') {
      clasicasGrid.appendChild(card);
    } else {
      especialesGrid.appendChild(card);
    }
  });
}

/* ────────────────────────────────
   CART LOGIC
──────────────────────────────── */
function addToCart(product) {
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
  }
  updateCartUI();
  bumpCartFab();
  showToast(`✅ ${product.name} agregada al carrito`);
  // Cart does NOT open automatically — only via the FAB button
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  updateCartUI();
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(id);
  else updateCartUI();
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getCartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

/* ────────────────────────────────
   CART UI
──────────────────────────────── */
function updateCartUI() {
  updateCartCount();
  renderCartBody();
  renderCartFooter();
}

function updateCartCount() {
  const countEl = document.getElementById('cart-count');
  if (countEl) countEl.textContent = getCartCount();
}

function renderCartBody() {
  const body = document.getElementById('cart-body');
  if (!body) return;

  body.innerHTML = '';

  if (cart.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'cart-empty';
    empty.innerHTML = 'Tu carrito está vacío.<br />Agregá pizzas desde el menú.';
    body.appendChild(empty);
    return;
  }

  cart.forEach(item => {
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <div class="cart-item-info">
        <p class="cart-item-name">${escapeHtml(item.name)}</p>
        <p class="cart-item-price">${formatPrice(item.price)} c/u</p>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" data-action="dec" data-id="${item.id}" aria-label="Quitar uno">−</button>
        <span class="qty-display">${item.qty}</span>
        <button class="qty-btn" data-action="inc" data-id="${item.id}" aria-label="Agregar uno">+</button>
      </div>
      <button class="remove-btn" data-action="remove" data-id="${item.id}" aria-label="Eliminar del carrito">✕</button>
    `;
    body.appendChild(el);
  });

  // Delegate events
  body.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const { action, id } = btn.dataset;
      if (action === 'inc')    changeQty(id, +1);
      if (action === 'dec')    changeQty(id, -1);
      if (action === 'remove') removeFromCart(id);
    });
  });
}

function renderCartFooter() {
  const footer = document.getElementById('cart-footer');
  const totalEl = document.getElementById('cart-total');
  if (!footer || !totalEl) return;

  if (cart.length === 0) {
    footer.style.display = 'none';
  } else {
    footer.style.display = 'flex';
    totalEl.textContent = formatPrice(getCartTotal());
  }
}

function bumpCartFab() {
  const countEl = document.getElementById('cart-count');
  if (!countEl) return;
  countEl.classList.remove('bump');
  void countEl.offsetWidth; // reflow to restart animation
  countEl.classList.add('bump');
}

/* ────────────────────────────────
   TOAST NOTIFICATIONS
──────────────────────────────── */
let toastTimer = null;

function showToast(message) {
  let toast = document.getElementById('guzza-toast');

  // Create once, reuse
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'guzza-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.remove('toast-hide');
  toast.classList.add('toast-show');

  // Clear any existing auto-hide timer
  if (toastTimer) clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');
    toastTimer = null;
  }, 2200);
}

/* ────────────────────────────────
   CART DRAWER OPEN / CLOSE
──────────────────────────────── */
function openCart() {
  document.getElementById('cart-drawer')?.classList.add('open');
  document.getElementById('cart-overlay')?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cart-drawer')?.classList.remove('open');
  document.getElementById('cart-overlay')?.classList.remove('active');
  document.body.style.overflow = '';
}

/* ────────────────────────────────
   WHATSAPP CHECKOUT
──────────────────────────────── */
function generateWhatsAppMessage() {
  if (cart.length === 0) return null;

  let lines = ['Hola, quiero hacer un pedido:\n'];
  cart.forEach(item => {
    lines.push(`• ${item.qty}x ${item.name}`);
  });
  lines.push('\nMi dirección de entrega es: ____');
  lines.push('\n(Entrega sábado o domingo en Luján)');

  return lines.join('\n');
}

function handleCheckout() {
  if (cart.length === 0) return;

  const msg = generateWhatsAppMessage();
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/* ────────────────────────────────
   FAQ ACCORDION
──────────────────────────────── */
function initFAQ() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';
      const answer = btn.nextElementSibling;

      // Close all others
      document.querySelectorAll('.faq-question').forEach(other => {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
          other.nextElementSibling.style.maxHeight = null;
        }
      });

      // Toggle current
      if (isExpanded) {
        btn.setAttribute('aria-expanded', 'false');
        answer.style.maxHeight = null;
      } else {
        btn.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
}

/* ────────────────────────────────
   SCROLL ANIMATIONS (Intersection Observer)
──────────────────────────────── */
function initScrollAnimations() {
  if (!('IntersectionObserver' in window)) return;

  const targets = document.querySelectorAll(
    '.process-card, .prep-step, .product-card, .gallery-item'
  );

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        entry.target.style.animationDelay = `${i * 0.07}s`;
        entry.target.classList.add('fade-up');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  targets.forEach(t => observer.observe(t));
}

/* ────────────────────────────────
   UTILITIES
──────────────────────────────── */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/* ────────────────────────────────
   INIT
──────────────────────────────── */
function init() {
  // Business logic
  renderStatusBanner();
  renderProducts();

  // FAQ
  initFAQ();

  // Scroll animations
  initScrollAnimations();

  // Cart FAB
  document.getElementById('cart-fab')?.addEventListener('click', openCart);

  // Cart close
  document.getElementById('cart-close')?.addEventListener('click', closeCart);
  document.getElementById('cart-overlay')?.addEventListener('click', closeCart);

  // Keyboard close (Escape)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCart();
  });

  // Checkout
  document.getElementById('checkout-btn')?.addEventListener('click', handleCheckout);

  // Initial UI render
  updateCartUI();
}

document.addEventListener('DOMContentLoaded', init);
