#![cfg_attr(target_arch = "wasm32", no_main)]

mod lib;

use linera_sdk::{
    abi::WithContractAbi,
    views::{RootView, View},
    Contract, ContractRuntime,
};
use lib::{Operation, ZigzagScoreAbi, ScoreState};

pub struct ZigzagScoreContract {
    state: ScoreState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(ZigzagScoreContract);

impl WithContractAbi for ZigzagScoreContract {
    type Abi = ZigzagScoreAbi;
}

impl Contract for ZigzagScoreContract {
    type Message = ();
    type InstantiationArgument = u64; // Initial score
    type Parameters = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        // Load state or default to 0
        let state = runtime.application_parameters().unwrap_or(()); 
        // Note: Real apps use ViewStorage usually, this is a simplified example
        // Assuming simple memory state for simplicity
        ZigzagScoreContract { 
            state: ScoreState { value: 0 }, 
            runtime 
        }
    }

    async fn instantiate(
        &mut self,
        value: Self::InstantiationArgument,
    ) {
        self.state.value = value;
    }

    async fn execute_operation(
        &mut self,
        operation: Operation,
    ) -> Self::Response {
        match operation {
            Operation::Increment { amount } => {
                self.state.value += amount;
            }
        }
    }

    async fn execute_message(&mut self, _message: Self::Message) {
        // Handle cross-chain messages here
    }
}