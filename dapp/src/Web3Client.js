import Web3 from "web3";
import TenderABI from "./ABI/Tender.json"

let selectedAccount;
let tenderContract;
let isInitialized = false;
let tenderContractAddress = "0x70cbc711cf7c5D8B57d6d2816df9eF6018D9e787";

export const init = async () => {
    let provider = window.ethereum;

    if (typeof provider !== "undefined") {
        provider
            .request({method: "eth_requestAccounts"})
            .then((accounts) => {
                selectedAccount = accounts[0];
            })
            .catch((err) => {
                console.log(err);
                return;
            })
    }

    window.ethereum.on("accountChanged", function(accounts) {
        selectedAccount = accounts[0];
    });

    const web3 = new Web3(provider);
    const networkId = await web3.eth.net.getId();
    tenderContract = new web3.eth.Contract(TenderABI.abi, tenderContractAddress);

    isInitialized = true;
};

export const getUserAddress = async() => {
    if(!isInitialized) {
        await init();
    }
    return selectedAccount;
};

// Contract execute functions

export const setOwner = async(newOwner) => {
    if(!isInitialized) {
        await init();
    }
    try {
        let res = await tenderContract.methods.setOwner(newOwner.toLowerCase()).send({from:selectedAccount});
        return res;
    } catch(err) {
        console.error(err);
    }
};

export const register = async (name) => {
    if(!isInitialized) {
        await init();
    }
    try {
        console.log("Registerin account...")
        let res = await tenderContract.methods.addContractor(name).send({from:selectedAccount});
        return res;
    } catch(err) {
        console.error(err);
    }
};

export const createContract = async (description, bidDeadline, dailyPenaltyPerThousand,maxPenaltyPercent) => {
    if(!isInitialized) {
        await init();
    }
    try {
        let res = await tenderContract.methods.createContract(description, bidDeadline, dailyPenaltyPerThousand,maxPenaltyPercent).send({from:selectedAccount});
        return res;
    } catch(err) {console.error(err);}
};

export const cancelContract = async (contractId) => {
    if(!isInitialized) {
        await init();
    }
    try {
        let res = await tenderContract.methods.cancelContract(contractId).send({from:selectedAccount});
        return res;
    } catch(err) {console.error(err);}
};

export const closeContract = async (contractId) => {
    if(!isInitialized) {
        await init();
    }
    try {
        let res = await tenderContract.methods.closeContract(contractId).send({from:selectedAccount});
        return res;
    } catch(err) {console.error(err);}
};

export const submitBid = async (amount, duration, contractId) => {
    if(!isInitialized) {
        await init();
    }
    try {
        let res = await tenderContract.methods.submitBid(amount, duration, contractId).send({from:selectedAccount});
        return res;
    } catch(err) {console.error(err);}
}; 

export const withdrawBid = async (bidId) => {
    if(!isInitialized) {
        await init();
    }
    try {
        let res = await tenderContract.methods.withdrawBid(bidId).send({from:selectedAccount});
        return res;
    } catch(err) {console.error(err);}
};

export const awardBid = async (bidId) => {
    if(!isInitialized) {
        await init();
    }
    try {
        let res = await tenderContract.methods.awardBid(bidId).send({from:selectedAccount});
        return res;
    } catch(err) {console.error(err);}
};


// Contract query functions

export const getOwner = async() => {
    if(!isInitialized) {
        await init();
    }
    try {
        let res = await tenderContract.methods.getOwner().call();
        return res;
    } catch(err) {
        console.error(err);
    }
};

export const login = async () => {
    if(!isInitialized) {
        await init();
    }
    try {
        let res = await tenderContract.methods.getContractor(selectedAccount).call();
        return res;
    } catch(err) {
        console.error(err);
    }
};

export const getContractorName = async (contractorAddress) => {
    if(!isInitialized) {
        await init();
    }
    try {
        let res = await tenderContract.methods.getContractor(contractorAddress).call();
        return res.name;
    } catch(err) {
        console.error(err);
    }
};

export const getOpenContracts = async () => {
    if(!isInitialized) {
        await init();
    }
    try {
        let res = await tenderContract.methods.getOpenContracts().call();
        return res.map((contract) => ({
            contractId: contract.contractId,
            contractStatus: contract.contractStatus,
            description: contract.description,
            bidDeadline: contract.bidDeadline,
            bidIds: contract.bidIds,
          }));
    } catch(err) {
        console.error(err);
    }
};

export const getContracts = async () => {
    if (!isInitialized) {
        await init();
    }
    try {
        let res = await tenderContract.methods.getContracts().call();
        
        // Filtering out empty contract at 0
        let filteredContracts = res.filter(contract => contract.contractId > 0);
        
        return filteredContracts.map((contract) => ({
            contractId: contract.contractId,
            contractStatus: contract.contractStatus,
            description: contract.description,
            bidDeadline: contract.bidDeadline,
            bidIds: contract.bidIds,
        }));
    } catch (err) {
        console.error(err);
    }
};


export const getBidsOfContract = async (contractId) => {
    if (!isInitialized) {
      await init();
    }
    try {
      console.log('Fetching bids for contractId:', contractId);
      let res = await tenderContract.methods.getBidsOfContract(contractId).call(selectedAccount);
      console.log('Received bids:', res);
      return res;
    } catch (err) {
      console.error(err);
    }
  };
  

export const getBid = async (bidId) => {
    if(!isInitialized) {
        await init();
    }
    try {
        let res = await tenderContract.methods.getBid(bidId).call(selectedAccount);
        return res;
    } catch(err) {
        console.error(err);
    }
}
