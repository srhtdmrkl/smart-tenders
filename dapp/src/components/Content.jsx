import React, { useState, useEffect } from 'react';
import Contract from './Contract.jsx';
import { createContract, getOpenContracts, getContracts, register } from '../Web3Client.js';
import Header from './Header.jsx';

const CreateContract = () => {
    const [description, setDescription] = useState('');
    const [bidDeadline, setBidDeadline] = useState('');
    const [dailyPenalty, setDailyPenalty] = useState(1);
    const [maxPenaltyPercent, setMaxPenaltyPercent] = useState(5);
    const [formError, setFormError] = useState('');

    const today = new Date().toISOString().split('T')[0];

    const handleDescriptionChange = (event) => {
        setDescription(event.target.value);
    };

    const handleBidDeadlineChange = (event) => {
        setBidDeadline(event.target.value);
      };

    const handleDailyPenaltyChange = (event) => {
        setDailyPenalty(event.target.value);
    };

    const handleMaxPenaltyPercentChange = (event) => {
        setMaxPenaltyPercent(event.target.value);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (description.trim() === '' || bidDeadline === '') {
            setFormError('Please fill in all required fields.');
            return;
        }

        const bidDeadlineInSeconds = Math.floor(new Date(bidDeadline).getTime() / 1000);

        try {
            const res = await createContract(description, bidDeadlineInSeconds, dailyPenalty, maxPenaltyPercent);
            console.log('Contract creation result:', res);

            setDescription('');
            setBidDeadline('');
            setDailyPenalty(1);
            setMaxPenaltyPercent(5);
            setFormError('');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <h2>Create Tender</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Description:</label>
                    <input
                        type="text"
                        value={description}
                        onChange={handleDescriptionChange}
                        required
                    />
                </div>
                <div>
                    <label>Bid Deadline:</label>
                    <input
                        type="date"
                        value={bidDeadline}
                        onChange={handleBidDeadlineChange}
                        min={today}
                        required
                    />
                </div>
                <div>
                    <label>Daily Penalty (Per Thousand):</label>
                    <input
                        type="text"
                        value={dailyPenalty}
                        onChange={handleDailyPenaltyChange}
                    />
                </div>
                <div>
                    <label>Max Penalty (Percent):</label>
                    <input
                        type="text"
                        value={maxPenaltyPercent}
                        onChange={handleMaxPenaltyPercentChange}
                    />
                </div>
                <button type="submit">Create</button>
            </form>
        </div>
    );
};

const ShowOpenContracts = ({ isAdmin }) => {
    const [openContracts, setOpenContracts] = useState([]);
  
    useEffect(() => {
      const fetchOpenContracts = async () => {
        try {
          const contracts = await getOpenContracts();
          console.log(contracts);
          setOpenContracts(contracts);
        } catch (err) {
          console.error(err);
        }
      };
  
      fetchOpenContracts();
    }, []);
  
    return (
      <div>
        <h2>Open Tenders</h2>
        <div className='contract-grid-wrapper'>
        <div className='contract-grid'>
        {openContracts.map((contract) => (
          <Contract 
          isAdmin={isAdmin}
          key={contract.contractId}
          contractId={contract.contractId.toString()}
          contractStatus={contract.contractStatus.toString()}
          description={contract.description}
          bidDeadline={contract.bidDeadline.toString()}
          bidIds={contract.bidIds}
        />
        ))}
        </div></div>
      </div>
    );
  };

  const MyContracts = ({isAdmin}) => {
    const [contracts, setContracts] = useState([]);
  
    useEffect(() => {
      const fetchContracts = async () => {
        try {
          const contracts = await getContracts();
          console.log(contracts);
          setContracts(contracts);
        } catch (error) {
          console.error(error);
        }
      };
  
      fetchContracts();
    }, []);
  
    return (
      <div>
        <h2>My Contracts</h2>
        <div className='contract-grid-wrapper'>
        <div className='contract-grid'>
        {contracts.map((contract) => (
          <Contract 
          isAdmin={isAdmin}
          key={contract.contractId}
          contractId={contract.contractId.toString()}
          contractStatus={contract.contractStatus.toString()}
          description={contract.description}
          bidDeadline={contract.bidDeadline.toString()}
          bidIds={contract.bidIds}
        />
        ))}
        </div></div>
      </div>
    );
  };

  
    const OpeningPage = () => {
        return (
          <div>
            <h1>Welcome to Tender Platform - Smart Tenders</h1>
            <p>Experience the power of smart contracts in managing tenders and contracts.</p>
            <p>Start creating and managing your contracts with ease.</p>
          </div>
        );
      };

export { CreateContract, ShowOpenContracts, MyContracts, OpeningPage };
