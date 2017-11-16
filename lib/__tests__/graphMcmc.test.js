const assert = require('assert');
const graphMcmc = require('../index.js');

describe('graphmcmc connectivity', () => {
  it('should correctly say a graph is connected if it is', () => {
    const graph = new graphMcmc.Graph(4);
    graph.connect(0, 1);
    graph.connect(1, 2);
    graph.connect(2, 3);
    graph.connect(3, 0);
    graph.connect(0, 2);
    const result = graphMcmc.connected(graph);
    assert(result, 'The graph should have been connected');
  });
  it('should correctly say a disconnected graph is disconnected', () => {
    const graph = new graphMcmc.Graph(2);
    graph.connect(0, 3);
    graph.connect(1, 2);
    const result = graphMcmc.connected(graph);
    assert(!result, 'the graph was not connected but it says it is');
  });
  it('should deal with single node graphs', () => {
    const graph = new graphMcmc.Graph(1);
    graph.connect(0, 0);
    const result = graphMcmc.connected(graph);
    assert(result, 'The graph should have been connected');
  });
  it('should deal with internal self loops', () => {
    const graph = new graphMcmc.Graph(8);
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
    assert(result, 'The graph should have been connected');
  });
});
