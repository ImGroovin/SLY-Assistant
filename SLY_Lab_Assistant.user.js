// ==UserScript==
// @name         SLY Lab Assistant
// @namespace    http://tampermonkey.net/
// @version      0.5.0
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
    
    let provider;
    const wallets = [ solflare ];
    let graceBlockWindow = 5;
    let enableAssistant = false;
    let initComplete = false;

    // in memory storage
    let userFleets = [];
    const GLOBAL_SCALE_DECIMALS_2 = 100;
    const GLOBAL_SCALE_DECIMALS_4 = 10000;
    const GLOBAL_SCALE_DECIMALS_6 = 1000000;

    const RPCEndpoints = ['https://rpc.hellomoon.io/cfd5910f-fb7d-4489-9b32-f97193eceefd'];
    const solanaConnection = new solanaWeb3.Connection(RPCEndpoints[0], 'confirmed');
    const anchorProvider = new BrowserAnchor.anchor.AnchorProvider(solanaConnection, null, null);

    // load SAGE program and methods
    const sageProgramId = new solanaWeb3.PublicKey('SAGEqqFewepDHH6hMDcmWy7yjHPpyKLDnRXKb3Ki8e6');
    const sageIDL = await BrowserAnchor.anchor.Program.fetchIdl(sageProgramId, anchorProvider);
    const sageProgram = new BrowserAnchor.anchor.Program(sageIDL, sageProgramId, anchorProvider);
    console.debug('sageProgram: ', sageProgram);
    const [sageGameAcct] = await sageProgram.account.game.all();
    console.debug('sageGameAcct: ', sageGameAcct);
    const [sageSDUTrackerAcct] = await sageProgram.account.surveyDataUnitTracker.all();
    console.debug('sageSDUTrackerAcct: ', sageSDUTrackerAcct);

    // load player profile and methods
    const profileProgramId = new solanaWeb3.PublicKey('pprofELXjL5Kck7Jn5hCpwAL82DpTkSYBENzahVtbc9');
    const profileIDL = await BrowserAnchor.anchor.Program.fetchIdl(profileProgramId, anchorProvider);
    const profileProgram = new BrowserAnchor.anchor.Program(profileIDL, profileProgramId, anchorProvider);
    console.debug('profileProgram: ', profileProgram);

    // load cargo program and methods
    const cargoProgramId = new solanaWeb3.PublicKey('Cargo8a1e6NkGyrjy4BQEW4ASGKs9KSyDyUrXMfpJoiH');
    const cargoIDL = await BrowserAnchor.anchor.Program.fetchIdl(cargoProgramId, anchorProvider);
    const cargoProgram = new BrowserAnchor.anchor.Program(cargoIDL, cargoProgramId, anchorProvider);
    const [cargoStatsDefinitionAcct] = await cargoProgram.account.cargoStatsDefinition.all();
    const cargoStatsDefSeqId = cargoStatsDefinitionAcct.account.seqId;
    console.debug('cargoProgram', cargoProgram);
    console.debug('cargoStatsDefinitionAcct', cargoStatsDefinitionAcct);

    const profileFactionProgramId = new solanaWeb3.PublicKey('pFACSRuobDmvfMKq1bAzwj27t6d2GJhSCHb1VcfnRmq');
    const profileFactionIDL = await BrowserAnchor.anchor.Program.fetchIdl(profileFactionProgramId, anchorProvider);
    const profileFactionProgram = new BrowserAnchor.anchor.Program(profileFactionIDL, profileFactionProgramId, anchorProvider);
 
    // token accounts
    const tokenProgram = new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    const AssociatedTokenProgram = new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
    const RecentSlotHashes = new solanaWeb3.PublicKey('SysvarS1otHashes111111111111111111111111111');
    const InstructionsSysVar = new solanaWeb3.PublicKey('Sysvar1nstructions1111111111111111111111111');

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
        getPodToken: async function (input) {
            let { name, publicKey, pod } = input;
            if (publicKey) name = this.find(item => item.publicKey === publicKey || item.publicKey.toString() === publicKey).name;
            if (name) name = name.toLowerCase().trim();
            if (!name || name === '' || !publicKey) throw new Error('Need to provide resource name or publicKey!');
            if (!pod || !this[name].from) throw new Error('Need to provide pod (fleet or starbase) for resource!');

            const resourcePublicKey = this[name].publicKey;
            const podPublicKey = pod || this[name].from;

            const pda = BrowserAnchor.anchor.web3.PublicKey.findProgramAddressSync(
                [
                    podPublicKey.toBuffer(),
                    tokenProgram.toBuffer(),
                    resourcePublicKey.toBuffer()
                ],
                AssociatedTokenProgram
            );

            try {
                await solanaConnection.getAccountInfo(pda);
            } catch {
                await createProgramDerivedAccount(pda, podPublicKey, resourcePublicKey);
            }
            return pda;
        }
    }
    
/**
 * The function `getProvider` is an asynchronous function that takes in a `wallets` object and returns
 * the provider object associated with the first wallet found in the `walletWindow` object.
 * @param wallets - An object that contains different wallet providers. The keys of the object are the
 * names of the wallets, and the values are the corresponding wallet provider objects.
 * @returns the provider object if it exists and is connected.
 */
    async function getProvider () {
        const provider = wallets.find(name => typeof name !== 'undefined');
        if (provider) {
            if (!provider.isConnected) await provider.connect();
            return provider;
        }
    }

/**
 * The "wait" function returns a promise that resolves after a specified number of milliseconds.
 * @param ms - The "ms" parameter represents the number of milliseconds to wait before resolving the
 * promise.
 * @returns a Promise object.
 */
    function wait(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }

    const MAX_TRANSACTION_SIZE = 1232;

    function lengthToCompact16size(size) {
        if (size > 0x7f) return 2;
        return 1;
    }

/**
 * The function calculates the size of a transaction in bytes based on the number of instructions and
 * the keys involved.
 * @param instructions - An array of objects representing instructions for a transaction. Each object
 * has the following properties: `instruction`
 * @param funder - The `funder` parameter is an object that represents the funder's account. It should
 * have a `toBase58()` method that returns the base58 encoded string representation of the account's
 * public key.
 * @returns the size of a transaction in bytes.
 */
    function getTransactionSize(instructions, funder) {
        let ixSizes = 0;
        const uniqueSigners = new Set(funder.toBase58());
        const uniqueKeys = new Set(funder.toBase58());

        instructions.forEach(({ instruction }) => {
            uniqueKeys.add(instruction.programId.toBase58());

            instruction.keys.forEach((key) => {
                if (key.isSigner) uniqueSigners.add(key.pubkey.toBase58());
                uniqueKeys.add(key.pubkey.toBase58());
            });
            ixSizes +=
            1 + // program id index
            lengthToCompact16size(instruction.keys.length) + // num accounts
            instruction.keys.length + // account indexes
            lengthToCompact16size(instruction.data.length) + // num ix bytes
            instruction.data.length; // ix bytes
        });
    
      // console.log({ uniqueSigners, uniqueKeys, ixSizes });
    
      return (
        lengthToCompact16size(uniqueSigners.size) + // num sigs
        uniqueSigners.size * 64 + // Sigs
        3 + // message header
        lengthToCompact16size(uniqueKeys.size) + // num accounts
        uniqueKeys.size * 32 + // accounts
        32 + // recent blockhash
        lengthToCompact16size(instructions.length) + // num instructions
        ixSizes
      );
    }

/**
 * The function `createProgramDerivedAccount` creates a derived account using the provided derived
 * public key and two other derived from public keys.
 * @param derived - The `derived` parameter is the public key of the account that will be created as a
 * derived account.
 * @param derivedFrom1 - The `derivedFrom1` parameter is a public key that represents the account from
 * which the `derived` account is derived.
 * @param derivedFrom2 - The parameter `derivedFrom2` is a public key that represents the account from
 * which the `derived` account is derived.
 * @returns the result of the `txSignAndSend` function, which is likely a promise that resolves to the
 * transaction details.
 */
    async function createProgramDerivedAccount(derived, derivedFrom1, derivedFrom2) {
        const keys = [{
            pubkey: provider.publicKey,
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

    const seqBN = new BrowserAnchor.anchor.BN(cargoStatsDefSeqId);
    const seqArr = seqBN.toTwos(64).toArrayLike(BrowserBuffer.Buffer.Buffer, "be", 2);
    const seq58 = bs58.encode(seqArr);

    const [sduCargoTypeAcct] = await cargoProgram.account.cargoType.all([
        {
           memcmp: {
               offset: 41,
                bytes: ResourceTokens.sdu.publicKey.toBase58(),
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

/**
 * The function `getFleetState` takes in fleet account information and returns the fleet state and any
 * additional data associated with it.
 * @param fleetAccountInfo - The `fleetAccountInfo` parameter is an object that contains information about a
 * fleet account. It has a property called `data` which is an array of numbers.
 * @returns The function `getFleetState` returns an array with two elements. The first element is the
 * fleet state, which can be one of the following values: 'StarbaseLoadingBay', 'Idle', 'MineAsteroid',
 * 'MoveWarp', 'MoveSubwarp', or 'Respawn'. The second element is an additional value that provides
 * extra information depending on the fleet state.
 */
    function getFleetState(fleetAccountInfo) {
        let remainingData = fleetAccountInfo.data.slice(414);
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

    /**
     * The `initUser` function retrieves user profiles and fleet accounts, and returns the user profile
     * and user profile faction account.
     * @returns The function `initUser` returns an object with properties `playerProfile` and
     * `playerProfileFactionAcct`.
     */
    async function initUser() {
        provider = await getProvider(wallets);
        console.debug('Provider: ', provider);

        let userProfiles = await solanaConnection.getProgramAccounts(profileProgramId);

        let playerProfiles = [];
        for (let [index, userProfile] of userProfiles.entries()) {
            let profileData = userProfile.account.data.subarray(30);
            while (profileData.length >= 80) {
                const profile = profileData.subarray(0, 80);
                const decodedProfile = profileProgram.coder.types.decode('ProfileKey', profile);
                
                if (decodedProfile.key.toString() === provider.publicKey.toString()) {
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
                    const playerName = playerNameAcct ? new TextDecoder().decode(playerNameAcct.account.data.subarray(42)) : '';
                    playerProfiles.push({ ...userProfile, name: playerName, index })
                }
                profileData = profileData.subarray(80);
            }
        }

        const playerProfile = playerProfiles.length > 1 ? await assistProfileToggle(playerProfiles) : playerProfiles[0];
        console.debug('User Profile: ', playerProfile);

        const [playerProfileFactionAcct] = await profileFactionProgram.account.profileFactionAccount.all([
            {
                memcmp: {
                    offset: 9,
                    bytes: playerProfile.pubkey.toBase58(),
                },
            },
        ]);
        playerProfile.faction = playerProfileFactionAcct;

        const userFleetAccts = await sageProgram.account.fleet.all([
            {
                memcmp: {
                    offset: 41,
                    bytes: playerProfile.pubkey.toBase58(),
                },
            },
        ]);

        for (let fleet of userFleetAccts) {
            const name = new TextDecoder("utf-8").decode(new Uint8Array(fleet.account.fleetLabel)).replace(/\0/g, '');
                     
            const fleetDefaultData = {
                origin: {
                    coords: '',
                    supplies: {}
                },
                destination:  {
                    coords: '',
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
                scanBlockIndex: 0,
                scanMove: true,             
            }

            const fleetSavedData = JSON.parse(await GM.getValue(fleet.publicKey.toString(), '{}'));
            Object.keys(fleetSavedData).forEach(key => {
                if (fleetDefaultData.hasOwnProperty(key)) fleetDefaultData[key] = fleetSavedData[key]
            });
            
            const fleetAccountInfo = await solanaConnection.getAccountInfo(fleet.publicKey);
            let [fleetState, extra] = getFleetState(fleetAccountInfo);
            if (fleetState == 'Idle' && extra) {
                for (let i = 0; i < fleetDefaultData.scanBlock.length; i++) {
                    if (extra[0] == fleetDefaultData.scanBlock[i][0] && extra[1] == fleetDefaultData.scanBlock[i][1]) {
                        fleetDefaultData.scanBlockIndex = i;
                        break;
                    }
                }
            }

            userFleets.push({
                name,
                ...fleetDefaultData,
                ...fleet
            });
        }
        userFleets.sort(function (a, b) {
            return a.name.toUpperCase().localeCompare(b.name.toUpperCase());
        });

        return { playerProfile, playerProfileFactionAcct };
    }

/**
 * The function `getBalanceChange` calculates the change in balance for a specific account after a
 * transaction.
 * @param txResult - The `txResult` parameter is an object that represents the result of a transaction.
 * It contains information about the transaction, such as the message, metadata, and token balances
 * before and after the transaction.
 * @param targetAcct - The `targetAcct` parameter is the account address or key that you want to get
 * the balance change for.
 * @returns an object with two properties: "preBalance" and "postBalance".
 */
    function getBalanceChange(txResult, targetAcct) {
        const acctIdx = txResult.transaction.message.staticAccountKeys.findIndex(item => item.toString() === targetAcct);

        const preTokenBalances = txResult.meta.preTokenBalances.find(item => item.accountIndex === acctIdx);
        const preBalance = preTokenBalances.uiTokenAmount.uiAmount || 0;
        const postTokenBalances = txResult.meta.postTokenBalances.find(item => item.accountIndex === acctIdx);
        const postBalance = postTokenBalances.uiTokenAmount.uiAmount || 0;

        return { preBalance, postBalance }
    }

 /**
  * The function calculates the distance between two points in a two-dimensional space.
  * @param origin - The origin parameter represents the starting point of movement. It is an array
  * containing the x and y coordinates of the origin point.
  * @param destination - The destination parameter is the coordinates of the destination point. It is
  * an array with two elements, where the first element represents the x-coordinate and the second
  * element represents the y-coordinate.
  * @returns the distance between the origin and destination points.
  */
    function calculateMovementDistance(origin, destination) {
        return dest ? Math.sqrt((origin[0] - destination[0]) ** 2 + (origin[1] - destination[1]) ** 2) : 0
    }

/**
 * The function calculates the amount of fuel burned by a fleet traveling a certain distance while warping.
 * @param fleet - An object representing a fleet of spaceships. It should have a property called
 * "warpFuelConsumptionRate" which represents the rate at which the fleet consumes warp fuel.
 * @param distance - The distance is the total distance that the fleet will be traveling.
 * @returns the amount of fuel burned by a fleet when traveling a certain distance.
 */
    function calculateWarpFuelBurn(fleet, distance) {
        return distance * (fleet.warpFuelConsumptionRate / 100)
    }

/**
 * The function calculates the amount of fuel burned by a fleet based on the distance traveled.
 * @param fleet - The fleet parameter represents the fleet of ships that will be traveling the
 * distance. It is assumed to be an object with properties related to the fleet's subwarp fuel
 * consumption rate.
 * @param distance - The distance is the total distance that the fleet will be traveling.
 * @returns the amount of fuel burned by a fleet when traveling a certain distance.
 */
    function calculateSubwarpFuelBurn(fleet, distance) {
        return distance * (fleet.subwarpFuelConsumptionRate / 100)
    }

/**
 * The function calculates the duration of mining based on cargo capacity, mining rate, resource
 * hardness, and system richness.
 * @param cargoCapacity - The cargo capacity refers to the maximum amount of resources that can be
 * stored in the mining vessel.
 * @param miningRate - The rate at which resources can be extracted via the mining
 * operation. It is measured in units per second.
 * @param resourceHardness - Resource hardness refers to the difficulty or toughness of the resource
 * being mined. It is usually measured on a scale from 0 to 100, where 0 represents a very soft or
 * easy-to-mine resource, and 100 represents a very hard or difficult-to-mine resource.
 * @param systemRichness - System richness refers to the abundance or concentration of the resource
 * being mined in the system. It is usually represented as a percentage, where 100% indicates a high
 * concentration of the resource and 0% indicates no concentration or availability of the resource in
 * the system.
 * @returns the calculated mining duration.
 */
    function calculateMiningDuration(cargoCapacity, miningRate, resourceHardness, systemRichness) {
        return resourceHardness > 0 ? Math.ceil(cargoCapacity / (((miningRate / 10000) * (systemRichness / 100)) / (resourceHardness / 100))) : 0;
    }

/**
 * The function BNToBs58 takes a BigNumber as input, converts it to a byte array, and then encodes it
 * using the Base58 encoding scheme.
 * @param bignumber - The `bignumber` parameter is a number that you want to convert to a Base58
 * encoded string.
 * @returns a Base58 encoded string.
 */
    function BNToBs58(bignumber) {
        const bn = new BrowserAnchor.anchor.BN(bignumber);
        const bnArray = bn.toTwos(64).toArrayLike(BrowserBuffer.Buffer.Buffer, "le", 8);
        return bs58.encode(bnArray);
    }

/**
 * The function `getStarbaseFromCoords` retrieves a starbase using it's coordinates.
 * @param x - The `x` parameter represents the x-coordinate of the starbase location. It is used to
 * search for a starbase that matches the given x-coordinate.
 * @param y - The parameter `y` represents the y-coordinate of a starbase.
 * @returns The function `getStarbaseFromCoords` returns the starbase object that matches the given
 * coordinates (x, y).
 */
    async function getStarbaseFromCoords(x, y) {
        const [starbase] = await sageProgram.account.starbase.all([
            {
                memcmp: {
                    offset: 41,
                    bytes: BNToBs58(x)
                }
            },
            {
                memcmp: {
                    offset: 49,
                    bytes: BNToBs58(y)
                }
            },
        ]);

        return starbase;
    }

/**
 * The function `getPlanetsFromCoords` retrieves planets from coordinates (x, y) using the Sage program.
 * @param x - The parameter `x` represents the x-coordinate of a location
 * @param y - The parameter `y` represents the y-coordinate of a location.
 * @returns an array of planets found in the given coordinates.
 */
    async function getPlanetsFromCoords(x, y) {
        return await sageProgram.account.planet.all([
            {
                memcmp: {
                    offset: 105,
                    bytes: BNToBs58(x)
                }
            },
            {
                memcmp: {
                    offset: 113,
                    bytes: BNToBs58(y)
                }
            },
        ]);
    }

/**
 * The function `getStarbasePlayer` retrieves a starbase player based on the user profile and starbase
 * provided.
 * @param playerProfile - The `playerProfile` is the public key of the player profile.
 * @param starbase - The `starbase` is the public key for the given starbase. 
 * @returns the `starbasePlayer` public key.
 */
    async function getStarbasePlayer(playerProfile, starbase) {
        const [starbasePlayer] = await sageProgram.account.starbasePlayer.all([
            {
                memcmp: {
                    offset: 9,
                    bytes: playerProfile.pubkey.toBase58()
                }
            },
            {
                memcmp: {
                    offset: 73,
                    bytes: starbase.toBase58()
                }
            },
        ]);
        return starbasePlayer;
    }

    async function getFleetCountAtCoords() {
        const gridSize = document.querySelector('#fleetGridSelect').value;
        const targetCoords = document.querySelector('#checkFleetCntInput').value;

        const fleetGrid = document.querySelector('#fleetGrid');
        const loadingMessage = document.querySelector('#loadingMessage');

        if (!targetCoords || targetCoords.trim() === '') {
            loadingMessage.innerText = 'Please enter target coordinates for grid center.';
            loadingMessage.style.display = 'block';
            fleetGrid.style.display = 'none';
            return;// Stop further processing since input is empty or idle
        }
        const [x, y] = targetCoords.split(',').map(coords => parseInt(coords.trim()));
        fleetGrid.innerHTML = ''; // Clear previous results

        try {
            loadingMessage.innerText = 'Loading...';
            loadingMessage.style.display = 'block';
            fleetGrid.style.display = 'none';

            for (let i = 0; i < gridSize; i++) {
                const row = fleetGrid.insertRow();
                for (let j = 0; j < gridSize; j++) {
                    const coordX = x + j - Math.floor(gridSize / 2);// Adjusted for column-first population
                    const coordY = y + (gridSize-1) - i - Math.floor(gridSize / 2);// Adjusted for descending y value

                    const fleetAccts = await solanaConnection.getProgramAccounts(sageProgramId, {
                        filters: [
                            { memcmp: { offset: 415, bytes: BNToBs58(x) } },
                            { memcmp: { offset: 423, bytes: BNToBs58(y) } },
                        ],
                    });

                    const cell = row.insertCell(j);
                    // Create a div to hold the content for formatting
                    const contentDiv = document.createElement('div');
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
        } catch (error) {
            console.error('Error fetching fleet information:', error);
            loadingMessage.innerText = 'Error fetching fleet information';
        }
    }
    
/**
 * The function `httpMonitor` is an asynchronous function that monitors the status of a transaction.
 * @param connection - The `connection` parameter is an object that represents the connection to the
 * Solana blockchain network. It is used to interact with the network and perform various operations
 * such as sending transactions, querying account information, etc.
 * @param txHash - The transaction hash of the transaction you want to monitor.
 * @param txn - The `txn` parameter represents the serialized transaction that you want to monitor. It is
 * used if the transaction needs to be re-submitted.
 * @param lastValidBlockHeight - The `lastValidBlockHeight` parameter represents the block height up to
 * which the monitoring function should wait for the transaction to be confirmed. If the current block
 * height exceeds or equals `lastValidBlockHeight`, the function will return a timeout error.
 * @param lastMinAverageBlockSpeed - The `lastMinAverageBlockSpeed` parameter represents the average
 * block speed in the last minute. It is used to calculate the waiting time before checking the
 * transaction status again.
 * @param [count=1] - The `count` parameter is used to keep track of the number of times the
 * `httpMonitor` function has been called recursively. It is initially set to 1 and is incremented each
 * time the function is called.
 * @returns an object with properties `name` and `err` if a timeout occurs. Otherwise, it returns an
 * object with properties `txHash` and `confirmation` if the transaction is confirmed.
 */
    async function httpMonitor(connection, txHash, txn, lastValidBlockHeight, lastMinAverageBlockSpeed, count = 1) {
        const acceptableCommitments = [connection.commitment, 'finalized'];
        try {
            let { blockHeight } = await connection.getEpochInfo({ commitment: 'confirmed' });
            if (blockHeight >= lastValidBlockHeight) return { name: 'LudicrousTimoutError', err: `Timed out for ${txHash}` };
            const signatureStatus = await connection.getSignatureStatus(txHash);

            if (signatureStatus.err) {
                console.log('HTTP error for', txHash, signatureStatus);
                return signatureStatus;
            } else if (signatureStatus.value === null || !acceptableCommitments.includes(signatureStatus.value.confirmationStatus)) {
                console.log('HTTP not confirmed', txHash, signatureStatus);
                await wait(lastMinAverageBlockSpeed * graceBlockWindow);
                if (count % 7 == 0) {
                    console.log('---RESENDTXN---');
                    await connection.sendRawTransaction(txn, {skipPreflight: true, maxRetries: 0, preflightCommitment: 'confirmed'});
                }
                if (count < 30) return httpMonitor(connection, txHash, txn, lastValidBlockHeight, ++count);
            } else if (acceptableCommitments.includes(signatureStatus.value.confirmationStatus) ) {
                console.log('HTTP confirmed', txHash, signatureStatus);
                return { txHash, confirmation: signatureStatus };
            }
        } catch (error) {
            console.log(`HTTP connection error: ${txHash}`, error);
            return error;
        }

        return { name: 'LudicrousTimoutError', err: `Timed out for ${txHash}` };
    }

/**
 * The function `sendLudicrousTransaction` sends a transaction using a connection object, logs the
 * transaction hash, and then calls the `httpMonitor` function to monitor the transaction's status.
 * @param txn - The `txn` parameter is the transaction object that you want to send. It contains all
 * the necessary information for the transaction, such as the sender, recipient, amount, and any
 * additional data or instructions.
 * @param lastValidBlockHeight - The `lastValidBlockHeight` parameter represents the height of the last
 * valid block on the blockchain. It is used in the `sendLudicrousTransaction` function to monitor the
 * transaction's confirmation status and ensure that it is included in a block after the specified
 * height.
 * @param connection - The `connection` parameter is an object that represents the connection to the
 * Solana blockchain network. It is used to interact with the network and perform various operations
 * such as sending transactions, querying account information, etc.
 * @returns The function `sendLudicrousTransaction` is returning the result of the `httpMonitor`
 * function.
 */
    async function sendLudicrousTransaction(txn, lastValidBlockHeight, connection) {
        console.log('---SENDTXN---');
        let txHash = await connection.sendRawTransaction(txn, {skipPreflight: true, maxRetries: 0, preflightCommitment: 'confirmed'});
        console.log(txHash);

        const recentPerformanceSamples = await connection.getRecentPerformanceSamples(1);
        const { samplePeriodSecs, numSlots } = recentPerformanceSamples[0];
        const lastMinAverageBlockSpeed = Math.floor(samplePeriodSecs * 1000 / numSlots);

        return await httpMonitor(connection, txHash, txn, lastValidBlockHeight, lastMinAverageBlockSpeed);
    }

/**
 * The function `batchTransactions` is an asynchronous function that takes an array of instructions
 * (`ixs`) and batches them into multiple transactions based on a maximum transaction size.
 * @param ixs - An array of instructions (ixs) to be batched together. Each instruction represents 
 * a specific action to be performed on the Solana blockchain.
 * @param [txs] - The `txs` parameter is an array that stores the transactions that have been batched
 * so far. It is an optional parameter and is initially an empty array. Each transaction is added to
 * this array before recursively calling the `batchTransactions` function again with the remaining
 * transactions.
 * @returns The function `batchTransactions` returns an array of transactions (`txs`).
 */
    async function batchTransactions(ixs, blockhash, lastValidBlockHeight, txs = []) {
        const tx = new solanaWeb3.Transaction();

        for (let index = 0; index < ixs.length; index++) {
            let before = ixs.slice(0, index + 1);
            const after = ixs.slice(-(ixs.length - (index + 1)));

            if (getTransactionSize(before, provider.publicKey) > MAX_TRANSACTION_SIZE) {
                before = ixs.slice(0, index);
            } else {
                if (before.length != after.length) continue;
            }

            before.forEach(ix => tx.add(ix.instruction));
            tx.recentBlockhash = blockhash;
            tx.lastValidBlockHeight = lastValidBlockHeight;
            tx.feePayer = provider.publicKey;
            tx.signer = provider.publicKey;
            txs.push(tx);
            if (after.length > 0) return batchTransactions(after, blockhash, lastValidBlockHeight, txs);
        }
        return txs;
    }

/**
 * The function `txSignAndSend` signs and sends a batch of transactions to the Solana blockchain,
 * handling errors and retries if necessary.
 * @param ixs - The parameter `ixs` is an array of instructions that you want to include in the
 * transaction. Each instruction represents an action to be performed on the Solana blockchain.
 * @returns an array of transaction results.
 */
    async function txSignAndSend(ixs) {
        const { blockhash, lastValidBlockHeight } = await solanaConnection.getLatestBlockhash('confirmed');
        if (ixs.constructor !== Array) ixs = [ixs];

        console.log('---INSTRUCTION---');
        console.log(ixs);
        const txns = await batchTransactions(ixs, blockhash, lastValidBlockHeight);
        const signedTxns = await provider.signAllTransactions(txns);

        let txResults = [];
        for (const txn of signedTxns) {
            ({ txHash, confirmation} = await sendLudicrousTransaction(txn.serialize(), lastValidBlockHeight, solanaConnection));
            console.log('---CONFIRMATION---');
            console.log(confirmation);
            if ((confirmation.name == 'TransactionExpiredBlockheightExceededError' || confirmation.name == 'LudicrousTimoutError')) {
                console.log('-----RETRY-----');
                return txSignAndSend(ix);
            }

            const txResult = await solanaConnection.getTransaction(txHash, {commitment: 'confirmed', preflightCommitment: 'confirmed', maxSupportedTransactionVersion: 1});
            console.log('txResult: ', txResult);
            txResults.push(txResult);
        }
        return txResults;
    }

/**
 * The `execScan` triggers a scan for survey data units.
 * @param fleet - The `fleet` parameter represents the fleet object.
 * @param playerProfile - The `playerProfile` parameter represents the user's profile information. It
 * includes properties such as `index`, `pubkey`, and `faction`.
 * @returns the transaction result of the scan.
 */
    async function execScan(fleet, playerProfile) {
        const tx = { instruction: await sageProgram.methods.scanForSurveyDataUnits({keyIndex: new BrowserAnchor.anchor.BN(playerProfile.index)}).accountsStrict({
            gameAccountsFleetAndOwner: {
                gameFleetAndOwner: {
                    fleetAndOwner: {
                        fleet: fleet.publicKey,
                        owningProfile: playerProfile.pubkey,
                        owningProfileFaction: playerProfile.faction.publicKey,
                        key: provider.publicKey
                    },
                    gameId: sageGameAcct.publicKey
                },
                gameState: sageGameAcct.account.gameState
            },
            surveyDataUnitTracker: sageSDUTrackerAcct.publicKey,
            surveyDataUnitTrackerSigner: sageSDUTrackerAcct.account.signer,
            cargoHold: fleet.account.cargoHold,
            sduCargoType: sduCargoTypeAcct.publicKey,
            repairKitCargoType: repairKitCargoTypeAcct.publicKey,
            cargoStatsDefinition: sageGameAcct.account.cargo.statsDefinition,
            sduTokenFrom: await ResourceTokens.getPodToken({ name: 'sdu' }),
            sduTokenTo: ResourceTokens.sdu.publicKey,
            repairKitTokenFrom: await ResourceTokens.getPodToken({ name: 'toolkit', pod: fleet.account.cargoHold }),
            repairKitMint: sageGameAcct.account.mints.repairKit,
            cargoProgram: cargoProgramId,
            tokenProgram,
            recentSlothashes: RecentSlotHashes,
            instructionsSysvar: InstructionsSysVar
        }).instruction()}
        return await txSignAndSend(tx);
    }
    
/**
 * The `execSubwarp` function calculates the distance between two coordinates, checks if the fleet has
 * enough fuel to subwarp, and if it does then initiates a subwarp to the destination coordinates.
 * @param fleet - The `fleet` parameter represents a fleet of ships that will be used for the subwarp
 * operation. It contains information about the fleet, such as its origin and destination coordinates,
 * maximum warp distance, and fuel tank account.
 * @param origin - The `origin` parameter is optional, it is the origin point for the subwarp. 
 * Defaults to the origin in the fleet's config file. It is an array containing the X and Y coordinates.
 * @param destination - The `destination` parameter is optional, it is the destination point for the subwarp. 
 * Defaults to the destination in the fleet's config file. It is an array containing the X and Y coordinates.
 * @returns the duration for subwarp and the transaction result from Solana for entering subwarp.
 */
    async function execSubwarp(fleet, origin, destination) {
        const { subwarpSpeed } = fleet.account.stats.movementStats;
        const [destX, destY] = (destination || fleet.destination.coords).split(',').map(item => item.trim());
        const [originX, originY] = (origin || fleet.origin.coords).split(',').map(item => item.trim());

        const moveDistance = calculateMovementDistance([originX, originY], [destX, destY]);
        const duration = subwarpSpeed > 0 ? (moveDistance / subwarpSpeed / GLOBAL_SCALE_DECIMALS_6) : 0;
        const subwarpCost = calculateSubwarpFuelBurn(fleet, moveDistance);
    
        const fleetCurrentFuelTank = await solanaConnection.getParsedTokenAccountsByOwner(fleet.account.fuelTank, { programId: tokenProgram });
        let currentFuel = fleetCurrentFuelTank.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.fuel.toString());
        currentFuel = currentFuel.account.data.parsed.info.tokenAmount.uiAmount || 0;

        if (currentFuel < subwarpCost) {
            console.log(`[${fleet.label}] Unable to move, lack of fuel`);
            return fleet.state = 'ERROR: Not enough fuel';
        }

        const tx = { instruction: await sageProgram.methods.startSubwarp({
            keyIndex: new BrowserAnchor.anchor.BN(playerProfile.index), 
            toSector: [new BrowserAnchor.anchor.BN(destX), new BrowserAnchor.anchor.BN(destY)]
        }).accountsStrict({
            gameAccountsFleetAndOwner: {
                gameFleetAndOwner: {
                    fleetAndOwner: {
                        fleet: fleet.publicKey,
                        owningProfile: playerProfile.pubkey,
                        owningProfileFaction: playerProfile.faction.publicKey,
                        key: provider.publicKey
                    },
                    gameId: sageGameAcct.publicKey
                },
                gameState: sageGameAcct.account.gameState
            },
        }).instruction()}
        const txResult = await txSignAndSend(tx);
        return { duration, txResult };
    }

    /**
     * The function `execExitSubwarp` executes the command (submits transaction) to exit subwarp to Solana.
     * @param fleet - The `fleet` parameter is an object that represents a fleet.
     * @returns the transaction result from Solana for exiting subwarp.
     */
    async function execExitSubwarp(fleet) {
        const tx = { instruction: await sageProgram.methods.fleetStateHandler().accountsStrict({
            fleet: fleet.publicKey
        }).remainingAccounts([
            {
                pubkey: playerProfile.pubkey,
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: await ResourceTokens.getPodToken({ name: 'fuel', pod: fleet.account.fuelTank }),
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
                pubkey: ResourceTokens.fuel.publicKey,
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
        return await txSignAndSend(tx);
    }

/**
 * The `execWarp` function calculates the distance between two coordinates, checks if the fleet has
 * enough fuel to warp, and if it does then initiates a warp to the destination coordinates.
 * @param fleet - The fleet parameter represents a fleet of ships that will be used for the warp
 * operation. It contains information about the fleet, such as its origin and destination coordinates,
 * maximum warp distance, and fuel tank account.
 * @param origin - The `origin` parameter is optional, it is the origin point for the warp. 
 * Defaults to the origin in the fleet's config file. It is an array containing the X and Y coordinates.
 * @param destination - The `destination` parameter is optional, it is the destination point for the warp. 
 * Defaults to the destination in the fleet's config file. It is an array containing the X and Y coordinates.
 * @returns the duration for warp and the transaction result from Solana for entering warp.
 */
    async function execWarp(fleet, origin, destination) {
        const { warpSpeed, maxWarpDistance, warpCoolDown, subwarpSpeed } = fleet.account.stats.movementStats;
        const [destX, destY] = (destination  || fleet.destination.coords).split(',').map(item => item.trim());
        const [originX, originY] = (origin || fleet.origin.coords).split(',').map(item => item.trim());

        let moveDistance = calculateMovementDistance([originX, originY], [destX, destY]);
        let warpCount = 0;
        if (moveDistance > (maxWarpDistance / 100)) {
            warpCount = maxWarpDistance > 0 ? (moveDistance / maxWarpDistance / GLOBAL_SCALE_DECIMALS_2) : 1;
            const warpX = Math.trunc((destX - originX) / warpCount);            
            const warpY = Math.trunc((destY - originY) / warpCount);
            
            destX = originX + warpX;
            destY = originY + warpY;
            
            moveDistance = calculateMovementDistance([originX, originY], [destX,destY]);
        }

        const duration = warpSpeed > 0 ? (moveDistance / warpSpeed / GLOBAL_SCALE_DECIMALS_6) : 0;
        const warpCost = calculateWarpFuelBurn(fleet, moveDist);
  
        const fleetCurrentFuelTank = await solanaConnection.getParsedTokenAccountsByOwner(fleet.account.fuelTank, { programId: tokenProgram });
        let currentFuel = fleetCurrentFuelTank.value.find(item => item.account.data.parsed.info.mint === sageGameAcct.account.mints.fuel.toString());
        currentFuel = currentFuel.account.data.parsed.info.tokenAmount.uiAmount || 0;

        if (currentFuel < (warpCost * warpCount)) {
            console.log(`[${fleet.label}] Unable to move, lack of fuel`);
            return fleet.state = 'ERROR: Not enough fuel';
        }

        const tx = { instruction: await sageProgram.methods.warpToCoordinate({keyIndex: new BrowserAnchor.anchor.BN(playerProfile.index), toSector: [new BrowserAnchor.anchor.BN(destX), new BrowserAnchor.anchor.BN(destY)]}).accountsStrict({
            gameAccountsFleetAndOwner: {
                gameFleetAndOwner: {
                    fleetAndOwner: {
                        fleet: fleet.publicKey,
                        owningProfile: playerProfile.pubkey,
                        owningProfileFaction: playerProfile.faction.publicKey,
                        key: provider.publicKey
                    },
                    gameId: sageGameAcct.publicKey
                },
                gameState: sageGameAcct.account.gameState
            },
            fuelTank: fleet.account.fuelTank,
            cargoType: fuelCargoTypeAcct.publicKey,
            statsDefinition: sageGameAcct.account.cargo.statsDefinition,
            tokenFrom: await ResourceTokens.getPodToken({ name: 'fuel', pod: fleet.account.fuelTank }),
            tokenMint: sageGameAcct.account.mints.fuel,
            cargoProgram: cargoProgramId,
            tokenProgram
        }).instruction()}
        const txResult = await txSignAndSend(tx);
        return { duration, warpCount, txResult };
    }

/**
 * The function `execExitWarp` executes the command (submits transaction) to exit warp to Solana.
 * @param fleet - The `fleet` parameter is an object that represents a fleet.
 * @returns the transaction result from Solana for exiting warp.
 */
    async function execExitWarp(fleet) {
        const tx = { instruction: await sageProgram.methods.fleetStateHandler().accountsStrict({
            fleet: fleet.publicKey
        }).instruction()}
        return await txSignAndSend(tx);
    }

/**
 * The `execDock` function takes a fleet and coordinates as input, retrieves the starbase and starbase
 * player associated with the coordinates, and then executes a transaction to dock the fleet at the
 * starbase.  Should be called before {@link handleReturnTrip} function.
 * @param fleet - The `fleet` parameter is an object that represents a fleet.
 * @param coords - The `coords` parameter is an optional string representing the coordinates of a starbase. 
 * Defaults to `fleet.destination.coords`. It is in the format "x,y" where `x` and `y` are the x and y coordinates
 * respectively.
 * @returns the transaction result from Solana for docking.
 */
    async function execDock(fleet, coords) {
        const [starbaseX, starbaseY] = (coords || fleet.destination.coords).split(',').map(item => item.trim());
        const starbase = await getStarbaseFromCoords(starbaseX, starbaseY);
        const starbasePlayer = await getStarbasePlayer(playerProfile.pubkey, starbase.publicKey);
        const tx = { instruction: await sageProgram.methods.idleToLoadingBay(new BrowserAnchor.anchor.BN(playerProfile.index)).accountsStrict({
            gameAccountsFleetAndOwner: {
                gameFleetAndOwner: {
                    fleetAndOwner: {
                        fleet: fleet.publicKey,
                        owningProfile: playerProfile.pubkey,
                        owningProfileFaction: playerProfile.faction.publicKey,
                        key: provider.publicKey
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
        fleet.state = 'Docking';
        return await txSignAndSend(tx);
    }

/**
 * The `execUndock` function undocks a fleet from a starbase. Should be called after {@link handleReturnTrip}
 * function.
 * @param fleet - The `fleet` parameter is an object that represents a fleet.
 * @param coords - The `coords` parameter is an optional string representing the coordinates of a starbase.
 * Defaults to `fleet.origin.coords`. It is in the format "x,y" where `x` and `y` are the x and y coordinates 
 * respectively.
 * @returns the transaction result from Solana for undocking.
 */
    async function execUndock(fleet, coords) {
        const [starbaseX, starbaseY] = (coords || fleet.origin.coords).split(',').map(item => item.trim());
        const starbase = await getStarbaseFromCoords(starbaseX, starbaseY);
        const starbasePlayer = await getStarbasePlayer(playerProfile.pubkey, starbase.publicKey);
        const tx = { instruction: await sageProgram.methods.loadingBayToIdle(new BrowserAnchor.anchor.BN(playerProfile.index)).accountsStrict({
            gameAccountsFleetAndOwner: {
                gameFleetAndOwner: {
                    fleetAndOwner: {
                        fleet: fleet.publicKey,
                        owningProfile: playerProfile.pubkey,
                        owningProfileFaction: playerProfile.faction.publicKey,
                        key: provider.publicKey
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
        fleet.state = 'Undocking';
        return await txSignAndSend(tx);
    }   

    // @todo - documentation
    async function determineDefaultLocation(fleet, reverse) {
        let location = 'destination'; // default location
        let currentFleetState = await solanaConnection.getAccountInfo(fleet.publicKey);
        currentFleetState = sageProgram.coder.accounts.decode('Fleet', currentFleetState.data);
        const [_, extra] = getFleetState(currentFleetState);
                
        for (const [key, value] of Object.entries(fleet)) {
            if (value.coords && value.coords == `"${extra[0]},${extra[1]}"`){
                location = key;
                break;
            }
        }

        return reverse ? (location == 'destination' ? 'origin' : 'destination') : location; 
    } 

    // @todo - redo documentation
/**
 * The function `execCargoFromFleetToStarbase` transfers cargo from a fleet to a starbase.
 * @param fleet - The `fleet` parameter represents the fleet object that contains information about the
 * fleet, such as its account, destination coordinates, and cargo hold.
 * @param options - The `options` parameter is an object that contains the following properties:
 * `coords`, `resupply`, and `supplies`. `coords` is an optional parameter, defaults to `fleet.destination.coords`,
 * in the format "x,y" where `x` and `y` are the x and y coordinates respectively. `resupply` is an optional 
 * parameter, a boolean if set will default `supplies` to that on the `fleet` object. `supplies` is an optional 
 * parameter which is an object "{'fueL3hBZjLLLJHiFH9cqZoozTG3XQZ53diwFPwbzNim': amount}"
 * @returns the transaction result from Solana for transferring cargo from a fleet to a starbase.
 */
    async function execCargoFromFleetToStarbase(fleet, options) {
        let { coords, supplies, dump } = options;
        const location = await determineDefaultLocation(fleet); // needs to be opposite of current location

        supplies = supplies || fleet[location].supplies;
        const [starbaseX, starbaseY] = (coords || fleet[location].coords).split(',').map(item => item.trim());
        const starbase = await getStarbaseFromCoords(starbaseX, starbaseY);
        const starbasePlayer = await getStarbasePlayer(playerProfile.pubkey, starbase.publicKey);
        const starbasePlayerCargoHolds = await cargoProgram.account.cargoPod.all([
            {
                memcmp: {
                    offset: 41,
                    bytes: starbasePlayer.publicKey.toBase58(),
                },
            },
        ]);
        const starbasePlayerCargoHold = starbasePlayerCargoHolds.find(item => item.account.openTokenAccounts > 0);
        let resourcesToUnload = await solanaConnection.getParsedTokenAccountsByOwner(fleet.account.cargoHold, {programId: tokenProgram});
        if (supplies && !dump) resourcesToUnload.value = resourcesToUnload.value.filter(item => Object.keys(supplies).includes(item.account.mint.toString()));

        let ixs = [];
        for (let resource of resourcesInCargoHold.value) {
            const resourceString = resource.account.mint.toString()
            let amount = resource.account.data.parsed.info.tokenAmount.uiAmount || 0;
            if (!dump) amount = Math.min(supplies[resourceString] || 0, amount);
            if (amount > 0) {
                const resourceCargoType = cargoTypes.find(item => item.account.mint.toString() == resourceString);
                const ix = await sageProgram.methods.withdrawCargoFromFleet({
                    amount: new BrowserAnchor.anchor.BN(amount), 
                    keyIndex: new BrowserAnchor.anchor.BN(playerProfile.index)
                }).accountsStrict({
                    gameAccountsFleetAndOwner: {
                        gameFleetAndOwner: {
                            fleetAndOwner: {
                                fleet: fleet.publicKey,
                                owningProfile: playerProfile.account,
                                owningProfileFaction: playerProfile.faction.publicKey,
                                key: provider.publicKey
                            },
                            gameId: sageGameAcct.publicKey
                        },
                        gameState: sageGameAcct.account.gameState
                    },
                    starbaseAndStarbasePlayer: {
                        starbase: starbase.publicKey,
                        starbasePlayer: starbasePlayer.publicKey
                    },
                    cargoPodFrom: fleet.account.cargoHold,
                    cargoPodTo: starbasePlayerCargoHold.publicKey,
                    cargoType: resourceCargoType.publicKey,
                    cargoStatsDefinition: sageGameAcct.account.cargo.statsDefinition,
                    tokenFrom: fleet.account.cargoHold,
                    tokenTo: await ResourceTokens.getPodToken({ publicKey: resource.publicKey, pod: starbasePlayerCargoHold.publicKey }),
                    tokenMint: resourceString,
                    fundsTo: provider.publicKey,
                    cargoProgram: cargoProgramId,
                    tokenProgram
                }).remainingAccounts([{
                    pubkey: starbase.publicKey,
                    isSigner: false,
                    isWritable: false
                }]).instruction()
                ixs.push({ instruction: ix })
            }
        }
        fleet.state = 'Unloading';
        if (ixs.length > 0) await txSignAndSend(ixs);
        fleet.state = 'Docked';
    }

    // @todo - redo documentation
/**
 * The function `execCargoFromStarbaseToFleet` transfers cargo from a starbase to a fleet in a game,
 * based on the provided options.
 * @param fleet - The `fleet` parameter represents the fleet object that contains information about the
 * fleet, such as its account, destination coordinates, and cargo hold.
 * @param options - The `options` parameter is an object that contains the following properties:
 * `coords`, `resupply`, and `supplies`. `coords` is an optional parameter, defaults to `fleet.destination.coords`,
 * in the format "x,y" where `x` and `y` are the x and y coordinates respectively. `resupply` is an optional 
 * parameter, a boolean if set will default `supplies` to that on the `fleet` object. `supplies` is an optional 
 * parameter which is an object "{'fueL3hBZjLLLJHiFH9cqZoozTG3XQZ53diwFPwbzNim': amount}"
 * @returns the transaction result(s) from Solana for transferring cargo from a starbase to a fleet.
 */
    async function execCargoFromStarbaseToFleet(fleet, options) {
        let { coords, supplies } = options;
        const location = await determineDefaultLocation(fleet, true);

        supplies = supplies || fleet[location].supplies;
        const [starbaseX, starbaseY] = (coords || fleet[location].coords).split(',').map(item => item.trim());
        const starbase = await getStarbaseFromCoords(starbaseX, starbaseY);
        const starbasePlayer = await getStarbasePlayer(playerProfile.pubkey, starbase.publicKey);
        const starbasePlayerCargoHolds = await cargoProgram.account.cargoPod.all([
            {
                memcmp: {
                    offset: 41,
                    bytes: starbasePlayer.publicKey.toBase58(),
                },
            },
        ]);

        const starbasePlayerCargoHold = starbasePlayerCargoHolds.find(item => item.account.openTokenAccounts > 0);
        let resourcesToLoad = await solanaConnection.getParsedTokenAccountsByOwner(starbasePlayerCargoHold.publicKey, {programId: tokenProgram});
        if (supplies) resourcesToLoad.value = resourcesToLoad.value.filter(item => Object.keys(supplies).includes(item.account.mint.toString()));

        let ixs = [];
        for (let resource of resourcesInCargoHold.value) {
            const resourceString = resource.account.mint.toString()
            const amount = Math.min(supplies[resourceString] || 0, resource.account.data.parsed.info.tokenAmount.uiAmount || 0);
            if (amount > 0) {
                const resourceCargoType = cargoTypes.find(item => item.account.mint.toString() == resourceString);
                const ix = { instruction: await sageProgram.methods.depositCargoToFleet({ 
                    amount: new BrowserAnchor.anchor.BN(amount), 
                    keyIndex: new BrowserAnchor.anchor.BN(playerProfile.index) 
                }).accountsStrict({
                    gameAccountsFleetAndOwner: {
                        gameFleetAndOwner: {
                            fleetAndOwner: {
                                fleet: fleet.publicKey,
                                owningProfile: playerProfile.pubkey,
                                owningProfileFaction: playerProfile.faction.publicKey,
                                key: provider.publicKey
                            },
                            gameId: sageGameAcct.publicKey
                        },
                        gameState: sageGameAcct.account.gameState
                    },
                    fundsTo: provider.publicKey,
                    starbaseAndStarbasePlayer: {
                        starbase: starbase.publicKey,
                        starbasePlayer: starbasePlayer.publicKey
                    },
                    cargoPodFrom: starbasePlayerCargoHold.publicKey,
                    cargoPodTo: fleet.account.cargoHold,
                    cargoType: resourceCargoType.publicKey,
                    cargoStatsDefinition: sageGameAcct.account.cargo.statsDefinition,
                    tokenFrom: await ResourceTokens.getPodToken({ publicKey: resource.publicKey, pod: starbasePlayerCargoHold.publicKey }),
                    tokenTo: await ResourceTokens.getPodToken({ publicKey: resource.publicKey, pod: fleet.account.cargoHold }),
                    tokenMint: resourceString,
                    cargoProgram: cargoProgramId,
                    tokenProgram
                }).remainingAccounts([{
                    pubkey: starbase.publicKey,
                    isSigner: false,
                    isWritable: false
                }]).instruction()}
                ixs.push({ instruction: ix })
            }
        }
        fleet.state = 'Loading';
        if (ixs.length > 0) await txSignAndSend(ixs);
        fleet.state = 'Docked';
    }
    
/**
 * The `getMiningDetails` function retrieves mining details based on the mine resource and coordinates
 * provided.
 * @param mineResource - The `mineResource` parameter is the public key that represents the resource you
 * want to mine.
 * @param coords - The `coords` parameter is the coordinates of a location. It is used to retrieve the
 * planets associated with those coordinates.
 * @returns The `getMiningDetails` function returns an object with three properties: `mineItem`,
 * `planet`, and `sageResource`.
 */
    async function getMiningDetails(mineResource, coords) {
        const planets = await getPlanetsFromCoords(coords);
        const [mineItem] = await sageProgram.account.mineItem.all([
            {
                memcmp: {
                    offset: 105,
                    bytes: mineResource,
                },
            },
        ]);

        let planet, sageResource;
        for (let planetCheck of planets) {
            const resourceCheck = await sageProgram.account.resource.all([
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
            if (resourceCheck.length > 0) {
                [sageResource] = resourceCheck;
                planet = planetCheck
                break;
            }
        }
        return { mineItem, planet, sageResource };
    }


    /**
     * The `execStartMining` function starts the mining process for a fleet.
     * @param fleet - The `fleet` parameter represents the fleet object, which contains information
     * about the fleet such as its account, destination coordinates, and mining stats.
     * @param options - The `options` is an object that contains the following optional parameters:
     * - `coords` in the format "x,y" where `x` and `y` are the x and y coordinates respectively.
     * Defaults to `fleet.destination.coords`.
     * - `mineResource` is the name of the resource you want to mine.
     * Defaults to `fleet.mineResource`.
     * - `amount` is the amount you want to mine. If `amount` > `maxCargoCapacity`, `maxCargoCapacity`
     * is used. Defaults to the `maxCargoCapacity`. 
     * @returns an object containing `duration` and the transaction result from Solana.
     */
    async function execStartMining(fleet, options) {
        let { coords, mineResource, amount } = options;
        mineResource = ResourceTokens[mineResource || fleet.mineResource];

        const [starbaseX, starbaseY] = (coords || fleet.destination.coords).split(',').map(item => item.trim());
        const starbase = await getStarbaseFromCoords(starbaseX, starbaseY);
        const starbasePlayer = await getStarbasePlayer(playerProfile.pubkey, starbase.publicKey);

        const { mineItem, planet, sageResource } = await getMiningDetails(mineResource.publicKey, [starbaseX, starbaseY]);
        const resourceHardness = mineItem.account.resourceHardness;
        const { systemRichness } = sageResource.account;

        const { cargoCapacity, miningRate } = fleet.account.stats.cargoStats;
        const currentCargo = await solanaConnection.getParsedTokenAccountsByOwner(fleet.account.cargoHold, {programId: tokenProgram});
        const currentCargoCount = currentCargo.value.reduce((n, {account}) => n + account.data.parsed.info.tokenAmount.uiAmount || 0, 0);
        const maxCargoCapacity = cargoCapacity - currentCargoCount;
        let mineAmount = amount || maxCargoCapacity;
        if (mineAmount > maxCargoCapacity) {
            mineAmount = maxCargoCapacity;
            console.log(`Can't mine ${mineAmount} adjusted to ${maxCargoCapacity}, rock and STONE!`)
        }
        fleet.destination.supplies[mineResource.publicKey.toString()] = mineAmount;
        const duration = calculateMiningDuration(mineAmount, miningRate, resourceHardness, systemRichness);

        const ix = { instruction: await sageProgram.methods.startMiningAsteroid({
            keyIndex: new BrowserAnchor.anchor.BN(playerProfile.index)
        }).accountsStrict({
            gameAccountsFleetAndOwner: {
                gameFleetAndOwner: {
                    fleetAndOwner: {
                        fleet: fleet.publicKey,
                        owningProfile: playerProfile.pubkey,
                        owningProfileFaction: playerProfile.faction.publicKey,
                        key: provider.publicKey
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
        fleet.state = 'Mining';
        const txResult = await txSignAndSend(ix);
        return { duration, txResult };
    }

/**
 * The `execStopMining` function stops a fleet from mining a resource.
 * @param fleet - The `fleet` parameter represents the fleet object, which contains information about
 * the fleet such as its public key, account details, and cargo hold.
 * @param options - The `options` is an object that contains the following optional parameters:
 * - `coords` in the format "x,y" where `x` and `y` are the x and y coordinates respectively.
 * Defaults to `fleet.destination.coords`.
 * - `mineResource` is the name of the resource you want to mine.
 * Defaults to `fleet.mineResource`.
 * @returns the transaction result from Solana for stopping mining.
 */
    async function execStopMining(fleet, options) {
        let { coords, mineResource } = options;
        mineResource = ResourceTokens[mineResource || fleet.mineResource];

        const [starbaseX, starbaseY] = (coords || fleet.destination.coords).split(',').map(item => item.trim());
        const starbase = await getStarbaseFromCoords(starbaseX, starbaseY);
        const { mineItem, planet, sageResource } = await getMiningDetails(mineResource.publicKey, [starbaseX, starbaseY]);

        const foodCargoTypeAcct = cargoTypes.find(item => item.account.mint.toString() == sageGameAcct.account.mints.food);
        const ammoCargoTypeAcct = cargoTypes.find(item => item.account.mint.toString() == sageGameAcct.account.mints.ammo);
        const resourceCargoTypeAcct = cargoTypes.find(item => item.account.mint.toString() == resourceToken.toString());

        const tx1 = { instruction: await sageProgram.methods.fleetStateHandler().accountsStrict({
            fleet: fleet.publicKey
        }).remainingAccounts([
            {
                pubkey: playerProfile.faction.publicKey,
                isSigner: false,
                isWritable: false
            },
            {
                pubkey: fleet.account.cargoHold,
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: fleet.account.ammoBank,
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: mineItem.publicKey,
                isSigner: false,
                isWritable: false
            },
            {
                pubkey: sageResource.publicKey,
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: planet.publicKey,
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: starbase.publicKey,
                isSigner: false,
                isWritable: false
            },
            {
                pubkey: await ResourceTokens.getPodToken({ name: 'food', pod: fleet.account.cargoHold }),
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: await ResourceTokens.getPodToken({ name: 'ammo', pod: fleet.account.ammoBank }),
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: await ResourceTokens.getPodToken({ publicKey: mineResource.publicKey, pod: mineItem.publicKey }),
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: await ResourceTokens.getPodToken({ publicKey: mineResource.publicKey, pod: fleet.account.cargoHold }),
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

        const tx2 = { instruction: await sageProgram.methods.stopMiningAsteroid({
            keyIndex: new BrowserAnchor.anchor.BN(playerProfile.index)
        }).accountsStrict({
            gameAccountsFleetAndOwner: {
                gameFleetAndOwner: {
                    fleetAndOwner: {
                        fleet: fleet.publicKey,
                        owningProfile: playerProfile.pubkey,
                        owningProfileFaction: playerProfile.faction.publicKey,
                        key: provider.publicKey
                    },
                    gameId: sageGameAcct.publicKey
                },
                gameState: sageGameAcct.account.gameState
            },
            resource: sageResource.publicKey,
            planet: planet.publicKey,
            fuelTank : fleet.account.fuelTank,
            cargoType: fuelCargoTypeAcct.publicKey,
            cargoStatsDefinition: sageGameAcct.account.cargo.statsDefinition,
            tokenFrom: await ResourceTokens.getPodToken({ name: 'fuel', pod: fleet.account.fuelTank }),
            tokenMint: sageGameAcct.account.mints.fuel,
            cargoProgram: cargoProgramId,
            tokenProgram
        }).instruction()}
        fleet.state = 'Mining stopped';
        return await txSignAndSend([tx1,tx2]);
    }

    // @todo - documentation
    async function handleResupply(fleet, dump = false) {
        await execDock(fleet);
        await execCargoFromFleetToStarbase(fleet, { dump });
        await execCargoFromStarbaseToFleet(fleet);
        await execUndock(fleet);

        const fleetSavedData = JSON.parse(await GM.getValue(fleet.publicKey.toString(), '{}'));
        return { ...fleet, ...fleetSavedData };
    }

    // @todo - documentation
    async function prepareForTrip(fleet) {
        const location = await determineDefaultLocation(fleet, true);
        const { supplies } = fleet[location];

        const starbasePlayerCargoHold = starbasePlayerCargoHolds.find(item => item.account.openTokenAccounts > 0);
        let resourcesToLoad = await solanaConnection.getParsedTokenAccountsByOwner(starbasePlayerCargoHold.publicKey, {programId: tokenProgram});
        let resupplyNeeded = false;

        if (supplies) {
            resourcesToLoad.value = resourcesToLoad.value.filter(item => Object.keys(supplies).includes(item.account.mint.toString()));

            for (let resource of resourcesToLoad.value) {
                const resourceString = resource.account.mint.toString()
                const amount = resource.account.data.parsed.info.tokenAmount.uiAmount || 0;
                resupplyNeeded = supplies[resourceString] != amount
            }
        }

        if (resupplyNeeded || !supplies) {
            await handleMovement(fleet, { coords: fleet.origin.coords });
            await handleResupply(fleet, true);
        }
        
        const fleetSavedData = JSON.parse(await GM.getValue(fleet.publicKey.toString(), '{}'));
        return { ...fleet, ...fleetSavedData };
    }

/**
 * The `handleMovement` function handles the movement of a fleet, checking its current state
 * and executing the appropriate actions based on that state.
 * @param fleet - The `fleet` parameter is an object that represents a fleet.
 * @returns The function does not explicitly return anything.
 */
    async function handleMovement(fleet, options) {
        const { coords } = options;
        const [destX, destY] = (coords || fleet.destination.coords).split(',').map(item => item.trim());
    
        let currentFleetState = await solanaConnection.getAccountInfo(fleet.publicKey);
        currentFleetState = sageProgram.coder.accounts.decode('Fleet', currentFleetState.data);
        const warpCooldownExpiresAt = (fleetAcctData.warpCooldownExpiresAt.toNumber() || 0) * 1000;
        const [fleetState, extra] = getFleetState(currentFleetState);

        switch (fleetState) {
            case 'Idle':
                if (extra[0] !== destX || extra[1] !== destY) {
                    const currentLocation = [extra[0], extra[1]];

                    if (fleet.moveType == 'warp') {
                        if (warpCooldownExpiresAt > 0) {
                            await execSubwarp(fleet, currentLocation);
                        } else {
                            await execWarp(fleet, currentLocation);
                        }
                    } else {
                        await execSubwarp(fleet, currentLocation);
                    }
                } else {
                    fleet.state = "Arrived";
                    return;
                }
                break;
            case 'MoveWarp':
                const warpArrival = extra.warpFinish.toNumber() * 1000;
                if (warpArrival > Date.now()) fleet.state = 'Move [' + new Date(warpArrival).toLocaleTimeString() + ']';
                await wait(warpArrival);
                await execExitWarp(fleet);
                break;
            case 'MoveSubwarp':
                const subwarpArrival = fleet.moveType == 'warp' ? warpCooldownExpiresAt : extra.arrivalTime.toNumber() * 1000;
                if (subwarpArrival > Date.now()) fleet.state = 'Move [' + new Date(subwarpArrival).toLocaleTimeString() + ']';
                await wait(subwarpArrival);
                await execExitSubwarp(fleet);
                break;
            default:
                console.log('I only handle movement, bro');
        }

        const fleetSavedData = JSON.parse(await GM.getValue(fleet.publicKey.toString(), '{}'));
        return handleMovement({ ...fleet, ...fleetSavedData }, options);
    }


/**
 * The function `handleReturnTrip` handles the return trip of a fleet by flipping the origin and
 * destination coordinates and updating the fleet's saved data.
 * @param fleet - The `fleet` parameter is an object that represents a fleet.
 */
    async function handleReturnTrip(fleet) {
        // shallow copy to mutate and flip origin and destination
        const { origin, destination } = JSON.parse(JSON.stringify(fleet));
        const [destX, destY] = destination;

        const fleetAccountInfo = await solanaConnection.getAccountInfo(fleet.publicKey);
        const [fleetState, extra] = getFleetState(fleetAccountInfo);

        if (fleetState == 'Idle' && (extra[0] === destX || extra[1] === destY)) {
            const fleetPK = fleet.publicKey.toString();
            let fleetSavedData = await GM.getValue(fleetPK, '{}');
            let fleetParsedData = JSON.parse(fleetSavedData);

            fleet.origin.coords = destination.coords;
            fleet.destination.coords = origin.coords;

            fleetParsedData.origin.coords = fleet.origin.coords;
            fleetParsedData.destination.coords = fleet.destination.coords;

            await GM.setValue(fleetPK, JSON.stringify(fleetParsedData));
            await handleMovement(fleet);
        }

        const fleetSavedData = JSON.parse(await GM.getValue(fleet.publicKey.toString(), '{}'));
        return { ...fleet, ...fleetSavedData };
    }

/**
 * The `handleScan` function is responsible for scanning and determining the next action based on the scan 
 * results and fleet conditions.
 * @param fleet - The `fleet` parameter represents an object that contains information about a fleet.
 * @param options - The `options` is an object that contains the following optional parameters:
 * - `cargoHoldBuffer` the amount of space remaining in cargoHold before returning to origin.
 * Defaults to 100 units.
 * - `scanDelay` amount of time in seconds after 4 strikes we delay before scanning again.
 * Defaults to 600 seconds.
 * - `scanSectorAge` the amount of time in seconds that a sector requires to regenerate.
 * Defaults to 120 seconds.
 * @returns The function does not explicitly return anything.
 */
    async function handleScan(fleet, options) {
        await prepareForTrip(fleet);
        await handleMovement(fleet);

        const { cargoHoldBuffer, scanDelay, scanSectorAge } = options;
        let currentFleetState = await solanaConnection.getAccountInfo(fleet.publicKey);
        currentFleetState = sageProgram.coder.accounts.decode('Fleet', currentFleetState.data);
        const { cargoStats, miscStats } = currentFleetState.stats;
        const { scanRepairKitAmount, scanCooldown } = miscStats;

        const currentCargo = await solanaConnection.getParsedTokenAccountsByOwner(fleet.account.cargoHold, {programId: tokenProgram});
        const currentCargoCount = currentCargo.value.reduce((n, {account}) => n + account.data.parsed.info.tokenAmount.uiAmount || 0, 0);
        const repairKitToken = await ResourceTokens.getPodToken({ name: 'toolkit', pod: fleet.account.cargoHold });

        const currentToolkit = fleetCurrentCargo.value.find(item => item.pubkey.toString() === repairKitToken.toString());
        const currentToolkitCount = currentToolkit.account.data.parsed.info.delegatedAmount.uiAmount || 0;
        
        if ((cargoStats.cargoCapacity - currentCargoCount) < (cargoHoldBuffer || 100)) {
            await handleReturnTrip(fleet);
            return;
        }

        if (currentToolkitCount < scanRepairKitAmount) {
            await handleReturnTrip(fleet);
            return;
        }

        if (Date.now() > fleet.scanEnd) {
            const scanResult = await execScan(fleet);
            console.log('Scan Result: ', scanResult);

            const changesSDU = getBalanceChange(scanResult, ResourceTokens.sdu.publicKey.toString());
            const changesTool = getBalanceChange(scanResult, ResourceTokens.toolkit.publicKey.toString());
            let scanCondition = scanResult.meta.logMessages ? scanResult.meta.logMessages.find(item => item.startsWith("Program log: SDU probability:")) : null;
            scanCondition = scanCondition ? (Number(scanCondition.split(' ').pop())*100).toFixed(4) : 0;
            
            console.log(`[${fleet.label}] ${new Date(Date.now()).toISOString()}`);
            console.log(`[${fleet.label}] ${scanCondition}`);
            
            if (changesSDU.postBalance != changesSDU.preBalance) {
                console.log(`[${fleet.label}] FOUND: ${changesSDU.postBalance - changesSDU.preBalance}`);
                fleet.scanSkipCnt = 0;
                fleet.scanSectorStart = 0;
            } else {
                console.log(`[${fleet.label}] Whomp whomp`);
            }
            
            if (scanCondition < fleet.scanMin) {
                if (fleet.scanSectorStart == 0) fleet.scanSectorStart = Date.now();
                if (Date.now() - fleet.scanSectorStart >= (scanSectorAge || 120) * 1000) {
                    ++fleet.scanSkipCnt;
                    if (scanMove) {
                        const nextMoveIdx = fleet.scanBlockIdx > 2 ? 0 : ++fleet.scanBlockIdx;
                        fleet.scanBlockIdx = nextMoveIdx;
                    }
                }
            }
            
            console.log(`[${fleet.label}] Tools Remaining: ${changesTool.postBalance}`);
            
            if (fleet.scanSkipCnt < 4) {
                fleet.state = `Scanning [${scanCondition}%]`;
                fleet.scanEnd = Date.now() + (scanCooldown * 1000);
            } else {
                fleet.scanEnd = Date.now() + (scanDelay || 600) * 1000;
                fleet.state = `Scanning Paused [${new Date(fleet.scanEnd).toLocaleTimeString()}]`;
                fleet.scanSkipCnt = 0;
                console.log(`[${fleet.label}] Scanning Paused due to low probability [${new Date(fleet.scanEnd).toLocaleTimeString()}]`);
            }
        }
        const fleetSavedData = JSON.parse(await GM.getValue(fleet.publicKey.toString(), '{}'));
        return { ...fleet, ...fleetSavedData };
    }

    async function handleMining(fleet) {
        await prepareForTrip(fleet);
        await handleMovement(fleet);

        const { duration: miningDuration } = await execStartMining(fleet);
        const { foodConsumptionRate, ammoConsumptionRate } = fleet.account.stats.cargoStats;

        const currentAmmoBank = await solanaConnection.getParsedTokenAccountsByOwner(fleet.account.ammoBank, {programId: tokenProgram});
        const currentAmmoCount = currentAmmoBank.value.reduce((n, {account}) => n + account.data.parsed.info.tokenAmount.uiAmount || 0, 0);
        const maxAmmoDuration = Math.floor(currentAmmoCount / ammoConsumptionRate)

        const currentFood = await solanaConnection.getParsedTokenAccountsByOwner(fleet.account.cargoHold, {programId: tokenProgram});
        currentFood.value = currentFood.value.filter(item => item.account.mint.toString() == ResourceTokens.food.publicKey.toString());
        const currentFoodCount = currentFood.value.reduce((n, {account}) => n + account.data.parsed.info.tokenAmount.uiAmount || 0, 0);
        const maxFoodDuration = Math.floor(currentFoodCount / foodConsumptionRate);

        const duration = Math.min(maxFoodDuration, maxAmmoDuration, miningDuration);
        fleet.state = 'Mine [' + new Date(Date.now() + (duration * 1000)).toLocaleTimeString() + ']';
        await wait(duration);
        await execStopMining(fleet);

        await handleReturnTrip(fleet);
        const fleetSavedData = JSON.parse(await GM.getValue(fleet.publicKey.toString(), '{}'));
        return { ...fleet, ...fleetSavedData };
    }

    async function handleTransport(fleet) {
        await prepareForTrip(fleet);
        await handleMovement(fleet);
        await handleResupply(fleet);
        await handleReturnTrip(fleet);
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
        fleetCargoCapacity.innerHTML = fleet.account.stats.cargoStats.cargoCapacity;
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
            let warpCost = calculateWarpFuelBurn(userFleets[userFleetIndex], moveDist);

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

    function TaskQueue(concurrentCount = 1) {
        this.tasks = [];
        this.total = this.tasks.length;
        this.running = [];
        this.complete = [];
        this.count = concurrentCount;
    }

    TaskQueue.prototype.runNext = function(){
        return ((this.running.length < this.count) && this.task.length);
    }

    TaskQueue.prototype.add = function(task){
        this.tasks.push(task);
    }

    // @todo - cancel task
    // @todo - should there be a timeout for each task?

    TaskQueue.prototype.run = function () {
        while (this.runNext()) {
          const promise = this.tasks.shift();
          promise.then((fleet) => {
            switch(fleet.assignment) {
                case 'Mine':
                    this.add(handleMining(fleet));
                    break;
                case 'Transport':
                    this.add(handleTransport(fleet));
                    break;
                case 'Scan':
                    this.add(handleScan(fleet));
                    break;
                default:
                    console.log(`${ assignment } is unsupported`);
            }
            this.run();
          });
          this.running.push({fleet: fleet.account.publicKey, promise });
        }  
    }

    async function startAssistant() {
        if (enableAssistant) {
            const fleetQueue = new TaskQueue(userFleets.length);
            for (let fleet of userFleets) {
                switch(fleet.assignment) {
                    case 'Mine':
                        fleetQueue.add(handleMining(fleet));
                        break;
                    case 'Transport':
                        fleetQueue.add(handleTransport(fleet));
                        break;
                    case 'Scan':
                        fleetQueue.add(handleScan(fleet));
                        break;
                    default:
                        console.log(`${ assignment } is unsupported`);
                }
            }
        }
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
                let fleetAccountInfo = await solanaConnection.getAccountInfo(userFleets[i].publicKey);
                let [fleetState, extra] = getFleetState(fleetAccountInfo);
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
            assistCheckFleetBtn.addEventListener('click', function(e) {getFleetCountAtCoords();});
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
})();