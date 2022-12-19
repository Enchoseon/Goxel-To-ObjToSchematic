// =======
// Imports
// =======

const fs = require("fs");

// =========
// Functions
// =========

/**
 * Create a headless-config.ts file for LucasDower/ObjToSchematic for perfect 1:1 NCRB voxelization
 * @param {integer} maxHeight 
 * @param {string} objToSchematicPath 
 * @param {string} objToSchematicFormat
 * @param {string} outputPath
 */
function createConfig(maxHeight, objToSchematicPath, objToSchematicFormat, outputPath) {
    console.log("Creating config for " + objToSchematicPath);
    let extension = objToSchematicFormat;
    if (objToSchematicFormat === "schematic") { // Special exception for schematic firles
        extension = "schem"
    }
    fs.writeFileSync(objToSchematicPath + "/tools/headless-config.ts", `
        import { TextureFiltering } from '../src/texture';
        import { ColourSpace } from '../src/util';
        import { THeadlessConfig } from './headless';

        export const headlessConfig: THeadlessConfig = {
            import: {
                filepath: '` + outputPath + `/output.obj'
            },
            voxelise: {
                constraintAxis: 'y',
                voxeliser: 'ncrb',
                size: ` + maxHeight + `,
                useMultisampleColouring: false,
                voxelOverlapRule: 'average',
                enableAmbientOcclusion: false
            },
            assign: {
                textureAtlas: 'vanilla',
                blockPalette: 'all-release',
                dithering: 'random',
                colourSpace: ColourSpace.RGB,
                fallable: 'replace-falling',
                resolution: 32,
                calculateLighting: true,
                lightThreshold: 0,
                contextualAveraging: true,
                errorWeight: 0.0
            },
            export: {
                filepath: '` + outputPath + `/output.` + extension + `',
                exporter: '` + objToSchematicFormat + `'
            },
            debug: {
                showLogs: true,
                showWarnings: true,
                showTimings: true
            },
        };
    `, { flags: "w" });
    fs.writeFileSync("./voxelize.sh", `
        #!/bin/bash
        cd "` + objToSchematicPath + `"
        npm run build
        npm run headless
    `, { flags: "w" });
}

// =======
// Exports
// =======

module.exports = {
	createConfig
}