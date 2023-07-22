const Tender = artifacts.require("Tender");
const { time } = require('@openzeppelin/test-helpers');


contract("Tender", (accounts) => {
    const owner = accounts[0];
    const contractor1 = accounts[1];

    before(async () => {
        instance = await Tender.deployed()
    })

    describe("Add contractor", () => {
        it("Contractor signs up", async () => {
            await instance.addContractor("Contractor 1", { from: contractor1 })
            const contractor = await instance.getContractor(contractor1)
            assert.equal(contractor.name, "Contractor 1", "The contractor's name should be Contractor 1.")
        });
    });

    describe("Create, cancel and close the contract", () => {
        it("creates a contract", async () => {
            const contractDescription = "Sample Contract";
            const bidDeadline = Math.floor(Date.now()/1000 - 3600);
            const dailyPenaltyPerThousand = 1;
            const maxPenaltyPercent = 5;

            await instance.createContract(contractDescription, bidDeadline, dailyPenaltyPerThousand, maxPenaltyPercent, { from: owner });

            const contract = await instance.getContract(1, {from:owner});
            assert.equal(contract.contractId, 1, "Contract ID does not match");
            assert.equal(contract.description, contractDescription, "Contract description does not match");
            assert.equal(contract.bidDeadline, bidDeadline, "Bid deadline does not match");
            assert.equal(contract.awardedTo, "0x0000000000000000000000000000000000000000", "Contract should not be awarded yet");
            assert.equal(contract.contractStatus, 0, "Contract status should be open");
            assert.equal(contract.dailyPenaltyPerThousand, 1, "Daily penalty percentage does not match");
            assert.equal(contract.maxPenaltyPercent, 5, "Max penalty percentage does not match");
            assert.equal(contract.isPaid, false, "It should be false");
            assert.equal(contract.workStarted, 0, "It should be 0");
            assert.equal(contract.workCompleted, 0, "It should be 0");
            assert.equal(contract.plannedDuration, 0, "Planned duration should be 0");        
        });
        it("cancels a contract", async () =>  {
            await instance.cancelContract(1, {from:owner});
            const contract = await instance.getContract(1, {from:owner});
            assert.equal(contract.contractStatus, 3, "Contract status should be canceled");
            assert.equal(contract.awardedTo, "0x0000000000000000000000000000000000000000", "Contract should not be awarded");
        });
        it("closes a contract", async () => {
            await instance.resetContract(1);
            await instance.closeContract(1);
            const contract = await instance.getContract(1);
            assert.equal(contract.contractStatus, 1, "Contract status should be closed");
        });        
    });
    describe("Submit, withdraw and award bid", () => {
        it("submits a bid", async () => {
            await instance.resetContract(1);
            await instance.submitBid(1000, 100, 1, {from:contractor1});
            const bid = await instance.getBid(1);
            const contract = await instance.getContract(1);
            assert.equal(bid.bidId, 1, "BidId does not match");
            assert.equal(bid.amount, 1000, "Bid amount does not match");
            assert.equal(bid.duration, 100, "Bid duration does not match");
            assert.equal(bid.contractId, 1, "Bid contract does not match");
            assert.equal(bid.bidStatus, 0, "Bid status should be submitted");
            const isBidSubmittedToContract = await instance.isBidSubmittedToContract(1,1);
            assert.equal(isBidSubmittedToContract, true, "Bid should be in contract's bids");
        })
        it("withdraws a bid", async () => {
            await instance.withdrawBid(1, {from:contractor1});
            const bid = await instance.getBid(1);
            assert.equal(bid.bidStatus, 3, "Bid status is not withdrawn");
        })
        it("awards bid", async () => {
            await instance.resetContract(1);
            await instance.submitBid(1000, 100, 1, {from:contractor1});
            const bid = await instance.getBid(2);
            assert.equal(bid.amount, 1000, "Bid amount should be 1000");
            assert.equal(bid.duration, 100, "Bid duration should be 100");
            await instance.closeContract(1);
            await instance.awardBid(2);
            const awardedBid = await instance.getBid(2);
            const contract = await instance.getContract(1);
            assert.equal(awardedBid.bidStatus, 1, "Bid status should be awarded");
            assert.equal(contract.contractStatus, 2, "Contract status should be awarded");
            assert.equal(contract.awardedTo, contractor1, "Contract sbould be awarded to contractor");
            assert.equal(contract.bidAmount, bid.amount, "Contract bidamount and bid amount should be equal");
            assert.equal(contract.plannedDuration, 100, "Contract's plannedDuration should be equal to bid duration");
        })
        it("deposits contract amount", async () => {
            await instance.depositContractAmount(1, {value: 1000});
            const balance = await instance.getContractBalance();
            assert.equal(balance, 1000, "Balance does not match");
        })
    });
    describe("Complete work and pay the bidder", () => {
        it("starts the work", async () => {
            await instance.startWorkInContract(1);
            const contract = await instance.getContract(1);
            assert.equal(contract.contractStatus, 4, "Contract status should be WorkInProgress");
        })
        it("completes the work", async () => {
            await time.increase(time.duration.days(110));
            await instance.completeWorkInContract(1);
            const contract = await instance.getContract(1);
            assert.equal(contract.contractStatus, 5, "Contract status should be WorkCompleted");
            assert.equal((contract.workCompleted-contract.workStarted),9504000, "The work should be completed in 110 days");
        })
        it("calculates payment ", async () => {
            const amount = await instance.calculatePayment(1);
            assert.equal(amount.toNumber(), 990, "Amount does not match");
        })
        it("pays the bidder", async () => {
            const initialBalance = await instance.getContractBalance();
            assert.equal(initialBalance, 1000, "Balance does not match");
            await instance.payAwardedBid(1);
            const contract = await instance.getContract(1);
            assert.equal(contract.isPaid, true, "It should be paid");
            const finalBalance = await instance.getContractBalance();
            assert.equal(finalBalance, 10, "Balance does not match");
        })
    });
    describe("get contracts",()=>{
        it("adds some ocntracts", async() => {
            const contractDescription = "2nd Contract";
            const bidDeadline = Math.floor(Date.now()/1000 - 3600);
            const dailyPenaltyPerThousand = 1;
            const maxPenaltyPercent = 5;
            await instance.createContract(contractDescription, bidDeadline, dailyPenaltyPerThousand, maxPenaltyPercent, { from: owner });
        });
         it("gets open contracts", async() => {
            const openContracts = await instance.getOpenContracts({from:contractor1});
            console.log(openContracts);
        });
        it("gets the contract awarded to contractor", async () => {
            const someContracts = await instance.getContracts({from:contractor1});
            console.log(someContracts);
        });
        it("gets the all the contracts", async () => {
            const allContracts = await instance.getContracts({from:owner});
            console.log(allContracts);
        });
    })
});