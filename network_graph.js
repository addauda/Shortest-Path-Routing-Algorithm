class NetworkGraph {
  constructor(routerId) {
    this.graph = {};
    this.routerId = routerId;
  }

  createLink(routerId, linkId, cost) {
    //if the link already exists, then router on the link
    if (this.graph[linkId]) {
      this.graph[linkId].routers.push(routerId);
      this.graph[linkId].cost = cost;
    } else {
      //create new link
      this.graph[linkId] = { routers: [routerId], cost: cost };

      //link is neighouring, so add self as router on the link
      //isNeighbour && this.graph[linkId].routers.push(this.routerId);
    }
  }

  checkUniqueLSPDU(routerId, linkId, cost) {
    if (!this.graph[linkId]) {
      return true;
    }

    let link = this.graph[linkId];
    if (link.routers.includes(routerId) && link.cost == cost) {
      return false;
    } else {
      return true;
    }
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
