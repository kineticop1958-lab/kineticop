// Kinetic O&P — Dark/Light mode toggle
// Theme is applied before paint via inline script in <head> (prevents flash).
// Nav logo swaps with the theme; footer logo (logo-dark) is always static.

document.addEventListener('DOMContentLoaded', function () {
  var LOGO_LIGHT = 'img/_kineticop_Logo-red.fw.webp';
  var LOGO_DARK  = 'img/logo-dark';

  /** Swap only the nav logo to match the current theme */
  function applyNavLogo(isDark) {
    var navLogo = document.querySelector('.nav-logo img');
    if (navLogo) {
      navLogo.src = isDark ? LOGO_DARK : LOGO_LIGHT;
    }
  }

  // Sync nav logo with whatever theme the <head> flash-prevention script applied
  var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  applyNavLogo(isDark);

  // Wire up the toggle button
  var btn = document.getElementById('themeToggle');
  if (!btn) return;

  btn.addEventListener('click', function () {
    var nowDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (nowDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('kop-theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('kop-theme', 'dark');
    }
    applyNavLogo(!nowDark);
  });
});
