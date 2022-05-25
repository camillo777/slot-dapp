import assert from 'assert';

import { ethers } from 'ethers'
import ethutils from '../src/ethutils.js'
import KnexDB from '../src/users.knex.js'
import play from '../src/play.js'

const USERADDR1 = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92211'
const USERADDR2 = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92222'
const USERADDR3 = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92233'

describe('TestDB', async function() {
        
    it('number of users must be 3', async function() {
        const db = new KnexDB();
        await db.init();
        if ( !( await db.userExistsByAddress( USERADDR1 ) ) ) {
            let id = await db.add( USERADDR1 );
            console.log( `Added user with ID: ${id}` )
        }
        if ( !( await db.userExistsByAddress( USERADDR2 ) ) ) {
            let id = await db.add( USERADDR2 );
            console.log( `Added user with ID: ${id}` )
        }
        if ( !( await db.userExistsByAddress( USERADDR3 ) ) ) {
            let id = await db.add( USERADDR3 );
            console.log( `Added user with ID: ${id}` )
        }
        assert.equal( await db.getCount(), 3 );
        console.log( 'users', await db.getUsers() );
        var user = await db.getUserByAddress( USERADDR1 );
        assert.notEqual( user, null );
        console.log( `user:${user}` );
        var _userAmount = await db.getUserAmount( user.id );
        console.log( _userAmount );
        await db.addUserAmount( user.id, ethers.BigNumber.from(10) )
        _userAmount = _userAmount.add( ethers.BigNumber.from(10) );
        await db.addUserAmount( user.id, ethers.BigNumber.from(7) )
        _userAmount = _userAmount.add( ethers.BigNumber.from(7) );
        await db.addUserAmount( user.id, ethers.BigNumber.from(1) )
        _userAmount = _userAmount.add( ethers.BigNumber.from(1) );
        await db.removeUserAmount( user.id, ethers.BigNumber.from(4) )
        _userAmount = _userAmount.sub( ethers.BigNumber.from(4) );
        var userAmount = await db.getUserAmount( user.id )
        console.log( userAmount, _userAmount );
        assert( ethers.BigNumber.isBigNumber( userAmount ), 'not big number' )
        assert( userAmount.eq( _userAmount ), 'not equals' );

        //return;

        var user2 = await db.getUserByAddress( USERADDR2 );
        var userAmount2 = await db.getUserAmount( user2.id );
        assert( ethers.BigNumber.isBigNumber( userAmount2 ), 'not big number' )
        if ( !(userAmount2.eq( ethers.BigNumber.from(0)) ) ){
            console.log('Remove user amount');
            await db.removeUserAmount( user2.id, userAmount2 )
            assert( (await db.getUserAmount( user2.id )).eq( ethers.BigNumber.from(0) ) )
        }

        console.log('User2 adds credits: 10');
        await db.addUserAmount( user2.id, ethers.BigNumber.from(10) )

        let winHands = [0,0,0,0,0,0,0,0,0]

        console.log('User2 starts playing...');

        for(let i=0; i<100000; i++) {

            const amount = await db.getUserAmount( user2.id );
            console.log( 'amount', amount )

            if ( amount.lt( ethers.BigNumber.from(1)) ) {
                console.log(`Busted at ${i}`);
                return;
            }
            await db.removeUserAmount( user2.id, ethers.BigNumber.from(1) )
            let numbers = play.getLuckyNumbers();
            let hand = play.checkWin( numbers );
            winHands[hand] += 1;
            let money = 0;
            if (hand != play.Wins.none) {
                money = play.getMoneyForWin( hand );
                let ethMoney = ethutils.ether( money )
                console.log( 'money', money, ethMoney )
                await db.addUserAmount( user2.id, ethers.BigNumber.from( ethMoney ) );
            }
        }

        var userAmount2 = await db.getUserAmount( user2.id );
        console.log( `Resulting amount: ${userAmount2}` );
        console.log( `${winHands.map((h,index)=>Object.keys(play.Wins)[index]+':'+h)}` );
        console.log( `${winHands.map((h,index)=>Object.keys(play.Wins)[index]+':'+h/winHands.reduce((p,n)=>p+n))}` );

    });

});