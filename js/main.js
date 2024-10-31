// Initialize GLOBAL variables
let selArt_ref = [];
let availableLinks = []; // Store available links to convert

// Initialize selected link types and target context
let selectedLinkTypes = [];
let targetContext = "base"; // default context
let selectAllLinks = false; // new option for selecting all links

RM.Event.subscribe(RM.Event.ARTIFACT_SELECTED, onSelection); // Use the RM library to deal with DNG

function onSelection(artifacts) {
    selArt_ref = artifacts;
    // alert("Selected artifact: " + JSON.stringify(selArt_ref[0]));
}

function adjustHeight() {
    gadgets.window.adjustHeight();
}

function onBodyLoad() {
    loadLanguage(); // Load the text according to the language file set in main.xml

    var ro = new ResizeObserver(entries => {
        adjustHeight();
    });

    ro.observe(document.getElementById('button1')); // adjustHeight() is also called when the user changes the width of the main button (i.e., the width of the widget)
    adjustHeight(); // Update the height since we updated the UI with loadLanguage();
}

function show_instructions() {
    let instructions_div = document.getElementById('instructions_div');
    let instructions_button = document.getElementById('instructions_button');

    if (instructions_div.style.display == 'none') {
        instructions_div.style.display = "block";
        instructions_button.innerHTML = 'Hide Instructions';
    } else {
        instructions_div.style.display = "none";
        instructions_button.innerHTML = 'Show Instructions';
    }

    adjustHeight();
}

function show_settings() {
    let settings_div = document.getElementById('settings_div');
    let settings_button = document.getElementById('settings_button');

    if (settings_div.style.display == 'none') {
        settings_div.style.display = "block";
        settings_button.innerHTML = 'Hide Settings';
    } else {
        settings_div.style.display = "none";
        settings_button.innerHTML = 'Show Settings';
    }

    adjustHeight();
}

function readLinksButton_onclick() {
    document.getElementById("str010").style.display = "block";
    if (selArt_ref == undefined || selArt_ref.length == 0) {
        setContainerText("container", 'No text artifact selected.');
        return;
    }

    RM.Data.getAttributes(selArt_ref, function(res) {
        if (res.code === RM.OperationResult.OPERATION_OK && res.data.length > 0) {
            let title_array = [];
            for (let i = 0; i < res.data.length; i++) {
                if (res.data[i].values['http://www.ibm.com/xmlns/rdm/types/ArtifactFormat'] == 'Text') {
                    let title = res.data[i].values["http://purl.org/dc/terms/title"];
                    if (title != null) {
                        title_array.push(title);
                    }
                }
            }
            setContainerText("container", title_array);
        } else {
            setContainerText("container", 'No text artifact selected.');
        }

        // Fetch links for the selected artifact
        readLinks(selArt_ref);
        
    });
}

function readLinks(artifacts) {
    artifacts.forEach(artifact => {
        if (!artifact.moduleUri) {
            console.error('Module URI not found for artifact:', artifact);
            setContainerText("container", 'Module URI not found for selected artifact.');
            return;
        }

        getLinks(artifact).then(links => {
            availableLinks = links;
            // alert("Available links: " + JSON.stringify(availableLinks));
            displayLinkOptions(links);
        }).catch(error => {
            console.error('Error fetching links:', error);
            setContainerText("container", 'Error fetching links. Please check the artifact URI or permissions.');
        });
    });
}

function displayLinkOptions(links) {
    let containerHTML = '<form id="linkOptionsForm">';
    links.forEach((link, index) => {
        // console.log('Link:', link);
        // console.log(JSON.stringify(link));
        // Shallow copy of the link object
        let linkTypeString = link.linktype;
        // linkType = link.linktype;
        if (typeof link.linktype === 'object') {
            // alert("Link type is an object: " + JSON.stringify(linkType));
            linkTypeString = link.linktype.uri.split('/').pop();
        } else {
            linkTypeString = link.linktype;
        }
        // Check if there is Baselinks in the link
        // Split the URL by '/' and get the last part
        const lastPart = link.art.uri.split('/').pop();
        // Check if the last part starts with 'TX'
        if (lastPart.startsWith('TX')) {
            console.log('Baselink found -> skipping.');
        } else { 
            // containerHTML += `<input type="checkbox" id="link_${index}" name="link" value="${index}"> ${link.linktype} - ${link.targets.map(target => target.uri).join(', ')}<br>`;
            containerHTML += `<input type="checkbox" id="link_${index}" name="link" value="${index}"> ${linkTypeString}<br>`;
        }
    });
    containerHTML += '<input type="checkbox" id="selectAllLinksCheckbox" onclick="toggleSelectAllLinks()"> Select All Links<br>';
    containerHTML += '</form>';
    console.log(containerHTML);
    setContainerText("container", containerHTML);
}

function convertLinksButton_onclick() {
    const selectedLinks = getSelectedLinks();
    console.log('Selected links:', selectedLinks);
    if (selectedLinks.length === 0) {
        setContainerText("container", 'No links selected for conversion.');
        return;
    }

    selectedLinks.forEach(linkIndex => {
        const link = availableLinks[linkIndex];
        // alert("Selected link: " + JSON.stringify(link.linktype));
        existingStartUri = link.art.uri;
        existingTargetUri = link.targets[0].uri;
        moduleUri = link.art.moduleUri;
        componentUri = selArt_ref[0].componentUri;
        format = selArt_ref[0].format;
        linkType = link.linktype;
        
        getModuleBinding(moduleUri, existingStartUri, existingTargetUri).then(boundArtifactData => {
            const baseStartUri = getBoundArtifactUri(existingStartUri, boundArtifactData);

            const baseTargetUri = getBoundArtifactUri(existingTargetUri, boundArtifactData);

            const baseStartRef = new RM.ArtifactRef(baseStartUri,componentUri,null,format);
            const baseTargetRef = new RM.ArtifactRef(baseTargetUri,componentUri,null,format);
            
            updateLinkContext(baseStartRef, linkType, baseTargetRef);
        }).catch(error => {
            console.error('Error fetching module binding for link target:', error);
        });
    });
    setContainerText("container", `Converted ${selectedLinks.length} links.`);
}

function getSelectedLinks() {
    const form = document.getElementById('linkOptionsForm');
    console.log(form);
    const checkboxes = form.elements['link'];
    const selectedLinks = [];

    // Ensure checkboxes is always treated as an array
    const checkboxesArray = checkboxes.length !== undefined ? checkboxes : [checkboxes];

    // alert("Checkboxes: " + checkboxesArray.length);
    for (let i = 0; i < checkboxesArray.length; i++) {
        // alert("Checkbox: " + checkboxesArray[i]);
        if (checkboxesArray[i].checked) {
            selectedLinks.push(parseInt(checkboxesArray[i].value));
        }
    }
    return selectedLinks;
}

function setContainerText(containerId, string) {
    document.getElementById(containerId).innerHTML = string;
    adjustHeight();
}

function getModuleBinding(moduleUri) {
    return new Promise((resolve, reject) => {
        fetch(`${moduleUri}/structure`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'DoorsRP-Request-Type': 'public 2.0'
            },
            credentials: 'include'
        }).then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch module binding. Response status: ' + response.status);
            }
            return response.json();
        }).then(data => {
            resolve(data);
        }).catch(error => {
            console.error('Error fetching module binding:', error);
            reject('Error fetching module binding.');
        });
    });
}

function getBoundArtifactUri(artifactUri, moduleBindings) {
    const binding = moduleBindings.find(item => item.uri === artifactUri);
    if (binding && binding.boundArtifact) {
        return binding.boundArtifact;
    } else {
        throw new Error('No bound artifact found for the given artifact URI.');
    }
}

function getLinks(artifact, context) {
    return new Promise((resolve, reject) => {
        RM.Data.getLinkedArtifacts(artifact, function(response) {
            if (response && response.code === RM.OperationResult.OPERATION_OK) {
                resolve(response.data.artifactLinks);
            } else {
                console.error('Error fetching links. Response:', response);
                reject('Error fetching links. Please check the artifact URI or ensure the context is correct.');
            }
        });
    });
}

function updateLinkContext(start, linkType, target) {
    // RM.Data.createLink(start, RM.Data.LinkTypes.LINK_TO, target, function(response) {
    RM.Data.createLink(start, linkType, target, function(response) {
        if (response.code !== RM.OperationResult.OPERATION_OK) {
            console.error('Error creating link:', response);
        } else {
            console.log('Successfully created link between:', art1, 'and', target);
        }
    });
}

function toggleSelectAllLinks() {
    selectAllLinks = !selectAllLinks;
    const checkboxes = document.getElementsByName('link');
    for (let i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = selectAllLinks;
    }
}

