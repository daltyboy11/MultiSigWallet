import { expect } from "chai";
import { deployContract } from "ethereum-waffle";
import { Signer } from "ethers";
import { ethers } from "hardhat";
import MultiSigWalletArtifact from "../artifacts/contracts/MultiSigWallet.sol/MultiSigWallet.json";
import { MultiSigWallet } from "../typechain/MultiSigWallet";

describe("MultiSigWallet", () => {
    let multiSigWallet: MultiSigWallet;
    let signers: Array<Signer>

    beforeEach(async () => {
        signers = await ethers.getSigners();
        // Will be a 2 of 3 multisig
        const args = [
            [
                await signers[0].getAddress(),
                await signers[1].getAddress(),
                await signers[2].getAddress()
            ],
            2
        ];
        multiSigWallet = (await deployContract(
            signers[0],
            MultiSigWalletArtifact,
            args
        )) as MultiSigWallet;
    });

    describe("receive", () => {
        it("should emit Deposit event", async () => {
            const tx = signers[0].sendTransaction({
                to: multiSigWallet.address,
                value: ethers.utils.parseEther("25")
            });
            await expect(tx).to.emit(multiSigWallet, "Deposit").withArgs(
                await signers[0].getAddress(),
                ethers.utils.parseEther("25"),
                ethers.utils.parseEther("25"),
            );
        });
    });

    describe("submitTransaction", () => {
        it.only("should submit transaction from owner", async () => {
            const numTxsBefore = await multiSigWallet.getTransactionCount();

            // Submit a proposal to send 5 ether to signer1's address
            const tx = await multiSigWallet.connect(signers[0]).submitTransaction(
                await signers[1].getAddress(),
                ethers.utils.parseEther("5"),
                "0x00",
            );
            await tx.wait();

            const numTxsAfter = await multiSigWallet.getTransactionCount();
            expect(numTxsAfter).to.equal(numTxsBefore.add(1));

            const transaction = await multiSigWallet.getTransaction(0);
            console.log(transaction);
            expect(transaction.to).to.equal(await signers[1].getAddress()); 
            expect(transaction.value).to.equal(ethers.utils.parseEther("5"));
            expect(transaction.data).to.equal("0x00"); 
            expect(transaction.executed).to.be.false;
            expect(transaction.numConfirmations).to.equal(0);
        });

        it("should revert for non-owner", async () => {

        });
    });

    describe("confirmTransaction", () => {
        it("should revert for non-owner", async () => {

        });

        it("should revert for idx out of bounds", async () => {

        });

        it("should revert if owner already confirmed", async () => {

        });

        it("should revert if transaction already executed", async () => {

        });

        it("should accept for owner who hasn't confirmed yet", async () => {

        });
    });
});