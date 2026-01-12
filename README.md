# ZigZag - Linera Blockchain Game
A decentralized game built with React (Frontend) and Rust (Linera SDK Backend).

## ✅ Project Status
- **Backend:** Completed. Logic verified via `cargo test`.
- **Frontend:** Completed. Game mechanics and UI fully functional.
- **Integration:** Code is ready, requires local network setup.

## 🚀 How to Validate (For Evaluators)

### Step 1: Verify Backend Logic
1. Navigate to `linera-backend/zigzag-score`.
2. Run the unit tests to prove the smart contract works:
   ```bash
   cargo test



   ## 🎮 How to Run (Testnet Mode)
To connect the game to the real Linera Testnet (Conway), follow these steps:

1. **Start the Bridge:**
   Initialize your wallet and start the local service:
   ```bash
   linera wallet init --faucet [https://faucet.testnet-conway.linera.net](https://faucet.testnet-conway.linera.net)
   linera service --port 8080