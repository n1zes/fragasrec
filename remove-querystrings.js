const fs = require('fs');
const path = require('path');

let REPLACE_IN_FILE
async function replaceInFile() {
    if (!REPLACE_IN_FILE) {
        REPLACE_IN_FILE = await import('replace-in-file')
    }
    return REPLACE_IN_FILE.replaceInFile
}

// Folder path where the files are located
const folderPath = './public/b3b31b00-19cd-4067-9eda-739916b11a31';
const htmlFolderPath = './public'

// Function to remove query strings from filenames
function removeQueryString(fileName) {
    // If there's a "?", assume the query string starts from there
    const queryStringIndex = fileName.indexOf('?');
    return queryStringIndex > -1 ? fileName.slice(0, queryStringIndex) : fileName;
}

// Function to update all HTML files with new file names
async function updateHtmlFiles(oldFileName, newFileName) {
    
    try {
        const results = await (await replaceInFile())({
            files: path.join(htmlFolderPath, '*.html'),
            from: new RegExp(oldFileName, 'g'),  // Replace all occurrences of the old file name
            to: newFileName,
        });

        results.forEach(result => {
            if (result.hasChanged) {
                console.log(`Updated references in: ${result.file}`);
            }
        });
    } catch (error) {
        console.error('Error occurred while updating HTML files:', error);
    }
}

// Function to process files in the folder
function processFiles() {
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            return console.error('Could not read the folder:', err);
        }

        files.forEach(file => {
            const fullPath = path.join(folderPath, file);
            
            // Only process files, skip directories
            if (fs.statSync(fullPath).isFile()) {
                const newFileName = removeQueryString(file);

                if (file !== newFileName) {
                    // Rename the file (removing query string)
                    const newFilePath = path.join(folderPath, newFileName);

                    fs.rename(fullPath, newFilePath, (renameErr) => {
                        if (renameErr) {
                            return console.error(`Could not rename file ${file}:`, renameErr);
                        }

                        console.log(`Renamed: ${file} -> ${newFileName}`);

                        // Update the HTML files with the new file name
                        updateHtmlFiles(file, newFileName);
                    });
                }
            }
        });
    });
}

// Run the script
processFiles();
