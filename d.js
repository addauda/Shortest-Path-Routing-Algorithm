const graph = require("./g");

//retrieves all nodes from graph
const getNodes = () => {
  let nodes = [];
  for (let node in graph) {
    nodes.push(parseInt(node));
  }
  return nodes;
};

//retrieves only nodes that have not been visited
const hasVisited = node => {
  if (Np.indexOf(node) == -1) return node;
};

//find the node with the minimum known weight
const findMinWeight = n => {
  let min = Infinity;
  let w = null;

  for (let idx of n) {
    if (D[idx] < min) {
      min = D[idx];
      w = idx;
    }
  }

  return w;
};

//djikstra variables
const self = 1; //this node
const N = getNodes(); //all nodes
const Np = [self]; //visited nodes
const D = []; //known weight to node
const P = []; //known predecessor to node

//init djikstra variables
N.forEach((v, idx) => {
  if (v == self) {
    D[idx] = 0;
    P[idx] = "Local";
  } else if (graph[self][v]) {
    P[idx] = self;
    D[idx] = graph[self][v].cost;
  } else {
    D[idx] = Infinity;
  }
});

while (Np.length !== N.length) {
  //filter all nodes for the indices of nodes that have now yet been visited
  let n = N.filter(hasVisited).map(node => {
    return N.indexOf(node);
  });

  //find the index of the unvisited node with minimum known weight
  let i = findMinWeight(n);

  //get all the neighours of i
  for (let v in graph[N[i]]) {
    v = parseInt(v);

    //if neighbour has not yet been visited
    if (Np.indexOf(v) == -1) {
      //update known weight for that neighbour, only if its better
      if (D[N.indexOf(v)] > D[i] + graph[N[i]][v].cost) {
        D[N.indexOf(v)] = D[i] + graph[N[i]][v].cost;

        //set predecessor node
        P[N.indexOf(v)] = N[i];
      }
    }
  }

  //add i to visited
  Np.push(N[i]);
}

//construct Rib
// console.log(N);
// console.log(D);
// console.log(P);

const tracePredecessor = (pred, idx) => {
  if (pred == "Local") {
    return pred;
  } else if (pred == self) {
    return `R${self}`;
  } else {
    if (P[N.indexOf(pred)] == self) {
      return `R${pred}`;
    }
    return tracePredecessor(P[N.indexOf(pred)]);
  }
};

let output = `# RIB\n`;
N.forEach((node, idx) => {
  output += `R${self} -> R${node} -> ${tracePredecessor(P[idx], idx)}, ${
    D[idx]
  }\n`;
});

console.log(output);
