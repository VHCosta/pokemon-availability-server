const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors({ origin: 'https://pokemon-checker.netlify.app' }));
app.use(express.json());

const PORT = process.env.PORT || 5000;
const DATA_ROOT = path.join(__dirname, './data');

const GAME_MAP = {
  'red': 'red',
  'blue': 'blue',
  'yellow': 'yellow',
  'gold': 'gold',
  'silver': 'silver',
  'crystal': 'crystal',
  'ruby': 'ruby',
  'sapphire': 'sapphire',
  'emerald': 'emerald',
  'firered': 'firered',
  'leafgreen': 'leafgreen',
  'diamond': 'diamond',
  'pearl': 'pearl',
  'platinum': 'platinum',
  'heartgold': 'heartgold',
  'soulsilver': 'soulsilver',
  'black': 'black',
  'white': 'white',
  'black-2': 'black-2',
  'white-2': 'white-2',
  'x': 'x',
  'y': 'y',
  'omega-ruby': 'omega-ruby',
  'alpha-sapphire': 'alpha-sapphire',
  'sun': 'sun',
  'moon': 'moon',
  'ultra-sun': 'ultra-sun',
  'ultra-moon': 'ultra-moon',
  'lets-go-pikachu': 'lets-go-pikachu',
  'lets-go-eevee': 'lets-go-eevee',
  'sword': 'sword',
  'shield': 'shield',
  'brilliant-diamond': 'brilliant-diamond',
  'shining-pearl': 'shining-pearl',
  'legends-arceus': 'legends-arceus',
  'scarlet': 'scarlet',
  'violet': 'violet'
};

const GAME_GENERATIONS = {
  // Gen 1
  'red': 1, 'blue': 1, 'yellow': 1,
  // Gen 2
  'gold': 2, 'silver': 2, 'crystal': 2,
  // Gen 3
  'ruby': 3, 'sapphire': 3, 'emerald': 3,
  'firered': 3, 'leafgreen': 3,
  // Gen 4
  'diamond': 4, 'pearl': 4, 'platinum': 4,
  'heartgold': 4, 'soulsilver': 4,
  // Gen 5
  'black': 5, 'white': 5, 'black-2': 5, 'white-2': 5,
  // Gen 6
  'x': 6, 'y': 6,
  'omega-ruby': 6, 'alpha-sapphire': 6,
  // Gen 7
  'sun': 7, 'moon': 7, 'ultra-sun': 7, 'ultra-moon': 7,
  'lets-go-pikachu': 7, 'lets-go-eevee': 7,
  // Gen 8
  'sword': 8, 'shield': 8,
  'brilliant-diamond': 8, 'shining-pearl': 8,
  'legends-arceus': 8,
  // Gen 9
  'scarlet': 9, 'violet': 9
};

// Generation ranges for Pokemon IDs
const GENERATION_RANGES = [
  [1, 151],    // Gen 1
  [152, 251],  // Gen 2
  [252, 386],  // Gen 3
  [387, 493],  // Gen 4
  [494, 649],  // Gen 5
  [650, 721],  // Gen 6
  [722, 809],  // Gen 7
  [810, 905],  // Gen 8
  [906, 1025]  // Gen 9
];

let pokemonCache = [];

// Add method filtering configuration
const ALLOWED_METHODS = new Set([
  'gift',          // NPC gifts
  'walk',          // Tall grass encounters
  'surf',          // Surfing
  'old-rod',
  'good-rod',
  'super-rod',
  'headbutt',      // Tree headbutting
  'rock-smash',    // Rock smashing
  'slot2',         // Dual-slot mode access
  'only-one'       // Fixed encounters (e.g. legendaries)
]);

// Exclude these methods
const EXCLUDED_METHODS = new Set([
  'trade',
  'event',
  'egg',
  'light-ball-egg',
  'stadium-surfing-pikachu'
]);

const processEncounters = (encountersData, selectedVersions) => {
  const games = new Set();
  const slot2Games = new Set();
  const methods = new Set();
  const methodsByGame = {};

  encountersData.forEach(encounter => {
    encounter.version_details.forEach(versionDetail => {
      const versionName = versionDetail.version.name;
      versionDetail.encounter_details.forEach(encounterDetail => {
        const method = encounterDetail.method.name;
        const conditions = encounterDetail.condition_values.map(cv => cv.name);

        // Check for slot2 conditions
        const slot2 = conditions.find(c => c.startsWith('slot2-'));
        const slot2Game = slot2 ? slot2.split('slot2-')[1] : null;

        if (GAME_MAP[versionName] && ALLOWED_METHODS.has(method)) {
          methods.add(method);
          games.add(versionName);

          // Track methods by game
          if (!methodsByGame[versionName]) {
            methodsByGame[versionName] = new Set();
          }
          methodsByGame[versionName].add(method);

          if (slot2Game && GAME_MAP[slot2Game]) {
            slot2Games.add(slot2Game);
            
            // Add slot2 method for Gen 4 games when slot2 is Gen 3
            if (GAME_GENERATIONS[versionName] === 4 && GAME_GENERATIONS[slot2Game] === 3) {
              const formattedGameName = slot2Game.charAt(0).toUpperCase() + slot2Game.slice(1);
              const slot2Method = `Slot 2 (${formattedGameName})`;
              
              if (!methodsByGame[versionName]) {
                methodsByGame[versionName] = new Set();
              }
              methodsByGame[versionName].add(slot2Method);
              methodsByGame[versionName].add('slot2');
            }

            // Track methods for slot2 games as well
            if (!methodsByGame[slot2Game]) {
              methodsByGame[slot2Game] = new Set();
            }
            methodsByGame[slot2Game].add(method);
          }
        }
      });
    });
  });

  // Convert Sets to arrays in methodsByGame
  const methodsByGameArray = Object.fromEntries(
    Object.entries(methodsByGame).map(([game, methods]) => [
      game,
      Array.from(methods)
    ])
  );

  return {
    games: Array.from(games),
    slot2: Array.from(slot2Games),
    methods: Array.from(methods),
    methodsByGame: methodsByGameArray
  };
};


const processEvolutionChain = (chain) => {
  const result = {};

  const processChain = (node, prevName = null) => {
    const name = node.species.name;
    const evolutions = {
      prev: prevName ? { name: prevName } : null,
      next: []
    };

    if (node.evolves_to.length > 0) {
      node.evolves_to.forEach(evolution => {
        const evolutionDetails = evolution.evolution_details? evolution.evolution_details[0] : {};
        const evolutionInfo = {
          name: evolution.species.name,
          trigger: evolutionDetails.trigger?.name || 'unknown'
        };

        // Add specific evolution details based on trigger type
        if (evolutionDetails.min_level) {
          evolutionInfo.level = evolutionDetails.min_level;
        }
        if (evolutionDetails.item) {
          evolutionInfo.item = evolutionDetails.item.name;
        }
        if (evolutionDetails.min_happiness) {
          evolutionInfo.happiness = evolutionDetails.min_happiness;
        }
        if (evolutionDetails.time_of_day) {
          evolutionInfo.timeOfDay = evolutionDetails.time_of_day;
        }
        if (evolutionDetails.held_item) {
          evolutionInfo.heldItem = evolutionDetails.held_item.name;
        }

        evolutions.next.push(evolutionInfo);
        processChain(evolution, name);
      });
    }

    result[name] = evolutions;
  };

  processChain(chain);
  return result;
};

function loadPokemonData() {
  const pokemonDir = path.join(DATA_ROOT, 'api/v2/pokemon');
  const pokemonFolders = fs.readdirSync(pokemonDir).filter(folder => {
    return fs.statSync(path.join(pokemonDir, folder)).isDirectory();
  });

  pokemonCache = pokemonFolders.map(folder => {
    const pokemonPath = path.join(pokemonDir, folder, 'index.json');
    const encountersPath = path.join(pokemonDir, folder, 'encounters', 'index.json');
    
    try {
      const mainData = JSON.parse(fs.readFileSync(pokemonPath, 'utf8'));
      const encountersData = JSON.parse(fs.readFileSync(encountersPath, 'utf8'));
      
      const gameAppearances = new Set();

      encountersData.forEach(encounter => {
        encounter.version_details.forEach(versionDetail => {
          versionDetail.encounter_details.forEach(encounterDetail => {  
            const method = encounterDetail.method.name;
            const versionName = versionDetail.version.name;

            // Check if method is allowed and version is in our game map
            if (GAME_MAP[versionName] &&
              ALLOWED_METHODS.has(method) &&
              !EXCLUDED_METHODS.has(method)) {
              gameAppearances.add(versionName);
            }
          });
        });
      });

      // Load species data to get evolution chain
      const speciesPath = path.join(DATA_ROOT, mainData.species.url, 'index.json');
      const speciesData = JSON.parse(fs.readFileSync(speciesPath, 'utf8'));
      
      // Load evolution chain data
      const evolutionChainPath = path.join(DATA_ROOT, speciesData.evolution_chain.url, 'index.json');
      const evolutionChainData = JSON.parse(fs.readFileSync(evolutionChainPath, 'utf8'));
      
      // Process evolution data
      const evolutionData = processEvolutionChain(evolutionChainData.chain);

      const encounterData = processEncounters(encountersData);
      return {
        id: mainData.id,
        name: mainData.name,
        games: encounterData.games,
        slot2: encounterData.slot2,
        methods: encounterData.methods,
        methodsByGame: encounterData.methodsByGame || {},
        sprite: mainData.sprite,
        evolutions: evolutionData[mainData.name]
      };
    } catch (error) {
      console.error(`Error loading ${folder}:`, error.message);
      return null;
    }
  }).filter(Boolean).sort((a, b) => a.id - b.id);
}

// Initialize data
loadPokemonData();
console.log(`Loaded ${pokemonCache.length} Pokémon with encounter data`);

// Helper function to check if a Pokemon exists in given game versions
const isPokemonInVersions = (pokemon, versions) => {
  const directMatch = pokemon.games.some(g => versions.includes(g));
  const slot2Match = pokemon.slot2.some(s => versions.includes(s));
  return directMatch || slot2Match;
};

// Helper function to get a Pokemon by name from cache
const getPokemonByName = (name) => {
  return pokemonCache.find(p => p.name === name);
};

// Get all available games for a Pokemon (direct encounters + evolution)
const getGamesForPokemon = (pokemon, versions, minGeneration) => {
  // Start with games where Pokemon has direct encounters
  const availableGames = new Set([
    ...pokemon.games.filter(g => 
      versions.includes(g) && 
      GAME_GENERATIONS[g] >= minGeneration
    ),
    ...pokemon.slot2.filter(s => 
      versions.includes(s) && 
      GAME_GENERATIONS[s] >= minGeneration
    )
  ]);

  // If Pokemon has prev and no direct encounters, include evolution games
  if (pokemon.evolutions?.prev && availableGames.size === 0) {
    const prevPokemon = getPokemonByName(pokemon.evolutions.prev.name);
    if (prevPokemon) {
      // Get games where pre-evolution is available
      const prevGames = getGamesForPokemon(prevPokemon, versions, minGeneration);
      // Add those games as evolution is possible there
      prevGames.forEach(g => availableGames.add(g));
    }
  }

  return Array.from(availableGames);
};

// Get available games for a Pokemon from cache (direct encounters only)
const getAvailableGames = (pokemon, versions) => {
  return [...new Set([
    ...pokemon.games.filter(g => versions.includes(g)),
    ...pokemon.slot2.filter(s => versions.includes(s))
  ])];
};

// Helper function to validate an evolution step is possible in the given games
const isEvolutionValidInGames = (pokemon, prevPokemon, versions, minGeneration) => {
  if (!pokemon || !prevPokemon) return false;

  // Get pre-evolution generation
  const prevPokemonGeneration = GENERATION_RANGES.findIndex(([start, end]) => 
    prevPokemon.id >= start && prevPokemon.id <= end
  ) + 1;

  // Get games where this evolution step is valid
  return prevPokemon.games.some(g => {
    const gameGeneration = GAME_GENERATIONS[g];
    return versions.includes(g) && 
           gameGeneration >= prevPokemonGeneration && 
           gameGeneration >= minGeneration;
  });
};

// Helper function to validate evolution chain from base form
const validateEvolutionChain = (pokemon, versions, minGeneration) => {
  // First find base form by walking up
  let base = pokemon;
  while (base.evolutions?.prev) {
    const prevPokemon = getPokemonByName(base.evolutions.prev.name);
    if (!prevPokemon) break;
    base = prevPokemon;
  }

  // Start with base form's available games in selected versions
  let validGames = new Set(
    base.games.filter(g => 
      versions.includes(g) && 
      GAME_GENERATIONS[g] >= minGeneration
    )
  );

  // Now walk down the chain from base form
  let current = base;
  while (current && validGames.size > 0) {
    // Look for this Pokemon's evolution
    const nextEvolution = current.evolutions?.next?.[0];
    if (!nextEvolution) break;

    // Get the next Pokemon
    const nextPokemon = getPokemonByName(nextEvolution.name);
    if (!nextPokemon) break;

    // Keep only games where evolution is valid
    validGames = new Set(
      Array.from(validGames).filter(game => {
        const gameGeneration = GAME_GENERATIONS[game];
        // Next Pokemon must be from same or earlier generation
        const nextGeneration = GENERATION_RANGES.findIndex(([start, end]) => 
          nextPokemon.id >= start && nextPokemon.id <= end
        ) + 1;
        return gameGeneration >= nextGeneration;
      })
    );

    current = nextPokemon;
  }

  // Did we reach the target Pokemon?
  const reachedTarget = current?.name === pokemon.name;
  return { 
    valid: reachedTarget && validGames.size > 0, 
    games: Array.from(validGames)
  };
};

// Process evolution data with game version info
const processEvolutionWithVersions = (pokemon, evolution, versions) => {
  const evolvedPokemon = getPokemonByName(evolution.name);
  if (!evolvedPokemon) {
    return {
      ...evolution,
      availableIn: [],
      obtainable: false
    };
  }

  // Get generation info
  const selectedGameGenerations = versions.map(v => GAME_GENERATIONS[v]);
  const minSelectedGeneration = Math.min(...selectedGameGenerations);

  // Check evolution chain validity
  const chainResult = validateEvolutionChain(evolvedPokemon, versions, minSelectedGeneration);

  return {
    ...evolution,
    availableIn: chainResult.games,
    obtainable: chainResult.valid && chainResult.games.length > 0
  };
};

const getEvolutionChainMembers = (pokemon, versions) => {
  const result = new Set();

  // Add the Pokemon itself
  result.add(pokemon.name);

  // Add pre-evolutions (walking up)
  let current = pokemon;
  while (current?.evolutions?.prev) {
    const prevPokemon = getPokemonByName(current.evolutions.prev.name);
    if (prevPokemon) {
      result.add(prevPokemon.name);
      current = prevPokemon;
    } else {
      break;
    }
  }

  // Add evolutions (walking down)
  const processNextEvolutions = (pokemon) => {
    if (pokemon?.evolutions?.next) {
      pokemon.evolutions.next.forEach(evolution => {
        const evolvedPokemon = getPokemonByName(evolution.name);
        if (evolvedPokemon) {
          result.add(evolvedPokemon.name);
          processNextEvolutions(evolvedPokemon);
        }
      });
    }
  };

  processNextEvolutions(pokemon);
  return Array.from(result);
};

// Helper function to get the highest generation from selected versions
const getHighestGeneration = (versions) => {
  return Math.max(...versions.map(v => GAME_GENERATIONS[v] || 0));
};

// Helper function to check if a Pokemon is from a valid generation
const isValidGeneration = (id, maxGeneration) => {
  const generation = GENERATION_RANGES.findIndex(([start, end]) => id >= start && id <= end) + 1;
  return generation > 0 && generation <= maxGeneration;
};

app.post('/api/pokemon', (req, res) => {
  const { versions } = req.body;

  // Get the highest generation from selected versions
  const maxGeneration = getHighestGeneration(versions);

  // First get directly obtainable Pokemon from valid generations
  const directlyObtainable = pokemonCache.filter(p =>
    isPokemonInVersions(p, versions) && isValidGeneration(p.id, maxGeneration)
  );

  // Get all evolution chain members for each directly obtainable Pokemon
  const evolutionChainMembers = new Set();
  directlyObtainable.forEach(pokemon => {
    const chainMembers = getEvolutionChainMembers(pokemon, versions);
    chainMembers.forEach(name => {
      const member = getPokemonByName(name);
      // Only add evolution chain members from valid generations
      if (member && isValidGeneration(member.id, maxGeneration)) {
        evolutionChainMembers.add(name);
      }
    });
  });

  // Filter and process Pokemon with enhanced evolution data
  const filtered = pokemonCache
    .filter(p => evolutionChainMembers.has(p.name) && isValidGeneration(p.id, maxGeneration))
    .map(p => {
      // Get methods by game for selected versions - use let since we'll modify this later
      let availableGames = getAvailableGames(p, versions);

      // Process methods and add evolution if applicable
      const methods = new Set();
      const methodsByGame = {};

      // Add encounter-based methods
      for (const game of availableGames) {
        if (p.methodsByGame[game]) {
          methodsByGame[game] = [...p.methodsByGame[game]];
          p.methodsByGame[game].forEach(method => methods.add(method));
        }
      }

      // Get the minimum generation from selected versions for evolution validation
      const selectedGameGenerations = versions.map(v => GAME_GENERATIONS[v]);
      const minSelectedGeneration = Math.min(...selectedGameGenerations);

      // Handle evolution methods and games
      if (p.evolutions?.prev) {
        // Check if this Pokemon has any direct encounters in ANY selected game
        const hasAnyDirectEncounters = versions.some(game => 
          p.methodsByGame[game]?.length > 0
        );

        // Check pre-evolution availability (including evolution chains)
        const prevPokemon = getPokemonByName(p.evolutions.prev.name);
        if (prevPokemon) {
          // Get ALL games where pre-evolution is available (including through its own evolution)
          const evolveFromGames = getGamesForPokemon(prevPokemon, versions, minSelectedGeneration);

          if (evolveFromGames.length > 0) {
            if (!hasAnyDirectEncounters) {
              // If no direct encounters, evolution is the ONLY way to get this Pokemon
              evolveFromGames.forEach(game => {
                methodsByGame[game] = ['evolution'];
              });
              methods.add('evolution');
            } else {
              // Pokemon can be encountered AND evolved
              evolveFromGames.forEach(game => {
                if (!methodsByGame[game]) {
                  methodsByGame[game] = [];
                }
                if (!methodsByGame[game].includes('evolution')) {
                  methodsByGame[game].push('evolution');
                }
              });
              methods.add('evolution');
            }

            // Include evolution-only games
            availableGames = [...new Set([...availableGames, ...evolveFromGames])];
          }
        }
      }

      const pokemon = {
        ...p,
        games: availableGames,
        methods: Array.from(methods),
        methodsByGame
      };

      // Add version info to evolution data
      if (pokemon.evolutions) {
        if (pokemon.evolutions.prev) {
          const prevPokemon = getPokemonByName(pokemon.evolutions.prev.name);
          const prevGames = prevPokemon ? getAvailableGames(prevPokemon, versions) : [];
          pokemon.evolutions.prev = {
            ...pokemon.evolutions.prev,
            games: prevGames,
            obtainable: prevGames.length > 0
          };
        }

        if (pokemon.evolutions.next) {
          // Filter out evolutions from later generations
          pokemon.evolutions.next = pokemon.evolutions.next
            .filter(evolution => {
              const evolvedPokemon = getPokemonByName(evolution.name);
              return evolvedPokemon && isValidGeneration(evolvedPokemon.id, maxGeneration);
            })
            .map(evolution => processEvolutionWithVersions(pokemon, evolution, versions));
        }
      }

      return pokemon;
    });

  res.json({ pokemon: filtered });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
