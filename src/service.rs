#![cfg_attr(target_arch = "wasm32", no_std)]

mod state;
use linera_sdk::{
    base::WithServiceAbi, Service, ServiceRuntime, ViewStateStorage,
};
use state::ZigZagState;

pub struct ZigZagService {
    state: ZigZagState,
    runtime: ServiceRuntime<Self>,
}

linera_sdk::service!(ZigZagService);

impl Service for ZigZagService {
    type Parameters = ();

    async fn load(runtime: ServiceRuntime<Self>) -> Self {
        let state = ZigZagState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        ZigZagService { state, runtime }
    }

    async fn handle_query(&self, query: linera_sdk::graphql::Request) -> linera_sdk::graphql::Response {
        self.state.handle_graphql_query(query).await
    }
}