chrome.browserAction.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, {"type": "click"}, (result) => {
        if(result["enabled"])
        {
            chrome.browserAction.setIcon({path: "assets/enabled.png", tabId: tab.id});
        }else{
            chrome.browserAction.setIcon({path: "assets/disabled.png", tabId: tab.id});
        }
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if(message["type"] != "updated")
    {
        return;
    }
    if(message["enabled"])
    {
        chrome.browserAction.setIcon({path: "assets/enabled.png", tabId: sender.tab.id});
    }else{
        chrome.browserAction.setIcon({path: "assets/disabled.png", tabId: sender.tab.id});
    }
});
