// Initialize GLOBAL variables
let selArt_ref = [];

RM.Event.subscribe(RM.Event.ARTIFACT_SELECTED, onSelection); // Use the RM library to deal with DNG

function onSelection(artifacts) 
{
    selArt_ref = artifacts;
}

function adjustHeight() //to recall each time we update the UI
{
    gadgets.window.adjustHeight();
}

function onBodyLoad() 
{
    loadLanguage(); //load the text according to the language file set in main.xml

    var ro = new ResizeObserver(entries => {
        adjustHeight();
    });

    ro.observe(document.getElementById('button1')); //adjustHeight() is also called when the user changes the width of the main button (i.e., the width of the widget)
    adjustHeight(); //we update the height since we updated the UI with loadLanguage();
}

function show_instructions() //standard code for the show instruction button
{
    let instructions_div = document.getElementById('instructions_div');
    let instructions_button = document.getElementById('instructions_button');

    if (instructions_div.style.display == 'none') //if the instructions are hidden, show them
    { 
        instructions_div.style.display = "block";
        instructions_button.innerHTML = getLangString('cs001');
    }
    else //if the instructions are visbile, hide them
    {
        instructions_div.style.display = "none";
        instructions_button.innerHTML = getLangString('cs002');
    }

    adjustHeight();
}

function show_settings() //standard code for the show settings button
{
    let settings_div = document.getElementById('settings_div');
    let settings_button = document.getElementById('settings_button');

    if (settings_div.style.display == 'none') //if the settings meno is hidden, show it
    { 
        settings_div.style.display = "block";
        settings_button.innerHTML = getLangString('cs003');
    }
    else //if the settings menu is visbile, hide it
    { 
        settings_div.style.display = "none";
        settings_button.innerHTML = getLangString('cs004');
    }

    adjustHeight();
}

function mainButton_onclick() 
{    
    document.getElementById("str010").style.display = "block";
    if (selArt_ref == undefined || selArt_ref.length == 0) //check if there are no selected artifacts
    {
        setContainerText("container", 'No text artifact selected.'); 
        return;
    }

    RM.Data.getAttributes(selArt_ref, function(res) //We are also using RM here...
    {
        if (res.code === RM.OperationResult.OPERATION_OK && res.data.length > 0) //check if the request was executed successfully
        {
            title_array = []
            for (let i = 0; i <res.data.length; i++)
                if (res.data[i].values['http://www.ibm.com/xmlns/rdm/types/ArtifactFormat'] == 'Text') // do not consider non-text artificats
                {
                    let title = res.data[i].values["http://purl.org/dc/terms/title"]; //get artifact title (for more properties print res.data[i].values)
                    
                    if(title != null)
                        title_array.push(title);
                }

            printArray(title_array);
        }
        else
            setContainerText("container", 'No text artifact selected.');
    });
}

function setContainerText(containerId, string)
{
    document.getElementById(containerId).innerHTML = string;
    adjustHeight();
}

function printArray(array)
{
    let containerHTML = '<ol>';
    for (let i = 0; i < array.length; i++)
        containerHTML += "<li>" + array[i] + "</li>";

    setContainerText("container", containerHTML + "</ol>");
}