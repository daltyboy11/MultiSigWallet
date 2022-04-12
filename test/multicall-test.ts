import { expect } from "chai";
import { deployContract } from "ethereum-waffle";
import { Signer } from "ethers";
import { ethers } from "hardhat";
import MultiSigWalletArtifact from "../artifacts/contracts/MultiSigWallet.sol/MultiSigWallet.json";
import { MultiSigWallet } from "../typechain/MultiSigWallet";
import MuticallArtifact from "../artifacts/contracts/Multicall.sol/MultiCall.json";
import { MultiCall } from "../typechain/MultiCall";
import { Interface } from "ethers/lib/utils";

describe("Multicall", () => {
    let multiSigWallet: MultiSigWallet
    let multiCall: MultiCall
    let signers: Array<Signer>
    const iface = new Interface([
        "function submitTransaction(address _to, uint _value, bytes memory _data)",
        "function confirmTransaction(uint _txIndex)",
        "function executeTransaction(uint _txIndex)",
    ]);

    // Deploy 2/3 multisig where one owner is the multiCall contract
    const deployMultiSig = async () => {
        const args = [
            [multiCall.address, await signers[1].getAddress(), await signers[2].getAddress()],
            2
        ];
        multiSigWallet = (await deployContract(signers[1], MultiSigWalletArtifact, args)) as MultiSigWallet;
    }

    beforeEach(async () => {
        signers = await ethers.getSigners();
        multiCall = (await deployContract(signers[0], MuticallArtifact)) as MultiCall;
        await deployMultiSig();
    })

    describe.only("when building payloads in Solidity", () => {
        it("should submit and confirm in a single transaction", async () => {
            await multiCall.submitAndConfirm(
                multiSigWallet.address,
                await signers[3].getAddress(),
                ethers.utils.parseEther("5.0"),
                "0x00"
            );
            const transaction = await multiSigWallet.getTransaction(0);
            expect(transaction.numConfirmations).to.equal(1);
        });
    });

    describe("when building payloads in ethers.js", () => {
        it("should submit and confirm in a single transaction", async () => {
            const encodeSubmitData = iface.encodeFunctionData("submitTransaction", [
                await signers[3].getAddress(),
                ethers.utils.parseEther("5.0"),
                "0x00",
            ]);
            const encodeConfirmData = iface.encodeFunctionData("confirmTransaction", [0]);
            const tx = await multiCall.connect(signers[0]).multiCall(
                [multiSigWallet.address, multiSigWallet.address],
                [encodeSubmitData, encodeConfirmData],
                [0, 0]
            );
            await tx.wait();
    
            const transaction = await multiSigWallet.getTransaction(0);
            expect(transaction.numConfirmations).to.equal(1);
        });
    
        it("should confirm and execute in a single transaction", async () => {
            // Signer1 will submit and confirm the transaction
            await multiSigWallet.connect(signers[1]).submitTransaction(
                await signers[3].getAddress(),
                ethers.utils.parseEther("5.0"),
                "0x00",
            );
            signers[0].sendTransaction({
                to: multiSigWallet.address,
                value: ethers.utils.parseEther("25")
            });
            await multiSigWallet.connect(signers[1]).confirmTransaction(0);
    
            // Now signer 2 can use the multiCall contract to confirm
            // and execute in a single transaction
            const encodeConfirmData = iface.encodeFunctionData("confirmTransaction", [0]);
            const encodeExecuteData = iface.encodeFunctionData("executeTransaction", [0]);
            const tx = await multiCall.connect(signers[0]).multiCall(
                [multiSigWallet.address, multiSigWallet.address],
                [encodeConfirmData, encodeExecuteData],
                [0, 0]
            );
            await tx.wait();
    
            const transaction = await multiSigWallet.getTransaction(0);
            expect(transaction.numConfirmations).to.equal(2);
            expect(transaction.executed).to.be.true
        });
    })
});
