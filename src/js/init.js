function checkLocalFile() {
    const loc = window.location.href;
    return loc.startsWith("file://") || loc.startsWith("http://localhost") || loc.startsWith("http://127.0.0.1");
}

function init() {
    const loc = window.location.href;
    const isLocalFile = checkLocalFile();

    // Check if the document has a valid doctype
    let hasValidDoctype = checkDoctype();

    if (!hasValidDoctype) {
        console.warn("Warning: This document does not have a <!DOCTYPE html> declaration.");
        addWarningFooter();
    }

    if (isLocalFile) {
        // Local file case: Include the DOCTYPE manually if necessary
        const pageContent = `<!DOCTYPE html>\n` + document.documentElement.outerHTML;

        fetch("https://validator.w3.org/nu/?out=json", {
            method: "POST",
            headers: {
                "Content-Type": "text/html; charset=utf-8"
            },
            body: pageContent
        })
        .then(response => response.json())
        .then(data => {
            renderValidationResults(data);
        })
        .catch(error => {
            console.warn(error);
            renderErrorFooter();
        });

    } else {
        // Hosted file case: Use URL-based validation
        fetch("https://validator.w3.org/nu/?out=json&doc=" + encodeURIComponent(loc), {
            method: "GET"
        })
        .then(response => response.json())
        .then(data => {
            renderValidationResults(data);
        })
        .catch(error => {
            console.warn(error);
            renderErrorFooter();
        });
    }
}

// Function to check if the document has a valid <!DOCTYPE html>
function checkDoctype() {
    if (document.doctype) {
        // Check if the name of the doctype is "html" (case-insensitive)
        return document.doctype.name.toLowerCase() === "html";
    }
    return false;
}

// Helper function to add a warning to the footer if <!DOCTYPE html> is missing
function addWarningFooter() {
    let footer = document.querySelector('footer');
    if (!footer) {
        footer = document.createElement('footer');
        document.body.appendChild(footer);
    }
    footer.innerHTML += `<div id="doctype-warning"><p><strong>Warning: The document is missing a <!DOCTYPE html> declaration. Validation results may not be accurate.</strong></p></div>`;
}

// Helper function to render validation results
function renderValidationResults(data) {
    // console.log(data);
    let isHTMLValid = data.messages.length === 0;

    let ValidatorHTML = `<div id="htmlcss"><p><strong>HTML/CSS`;
    if (!isHTMLValid) {
        ValidatorHTML += " NOT";
    }
    ValidatorHTML += ` Valid!</strong></p>`;
    ValidatorHTML += `
        <p>
            <a id="vLink1" href="https://validator.w3.org/check?uri=${window.location.href}">Validate HTML</a> |
            <a id="vLink2" href="https://jigsaw.w3.org/css-validator/validator?uri=${window.location.href}?profile=css3">Validate CSS</a>
        </p>
    `;
    let renderFooter = true;
    if (!isHTMLValid) {
        if (data['messages'][0]['type'] != 'error') {
            if (checkLocalFile()) {
                ValidatorHTML = `<p>Validation could not be performed due to an error: ` + data['messages'][0]['message'] + `</p>`;
            } else {
                console.warn(data['messages'][0]['message']);
                renderErrorFooter();
                renderFooter = false;
            }
        } else if (checkLocalFile()) {
            try {
                ValidatorHTML += `<p>There might be multiple errors. Here is the first one:</p>
                <table>
                    <tbody>
                        <tr>
                            <td><strong>Error Description</strong></td>
                        </tr>
                        <tr>
                            <td>` + data['messages'][0]['message'] + `</td>
                        </tr>
                        <tr>
                            <td><strong>Code</strong></td>
                        </tr>
                        <tr>
                        <td><code>${data['messages'][0]['extract'].replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;')}</code></td>
                        </tr>
                    </tbody>
                </table>`;
            } catch (error) {
                ValidatorHTML = `<p>Validation could not be performed due to an error: ` + error.message + `</p>`;
            }
        }
    }

    let footer = document.querySelector('footer');
    if (!footer) {
        footer = document.createElement('footer');
        document.body.appendChild(footer);
    }
    if (renderFooter) footer.innerHTML += ValidatorHTML;
}

// Helper function to render an error message in the footer
function renderErrorFooter() {
    let footer = document.querySelector('footer');
    if (!footer) {
        footer = document.createElement('footer');
        document.body.appendChild(footer);
    }
    if(window.location.href.startsWith("file://")) {
        if(window.location.href.split("/").length <= 8) {
            footer.innerHTML += `
            <div id="htmlcss">
                <p><strong>HTML/CSS validation could not be performed due to an error.</strong></p>
            </div>
        `;
        } else {
            footer.innerHTML += `
            <div id="htmlcss">
                <p><strong>HTML/CSS validation could not be performed due to an error.</strong></p>
                <a id="vLink3" href="../">Go Back</a>
            </div>
        `;
        }
    } else {
        if(window.location.href.split("/").length <= 4) {
            footer.innerHTML += `
            <div id="htmlcss">
                <p><strong>HTML/CSS validation could not be performed due to an error.</strong></p>
            </div>
        `;
        } else {
            footer.innerHTML += `
            <div id="htmlcss">
                <p><strong>HTML/CSS validation could not be performed due to an error.</strong></p>
                <a id="vLink3" href="../">Go Back</a>
            </div>
        `;
        }
    }
}



// Call the init function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);