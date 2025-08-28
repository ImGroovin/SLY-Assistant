### General
* Global Settings panel for further customization
* Optimized startup time
* Automated undock at startup for assigned fleets
* Config coordinates with a . instead of a , are automatically corrected when saving
* RPC usage/load split up, allowing reads and writes to use different RPCs if desired

### Bug Fixes
* Less stuck fleets
* Accurate warp fuel cost calculations

### Status Panel
* Does not show unassigned fleets at startup
* Shows coordinates and/or times for more operations
* Shows Red names when fleets get stuck and Green names when being actively controlled

### Console Logging
* Cleaner, more readable, fleet/action context tags, timestamps, etc.
* More useful data points and info
* Emojis for easier readability

### Mining Fleets
* Only load ammo/fuel when low, rather than every time they resupply food
* If mining is stopped early due to calculation errors, resupply will still be done if supplies are "low"

### Scanning Fleets
* Ignore scan cooldown for non-scanning actions
* Resume scanning from their current position when starting the script, if located in one of the sectors in their scanning pattern

### Transport Fleets
* Larger list of resources to choose from
* Refuels at target if required to complete the return trip
* Uses fuel/ammo bays to help move fuel/ammo, even when cargo hold is already full, if food/ammo is listed after other cargo
