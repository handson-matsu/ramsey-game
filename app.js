'use strict';
const $ = id => document.getElementById(id);
const svgNS = 'http://www.w3.org/2000/svg';
let state, points, selected = 'red';
function element(name, attrs) {
  const el = document.createElementNS(svgNS, name);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  return el;
}
function start(n) {
  state = { n, edges: Ramsey.createEdges(n), result: null, triangle: null };
  points = Array.from({ length: n }, (_, i) => ({ x: 300 + 194 * Math.cos(i * 2 * Math.PI / n - Math.PI / 2), y: 230 + 194 * Math.sin(i * 2 * Math.PI / n - Math.PI / 2) }));
  $('edge-picker').hidden = true;
  for (const level of [1, 2]) {
    const active = level === n - 4;
    $('step' + level).classList.toggle('active', active);
    if (active) $('step' + level).setAttribute('aria-current', 'step');
    else $('step' + level).removeAttribute('aria-current');
  }
  $('level-label').textContent = `LEVEL ${n - 4}`;
  $('graph-title').textContent = `${n}つの頂点、${state.edges.length}本の辺。`;
  $('board').setAttribute('aria-label', `完全グラフ K${n}。辺はTabキーで選び、Enterキーでも塗れます。`);
  render();
}
function render() {
  const board = $('board');
  board.replaceChildren();
  board.classList.toggle('finished', !!state.result);
  const lines = element('g', {}), targets = element('g', {}), vertices = element('g', {});
  state.edges.forEach((edge, i) => {
    const a = points[edge.a], b = points[edge.b];
    const culprit = state.triangle && state.triangle.vertices.includes(edge.a) && state.triangle.vertices.includes(edge.b);
    const line = element('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: `edge ${edge.color || 'uncolored'} ${culprit ? 'culprit' : state.triangle ? 'muted' : ''}`, 'data-edge': i });
    lines.append(line);
    const target = element('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'edge-target', tabindex: state.result ? -1 : 0, role: 'button', 'aria-disabled': !!state.result, 'aria-label': `頂点${edge.a + 1}と${edge.b + 1}の辺、${edge.color === 'red' ? '赤' : edge.color === 'blue' ? '青' : '未着色'}` });
    target.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); apply(i); if (!state.result) board.querySelectorAll('.edge-target')[i].focus(); } });
    target.addEventListener('focus', () => line.classList.add('focused'));
    target.addEventListener('blur', () => line.classList.remove('focused'));
    targets.append(target);
  });
  points.forEach((point, i) => {
    const marked = state.triangle?.vertices.includes(i);
    const group = element('g', { class: `vertex ${marked ? 'marked ' + state.triangle.color : ''}` });
    group.append(element('circle', { cx: point.x, cy: point.y, r: 20 }));
    const text = element('text', { x: point.x, y: point.y + 1 }); text.textContent = i + 1;
    group.append(text); vertices.append(group);
  });
  board.append(lines, targets, vertices);
  const count = state.edges.filter(e => e.color).length;
  $('progress-text').innerHTML = `${state.edges.length}本中 <strong>${count}</strong>本`;
  $('progress-bar').style.width = `${100 * count / state.edges.length}%`;
  $('status').className = `status ${state.result || ''}`;
  $('status').innerHTML = state.result === 'over' ? '<strong>GAME OVER</strong><span>同じ色の三角形ができました！</span>' : state.result === 'clear' ? '<strong>CLEAR!</strong><span>すべての辺を塗れました！</span>' : '<span class="status-dot"></span>色を選んで、辺をタップ！';
  $('restart').textContent = state.result ? '↻ もう一度' : '↻ はじめから';
  $('next').hidden = !(state.result === 'clear' && state.n === 5);
  for (const color of ['red', 'blue']) $(color).disabled = !!state.result;
}
function apply(index) {
  $('edge-picker').hidden = true;
  if (Ramsey.paint(state, index, selected)) render();
}
function candidates(event) {
  const position = new DOMPoint(event.clientX, event.clientY).matrixTransform($('board').getScreenCTM().inverse());
  const scale = $('board').getBoundingClientRect().width / 600;
  return state.edges.map((edge, index) => {
    const a = points[edge.a], b = points[edge.b], dx = b.x - a.x, dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((position.x - a.x) * dx + (position.y - a.y) * dy) / (dx * dx + dy * dy)));
    return { index, distance: Math.hypot(position.x - a.x - t * dx, position.y - a.y - t * dy) * scale };
  }).filter(item => item.distance <= 15).sort((a, b) => a.distance - b.distance);
}
$('board').addEventListener('click', event => {
  if (state.result) return;
  const near = candidates(event);
  if (!near.length) return;
  const ambiguous = near.filter(item => item.distance - near[0].distance <= 3);
  if (ambiguous.length === 1) return apply(near[0].index);
  $('edge-options').replaceChildren();
  for (const { index } of ambiguous) {
    const edge = state.edges[index], button = document.createElement('button');
    button.textContent = `${edge.a + 1} — ${edge.b + 1}`;
    button.addEventListener('click', () => apply(index));
    button.addEventListener('pointerenter', () => $('board').querySelector(`[data-edge="${index}"]`).classList.add('focused'));
    button.addEventListener('pointerleave', () => $('board').querySelector(`[data-edge="${index}"]`)?.classList.remove('focused'));
    $('edge-options').append(button);
  }
  $('edge-picker').hidden = false;
  $('edge-options').firstChild.focus();
});
$('cancel-picker').onclick = () => { $('edge-picker').hidden = true; $('board').querySelectorAll('.edge').forEach(el => el.classList.remove('focused')); };
document.addEventListener('keydown', event => { if (event.key === 'Escape') $('cancel-picker').click(); });
for (const color of ['red', 'blue']) $(color).onclick = () => {
  selected = color;
  for (const choice of ['red', 'blue']) { $(choice).classList.toggle('selected', choice === color); $(choice).setAttribute('aria-pressed', choice === color); }
};
$('restart').onclick = () => start(state.n);
$('next').onclick = () => start(6);
start(5);
