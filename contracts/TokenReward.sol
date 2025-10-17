// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract TokenReward is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    // Events
    event TokenRewardClaimed(
        address indexed user,
        address indexed token,
        uint256 amount,
        bytes32 indexed claimId
    );

    // State variables
    mapping(address => bool) public hasClaimed;
    mapping(bytes32 => bool) public usedClaimIds;
    address public signer;

    // Constructor
    constructor(address _signer) {
        signer = _signer;
    }

    // Function to claim token reward with signature
    function claimTokenReward(
        address token,
        uint256 amount,
        bytes calldata signature
    ) external nonReentrant {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        require(!hasClaimed[msg.sender], "Already claimed");

        // Create claim ID
        bytes32 claimId = keccak256(abi.encodePacked(msg.sender, token, amount, block.timestamp));
        require(!usedClaimIds[claimId], "Claim ID already used");

        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, token, amount));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address recoveredSigner = ethSignedMessageHash.recover(signature);
        require(recoveredSigner == signer, "Invalid signature");

        // Mark as claimed
        hasClaimed[msg.sender] = true;
        usedClaimIds[claimId] = true;

        // Transfer tokens
        IERC20(token).safeTransfer(msg.sender, amount);

        emit TokenRewardClaimed(msg.sender, token, amount, claimId);
    }

    // Function to claim token reward without signature (for testing)
    function claimTokenReward(
        address token,
        uint256 amount
    ) external nonReentrant {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        require(!hasClaimed[msg.sender], "Already claimed");

        // Mark as claimed
        hasClaimed[msg.sender] = true;

        // Transfer tokens
        IERC20(token).safeTransfer(msg.sender, amount);

        emit TokenRewardClaimed(msg.sender, token, amount, bytes32(0));
    }

    // Function to deposit tokens into the contract
    function depositTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }

    // Function to withdraw tokens (emergency only)
    function withdrawTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(msg.sender, amount);
    }

    // Function to update signer
    function updateSigner(address _signer) external onlyOwner {
        signer = _signer;
    }

    // Function to check token balance
    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    // Function to reset claim status (for testing)
    function resetClaimStatus(address user) external onlyOwner {
        hasClaimed[user] = false;
    }
}

