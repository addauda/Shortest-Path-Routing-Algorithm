class HelloPacket {
  constructor(routerId, linkId) {
    this.routerId = routerId;
    this.linkId = linkId;
  }

  getUDPData() {
    let buffer = Buffer.alloc(8);
    buffer.writeInt32LE(this.routerId, 0);
    buffer.writeInt32LE(this.linkId, 4);
    return buffer;
  }

  static parseUDPdata(buffer) {
    let routerId = buffer.readInt32LE(0);
    let linkId = buffer.readInt32LE(4);
    return new HelloPacket(routerId, linkId);
  }
}

class LinkStatePacket {
  constructor(sender, routerId, linkId, cost, via) {
    this.sender = sender;
    this.routerId = routerId;
    this.linkId = linkId;
    this.cost = cost;
    this.via = via;
  }

  getUDPData() {
    let buffer = Buffer.alloc(20);
    buffer.writeInt32LE(this.sender, 0);
    buffer.writeInt32LE(this.routerId, 4);
    buffer.writeInt32LE(this.linkId, 8);
    buffer.writeInt32LE(this.cost, 12);
    buffer.writeInt32LE(this.via, 16);
    return buffer;
  }

  static parseUDPdata(buffer) {
    let sender = buffer.readInt32LE(0);
    let routerId = buffer.readInt32LE(4);
    let linkId = buffer.readInt32LE(8);
    let cost = buffer.readInt32LE(12);
    let via = buffer.readInt32LE(16);
    return new LinkStatePacket(sender, routerId, linkId, cost, via);
  }
}

class InitPacket {
  constructor(routerId) {
    this.routerId = routerId;
  }

  getUDPData() {
    let buffer = Buffer.alloc(4);
    buffer.writeInt32LE(this.routerId, 0);
    return buffer;
  }

  static parseUDPdata(buffer) {
    let routerId = buffer.readInt32LE(0);
    return new InitPacket(routerId);
  }
}

class LinkCost {
  constructor(link, cost) {
    this.link = link;
    this.cost = cost;
  }
}

class CircuitDatabase {
  constructor(nbrOfLinks, linkCosts) {
    this.nbrOfLinks = nbrOfLinks;
    this.linkCosts = linkCosts;
  }

  getUDPData() {
    let buffer = Buffer.alloc(this.linkCosts.length * 8 + 4);

    buffer.writeInt32LE(this.routerId, 0);

    let linkCostIndex = 0;
    let offset = 4;
    while (linkCostIndex < this.linkCosts.length) {
      buffer.writeInt32LE(this.linkCosts[linkCostIndex].link, offset);
      buffer.writeInt32LE(this.linkCosts[linkCostIndex].cost, offset + 4);
      offset += 4;
    }
    return buffer;
  }

  static parseUDPdata(buffer) {
    let nbrOfLinks = buffer.readInt32LE(0);
    let linkCosts = [];
    for (let i = 1; i <= nbrOfLinks; i++) {
      let data = [...buffer.readInt32LE(i * 4 + 4)];
      let linkCost = new LinkCost(data[0], data[1]);
      linkCosts.append(linkCost);
    }
    return new CircuitDatabase(nbrOfLinks, linkCosts);
  }
}

function CircuitDatabase(nbrOfLinks, linkCosts) {
  this.nbrOfLinks = nbrOfLinks;
  this.linkCosts = linkCosts;
}

module.exports = {
  HelloPacket,
  LinkStatePacket,
  InitPacket,
  LinkCost,
  CircuitDatabase
};
