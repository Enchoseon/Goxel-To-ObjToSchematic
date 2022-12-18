"use strict";

// =======
// Imports
// =======

const fs = require("fs");
const path = require("path");
const yargs = require("yargs");

const { processObj } = require("./util/processObj.js");
const objToSchematic = require("./util/objToSchematic.js");

// ===================
// Argument Validation
// ===================

// Get arguments
const argv = yargs.option("inputFile", {
    alias: "input",
    description: "The path to the .obj file exported by Goxel that we want to process.",
    type: "string"
}).option("outputPath", {
    alias: "output",
    default: "./",
    description: "The path to the directory the fixed .obj and .mtl files will be placed.",
    type: "string"
}).option("trimUselessData", {
    alias: "trim",
    description: "Whether to remove data that's useless for ObjToSchematic (e.g. vertex normals, texture coordinates, etc.)",
    type: "boolean"
}).option("rotationFix", {
    alias: "rot",
    description: "Whether to rotate the object -90 degrees along the x-axis to fix Goxel's exporting.",
    type: "boolean"
}).option("objToSchematicPath", {
    alias: "vox",
    description: "Path to ObjToSchematic (e.g. `./ObjToSchematic`). If provided, will overwrite the headless-config.ts (e.g. `./ObjToSchematic/tools/headless-config.ts`) and create a Bash script to execute it in `./voxelize.sh`.",
    type: "string"
}).option("objToSchematicFormat", {
    alias: "voxFormat",
    default: "litematic",
    description: "What type of file to create (valid options: 'litematic', 'obj', 'schematic')",
    type: "string"
})
.demandOption([ "inputFile" ])
.help()
.alias("help", "h").argv;

// Make sure every path is valid
if (!fs.statSync(argv.inputFile).isFile()) {
    console.error(`"${argv.inputFile}" is not a valid file!`);
    process.kill(0);
}
if (!fs.statSync(argv.outputPath).isDirectory()) {
    console.error(`"${argv.outputPath}" is not a valid directory!`);
    process.kill(0);
}
if (argv.objToSchematicPath) {
    if (!fs.statSync(argv.objToSchematicPath).isDirectory()) {
        console.error(`"${argv.objToSchematicPath}" is not a valid directory!`);
        process.kill(0);
    }
}

// Make sure objToSchematicFormat is valid
if (["obj", "litematic", "schematic"].indexOf(argv.objToSchematicFormat) === -1) {
    console.error(argv.objToSchematicFormat + " is not a valid format for ObjToSchematic!");
}

// Resolve to absolute paths
argv.inputFile = path.resolve(argv.inputFile);
argv.outputPath = path.resolve(argv.outputPath);
if (argv.objToSchematicPath) {
    argv.objToSchematicPath = path.resolve(argv.objToSchematicPath);
}

// Remove prior .obj and .mtl files
[ ".obj", ".mtl" ].forEach((extension) => {
    const path = argv.outputPath + "/output" + extension;
    if (fs.existsSync(path)) {
        fs.unlinkSync(path);
    }
});

// =======================
// Process Input .Obj File
// =======================

processObj(argv).then((maxHeight) => {
    if (argv.objToSchematicPath) { // ObjToSchematic Integration
        objToSchematic.createConfig(maxHeight, argv.objToSchematicPath, argv.objToSchematicFormat, argv.outputPath);
    }
});
