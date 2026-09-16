(function (root) {
  'use strict';
  function createEdges(n) {
    const edges = [];
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) edges.push({ a, b, color: null });
    return edges;
  }
  function findTriangle(n, edges) {
    const colors = Array.from({ length: n }, () => Array(n).fill(null));
    for (const { a, b, color } of edges) colors[a][b] = colors[b][a] = color;
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) for (let c = b + 1; c < n; c++) {
      if (colors[a][b] && colors[a][b] === colors[a][c] && colors[a][b] === colors[b][c]) return { vertices: [a, b, c], color: colors[a][b] };
    }
    return null;
  }
  function paint(state, index, color) {
    if (state.result || !state.edges[index] || !['red', 'blue'].includes(color)) return false;
    state.edges[index].color = color;
    state.triangle = findTriangle(state.n, state.edges);
    if (state.triangle) state.result = 'over';
    else if (state.edges.every(e => e.color)) state.result = 'clear';
    return true;
  }
  const api = { createEdges, findTriangle, paint };
  if (typeof module !== 'undefined') module.exports = api;
  else root.Ramsey = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
