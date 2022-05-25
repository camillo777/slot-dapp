'use strict';

import { ethers } from 'ethers';

export default class ethutils {

    static toGwei( balance ) { return ethers.utils.formatUnits( balance, "gwei" ) };
    static toEth( balance ) { return ethers.utils.formatUnits( balance, "ether" ) };
    static ether( n ) { return ethers.utils.parseEther( this.string( n ) ); }
    static string( s ) { return ''+s; }

}