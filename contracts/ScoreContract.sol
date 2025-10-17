// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ScoreContract {
    // Struct to store user score data
    struct UserScore {
        uint256 score;
        string playerName;
        string userPfp;
        uint256 fid;
        uint256 timestamp;
        bool exists;
    }

    // Mapping to store scores by user address
    mapping(address => UserScore) public userScores;
    
    // Array to store all user addresses for easy retrieval
    address[] public allUsers;
    
    // Mapping to track if address is already in allUsers array
    mapping(address => bool) public isUserRegistered;
    
    // Events
    event ScoreSaved(
        address indexed user,
        uint256 score,
        string playerName,
        string userPfp,
        uint256 fid,
        uint256 timestamp
    );
    
    event ScoreUpdated(
        address indexed user,
        uint256 oldScore,
        uint256 newScore,
        uint256 timestamp
    );

    // Owner of the contract
    address public owner;
    
    // Modifier to restrict access to owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Save or update user score
     * @param _score The score to save
     * @param _playerName The player's name
     * @param _userPfp The player's profile picture URL
     * @param _fid The Farcaster ID
     */
    function saveScore(
        uint256 _score,
        string memory _playerName,
        string memory _userPfp,
        uint256 _fid
    ) external {
        require(_score > 0, "Score must be greater than 0");
        require(bytes(_playerName).length > 0, "Player name cannot be empty");
        
        UserScore storage userScore = userScores[msg.sender];
        
        if (userScore.exists) {
            // User already has a score, check if new score is higher
            if (_score > userScore.score) {
                uint256 oldScore = userScore.score;
                userScore.score = _score;
                userScore.playerName = _playerName;
                userScore.userPfp = _userPfp;
                userScore.fid = _fid;
                userScore.timestamp = block.timestamp;
                
                emit ScoreUpdated(msg.sender, oldScore, _score, block.timestamp);
            }
            // If new score is not higher, do nothing (keep existing score)
        } else {
            // New user, save their score
            userScore.score = _score;
            userScore.playerName = _playerName;
            userScore.userPfp = _userPfp;
            userScore.fid = _fid;
            userScore.timestamp = block.timestamp;
            userScore.exists = true;
            
            // Add to allUsers array if not already registered
            if (!isUserRegistered[msg.sender]) {
                allUsers.push(msg.sender);
                isUserRegistered[msg.sender] = true;
            }
            
            emit ScoreSaved(msg.sender, _score, _playerName, _userPfp, _fid, block.timestamp);
        }
    }

    /**
     * @dev Get score data for a specific user
     * @param _user The user's address
     * @return UserScore struct containing all user data
     */
    function getUserScore(address _user) external view returns (UserScore memory) {
        return userScores[_user];
    }

    /**
     * @dev Get score data for the caller
     * @return UserScore struct containing caller's data
     */
    function getMyScore() external view returns (UserScore memory) {
        return userScores[msg.sender];
    }

    /**
     * @dev Retrieve all users' score data
     * @return Array of UserScore structs for all users
     */
    function retrieveAllScores() external view returns (UserScore[] memory) {
        UserScore[] memory allScores = new UserScore[](allUsers.length);
        
        for (uint256 i = 0; i < allUsers.length; i++) {
            allScores[i] = userScores[allUsers[i]];
        }
        
        return allScores;
    }

    /**
     * @dev Retrieve all users' addresses
     * @return Array of all user addresses
     */
    function getAllUsers() external view returns (address[] memory) {
        return allUsers;
    }

    /**
     * @dev Get total number of users
     * @return Number of users who have saved scores
     */
    function getTotalUsers() external view returns (uint256) {
        return allUsers.length;
    }

    /**
     * @dev Get top N scores (sorted by score descending)
     * @param _limit Maximum number of top scores to return
     * @return Array of UserScore structs sorted by score
     */
    function getTopScores(uint256 _limit) external view returns (UserScore[] memory) {
        require(_limit > 0, "Limit must be greater than 0");
        
        uint256 totalUsers = allUsers.length;
        if (totalUsers == 0) {
            return new UserScore[](0);
        }
        
        // Create array of all scores with addresses
        struct ScoreWithAddress {
            address user;
            UserScore score;
        }
        
        ScoreWithAddress[] memory scoresWithAddress = new ScoreWithAddress[](totalUsers);
        
        for (uint256 i = 0; i < totalUsers; i++) {
            scoresWithAddress[i] = ScoreWithAddress({
                user: allUsers[i],
                score: userScores[allUsers[i]]
            });
        }
        
        // Simple bubble sort by score (descending)
        for (uint256 i = 0; i < totalUsers - 1; i++) {
            for (uint256 j = 0; j < totalUsers - i - 1; j++) {
                if (scoresWithAddress[j].score.score < scoresWithAddress[j + 1].score.score) {
                    ScoreWithAddress memory temp = scoresWithAddress[j];
                    scoresWithAddress[j] = scoresWithAddress[j + 1];
                    scoresWithAddress[j + 1] = temp;
                }
            }
        }
        
        // Return top N scores
        uint256 returnLength = _limit < totalUsers ? _limit : totalUsers;
        UserScore[] memory topScores = new UserScore[](returnLength);
        
        for (uint256 i = 0; i < returnLength; i++) {
            topScores[i] = scoresWithAddress[i].score;
        }
        
        return topScores;
    }

    /**
     * @dev Check if a user has a saved score
     * @param _user The user's address
     * @return True if user has a saved score, false otherwise
     */
    function hasScore(address _user) external view returns (bool) {
        return userScores[_user].exists;
    }

    /**
     * @dev Get contract statistics
     * @return totalUsers Total number of users
     * @return totalScores Total number of scores saved
     */
    function getContractStats() external view returns (uint256 totalUsers, uint256 totalScores) {
        totalUsers = allUsers.length;
        totalScores = allUsers.length; // Same as totalUsers since each user has one score
    }

    /**
     * @dev Emergency function to withdraw any ETH sent to contract (owner only)
     */
    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    /**
     * @dev Function to receive ETH
     */
    receive() external payable {}
}
