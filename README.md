# graph-mcmc [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]
> Javascript MCMC Che 477 Project

# Overview
This package uses a Markov chain Monte Carlo algorithm to alter an input graph using the proposal distribution of p new/p old = exp (-(theta new - theta old)/T), where theta is the sum of all edge lengths (multiplied by weight parameter gamma) combined with the sum of all shortest paths from node 0.  Base edge weight is the euclidian distance between node coordinates.  The output of the program are summary statistics and examples of the top 1% of graphs encountered during iteration.  Node 0 is always considered the origin node, and all weights are evaluated with that assumption.

## Installation

```sh
$ npm install --save graphMcmc
```

## Usage
Include this package with:
```js
const graphMcmc = require('graphMcmc');
```
To use this program directly, use:
```sh
node graphmcmc.js
```
The program will require user input to specify input file and the desired number of graph permutations.

This package takes an input file (located in the same directory as the graphmcmc.js) in the format:

```
#Input file contains nodecount, node positions, and node connections
#Node count:
(integer)
#Gamma parameter:
(integer or float)
#Temperature parameter:
(integer or float)
#Node coordinates:
(float, float) (in pairs; must be #nodes of pairs)
#Node connections:
(integer, integer) (in pairs; initial graph must be connected or program will error)
```

An example input filed (used for testing):
```
#Input file contains nodecount, node positions, and node connections
#Node count:
4
#Gamma parameter:
1
#Temperature parameter:
100
#Node coordinates:
0, 0
0, 1
1, 0
1, 1
#Node connections:
0, 1
1, 2
2, 3
3, 0

```

## Modules
This package exports modules: Graph, connected, edgeweight, nodecrawler, readfile, edgeproposal, main, looper 

### Graph
Graph object that contains methods for adding and removing edges, producing node connection (adjacency) lists, and conditioning its data for use in other modules.

### (Boolean) = connected(graph)
Returns false if a node is found to be unconnected to other nodes.  Written by Dr. Andrew White.

### weight = edgeweight(graph, i, j)
Returns the euclidian distance between nodes i and j on graph object.

### totaledgeweight = nodecrawler(graph)
Returns the total weight of the graph using both edge weight summation and optimal-path-to-origin length.  Uses the Djikstra algorithm.

### graph = readfile(inputfile)
Reads the inputfile and products a new graph based on parameters found.

### newgraph = edgeproposal(graph)
Proposes a modification (edge removal or edge addition) for the input graph and returns the modified graph if successful (or the input graph if not).  Proposals are evaluated using the proposal distribution function described in the overview.

### main()
Begins prompting user for inputs required to begin the simulation.  Outputs summary statistics of top 1% of graphs encountered during iteration.

### output = looper(graph, iterationcount)
Drives edgeproposal and evaluates ouput graph of edgeproposal.  Collects statistics on graphs encountered as iteration continues.  When the required number of graphs have been produced (based on iterationcount), it summarizes the top 1% of graphs based on occurrence and produces an object for output that contains .topg, .topw .probg, .probcounts, .avg0, .avge, and .avgw, which are:
1. .topg: the top 1% highest scoring graphs objects
2. .topw: the top 1% highest scoring graph total weights 
3. .probg: the top 1% most frequent graphs
4. .probcounts: the number of times each most frequent graph was encountered
5. .avg0: the average (expected) number of edges connected to node 0 in top 1% most frequent graphs
6. .avge: the average (expected) number of total edges in top 1% most frequent graphs
7. .avgw: the average (expected) length of the longest optimal path in the top 1% most frequent graphs

## License

MIT © [Clyde Overby](github.com/coverby)


[npm-image]: https://badge.fury.io/js/graph-mcmc.svg
[npm-url]: https://npmjs.org/package/graph-mcmc
[travis-image]: https://travis-ci.org/coverby/graph-mcmc.svg?branch=master
[travis-url]: https://travis-ci.org/coverby/graph-mcmc
[daviddm-image]: https://david-dm.org/coverby/graph-mcmc.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/coverby/graph-mcmc
[coveralls-image]: https://coveralls.io/repos/coverby/graph-mcmc/badge.svg
[coveralls-url]: https://coveralls.io/r/coverby/graph-mcmc
