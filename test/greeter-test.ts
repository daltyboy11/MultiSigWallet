import { expect } from "chai";
import { deployContract } from "ethereum-waffle";
import { ethers } from "hardhat";
import GreeterArtifact from "../artifacts/contracts/Greeter.sol/Greeter.json";
import { Greeter } from "../typechain/Greeter";

describe("Greeter", function () {
  let greeter: Greeter

  this.beforeEach(async () => {
    const signers = await ethers.getSigners();
    greeter = (await deployContract(signers[0], GreeterArtifact, ["Hello, World!"])) as Greeter;
  })

  it("Should return the new greeting once it's changed", async function () {
    expect(await greeter.greet()).to.equal("Hello, World!");
    const tx = await greeter.setGreeting("Hola, mundo!");
    await tx.wait();
    expect(await greeter.greet()).to.equal("Hola, mundo!");
  });
});
