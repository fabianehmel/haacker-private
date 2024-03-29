// node modules
const fs = require("fs");

// Internal Modules
const { Renderer } = require("./modules/Renderer");
const { Layer } = require("./modules/layers/Layer");
const { StrokedLayer } = require("./modules/layers/StrokedLayer");
const { FilledLayer } = require("./modules/layers/FilledLayer");
const { LevelLayer } = require("./modules/layers/LevelLayer");

// load the config from file
const CONFIG_FILE = process.argv[2] || "config";
let { config: CONFIG } = require(`./${CONFIG_FILE}`);

CONFIG.title = `map_${new Date(Date.now()).toISOString()}`;

const FOLDER_CONFIG_ARCHIVE = `./${CONFIG.filepaths.export}config-archive`;

// create renderer instance and hand config to it
const renderer = new Renderer(CONFIG);

// handle all the map layers
CONFIG.layers.forEach(function(layer) {
  // link renderer
  layer.properties.renderer = renderer;

  // build absolute filepath
  if (layer.properties.hasOwnProperty("path")) {
    layer.properties.path = CONFIG.filepaths.data + layer.properties.path;
  }

  // load data for single layers
  if (layer.properties.hasOwnProperty("data")) {
    layer.properties.data = JSON.parse(
      fs.readFileSync(CONFIG.filepaths.data + layer.properties.data, "utf8")
    );
  }

  // create layer object depending on layer type
  let layerObject;
  switch (layer.type) {
    case "levels":
      layerObject = new LevelLayer(layer.properties);
      break;
    case "filled":
      layerObject = new FilledLayer(layer.properties);
      break;
    case "stroked":
      layerObject = new StrokedLayer(layer.properties);
      break;
    default:
      layerObject = new Layer(layer.properties);
  }

  // render the layer
  layerObject.render();
});

if (!fs.existsSync(FOLDER_CONFIG_ARCHIVE)) {
  fs.mkdirSync(FOLDER_CONFIG_ARCHIVE);
}

fs.createReadStream(`./map-generation/${CONFIG_FILE}.js`).pipe(
  fs.createWriteStream(`${FOLDER_CONFIG_ARCHIVE}/${CONFIG.title}.js`)
);

// export the final png
renderer.exportPNG();
