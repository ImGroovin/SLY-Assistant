// ==UserScript==
// @name         SLY Lab Assistant
// @namespace    http://tampermonkey.net/
// @version      0.4.0
// @description  try to take over the world!
// @author       SLY w/ Contributions by SkyLove512, anthonyra, niofox
// @match        https://labs.staratlas.com/
// @require      https://unpkg.com/@solana/web3.js@latest/lib/index.iife.min.js
// @require      https://raw.githubusercontent.com/ImGroovin/SAGE-Lab-Assistant/main/anchor-browserified.js
// @require      https://raw.githubusercontent.com/ImGroovin/SAGE-Lab-Assistant/main/buffer-browserified.js
// @require      https://raw.githubusercontent.com/ImGroovin/SAGE-Lab-Assistant/main/bs58-browserified.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=staratlas.com
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
// ==/UserScript==

(async function() {
    'use strict';
    
    let graceBlockWindow = 5;
    let enableAssistant = false;
    let initComplete = false;

    // in memory storage
    let userFleets = [];

    const RPCEndpoints = ['https://rpc.hellomoon.io/cfd5910f-fb7d-4489-9b32-f97193eceefd'];
    const solanaConnection = new solanaWeb3.Connection(RPCEndpoints[0], 'confirmed');
    const anchorProvider = new BrowserAnchor.anchor.AnchorProvider(solanaConnection, null, null);

    // load SAGE program and methods
    const sageProgramId = new solanaWeb3.PublicKey('SAGEqqFewepDHH6hMDcmWy7yjHPpyKLDnRXKb3Ki8e6');
    const sageIDL = await anchor.Program.fetchIdl(sageProgramId, anchorProvider);
    const sageProgram = new BrowserAnchor.anchor.Program(sageIDL, sageProgramId, anchorProvider);
    console.debug('sageProgram: ', sageProgram);
    const [sageGameAcct] = await sageProgram.account.game.all();
    console.debug('sageGameAcct: ', sageGameAcct);
    const [sageSDUTrackerAcct] = await sageProgram.account.surveyDataUnitTracker.all();
    console.debug('sageSDUTrackerAcct: ', sageSDUTrackerAcct);

    // load player profile and methods
    const profileProgramId = new solanaWeb3.PublicKey('pprofELXjL5Kck7Jn5hCpwAL82DpTkSYBENzahVtbc9');
    const profileIDL = await anchor.Program.fetchIdl(profileProgramId, anchorProvider);
    const profileProgram = new BrowserAnchor.anchor.Program(profileIDL, profileProgramId, anchorProvider);
    console.debug('profileProgram: ', profileProgram);

    // load cargo program and methods
    const cargoProgramId = new solanaWeb3.PublicKey('Cargo8a1e6NkGyrjy4BQEW4ASGKs9KSyDyUrXMfpJoiH');
    const cargoIDL = await anchor.Program.fetchIdl(cargoProgramId, anchorProvider);
    const cargoProgram = new BrowserAnchor.anchor.Program(cargoIDL, cargoProgramId, anchorProvider);
    const [cargoStatsDefinitionAcct] = await cargoProgram.account.cargoStatsDefinition.all();
    const cargoStatsDefSeqId = cargoStatsDefinitionAcct.account.seqId;
    console.debug('cargoProgram', cargoProgram);
    console.debug('cargoStatsDefinitionAcct', cargoStatsDefinitionAcct);

    const profileFactionProgramId = new solanaWeb3.PublicKey('pFACSRuobDmvfMKq1bAzwj27t6d2GJhSCHb1VcfnRmq');
    const profileFactionIDL = await anchor.Program.fetchIdl(profileFactionProgramId, anchorProvider);
    const profileFactionProgram = new BrowserAnchor.anchor.Program(profileFactionIDL, profileFactionProgramId, anchorProvider);
 
    // token accounts
    const tokenProgram = new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    const AssociatedTokenProgram = new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

    const wallets = {
        'solana': window.solana,
        'solflare': window.solflare,
        'phantom': window.phantom.solana
    }
    
    async function getProvider (wallets) {
        const walletNames = Object.keys(wallets)
        const walletName = walletNames.find(name => name in walletWindow)
        if (walletName) {
            const provider = wallets[walletName];
            if (!provider.isConnected) await provider.connect();
            return provider; 
        }
    }

    async function createProgramDerivedAccount(derived, derivedFrom1, derivedFrom2) {
        const keys = [{
            pubkey: userPublicKey,
            isSigner: true,
            isWritable: true
        }, {
            pubkey: derived,
            isSigner: false,
            isWritable: true
        }, {
            pubkey: derivedFrom1,
            isSigner: false,
            isWritable: false
        }, {
            pubkey: derivedFrom2,
            isSigner: false,
            isWritable: false
        }, {
            pubkey: solanaWeb3.SystemProgram.programId,
            isSigner: false,
            isWritable: false
        }, {
            pubkey: tokenProgram,
            isSigner: false,
            isWritable: false
        }];

        return await txSignAndSend({
            instruction: new solanaWeb3.TransactionInstruction({
                keys: keys,
                programId: AssociatedTokenProgram.toString(),
                data: []
            })
        });
    }

    const ResourceTokens = {
        fuel: {
            name: 'Fuel',
            publicKey: new solanaWeb3.PublicKey('fueL3hBZjLLLJHiFH9cqZoozTG3XQZ53diwFPwbzNim')
        },
        food: {
            name: 'Food',
            publicKey: new solanaWeb3.PublicKey('foodQJAztMzX1DKpLaiounNe2BDMds5RNuPC6jsNrDG')
        },
        ammo: {
            name: 'Ammo',
            publicKey: new solanaWeb3.PublicKey('ammoK8AkX2wnebQb35cDAZtTkvsXQbi82cGeTnUvvfK')
        },
        toolkit: {
            name: 'Toolkit',
            publicKey: new solanaWeb3.PublicKey('tooLsNYLiVqzg8o4m3L2Uetbn62mvMWRqkog6PQeYKL')
        },
        carbon: {
            name: 'Carbon',
            publicKey: new solanaWeb3.PublicKey('CARBWKWvxEuMcq3MqCxYfi7UoFVpL9c4rsQS99tw6i4X')
        },
        ironore: {
            name: 'Iron Ore',
            publicKey: new solanaWeb3.PublicKey('FeorejFjRRAfusN9Fg3WjEZ1dRCf74o6xwT5vDt3R34J')
        },
        diamond: {
            name: 'Diamond',
            publicKey: new solanaWeb3.PublicKey('DMNDKqygEN3WXKVrAD4ofkYBc4CKNRhFUbXP4VK7a944')
        },
        lumanite: {
            name: 'Lumanite',
            publicKey: new solanaWeb3.PublicKey('LUMACqD5LaKjs1AeuJYToybasTXoYQ7YkxJEc4jowNj')
        },
        biomass: {
            name: 'Biomass',
            publicKey: new solanaWeb3.PublicKey('MASS9GqtJz6ABisAxcUn3FeR4phMqH1XfG6LPKJePog')
        },
        arco: {
            name: 'Arco',
            publicKey: new solanaWeb3.PublicKey('ARCoQ9dndpg6wE2rRexzfwgJR3NoWWhpcww3xQcQLukg')
        },
        hydrogen: {
            name: 'Hydrogen',
            publicKey: new solanaWeb3.PublicKey('HYDR4EPHJcDPcaLYUcNCtrXUdt1PnaN4MvE655pevBYp')
        },
        copperore: {
            name: 'Copper Ore',
            publicKey: new solanaWeb3.PublicKey('CUore1tNkiubxSwDEtLc3Ybs1xfWLs8uGjyydUYZ25xc')
        },
        rochinol: {
            name: 'Rochinol',
            publicKey: new solanaWeb3.PublicKey('RCH1Zhg4zcSSQK8rw2s6rDMVsgBEWa4kiv1oLFndrN5')
        },
        sdu: {
            name: 'SDU',
            publicKey: new solanaWeb3.PublicKey('SDUsgfSZaDhhZ76U3ZgvtFiXsfnHbf2VrzYxjBZ5YbM'),
            from: new solanaWeb3.PublicKey('8bBi84Yi7vwSWXSYKDbbHmqnFqqAS41MvPkSEdzFtbsk')
        },
        getPodToken: async function (name, pod) {
            if (!pod || !this[normalizedName].from) throw new Error('Need to provide pod (fleet or starbase) for resource!')
            if (!name || name === '') throw new Error('Need to provide resource name');

            const normalizedName = name.toLowerCase().trim();
            const pda = BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
                [
                    (pod || this[normalizedName].from).toBuffer(),
                    tokenProgram.toBuffer(),
                    this[normalizedName].publicKey.toBuffer()
                ],
                AssociatedTokenProgram
            );

            try {
                await solanaConnection.getAccountInfo(pda);
            } catch {
                await createProgramDerivedAccount(pda, pod, this[normalizedName].publicKey);
            }
            return pda;
        }
    }

    const seqBN = new BrowserAnchor.anchor.BN(cargoStatsDefSeqId);
    const seqArr = seqBN.toTwos(64).toArrayLike(BrowserBuffer.Buffer.Buffer, "be", 2);
    const seq58 = bs58.encode(seqArr);

    const [sduCargoTypeAcct] = await cargoProgram.account.cargoType.all([
        {
           memcmp: {
               offset: 41,
                bytes: SDUToken.toBase58(),
            },
        },
        {
           memcmp: {
               offset: 75,
                bytes: seq58,
            },
        },
    ]);
    const [repairKitCargoTypeAcct] = await cargoProgram.account.cargoType.all([
        {
           memcmp: {
               offset: 41,
                bytes: ResourceTokens.toolkit.publicKey.toBase58(),
            },
        },
        {
           memcmp: {
               offset: 75,
                bytes: seq58,
            },
        },
    ]);
    const [fuelCargoTypeAcct] = await cargoProgram.account.cargoType.all([
        {
           memcmp: {
               offset: 41,
                bytes: ResourceTokens.fuel.publicKey.toBase58(),
            },
        },
        {
           memcmp: {
               offset: 75,
                bytes: seq58,
            },
        },
    ]);
    const cargoTypes = await cargoProgram.account.cargoType.all([
        {
           memcmp: {
               offset: 75,
                bytes: seq58,
            },
        },
    ]);

    function getFleetState(fleetAcctInfo) {
        let remainingData = fleetAcctInfo.data.slice(414);
        let fleetState = 'Unknown';
        let extra = null;
        switch(remainingData[0]) {
            case 0:
                fleetState = 'StarbaseLoadingBay';
                extra = sageProgram.coder.types.decode('StarbaseLoadingBay', remainingData.slice(1));
                break;
            case 1: {
                fleetState = 'Idle';
                let sector = sageProgram.coder.types.decode('Idle', remainingData.slice(1));
                extra = [sector.sector[0].toNumber(), sector.sector[1].toNumber()]
                break;
            }
            case 2:
                fleetState = 'MineAsteroid';
                extra = sageProgram.coder.types.decode('MineAsteroid', remainingData.slice(1));
                break;
            case 3:
                fleetState = 'MoveWarp';
                extra = sageProgram.coder.types.decode('MoveWarp', remainingData.slice(1));
                break;
            case 4:
                fleetState = 'MoveSubwarp';
                extra = sageProgram.coder.types.decode('MoveSubwarp', remainingData.slice(1));
                break;
            case 5:
                fleetState = 'Respawn';
                break;
        }
        return [fleetState, extra];
    }

    let provider;
    async function initUser() {
        provider = await getProvider(wallets);
        const userPublicKey = provider.publicKey();
        let userProfiles = await solanaConnection.getProgramAccounts(profileProgramId);

        let playerProfiles = [];
        for (let [index, userProfile] of userProfiles.entries()) {
            const profileData = userProfile.account.data.slice(30);
            const profileSize = 80;
            for (let i = 0; i < profileData.length; i += profileSize) {
                const profile = array.slice(i, i + profileSize);
                const decodedProfile = profileProgram.coder.types.decode('ProfileKey', profile);

                if (decodedProfile.key.toString() === userPublicKey.toString()) {
                    const [playerNameAcct] = await solanaConnection.getProgramAccounts(
                        profileProgramId,
                        {
                            filters: [
                                {
                                    memcmp: {
                                        offset: 9,
                                        bytes: userProfile.pubkey.toString(),
                                    },
                                },
                            ],
                        }
                    );
                    const playerName = playerNameAcct ? new TextDecoder().decode(playerNameAcct.account.data.slice(42)) : '';
                    playerProfiles.push({ account: userProfile, name: playerName, index })
                }
            }
        }

        const userProfile = playerProfiles.length > 1 ? await assistProfileToggle(playerProfiles) : playerProfiles[0];
        const [userProfileFactionAcct] = await profileFactionProgram.account.profileFactionAccount.all([
            {
                memcmp: {
                    offset: 9,
                    bytes: userProfile.account.toBase58(),
                },
            },
        ]);
        const userFleetAccts = await sageProgram.account.fleet.all([
            {
                memcmp: {
                    offset: 41,
                    bytes: userProfile.account.toBase58(),
                },
            },
        ]);

        for (let fleet of userFleetAccts) {
            const name = new TextDecoder("utf-8").decode(new Uint8Array(fleet.account.fleetLabel)).replace(/\0/g, '');
                     
            const fleetDefaultData = {
                origin: {
                    coord: '',
                    supplies: {}
                },
                destination:  {
                    coord: '',
                    supplies: {}
                },
                moveType: 'warp',
                mineResource: '',
                minePlanet: null,
                scanMinimumProbability: 10,
                scanSkipCnt: 0, 
                scanSectorStart: 0,
                scanSectorEnd: 0, 
                scanBlock: [],
                scanMove: true,             
            }

            const fleetSavedData = JSON.parse(await GM.getValue(fleet.publicKey.toString(), '{}'));
            
            // @todo - left off here
            let fleetDest = fleetParsedData && fleetParsedData.dest ? fleetParsedData.dest : '';
            let fleetScanBlock = fleetParsedData && fleetParsedData.scanBlock ? fleetParsedData.scanBlock : [];
            let fleetScanMin = fleetParsedData && fleetParsedData.scanMin ? fleetParsedData.scanMin : 10;
            let fleetScanMove = fleetParsedData && fleetParsedData.scanMove == 'false' ? 'false' : 'true';
            let fleetMineResource = fleetParsedData && fleetParsedData.mineResource ? fleetParsedData.mineResource : '';
            let fleetStarbase = fleetParsedData && fleetParsedData.starbase ? fleetParsedData.starbase : '';
            let fleetMoveType = fleetParsedData && fleetParsedData.moveType ? fleetParsedData.moveType : 'warp';
            let fleetMoveTarget = fleetParsedData && fleetParsedData.destination ? fleetParsedData.destination : '';
            
            let [fleetState, extra] = getFleetState(fleetAcctInfo);      
            if (fleetState == 'Idle' && extra) {
                for (let i = 0; i < fleetScanBlock.length; i++) {
                    if (fleetCoords[0] == fleetScanBlock[i][0] && fleetCoords[1] == fleetScanBlock[i][1]) {
                        fleetDefaultData.fleetScanBlockIdx = i;
                        break;
                    }
                }
            }

            userFleets.push({
                name,
                ...fleetDefaultData,
                account: fleet.account 
            });
        }
        userFleets.sort(function (a, b) {
            return a.name.toUpperCase().localeCompare(b.name.toUpperCase());
        });

        return { userProfile, userProfileFactionAcct };
    }

    // @todo - use in the handle functions to figure out things
    // await solanaConnection.getAccountInfo(fleetSduToken) || await createProgramDerivedAccount(fleetSduToken, fleet.account.cargoHold, SDUToken);
    // await solanaConnection.getAccountInfo(fleetRepairKitToken) || await createProgramDerivedAccount(fleetRepairKitToken, fleet.account.cargoHold, ResourceTokens.toolkit.publicKey);
    // await solanaConnection.getAccountInfo(fleetFuelToken) || await createProgramDerivedAccount(fleetFuelToken, fleet.account.fuelTank, ResourceTokens.fuel.publicKey);
    
    // let fleetCurrentCargo = await solanaConnection.getParsedTokenAccountsByOwner(fleet.account.cargoHold, {programId: tokenProgram});
    // let currentToolCnt = fleetCurrentCargo.value.find(item => item.pubkey.toString() === fleetRepairKitToken.toString());
    // let fleetCurrentFuel = await solanaConnection.getParsedTokenAccountsByOwner(fleet.account.fuelTank, {programId: tokenProgram});
    // let currentFuelCnt = fleetCurrentFuel.value.find(item => item.pubkey.toString() === fleetFuelToken.toString());
    // let fleetAcctInfo = await solanaConnection.getAccountInfo(fleet.publicKey);

    function wait(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }

    function getBalanceChange(txResult, targetAcct) {
        let acctIdx = txResult.transaction.message.staticAccountKeys.findIndex(item => item.toString() === targetAcct);
        let preBalanceObj = txResult.meta.preTokenBalances.find(item => item.accountIndex === acctIdx);
        let preBalance = preBalanceObj && preBalanceObj.uiTokenAmount && preBalanceObj.uiTokenAmount.uiAmount ? preBalanceObj.uiTokenAmount.uiAmount : 0;
        let postBalanceObj = txResult.meta.postTokenBalances.find(item => item.accountIndex === acctIdx);
        let postBalance = postBalanceObj && postBalanceObj.uiTokenAmount && postBalanceObj.uiTokenAmount.uiAmount ? postBalanceObj.uiTokenAmount.uiAmount : 0;
        return {preBalance: preBalance, postBalance: postBalance}
    }

    // Extracted from SAGE Labs, keep for future reference
    function getTokenBalanceChanges(br, targetAcct) {
        const gr = {};
        if (br.meta && br.meta.preTokenBalances && br.meta.postTokenBalances) {
            for (const _r of br.meta.preTokenBalances) {
                const vr = br.transaction.message.staticAccountKeys[_r.accountIndex]
                , Sr = _r.uiTokenAmount.uiAmount ?? 0;
                gr[vr.toString()] = Sr
            }
            for (const _r of br.meta.postTokenBalances) {
                const vr = br.transaction.message.staticAccountKeys[_r.accountIndex]
                , wr = (_r.uiTokenAmount.uiAmount ?? 0) - gr[vr.toString()];
                gr[vr.toString()] = wr
            }
        }
        return gr
    }

    function calculateMovementDistance(orig, dest) {
        return dest ? Math.sqrt((orig[0] - dest[0]) ** 2 + (orig[1] - dest[1]) ** 2) : 0
    }

    function calculateWarpTime(fleet, distance) {
        return fleet.warpSpeed > 0 ? distance / (fleet.warpSpeed / 1e6) : 0
    }

    function calculateWarpFuelBurn(fleet, distance) {
        return distance * (fleet.warpFuelConsumptionRate / 100)
    }

    function calculateSubwarpTime(fleet, distance) {
        return fleet.subwarpSpeed > 0 ? distance / (fleet.subwarpSpeed / 1e6) : 0
    }

    function calculateSubwarpFuelBurn(fleet, distance) {
        return distance * (fleet.subwarpFuelConsumptionRate / 100)
    }

    function calculateMiningDuration(cargoCapacity, miningRate, resourceHardness, systemRichness) {
        return resourceHardness > 0 ? Math.ceil(cargoCapacity / (((miningRate / 10000) * (systemRichness / 100)) / (resourceHardness / 100))) : 0;
    }

    async function getStarbaseFromCoords(x, y) {
        return new Promise(async resolve => {
            let xBN = new BrowserAnchor.anchor.BN(x);
            let xArr = xBN.toTwos(64).toArrayLike(BrowserBuffer.Buffer.Buffer, "le", 8);
            let x58 = bs58.encode(xArr);
            let yBN = new BrowserAnchor.anchor.BN(y);
            let yArr = yBN.toTwos(64).toArrayLike(BrowserBuffer.Buffer.Buffer, "le", 8);
            let y58 = bs58.encode(yArr);
            let [starbase] = await sageProgram.account.starbase.all([
                {
                    memcmp: {
                        offset: 41,
                        bytes: x58
                    }
                },
                {
                    memcmp: {
                        offset: 49,
                        bytes: y58
                    }
                },
            ]);
            resolve(starbase);
        });
    }

    async function getPlanetsFromCoords(x, y) {
        return new Promise(async resolve => {
            let xBN = new BrowserAnchor.anchor.BN(x);
            let xArr = xBN.toTwos(64).toArrayLike(BrowserBuffer.Buffer.Buffer, "le", 8);
            let x58 = bs58.encode(xArr);
            let yBN = new BrowserAnchor.anchor.BN(y);
            let yArr = yBN.toTwos(64).toArrayLike(BrowserBuffer.Buffer.Buffer, "le", 8);
            let y58 = bs58.encode(yArr);
            let planets = await sageProgram.account.planet.all([
                {
                    memcmp: {
                        offset: 105,
                        bytes: x58
                    }
                },
                {
                    memcmp: {
                        offset: 113,
                        bytes: y58
                    }
                },
            ]);
            resolve(planets);
        });
    }

    async function getStarbasePlayer(userProfile, starbase) {
        return new Promise(async resolve => {
            let [starbasePlayer] = await sageProgram.account.starbasePlayer.all([
                {
                    memcmp: {
                        offset: 9,
                        bytes: userProfile.toBase58()
                    }
                },
                {
                    memcmp: {
                        offset: 73,
                        bytes: starbase.toBase58()
                    }
                },
            ]);
            resolve(starbasePlayer);
        });
    }

    async function getFleetCntAtCoords() {
        let gridSizeElem = document.querySelector('#fleetGridSelect');
        let gridSize = gridSizeElem.value;
        let targetCoordsElem = document.querySelector('#checkFleetCntInput');
        let targetCoords = targetCoordsElem.value;
        let fleetGrid = document.querySelector('#fleetGrid');
        let loadingMessage = document.querySelector('#loadingMessage');
        if (!targetCoords || targetCoords.trim() === '') {
            loadingMessage.innerText = 'Please enter target coordinates for grid center.';
            loadingMessage.style.display = 'block';
            fleetGrid.style.display = 'none';
            return;// Stop further processing since input is empty or idle
        }
        let [x, y] = targetCoords.split(',').map(coord => parseInt(coord.trim()));

        fleetGrid.innerHTML = ''; // Clear previous results

        try {
            loadingMessage.innerText = 'Loading...';
            loadingMessage.style.display = 'block';
            fleetGrid.style.display = 'none';

            for (let i = 0; i < gridSize; i++) {
                let row = fleetGrid.insertRow();
                for (let j = 0; j < gridSize; j++) {
                    let coordX = x + j - Math.floor(gridSize / 2);// Adjusted for column-first population
                    let coordY = y + (gridSize-1) - i - Math.floor(gridSize / 2);// Adjusted for descending y value

                    let xBN = new BrowserAnchor.anchor.BN(coordX);
                    let xArr = xBN.toTwos(64).toArrayLike(BrowserBuffer.Buffer.Buffer, 'le', 8);
                    let x58 = bs58.encode(xArr);

                    let yBN = new BrowserAnchor.anchor.BN(coordY);
                    let yArr = yBN.toTwos(64).toArrayLike(BrowserBuffer.Buffer.Buffer, 'le', 8);
                    let y58 = bs58.encode(yArr);

                    let fleetAccts = await solanaConnection.getProgramAccounts(sageProgramId, {
                        filters: [
                            { memcmp: { offset: 415, bytes: x58 } },
                            { memcmp: { offset: 423, bytes: y58 } },
                        ],
                    });

                    let cell = row.insertCell(j);
                    // Create a div to hold the content for formatting
                    let contentDiv = document.createElement('div');
                    contentDiv.style.textAlign = 'center';

                    // Set the content of the div (coordinates and fleet count)
                    contentDiv.innerHTML = `<div>[${coordX},${coordY}]</div><div>${fleetAccts.length}</div>`;

                    // Calculate gradient color based on fleetAccts.length
                    const gradientColor = calculateGradientColor(fleetAccts.length);

                    // Apply background gradient
                    cell.style.background = gradientColor;

                    // Apply border style
                    cell.style.border = '2px solid rgb(255, 190, 77)';
                    cell.style.borderRadius = '8px';
                    cell.style.padding = '9px'; // Adjust padding to maintain inner content space
                    cell.style.position = 'relative';

                    // Append the content div to the cell
                    cell.appendChild(contentDiv);

                    // Add a green Unicode circle if fleet count is below 5
                    if (fleetAccts.length < 5) {
                        const greenCircle = document.createElement('div');
                        greenCircle.style.position = 'absolute';
                        greenCircle.style.bottom = '-3px';
                        greenCircle.style.right = '0px';
                        greenCircle.style.fontSize = '20px';
                        greenCircle.innerHTML = '&#9679;'; // Unicode circle
                        greenCircle.style.color = 'rgb(0, 255, 0, 1)';
                        greenCircle.style.opacity = '1.0';
                        cell.appendChild(greenCircle);
                    }

                    // Function to calculate gradient color
                    function calculateGradientColor(fleetCount) {
                        const maxFleetCount = 25; // Maximum fleet count for the hottest color
                        const minFleetCount = 0; // Minimum fleet count for the coolest color

                        // Map the fleet count to an RGB value (blue to red gradient)
                        const r = Math.floor((fleetCount / maxFleetCount) * 255);
                        const g = 0;
                        const b = Math.floor(((maxFleetCount - fleetCount) / maxFleetCount) * 255);

                        // Calculate the gradient direction based on fleet count (0 degrees for cool to 90 degrees for hot)
                        const gradientDirection = 0 + (fleetCount / maxFleetCount) * 90;

                        // Adjust the gradient direction by 180 degrees to place it at the bottom
                        const adjustedGradientDirection = gradientDirection - 45;

                        // Construct the gradient CSS with stops from 0% to 50% for the color and 50% to 100% for transparent
                        return `linear-gradient(${adjustedGradientDirection}deg, rgba(${r}, ${g}, ${b}, 1) 0%, rgba(${r}, ${g}, ${b}, 0) 50%, rgba(${r}, ${g}, ${b}, 0) 100%)`;
                    }
                }
            }

            loadingMessage.style.display = 'none';
            fleetGrid.style.display = 'block';
            //resultDiv.appendChild(fleetGrid);

        } catch (error) {
            console.error('Error fetching fleet information:', error);
            loadingMessage.innerText = 'Error fetching fleet information';
        }
    }

    function waitForTxConfirmation(txHash, blockhash, lastValidBlockHeight) {
        return new Promise(async resolve => {
            let response = null;
            try {
                let confirmation = await solanaConnection.confirmTransaction({
                    blockhash,
                    lastValidBlockHeight,
                    signature: txHash
                }, 'confirmed');
                response = confirmation;
            } catch (err) {
                console.log('ERROR: ', err);
                console.log('ERROR NAME: ', err.name);
                response = err;
            }
            resolve(response);
        });
    }
    
    function httpMonitor(connection, txHash, txn, lastValidBlockHeight, lastMinAverageBlockSpeed, count = 1) {
        const acceptableCommitments = [connection.commitment, 'finalized'];

        return new Promise(async (resolve, reject) => {
            try {
                let { blockHeight } = await connection.getEpochInfo({ commitment: 'confirmed' });
                if (blockHeight >= lastValidBlockHeight) reject({ name: 'LudicrousTimoutError', err: `Timed out for ${txHash}` });
                const signatureStatus = await connection.getSignatureStatus(txHash);

                if (signatureStatus.err) {
                    console.log('HTTP error for', txHash, signatureStatus);
                    reject(signatureStatus);
                } else if (signatureStatus.value === null || !acceptableCommitments.includes(signatureStatus.value.confirmationStatus)) {
                    console.log('HTTP not confirmed', txHash, signatureStatus);
                    await wait(lastMinAverageBlockSpeed * graceBlockWindow);
                    resolve({ count });
                } else if (acceptableCommitments.includes(signatureStatus.value.confirmationStatus) ) {
                    console.log('HTTP confirmed', txHash, signatureStatus);
                    resolve({type: 'http', txHash, confirmation: signatureStatus});
                }
            } catch (error) {
                console.log(`HTTP connection error: ${txHash}`, error);
                reject(error);
            }
        }).then(async (result) => {
            const { count, type, txHash, confirmation } = { ...result };
            if (type) return { type, txHash, confirmation };
            if (count % 7 == 0) {
                console.log('---RESENDTXN---');
                await connection.sendRawTransaction(txn, {skipPreflight: true, maxRetries: 0, preflightCommitment: 'confirmed'});
            }
            if (count < 30) return httpMonitor(connection, txHash, txn, lastValidBlockHeight, ++count);
            return { name: 'LudicrousTimoutError', err: `Timed out for ${txHash}` };
        }, (error) => {
            return error;
        });
    }

    function wsMonitor(connection, txHash) {
        let id;
        const ws = new Promise(async(resolve, reject) => {
            try {
                console.log('Set up WS connection', txHash);
                id = connection.onSignature(txHash, (result) => {
                    if (result.err) {
                        reject(result);
                    } else {
                        console.log('WS confirmed', txHash, result);
                        resolve({type: 'ws', txHash, confirmation: result});
                    }
                },
                connection.commitment);
            } catch (error) {
                console.log('WS error in setup', txHash, error);
                reject(error);
            }
        });

        return { id, ws };
    }

    async function sendLudicrousTransaction(txn, lastValidBlockHeight, connection) {
        console.log('---SENDTXN---');
        let txHash = await connection.sendRawTransaction(txn, {skipPreflight: true, maxRetries: 0, preflightCommitment: 'confirmed'});
        console.log(txHash);

        const recentPerformanceSamples = await connection.getRecentPerformanceSamples(1);
        const { samplePeriodSecs, numSlots } = recentPerformanceSamples[0];
        const lastMinAverageBlockSpeed = Math.floor(samplePeriodSecs * 1000 / numSlots);

        const { id, ws } = wsMonitor(connection, txHash);
        const http = httpMonitor(connection, txHash, txn, lastValidBlockHeight, lastMinAverageBlockSpeed);

        return Promise.any([ws, http]).then((result) => {
            const { type, txHash, confirmation } = result;
            if (type == 'http') connection.removeSignatureListener(id);
            return { txHash, confirmation };
        }, (error) => {
            return { txHash, confirmation: error };
        });
    }

    function txSignAndSend(ix) {
        return new Promise(async (resolve, reject) => {
            let tx = new solanaWeb3.Transaction();
            const { blockhash, lastValidBlockHeight } = await solanaConnection.getLatestBlockhash('confirmed');

            console.log('---INSTRUCTION---');
            console.log(ix);
            if (ix.constructor === Array) {
                ix.forEach(item => tx.add(item.instruction))
            } else {
                tx.add(ix.instruction);
            }

            tx.recentBlockhash = blockhash;
            tx.lastValidBlockHeight = lastValidBlockHeight;
            tx.feePayer = userPublicKey;
            tx.signer = userPublicKey;
            
            let txSigned = null;
            if (typeof solflare === 'undefined') {
                txSigned = await solana.signAllTransactions([tx]);
            } else {
                txSigned = await solflare.signAllTransactions([tx]);
            }
            
            const txSerialized = txSigned[0].serialize();
            let txHash, confirmation;
            if (ludicrousMode) {
                ({ txHash, confirmation} = await sendLudicrousTransaction(txSerialized, lastValidBlockHeight, solanaConnection));
            } else {
                txHash = await solanaConnection.sendRawTransaction(txSerialized, {skipPreflight: true, preflightCommitment: 'confirmed'});
                console.log('---TXHASH---');
                console.log(txHash);
                confirmation = await waitForTxConfirmation(txHash, blockhash, lastValidBlockHeight);
            }
            
            console.log('---CONFIRMATION---');
            console.log(confirmation);
            if ((confirmation.name == 'TransactionExpiredBlockheightExceededError' || confirmation.name == 'LudicrousTimoutError')) {
                reject(ix);
            }
            
            const txResult = await solanaConnection.getTransaction(txHash, {commitment: 'confirmed', preflightCommitment: 'confirmed', maxSupportedTransactionVersion: 1});
            console.log('txResult: ', txResult);
            resolve(txResult);
        }).catch(ix => {
            console.log('-----RETRY-----');
            return txSignAndSend(ix);
        });
    }

    //bitshift taken from @staratlas/sage permissions.ts
    function buildPermissions(input) {
        const out = [0,0,0,0,0,0,0,0];
        out[0] = new BrowserAnchor.anchor.BN(
            (input[0][0] ? 1 << 0 : 0) |
            (input[0][1] ? 1 << 1 : 0) |
            (input[0][2] ? 1 << 2 : 0) |
            (input[0][3] ? 1 << 3 : 0) |
            (input[0][4] ? 1 << 4 : 0) |
            (input[0][5] ? 1 << 5 : 0) |
            (input[0][6] ? 1 << 6 : 0) |
            (input[0][7] ? 1 << 7 : 0));
        out[1] = new BrowserAnchor.anchor.BN(
            (input[1][0] ? 1 << 0 : 0) |
            (input[1][1] ? 1 << 1 : 0) |
            (input[1][2] ? 1 << 2 : 0) |
            (input[1][3] ? 1 << 3 : 0) |
            (input[1][4] ? 1 << 4 : 0) |
            (input[1][5] ? 1 << 5 : 0) |
            (input[1][6] ? 1 << 6 : 0) |
            (input[1][7] ? 1 << 7 : 0));
        out[2] = new BrowserAnchor.anchor.BN(
            (input[2][0] ? 1 << 0 : 0) |
            (input[2][1] ? 1 << 1 : 0) |
            (input[2][2] ? 1 << 2 : 0) |
            (input[2][3] ? 1 << 3 : 0) |
            (input[2][4] ? 1 << 4 : 0) |
            (input[2][5] ? 1 << 5 : 0) |
            (input[2][6] ? 1 << 6 : 0) |
            (input[2][7] ? 1 << 7 : 0));
        console.log('out: ', out);
        return out;
    }

    async function addKeyToProfile(newKey) {
        return new Promise(async resolve => {
            let permissions = buildPermissions([[true,true,true,true,true,true,true,true],[true,true,true,true,true,true,true,true],[true,true,true,true,true,true,true,true]]);
            //let permissions = buildPermissions([[true,false,false,false,false,false,false,false],[false,false,true,true,true,false,false,true],[true,false,true,true,true,false,true,true]]);
            /*
            let keys = [{key: 'newKey', expireTime: new BrowserAnchor.anchor.BN(-1), permissions: permissions}];
            let tempKeys = keys.map(
              (key) => ({
                sageProgramId,
                expireTime:
                  key.expireTime,
                permissions: key.permissions,
              }),
            )
            */
            let txResult = {};
            if (newKey.length > 0) {
                let tx = { instruction: await profileProgram.methods.addKeys(0, 0, [{
                    scope: sageProgramId,
                    expireTime: new BrowserAnchor.anchor.BN(-1),
                    permissions: permissions
                }]).accountsStrict({
                    funder: userPublicKey,
                    profile: userProfileAcct,
                    key: userPublicKey,
                    systemProgram: solanaWeb3.SystemProgram.programId
                }).remainingAccounts([{
                    pubkey: new solanaWeb3.PublicKey(newKey),
                    isSigner: false,
                    isWritable: false
                }]).instruction()}
                txResult = await txSignAndSend(tx);
            } else {
                txResult = {name: "InputNeeded"};
            }
            resolve(txResult);
        });
    }

    async function removeKeyFromProfile() {
        return new Promise(async resolve => {
            let tx = { instruction: await profileProgram.methods.removeKeys(0, [new BrowserAnchor.anchor.BN(1), new BrowserAnchor.anchor.BN(2)]).accountsStrict({
                funder: userPublicKey,
                profile: userProfileAcct,
                key: userPublicKey,
                systemProgram: solanaWeb3.SystemProgram.programId
            }).instruction()}
            let txResult = await txSignAndSend(tx);
            resolve(txResult);
        });
    }

    async function execScan(fleet) {
        return new Promise(async resolve => {
            // FIX: need to figure out how to initialize fleet.sduToken
            //      look for await gr.getAccountInfo(Br) || (Rr.push(srcExports$2.createAssociatedTokenAccount(qr, Qr, !0).instructions)
            let tx = { instruction: await sageProgram.methods.scanForSurveyDataUnits({keyIndex: new BrowserAnchor.anchor.BN(userProfileKeyIdx)}).accountsStrict({
                gameAccountsFleetAndOwner: {
                    gameFleetAndOwner: {
                        fleetAndOwner: {
                            fleet: fleet.publicKey, // sageProgram.fleet.publicKey
                            owningProfile: userProfileAcct, // from API
                            owningProfileFaction: userProfileFactionAcct.publicKey,
                            key: userPublicKey // wallet.publicKey
                        },
                        gameId: sageGameAcct.publicKey // sageProgram.game.publicKey
                    },
                    gameState: sageGameAcct.account.gameState // sageProgram.game.gameState
                },
                surveyDataUnitTracker: sageSDUTrackerAcct.publicKey, // sageProgram.SurveyDataUnitTracker.publicKey
                surveyDataUnitTrackerSigner: sageSDUTrackerAcct.account.signer, // sageProgram.SurveyDataUnitTracker.signer
                cargoHold: fleet.cargoHold, // sageProgram.fleet.cargoHold
                sduCargoType: sduCargoTypeAcct.publicKey, // cargoProgram.cargoType - memcmp offset 41 'SDUsgfSZaDhhZ76U3ZgvtFiXsfnHbf2VrzYxjBZ5YbM'
                repairKitCargoType: repairKitCargoTypeAcct.publicKey, // cargoProgram.cargoType - memcmp offset 41 'tooLsNYLiVqzg8o4m3L2Uetbn62mvMWRqkog6PQeYKL'
                cargoStatsDefinition: sageGameAcct.account.cargo.statsDefinition, // sageProgram.game.cargo
                sduTokenFrom: sduTokenFrom, // calculated
                sduTokenTo: fleet.sduToken,
                repairKitTokenFrom: fleet.repairKitToken,
                repairKitMint: sageGameAcct.account.mints.repairKit, // sageProgram.game.repairKit
                cargoProgram: cargoProgramId, // static
                tokenProgram: tokenProgram, // static
                recentSlothashes: new solanaWeb3.PublicKey('SysvarS1otHashes111111111111111111111111111'), // static
                instructionsSysvar: new solanaWeb3.PublicKey('Sysvar1nstructions1111111111111111111111111') // static
            }).instruction()}
            fleet.busy = true;
            let txResult = await txSignAndSend(tx);
            fleet.busy = false;
            resolve(txResult);
        });
    }
    
    async function execSubwarp(fleet, origin, destination) {
        const [destX, destY] = destination;
        const moveDist = calculateMovementDistance(origin, destination);
        const subwarpCost = calculateSubwarpFuelBurn(fleet, moveDist);
    
        const fleetCurrentFuelTank = await solanaConnection.getParsedTokenAccountsByOwner(fleet.fuelTank, { programId: tokenProgram });
        let currentFuel = fleetCurrentFuelTank.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.fuel.toString());
        currentFuel = currentFuel ? currentFuel.account.data.parsed.info.tokenAmount.uiAmount : 0;

        if (currentFuel < subwarpCost) {
            console.log(`[${fleet.label}] Unable to move, lack of fuel`);
            return fleet.state = 'ERROR: Not enough fuel';
        }

        const tx = { instruction: await sageProgram.methods.startSubwarp({keyIndex: new BrowserAnchor.anchor.BN(userProfileKeyIdx), toSector: [new BrowserAnchor.anchor.BN(destX), new BrowserAnchor.anchor.BN(destY)]}).accountsStrict({
            gameAccountsFleetAndOwner: {
                gameFleetAndOwner: {
                    fleetAndOwner: {
                        fleet: fleet.publicKey,
                        owningProfile: userProfileAcct,
                        owningProfileFaction: userProfileFactionAcct.publicKey,
                        key: userPublicKey
                    },
                    gameId: sageGameAcct.publicKey
                },
                gameState: sageGameAcct.account.gameState
            },
        })/*.remainingAccounts([
            {
                pubkey: userProfileAcct,
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: fleet.fuelTank,
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: fuelCargoTypeAcct.publicKey,
                isSigner: false,
                isWritable: false
            },
            {
                pubkey: sageGameAcct.account.cargo.statsDefinition,
                isSigner: false,
                isWritable: false
            },
            {
                pubkey: fleet.fuelToken,
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: sageGameAcct.account.mints.fuel,
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: sageGameAcct.account.gameState,
                isSigner: false,
                isWritable: false
            },
            {
                pubkey: sageGameAcct.publicKey,
                isSigner: false,
                isWritable: false
            },
            {
                pubkey: cargoProgramId,
                isSigner: false,
                isWritable: false
            },
            {
                pubkey: tokenProgram,
                isSigner: false,
                isWritable: false
            },
        ])*/.instruction()}
        return await txSignAndSend(tx);      
    }

    async function execExitSubwarp(fleet) {
        return new Promise(async resolve => {
            let tx = { instruction: await sageProgram.methods.fleetStateHandler().accountsStrict({
                fleet: fleet.publicKey
            }).remainingAccounts([
                {
                    pubkey: userProfileAcct,
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: fleet.fuelTank,
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: fuelCargoTypeAcct.publicKey,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: sageGameAcct.account.cargo.statsDefinition,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: fleet.fuelToken,
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: sageGameAcct.account.mints.fuel,
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: sageGameAcct.account.gameState,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: sageGameAcct.publicKey,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: cargoProgramId,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: tokenProgram,
                    isSigner: false,
                    isWritable: false
                },
            ]).instruction()}
            fleet.busy = true;
            let txResult = await txSignAndSend(tx);
            fleet.busy = false;
            resolve(txResult);
        });
    }

    async function execWarp(fleet, origin, destination) {
        const [originX, originY] = origin;
        let [destX, destY] = destination;

        let moveDist = calculateMovementDistance(origin, destination);
        if (moveDist > (fleet.maxWarpDistance / 100)) {
            const warpCnt = fleet.maxWarpDistance > 0 ? moveDist / (fleet.maxWarpDistance / 100) : 1;
            const warpX = Math.trunc((destX - originX) / warpCnt);            
            const warpY = Math.trunc((destY - originY) / warpCnt);
            
            destX = originX + warpX;
            destY = originY + warpY;
            
            moveDist = calculateMovementDistance(origin, [destX,destY]);
        }

        const warpCost = calculateWarpFuelBurn(fleet, moveDist);
        const fleetCurrentFuelTank = await solanaConnection.getParsedTokenAccountsByOwner(fleet.fuelTank, { programId: tokenProgram });
        let currentFuel = fleetCurrentFuelTank.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.fuel.toString());
        currentFuel = currentFuel ? currentFuel.account.data.parsed.info.tokenAmount.uiAmount : 0;

        if (currentFuel < warpCost) {
            console.log(`[${fleet.label}] Unable to move, lack of fuel`);
            return fleet.state = 'ERROR: Not enough fuel';
        }

        const tx = { instruction: await sageProgram.methods.warpToCoordinate({keyIndex: new BrowserAnchor.anchor.BN(userProfileKeyIdx), toSector: [new BrowserAnchor.anchor.BN(destX), new BrowserAnchor.anchor.BN(destY)]}).accountsStrict({
            gameAccountsFleetAndOwner: {
                gameFleetAndOwner: {
                    fleetAndOwner: {
                        fleet: fleet.publicKey,
                        owningProfile: userProfileAcct,
                        owningProfileFaction: userProfileFactionAcct.publicKey,
                        key: userPublicKey
                    },
                    gameId: sageGameAcct.publicKey
                },
                gameState: sageGameAcct.account.gameState
            },
            fuelTank: fleet.fuelTank,
            cargoType: fuelCargoTypeAcct.publicKey,
            statsDefinition: sageGameAcct.account.cargo.statsDefinition,
            tokenFrom: fleet.fuelToken,
            tokenMint: sageGameAcct.account.mints.fuel,
            cargoProgram,
            tokenProgram
        }).instruction()}
        return await txSignAndSend(tx);
    }

    async function execExitWarp(fleet) {
        return new Promise(async resolve => {
            let tx = { instruction: await sageProgram.methods.fleetStateHandler().accountsStrict({
                fleet: fleet.publicKey
            }).instruction()}
            fleet.busy = true;
            let txResult = await txSignAndSend(tx);
            fleet.busy = false;
            resolve(txResult);
        });
    }

    async function execDock(fleet, dockCoords) {
        return new Promise(async resolve => {
            let starbaseX = dockCoords.split(',')[0].trim();
            let starbaseY = dockCoords.split(',')[1].trim();
            let starbase = await getStarbaseFromCoords(starbaseX, starbaseY);
            let starbasePlayer = await getStarbasePlayer(userProfileAcct,starbase.publicKey);
            console.log('-----DEBUG-----');
            console.log(userProfileKeyIdx);
            console.log(new BrowserAnchor.anchor.BN(userProfileKeyIdx));
            let tx = { instruction: await sageProgram.methods.idleToLoadingBay(new BrowserAnchor.anchor.BN(userProfileKeyIdx)).accountsStrict({
                gameAccountsFleetAndOwner: {
                    gameFleetAndOwner: {
                        fleetAndOwner: {
                            fleet: fleet.publicKey,
                            owningProfile: userProfileAcct,
                            owningProfileFaction: userProfileFactionAcct.publicKey,
                            key: userPublicKey
                        },
                        gameId: sageGameAcct.publicKey
                    },
                    gameState: sageGameAcct.account.gameState
                },
                starbaseAndStarbasePlayer: {
                    starbase: starbase.publicKey,
                    starbasePlayer: starbasePlayer.publicKey
                }
            }).instruction()}
            fleet.busy = true;
            let txResult = await txSignAndSend(tx);
            fleet.busy = false;
            resolve(txResult);
        });
    }

    async function execUndock(fleet, dockCoords) {
        return new Promise(async resolve => {
            let starbaseX = dockCoords.split(',')[0].trim();
            let starbaseY = dockCoords.split(',')[1].trim();
            let starbase = await getStarbaseFromCoords(starbaseX, starbaseY);
            let starbasePlayer = await getStarbasePlayer(userProfileAcct,starbase.publicKey);
            let tx = { instruction: await sageProgram.methods.loadingBayToIdle(new BrowserAnchor.anchor.BN(userProfileKeyIdx)).accountsStrict({
                gameAccountsFleetAndOwner: {
                    gameFleetAndOwner: {
                        fleetAndOwner: {
                            fleet: fleet.publicKey,
                            owningProfile: userProfileAcct,
                            owningProfileFaction: userProfileFactionAcct.publicKey,
                            key: userPublicKey
                        },
                        gameId: sageGameAcct.publicKey
                    },
                    gameState: sageGameAcct.account.gameState
                },
                starbaseAndStarbasePlayer: {
                    starbase: starbase.publicKey,
                    starbasePlayer: starbasePlayer.publicKey
                }
            }).remainingAccounts([{
                pubkey: starbase.publicKey,
                isSigner: false,
                isWritable: false
            }]).instruction()}
            fleet.busy = true;
            let txResult = await txSignAndSend(tx);
            fleet.busy = false;
            resolve(txResult);
        });
    }

    async function execCargoFromFleetToStarbase(fleet, fleetCargoPod, tokenMint, dockCoords, amount) {
        return new Promise(async resolve => {
            let starbaseX = dockCoords.split(',')[0].trim();
            let starbaseY = dockCoords.split(',')[1].trim();
            let starbase = await getStarbaseFromCoords(starbaseX, starbaseY);
            let starbasePlayer = await getStarbasePlayer(userProfileAcct,starbase.publicKey);
            let starbasePlayerCargoHolds = await cargoProgram.account.cargoPod.all([
                {
                    memcmp: {
                        offset: 41,
                        bytes: starbasePlayer.publicKey.toBase58(),
                    },
                },
            ]);
            let starbasePlayerCargoHold = starbasePlayerCargoHolds.find(item => item.account.openTokenAccounts > 0);
            let [starbaseCargoToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
                [
                    starbasePlayerCargoHold.publicKey.toBuffer(),
                    tokenProgram.toBuffer(),
                    new solanaWeb3.PublicKey(tokenMint).toBuffer()
                ],
                AssociatedTokenProgram
            );
            let [fleetResourceToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
                [
                    fleetCargoPod.toBuffer(),
                    tokenProgram.toBuffer(),
                    new solanaWeb3.PublicKey(tokenMint).toBuffer()
                ],
                AssociatedTokenProgram
            );
            let fleetCurrentPod = await solanaConnection.getParsedTokenAccountsByOwner(fleetCargoPod, {programId: tokenProgram});
            let currentResource = fleetCurrentPod.value.find(item => item.account.data.parsed.info.mint === tokenMint);
            let fleetResourceAcct = currentResource ? currentResource.pubkey : fleetResourceToken;
            let resourceCargoTypeAcct = cargoTypes.find(item => item.account.mint.toString() == tokenMint);
            await solanaConnection.getAccountInfo(starbaseCargoToken) || await createProgramDerivedAccount(starbaseCargoToken, starbasePlayerCargoHold.publicKey, new solanaWeb3.PublicKey(tokenMint));
            let tx = { instruction: await sageProgram.methods.withdrawCargoFromFleet({ amount: new BrowserAnchor.anchor.BN(amount), keyIndex: new BrowserAnchor.anchor.BN(userProfileKeyIdx) }).accountsStrict({
                gameAccountsFleetAndOwner: {
                    gameFleetAndOwner: {
                        fleetAndOwner: {
                            fleet: fleet.publicKey,
                            owningProfile: userProfileAcct,
                            owningProfileFaction: userProfileFactionAcct.publicKey,
                            key: userPublicKey
                        },
                        gameId: sageGameAcct.publicKey
                    },
                    gameState: sageGameAcct.account.gameState
                },
                starbaseAndStarbasePlayer: {
                    starbase: starbase.publicKey,
                    starbasePlayer: starbasePlayer.publicKey
                },
                cargoPodFrom: fleetCargoPod, // fleet.cargoHold,
                cargoPodTo: starbasePlayerCargoHold.publicKey,
                cargoType: resourceCargoTypeAcct.publicKey,
                cargoStatsDefinition: sageGameAcct.account.cargo.statsDefinition,
                tokenFrom: fleetResourceAcct,
                tokenTo: starbaseCargoToken,
                tokenMint: tokenMint,
                fundsTo: userPublicKey,
                cargoProgram: cargoProgramId,
                tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
            }).remainingAccounts([{
                pubkey: starbase.publicKey,
                isSigner: false,
                isWritable: false
            }]).instruction()}
            fleet.busy = true;
            let txResult = await txSignAndSend(tx);
            fleet.busy = false;
            resolve(txResult);
        });
    }

    async function execCargoFromStarbaseToFleet(fleet, cargoPodTo, tokenTo, tokenMint, cargoType, dockCoords, amount) {
        return new Promise(async resolve => {
            await solanaConnection.getAccountInfo(tokenTo) || await createProgramDerivedAccount(tokenTo, cargoPodTo, new solanaWeb3.PublicKey(tokenMint));
            let starbaseX = dockCoords.split(',')[0].trim();
            let starbaseY = dockCoords.split(',')[1].trim();
            let starbase = await getStarbaseFromCoords(starbaseX, starbaseY);
            let starbasePlayer = await getStarbasePlayer(userProfileAcct,starbase.publicKey);
            let starbasePlayerCargoHolds = await cargoProgram.account.cargoPod.all([
                {
                    memcmp: {
                        offset: 41,
                        bytes: starbasePlayer.publicKey.toBase58(),
                    },
                },
            ]);
            let starbasePlayerCargoHold = starbasePlayerCargoHolds[0];
            let mostFound = 0;
            for (let cargoHold of starbasePlayerCargoHolds) {
                if (cargoHold.account && cargoHold.account.openTokenAccounts > 0) {
                    let cargoHoldTokens = await solanaConnection.getParsedTokenAccountsByOwner(cargoHold.publicKey, {programId: tokenProgram});
                    let cargoHoldFound = cargoHoldTokens.value.find(item => item.account.data.parsed.info.mint === tokenMint && item.account.data.parsed.info.tokenAmount.uiAmount >= amount);
                    if (cargoHoldFound) {
                        starbasePlayerCargoHold = cargoHold;
                        mostFound = cargoHoldFound.account.data.parsed.info.tokenAmount.uiAmount;
                        break;
                    } else {
                        let cargoHoldFound = cargoHoldTokens.value.find(item => item.account.data.parsed.info.mint === tokenMint && item.account.data.parsed.info.tokenAmount.uiAmount >= mostFound);
                        if (cargoHoldFound) {
                            starbasePlayerCargoHold = cargoHold;
                            mostFound = cargoHoldFound.account.data.parsed.info.tokenAmount.uiAmount;
                        }
                    }
                }
            }
            amount = amount > mostFound ? mostFound : amount;
            let [starbaseCargoToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
                [
                    starbasePlayerCargoHold.publicKey.toBuffer(),
                    tokenProgram.toBuffer(),
                    new solanaWeb3.PublicKey(tokenMint).toBuffer()
                ],
                AssociatedTokenProgram
            );
            await solanaConnection.getAccountInfo(starbaseCargoToken) || await createProgramDerivedAccount(starbaseCargoToken, starbasePlayerCargoHold.publicKey, new solanaWeb3.PublicKey(tokenMint));
            let tx = { instruction: await sageProgram.methods.depositCargoToFleet({ amount: new BrowserAnchor.anchor.BN(amount), keyIndex: new BrowserAnchor.anchor.BN(userProfileKeyIdx) }).accountsStrict({
                gameAccountsFleetAndOwner: {
                    gameFleetAndOwner: {
                        fleetAndOwner: {
                            fleet: fleet.publicKey,
                            owningProfile: userProfileAcct,
                            owningProfileFaction: userProfileFactionAcct.publicKey,
                            key: userPublicKey
                        },
                        gameId: sageGameAcct.publicKey
                    },
                    gameState: sageGameAcct.account.gameState
                },
                fundsTo: userPublicKey,
                starbaseAndStarbasePlayer: {
                    starbase: starbase.publicKey,
                    starbasePlayer: starbasePlayer.publicKey
                },
                cargoPodFrom: starbasePlayerCargoHold.publicKey,
                cargoPodTo: cargoPodTo,
                cargoType: cargoType.publicKey,
                cargoStatsDefinition: sageGameAcct.account.cargo.statsDefinition,
                tokenFrom: starbaseCargoToken,
                tokenTo: tokenTo,
                tokenMint: tokenMint,
                cargoProgram: cargoProgramId,
                tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
            }).remainingAccounts([{
                pubkey: starbase.publicKey,
                isSigner: false,
                isWritable: false
            }]).instruction()}
            let txResult = {};
            if (amount > 0) {
                fleet.busy = true;
                txResult = await txSignAndSend(tx);
                fleet.busy = false;
            } else {
                txResult = {name: "NotEnoughResource"};
            }
            let [fleetRepairKitToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
                [
                    fleet.cargoHold.toBuffer(),
                    tokenProgram.toBuffer(),
                    ResourceTokens.toolkit.publicKey.toBuffer()
                ],
                AssociatedTokenProgram
            );
            let [fleetSduToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
                [
                    fleet.cargoHold.toBuffer(),
                    tokenProgram.toBuffer(),
                    SDUToken.toBuffer()
                ],
                AssociatedTokenProgram
            );
            let [fleetFuelToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
                [
                    fleet.fuelTank.toBuffer(),
                    tokenProgram.toBuffer(),
                    ResourceTokens.fuel.publicKey.toBuffer()
                ],
                AssociatedTokenProgram
            );
            await solanaConnection.getAccountInfo(fleetSduToken) || await createProgramDerivedAccount(fleetSduToken, fleet.cargoHold, SDUToken);
            await solanaConnection.getAccountInfo(fleetRepairKitToken) || await createProgramDerivedAccount(fleetRepairKitToken, fleet.cargoHold, ResourceTokens.toolkit.publicKey);
            await solanaConnection.getAccountInfo(fleetFuelToken) || await createProgramDerivedAccount(fleetFuelToken, fleet.fuelTank, ResourceTokens.fuel.publicKey);
            var userFleetIndex = userFleets.findIndex(item => {return item.publicKey === fleet.publicKey});
            userFleets[userFleetIndex].sduToken = fleetSduToken;
            userFleets[userFleetIndex].repairKitToken = fleetRepairKitToken;
            userFleets[userFleetIndex].fuelToken = fleetFuelToken;
            resolve(txResult);
        });
    }

    async function execStartMining(fleet, mineItem, sageResource, planet) {
        return new Promise(async resolve => {
            let resourceToken = fleet.mineResource;
            let targetX = fleet.destCoord.split(',')[0].trim();
            let targetY = fleet.destCoord.split(',')[1].trim();
            let starbase = await getStarbaseFromCoords(targetX, targetY);
            let starbasePlayer = await getStarbasePlayer(userProfileAcct,starbase.publicKey);
            let tx = { instruction: await sageProgram.methods.startMiningAsteroid({keyIndex: new BrowserAnchor.anchor.BN(userProfileKeyIdx)}).accountsStrict({
                gameAccountsFleetAndOwner: {
                    gameFleetAndOwner: {
                        fleetAndOwner: {
                            fleet: fleet.publicKey,
                            owningProfile: userProfileAcct,
                            owningProfileFaction: userProfileFactionAcct.publicKey,
                            key: userPublicKey
                        },
                        gameId: sageGameAcct.publicKey
                    },
                    gameState: sageGameAcct.account.gameState
                },
                starbaseAndStarbasePlayer: {
                    starbase: starbase.publicKey,
                    starbasePlayer: starbasePlayer.publicKey
                },
                mineItem : mineItem.publicKey,
                resource: sageResource.publicKey,
                planet: planet.publicKey,
            }).instruction()}
            fleet.busy = true;
            let txResult = await txSignAndSend(tx);
            fleet.busy = false;
            resolve(txResult);
        });
    }

    async function execStopMining(fleet, sageResource, sageResourceAcctInfo, mineItem, resourceToken) {
        return new Promise(async resolve => {
            let planet = sageResourceAcctInfo.location;
            let targetX = fleet.destCoord.split(',')[0].trim();
            let targetY = fleet.destCoord.split(',')[1].trim();
            let starbase = await getStarbaseFromCoords(targetX, targetY);
            let starbasePlayer = await getStarbasePlayer(userProfileAcct,starbase.publicKey);

            let [planetResourceToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
                [
                    mineItem.toBuffer(),
                    tokenProgram.toBuffer(),
                    resourceToken.toBuffer()
                ],
                AssociatedTokenProgram
            );
            let [fleetResourceToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
                [
                    fleet.cargoHold.toBuffer(),
                    tokenProgram.toBuffer(),
                   resourceToken.toBuffer()
                ],
                AssociatedTokenProgram
            );
            let [fleetFoodToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
                [
                    fleet.cargoHold.toBuffer(),
                    tokenProgram.toBuffer(),
                    sageGameAcct.account.mints.food.toBuffer()
                ],
                AssociatedTokenProgram
            );
            let [fleetAmmoToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
                [
                    fleet.ammoBank.toBuffer(),
                    tokenProgram.toBuffer(),
                    sageGameAcct.account.mints.ammo.toBuffer()
                ],
                AssociatedTokenProgram
            );
            let fleetCurrentCargo = await solanaConnection.getParsedTokenAccountsByOwner(fleet.cargoHold, {programId: tokenProgram});
            let currentFood = fleetCurrentCargo.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.food.toString());
            let fleetFoodAcct = currentFood ? currentFood.pubkey : fleetFoodToken;

            let fleetCurrentAmmoBank = await solanaConnection.getParsedTokenAccountsByOwner(fleet.ammoBank, {programId: tokenProgram});
            let currentAmmo = fleetCurrentAmmoBank.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.ammo.toString());
            let fleetAmmoAcct = currentAmmo ? currentAmmo.pubkey : fleetAmmoToken;

            await solanaConnection.getAccountInfo(fleetResourceToken) || await createProgramDerivedAccount(fleetResourceToken, fleet.cargoHold, resourceToken);
            let foodCargoTypeAcct = cargoTypes.find(item => item.account.mint.toString() == sageGameAcct.account.mints.food);
            let ammoCargoTypeAcct = cargoTypes.find(item => item.account.mint.toString() == sageGameAcct.account.mints.ammo);
            let resourceCargoTypeAcct = cargoTypes.find(item => item.account.mint.toString() == resourceToken.toString());
            let tx1 = { instruction: await sageProgram.methods.fleetStateHandler().accountsStrict({
                fleet: fleet.publicKey
            }).remainingAccounts([
                {
                    pubkey: userProfileFactionAcct.publicKey,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: fleet.cargoHold,
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: fleet.ammoBank,
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: mineItem,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: sageResource, //Account5
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: planet,
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: starbase.publicKey,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: fleetFoodAcct, //foodTokenFrom
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: fleetAmmoAcct, //ammoTokenFrom
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: planetResourceToken, //resourceTokenFrom
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: fleetResourceToken, //resourceTokenTo
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: sageGameAcct.account.mints.food,
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: sageGameAcct.account.mints.ammo,
                    isSigner: false,
                    isWritable: true
                },
                {
                    pubkey: foodCargoTypeAcct.publicKey,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: ammoCargoTypeAcct.publicKey,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: resourceCargoTypeAcct.publicKey,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: sageGameAcct.account.cargo.statsDefinition,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: sageGameAcct.publicKey,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: cargoProgramId,
                    isSigner: false,
                    isWritable: false
                },
                {
                    pubkey: tokenProgram,
                    isSigner: false,
                    isWritable: false
                },
            ]).instruction()}

            let tx2 = { instruction: await sageProgram.methods.stopMiningAsteroid({keyIndex: new BrowserAnchor.anchor.BN(userProfileKeyIdx)}).accountsStrict({
                gameAccountsFleetAndOwner: {
                    gameFleetAndOwner: {
                        fleetAndOwner: {
                            fleet: fleet.publicKey,
                            owningProfile: userProfileAcct,
                            owningProfileFaction: userProfileFactionAcct.publicKey,
                            key: userPublicKey
                        },
                        gameId: sageGameAcct.publicKey
                    },
                    gameState: sageGameAcct.account.gameState
                },
                resource: sageResource,
                planet: planet,
                fuelTank : fleet.fuelTank,
                cargoType: fuelCargoTypeAcct.publicKey,
                cargoStatsDefinition: sageGameAcct.account.cargo.statsDefinition,
                tokenFrom: fleet.fuelToken,
                tokenMint: sageGameAcct.account.mints.fuel,
                cargoProgram: cargoProgramId,
                tokenProgram: tokenProgram,
            }).instruction()}
            fleet.busy = true;
            let txResult = await txSignAndSend([tx1,tx2]);
            fleet.busy = false;
            console.log('---STOP MINE---');
            console.log(txResult);
            resolve(txResult);
        });
    }

    async function addAssistInput(fleet) {
        let fleetSavedData = await GM.getValue(fleet.publicKey.toString(), '{}');
        let fleetParsedData = JSON.parse(fleetSavedData);
        let fleetRow = document.createElement('tr');
        fleetRow.classList.add('assist-fleet-row');
        fleetRow.setAttribute('pk', fleet.publicKey.toString());

        let fleetLabel = document.createElement('span');
        fleetLabel.innerHTML = fleet.label;
        let fleetLabelTd = document.createElement('td');
        fleetLabelTd.appendChild(fleetLabel);

        let assistAssignments = ['','Scan','Mine','Transport'];
        let assignmentOptionsStr = '';
        let fleetAssignment = document.createElement('select');
        assistAssignments.forEach( function(assignment) {assignmentOptionsStr += '<option value="' + assignment + '">' + assignment + '</option>';});
        fleetAssignment.innerHTML = assignmentOptionsStr;
        fleetAssignment.value = fleetParsedData && fleetParsedData.assignment ? fleetParsedData.assignment : '';
        let fleetAssignmentTd = document.createElement('td');
        fleetAssignmentTd.appendChild(fleetAssignment);
/*
        let fleetResupply = document.createElement('input');
        fleetResupply.setAttribute('type', 'checkbox');
        if (fleetAssignment.value !== 'Transport') fleetResupply.setAttribute('disabled', '');
        fleetResupply.checked = fleetParsedData && fleetParsedData.resupply && fleetParsedData.resupply == 'true' ? true : false;
        let fleetResupplyTd = document.createElement('td');
        fleetResupplyTd.appendChild(fleetResupply);
        fleetAssignment.onchange = function() {
            fleetAssignment.value == 'Transport' ? fleetResupply.removeAttribute('disabled') : fleetResupply.setAttribute('disabled', '');
        };
*/
/*
        let assistResources = ['','Arco','Biomass','Carbon','Copper Ore','Diamond','Hydrogen','Iron Ore','Lumanite','Rochinol']
        let optionsStr = '';
        let fleetMineRes = document.createElement('select');
        assistResources.forEach( function(resource) {optionsStr += '<option value="' + resource + '">' + resource + '</option>';});
        fleetMineRes.innerHTML = optionsStr;
        let resourceToken = fleetParsedData && fleetParsedData.mineResource && fleetParsedData.mineResource !== '' ? resourceTokens.find(r => r.token == fleetParsedData.mineResource) : '';
        fleetMineRes.value = resourceToken && resourceToken.name ? resourceToken.name : '';
        let fleetMineResTd = document.createElement('td');
        fleetMineResTd.appendChild(fleetMineRes);
*/
        let fleetDestCoord = document.createElement('input');
        fleetDestCoord.setAttribute('type', 'text');
        fleetDestCoord.placeholder = 'x, y';
        fleetDestCoord.style.width = '50px';
        fleetDestCoord.value = fleetParsedData && fleetParsedData.dest ? fleetParsedData.dest : '';
        let fleetDestCoordTd = document.createElement('td');
        fleetDestCoordTd.appendChild(fleetDestCoord);

        let fleetStarbaseCoord = document.createElement('input');
        fleetStarbaseCoord.setAttribute('type', 'text');
        fleetStarbaseCoord.placeholder = 'x, y';
        fleetStarbaseCoord.style.width = '50px';
        fleetStarbaseCoord.value = fleetParsedData && fleetParsedData.starbase ? fleetParsedData.starbase : '';
        let fleetStarbaseCoordTd = document.createElement('td');
        fleetStarbaseCoordTd.appendChild(fleetStarbaseCoord);

        let fleetSubwarpPref = document.createElement('input');
        fleetSubwarpPref.setAttribute('type', 'checkbox');
        fleetSubwarpPref.checked = fleetParsedData && fleetParsedData.subwarpPref && fleetParsedData.subwarpPref == 'true' ? true : false;
        let fleetSubwarpPrefTd = document.createElement('td');
        fleetSubwarpPrefTd.appendChild(fleetSubwarpPref);

        let fleetCargoCapacity = document.createElement('span');
        fleetCargoCapacity.innerHTML = fleet.cargoCapacity;
        let fleetCargoCapacityTd = document.createElement('td');
        fleetCargoCapacityTd.appendChild(fleetCargoCapacity);

        let fleetAmmoCapacity = document.createElement('span');
        fleetAmmoCapacity.innerHTML = fleet.ammoCapacity;
        let fleetAmmoCapacityTd = document.createElement('td');
        fleetAmmoCapacityTd.appendChild(fleetAmmoCapacity);

        let fleetFuelCapacity = document.createElement('span');
        fleetFuelCapacity.innerHTML = fleet.fuelCapacity;
        let fleetFuelCapacityTd = document.createElement('td');
        fleetFuelCapacityTd.appendChild(fleetFuelCapacity);

        fleetRow.appendChild(fleetLabelTd);
        fleetRow.appendChild(fleetAssignmentTd);
        fleetRow.appendChild(fleetDestCoordTd);
        fleetRow.appendChild(fleetStarbaseCoordTd);
        fleetRow.appendChild(fleetSubwarpPrefTd);
        fleetRow.appendChild(fleetCargoCapacityTd);
        fleetRow.appendChild(fleetAmmoCapacityTd);
        fleetRow.appendChild(fleetFuelCapacityTd);
        let targetElem = document.querySelector('#assistModal .assist-modal-body table');
        targetElem.appendChild(fleetRow);

        let scanRow = document.createElement('tr');
        scanRow.classList.add('assist-scan-row');
        scanRow.style.display = fleetParsedData && fleetParsedData.assignment == 'Scan' ? 'table-row' : 'none';
        fleetParsedData && fleetParsedData.assignment == 'Scan' && fleetRow.classList.add('show-top-border');
        targetElem.appendChild(scanRow);

        let scanPadTd = document.createElement('td');
        scanRow.appendChild(scanPadTd);

        let scanMinLabel = document.createElement('span');
        scanMinLabel.innerHTML = 'Minimum Probability:';
        let scanMin = document.createElement('input');
        scanMin.setAttribute('type', 'text');
        scanMin.placeholder = '10';
        scanMin.style.width = '30px';
        scanMin.style.marginRight = '10px';
        scanMin.value = fleetParsedData && fleetParsedData.scanMin ? fleetParsedData.scanMin : '';
        let scanMinDiv = document.createElement('div');
        scanMinDiv.appendChild(scanMinLabel);
        scanMinDiv.appendChild(scanMin);
        let scanMinTd = document.createElement('td');
        scanMinTd.setAttribute('colspan', '3');
        scanMinTd.appendChild(scanMinDiv);
        scanRow.appendChild(scanMinTd);

        let scanMoveLabel = document.createElement('span');
        scanMoveLabel.innerHTML = 'Move While Scanning:';
        let scanMove = document.createElement('input');
        scanMove.setAttribute('type', 'checkbox');
        scanMove.checked = fleetParsedData && fleetParsedData.scanMove && fleetParsedData.scanMove == 'false' ? false : true;
        scanMove.style.marginRight = '10px';
        let scanMoveDiv = document.createElement('div');
        scanMoveDiv.appendChild(scanMoveLabel);
        scanMoveDiv.appendChild(scanMove);
        let scanMoveTd = document.createElement('td');
        scanMoveTd.setAttribute('colspan', '4');
        scanMoveTd.appendChild(scanMoveDiv);
        scanRow.appendChild(scanMoveTd);
/*
        let scanTd = document.createElement('td');
        scanTd.setAttribute('colspan', '8');
        let scanWrapper = document.createElement('div');
        scanWrapper.classList.add('scan-wrapper');
        scanWrapper.style.display = 'flex'
        scanWrapper.style.flexDirection = 'row';
        scanWrapper.style.justifyContent = 'flex-start';
        scanWrapper.appendChild(scanMinDiv);
        scanWrapper.appendChild(scanMoveDiv);
        //scanWrapper.appendChild(transportSBResource2Div);
        //scanWrapper.appendChild(transportSBResource3Div);
        //scanWrapper.appendChild(transportSBResource4Div);
        scanTd.appendChild(scanWrapper);
        scanRow.appendChild(scanTd);
*/
        targetElem.appendChild(scanRow);

        let mineRow = document.createElement('tr');
        mineRow.classList.add('assist-mine-row');
        mineRow.style.display = fleetParsedData && fleetParsedData.assignment == 'Mine' ? 'table-row' : 'none';
        fleetParsedData && fleetParsedData.assignment == 'Mine' && fleetRow.classList.add('show-top-border');
        targetElem.appendChild(mineRow);

        let minePadTd = document.createElement('td');
        mineRow.appendChild(minePadTd);

        let mineResLabel = document.createElement('span');
        mineResLabel.innerHTML = 'Resource to mine:';
        let assistResources = ['','Arco','Biomass','Carbon','Copper Ore','Diamond','Hydrogen','Iron Ore','Lumanite','Rochinol']
        let optionsStr = '';
        let fleetMineRes = document.createElement('select');
        assistResources.forEach( function(resource) {optionsStr += '<option value="' + resource + '">' + resource + '</option>';});
        fleetMineRes.innerHTML = optionsStr;
        let resourceToken = fleetParsedData && fleetParsedData.mineResource && fleetParsedData.mineResource !== '' ? resourceTokens.find(r => r.token == fleetParsedData.mineResource) : '';
        fleetMineRes.value = resourceToken && resourceToken.name ? resourceToken.name : '';
        let fleetMineResTd = document.createElement('td');
        fleetMineResTd.setAttribute('colspan', '7');
        fleetMineResTd.appendChild(mineResLabel);
        fleetMineResTd.appendChild(fleetMineRes);
        mineRow.appendChild(fleetMineResTd);
        targetElem.appendChild(mineRow);

        let transportRow = document.createElement('tr');
        transportRow.classList.add('assist-transport-row');
        transportRow.style.display = fleetParsedData && fleetParsedData.assignment == 'Transport' ? 'table-row' : 'none';
        fleetParsedData && fleetParsedData.assignment == 'Transport' && fleetRow.classList.add('show-top-border');
        targetElem.appendChild(transportRow);

        let transportLabel1 = document.createElement('div');
        transportLabel1.innerHTML = 'To Target:';
        transportLabel1.style.width = '84px';
        transportLabel1.style.minWidth = '84px';

        let transportResources = ['','Ammo','Food','Fuel','SDU','Toolkit','Arco','Biomass','Carbon','Copper Ore','Diamond','Hydrogen','Iron Ore','Lumanite','Rochinol']
        let transportOptStr = '';
        transportResources.forEach( function(resource) {transportOptStr += '<option value="' + resource + '">' + resource + '</option>';});
        let transportResource1 = document.createElement('select');
        transportResource1.innerHTML = transportOptStr;
        let transportResource1Token = fleetParsedData && fleetParsedData.transportResource1 && fleetParsedData.transportResource1 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.token == fleetParsedData.transportResource1) : '';
        transportResource1.value = transportResource1Token && transportResource1Token.name ? transportResource1Token.name : '';
        let transportResource1Perc = document.createElement('input');
        transportResource1Perc.setAttribute('type', 'text');
        transportResource1Perc.placeholder = '0';
        transportResource1Perc.style.width = '60px';
        transportResource1Perc.style.marginRight = '10px';
        transportResource1Perc.value = fleetParsedData && fleetParsedData.transportResource1Perc ? fleetParsedData.transportResource1Perc : '';
        let transportResource1Div = document.createElement('div');
        transportResource1Div.appendChild(transportResource1);
        transportResource1Div.appendChild(transportResource1Perc);

        let transportResource2 = document.createElement('select');
        transportResource2.innerHTML = transportOptStr;
        let transportResource2Token = fleetParsedData && fleetParsedData.transportResource2 && fleetParsedData.transportResource2 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.token == fleetParsedData.transportResource2) : '';
        transportResource2.value = transportResource2Token && transportResource2Token.name ? transportResource2Token.name : '';
        let transportResource2Perc = document.createElement('input');
        transportResource2Perc.setAttribute('type', 'text');
        transportResource2Perc.placeholder = '0';
        transportResource2Perc.style.width = '60px';
        transportResource2Perc.style.marginRight = '10px';
        transportResource2Perc.value = fleetParsedData && fleetParsedData.transportResource2Perc ? fleetParsedData.transportResource2Perc : '';
        let transportResource2Div = document.createElement('div');
        transportResource2Div.appendChild(transportResource2);
        transportResource2Div.appendChild(transportResource2Perc);

        let transportResource3 = document.createElement('select');
        transportResource3.innerHTML = transportOptStr;
        let transportResource3Token = fleetParsedData && fleetParsedData.transportResource3 && fleetParsedData.transportResource3 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.token == fleetParsedData.transportResource3) : '';
        transportResource3.value = transportResource3Token && transportResource3Token.name ? transportResource3Token.name : '';
        let transportResource3Perc = document.createElement('input');
        transportResource3Perc.setAttribute('type', 'text');
        transportResource3Perc.placeholder = '0';
        transportResource3Perc.style.width = '60px';
        transportResource3Perc.style.marginRight = '10px';
        transportResource3Perc.value = fleetParsedData && fleetParsedData.transportResource3Perc ? fleetParsedData.transportResource3Perc : '';
        let transportResource3Div = document.createElement('div');
        transportResource3Div.appendChild(transportResource3);
        transportResource3Div.appendChild(transportResource3Perc);

        let transportResource4 = document.createElement('select');
        transportResource4.innerHTML = transportOptStr;
        let transportResource4Token = fleetParsedData && fleetParsedData.transportResource4 && fleetParsedData.transportResource4 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.token == fleetParsedData.transportResource4) : '';
        transportResource4.value = transportResource4Token && transportResource4Token.name ? transportResource4Token.name : '';
        let transportResource4Perc = document.createElement('input');
        transportResource4Perc.setAttribute('type', 'text');
        transportResource4Perc.placeholder = '0';
        transportResource4Perc.style.width = '60px';
        transportResource4Perc.value = fleetParsedData && fleetParsedData.transportResource4Perc ? fleetParsedData.transportResource4Perc : '';
        let transportResource4Div = document.createElement('div');
        transportResource4Div.appendChild(transportResource4);
        transportResource4Div.appendChild(transportResource4Perc);

        let transportLabel2 = document.createElement('div');
        transportLabel2.innerHTML = 'To Starbase:';
        transportLabel2.style.width = '84px';
        transportLabel2.style.minWidth = '84px';

        let transportSBResource1 = document.createElement('select');
        transportSBResource1.innerHTML = transportOptStr;
        let transportSBResource1Token = fleetParsedData && fleetParsedData.transportSBResource1 && fleetParsedData.transportSBResource1 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.token == fleetParsedData.transportSBResource1) : '';
        transportSBResource1.value = transportSBResource1Token && transportSBResource1Token.name ? transportSBResource1Token.name : '';
        let transportSBResource1Perc = document.createElement('input');
        transportSBResource1Perc.setAttribute('type', 'text');
        transportSBResource1Perc.placeholder = '0';
        transportSBResource1Perc.style.width = '60px';
        transportSBResource1Perc.style.marginRight = '10px';
        transportSBResource1Perc.value = fleetParsedData && fleetParsedData.transportSBResource1Perc ? fleetParsedData.transportSBResource1Perc : '';
        let transportSBResource1Div = document.createElement('div');
        transportSBResource1Div.appendChild(transportSBResource1);
        transportSBResource1Div.appendChild(transportSBResource1Perc);

        let transportSBResource2 = document.createElement('select');
        transportSBResource2.innerHTML = transportOptStr;
        let transportSBResource2Token = fleetParsedData && fleetParsedData.transportSBResource2 && fleetParsedData.transportSBResource2 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.token == fleetParsedData.transportSBResource2) : '';
        transportSBResource2.value = transportSBResource2Token && transportSBResource2Token.name ? transportSBResource2Token.name : '';
        let transportSBResource2Perc = document.createElement('input');
        transportSBResource2Perc.setAttribute('type', 'text');
        transportSBResource2Perc.placeholder = '0';
        transportSBResource2Perc.style.width = '60px';
        transportSBResource2Perc.style.marginRight = '10px';
        transportSBResource2Perc.value = fleetParsedData && fleetParsedData.transportSBResource2Perc ? fleetParsedData.transportSBResource2Perc : '';
        let transportSBResource2Div = document.createElement('div');
        transportSBResource2Div.appendChild(transportSBResource2);
        transportSBResource2Div.appendChild(transportSBResource2Perc);

        let transportSBResource3 = document.createElement('select');
        transportSBResource3.innerHTML = transportOptStr;
        let transportSBResource3Token = fleetParsedData && fleetParsedData.transportSBResource3 && fleetParsedData.transportSBResource3 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.token == fleetParsedData.transportSBResource3) : '';
        transportSBResource3.value = transportSBResource3Token && transportSBResource3Token.name ? transportSBResource3Token.name : '';
        let transportSBResource3Perc = document.createElement('input');
        transportSBResource3Perc.setAttribute('type', 'text');
        transportSBResource3Perc.placeholder = '0';
        transportSBResource3Perc.style.width = '60px';
        transportSBResource3Perc.style.marginRight = '10px';
        transportSBResource3Perc.value = fleetParsedData && fleetParsedData.transportSBResource3Perc ? fleetParsedData.transportSBResource3Perc : '';
        let transportSBResource3Div = document.createElement('div');
        transportSBResource3Div.appendChild(transportSBResource3);
        transportSBResource3Div.appendChild(transportSBResource3Perc);

        let transportSBResource4 = document.createElement('select');
        transportSBResource4.innerHTML = transportOptStr;
        let transportSBResource4Token = fleetParsedData && fleetParsedData.transportSBResource4 && fleetParsedData.transportSBResource4 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.token == fleetParsedData.transportSBResource4) : '';
        transportSBResource4.value = transportSBResource4Token && transportSBResource4Token.name ? transportSBResource4Token.name : '';
        let transportSBResource4Perc = document.createElement('input');
        transportSBResource4Perc.setAttribute('type', 'text');
        transportSBResource4Perc.placeholder = '0';
        transportSBResource4Perc.style.width = '60px';
        transportSBResource4Perc.style.marginRight = '10px';
        transportSBResource4Perc.value = fleetParsedData && fleetParsedData.transportSBResource4Perc ? fleetParsedData.transportSBResource4Perc : '';
        let transportSBResource4Div = document.createElement('div');
        transportSBResource4Div.appendChild(transportSBResource4);
        transportSBResource4Div.appendChild(transportSBResource4Perc);

        let transportTd = document.createElement('td');
        transportTd.setAttribute('colspan', '8');
        let transportTargettWrapper = document.createElement('div');
        transportTargettWrapper.classList.add('transport-to-target');
        transportTargettWrapper.style.display = 'flex'
        transportTargettWrapper.style.flexDirection = 'row';
        transportTargettWrapper.style.justifyContent = 'flex-start';
        transportTargettWrapper.appendChild(transportLabel1);
        transportTargettWrapper.appendChild(transportResource1Div);
        transportTargettWrapper.appendChild(transportResource2Div);
        transportTargettWrapper.appendChild(transportResource3Div);
        transportTargettWrapper.appendChild(transportResource4Div);
        let transportStarbaseWrapper = document.createElement('div');
        transportStarbaseWrapper.classList.add('transport-to-starbase');
        transportStarbaseWrapper.style.display = 'flex'
        transportStarbaseWrapper.style.flexDirection = 'row';
        transportStarbaseWrapper.style.justifyContent = 'flex-start';
        transportStarbaseWrapper.appendChild(transportLabel2);
        transportStarbaseWrapper.appendChild(transportSBResource1Div);
        transportStarbaseWrapper.appendChild(transportSBResource2Div);
        transportStarbaseWrapper.appendChild(transportSBResource3Div);
        transportStarbaseWrapper.appendChild(transportSBResource4Div);
        transportTd.appendChild(transportTargettWrapper);
        transportTd.appendChild(transportStarbaseWrapper);
        transportRow.appendChild(transportTd);
        targetElem.appendChild(transportRow);

        let padRow = document.createElement('tr');
        padRow.classList.add('assist-pad-row');
        padRow.style.display = fleetParsedData && fleetParsedData.assignment ? 'table-row' : 'none';
        let padRowTd = document.createElement('td');
        padRowTd.setAttribute('colspan', '7');
        padRowTd.style.height = '15px';
        padRow.appendChild(padRowTd);
        targetElem.appendChild(padRow);

        fleetAssignment.onchange = function() {
            if (fleetAssignment.value == 'Scan') {
                scanRow.style.display = 'table-row';
                mineRow.style.display = 'none';
                transportRow.style.display = 'none';
                padRow.style.display = 'table-row';
                fleetRow.classList.add('show-top-border');
            } else if (fleetAssignment.value == 'Mine') {
                mineRow.style.display = 'table-row';
                scanRow.style.display = 'none';
                transportRow.style.display = 'none';
                padRow.style.display = 'table-row';
                fleetRow.classList.add('show-top-border');
            } else if (fleetAssignment.value == 'Transport') {
                transportRow.style.display = 'table-row';
                scanRow.style.display = 'none';
                mineRow.style.display = 'none';
                padRow.style.display = 'table-row';
                fleetRow.classList.add('show-top-border');
            } else {
                scanRow.style.display = 'none';
                mineRow.style.display = 'none';
                transportRow.style.display = 'none';
                padRow.style.display = 'none';
                fleetRow.classList.remove('show-top-border');
            }
        };
        /*
        fleetAssignment.onchange = function(event) {
            console.log(event.currentTarget);
            if (event.currentTarget.checked) {
                transportRow.style.display = 'table-row';
                fleetRow.classList.add('show-top-border');
            } else {
                transportRow.style.display = 'none';
                fleetRow.classList.remove('show-top-border');
            }
        };
        */
    }

    function updateAssistStatus(fleet) {
        let targetRow = document.querySelectorAll('#assistStatus .assist-fleet-row[pk="' + fleet.publicKey.toString() + '"]');

        if (targetRow.length > 0) {
            targetRow[0].children[1].firstChild.innerHTML = fleet.toolCnt;
            targetRow[0].children[2].firstChild.innerHTML = fleet.sduCnt;
            targetRow[0].children[3].firstChild.innerHTML = fleet.state;
        } else {
            let fleetRow = document.createElement('tr');
            fleetRow.classList.add('assist-fleet-row');
            fleetRow.setAttribute('pk', fleet.publicKey.toString());
            let fleetLabel = document.createElement('span');
            fleetLabel.innerHTML = fleet.label;
            let fleetLabelTd = document.createElement('td');
            fleetLabelTd.appendChild(fleetLabel);
            let fleetTool = document.createElement('span');
            fleetTool.innerHTML = fleet.toolCnt;
            let fleetToolTd = document.createElement('td');
            fleetToolTd.appendChild(fleetTool);
            let fleetSdu = document.createElement('span');
            fleetSdu.innerHTML = fleet.sduCnt;
            let fleetSduTd = document.createElement('td');
            fleetSduTd.appendChild(fleetSdu);
            let fleetStatus = document.createElement('span');
            fleetStatus.innerHTML = fleet.state;
            let fleetStatusTd = document.createElement('td');
            fleetStatusTd.appendChild(fleetStatus);
            fleetRow.appendChild(fleetLabelTd);
            fleetRow.appendChild(fleetToolTd);
            fleetRow.appendChild(fleetSduTd);
            fleetRow.appendChild(fleetStatusTd);
            let targetElem = document.querySelector('#assistStatus .assist-modal-body table');
            targetElem.appendChild(fleetRow);
        }
    }

    async function saveAssistInput() {
        let fleetRows = document.querySelectorAll('#assistModal .assist-fleet-row');
        let scanRows = document.querySelectorAll('#assistModal .assist-scan-row');
        let mineRows = document.querySelectorAll('#assistModal .assist-mine-row');
        let transportRows = document.querySelectorAll('#assistModal .assist-transport-row > td');
        let errElem = document.querySelectorAll('#assist-modal-error');
        let errBool = false;
        for (let [i, row] of fleetRows.entries()) {
            let rowErrBool = false;
            let fleetPK = row.getAttribute('pk');
            let fleetName = row.children[0].firstChild.innerText;
            let fleetAssignment = row.children[1].firstChild.value;
            //let fleetResupply = row.children[2].firstChild.checked;
            let fleetDestCoord = row.children[2].firstChild.value;
            let fleetStarbaseCoord = row.children[3].firstChild.value;
            let subwarpPref = row.children[4].firstChild.checked;
            let destX = fleetDestCoord.split(',').length > 1 ? fleetDestCoord.split(',')[0].trim() : '';
            let destY = fleetDestCoord.split(',').length > 1 ? fleetDestCoord.split(',')[1].trim() : '';
            let starbaseX = fleetStarbaseCoord.split(',').length > 1 ? fleetStarbaseCoord.split(',')[0].trim() : '';
            let starbaseY = fleetStarbaseCoord.split(',').length > 1 ? fleetStarbaseCoord.split(',')[1].trim() : '';
            let userFleetIndex = userFleets.findIndex(item => {return item.publicKey == fleetPK});
            let moveType = subwarpPref == true ? 'subwarp' : 'warp';
            let moveDist = calculateMovementDistance([starbaseX,starbaseY], [destX,destY]);
            //let maxWarpDist = userFleets[i].maxWarpDistance / 100;
            //let warpCnt = Math.ceil(moveDist / maxWarpDist);
            let warpCost = calculateWarpFuelBurn(userFleets[userFleetIndex], moveDist);
            //if (fleetAssignment !== '' && (moveDist > userFleets[userFleetIndex].maxWarpDistance / 100)) {
            if (fleetAssignment !== '' && (warpCost > userFleets[userFleetIndex].fuelCapacity)) {
                let subwarpCost = calculateSubwarpFuelBurn(userFleets[userFleetIndex], moveDist);
                if (subwarpCost * 2 > userFleets[userFleetIndex].fuelCapacity) {
                    console.log('ERROR: Fleet will not have enough fuel to return to starbase');
                    row.children[4].firstChild.style.border = '2px solid red';
                    row.children[5].firstChild.style.border = '2px solid red';
                    errElem[0].innerHTML = 'ERROR: Distance exceeds fuel capacity';
                    errBool = true;
                    rowErrBool = true;
                } else {
                    moveType = 'subwarp';
                }
            }

            let scanMin = parseInt(scanRows[i].children[1].children[0].children[1].value) || 0;
            let scanMove = scanRows[i].children[2].children[0].children[1].checked;

            let fleetMineResource = mineRows[i].children[1].children[1].value;
            fleetMineResource = fleetMineResource !== '' ? resourceTokens.find(r => r.name == fleetMineResource).token : '';

            let transportToTarget = transportRows[i].querySelectorAll(':scope > .transport-to-target > div');
            let transportResource1 = transportToTarget[1].children[0].value;
            transportResource1 = transportResource1 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.name == transportResource1).token : '';
            let transportResource1Perc = parseInt(transportToTarget[1].children[1].value) || 0;
            let transportResource2 = transportToTarget[2].children[0].value;
            transportResource2 = transportResource2 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.name == transportResource2).token : '';
            let transportResource2Perc = parseInt(transportToTarget[2].children[1].value) || 0;
            let transportResource3 = transportToTarget[3].children[0].value;
            transportResource3 = transportResource3 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.name == transportResource3).token : '';
            let transportResource3Perc = parseInt(transportToTarget[3].children[1].value) || 0;
            let transportResource4 = transportToTarget[4].children[0].value;
            transportResource4 = transportResource4 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.name == transportResource4).token : '';
            let transportResource4Perc = parseInt(transportToTarget[4].children[1].value) || 0;
            let ammoWanted = 0;
            let fuelWanted = 0;
            let cargoWanted = 0;
            for (let i=1; i < 5; i++) {
                if (transportToTarget[i].children[0].value == 'Ammo') {
                    ammoWanted += parseInt(transportToTarget[i].children[1].value);
                } else if (transportToTarget[i].children[0].value == 'Fuel') {
                    fuelWanted += parseInt(transportToTarget[i].children[1].value);
                } else {
                    cargoWanted += parseInt(transportToTarget[i].children[1].value);
                }
            }
            if (ammoWanted > userFleets[userFleetIndex].ammoCapacity) cargoWanted += ammoWanted - userFleets[userFleetIndex].ammoCapacity;
            if (fuelWanted > userFleets[userFleetIndex].fuelCapacity) cargoWanted += fuelWanted - userFleets[userFleetIndex].fuelCapacity;
            if (cargoWanted > userFleets[userFleetIndex].cargoCapacity) {
                console.log('ERROR');
                transportToTarget[1].children[1].style.border = '2px solid red';
                transportToTarget[2].children[1].style.border = '2px solid red';
                transportToTarget[3].children[1].style.border = '2px solid red';
                transportToTarget[4].children[1].style.border = '2px solid red';
                errElem[0].innerHTML = 'ERROR: Total cannot exceed Max Capacity';
                errBool = true;
                rowErrBool = true;
            }

            let transportToStarbase = transportRows[i].querySelectorAll(':scope > .transport-to-starbase > div');
            let transportSBResource1 = transportToStarbase[1].children[0].value;
            transportSBResource1 = transportSBResource1 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.name == transportSBResource1).token : '';
            let transportSBResource1Perc = parseInt(transportToStarbase[1].children[1].value) || 0;
            let transportSBResource2 = transportToStarbase[2].children[0].value;
            transportSBResource2 = transportSBResource2 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.name == transportSBResource2).token : '';
            let transportSBResource2Perc = parseInt(transportToStarbase[2].children[1].value) || 0;
            let transportSBResource3 = transportToStarbase[3].children[0].value;
            transportSBResource3 = transportSBResource3 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.name == transportSBResource3).token : '';
            let transportSBResource3Perc = parseInt(transportToStarbase[3].children[1].value) || 0;
            let transportSBResource4 = transportToStarbase[4].children[0].value;
            transportSBResource4 = transportSBResource4 !== '' ? resourceTokens.concat(r4Tokens).find(r => r.name == transportSBResource4).token : '';
            let transportSBResource4Perc = parseInt(transportToStarbase[4].children[1].value) || 0;
            let ammoSBWanted = 0;
            let fuelSBWanted = 0;
            let cargoSBWanted = 0;
            for (let i=1; i < 5; i++) {
                if (transportToStarbase[i].children[0].value == 'Ammo') {
                    ammoSBWanted += parseInt(transportToStarbase[i].children[1].value);
                } else if (transportToStarbase[i].children[0].value == 'Fuel') {
                    fuelSBWanted += parseInt(transportToStarbase[i].children[1].value);
                } else {
                    cargoSBWanted += parseInt(transportToStarbase[i].children[1].value);
                }
            }
            if (ammoSBWanted > userFleets[userFleetIndex].ammoCapacity) cargoSBWanted += ammoSBWanted - userFleets[userFleetIndex].ammoCapacity;
            if (fuelSBWanted > userFleets[userFleetIndex].fuelCapacity) cargoSBWanted += fuelSBWanted - userFleets[userFleetIndex].fuelCapacity;
            if (cargoSBWanted > userFleets[userFleetIndex].cargoCapacity) {
                console.log('ERROR');
                transportToStarbase[1].children[1].style.border = '2px solid red';
                transportToStarbase[2].children[1].style.border = '2px solid red';
                transportToStarbase[3].children[1].style.border = '2px solid red';
                transportToStarbase[4].children[1].style.border = '2px solid red';
                errElem[0].innerHTML = 'ERROR: Total cannot exceed Max Capacity';
                errBool = true;
                rowErrBool = true;
            }
            if (rowErrBool === false) {
                let fleetSavedData = await GM.getValue(fleetPK, '{}');
                let fleetParsedData = JSON.parse(fleetSavedData);
                let fleetMoveTarget = fleetParsedData && fleetParsedData.destination ? fleetParsedData.destination : '';
                destX = Number(destX);
                destY = Number(destY);
                let scanShiftX = destX > 0 ? -1 : 1;
                let scanShiftY = destY > 0 ? -1 : 1;
                let scanBlock = [];
                if (destX !== '' && destY !== '') {
                    scanBlock.push([destX, destY]);
                    scanBlock.push([destX+scanShiftX, destY]);
                    scanBlock.push([destX+scanShiftX, destY+scanShiftY]);
                    scanBlock.push([destX, destY+scanShiftY]);
                }
                await GM.setValue(fleetPK, `{\"name\": \"${fleetName}\", \"assignment\": \"${fleetAssignment}\", \"mineResource\": \"${fleetMineResource}\", \"dest\": \"${fleetDestCoord}\", \"starbase\": \"${fleetStarbaseCoord}\", \"moveType\": \"${moveType}\", \"subwarpPref\": \"${subwarpPref}\", \"destination\": \"${fleetMoveTarget}\", \"transportResource1\": \"${transportResource1}\", \"transportResource1Perc\": ${transportResource1Perc}, \"transportResource2\": \"${transportResource2}\", \"transportResource2Perc\": ${transportResource2Perc}, \"transportResource3\": \"${transportResource3}\", \"transportResource3Perc\": ${transportResource3Perc}, \"transportResource4\": \"${transportResource4}\", \"transportResource4Perc\": ${transportResource4Perc}, \"transportSBResource1\": \"${transportSBResource1}\", \"transportSBResource1Perc\": ${transportSBResource1Perc}, \"transportSBResource2\": \"${transportSBResource2}\", \"transportSBResource2Perc\": ${transportSBResource2Perc}, \"transportSBResource3\": \"${transportSBResource3}\", \"transportSBResource3Perc\": ${transportSBResource3Perc}, \"transportSBResource4\": \"${transportSBResource4}\", \"transportSBResource4Perc\": ${transportSBResource4Perc}, \"scanBlock\": ${JSON.stringify(scanBlock)}, \"scanMin\": ${scanMin}, \"scanMove\": \"${scanMove}\"}`);
                userFleets[userFleetIndex].mineResource = fleetMineResource;
                userFleets[userFleetIndex].destCoord = fleetDestCoord;
                userFleets[userFleetIndex].starbaseCoord = fleetStarbaseCoord;
                userFleets[userFleetIndex].moveType = moveType;
                userFleets[userFleetIndex].scanBlock = scanBlock;
                userFleets[userFleetIndex].scanMin = scanMin;
                userFleets[userFleetIndex].scanMove = scanMove ? 'true' : 'false';
            }
        }
        if (errBool === false) {
            errElem[0].innerHTML = '';
            assistModalToggle();
        }
    }

    async function assistImportToggle() {
        let targetElem = document.querySelector('#importModal');
        if (targetElem.style.display === 'none') {
            targetElem.style.display = 'block';
            let importText = document.querySelector('#importText');
            importText.value = '{';
            let fleetKeys = GM_listValues();
            console.log(fleetKeys);
            for (let i in fleetKeys) {
                let fleetSavedData = await GM.getValue(fleetKeys[i], '{}');
                //let fleetParsedData = JSON.parse(fleetSavedData);
                importText.value += '"' + fleetKeys[i] + '":' + fleetSavedData;
                if (i < fleetKeys.length - 1) importText.value += ',';
            }
            importText.value += '}';
            assistModalToggle();
        } else {
            targetElem.style.display = 'none';
        }
    }

    async function saveConfigImport() {
        let importText = document.querySelector('#importText');
        let jsonConfig = JSON.parse(importText.value);
        for (let key in jsonConfig) {
            let fleetObj = jsonConfig[key];
            let fleetJson = JSON.stringify(fleetObj);
            await GM.setValue(key, fleetJson);
        }
        assistImportToggle();
    }

    function assistModalToggle() {
        let targetElem = document.querySelector('#assistModal');
        if (targetElem.style.display === 'none') {
            document.querySelectorAll('#assistModal .assist-fleet-row').forEach(e => e.remove());
            document.querySelectorAll('#assistModal .assist-scan-row').forEach(e => e.remove());
            document.querySelectorAll('#assistModal .assist-mine-row').forEach(e => e.remove());
            document.querySelectorAll('#assistModal .assist-pad-row').forEach(e => e.remove());
            document.querySelectorAll('#assistModal .assist-transport-row').forEach(e => e.remove());
            for (let fleet of userFleets) {
                addAssistInput(fleet);
            }
            targetElem.style.display = 'block';
        } else {
            targetElem.style.display = 'none';
        }
    }

    function assistStatusToggle() {
        let targetElem = document.querySelector('#assistStatus');
        if (targetElem.style.display === 'none') {
            targetElem.style.display = 'block';
        } else {
            targetElem.style.display = 'none';
        }
    }

    function assistCheckToggle() {
        let targetElem = document.querySelector('#assistCheck');
        if (targetElem.style.display === 'none') {
            targetElem.style.display = 'block';
        } else {
            targetElem.style.display = 'none';
        }
    }

    async function assistProfileToggle(profiles) {
        return new Promise(async resolve => {
            let targetElem = document.querySelector('#profileModal');
            if (targetElem.style.display === 'none' && profiles) {
                targetElem.style.display = 'block';
                let contentElem = document.querySelector('#profileDiv');
                let transportOptStr = '';
                profiles.forEach( function(profile) {transportOptStr += '<option value="' + profile.profile + '">' + profile.name + '  [' + profile.profile + ']</option>';});
                let profileSelect = document.createElement('select');
                profileSelect.size = profiles.length + 1;
                profileSelect.style.padding = '2px 10px';
                profileSelect.innerHTML = transportOptStr;
                contentElem.append(profileSelect);
                profileSelect.onchange = function() {
                    console.log(profileSelect.value);
                    let selected = profiles.find(o => o.profile === profileSelect.value);
                    assistProfileToggle(null);
                    resolve(selected);
                }
            } else {
                targetElem.style.display = 'none';
                resolve(null);
            }
        });
    }

    async function assistAddAcctToggle() {
            let targetElem = document.querySelector('#addAcctModal');
            if (targetElem.style.display === 'none') {
                targetElem.style.display = 'block';
            } else {
                targetElem.style.display = 'none';
            }
    }

    // only handles movement
    async function handleMovement(fleetIndex) {
        const { destination, ...fleet } = userFleets[fleetIndex];
        const [destX, destY] = destination;
        const fleetAcctInfo = await solanaConnection.getAccountInfo(fleet.publicKey);
        const fleetAcctData = sageProgram.coder.accounts.decode('Fleet', fleetAcctInfo.data);
        const warpCooldownExpiresAt = fleetAcctData.warpCooldownExpiresAt ? fleetAcctData.warpCooldownExpiresAt.toNumber() * 1000 : 0;
        const [fleetState, extra] = getFleetState(fleetAcctInfo);

        switch (fleetState) {
            case 'Idle':
                if (extra.length > 1 && (extra[0] !== destX || extra[1] !== destY)) {
                    const origin = [extra[0], extra[1]];

                    if (fleet.moveType == 'warp') {
                        if (warpCooldownExpiresAt > 0) {
                            await execSubwarp(fleet, origin, destination);
                        } else {
                            await execWarp(fleet, origin, destination);
                        }
                    } else {
                        await execSubwarp(fleet, origin, destination);
                    }
                }
                break;
            case 'MoveWarp':
                const warpArrival = extra.warpFinish.toNumber() * 1000;
                if (warpArrival > Date.now()) return fleet.state = 'Move [' + new Date(warpArrival).toLocaleTimeString() + ']';
                await execExitWarp(fleet);
                break;
            case 'MoveSubwarp':
                const subwarpArrival = extra.arrivalTime.toNumber() * 1000;
                if (subwarpArrival > Date.now()) return fleet.state = 'Move [' + new Date(subwarpArrival).toLocaleTimeString() + ']';
                await execExitSubwarp(fleet);
                break;
            default:
                console.log('I only handle movement, bro');
        }

        updateAssistStatus(fleet);
    }

    // only handles return trip
    async function handleReturnTrip(fleetIndex) {
        const fleet = userFleets[fleetIndex];
        // shallow copy to mutate and flip origin and destination
        const { origin, destination } = JSON.parse(JSON.stringify(fleet));
        const [destX, destY] = destination;

        const fleetAcctInfo = await solanaConnection.getAccountInfo(fleet.publicKey);
        const [fleetState, extra] = getFleetState(fleetAcctInfo);

        if (fleetState == 'Idle' && (extra[0] === destX || extra[1] === destY)) {
            const fleetPK = fleet.publicKey.toString();
            let fleetSavedData = await GM.getValue(fleetPK, '{}');
            let fleetParsedData = JSON.parse(fleetSavedData);

            fleet.origin = destination;
            fleet.destination = origin;

            fleetParsedData.origin = fleet.origin;
            fleetParsedData.destination = fleet.destination;

            await GM.setValue(fleetPK, JSON.stringify(fleetParsedData));
            handleMovement(fleetIndex)
        }
    }

    // only handles scanning
    async function handleScan(fleetIndex) {
        const fleet = userFleets[fleetIndex];
        
        let fleetCurrentCargo = await solanaConnection.getParsedTokenAccountsByOwner(fleet.cargoHold, {programId: tokenProgram});
        let cargoCnt = fleetCurrentCargo.value.reduce((n, {account}) => n + account.data.parsed.info.tokenAmount.uiAmount, 0);
        let currentToolAcct = fleetCurrentCargo.value.find(item => item.pubkey.toString() === fleet.repairKitToken.toString());
        let currentToolCnt = currentToolAcct.account.data.parsed.info.delegatedAmount ? currentToolAcct.account.data.parsed.info.delegatedAmount.uiAmount : 0;
        
        let readyToScan = true;
        if (fleet.scanCost == 0) {
            if (fleet.cargoCapacity - cargoCnt < 100) {
                readyToScan = false;
            }
        } else {
            if (currentToolCnt < fleet.scanCost) {
                readyToScan = false;
            }
        }

        if (!readyToScan) return handleReturnTrip(fleetIndex);
        if (Date.now() > fleet.scanEnd) {
            const scanResult = await execScan(fleet);
            console.log('Scan Result: ', scanResult);

            fleet.state = 'Scanning';
            fleet.scanSectorStart = fleet.scanSectorStart == 0 ? Date.now() : fleet.scanSectorStart;
            fleet.scanEnd = Date.now() + (fleet.scanCooldown * 1000 + 600000);

            const changesSDU = getBalanceChange(scanResult, fleet.sduToken.toString());
            const changesTool = getBalanceChange(scanResult, fleet.repairKitToken.toString());
            let scanCondition = scanResult.meta.logMessages ? scanResult.meta.logMessages.find(item => item.startsWith("Program log: SDU probability:")) : null;
            scanCondition = scanCondition ? (Number(scanCondition.split(' ').pop())*100).toFixed(4) : 0;
            
            console.log(`[${fleet.label}] ${new Date(Date.now()).toISOString()}`);
            console.log(`[${fleet.label}] ${scanCondition}`);
            
            if (changesSDU.postBalance != changesSDU.preBalance) {
                console.log(`[${fleet.label}] FOUND: ${changesSDU.postBalance - changesSDU.preBalance}`);
                fleet.scanSectorStart = Date.now();
                fleet.scanSkipCnt = 0;
            } else {
                console.log(`[${fleet.label}] Whomp whomp`);
            }
            
            console.log(`[${fleet.label}] Date.now(): ${Date.now()}`);
            console.log(`[${fleet.label}] fleet.scanSectorStart: ${fleet.scanSectorStart}`);
            console.log(`[${fleet.label}] diff: ${Date.now() - fleet.scanSectorStart}`);
            
            const strike = scanCondition < fleet.scanMin && (Date.now() - fleet.scanSectorStart) >= 120000 ? true : false;
            console.log(`[${fleet.label}] strike: ${strike}`);

            fleet.scanSkipCnt = strike ? fleet.scanSkipCnt + 1 : 0;
            const nextMoveIdx = fleet.scanBlockIdx > 2 ? 0 : fleet.scanBlockIdx+1;
            fleet.scanBlockIdx = strike && fleet.scanMove == 'true' ? nextMoveIdx : fleet.scanBlockIdx;
            
            console.log(`[${fleet.label}] Tools Remaining: ${changesTool.postBalance}`);
            
            fleet.toolCnt = changesTool.postBalance;
            fleet.sduCnt = changesSDU.postBalance;
            
            if (fleet.scanSkipCnt < 4) {
                fleet.state = `Scanning [${scanCondition}%]`;
                fleet.scanEnd = Date.now() + (fleet.scanCooldown * 1000 + 2000);
            } else {
                fleet.scanEnd = Date.now() + 600000;
                fleet.state = `Scanning Paused [${new Date(fleet.scanEnd).toLocaleTimeString()}]`;
                console.log(`[${fleet.label}] Scanning Paused due to low probability [${new Date(fleet.scanEnd).toLocaleTimeString()}]`);
                fleet.scanSectorStart = 0;
                fleet.scanSkipCnt = 0;
            }
        }
        updateAssistStatus(fleet);
    }

    // only handles resupply
    // @todo - need to refactor still
    async function handleResupply(fleetIndex) {
        const fleet = userFleets[fleetIndex];
        
        await execDock(fleet, userFleets[i].starbaseCoord);

        let fleetCurrentCargo = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].cargoHold, {programId: tokenProgram});
        
        // 1. resupply fuel
        // 2. resupply ammo
        // 3. resupply cargo

        
        // unloads SDUs
        let currentSduCnt = fleetCurrentCargo.value.find(item => item.pubkey.toString() === userFleets[i].sduToken.toString())
        if (currentSduCnt && currentSduCnt.account.data.parsed.info.tokenAmount.uiAmount > 0) {
            await execCargoFromFleetToStarbase(userFleets[i], userFleets[i].cargoHold, 'SDUsgfSZaDhhZ76U3ZgvtFiXsfnHbf2VrzYxjBZ5YbM', userFleets[i].starbaseCoord, currentSduCnt.account.data.parsed.info.tokenAmount.uiAmount);
            userFleets[i].sduCnt = 0;
        }
        
        // loads toolkit
        let currentToolCnt = fleetCurrentCargo.value.find(item => item.pubkey.toString() === userFleets[i].repairKitToken.toString())
        let fleetCurrentFuel = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].fuelTank, {programId: tokenProgram});
        let currentFuelCnt = fleetCurrentFuel.value.find(item => item.pubkey.toString() === userFleets[i].fuelToken.toString())
        if (userFleets[i].scanCost > 0) {
            await execCargoFromStarbaseToFleet(userFleets[i], userFleets[i].cargoHold, userFleets[i].repairKitToken, 'tooLsNYLiVqzg8o4m3L2Uetbn62mvMWRqkog6PQeYKL', repairKitCargoTypeAcct, userFleets[i].starbaseCoord, userFleets[i].cargoCapacity - currentToolCnt.account.data.parsed.info.tokenAmount.uiAmount);
        }
        
        // loads fuel
        fleetCurrentCargo = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].cargoHold, {programId: tokenProgram});
        let currentTool = fleetCurrentCargo.value.find(item => item.account.data.parsed.info.mint === 'tooLsNYLiVqzg8o4m3L2Uetbn62mvMWRqkog6PQeYKL');
        userFleets[i].toolCnt = currentTool ? currentTool.account.data.parsed.info.tokenAmount.uiAmount : 0;
        await execCargoFromStarbaseToFleet(userFleets[i], userFleets[i].fuelTank, userFleets[i].fuelToken, 'fueL3hBZjLLLJHiFH9cqZoozTG3XQZ53diwFPwbzNim', fuelCargoTypeAcct, userFleets[i].starbaseCoord, userFleets[i].fuelCapacity - currentFuelCnt.account.data.parsed.info.tokenAmount.uiAmount);
        userFleets[i].fuelCnt = userFleets[i].fuelCapacity;

        await execUndock(fleet, userFleets[i].starbaseCoord);
    }


    // @todo - need to refactor still
    async function handleMining(i, fleetState, fleetCoords, fleetMining) {
        let destX = userFleets[i].destCoord.split(',')[0].trim();
        let destY = userFleets[i].destCoord.split(',')[1].trim();
        let starbaseX = userFleets[i].starbaseCoord.split(',')[0].trim();
        let starbaseY = userFleets[i].starbaseCoord.split(',')[1].trim();
        let [mineItem] = await sageProgram.account.mineItem.all([
            {
                memcmp: {
                    offset: 105,
                    bytes: userFleets[i].mineResource,
                },
            },
        ]);
        let resourceHardness = mineItem.account.resourceHardness;
        let planets = await getPlanetsFromCoords(destX, destY);
        let sageResource = null;
        let planet = null;
        for (let planetCheck of planets) {
            let resourceCheck = await sageProgram.account.resource.all([
                {
                    memcmp: {
                        offset: 41,
                        bytes: planetCheck.publicKey,
                    },
                },
                {
                    memcmp: {
                        offset: 73,
                        bytes: mineItem.publicKey,
                    },
                },
            ]);
            if (sageResource === null && resourceCheck.length > 0) {
                [sageResource] = resourceCheck;
                planet = planetCheck
            }
        }
        let systemRichness = null;
        if (sageResource && sageResource.account) {
            systemRichness = sageResource.account.systemRichness;
        } else {
            let resShort = resourceTokens.concat(r4Tokens).find(r => r.token == userFleets[i].mineResource).name;
            console.log(`[${userFleets[i].label}] ERROR: ${resShort} not found at mining location`);
            userFleets[i].state = `ERROR: ${resShort} not found at mining location`;
            updateAssistStatus(userFleets[i]);
        }

        // fleet PDA
        let [fleetResourceToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
            [
                userFleets[i].cargoHold.toBuffer(),
                tokenProgram.toBuffer(),
                new solanaWeb3.PublicKey(userFleets[i].mineResource).toBuffer()
            ],
            AssociatedTokenProgram
        );
        let [fleetFoodToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
            [
                userFleets[i].cargoHold.toBuffer(),
                tokenProgram.toBuffer(),
                sageGameAcct.account.mints.food.toBuffer()
            ],
            AssociatedTokenProgram
        );
        let [fleetAmmoToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
            [
                userFleets[i].ammoBank.toBuffer(),
                tokenProgram.toBuffer(),
                sageGameAcct.account.mints.ammo.toBuffer()
            ],
            AssociatedTokenProgram
        );
        let [fleetCargoAmmoToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
            [
                userFleets[i].cargoHold.toBuffer(),
                tokenProgram.toBuffer(),
                sageGameAcct.account.mints.ammo.toBuffer()
            ],
            AssociatedTokenProgram
        );
        let [fleetFuelToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
            [
                userFleets[i].fuelTank.toBuffer(),
                tokenProgram.toBuffer(),
                ResourceTokens.fuel.publicKey.toBuffer()
            ],
            AssociatedTokenProgram
        );

        let fleetCurrentFuelTank = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].fuelTank, {programId: tokenProgram});
        let currentFuel = fleetCurrentFuelTank.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.fuel.toString());
        let fleetFuelAcct = currentFuel ? currentFuel.pubkey : fleetFuelToken;
        let currentFuelCnt = currentFuel ? currentFuel.account.data.parsed.info.tokenAmount.uiAmount : 0;
        let fleetCurrentCargo = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].cargoHold, {programId: tokenProgram});
        let cargoCnt = fleetCurrentCargo.value.reduce((n, {account}) => n + account.data.parsed.info.tokenAmount.uiAmount, 0);
        let currentFood = fleetCurrentCargo.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.food.toString());
        let fleetFoodAcct = currentFood ? currentFood.pubkey : fleetFoodToken;
        let currentFoodCnt = currentFood ? currentFood.account.data.parsed.info.tokenAmount.uiAmount : 0;
        let currentResource = fleetCurrentCargo.value.find(item => item.account.data.parsed.info.mint === userFleets[i].mineResource);
        let fleetResourceAcct = currentResource ? currentResource.pubkey : fleetResourceToken;
        let currentResourceCnt = currentResource ? currentResource.account.data.parsed.info.tokenAmount.uiAmount : 0;
        let fleetCurrentAmmoBank = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].ammoBank, {programId: tokenProgram});
        let currentAmmo = fleetCurrentAmmoBank.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.ammo.toString());
        let fleetAmmoAcct = currentAmmo ? currentAmmo.pubkey : fleetAmmoToken;
        let currentAmmoCnt = currentAmmo ? currentAmmo.account.data.parsed.info.tokenAmount.uiAmount : 0;

        let miningDuration = calculateMiningDuration(userFleets[i].cargoCapacity - cargoCnt, userFleets[i].miningRate, resourceHardness, systemRichness);
        let foodForDuration = Math.ceil((miningDuration-10) * (userFleets[i].foodConsumptionRate / 10000)); // Adding less food to ensure that food is completely consumed
        let ammoForDuration = Math.ceil(miningDuration * (userFleets[i].ammoConsumptionRate / 10000));
        ammoForDuration = Math.min(userFleets[i].ammoCapacity, ammoForDuration);

        let distToTarget = calculateMovementDistance(fleetCoords, [destX,destY]);
        let distReturn = calculateMovementDistance([destX,destY], [starbaseX,starbaseY]);
        let fuelNeeded = userFleets[i].planetExitFuelAmount;
        let warpCost = calculateWarpFuelBurn(userFleets[i], distToTarget) + calculateWarpFuelBurn(userFleets[i], distReturn) + userFleets[i].planetExitFuelAmount;
        let halfWarpCost = calculateWarpFuelBurn(userFleets[i], distToTarget) + calculateSubwarpFuelBurn(userFleets[i], distReturn) + userFleets[i].planetExitFuelAmount;
        let subwarpCost = calculateSubwarpFuelBurn(userFleets[i], distToTarget) + calculateSubwarpFuelBurn(userFleets[i], distReturn) + userFleets[i].planetExitFuelAmount;
        if (userFleets[i].moveType == 'warp') {
            fuelNeeded = userFleets[i].planetExitFuelAmount + (userFleets[i].fuelCapacity < warpCost ? userFleets[i].fuelCapacity < halfWarpCost ? subwarpCost : halfWarpCost : warpCost);
        } else {
            fuelNeeded = userFleets[i].planetExitFuelAmount + subwarpCost;
        }

        async function handleMineMovement() {
            if (userFleets[i].destination && userFleets[i].destination !== '') {
                let targetX = userFleets[i].destination.split(',').length > 1 ? userFleets[i].destination.split(',')[0].trim() : '';
                let targetY = userFleets[i].destination.split(',').length > 1 ? userFleets[i].destination.split(',')[1].trim() : '';
                let moveDist = calculateMovementDistance(fleetCoords, [targetX,targetY]);
                if (moveDist > 0) {
                    let warpCooldownFinished = await handleMovement(i, [targetX, targetY]);
                } else {
                    console.log(`[${userFleets[i].label}] Idle`);
                    userFleets[i].state = 'Idle';
                    updateAssistStatus(userFleets[i]);
                }
            } else {
                console.log(`[${userFleets[i].label}] Mining - ERROR: Fleet must start at Target or Starbase`);
                userFleets[i].state = 'ERROR: Fleet must start at Target or Starbase';
                updateAssistStatus(userFleets[i]);
            }
        }

        if (fleetState === 'Idle') {
            console.log(`[${userFleets[i].label}] Mining Status Check`);
            let errorResource = [];
            let needSupplies = false;

            if (currentFuelCnt < fuelNeeded || currentAmmoCnt < ammoForDuration || currentFoodCnt < foodForDuration || cargoCnt > userFleets[i].cargoCapacity * 0.95) {
                needSupplies = true;
            }

            if (needSupplies) {
                if (fleetCoords[0] == starbaseX && fleetCoords[1] == starbaseY) {
                    console.log(`[${userFleets[i].label}] Docking`);
                    userFleets[i].state = 'Docking';
                    updateAssistStatus(userFleets[i]);
                    await execDock(userFleets[i], userFleets[i].starbaseCoord);
                    await wait(2000);
                    console.log(`[${userFleets[i].label}] Unloading`);
                    userFleets[i].state = 'Unloading';
                    updateAssistStatus(userFleets[i]);
                    if (currentResourceCnt > 0) {
                        await execCargoFromFleetToStarbase(userFleets[i], userFleets[i].cargoHold, userFleets[i].mineResource, userFleets[i].starbaseCoord, currentResourceCnt);
                        await wait(2000);
                    }
                    console.log(`[${userFleets[i].label}] Loading`);
                    userFleets[i].state = 'Loading';
                    updateAssistStatus(userFleets[i]);
                    if (currentFuelCnt < userFleets[i].fuelCapacity) {
                        console.log(`[${userFleets[i].label}] Loading fuel`);
                        let fuelResp = await execCargoFromStarbaseToFleet(userFleets[i], userFleets[i].fuelTank, fleetFuelAcct, sageGameAcct.account.mints.fuel.toString(), fuelCargoTypeAcct, userFleets[i].starbaseCoord, userFleets[i].fuelCapacity - currentFuelCnt);
                        if (fuelResp && fuelResp.name == 'NotEnoughResource') {
                            console.log(`[${userFleets[i].label}] ERROR: Not enough fuel`);
                            errorResource.push('fuel');
                        }
                        await wait(2000);
                    }
                    if (currentAmmoCnt < ammoForDuration) {
                        console.log(`[${userFleets[i].label}] Loading ammo`);
                        let ammoCargoTypeAcct = cargoTypes.find(item => item.account.mint.toString() == sageGameAcct.account.mints.ammo);
                        let ammoResp = await execCargoFromStarbaseToFleet(userFleets[i], userFleets[i].ammoBank, fleetAmmoAcct, sageGameAcct.account.mints.ammo.toString(), ammoCargoTypeAcct, userFleets[i].starbaseCoord, userFleets[i].ammoCapacity - currentAmmoCnt);
                        if (ammoResp && ammoResp.name == 'NotEnoughResource') {
                            console.log(`[${userFleets[i].label}] ERROR: Not enough ammo`);
                            errorResource.push('ammo');
                        }
                        await wait(2000);
                    }
                    fleetCurrentCargo = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].cargoHold, {programId: tokenProgram});
                    cargoCnt = fleetCurrentCargo.value.reduce((n, {account}) => n + account.data.parsed.info.tokenAmount.uiAmount, 0);
                    miningDuration = calculateMiningDuration(userFleets[i].cargoCapacity - cargoCnt, userFleets[i].miningRate, resourceHardness, systemRichness);
                    foodForDuration = Math.ceil(miningDuration * (userFleets[i].foodConsumptionRate / 10000));
                    if (currentFoodCnt < foodForDuration) {
                        console.log(`[${userFleets[i].label}] Loading food`);
                        let foodCargoTypeAcct = cargoTypes.find(item => item.account.mint.toString() == sageGameAcct.account.mints.food);
                        let foodResp = await execCargoFromStarbaseToFleet(userFleets[i], userFleets[i].cargoHold, fleetFoodAcct, sageGameAcct.account.mints.food.toString(), foodCargoTypeAcct, userFleets[i].starbaseCoord, foodForDuration - currentFoodCnt);
                        if (foodResp && foodResp.name == 'NotEnoughResource') {
                            console.log(`[${userFleets[i].label}] ERROR: Not enough food`);
                            errorResource.push('food');
                        }
                        await wait(2000);
                    }
                    if (errorResource.length > 0) {
                        userFleets[i].state = `ERROR: Not enough ${errorResource.toString()}`;
                    } else {
                        console.log(`[${userFleets[i].label}] Undocking`);
                        await execUndock(userFleets[i], userFleets[i].starbaseCoord);
                        userFleets[i].state = 'Idle';
                    }
                    updateAssistStatus(userFleets[i]);
                    //await wait(2000);
                    //userFleets[i].destination = userFleets[i].destCoord;
                } else {
                    userFleets[i].destination = userFleets[i].starbaseCoord;
                    handleMineMovement();
                }
            } else if (fleetCoords[0] == destX && fleetCoords[1] == destY) {
                console.log(`[${userFleets[i].label}] Mining Start`);
                userFleets[i].state = 'Mine [' + new Date(Date.now()+(miningDuration * 1000)).toLocaleTimeString() + ']';
                updateAssistStatus(userFleets[i]);
                await execStartMining(userFleets[i], mineItem, sageResource, planet);
            } else {
                userFleets[i].destination = userFleets[i].destCoord;
                handleMineMovement();
            }
        } else if (userFleets[i].state.slice(0, 4) === 'Mine') {
            let mineEnd = (fleetMining.start.toNumber() + miningDuration) * 1000 + 10; // Adding a 10 second buffer to avoid stopping too early
            userFleets[i].state = 'Mine [' + new Date(mineEnd).toLocaleTimeString() + ']';
            updateAssistStatus(userFleets[i]);
            let sageResourceAcctInfo = await sageProgram.account.resource.fetch(fleetMining.resource);
            let mineItem = await sageProgram.account.mineItem.fetch(sageResourceAcctInfo.mineItem);
            if (Date.now() > mineEnd) {
                console.log(`[${userFleets[i].label}] Mining Stop`);
                userFleets[i].state = 'Mining Stop';
                updateAssistStatus(userFleets[i]);
                await execStopMining(userFleets[i], fleetMining.resource, sageResourceAcctInfo, sageResourceAcctInfo.mineItem, mineItem.mint);
                await wait(2000);
                console.log(`[${userFleets[i].label}] Idle`);
                userFleets[i].state = 'Idle';
                updateAssistStatus(userFleets[i]);
            }
            //userFleets[i].destination = userFleets[i].starbaseCoord;
        }
    }

    // @todo - need to refactor still
    async function handleTransport(i, fleetState, fleetCoords, fleetResupply) {
        let destX = userFleets[i].destCoord.split(',')[0].trim();
        let destY = userFleets[i].destCoord.split(',')[1].trim();
        let starbaseX = userFleets[i].starbaseCoord.split(',')[0].trim();
        let starbaseY = userFleets[i].starbaseCoord.split(',')[1].trim();
        let moveDist = calculateMovementDistance([starbaseX,starbaseY], [destX,destY]);
        let destination = userFleets[i].destination;
        let fleetSavedData = await GM.getValue(userFleets[i].publicKey.toString(), '{}');
        let fleetParsedData = JSON.parse(fleetSavedData);
        let resource1 = fleetParsedData.transportResource1;
        let resource2 = fleetParsedData.transportResource2;
        let resource3 = fleetParsedData.transportResource3;
        let resource4 = fleetParsedData.transportResource4;
        let targetResources = [fleetParsedData.transportResource1, fleetParsedData.transportResource2, fleetParsedData.transportResource3, fleetParsedData.transportResource4];
        let resource1Perc = fleetParsedData.transportResource1Perc;
        let resource2Perc = fleetParsedData.transportResource2Perc;
        let resource3Perc = fleetParsedData.transportResource3Perc;
        let resource4Perc = fleetParsedData.transportResource4Perc;
        let targetResourceAmounts = [fleetParsedData.transportResource1Perc, fleetParsedData.transportResource2Perc, fleetParsedData.transportResource3Perc, fleetParsedData.transportResource4Perc];
        let starbaseResources = [fleetParsedData.transportSBResource1, fleetParsedData.transportSBResource2, fleetParsedData.transportSBResource3, fleetParsedData.transportSBResource4];
        let starbaseResourceAmounts = [fleetParsedData.transportSBResource1Perc, fleetParsedData.transportSBResource2Perc, fleetParsedData.transportSBResource3Perc, fleetParsedData.transportSBResource4Perc];

        // fleet PDA
        let [fleetFuelToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
            [
                userFleets[i].fuelTank.toBuffer(),
                tokenProgram.toBuffer(),
                ResourceTokens.fuel.publicKey.toBuffer()
            ],
            AssociatedTokenProgram
        );
        let [fleetAmmoToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
            [
                userFleets[i].ammoBank.toBuffer(),
                tokenProgram.toBuffer(),
                sageGameAcct.account.mints.ammo.toBuffer()
            ],
            AssociatedTokenProgram
        );
        let [fleetCargoFuelToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
            [
                userFleets[i].cargoHold.toBuffer(),
                tokenProgram.toBuffer(),
                sageGameAcct.account.mints.fuel.toBuffer()
            ],
            AssociatedTokenProgram
        );

        if (fleetState === 'Idle') {
            console.log(`[${userFleets[i].label}] Transporting`);
            let fleetCurrentCargo = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].cargoHold, {programId: tokenProgram});
            let errorResource = [];
            if (fleetCoords[0] == starbaseX && fleetCoords[1] == starbaseY) { // Fleet at starbase?
                console.log(`[${userFleets[i].label}] Docking`);
                userFleets[i].state = 'Docking';
                updateAssistStatus(userFleets[i]);
                await execDock(userFleets[i], userFleets[i].starbaseCoord);
                await wait(2000);
                if (starbaseResourceAmounts[0] > 0 || starbaseResourceAmounts[1] > 0 || starbaseResourceAmounts[2] > 0 || starbaseResourceAmounts[3] > 0) {
                    console.log(`[${userFleets[i].label}] Unloading`);
                    userFleets[i].state = 'Unloading';
                    updateAssistStatus(userFleets[i]);

                    let extraFuel = 0;
                    let extraAmmo = 0;
                    for (let [j, resource] of starbaseResources.entries()) {
                        let resourceAmount = starbaseResourceAmounts[j];
                        if (resource !== '' && resourceAmount > 0) {
                            console.log(`[${userFleets[i].label}] Unloading ${resource}`);
                            let currentRes = fleetCurrentCargo.value.find(item => item.account.data.parsed.info.mint === resource);
                            let currentResCnt = currentRes ? currentRes.account.data.parsed.info.tokenAmount.uiAmount : 0;
                            let resAmt = resourceAmount;
                            let resMax = Math.min(currentResCnt, resAmt);
                            if (resMax > 0) {
                                await execCargoFromFleetToStarbase(userFleets[i], userFleets[i].cargoHold, resource, userFleets[i].starbaseCoord, resMax);
                                await wait(2000);
                            }
                            if (resource == sageGameAcct.account.mints.fuel.toString() && resMax < resAmt) extraFuel = resAmt - resMax;
                            if (resource == sageGameAcct.account.mints.ammo.toString() && resMax < resAmt) extraAmmo = resAmt - resMax;
                        }
                    }

                    if (extraFuel > 0) {
                        let fleetCurrentFuelTank = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].fuelTank, {programId: tokenProgram});
                        let currentFuel = fleetCurrentFuelTank.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.fuel.toString());
                        let currentFuelCnt = currentFuel ? currentFuel.account.data.parsed.info.tokenAmount.uiAmount : 0;
                        let resFuelMax = Math.min(currentFuelCnt, extraFuel);
                        if (resFuelMax > 0) {
                            await execCargoFromFleetToStarbase(userFleets[i], userFleets[i].fuelTank, sageGameAcct.account.mints.fuel.toString(), userFleets[i].starbaseCoord, resFuelMax);
                            await wait(2000);
                        }
                    }

                    if (extraAmmo > 0) {
                        let fleetCurrentAmmoBank = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].ammoBank, {programId: tokenProgram});
                        let currentAmmo = fleetCurrentAmmoBank.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.ammo.toString());
                        let currentAmmoCnt = currentAmmo ? currentAmmo.account.data.parsed.info.tokenAmount.uiAmount : 0;
                        let resAmmoMax = Math.min(currentAmmoCnt, extraAmmo);
                        if (resAmmoMax > 0) {
                            await execCargoFromFleetToStarbase(userFleets[i], userFleets[i].ammoBank, sageGameAcct.account.mints.ammo.toString(), userFleets[i].starbaseCoord, resAmmoMax);
                            await wait(2000);
                        }
                    }
                }
                console.log(`[${userFleets[i].label}] Refueling`);
                userFleets[i].state = 'Refueling';
                updateAssistStatus(userFleets[i]);
                let fleetCurrentFuelTank = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].fuelTank, {programId: tokenProgram});
                let currentFuel = fleetCurrentFuelTank.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.fuel.toString());
                let fleetFuelAcct = currentFuel ? currentFuel.pubkey : fleetFuelToken;
                let currentFuelCnt = currentFuel ? currentFuel.account.data.parsed.info.tokenAmount.uiAmount : 0;
                if (currentFuelCnt < userFleets[i].fuelCapacity) {
                    let fuelResp = await execCargoFromStarbaseToFleet(userFleets[i], userFleets[i].fuelTank, fleetFuelAcct, sageGameAcct.account.mints.fuel.toString(), fuelCargoTypeAcct, userFleets[i].starbaseCoord, userFleets[i].fuelCapacity - currentFuelCnt);
                    if (fuelResp && fuelResp.name == 'NotEnoughResource') {
                        console.log(`[${userFleets[i].label}] ERROR: Not enough fuel`);
                        errorResource.push('fuel');
                    }
                    await wait(2000);
                }
                let fuelNeeded = 0;
                if (userFleets[i].moveType == 'warp') {
                    fuelNeeded = calculateWarpFuelBurn(userFleets[i], moveDist) * 2;
                } else {
                    fuelNeeded = calculateSubwarpFuelBurn(userFleets[i], moveDist) * 2;
                }
                fleetCurrentCargo = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].cargoHold, {programId: tokenProgram});
                let cargoCnt = fleetCurrentCargo.value.reduce((n, {account}) => n + account.data.parsed.info.tokenAmount.uiAmount, 0);
                let cargoSpace = userFleets[i].cargoCapacity - cargoCnt;
                if (fuelNeeded > userFleets[i].fuelCapacity) {
                    let currentFuel = fleetCurrentCargo.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.fuel.toString());
                    let currentFuelCnt = currentFuel ? currentFuel.account.data.parsed.info.tokenAmount.uiAmount : 0;
                    let fleetCargoFuelAcct = currentFuel ? currentFuel.pubkey : fleetCargoFuelToken;
                    let cargoFuelAmt = calculateSubwarpFuelBurn(userFleets[i], moveDist) - currentFuelCnt;
                    if (cargoFuelAmt > 0 && cargoSpace > cargoFuelAmt) {
                        cargoSpace -= cargoFuelAmt;
                        cargoCnt += cargoFuelAmt;
                        let fuelResp = await execCargoFromStarbaseToFleet(userFleets[i], userFleets[i].cargoHold, fleetCargoFuelAcct, sageGameAcct.account.mints.fuel.toString(), fuelCargoTypeAcct, userFleets[i].starbaseCoord, cargoFuelAmt);
                        if (fuelResp && fuelResp.name == 'NotEnoughResource') {
                            console.log(`[${userFleets[i].label}] ERROR: Not enough fuel`);
                            errorResource.push('fuel');
                        }
                    } else {
                        errorResource.push('fuel');
                    }
                }
                if (errorResource.length == 0) {
                    userFleets[i].state = 'Loading';
                    updateAssistStatus(userFleets[i]);

                    let resAmmo = targetResources.indexOf(sageGameAcct.account.mints.ammo.toString());
                    let extraAmmo = 0;
                    if (resAmmo > -1) {
                        let fleetCurrentAmmoBank = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].ammoBank, {programId: tokenProgram});
                        let currentAmmo = fleetCurrentAmmoBank.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.ammo.toString());
                        let ammoCargoTypeAcct = cargoTypes.find(item => item.account.mint.toString() == sageGameAcct.account.mints.ammo);
                        let fleetAmmoAcct = currentAmmo ? currentAmmo.pubkey : fleetAmmoToken;
                        let currentAmmoCnt = currentAmmo ? currentAmmo.account.data.parsed.info.tokenAmount.uiAmount : 0;
                        let resAmmoAmt = targetResourceAmounts[resAmmo];
                        let resAmmoMax = Math.min(userFleets[i].ammoCapacity, resAmmoAmt);
                        if (currentAmmoCnt < resAmmoMax) {
                            await execCargoFromStarbaseToFleet(userFleets[i], userFleets[i].ammoBank, fleetAmmoAcct, sageGameAcct.account.mints.ammo.toString(), ammoCargoTypeAcct, userFleets[i].starbaseCoord, resAmmoMax - currentAmmoCnt);
                            await wait(2000);
                        }
                        if (resAmmoMax < resAmmoAmt) extraAmmo = resAmmoAmt - resAmmoMax;
                    }

                    for (let [j, resource] of targetResources.entries()) {
                        let resourceAmount = targetResourceAmounts[j];
                        if (resource !== '' && resourceAmount > 0) {
                            console.log(`[${userFleets[i].label}] Loading ${resource}`);
                            let [fleetResourceToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
                                [
                                    userFleets[i].cargoHold.toBuffer(),
                                    tokenProgram.toBuffer(),
                                    new solanaWeb3.PublicKey(resource).toBuffer()
                                ],
                                AssociatedTokenProgram
                            );
                            let currentRes = fleetCurrentCargo.value.find(item => item.account.data.parsed.info.mint === resource);
                            let fleetResAcct = currentRes ? currentRes.pubkey : fleetResourceToken;
                            let resCargoTypeAcct = cargoTypes.find(item => item.account.mint.toString() == resource);
                            //let res1Amt = Math.ceil((userFleets[i].cargoCapacity - cargoCnt) * (resource1Perc / 100));
                            let resAmt = resource == sageGameAcct.account.mints.ammo ? extraAmmo : resourceAmount;
                            let resMax = Math.min(cargoSpace, resAmt);
                            if (resMax > 0) {
                                cargoSpace -= resMax;
                                let resp = await execCargoFromStarbaseToFleet(userFleets[i], userFleets[i].cargoHold, fleetResAcct, resource, resCargoTypeAcct, userFleets[i].starbaseCoord, resMax);
                                if (resp && resp.name == 'NotEnoughResource') {
                                    let resShort = resourceTokens.concat(r4Tokens).find(r => r.token == resource).name;
                                    console.log(`[${userFleets[i].label}] ERROR: Not enough ${resShort}`);
                                    errorResource.push(resShort);
                                }
                                await wait(2000);
                            }
                        }
                    }
                }
                if (errorResource.length > 0) {
                    userFleets[i].state = `ERROR: Not enough ${errorResource.toString()}`;
                } else {
                    console.log(`[${userFleets[i].label}] Undocking`);
                    userFleets[i].state = 'Undocking';
                    await execUndock(userFleets[i], userFleets[i].starbaseCoord);
                }
                updateAssistStatus(userFleets[i]);
                await wait(2000);
                userFleets[i].destination = userFleets[i].destCoord;
            }
            if (fleetCoords[0] == destX && fleetCoords[1] == destY) {
                console.log(`[${userFleets[i].label}] Docking`);
                userFleets[i].state = 'Docking';
                updateAssistStatus(userFleets[i]);
                await execDock(userFleets[i], userFleets[i].destCoord);
                await wait(2000);
                if (targetResourceAmounts[0] > 0 || targetResourceAmounts[1] > 0 || targetResourceAmounts[2] > 0 || targetResourceAmounts[3] > 0) {
                    userFleets[i].state = 'Unloading';
                    updateAssistStatus(userFleets[i]);

                    let fleetCurrentFuelTank = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].fuelTank, {programId: tokenProgram});
                    let currentFuel = fleetCurrentFuelTank.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.fuel.toString());
                    fleetCurrentCargo = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].cargoHold, {programId: tokenProgram});
                    let currentCargoFuel = fleetCurrentCargo.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.fuel.toString());
                    let currentFuelCnt = currentFuel ? currentFuel.account.data.parsed.info.tokenAmount.uiAmount : 0;
                    let currentCargoFuelCnt = currentCargoFuel ? currentCargoFuel.account.data.parsed.info.tokenAmount.uiAmount : 0;

                    let warpCost = calculateWarpFuelBurn(userFleets[i], moveDist);
                    let subwarpCost = calculateSubwarpFuelBurn(userFleets[i], moveDist);
                    let extraFuel = (currentFuelCnt + currentCargoFuelCnt) - Math.ceil(subwarpCost);
                    if (userFleets[i].moveType == 'warp' && currentFuelCnt + currentCargoFuelCnt > warpCost) {
                        extraFuel = (currentFuelCnt + currentCargoFuelCnt) - Math.ceil(warpCost);
                    }
                    console.log('Current Fuel: ', currentFuelCnt);
                    console.log('Current Cargo Fuel: ', currentCargoFuelCnt);
                    console.log('Warp Cost: ', warpCost);
                    console.log('Subwarp Cost: ', subwarpCost);
                    console.log('Extra Fuel: ', extraFuel);

                    let extraAmmo = 0;
                    for (let [j, resource] of targetResources.entries()) {
                        let resourceAmount = targetResourceAmounts[j];
                        if (resource == sageGameAcct.account.mints.fuel.toString()) resourceAmount = Math.min(extraFuel, targetResourceAmounts[j]);
                        if (resource !== '' && resourceAmount > 0) {
                            console.log(`[${userFleets[i].label}] Unloading ${resource}`);
                            let currentRes = fleetCurrentCargo.value.find(item => item.account.data.parsed.info.mint === resource);
                            let currentResCnt = currentRes ? currentRes.account.data.parsed.info.tokenAmount.uiAmount : 0;
                            let resAmt = resourceAmount;
                            let resMax = Math.min(currentResCnt, resAmt);
                            if (resMax > 0) {
                                await execCargoFromFleetToStarbase(userFleets[i], userFleets[i].cargoHold, resource, userFleets[i].destCoord, resMax);
                                await wait(2000);
                            }
                            if (resource == sageGameAcct.account.mints.fuel.toString()) extraFuel = resAmt - resMax;
                            if (resource == sageGameAcct.account.mints.ammo.toString()) extraAmmo = resAmt - resMax;
                        }
                    }

                    if (extraFuel > 0) {
                        let fleetCurrentFuelTank = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].fuelTank, {programId: tokenProgram});
                        let currentFuel = fleetCurrentFuelTank.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.fuel.toString());
                        let currentFuelCnt = currentFuel ? currentFuel.account.data.parsed.info.tokenAmount.uiAmount : 0;
                        let resFuelMax = Math.min(currentFuelCnt, extraFuel);
                        if (resFuelMax > 0) {
                            await execCargoFromFleetToStarbase(userFleets[i], userFleets[i].fuelTank, sageGameAcct.account.mints.fuel.toString(), userFleets[i].destCoord, resFuelMax);
                            await wait(2000);
                        }
                    }

                    if (extraAmmo > 0) {
                        let fleetCurrentAmmoBank = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].ammoBank, {programId: tokenProgram});
                        let currentAmmo = fleetCurrentAmmoBank.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.ammo.toString());
                        let currentAmmoCnt = currentAmmo ? currentAmmo.account.data.parsed.info.tokenAmount.uiAmount : 0;
                        let resAmmoMax = Math.min(currentAmmoCnt, extraAmmo);
                        if (resAmmoMax > 0) {
                            await execCargoFromFleetToStarbase(userFleets[i], userFleets[i].ammoBank, sageGameAcct.account.mints.ammo.toString(), userFleets[i].destCoord, resAmmoMax);
                            await wait(2000);
                        }
                    }
                }
                userFleets[i].state = 'Loading';
                updateAssistStatus(userFleets[i]);

                let resAmmo = starbaseResources.indexOf(sageGameAcct.account.mints.ammo.toString());
                let extraAmmo = 0;
                if (resAmmo > -1) {
                    let fleetCurrentAmmoBank = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].ammoBank, {programId: tokenProgram});
                    let currentAmmo = fleetCurrentAmmoBank.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.ammo.toString());
                    let ammoCargoTypeAcct = cargoTypes.find(item => item.account.mint.toString() == sageGameAcct.account.mints.ammo);
                    let fleetAmmoAcct = currentAmmo ? currentAmmo.pubkey : fleetAmmoToken;
                    let currentAmmoCnt = currentAmmo ? currentAmmo.account.data.parsed.info.tokenAmount.uiAmount : 0;
                    let resAmmoAmt = starbaseResourceAmounts[resAmmo];
                    let resAmmoMax = Math.min(userFleets[i].ammoCapacity, resAmmoAmt);
                    if (currentAmmoCnt < resAmmoMax) {
                        console.log(`[${userFleets[i].label}] Loading Ammo`);
                        await execCargoFromStarbaseToFleet(userFleets[i], userFleets[i].ammoBank, fleetAmmoAcct, sageGameAcct.account.mints.ammo.toString(), ammoCargoTypeAcct, userFleets[i].destCoord, resAmmoMax - currentAmmoCnt);
                        await wait(2000);
                    }
                    if (resAmmoMax < resAmmoAmt) extraAmmo = resAmmoAmt - resAmmoMax;
                }

                fleetCurrentCargo = await solanaConnection.getParsedTokenAccountsByOwner(userFleets[i].cargoHold, {programId: tokenProgram});
                let cargoCnt = fleetCurrentCargo.value.reduce((n, {account}) => n + account.data.parsed.info.tokenAmount.uiAmount, 0);
                let cargoSpace = userFleets[i].cargoCapacity - cargoCnt;

                for (let [j, resource] of starbaseResources.entries()) {
                    let resourceAmount = starbaseResourceAmounts[j];
                    if (resource !== '' && resourceAmount > 0) {
                        console.log(`[${userFleets[i].label}] Loading ${resource}`);
                        let [fleetResourceToken] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
                            [
                                userFleets[i].cargoHold.toBuffer(),
                                tokenProgram.toBuffer(),
                                new solanaWeb3.PublicKey(resource).toBuffer()
                            ],
                            AssociatedTokenProgram
                        );
                        let currentRes = fleetCurrentCargo.value.find(item => item.account.data.parsed.info.mint === resource);
                        let fleetResAcct = currentRes ? currentRes.pubkey : fleetResourceToken;
                        let resCargoTypeAcct = cargoTypes.find(item => item.account.mint.toString() == resource);
                        //let res1Amt = Math.ceil((userFleets[i].cargoCapacity - cargoCnt) * (resource1Perc / 100));
                        let resAmt = resource == sageGameAcct.account.mints.ammo.toString() ? extraAmmo : resourceAmount;
                        let resMax = Math.min(cargoSpace, resAmt);
                        if (resMax > 0) {
                            cargoSpace -= resMax;
                            let resp = await execCargoFromStarbaseToFleet(userFleets[i], userFleets[i].cargoHold, fleetResAcct, resource, resCargoTypeAcct, userFleets[i].destCoord, resMax);
                            if (resp && resp.name == 'NotEnoughResource') {
                                let resShort = resourceTokens.concat(r4Tokens).find(r => r.token == resource).name;
                                console.log(`[${userFleets[i].label}] ERROR: Not enough ${resShort}`);
                                errorResource.push(resShort);
                            }
                            await wait(2000);
                        }
                    }
                }
                if (errorResource.length > 0) {
                    userFleets[i].state = `ERROR: Not enough ${errorResource.toString()}`;
                } else {
                    console.log(`[${userFleets[i].label}] Undocking`);
                    userFleets[i].state = 'Undocking';
                    await execUndock(userFleets[i], userFleets[i].destCoord);
                    await wait(2000);
                }
                updateAssistStatus(userFleets[i]);
                userFleets[i].destination = userFleets[i].starbaseCoord;
            }
            if (errorResource.length > 0) {
                userFleets[i].state = `ERROR: Not enough ${errorResource.toString()}`;
            } else {
                if (userFleets[i].destination !== '') {
                    let targetX = userFleets[i].destination.split(',').length > 1 ? userFleets[i].destination.split(',')[0].trim() : '';
                    let targetY = userFleets[i].destination.split(',').length > 1 ? userFleets[i].destination.split(',')[1].trim() : '';
                    moveDist = calculateMovementDistance(fleetCoords, [targetX,targetY]);
                    let warpCooldownFinished = await handleMovement(i, [targetX, targetY]);
                } else {
                    console.log(`[${userFleets[i].label}] Transporting - ERROR: Fleet must start at Target or Starbase`);
                    userFleets[i].state = 'ERROR: Fleet must start at Target or Starbase';
                    updateAssistStatus(userFleets[i]);
                }
            }
            updateAssistStatus(userFleets[i]);
        }
    }

    // @todo - need to refactor still
    let iterCnt = 1;
    async function startAssistant() {
        if (enableAssistant) {
            console.log('----TICK----');
            for (let i=0, n=userFleets.length; i < n; i++) {
                console.log(`[${userFleets[i].label}] - ${userFleets[i].busy ? 'busy' : 'not busy'}`);
                if(userFleets[i].busy) continue;
                try {
                    let fleetSavedData = await GM.getValue(userFleets[i].publicKey.toString(), '{}');
                    let fleetParsedData = JSON.parse(fleetSavedData);
                    let fleetAcctInfo = await solanaConnection.getAccountInfo(userFleets[i].publicKey);
                    let [fleetState, extra] = getFleetState(fleetAcctInfo);
                    
                    console.log(`State: ${fleetState}`);
                    console.log(`${userFleets[i].state}`);

                    let fleetCoords = fleetState == 'Idle' ? extra : [];
                    let fleetMining = fleetState == 'MineAsteroid' ? extra : [];
                    userFleets[i].origin = fleetCoords;
                    if (userFleets[i].state == 'MoveWarp' || userFleets[i].state == 'MoveSubwarp') {
                        handleMovement(i, [null, null]);
                    }
                    /*
                    if (fleetParsedData.assignment == 'Scan' && readyToScan && userFleets[i].state === 'Idle') { // change to fleetState == 'Idle'
                        console.log(`[${userFleets[i].label}] Scanning`);
                        let destCoords = userFleets[i].scanBlock[userFleets[i].scanBlockIdx];
                        handleScan(i, fleetCoords, destCoords);
                    } else if (fleetParsedData.assignment == 'Scan' && userFleets[i].state === 'Idle') {
                        console.log(`[${userFleets[i].label}] Resupplying`);
                        handleResupply(i);
                     */
                    if (fleetParsedData.assignment == 'Scan' && fleetState == 'Idle') {
                        console.log(`[${userFleets[i].label}] Scanning`);
                        let destCoords = userFleets[i].scanBlock[userFleets[i].scanBlockIdx];
                        handleScan(i, fleetCoords, destCoords);
                    } else if (fleetParsedData.assignment == 'Mine') {
                        if (userFleets[i].state.slice(0, 5) !== 'ERROR') {
                            handleMining(i, userFleets[i].state, fleetCoords, fleetMining);
                        }
                    } else if (fleetParsedData.assignment == 'Transport') {
                        if (userFleets[i].state.slice(0, 5) !== 'ERROR') {
                            handleTransport(i, userFleets[i].state, fleetCoords, fleetParsedData.resupply);
                        }
                    }
                } catch (err) {
                    console.log('ERROR: ', err);
                }
                await wait(100);
                updateAssistStatus(userFleets[i]);
            }
            //console.log('Iter: ', iterCnt);
            setTimeout(startAssistant, 20000);
            iterCnt++;
        };
    }

    async function toggleAssistant() {
        let autoSpanRef = document.querySelector('#autoScanBtn > span');
        if (enableAssistant === true) {
            enableAssistant = false;
            autoSpanRef.innerHTML = 'Start';
        } else {
            enableAssistant = true;
            startAssistant();
            autoSpanRef.innerHTML = 'Stop';
            for (let i=0, n=userFleets.length; i < n; i++) {
                let fleetAcctInfo = await solanaConnection.getAccountInfo(userFleets[i].publicKey);
                let [fleetState, extra] = getFleetState(fleetAcctInfo);
                let fleetCoords = fleetState == 'Idle' && extra ? extra : [];
                userFleets[i].origin = fleetCoords;
                userFleets[i].state = fleetState;
            }
        }
    }

    function makeDraggable(elem) {
        const elemHeader = elem.querySelector('.assist-modal-header');
        let originalX, originalY, elementX, elementY;
        function dragElem(e)
        {
            elementY = elementY + e.clientY - originalY;
            elementX = elementX + e.clientX - originalX;
            originalY = e.clientY;
            originalX = e.clientX;
            elem.style.top = elementY + "px";
            elem.style.left = elementX + "px";
            elem.style.right = 'auto';
            elem.style.bottom = 'auto';
        }
        elemHeader.addEventListener('mousedown', function(e) {
            e.preventDefault();
            originalX = e.clientX;
            originalY = e.clientY;
            elementX = elem.offsetLeft;
            elementY = elem.offsetTop;

            window.addEventListener('mousemove', dragElem, false);

            window.addEventListener('mouseup', () => {
                window.removeEventListener('mousemove', dragElem, false);
            }, false);

        }, false);
    }

    let observer = new MutationObserver(waitForLabs);
    function waitForLabs(mutations, observer){
        let elemTrigger = observer ? '#root > div:first-of-type > div:first-of-type > div > header > h1' : 'body';
        //if(document.querySelectorAll('#root > div:first-of-type > div:first-of-type > div > header > h1').length > 0 && !document.getElementById("autoScanBtn")) {
        //if(document.querySelectorAll('body').length > 0 && !document.getElementById("autoScanBtn")) {
        if(document.querySelectorAll(elemTrigger).length > 0 && !document.getElementById("assistContainer")) {
            document.getElementById("assistContainerIso") && document.getElementById("assistContainerIso").remove();
            observer && observer.disconnect();
            let assistCSS = document.createElement('style');
            assistCSS.innerHTML = '.assist-modal {display: none; position: fixed; z-index: 2; padding-top: 100px; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.4);} .assist-modal-content {position: relative; display: flex; flex-direction: column; background-color: rgb(41, 41, 48); margin: auto; padding: 0; border: 1px solid #888; width: 785px; min-width: 450px; max-width: 75%; height: auto; min-height: 50px; max-height: 85%; overflow-y: auto; box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2),0 6px 20px 0 rgba(0,0,0,0.19); -webkit-animation-name: animatetop; -webkit-animation-duration: 0.4s; animation-name: animatetop; animation-duration: 0.4s;} #assist-modal-error {color: red; margin-left: 5px; margin-right: 5px; font-size: 16px;} .assist-modal-header-right {color: rgb(255, 190, 77); margin-left: auto !important; font-size: 20px;} .assist-btn {background-color: rgb(41, 41, 48); color: rgb(255, 190, 77); margin-left: 2px; margin-right: 2px;} .assist-btn:hover {background-color: rgba(255, 190, 77, 0.2);} .assist-modal-close:hover, .assist-modal-close:focus {font-weight: bold; text-decoration: none; cursor: pointer;} .assist-modal-btn {color: rgb(255, 190, 77); padding: 5px 5px; margin-right: 5px; text-decoration: none; background-color: rgb(41, 41, 48); border: none; cursor: pointer;} .assist-modal-save:hover { background-color: rgba(255, 190, 77, 0.2); } .assist-modal-header {display: flex; align-items: center; padding: 2px 16px; background-color: rgba(255, 190, 77, 0.2); border-bottom: 2px solid rgb(255, 190, 77); color: rgb(255, 190, 77);} .assist-modal-body {padding: 2px 16px; font-size: 12px;} .assist-modal-body > table {width: 100%;} .assist-modal-body th, .assist-modal-body td {padding-right: 5px, padding-left: 5px;} #assistStatus {background-color: rgba(0,0,0,0.4); opacity: 0.75; backdrop-filter: blur(10px); position: absolute; top: 80px; right: 20px; z-index: 1;} #assistCheck {background-color: rgba(0,0,0,0.75); backdrop-filter: blur(10px); position: absolute; margin: auto; left: 0; right: 0; top: 100px; width: 650px; min-width: 450px; max-width: 75%; z-index: 1;} .dropdown { position: absolute; display: none; margin-top: 25px; margin-left: 152px; background-color: rgb(41, 41, 48); min-width: 120px; box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.2); z-index: 2; } .dropdown.show { display: block; } .assist-btn-alt { color: rgb(255, 190, 77); padding: 12px 16px; text-decoration: none; display: block; background-color: rgb(41, 41, 48); border: none; cursor: pointer; } .assist-btn-alt:hover { background-color: rgba(255, 190, 77, 0.2); } #checkresults { padding: 5px; margin-top: 20px; border: 1px solid grey; border-radius: 8px;} .dropdown button {width: 100%; text-align: left;} #assistModal table {border-collapse: collapse;} .assist-scan-row, .assist-mine-row, .assist-transport-row {background-color: rgba(255, 190, 77, 0.1); border-left: 1px solid white; border-right: 1px solid white; border-bottom: 1px solid white} .show-top-border {background-color: rgba(255, 190, 77, 0.1); border-left: 1px solid white; border-right: 1px solid white; border-top: 1px solid white;}';

            let assistModal = document.createElement('div');
            assistModal.classList.add('assist-modal');
            assistModal.id = 'assistModal';
            assistModal.style.display = 'none';
            let assistModalContent = document.createElement('div');
            assistModalContent.classList.add('assist-modal-content');
            let iconStr = 'data:image/png;base64,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';
            assistModalContent.innerHTML = '<div class="assist-modal-header"><img src="' + iconStr + '" /><span style="padding-left: 15px;">SLY Lab Assistant</span><div class="assist-modal-header-right"><button id="addAcctOpen" class="assist-modal-btn">Add Restricted Account</button><button id="configImportExport" class="assist-modal-btn">Import/Export</button><button class=" assist-modal-btn assist-modal-save">Save</button><span class="assist-modal-close">x</span></div></div><div class="assist-modal-body"><span id="assist-modal-error"></span><table><tr><td>Fleet</td><td>Assignment</td><td>Target</td><td>Starbase</td><td>Subwarp</td><td>Max Cargo</td><td>Max Ammo</td><td>Max Fuel</td></tr></table></div>';
            assistModal.append(assistModalContent);

            let importModal = document.createElement('div');
            importModal.classList.add('assist-modal');
            importModal.id = 'importModal';
            importModal.style.display = 'none';
            importModal.style.zIndex = 3;
            let importModalContent = document.createElement('div');
            importModalContent.classList.add('assist-modal-content');
            importModalContent.innerHTML = '<div class="assist-modal-header"><span>Config Import/Export</span><div class="assist-modal-header-right"><button id="importConfigBtn" class="assist-modal-btn assist-modal-save">Import Config</button><span class="assist-modal-close">x</span></div></div><div class="assist-modal-body"><span id="assist-modal-error"></span><div></div><span>Copy the text below to save your raw Lab Assistant configuration. To restore your previous configuration, enter configuration text in the text box below then click the Import Config button.</span><div></div><textarea id="importText" rows="4" cols="80" max-width="100%"></textarea></div>';
            importModal.append(importModalContent);

            let profileModal = document.createElement('div');
            profileModal.classList.add('assist-modal');
            profileModal.id = 'profileModal';
            profileModal.style.display = 'none';
            profileModal.style.zIndex = 3;
            let profileModalContent = document.createElement('div');
            profileModalContent.classList.add('assist-modal-content');
            profileModalContent.innerHTML = '<div class="assist-modal-header"><span>Profile Selection</span><div class="assist-modal-header-right"><span class="assist-modal-close">x</span></div></div><div class="assist-modal-body"><span id="assist-modal-error"></span><div></div><span>Select a profile to connect to Lab Assistant.</span><div></div><div id="profileDiv" max-width="100%"></div></div>';
            profileModal.append(profileModalContent);

            let addAcctModal = document.createElement('div');
            addAcctModal.classList.add('assist-modal');
            addAcctModal.id = 'addAcctModal';
            addAcctModal.style.display = 'none';
            addAcctModal.style.zIndex = 3;
            let addAcctModalContent = document.createElement('div');
            addAcctModalContent.classList.add('assist-modal-content');
            addAcctModalContent.innerHTML = '<div class="assist-modal-header"><span>Add Restricted Account</span><div class="assist-modal-header-right"><button id="addAcctBtn" class="assist-modal-btn">Add Account</button><button id="removeAcctBtn" class="assist-modal-btn">Remove Account</button><span class="assist-modal-close">x</span></div></div><div class="assist-modal-body"><span id="assist-modal-error"></span><div></div><span>Grant restricted access to interact with this account\'s SAGE instance from another account. Enter the public key of the restricted account below.</span><div></div><div max-width="100%"><input id="addAcctDiv" type="text" style="width: 375px;"></div></div>';
            addAcctModal.append(addAcctModalContent);

            let assistStatus = document.createElement('div');
            assistStatus.id = 'assistStatus';
            assistStatus.style.display = 'none';
            let assistStatusContent = document.createElement('div');
            assistStatusContent.classList.add('assist-status-content');
            assistStatusContent.innerHTML = '<div class="assist-modal-header" style="cursor: move;">Status<div class="assist-modal-header-right"><span class="assist-modal-close">x</span></div></div><div class="assist-modal-body"><table><tr><td>Fleet</td><td>Tools</td><td>SDUs</td><td>State</td></tr></table></div>'
            assistStatus.append(assistStatusContent);

            let assistCheck = document.createElement('div')
			assistCheck.id = 'assistCheck'
			assistCheck.style.display = 'none'
			let assistCheckContent = document.createElement('div')
			//assistCheckContent.classList.add('assist-check-content');
			assistCheckContent.innerHTML = '<div class="assist-modal-header" style="cursor: move;">Fleet Surveillance<div class="assist-modal-header-right"><span class="assist-modal-close">x</span></div></div><div class="assist-modal-body"><span id="assist-modal-error"></span><div style="display: flex; flex-direction: row; justify-content: center;"><select id="fleetGridSelect"><option value="3">3x3</option><option value="5">5x5</option><option value="7">7x7</option></select><input id="checkFleetCntInput" type="text" placeholder="x, y" style="width: 50px;"><button id="checkFleetBtn" class="assist-btn"><span style="font-size: 14px;">Check</span></button></div><div style="display: flex; justify-content: center;"><div id="loadingMessage" style="display: none;">Loading...</div><table id="fleetGrid" class="fleet-grid" style="display: none;"></table></div></div>';
			assistCheck.append(assistCheckContent)

            let autoContainer = document.createElement('div');
            autoContainer.style.display = 'flex';
            autoContainer.style.flexDirection = 'row';
            let autoTitle = document.createElement('span');
            autoTitle.innerHTML = 'Lab Assistant';
            autoTitle.style.fontSize = '14px';
            let autoButton = document.createElement('button');
            autoButton.id = 'autoScanBtn';
            autoButton.classList.add('assist-btn');
            //autoButton.style.position = 'absolute';
            //autoButton.style.left = '50%';
            //autoButton.style.transform = 'translate(-50%, 0)';
            autoButton.addEventListener('click', function(e) {toggleAssistant();});
            let autoBtnSpan = document.createElement('span');
            autoBtnSpan.innerText = initComplete == true ? 'Start' : 'Wait...';
            autoBtnSpan.style.fontSize = '14px';
            autoButton.appendChild(autoBtnSpan);

            let dropdown = document.createElement('div');
            dropdown.classList.add('dropdown');
            let dropdownBtn = document.createElement('button');
            dropdownBtn.classList.add('assist-btn');
            dropdownBtn.innerText = 'Tools';
            dropdownBtn.addEventListener('click', function () {
                dropdown.classList.toggle('show');
            })
            dropdown.addEventListener('click', function() {
                dropdown.classList.remove('show');
            });

            let assistConfigButton = document.createElement('button');
            assistConfigButton.id = 'assistConfigBtn';
            assistConfigButton.classList.add('assist-btn','assist-btn-alt');
            assistConfigButton.addEventListener('click', function(e) {assistModalToggle();});
            let assistConfigSpan = document.createElement('span');
            assistConfigSpan.innerText = 'Config';
            assistConfigSpan.style.fontSize = '14px';
            assistConfigButton.appendChild(assistConfigSpan);

            let assistCheckButton = document.createElement('button');
            assistCheckButton.id = 'assistCheckBtn';
            assistCheckButton.classList.add('assist-btn','assist-btn-alt');
            assistCheckButton.addEventListener('click', function(e) {assistCheckToggle();});
            let assistCheckSpan = document.createElement('span');
            assistCheckSpan.innerText = 'Surveillance';
            assistCheckSpan.style.fontSize = '14px';
            assistCheckButton.appendChild(assistCheckSpan);

            let assistStatusButton = document.createElement('button');
            assistStatusButton.id = 'assistStatusBtn';
            assistStatusButton.classList.add('assist-btn','assist-btn-alt');
            assistStatusButton.addEventListener('click', function(e) {assistStatusToggle();});
            let assistStatusSpan = document.createElement('span');
            assistStatusSpan.innerText = 'Status';
            assistStatusSpan.style.fontSize = '14px';
            assistStatusButton.appendChild(assistStatusSpan);
            autoContainer.appendChild(autoTitle);
            autoContainer.appendChild(autoButton);
            autoContainer.appendChild(dropdownBtn);
			autoContainer.appendChild(dropdown);

            dropdown.appendChild(assistStatusButton);
            dropdown.appendChild(assistCheckButton);
            dropdown.appendChild(assistConfigButton);

            let targetElem = document.querySelector('body');
            if (observer) {
                autoContainer.id = 'assistContainer';
                targetElem = document.querySelector('#root > div:first-of-type > div:first-of-type > div > header > h1');
                targetElem.style.fontSize = '18px';
                targetElem.append(assistCSS);
                targetElem.append(autoContainer);
            } else {
                autoContainer.id = 'assistContainerIso';
                targetElem.prepend(autoContainer);
                targetElem.prepend(assistCSS);
            }
            targetElem.append(assistModal);
            targetElem.append(assistStatus);
            targetElem.append(assistCheck);
            targetElem.append(importModal);
            targetElem.append(profileModal);
            targetElem.append(addAcctModal);
            let assistModalClose = document.querySelector('#assistModal .assist-modal-close');
            assistModalClose.addEventListener('click', function(e) {assistModalToggle();});
            let assistModalSave = document.querySelector('#assistModal .assist-modal-save');
            assistModalSave.addEventListener('click', function(e) {saveAssistInput();});
            let assistStatusClose = document.querySelector('#assistStatus .assist-modal-close');
            assistStatusClose.addEventListener('click', function(e) {assistStatusToggle();});
            let assistCheckClose = document.querySelector('#assistCheck .assist-modal-close');
            assistCheckClose.addEventListener('click', function(e) {assistCheckToggle();});
            let assistCheckFleetBtn = document.querySelector('#checkFleetBtn');
            assistCheckFleetBtn.addEventListener('click', function(e) {getFleetCntAtCoords();});
            let configImportExport = document.querySelector('#configImportExport');
            configImportExport.addEventListener('click', function(e) {assistImportToggle();});
            let configImport = document.querySelector('#importConfigBtn');
            configImport.addEventListener('click', function(e) {saveConfigImport();});
            let addAcctOpen = document.querySelector('#addAcctOpen');
            addAcctOpen.addEventListener('click', function(e) {assistAddAcctToggle();});
            let addAcctBtn = document.querySelector('#addAcctBtn');
            addAcctBtn.addEventListener('click', function(e) {addKeyToProfile(document.querySelector('#addAcctDiv').value);});
            let removeAcctBtn = document.querySelector('#removeAcctBtn');
            removeAcctBtn.addEventListener('click', function(e) {removeKeyFromProfile();});
            let configImportClose = document.querySelector('#importModal .assist-modal-close');
            configImportClose.addEventListener('click', function(e) {assistImportToggle();});
            let profileModalClose = document.querySelector('#profileModal .assist-modal-close');
            profileModalClose.addEventListener('click', function(e) {assistProfileToggle(null);});
            let addAcctClose = document.querySelector('#addAcctModal .assist-modal-close');
            addAcctClose.addEventListener('click', function(e) {assistAddAcctToggle();});

            makeDraggable(assistCheck);
            makeDraggable(assistStatus);
        }
    }
    observer.observe(document, {childList: true, subtree: true});
    waitForLabs(null, null);

    await initUser();
    let autoSpanRef = document.querySelector('#autoScanBtn > span');
    autoSpanRef ? autoSpanRef.innerHTML = 'Start' : null;
    console.log('init complete');
    console.log('Fleets: ', userFleets);

    // DEBUG - use if mining fleet gets stuck
    /*
    async function miningSelfDestruct(fleet, destX, destY) {
        let [playerAtlasTokenAcct] = await BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
            [
                new solanaWeb3.PublicKey(userPublicKey).toBuffer(),
                tokenProgram.toBuffer(),
                new solanaWeb3.PublicKey('ATLASXmbPQxBUYbxPsV97usA3fPQYEqzQBUHgiFCUsXx').toBuffer()
            ],
            AssociatedTokenProgram
        );
        let [mineItem] = await sageProgram.account.mineItem.all([
            {
                memcmp: {
                    offset: 105,
                    bytes: fleet.mineResource,
                },
            },
        ]);
        let planets = await getPlanetsFromCoords(destX, destY);
        let sageResource = null;
        let planet = null;
        for (let planetCheck of planets) {
            let resourceCheck = await sageProgram.account.resource.all([
                {
                    memcmp: {
                        offset: 41,
                        bytes: planetCheck.publicKey,
                    },
                },
                {
                    memcmp: {
                        offset: 73,
                        bytes: mineItem.publicKey,
                    },
                },
            ]);
            if (sageResource === null && resourceCheck.length > 0) {
                [sageResource] = resourceCheck;
                planet = planetCheck
            }
        }
        return new Promise(async resolve => {
            let tx = { instruction: await sageProgram.methods.mineAsteroidToRespawn({keyIndex: new BrowserAnchor.anchor.BN(userProfileKeyIdx), toSector: [new BrowserAnchor.anchor.BN(destX), new BrowserAnchor.anchor.BN(destY)]}).accountsStrict({
                gameAccountsFleetAndOwner: {
                    gameFleetAndOwner: {
                        fleetAndOwner: {
                            fleet: fleet.publicKey,
                            owningProfile: userProfileAcct,
                            owningProfileFaction: userProfileFactionAcct.publicKey,
                            key: userPublicKey
                        },
                        gameId: sageGameAcct.publicKey
                    },
                    gameState: sageGameAcct.account.gameState
                },
                resource: sageResource.publicKey,
                planet: planet.publicKey,
                fuelTank: fleet.fuelTank,
                fuelTokenFrom: fleet.fuelToken,
                atlasTokenFrom: playerAtlasTokenAcct,
                atlasTokenTo: 'FdHkzP8eWeFpNSreMiZCWzJYrcZG2GJAPSyb3gENL8fS',
                tokenProgram: tokenProgram
            }).instruction()}
            let txResult = await txSignAndSend(tx);
            console.log(txResult);
            resolve(txResult);
        });
    }
    await miningSelfDestruct(userFleets[2], -30, 30);
    */

})();