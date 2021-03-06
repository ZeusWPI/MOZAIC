# -----------------------------------------------------------------------------
# Build commands, typically runs project build tool in a subdirectory
#------------------------------------------------------------------------------

all: server planetwars

planetwars: planetwars-match-log planetwars-visualizer planetwars-client

planetwars-match-log:
	cd planetwars/match-log ; \
	yarn install ; \
	yarn build ; \

planetwars-visualizer:
	cd planetwars/visualizer ; \
	yarn install ; \
	yarn build ; \

planetwars-client: client server planetwars-visualizer planetwars-match-log
	cd planetwars/client ; \
	yarn install ; \
	cd bin ; \
	ln -sfn ../../../gameserver/target/release/mozaic_bot_driver ; \

client: server
	cd client ; \
	yarn install ; \
	yarn build ; \

server:
	cd gameserver ; cargo build --release

# -----------------------------------------------------------------------------
# Clean commands, typically removes build output and dependencies.
#------------------------------------------------------------------------------

clean: clean-server clean-client clean-planetwars

clean-server:
	cd gameserver; \
	rm -rf target

clean-client:
	-cd client; \
	rm -rf dist; \
	rm -rf node_modules; \
	yarn unlink --force; \

clean-planetwars: clean-client clean-planetwars-client clean-planetwars-visualizer clean-planetwars-match-log
	cd planetwars/client; \
	rm -f bin/mozaic_bot_driver

clean-planetwars-client:
	cd planetwars/client; \
	rm -rf node_modules; \
	rm -rf dist; \

clean-planetwars-visualizer: clean-planetwars-match-log
	cd planetwars/visualizer; \
	rm -rf node_modules; \
	rm -rf dist; \

clean-planetwars-match-log:
	cd planetwars/match-log; \
	rm -rf node_modules; \
	rm -rf dist; \