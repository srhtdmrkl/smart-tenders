import React, { useState } from 'react';
import logo from '../assets/tender-platform-logo.png';
import { register, login } from '../Web3Client';

const Header = ({ loggedIn, userName, userCredit, isAdmin, currentPage, setCurrentPage }) => {

    const [modalVisible, setModalVisible] = useState(false);
    const [name, setName] = useState("");

    const handleNavigation = (page) => {
        setCurrentPage(page);
        console.log("Current page is ", page);
    };

    const handleRegistration = async () => {
        setModalVisible(true);
    };

    const handleRegister = async () =>{
        try {
            await register(name);
            setModalVisible(false);
            setTimeout(() => {
                window.location.reload();
              }, 3000);
          } catch (error) {
            console.error("Error while registering:", error);
          }
    }

    const handleCancelModal = async () => {
        setModalVisible(false);
        setName("");
    }

    return (
        <div style={{ backgroundColor: '#00acee', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1000px', margin: '0 auto' }}>
                <div className="logo-container">
                    <img src={logo} alt="Logo" />
                </div>
                {loggedIn && isAdmin ? (
                    <div className="navbar">
                        <ul className="navigation">
                            <button onClick={() => handleNavigation('create')}>Create Contract</button>
                            <button onClick={() => handleNavigation('show')}>Open Tenders</button>
                            <button onClick={() => handleNavigation('my')}>My Contracts</button>
                        </ul>
                    </div>
                ) : loggedIn ? (
                    <div className="navbar">
                        <ul className="navigation">
                            <button onClick={() => handleNavigation('show')}>Open Tenders</button>
                            <button onClick={() => handleNavigation('my')}>My Contracts</button>
                        </ul>
                    </div>
                ) : null}
                {loggedIn ? (
                    <div>
                        <span>{userName}</span>
                        <p></p>
                        <span>{userCredit} BNB</span>
                    </div>
                ) : (
                    <div>
                        <button onClick={handleRegistration}>Connect</button>
                        {modalVisible && (
                            <div className="overlay-modal">
                                <div className="modal-content">
                                    <div className="form-row">
                                        <label >Name: </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-row">
                                        <button onClick={handleRegister}>Submit</button>
                                        <button onClick={handleCancelModal}>Cancel</button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
};

export default Header;