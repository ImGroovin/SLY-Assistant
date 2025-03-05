// ==UserScript==
// @name         [FLY] Freelance System: Core
// @namespace    http://tampermonkey.net/
// @version      0.5.4
// @description  try to take over the world!
// @author       SLY
// @match        https://based.staratlas.com/
// @require      https://unpkg.com/@solana/web3.js@1.95.8/lib/index.iife.min.js#sha256=a759deca1b65df140e8dda5ad8645c19579536bf822e5c0c7e4adb7793a5bd08
// @require      https://raw.githubusercontent.com/ImGroovin/SAGE-Lab-Assistant/main/anchor-browserified.js#sha256=f29ef75915bcf59221279f809eefc55074dbebf94cf16c968e783558e7ae3f0a
// @require      https://raw.githubusercontent.com/ImGroovin/SAGE-Lab-Assistant/main/buffer-browserified.js#sha256=4fa88e735f9f1fdbff85f4f92520e8874f2fec4e882b15633fad28a200693392
// @require      https://raw.githubusercontent.com/ImGroovin/SAGE-Lab-Assistant/main/bs58-browserified.js#sha256=87095371ec192e5a0e50c6576f327eb02532a7c29f1ed86700a2f8fb5018d947
// @icon         https://www.google.com/s2/favicons?sz=64&domain=staratlas.com
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
// ==/UserScript==

(async function() {
    'use strict';

    const solanaConnection = new solanaWeb3.Connection('https://rpc.ironforge.network/mainnet?apiKey=01JEEEQP3FTZJFCP5RCCKB2NSQ', 'confirmed');
    const anchorProvider = new BrowserAnchor.anchor.AnchorProvider(solanaConnection, null, null);

    const sageProgramId = new solanaWeb3.PublicKey('SAGE2HAwep459SNq61LHvjxPk4pLPEJLoMETef7f7EE');
    const pointsProgramId = new solanaWeb3.PublicKey('Point2iBvz7j5TMVef8nEgpmz4pDr7tU7v3RjAfkQbM');
    const pointsStoreProgramId = new solanaWeb3.PublicKey('PsToRxhEPScGt1Bxpm7zNDRzaMk31t8Aox7fyewoVse');
    const profileIDL = {version: "0.7.3",name: "player_profile",instructions: [{name: "acceptRoleInvitation",accounts: [{name: "newMember",isMut: !1,isSigner: !1,docs: ["The new member"]}, {name: "roleAccount",isMut: !0,isSigner: !1,docs: ["The role which the player is joining"]}, {name: "roleMembershipAccount",isMut: !0,isSigner: !1,docs: ["The role membership account for the new member"]}],args: [{name: "keyIndex",type: "u16"}, {name: "keyIndexInRoleAccount",type: "u16"}, {name: "keyIndexInMembershipAccount",type: "u16"}]}, {name: "addExistingMemberToRole",accounts: [{name: "funder",isMut: !0,isSigner: !0,docs: ["The funder for reallocation."]}, {name: "newMember",isMut: !1,isSigner: !1,docs: ["The profile of the member to be added to the role"]}, {name: "profile",isMut: !1,isSigner: !1,docs: ["The profile which the role belongs to."]}, {name: "roleMembershipAccount",isMut: !0,isSigner: !1,docs: ["The role membership account for the new member"]}, {name: "roleAccount",isMut: !0,isSigner: !1,docs: ["The role which the player is joining"]}, {name: "systemProgram",isMut: !1,isSigner: !1,docs: ["The system program"]}],args: [{name: "keyIndex",type: "u16"}, {name: "keyIndexInMembershipAccount",type: "u16"}]}, {name: "addKeys",accounts: [{name: "funder",isMut: !0,isSigner: !0,docs: ["The funder for the profile."]}, {name: "key",isMut: !1,isSigner: !0,docs: ["Key with [`ProfilePermissions::ADD_KEYS`] permission to add keys."]}, {name: "profile",isMut: !0,isSigner: !1,docs: ["The profile to add to"]}, {name: "systemProgram",isMut: !1,isSigner: !1,docs: ["The system program"]}],args: [{name: "keyAddIndex",type: "u16"}, {name: "keyPermissionsIndex",type: "u16"}, {name: "keysToAdd",type: {vec: {defined: "AddKeyInput"}}}]}, {name: "adjustAuth",accounts: [{name: "funder",isMut: !0,isSigner: !0,docs: ["The funder for the profile."]}, {name: "profile",isMut: !0,isSigner: !1,docs: ["The profile to create"]}, {name: "systemProgram",isMut: !1,isSigner: !1,docs: ["The system program"]}],args: [{name: "authIndexes",type: {vec: "u16"}}, {name: "newKeyPermissions",type: {vec: {defined: "AddKeyInput"}}}, {name: "removeRange",type: {array: ["u16", 2]}}, {name: "newKeyThreshold",type: "u8"}]}, {name: "createProfile",accounts: [{name: "funder",isMut: !0,isSigner: !0,docs: ["The funder for the new profile."]}, {name: "profile",isMut: !0,isSigner: !0,docs: ["The profile to create"]}, {name: "systemProgram",isMut: !1,isSigner: !1,docs: ["The system program"]}],args: [{name: "keyPermissions",type: {vec: {defined: "AddKeyInput"}}}, {name: "keyThreshold",type: "u8"}]}, {name: "createRole",accounts: [{name: "funder",isMut: !0,isSigner: !0,docs: ["The funder for the transaction"]}, {name: "profile",isMut: !0,isSigner: !1,docs: ["The [`Profile`] account that the role is being created for"]}, {name: "newRoleAccount",isMut: !0,isSigner: !1,docs: ["The role account being created"]}, {name: "systemProgram",isMut: !1,isSigner: !1,docs: ["The system program"]}],args: [{name: "keyIndex",type: "u16"}]}, {name: "inviteMemberToRole",accounts: [{name: "funder",isMut: !0,isSigner: !0,docs: ["The funder for the new profile."]}, {name: "newMember",isMut: !1,isSigner: !1,docs: ["The profile of the user to be added to the role"]}, {name: "profile",isMut: !1,isSigner: !1,docs: ["The profile which the role belongs to."]}, {name: "roleMembershipAccount",isMut: !0,isSigner: !1,docs: ["The role membership account for the new member"]}, {name: "roleAccount",isMut: !0,isSigner: !1,docs: ["The role which the player is joining"]}, {name: "systemProgram",isMut: !1,isSigner: !1,docs: ["The system program"]}],args: [{name: "keyIndex",type: "u16"}]}, {name: "joinRole",accounts: [{name: "funder",isMut: !0,isSigner: !0,docs: ["The funder for the new profile."]}, {name: "newMember",isMut: !1,isSigner: !1,docs: ["The new member joining the role"]}, {name: "roleMembershipAccount",isMut: !0,isSigner: !1,docs: ["The role membership account for the new member"]}, {name: "roleAccount",isMut: !0,isSigner: !1,docs: ["The role which the player is joining"]}, {name: "systemProgram",isMut: !1,isSigner: !1,docs: ["The system program"]}],args: [{name: "keyIndex",type: "u16"}]}, {name: "leaveRole",accounts: [{name: "funder",isMut: !0,isSigner: !1,docs: ["The funder to receive the rent allocation."]}, {name: "member",isMut: !1,isSigner: !1,docs: ["The member leaving the role"]}, {name: "roleMembershipAccount",isMut: !0,isSigner: !1,docs: ["The role membership account for the member"]}, {name: "roleAccount",isMut: !0,isSigner: !1,docs: ["The role which the player is leaving"]}, {name: "systemProgram",isMut: !1,isSigner: !1,docs: ["The system program"]}],args: [{name: "keyIndex",type: "u16"}, {name: "keyIndexInRoleAccount",type: "u16"}, {name: "keyIndexInMembershipAccount",type: "u16"}]}, {name: "removeKeys",accounts: [{name: "funder",isMut: !0,isSigner: !1,docs: ["The funder for the profile."]}, {name: "key",isMut: !1,isSigner: !0,docs: ["Key with [`ProfilePermissions::REMOVE_KEYS`] permission to add keys."]}, {name: "profile",isMut: !0,isSigner: !1,docs: ["The profile to remove from"]}, {name: "systemProgram",isMut: !1,isSigner: !1,docs: ["The system program"]}],args: [{name: "keyIndex",type: "u16"}, {name: "keysToRemove",type: {array: ["u16", 2]}}]}, {name: "removeMemberFromRole",accounts: [{name: "funder",isMut: !0,isSigner: !1,docs: ["The funder to receive the rent allocation"]}, {name: "member",isMut: !1,isSigner: !1,docs: ["The profile of the user to be added to the role"]}, {name: "profile",isMut: !1,isSigner: !1,docs: ["The profile which the role belongs to."]}, {name: "roleMembershipAccount",isMut: !0,isSigner: !1,docs: ["The role membership account for the member"]}, {name: "roleAccount",isMut: !0,isSigner: !1,docs: ["The role which the player is being removed from"]}, {name: "systemProgram",isMut: !1,isSigner: !1,docs: ["The system program"]}],args: [{name: "keyIndex",type: "u16"}, {name: "keyIndexInRoleAccount",type: "u16"}, {name: "keyIndexInMembershipAccount",type: "u16"}]}, {name: "removeRole",accounts: [{name: "funder",isMut: !0,isSigner: !1,docs: ["The funder for the transaction"]}, {name: "profile",isMut: !0,isSigner: !1,docs: ["The Profile that the role is being removed from"]}, {name: "roleAccount",isMut: !0,isSigner: !1,docs: ["The role being removed"]}, {name: "roleNameAccount",isMut: !0,isSigner: !1,docs: ["The role name account (if it exists)"]}],args: [{name: "roleNameBump",type: "u8"}, {name: "keyIndex",type: "u16"}]}, {name: "setName",accounts: [{name: "key",isMut: !1,isSigner: !0,docs: ["The key authorized to change the name."]}, {name: "funder",isMut: !0,isSigner: !0,docs: ["The funder for the name size change."]}, {name: "profile",isMut: !1,isSigner: !1,docs: ["The profile to set the name for."]}, {name: "name",isMut: !0,isSigner: !1,docs: ["The name account."]}, {name: "systemProgram",isMut: !1,isSigner: !1,docs: ["The system program."]}],args: [{name: "keyIndex",type: "u16"}, {name: "name",type: "bytes"}]}, {name: "setRoleAcceptingMembers",accounts: [{name: "profile",isMut: !1,isSigner: !1,docs: ["The profile which owns the role being modified."]}, {name: "roleAccount",isMut: !0,isSigner: !1,docs: ["The role account to set as accepting members."]}],args: [{name: "keyIndex",type: "u16"}]}, {name: "setRoleAuthorizer",accounts: [{name: "funder",isMut: !0,isSigner: !0,docs: ["The funder for the name size change."]}, {name: "profile",isMut: !1,isSigner: !1,docs: ["The profile to set the name for."]}, {name: "roleAccount",isMut: !0,isSigner: !1,docs: ["The role account to set the authorizer for."]}, {name: "authorizer",isMut: !1,isSigner: !1,docs: ["The authorizer account to set."]}],args: [{name: "keyIndex",type: "u16"}]}, {name: "setRoleName",accounts: [{name: "funder",isMut: !0,isSigner: !0,docs: ["The funder for the name size change."]}, {name: "profile",isMut: !1,isSigner: !1,docs: ["The profile which the role belongs to"]}, {name: "role",isMut: !1,isSigner: !1,docs: ["The role to set the name for."]}, {name: "name",isMut: !0,isSigner: !1,docs: ["The name account."]}, {name: "systemProgram",isMut: !1,isSigner: !1,docs: ["The system program."]}],args: [{name: "keyIndex",type: "u16"}, {name: "name",type: "bytes"}]}, {name: "setRoleNotAcceptingMembers",accounts: [{name: "profile",isMut: !1,isSigner: !1,docs: ["The profile which owns the role being modified."]}, {name: "roleAccount",isMut: !0,isSigner: !1,docs: ["The role account to set as not accepting members."]}],args: [{name: "keyIndex",type: "u16"}]}],accounts: [{name: "playerName",docs: ["Stores a players name on-chain."],type: {kind: "struct",fields: [{name: "version",docs: ["The data version of this account."],type: "u8"}, {name: "profile",docs: ["The profile this name is for."],type: "publicKey"}, {name: "bump",docs: ["The bump for this account."],type: "u8"}]}}, {name: "profile",docs: ["A player profile."],type: {kind: "struct",fields: [{name: "version",docs: ["The data version of this account."],type: "u8"}, {name: "authKeyCount",docs: ["The number of auth keys on the account"],type: "u16"}, {name: "keyThreshold",docs: ["The number of auth keys needed to update the profile."],type: "u8"}, {name: "nextSeqId",docs: ["The next sequence number for a new role."],type: "u64"}, {name: "createdAt",docs: ["When the profile was created."],type: "i64"}]}}, {name: "profileRoleMembership",docs: ["A players roles for a given profile", "Remaining data contains an unordered list of [`RoleMembership`](RoleMembership) structs"],type: {kind: "struct",fields: [{name: "version",docs: ["The data version of this account."],type: "u8"}, {name: "profile",docs: ["The Profile this belongs to"],type: "publicKey"}, {name: "member",docs: ["The members profile pubkey"],type: "publicKey"}, {name: "bump",docs: ["PDA bump"],type: "u8"}]}}, {name: "role",docs: ["A Role associated with a Profile. A Role contains an unordered list of Role Members in its", "remaining data which lists all of the members who carry this role."],type: {kind: "struct",fields: [{name: "version",docs: ["The data version of this account."],type: "u8"}, {name: "profile",docs: ["Profile that this role belongs to"],type: "publicKey"}, {name: "authorizer",docs: ["Origin authority of the account"],type: "publicKey"}, {name: "roleSeqId",docs: ["Roles seq_id"],type: "u64"}, {name: "acceptingNewMembers",docs: ["Is role accepting new members"],type: "u8"}, {name: "bump",docs: ["The name of the rank", "TODO: Add instruction to use `player-name` as the label", "PDA bump"],type: "u8"}]}}],types: [{name: "AddKeyInput",docs: ["Struct for adding a key"],type: {kind: "struct",fields: [{name: "scope",docs: ["The block of permissions"],type: "publicKey"}, {name: "expireTime",docs: ["The expire time of the key to add"],type: "i64"}, {name: "permissions",docs: ["The permissions for the key"],type: {array: ["u8", 8]}}]}}, {name: "MemberStatus",docs: ["Represents potential membership statuses for a player with a role"],type: {kind: "enum",variants: [{name: "Inactive"}, {name: "Active"}]}}, {name: "ProfileKey",docs: ["A key on a profile."],type: {kind: "struct",fields: [{name: "key",docs: ["The key."],type: "publicKey"}, {name: "scope",docs: ["The key for the permissions."],type: "publicKey"}, {name: "expireTime",docs: ["The expire time for this key.", "If `<0` does not expire."],type: "i64"}, {name: "permissions",docs: ["The permissions for the key."],type: {array: ["u8", 8]}}]}}, {name: "RoleMembership",docs: ["Represents a members status in a role"],type: {kind: "struct",fields: [{name: "key",docs: ["The member or role key associated with this membership"],type: "publicKey"}, {name: "status",docs: ["The members role status"],type: "u8"}]}}],errors: [{code: 6e3,name: "KeyIndexOutOfBounds",msg: "Key index out of bounds"}, {code: 6001,name: "ProfileMismatch",msg: "Profile did not match profile key"}, {code: 6002,name: "KeyMismatch",msg: "Key did not match profile key"}, {code: 6003,name: "ScopeMismatch",msg: "Scope did not match profile scope"}, {code: 6004,name: "KeyExpired",msg: "Key expired"}, {code: 6005,name: "KeyMissingPermissions",msg: "Key is missing permissions"}, {code: 6006,name: "PermissionsMismatch",msg: "Permissions dont match available"}, {code: 6007,name: "AuthKeyCannotExpire",msg: "Auth keys cannot expire"}, {code: 6008,name: "AuthKeyMustSign",msg: "New auth keys must be signers"}, {code: 6009,name: "DuplicateAuthKey",msg: "Duplicate key when adjusting auth keys"}, {code: 6010,name: "RoleAuthorityAlreadySet",msg: "Role authority has already been set"}, {code: 6011,name: "RoleNotAcceptingMembers",msg: "Role is not accepting new members"}, {code: 6012,name: "RoleMembershipMismatch",msg: "Role membership is not as expected"}, {code: 6013,name: "RoleLimitExceeded",msg: "Role limit exceeded"}, {code: 6014,name: "RoleHasMembers",msg: "Cannot remove role with members"}, {code: 6015,name: "FeatureNotImplemented",msg: "This feature is not yet support"}]};
    const profileProgramId = new solanaWeb3.PublicKey('pprofELXjL5Kck7Jn5hCpwAL82DpTkSYBENzahVtbc9');

    let profileProgram = new BrowserAnchor.anchor.Program(profileIDL, profileProgramId, anchorProvider);

    let wallet = null;
    let userPublicKey = null;
    let userProfilePublicKey = null;
    let userProfileKeyIdx = 0;
    let userProfile = null;
    let permissionedAccounts = [];

    async function getPermissionedAccounts() {
        permissionedAccounts = [];

        // Find the Player Profile associated with the connected wallet
        [userProfile] = await solanaConnection.getProgramAccounts(
            profileProgramId,
            {
                filters: [
                    {
                        memcmp: {
                            offset: 30,
                            bytes: userPublicKey.toString(),
                        },
                    },
                ],
            }
        );

        // The first 30 bytes are general information about the Profile
        let profileData = userProfile.account.data.subarray(30);
        let iter = 0;

        // Each account which has been granted access to this Profile
        //   is listed in 80 byte chunks
        while (profileData.length >= 80) {
            let currProfileKey = profileData.subarray(0, 80);
            let decodedProfileKey = profileProgram.coder.types.decode('ProfileKey', currProfileKey);

            // Find the Player Profile associated with the account which has been granted access
            let [targetUserProfile] = await solanaConnection.getProgramAccounts(
                profileProgramId,
                {
                    filters: [
                        {
                            memcmp: {
                                offset: 30,
                                bytes: decodedProfileKey.key.toString(),
                            },
                        },
                    ],
                }
            );

            // Find the Player Name associated with the account which has been granted access
            let playerNameAcct;
            if (targetUserProfile) {
                [playerNameAcct] = await solanaConnection.getProgramAccounts(
                    profileProgramId,
                    {
                        filters: [
                            {
                                memcmp: {
                                    offset: 9,
                                    bytes: targetUserProfile.pubkey.toString(),
                                },
                            },
                        ],
                    }
                );
            }
            let playerName = playerNameAcct ? new TextDecoder().decode(playerNameAcct.account.data.subarray(42)) : '';

            let permissionType;
            switch(decodedProfileKey.scope.toString()) {
                case sageProgramId.toString():
                    permissionType = 'sage';
                    break;
                case pointsProgramId.toString():
                    permissionType = 'points';
                    break;
                case pointsStoreProgramId.toString():
                    permissionType = 'points_store';
                    break;
                case profileProgramId.toString():
                    permissionType = 'default';
                    break;
            }

            let permissions = await decodePermissions(decodedProfileKey.permissions);

            permissionedAccounts.push({account: decodedProfileKey.key.toString(), name: playerName, idx: iter, scope: permissionType, permissions: permissions})
            profileData = profileData.subarray(80);
            iter += 1;
        }
        console.log(permissionedAccounts);
        return;
    }

    async function initUser() {
        wallet = await selectWalletToggle();
        if (wallet === 'phantom') {
            let walletConn = phantom && phantom.solana ? await phantom.solana.connect() : await solana.connect();
            userPublicKey = walletConn.publicKey;
        } else {
            await solflare.connect();
            userPublicKey = solflare.publicKey;
        }

        /*
        // Find the Player Profile associated with the connected wallet
        [userProfile] = await solanaConnection.getProgramAccounts(
            profileProgramId,
            {
                filters: [
                    {
                        memcmp: {
                            offset: 30,
                            bytes: userPublicKey.toString(),
                        },
                    },
                ],
            }
        );

        // Convert to a solanaWeb3 PublicKey object - probably unnecessary
        userProfilePublicKey = new solanaWeb3.PublicKey(userProfile.pubkey.toString());
        */

        let userProfiles = await solanaConnection.getProgramAccounts(profileProgramId);
        let foundProf = [];

        for (let userProf of userProfiles) {
            let userProfData = userProf.account.data.subarray(30);
            let iter = 0;
            while (userProfData.length >= 80) {
                let currProf = userProfData.subarray(0, 80);
                let profDecoded = profileProgram.coder.types.decode('ProfileKey', currProf);
                if (profDecoded.key.toString() === userPublicKey.toString()) {
                    let [playerNameAcct] = await solanaConnection.getProgramAccounts(
                        profileProgramId,
                        {
                            filters: [
                                {
                                    memcmp: {
                                        offset: 9,
                                        bytes: userProf.pubkey.toString(),
                                    },
                                },
                            ],
                        }
                    );
                    let playerName = playerNameAcct ? new TextDecoder().decode(playerNameAcct.account.data.subarray(42)) : '';
                    foundProf.push({profile: userProf.pubkey.toString(), name: playerName, idx: iter})
                }
                userProfData = userProfData.subarray(80);
                iter += 1;
            }
        }

        //Wait for user to select a profile if more than 1 is available
        let userProfile = foundProf.length > 1 ? await assistProfileToggle(foundProf) : foundProf[0];
        userProfilePublicKey = new solanaWeb3.PublicKey(userProfile.profile);
        userProfileKeyIdx = userProfile.idx;

        await getPermissionedAccounts();
        manageProfileToggle(permissionedAccounts);
        return;
    }

    // Simple async wait utility function
    function wait(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }

    // Wait until the transaction is confirmed before proceeding
    // Primarily looking for TransactionExpiredBlockheightExceededError to trigger a retry
    async function waitForTxConfirmation(txHash, blockhash, lastValidBlockHeight) {
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
        return response;
    }

    // Build the transaction, sign it, send it, retry if it expires
    async function txSignAndSend(ix) {
        let tx = new solanaWeb3.Transaction();
        console.log('---INSTRUCTION---');
        console.log(ix);
        if (ix.constructor === Array) {
            ix.forEach(item => tx.add(item.instruction))
        } else {
            tx.add(ix.instruction);
        }
        let { blockhash, lastValidBlockHeight } = await solanaConnection.getLatestBlockhash('confirmed');
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.feePayer = userPublicKey;
        tx.signer = userPublicKey;
        let txSigned = null;
        if (wallet === 'phantom') {
            txSigned = phantom && phantom.solana ? await phantom.solana.signAllTransactions([tx]) : await solana.signAllTransactions([tx]);
        } else {
            txSigned = await solflare.signAllTransactions([tx]);
        }
        let txSerialized = txSigned[0].serialize();
        let txHash = await solanaConnection.sendRawTransaction(txSerialized, {skipPreflight: true, preflightCommitment: 'confirmed'});
        console.log('---TXHASH---');
        console.log(txHash);
        let confirmation = await waitForTxConfirmation(txHash, blockhash, lastValidBlockHeight);
        console.log('---CONFIRMATION---');
        console.log(confirmation);
        let txResult = await solanaConnection.getTransaction(txHash, {commitment: 'confirmed', preflightCommitment: 'confirmed', maxSupportedTransactionVersion: 1});
        if (confirmation.name == 'TransactionExpiredBlockheightExceededError' && !txResult) {
            console.log('-----RETRY-----');
            txResult = await txSignAndSend(ix);
        }
        if (!confirmation.name) {
            while (!txResult) {
                await wait(2000);
                txResult = await solanaConnection.getTransaction(txHash, {commitment: 'confirmed', preflightCommitment: 'confirmed', maxSupportedTransactionVersion: 1});
            }
        }
        console.log('txResult: ', txResult);
        return txResult;
    }

    // Bitshift taken from @staratlas/sage permissions.ts
    function buildPermissions(input) {
        const out = [0,0,0,0,0,0,0,0];
        out[0] = new BrowserAnchor.anchor.BN(
            (input[0][0] ? 1 << 0 : 0) | // manageGame
            (input[0][1] ? 1 << 1 : 0) | // manageSector
            (input[0][2] ? 1 << 2 : 0) | // manageStar
            (input[0][3] ? 1 << 3 : 0) | // managePlanet
            (input[0][4] ? 1 << 4 : 0) | // manageShip
            (input[0][5] ? 1 << 5 : 0) | // manageSagePlayerProfile
            (input[0][6] ? 1 << 6 : 0) | // manageStarbase
            (input[0][7] ? 1 << 7 : 0)); // manageMineItem
        out[1] = new BrowserAnchor.anchor.BN(
            (input[1][0] ? 1 << 0 : 0) | // manageResource
            (input[1][1] ? 1 << 1 : 0) | // removeShipEscrow
            (input[1][2] ? 1 << 2 : 0) | // moveFleet
            (input[1][3] ? 1 << 3 : 0) | // transitionFromLoadingBay
            (input[1][4] ? 1 << 4 : 0) | // transitionFromIdle
            (input[1][5] ? 1 << 5 : 0) | // rentFleet
            (input[1][6] ? 1 << 6 : 0) | // doCrafting
            (input[1][7] ? 1 << 7 : 0)); // manageCargoPod
        out[2] = new BrowserAnchor.anchor.BN(
            (input[2][0] ? 1 << 0 : 0) | // addRemoveCargo
            (input[2][1] ? 1 << 1 : 0) | // doStarbaseUpgrades
            (input[2][2] ? 1 << 2 : 0) | // manageFleet
            (input[2][3] ? 1 << 3 : 0) | // manageFleetCargo
            (input[2][4] ? 1 << 4 : 0) | // doMining
            (input[2][5] ? 1 << 5 : 0) | // respawn
            (input[2][6] ? 1 << 6 : 0) | // manageSurveyDataUnit
            (input[2][7] ? 1 << 7 : 0)); // scanSurveyDataUnit
        out[3] = new BrowserAnchor.anchor.BN(
            (input[3][0] ? 1 << 0 : 0) | // doStarbaseUpkeep
            (input[3][1] ? 1 << 1 : 0) | // manageProgression
            (input[3][2] ? 1 << 2 : 0) | // manageCrewConfig
            (input[3][3] ? 1 << 3 : 0) | // manageCrew
            (input[3][4] ? 1 << 4 : 0)); // withdrawCrew
        return out;
    }

    function decodePermissions(input) {
        const permissions = [];
        for (let section of input) {
            let sectionFlags = [];
            sectionFlags.push((section & (1 << 0)) === (1 << 0));
            sectionFlags.push((section & (1 << 1)) === (1 << 1));
            sectionFlags.push((section & (1 << 2)) === (1 << 2));
            sectionFlags.push((section & (1 << 3)) === (1 << 3));
            sectionFlags.push((section & (1 << 4)) === (1 << 4));
            sectionFlags.push((section & (1 << 5)) === (1 << 5));
            sectionFlags.push((section & (1 << 6)) === (1 << 6));
            sectionFlags.push((section & (1 << 7)) === (1 << 7));
            permissions.push(sectionFlags);
        }
        return permissions;
    }

    function buildPointsPermissions(input) {
        const out = [0,0,0,0,0,0,0,0];
        out[0] = new BrowserAnchor.anchor.BN(
            (input[0][0] ? 1 << 0 : 0) | // manageCategory
            (input[0][1] ? 1 << 1 : 0) | // manageModifier
            (input[0][2] ? 1 << 2 : 0)); // spendPoints
        return out;
    }

    function buildPointsStorePermissions(input) {
        const out = [0,0,0,0,0,0,0,0];
        out[0] = new BrowserAnchor.anchor.BN(
            (input[0][0] ? 1 << 0 : 0) | // manageStore
            (input[0][1] ? 1 << 1 : 0) | // managePrice
            (input[0][2] ? 1 << 2 : 0) | // manageRedemptionConfig
            (input[0][3] ? 1 << 3 : 0)); // claimRedemptions
        return out;
    }

    async function addKeyToProfile(newKey) {
        document.getElementById("waiting").classList.add('lds-ring');
        // Requesting all non-admin SAGE permissions except 'removeShipEscrow', 'addRemoveCargo' and 'rentFleet'
        let permissions = buildPermissions([
            [false,false,false,false,false,false,false,false],
            [false,false,true,true,true,false,true,true],
            [false,true,true,true,true,true,false,true],
            [true,false,false,true,false]
        ]);

        // This requests the 'spendPoints' permission from the Points program
        let pointsPermissions = buildPointsPermissions([[false,false,true]]);

        // This requests the 'claimRedemptions' permission from the Points Store program
        let pointsStorePermissions = buildPointsStorePermissions([[false,false,false,true]]);

        let txResult = {};
        // Check if the public key has already been added.
        let targetAccount = permissionedAccounts.some(o => o.account === newKey);
        if (targetAccount) {
            txResult = {name: "AccountExists"};
        } else if (newKey.length < 1) {
            txResult = {name: "InputNeeded"};
        } else {
            let instructions = [];
            let ix1 = { instruction: await profileProgram.methods.addKeys(userProfileKeyIdx, 0, [{
                scope: sageProgramId,
                expireTime: new BrowserAnchor.anchor.BN(-1),
                permissions: permissions
            }]).accountsStrict({
                funder: userPublicKey,
                profile: userProfilePublicKey,
                key: userPublicKey,
                systemProgram: solanaWeb3.SystemProgram.programId
            }).remainingAccounts([{
                pubkey: new solanaWeb3.PublicKey(newKey),
                isSigner: false,
                isWritable: false
            }]).instruction()}
            instructions.push(ix1);

            let ix2 = { instruction: await profileProgram.methods.addKeys(userProfileKeyIdx, 0, [{
                scope: pointsProgramId,
                expireTime: new BrowserAnchor.anchor.BN(-1),
                permissions: pointsPermissions
            }]).accountsStrict({
                funder: userPublicKey,
                profile: userProfilePublicKey,
                key: userPublicKey,
                systemProgram: solanaWeb3.SystemProgram.programId
            }).remainingAccounts([{
                pubkey: new solanaWeb3.PublicKey(newKey),
                isSigner: false,
                isWritable: false
            }]).instruction()}
            instructions.push(ix2);

            let ix3 = { instruction: await profileProgram.methods.addKeys(userProfileKeyIdx, 0, [{
                scope: pointsStoreProgramId,
                expireTime: new BrowserAnchor.anchor.BN(-1),
                permissions: pointsStorePermissions
            }]).accountsStrict({
                funder: userPublicKey,
                profile: userProfilePublicKey,
                key: userPublicKey,
                systemProgram: solanaWeb3.SystemProgram.programId
            }).remainingAccounts([{
                pubkey: new solanaWeb3.PublicKey(newKey),
                isSigner: false,
                isWritable: false
            }]).instruction()}
            instructions.push(ix3);

            txResult = await txSignAndSend(instructions);
            await getPermissionedAccounts();
        }
        console.log('txResult: ', txResult);
        document.getElementById("waiting").classList.remove('lds-ring');
        manageProfileToggle();
        document.querySelector('#addAcctDiv').value = '';
        manageProfileToggle(permissionedAccounts);
        return txResult;
    }

    async function removeKeyFromProfile(targetAccountIdx) {
        document.getElementById("waiting").classList.add('lds-ring');
        let targetAccount = permissionedAccounts.find(o => o.idx == targetAccountIdx);

        let txResult = {};
        if (targetAccount.idx === 0) {
            txResult = {name: "PrimaryAccount"};
        } else {
            let tx = { instruction: await profileProgram.methods.removeKeys(userProfileKeyIdx, [new BrowserAnchor.anchor.BN(targetAccount.idx), new BrowserAnchor.anchor.BN(targetAccount.idx+1)]).accountsStrict({
                funder: userPublicKey,
                profile: userProfilePublicKey,
                key: userPublicKey,
                systemProgram: solanaWeb3.SystemProgram.programId
            }).instruction()}
            txResult = await txSignAndSend(tx);
            await getPermissionedAccounts();
        }
        document.getElementById("waiting").classList.remove('lds-ring');
        manageProfileToggle();
        document.querySelector('#addAcctDiv').value = '';
        manageProfileToggle(permissionedAccounts);
        return txResult;
    }

    function showPermissions(selectedProfile) {
        let permElem = document.getElementById("permissionDetails");
        permElem.innerHTML = '';
        let targetAccount = permissionedAccounts.find(o => o.idx == selectedProfile);

        let permissionNames = [];
        switch (targetAccount.scope) {
            case 'sage':
                permissionNames = [['manageGame','manageSector','manageStar','managePlanet','manageShip','manageSagePlayerProfile','manageStarbase','manageMineItem'],
                                 ['manageResource','removeShipEscrow','moveFleet','transitionFromLoadingBay','transitionFromIdle','rentFleet','doCrafting','manageCargoPod'],
                                 ['addRemoveCargo','doStarbaseUpgrades','manageFleet','manageFleetCargo','doMining','respawn','manageSurveyDataUnit','scanSurveyDataUnit'],
                                 ['doStarbaseUpkeep','manageProgression','manageCrewConfig','manageCrew','withdrawCrew']];
                break;
            case 'points':
                permissionNames = [['manageCategory','manageModifier','spendPoints']];
                break;
            case 'points_store':
                permissionNames = [['manageStore','managePrice','manageRedemptionConfig','claimRedemptions']];
                break;
            default:
                permissionNames = [['manageGame','manageSector','manageStar','managePlanet','manageShip','manageSagePlayerProfile','manageStarbase','manageMineItem'],
                                 ['manageResource','removeShipEscrow','moveFleet','transitionFromLoadingBay','transitionFromIdle','rentFleet','doCrafting','manageCargoPod'],
                                 ['addRemoveCargo','doStarbaseUpgrades','manageFleet','manageFleetCargo','doMining','respawn','manageSurveyDataUnit','scanSurveyDataUnit'],
                                 ['doStarbaseUpkeep','manageProgression','manageCrewConfig','manageCrew','withdrawCrew']];
        };

        let permContainer = document.createElement('div');
        permContainer.style.width = '100%';
        permContainer.style.display = 'flex';
        permContainer.style.justifyContent = 'space-around';

        let permCol1 = document.createElement('div');
        let permCol1Text = '';
        targetAccount.permissions[0].forEach((flag, i) => {
            let flagVal = flag ? '<span style="color: #00ff00">&#10004;</span>' : 'X';
            permCol1Text += permissionNames[0][i] ? flagVal + ' ' + permissionNames[0][i] + '<br>' : '<br>';
        });
        permCol1.innerHTML = permCol1Text;

        let permCol2 = document.createElement('div');
        let permCol2Text = '';
        permissionNames[1] && targetAccount.permissions[1].forEach((flag, i) => {
            let flagVal = flag ? '<span style="color: #00ff00">&#10004;</span>' : 'X';
            permCol2Text += permissionNames[1][i] ? flagVal + ' ' + permissionNames[1][i] + '<br>' : '<br>';
        });
        permCol2.innerHTML = permCol2Text;

        let permCol3 = document.createElement('div');
        let permCol3Text = '';
        permissionNames[2] && targetAccount.permissions[2].forEach((flag, i) => {
            let flagVal = flag ? '<span style="color: #00ff00">&#10004;</span>' : 'X';
            permCol3Text += permissionNames[2][i] ? flagVal + ' ' + permissionNames[2][i] + '<br>' : '<br>';
        });
        permCol3.innerHTML = permCol3Text;

        let permCol4 = document.createElement('div');
        let permCol4Text = '';
        permissionNames[3] && targetAccount.permissions[3].forEach((flag, i) => {
            let flagVal = flag ? '<span style="color: #00ff00">&#10004;</span>' : 'X';
            permCol4Text += permissionNames[3][i] ? flagVal + ' ' + permissionNames[3][i] + '<br>' : '<br>';
        });
        permCol4.innerHTML = permCol4Text;

        permContainer.appendChild(permCol1);
        permContainer.appendChild(permCol2);
        permContainer.appendChild(permCol3);
        permContainer.appendChild(permCol4);
        permElem.appendChild(permContainer);
    }

    // UI panel - wallet selection
    function selectWalletToggle() {
        return new Promise(async resolve => {
            let errElem = document.querySelector('#walletModal .assist-modal-error');
            let targetElem = document.querySelector('#walletModal');
            if (targetElem.style.display === 'none') {
                targetElem.style.display = 'block';
                let selectWalletBtn = document.querySelector('#selectWalletBtn');
                selectWalletBtn.onclick = async function() {
                    let selectWalletBtn = document.querySelector('#walletSelection');
                    let errBool = false;
                    errElem.innerHTML = '';
                    if (selectWalletBtn.value.length > 0) {
                        if (selectWalletBtn.value === 'phantom') {
                            if (typeof solana === 'undefined') {
                                errElem.innerHTML = 'ERROR: Phantom wallet not found.';
                                errBool = true;
                            }
                        } else {
                            if (typeof solflare === 'undefined') {
                                errElem.innerHTML = 'ERROR: Solflare wallet not found.';
                                errBool = true;
                            }
                        }
                        if (!errBool) {
                            let selectedWallet = selectWalletBtn.value;
                            selectWalletToggle();
                            resolve(selectedWallet);
                        }
                    }
                }
            } else {
                targetElem.style.display = 'none';
                resolve();
            }
        });
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

    // UI panel - profile management
    async function manageProfileToggle(accounts) {
        let targetElem = document.querySelector('#accountModal');
        let permElem = document.getElementById("permissionDetails");
        if (targetElem.style.display === 'none') {
            targetElem.style.display = 'block';
            let contentElem = document.querySelector('#profileList');
            let transportOptStr = '';
            accounts.forEach( function(account) {transportOptStr += '<option value="' + account.idx + '">' + '(' + account.scope + ') ' + account.name + '  [' + account.account + ']</option>';});
            let profileSelect = document.getElementById('profileSelect');
            if (profileSelect !== null) {
                profileSelect.innerHTML = transportOptStr;
            } else {
                profileSelect = document.createElement('select');
                profileSelect.id = 'profileSelect';
                profileSelect.size = Math.min(4, accounts.length + 1);
                profileSelect.style.width = '100%';
                profileSelect.style.padding = '2px 10px';
                profileSelect.innerHTML = transportOptStr;
                contentElem.append(profileSelect);
            }
            profileSelect.addEventListener('change', async function(e) {await showPermissions(profileSelect.value);});
        } else {
            targetElem.style.display = 'none';
            permElem.innerHTML = '';
        }
    }

    // Wait until the page loads to add UI elements
    let observer = new MutationObserver(waitForLabs);
    function waitForLabs(mutations, observer){
        let elemTrigger = observer ? '#root > div:first-of-type > div:first-of-type > div > header > h1' : 'body';
        if(document.querySelectorAll(elemTrigger).length > 0 && !document.getElementById("accountManagerContainer")) {
            document.getElementById("accountManagerContainerIso") && document.getElementById("accountManagerContainerIso").remove();
            observer && observer.disconnect();
            let assistCSS = document.createElement('style');
            assistCSS.innerHTML = '.assist-modal {display: none; position: fixed; z-index: 2; padding-top: 100px; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.4);} .assist-modal-content {position: relative; display: flex; flex-direction: column; background-color: rgb(41, 41, 48); margin: auto; padding: 0; border: 1px solid #888; width: 650px; min-width: 450px; max-width: 75%; height: auto; min-height: 50px; max-height: 85%; overflow-y: auto; box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2),0 6px 20px 0 rgba(0,0,0,0.19); -webkit-animation-name: animatetop; -webkit-animation-duration: 0.4s; animation-name: animatetop; animation-duration: 0.4s;} .assist-modal-error {color: red; margin-left: 5px; margin-right: 5px; font-size: 16px;} .assist-modal-header-right {color: rgb(255, 190, 77); margin-left: auto !important; font-size: 20px;} .assist-btn {background-color: rgb(41, 41, 48); color: rgb(255, 190, 77); margin-left: 2px; margin-right: 2px;} .assist-btn:hover {background-color: rgba(255, 190, 77, 0.2);} .assist-modal-close:hover, .assist-modal-close:focus {font-weight: bold; text-decoration: none; cursor: pointer;} .assist-modal-btn {color: rgb(255, 190, 77); padding: 5px 5px; margin-right: 5px; text-decoration: none; background-color: rgb(41, 41, 48); border: none; cursor: pointer;} .assist-modal-header {display: flex; align-items: center; padding: 2px 16px; background-color: rgba(255, 190, 77, 0.2); border-bottom: 2px solid rgb(255, 190, 77); color: rgb(255, 190, 77);} .assist-modal-body {padding: 2px 16px; font-size: 12px;} .assist-modal-body > table {width: 100%;} .assist-modal-body th, .assist-modal-body td {padding-right: 5px, padding-left: 5px;} #assistStatus {background-color: rgba(0,0,0,0.4); opacity: 0.75; backdrop-filter: blur(10px); position: absolute; top: 80px; right: 20px; z-index: 1;} .assist-btn-alt { color: rgb(255, 190, 77); padding: 12px 16px; text-decoration: none; display: block; background-color: rgb(41, 41, 48); border: none; cursor: pointer; } .assist-btn-alt:hover { background-color: rgba(255, 190, 77, 0.2); }';
            assistCSS.innerHTML += '.lds-ring {display: inline-block; position: relative; width: 22px; height: 22px; margin-right: 20px;} .lds-ring div {box-sizing: border-box; display: block; position: absolute; width: 24px; height: 24px; margin: 4px; border: 4px solid #fff; border-radius: 50%; animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite; border-color: #fff transparent transparent transparent;} .lds-ring div:nth-child(1) {animation-delay: -0.45s;} .lds-ring div:nth-child(2) {animation-delay: -0.3s;} .lds-ring div:nth-child(3) {animation-delay: -0.15s;} @keyframes lds-ring { 0% {transform: rotate(0deg);} 100% {transform: rotate(360deg);}}'

            let walletModal = document.createElement('div');
            walletModal.classList.add('assist-modal');
            walletModal.id = 'walletModal';
            walletModal.style.display = 'none';
            walletModal.style.zIndex = 3;
            let walletModalContent = document.createElement('div');
            walletModalContent.classList.add('assist-modal-content');
            walletModalContent.style.width = '300px';
            walletModalContent.style.minWidth = '300px';
            walletModalContent.innerHTML = '<div class="assist-modal-header"><span>Connect your "primary" wallet.</span><div class="assist-modal-header-right"></div><span class="assist-modal-close">x</span></div></div><div class="assist-modal-body" style="display: flex; flex-direction: column; align-items: center;"><span class="assist-modal-error"></span><select id="walletSelection" size=3 style="padding: 2px 10px; margin: 10px 0px 10px 0px;"><option value="solflare">Solflare</option><option value="phantom">Phantom</option></select><div><button id="selectWalletBtn" class="assist-btn">Connect Wallet</button></div></div>';
            walletModal.append(walletModalContent);

            let profileModal = document.createElement('div');
			profileModal.classList.add('assist-modal');
			profileModal.id = 'profileModal';
			profileModal.style.display = 'none';
			profileModal.style.zIndex = 3;
			let profileModalContent = document.createElement('div');
			profileModalContent.classList.add('assist-modal-content');
			profileModalContent.innerHTML = '<div class="assist-modal-header"><span>Profile Selection</span><div class="assist-modal-header-right"><span class="assist-modal-close">x</span></div></div><div class="assist-modal-body"><span id="assist-modal-error"></span><div></div><span>Select a profile to connect to FLY.</span><div></div><div id="profileDiv" max-width="100%"></div></div>';
			profileModal.append(profileModalContent);

            let accountModal = document.createElement('div');
            accountModal.classList.add('assist-modal');
            accountModal.id = 'accountModal';
            accountModal.style.display = 'none';
            accountModal.style.zIndex = 3;
            let accountModalContent = document.createElement('div');
            accountModalContent.classList.add('assist-modal-content');
            accountModalContent.innerHTML = '<div class="assist-modal-header"><span>[FLY] Freelance System: Core</span><div class="assist-modal-header-right"><div id="waiting"><div></div><div></div><div></div><div></div></div><span class="assist-modal-close">x</span></div></div><div class="assist-modal-body"><span class="assist-modal-error"></span><div>Grant restricted access to interact with this account\'s SAGE instance from another account. Enter the public key of the restricted account below.</div><div max-width="100%"><input id="addAcctDiv" type="text" style="width: 375px;"><button id="addAcctBtn" class="assist-btn">Add Account</button></div><div max-width="100%"><div id="profileList"></div><div style="display: flex;"><button id="removeAcctBtn" class="assist-btn" style="margin-left: auto;">Remove Account</button></div></div><div id="permissionDetails"></div></div>';
            accountModal.append(accountModalContent);

            let accountManagerTitle = document.createElement('span');
            accountManagerTitle.innerHTML = 'SLYA';
            accountManagerTitle.style.fontSize = '14px';

            let accountManagerBtn = document.createElement('button');
            accountManagerBtn.id = 'accountManagerBtn';
            accountManagerBtn.classList.add('assist-btn');
            accountManagerBtn.addEventListener('click', async function(e) {await initUser();});
            accountManagerBtn.innerText = 'FLY';

            let targetElem = document.querySelector('body');
            let accountManagerContainer = document.createElement('div');
            accountManagerContainer.style.display = 'flex';
            accountManagerContainer.style.flexDirection = 'row';
            accountManagerContainer.appendChild(accountManagerTitle);
            accountManagerContainer.appendChild(accountManagerBtn);
            if (observer) {
                accountManagerContainer.id = 'accountManagerContainer';
                targetElem = document.querySelector('#root > div:first-of-type > div:first-of-type > div > header > h1');
                targetElem.style.fontSize = '18px';
                targetElem.append(assistCSS);
                let assistContainer = document.getElementById("assistContainer");
                assistContainer ? assistContainer.append(accountManagerBtn) : targetElem.append(accountManagerContainer);
            } else {
                accountManagerContainer.id = 'accountManagerContainerIso';
                let assistContainerIso = document.getElementById("assistContainerIso");
                assistContainerIso ? assistContainerIso.append(accountManagerBtn) : targetElem.append(accountManagerContainer);
                targetElem.prepend(accountManagerContainer);
                targetElem.prepend(assistCSS);
            }
            targetElem.append(walletModal);
            targetElem.append(profileModal);
            targetElem.append(accountModal);

            let walletClose = document.querySelector('#walletModal .assist-modal-close');
            walletClose.addEventListener('click', async function(e) {await selectWalletToggle();});
            let profileModalClose = document.querySelector('#profileModal .assist-modal-close');
			profileModalClose.addEventListener('click', function(e) {assistProfileToggle(null);});
            let addAcctBtn = document.querySelector('#addAcctBtn');
            addAcctBtn.addEventListener('click', async function(e) {
                let r = await addKeyToProfile(document.querySelector('#addAcctDiv').value);
                console.log('r: ', r);
                let errElem = document.querySelector('#accountModal .assist-modal-error');
                if (r.name === 'InputNeeded') {
                    errElem.innerHTML = 'Error: Please enter a public key.';
                } else if (r.name === 'AccountExists') {
                    errElem.innerHTML = 'Error: Account already added.';
                } else {
                    errElem.innerHTML = '';
                }
            });
            let removeAcctBtn = document.querySelector('#removeAcctBtn');
            removeAcctBtn.addEventListener('click', async function(e) {
                let r = await removeKeyFromProfile(document.querySelector('#profileSelect').value);
                let errElem = document.querySelector('#accountModal .assist-modal-error');
                if (r.name === 'PrimaryAccount') {
                    errElem.innerHTML = 'Error: Cannot remove primary account.';
                } else {
                    errElem.innerHTML = '';
                }
            });
            let accountClose = document.querySelector('#accountModal .assist-modal-close');
            accountClose.addEventListener('click', async function(e) {await manageProfileToggle();});
        }
    }
    observer.observe(document, {childList: true, subtree: true});
    waitForLabs(null, null);
})();
