# Player Profile Management
This tool allows a user to manage Permissioned Accounts. The tool interacts with the Player Profiles system created by Star Atlas to add and remove permissions related to SAGE.

### Terminology
**Manager Account** – This account controls permissions. This should be the Solana account which holds assets (ships, resources, etc).

**SAGE Game** – The specific instance of SAGE associated with the Primary Account. Think of this as the “game save” for SAGE.

**Permissioned Account** – This account is granted permissions by the Manager Account to interact with the Manager Account's SAGE Game.
* A Permissioned Account is allowed to use the “game save” of the Primary Account.
* The Permissioned Account does not interact directly with the Primary Account, and no permissions are granted outside of those related to the SAGE Game.
* The Permissioned Account does not have permissions to transfer assets from the Primary Account.
* The Permissioned Account does not have permissions to give other accounts access to the Primary Account.


## Setup
The script is built as a TamperMonkey script. TamperMonkey is a userscript manager available for free as a browser extension.
1.	Install TamperMonkey.
2.	Select the SLY_Permissioned_Account_Management.user.js file in this repo. View the file and click the "Raw" button to view its source.
3.	Copy the source.
4.	Open Tampermonkey in your browser and click the Add Script tab (icon with a plus symbol).
5.	Paste the source into the script window and click File > Save.

## Managing Permissioned Accounts

### Launching the tool
In this section, you will be interacting with the ***Manager Account***.

1.	Browse to https://labs.staratlas.com/.
2.	Connect your Manager Account wallet.
    * NOTE: This script only supports Solflare and Phantom.
3.	Wait for the Manage Permissioned Accounts panel to pop up.

### Adding permissioned accounts
In this section, you will be interacting with the ***Manager Account***.

1.	Enter the public key of the Permissioned Account in the text box.
2.	Click the Add Account button.
3.	Sign the transaction.
4.	Wait for the transaction to be confirmed.

### Removing permissioned accounts
In this section, you will be interacting with the ***Manager Account.***

1.	Select the account to remove.
2.	Click the Remove Account button.
3.	Sign the transaction.
4.	Wait for the transaction to be confirmed.

## Using SLY Lab Assistant with a Permissioned Account
The official SAGE Labs UI does not currently support permissioned accounts. You will need to perform any necessary setup with your Manager Account prior to using SLY Lab Assistant. This includes forming fleets and ensuring that fleets are undocked in appropriate locations.

In this section, you will be interacting with the ***Permissioned Account***

1.	Connect your Permissioned Account wallet
a.	NOTE: This script only supports Solflare and Phantom, and the browser cannot have both installed.
2.	Browse to https://labs.staratlas.com/.
3.	Wait for SLY Lab Assistant to load. The control buttons will appear at the top. Wait for the button to change from “Wait…” to “Start”.
4.	If your Permissioned Account has access to multiple SAGE Games, a panel will appear prompting a selection. Choose the SAGE Game that you would like SLY Lab Assistant to interact with.
5.	Click Tools > Status to open the Status panel.
6.	Click the Start button.
