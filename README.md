# Pokémon Availability - Server
A backend server of a two part app for checking Pokémon availability given a selection of games. 

This project is written using Express. Parts of the code were initially generated using [DeepSeek-R1](https://chat.deepseek.com/) and the [Cline](https://cline.bot/) extension with [Claude 3.5-Sonnet](https://claude.ai/) in Visual Studio Code (VSCode).

## 🎉 The app is live! 🥳
That's right, this app is finally live! The client is on Netlify, and the server is on Render.com!

**[See it live](https://pokemon-checker.netlify.app/)**! Please make use of it as much as you like. 

> There is a limitation of the server being hosted on Render.com: it will spin down during periods of inactivity, so after pressing **Find Pokémon** you may not see your results at that moment, but the request will usually be sent. \
> You may try again after a minute or so, and you should have your results. If not, or if you find any novel error, you may submit an issue here on GitHub, or send me an email [here](mailto:vh48@pm.me).


### Client
You may find the Client repository [here](https://github.com/VHCosta/pokemon-availability-client).

## Known bugs/issues/things to improve

* Missing availability data for all Switch games. This data is unavailable in PokeAPI.
* Filtering Slot 2 data is currently handled in the frontend rendering logic with some if-statements. This verification should be moved to the backend, unless enough interest in the current functionality is voiced.

## Future Plans:

* Add the data for Switch games. Potentially extracting from Bulbapedia, but still weighing options.

## Credits

* Data extracted from [PokéAPI](https://pokeapi.co/), created by [Paul Hallett](https://github.com/phalt) and other [PokéAPI contributors](https://github.com/PokeAPI/pokeapi/graphs/contributors) around the world.
* Pokémon and Pokémon character names are trademarks of Nintendo.