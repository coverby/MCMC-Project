'use strict';

class Graph {
  constructor(nnodes, incoords) {
    this.nodes = nnodes;
    this.edges = Array(0);
    this.coords = incoords;
  }
  connect(start, end) {
    this.edges.push([start, end]);
  }
  prune() {
    var sniplist = new Set();
    for (let index = 0; index < this.edges.length - 1; index++) {
      const e = this.edges[index];
      for (let index2 = index + 1; index2 < this.edges.length; index2++) {
        if (
          (e[0] === this.edges[index2][0] && e[1] === this.edges[index2][1]) ||
          (e[0] === this.edges[index2][1] && e[1] === this.edges[index2][0])
        )
          sniplist.add(index);
      }
    }
    // C console.log(sniplist.size);
    for (let rindex = 0; rindex < sniplist.size; rindex++) {
      this.edges.splice(Array.from(sniplist)[rindex] - rindex, 1);
    }
  }
}

function connectedNodes(graph, i, j, visited = []) {
  // C if (i === j) return true;
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

function edgeweight(graph) {
  // Note that this function assumes graph input is pruned!
  var weight = 0;
  for (let index = 0; index < graph.edges.length; index++) {
    const e = graph.edges[index];
    // Sqrt((X1 - X2)^2 + (Y1 - Y2)^2)
    weight +=
      ((graph.coords[e[0]][0] - graph.coords[e[1]][0]) ** 2 +
        (graph.coords[e[0]][1] - graph.coords[e[1]][1]) ** 2) **
      0.5;
  }
  return weight;
}

module.exports = { Graph, connected, edgeweight };
