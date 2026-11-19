// Fixed scenes for screenshots. `?shot=editor` shows the page with sample
// photos loaded; `?shot=cover` shows the cover alone, filling the viewport.
// `photo` / `photo2` pick the samples (samples/<name>.jpg), `caption` and
// `tagline` the words, `grade` the colour grade, `size` the export size.
// window.__shotReady is set once the scene has painted.
export async function runShot(shot, query, api) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const caption = query.get('caption') ?? 'Neon Getaway';
  const tagline = query.get('tagline') ?? 'One last ride into the sunset';
  api.setCaption(caption, tagline);
  api.setGrade(query.get('grade') ?? 'sunset');
  api.setSize(query.get('size') ?? 'landscape');
  await api.loadSample(query.get('photo') ?? 'pier', 0);
  await api.loadSample(query.get('photo2') ?? 'boulevard', 1);
  const third = query.get('photo3');
  if (third) await api.loadSample(third, 2);
  // Frame the portrait sample so its subject's head stays in the short panels:
  // the boulevard portrait is tall, the side panels are wide, so pan it up.
  const size = query.get('size') ?? 'landscape';
  if (size === 'landscape' || size === 'square') api.setTransform(1, { zoom: 1, dx: 0, dy: -0.18 });
  if (size === 'portrait') api.setTransform(0, { zoom: 1, dx: 0, dy: -0.2 });
  api.redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
