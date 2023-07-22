// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Tender {
    using Counters for Counters.Counter;
    Counters.Counter private _contractCounter;
    Counters.Counter private _bidCounter;

    address public owner;

    struct Contractor {
        address contractor;
        string name;
    }

    struct Contract {
        uint contractId;
        string description;
        uint bidDeadline;
        uint bidAmount;
        uint dailyPenaltyPerThousand;
        uint maxPenaltyPercent;
        address awardedTo;
        ContractStatus contractStatus;
        uint[] bidIds;
        bool isPaid;
        uint plannedDuration;
        uint workStarted;
        uint workCompleted;
    }

    enum ContractStatus {
        Open,
        Closed,
        Awarded,
        Canceled,
        WorkInProgress,
        WorkCompleted
    }

    struct Bid {
        uint bidId;
        address contractor;
        uint amount;
        uint duration;
        uint contractId;
        BidStatus bidStatus;
    }

    enum BidStatus {
        Submitted,
        Awarded,
        Rejected,
        Withdrawn
    }

    mapping(address => Contractor) public contractors;
    mapping(uint => Contract) public contracts;
    mapping(uint => Bid) public bids;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function.");
        _;
    }

    function setOwner(address _newOwner) external onlyOwner {
        owner = _newOwner;
    }

    constructor() {
        owner = msg.sender;
    }

    event ContractorAdded(address indexed contractor, string name);
    event ContractCreated(
        uint indexed contractId,
        string description,
        uint bidDeadline,
        uint dailyPenaltyPerThousand,
        uint maxPenaltyPercent
    );
    event ContractCanceled(uint indexed contractId);
    event ContractClosed(uint indexed contractId);
    event ContractStatusChanged(
        uint indexed contractId,
        ContractStatus contractStatus
    );
    event BidCreated(
        uint indexed bidId,
        uint amount,
        uint duration,
        uint indexed contractId
    );
    event BidSubmitted(
        uint indexed bidId,
        uint indexed contractId,
        uint amount,
        uint duration
    );
    event BidWithdrawn(uint indexed bidId);
    event BidAwarded(
        uint indexed bidId,
        address indexed contractor,
        uint bidAmount
    );
    event BidderPaid(address indexed contractor, uint paymentAmount);

    function addContractor(string calldata name) external {
        require(!isContractor(msg.sender), "Contractor already exists.");
        contractors[msg.sender] = Contractor(msg.sender, name);

        emit ContractorAdded(msg.sender, contractors[msg.sender].name);
    }

    function createContract(
        string calldata description,
        uint bidDeadline,
        uint dailyPenaltyPerThousand,
        uint maxPenaltyPercent
    ) external onlyOwner {
        _contractCounter.increment();
        uint256 contractId = _contractCounter.current();

        contracts[contractId] = Contract(
            contractId,
            description,
            bidDeadline,
            0,
            dailyPenaltyPerThousand,
            maxPenaltyPercent,
            address(0),
            ContractStatus.Open,
            new uint[](0),
            false,
            0,
            0,
            0
        );
        emit ContractCreated(
            contractId,
            description,
            bidDeadline,
            dailyPenaltyPerThousand,
            maxPenaltyPercent
        );
    }

    function cancelContract(uint contractId) public onlyOwner {
        require(
            getContractStatus(contractId) != ContractStatus.Canceled,
            "Contract has already been canceled."
        );

        contracts[contractId].contractStatus = ContractStatus.Canceled;
        contracts[contractId].awardedTo = address(0);

        emit ContractCanceled(contractId);
    }

    function closeContract(uint contractId) public onlyOwner {
        require(isContract(contractId), "Contract does not exist.");
        require(
            getContractStatus(contractId) == ContractStatus.Open,
            "Contract is not open for bids."
        );
        require(
            block.timestamp > contracts[contractId].bidDeadline,
            "Bid deadline has not passed yet."
        );

        changeContractStatus(contractId, ContractStatus.Closed);

        emit ContractClosed(contractId);
    }

    function submitBid(uint amount, uint duration, uint contractId) external {
        require(isContract(contractId), "Contract does not exist.");
        require(isContractOpen(contractId), "Contract is not open.");
        require(
            !isAlreadyBiddedByContractor(contractId),
            "Only one bid can be submitted to a contract by same contractor."
        );

        _bidCounter.increment();
        uint bidId = _bidCounter.current();
        bids[bidId] = Bid(
            bidId,
            msg.sender,
            amount,
            duration,
            contractId,
            BidStatus.Submitted
        );

        Contract storage payingContract = contracts[contractId];
        payingContract.bidIds.push(bidId);

        emit BidSubmitted(bidId, contractId, amount, duration);
    }

    function withdrawBid(uint bidId) external {
        require(isContractor(msg.sender), "Contractor does not exist.");
        require(isBid(bidId), "Bid does not exist.");
        require(
            getBidStatus(bidId) == BidStatus.Submitted,
            "Only submitted bids can be withdrawn"
        );
        require(
            isContractOpen(bids[bidId].contractId),
            "You can only withdraw bids from open contracts."
        );
        require(
            bids[bidId].contractor == msg.sender,
            "Only bidder can withdraw the bid"
        );

        bids[bidId].bidStatus = BidStatus.Withdrawn;

        emit BidWithdrawn(bidId);
    }

    function awardBid(uint bidId) external onlyOwner {
        require(isBid(bidId), "Bid does not exist");
        uint contractId = bids[bidId].contractId;
        require(isContract(contractId), "Contract does not exist");
        require(
            getContractStatus(contractId) == ContractStatus.Closed,
            "Contract is not closed."
        );
        require(
            getBidStatus(bidId) == BidStatus.Submitted,
            "Only submitted bids can be awarded."
        );
        require(
            contracts[contractId].awardedTo == address(0),
            "Contract has already been awarded."
        );
        require(
            isBidSubmittedToContract(bidId, contractId),
            "Bid is not submitted to this contract."
        );

        bids[bidId].bidStatus = BidStatus.Awarded;
        contracts[contractId].awardedTo = bids[bidId].contractor;
        contracts[contractId].bidAmount = bids[bidId].amount;
        contracts[contractId].plannedDuration = bids[bidId].duration;
        contracts[contractId].contractStatus = ContractStatus.Awarded;

        emit BidAwarded(
            bids[bidId].bidId,
            bids[bidId].contractor,
            bids[bidId].amount
        );
    }

    function depositContractAmount(uint contractId) public payable onlyOwner {
        require(
            msg.value >= contracts[contractId].bidAmount,
            "Amount must be equal to or greater than bidAmount."
        );
        contracts[contractId].bidAmount = msg.value;
    }

    function startWorkInContract(uint contractId) external onlyOwner {
        require(isContract(contractId), "Contract does not exist.");
        require(
            getContractStatus(contractId) == ContractStatus.Awarded,
            "Contract is not awarded."
        );

        changeContractStatus(contractId, ContractStatus.WorkInProgress);
        contracts[contractId].workStarted = block.timestamp;
    }

    function completeWorkInContract(uint contractId) external onlyOwner {
        require(isContract(contractId), "Contract does not exist.");
        require(
            getContractStatus(contractId) == ContractStatus.WorkInProgress,
            "Contract is not marked as InProgress."
        );

        changeContractStatus(contractId, ContractStatus.WorkCompleted);
        contracts[contractId].workCompleted = block.timestamp;
    }

    function payAwardedBid(uint contractId) external onlyOwner {
        require(isContract(contractId), "Contract does not exist");
        require(
            getContractStatus(contractId) == ContractStatus.WorkCompleted,
            "Contract is not marked as WorkCompleted."
        );

        Contract storage payingContract = contracts[contractId];
        require(payingContract.isPaid == false, "Contractor is already paid.");
        require(
            isContractor(payingContract.awardedTo),
            "Contractor does not exist."
        );

        uint paymentAmount = calculatePayment(contractId);
        require(getContractBalance() >= paymentAmount);
        payable(payingContract.awardedTo).transfer(paymentAmount);
        payingContract.isPaid = true;

        emit BidderPaid(payingContract.awardedTo, paymentAmount);
    }

    function calculatePayment(uint contractId) public view returns (uint) {
        require(isContract(contractId), "Contract does not exist.");
        require(
            getContractStatus(contractId) == ContractStatus.WorkCompleted,
            "Contract is not marked as WorkCompleted."
        );
        Contract storage payingContract = contracts[contractId];

        uint workedDuration = (payingContract.workCompleted -
            payingContract.workStarted) / 86400;

        uint daysPassed = workedDuration - payingContract.plannedDuration;

        if (daysPassed <= 0) {
            return payingContract.bidAmount;
        }

        uint penaltyAmount = (payingContract.bidAmount *
            payingContract.dailyPenaltyPerThousand *
            daysPassed) / 1000;

        if (
            penaltyAmount >
            (payingContract.bidAmount * payingContract.maxPenaltyPercent) / 100
        ) {
            return
                (payingContract.bidAmount * payingContract.maxPenaltyPercent) /
                100;
        }

        return (payingContract.bidAmount - penaltyAmount);
    }

    function changeContractStatus(
        uint contractId,
        ContractStatus contractStatus
    ) internal onlyOwner {
        require(isContract(contractId), "Contract does not exist.");
        contracts[contractId].contractStatus = contractStatus;

        emit ContractStatusChanged(
            contracts[contractId].contractId,
            contracts[contractId].contractStatus
        );
    }

    function getOpenContracts() external view returns (Contract[] memory) {
        uint count = 0;
        uint length = _contractCounter.current();
        for (uint i = 1; i <= length; i++) {
            if (contracts[i].contractStatus == ContractStatus.Open) {
                count++;
            }
        }
        Contract[] memory openContracts = new Contract[](count);
        count = 0;
        for (uint i = 1; i <= length; i++) {
            if (contracts[i].contractStatus == ContractStatus.Open) {
                openContracts[count] = contracts[i];
                count++;
            }
        }
        return openContracts;
    }

    function getContracts() public view returns (Contract[] memory) {
        if (msg.sender == owner) {
            uint count = _contractCounter.current();
            Contract[] memory allContracts = new Contract[](count);
            for (uint256 i = 0; i < count; i++) {
                allContracts[i] = contracts[i+1];
            }
            return allContracts;

            } else {
            uint count = 0;
            uint length = _contractCounter.current();
            for (uint i = 0; i < length; i++) {
                if (contracts[i].awardedTo == msg.sender) {
                    count++;
                }
            }

            Contract[] memory matchingContracts = new Contract[](count);
            uint index = 0;
            for (uint i = 0; i < length; i++) {
                if (contracts[i].awardedTo == msg.sender) {
                    matchingContracts[index] = contracts[i];
                    index++;
                }
            }
            return matchingContracts;
        }
    }

    //FOR TESTING PURPOSES DELETE BEFORE DEPLOYING
    function resetContract(uint _contractId) external onlyOwner {
        require(isContract(_contractId), "Contract does not exist.");
        changeContractStatus(_contractId, ContractStatus.Open);
        contracts[_contractId].bidIds = new uint[](0);
    }

    // QUERY FUNCTIONS

    function getOwner() external view returns (address) {
        return owner;
    }

    function getContractor(
        address contractor
    ) external view returns (Contractor memory) {
        return contractors[contractor];
    }

    function getContract(
        uint contractId
    ) external view returns (Contract memory) {
        require(isContract(contractId), "Contract does not exist.");
        return contracts[contractId];
    }

    function getBid(uint bidId) external view returns (Bid memory) {
        require(isBid(bidId), "Bid does not exist.");
        return bids[bidId];
    }

    function getContractStatus(
        uint contractId
    ) private view returns (ContractStatus) {
        require(isContract(contractId), "Contract does not exist.");
        return contracts[contractId].contractStatus;
    }

    function getBidStatus(uint bidId) private view returns (BidStatus) {
        require(isBid(bidId), "Bid does not exist.");
        return bids[bidId].bidStatus;
    }

    function getBidsOfContract(
        uint contractId
    ) public view returns (uint[] memory) {
        require(isContract(contractId), "Contract does not exist.");

        return contracts[contractId].bidIds;
    }

    function getContractBalance() public view returns (uint) {
        return address(this).balance;
    }

    function isContractor(address contractor) private view returns (bool) {
        return contractors[contractor].contractor != address(0);
    }

    function isContract(uint contractId) private view returns (bool) {
        return contracts[contractId].contractId != 0;
    }

    function isBid(uint _bidId) private view returns (bool) {
        return bids[_bidId].bidId != 0;
    }

    function isContractOpen(uint _contractId) private view returns (bool) {
        require(isContract(_contractId), "Contract does not exist.");
        return contracts[_contractId].contractStatus == ContractStatus.Open;
    }

    function isBidSubmittedToContract(
        uint _bidId,
        uint _contractId
    ) public view returns (bool) {
        require(isBid(_bidId), "Bid does not exist.");
        require(isContract(_contractId), "Contract does not exist.");
        for (uint i = 0; i < contracts[_contractId].bidIds.length; i++) {
            if (contracts[_contractId].bidIds[i] == _bidId) {
                return true;
            }
        }
        return false;
    }

    function isAlreadyBiddedByContractor(
        uint _contractId
    ) public view returns (bool) {
        require(isContractor(msg.sender), "Contractor does not exist.");
        require(isContract(_contractId), "Contract does not exist.");
        uint[] memory bidsOfContract = getBidsOfContract(_contractId);
        for (uint i = 0; i < bidsOfContract.length; i++) {
            uint bidId = bidsOfContract[i];
            if (bids[bidId].contractor == msg.sender) {
                return true;
            }
        }
        return false;
    }
}
