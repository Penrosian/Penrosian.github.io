function init() {
    const loc = window.location.href;
    const isLocalFile = loc.startsWith("file://");

    // Check if the document has a valid doctype
    let hasValidDoctype = checkDoctype();

    if (!hasValidDoctype) {
        console.warn("Warning: This document does not have a <!DOCTYPE html> declaration.");
        addWarningFooter();
    }

    if (isLocalFile) {
        // Local file case: Include the DOCTYPE manually if necessary
        const pageContent = `<!DOCTYPE html>\n` + document.documentElement.outerHTML;

        fetch("https://html5.validator.nu/?out=json", {
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
        fetch("https://html5.validator.nu/?out=json&doc=" + encodeURIComponent(loc), {
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
    var fragment = create('<link href="src/image/favicon.ico" rel="shortcut icon" type="image/x-icon"></link>');
    // You can use native DOM methods to insert the fragment:
    document.body.insertBefore(fragment, document.head.childNodes[0]);
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
    console.log(data);
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
    if(window.location.href.startsWith("file://") && !isHTMLValid) {
        ValidatorHTML += `<p>There might be multiple errors. Here is the first one:</p>
        <table>
        <thead>
        <tr>
        <th>Code</th>
        <th>Error Description</th>
        </tr>
        </thead>
        <tbody>
        <tr>
        <td><code>${data['messages'][0]['extract'].replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;')}</code></td>
        <td>` + data['messages'][0]['message'] + `</td> 
        </tr>
        </tbody>
        </table>`
        
        }

    let footer = document.querySelector('footer');
    if (!footer) {
        footer = document.createElement('footer');
        document.body.appendChild(footer);
    }
    footer.innerHTML += ValidatorHTML;
}

// Helper function to render an error message in the footer
function renderErrorFooter() {
    let footer = document.querySelector('footer');
    if (!footer) {
        footer = document.createElement('footer');
        document.body.appendChild(footer);
    }
    footer.innerHTML += `
        <div id="htmlcss">
            <p><strong>HTML/CSS validation could not be performed due to an error.</strong></p>
        </div>
        `;
}
function create(htmlStr) {
    var frag = document.createDocumentFragment(),
        temp = document.createElement('div');
    temp.innerHTML = htmlStr;
    while (temp.firstChild) {
        frag.appendChild(temp.firstChild);
    }
    return frag;
}



// Call the init function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);