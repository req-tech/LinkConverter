// Initialize GLOBAL variables
const widgetHandler = {
    selArtRef: [],
    availableLinks: [],
    targetContext: "base", // default context
    selectAllLinks: false,
};

// Subscribe to artifact selection event
RM.Event.subscribe(RM.Event.ARTIFACT_SELECTED, onSelection);

function onSelection(artifacts) {
    widgetHandler.selArtRef = artifacts || [];
}

function adjustHeight() {
    gadgets.window.adjustHeight();
}

function onBodyLoad() {
    loadLanguage(); // Load the text according to the language file set in main.xml
    adjustHeight();
}

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

function readLinksButton_onclick() {
    // document.getElementById("str010").style.display = "block";
    setContainerText("statusContainer", 'Loading...');
    if (!widgetHandler.selArtRef || widgetHandler.selArtRef.length === 0) {
        setContainerText("statusContainer", 'No text artifact selected.');
        return;
    }
    readLinks(widgetHandler.selArtRef);
    setContainerText("statusContainer", 'Select Link types to convert.');
}

async function readLinks(artifacts) {
    widgetHandler.availableLinks = [];
    for (const artifact of artifacts) {
        if (!artifact.moduleUri) {
            console.error('Module URI not found for artifact:', artifact);
            setContainerText("container", 'Module URI not found for selected artifact.');
            continue;
        }
        try {
            const links = await getLinks(artifact);
            widgetHandler.availableLinks.push(...links);
        } catch (error) {
            console.error('Error fetching links:', error);
            setContainerText("container", 'Error fetching links. Please check the artifact URI or permissions.');
        }
    }
    displayLinkOptions(widgetHandler.availableLinks);
}

function displayLinkOptions(links) {
    const linkContainer = document.getElementById("linkContainer"); // Changed to update only the link part of the container
    const form = document.createElement("form");
    form.id = "linkOptionsForm";

    links.forEach((link, index) => {
        const linkTypeString = typeof link.linktype === 'object' ? link.linktype.uri.split('/').pop() : link.linktype;
        const lastPart = link.art.uri.split('/').pop();
        if (!lastPart.startsWith('TX')) {
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.id = `link_${index}`;
            checkbox.name = "link";
            checkbox.value = index;
            checkbox.classList.add("link-checkbox");
            checkbox.addEventListener("click", (e) => {
                e.stopPropagation();
                updateSelectAllCheckboxState();
            });

            const label = document.createElement("label");
            label.htmlFor = `link_${index}`;
            label.innerHTML = ` ${linkTypeString}`;
            label.style.fontSize = "12px";

            const lineBreak = document.createElement("br");

            form.appendChild(checkbox);
            form.appendChild(label);
            form.appendChild(lineBreak);
        }
    });

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

    linkContainer.innerHTML = ""; // Clear only the link part of the container
    linkContainer.appendChild(form);

    adjustHeight();
}

async function convertLinksButtonOnClick() {
    setContainerText("statusContainer", 'Converting links...');
    const selectedLinks = getSelectedLinks();
    if (selectedLinks.length === 0) {
        setContainerText("container", 'No links selected for conversion.');
        return;
    }
    console.log('Selected links:', JSON.stringify(selectedLinks));

    let successfulConversions = 0;

    // Run link updates in sequence to avoid race conditions
    for (const linkIndex of selectedLinks) {
        const link = widgetHandler.availableLinks[linkIndex];
        const { art: { uri: existingStartUri, moduleUri }, targets, linktype } = link;

        const existingTargetUri = targets[0]?.uri;
        const targetModuleUri = targets[0]?.moduleUri;
        console.log('targetModuleURI:', targetModuleUri);
        console.log('startModuleUri:', moduleUri);
        console.log('existingStartUri:', existingStartUri);
        console.log('existingTargetUri:', existingTargetUri);
        const { componentUri, format } = widgetHandler.selArtRef[0]; // Assuming all selected artifacts are from the same Project

        // Check if existingTargetUri is equal to existingStartUri
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
            const targetBoundArtifactData = await getModuleBinding(targetModuleUri);
            const baseTargetUri = getBoundArtifactUri(existingTargetUri, targetBoundArtifactData);
            const baseStartRef = new RM.ArtifactRef(baseStartUri, componentUri, null, format);
            const baseTargetRef = new RM.ArtifactRef(baseTargetUri, componentUri, null, format);
            await updateLinkContext(baseStartRef, linktype, baseTargetRef);
        } catch (error) {
            console.error('Error creating base links or fetching module binding for link target:', error);
            continue;
        }
        successfulConversions++;
    }

    if (successfulConversions !== selectedLinks.length) {
        setContainerText("statusContainer", `Converted ${successfulConversions} out of ${selectedLinks.length} links successfully. <br> Check if Base links already existed.`);
    } else {
        setContainerText("statusContainer", `Converted ${successfulConversions} out of ${selectedLinks.length} links successfully.`);
    }
}

function getSelectedLinks() {
    const checkboxes = Array.from(document.querySelectorAll('#linkOptionsForm input[name="link"]:checked'));
    return checkboxes.map(checkbox => parseInt(checkbox.value));
}

function setContainerText(containerId, string) {
    const container = document.getElementById(containerId);
    container.innerHTML = string;
    adjustHeight();
}

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
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

function getBoundArtifactUri(artifactUri, moduleBindings) {
    const binding = moduleBindings.find(item => item.uri === artifactUri);
    if (binding && binding.boundArtifact) {
        return binding.boundArtifact;
    } else {
        throw new Error('No bound artifact found for the given artifact URI.');
    }
}

function getLinks(artifact) {
    return new Promise((resolve, reject) => {
        RM.Data.getLinkedArtifacts(artifact, function(response) {
            if (response && response.code === RM.OperationResult.OPERATION_OK) {
                resolve(response.data.artifactLinks);
            } else {
                reject('Error fetching links. Please check the artifact URI or ensure the context is correct.');
            }
        });
    });
}

async function updateLinkContext(start, linkType, target) {
    return new Promise((resolve, reject) => {
        RM.Data.createLink(start, linkType, target, function(response) {
            if (response.code !== RM.OperationResult.OPERATION_OK) {
                console.error('Error creating link:', response);
                reject(response);
            } else {
                console.log('Successfully created link between:', start, 'and', target);
                resolve();
            }
        });
    });
}

function toggleSelectAllLinks() {
    const selectAll = document.getElementById("selectAllLinksCheckbox").checked;
    document.querySelectorAll('input[name="link"]').forEach(checkbox => {
        checkbox.checked = selectAll;
    });
}

function updateSelectAllCheckboxState() {
    const allChecked = Array.from(document.querySelectorAll('input[name="link"]')).every(checkbox => checkbox.checked);
    document.getElementById("selectAllLinksCheckbox").checked = allChecked;
}
