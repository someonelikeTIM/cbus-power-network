if (window.self === window.top) {
  await import('./workspace.js');
} else {
  document.body.dataset.embedded = 'true';
  await import('./app.js');
}
