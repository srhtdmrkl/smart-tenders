import React, { useEffect, useState } from "react";
import { closeContract, cancelContract, submitBid, withdrawBid, getBid, getContractorName, getUserAddress, awardBid } from "../Web3Client";
import Web3 from "web3";


const Contract = (props) => {

    const [duration, setDuration] = useState("");
    const [price, setPrice] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [bids, setBids] = useState([]);
    const [contractorNames, setContractorNames] = useState([]);
    const [isBiddedByContractor, setIsBiddedByContractor] = useState(false);
    const [awardModalVisible, setAwardModalVisible] = useState(false);
    const [selectedBid, setSelectedBid] = useState(null);

    useEffect(() => {
        fetchBids();
    }, []);

    useEffect(() => {
        fetchContractorNames();
        checkContractorBid();
    }, [bids]);

    const fetchBids = async () => {
        console.log("Fetching bids...");
        const fetchedBids = await Promise.all(
            props.bidIds.map((bidId) => getBid(bidId))
        );
        console.log("Fetched Bids:", fetchedBids);
        setBids(fetchedBids);

    };

    const fetchContractorNames = async () => {
        const names = await Promise.all(
            bids.map((bid) => getContractorName(bid.contractor))
        );
        setContractorNames(names);
    };

    const checkContractorBid = async () => {
        console.log("Checking contractor's bid..");
        const userAddress = await getUserAddress();
        const contractorBid = bids.find((bid) => bid.contractor.toLowerCase() === userAddress.toLowerCase());
        if (contractorBid) {
            setIsBiddedByContractor(true);
        } else {
            setIsBiddedByContractor(false);
        }
    };

    const withdrawContractorBid = async () => {
        if (isBiddedByContractor) {
            const confirmed = window.confirm("Are you sure you want to withdraw your bid?");
            if (confirmed) {
                const userAddress = await getUserAddress();
                const contractorBid = bids.find((bid) => bid.contractor.toLowerCase() === userAddress.toLowerCase());
                if (contractorBid) {
                    console.log("Withdraw Contractor Bid ID:", contractorBid.bidId);
                    await withdrawBid(contractorBid.bidId);
                    setIsBiddedByContractor(false);
                }
            }
        }
    };

    const formatDuration = (duration) => {
        const days = duration.toString() / (24 * 60 * 60);
        return `${days} days`;
    };

    const formatAmount = (amount) => {
        const web3 = new Web3();
        const bnbAmount = web3.utils.fromWei(amount.toString(), "ether");
        return `${bnbAmount} BNB`;
    };

    const handleCancelContract = async () => {
        await cancelContract(props.contractId);
    };

    const handleCloseContract = async () => {
        await closeContract(props.contractId);
    };

    const handleCancelModal = async () => {
        setModalVisible(false);
        setDuration("");
        setPrice("");
    }

    const handleSubmitBid = async () => {
        setModalVisible(true);
    };

    const handleAwardBid = async () => {
        setAwardModalVisible(true);
    };

    const handleSelectBid = async (bidId) => {
        setSelectedBid(bidId);
    }

    const handleAwardSelectedBid = async () => {
        if (selectedBid) {
            console.log("Awarding Bid ID:", selectedBid.bidId);
        }
        await awardBid(selectedBid);
        setAwardModalVisible(false);
    }

    const handleBidSubmit = async () => {
        const durationInSeconds = parseInt(duration, 10) * 24 * 60 * 60;
        const priceInWei = Web3.utils.toWei(price.toString(), "ether");
        submitBid(priceInWei, durationInSeconds, props.contractId)
        setModalVisible(false);
        setDuration("");
        setPrice("");
    };

    const formatBidDeadline = (deadline) => {
        const date = new Date(Number(deadline) * 1000);
        return date.toLocaleDateString();
    };

    const getStatusString = (status) => {
        switch (status) {
            case "0":
                return 'Open';
            case "1":
                return 'Closed';
            case "2":
                return 'Awarded';
            case "3":
                return 'Canceled';
            case "4":
                return 'Work In Progress';
            case "5":
                return 'Work Completed';
            default:
                return 'Unknown';
        }
    };

    const getBidStatusString = (bidStatus) => {
        switch (bidStatus) {
            case "0":
                return 'Submitted';
            case "1":
                return 'Awarded';
            case "2":
                return 'Rejected';
            case "3":
                return 'Withdrawn';
            default:
                return 'Unknown';
        }
    }

    return (
        <div className="border-md border-black flex flex-col">
            <div className="flex flex-row justify-evenly mt-14">
                {props.isAdmin && (
                    <>
                        <button onClick={handleCancelContract}>Cancel Tender</button>
                        {props.contractStatus === "0" && (
                            <button onClick={handleCloseContract}>Close Bidding</button>
                        )}
                        {props.contractStatus === "1" && bids.length > 0 && (
                            <button onClick={handleAwardBid}>Award Bid</button>
                        )}
                    </>
                )}
            </div>
            <div>
                <p>Contract Status: {getStatusString(props.contractStatus)}</p>
            </div>
            <div>
                <p>Contract ID: {props.contractId}</p>
            </div>
            <div>
                <p>Description: {props.description}</p>
            </div>
            <div>
                <p>Bid Deadline: {formatBidDeadline(props.bidDeadline)}</p>
            </div>
            <div>
                <p>Bids:</p>
                {bids.length > 0 ? (
                    <ul>
                        {bids.map((bid, index) => (
                            <li key={bid.bidId.toString()}>
                                <div>Contractor: {contractorNames[index]}</div>
                                <div>Amount: {formatAmount(bid.amount)}</div>
                                <div>Duration: {formatDuration(bid.duration)}</div>
                                <div>Status: {getBidStatusString(bid.bidStatus.toString())}</div>
                            </li>
                        ))}

                    </ul>
                ) : (
                    <p>No bids</p>
                )}
            </div>

            {/* Award Bid Modal */}
            {awardModalVisible && (
                <div className="overlay-modal">
                    <div className="modal-content">
                        <h2>Choose a Bid to Award</h2>
                        <ul style={{ listStyleType: "none", padding: 0 }}>
                            {bids.map((bid) => (
                                <li key={bid.bidId.toString()}>
                                    <div>
                                        <label>
                                            <input
                                                type="radio"
                                                name="selectedBid"
                                                value={bid.bidId.toString()}
                                                checked={selectedBid === bid.bidId.toString()}
                                                onChange={() => handleSelectBid(bid.bidId.toString())}
                                            />
                                            Contractor: {contractorNames[bids.indexOf(bid)]}
                                            {" | "} Amount: {formatAmount(bid.amount)}
                                            {" | "} Duration: {formatDuration(bid.duration)}
                                        </label>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className="form-row">
                            <button onClick={handleAwardSelectedBid}>Award Selected Bid</button>
                            <button onClick={() => setAwardModalVisible(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}



            <div className="flex flex-row justify-evenly mt-14">

                {!props.isAdmin && (
                    <>
                        {props.contractStatus === "0" && !isBiddedByContractor && (
                            <button onClick={handleSubmitBid}>Submit Bid</button>
                        )}
                        {props.contractStatus === "0" && isBiddedByContractor && (
                            <button onClick={withdrawContractorBid}>Withdraw Bid</button>
                        )}

                        {modalVisible && (
                            <div className="overlay-modal">
                                <div className="modal-content">
                                    <div className="form-row">
                                        <label>Duration (days):</label>
                                        <input
                                            type="text"
                                            value={duration}
                                            onChange={(e) => setDuration(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-row">
                                        <label>Price (BNB):</label>
                                        <input
                                            type="text"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-row">
                                        <button onClick={handleBidSubmit}>Submit</button>
                                        <button onClick={handleCancelModal}>Cancel</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div >
    );
};

export default Contract;
