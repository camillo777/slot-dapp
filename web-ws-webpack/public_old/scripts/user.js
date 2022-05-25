import { ethers } from 'ethers'
import assert from 'assert';

class User {
    tag = 'User'

    constructor( userID ) {
        this.id = userID;
        this.nonce = this.generateNonce();
        this.amount = ethers.BigNumber.from(0);
        this.rooms = [];
        this.address = null;
        this.name = null;
        this.currentRoomID = null;
    }

    joinRoom( roomID ) {
        //this.rooms.push( roomID );
        this.currentRoomID = roomID;
    }

    addAmount( amount ) {
        assert( ethers.BigNumber.isBigNumber( amount ) );
        assert( ethers.BigNumber.isBigNumber( this.amount ) );
        this.amount = this.amount.add( amount );
    }

    removeAmount( amount ) {
        assert( ethers.BigNumber.isBigNumber( amount ) );
        assert( ethers.BigNumber.isBigNumber( this.amount ) );
        this.amount = this.amount.sub( amount );
        if (this.amount < 0) this.amount = ethers.BigNumber.from(0);
    }

    getAmount() {
        assert( ethers.BigNumber.isBigNumber( this.amount ) );
        return this.amount;
    }

    generateNonce() { 
        console.log( this.tag, 'generateNonce' );
        return Math.floor(Math.random() * 1000000); 
    }

    updateNonce() {
        console.log( this.tag, 'updateNonce' );
        this.nonce = this.generateNonce();
    }

    static fromJSON( json ) {
        //console.log( 'User', 'fromJSON', json )
        var user = new User( json.id )
        console.log( user );
        user.address = json.address ? json.address : null
        user.amount = json.amount ? ethers.BigNumber.from( json.amount ) : ethers.BigNumber.from(0)
        user.rooms = json.rooms ? json.rooms : []
        user.nonce = json.nonce ? json.nonce : null
        user.name = json.name ? json.name : null
        user.token = json.token ? json.token : null
        user.currentRoomID = json.currentRoomID ? json.currentRoomID : null
        return user
    }

    toJSON() {
        //console.log( this.tag, 'toJSON' )
        return {
            id: this.id,
            address: this.address,
            amount: this.amount.toHexString(),
            rooms: this.rooms,
            nonce: this.nonce,
            name: this.name,
            token: this.token,
            currentRoomID: this.currentRoomID
        }
    }
}

export { User }