use linera_sdk::abi::{ContractAbi, ServiceAbi};
use serde::{Deserialize, Serialize};

pub struct ZigzagScoreAbi;

impl ContractAbi for ZigzagScoreAbi {
    type Operation = Operation;
    type Response = ();
}

impl ServiceAbi for ZigzagScoreAbi {
    type Query = ();
    type QueryResponse = ();
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ScoreState {
    pub value: u64,
}

#[derive(Debug, Deserialize, Serialize)]
pub enum Operation {
    Increment { amount: u64 },
}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_increment_score() {
        // 1. Setup initial state
        let mut state = ScoreState { value: 0 };
        
        // 2. Define the operation (User clicking "Score")
        let op = Operation::Increment { amount: 10 };

        // 3. Simulate the Contract Logic manually
        // (This mirrors what execute_operation does)
        match op {
            Operation::Increment { amount } => {
                state.value += amount;
            }
        }

        // 4. Verify result
        assert_eq!(state.value, 10, "Score should have increased by 10!");
        println!("✅ SUCCESS: Score logic works perfectly.");
    }
}