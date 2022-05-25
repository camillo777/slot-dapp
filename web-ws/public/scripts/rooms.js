import { Low, JSONFile } from 'lowdb'
import { RoomsAdapter } from './rooms_adapter.js'
import { ethers } from 'ethers'
import assert from 'assert'

class Rooms {

    tag = 'Rooms'

    constructor( filepath ) {
        this.filepath = filepath;
        const adapter = new RoomsAdapter( filepath )
        this.db = new Low( adapter );
        //this.users = this.db.data;
    }

    async init() {
        await this.db.read();
        if ( !this.db.data || !this.db.data.rooms ) {
            this.db.data = { rooms: [] };
            for(let i=0; i<5; i++) {
                this.db.data.rooms.push( new Room( 'slot', i ) );
            }
            for(let i=0; i<5; i++) {
                this.db.data.rooms.push( new Room( 'poker', i ) );
            }
            this.db.write();
            console.log( this.tag, 'DB created' );
        }
        else {
            console.log( this.tag, 'DB loaded' );
            console.log( this.db.data );
        }
    }

    getEmptyRooms() {
        console.log( this.tag, 'getEmptyRooms' );
        let availableRooms = [];
        this.db.data.rooms.forEach((room)=>{
            if ( !room.started && room.users.length == 0 ) 
                availableRooms.push( room );
        })
        return availableRooms;
    }

    getWaitingRooms() {
        console.log( this.tag, 'getWaitingRooms' );
        let availableRooms = [];
        this.db.data.rooms.forEach((room)=>{
            if ( !room.started && room.users.length > 0 ) 
                availableRooms.push( room );
        })
        return availableRooms;
    }

    getRoom( roomID ) {
        console.log( this.tag, 'getRoom', roomID );
        let room = this.db.data.rooms.find((room) => room.id == roomID);
        if (!room) throw `Room with ID ${roomID} not found!`
        return room;
    }

    joinRoom( userID, roomID ) {
        console.log( this.tag, 'joinRoom', userID, roomID );
        var room = this.getRoom( roomID );
        room.joinRoom( userID );
        this.db.write();
    }

    leaveRoom( userID, roomID ) {
        console.log( this.tag, 'leaveRoom', userID, roomID );
        var room = this.getRoom( roomID );
        room.leaveRoom( userID );
        this.db.write();
    }

    addJackpot( roomID, amount ) {
        let room = this.getRoom( roomID )
        room.addJackpot( amount );
    }
    removeJackpot( roomID, amount ) {
        let room = this.getRoom( roomID )
        room.removeJackpot( amount );
    }
    getJackpot( roomID ) {
        let room = this.getRoom( roomID )
        assert( ethers.BigNumber.isBigNumber( room.jackpot ) );
        return room.jackpot
    }
}

class Room {

    tag = 'Room'

    constructor( gameID, uuid ) {
        this.gameID = gameID;
        this.id = `${gameID}${uuid}`
        this.name = `${gameID} room ${uuid}`
        this.started = false
        this.state = {}
        this.users = []
        this.maxUsers = 1
        this.jackpot = ethers.BigNumber.from(0);
    }

    joinRoom( userID ) {
        console.log( this.tag, 'joinRoom', userID );
        this.users.push( userID );
    }

    leaveRoom( userID ) {
        console.log( this.tag, 'leaveRoom', userID );
        var filteredUsers = array.filter(function(value, index, arr){ 
            return value != userID;
        });
        this.users = filteredUsers;
    }

    getOwner() {
        console.log( this.tag, 'getOwner' );
        if ( this.isEmpty() ) throw `Room with ID ${this.id} is empty!`
        return this.users[0];
    }

    isEmpty() {
        console.log( this.tag, 'isEmpty' );
        return this.users.length == 0;
    }

    static fromJSON( json ) {
        console.log( 'Room', 'fromJSON', json )
        var room = new Room( json.gameID, json.id )
        console.log( room );
        room.gameID = json.gameID
        room.id = json.id
        room.name = json.name ? json.name : null
        room.started = json.started
        room.state = json.state
        room.users = json.users ? json.users : []
        room.maxUsers = json.maxUsers
        room.jackpot = json.jackpot ? ethers.BigNumber.from( json.jackpot ) : ethers.BigNumber.from(0)
        return room
    }

    toJSON() {
        console.log( this.tag, 'toJSON' )
        return {
            gameID: this.gameID,
            id: this.id,
            name: this.name,
            started: this.started,
            state: this.state,
            users: this.users,
            maxUsers: this.maxUsers,
            jackpot: this.jackpot.toHexString()
        };
    }

    addJackpot( amount ) {
        assert( ethers.BigNumber.isBigNumber( amount ) );
        this.jackpot = this.jackpot.add( amount );
    }

    removeJackpot( amount ) {
        assert( ethers.BigNumber.isBigNumber( amount ) );
        this.jackpot = this.jackpot.sub( amount );
        if (this.jackpot.lt(ethers.BigNumber.from(0))) this.jackpot = ethers.BigNumber.from(0);
    }

}

export { Rooms, Room };