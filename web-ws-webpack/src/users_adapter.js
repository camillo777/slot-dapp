import { JSONFile } from 'lowdb'
import { User } from './user.js';

class UsersAdapter {

    tag = 'UsersAdapter'

  constructor(filename) {
    //this.adapter = new TextFile(filename)
    this.adapter = new JSONFile( filename )
  }

  async read() {
    const data = await this.adapter.read()
    var newdata = {}
    if ( data && data.users ) {
        newdata.users = [];
        data.users.forEach((u) => {
            //console.log( this.tag, 'read', u);
            newdata.users.push( User.fromJSON( u ) )
        });
    }
    return newdata;
  }

  write(obj) {
    //console.log( obj );
    var newdata = {}
    newdata.users = [];
    if ( obj && obj.users ) {
        obj.users.forEach((u) => {
            //console.log( this.tag, 'read', u);
            newdata.users.push( u.toJSON() )
        });
    }
    return this.adapter.write( newdata )
  }
}

export { UsersAdapter }