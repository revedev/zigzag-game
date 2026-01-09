#![cfg_attr(target_arch = "wasm32", no_main)]

mod lib;

use async_graphql::{EmptyMutation, EmptySubscription, Object, Schema};
use linera_sdk::{
    abi::WithServiceAbi,
    Service, ServiceRuntime,
};
use lib::{ZigzagScoreAbi, ScoreState};
use std::sync::Arc;

pub struct ZigzagScoreService {
    state: ScoreState,
    runtime: ServiceRuntime<Self>,
}

linera_sdk::service!(ZigzagScoreService);

impl WithServiceAbi for ZigzagScoreService {
    type Abi = ZigzagScoreAbi;
}

impl Service for ZigzagScoreService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        // In a real app, you would load the state from storage
        ZigzagScoreService {
            state: ScoreState { value: 0 },
            runtime,
        }
    }

    async fn handle_query(&self, query: \u003cSelf::Abi as linera_sdk::base::ServiceAbi\u003e::Query) -> \u003cSelf::Abi as linera_sdk::base::ServiceAbi\u003e::QueryResponse {
        // Handle GraphQL queries here
        ()
    }
}