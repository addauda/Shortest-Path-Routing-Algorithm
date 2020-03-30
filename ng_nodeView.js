class NetworkGraph {
  constructor() {
    this.graph = {};
    //l1: { routers: [1,2], cost:1 }

    this.nodeViewGraph = {};
    //1: {2: {linkId:1, cost:6}}
  }

  update(routerId, linkId, cost) {
    this.updateLinkView(routerId, linkId, cost);
    //this.updateNodeView(routerId, linkId, cost);
  }

  updateLinkView(routerId, linkId, cost) {
    //if the link already exists, then router on the link
    if (this.graph[linkId]) {
      this.graph[linkId].routers.push(routerId);
      this.graph[linkId].cost = cost;
    } else {
      //create new link
      this.graph[linkId] = { routers: [routerId], cost: cost };
    }
  }

  updateNodeView(routerId, linkId, cost) {
    //if the link already exists, then router on the link
    if (this.nodeViewGraph[routerId]) {
      this.nodeViewGraph[routerId][linkId] = {};
      //this.nodeViewGraph[routerId][linkId].cost = cost;
    } else {
      //create new node and add link
      this.nodeViewGraph[routerId] = {};
      this.nodeViewGraph[routerId][linkId] = {};
    }

    this.discoverNeighboursOnLink(routerId, linkId, cost);
  }

  checkUniqueLSPDU_2(routerId, linkId, cost) {
    //if link exists and the routers on the link and cost is the same
    if (this.nodeViewGraph[routerId]) {
      if (
        this.nodeViewGraph[routerId][linkId] &&
        this.nodeViewGraph[routerId][linkId].cost == cost
      ) {
        return false;
      }
    }

    return true;
  }

  checkUniqueLSPDU(routerId, linkId, cost) {
    //check if link already exists
    if (this.graph[linkId]) {
      let link = this.graph[linkId];

      //if link exists and the routers on the link and cost is the same
      if (link.routers.includes(routerId) && link.cost == cost) {
        return false;
      }
    }

    return true;
  }

  discoverNeighboursOnLink(routerId, linkId, cost) {
    for (let node in this.nodeViewGraph) {
      if (node != routerId && this.nodeViewGraph[node][linkId]) {
        this.nodeViewGraph[routerId][linkId].neighbour = node;
        this.nodeViewGraph[routerId][linkId].cost = cost;
        return true;
      }
    }

    return false;
  }

  toString_2() {
    let output = ``;
    for (let node in this.nodeViewGraph) {
      output += `Router ${node}\n`;
      for (let linkId in this.nodeViewGraph[node]) {
        let link = this.nodeViewGraph[node][linkId];
        output += `\t${link.neighbour}, c:${link.cost} via ${linkId}\n`;
      }
    }
    return output;
  }

  toString() {
    let output = ``;
    for (let linkId in this.graph) {
      output += `Link ${linkId}\n`;
      output += `\trouters ${this.graph[linkId].routers.join(",")}\n`;
      output += `\tcost ${this.graph[linkId].cost}\n`;
    }
    return output;
  }
}

module.exports = NetworkGraph;
