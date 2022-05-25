//import { ethers } from 'ethers'
//import assert from 'assert';
import { Low, JSONFile } from 'lowdb'
import { UsersAdapter } from './users_adapter.js'
import { User } from './user.js'
import { v4 as uuidv4 } from 'uuid';

import knex from 'knex';

class Users {

    tag = 'Users'

    constructor() {
        const adapter = new UsersAdapter( './db/users.json' )
        this.db = new Low( adapter );
        //this.users = this.db.data;

        /*this.db = knex({
            client: 'mysql',
            connection: {
              host : '127.0.0.1',
              port : 3306,
              user : 'your_database_user',
              password : 'your_database_password',
              database : 'myapp_test'
            }
          });*/

          this.db = knex({
            client: 'sqlite3',
            connection: {
              filename: "./mydb.sqlite"
            }
          });
    }

    async init() {

        if (! await knex.schema.hasTable('users') ) {
            // create table users
            knex.schema.createTable('users', function (table) {
                table.uuid('id');
                table.string('name');
                table.string('address')
                table.integer('nonce')
                table.bigInteger('amount')
                table.
            });
        }

        this.id = userID;
        this.nonce = this.generateNonce();
        this.amount = ethers.BigNumber.from(0);
        this.rooms = [];
        this.address = null;
        this.name = null;
          

        await this.db.read();
        if ( !this.db.data || !this.db.data.users ) {
            this.db.data = { users: [] };
            console.log( this.tag, 'DB created' );
            this.db.write();
        }
        else {
            console.log( this.tag, 'DB loaded' );
            console.log( this.db.data );
        }
    }

    async getUser( userID ) {
        console.log( this.tag, 'getUser', userID );
        let user = await this.db.data.users.find( (user) => user.id == userID );
        console.log( this.tag, user );
        if (!user) throw `user id not found ${userID}`
        return user;
    }
    async getUserByAddress( userAddress ) {
        console.log( this.tag, 'getUserByAddress', userAddress );
        let user = await this.db.data.users.find( (user) => user.address == userAddress );
        console.log( this.tag, user );
        if (!user) throw `user address not found ${userAddress}`
        return user;
    }

    /*async getUserByAddress( userAddress ) {
        let user = await this.users.find((user) => user.address == userAddress);
        if (!user) throw `user address not found ${userAddress}`
        return user;
    }*/

    async joinRoom( userID, roomID ) {
        console.log( this.tag, 'joinRoom', userID, roomID );
        var user = await this.getUser( userID );
        await user.joinRoom( roomID );
        await this.db.write();
    }

    async userExists( userID ) {
        console.log( this.tag, 'userExists', userID );
        let user = await this.db.data.users.find( (user) => user.id == userID );
        return user ? true : false;
    }
    async userExistsByAddress( userAddress ) {
        console.log( this.tag, 'userExistsByAddress', userAddress );
        let user = await this.db.data.users.find( (user) => user.address == userAddress );
        return user ? true : false;
    }

    async add( userAddress ) {
        console.log( this.tag, 'add', userAddress );
        if ( await this.userExistsByAddress( userAddress ) ) {
            console.log( this.tag, `User ${userAddress} already exist` );
            return await this.getUserByAddress( userAddress );
        }
        var user = new User( uuidv4() );
        user.address = userAddress;
        this.db.data.users.push( user );
        await this.db.write();
        return user;
    }

    async addUserAmount( userID, amount ) {
        let user = await this.getUser( userID );
        await user.addAmount( amount );
        await this.db.write();
        return await user.getAmount();
    }
    async removeUserAmount( userID, amount ) {
        let user = await this.getUser( userID );
        await user.removeAmount( amount );
        await this.db.write();
        return await user.getAmount();
    }
    async getUserAmount( userID, amount ) {
        let user = await this.getUser( userID );
        return await user.getAmount();
    }

    async getUserRooms( userID ) {
        console.log( this.tag, 'getUserRooms', userID );
        var user = await this.getUser( userID );
        return user.rooms;
    }

    async updateUserNonce( userID ) {
        let user = await this.getUser( userID );
        await user.updateNonce();
        await this.db.write();
    }
}

export { Users }