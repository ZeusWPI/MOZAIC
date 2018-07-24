all: server client


client: server
	cd planetwars/client ; \
	yarn install ; \
	cd bin ; \
	ln -s ../../../gameserver/target/release/mozaic_bot_driver ; \
	cd ../../../client ; \
	npm link ; \
	cd ../planetwars/client ; \
	npm link mozaic-client

server:
	cd gameserver ; cargo build --release