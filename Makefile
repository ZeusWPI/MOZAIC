all: server planetwars

planetwars: planetwars-match-log planetwars-visualizer planetwars-client

planetwars-match-log:
	cd planetwars/match-log ; \
	yarn install ; \
	yarn build ; \
	yarn link ; \

planetwars-visualizer:
	cd planetwars/visualizer ; \
	yarn install ; \
	yarn build ; \
	yarn link ; \

planetwars-client: client server planetwars-visualizer planetwars-match-log
	cd planetwars/client ; \
	yarn install ; \
	cd bin ; \
	ln -s ../../../gameserver/target/release/mozaic_bot_driver ; \
	yarn link mozaic-client
	yarn link planetwars-match-log
	yarn link planetwars-visualizer

client: server
	cd client ; \
	yarn install ; \
	yarn build ; \
	yarn link ; \

server:
	cd gameserver ; cargo build --release

clean: clean-server clean-client clean-planetwars

clean-server:
	cd gameserver; \
	rm -rf target

clean-client:
	-cd client; \
	rm -rf dist; \
	yarn unlink --force; \

clean-planetwars: clean-client clean-planetwars-client clean-planetwars-visualizer clean-planetwars-match-log
	-cd planetwars/client; \
	yarn unlink --force mozaic-client; \
	yarn unlink --force planetwars-visualizer
	yarn unlink --force planetwars-match-log
	rm -f bin/mozaic_bot_driver

clean-planetwars-client:
	cd planetwars/client; \
	rm -rf dist; \
	yarn unlink --force; \

clean-planetwars-visualizer: clean-planetwars-match-log
	cd planetwars/visualizer; \
	rm -rf dist; \
	yarn unlink --force; \

clean-planetwars-match-log:
	cd planetwars/match-log; \
	rm -rf dist; \
	yarn unlink --force; \