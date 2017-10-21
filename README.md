# Path of Exile Ladder Overlay
## Overview
The Path of Exile Ladder Overlay is a tool that can be configured to display a specified character's rank and class rank in a specified league or event.

The PoE Ladder Overlay was built using [Electron](https://github.com/electron/electron). 

It makes use of the following Path of Exile APIS:
* [Ladder API](http://api.pathofexile.com/ladders)
* [Seasons API](http://www.pathofexile.com/api/seasons)
* [Leagues API](http://api.pathofexile.com/leagues)

## Usage
Simply position the window, choose a league or event, and click "Start/Stop Tracking". The application will continuously provide updates for your current ladder position, as well as your position relative to other characters with the same class. If you are not on the ladder, it will display the minimum level and experience points required to place on it.

Updates can be as frequent as every 10s for characters placing high on the ladder, but may take over a minute for those near the bottom or who do not meet the minimum level requirement. The lack of query options on the official ladder API and the necessity of knowing how many characters of the same class have place ahead of you limit the efficiency of retrieving the information necessary to determine your class rank and are the cause of the slowdown.

To use the application, simply download the appropriate release extract the archive, and execute POELadder.exe.