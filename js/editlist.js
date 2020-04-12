
window.onload = ui_add_block_list;
global_hostname_table = {};

/**
 * Add html_code to editlist.html
 * call by ui_add_block_list()
 * @param {!string} hostname 
 * @param {!number} table_index 
 */
function ui_add_block_hostname(hostname, table_index) {
    
    var favico_src = "https://s2.googleusercontent.com/s2/favicons?domain_url=" + hostname;
    
    var table_row = `<tr>
                    <td><img class="img-thumbnail" src="${favico_src}"></td>
                    <td>${hostname}</td>
                    <td><button id="btn_${table_index}" type="button" class="btn btn-sm btn-danger">-</button></td>
                    </tr>`;
    
    var block_list_dom = document.getElementById("block_list_body");
    block_list_dom.innerHTML += table_row;
}

/**
 * call when page is loaded, or when user update blocklist
 */
function ui_add_block_list() {

    // reset html
    var block_list_dom = document.getElementById("block_list_body");
    block_list_dom.innerHTML = "";

    // reset global
    global_hostname_table = {};

    // get block_list
    chrome.storage.sync.get({'block_list':[]}, function(data){
        
        // foreach blocksite, add to page
        data.block_list.forEach(function(hostname, index){

            // add to hashtable (easier to del later)
            global_hostname_table[index] = hostname;
            ui_add_block_hostname(hostname, index);
        });
        console.log("host_name table:", global_hostname_table);
        add_btn_click();
    });
}

/**
 * call by ui_add_block_list()
 * add click_event to all button
 * somehow, add even in foreach doesnt work
 */
function add_btn_click() {
    Object.keys(global_hostname_table).forEach(function(index){
        document.getElementById("btn_"+index).addEventListener('click', function(){
            remove_from_block_list(index);
        });
    })
}

/**
 * call when user press button to remove blocksite
 * from block_list
 * @param {!number} table_index index of global_hostname_table
 */
function remove_from_block_list(table_index) {

    var site = global_hostname_table[table_index];
    console.log("remove:", site);
    ui_info_log(`remove ${site} from block_list`);

    // get block_list
    chrome.storage.sync.get({'block_list':[]}, function(data){

        // get site to remove
        var block_list = data.block_list;
        
        var index = block_list.indexOf(site);
        if (index != -1) block_list.splice(index, 1);

        // update block_list
        update_block_list(block_list);
    });
}

function update_block_list(block_list) {
    chrome.storage.sync.set({'block_list':block_list}, function(){
        console.log("new block_list:", block_list);

        // reset ui
        ui_add_block_list();
    });
}


/**
 * display msg in editlist.html
 * @param {string} msg 
 */
function ui_info_log(msg, status="success") {
    var info_dom = document.getElementById("info_field");

    if(status == "success") 
        info_dom.innerHTML = `<span class="badge badge-pill badge-success">${msg}</span>`;
    else
        info_dom.innerHTML = `<span class="badge badge-pill badge-danger">${msg}</span>`
}

document.getElementById("add_site_btn").onclick = add_site_to_block_list;
function add_site_to_block_list() {

    // get url
    var url_input = document.getElementById("url_input");
    var url = url_input.value;

    // verify url
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|'+ // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
        '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    var ok = pattern.test(url);

    // verify if that is chrome-extension
    if (url.indexOf("chrome://extensions") !== -1 || url.indexOf("chrome-extension") !== -1){
        ok = false;
    }

    // set info_log
    if(!ok) {  
        ui_info_log("Not a valid url.", "fail"); 
        return;
    }
    else {
        ui_info_log(`Added ${url} to block list`);
        url_input.value = "";
    }
        
    // add url to block_list
    hostname = get_host_url(url);
    chrome.storage.sync.get({'block_list':[]}, function(data){
        var block_list = data.block_list;
        block_list.push(hostname);
        
        // update blocklist, ui
        update_block_list(block_list);
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


