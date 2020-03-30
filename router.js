const {
  HelloPacket,
  LinkStatePacket,
  InitPacket,
  LinkCost,
  CircuitDatabase
} = require("./packet");
const NetworkGraph = require("./network_graph");
const client = require("dgram").createSocket("udp4");
// const createLogger = require("./logger");

//retrieve cli params
const _routerId = parseInt(process.argv[2]);
const _nseHost = process.argv[3];
const _nsePort = process.argv[4];
const _rtrPort = process.argv[5];

//throw error if cli null or empty
if (!_routerId || !_nseHost || !_nsePort || !_rtrPort) {
  throw "Missing a required CLI param";
}

const HELLO_PSIZE = 8;
const LS_PSIZE = 20;

const _graph = new NetworkGraph();
let _circuitDatabase = null;
let neighbourList = [];

//parse packets from nse
const rcvPacketFromNSE = buffer => {
  //create packet from buffer
  let length = Buffer.byteLength(buffer);

  switch (length) {
    case HELLO_PSIZE:
      processHelloPacket(HelloPacket.parseUDPdata(buffer));
      break;
    case LS_PSIZE:
      processLinkStatePacket(LinkStatePacket.parseUDPdata(buffer));
      break;
    default:
      _circuitDatabase = CircuitDatabase.parseUDPdata(buffer);
      sndHelloPackets();
      break;
  }
};

//send packets to nse
const sndPacketToNSE = packet => {
  let buffer = packet.getUDPData();

  //send buffer and log sequence number
  client.send(buffer, _nsePort, _nseHost, err => {
    err ? client.close() : console.log("GOOD");
  });
};

//set event handler for messages from emulator
client.on("message", rcvPacketFromNSE);

//start listening on specified port
client.bind(_rtrPort);

const sndHelloPackets = () => {
  for (let link of _circuitDatabase.linkCosts) {
    sndPacketToNSE(new HelloPacket(_routerId, link.linkId));
  }
};

const processHelloPacket = helloPacket => {
  //add to router, link to active neighbours
  neighbourList.push(helloPacket.linkId);

  //update topology with hello information
  _graph.update(
    _routerId,
    helloPacket.linkId,
    _circuitDatabase.findLink(helloPacket.linkId)
  );

  //send circuit database as series of LSPDU's to neighbour who just sent hello
  for (let link of _circuitDatabase.linkCosts) {
    sndPacketToNSE(
      new LinkStatePacket(
        _routerId,
        _routerId,
        link.linkId,
        link.cost,
        helloPacket.linkId
      )
    );
  }
};

const forwardLinkStatePacket = linkStatePacket => {
  //get link LSPDU was received from
  rcvdVia = linkStatePacket.via;

  //set new sender as self
  linkStatePacket.sender = _routerId;

  //send to every neighbour except where it was received
  for (activeNeighbour of neighbourList) {
    if (activeNeighbour != rcvdVia) {
      linkStatePacket.via = activeNeighbour;
      sndPacketToNSE(linkStatePacket);
    }
  }
};

const processLinkStatePacket = linkStatePacket => {
  let isUniqueLSPDU = _graph.checkUniqueLSPDU(
    linkStatePacket.routerId,
    linkStatePacket.linkId,
    linkStatePacket.cost
  );

  if (isUniqueLSPDU) {
    //create/update graph with information from LSPDU
    _graph.update(
      linkStatePacket.routerId,
      linkStatePacket.linkId,
      linkStatePacket.cost
    );

    forwardLinkStatePacket(linkStatePacket);
    //To-do: djikstra algorithm
    //To-do: generating RIB
  }

  console.log(_graph.printLinkView());
  console.log("-------------------");
  console.log(_graph.printNodeView());
  console.log("\n");
};

//init router
sndPacketToNSE(new InitPacket(_routerId));
