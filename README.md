# Lab Assistant by Shadow Loyal [SLY]
This is a browser-based script to track status and automate actions within SAGE Labs.

Current features:
* Automated scanning with timers which respect SDU discovery rules
  * Supports multiple fleets
  * Utilizes your fleet's specific scan timer
  * Utilizes a 2 min timer if an SDU is discovered
  * Does not interfere with other user activity
* Automated resupply [WIP]
  * When the fleet has less than 10 tools, it will return to the designated starbase
  * Transfer SDUs from the fleet to the starbase
  * Refuel the fleet
  * Restock the fleet with toolkits
  * Warp to the designated scanning sector and resume scanning

### SECURITY NOTICE
Users are encouraged to build their own instance of browser-compatible resource file. Doing so ensures that you are using trusted code. Pre-built files are provided for convenience. 

### Building your own browserified version
This script uses a browserified versiosn of Anchor, bs58, and Buffer. 

```
browserify anchor-input.js --standalone BrowserScore -p esmify --exclude process -o anchor-browserified.js
```

anchor-input.js
```
const anchor = require("@coral-xyz/anchor");
module.exports = {anchor};
```

buffer-input.js
```
const Buffer = require("buffer");
module.exports = {Buffer};
```

bs58
```
browserify node_modules/bs58/index.js -o bs58.bundle.js --standalone bs58
```

### Usage
The script is built as a TamperMonkey script. [TamperMonkey](https://www.tampermonkey.net/) is a userscript manager available for free as a browser extension.

#### Setup
1. Install TamperMonkey
2. Select the SAGE_Lab_Assistant_v0.2.2.user.js file in this repo. View the file and click the "Raw" button to view its source.
3. Copy the source
4. Open Tampermonkey in your browser and click the Add Script tab (icon with a plus symbol)
5. Paste the source into the script window and click File > Save
6. Browse to [https://labs.staratlas.com/](https://labs.staratlas.com/)
7. Launch the game as normal
8. Click the Lab Assistant "Configure" button
9. For each fleet that you want Lab Assistant to help with, click the Scan checkbox and fill in the destination and starbase coordinates.
   * Enter coordinates as two numbers separated by a comma with no bracks or prefixes or parenthesis - i.e. 10,20
11. Slick save then refresh your browser

#### Regular usage
1. Launch the game as usual
2. Click the Lab Assistant "Start" button
3. __Leave the browser window open (it can be minimized)__ - this is required since the script runs in the browser
