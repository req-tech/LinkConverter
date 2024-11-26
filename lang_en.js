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
      "text": "This widget allows you to read and convert links from selected artifacts or an entire module. To begin, click the:"
    },
    {
      "id": "str005a",
      "text": "Open the module. This widget works only in the module view."
    },
    {
      "id": "str005b",
      "text": "Whole Module- button to load links from the entire module. "
    },
    {
      "id": "str005c",
      "text": "Selected artifacts only- button to load links from the selected items."
    },
    {
      "id": "str005d",
      "text": "Once the links are loaded, select the link types you wish to convert by checking the corresponding checkboxes."
    },
    {
      "id": "str005e",
      "text": "Finally, click the Convert Links button to initiate the conversion process."
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
  "codeStrings":
      {
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


