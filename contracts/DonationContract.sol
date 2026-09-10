// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract DonationContract88 {
    address public owner;
    address public targetWallet;
    uint256 public targetAmount;
    uint256 public withdrawAmount;
    uint256 public deadline;
    uint256 public totalDonations;
    mapping(address => uint256) public donationList;

    event Donate(address indexed sender, uint256 value, uint256 contractBalance);
    event Withdraw(address indexed owner, uint256 value);
    event AutoWithdraw(address indexed targetWallet, uint256 value, uint256 contractBalance);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can access this function");
        _;
    }

    modifier beforeDeadline() {
        require(block.timestamp <= deadline, "Donation period has ended");
        _;
    }

    constructor(address _targetWallet, uint256 _targetAmountInEther, uint256 _withdrawAmountInEther, uint256 _durationInDays) {
        owner = msg.sender;
        targetWallet = _targetWallet;
        targetAmount = _targetAmountInEther * 1 ether;  // 直接使用Wei
        withdrawAmount = _withdrawAmountInEther * 1 ether;  // 直接使用Wei
        deadline = block.timestamp + (_durationInDays * 1 days);
        totalDonations = 0;
    }

    receive() external payable {
        donate();
    }

    fallback() external payable {
        donate();
    }

    // 收捐款
    function donate() public payable beforeDeadline {
        require(msg.value > 0, "Donation amount must be greater than zero");

        uint256 amountToDonate = msg.value;

        // 如果捐款將超過目標金額，只接受達到目標金額的部分
        if (totalDonations + amountToDonate > targetAmount) {
            amountToDonate = targetAmount - totalDonations;
            // 退還超出的部分
            uint256 refundAmount = msg.value - amountToDonate;
            if (refundAmount > 0) {
                payable(msg.sender).transfer(refundAmount);
            }
        }

        donationList[msg.sender] += amountToDonate;
        totalDonations += amountToDonate;
        emit Donate(msg.sender, amountToDonate, address(this).balance);

        // 檢查是否達到轉帳金額
        if (totalDonations >= withdrawAmount && totalDonations < targetAmount) {
            autoWithdraw(withdrawAmount);
            withdrawAmount = targetAmount + 1; // 確保只執行一次自動轉帳
        }

        // 檢查是否達到目標金額
        if (totalDonations >= targetAmount) {
            autoWithdraw(address(this).balance);
        }
    }

    // 查看捐款歷史
    function getHistory() public view returns (uint256) {
        return donationList[msg.sender];
    }

    // 提領餘額
    function withdraw() public onlyOwner {
        address payable receiver = payable(owner);
        uint256 value = address(this).balance;
        require(value > 0, "No funds to withdraw");
        receiver.transfer(value);
        emit Withdraw(receiver, value);
    }

    // 自動轉帳
    function autoWithdraw(uint256 amount) internal {
        address payable receiver = payable(targetWallet);
        uint256 value = amount;
        require(value > 0, "No funds to transfer");
        receiver.transfer(value);
        emit AutoWithdraw(receiver, value, address(this).balance);
    }
}
