'use strict';

import { ethers } from "./ethers-5.1.esm.min.js";
//import "./socket.io.min.js";
//import { Manager } from "../../node_modules/socket.io/client-dist/socket.io.js";

//import { ethers } from '../../npm/ethers/dist/ethers.esm.js';
//import { ethers } from "https://cdn.ethers.io/lib/ethers-5.2.esm.min.js";
//import { ethers } from '../../npm/ethers/dist/ethers.esm.js';

import Config from './config.js';
import msg from "./msg.js";
import $bus from './event.js';
//import { Rooms } from "./rooms.js";
import GameSlot from './game_slot.js';
//import U from "./utils.js";
//import Vue from '../../npm/vue/dist/vue.esm.browser.js';

function toGwei( balance ) { return ethers.utils.formatUnits( balance, "gwei" ) };
function toEth( balance ) { return ethers.utils.formatUnits( balance, "ether" ) };
function ether( n ) { return ethers.utils.parseEther( string( n ) ); }
function string( s ) { return ''+s; }

var socket;

const App = {
  data() {
    return {
      logged: false,
      connected: false,
      error: false,
      errorMessage: '',
      user: null,
      emptyRooms: [],
      waitingRooms: [],
      myRooms: []
    }
  },
  computed: {
    amountEth() { return this.user ? toEth( this.user.amount ) : 0 }
  },
  mounted() {
    // called on deposit
    $bus.$on('userAmount', (data)=>{
      console.log('--------------> RESULT'+data.amount);
      if (!ethers.BigNumber.isBigNumber( data.amount )) {
        console.log( 'Received data is NOT a BigNumber!!' )
      }
      this.user.amount = ethers.BigNumber.from( data.amount );
    }),
    $bus.$on('error', (data)=>{
      console.log('--------------> ERROR'+data);
      this.setError( data );
    })
  },
  methods: {
    setError( message ) {
      this.error = true;
      this.errorMessage = message;
    },
    async login() {
      console.log('login');
      try {
        this.error = false;
        let userAddress = await getUserPublicAddress()
        this.user = await getUserByAddress( userAddress );
        //if (!user) {
        //  this.user = await createUser( userAddress );
        //}
        await loginUser( this.user );
        this.logged = true;
        console.log('Loggedin');
        //wsConnect();
        //console.log('Connected');
        //this.connected = true;
        //this.getEmptyRooms();
      }
      catch(e) {
        this.setError( e )
      }
    },
    async deposit() {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(Config.CONTRACT_ADDRESS, contractABI, signer);

        // check if contarct exists!!!
        if (await contract.provider.getCode(contract.address) === "0x") {
          this.setError('App contract does not exists');
          return;
        }

        const contractOwner = await contract.getOwner();

        if (contractOwner == ethers.constants.AddressZero ) {
          this.setError(`Contract owner cannot be zero!!!`);
          return;
        }
        if (contractOwner != ethers.utils.getAddress( Config.OWNER_ADDRESS ) ) {
          this.setError(`Wrong contract onwer detected!!!!: ${contractOwner} instead of ${Config.OWNER_ADDRESS}`);
          return;
        }

        await contract.userDeposit({ value: ether(1) });
      }
      catch(e) {
        this.setError( e );
      }
    },
    async getEmptyRooms() {
      console.log('getEmptyRooms');
      socket.emit(msg.Type.GetEmptyRooms, (data) => {
        console.log('getEmptyRooms data', data);
        this.emptyRooms = data.emptyRooms;
        this.waitingRooms = data.waitingRooms;
        this.myRooms = data.myRooms;
      });
    },
    async joinRoom( room ) {
      console.log('joinRoom', room.id);
      socket.emit(msg.Type.JoinRoom, {roomID: room.id}, (result) => {
        console.log('joinRoom data', result);
        if (result.error) {
          this.setError( result.msg );
          return;
        }
        //this.changeRoom( result.roomID );
      });
    },
    async openRoom( roomID ) {
      console.log('openRoom', roomID);
      this.currentRoom = roomID;
      var gameSlot = new GameSlot( document.getElementById( 'game-div' ), socket, $bus, roomID );

      /*
      socket.emit(msg.Type.JoinRoom, {roomID: roomID}, (result) => {
        console.log('joinRoom data', result);
        if (result.error) {
          this.setError( result.msg );
          return;
        }
        //this.changeRoom( result.roomID );
        //let room = await rooms.getRoom( roomID );
        let gameID = 'slot'; //room.gameID;
        if (gameID == 'slot') {
          // load slot
          var gameSlot = new GameSlot( document.getElementById( 'game-div' ), socket, $bus, roomID );
  /*
          let gameDiv = document.getElementById( 'game-div' );
          let myScript = document.createElement("script");
          myScript.setAttribute("type", "module");
          myScript.setAttribute("src", "./scripts/game_slot.js");
          if (gameDiv.children.length == 0) gameDiv.appendChild( myScript );
          else gameDiv.replaceChild( gameDiv.children[0], myScript  ); 
  *
        }
        else
        {
          // load poker
          /*
          let gameDiv = document.getElementById( 'game-div' );
          let myScript = document.createElement("script");
          myScript.setAttribute("src", "./game_poker.js");
          gameDiv.replaceChild( myScript ); 
          *
        }
      });
      */
    }
  }
}

var app = Vue.createApp(App);
var vm = app.mount('#app');
//app.config.globalProperties.$bus = $bus;

  //let ws;
  

  let result = await apiGET(`${Config.BASE_URL}/contract`);
  if (result.error) throw '' + result.message;
  let contractABI = result.abi;


  function handleResponse(response) {
    return response.ok
      ? response.json().then((data) => JSON.stringify(data, null, 2))
      : Promise.reject(new Error('Unexpected response'));
  }
  /*  
      login.onclick = function () {
          getUserPublicAddress()
          .then((address)=>
          fetch('/login', { 
              method: 'POST', 
              credentials: 'same-origin',
              body: JSON.stringify( { publicAddress: address } ),
              headers: {
                  'Content-Type': 'application/json'
              }
          })
          .then(handleResponse)
          .then(showMessage)
          .catch(function (err) {
          showMessage(err.message);
          }));
      };
  */

/*
      loginButton.onclick = function () {
    getUserPublicAddress()
      .then(getUser)
      .then(loginUser)
      .then(wsConnect)
      .then(console.log('Loggedin'))
      //.then(handleResponse)
      //.then(showMessage)
      .catch(function (err) {
        showMessage(err.message);
      });
  };
*/
/*
  $('#buttonJoinRoom').on('click',async ()=>{
    try {
      socket.emit(msg.Type.GetAvailableRooms, (response) => {
        console.log(response); // ok

        txtPlayResult.innerText = U.toEth( response.result.money );
        txtJackpotAmount.innerText = U.toEth( response.jackpotAmount );
        txtUserAmount.innerText = U.toEth( response.userAmount );
      });
    }
    catch(e){
      console.log(e);
      $('#elError').html(e);
    }
  })
*/
/*
  logoutButton.onclick = function () {
    fetch('/logout', { method: 'DELETE', credentials: 'same-origin' })
      .then(handleResponse)
      .then(showMessage)
      .catch(function (err) {
        showMessage(err.message);
      });
  };
*/
/*
  wsConnectButton.onclick = function () {
    wsConnect();
  };

  wsSendButton.onclick = function () {
    if (!ws) {
      showMessage('No WebSocket connection');
      return;
    }

    ws.send({ type: 'userAmount', value: 'Hello' });
    showMessage('Sent "Hello World!"');
  };
*/

/*
  function wsConnect() {
    console.log( 'wsConnect' );

    if (socket) {
      socket.close();
    }
/*
    const manager = new Manager("ws://example.com", {
      reconnectionDelayMax: 10000,
      query: {
        "my-key": "my-value"
      }
    });

    const socket = manager.socket("/my-namespace", {
      auth: {
        token: "123"
      }
    });
*

    //console.log( SocketIO );

    //const wsURL = `ws://${location.host}/${Config.BASE_PATH}`;
    //console.log( 'wsURL', wsURL );
    //const manager = Manager( wsURL );
    //socket = manager.socket();

    socket = io( { path: Config.BASE_PATH + '/socket.io' } );
    console.log( socket );
    /*  
          if (ws) {
            ws.onerror = ws.onopen = ws.onclose = null;
            ws.close();
          }
    
          ws = new WebSocket(`ws://${location.host}`);
          ws.onerror = function () {
            showMessage('WebSocket error');
          };
          ws.onopen = function () {
            showMessage('WebSocket connection established');
          };
          ws.onclose = function () {
            showMessage('WebSocket connection closed');
            ws = null;
          };
    *

    // client-side
    socket.on("connect", () => {
      console.log('connect', socket.id); // x8WIv7-mJelg7on_ALbx
    });

    // client-side
    socket.on(msg.Type.Jackpot, (arg1) => {
      console.log(arg1); // 1
      //console.log(arg2); // "2"
      //console.log(arg3); // { 3: '4', 5: ArrayBuffer (1) [ 6 ] }
      console.log('jackpot result', arg1);
      $bus.$emit('result', arg1);
      //txtJackpotAmount.innerText = toEth( arg1 );
    });

    socket.on(msg.Type.UserAmount, (arg1) => {
      console.log(arg1); // 1
      //console.log(arg2); // "2"
      //console.log(arg3); // { 3: '4', 5: ArrayBuffer (1) [ 6 ] }
      console.log('UserAmount result', arg1);
      $bus.$emit('userAmount', arg1 );
      //txtUserAmount.innerText = toEth( arg1 );
    });

    socket.on(msg.Type.Welcome, (arg1) => {
      console.log(arg1); // 1
      //console.log(arg2); // "2"
      //console.log(arg3); // { 3: '4', 5: ArrayBuffer (1) [ 6 ] }
      console.log('Welcome result', arg1);
    });
/*
    //   socket.onmessage = function (message) {
    socket.on("data", () => {

      console.log('onmessage', JSON.parse(data));

      let receivedMsg = new msg(data);

      switch (receivedMsg.type) {
        case msg.Type.Play:
          console.log('play result', receivedMsg.data);
          txtPlayResult.innerText = receivedMsg.data.win + ' ' + receivedMsg.data.hand;
          break;
        case msg.Type.Jackpot:
          console.log('jackpot result', receivedMsg.data);
          txtJackpotAmount.innerText = U.toEth(receivedMsg.data.amount);
          break;
        case msg.Type.UserAmount:
          console.log('UserAmount result', receivedMsg.data);
          txtUserAmount.innerText = U.toEth(receivedMsg.data.amount);
          break;
      }

      //
      // Here we can now use session parameters.
      //
      showMessage(`Received message ${message.data}`);
      console.log(message);

      //ws.send( `Ciao ${userId}` );
    });
*
  }

*/

/*
  async function deposit() {
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(Config.CONTRACT_ADDRESS, contractABI, signer);
    await contract.userDeposit({ value: ethers.utils.parseUnits('1', "ether") });
  }
  */
/*
  async function play() {
    /*if(ws) {
      ws.send( msg.create( msg.Type.Play, {} ) );
    }*

    if (socket) {
      //socket.send(msg.create(msg.Type.Play, {}));

      // client-side
      //socket.emit(msg.Type.Play, "1", { name: "updated" }, (response) => {
      socket.emit(msg.Type.Play, (response) => {
        console.log(response); // ok

        $bus.$emit('result', response);

        //txtPlayResult.innerText = toEth( response.result.money );
        //txtJackpotAmount.innerText = toEth( response.jackpotAmount );
        //txtUserAmount.innerText = toEth( response.userAmount );
      });
    }
  }
*/
  async function getUserPublicAddress() {
    console.log('getUserPublicAddress');
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    console.log('network', provider.connection);

    var network = await provider.getNetwork();
    console.log( 'provider.getNetwork()', network );

    if ( network.chainId != Config.CHAIN_ID ) {
        throw `Wrong chainID ${ network.chainId } selected in your Wallet ---> expected: ${ Config.CHAIN_ID }`;
    }

    // Prompt user for account connections
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const publicAddress = await signer.getAddress();
    console.log("publicAddress:", publicAddress);
    return publicAddress;
  };

  async function getUserByAddress( publicAddress ) {
    console.log('getUserByAddress', publicAddress);
    let url = Config.BASE_URL + '/user?publicAddress=' + publicAddress;
    let result = await apiGET(url); // result.data;
    console.log('result', result);
    //return result.user;

    return result.user
  };
/*
  async function createUser( publicAddress ) {
    console.log('createUser', publicAddress);
    let url = Config.BASE_URL + '/user';
    let result = await apiPOST(url, { publicAddress: publicAddress });
    console.log('result', result);
    return result.user;
  };
*/
  async function loginUser( user ) {
    console.log('loginUser', user);

      let url = `${Config.BASE_URL}/logged?publicAddress=${user.id}`;
      console.log(url);
      let result = await apiGET(url);
      if (result.logged) {
        console.log('Already logged in');
        return;
      }

      // login
      console.log('Signature');
      const signature = await getSignature(`I am signing my one-time nonce: ${user.nonce}`);
      url = Config.BASE_URL + '/login';
      result = await apiPOST(url, { publicAddress: user.address, signature: signature });
  };

  async function getSignature(message) {
    console.log('getSignature', message);
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    const signer = provider.getSigner();
    const signature = await signer.signMessage(message);
    return signature;
  }

  async function apiGET(url) {
    console.log('apiGET', url);
    console.time('apiGET');
    const response = await fetch(url);
    const result = await response.json();
    console.timeEnd('apiGET');
    //console.log( result );
    if (result.error) throw result.msg;
    return result.data;
  };

  async function apiPOST(url, data) {
    console.log('apiPOST', url);
    console.time('apiPOST');
    const response = await fetch(url, {
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST'
    });
    const result = await response.json();
    console.timeEnd('apiPOST');
    if (result.error) throw result.msg;
    return result.data;
  };
//})();