/* Mobile sidebar toggle (works with dynamically loaded components via event delegation). */
document.addEventListener('click', (e) => {
  const b = document.body;
  if (e.target.closest('[data-menu]')) b.classList.toggle('nav-open');
  else if (e.target.closest('.overlay') || e.target.closest('.nav a')) b.classList.remove('nav-open');
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.body.classList.remove('nav-open'); });
