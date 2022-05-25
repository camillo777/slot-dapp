// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";


contract UserData {

    address private _owner;
    address private _parent;

    struct User {
        uint256 amount;
        bool isSet;
    }

    mapping(address => User) private _users;
    address[] private _usersArray;

    constructor() {
        _owner = payable( msg.sender );
    }

    function setParentAddress( address parentAddress ) public {
        _parent = parentAddress;
    }

    function exists( address userAddress ) public view returns(bool) {
        return _users[userAddress].isSet;
    }

    function addAmount( address userAddress, uint256 amount ) public {
        require( msg.sender == _owner || msg.sender == _parent, 'Sender should be parent or owner' );
        if (_users[userAddress].isSet) _users[userAddress].amount += amount;
        else {
            _users[userAddress] = User( { amount: amount, isSet: true } );
            _usersArray.push( userAddress );
        }
    }

    function removeAmount( address userAddress, uint256 amount ) public {
        require( msg.sender == _owner || msg.sender == _parent, 'Sender should be parent or owner' );
        require( _users[userAddress].isSet );
        require( _users[userAddress].amount >= amount );
        _users[userAddress].amount -= amount;
    }

    function getAmount( address userAddress ) public view returns(uint256) {
        //console.log( 'UserData::getAmount', userAddress );
        //require( msg.sender == _owner || msg.sender == _parent, 'Sender should be parent or owner' );
        //uint256 userAmount = _users[userAddress].amount;
        //console.log( 'userAmount', userAmount );
        return _users[userAddress].amount;
    }
    function resetAmount( address userAddress ) public {
        require( msg.sender == _owner || msg.sender == _parent );
        _users[userAddress].amount = 0;
    }

    function getCount() public view returns(uint256) {
        return _usersArray.length;
    }

    function getAt( uint256 i ) public view returns (address, uint256) {
        address userAddress = _usersArray[i];
        return (userAddress, _users[userAddress].amount);
    }

}