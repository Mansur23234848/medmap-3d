// Applies the saved light/dark theme before React renders (avoids a flash). External file so CSP can forbid inline scripts.
try {
  var t = localStorage.getItem('medmap-theme');
  if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches)) document.documentElement.classList.add('dark');
} catch (e) {}
