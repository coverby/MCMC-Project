const assert = require('assert');
const graphMcmc = require('../index.js');

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
    var coords = [[0, 0], [0, 1], [1, 0], [-1, -1]];
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
});
