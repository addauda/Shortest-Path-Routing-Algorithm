const {
  HelloPacket,
  LinkStatePacket,
  InitPacket,
  LinkCost,
  CircuitDatabase,
} = require("./packet");

const Network = require("./network");
const client = require("dgram").createSocket("udp4");
const createLogger = require("./logger");

//retrieve cli params
const _self = parseInt(process.argv[2]);
const _nseHost = process.argv[3];
const _nsePort = process.argv[4];
const _rtrPort = process.argv[5];

//throw error if cli null or empty
if (!_self || !_nseHost || !_nsePort || !_rtrPort) {
  throw "Missing a required CLI param";
}

//logger constants
const logFileName = `router${_self}.log`;
const logger = createLogger(logFileName);

const HELLO_PSIZE = 8;
const LS_PSIZE = 20;

const _network = new Network(_self);
let _circuitDatabase = null;
let neighbourLinks = [];

//parse packets from nse
const rcvPacketFromNSE = (buffer) => {
  //create packet from buffer
  let length = Buffer.byteLength(buffer);

  switch (length) {
    case HELLO_PSIZE:
      let helloPacket = HelloPacket.parseUDPdata(buffer);
      logger.info(
        `R${_self} receives a HELLO: router_id ${helloPacket.routerId} link ${helloPacket.linkId}`
      );
      processHelloPacket(helloPacket);
      break;
    case LS_PSIZE:
      let linkStatePacket = LinkStatePacket.parseUDPdata(buffer);
      logger.info(
        `R${_self} receives a LS PDU: sender ${linkStatePacket.sender}, router_id ${linkStatePacket.routerId}, link_id ${linkStatePacket.linkId}, cost ${linkStatePacket.cost}, via ${linkStatePacket.via}`
      );
      processLinkStatePacket(linkStatePacket);
      break;
    default:
      _circuitDatabase = CircuitDatabase.parseUDPdata(buffer);
      logger.info(
        `R${_self} receives a CIRCUIT_DB: nbr_link ${_circuitDatabase.nbrOfLinks}`
      );
      processCircuitDatabase();
      break;
  }
};

//send packets to nse
const sndPacketToNSE = (packet) => {
  let buffer = packet.getUDPData();

  //send buffer
  client.send(buffer, _nsePort, _nseHost, (err) => {
    if (err) {
      client.close();
    }
  });
};

//set event handler for messages from emulator
client.on("message", rcvPacketFromNSE);

//start listening on specified port
client.bind(_rtrPort);

const sndHelloPackets = () => {
  for (let link of _circuitDatabase.linkCosts) {
    logger.info(
      `R${_self} send HELLO: router_id ${_self} link_id ${link.linkId}`
    );
    sndPacketToNSE(new HelloPacket(_self, link.linkId));
  }
};

const processCircuitDatabase = () => {
  //update link state database with information from circuit db
  for (let link of _circuitDatabase.linkCosts) {
    _network.update(_self, link.linkId, link.cost);
  }
  sndHelloPackets();
};

const processHelloPacket = (helloPacket) => {
  //add to router, link to active neighbours
  neighbourLinks.push(helloPacket.linkId);

  //update topology with hello information
  _network.update(
    _self,
    helloPacket.linkId,
    _circuitDatabase.findLink(helloPacket.linkId)
  );

  //send link state database as series of LSPDU's to neighbour who just sent hello
  for (let linkId in _network.linkStateDatabase) {
    for (let routerId of _network.linkStateDatabase[linkId].routers) {
      sndPacketToNSE(
        new LinkStatePacket(
          _self,
          routerId,
          linkId,
          _network.linkStateDatabase[linkId].cost,
          helloPacket.linkId
        )
      );
    }
  }
};

const forwardLinkStatePacket = (linkStatePacket) => {
  //get link LSPDU was received from
  rcvdVia = linkStatePacket.via;

  //set new sender as self
  linkStatePacket.sender = _self;

  //send to every neighbour except where it was received
  for (activeNeighbour of neighbourLinks) {
    if (activeNeighbour != rcvdVia) {
      linkStatePacket.via = activeNeighbour;
      logger.info(
        `R${_self} receives a LS PDU: sender ${linkStatePacket.sender}, router_id ${linkStatePacket.routerId}, link_id ${linkStatePacket.linkId}, cost ${linkStatePacket.cost}, via ${linkStatePacket.via}`
      );
      sndPacketToNSE(linkStatePacket);
    }
  }
};

const processLinkStatePacket = (linkStatePacket) => {
  //check if there is new information
  let isUniqueLSPDU = _network.checkUniqueLSPDU(
    linkStatePacket.routerId,
    linkStatePacket.linkId,
    linkStatePacket.cost
  );

  if (isUniqueLSPDU) {
    //create/update network with information from LSPDU
    _network.update(
      linkStatePacket.routerId,
      linkStatePacket.linkId,
      linkStatePacket.cost
    );

    //run djikstras algorithm
    _network.computeShortestPath();

    //print internal network structures
    _network.printTopology(logger);
    _network.printRIB(logger);

    forwardLinkStatePacket(linkStatePacket);
  }
};

//init router
logger.info(`R${_self} send INIT: router_id ${_self}`);
sndPacketToNSE(new InitPacket(_self));
