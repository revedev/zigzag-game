// linera-backend/zigzag-score/src/contract.rs
use linera_sdk::base::{SessionId, WithContractAbi};
use linera_sdk::views::{RootView, View, RegisterView};
use async_trait::async_trait;

pub struct ZigZagContract {
    state: ZigZagState,
}

#[derive(RootView, async_graphql::SimpleObject)]
pub struct ZigZagState {
    pub high_score: RegisterView<u64>,
}

#[async_trait]
impl Contract for ZigZagContract {
    type Message = ();
    type InstantiationArgument = ();
    type Parameters = ();

    async fn load(state: Self::State) -> Self {
        ZigZagContract { state }
    }

    // This is the function called by the frontend
    async fn execute_operation(&mut self, _context: &OperationContext, operation: u64) -> Result<ExecutionResult, Self::Error> {
        let current = *self.state.high_score.get();
        // Update only if new score is higher
        if operation > current {
            self.state.high_score.set(operation);
        }
        Ok(ExecutionResult::default())
    }
}