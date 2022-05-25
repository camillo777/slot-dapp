const { ethers } = require("ethers");

class U {

    static string( s ) { return ''+s; }
    static toGwei( balance ) { return ethers.utils.formatUnits( balance, "gwei" ) };
    static toEth( balance ) { return ethers.utils.formatUnits( balance, "ether" ) };
    static ether( n ) { return ethers.utils.parseEther( this.string( n ) ); }

}

module.exports = U;