# Pokémon Availability - Server
A backend server of a two part app for checking Pokémon availability given a selection of games. 

This project is written in ReactJS. Parts of the code were generated using [DeepSeek-R1](https://chat.deepseek.com/) and the [Cline](https://cline.bot/) extension with [Claude 3.5-Sonnet](https://claude.ai/) in Visual Studio Code (VSCode).

### Client
You may find the Client repo [here](https://github.com/VHCosta/pokemon-availability-client).

## Known bugs/issues/things to improve

* Missing availability data for all Switch games. This data is unavailable in PokeAPI.
* Filtering Slot 2 data is currently handled in the frontend rendering logic with some if-statements. This verification should be moved to the backend, unless enough interest in the current functionality is voiced.
* Currently I am testing the app with a locally cached copy of the API data, cloned from [here](https://github.com/PokeAPI/pokeapi), to avoid potential rate limits. I have not since tested using the official API, so you may have to do the same to run locally.

## Future Plans:

* Add the data for Switch games. Potentially extracting from Bulbapedia, but still weighing options.

## Credits

* Data extracted from [PokéAPI](https://pokeapi.co/), created by [Paul Hallett](https://github.com/phalt) and other [PokéAPI contributors](https://github.com/PokeAPI/pokeapi/graphs/contributors) around the world.
* Pokémon and Pokémon character names are trademarks of Nintendo.