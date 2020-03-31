class Network {
  constructor(routerId) {
    this.routerId = routerId;

    this.linkViewGraph = {};
    /*
      let linkViewGraphSample = {
        1: { routers: [1, 2], cost: 3 },
        2: { routers: [1, 2], cost: 3 }
      };
    */

    this.nodeViewGraph = {};
    /*
      let nodeViewGraphsample = {
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

  update(routerId, linkId, cost) {
    this.updateLinkView(routerId, linkId, cost);
    this.updateNodeView();
    this.computeShortestPath();
  }

  updateLinkView(routerId, linkId, cost) {
    //if the link already exists, then add router on the link
    if (this.linkViewGraph[linkId]) {
      this.linkViewGraph[linkId].routers.push(routerId);
      this.linkViewGraph[linkId].cost = cost;
    } else {
      //create a new link
      this.linkViewGraph[linkId] = { routers: [routerId], cost: cost };
    }
  }

  updateNodeView() {
    for (let linkId in this.linkViewGraph) {
      let link = this.linkViewGraph[linkId];

      //process each router on the link
      for (let node of link.routers) {
        if (!this.nodeViewGraph[node]) {
          this.nodeViewGraph[node] = {};
        }

        //if neighbours are on the link, process neighbour
        if (link.routers.length > 1) {
          let neighbours = link.routers.filter(id => {
            return id != node;
          });

          //add routerId as neighbour to current node
          this.nodeViewGraph[node][neighbours[0]] = {
            link: linkId,
            cost: link.cost
          };
        }
      }
    }
  }

  checkUniqueLSPDU(routerId, linkId, cost) {
    //check if link already exists
    if (this.linkViewGraph[linkId]) {
      let link = this.linkViewGraph[linkId];

      //if link exists and the routers on the link and cost is the same
      if (link.routers.includes(routerId) && link.cost == cost) {
        return false;
      }
    }

    return true;
  }

  computeShortestPath() {
    //retrieves all nodes from graph
    const getNodes = () => {
      let nodes = [];
      for (let node in this.nodeViewGraph) {
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
    const N = getNodes(); //all nodes
    const Np = [this.routerId]; //visited nodes
    const D = []; //known weight to node
    const P = []; //known predecessor to node

    //init djikstra variables
    N.forEach((v, idx) => {
      if (v == this.routerId) {
        D[idx] = 0;
        P[idx] = "Local";
      } else if (this.nodeViewGraph[this.routerId][v]) {
        P[idx] = this.routerId;
        D[idx] = this.nodeViewGraph[this.routerId][v].cost;
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
      for (let v in this.nodeViewGraph[N[i]]) {
        v = parseInt(v);

        //if neighbour has not yet been visited
        if (Np.indexOf(v) == -1) {
          //update known weight for that neighbour, only if its better
          if (D[N.indexOf(v)] > D[i] + this.nodeViewGraph[N[i]][v].cost) {
            D[N.indexOf(v)] = D[i] + this.nodeViewGraph[N[i]][v].cost;

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

  printNodeView() {
    let output = `# Topology Database\n`;
    for (let node in this.nodeViewGraph) {
      output += `R${this.routerId} -> R${node} -> nbr link ${
        Object.keys(this.nodeViewGraph[node]).length
      }\n`;
      for (let neighbour in this.nodeViewGraph[node]) {
        output += `R${this.routerId} -> R${node} -> link ${this.nodeViewGraph[node][neighbour].link} cost ${this.nodeViewGraph[node][neighbour].cost}\n`;
      }
    }
    return output;
  }

  printLinkView() {
    let output = `# Link Databse\n`;
    for (let linkId in this.linkViewGraph) {
      output += `Link ${linkId}\n`;
      output += `\trouters ${this.linkViewGraph[linkId].routers.join(",")}\n`;
      output += `\tcost ${this.linkViewGraph[linkId].cost}\n`;
    }
    return output;
  }

  printRIB() {
    let N = this.RIB[0];
    let D = this.RIB[1];
    let P = this.RIB[2];
    let output = ``;

    for (let arr of this.RIB) {
      output += JSON.stringify(arr);
      output += `\n`;
    }

    return output;

    // const tracePredecessor = pred => {
    //   if (pred == "Local") {
    //     return pred;
    //   } else if (pred == this.routerId) {
    //     return `R${this.routerId}`;
    //   } else {
    //     if (P[N.indexOf(pred)] == this.routerId) {
    //       return `R${pred}`;
    //     }
    //     return tracePredecessor(P[N.indexOf(pred)]);
    //   }
    // };

    // let output = `# RIB\n`;
    // N.forEach((node, idx) => {
    //   output += `R${this.routerId} -> R${node} -> ${tracePredecessor(
    //     P[idx]
    //   )}, ${D[idx]}\n`;
    // });

    return output;
  }
}

module.exports = Network;
