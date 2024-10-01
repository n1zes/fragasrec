const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');
const cheerio = require('cheerio');

// Paths
const inputFolder = './public'; // Folder containing the HTML files
const outputFolder = './public/assets'; // Folder to save the downloaded resources

// Ensure output folder exists
fs.ensureDirSync(outputFolder);

// Function to download a resource and save it locally
const downloadResource = async (url, resourcePath) => {
    try {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        const response = await axios({
            url,
            responseType: 'arraybuffer'
        });
        fs.writeFileSync(resourcePath, response.data);
        console.log(`Downloaded: ${url} -> ${resourcePath}`);
    } catch (error) {
        console.error(`Failed to download ${url}: ${error.message}`);
    }
};

// Function to download and replace external resources in HTML
const processHTMLFiles = async () => {
    const files = fs.readdirSync(inputFolder).filter(file => file.endsWith('.html'));

    for (const file of files) {
        const filePath = path.join(inputFolder, file);
        console.log(`Processing: ${filePath}`);
        let htmlContent = fs.readFileSync(filePath, 'utf-8');

        const $ = cheerio.load(htmlContent);
        
        // List of tag attributes that commonly link to external resources
        const resources = [
            { tag: 'img', attr: 'src' },        // Images
            { tag: 'img', attr: 'data-src' },        // Images
            { tag: 'img', attr: 'data-srcset', delete: true },
            { tag: 'script', attr: 'src' },     // JavaScript
            { tag: 'link', attr: 'href' },      // Stylesheets and other linked resources
            { tag: 'iframe', attr: 'src' },     // Embedded content
            { tag: 'meta', attr: 'content' }
        ];

        // Loop through each resource type
        for (const resource of resources) {
            const elems = $(resource.tag).toArray()
            for (const elem of elems) {
                if (resource.delete) {
                    $(elem).removeAttr(resource.attr)
                    continue
                }
                const src = $(elem).attr(resource.attr);
                
                // Check if the resource URL is an external one
                if (src && /^https?:\/\//i.test(src)) {
                    try {
                        const resourceUrl = new URL(src);
                        const fileName = path.basename(resourceUrl.pathname);
                        const localResourcePath = path.join(outputFolder, fileName);
    
                        // Download the resource and save locally
                        await downloadResource(resourceUrl.href, localResourcePath);
    
                        // Update the resource path in HTML to point to the local file
                        const relativePath = path.relative(inputFolder, localResourcePath);
                        $(elem).attr(resource.attr, relativePath);
                    } catch (error) {
                        console.error(`Failed to process resource ${src}:`, error.message);
                    }
                }
            }
            
        }

        // Write the modified HTML back to file
        fs.writeFileSync(filePath, $.html());
        console.log(`Processed: ${filePath}`);
    }
};

// Start processing
processHTMLFiles()
    .then(() => console.log('All HTML files processed.'))
    .catch(err => console.error('Error processing HTML files:', err));
