class NetworkGraph {
  constructor() {
    this.graph = {};
  }

  createLink(routerId, linkId, cost) {
    //if the link already exists, then router on the link
    if (this.graph[linkId]) {
      this.graph[linkId].routers.push(routerId);
      this.graph[linkId].cost = cost;
    } else {
      //create new link
      this.graph[linkId] = { routers: [routerId], cost: cost };
    }
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
