// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./MultiSigWallet.sol";

contract MultiCall is Ownable {

    error MultiCallFailed(
        address target,
        bytes payload,
        uint etherAmount
    );

    constructor() Ownable() {}

    /// @notice Perform multiple calls one after another. Call `i` is sent
    /// to address `targets[i]` with calldata `payloads[i]` and ether amount
    /// `etherAmounts[i]`. The transaction fails if any call reverts.
    ///
    /// @param targets addresses to call
    /// @param payloads calldata for each call
    /// @param etherAmounts amount of ether to send with each call
    /// @return results array where `results[i]` is the result of call `i`
    function multiCall(
        address payable[] memory targets,
        bytes[] memory payloads,
        uint[] memory etherAmounts
    )
        public
        payable
        returns (bytes[] memory results)
    {
        uint n = targets.length;
        require(payloads.length == n);
        require(etherAmounts.length == n);

        results = new bytes[](payloads.length);

        for (uint i; i < payloads.length; i++) {
            (bool ok, bytes memory res) = targets[i].call{value: etherAmounts[i]}(payloads[i]);
            if (!ok) {
                revert MultiCallFailed(targets[i], payloads[i], etherAmounts[i]);
            }
            results[i] = res;
        }
    }

    function submitAndConfirm(
        address payable multiSigAddress,
        address txRecipient,
        uint txValue,
        bytes memory txData
    ) external {
        // If we have access to the contract code we can get the selector directly from the contract object
        bytes4 submitSelector = MultiSigWallet.submitTransaction.selector;
        bytes memory submitPayload = abi.encodeWithSelector(submitSelector, txRecipient, txValue, txData);

        // If we don't have access to the contract we can derive the selector from the function prototype
        bytes4 confirmSelector = bytes4(keccak256("confirmTransaction(uint256)"));
        bytes memory confirmPayload = abi.encodeWithSelector(confirmSelector, 0);

        address payable[] memory targets = new address payable[](2);
        targets[0] = multiSigAddress;
        targets[1] = multiSigAddress;

        bytes[] memory payloads = new bytes[](2);
        payloads[0] = submitPayload;
        payloads[1] = confirmPayload;

        uint[] memory ethAmounts = new uint[](2);

        multiCall(targets, payloads, ethAmounts);
    }
}
