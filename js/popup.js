// Initialize background page
// so console.log can go here
chrome.runtime.getBackgroundPage(function(backgroundPage) {
    console = backgroundPage.console;
})

// this will not goto background page
console.log("popup");
var global_cur_hostname; 
var global_cur_url;

// get url of cur_site
chrome.tabs.query(
    {'active':true, 'lastFocusedWindow':true},

    function(tabs){
        let url = tabs[0].url;
        hostname = get_host_url(url);
        
        // set img, url in popup.html
        set_info(url);

        // set global
        global_cur_hostname = hostname;
        global_cur_url = url;
    }
);

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

/** 
 * set favico in popup.html
 * set hostname
 * @param {!string } hostname host_name as parsed in get_host_url
 */
function set_info(url) {

    // use google_api
    // set image in popup.html
    var hostname = get_host_url(url);
    var img_src = "https://s2.googleusercontent.com/s2/favicons?domain_url=" + hostname;
    var img_dom = document.getElementById("favico_img");
    img_dom.src = img_src;

    // set hostname
    var hostname_dom = document.getElementById("host_name");
    hostname_dom.innerHTML = hostname;

    // set state of block_btn
    if (url.indexOf("chrome://extensions") !== -1 || url.indexOf("chrome-extension") !== -1){
        var block_btn = document.getElementById("block_btn");
        block_btn.disabled = true;
        block_btn.innerHTML = "Don't block this site ^^!"
    }
}

// block button
document.getElementById("block_btn").onclick = block_current_site;
function block_current_site() {

    // get blocklist from storage.block_list
    chrome.storage.sync.get({'block_list' : []}, function(data){
        
        //console.log(data.block_list);
        var block_list = data.block_list;
        block_list.push(global_cur_hostname);
        update_block_list(block_list);
    });
}

/**
 * call after get blocklist from storage api
 * @param {!Array} block_list 
 */
function update_block_list(block_list) {

    // set in storage.block_list
    chrome.storage.sync.set({'block_list' : block_list}, function(){
        console.log("block_list updated");
        
        // redirect user out of this page
        var block_url = chrome.runtime.getURL("block.html");
        
        chrome.tabs.query({active:true, lastFocusedWindow:true}, function(tabs){
            chrome.tabs.update(tabs[0].id, {url:block_url});
        });
    });
}

// edit button
document.getElementById("edit_list_btn").onclick = redirect_edit_block_site;
function redirect_edit_block_site() {
    chrome.tabs.create({url : chrome.runtime.getURL("editlist.html")})
}


