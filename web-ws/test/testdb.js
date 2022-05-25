import assert from 'assert';

import { ethers } from 'ethers'
import { Users } from '../public/scripts/users.js'
import play from '../public/scripts/play.js'

const USERADDR1 = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92211'
const USERADDR2 = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92222'
const USERADDR3 = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92233'

describe('TestDB', async function() {
        
    it('number of users must be 3', async function() {
        const users = new Users( './db/test-users.json' );
        await users.init();
        await users.add( USERADDR1 );
        await users.add( USERADDR2 );
        await users.add( USERADDR3 );
        assert.equal( users.getCount(), 3 );
        var user = await users.getUserByAddress( USERADDR1 );
        assert.notEqual( user, null );
        console.log( `user:${user}` );
        var _userAmount = await users.getUserAmount( user.id );
        console.log( _userAmount );
        await users.addUserAmount( user.id, ethers.BigNumber.from(10) )
        _userAmount = _userAmount.add( ethers.BigNumber.from(10) );
        await users.addUserAmount( user.id, ethers.BigNumber.from(7) )
        _userAmount = _userAmount.add( ethers.BigNumber.from(7) );
        await users.addUserAmount( user.id, ethers.BigNumber.from(1) )
        _userAmount = _userAmount.add( ethers.BigNumber.from(1) );
        var userAmount = await users.getUserAmount( user.id )
        console.log( userAmount, _userAmount );
        assert( ethers.BigNumber.isBigNumber( userAmount ), 'not big number' )
        assert( userAmount.eq( _userAmount ), 'not equals' );

        var user2 = await users.getUserByAddress( USERADDR2 );
        var userAmount2 = await users.getUserAmount( user2.id );
        assert( ethers.BigNumber.isBigNumber( userAmount2 ), 'not big number' )
        if ( !(userAmount2.eq( ethers.BigNumber.from(0)) ) ){
            console.log('Remove user amount');
            await users.removeUserAmount( user2.id, userAmount2 )
            assert( (await users.getUserAmount( user2.id )).eq( ethers.BigNumber.from(0) ) )
        }

        await users.addUserAmount( user2.id, ethers.BigNumber.from(10) )

        let winHands = [0,0,0,0,0,0,0,0,0]

        for(let i=0; i<100000; i++) {
            if ( (await users.getUserAmount( user2.id )).lt( ethers.BigNumber.from(1)) ) {
                console.log(`Busted at ${i}`);
                return;
            }
            await users.removeUserAmount( user2.id, ethers.BigNumber.from(1) )
            let numbers = play.getLuckyNumbers();
            let hand = play.checkWin( numbers );
            winHands[hand] += 1;
            let money = 0;
            if (hand != play.Wins.none) {
                money = play.getMoneyForWin( hand );
                users.addUserAmount( user2.id, ethers.BigNumber.from( money ) );
            }
        }

        var userAmount2 = await users.getUserAmount( user2.id );
        console.log( `Resulting amount: ${userAmount2}` );
        console.log( `${winHands.map((h,index)=>Object.keys(play.Wins)[index]+':'+h)}` );
        console.log( `${winHands.map((h,index)=>Object.keys(play.Wins)[index]+':'+h/winHands.reduce((p,n)=>p+n))}` );

    });

});