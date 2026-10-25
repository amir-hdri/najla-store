// Anti-FOUC: apply saved theme before first paint (mirrors ThemeContext logic).
// Served as an external file because the API server's CSP restricts inline scripts.
(function () {
  try {
    var t = localStorage.getItem('najla_theme');
    if (t !== 'light' && t !== 'dark')
      t = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    if (t === 'dark') document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = t;
  } catch {
    /* localStorage/matchMedia unavailable — theme falls back to light */
  }
})();
