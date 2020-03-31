const {
  HelloPacket,
  LinkStatePacket,
  InitPacket,
  LinkCost,
  CircuitDatabase
} = require("./packet");
const Network = require("./network");
const client = require("dgram").createSocket("udp4");
const createLogger = require("./logger");

//retrieve cli params
const _routerId = parseInt(process.argv[2]);
const _nseHost = process.argv[3];
const _nsePort = process.argv[4];
const _rtrPort = process.argv[5];

//throw error if cli null or empty
if (!_routerId || !_nseHost || !_nsePort || !_rtrPort) {
  throw "Missing a required CLI param";
}

//logger constants
const logFileName = `router${_routerId}.log`;
const logger = createLogger(logFileName);

const HELLO_PSIZE = 8;
const LS_PSIZE = 20;

const _graph = new Network(_routerId);
let _circuitDatabase = null;
let neighbourList = [];

//parse packets from nse
const rcvPacketFromNSE = buffer => {
  //create packet from buffer
  let length = Buffer.byteLength(buffer);

  switch (length) {
    case HELLO_PSIZE:
      let helloPacket = HelloPacket.parseUDPdata(buffer);
      logger.info(
        `R${_routerId} receives a HELLO: router_id ${helloPacket.routerId} link ${helloPacket.linkId}`
      );
      processHelloPacket(helloPacket);
      break;
    case LS_PSIZE:
      let linkStatePacket = LinkStatePacket.parseUDPdata(buffer);
      logger.info(
        `R${_routerId} receives a LS PDU: sender ${linkStatePacket.sender}, router_id ${linkStatePacket.routerId}, link_id ${linkStatePacket.linkId}, cost ${linkStatePacket.cost}, via ${linkStatePacket.via}`
      );
      processLinkStatePacket(linkStatePacket);
      break;
    default:
      _circuitDatabase = CircuitDatabase.parseUDPdata(buffer);
      logger.info(
        `R${_routerId} receives an CIRCUIT_DB: nbr_link ${_circuitDatabase.nbrOfLinks}`
      );
      sndHelloPackets();
      break;
  }
};

//send packets to nse
const sndPacketToNSE = packet => {
  let buffer = packet.getUDPData();

  //send buffer
  client.send(buffer, _nsePort, _nseHost, err => {
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
      `R${_routerId} send HELLO: router_id ${_routerId} link_id ${link.linkId}`
    );
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
    logger.info(
      `R${_routerId} sends a LS PDU: sender ${_routerId}, router_id ${_routerId}, link_id ${link.linkId}, cost ${link.cost}, via ${helloPacket.linkId}`
    );
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
      logger.info(
        `R${_routerId} receives a LS PDU: sender ${linkStatePacket.sender}, router_id ${linkStatePacket.routerId}, link_id ${linkStatePacket.linkId}, cost ${linkStatePacket.cost}, via ${linkStatePacket.via}`
      );
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
    _graph.printNodeView(logger);
    _graph.printRIB(logger);
  }
};

//init router
logger.info(`R${_routerId} send INIT: router_id ${_routerId}`);
sndPacketToNSE(new InitPacket(_routerId));
