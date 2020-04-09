class Network {
  constructor(self) {
    this.self = self;

    this.linkStateDatabase = {};
    /*
      let linkStateDatabaseSample = {
        1: { routers: [1, 2], cost: 3 },
        2: { routers: [1, 2], cost: 3 }
      };
    */

    this.topology = {};
    /*
      let topologysample = {
        1: {
          2: {
            link: 1,
            cost: 6
          }
        }
      };
    */

    this.RIB = [];
  }

  update(self, linkId, cost) {
    this.updateLinkView(self, linkId, cost);
    this.updateTopology();
  }

  updateLinkView(self, linkId, cost) {
    //if the link already exists, then add router on the link
    if (this.linkStateDatabase[linkId]) {
      this.linkStateDatabase[linkId].routers.push(self);
      this.linkStateDatabase[linkId].cost = cost;
    } else {
      //create a new link
      this.linkStateDatabase[linkId] = { routers: [self], cost: cost };
    }
  }

  updateTopology() {
    for (let linkId in this.linkStateDatabase) {
      let link = this.linkStateDatabase[linkId];

      //process each router on the link
      for (let node of link.routers) {
        if (!this.topology[node]) {
          this.topology[node] = {};
        }

        //if neighbours are on the link, process neighbour
        if (link.routers.length > 1) {
          let neighbours = link.routers.filter((id) => {
            return id != node;
          });

          //add self as neighbour to current node
          this.topology[node][neighbours[0]] = {
            link: linkId,
            cost: link.cost,
          };
        }
      }
    }
  }

  checkUniqueLSPDU(self, linkId, cost) {
    //check if link already exists
    if (this.linkStateDatabase[linkId]) {
      let link = this.linkStateDatabase[linkId];

      //if link exists and the routers on the link and cost is the same
      if (link.routers.includes(self) && link.cost == cost) {
        return false;
      }
    }

    return true;
  }

  computeShortestPath() {
    //retrieves all nodes from graph
    const getNodes = () => {
      let nodes = [];
      for (let node in this.topology) {
        nodes.push(parseInt(node));
      }
      return nodes;
    };

    //retrieves only nodes that have not been visited
    const hasVisited = (node) => {
      if (Np.indexOf(node) == -1) return node;
    };

    //find the node with the minimum known weight
    const findMinWeight = (n) => {
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
    const N = getNodes(); //all nodes
    const Np = [this.self]; //visited nodes
    const D = []; //known weight to node
    const P = []; //known predecessor to node

    //init djikstra variables
    N.forEach((v, idx) => {
      if (v == this.self) {
        D[idx] = 0;
        P[idx] = "Local";
      } else if (this.topology[this.self][v]) {
        D[idx] = this.topology[this.self][v].cost;
        P[idx] = this.self;
      } else {
        D[idx] = Infinity;
        P[idx] = null;
      }
    });

    while (Np.length !== N.length) {
      //filter all nodes for the indices of nodes that have now yet been visited
      let n = N.filter(hasVisited).map((node) => {
        return N.indexOf(node);
      });

      //find the index of the unvisited node with minimum known weight
      let i = findMinWeight(n);

      //get all the neighours of i
      for (let v in this.topology[N[i]]) {
        v = parseInt(v);

        //if neighbour has not yet been visited
        if (Np.indexOf(v) == -1) {
          //update known weight for that neighbour, only if its better
          if (D[N.indexOf(v)] > D[i] + this.topology[N[i]][v].cost) {
            D[N.indexOf(v)] = D[i] + this.topology[N[i]][v].cost;

            //set predecessor node
            P[N.indexOf(v)] = N[i];
          }
        }
      }

      //add i to visited
      Np.push(N[i]);
    }

    //update RIB
    this.RIB = [N, D, P];
  }

  printTopology(logger) {
    logger.info(`# Topology Database`);
    for (let node in this.topology) {
      logger.info(
        `R${this.self} -> R${node} -> nbr link ${
          Object.keys(this.topology[node]).length
        }`
      );
      for (let neighbour in this.topology[node]) {
        logger.info(
          `R${this.self} -> R${node} -> link ${this.topology[node][neighbour].link} cost ${this.topology[node][neighbour].cost}`
        );
      }
    }
  }

  printLinkStateDatabase(logger) {
    logger.info(`# Link State Database`);
    for (let linkId in this.linkStateDatabase) {
      logger.info(`Link ${linkId}`);
      logger.info(
        `\trouters ${this.linkStateDatabase[linkId].routers.join(",")}`
      );
      logger.info(`\tcost ${this.linkStateDatabase[linkId].cost}`);
    }
  }

  printRIB(logger) {
    //breakdown RIB structure
    let N = this.RIB[0];
    let D = this.RIB[1];
    let P = this.RIB[2];

    //figure out root level predecessor to destination
    const tracePredecessor = (pred) => {
      if (pred) {
        if (pred == "Local") {
          return pred;
        } else if (pred == this.self) {
          return `R${this.self}`;
        } else {
          let prev = null;
          while (pred != this.self) {
            prev = pred;
            pred = P[N.indexOf(pred)];
          }
          return `R${prev}`;
        }
      }
      return `INF`;
    };

    logger.info(`# RIB`);
    N.forEach((node, idx) => {
      logger.info(
        `R${this.self} -> R${node} -> ${tracePredecessor(P[idx])}, ${D[
          idx
        ].toString()}`
      );
    });
  }
}

module.exports = Network;
