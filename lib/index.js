'use strict';
var parse = require('csv-parse/lib/sync');  // Can't do anything until we load inputs, so use sync
var fs = require('graceful-fs');
const path = require('path');
const _ = require('lodash');
const readline = require('readline');
var progress = require('progress');

class Graph {
    constructor(nnodes, incoords) {
        this.nodes = nnodes;
        this.edges = Array(0);
        this.coords = incoords;
        this.edgelist = Array(nnodes);
        this.Temp = null;
        this.Gamma = null;
        this.updatecount = 0;  // Easy tracker for updates
        this.longestoptpath = Infinity;
        this.hashval = null;
    }
    connect(start, end) {
        this.edges.push([start, end]);
        this.updatecount += 1;
    }
    remove(index) {
        this.edges.splice(index, 1);
        this.updatecount += 1;
    }
    hash() {
        //Generate a hash for this graph
        // Borrowing a version of the djb2 algorithm by Dan Bernstein
        var hash = 5381;
        for (let i = 0, n = this.adjlist.length; i < n; i++) {
            for (let j = 0, q = this.adjlist[i].length; j < q; j++) {
                hash += (hash*33 + this.adjlist[i][j]) % 9007199254740991; // keep in double int range
            }
        }
        this.hashval = hash;
        return hash;
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
        this.edgelist = [];
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
            // this.edgelist[i].sort();
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
            this.adjlist[i].sort(); // find faster sort?
        }
    }
}
function readfile(fileid) {
    const fileData = fs.readFileSync(path.join(__dirname, fileid), 'utf8');
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
    for (let i = 3; i < 3 + nnodes; i++) {
        coords.push([parseFloat(output[i][0]), parseFloat(output[i][1])]);
    }
    // eslint-disable-next-line no-console
    // console.log(coords);
    const graph = new Graph(nnodes, coords);
    for (let j = 3 + nnodes; j < output.length; j++) {
        graph.connect(parseInt(output[j][0]), parseInt(output[j][1]));
    }
    graph.Gamma = parseFloat(output[1]);
    graph.Temp = parseFloat(output[2]);
    graph.updatecount = 0; // Reset for future use
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
    graph.genadjacencylist();  // Would be nice to get away from this brute-force method
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
    graph.longestoptpath = Math.max(...pathweights);
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

/* istanbul ignore next */
function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    var graph = [];
    var iterationcount = -1;
    rl.question('Please specify input file (in current dir): ', (filenin) => {
        const filename = filenin;
        graph = readfile(filename);
        console.log(`Opened file: ${path.join(__dirname, filename)}`);
        console.log(`Graph: Nodes: ${graph.nodes}, # edges: ${graph.edges.length}, gamma: ${graph.Gamma}, temp: ${graph.Temp}`);
        rl.pause();
    });
    if ( connected(graph) ) console.error('Input graph is not connected! Aborting...');
    rl.question('Please specify the number of graph iterations to attempt: ', (iterin) =>{
        iterationcount = parseInt(iterin);
        rl.pause();
    });
    console.log('Beginning iterations...');
    const result = looper(graph, iterationcount);
    console.log(result); // temporary
}

function looper(graph, iterationcount) {
    // Condition input graph
    console.log('Cleaning up graph');
    graph.prune();
    graph.genadjacencylist();
    graph.weight = graph.Gamma*edgeweight(graph) + nodecrawler(graph);
    graph.updatecount = 0;
    // Initialize
    // var graphdistribution = Array(iterationcount).fill(-1);
    const topgraphcount = Math.ceil(iterationcount*.01); // # members of top 1% of graphs
    var topgraphs = Array(topgraphcount);
    topgraphs[0] = _.cloneDeep(graph);
    var topgraphweights = Array(topgraphcount).fill(Infinity);
    topgraphweights[0] = graph.weight; // Avoids edge case in loops below
    var probgraphs = [];
    probgraphs.count = [];
    probgraphs.hashes = [];
    probgraphs.graphs = [];
    probgraphs.graphs[0] = graph;
    probgraphs.hashes[0] = graph.hash();
    probgraphs.count[0] = 1;
    var barcount = 10;
    var bar = new progress('Iterating... [:bar] :etas', {total: barcount } );
    var barprog = 0;
    var updates = 0;
    var sanitycount = 0;
    var warned = false;
    var lastgraphindex = 0;
    while (updates < iterationcount - 1) {
        //console.log(`loop #: ${sanitycount}, updates: ${updates}`);
        // console.log(graph);
        updates = graph.updatecount;
        const newgraph = edgeproposal(graph);
        var index = -1; //This will error if something goes wrong
        /* istanbul ignore next */
        if (newgraph.updatecount > updates) {  // no idea why this line is not covered by instanbul/jest (but below is)
            newgraph.genadjacencylist();
            const nhash = newgraph.hash();
            if (probgraphs.hashes.indexOf(nhash) >= 0) {
                // console.log(`graph already found, lastgraphindex: ${lastgraphindex}`);
                lastgraphindex = probgraphs.hashes.indexOf(nhash);
                probgraphs.count[probgraphs.hashes.indexOf(nhash)] += 1;
            }
            else {
                probgraphs.count.push(1);
                probgraphs.hashes.push(nhash);
                probgraphs.graphs.push(newgraph);
            }
            //console.log('update succesful, calculating weight');
            // new graph made; find if it is in our top distribution
            newgraph.weight = newgraph.Gamma*edgeweight(newgraph) + nodecrawler(newgraph);
            if (newgraph.weight < topgraphweights[topgraphcount - 1]) {
                //console.log('improved weight, attempting sort');
                if (topgraphweights[0] > newgraph.weight) { // check for new "best"
                    //console.log(`never fails? curr: ${topgraphweights} new:${newgraph.weight}`);
                    topgraphweights.splice(0,0,newgraph.weight);
                    topgraphweights.pop();
                    topgraphs.splice(0,0,_.cloneDeep(newgraph));
                    topgraphs.pop();
                }
                else {
                // Only bother if the new weight is better than last place of top %
                // Binary search below would be faster but needs extra tracking here
                    for (let i = topgraphcount - 2; i >= 0; i--) {
                        //console.log(`state1: ${(newgraph.weight >= topgraphweights[i])} state2: ${newgraph.weight < topgraphweights[i+1]}`);
                        if ( (newgraph.weight >= topgraphweights[i]) && (newgraph.weight < topgraphweights[i+1]) ) {
                            // We already know it belongs here, and now we find its place
                            index = i + 1;
                            topgraphweights.splice(index,0,newgraph.weight);
                            topgraphweights.pop();
                            topgraphs.splice(index,0,_.cloneDeep(newgraph));
                            topgraphs.pop();
                            break; 
                        }
                    }
                }
                
            }
            else { // no update means we have the same graph again
                probgraphs.count[lastgraphindex] += 1;
            }
            graph = _.cloneDeep(newgraph);
        }
        if (Math.floor(updates*barcount/iterationcount) > barprog) {
            bar.tick();
            barprog += 1;
        }
        sanitycount += 1;
        /* istanbul ignore if  */
        if (!warned && sanitycount > iterationcount*50) {
            console.warn('<2% acceptance rate: poor convergence!');
            warned = true;
        }
    }
    // time to sort the counts and graph identities together
    var sortedcounts = probgraphs.count;
    sortedcounts.sort(function(a,b){return b-a;});
    sortedcounts = sortedcounts.slice(0, topgraphcount);
    var mostprobgraphs = [];
    for (let i = 0; i < topgraphcount; i++) {
        mostprobgraphs.push(probgraphs.graphs[probgraphs.count[probgraphs.count.indexOf(sortedcounts[i])]]);
    }
    var avgedgesfrom0 = 0;
    var avgedges = 0;
    var avgworst = 0;
    for (let i = 0, n = topgraphcount; i < n; i++) {
        mostprobgraphs[i].genadjacencylist();
        avgedgesfrom0 += mostprobgraphs[i].adjlist[0].length;
        avgedges += mostprobgraphs[i].edges.length;
        avgworst += mostprobgraphs[i].longestoptpath;
    }
    avgedgesfrom0 = avgedgesfrom0/topgraphcount;
    avgedges = avgedges/topgraphcount;
    return {
        topg: topgraphs, topw: topgraphweights, 
        probg: mostprobgraphs, 
        probcounts: sortedcounts,
        avg0: avgedgesfrom0,
        avge: avgedges,
        avgw: avgworst
    };
    
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
        var tempedges = Array(graph.nodes);
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
            const tempindex = Math.round(Math.random()*(tempedges.length - 1));
            const node2 = tempedges[tempindex];
            if (containsedge(graph, node1, node2)) continue;
            newgraph.connect(node1, node2);
            const thetanew = newgraph.Gamma*edgeweight(newgraph) + nodecrawler(newgraph);
            if (Math.min(1, Math.exp(-(thetanew - thetaold)/graph.Temp)) >= rand) {
                return newgraph;
            }
        }
        if ((cansub && deciderand < .5) || !canadd) {
            // eslint-disable-next-line no-console
            // console.log('entered subtract path');
            const edge1 = Math.round(Math.random()*(graph.edges.length - 1));
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

module.exports = { Graph, connected, edgeweight, nodecrawler, readfile, edgeproposal, main, looper };
