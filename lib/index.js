'use strict';
var parse = require('csv-parse/lib/sync');  // Can't do anything until we load inputs, so use sync
var fs = require('graceful-fs');
const path = require('path');
const _ = require('lodash');

class Graph {
    constructor(nnodes, incoords) {
        this.nodes = nnodes;
        this.edges = Array(0);
        this.coords = incoords;
        this.edgelist = Array(nnodes);
        this.Temp = null;
        this.Gamma = null;
        this.updatecount = 0;  // Easy tracker for updates
    }
    connect(start, end) {
        this.edges.push([start, end]);
        this.updatecount += 1;
    }
    remove(index) {
        this.edges.splice(index, 1);
        this.updatecount += 1;
    }
    prune() {
        var sniplist = new Set();
        for (let i = 0; i < this.edges.length - 1; i++) {
            const e = this.edges[i];
            for (let i2 = i + 1; i2 < this.edges.length; i2++) {
                if (
                    (e[0] === this.edges[i2][0] && e[1] === this.edges[i2][1]) ||
          (e[0] === this.edges[i2][1] && e[1] === this.edges[i2][0])
                )
                    sniplist.add(i);
            }
        }
        // C console.log(sniplist.size);
        for (let ri = 0; ri < sniplist.size; ri++) {
            this.edges.splice(Array.from(sniplist)[ri] - ri, 1);
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
    // Format: i index is node, values in array are nodes connected directly
        // this.prune();
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
function readfile(fileid) {
    // eslint-disable-next-line no-console
    // console.log(path.join(__dirname, fileid));
    const fileData = fs.readFileSync(path.join(__dirname, fileid), 'utf8');
    // eslint-disable-next-line no-console
    // console.log(fileData);
    var output = parse(fileData, {
        ltrim: true,
        comment: '#',
        columns: null,
        relax_column_count: true
    });
    // eslint-disable-next-line no-console
    // console.log(output);
    const nnodes = parseInt(output[0][0]);
    var coords = [];
    for (let i = 1; i < 1 + nnodes; i++) {
        coords.push([parseFloat(output[i][0]), parseFloat(output[i][1])]);
    }
    // eslint-disable-next-line no-console
    // console.log(coords);
    const graph = new Graph(nnodes, coords);
    for (let j = 1 + nnodes; j < output.length; j++) {
        graph.connect(parseInt(output[j][0]), parseInt(output[j][1]));
    }
    return graph;
}

function connectedNodes(graph, i, j, visited = []) {
    // C if (i === j) return true; // This appears to be unnecessary
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
    for (let i = 0; i < graph.edges.length; i++) {
        const e = graph.edges[i];
        // Sqrt((X1 - X2)^2 + (Y1 - Y2)^2)
        weight +=
      ((graph.coords[e[0]][0] - graph.coords[e[1]][0]) ** 2 +
        (graph.coords[e[0]][1] - graph.coords[e[1]][1]) ** 2) **
      0.5;
    }
    return weight;
}

function nodecrawler(graph) {
    // Uses the Djikstra algorithm and an adjacency list to find shortest paths to origin
    graph.genadjacencylist();  // Would be nice to get away from this brute-force O(n^2) method
    var visited = Array(graph.nodes).fill(false); // A nice little trick
    var pathweights = Array(graph.nodes).fill(Infinity);
    pathweights[0] = 0;
    var currdistance = 0;
    var mindex = -1;
    var totalweight = 0;
    while (currdistance < graph.nodes) {
        var tempmin = Infinity;
        for (let j = 0; j < graph.nodes; j++) {
            // All to get index of current minimum path
            if (visited[j] === false && pathweights[j] <= tempmin) {
                tempmin = pathweights[j];
                mindex = j;
            }
        }
        visited[mindex] = true;
        for (let k = 0; k < graph.nodes; k++) {
            var newdist = getdistance(graph, k, mindex);
            if (
                !visited[k] &&
        graph.adjlist[k].includes(mindex) &&
        pathweights[k] > pathweights[mindex] + newdist
            ) {
                pathweights[k] = pathweights[mindex] + newdist;
            }
        }
        currdistance += 1;
    }
    // C console.log(`pathweights: ${pathweights}`);
    for (let i = 0; i < pathweights.length; i++) {
        totalweight += pathweights[i];
    }
    return totalweight;
}

function getdistance(graph, i, j) {
    // Find the distance between nodes i and j on graph

    // Sqrt((X1 - X2)^2 + (Y1 - Y2)^2)
    var weight =
    ((graph.coords[i][0] - graph.coords[j][0]) ** 2 +
      (graph.coords[i][1] - graph.coords[j][1]) ** 2) **
    0.5;
    return weight;
}

function containsedge(graph, node1, node2) {
    // "Quick" check of whether two nodes are connected already
    for (let i = 0; i < graph.edges.length - 1; i++) {
        if ((graph.edges[i][0] === node1 && graph.edges[i][1] === node2 ) ||
        (graph.edges[i][0] === node2 && graph.edges[i][1] === node1) ) {
            return true;
        }
    }
    return false;
}

function edgeproposal(graph) {
    // This function will add or remove a single edge from the graph
    var canadd = true;
    var cansub = true;
    if ( graph.edges.length <= graph.nodes - 1 ) cansub = false;
    if ( graph.edges.length >= ( (graph.nodes**2 ) - graph.nodes)/ 2 ) canadd = false; 
    const thetaold = graph.Gamma*edgeweight(graph) + nodecrawler(graph);
    var exit = false;
    var count = 0;
    const countlimit = 3*graph.nodes + 10;
    while (!exit) {
        var tempedges = Array(graph.edges.length);
        var newgraph = _.cloneDeep(graph);
        for (let i = 0; i < graph.nodes; i++) tempedges[i] = i; // find better method
        const deciderand = Math.random();
        const rand = Math.random();
        // eslint-disable-next-line no-console
        // console.log(`deciderand: ${deciderand}`);
        if ((canadd && deciderand >= .5) || !cansub) {
            // eslint-disable-next-line no-console
            // console.log('entered add path');
            const node1 = Math.round(Math.random()*(graph.nodes - 1));
            tempedges.splice(node1, 1);
            const node2 = tempedges[Math.round(Math.random()*(tempedges.length - 1))];
            if (containsedge(graph, node1, node2)) continue;
            newgraph.connect(node1, node2);
            // eslint-disable-next-line no-console
            // console.log(`add attempt with n1 ${node1} and n2 ${node2}`);
            const thetanew = newgraph.Gamma*edgeweight(newgraph) + nodecrawler(newgraph);
            if (Math.min(1, Math.exp(-(thetanew - thetaold)/graph.Temp)) >= rand) {
                // eslint-disable-next-line no-console
                // console.log(`add success with n1 ${node1} and n2 ${node2}`);
                return newgraph;
            }
            // eslint-disable-next-line no-console
            // console.log('add failed');
        }
        if ((cansub && deciderand < .5) || !canadd) {
            // eslint-disable-next-line no-console
            // console.log('entered subtract path');
            const edge1 = Math.round(Math.random()*graph.edges.length);
            newgraph.remove(edge1);
            if ( connected(newgraph) ) {
                const thetanew = newgraph.Gamma*edgeweight(newgraph) + nodecrawler(newgraph);
                if (Math.min(1, Math.exp(-(thetanew - thetaold)/graph.Temp)) >= rand ) {
                    // eslint-disable-next-line no-console  
                    // console.log(`subtract success with edge ${edge1} and values ${graph.edges[edge1]}`);  
                    return newgraph;
                }
            }
            // eslint-disable-next-line no-console
            // console.log('subtract failed');
        }
        if ( count >= countlimit ) {
            exit = true;
        }
        count += 1;
    }
    // eslint-disable-next-line no-console
    // console.log('failed to decide change');
    return graph; 
}

module.exports = { Graph, connected, edgeweight, nodecrawler, readfile, edgeproposal };
