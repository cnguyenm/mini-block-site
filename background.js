
// chrome.runtime is for chrome_extension file to 
// communicate to each other
// ex: chrome.runtime.sendMessage, onMessage.listerner, getURL

chrome.webRequest["onBeforeRequest"].addListener(
    function(data){

        // check if site is blocked
        process_url(data.url);   
    },

    {urls: ["<all_urls>"]},
    //["blocking"]
);

// set storage
chrome.runtime.onInstalled.addListener(function(){

    chrome.storage.sync.set(
        {'block_list' : ['a1.com', 'a2.com', 'a3.net']}, 
        function() {
		    console.log("Init empty block list");
        }
    );
});

/**
 * call by webRequest.onBeforeRequest 
 * verify if url is blocked
 * @param {string} url destination user is trying to go
 */
function process_url(url) {

    // check if that is chrome://extension
    if (url.indexOf("chrome://extensions") !== -1 || url.indexOf("chrome-extension") !== -1){
        return;
    }

    var hostname = get_host_url(url);

    // get block_list from storage api
    chrome.storage.sync.get({'block_list':[]}, function(data){
        var block_list = data.block_list;

        // check if site is blocked
        if (block_list.includes(hostname)) {
            var block_url = chrome.runtime.getURL("block.html");
            
            // redirect user to extension:page
            // if outside, use executeScript
            chrome.tabs.query({active:true, lastFocusedWindow:true}, function(tabs){
                chrome.tabs.update(tabs[0].id, {url:block_url});
            });
        }
        
    });
}


/**
 * get domain_name from url
 * ex: url=https://developer.chrome.com/extensions/webRequest
 * ex: url=www.youtube.com/watch?v=ClkQA2Lb_iE
 * ex: url=http://localhost:4200/watch?v=ClkQA2Lb_iE
 * ex: url=example.com?param=value
 *
 * @param {!string} url url as in tab
 * @return {!string} domain ex: developer.chrome.com
 */
function get_host_url(url) {

    var hostname;

    // find, remove protocol, get hostname
    if (url.indexOf("//") > -1) {
        hostname = url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
    }

    // remove port number
    hostname = hostname.split(':')[0];

    // remove '?'
    hostname = hostname.split('?')[0];

    return hostname
}
