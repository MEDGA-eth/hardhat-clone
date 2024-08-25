const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("MyToken", function () {
  async function deployMyTokenFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Contract = await ethers.getContractFactory("MyToken");
    const contract = await Contract.deploy();

    return { contract, owner };
  }

  it("deposit and get my balance", async function () {
    const { contract, owner } = await loadFixture(deployMyTokenFixture);

    await contract.deposit({ value: 1_000_000 });
    expect(await contract.getMyBalance()).to.gt(0);
  });
});
