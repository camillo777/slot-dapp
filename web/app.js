const dotenv = require('dotenv');
dotenv.config();

var assert = require('assert');

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();

const { ethers } = require("ethers");
const contractArtifact = require("./artifacts/MyUsers.json");

const jwt = require('jsonwebtoken');



const BlockChainService = require('./BlockChainService.js')
const U = require('./Utils.js')
const DbService = require('./DbService.js')

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());
app.use(cookieParser());

//const http = require('http');
const fs = require('fs').promises;
//const { toEth } = require('./Utils.js');
//const { URL } = require('url');
//const { parse: parseQuery } = require('querystring');



//const hostname = '127.0.0.1';
//const port = 3000;

const files = [];

const Wins = {
  none: 0,
  three_of_a_kind: 1,
  three_seven: 2,
  four_seven: 3,
  four_of_a_kind: 4,
  two_pairs: 5,
  full_house: 6,
  five_of_a_kind: 7,
  five_seven: 8,
}

const blockChainService = new BlockChainService(
  process.env.CONTRACT_ADDRESS, 
  contractArtifact.abi, 
  new ethers.providers.JsonRpcProvider( process.env.NETWORK_URL ),
  process.env.OWNER_PRIVATE_KEY,
  {
    'UserCreditAdded': 
        (userAddress, amount) => { console.log(`---EVT---> UserCreditAdded ${userAddress} ${ U.toEth( amount ) }`) },
    'UserCreditRemoved':
        (userAddress, amount) => { console.log(`---EVT---> UserCreditRemoved ${userAddress} ${ U.toEth( amount ) }`) },
    'JackpotCreditAdded': 
        (amount) => { _state.jackpotAmount += amount },
  }
);

const dbAuthService = new DbService( 'db.json' );

main();

const _state = {
  userAmounts: [],
  jackpotAmount: 0,
  contractAmount: 0
};

// Provide the origin for relative URLs sent to Node.js requests.
//const serverOrigin = 'http://localhost:3000';

async function load() { 
  try {
    var index = await fs.readFile(__dirname + "/index.html", "utf8");

    _state.jackpotAmount = await blockChainService.getJackpotAmount();
    console.log( 'jackpotAmount', _state.jackpotAmount );

    _state.contractAmount = await blockChainService.getTotalAmount();
    console.log( 'contractAmount', _state.contractAmount );

    _state.userAmounts = await blockChainService.getAllUsers();
    console.log( 'userAmounts', _state.userAmounts );

    //var index2 = render2( index, "$$BASEURL$$", process.env.BASE_URL );
    var index2 = render( index, { 
      'BASEURL': process.env.BASE_URL,
      'CHAIN_ID': process.env.CHAIN_ID,
      'CONTRACT_ADDRESS': process.env.CONTRACT_ADDRESS //,
      //'JACKPOT_AMOUNT': U.toEth( jackpotAmount )
    });
    files.index = index2;
    //files.login = await fs.readFile(__dirname + "/login.html");
  }
  catch( e ) {
    console.log( e.message );
  }
}

function makePath( dir ) {
  return process.env.BASE_PATH + '/' + dir;
}

var render = (template, data) => {
	return template.replace(/{{{{(.*?)}}}}/g, (match) => {
		return data[match.split(/{{{{|}}}}/).filter(Boolean)[0]]
	})
}

async function main() {

  console.log( 'Loading data...' );
  await load();
  console.log( 'Done loading data...' );

  console.log( 'Configuring web app...' );

  app.set('views', './views');
  app.set('view engine', 'pug');
  //app.set('view engine', 'ejs');
  //app.set('view engine', 'hbs');

  var staticPath = __dirname + '/assets';
  console.log( 'staticPath', staticPath, makePath( 'assets' ) );
  app.use( makePath( 'assets' ), express.static( staticPath ) );

  //await blockChainService.getContractOwner();

  console.log( makePath( '' ) );

  app.get( makePath( '' ), async (req, res) => {
    console.log('GET /');
    console.log('req.cookies', req.cookies);
    //console.log(process.env.COOKIE_NAME, req.cookies[process.env.COOKIE_NAME] );
    res.end( files.index );
/*
    if ( req.cookies[process.env.COOKIE_NAME] ) {
      const publicAddress = await authenticateToken( req.cookies[process.env.COOKIE_NAME] );
      console.log( 'publicAddress from token', publicAddress);
      res.setHeader('Content-Type', 'text/html');
      res.end( files.index );
    }
    else {
      res.setHeader('Content-Type', 'text/html');
      res.end( files.login );
    }
*/
  });

  app.get( makePath( 'admin' ), async function (req, res) {
    res.render('admin', { 
      title: 'SlotDapp Admin', 
      message: 'Hello there!', 
      contractAmount: U.toEth( await blockChainService.getTotalAmount() ),
      jackpotAmount: U.toEth( await blockChainService.getJackpotAmount() ),
      users: await dbAuthService.getAllUsers(),
      networkURL: process.env.NETWORK_URL
     });
  });

  app.get( makePath( 'getcontractjson' ), async (req, res) => {
    console.log('GET /getcontractjson');
    res.json( ok( contractArtifact ) );
  });
  app.get( makePath( 'getcontractaddress' ), async (req, res) => {
    console.log('GET /getcontractaddress');
    res.json( ok( process.env.CONTRACT_ADDRESS ) );
  });
  
  app.get( makePath( 'user' ), async (req, res) => {
    console.log('GET user');
    //res.send('Hello World!');
    res.setHeader("Content-Type", "application/json");
    // read user from DB TODO
    const user = await dbAuthService.dbGetUser( req.query.publicAddress );

    let loggedIn = false;
    if (user) {
      if ( req.cookies[process.env.COOKIE_NAME] ) {
        const publicAddress = await authenticateToken( req.cookies[process.env.COOKIE_NAME] );
        console.log('publicAddress', publicAddress);
        if (publicAddress == req.query.publicAddress) {
          loggedIn = true;
        }
      }
    }
    
    res.json( ok( user ? { user: user, loggedIn: loggedIn } : {} ) );
  });
  
  app.post( makePath( 'user' ), async (req, res) => {
    console.log('POST user', req.body.publicAddress);
    //res.send('Hello World!');
    res.setHeader("Content-Type", "application/json");
    // write new user with nonce to DB TODO
    const user = await dbAuthService.dbCreateUser( req.body.publicAddress ); //[{ publicAddress: query.publicAddress }];
    console.log( user );
    res.json( ok( user ) );
  });
  
  app.post( makePath( 'auth' ), async (req, res) => {
    console.log('POST auth', req.body.publicAddress);
    console.dir(req.body);
    const user = await verifyUser( req.body.publicAddress, req.body.signature );
    if (!user) {
      res.json( error( 'auth: Authentication failed for '+ req.body.publicAddress ) );
      return;
    }
    console.log( user );
    //the back end generates a JWT and sends it back to the client
    if ( user.publicAddress ) {
      const jwtToken = await generateAccessToken( user.publicAddress );
      console.log( 'jwtToken', jwtToken );
      await dbAuthService.dbUpdateNonce( user.publicAddress );
      //const cookie = `token=${jwtToken}`;
      //console.log( 'cookie', cookie );
      //res.cookie( cookie );
      res.cookie( process.env.COOKIE_NAME, jwtToken, {
        maxAge: 2 * 60 * 60 * 1000, // msecs
        //secure: true,
        httpOnly: true,
        sameSite: 'lax' 
      });
      res.json( ok( { token: jwtToken } ) );
    }
    else {
      res.json( error( 'auth: Signature verification failed' ) );
    }
  });

  app.get( makePath( 'logout' ), (req, res) => {
    console.log('GET /logout');
    //show the saved cookies
    res.clearCookie( process.env.COOKIE_NAME );
    res.json( ok ( { msg: 'Cookie has been deleted successfully' } ) );
  });

  app.get( makePath( 'getuseramount' ), async (req, res) => {
    console.log('GET /getuseramount');
    //console.log('req.cookies', req.cookies);
    //console.log( process.env.COOKIE_NAME, req.cookies[process.env.COOKIE_NAME] );

    if ( req.cookies[process.env.COOKIE_NAME] ) {
      try {
        const publicAddress = await authenticateToken( req.cookies[process.env.COOKIE_NAME] );
        console.log('publicAddress', publicAddress);

        let user = _state.userAmounts.find((user) => user[0] == publicAddress);

        if (user) {
          res.json( ok( { amount: user[1] } ) );
          return;
        }

        let amount = blockChainService.getUserAmount( publicAddress );

        await dbAuthService.dbUpdateUserAmount( publicAddress, U.toEth( amount ) );

        res.json( ok( { amount: amount } ) );
      }
      catch( e ) {
        console.error( e.message );
        res.json( error( e.message ) );
      }
    }
    else {
      res.json( error( 'getuseramount: Need authentication --> Please connect with wallet to login' ) );
    }
  });

  app.get( makePath( 'getamount' ), async (req, res) => {
    console.log('GET /getamount');
    //console.log('req.cookies', req.cookies);
    //console.log( process.env.COOKIE_NAME, req.cookies[process.env.COOKIE_NAME] );

    if ( req.cookies[process.env.COOKIE_NAME] ) {
      console.log('Cookie exists');
      try {
        const publicAddress = await authenticateToken( req.cookies[process.env.COOKIE_NAME] );
        console.log('publicAddress', publicAddress);
        //const provider = new ethers.providers.JsonRpcProvider( process.env.NETWORK_URL );
        //console.log('connection', provider.connection );
        //const contract = new ethers.Contract( process.env.CONTRACT_ADDRESS, contractArtifact.abi, provider );

        /*
        const totalAmount = await blockChainService.getTotalAmount();
        const jackpotAmount = await blockChainService.getJackpotAmount();
        res.json( ok( { totalAmount, jackpotAmount } ) );
        */

        res.json( ok( { totalAmount: _state.contractAmount, jackpotAmount: _state.jackpotAmount } ) );
      }
      catch( e ) {
        console.error( e.message );
        res.json( error( e.message ) );
      }
    }
    else {
      console.log('Cookie does not exist');
      res.json( error( 'getamount: Need authentication --> Please connect with wallet to login' ) );
    }
  });

  app.get( makePath( 'getjackpot' ), async (req, res) => {
    console.log('GET /getjackpot');
    try {
      //const jackpotAmount = await blockChainService.getJackpotAmount();

      let jackpotAmount = _state.jackpotAmount;
      res.json( ok( { jackpotAmount } ) );
    }
    catch( e ) {
      console.error( e.message );
      res.json( error( e.message ) );
    }
  });

  app.get( makePath( 'getnumbers' ), async (req, res) => {
    console.log('GET /getnumbers');
  
    try {

      if ( !req.cookies[process.env.COOKIE_NAME] ) {
        res.json( error( 'getnumbers: Need authentication --> Please connect with wallet to login' ) );
        return;
      }

      const publicAddress = await authenticateToken( req.cookies[process.env.COOKIE_NAME] );
      console.log('publicAddress', publicAddress);

      const playPrice = 1.0;

      // pay for game
      await blockChainService.decreaseAccountFunds( publicAddress, playPrice );

      const n = [ 
        generateNumber(),
        generateNumber(),
        generateNumber(),
        generateNumber(),
        generateNumber()
      ];

      var hand = checkWin( n );
          
      if ( hand != Wins.none ) {
        // win send money to user
        if (hand == Wins.five_seven) {
          // jackpot
          await blockChainService.winJackpot();
        }
        else {
          var money = getMoneyForWin( hand );
          await blockChainService.transferMoney( publicAddress, money );
        }
        res.json( ok( { numbers: n, win: true, hand: hand, money: money } ) );
      }
      else {
        // half goes to jackpot
        await blockChainService.addJackpot( playPrice / 2 );
        res.json( ok( { numbers: n, win: false } ) );
      }

      console.log( 'numbers', n );

    }
    catch( e ) {
      res.json( error( e.message ) );
    }
  });

  console.log( 'Done configuring web app' );
  
  console.log( 'Starting web server...' );
  app.listen( process.env.PORT, () => {
    console.log(`Web app listening at http://localhost:${process.env.PORT}`)
  });
}

function ok( result ) {
  return { error: false, data: result };
}
function error( message ) {
  return { error: true, msg: message };
}

/*
none: 0,
three_of_a_kind: 1,
three_seven: 2,
four_seven: 3,
four_of_a_kind: 4,
two_pairs: 5,
full_house: 6,
five_of_a_kind: 7,
five_seven: 8,
*/
function checkEqualNumbers( n ) {
  console.log( 'checkEqualNumbers', n );
  let list = [0,0,0,0,0,0,0];
  for(let i=0; i<n.length; i++) {
    let result = n[i];
    list[n[i]]++; 
  }
  console.log( 'list', list );
  return list;
}
function findTimesOf( number, list ) {
  console.log( 'findTimesOf', number );
  var numberOfList = [];
  for(let i=0; i<list.length; i++) {
    if (list[i] == number) numberOfList.push( i );
  }
  return numberOfList.length;
}
function checkWin( n ) {
  console.log( 'checkWin', n );
  let l = checkEqualNumbers( n );
  if (l[1]==5) 
    return Wins.five_seven;
  if (l[0]==5 || l[1]==5 || l[2]==5 || l[3]==5 || l[4]==5 || l[5]==5 || l[6]==5 || l[7]==5)
    return Wins.five_of_a_kind;
  if (l[1]==4) 
    return Wins.four_seven;
  if (l[0]==4 || l[1]==4 || l[2]==4 || l[3]==4 || l[4]==4 || l[5]==4 || l[6]==4 || l[7]==4)
    return Wins.four_of_a_kind;
  if ( findTimesOf(2,l)>0 && findTimesOf(3,l)>0 )
    return Wins.full_house;
  if (l[1]==4) 
    return Wins.three_seven;
  if (l[0]==3 || l[1]==3 || l[2]==3 || l[3]==3 || l[4]==3 || l[5]==3 || l[6]==3 || l[7]==3)
    return Wins.three_of_a_kind;
  if ( findTimesOf(2,l)==2 )
    return Wins.two_pairs;
  return Wins.none;
}
function getMoneyForWin( win ) {
  console.log( 'getMoneyForWin', win );
  if (win == Wins.five_of_a_kind) return (7*7*7*7)/7; //1/(7*7*7*7);
  if (win == Wins.four_seven) return (7*7*7*7)/7; //1/(7*7*7*7);
  if (win == Wins.four_of_a_kind) return (7*7*7)/7; //1/(7*7*7);
  if (win == Wins.three_seven) return (7*7*7)/7; //1/(7*7*7);
  if (win == Wins.three_of_a_kind) return (7*7)/7; //1/(7*7);
  if (win == Wins.two_pairs) return 7/7; //1/7;
  //if (win != Wins.none) return 1;
  return 0;
}
function generateNumber() {
  return Math.floor(Math.random() * 6) + 1; // 1 - 7
}

async function verifyUser( publicAddress, signature ) {
  console.log( 'verifyUser', publicAddress, signature );

  //User.findOne({ where: { publicAddress } })
  // get user and nonce from DB with address
  const user = await dbAuthService.dbGetUser( publicAddress );
  assert( user.nonce );
  const message = `I am signing my one-time nonce: ${user.nonce}`;

  //let recovered = await ethers.utils.verifyMessage(messageHashBytes, flatSig);
  let recovered = ethers.utils.verifyMessage( message, signature );
  console.log( 'recovered', recovered );
  console.log( 'publicAddress', publicAddress );
  console.log( recovered === publicAddress );
  return recovered === publicAddress ? user : null;
// true
/*
  // We now are in possession of msg, publicAddress and signature. We
  // can perform an elliptic curve signature verification with ecrecover
  const msgBuffer = ethUtil.toBuffer(msg);
  const msgHash = ethUtil.hashPersonalMessage(msgBuffer);
  const signatureBuffer = ethUtil.toBuffer(signature);
  const signatureParams = ethUtil.fromRpcSig(signatureBuffer);
  const publicKey = ethUtil.ecrecover(
    msgHash,
    signatureParams.v,
    signatureParams.r,
    signatureParams.s
  );
  const addressBuffer = ethUtil.publicToAddress(publicKey);
  const address = ethUtil.bufferToHex(addressBuffer);

  // The signature verification is successful if the address found with
  // ecrecover matches the initial publicAddress
  if (address.toLowerCase() === publicAddress.toLowerCase()) {
    return user;
  } else {
    return null;
  };
*/
}

async function generateAccessToken( publicAddress ) {
  console.log( 'generateAccessToken', publicAddress );
  //return jwt.sign( nonce, process.env.TOKEN_SECRET, { expiresIn: '2days' } );
  /*
  return jwt.sign({
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
    data: { nonce: nonce, publicAddress: 
  }, process.env.TOKEN_SECRET );
  */

  return await jwt.sign(
    {
      payload: {
        //id: user.id,
        publicAddress
      }
    },
    process.env.TOKEN_SECRET,
    { expiresIn: '2 days' }
  );
}

async function authenticateToken( token ) {
  console.log( 'authenticateToken', token );
  const result = jwt.verify( token, process.env.TOKEN_SECRET );
  console.log( 'result', result );
  return result.payload.publicAddress;
}



/*
const server = http.createServer((req, res) => {
  console.log( req.url );
  // Parse the request URL. Relative URLs require an origin explicitly.
  const url = new URL(req.url, serverOrigin);
  console.log( url );
  // Parse the URL query. The leading '?' has to be removed before this.
  const query = parseQuery(url.search.substr(1));
  console.log( query );

    switch ( url.pathname ) {
      case '/':
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');
        res.end(indexFile);
        break;
      case '/getuser':
        // get user from db for address
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          const users = []; //[{ publicAddress: query.publicAddress }];
          res.end( JSON.stringify( users ) );
          break
      case '/setuser':
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        const users2 = [{ publicAddress: query.publicAddress }];
        res.end( JSON.stringify( users2 ) );
        break
      case '/slot':
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Slot');
        break
      default:
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Hello World');
    }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

const User = {
  nonce: Math.floor(Math.random() * 1000000), // Initialize with a random nonce
  publicAddress: '',
  username: '',
};

*/