# Path of Exile Ladder Overlay
##Overview
The PoE Ladder Overlay was built using [Electron](https://github.com/electron/electron). It makes use of the Path of exile ladder API ([http://api.pathofexile.com/ladders](http://api.pathofexile.com/ladders)) and character API ([http://www.pathofexile.com/character-window/get-characters](http://www.pathofexile.com/character-window/get-characters)).

##Usage
Simply position the window, enter an account and character name, and click "Start/Stop Tracking". The application will continuously provide updates for your current ladder position, as well as your position relative to other characters with the same class. If you are not on the ladder, it will display the minimum level and experience points required to place on it. The character page on your account must be visible for the tool to function properly.

Updates can be as frequent as every 5s for characters placing high on the ladder, but may take over a minute for those near the bottom or who meet the minimum level requirement, but not the minimum experience requirement for placement. The lack of query options on the official ladder API limit the efficiency of retrieving the information necessary to determine your class rank and are the cause of the slowdown.

To use the application, simply download the appropriate release and extract the archive.