<p align="center"><img src="/resources/Design%205.PNG" alt="MOZAIC"/></p>

# MOZAIC

MOZAIC is the **M**assive **O**nline **Z**eus **A**rtificial **I**ntelligence **C**ompetition platform.
It aims to provide a flexible platform to host your very own AI competition. Just plug your game, and off you go!

Eventually MOZAIC should be very modular, so that you can provide a custom-tailored experience for your competitors, without having to worry about the heavy lifting.

## BottleBats 2.018
BottleBats 2.018 is the second edition of the Zeus WPI AI competition. The simple concept remains the same, but this time it is build on top of the MOZAIC platform for reliable cross-platform en networked (Soon TM) play. 

### Concept & Game
Write a bot and compete with your friends. Accept game-states trough stdin and write your actions through stdout, everything is handled by us. 

See the [intro-slides](https://drive.google.com/open?id=1ZwFlXGm7WZ4urTFxXdyoEz7n19PjwkO4Z-iVYLWCDmg) for more info.

### Client & Downloads

<p align="center"><img src="/resources/clientv0.3.png" alt="MOZAIC"/></p>

We provide easy-to-setup packages clients for all platforms, check out the [releases](https://github.com/ZeusWPI/MOZAIC/releases) section for downloads.

For OSX we suggest using the `.dmg`, for windows the `.exe`.

For linux we provide an [AppImage](https://appimage.org/), which after downloading, you need to make executable (`chmod u+x <file>`).
**Note**: the AppImage does not need to be installed, and you can simply run the file.

For OSX, some commands (such as python) might not work, it usually helps by replacing it by the output of `which` (e.g. `which python3`).

Most of the data will be save to user-data directories which are:

* `%APPDATA%\BottleBats` on Windows
* `$XDG_CONFIG_HOME/BottleBats` or `~/.config/BottleBats` on Linux
* `~/Library/Application Support/BottleBats` on macOS

Try not to mess these up, or things will break.

Important resources:
 - [Demo Bots](https://github.com/ZeusWPI/MOZAIC/tree/development/planetwars/bots)
 - [Competitor Bots](https://hackmd.io/h4vmgyBDS-yQxrztywfxCQ#)

## Setup

### Gameserver

1. Install rust and cargo (take look [here](https://rustup.rs/) if you're using an older software repository such as Ubuntu apt).
    - Rust >= 1.18.0
    - Cargo >= 0.16.0

1. Try to run the botrunner with `cargo run` in the `gameserver` directory. It should compile, but fail to play a match.
1. Run the botrunner again (still in the `gameserver` directory) with:
    - Linux - `cargo run ../planetwars/examples/configs/stub.json`
    - Windows - `cargo run ..\planetwars\examples\configs\stub.windows.json`
1. It should have generated a log-file `log.json`.
1. If it did, great, it works! Now run 'cargo build --release'.
1. Check setup below for the client.

### Client

**Note:** Do the setup for the gameserver first

1. Install Node v8 and npm.
1. Go the `planetwars\client` directory
1. Install dependencies with `npm install`.
1. Go the `.\bin` dir and symlink the gameserver with:
    * Linux -  `ln -s ../../../gameserver/target/release/mozaic_bot_driver`
    * Windows -  `mklink bot_driver.exe ..\..\..\gameserver\target\release\mozaic_bot_driver.exe`
1. Go back the `client` dir and run `npm run dev`.
1. An electron client should be at your disposal!

### Publishing and packaging

You can package easily with the `package-<os>` in `package.json`. Publishing is done automatically by Travis and AppVeyor on commit. See the electron-builder [publish docs](https://www.electron.build/configuration/publish) for more info about our flow (it's the GitHub one).
Note: when packaging an make sure the `mozaic_bot_driver` binary is an actual binary and not a symlink, or things will break.

## Contact

Have any questions, comments, want to contribute or are even remotely interested in this project, please get in touch!
You can reach us by [e-mail](mailto:bottlebats@zeus.ugent.be), [Facebook](https://www.facebook.com/zeus.wpi), or any other way you prefer listed [here](https://zeus.ugent.be/about/).
