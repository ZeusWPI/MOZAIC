all: server client planetwars

planetwars: client server
	cd planetwars/client ; \
	yarn install ; \
	cd bin ; \
	ln -s ../../../gameserver/target/release/mozaic_bot_driver ; \
	yarn link mozaic-client

client: server
	cd client ; \
	yarn build ; \
	yarn link ; \

server:
	cd gameserver ; cargo build --release

clean: serverclean planetclean clientclean

serverclean:
	cd gameserver; \
	rm -rf target

clientclean:
	-cd client; \
	rm -rf dist; \
	yarn unlink --force; \

planetclean: clientclean
	-cd planetwars/client; \
	yarn unlink --force mozaic-client; \
	rm -f bin/mozaic_bot_driver
	