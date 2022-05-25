'use strict';

import dotenv from 'dotenv'
dotenv.config();

import assert from 'assert';

import session from 'express-session';
import express from 'express';
import http from 'http';
//import uuid from 'uuid';

import fs from 'fs';
import Config from './src/config.js';

import { ethers } from 'ethers';
import utils from './src/utils.js';
import ethutils from './src/ethutils.js';
import BlockChainService from './src/BlockChainService.js';
//import DbService from './public/scripts/DbService.js';
//import EvtService from './public/scripts/EvtService.js';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

var players = {};

import { Rooms } from './src/rooms.js';
var rooms

//import { Users } from './src/users.js';
//var users;

import KnexDB from './src/users.knex.js';
var users;

//import * as artifact from '../contracts/artifacts/contracts/MyUsers.sol/MyUsers.json';

//const WebSocket = require('../..');
//import WebSocket, { WebSocketServer } from 'ws';
//import { WebSocket, WebSocketServer } from 'ws';
import { Server } from "socket.io";
import msg from './src/msg.js';
import play from './src/play.js';
//import { inherits } from 'util';

//import { Client } from 'pg'
//import pkg from 'pg';
//const { Client } = pkg;


//const dbService = new DbService();

const app = express();
//const map = new Map();

var contractArtifact = JSON.parse( fs.readFileSync('../contracts/artifacts/contracts/MyUsers.sol/MyUsers.json') );
//var artifact = JSON.parse( fs.readFileSync('./contract/MyUsers.json') );

//import contractArtifact from './contract/MyUsers.json';

var blockChainService;
//var evtService;
var io;



main();

async function main() {
    /*
    try {
        
        //const client = new Client()
        const client = new Client({
            user: 'coinslot',
            host: 'localhost',
            database: 'coinslot',
            password: 'coinslot',
            port: 3211,
          })
        await client.connect()
        const res = await client.query('SELECT $1::text as message', ['Hello world!'])
        console.log(res.rows[0].message) // Hello world!
        await client.end()
        }
        catch(e) {
            console.log(e);
        }
        */

        try {

            if ( !Config.NETWORK_URL ) throw 'Define NETWORK_URL in Config'
            if ( !Config.CONTRACT_ADDRESS ) throw 'Define CONTRACT_ADDRESS in Config'
            if ( !Config.CHAIN_ID ) throw 'Define CHAIN_ID in Config'
            if ( !Config.PORT ) throw 'Define PORT in Config'
            //if ( !Config.BASE_PATH ) throw 'Define BASE_PATH in Config'
            if (typeof Config.BASE_PATH === 'undefined') {
                throw 'Define BASE_PATH in Config'
            }
            if ( !Config.BASE_URL ) throw 'Define BASE_URL in Config'
            if ( !Config.OWNER_ADDRESS ) throw 'Define OWNER_ADDRESS in Config'

        users = new KnexDB();
        await users.init();

    rooms = new Rooms( './db/rooms.json' );
    await rooms.init();

    //users = new Users( './db/users.json' );
    //await users.init();

    blockChainService = new BlockChainService(
        Config.CONTRACT_ADDRESS,
        contractArtifact.abi,
        new ethers.providers.JsonRpcProvider( Config.NETWORK_URL ),
        process.env.OWNER_PRIVATE_KEY,
        {
            'Deposited': onEventDeposited,
            'UserCreditAdded': userCreditAdded,
            'UserCreditRemoved': userCreditRemoved,
            'JackpotCreditAdded': jackpotCreditAdded
        }
    );

    console.log('---------------> Checking blockchain LOGS !!!!');
    let lastCheckedBlock = await users.getLastBlockNumber()
    const lastChainBlock = await blockChainService.getLastBlock();

    if ( lastCheckedBlock > lastChainBlock ) {
        throw `ERROR ---------> Blockchain out of sync!!!!! lastCheckedBlock:${lastCheckedBlock} > ${lastChainBlock}`;
    }

    // inclusive, inclusive
    if ( lastChainBlock > lastCheckedBlock ) {

        let toCheck = lastChainBlock;

        if (lastChainBlock-lastCheckedBlock>100000) {
            while( lastCheckedBlock != lastChainBlock ) {

                toCheck = lastCheckedBlock + 100000;
                if (toCheck > lastChainBlock) toCheck = lastChainBlock;

                console.log( `lastCheckedBlock:${lastCheckedBlock} toCheck:${toCheck}`);
                let txs = await blockChainService.getTransactionsToMe( lastCheckedBlock+1, toCheck )
                // update for missed transactions
                console.log( txs )
                await users.setLastBlockNumber( toCheck )
                lastCheckedBlock = toCheck
            }
        }
        else {
            let txs = await blockChainService.getTransactionsToMe( lastCheckedBlock+1, lastChainBlock )
            // update for missed transactions
            console.log( txs )
            await users.setLastBlockNumber( lastChainBlock )
        }
    }
    else {
        console.log( `Last checked block ${lastCheckedBlock} is equal to last chain block ${lastChainBlock}` )
    }

    await setupServer();

    /*
    evtService = new EvtService(
        await blockChainService.getAllUsers(),
        await blockChainService.getJackpotAmount()
    );
    */
    }
    catch( e ) {
        console.log ( e )
    }

}

function makePath( dir ) {
    return Config.BASE_PATH + '/' + dir;
  }

async function onEventDeposited( userAddress, amount ) {
    console.log(`---EVT---> onEventDeposited ${userAddress} ${ethutils.toEth(amount)}`);
    let user = await users.getUserByAddress( userAddress );
    await users.addUserAmount( user.id, amount );
    let userAmount = await users.getUserAmount( user.id );
    console.log('onEventDeposited', 'userAmount', userAmount);
    emitUserAmount( user.id, ethutils.ether( userAmount ) );
}

async function userCreditAdded( userAddress, amount ) {
    console.log(`---EVT---> UserCreditAdded ${userAddress} ${ethutils.toEth(amount)}`);
    let user = await users.getUserByAddress( userAddress );
    await users.addUserAmount( user.id, amount );
    let userAmount = await users.getUserAmount( user.id );
    console.log('userCreditAdded', 'userAmount', userAmount);
    emitUserAmount( user.id, ethutils.ether( userAmount ) );

    /*
    if (evtService) {
        await evtService.addUserAmount(userAddress, amount);
        const userAmount = await evtService.getUserAmount(userAddress);

        

        //const ws = map.get(userAddress);
        //const data = JSON.stringify({ 'userAddress': userAddress, 'userAmount': U.toEth(userAmount) });
        //console.log('Sending:', data);
        //if (socket) ws.send(data);
        emitUserAmount( userAddress, userAmount );
    }
    */
}
async function userCreditRemoved( userAddress, amount ) {
    console.log(`---EVT---> UserCreditRemoved ${userAddress} ${ethutils.toEth(amount)}`);
    let user = await users.getUserByAddress( userAddress );
    await users.removeUserAmount( user.id, amount );
    let userAmount = await users.getUserAmount( user.id );
    console.log('userCreditRemoved', 'userAmount', userAmount);
    emitUserAmount( user.id, ethutils.ether( userAmount ) );
    /*
    if (evtService) {
        await evtService.removeUserAmount(userAddress, amount);
        const userAmount = await evtService.getUserAmount(userAddress);
        //const ws = map.get(userAddress);
        //const data = JSON.stringify({ 'userAddress': userAddress, 'userAmount': U.toEth(userAmount) });
        //console.log('Sending:', data);
        //if (ws) ws.send(data);
        emitUserAmount( userAddress, userAmount );
    }
    */
}


function jackpotCreditAdded(amount) {
    console.log(`---EVT---> JackpotCreditAdded ${ethutils.toEth(amount)}`);
    //evtService.updateJackpot(amount);
    //emitUserAmount( socket, evtService.getJackpotAmount() );
}

/*function checkLogged(publicAddress, request) {
    return publicAddress == request.session.userId ? true : false;
}*/

async function checkLogged( request ) {
    console.log( 'checkLogged',  request.session.userId );

    let userID = request.session.userId;
    
    if (!userID) return null;

    let user = await users.getUser( userID );
    if (!user) {
        throw `Wrong userID ${userID}`
    }
    console.log( user );
    return user;
}

async function setupWsServer( sessionParser, server ) {
    console.log('setupWsServer');

    io = new Server( server, { 
        path: Config.BASE_PATH + '/socket.io' ,
        serveClient: false
    } );
    //io.path( Config.BASE_PATH + '/socket.io' );
    console.log( io );

    /*
        //
        // Create a WebSocket server completely detached from the HTTP server.
        //
        //const wss = new WebSocket.Server({ clientTracking: false, noServer: true });
        const wss = new WebSocketServer({ clientTracking: false, noServer: true });
    
        server.on('upgrade', function (request, socket, head) {
            console.log('Parsing session from request...');
    
            sessionParser(request, {}, () => {
                if (!request.session.userId) {
                    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                    socket.destroy();
                    return;
                }
    
                console.log('Session is parsed!');
    
                wss.handleUpgrade(request, socket, head, function (ws) {
                    wss.emit('connection', ws, request);
                });
            });
        });
    */
        
        // register middleware in Express
        //app.use(sessionMiddleware);
        // register middleware in Socket.IO
        io.use((socket, next) => {
            sessionParser(socket.request, {}, next);
            // sessionMiddleware(socket.request, socket.request.res, next); will not work with websocket-only
            // connections, as 'socket.request.res' will be undefined in that case
        });
/*
        io.use((socket, next) => {
            var handshakeData = socket.request;
            // make sure the handshake data looks good as before
            // if error do this:
              // next(new Error("not authorized"));
            // else just call next
            next();
          });
*/

        io.on('connection', async (socket) => {
            console.log("new connection");

            var handshakeData = socket.request;
            const userId = socket.request.session.userId;
            // make sure the handshake data looks good as before
            if (!userId) {
                console.log("not authorized");
                //return new Error("not authorized");
                socket.emit( msg.Type.RequireLogin, { text: `New login required` } );
                return new Error("not authorized");
            }
            
            console.log("authorized");

            //users.add( userId );

            socket.data.userId = userId;
            socket.emit( msg.Type.Welcome, { text: `Welcome user: ${userId}` } );
/*
            let user = await evtService.getUser( userId );
            console.log( 'user', user );
            if (!user) {
                evtService.createUser( userId );
            }
*/
            //socket.emit( msg.Type.UserAmount, await evtService.getUserAmount( userId ) );
            //socket.emit( msg.Type.Jackpot, await evtService.getJackpot() );
/*
            const session = socket.request.session;
            session.connections++;
            session.save();
*/
        //});
    
        //wss.on('connection', function (ws, request) {
        //   console.log('connection', request.session.userId);
        //   
            //console.log( socket.request.session );
            //const userId = ws.request.session.userId;
    
            //map.set(userId, ws);
/*
            //socket.on(msg.Type.Play, (arg1, arg2, callback) => {
            socket.on(msg.Type.Play, async (callback) => {
                console.log('on', msg.Type.Play);
                //console.log(arg1); // 1
                //console.log(arg2); // { name: "updated" }

                const playPrice = 1;
                
                console.log('play result');
                await evtService.removeUserAmount( userId, ethutils.ether( playPrice ) );

                utils.sleepMS( 3000 );

                let numbers = play.getLuckyNumbers();
                let hand = play.checkWin( numbers );
                let money = 0;
                if (hand != play.Wins.none) {
                    // win send money to user
                    if (hand == play.Wins.five_seven) {
                        // jackpot
                        //await blockChainService.winJackpot();
                        money = evtService.getJackpot();
                    }
                    else {
                        money = play.getMoneyForWin( hand );
                        evtService.addUserAmount(userId, ethutils.ether( money ));
                        //await blockChainService.transferMoney( publicAddress, money );
                    }
                }
                else {
                    // half goes to jackpot
                    //await blockChainService.addJackpot( playPrice / 2 );
                    await evtService.addJackpot( ethutils.ether( playPrice / 2 ) );
                }

                let result = {
                    status: "ok",
                    result: { numbers: numbers, win: hand != play.Wins.none, hand: hand, money: ethutils.ether( money ) },
                    jackpotAmount: await evtService.getJackpot(),
                    userAmount: await evtService.getUserAmount( userId ) 
                };

                callback( result );
                
                //callback({
                //  status: "ok"
                //});
            });
*/

            socket.on('disconnect', function() {
                console.log('Socket got disconnect!', socket.request.session.userId);

                //var i = allClients.indexOf(socket);
                //allClients.splice(i, 1);
            });

            socket.on(msg.Type.GetEmptyRooms, async (callback) => {
                //const userId = socket.request.session.userId;
                const user = await checkLogged( socket.request );
                if (!user) {
                    callback( error( 'User not logged in', utils.ErrorCodes.NotLoggedIn ) );
                    return;
                }

                console.log( 'on', msg.Type.GetEmptyRooms, userId );
                callback( utils.ok ({
                    emptyRooms: rooms.getEmptyRooms(),
                    waitingRooms: rooms.getWaitingRooms(),
                    myRooms: await users.getUserRooms( userId )
                 }) );
            });

            socket.on(msg.Type.GameSlotPlay, async (data, callback) => {

                try {
                
                    const user = await checkLogged( socket.request );
                    if (!user) {
                        callback( error( 'User not logged in', utils.ErrorCodes.NotLoggedIn ) );
                        return;
                    }

                    const userId = user.id; //socket.request.session.userId;
                    const roomID = data.roomID;

                    //console.log( 'on', msg.Type.GameSlotPlay, userId, roomID );
                    console.log( `on type:${msg.Type.GameSlotPlay} userId:${userId} roomID:${roomID}` );

                    const playPrice = ethutils.ether( 1 );
                    const jackpotAdderPrice = ethutils.ether( 0.5 );
                    
                    console.log('play result');
                    //await evtService.removeUserAmount( userId, ethutils.ether( playPrice ) );

                    //const user = await users.getUser( userId );
                    const currentRoomID = user.currentRoomID;
/*
                    if (roomID != currentRoomID) {
                        throw `Received room ID ${roomID} diiffers from user current room ID ${currentRoomID}`
                    }
*/
                    //const userAmount = user.amount; //await users.getUserAmount( userId );
                    console.log( user.amount );
                    assert( ethers.BigNumber.isBigNumber( playPrice ) );
                    assert( ethers.BigNumber.isBigNumber( user.amount ) );
                    if ( user.amount.lt( playPrice ) ) {
                        callback( utils.error( 
                            'Not enough credits, please buy more credits to play', 
                            utils.ErrorCodes.NotEnoughCredits ) 
                            );
                        return;
                    }

                    await users.removeUserAmount( userId, playPrice );

                    utils.sleepMS( 3000 );

                    let numbers = play.getLuckyNumbers();
                    let hand = play.checkWin( numbers );
                    let money = 0;
                    if (hand != play.Wins.none) {
                        // win send money to user
                        if (hand == play.Wins.five_seven) {
                            // jackpot
//                            const room = await rooms.getRoom( currentRoomID );
//                            const jackpot = room.jackpot;
//                            assert( ethers.BigNumber.isBigNumber( jackpot ) );
//                            users.addUserAmount( jackpot );
//                            rooms.removeJackpot( currentRoomID, jackpot );
                            //await blockChainService.winJackpot();
                            //money = evtService.getJackpot();
                            console.log('JACKPOT TODO');
                        }
                        else {
                            money = play.getMoneyForWin( hand );
                            //evtService.addUserAmount(userId, ethutils.ether( money ));
                            users.addUserAmount( userId, ethutils.ether( money ) );
                            //await blockChainService.transferMoney( publicAddress, money );
                        }
                    }
                    else {
                        // half goes to jackpot
                        //await blockChainService.addJackpot( playPrice / 2 );
                        //await evtService.addJackpot( ethutils.ether( playPrice / 2 ) );
                        //console.log('JACKPOT TODO');
//                        rooms.addJackpot( currentRoomID, jackpotAdderPrice );
                    }

                    let jackpotAmount = ethers.BigNumber.from(0); //await rooms.getJackpot( currentRoomID );
                    let userAmount = await users.getUserAmount( userId );
                    let moneyAmount = ethutils.ether( money );
                    console.log( `${jackpotAmount} ${userAmount} ${moneyAmount}` );

                    let result = {
                        numbers: numbers, 
                        win: hand != play.Wins.none, 
                        hand: hand, 
                        money: moneyAmount.toHexString(),
                        jackpotAmount: jackpotAmount.toHexString(),
                        userAmount: userAmount.toHexString()
                    };

                    callback( utils.ok( result ) );

                }
                catch(e) {
                    callback( utils.error( e ) );
                }
            });

            socket.on(msg.Type.JoinRoom, async (data, callback) => {

                const user = await checkLogged( socket.request );
                if (!user) {
                    callback( error( 'User not logged in', utils.ErrorCodes.NotLoggedIn ) );
                    return;
                }

                const userID = user.id; //socket.request.session.userId;
                let roomID = data.roomID;
                console.log('on', msg.Type.JoinRoom, roomID, userID);
                
                //let user = await users.getUser( userID );
                /*
                if (user.rooms.length > 0) {
                    // can join max 1 room
                    callback( utils.error( 'Can join max 1 room at the same time' ) );
                    return;
                }
                */

                if ( user.currentRoomID != roomID ) {
                    if (user.currentRoomID) {
                        await rooms.leaveRoom( userID, roomID );
                    }
                    await rooms.joinRoom( userID, roomID );
                    await users.joinRoom( userID, roomID );
                }
                
                //This will create a new socket.io channel to make it easy to emit to a single room
                await socket.join( roomID );
                callback( utils.ok( roomID ) );

                //var room = rooms.getRoom( roomID )
                
                //newPlayer.currentRoom = openRoom; //Now the player object has a reference to the game room it's in
                //openRoom.players.push(newPlayer);
                
                //socket.join( roomID );//This will create a new socket.io channel to make it easy to emit to a single room

                
            });

/*    
            socket.on('message', async function (message) {
    
                let receivedMsg = new msg(message);
    
                let playPrice = 1;
    
                switch (receivedMsg.type) {
                    case msg.Type.Play:
                        console.log('play result', receivedMsg.data);
                        await evtService.updateUserAmount(userId, U.ether(playPrice));
                        let numbers = play.getLuckyNumbers();
                        let hand = play.checkWin(numbers);
                        let money = 0;
                        if (hand != play.Wins.none) {
                            // win send money to user
                            if (hand == play.Wins.five_seven) {
                                // jackpot
                                //await blockChainService.winJackpot();
                                money = evtService.getJackpot();
                            }
                            else {
                                money = play.getMoneyForWin(hand);
                                evtService.updateUserAmount(userId, U.ether(money));
                                //await blockChainService.transferMoney( publicAddress, money );
                            }
                            socket.send(msg.create(receivedMsg.type, { numbers: numbers, win: true, hand: hand, money: U.ether(money) }));
                            socket.send(msg.create(msg.Type.UserAmount, { amount: await evtService.getUserAmount(userId) }));
                        }
                        else {
                            // half goes to jackpot
                            //await blockChainService.addJackpot( playPrice / 2 );
                            await evtService.addJackpot(U.ether(playPrice / 2));
                            socket.send(msg.create(receivedMsg.type, { numbers: numbers, win: false }));
                            socket.send(msg.create(msg.Type.Jackpot, { amount: await evtService.getJackpot() }));
                            socket.send(msg.create(msg.Type.UserAmount, { amount: await evtService.getUserAmount(userId) }));
                        }
                        break;
                    case msg.Type.Jackpot:
                        console.log('jackpot result', receivedMsg.data);
                        break;
                    case msg.Type.UserAmount:
                        console.log('UserAmount result', receivedMsg.data);
                        break;
                }
    
                //
                // Here we can now use session parameters.
                //
                console.log(`Received message ${message} from user ${userId}`);
    
                //ws.send( `Ciao ${userId}` );
            });
*/
    /*
            ws.on('close', function () {
                map.delete(userId);
            });
    */
        });
}

async function emitJackpot( userAddress, amount ) {
    let allSockets = await io.fetchSockets();
    let socket = allSockets.find((socket) => socket.data.userId == userAddress);
    // server-side
    socket.emit( msg.Type.Jackpot, amount );
}
async function emitUserAmount( userID, amount ) {
    console.log( 'emitUserAmount', userID, amount );
    let allSockets = await io.fetchSockets();
    let socket = allSockets.find( (socket) => socket.data.userId == userID );
    if (!socket) {
        throw 'emitUserAmount socket not found'
    }
    // server-side
    assert( ethers.BigNumber.isBigNumber( amount ) )
    socket.emit( msg.Type.UserAmount, { amount: amount.toHexString() } );
}

async function setupServer() {
    console.log('setupServer');
/*
    const sessionParser = session({
        saveUninitialized: false,
        //secret: '$eCuRiTy',
        secret: process.env.TOKEN_SECRET,
        resave: false
    });
*/
    const sessionParser = session({ 
        saveUninitialized: false,
        secret: process.env.TOKEN_SECRET, 
        cookie: { maxAge: 60000 },
        resave: false
    });

    //
    // Serve static files from the 'public' folder.
    //
/*
    // By this way /not-wanted-route-part/users will became /users
    app.use(function(req, res, next) {
        console.log("request", req.originalUrl);
        if (Config.BASE_PATH != '') {
        const removeOnRoutes = Config.BASE_PATH; //'/not-wanted-route-part';
        req.originalUrl = req.originalUrl.replace(removeOnRoutes,'');
        req.path = req.path.replace(removeOnRoutes,'');
        }
        return next();
    });
*/
    //var staticPath = __dirname + '/public';
    //console.log( 'staticPath', staticPath, makePath( 'public' ) );
    //app.use( makePath( 'public' ), express.static( staticPath ) );
    
    app.use(function timeLog(req, res, next) {
        console.log(`APP ${Date.now()} ${req.baseUrl} ${req.originalUrl}`);
        next();
    });


    app.use( sessionParser );
    app.use( express.urlencoded({ extended: true }) );
    app.use( express.json() ) // To parse the incoming requests with JSON payloads
    /*
    app.post('/login', function (req, res) {
      //
      // "Log in" user and set userId to session.
      //
    
      const publicAddress = req.body.publicAddress;
    
      console.log('POST login', req.body);
    
      //const id = uuid.v4();
    
      //console.log(`Updating session for user ${id}`);
      
      //req.session.userId = id;
      req.session.userId = publicAddress;
      res.send({ result: 'OK', message: 'Session updated' });
    });
    */

    var router = express.Router();
    
    app.use( Config.BASE_PATH, router );
    
    router.use(function timeLog(req, res, next) {
        console.log(`ROUTER ${Date.now()} ${req.baseUrl} ${req.originalUrl}`);
        next();
    });

    //router.use( '/npm', express.static( 'node_modules' ) );
    router.use( express.static( 'dist/public' ) );
    
    router.get( '/user', async (req, res) => {
        console.log('GET user', req.query.publicAddress);
        const publicAddress = req.query.publicAddress;

        try {
            let user = await users.getUserByAddress( publicAddress )
            if (!user) {
                await users.add( publicAddress );
                user = await users.getUserByAddress( publicAddress )
            }
            res.json( utils.ok({ user: user }) );
        }
        catch (e) {
            console.log(e);
            res.json( utils.error(e.message) );
        }
    });

    router.get( '/logged', async (req, res) => {
        console.log('GET logged');
        const user = await checkLogged( req );
        const logged = !!user ? true : false;
        console.log(`logged: ${logged}`);
        res.json( utils.ok({ logged }) );
    });

    router.get( '/useramount', async (req, res) => {
        console.log('GET useramount');
        const user = await checkLogged( req );
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders(); // flush the headers to establish SSE with client
        
        // Tell the client to retry every 10 seconds if connectivity is lost
        //res.write( 'retry: 10000\n\n' );
        res.write( `data: ${JSON.stringify( utils.ok({ userAmount: !!user ? user.amount.toHexString() : 0 }) )}\n\n` );
    });

/*
    router.get( '/', async (req, res) => {
        console.log( '------> GET /' );
        //const publicAddress = req.query.publicAddress;
        //const userID = req.session.userId;
        //const user = await checkLogged( req );
        //console.log(`logged: ${logged}`);
        if (!user) {
            console.log( 'User NOT logged' )
            res.redirect('/login.html')
        }
        else {
            next();
        }
        //res.json( utils.ok({ logged }) );
    });
*/
    
    
/*
    router.get( '/contract', async (req, res) => {
        console.log('GET contract');
        res.json( utils.ok({ abi: contractArtifact.abi }) );
    });
*/
    router.post( '/login', async (req, res) => {
        console.log('POST login');

        const publicAddress = req.body.publicAddress;
        const signature = req.body.signature;

        try {
            const user = await verifyUserSignature( publicAddress, signature );
            //req.session.userId = publicAddress;
            req.session.userId = user.id;
            await users.updateUserNonce( user.id );
            res.json( utils.ok() );
        }
        catch (e) {
            console.log(e);
            res.json( utils.error(e.message) );
        }
    });
/*
    router.delete( '/logout', function (request, response) {
        const ws = map.get(request.session.userId);

        console.log('Destroying session');
        request.session.destroy(function () {
            if (ws) ws.close();

            response.send({ result: 'OK', message: 'Session destroyed' });
        });
    });
*/
    //
    // Create an HTTP server.
    //
    const server = http.createServer(app);
/*
    server.on('upgrade', function (request, socket, head) {
        console.log('Parsing session from request...');

        sessionParser(request, {}, () => {
            if (!request.session.userId) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }

            console.log('Session is parsed!');

            //wss.handleUpgrade(request, socket, head, function (ws) {
            //    wss.emit('connection', ws, request);
            //});
        });
    });
*/
    await setupWsServer( sessionParser, server );
    //
    // Start the server.
    //
    server.listen(Config.PORT, function () {
        console.log('Listening on ' + Config.BASE_URL);
    });

}

async function verifyUserSignature(publicAddress, signature) {
    console.log('verifyUserSignature', publicAddress, signature);
    // get user and nonce from DB with address

    if (! await users.userExistsByAddress( publicAddress ) ) {
        await users.add( publicAddress );
    }

    const user = await users.getUserByAddress( publicAddress );
    console.log(user);
    const message = `I am signing my one-time nonce: ${user.nonce}`;

    //let recovered = await ethers.utils.verifyMessage(messageHashBytes, flatSig);
    let recovered = ethers.utils.verifyMessage(message, signature);
    console.log('recovered', recovered);
    console.log('publicAddress', publicAddress);
    console.log(recovered === publicAddress);
    if (recovered !== publicAddress) throw 'User signature not valid';
    //return recovered === publicAddress ? user : null;
    return user;
}