// =======
// Imports
// =======

const fs = require("fs");

const readline = require("readline");
const { createHash } = require("crypto");

// ===========
// Global Vars
// ===========

let materials = { /* "${RGB_HASH}": ${VERTEX_INDEX_ARRAY} } */ }; // Stores every created material and its respective vertices
let vertexIndex = 0; // The current index of the vertex being processed
let currentMaterial; // The current material being applied to the faces
let maxBlock = 0; // The tallest block found in the model (used for accurate NCRB voxelization)
let minBlock = 0; // The lowest block found in the model (used for accurate NCRB voxelization)

// =======================
// Process Input .Obj File
// =======================

/**
 * Process object using given arguments
 * @param {object} argv 
 * @param {string} argv.inputFile
 * @param {string} argv.outputPath
 * @param {boolean} argv.trimUselessData
 * @param {boolean} argv.rotationFix
 * @param {string} argv.objToSchematicPath
 * @returns The maximum height (after successfully creating the new .obj file)
 */
async function processObj(argv) {
    console.log("Processing: " + argv.inputFile);
    const file = readline.createInterface({
        input: fs.createReadStream(argv.inputFile),
        output: process.stdout,
        terminal: false
    });
    file.on("line", (line) => {
        line = processLine(line, argv);
        if (line) {
            fs.appendFileSync(argv.outputPath + "/output.obj", line + "\n")
        }
    });
    return new Promise(resolve => { 
        file.on("close", () => {
            console.log("Done");
            resolve(Math.abs(maxBlock) + Math.abs(minBlock));
        });
    });
}

// =========
// Functions
// =========

/**
 * Process line using given arguments
 * @param {string} line
 * @param {string} argv.inputFile
 * @param {string} argv.outputPath
 * @param {boolean} argv.trimUselessData
 * @param {boolean} argv.rotationFix
 * @param {string} argv.objToSchematicPath
 * @returns The modified line
 */
function processLine(line, argv) {
    const lineType = line.split(" ")[0];
    switch (lineType) {
        case "v": // Process vertices
            vertexIndex++;
            const rgb = line.split(" ").splice(4); // Explanation: Goxel's vertex format is `x, y, z, r, g, b`
            const rgbHash = hash(rgb.join(" "));
            if (typeof materials[rgbHash] === "undefined") { // Create material for this rgb value if it doesn't exist
                materials[rgbHash] = [];
                fs.appendFileSync(argv.outputPath + "/output.mtl", `
                    newmtl ${rgbHash}
                    Kd ${rgb[0]} ${rgb[1]} ${rgb[2]}
                    Ns 250.000000
                    Ks 0.500000 0.500000 0.500000
                    Ke 0.000000 0.000000 0.000000
                    Ni 1.450000
                    d 1.000000
                    illum 2
                `.replace(/\s{4,}/g, "\n").trim() + "\n"); // (I refuse to change my indentation)
            }
            materials[rgbHash].push(vertexIndex);
            line = line.split(" "); // Separate the line into individual arguments
            if (argv.trimUselessData) {
                line = line.slice(0, 4); // Remove vertex color info
            }
            if (argv.rotationFix) { // Rotate -90 degress along x-axis
                let temp = line[2];
                line[2] = line[3];
                line[3] = -temp;
            }
            line[2] = parseInt(line[2]); // Get maximum height (used to set the height for NCRB voxelization)
            if (line[2] > maxBlock) {
                maxBlock = line[2];
            } else if (line[2] < minBlock) { // Get minimum height (used to set the height for NCRB voxelization)
                minBlock = line[2];
            }
            line = line.join(" ") // Combine individual arguments back into a line
            break;
        case "#": // Add material file below the "# Goxel <version>" comment
            if (line.startsWith("# Goxel ")) {
                line += "\nmtllib output.mtl";
            }
            break;
        case "f": // Assign the appropriate material to each face
            const firstVertexIndex = parseInt(line.split("//")[0].slice(2)); // Explanation: Each face is made of 4 vertices, but since they all share the same material we just grab the first one
            if (argv.trimUselessData) {
                line = line.replace(/(\/\/)\w+/g, "");
            }
            for (let material in materials) {
                if (materials[material].indexOf(firstVertexIndex) !== -1) {
                    if (material !== currentMaterial) { // Don't set the material unless we have to
                        line = "usemtl " + material + "\n" + line;
                    }
                    currentMaterial = material;
                }
            }
            break;
        case "vn":
        case "vt": // Don't add these lines to the new .obj file
            if (argv.trimUselessData) {
                return false;
            }
            break;
    }
    return line;
}

/**
 * Generate a tiny hash of a string (https://stackoverflow.com/a/67073856)
 * @param {string} input 
 * @returns 8-character shake256 hash
 */
function hash(input) {
    return createHash("shake256", { outputLength: 8 })
        .update(input)
        .digest("hex");
}

// =======
// Exports
// =======

module.exports = {
	processObj
}