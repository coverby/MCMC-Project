const assert = require('assert');
const graphMcmc = require('../index.js');

describe('file in/out handling', () => {
    it('should correctly read an input file', () => {
        const fileid = './__tests__/readtest1.txt';
        const graph = graphMcmc.readfile(fileid);
        // eslint-disable-next-line no-console
        // console.log(graph.edges[1]);
        const ncount = 4;
        const ggam = graph.Gamma;
        const gtemp = graph.Temp;
        const coords = graph.coords;
        const edges = graph.edges;
        const result = (
            ncount === 4 &&
            ggam === 1 &&
            gtemp === 100 &&
            coords.length === 4 &&
            edges.length === 4
        );
        // eslint-disable-next-line no-console
        // console.log(result);
        assert(result, `output should match input, nodes: ${ncount}, gamma: ${ggam}, temp: ${gtemp},
        # coords: ${coords.length}, # edges: ${edges.length}`);
    });
});

describe('graphmcmc connectivity', () => {
    it('should correctly say a graph is connected if it is', () => {
        var coords = [[0, 0], [0, 1], [1, 0], [-1, -1]];
        const graph = new graphMcmc.Graph(4, coords);
        graph.connect(0, 1);
        graph.connect(1, 2);
        graph.connect(2, 3);
        graph.connect(3, 0);
        graph.connect(0, 2);
        const result = graphMcmc.connected(graph);
        assert(result, 'The graph should have been connected');
    });
    it('should correctly say a disconnected graph is disconnected', () => {
        var coords = [[0, 0], [0, 1]];
        const graph = new graphMcmc.Graph(2, coords);
        graph.connect(0, 3);
        graph.connect(1, 2);
        const result = graphMcmc.connected(graph);
        assert(!result, 'the graph was not connected but it says it is');
    });
    it('should deal with single node graphs', () => {
        var coords = [[0, 0], [0, 1], [1, 0], [-1, -1]];
        const graph = new graphMcmc.Graph(1, coords);
        graph.connect(0, 0);
        const result = graphMcmc.connected(graph);
        assert(result, 'The graph should have been connected');
    });
    it('should deal with internal self loops', () => {
        var coords = [[0, 0], [0, 1], [1, 0], [-1, -1]];
        const graph = new graphMcmc.Graph(8, coords);
        graph.connect(0, 1);
        graph.connect(0, 2);
        graph.connect(1, 3);
        graph.connect(2, 3);
        graph.connect(3, 4);
        graph.connect(4, 5);
        graph.connect(5, 6);
        graph.connect(5, 7);
        graph.connect(7, 8);
        graph.connect(6, 8);
        const result = graphMcmc.connected(graph);
        // C console.log(
        // C  `graph data: length: ${graph.edges.length}, edge 0: ${graph.edges[0]}, xlocs: ${
        // C    graph.xlocs
        // C  }`
        // C );
        assert(result, 'The graph should have been connected');
    });
    it('should prune duplicate edges', () => {
        var coords = [[0, 0], [0, 1], [1, 0], [-1, -1]];
        const graph = new graphMcmc.Graph(4, coords);
        graph.connect(0, 1);
        graph.connect(1, 2);
        graph.connect(2, 3);
        graph.connect(1, 3);
        graph.connect(3, 0);
        graph.connect(1, 0);
        graph.connect(0, 1);
        graph.connect(3, 2);
        graph.prune();
        const result = graph.edges.length === 5;
        assert(
            result,
            `The graph should have been pruned (length 5 not ${graph.edges.length})`
        );
    });
    it('should create functional hashes', () => {
        var coords = [[0, 0], [0, 1], [1, 0], [-1, -1]];
        const graph = new graphMcmc.Graph(8, coords);
        graph.connect(0, 1);
        graph.connect(0, 2);
        graph.connect(1, 3);
        graph.connect(2, 3);
        graph.connect(3, 4);
        graph.connect(4, 5);
        graph.connect(5, 6);
        graph.connect(5, 7);
        graph.connect(7, 8);
        graph.connect(6, 8);
        graph.genadjacencylist();
        graph.hash();
        const hash1 = graph.hashval;
        graph.connect(5, 1);
        graph.genadjacencylist();
        graph.hash();
        const hash2 = graph.hashval;
        const result = (hash1 != hash2);
        // console.log(`hash: ${hash}`);
        assert(result, `Hashes should not be equal! Hash values: returned: ${hash1}, ${hash2}`);
    });
});

describe('graphmcmc weight mapping', () => {
    it('should calculate simple edge weight component (path indepdendent)', () => {
        var coords = [[0, 0], [0, 1], [1, 0], [-1, -1]];
        const graph = new graphMcmc.Graph(4, coords);
        graph.connect(0, 1);
        graph.connect(0, 2);
        graph.connect(2, 3);
        graph.connect(0, 3);
        const weight = graphMcmc.edgeweight(graph);
        // C console.log(weight);
        const result = parseFloat(weight.toFixed(2)) === 5.65; // Seriously?
        assert(result, `the graph should have weight 5.65, reported: ${weight.toFixed(2)}`);
    });
    it('should generate an edgelist', () => {
        var coords = [[0, 0], [0, 1], [1, 0], [-1, -1]];
        const graph = new graphMcmc.Graph(4, coords);
        graph.connect(0, 1);
        graph.connect(0, 2);
        graph.connect(2, 3);
        graph.connect(0, 3);
        graph.genedgelist();
        // C console.log(weight);
        const result = graph.edgelist[0].length === 3;
        assert(
            result,
            `the graph should have edge list [0] depth of 3, reported: ${
                graph.edgelist[0].length
            }`
        );
    });
    it('should generate an adjacency list', () => {
        var coords = [[0, 0], [0, 1], [1, 0], [-1, -1]];
        const graph = new graphMcmc.Graph(4, coords);
        graph.connect(0, 1);
        graph.connect(0, 2);
        graph.connect(2, 3);
        graph.connect(0, 3);
        graph.genadjacencylist();
        // C console.log(weight);
        var comparison = [];
        comparison.push(1);
        comparison.push(2);
        comparison.push(3);
        const result =
      graph.adjlist[0].length === comparison.length &&
      JSON.stringify(graph.adjlist[0]) === JSON.stringify(comparison);
        assert(
            result,
            `the graph should have adjacency [0] of ${comparison} with length ${
                comparison.length
            } , reported: ${graph.adjlist[0]} , length is ${graph.adjlist[0].length}`
        );
    });
    it('should calculate all shortest-path lengths to node 0', () => {
        var coords = [[0, 0], [0, 1], [1, 0], [-1, -1], [10, 0], [2, -2]];
        const graph = new graphMcmc.Graph(6, coords);
        graph.connect(0, 1);
        graph.connect(0, 2);
        graph.connect(2, 3);
        graph.connect(0, 3);
        graph.connect(3, 4);
        graph.connect(4, 5);
        graph.connect(5, 2);
        const distance = graphMcmc.nodecrawler(graph);
        const comparison = 18.13; // A tedious calculation...
        const result = distance.toFixed(2) === comparison.toFixed(2);
        assert(
            result,
            `the graph should have weight ${comparison.toFixed(2)}; returned ${distance.toFixed(
                2
            )}` // This is what makes you happy, eslint?
        );
    });
});

describe('graph edge change proposals', () => {
    it('should correctly add edges', () => {
        var coords = [[0, 0], [0, 1], [1, 0], [-1, -1], [10, 0], [2, -2]];
        const graph = new graphMcmc.Graph(6, coords);
        graph.connect(0, 1);
        graph.connect(0, 2);
        graph.connect(0, 3);
        graph.connect(0, 4);
        graph.connect(0, 5);
        graph.Gamma = 1;
        graph.Temp = 100;
        // graph.genedgelist();
        // eslint-disable-next-line no-console
        // console.log(`edges: ${graph.edges}`);
        // eslint-disable-next-line no-console
        // console.log(`Initial edgelist: ${graph.edges}`);
        const graph2 = graphMcmc.edgeproposal(graph);
        // eslint-disable-next-line no-console
        // console.log(`End edgelist: ${graph2.edges}`);
        const result = (graph.edges.length < graph2.edges.length);
        assert(result, 'number of edges should have increased (may be stochastic)');
    });
    it('should correctly subtract edges', () => {
        var coords = [[0, 0], [0, 1], [1, 0]];
        const graph = new graphMcmc.Graph(3, coords);
        graph.connect(0, 1);
        graph.connect(0, 2);
        graph.connect(1, 2);
        graph.Gamma = 1;
        graph.Temp = 100;
        // graph.genedgelist();
        // eslint-disable-next-line no-console
        // console.log(`edges: ${graph.edges}`);
        // eslint-disable-next-line no-console
        // console.log(`Initial edgelist: ${graph.edges}`);
        const graph2 = graphMcmc.edgeproposal(graph);
        // eslint-disable-next-line no-console
        // console.log(`End edgelist: ${graph2.edges}`);
        const result = (graph.edges.length > graph2.edges.length);
        assert(result, 'number of edges should have decreased (may be stochastic)');
    });
    it('should correctly time out with impossible addition', () => {
        var coords = [[0, 0], [0, 1], [1, 0], [Infinity, Infinity]];
        const graph = new graphMcmc.Graph(4, coords);
        graph.connect(0, 1);
        graph.connect(0, 2);
        graph.connect(1, 2);
        graph.connect(0, 3);
        graph.Gamma = 1;
        graph.Temp = 10;
        // graph.genedgelist();
        // eslint-disable-next-line no-console
        // console.log(`edges: ${graph.edges}`);
        // eslint-disable-next-line no-console
        // console.log(`Initial edgelist: ${graph.edges}`);
        const graph2 = graphMcmc.edgeproposal(graph);
        // eslint-disable-next-line no-console
        // console.log(`End edgelist: ${graph2.edges}`);
        const result = (graph.edges.length === graph2.edges.length);
        assert(result, 'number of edges should have been constant');
    });
});

describe('graph statistics analysis', () => {
    it('should correctly compare graphs via hashes', () => {
        var coords = [[0, 0], [0, 1], [1, 0], [0, 4]];
        const graph = new graphMcmc.Graph(4, coords);
        graph.connect(0, 1);
        graph.connect(0, 2);
        graph.connect(1, 2);
        graph.connect(0, 3);
        graph.Gamma = 1;
        graph.Temp = 10;
        graph.genadjacencylist();
        //console.log(`graph1 adjlist: ${graph.adjlist}`);
        const hash1 = graph.hash();
        const graph2 = new graphMcmc.Graph(4, coords);
        graph2.connect(0, 1);
        graph2.connect(3, 0);
        graph2.connect(0, 2);
        graph2.connect(1, 2);
        graph2.Gamma = 1;
        graph2.Temp = 10;
        graph2.genadjacencylist();
        //console.log(`graph2 adjlist: ${graph2.adjlist}`);
        const hash2 = graph2.hash();
        const graph3 = new graphMcmc.Graph(4, coords);
        graph3.connect(0, 1);
        graph3.connect(0, 2);
        graph3.connect(1, 2);
        graph3.connect(0, 2);
        graph3.Gamma = 1;
        graph3.Temp = 10;
        graph3.prune();
        graph3.genadjacencylist();
        const hash3 = graph3.hash();
        const resultsame = (hash1 === hash2); // equal
        const resultdiff = (hash1 !== hash3); // not equal
        // eslint-disable-next-line no-console
        // console.log(result);
        assert(resultsame, `identical graphs not reported as such: 1: ${hash1}, 2: ${hash2}`);
        assert(resultdiff, `hashes should not be equal: 1: ${hash1}, 3: ${hash3}`);
    });
    it('should return top 1% of graphs', () => {
        var coords = [[0, 0], [0, 1], [1, 0], [2, 5], [6, 1], [-2, 4], [-2, -2], [1, 10],[5,4],[4,5]];
        const graph = new graphMcmc.Graph(10, coords);
        graph.connect(0, 1);
        graph.connect(0, 2);
        graph.connect(1, 2);
        graph.connect(0, 3);
        graph.connect(3, 4);
        graph.connect(4, 5);
        graph.connect(5, 6);
        graph.connect(7, 1);
        graph.connect(8, 0);
        graph.connect(9, 6);
        graph.Gamma = 1;
        graph.Temp = 100;
        const itercount = 1000;
        const output = graphMcmc.looper(graph, itercount);
        const result = (
            output.topw.length === 10 &&
            output.topg.length === 10 &&
            output.probg.length === 10 &&
            output.probcounts.length === 10 &&
            !output.topw.includes(Infinity) &&
            !output.probcounts.includes(NaN) && 
            output.avg0 > 0 &&
            output.avge > 0 &&
            output.avg0 < graph.nodes - 1 && 
            output.avgw >= 0
        );
        //console.log(`# weights: ${output.topw.length}, # graphs: ${output.topg.length}, finite values: ${!output.topw.includes(Infinity)}`);
        //console.log(`weights: ${output.topw}`);
        assert(result, `top 1% has unexpected parameters, avg0: ${output.avg0}, avge: ${output.avge}`);
    });
    it('should report longest optimal path weight', () => {
        var coords = [[0, 0], [0, 1], [1, 0], [4, 1]];
        const graph = new graphMcmc.Graph(4, coords);
        graph.connect(0, 1);
        graph.connect(0, 2);
        graph.connect(1, 2);
        graph.connect(0, 3);
        graph.Gamma = 1;
        graph.Temp = 10;
        // graph.genedgelist();
        // eslint-disable-next-line no-console
        // console.log(`edges: ${graph.edges}`);
        // eslint-disable-next-line no-console
        // console.log(`Initial edgelist: ${graph.edges}`);
        graphMcmc.nodecrawler(graph);
        // eslint-disable-next-line no-console
        // console.log(`End edgelist: ${graph2.edges}`);
        const predictedweight = 4.1231056;
        const result = (graph.longestoptpath.toFixed(3) === predictedweight.toFixed(3));
        assert(result, `longest path weight incorrect; expected: ${predictedweight.toFixed(3)}, output: ${graph.longestoptpath.toFixed(3)}`);
    });
});