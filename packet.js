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

  toString() {
    return `Hello from ${this.routerId} for ${this.linkId}`;
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
  constructor(linkId, cost) {
    this.linkId = linkId;
    this.cost = cost;
  }
}

class CircuitDatabase {
  constructor(nbrOfLinks, linkCosts) {
    this.nbrOfLinks = nbrOfLinks;
    this.linkCosts = linkCosts;
  }

  findLink(linkId) {
    for (let link of this.linkCosts) {
      if (link.linkId == linkId) {
        return link.cost;
      }
    }

    return false;
  }

  getUDPData() {
    let buffer = Buffer.alloc(this.linkCosts.length * 8 + 4);

    buffer.writeInt32LE(this.routerId, 0);

    let linkCostIndex = 0;
    let offset = 4;
    while (linkCostIndex < this.linkCosts.length) {
      buffer.writeInt32LE(this.linkCosts[linkCostIndex].linkId, offset);
      buffer.writeInt32LE(this.linkCosts[linkCostIndex].cost, offset + 4);
      offset += 8;
    }
    return buffer;
  }

  static parseUDPdata(buffer) {
    let nbrOfLinks = buffer.readInt32LE(0);
    let offset = 4;
    let endByte = 8 * nbrOfLinks;
    let linkCosts = [];
    while (offset <= endByte) {
      let linkCost = new LinkCost(
        buffer.readInt32LE(offset),
        buffer.readInt32LE(offset + 4)
      );
      linkCosts.push(linkCost);
      offset += 8;
    }
    return new CircuitDatabase(nbrOfLinks, linkCosts);
  }

  toString() {
    return `${this.nbrOfLinks}\n${this.linkCosts
      .map((link) => {
        return `${link.linkId} - ${link.cost}\n`;
      })
      .join("")}`;
  }
}

module.exports = {
  HelloPacket,
  LinkStatePacket,
  InitPacket,
  LinkCost,
  CircuitDatabase,
};
