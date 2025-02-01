# Pokémon Availability - Server
A backend server of a two part app for checking Pokémon availability given a selection of games. 

Written in ReactJS. Code partially generated using DeepSeek-R1 and Cline extension with Claude 3.5-Sonnet on VSCode.

You may find the Client repo [here](https://github.com/VHCosta/pokemon-availability-client).

## Known issues

* Some Pokemon are missing Evolution method data if their previous form was only obtainable by evolving. _(Example: On selecting Pokemon Red, Ivysaur is only obtainable through evolving the starter Bulbasaur, so it gets the Evolution tag. Venusaur is missing its tag.)_
* Currently I am testing the app with a locally cached copy of the API data, cloned from [here](https://github.com/PokeAPI/pokeapi), to avoid potential rate limits. I have not since tested using the official API, so you may have to do the same to run locally.

## Future Plans:

* Have the data be served from within the app instead of PokeAPI to avoid rate limits.

## Credits

* Data extracted from [PokéAPI](https://pokeapi.co/), created by [Paul Hallett](https://github.com/phalt) and other [PokéAPI contributors](https://github.com/PokeAPI/pokeapi/graphs/contributors) around the world.
* Pokémon game logos by [JorMxDos on DeviantArt](https://www.deviantart.com/jormxdos).
* Favicon by [Nikita Golubev on Flaticon.com](https://www.flaticon.com/authors/nikita-golubev).
* Pokémon and Pokémon character names are trademarks of Nintendo.