// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  // We get the contract to deploy
  const UserData = await hre.ethers.getContractFactory("UserData");
  const userData = await UserData.deploy();
  await userData.deployed();
  console.log("UserData deployed to:", userData.address);

  const MyUsers = await hre.ethers.getContractFactory("MyUsers");
  const myusers = await MyUsers.deploy();
  await myusers.deployed();
  await myusers.setUserData( userData.address );
  await userData.setParentAddress( myusers.address );
  console.log("MyUsers deployed to:", myusers.address);
/*
  [owner, addr1] = hre.ethers.getSigners();
  console.log(addr1);
  const amount = myusers.getUserAmount( addr1.address );
  console.log( 'getUserAmount', addr1.address, amount );
*/
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
