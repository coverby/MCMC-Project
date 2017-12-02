# graph-mcmc [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]
> Javascript MCMC Che 477 Project

# Overview
This package uses a Markov chain Monte Carlo algorithm to alter an input graph using the proposal distribution of p new/p old = exp (-(theta new - theta old)/T), where theta is the sum of all edge lengths (multiplied by weight parameter gamma) combined with the sum of all shortest paths from node 0.  Base edge weight is the euclidian distance between node coordinates.  The output of the program are summary statistics and examples of the top 1% of graphs encountered during iteration.

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
```js
node graphmcmc.js
```

This package exports modules: Graph, connected, edgeweight, nodecrawler, readfile, edgeproposal, main, looper 


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
