// ============================================================
// Google Analytics 4 setup
// 1. Create a GA4 property at https://analytics.google.com
// 2. Admin → Data streams → Web → copy the Measurement ID (G-XXXXXXXXXX)
// 3. Paste it below.
// ============================================================
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';

// Load gtag.js
(function () {
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
  document.head.appendChild(s);
})();

window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
// debug_mode makes events show up in GA → Admin → DebugView in real time
gtag('config', GA_MEASUREMENT_ID, { debug_mode: true });

// Send an event to GA and echo it into the on-page event log
function track(name, params = {}) {
  gtag('event', name, params);
  logEvent(name, params);
}

// ---------- On-page event log (so you can see what's being sent) ----------
function logEvent(name, params) {
  const list = document.getElementById('event-log-list');
  if (!list) return;
  const li = document.createElement('li');
  const time = new Date().toLocaleTimeString();
  li.innerHTML = `<span class="t">${time}</span> <b>${name}</b> <code>${escapeHtml(JSON.stringify(params))}</code>`;
  list.prepend(li);
}
function escapeHtml(s) {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

document.addEventListener('DOMContentLoaded', () => {
  logEvent('page_view', { page_title: document.title, page_path: location.pathname });

  const idNote = document.getElementById('ga-id');
  if (idNote) {
    idNote.textContent = GA_MEASUREMENT_ID;
    if (GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') idNote.classList.add('warn');
  }

  // Any element with data-track="event_name" sends that event on click.
  // Extra params come from data-param-* attributes.
  document.querySelectorAll('[data-track]').forEach(el => {
    el.addEventListener('click', () => {
      const params = {};
      for (const [k, v] of Object.entries(el.dataset)) {
        if (k.startsWith('param')) {
          const key = k.slice(5).replace(/^./, c => c.toLowerCase()).replace(/[A-Z]/g, c => '_' + c.toLowerCase());
          params[key] = isNaN(v) || v === '' ? v : Number(v);
        }
      }
      track(el.dataset.track, params);
    });
  });

  // Outbound link clicks
  document.querySelectorAll('a[href^="http"]').forEach(a => {
    if (a.hostname !== location.hostname) {
      a.addEventListener('click', () => track('outbound_click', { link_url: a.href }));
    }
  });

  // Forms: data-form-event="generate_lead" etc.
  document.querySelectorAll('form[data-form-event]').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      // Never send personal info (emails, names) to GA — only non-identifying fields
      track(form.dataset.formEvent, { form_id: form.id, topic: data.topic || undefined });
      form.reset();
      const ok = form.querySelector('.form-ok');
      if (ok) { ok.hidden = false; setTimeout(() => ok.hidden = true, 3000); }
    });
  });

  // Scroll depth: 25 / 50 / 75 / 100%
  const fired = new Set();
  window.addEventListener('scroll', () => {
    const h = document.documentElement;
    const pct = Math.round((h.scrollTop + innerHeight) / h.scrollHeight * 100);
    [25, 50, 75, 100].forEach(m => {
      if (pct >= m && !fired.has(m)) { fired.add(m); track('scroll_depth', { percent: m }); }
    });
  }, { passive: true });

  // Time on page milestones
  [10, 30, 60].forEach(sec => setTimeout(() => track('time_on_page', { seconds: sec }), sec * 1000));
});
