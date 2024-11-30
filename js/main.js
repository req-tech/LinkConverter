// Initialize GLOBAL variables
const widgetHandler = {
    selArtRef: [],
    availableLinks: [],
    targetContext: "base", // default context
    selectAllLinks: false,
};

const linkDir = 'inlinks'; // Default link direction

let run = true;
// Allow to stop long lasting Module search operaion
function stopRun() {
    run = false;
}

// Subscribe to artifact selection event
RM.Event.subscribe(RM.Event.ARTIFACT_SELECTED, onSelection);

// Function to handle artifact selection event
function onSelection(artifacts) {
    widgetHandler.selArtRef = artifacts || [];
}

// Function to adjust the window height
function adjustHeight() {
    gadgets.window.adjustHeight();
}

// Function to execute when body loads
function onBodyLoad() {
    loadLanguage(); // Load the text according to the language file set in main.xml
    adjustHeight();
}

// display the instructions on/off
function show_instructions() {
    // instructions is not visible toggle on, if visible toggle off
    if (document.getElementById("instructions_div").style.display === "none") {
        toggleElementVisibility('instructions_div', 'block');
    } else {
        toggleElementVisibility('instructions_div', 'none');
    }
}

// display the instructions on/off
function show_settings() {
    // instructions is not visible toggle on, if visible toggle off
    if (document.getElementById("settings_div").style.display === "none") {
        toggleElementVisibility('settings_div', 'block');
    } else {
        toggleElementVisibility('settings_div', 'none');
    }
}

// Function to programmatically click the right panel button
function clickRefreshButton() {
    // Select the button using its Title attribute
    const buttonElement = top.document.querySelector('[title="Refresh"]');
    // console.log(buttonElement);
    buttonElement.click();
    // console.log("Clicked button with dynamic ID:", buttonElement.id);
    location.reload();
}

// Function to show or hide HTML elements
function toggleElementVisibility(elementId, displayStyle) {
    const element = document.getElementById(elementId);
    if (element) {
        console.log(`Toggling visibility of ${element.style.display} to ${displayStyle} for ${elementId}`);
        element.style.display = displayStyle;
        adjustHeight();
    } else {
        console.error(`${elementId} not found`);
    }
}

// Function to toggle the visibility of a div and update button text
function toggleVisibility(divId, buttonId, showText, hideText) {
    const div = document.getElementById(divId);
    const button = document.getElementById(buttonId);
    if (div.classList.contains("hidden")) {
        div.classList.remove("hidden");
        button.innerHTML = hideText;
    } else {
        div.classList.add("hidden");
        button.innerHTML = showText;
    }
    adjustHeight();
}


// Function to read links of selected artifacts
async function readLinks(artifacts) {
    for (const artifact of artifacts) {
        if (!artifact.moduleUri) {
            console.error('Module URI not found for artifact:', artifact);
            setContainerText("container", 'Module URI not found for selected artifact.');
            continue;
        }
        try {
            const links = await getLinksDirection(artifact, linkDir);
            widgetHandler.availableLinks.push(...links);
        } catch (error) {
            console.error('Error fetching links:', error);
            setContainerText("container", 'Error fetching links. Please check the artifact URI or permissions.');
        }
    }
    displayLinkOptions(widgetHandler.availableLinks);  
}

// Function to display link options as checkboxes
function displayLinkOptions(links) {
    toggleElementVisibility('linkContainer', 'block');
    const linkContainer = document.getElementById("linkContainer");
    const form = document.createElement("form");
    form.id = "linkOptionsForm";

    const linkTypeCount = {};
    links.forEach((link, index) => {
        // if (link.art.moduleUri != null && link.linktype.direction !== '_OBJ') { // SUB for outgoing links OBJ for incoming links
            // Add the original index to the link object
            link.originalIndex = index;

            let linkTypeString = typeof link.linktype === 'object' ? link.linktype.uri.split('/').pop() : link.linktype;
            console.log('LinkType:', linkTypeString);
            // Alias names to show in the UI
            linkTypeString = linkTypeString === 'Link' ? 'Link To' : linkTypeString;
            linkTypeString = linkTypeString === 'satisfaction' ? 'Satisfied' : linkTypeString;

            if (!linkTypeCount[linkTypeString]) {
                linkTypeCount[linkTypeString] = [];
            }
            linkTypeCount[linkTypeString].push(link);
        // }
    });
    console.log('LinkTypeCount:', JSON.stringify(linkTypeCount));
    // Indexing over all artifacts 
    Object.entries(linkTypeCount).forEach(([linkType, linkGroup], index) => {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `link_${index}`;
        checkbox.name = "link";
        // Store all original indices of the links of the same type
        checkbox.value = linkGroup.map(link => link.originalIndex).join(",");
        checkbox.classList.add("bx--checkbox");
        checkbox.style.width = "15px";
        checkbox.style.height = "15px";
        checkbox.style.position = "initial";
        checkbox.style.margin = "0px 5px 0px 0px";
        checkbox.addEventListener("click", (e) => {
            e.stopPropagation();
            updateSelectAllCheckboxState();
        });

        const label = document.createElement("label");
        label.htmlFor = `link_${index}`;
        label.classList.add("bx--checkbox-label-text");   
        label.innerHTML = ` ${linkType} (${linkGroup.length})`;
        label.style.fontSize = "12px";
        label.style.verticalAlign = "top";

        const lineBreak = document.createElement("br");

        form.appendChild(checkbox);
        form.appendChild(label);
        form.appendChild(lineBreak);
    });

    if (Object.keys(linkTypeCount).length > 1) {
        const selectAllCheckbox = document.createElement("input");
        selectAllCheckbox.type = "checkbox";
        selectAllCheckbox.id = "selectAllLinksCheckbox";
        selectAllCheckbox.onclick = toggleSelectAllLinks;
    
        const selectAllLabel = document.createElement("label");
        selectAllLabel.htmlFor = "selectAllLinksCheckbox";
        selectAllLabel.innerHTML = " Select All Links";
        selectAllLabel.style.fontSize = "12px";
    
        const selectAllLineBreak = document.createElement("br");
    
        form.appendChild(selectAllCheckbox);
        form.appendChild(selectAllLabel);
        form.appendChild(selectAllLineBreak);
    }

    if (form.children.length === 0) {
        widgetHandler.availableLinks = [];
    }

    linkContainer.innerHTML = "";
    linkContainer.appendChild(form);

    // set default button off
    const wholeModuleButtton = document.getElementById("readWholeModuleButtonOnClick");
    if (wholeModuleButtton) {
        wholeModuleButtton.classList = "bx--btn bx--btn--default bx--btn--md";
    }

    adjustHeight();
    return form.length; 
}

// Function to handle the Convert Links button click
async function convertLinksButtonOnClick(removeModuleLinks) {

    let actionVerb = removeModuleLinks ? 'Converted' : 'Created';
    // Get selected links
    const nodeList = document.querySelectorAll('#linkOptionsForm input[name="link"]');

    const checkboxes = [];
    
    for (let i = 0; i < nodeList.length; i++) {
        if (nodeList[i].checked) {
            checkboxes.push(nodeList[i]);
        }
    }
    
    // Now checkboxes array contains all the checked checkboxes
    const selectedLinks = checkboxes.map(checkbox => checkbox.value);
    // getSelectedLinks();
    // return 
    if (selectedLinks.length === 0) {
        setContainerText("statusContainer", 'No links selected for conversion.');
        return;
    }
    setContainerText("statusContainer", 'Processing Links...');

    let successfulConversions = 0;

    for (const selectedGroup of selectedLinks) {
        const linkIndices = selectedGroup.split(",").map(Number);
        console.log('LinkIndices:', JSON.stringify(linkIndices));
       
        
        for (const linkIndex of linkIndices) {
            const link = widgetHandler.availableLinks[linkIndex];
            const { art: { uri: existingStartUri, moduleUri }, targets, linktype } = link;
            console.log('Converting link:', JSON.stringify(link));
            // if linktype is object create RM.LinkTypeDefinition
            let linktypeDng;
            if (typeof linktype === 'object') {
                linktypeDng = new RM.LinkTypeDefinition( linktype.uri, linktype.direction ) ;
            } else {
                linktypeDng = linktype;
            }

            const existingTargetUri = targets[0]?.uri;
            const targetModuleUri = targets[0]?.moduleUri;
            const { componentUri, format } = link.art;

            if (existingTargetUri === existingStartUri) {
                console.error('Link target is same as source. Skipping link:', JSON.stringify(link));
                continue;
            }

            if (!existingTargetUri) {
                console.error('No target URI found for link:', JSON.stringify(link));
                continue;
            }

            try {
                const startBoundArtifactData = await getModuleBinding(moduleUri);
                const baseStartUri = getBoundArtifactUri(existingStartUri, startBoundArtifactData);
                // if targetModuleUri is null we handle Twisted Link case 
                // Link starts from Module but links to base artifact
                let baseTargetUri;
                if (targetModuleUri !== null) {
                    const targetBoundArtifactData = await getModuleBinding(targetModuleUri);
                    baseTargetUri = getBoundArtifactUri(existingTargetUri, targetBoundArtifactData);
                } else {
                    baseTargetUri = existingTargetUri;
                }
                const baseStartRef = new RM.ArtifactRef(baseStartUri, componentUri, null, format);
                const baseTargetRef = new RM.ArtifactRef(baseTargetUri, componentUri, null, format);
                console.log('Base start Uri:', baseStartUri, ' Link Type;', JSON.stringify(linktype),' Target Uri:', baseTargetUri);
                // console.log('Check if Baselinks exists alreasy for Link type:', linktype);

                // Check if Baselink is already present
                await getLinksRaw(baseStartRef).then(async (response) => {
                    let linkExists = false;
                    // console.log('ResponseLenght' + response.length );
                    for (let i = 0; i < response.length; i++) { 
                        
                        // Loop through all targets of the base artifact to check if the link already exists
                        // targets not necessarily exist in all links
                        console.log('Response' + i, " ", response[i], 'with base target:', baseTargetUri); 

                        for (let j = 0; j < response[i].targets.length; j++) {
                            if (!response[i].targets[j] || !response[i].targets[j].uri) {
                                // Skip this iteration if targets[j] or targets[j].uri is not defined
                                continue;
                            }
                            
                            let modulelt = linktype;
                            if (typeof modulelt === 'object') {
                                modulelt = modulelt.uri;
                            }
                            let baselt = response[i].linktype;
                            if (typeof baselt === 'object') {
                                baselt = baselt.uri;
                            }
                            console.log('TargetsLenght' + response[i].targets.length + 
                                ' Checking link:', response[i].targets[j].uri, 'with base target:', baseTargetUri,
                                'Module LinkType:', modulelt, 'Base LinkType:', baselt); 
                            // If Base link already exists with same linktype, skip creation
                            if ( response[i].targets[j].uri === baseTargetUri && baselt === modulelt) {
                                linkExists = true;
                                console.log('Base link already exists, skipping creation:', response[i].targets[j].uri, 'with base target:', baseTargetUri);
                                break;
                            }   
                        }
                    }
                    if (!linkExists) {
                        // const linktypeDng = new RM.LinkTypeDefinition( linktype.uri, linktype.direction ) ;
                        console.log('Creating Linktype.', linktypeDng);
                        await updateLinkContext(baseStartRef, linktypeDng, baseTargetRef);
                    }
                });
                
            } catch (error) {
                console.error('Error creating base links or fetching module binding for link target:', error);
                continue;
            }
            
            if (removeModuleLinks) {
                try {
                    const startRef = new RM.ArtifactRef(existingStartUri, componentUri, moduleUri, format);
                    const targetRef = new RM.ArtifactRef(existingTargetUri, componentUri, targetModuleUri, format);

                    await deleteModuleLinks(startRef, linktypeDng, targetRef);
                } catch (error) {
                    console.error('Error deleting module links:', error);
                }
            }

            successfulConversions++;
        }
    }

    const statusMessage = `${actionVerb} ${successfulConversions} links out of ${selectedLinks.length} link types successfully.`;
    setContainerText("statusContainer", statusMessage);
     
    toggleElementVisibility('reloadContainer', 'block');
    toggleElementVisibility('convertButtonContainer', 'none');
    // Empty the link container
    const linkContainer = document.getElementById("linkContainer");
    linkContainer.innerHTML = "";
}

// Function to update link context
async function updateLinkContext(start, linkType, target) {
    return new Promise(async (resolve, reject) => {
        try {
            await RM.Data.createLink(start, linkType, target, function(response) {
                if (response.code !== RM.OperationResult.OPERATION_OK) {
                    console.error('Error creating link:', response);
                    reject(response);
                } else {
                    console.log('Successfully created link between:', start, 'and', target);
                    resolve();
                }
            });
        } catch (error) {
            console.error('Error in createLink:', error);
            reject(error);
        }
    });
}

// Function to delete module links
async function deleteModuleLinks(start, linkType, target) {
    return new Promise(async (resolve, reject) => {
        try {
            await RM.Data.deleteLink(start, linkType, target, function(response) {
                if (response.code !== RM.OperationResult.OPERATION_OK) {
                    console.error('Error deleting link:', response);
                    reject(response);
                } else {
                    console.log('Successfully deleted link between:', start, 'and', target);
                    resolve();
                }
            });
        } catch (error) {
            console.error('Error in deleteLink:', error);
            reject(error);
        }
    });
}

// Function to get selected links
function getSelectedLinks() {
    const checkboxes = Array.from(document.querySelectorAll('#linkOptionsForm input[name="link"]:checked'));
    return checkboxes.map(checkbox => checkbox.value);
}

// Function to set container text
function setContainerText(containerId, string) {
    const container = document.getElementById(containerId);
    container.innerHTML = string;
    adjustHeight();
}

// Function to get module binding
async function getModuleBinding(moduleUri) {
    try {
        const response = await fetch(`${moduleUri}/structure`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'DoorsRP-Request-Type': 'public 2.0'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch module binding. Response status: ' + response.status);
        }
        return response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

// Function to get bound artifact URI
function getBoundArtifactUri(artifactUri, moduleBindings) {
    const binding = moduleBindings.find(item => item.uri === artifactUri);
    if (binding && binding.boundArtifact) {
        return binding.boundArtifact;
    } else {
        throw new Error('No bound artifact found for the given artifact URI.');
    }
}
// FunctiongetLinksRaw that just returns the links
function getLinksRaw(artifact) {
    return new Promise(async (resolve, reject) => {
        try {
            await RM.Data.getLinkedArtifacts(artifact, function(response) {
                if (response && response.code === RM.OperationResult.OPERATION_OK) {
                    const links = response.data.artifactLinks;
                    if (!links || links.length === 0) {
                        resolve([]); // No links found
                    } else {
                        resolve(links);
                    }
                } else {
                    reject('Error fetching links. Please check the artifact URI or ensure the context is correct.');
                }
            });
        } catch (error) {
            console.error('Error in getLinkedArtifacts:', error);
            reject(error);
        }
    });
}


// Function to get links of an artifact
function getLinks(artifact) {
    return new Promise(async (resolve, reject) => {
        await RM.Data.getLinkedArtifacts(artifact, function(response) {
            if (response && response.code === RM.OperationResult.OPERATION_OK) {
                const links = response.data.artifactLinks;

                if (!links || links.length === 0) {
                    resolve([]); // No links found
                } else {
                    const filteredLinks = links.filter(link => {
                        const isModuleLink = link.art.moduleUri != null;
                        let isOutlink = false;
                        let isNotBacklink = false;

                        if (typeof link.linktype === 'object' && link.linktype.uri) {
                            isOutlink = link.linktype.direction === '_SUB';
                            isNotBacklink = link.linktype.direction !== '_OBJ';
                        } else if (typeof link.linktype === 'string') {
                            isOutlink = !link.linktype.includes(' ');
                            isNotBacklink = true; // Assume non-backlink if linktype is a string without direction
                        }

                        return isModuleLink && isOutlink && isNotBacklink; // Skip backlinks and outlinks
                    });
                    
                    resolve(filteredLinks);
                }
            } else {
                reject('Error fetching links. Please check the artifact URI or ensure the context is correct.');
            }
        });
    });
}

function getLinksDirection(artifact, linkDirection) {
    return new Promise(async (resolve, reject) => {
        await RM.Data.getLinkedArtifacts(artifact, function(response) {
            if (response && response.code === RM.OperationResult.OPERATION_OK) {
                const links = response.data.artifactLinks;

                if (!links || links.length === 0) {
                    resolve([]); // No links found
                } else {
                    // console.log('Links:', JSON.stringify(links));
                    const filteredLinks = links.filter(link => {
                        const isModuleLink = link.art.moduleUri != null;
                        let isOutlink = false;
                        let isInlink = false;

                        if (typeof link.linktype === 'object' && link.linktype.uri) {
                            isOutlink = link.linktype.direction === '_SUB';
                            isInlink = link.linktype.direction === '_OBJ';
                        } else if (typeof link.linktype === 'string') {
                            isOutlink = !link.linktype.includes(' ');
                            isInlink = link.linktype.includes(' ');
                        }

                        if (linkDirection === 'outlinks') {
                            return isModuleLink && isOutlink;
                        } else if (linkDirection === 'inlinks') {
                            return isModuleLink && isInlink;
                        } else {
                            return false; // Invalid linkDirection
                        }
                    });

                    // FlatMap to remove nested arrays
                    const flatLinks = filteredLinks.flatMap((item) =>
                        item.targets.map((target) => ({
                          art: { ...item.art },
                          linktype: typeof item.linktype === "object" ? { ...item.linktype } : item.linktype,
                          targets: [target] // Include only the current target in the targets array
                        }))
                      );
                    // Resolve the flattened links  
                    // console.log('Flattened Links:', JSON.stringify(flatLinks));
                    resolve(flatLinks);
                    // resolve(filteredLinks);
                }
            } else {
                reject('Error fetching links. Please check the artifact URI or ensure the context is correct.');
            }
        });
    });
}

// Function to toggle the Select All Links checkbox
function toggleSelectAllLinks() {
    const selectAll = document.getElementById("selectAllLinksCheckbox").checked;
    document.querySelectorAll('input[name="link"]').forEach(checkbox => {
        checkbox.checked = selectAll;
    });
}

// Function to update the Select All checkbox state
function updateSelectAllCheckboxState() {
    const allChecked = Array.from(document.querySelectorAll('input[name="link"]')).every(checkbox => checkbox.checked);
    document.getElementById("selectAllLinksCheckbox").checked = allChecked;
}

// Function to handle Read All Links button click
async function readWholeModuleButtonOnClick() {
    setContainerText("statusContainer", 'Loading...');
    toggleElementVisibility('stopRun', 'block');
    run = true;
    widgetHandler.availableLinks = [];

    // Clear out Tickbox form
    const linkContainer = document.getElementById("linkContainer");
    linkContainer.innerHTML = "";
    toggleElementVisibility('convertButtonContainer', 'none');
    toggleElementVisibility('reloadContainer', 'none');

    try {
        const response = await new Promise(async (resolve, reject) => {
            await RM.Client.getCurrentArtifact(function(response) {
                if (response.code === RM.OperationResult.OPERATION_OK) {
                    resolve(response);
                } else {
                    reject('Error retrieving current artifact. Open a module and try again.');
                    setContainerText("statusContainer", 'Ready.');
                }
            });
        });

        if (response.data.values[RM.Data.Attributes.FORMAT] === "Module") {
            const res = await new Promise(async (resolve, reject) => {
                await RM.Data.getContentsAttributes(response.data.ref, ['http://purl.org/dc/terms/identifier'], function(res) {
                    if (res.code === RM.OperationResult.OPERATION_OK) {
                        resolve(res);
                    } else {
                        reject('Error reading module contents.');
                    }
                });
            });
       
            // widgetHandler.selArtRef = [res.data[0]];
            let index = 0;
            for (const artifact of res.data ) {
                if (!run) {
                    setContainerText("statusContainer", 'Stopped.');
                    break;
                }
                index++;
                try {
                    const links = await getLinksDirection(artifact.ref, linkDir);
                    widgetHandler.availableLinks.push(...links);
                    setContainerText("statusContainer", `Reading Links...${index}`);
                } catch (error) {
                    console.error('Error fetching links:', error);
                }
            }
  
            const formLength = displayLinkOptions(widgetHandler.availableLinks);
            if (formLength !== 0 && run) {
                setContainerText("statusContainer", 'Select Link types to convert.');
                toggleElementVisibility('convertButtonContainer', 'block');
                toggleElementVisibility('stopRun', 'none');
            } else {
                if ( run ) {
                    setContainerText("statusContainer", `No ${linkDir} Module links found in the module.`);
                } else {
                toggleElementVisibility('linkContainer', 'none');
                toggleElementVisibility('convertButtonContainer', 'none');
                toggleElementVisibility('stopRun', 'none');
                const wholeModuleButtton = document.getElementById("readWholeModuleButtonOnClick");
                if (wholeModuleButtton) {
                    wholeModuleButtton.classList = "bx--btn bx--btn--primary bx--btn--md";
                    }
                }
            }

        } else {
            alert('You are not in a Module.');
        }

    } catch (error) {
        alert(error);
    }
}

// Function to handle the Read Links button click
async function readLinksButton_onclick() {
    setContainerText("statusContainer", 'Loading...');
    toggleElementVisibility('reloadContainer', 'none');
    widgetHandler.availableLinks = [];
    // Clear out Tickbox form
    const linkContainer = document.getElementById("linkContainer");
    linkContainer.innerHTML = "";
    toggleElementVisibility('convertButtonContainer', 'none');

    console.log('Selected artifacts:', widgetHandler.selArtRef.length);
    if (!widgetHandler.selArtRef || widgetHandler.selArtRef.length === 0) {
        setContainerText("statusContainer", 'No text artifact selected.');
        return;
    }
    try {
        await readLinks(widgetHandler.selArtRef);
    } catch (error) {
        console.error('Error reading links:', error);
        setContainerText("container", 'Error reading links. Please check the artifact URI or permissions.');
    }
    setContainerText("statusContainer", 'Select Link types to convert.');
    
    if (widgetHandler.availableLinks.length !== 0) {
        const formLength = displayLinkOptions(widgetHandler.availableLinks);
        setContainerText("statusContainer", 'Select Link types to convert.');
        toggleElementVisibility('convertButtonContainer', 'block');
    } else {
        setContainerText("statusContainer", 'No outgoing links found in selected items.');
    }
}
