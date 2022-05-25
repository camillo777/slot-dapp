'use strict';

export default class utils {

    static ErrorCodes = {
        GenericError: 0,
        NotLoggedIn: 1,
        AuthFailed: 2,
        NotEnoughCredits: 3
    }

    static string( s ) { 
        return ''+s; 
    }

    static ok( result ) {
        return { error: false, data: result };
    }

    static error( message, errorCode = utils.ErrorCodes.GenericError ) {
        return { 
            error: true, 
            msg: message,
            errorCode: errorCode 
        };
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