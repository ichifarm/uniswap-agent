# Forta Workshop 2: ICHI V2 Large Swap Agent

## Description

This Forta Bot checks incoming Eth Mainnet blocks to detect anomolously large swaps on ICHI Angel Vaults. 

## Supported Chains

- Ethereum Mainnet

## Alerts

- ICHI Forta 1 - Large Deposit to AV Made 
- ICHI Forta 2 - Large Withdrawal to AV Made


## Test Data

The agent behavior can be verified with the following transactions (`npm run tx <tx_hash>`):
    
- USDC/QRDO: 0x784Ac9aaeaB58AAf904cc69e105aa51343E4C693 

    - 0x85448e27e15ff33815b9b45ce273213105cc3ffdad691d27b0ec4bb2b601e826
    - 0xe611034c7f68083a19ae525dd0b55968e3a715400c6cfd5cbc2d1fef0e7a2361
    - 0xf8779ee65dbffa36ea81be88cc60d80340ebfaeb3aeb3be48b0ad60a31cbc5f6

- OneICHI/ICHI: 0x46f9490bcbcd0A12d3d8578B5b3AB19f8EF0617D

    - 0x15575350ee7b55cf50eea78340a4cc0b3cc7febb3c15c9468b6616e0f9899736
    - 0xd426e0de5a47785c1efb8933055e6b52d4c5c03ead112dcb412fa0d354a6a925
    - 0xc55c224aebe550821b09446deefa5ec7ecde366efe64718554aa3b447e020237

- USDC/ICHI: 0x683F081DBC729dbD34AbaC708Fa0B390d49F1c39

    - 0x819e10315cdedeee2b5ff262687ec037b555156fe3824aa0b9c2e0c7a075c283
    - 0x8739d015fce1533c078e1358cc790e1bf94e33dcdcb3ec337db8c61d71e725eb
    - 0x628137015be10db380beebde86cc7c3ae85f5dd793771a5193a6e285f3bbcdda