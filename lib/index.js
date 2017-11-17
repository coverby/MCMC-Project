'use strict';

class Graph {
  constructor(nnodes, incoords) {
    this.nodes = nnodes;
    this.edges = Array(0);
    this.coords = incoords;
    this.edgelist = Array(nnodes);
    this.pathhistory = [];
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
  genedgelist() {
    for (let i = 0; i < this.nodes; i++) {
      this.edgelist[i] = [];
      for (let j = 0; j < this.edges.length; j++) {
        if (this.edges[j][0] === i || this.edges[j][1] === i) {
          this.edgelist[i].push(j);
          // C console.log(`we found i: ${i} and j: ${j}`);
          // C console.log(`edgelist looks like: ${this.edgelist[i]}`);
          // Curse you Array.concat for not behaving like Array.push !
        }
      }
    }
  }
  genadjacencylist() {
    // Format: index position is node, values in array are nodes connected directly
    this.prune();
    this.genedgelist();
    this.adjlist = Array(this.nodes);
    for (let i = 0; i < this.nodes; i++) {
      this.adjlist[i] = [];
      for (let j = 0; j < this.edgelist[i].length; j++) {
        var temp = this.edges[this.edgelist[i][j]];
        if (temp[0] === i) this.adjlist[i].push(temp[1]);
        if (temp[1] === i) this.adjlist[i].push(temp[0]);
      }
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

function pathweight(graph) {
  // The goal here is to crawl through the edges back to node 0 from every other node
  // Recursion works, and we can limit path search length based on node count
  // Or use the current local minimum to constrain searches
  var weightlist = Array(graph.nodes);
  var pathlist = Array(graph.nodes);

  for (let i = 1; i < graph.nodes; i++) {
    if (graph.edgelist[i].includes(0)) {
      // A direct link is always the shortest path
      const j = graph.edgelist[i].indexOf(0); // Thanks to pruning, only one option
      const e = graph.edges[graph.edgelist[i][j]];
      weightlist[i] =
        ((graph.coords[e[0]][0] - graph.coords[e[1]][0]) ** 2 +
          (graph.coords[e[0]][1] - graph.coords[e[1]][1]) ** 2) **
        0.5;
      pathlist[i] = graph.edgelist[i][j];
    }
    return false; // What is this?  Clean it up
  }
  for (let j = 0; j < graph.nodes - 1; j++) {
    // Best path edge count cannot exceed node count for a connected simple graph
  }
}

function nodecrawler(graph) {
  var exit = false;
  var pathlength = 1;
  var pathlist = [];
  var nodepaths = Array(graph.nodes - 1);
  var paths = Array(graph.nodes - 1);
  graph.prune();
  graph.genedgelist();
  pathlist[0] = graph.edgelist[0];
  while (pathlength < graph.nodes - 1 || exit) {
    // C console.log(`this is the edgelist: ${graph.edgelist[pathlength]}`);
    // C console.log(`pathtemp at pathlength ${pathlength}: ${pathtemp}`);
    var pathtemp = graph.edgelist[pathlength]; // This is wrong
    paths[pathlength] = Array(pathtemp.length);
    for (let i = 0; i < pathtemp.length; i++) {
      paths[pathlength][i] = pathtemp[i];
    }
    pathlength += 1;
    if (!nodepaths.includes()) exit = true; // Exit if all nodes have paths
  }
  return getdistance(graph, 1, 2); // Obviously for testing only
}

function getdistance(graph, i, j) {
  // Find the distance between nodes i and j on graph
  var weight = 0;
  // Sqrt((X1 - X2)^2 + (Y1 - Y2)^2)
  weight =
    ((graph.coords[i][0] - graph.coords[j][0]) ** 2 +
      (graph.coords[i][1] - graph.coords[j][1]) ** 2) **
    0.5;
  return weight;
}

module.exports = { Graph, connected, edgeweight, pathweight, nodecrawler };
