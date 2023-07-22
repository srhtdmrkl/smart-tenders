import './App.css';
import { getUserAddress, register, login, getOwner, getOpenContracts } from './Web3Client';
import { useState, useEffect } from "react";
import Web3 from "web3";
import Header from './components/Header';
import { CreateContract, ShowOpenContracts, MyContracts, Registration, OpeningPage } from './components/Content';





function App() {

  const [showModal, setShowModal] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [name, setName] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [userCredit, setUserCredit] = useState("0");
  const [contracts, setContracts] = useState([]);
  const [currentPage, setCurrentPage] = useState("opening");

  const emptyAddress = "0x0000000000000000000000000000000000000000";

  useEffect(() => {
    const handleInit = async () => {
      try {
        console.log("Executing handleInit...");

        let address = await getUserAddress();
        console.log("User address:", address);

        let owner = await getOwner();
        console.log("Owner address:", owner);

        if (address === owner.toLowerCase()) {
          setLoggedIn(true);
          setIsAdmin(true);
          setUserName("Admin");
          console.log("User is an admin");
          setCurrentPage("show");
        } 
        
        let isUser = await login();
        console.log("isUser:", isUser);
        
        if (isUser.contractor !== emptyAddress) {

          setLoggedIn(true);
          console.log("User is logged in");

          setUserCredit(Web3.utils.fromWei(String(isUser.balance ?? "0"), "ether").toString());
          console.log("User credit:", userCredit);

          setUserName(isUser.name);
          console.log("User name:", userName);

          setCurrentPage("my");

        }


      } catch (err) {
        console.error(err);
      }
    };

    handleInit();

  }, []);


  const handleNameChange = (event) => {
    setName(event.target.value);
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'create':
        console.log('Rendering CreateContract');
        return <CreateContract />;
      case 'show':
        console.log('Rendering ShowOpenContracts');
        return <ShowOpenContracts isAdmin={isAdmin} />;
      case 'my':
        console.log('Rendering MyContracts');
        return <MyContracts isAdmin={isAdmin} />;
      case 'opening':
        console.log('Rendering opening page');
        return <OpeningPage />;
      default:
        return null;
    }
  };

  return (
    <div className="App">
      <Header loggedIn={loggedIn} userName={userName} userCredit={userCredit} isAdmin={isAdmin} currentPage={currentPage}
        setCurrentPage={setCurrentPage} />

      {renderContent()}

      {/* {showModal && (
      <div className="modal">
        <div className="modal-content">
          <h2>Registration</h2>
          <input type="text" placeholder="Enter your name" value={name} onChange={(event) => setName(event.target.value)} />
          <button onClick={handleRegistration}>Register</button>
          <button onClick={() => setShowModal(false)}>Cancel</button>
        </div>
      </div>
      )} */}
    </div>
  );

}

export default App;