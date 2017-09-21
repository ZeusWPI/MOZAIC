# Gameserver

For the moment this is a simple `Node.js v8` webserver wrapping the botdriver.

## Setup

 1. Install Node.js 8
 2. Run `npm install`
 3. Generate a botdriver binary `cargo build --release`
 4. Copy it from `src/botdriver/target/release/mozaic_bot_driver` to `src/gameserver/botdriver`
 5. Run the server with `node server.js`

## Communication
Post the sourcecode as raw text to `/bot` and you'll get the log as raw text back.