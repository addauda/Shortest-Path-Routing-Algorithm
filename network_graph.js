class NetworkGraph {
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
  }

  update(routerId, linkId, cost) {
    this.updateLinkView(routerId, linkId, cost);
    this.updateNodeView();
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

  printNodeView() {
    let output = ``;
    for (let node in this.nodeViewGraph) {
      output += `Router ${node}\n`;
      for (let neighbour in this.nodeViewGraph[node]) {
        output += `\tr:${neighbour}, c:${this.nodeViewGraph[node][neighbour].cost} via ${this.nodeViewGraph[node][neighbour].link}\n`;
      }
    }
    return output;
  }

  printLinkView() {
    let output = ``;
    for (let linkId in this.linkViewGraph) {
      output += `Link ${linkId}\n`;
      output += `\trouters ${this.linkViewGraph[linkId].routers.join(",")}\n`;
      output += `\tcost ${this.linkViewGraph[linkId].cost}\n`;
    }
    return output;
  }

  djikstra() {
    let self = this.routerId;
    let N = Object.keys(this.nodeViewGraph);
    let D = []; //distance to
    let P = [];

    //init djikstra
    let D = N.map(v, idx => {
      if (v == self) {
        return 0;
      } else if (this.nodeViewGraph[self][v]) {
        P[idx] = this.routerId;
        return this.nodeViewGraph[self][v].cost;
      } else {
        return Infinity;
      }
    });

    return D;
  }
}

module.exports = NetworkGraph;
