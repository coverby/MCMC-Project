'use strict';

class Graph {
  constructor(nnodes) {
    this.nodes = nnodes;
    this.edges = Array(0);
  }
  connect(start, end) {
    this.edges.push([start, end]);
  }
}

function connectedNodes(graph, i, j, visited = []) {
  if (i === j) return true;
  for (let index = 0; index < graph.edges.length; index++) {
    const e = graph.edges[index];
    if ((e[0] === i && e[1] === j) || (e[1] === i && e[0] === j)) return true;
  }
  for (let index = 0; index < graph.edges.length; index++) {
    const e = graph.edges[index];
    if (
      e[0] === i &&
      !visited.reduce((pv, v) => {
        return pv || v === e[1];
      }, false)
    ) {
      const newVisited = [i];
      newVisited.concat(visited);
      if (connectedNodes(graph, e[1], j, visited.concat([i]))) return true;
    }
    if (
      e[1] === i &&
      !visited.reduce((pv, v) => {
        return pv || v === e[0];
      }, false)
    ) {
      const newVisited = [i];
      newVisited.concat(visited);
      if (connectedNodes(graph, e[0], j, visited.concat([i]))) return true;
    }
  }
  return false;
}

function connected(graph) {
  for (let i = 0; i < graph.nodes; i++) {
    for (let j = i + 1; j < graph.nodes; j++) {
      if (!connectedNodes(graph, i, j)) {
        return false;
      }
    }
  }
  return true;
}

module.exports = { Graph, connected };
