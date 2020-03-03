const {
  HelloPacket,
  LinkStatePacket,
  InitPacket,
  LinkCost,
  CircuitDatabase
} = require("./packet");
const client = require("dgram").createSocket("udp4");
const machina = require("machina");
const createLogger = require("./logger");

//retrieve cli params
const _emuAddress = process.argv[2];
const _emuPort = process.argv[3];
const _sndPort = process.argv[4];
const _fileName = process.argv[5];

//throw error if cli null or empty
if (!_emuAddress || !_emuPort || !_sndPort || !_fileName) {
  throw "Missing a required CLI param";
}

//parse packets from emu
const rcvPacketFromNSE = buffer => {
  //create packet from buffer
  console.log(buffer.toString());
};

//set event handler for messages from emulator
client.on("message", rcvPacketFromNse);

//start listening on specified port
client.bind(_sndPort);

//send packets to nse
const sndPacketToNSE = packet => {
  let buffer = packet.getUDPData();

  //send buffer and log sequence number
  client.send(buffer, _emuPort, _emuAddress, err => {
    err ? client.close() : console.log("GOOD");
  });
};

//gbn state machine
const routerFSM = new machina.Fsm({
  namespace: "a2-gbn",
  //GBN constants
  initialState: "INIT",
  states: {
    //in this state - get packets ready for transmission i.e chunking
    INIT: {
      SEND_INIT: function() {
        console.log("IN --> SEND_PACKETS");
      }
    }
  },
  //external interface into state machine
  _initFSM: function() {
    this.handle("SEND_INIT_PACKET");
  }
});

//transition to initial state on FSM
routerFSM._initFSM();
