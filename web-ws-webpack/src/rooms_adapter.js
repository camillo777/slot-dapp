import { JSONFile } from 'lowdb'
import { Room } from './rooms.js';

class RoomsAdapter {

    tag = 'RoomsAdapter'

  constructor(filename) {
    //this.adapter = new TextFile(filename)
    this.adapter = new JSONFile( filename )
  }

  async read() {
    const data = await this.adapter.read()
    var newdata = {}
    if ( data && data.rooms ) {
      newdata.rooms = [];
      data.rooms.forEach((u) => {
          console.log( this.tag, 'read', u);
          newdata.rooms.push( Room.fromJSON( u ) )  // <-------
      });
    }
    return newdata;
  }

  write(obj) {
    console.log( obj );
    var newdata = {}
    newdata.rooms = [];
    if ( obj && obj.rooms ) {
        obj.rooms.forEach((u) => {
            console.log( this.tag, 'read', u);
            newdata.rooms.push( u.toJSON() )
        });
    }
    return this.adapter.write( newdata )
  }
}

export { RoomsAdapter }