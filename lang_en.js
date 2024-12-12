lang_json = `{
  "strings": [
    {
      "id": "str001",
      "text": "Show instructions"
    },
    {
      "id": "str002",
      "text": "Change settings"
    },
    {
      "id": "str003",
      "text": "How to use this widget?"
    },
    {
      "id": "str004a",
      "text": "1. Choose link direction to detect from Radio Button Outgoing/Incoming"
    },
    {
      "id": "str004b",
      "text": "2. Choose either selected artifacts in a module or the whole module"
    },
    {
      "id": "str005a",
      "text": "3. When the links are found, choose what links you would like to apply widget's functions on"
    },
    {
      "id": "str006a",
      "text": "4. Choose between 'Add base links' or 'Convert to base links'"
    },
    {
      "id": "str007a",
      "text": "5. Refresh the page"
    },
    {
      "id": "str008",
      "text": "Settings: "
    },
    {
      "id": "str009",
      "text": "This is a settings menu prototype. If you need a settings menu, you can use it. Otherwise, you should remove it."
    },
    {
      "id": "str010",
      "text": "Title(s):"
    },
    {
      "id": "str011",
      "text": "Print Text Artifacts Titles"
    }
  ],
  "codeStrings": {
    "cs001": "Hide instructions",
    "cs002": "Show instructions",
    "cs003": "Hide settings",
    "cs004": "Change settings"
  }
}`;

lang = JSON.parse(lang_json);

function loadLanguage()
{
    for (i = 0; i < lang.strings.length; i++) 
    {
        span = document.getElementById(lang.strings[i].id);
        if(span != null)
            span.textContent = lang.strings[i].text;
    }
}

function getLangString(id)
{
    return lang.codeStrings[id];
}


