import { ethers } from "hardhat";
import chai, { expect } from "chai";
import { solidity } from 'ethereum-waffle'
import { Signer, constants } from "ethers";
import { MiningFixture, miningFixture } from "./utils/fixtures";

chai.use(solidity)

// const setTimestamp = async (timestamp: number) =>
//     await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp]);

describe("VisionTokenEmitter.sol", function () {
    let signers: Signer[];
    let deployer: Signer
    let dev: Signer
    let deployerAddress: string
    let devAddress: string
    let fixture: MiningFixture
    beforeEach(async () => {
        signers = await ethers.getSigners()
        deployer = signers[0]
        dev = signers[1]
        deployerAddress = await deployer.getAddress()
        devAddress = await dev.getAddress()
        fixture = await miningFixture(deployer, devAddress)
    });
    it("Governance admin functions is only allowed to 'gov' address", async function () {
        fixture.visionTokenEmitter
    });
});
