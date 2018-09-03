use reactors::ReactorHandle;
use network::connection_handler::ConnectionHandle;

use events;


// handler for the match owner channel
pub struct MatchHandler {
    client_counter: u32,
    reactor_handle: ReactorHandle,
    connection_handle: ConnectionHandle,

}

impl MatchHandler {
    pub fn new(reactor_handle: ReactorHandle,
               connection_handle: ConnectionHandle)
               -> Self
    {
        MatchHandler {
            client_counter: 1,
            reactor_handle,
            connection_handle
        }
    }

    pub fn create_client(&mut self, e: &events::CreateClient) {
        // TODO: make this german tank resistant
        let client_id = self.client_counter;
        self.client_counter += 1;

        self.reactor_handle.dispatch(events::RegisterClient {
            client_id,
            token: e.token.clone(),
        });
        // TODO: it would be better to actually open the connection here,
        // so that it certainly exists when the client receives this
        // response.
        self.connection_handle.dispatch(events::CreateClientResponse {
            request_id: e.request_id,
            client_id,
        });
    }

    pub fn remove_client(&mut self, e: &events::RemoveClient) {
        self.reactor_handle.dispatch(e.clone());
    }

    pub fn start_game(&mut self, e: &events::StartGame) {
        self.reactor_handle.dispatch(e.clone());
    }
}