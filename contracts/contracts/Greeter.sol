//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Greeter {
    string private greeting;
    address owner;

    constructor(string memory _greeting) {
        console.log("Deploying a Greeter with greeting:", _greeting);
        greeting = _greeting;
        owner = msg.sender;
    }

    function greet() public view returns (string memory) {
        console.log( msg.sender, owner );
        require( msg.sender == owner, "Sender should be owner" );
        return greeting;
    }

    function setGreeting(string memory _greeting) public {
        console.log( msg.sender, owner );
        require( msg.sender == owner, "Sender should be owner" );
        console.log("Changing greeting from '%s' to '%s'", greeting, _greeting);
        greeting = _greeting;
    }
}