# [FLY] Freelance System: Core
This tool allows a user to manage permissions to access their SAGE Labs game. The tool interacts with the Player Profiles system created by Star Atlas to add and remove permissions related to SAGE Labs.

### Terminology
**Handler Account** – This account controls permissions. This should be the Solana account which holds assets (ships, resources, etc).

**SAGE Game** – The specific instance of SAGE associated with the Handler Account. Think of this as the “game save” for SAGE.

**Lancer Account** – This account is granted permissions by the Handler Account to interact with the Handler Account's SAGE Game.
* A Lancer Account is allowed to use the “game save” of the Handler Account.
* The Lancer Account does not interact directly with the Handler Account, and no permissions are granted outside of those related to the SAGE Game.
* The Lancer Account does not have permissions to transfer assets from the Handler Account.
* The Lancer Account does not have permissions to give other accounts access to the Handler Account.

## Use Cases
### Freelance System
This enables the core functionality necessary for a Freelance System. A Handler who owns assets can enlist the help of a Lancer to operate fleets while maintaining full control over their assets. Typically, the Handler and Lancer would establish an agreement for profit sharing or payment to compensate the Lancer for their time and effort.

### Secure Auto-approval
Permissions can be granted to a "hot wallet" (the Lancer Account) while maintaining all assets in a hardware wallet (the Handler Account). The hot wallet cannot withdraw or transfer assets from the hardware wallet, so there is inherently less risk involved when enabling auto-approval for hot wallet transactions. The hot wallet can then be used in conjunction with SLY's Lab Assistant to carry out SAGE Labs activities.

## Setup
The script is built as a TamperMonkey script. TamperMonkey is a userscript manager available for free as a browser extension.
1.	Install TamperMonkey.
2.	Select the SLY_Permissioned_Account_Management.user.js file in this repo. View the file and click the "Raw" button to view its source.
3.	Copy the source.
4.	Open Tampermonkey in your browser and click the Add Script tab (icon with a plus symbol).
5.	Paste the source into the script window and click File > Save.

## Managing Lancer Accounts

### Launching the tool
In this section, you will be interacting with the ***Handler Account***.

1.	Browse to https://labs.staratlas.com/.
2.	Connect your Handler Account wallet.
    * NOTE: This script only supports Solflare and Phantom.
3.	Wait for the FLY button to become enabled.
4.	Click the FLY button.
5.	Select the type of wallet that you are using (Solflare or Phantom).

### Adding Lancer accounts
In this section, you will be interacting with the ***Handler Account***.

1.	Enter the public key of the Lancer Account in the text box.
2.	Click the Add Account button.
3.	Sign the transaction.
4.	Wait for the transaction to be confirmed.

### Removing Lancer accounts
In this section, you will be interacting with the ***Handler Account.***

1.	Select the account to remove.
2.	Click the Remove Account button.
3.	Sign the transaction.
4.	Wait for the transaction to be confirmed.

## Using SLY Lab Assistant with a Lancer Account
The official SAGE Labs UI does not currently support Lancer accounts. You will need to perform any necessary setup with your Handler Account prior to using SLY Lab Assistant. This includes forming fleets and ensuring that fleets are undocked in appropriate locations.

In this section, you will be interacting with the ***Lancer Account***

1.	Connect your Lancer Account wallet
a.	NOTE: This script only supports Solflare and Phantom, and the browser cannot have both installed.
2.	Browse to https://labs.staratlas.com/.
3.	Wait for SLY Lab Assistant to load. The control buttons will appear at the top. Wait for the button to change from “Wait…” to “Start”.
4.	If your Lancer Account has access to multiple SAGE Games, a panel will appear prompting a selection. Choose the SAGE Game that you would like SLY Lab Assistant to interact with.
5.	Click Tools > Status to open the Status panel.
6.	Click the Start button.
