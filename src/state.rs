use linera_sdk::views::{RegisterView, ViewStorageContext};
use linera_views::views::{GraphQLView, RootView};

#[derive(RootView, GraphQLView)]
#[view(context = "ViewStorageContext")]
pub struct ZigZagState {
    pub high_score: RegisterView<u64>,
}