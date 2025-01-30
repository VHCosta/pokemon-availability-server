const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const DATA_ROOT = path.join(__dirname, '../api-data/data');

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

let pokemonCache = [];

// Add method filtering configuration
const ALLOWED_METHODS = new Set([
  'gift',          // NPC gifts
  'wild',          // Wild encounters
  'surf',          // Surfing
  'old-rod',
  'good-rod',
  'super-rod',
  'headbutt',      // Tree headbutting
  'rock-smash'     // Rock smashing
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
          
          if (slot2Game && GAME_MAP[slot2Game]) {
            slot2Games.add(slot2Game);
          }
        }
      });
    });
  });

  return { games: Array.from(games), slot2: Array.from(slot2Games), methods: Array.from(methods) };
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

      return {
        id: mainData.id,
        name: mainData.name,
        ...processEncounters(encountersData),
        sprite: mainData.sprites.other['official-artwork'].front_default
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

app.post('/api/pokemon', (req, res) => {
  const { versions } = req.body;
  
  const filtered = pokemonCache.filter(p => {
    const directMatch = p.games.some(g => versions.includes(g));
    const slot2Match = p.slot2.some(s => versions.includes(s));
    return directMatch || slot2Match;
  }).map(p => ({
    ...p,
    games: [...new Set([
      ...p.games.filter(g => versions.includes(g)),
      ...p.slot2.filter(s => versions.includes(s))
    ])]
  }));

  res.json({ pokemon: filtered });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

//proxy server
app.get('/api/v2/:resource/:id', (req, res) => {
  const { resource, id } = req.params;
  const filePath = path.join(DATA_ROOT, `api/v2/${resource}/${id}/index.json`);
  console.log("proxy server logic");
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});