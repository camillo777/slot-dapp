import { join, dirname } from 'path'
import { Low, JSONFile } from 'lowdb'
import { fileURLToPath } from 'url'
import assert from 'assert';

export default class DbService {

    constructor( filename ) {
        // Use JSON file for storage
        //const file = join(__dirname, 'db.json')
        const adapter = new JSONFile( './db.json' )
        this.db = new Low(adapter);
        if ( !this.db.data ) {
            this.db.data = this.db.data || { users: [] };
            this.db.write();
            console.log( 'DB created' );
        }
    }

    async updateNonce( publicAddress ) {
        console.log( 'updateNonce', publicAddress );
        var user = await this.db.data.users
            .find((user) => user.publicAddress == publicAddress );
        console.log(this.db.data.users);
        user['nonce'] = this.generateNonce();
        console.log(this.db.data.users);
        this.db.write();
    }
    
    async updateUserAmount( publicAddress, amount ) {
        console.log( 'dbUpdateUserAmount', publicAddress, amount );
        await this.db.get('users')
            .find((user) => user.publicAddress == publicAddress )
            //.set( 'amount', amount )
            .assign({ amount: amount })
            .write();
    }
    
    async createUser( publicAddress ) {
        console.log( 'createUser', publicAddress );
        
        await this.db.data.users
            .push({ 
                nonce: this.generateNonce(), // Initialize with a random nonce
                publicAddress: publicAddress,
                username: ''
            });
        //await this.db.write();
        
        const user = await this.getUser( publicAddress );
        assert( user );
        console.log( 'user', user );
        return user;
    }

    async getUser( publicAddress ) {
        assert( publicAddress );
        console.log( 'getUser', publicAddress );
        return await this.db.data.users
            .find((user) => user.publicAddress == publicAddress );
    }

    async getAllUsers() {
        console.log( 'getAllUsers' );
        return await this.db.data.users;
    }

    generateNonce() { 
        console.log( 'generateNonce' );
        return Math.floor(Math.random() * 1000000); 
      }
      
}
