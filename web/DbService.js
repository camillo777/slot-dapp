var assert = require('assert');

class DbService {

    constructor( filename ) {
        const low = require('lowdb');
        const FileSync = require('lowdb/adapters/FileSync');
        const adapter = new FileSync( filename ); //'db.json');
        this.db = low(adapter);

        console.log( 'Creating DB if not exists...' );
        if ( !this.db.has('users').value() ) {
            this.db.set('users', []).write();
            console.log( 'DB created' );
        }
    }

    async dbUpdateNonce( publicAddress ) {
        console.log( 'dbUpdateNonce', publicAddress );
        await this.db.get('users')
            .find( { publicAddress: publicAddress } )
            .set( { nonce: this.generateNonce() })
            .write();
    }
    
    async dbUpdateUserAmount( publicAddress, amount ) {
        console.log( 'dbUpdateUserAmount', publicAddress, amount );
        await this.db.get('users')
            .find( { publicAddress: publicAddress } )
            //.set( 'amount', amount )
            .assign({ amount: amount })
            .write();
    }
    
    async dbCreateUser( publicAddress ) {
        console.log( 'dbCreateUser', publicAddress );
        
        await this.db.get('users')
            .push({ 
            nonce: this.generateNonce(), // Initialize with a random nonce
            publicAddress: publicAddress,
            username: ''
            })
            .write();
        
        const user = await this.dbGetUser( publicAddress );
        console.log( 'user', user );
        return user;
    }

    async dbGetUser( publicAddress ) {
        assert( publicAddress );
        console.log( 'dbGetUser', publicAddress );
        return await this.db.get('users')
            .find( { publicAddress: publicAddress } )
            .value();
        }

    async getAllUsers() {
        console.log( 'getAllUsers' );
        return await this.db.get('users').value();
    }

    generateNonce() { 
        console.log( 'generateNonce' );
        return Math.floor(Math.random() * 1000000); 
      }
      
}

module.exports = DbService;