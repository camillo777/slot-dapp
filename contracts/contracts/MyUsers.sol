// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import './UserData.sol';

contract MyUsers {

    address payable owner;
    UserData private userData;

    uint256 jackpotAmount;
    uint256 numCreditsForOneEther = 10;

    event Deposited(address indexed payee, uint256 weiAmount);
    event Withdrawn(address indexed payee, uint256 weiAmount);
    event UserCreditAdded(address indexed userAddress, uint256 weiAmount);
    event UserCreditRemoved(address indexed userAddress, uint256 weiAmount);
    event JackpotCreditAdded( uint256 weiAmount );
    event JackpotCreditRemoved( uint256 weiAmount);

    enum State {
        Active,
        Refunding,
        Closed
    }

    constructor() { // address _userData ) {
        owner = payable( msg.sender );
        console.log( 'owner', owner );
        //userData = UserData( _userData );
    }

    function isOwner( address sender ) public view returns(bool) {
        return address( sender ) == address( owner );
    }

    function getOwner() public view returns (address) {
        console.log('owner', owner);
        return owner;
    }

    function getUserDataAddress() public view returns(address) {
        return address( userData );
    }

    function getSender() public view returns (address) {
        console.log('msg.sender', msg.sender);
        console.log('owner', owner);
        console.log('equals?', msg.sender == owner);
        return msg.sender;
    }

    function setUserData( address userDataAddress ) public {
        require( isOwner( msg.sender ), 'Sender should be owner' );
        require( userDataAddress != address(0), 'Address should not be zero' );
        userData = UserData( userDataAddress );
        require( userData.getCount() == 0 );
        //console.log( '_userData.getCount', _userData.getCount() );
    }

    function userDeposit() public payable {
        require( msg.value > 0 );
        // add credit to user account
        // 1 ether means 10 credits
        userData.addAmount( msg.sender, msg.value * numCreditsForOneEther );
        emit Deposited( msg.sender, msg.value * numCreditsForOneEther );
    }

    function userAddCredit( address userAddress, uint256 amount ) public {
        require( isOwner( msg.sender ), 'Sender should be owner' );
        require( amount > 0 );
        userData.addAmount( userAddress, amount );
        emit UserCreditAdded( userAddress, amount );
    }

    function userRemoveCredit( address userAddress, uint256 amount ) public {
        require( isOwner( msg.sender ), 'Sender should be owner' );
        require( amount > 0 );
        userData.removeAmount( userAddress, amount );
        emit UserCreditRemoved( userAddress, amount );
    }

    function userWithdraw() public payable {
        //require( msg.sender == _owner );
        require( msg.sender != address(0), "No zero address");
        require( userData.exists(msg.sender) );
        uint256 userAmount = userData.getAmount( msg.sender );
        require( userAmount > 0 );
        userData.resetAmount( msg.sender );
        owner.transfer( userAmount );
        emit Withdrawn(msg.sender, userAmount);
        //_owner.sendValue(address(this).balance);
    }

    function withdraw( uint256 amount ) public payable {
        require( isOwner( msg.sender ), 'Sender should be owner' );
        require( owner != address(0), "No zero address");
        require( amount > 0, 'Amount must be moe than zero' );
        require( address(this).balance >= amount, 'Amount must be more qual address balance' );
        owner.transfer( amount );
        emit Withdrawn(owner, amount);
    }
 
    function getTotalAmount() public view returns(uint256) {
        //require( isOwner( msg.sender ), 'Sender should be owner' );
        return address(this).balance; // balance of the Address in Wei uint256
    }
    function getUserAmount( address userAddress ) public view returns(uint256) {
        //console.log( 'MyUsers::getUserAmount', userAddress );
        //require( isOwner( msg.sender ), 'Sender should be owner' );
        return userData.getAmount( userAddress );
    }

    function getJackpotAmount() public view returns(uint256) {
        //require( isOwner( msg.sender ), 'Sender should be owner' );
        return jackpotAmount;
    }
    function jackpotAdd( uint256 amount ) public {
        require( isOwner( msg.sender ), 'Sender should be owner' );
        jackpotAmount += amount;
        emit JackpotCreditAdded( amount );
    }
    function jackpotRemove( uint256 amount ) public {
        require( isOwner( msg.sender ), 'Sender should be owner' );
        require( jackpotAmount >= amount );
        jackpotAmount -= amount;
        emit JackpotCreditRemoved( amount );
    }
    function jackpotToUser( address userAddress ) public {
        require( isOwner( msg.sender ), 'Sender should be owner' );
        require( jackpotAmount > 0 );
        userData.addAmount( userAddress, jackpotAmount );
        jackpotAmount = 0;
        emit JackpotCreditRemoved( jackpotAmount );
    }

    function getUserCount() public view returns(uint256) {
        return userData.getCount();
    }

    function getUserAt( uint256 i ) public view returns (address, uint256) {
        return userData.getAt( i );
    }
}