'use strict';

export default class utils {

    static string( s ) { 
        return ''+s; 
    }

    static ok( result ) {
        return { error: false, data: result };
    }

    static error( message ) {
        return { error: true, msg: message };
    }

    static log( tag, func, message ) {
        console.log( `${tag}:${func} | ${message}` );
    }

    static sleepMS(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static getRandomIntInclusive(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1) + min); 
        //The maximum is inclusive and the minimum is inclusive
    }
      
}