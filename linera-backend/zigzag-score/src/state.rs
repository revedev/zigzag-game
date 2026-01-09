use linera_sdk::views::{RegisterView, RootView, ViewStorageContext};
use async_graphql::SimpleObject;

#[derive(RootView, SimpleObject)]
#[view(context = "ViewStorageContext")]
pub struct ZigZagState {
    pub high_score: RegisterView<u64>,
}