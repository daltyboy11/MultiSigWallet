// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MultiCall is Ownable {

    error MultiCallFailed(
        address target,
        bytes payload,
        uint etherAmount
    );

    constructor() Ownable() {}

    function multiCall(
        address payable[] calldata targets,
        bytes[] calldata payloads,
        uint[] calldata etherAmounts
    )
        external
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
}
