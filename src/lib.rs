use async_trait::async_trait;
use linera_sdk::{
    base::{SessionId, WithContractAbi},
    views::{RootView, View, RegisterView, ViewStorageContext},
    Contract, ExecutionResult, OperationContext,
};
use serde::{Deserialize, Serialize};
use thiserror::Error;

// Define the contract structure
pub struct ZigZagContract {
    state: ZigZagState,
}

// 1. Define the State
// We add #[view(context = ...)] to fix the "proc-macro derive panicked" error
#[derive(RootView, async_graphql::SimpleObject)]
#[view(context = "ViewStorageContext")]
pub struct ZigZagState {
    pub high_score: RegisterView<u64>,
}

// 2. Define the ABI (Application Binary Interface)
#[derive(Debug, Deserialize, Serialize)]
pub enum Operation {
    SubmitScore { score: u64 },
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ZigZagAbi;

impl WithContractAbi for ZigZagContract {
    type Abi = ZigZagAbi;
}

#[derive(Debug, Error)]
pub enum ContractError {
    #[error("View Error")]
    ViewError(#[from] linera_sdk::views::ViewError),
    
    #[error("Serialization Error")]
    BcsError(#[from] bcs::Error),

    #[error("JSON Error")]
    JsonError(#[from] serde_json::Error),
}

// 3. Implement the Contract Trait
#[async_trait]
impl Contract for ZigZagContract {
    type Error = ContractError;
    type Storage = ViewStorageContext;
    type State = ZigZagState;
    type Message = ();
    type InstantiationArgument = ();
    type Parameters = ();

    // Initialize the contract (load state)
    async fn new(state: ZigZagState, _runtime: &linera_sdk::ContractRuntime<Self>) -> Result<Self, Self::Error> {
        Ok(ZigZagContract { state })
    }

    async fn load(state: ZigZagState) -> Result<Self, Self::Error> {
        Ok(ZigZagContract { state })
    }

    // This handles the "Operation" sent from your Frontend
    async fn execute_operation(
        &mut self,
        _context: &OperationContext,
        operation: Self::Operation, // This uses the type inferred from ABI, but often we parse raw bytes in newer SDKs. 
        // For simplicity in this version template, we'll try to deserialize the operation manually if needed, 
        // but let's stick to the standard signature.
    ) -> Result<ExecutionResult<Self::Message>, Self::Error> {
        
        // Logic: Check if new score > high score
        // Note: In a real implementation, 'operation' would be an Enum.
        // For this specific 'submit score' logic:
        
        match operation {
             Operation::SubmitScore { score } => {
                let current_score = *self.state.high_score.get();
                if score > current_score {
                    self.state.high_score.set(score);
                }
             }
        }

        Ok(ExecutionResult::default())
    }

    async fn execute_message(
        &mut self,
        _context: &OperationContext,
        _message: Self::Message,
    ) -> Result<ExecutionResult<Self::Message>, Self::Error> {
        Ok(ExecutionResult::default())
    }

    async fn execute_class_message(
        &mut self,
        _context: &OperationContext,
        _message: (),
    ) -> Result<ExecutionResult<Self::Message>, Self::Error> {
        Ok(ExecutionResult::default())
    }
}