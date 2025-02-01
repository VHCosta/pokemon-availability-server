# Pokémon Availability - Server
A backend server of a two part app for checking Pokémon availability given a selection of games. 

This project is written in ReactJS. Parts of the code were generated using [DeepSeek-R1](https://chat.deepseek.com/) and the [Cline](https://cline.bot/) extension with [Claude 3.5-Sonnet](https://claude.ai/) in Visual Studio Code (VSCode).

### Client
You may find the Client repo [here](https://github.com/VHCosta/pokemon-availability-client).

## Known issues

* Some Pokemon are missing Evolution method data if their previous form was only obtainable by evolving. _(Example: On selecting Pokemon Red, Ivysaur is only obtainable through evolving the starter Bulbasaur, so it gets the Evolution tag. Venusaur is missing its tag.)_
* Currently I am testing the app with a locally cached copy of the API data, cloned from [here](https://github.com/PokeAPI/pokeapi), to avoid potential rate limits. I have not since tested using the official API, so you may have to do the same to run locally.

## Future Plans:

* Have the data be served from within the app instead of PokeAPI to avoid rate limits.

## Credits

* Data extracted from [PokéAPI](https://pokeapi.co/), created by [Paul Hallett](https://github.com/phalt) and other [PokéAPI contributors](https://github.com/PokeAPI/pokeapi/graphs/contributors) around the world.
* Pokémon and Pokémon character names are trademarks of Nintendo.