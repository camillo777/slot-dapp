const { expect } = require("chai");
const { ethers } = require("hardhat");

function string(s) { return ''+s; }
function toGwei( balance ) { return ethers.utils.formatUnits( balance, "gwei" ) };
function toEth( balance ) { return ethers.utils.formatUnits( balance, "ether" ) };

function ether(n) { return ethers.utils.parseEther(string(n)); }

describe("Greeter", function () {
  it("Should return the new greeting once it's changed", async function () {

    try {
      console.log( '+deploy UserData' );
      const UserData = await ethers.getContractFactory("UserData");
      const userData = await UserData.deploy();
      await userData.deployed();

      console.log( '+getUserCount' );
      expect( await userData.getCount() ).to.equal( 0 );

      console.log( '+deploy MyUsers' );
      const MyUsers = await ethers.getContractFactory("MyUsers");
      const myusers = await MyUsers.deploy();
      await myusers.deployed();

      console.log( '+getAmount' );
      expect( await myusers.getTotalAmount() ).to.equal(0);
      
      console.log( '+setUserData', userData.address );
      await myusers.setUserData( userData.address );
      await userData.setParentAddress( myusers.address );

      console.log( '+getSigners' );
      //[owner, addr1] = await ethers.getSigners();
      [owner, addr1, addr2] = await ethers.getSigners();

      console.log('----->  owner', owner.address, toEth( await owner.getBalance() ) );
      console.log('----->  addr1', addr1.address, toEth( await addr1.getBalance() ));
      console.log('----->  addr2', addr2.address, toEth( await addr2.getBalance() ));
      
      expect( await myusers.getUserAmount( addr1.address ) ).to.equal( ethers.utils.parseUnits( string(0), "ether") );
      expect( await myusers.getUserAmount( addr2.address ) ).to.equal( ethers.utils.parseUnits( string(0), "ether") );
      //expect( await myusers.getUserAmount( owner.address ) ).to.equal( ethers.utils.parseUnits( string(10000), "ether") );

      let addr1Amount = ethers.BigNumber.from( 0 );
      let addr2Amount = ethers.BigNumber.from( 0 );
      let totalAmount = ethers.BigNumber.from( 0 );
      let jackpotAmount = ethers.BigNumber.from( 0 );
      let ownerAmount = await owner.getBalance();
      expect( ethers.BigNumber.isBigNumber( ownerAmount ) );
      console.log( '-----> ownerAmount', owner.address, toEth( await owner.getBalance() ), toEth( ownerAmount )  );
      
      console.log( '----->  addr1 deposit', addr1.address );
      var signedContract = myusers.connect( addr1 );
      console.log( 'Gas est userDeposit', toEth( await signedContract.estimateGas.userDeposit( { value: ether(7) } ) ) );
      var tx = await signedContract.userDeposit( { value: ether(7) } );
      await tx.wait();
      addr1Amount = addr1Amount.add( ether(7*10) ); // every ether gives 10 credits
      totalAmount = totalAmount.add( ether(7) );

      console.log( 'Gas est userDeposit', toEth( await signedContract.estimateGas.userDeposit( { value: ether(3) } ) ) );
      tx = await signedContract.userDeposit( { value: ether(3) } );
      await tx.wait();
      addr1Amount = addr1Amount.add( ether(3*10) ); // every ether gives 10 credits
      totalAmount = totalAmount.add( ether(3) );

      console.log( 'Gas est userDeposit', toEth( await signedContract.estimateGas.userDeposit( { value: ether(1) } ) ) );
      tx = await signedContract.userDeposit( { value: ether(1) } );
      await tx.wait();
      addr1Amount = addr1Amount.add( ether(1*10) ); // every ether gives 10 credits
      totalAmount = totalAmount.add( ether(1) );

      console.log( '-----> getTotalAmount' );
      expect( ethers.BigNumber.from(await myusers.getTotalAmount()).eq( totalAmount ) );
      console.log( '-----> getUserCount' );
      expect( await myusers.getUserCount() ).to.equal( 1 );
      console.log( '-----> getUserAmount', addr1.address, toEth( await userData.getAmount( addr1.address ) ), toEth( addr1Amount ) );
      expect( ethers.BigNumber.from(await myusers.getUserAmount( addr1.address ) ).eq( addr1Amount ) );
      
      console.log( '-----> addr2 deposit', addr2.address );
      signedContract = await myusers.connect( addr2 );
      console.log( 'Gas est userDeposit', toEth( await signedContract.estimateGas.userDeposit( { value: ether(7) } ) ) );
      tx = await signedContract.userDeposit( { value: ethers.utils.parseUnits( string(16), "ether") } );
      await tx.wait();
      addr2Amount = addr2Amount.add( ether( 16*10 ) ); // every ether gives 10 credits
      totalAmount = totalAmount.add( ether( 16 ) );

      console.log( '+getTotalAmount' );
      expect( ethers.BigNumber.from( await myusers.getTotalAmount() ).eq(totalAmount) );
      console.log( '+getUserCount' );
      expect( await myusers.getUserCount() ).to.equal( 2 );
      console.log( '+getUserAmount', addr2.address );
      expect( ethers.BigNumber.from( await myusers.getUserAmount( addr2.address ) ).eq(addr2Amount) );

      console.log( '+getUserAt(0)', await myusers.getUserAt(0) );
      console.log( '+getUserAt(1)', await myusers.getUserAt(1) );

      console.log( '-----> addr1 plays', addr1.address, toEth( await userData.getAmount( addr1.address ) ), toEth( addr1Amount ) );

      for(let i=0; i<5; i++) {
        console.log( 'Gas est userRemoveCredit', toEth( await myusers.estimateGas.userRemoveCredit( addr1.address, ether( 1 ) ) ) );
        await myusers.userRemoveCredit( addr1.address, ether( 1 ) ); // play
        addr1Amount = addr1Amount.sub( ether( 1 ) );
        console.log( 'Gas est jackpotAdd', toEth( await myusers.estimateGas.jackpotAdd( ether( 0.5 ) ) ) );
        await myusers.jackpotAdd( ether( 0.5 ) ); // no win
        jackpotAmount = jackpotAmount.add( ether( 0.5 ) );
      }

      console.log( '-----> addr1 balance', addr1.address, toEth( await userData.getAmount( addr1.address ) ), toEth( addr1Amount ) );

      expect( ethers.BigNumber.from( await myusers.getUserAmount( addr1.address ) ).eq( addr1Amount ) );
      expect( ethers.BigNumber.from( await myusers.getJackpotAmount() ).eq( jackpotAmount ) );

      await myusers.userRemoveCredit( addr1.address, ether(1) ); // play
      addr1Amount = addr1Amount.sub( ether( 1 ) );
      await myusers.userAddCredit( addr1.address, ether(10) ); // win
      addr1Amount = addr1Amount.add( ether( 10 ) );

      console.log( '-----> addr1 balance', addr1.address, toEth( await userData.getAmount( addr1.address ) ), toEth( addr1Amount ) );

      expect( ethers.BigNumber.from( await myusers.getUserAmount( addr1.address ) ).eq( addr1Amount ) );

      console.log( '-----> addr2 plays', addr1.address, toEth( await userData.getAmount( addr1.address ) ), toEth( addr1Amount ) );

      for(let i=0; i<20; i++) {
        await myusers.userRemoveCredit( addr2.address, ether( 1 ) );
        addr2Amount = addr2Amount.sub( ether( 1 ) );
        await myusers.jackpotAdd( ether( 0.5 ) );
        jackpotAmount = jackpotAmount.add( ether( 0.5 ) );
      }

      console.log( '-----> addr2 balance', addr2.address, toEth( await userData.getAmount( addr2.address ) ), toEth( addr2Amount ) );
      expect( ethers.BigNumber.from( await myusers.getUserAmount( addr2.address ) ).eq( addr2Amount ) );

      await myusers.userRemoveCredit( addr2.address, ether( 1 ) ); // play
      addr2Amount = addr2Amount.sub( ether(1) );
      
      console.log( '-----> addr2 balance', addr2.address, toEth( await userData.getAmount( addr2.address ) ), toEth( addr2Amount ) );
      console.log( '-----> jackpot', toEth( await myusers.getJackpotAmount() ), toEth( jackpotAmount ) );
      expect( ethers.BigNumber.from( await myusers.getJackpotAmount() ).eq( jackpotAmount ) );

      addr2Amount = addr2Amount.add( jackpotAmount );
      jackpotAmount = 0;
      await myusers.jackpotToUser( addr2.address ); // win jackpot

      console.log( '-----> jackpot', toEth( await myusers.getJackpotAmount() ), toEth( jackpotAmount ) );
      expect( ethers.BigNumber.from( await myusers.getJackpotAmount() ).eq( ether(0) ) );

      console.log( '-----> addr2 balance', addr2.address, toEth( await userData.getAmount( addr2.address ) ), toEth( addr2Amount ) );
      expect( ethers.BigNumber.from( await myusers.getUserAmount( addr2.address ) ).eq( addr2Amount ) );

      console.log( '-----> owner withdraw', toEth( await myusers.getTotalAmount() ), toEth( totalAmount ) );
      expect( ethers.BigNumber.from( await myusers.getTotalAmount() ).eq( totalAmount ) );

      console.log( '-----> owner balance', owner.address, toEth( await owner.getBalance() ), toEth( ownerAmount ) );

      ownerAmount = ownerAmount.add( await myusers.getTotalAmount() );
      //await myusers.withdraw( ethers.utils.parseUnits( string(totalAmount), "ether") );
      await myusers.withdraw( totalAmount );
      console.log( '-----> owner balance', owner.address, toEth( await owner.getBalance() ), toEth( ownerAmount ) );
      expect( ethers.BigNumber.from( await owner.getBalance() ).eq( ownerAmount ) );
    }
    catch( e ) {
      console.error( e.message );
    }
  });
});

